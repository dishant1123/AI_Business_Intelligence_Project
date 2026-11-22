import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from sklearn.ensemble import IsolationForest
from app.core.config import settings

MODELS_DIR = os.path.abspath(settings.ML_MODELS_DIR)
os.makedirs(MODELS_DIR, exist_ok=True)

class MachineAnomalyPipeline:
    """
    Isolation Forest to detect extreme downtime duration and maintenance cost anomalies.
    Distinguishes anomalies from failure prediction.
    """
    MODEL_PATH = os.path.join(MODELS_DIR, "isolation_forest_model.joblib")

    @classmethod
    def train_and_detect(cls, db_session, contamination: float = 0.05) -> Dict[str, Any]:
        from app.models.manufacturing import MachineDowntime

        rows = db_session.query(MachineDowntime).all()
        if not rows:
            return {"error": "No machine downtime events found."}

        df = pd.DataFrame([
            {
                "downtime_id": r.downtime_id,
                "machine_id": r.machine_id,
                "event_date": r.event_date.strftime("%Y-%m-%d"),
                "production_line": r.production_line,
                "downtime_minutes": r.downtime_minutes,
                "reason": r.reason,
                "maintenance_cost": r.maintenance_cost,
                "severity": r.severity
            }
            for r in rows
        ])

        # Features for isolation forest
        X = df[["downtime_minutes", "maintenance_cost"]].values

        iso_forest = IsolationForest(
            n_estimators=100,
            contamination=contamination,
            random_state=42,
            n_jobs=-1
        )
        iso_forest.fit(X)

        scores = iso_forest.decision_function(X)
        preds = iso_forest.predict(X)  # -1 for anomaly, 1 for normal

        df["anomaly_score"] = np.round(scores, 4)
        df["is_anomaly"] = preds == -1

        anomalies_df = df[df["is_anomaly"]].sort_values("anomaly_score")
        top_anomalies = anomalies_df.head(20).to_dict(orient="records")

        joblib.dump(iso_forest, cls.MODEL_PATH)

        return {
            "total_records_evaluated": len(df),
            "total_anomalies_detected": int(df["is_anomaly"].sum()),
            "contamination_rate": contamination,
            "top_anomalies": top_anomalies
        }
