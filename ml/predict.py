"""Generate an Aurisense AI screening result from one JSON assessment."""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path
from typing import Any

import joblib
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "tinnitus_model.pkl"

NUMERIC_DEFAULTS = {
    "age": 45.0,
    "frequency_hz": 4000.0,
    "loudness_db": 20.0,
    "thi_score": None,
    "tfi_score": None,
    "hads_anxiety": None,
    "hads_depression": None,
    "sleep_score": None,
}

CATEGORICAL_DEFAULTS = {
    "gender": "Unknown",
    "tinnitus_type": "Subjective",
    "affected_ear": "Both",
    "hearing_loss": "None",
    "treatment": "Sound Therapy",
}

RANGES = {
    "age": (18.0, 100.0),
    "frequency_hz": (20.0, 20000.0),
    "loudness_db": (0.0, 120.0),
    "thi_score": (0.0, 100.0),
    "tfi_score": (0.0, 100.0),
    "hads_anxiety": (0.0, 21.0),
    "hads_depression": (0.0, 21.0),
    "sleep_score": (0.0, 10.0),
}


def parse_number(data: dict[str, Any], field: str, default: float | None) -> float:
    raw_value = data.get(field, default)
    if raw_value is None or isinstance(raw_value, bool):
        raise ValueError(f"{field} is required")

    try:
        value = float(raw_value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"{field} must be a number") from error

    if not math.isfinite(value):
        raise ValueError(f"{field} must be finite")

    minimum, maximum = RANGES[field]
    if value < minimum or value > maximum:
        raise ValueError(f"{field} must be between {minimum:g} and {maximum:g}")
    return value


def calculate_risk_score(values: dict[str, Any]) -> float:
    hearing_burden = {
        "none": 0.0,
        "mild": 25.0,
        "moderate": 55.0,
        "severe": 85.0,
    }.get(str(values["hearing_loss"]).strip().lower(), 0.0)

    mental_health_burden = (
        (values["hads_anxiety"] + values["hads_depression"]) / 42.0 * 100.0
    )
    sleep_burden = (10.0 - values["sleep_score"]) * 10.0
    loudness_burden = (values["loudness_db"] - 5.0) / 35.0 * 100.0
    score = (
        0.35 * values["thi_score"]
        + 0.35 * values["tfi_score"]
        + 0.10 * mental_health_burden
        + 0.10 * sleep_burden
        + 0.05 * loudness_burden
        + 0.05 * hearing_burden
    )
    return round(min(100.0, max(0.0, score)), 2)


def confidence_from_score(score: float, missing_optional_fields: int) -> float:
    distance_to_boundary = min(abs(score - boundary) for boundary in (25.0, 50.0, 75.0))
    confidence = 0.65 + min(distance_to_boundary, 20.0) / 20.0 * 0.27
    confidence -= min(missing_optional_fields * 0.02, 0.10)
    return round(min(0.92, max(0.55, confidence)), 2)


def stage_content(stage: str) -> dict[str, Any]:
    content = {
        "Mild": {
            "risk": "Low",
            "doctor": ["Audiologist"],
            "treatments": ["Sound Therapy", "Relaxation Exercises", "Sleep Improvement"],
            "clinical_interpretation": "The screening scores indicate a mild current impact from tinnitus.",
            "recovery_plan": [
                "Protect hearing in loud environments",
                "Improve sleep habits",
                "Reduce excessive caffeine if it worsens symptoms",
                "Repeat the assessment if symptoms change",
            ],
        },
        "Moderate": {
            "risk": "Medium",
            "doctor": ["ENT Specialist", "Audiologist"],
            "treatments": ["CBT", "Sound Therapy", "Hearing Evaluation"],
            "clinical_interpretation": "The screening scores suggest tinnitus may be affecting sleep, concentration, or wellbeing.",
            "recovery_plan": [
                "Arrange a non-emergency ENT or audiology consultation",
                "Discuss sound therapy with a qualified professional",
                "Practise stress-management exercises",
                "Track sleep and symptom changes",
            ],
        },
        "Severe": {
            "risk": "High",
            "doctor": ["ENT Specialist", "Audiologist"],
            "treatments": ["CBT", "Hearing Support", "Personalised Sound Therapy"],
            "clinical_interpretation": "The screening scores indicate a substantial impact on quality of life that needs professional assessment.",
            "recovery_plan": [
                "Book an ENT and audiology assessment promptly",
                "Discuss mental-health and sleep support",
                "Avoid unprotected loud-noise exposure",
                "Plan regular clinical follow-up",
            ],
        },
        "Critical": {
            "risk": "Critical",
            "doctor": ["ENT Specialist", "Audiologist", "Mental Health Professional"],
            "treatments": ["Specialist Tinnitus Care", "CBT", "Individualised Hearing Support"],
            "clinical_interpretation": "The screening scores indicate a very high symptom burden requiring timely professional assessment.",
            "recovery_plan": [
                "Seek a prompt specialist assessment",
                "Request support for distress, anxiety, depression, or sleep problems",
                "Follow only clinician-approved treatment advice",
                "Seek urgent medical care for sudden hearing loss or new neurological symptoms",
            ],
        },
    }
    return content[stage]


def predict(input_data: dict[str, Any]) -> dict[str, Any]:
    if not MODEL_PATH.exists():
        raise FileNotFoundError("Model file is missing. Run train_model.py first.")

    values: dict[str, Any] = {}
    for field, default in NUMERIC_DEFAULTS.items():
        values[field] = parse_number(input_data, field, default)

    missing_optional_fields = 0
    for field, default in CATEGORICAL_DEFAULTS.items():
        raw_value = input_data.get(field)
        if raw_value is None or not str(raw_value).strip():
            values[field] = default
            missing_optional_fields += 1
        else:
            values[field] = str(raw_value).strip()

    values["clinical_risk_score"] = calculate_risk_score(values)
    bundle = joblib.load(MODEL_PATH)
    pipeline = bundle["pipeline"]
    model_input = pd.DataFrame([values], columns=bundle["features"])
    stage = str(pipeline.predict(model_input)[0])
    content = stage_content(stage)
    confidence_value = confidence_from_score(
        values["clinical_risk_score"], missing_optional_fields
    )

    anxiety = values["hads_anxiety"]
    depression = values["hads_depression"]
    if anxiety >= 15 and depression >= 15:
        mental_health = "High anxiety and depression screening scores"
    elif anxiety >= 11 and depression >= 11:
        mental_health = "Elevated anxiety and depression screening scores"
    elif anxiety >= 11:
        mental_health = "Elevated anxiety screening score"
    elif depression >= 11:
        mental_health = "Elevated depression screening score"
    else:
        mental_health = "No elevated HADS screening score detected"

    sleep = values["sleep_score"]
    if sleep < 5:
        sleep_status = "Poor sleep quality"
    elif sleep < 8:
        sleep_status = "Average sleep quality"
    else:
        sleep_status = "Good sleep quality"

    tips = [
        "Use hearing protection in loud environments",
        "Maintain regular sleep habits",
        "Practise stress-management techniques",
        "Stay physically active when medically appropriate",
        "Track triggers and symptom changes",
    ]
    summary = (
        f"The screening model classified the current tinnitus impact as {stage} "
        f"with a {content['risk']} risk level. {mental_health}. "
        f"Sleep assessment: {sleep_status}. This result supports screening and "
        "care planning; it does not provide a medical diagnosis."
    )

    return {
        "stage": stage,
        "risk": content["risk"],
        "confidence": f"{round(confidence_value * 100)}%",
        "confidence_score": confidence_value,
        "clinical_risk_score": values["clinical_risk_score"],
        "model_version": bundle.get("model_version", "unknown"),
        "doctor": content["doctor"],
        "treatments": content["treatments"],
        "tips": tips,
        "mental_health": mental_health,
        "sleep_status": sleep_status,
        "clinical_interpretation": content["clinical_interpretation"],
        "recovery_plan": content["recovery_plan"],
        "summary": summary,
        "disclaimer": "Screening support only. This is not a diagnosis or a substitute for professional medical advice.",
    }


def main() -> None:
    if len(sys.argv) != 2:
        raise ValueError("Usage: python predict.py '<assessment-json>'")
    input_data = json.loads(sys.argv[1])
    if not isinstance(input_data, dict):
        raise ValueError("Assessment input must be a JSON object")
    print(json.dumps(predict(input_data), ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"success": False, "error": str(error)}))
        sys.exit(1)
