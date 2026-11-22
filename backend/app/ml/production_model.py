import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from app.core.config import settings

MODELS_DIR = os.path.abspath(settings.ML_MODELS_DIR)
os.makedirs(MODELS_DIR, exist_ok=True)

class ProductionMLPipeline:
    """
    Random Forest Regressor to predict Produced Quantity from batch & production characteristics.
    """
    MODEL_PATH = os.path.join(MODELS_DIR, "production_rf_model.joblib")
    METADATA_PATH = os.path.join(MODELS_DIR, "production_metadata.joblib")

    @classmethod
    def train(cls, db_session) -> Dict[str, Any]:
        from app.models.manufacturing import ProductionBatches, FinishedGoods
        from sklearn.ensemble import RandomForestRegressor
        from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

        # Query batch data joined with finished goods
        q = db_session.query(
            ProductionBatches.batch_id,
            ProductionBatches.product_id,
            ProductionBatches.production_date,
            ProductionBatches.production_line,
            ProductionBatches.planned_quantity,
            ProductionBatches.produced_quantity,
            ProductionBatches.shift,
            FinishedGoods.target_cycle_time_minutes,
            FinishedGoods.product_category
        ).join(FinishedGoods, ProductionBatches.product_id == FinishedGoods.product_id)

        rows = q.all()
        if not rows:
            return {"error": "No production batch records available for training."}

        df = pd.DataFrame([
            {
                "product_id": r.product_id,
                "production_line": r.production_line,
                "planned_quantity": r.planned_quantity,
                "produced_quantity": r.produced_quantity,
                "shift": r.shift,
                "target_cycle_time_minutes": r.target_cycle_time_minutes,
                "product_category": r.product_category,
                "day_of_week": pd.to_datetime(r.production_date).dayofweek,
                "month": pd.to_datetime(r.production_date).month
            }
            for r in rows
        ])

        # Encoders
        encoders = {}
        for col in ["product_id", "production_line", "shift", "product_category"]:
            le = LabelEncoder()
            df[col + "_enc"] = le.fit_transform(df[col].astype(str))
            encoders[col] = le

        feature_cols = [
            "product_id_enc", "production_line_enc", "shift_enc",
            "product_category_enc", "planned_quantity", "target_cycle_time_minutes",
            "day_of_week", "month"
        ]

        X = df[feature_cols]
        y = df["produced_quantity"]

        # Chronological or stratified split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1)
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2 = float(r2_score(y_test, y_pred))

        feature_importance = dict(zip(
            ["Product", "Line", "Shift", "Category", "Planned Qty", "Cycle Time", "Day of Week", "Month"],
            [round(float(imp), 4) for imp in model.feature_importances_]
        ))

        # Save artifacts
        joblib.dump(model, cls.MODEL_PATH)
        joblib.dump({"encoders": encoders, "feature_cols": feature_cols}, cls.METADATA_PATH)

        return {
            "model_name": "Production Output Predictor",
            "algorithm": "RandomForestRegressor",
            "target": "produced_quantity",
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "r2_score": round(r2, 4),
            "feature_importance": feature_importance
        }

    @classmethod
    def predict(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        if not os.path.exists(cls.MODEL_PATH) or not os.path.exists(cls.METADATA_PATH):
            return {"error": "Model not trained yet. Please train the model first."}

        model = joblib.load(cls.MODEL_PATH)
        meta = joblib.load(cls.METADATA_PATH)
        encoders = meta["encoders"]

        # Safe encoding lookup
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
        day_of_week = int(data.get("day_of_week", 2))
        month = int(data.get("month", 6))

        features = np.array([[
            p_id_enc, line_enc, shift_enc, cat_enc,
            planned_qty, cycle_time, day_of_week, month
        ]])

        pred_qty = float(model.predict(features)[0])
        pred_qty = max(0.0, round(pred_qty, 2))
        achv_pct = round((pred_qty / planned_qty) * 100, 2) if planned_qty > 0 else 0.0

        return {
            "product_id": data.get("product_id"),
            "production_line": data.get("production_line"),
            "planned_quantity": int(planned_qty),
            "predicted_produced_quantity": pred_qty,
            "predicted_achievement_pct": achv_pct
        }
