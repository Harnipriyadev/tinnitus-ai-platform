import sys
import json


# Read JSON input from Node.js
input_data = json.loads(sys.argv[1])




# Get scores
thi = int(input_data["thi_score"])
tfi = int(input_data["tfi_score"])
anxiety = int(input_data["hads_anxiety"])
depression = int(input_data["hads_depression"])
sleep = int(input_data["sleep_score"])

# Calculate severity
avg_score = (thi + tfi) / 2

# Determine stage
if avg_score < 25:

    stage = "Mild"
    risk = "Low"
    confidence = "95%"

    doctor = [
        "Audiologist"
    ]

    treatments = [
        "Sound Therapy",
        "Relaxation Exercises",
        "Sleep Improvement"
    ]

    clinical_interpretation = (
        "Symptoms indicate mild tinnitus with minimal impact on daily life."
    )

    recovery_plan = [
        "Avoid loud environments",
        "Improve sleep habits",
        "Reduce caffeine intake",
        "Monitor symptoms monthly"
    ]

elif avg_score < 50:

    stage = "Moderate"
    risk = "Medium"
    confidence = "88%"

    doctor = [
        "ENT Specialist",
        "Audiologist"
    ]

    treatments = [
        "CBT",
        "Sound Therapy",
        "Hearing Evaluation"
    ]

    clinical_interpretation = (
        "Tinnitus symptoms may affect concentration, sleep and emotional wellbeing."
    )

    recovery_plan = [
        "Schedule ENT consultation",
        "Begin sound therapy",
        "Practice meditation",
        "Improve sleep quality"
    ]

elif avg_score < 75:

    stage = "Severe"
    risk = "High"
    confidence = "84%"

    doctor = [
        "ENT Specialist",
        "Audiologist"
    ]

    treatments = [
        "CBT",
        "Hearing Aid",
        "Customized Sound Therapy"
    ]

    clinical_interpretation = (
        "Tinnitus is significantly affecting quality of life and requires professional management."
    )

    recovery_plan = [
        "Immediate ENT consultation",
        "Audiology assessment",
        "Stress reduction therapy",
        "Regular follow-up"
    ]

else:

    stage = "Critical"
    risk = "Critical"
    confidence = "80%"

    doctor = [
        "ENT Specialist",
        "Psychologist"
    ]

    treatments = [
        "Tinnitus Retraining Therapy",
        "Advanced CBT",
        "Anxiety Management"
    ]

    clinical_interpretation = (
        "Severe tinnitus symptoms require immediate specialist attention."
    )

    recovery_plan = [
        "Urgent ENT consultation",
        "Mental health support",
        "Advanced tinnitus therapy",
        "Continuous monitoring"
    ]

# Lifestyle recommendations
tips = [
    "Avoid loud environments",
    "Reduce caffeine intake",
    "Maintain healthy sleep habits",
    "Practice stress management",
    "Stay physically active",
    "Stay hydrated"
]

# Mental health analysis
mental_health = "Normal"

if anxiety > 10:
    mental_health = "Elevated Anxiety Detected"

if depression > 10:
    mental_health = "Depression Risk Detected"

# Sleep analysis
sleep_status = "Good Sleep Quality"

if sleep < 5:
    sleep_status = "Poor Sleep Quality"
elif sleep < 8:
    sleep_status = "Average Sleep Quality"

# AI Summary
summary = (
    f"The patient is experiencing {stage} tinnitus with a "
    f"{risk} risk level. Mental health assessment indicates "
    f"{mental_health}. Sleep assessment shows {sleep_status}. "
    f"Consultation with {', '.join(doctor)} is recommended. "
    f"Early intervention and adherence to treatment can improve "
    f"overall quality of life."
)

# Final Report
result = {
    "stage": stage,
    "risk": risk,
    "confidence": confidence,
    "doctor": doctor,
    "treatments": treatments,
    "tips": tips,
    "mental_health": mental_health,
    "sleep_status": sleep_status,
    "clinical_interpretation": clinical_interpretation,
    "recovery_plan": recovery_plan,
    "summary": summary
}

# Send JSON back to Node.js
print(json.dumps(result))