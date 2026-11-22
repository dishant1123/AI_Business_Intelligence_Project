import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from app.core.config import settings

MODELS_DIR = os.path.abspath(settings.ML_MODELS_DIR)
os.makedirs(MODELS_DIR, exist_ok=True)

class MaterialWastagePipeline:
    """
    Random Forest Regressor to predict scrap/wastage quantity from material and usage volume.
    """
    MODEL_PATH = os.path.join(MODELS_DIR, "wastage_rf_model.joblib")
    METADATA_PATH = os.path.join(MODELS_DIR, "wastage_metadata.joblib")

    @classmethod
    def train(cls, db_session) -> Dict[str, Any]:
        from app.models.manufacturing import MaterialUsage, RawMaterials

        q = db_session.query(
            MaterialUsage.material_id,
            MaterialUsage.quantity_used,
            MaterialUsage.wastage_quantity,
            RawMaterials.material_category,
            RawMaterials.unit_cost
        ).join(RawMaterials, MaterialUsage.material_id == RawMaterials.material_id)

        rows = q.all()
        if not rows:
            return {"error": "No material usage records available."}

        df = pd.DataFrame([
            {
                "material_id": r.material_id,
                "quantity_used": r.quantity_used,
                "wastage_quantity": r.wastage_quantity,
                "material_category": r.material_category,
                "unit_cost": r.unit_cost
            }
            for r in rows
        ])

        le_mat = LabelEncoder()
        df["material_id_enc"] = le_mat.fit_transform(df["material_id"].astype(str))
        le_cat = LabelEncoder()
        df["material_category_enc"] = le_cat.fit_transform(df["material_category"].astype(str))

        feature_cols = ["material_id_enc", "material_category_enc", "quantity_used", "unit_cost"]
        X = df[feature_cols]
        y = df["wastage_quantity"]

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        mae = float(mean_absolute_error(y_test, y_pred))
        r2 = float(r2_score(y_test, y_pred))

        joblib.dump(model, cls.MODEL_PATH)
        joblib.dump({"le_mat": le_mat, "le_cat": le_cat, "feature_cols": feature_cols}, cls.METADATA_PATH)

        return {
            "model_name": "Material Wastage Predictor",
            "algorithm": "RandomForestRegressor",
            "target": "wastage_quantity",
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "mae": round(mae, 4),
            "r2_score": round(r2, 4)
        }

    @classmethod
    def predict(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        if not os.path.exists(cls.MODEL_PATH) or not os.path.exists(cls.METADATA_PATH):
            return {"error": "Wastage model not trained yet."}

        model = joblib.load(cls.MODEL_PATH)
        meta = joblib.load(cls.METADATA_PATH)

        le_mat = meta["le_mat"]
        le_cat = meta["le_cat"]

        mat_id = str(data.get("material_id", "RM0001"))
        mat_enc = le_mat.transform([mat_id])[0] if mat_id in le_mat.classes_ else 0
        cat = str(data.get("material_category", "Metal"))
        cat_enc = le_cat.transform([cat])[0] if cat in le_cat.classes_ else 0

        qty_used = float(data.get("quantity_used", 100.0))
        unit_cost = float(data.get("unit_cost", 1000.0))

        features = np.array([[mat_enc, cat_enc, qty_used, unit_cost]])
        pred_wastage = max(0.0, float(model.predict(features)[0]))
        pred_pct = round((pred_wastage / (qty_used + pred_wastage)) * 100, 2) if (qty_used + pred_wastage) > 0 else 0.0

        return {
            "material_id": mat_id,
            "quantity_used": qty_used,
            "predicted_wastage_quantity": round(pred_wastage, 2),
            "predicted_wastage_pct": pred_pct
        }
