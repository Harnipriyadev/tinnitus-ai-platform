"""Train the Aurisense AI tinnitus severity screening model.

The source CSV contains a synthetic treatment ``outcome`` column whose values
are not learnable from the assessment features. This project uses the model
for screening severity, so the training target is a transparent composite risk
stage derived from the assessment scores. The resulting metric measures how
consistently the model reproduces that screening rubric; it is not clinical
diagnostic accuracy.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.tree import DecisionTreeClassifier


BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "synthetic_tinnitus_10000.csv"
MODEL_PATH = BASE_DIR / "tinnitus_model.pkl"
ENCODERS_PATH = BASE_DIR / "encoders.pkl"
METRICS_PATH = BASE_DIR / "model_metrics.json"
RANDOM_STATE = 42

NUMERIC_FEATURES = [
    "age",
    "frequency_hz",
    "loudness_db",
    "thi_score",
    "tfi_score",
    "hads_anxiety",
    "hads_depression",
    "sleep_score",
    "clinical_risk_score",
]

CATEGORICAL_FEATURES = [
    "gender",
    "tinnitus_type",
    "affected_ear",
    "hearing_loss",
    "treatment",
]

FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES
STAGE_ORDER = ["Mild", "Moderate", "Severe", "Critical"]


def calculate_clinical_risk_score(frame: pd.DataFrame) -> pd.Series:
    """Create a 0-100 screening score from the submitted assessment fields."""

    hearing_burden = (
        frame["hearing_loss"]
        .fillna("None")
        .astype(str)
        .str.strip()
        .str.lower()
        .map({"none": 0.0, "mild": 25.0, "moderate": 55.0, "severe": 85.0})
        .fillna(0.0)
    )
    mental_health_burden = (
        (frame["hads_anxiety"] + frame["hads_depression"]) / 42.0 * 100.0
    )
    sleep_burden = (10.0 - frame["sleep_score"]) * 10.0
    loudness_burden = (frame["loudness_db"] - 5.0) / 35.0 * 100.0

    score = (
        0.35 * frame["thi_score"]
        + 0.35 * frame["tfi_score"]
        + 0.10 * mental_health_burden
        + 0.10 * sleep_burden
        + 0.05 * loudness_burden
        + 0.05 * hearing_burden
    )
    return score.clip(0.0, 100.0)


def risk_score_to_stage(scores: pd.Series) -> pd.Series:
    return pd.Series(
        np.select(
            [scores < 25.0, scores < 50.0, scores < 75.0],
            STAGE_ORDER[:3],
            default=STAGE_ORDER[3],
        ),
        index=scores.index,
        name="severity_stage",
    )


def build_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("numeric", SimpleImputer(strategy="median"), NUMERIC_FEATURES),
            (
                "categorical",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("one_hot", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                CATEGORICAL_FEATURES,
            ),
        ]
    )


def build_candidates() -> dict[str, object]:
    return {
        "DecisionTree": DecisionTreeClassifier(
            max_depth=6,
            class_weight="balanced",
            random_state=RANDOM_STATE,
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=250,
            class_weight="balanced_subsample",
            n_jobs=-1,
            random_state=RANDOM_STATE,
        ),
        "ExtraTrees": ExtraTreesClassifier(
            n_estimators=250,
            class_weight="balanced",
            n_jobs=-1,
            random_state=RANDOM_STATE,
        ),
    }


def main() -> None:
    dataframe = pd.read_csv(DATASET_PATH)
    required_columns = set(FEATURES) - {"clinical_risk_score"}
    missing_columns = sorted(required_columns - set(dataframe.columns))
    if missing_columns:
        raise ValueError(f"Dataset is missing required columns: {missing_columns}")

    dataframe["clinical_risk_score"] = calculate_clinical_risk_score(dataframe)
    target = risk_score_to_stage(dataframe["clinical_risk_score"])
    features = dataframe[FEATURES].copy()

    x_train, x_test, y_train, y_test = train_test_split(
        features,
        target,
        test_size=0.20,
        random_state=RANDOM_STATE,
        stratify=target,
    )
    cross_validation = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=RANDOM_STATE,
    )
    comparison: dict[str, dict[str, float]] = {}
    fitted_candidates: dict[str, Pipeline] = {}

    for name, estimator in build_candidates().items():
        pipeline = Pipeline(
            steps=[
                ("preprocessor", build_preprocessor()),
                ("classifier", estimator),
            ]
        )
        cv_result = cross_validate(
            pipeline,
            x_train,
            y_train,
            cv=cross_validation,
            scoring={"accuracy": "accuracy", "macro_f1": "f1_macro"},
            n_jobs=1,
        )
        pipeline.fit(x_train, y_train)
        test_predictions = pipeline.predict(x_test)
        comparison[name] = {
            "cv_accuracy_mean": float(cv_result["test_accuracy"].mean()),
            "cv_accuracy_std": float(cv_result["test_accuracy"].std()),
            "cv_macro_f1_mean": float(cv_result["test_macro_f1"].mean()),
            "test_accuracy": float(accuracy_score(y_test, test_predictions)),
            "test_macro_f1": float(f1_score(y_test, test_predictions, average="macro")),
        }
        fitted_candidates[name] = pipeline

    best_name = max(
        comparison,
        key=lambda name: (
            comparison[name]["cv_macro_f1_mean"],
            comparison[name]["cv_accuracy_mean"],
        ),
    )
    best_pipeline = fitted_candidates[best_name]
    final_predictions = best_pipeline.predict(x_test)
    report = classification_report(
        y_test,
        final_predictions,
        labels=STAGE_ORDER,
        output_dict=True,
        zero_division=0,
    )
    matrix = confusion_matrix(y_test, final_predictions, labels=STAGE_ORDER)

    metrics = {
        "model_version": "2.0.0",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset_rows": int(len(dataframe)),
        "training_rows": int(len(x_train)),
        "test_rows": int(len(x_test)),
        "selected_model": best_name,
        "comparison": comparison,
        "test_classification_report": report,
        "confusion_matrix_labels": STAGE_ORDER,
        "confusion_matrix": matrix.tolist(),
        "important_note": (
            "Metrics measure agreement with the documented synthetic screening "
            "rubric, not clinical diagnostic accuracy."
        ),
    }
    model_bundle = {
        "pipeline": best_pipeline,
        "model_version": metrics["model_version"],
        "features": FEATURES,
        "stage_order": STAGE_ORDER,
        "metrics": {
            "test_accuracy": comparison[best_name]["test_accuracy"],
            "test_macro_f1": comparison[best_name]["test_macro_f1"],
        },
        "sklearn_version": sklearn.__version__,
    }
    metadata = {
        "categorical_features": CATEGORICAL_FEATURES,
        "known_values": {
            column: sorted(dataframe[column].dropna().astype(str).unique().tolist())
            for column in CATEGORICAL_FEATURES
        },
        "stage_order": STAGE_ORDER,
    }

    joblib.dump(model_bundle, MODEL_PATH, compress=3)
    joblib.dump(metadata, ENCODERS_PATH, compress=3)
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    print("Aurisense AI model trained successfully")
    print(f"Selected model: {best_name}")
    print(f"Test accuracy: {comparison[best_name]['test_accuracy'] * 100:.2f}%")
    print(f"Test macro-F1: {comparison[best_name]['test_macro_f1'] * 100:.2f}%")
    print(f"Saved model: {MODEL_PATH}")
    print(f"Saved metrics: {METRICS_PATH}")


if __name__ == "__main__":
    main()
