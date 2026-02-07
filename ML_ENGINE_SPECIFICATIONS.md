# Thesis ML Engine: Technical Specifications & Research Methodology

This document outlines the scientific logic, data preprocessing, and modeling strategies implemented in the **Disease Prediction Engine (V7 Full)**. These steps ensure the model is scientifically valid, statistically robust, and suitable for academic defense.

## 1. Data Source & Scope
- **Dataset:** Behavioral Risk Factor Surveillance System (BRFSS) 2011-2015 Merged.
- **Volume:** ~466,000 high-quality survey responses after cleaning.
- **Targets:** Simultaneous multi-disease prediction for **Diabetes**, **Hypertension**, and **Heart Disease**.

## 2. Scientifically Correct Target Mapping
Based on the CDC rulebook, we convert survey codes into binary targets (0: Healthy, 1: Diseased):
- **Diabetes (`DIABETE3`):** Codes 1 & 2 (Yes/Pregnancy) -> **1**; Codes 3 & 4 (No/Pre-diabetes) -> **0**.
- **Hypertension (`BPHIGH4`):** Codes 1 & 2 (Yes/Pregnancy) -> **1**; Codes 3 & 4 (Normal/Borderline) -> **0**.
- **Heart Disease (`CVDCRHD4`):** Code 1 -> **1**; Code 2 -> **0**.

## 3. Critical Preprocessing (The "Rulebook" Fixes)
To prevent mathematical errors and bias, the engine applies the following biological corrections:

### A. The "None" Code Correction
In BRFSS, `88` or `888` does not mean "Missing"; it means **Zero**.
- **Physical/Mental Health (`PHYSHLTH`, `MENTHLTH`):** `88` (No days sick) is translated to **0**.
- **Alcohol Usage (`ALCDAY5`):** `888` (No drinks) is translated to **0**.
*If not corrected, the AI would treat the healthiest people as the sickest.*

### B. Missing Data Identification
Codes for "Don't Know" or "Refused" (7, 9, 77, 99, 777, 999, etc.) are converted to **NaN**.
- These are then handled using **Median Imputation** to preserve dataset volume while maintaining statistical neutrality.

### C. Feature Scaling
- **BMI (`_BMI5`):** Divided by **100** to convert internal CDC integers (e.g., 2550) into standard clinical BMI values (e.g., 25.5).

## 4. Addressing Data Leakage (Research Integrity)
To ensure the AI predicts risk based on *biology and lifestyle* rather than *existing treatments*, we explicitly drop the following "Leakage" features:
- **`BPMEDS`:** Removed to prevent the AI from "cheating" by knowing the patient is already on blood pressure medication.
- **`PREDIAB1` / `BLDSUGAR`:** Removed to ensure the AI predicts Diabetes risk based on overall health metrics rather than clinical tests.

## 5. Modeling Strategy
- **Architecture:** `MultiOutputClassifier` wrapper used to handle simultaneous disease prediction.
- **Algorithms Compared:**
    1. **Logistic Regression:** Baseline for linear relationships.
    2. **Random Forest:** Handles non-linear decision boundaries and feature importance.
    3. **Neural Network (MLP):** Champion model; utilizes a (64, 32) hidden layer structure to find complex health patterns.
- **Class Imbalance:** `class_weight='balanced'` is used to ensure the AI doesn't ignore "Diseased" cases due to their lower frequency.

## 6. Automated Thesis Assets (Visual Analytics)
The engine generates professional visualizations for the research report:
- **Confusion Matrices (`confusion_matrices.png`):** Heatmaps showing True Positives vs. False Positives for clinical safety analysis.
- **ROC Curves (`roc_curves.png`):** Performance threshold analysis and Area Under Curve (AUC) calculation for each disease.
- **Clinical Report:** Console output providing Precision, Recall, and F1-Scores for "Healthy" vs. "Risk Detected" classes.
