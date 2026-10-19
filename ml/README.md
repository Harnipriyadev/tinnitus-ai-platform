# Aurisense AI ML module

This module classifies current tinnitus **screening severity** as Mild,
Moderate, Severe, or Critical.

It does not predict whether a patient will recover. The original synthetic
`outcome` column is approximately random with respect to the available input
features, so reporting high recovery-outcome accuracy would be misleading.

## Train the model

Open PowerShell inside the `ml` folder and run:

```powershell
python -m pip install -r requirements.txt
python train_model.py
```

Training creates:

- `tinnitus_model.pkl` — preprocessing and trained classifier
- `encoders.pkl` — accepted categorical-value metadata
- `model_metrics.json` — comparison, test metrics, and confusion matrix

## Test one prediction

```powershell
python predict.py '{"age":35,"gender":"Female","tinnitus_type":"Subjective","affected_ear":"Both","frequency_hz":4000,"loudness_db":25,"hearing_loss":"Mild","thi_score":42,"tfi_score":48,"hads_anxiety":8,"hads_depression":6,"sleep_score":6,"treatment":"Sound Therapy"}'
```

The output keeps the existing keys used by the Node.js backend, including
`stage`, `risk`, `confidence`, `doctor`, `treatments`, `tips`,
`clinical_interpretation`, `recovery_plan`, and `summary`.

## Correct way to describe the metric

Say: **"The model's test accuracy measures agreement with our documented
screening-risk rubric on held-out synthetic records."**

Do not say this percentage is clinical diagnostic accuracy. Clinical
validation requires labelled real-patient data, ethics approval, specialist
review, and external validation.
