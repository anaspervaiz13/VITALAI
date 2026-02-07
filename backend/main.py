from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import os
from fastapi.middleware.cors import CORSMiddleware

# Initialize App
app = FastAPI(title="AI Disease Prediction API")

# Enable CORS for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load AI Engine
MODEL_PATH = os.path.join("..", "models", "disease_prediction_engine.joblib")
if not os.path.exists(MODEL_PATH):
    # Fallback for different execution contexts
    MODEL_PATH = os.path.join("models", "disease_prediction_engine.joblib")

try:
    engine = joblib.load(MODEL_PATH)
    model = engine['model']
    scaler = engine['scaler']
    imputer = engine['imputer']
    features_list = engine['features']
    target_names = engine['targets']
    print(f"Model Loaded Successfully. Targets: {target_names}")
except Exception as e:
    print(f"Error Loading Model: {e}")
    model = None

# Input Schema based on BRFSS Features
class HealthInput(BaseModel):
    age: float          # AGE
    sex: float          # SEX (1: Male, 2: Female)
    gen_health: float    # GENHLTH (1-5)
    bmi: float          # _BMI5 (Actual BMI * 100)
    phys_health: float   # PHYSHLTH (Days unwell)
    smoke_status: float  # SMOKE100 (1: Yes, 2: No)
    high_chol: float     # BLOODCHO (1: Yes, 2: No)
    exercise: float      # EXERANY2 (1: Yes, 2: No)
    # NEW CLINICAL INPUTS
    bp_meds: float       # BPMEDS (1: Yes, 2: No)
    stroke_hist: float   # CVDSTRK3 (1: Yes, 2: No)
    heart_attack: float  # CVDINFR4 (1: Yes, 2: No)
    alcohol: float       # ALCDAY5 (Days or frequency)
    health_insurance: float # HLTHPLN1 (1: Yes, 2: No)

@app.get("/")
def home():
    return {"message": "Disease Prediction API is Online", "status": "Ready"}

@app.post("/predict")
def predict(data: HealthInput):
    if model is None:
        raise HTTPException(status_code=500, detail="Prediction model not found on server.")

    print(f"\n[REQUEST] Health metrics received:")
    # Using modern Pydantic v2 model_dump
    input_data = data.model_dump()
    print(f"  {input_data}")

    try:
        # CDC RULEBOOK MAPPING (Matches ml_engine.py V7)
        # 88 -> 0 (None), 888 -> 0 (None)
        phys_health = 0 if data.phys_health == 88 else data.phys_health
        alcohol = 0 if data.alcohol == 888 else data.alcohol
        
        input_dict = {
            "AGE": data.age,
            "SEX": data.sex,
            "GENHLTH": data.gen_health,
            "_BMI5": data.bmi,        # FIXED: Model V7 expects 25.5, not 2550
            "PHYSHLTH": phys_health,
            "SMOKE100": data.smoke_status,
            "BLOODCHO": data.high_chol,
            "EXERANY2": data.exercise,
            "BPMEDS": data.bp_meds,
            "CVDSTRK3": data.stroke_hist,
            "CVDINFR4": data.heart_attack,
            "ALCDAY5": alcohol,
            "HLTHPLN1": data.health_insurance
        }
        
        # Build complete row matching the training format
        full_row = []
        for feat in features_list:
            # If the feature is in our form, use it. 
            # Otherwise, use NaN so the imputer fills it with the dataset median.
            full_row.append(input_dict.get(feat, np.nan)) 
            
        # Convert to DataFrame
        df_input = pd.DataFrame([full_row], columns=features_list)
        
        # Preprocess using the saved pipeline
        X_proc = imputer.transform(df_input)
        X_proc = scaler.transform(X_proc)
        
        # Get Probabilities
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X_proc)
            
            result = {}
            for i, target in enumerate(target_names):
                # Probabilities for class 1 (Diseased)
                if isinstance(probs, list): # Multi-output models return lists
                    p = float(probs[i][0][1])
                else:
                    p = float(probs[0][i]) # Some versions return (n_samples, n_outputs)
                
                result[target] = {
                    "probability": round(p * 100, 2),
                    "risk_level": "High" if p > 0.5 else "Moderate" if p > 0.2 else "Low"
                }
            print(f"[SUCCESS] AI Risk Report: {result}")
            return result
        else:
            # Fallback to binary prediction
            preds = model.predict(X_proc)[0]
            result = {target: {"risk": int(preds[i])} for i, target in enumerate(target_names)}
            print(f"[SUCCESS] AI Prediction (Binary): {result}")
            return result

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
