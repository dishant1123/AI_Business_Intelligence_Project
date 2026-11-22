import sys, os
sys.path.insert(0, os.path.abspath("backend"))

from app.core.database import SessionLocal
from app.ml import (
    ProductionMLPipeline,
    QualityMLPipeline,
    MachineAnomalyPipeline,
    MaterialWastagePipeline
)

db = SessionLocal()
try:
    print("1. Training Production Model...")
    res_prod = ProductionMLPipeline.train(db)
    print("   Production Model Results:", res_prod)

    print("\n2. Training Quality Model...")
    res_qual = QualityMLPipeline.train(db)
    print("   Quality Model Results:", res_qual)

    print("\n3. Running Anomaly Detection...")
    res_anom = MachineAnomalyPipeline.train_and_detect(db)
    print(f"   Evaluated: {res_anom['total_records_evaluated']}, Detected: {res_anom['total_anomalies_detected']} anomalies.")

    print("\n4. Training Wastage Model...")
    res_wast = MaterialWastagePipeline.train(db)
    print("   Wastage Model Results:", res_wast)

    # Test single predictions
    pred_prod = ProductionMLPipeline.predict({
        "product_id": "FG0001",
        "production_line": "LINE01",
        "planned_quantity": 1000,
        "shift": "A"
    })
    print("\nSample Production Prediction:", pred_prod)

    pred_qual = QualityMLPipeline.predict({
        "product_id": "FG0001",
        "production_line": "LINE01",
        "shift": "A",
        "planned_quantity": 1000
    })
    print("Sample Quality Prediction:", pred_qual)

finally:
    db.close()
