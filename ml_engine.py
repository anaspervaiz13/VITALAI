import pandas as pd
import numpy as np
import os
import joblib
import time
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.metrics import (accuracy_score, f1_score, confusion_matrix,
                             roc_curve, auc, classification_report)

# ==================================================================================
# THESIS ENGINE V7 (FULL): Research Grade Cleaning & Robust Visualization
# ==================================================================================

def load_and_preprocess(data_path="data/brfss_cleaned.csv"):
    start_time = time.time()
    print("\n[STEP 1] LOADING & RESEARCH-GRADE CLEANING")
    # Load raw data from your brfss_cleaned.csv
    df = pd.read_csv(data_path)
   
    # 1. Target Mapping (Rulebook: 1=Yes, 2=Yes(Preg), 3=No, 4=Pre)
    y = pd.DataFrame(index=df.index)
    y['Diabetes'] = df['DIABETE3'].map({1:1, 2:1, 3:0, 4:0})
    y['Hypertension'] = df['BPHIGH4'].map({1:1, 2:1, 3:0, 4:0})
    y['HeartDisease'] = df['CVDCRHD4'].map({1:1, 2:0})
   
    # 2. Bio-Mapping (The Rulebook Fixes)
    X = df.copy()
   
    # Health Days: 88 means 0 days per Page 13 of Codebook
    for col in ['PHYSHLTH', 'MENTHLTH', 'POORHLTH']:
        if col in X.columns:
            X[col] = X[col].replace({88: 0, 77: np.nan, 99: np.nan})
   
    # Alcohol: 888 means 0 drinks per Page 49
    if 'ALCDAY5' in X.columns:
        X['ALCDAY5'] = X['ALCDAY5'].replace({888: 0, 777: np.nan, 999: np.nan})
   
    # BMI: Internal format is *100
    if '_BMI5' in X.columns:
        X['_BMI5'] = X['_BMI5'] / 100.0
   
    # 3. Handling Leakage & Leakage Removal
    # We drop BPMEDS because if a patient takes BP meds, they ALREADY have Hypertension.
    # We want the AI to learn risk from LIFESTYLE, not from existing prescriptions.
    leakage_cols = ["DIABETE3", "BPHIGH4", "CVDCRHD4", "BPMEDS", "PREDIAB1"]
    X = X.drop(columns=[c for c in leakage_cols if c in X.columns])
   
    # Drop rows where any target is NaN (Don't Know/Refused answers)
    complete_cases = y.dropna().index
    y = y.loc[complete_cases].astype(int)
    X = X.loc[complete_cases]
   
    print(f"Final Research Dataset: {len(y)} rows")
   
    # Encoding Categorical Features
    X_encoded = pd.get_dummies(X, drop_first=True)
    features = X_encoded.columns.tolist()
   
    X_train, X_test, y_train, y_test = train_test_split(
        X_encoded, y, test_size=0.2, random_state=42, stratify=y
    )
   
    # Impute missing values with Medians
    imputer = SimpleImputer(strategy="median")
    X_train = imputer.fit_transform(X_train)
    X_test = imputer.transform(X_test)
   
    # Scale features for Neural Network performance
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)
   
    print(f"Preprocessing Complete. Time: {time.time()-start_time:.2f}s")
    return X_train, X_test, y_train, y_test, scaler, imputer, features, y.columns.tolist()

def compare_models(X_train, X_test, y_train, y_test, targets):
    print("\n[PHASE 1] MODEL COMPETITION")
    # We compare 3 architectures to find the best research model
    models = {
        "Logistic Regression": MultiOutputClassifier(LogisticRegression(class_weight='balanced', max_iter=1000)),
        "Random Forest": MultiOutputClassifier(RandomForestClassifier(n_estimators=100, max_depth=12, class_weight='balanced', random_state=42, n_jobs=-1)),
        "Neural Network": MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=300, random_state=42)
    }
   
    results = {}
    for name, model in models.items():
        print(f"Training {name}...")
        t0 = time.time()
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        avg_f1 = np.mean([f1_score(y_test.iloc[:, i], y_pred[:, i], average='weighted') for i in range(len(targets))])
        print(f"   Weighted F1-Score: {avg_f1:.4f} ({time.time()-t0:.1f}s)")
        results[name] = {"model": model, "f1": avg_f1}
       
    champ = max(results, key=lambda x: results[x]["f1"])
    print(f"\n🏆 CHAMPION ENGINE: {champ}")
    return results[champ]["model"], champ

def generate_visual_analytics(model, X_test, y_test, targets):
    print("\n[PHASE 2] GENERATING THESIS ASSETS (Graphs)")
    os.makedirs("outputs", exist_ok=True)
    y_pred = model.predict(X_test)
   
    # 1. Confusion Matrices (Scientific Heatmaps)
    plt.figure(figsize=(18, 5))
    for i, col in enumerate(targets):
        plt.subplot(1, 3, i+1)
        cm = confusion_matrix(y_test[col], y_pred[:, i])
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
        plt.title(f"Confusion: {col}")
        plt.ylabel('Actual')
        plt.xlabel('AI Predicted')
    plt.tight_layout()
    plt.savefig("outputs/confusion_matrices.png")
    plt.close()
    print("   - SUCCESS: confusion_matrices.png saved.")
   
    # 2. ROC Curves (Performance Thresholds)
    plt.figure(figsize=(10, 8))
    for i, col in enumerate(targets):
        # Handle multi-output probability differences between RF and NN
        if hasattr(model, "estimators_"): # Random Forest
            y_probs = model.estimators_[i].predict_proba(X_test)[:, 1]
        else: # Neural Network
            probs = model.predict_proba(X_test)
            y_probs = probs[i][:, 1] if isinstance(probs, list) else probs[:, i]
       
        fpr, tpr, _ = roc_curve(y_test[col], y_probs)
        plt.plot(fpr, tpr, label=f"{col} (AUC={auc(fpr, tpr):.2f})")
   
    plt.plot([0, 1], [0, 1], 'k--', alpha=0.5)
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('Multi-Disease Risk Prediction ROC')
    plt.legend()
    plt.grid(alpha=0.2)
    plt.savefig("outputs/roc_curves.png")
    plt.close()
    print("   - SUCCESS: roc_curves.png saved.")

def print_detailed_metrics(model, X_test, y_test, targets):
    print("\n" + "="*60)
    print("   AI DISEASE PREDICTION ENGINE: FINAL CLINICAL REPORT")
    print("="*60)
   
    y_pred = model.predict(X_test)
   
    for i, col in enumerate(targets):
        print(f"\n>>>> TARGET DISEASE: {col.upper()}")
        print("-" * 30)
        # Using classification_report for Precision, Recall, and F1
        print(classification_report(y_test[col], y_pred[:, i], target_names=["Healthy", "Risk Detected"]))
   
    print("=" * 60)
    print("REPORT COMPLETE.")

def main():
    try:
        # Step 1: Prep
        X_train, X_test, y_train, y_test, scaler, imputer, features, targets = load_and_preprocess()
       
        # Step 2: Learn
        champ_model, champ_name = compare_models(X_train, X_test, y_train, y_test, targets)
       
        # Step 3: Visualize (Thesis Graphs)
        generate_visual_analytics(champ_model, X_test, y_test, targets)
       
        # Step 4: Report (Console Metrics)
        print_detailed_metrics(champ_model, X_test, y_test, targets)
       
        # Step 5: Save Engine
        os.makedirs("models", exist_ok=True)
        joblib.dump({
            "model": champ_model,
            "scaler": scaler,
            "imputer": imputer,
            "features": features,
            "targets": targets
        }, "models/disease_prediction_engine.joblib")
       
        print(f"\n[FINAL SUCCESS] Champion '{champ_name}' deployed to models/ folder.")
       
    except Exception as e:
        print(f"\n[FATAL ERROR] {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()