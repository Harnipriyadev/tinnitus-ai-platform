import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
import joblib

# Load dataset
df = pd.read_csv("synthetic_tinnitus_10000.csv")

# Convert categorical columns into numbers
encoders = {}

categorical_columns = [
    "gender",
    "tinnitus_type",
    "affected_ear",
    "hearing_loss",
    "treatment",
    "outcome"
]

for col in categorical_columns:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    encoders[col] = le

# Features
X = df.drop(["patient_id", "outcome"], axis=1)

# Target
y = df["outcome"]

# Train model
model = RandomForestClassifier()

model.fit(X, y)

# Save model
joblib.dump(model, "tinnitus_model.pkl")

# Save encoders
joblib.dump(encoders, "encoders.pkl")

print("Model Trained Successfully!")