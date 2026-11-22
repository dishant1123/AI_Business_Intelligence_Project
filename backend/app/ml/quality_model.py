import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import mean_absolute_error, accuracy_score, f1_score, classification_report
from app.core.config import settings

MODELS_DIR = os.path.abspath(settings.ML_MODELS_DIR)
os.makedirs(MODELS_DIR, exist_ok=True)

class QualityMLPipeline:
    """
    Quality Risk Prediction Pipeline.
    Excludes post-inspection results to strictly prevent target leakage.
    Predicts defective units (Regressor) and High Risk probability (Classifier).
    """
    REG_MODEL_PATH = os.path.join(MODELS_DIR, "quality_reg_model.joblib")
    CLF_MODEL_PATH = os.path.join(MODELS_DIR, "quality_clf_model.joblib")
    METADATA_PATH = os.path.join(MODELS_DIR, "quality_metadata.joblib")

    @classmethod
    def train(cls, db_session) -> Dict[str, Any]:
        from app.models.manufacturing import ProductionBatches, QualityInspections, FinishedGoods

        # Join Quality Inspections with Batches and Finished Goods
        q = db_session.query(
            QualityInspections.inspection_id,
            QualityInspections.defective_units,
            QualityInspections.inspected_units,
            ProductionBatches.product_id,
            ProductionBatches.production_line,
            ProductionBatches.shift,
            ProductionBatches.planned_quantity,
            FinishedGoods.target_cycle_time_minutes,
            FinishedGoods.product_category
        ).join(
            ProductionBatches, QualityInspections.batch_id == ProductionBatches.batch_id
        ).join(
            FinishedGoods, ProductionBatches.product_id == FinishedGoods.product_id
        )

        rows = q.all()
        if not rows:
            return {"error": "No quality inspection records available for training."}

        df = pd.DataFrame([
            {
                "product_id": r.product_id,
                "production_line": r.production_line,
                "shift": r.shift,
                "planned_quantity": r.planned_quantity,
                "target_cycle_time_minutes": r.target_cycle_time_minutes,
                "product_category": r.product_category,
                "defective_units": r.defective_units,
                "inspected_units": r.inspected_units,
                "defect_rate": (r.defective_units / max(r.inspected_units, 1)) * 100
            }
            for r in rows
        ])

        # High Risk threshold: defect_rate >= 10%
        df["high_defect_risk"] = (df["defect_rate"] >= 10.0).astype(int)

        # Encoders
        encoders = {}
        for col in ["product_id", "production_line", "shift", "product_category"]:
            le = LabelEncoder()
            df[col + "_enc"] = le.fit_transform(df[col].astype(str))
            encoders[col] = le

        feature_cols = [
            "product_id_enc", "production_line_enc", "shift_enc",
            "product_category_enc", "planned_quantity", "target_cycle_time_minutes"
        ]

        X = df[feature_cols]
        y_reg = df["defective_units"]
        y_clf = df["high_defect_risk"]

        X_train, X_test, y_reg_train, y_reg_test = train_test_split(X, y_reg, test_size=0.2, random_state=42)
        _, _, y_clf_train, y_clf_test = train_test_split(X, y_clf, test_size=0.2, random_state=42)

        # Regressor
        reg_model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
        reg_model.fit(X_train, y_reg_train)
        y_reg_pred = reg_model.predict(X_test)
        mae = float(mean_absolute_error(y_reg_test, y_reg_pred))

        # Classifier
        clf_model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42, n_jobs=-1)
        clf_model.fit(X_train, y_clf_train)
        y_clf_pred = clf_model.predict(X_test)
        acc = float(accuracy_score(y_clf_test, y_clf_pred))
        f1 = float(f1_score(y_clf_test, y_clf_pred, zero_division=0))

        # Feature importance
        feature_importance = dict(zip(
            ["Product", "Production Line", "Shift", "Category", "Planned Qty", "Cycle Time"],
            [round(float(imp), 4) for imp in clf_model.feature_importances_]
        ))

        joblib.dump(reg_model, cls.REG_MODEL_PATH)
        joblib.dump(clf_model, cls.CLF_MODEL_PATH)
        joblib.dump({"encoders": encoders, "feature_cols": feature_cols}, cls.METADATA_PATH)

        return {
            "model_name": "Quality Risk & Defect Predictor",
            "algorithm": "RandomForestRegressor & Classifier",
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "regressor_mae": round(mae, 2),
            "classifier_accuracy": round(acc, 4),
            "classifier_f1_score": round(f1, 4),
            "feature_importance": feature_importance
        }

    @classmethod
    def predict(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        if not os.path.exists(cls.REG_MODEL_PATH) or not os.path.exists(cls.CLF_MODEL_PATH):
            return {"error": "Quality models not trained yet."}

        reg_model = joblib.load(cls.REG_MODEL_PATH)
        clf_model = joblib.load(cls.CLF_MODEL_PATH)
        meta = joblib.load(cls.METADATA_PATH)
        encoders = meta["encoders"]

        def safe_encode(col_name, val):
            le = encoders[col_name]
            val_str = str(val)
            if val_str in le.classes_:
                return le.transform([val_str])[0]
            return 0

        p_id_enc = safe_encode("product_id", data.get("product_id", "FG0001"))
        line_enc = safe_encode("production_line", data.get("production_line", "LINE01"))
        shift_enc = safe_encode("shift", data.get("shift", "A"))
        cat_enc = safe_encode("product_category", data.get("product_category", "Machinery"))

        planned_qty = float(data.get("planned_quantity", 1000))
        cycle_time = float(data.get("target_cycle_time_minutes", 30))

        features = np.array([[p_id_enc, line_enc, shift_enc, cat_enc, planned_qty, cycle_time]])

        pred_defective = float(reg_model.predict(features)[0])
        prob_high_risk = float(clf_model.predict_proba(features)[0][1])

        if prob_high_risk >= 0.5:
            risk_tier = "High"
        elif prob_high_risk >= 0.25:
            risk_tier = "Medium"
        else:
            risk_tier = "Low"

        risk_factors = []
        if cycle_time > 45:
            risk_factors.append("Extended cycle time increases defect exposure")
        if data.get("shift") == "C":
            risk_factors.append("Night shift historically exhibits higher variance")
        if planned_qty > 1200:
            risk_factors.append("High batch volume may stress line tolerance")

        return {
            "predicted_defect_risk": risk_tier,
            "defect_probability": round(prob_high_risk, 4),
            "predicted_defective_units": max(0.0, round(pred_defective, 1)),
            "risk_factors": risk_factors
        }
