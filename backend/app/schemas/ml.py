from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ProductionPredictionRequest(BaseModel):
    product_id: str
    production_line: str
    planned_quantity: int
    shift: str
    target_cycle_time_minutes: Optional[int] = 30
    day_of_week: Optional[int] = 2
    month: Optional[int] = 6

class ProductionPredictionResponse(BaseModel):
    product_id: str
    production_line: str
    planned_quantity: int
    predicted_produced_quantity: float
    predicted_achievement_pct: float
    feature_importance: Optional[Dict[str, float]] = None

class QualityPredictionRequest(BaseModel):
    product_id: str
    production_line: str
    shift: str
    planned_quantity: int
    target_cycle_time_minutes: Optional[int] = 30

class QualityPredictionResponse(BaseModel):
    predicted_defect_risk: str  # Low, Medium, High
    defect_probability: float
    predicted_defective_units: float
    risk_factors: List[str] = []

class AnomalyItem(BaseModel):
    downtime_id: str
    machine_id: str
    event_date: str
    production_line: str
    downtime_minutes: int
    reason: str
    maintenance_cost: float
    severity: str
    anomaly_score: float
    is_anomaly: bool

class AnomalyDetectionResponse(BaseModel):
    total_records_evaluated: int
    total_anomalies_detected: int
    contamination_rate: float
    top_anomalies: List[AnomalyItem]

class WastagePredictionRequest(BaseModel):
    material_id: str
    quantity_used: float
    batch_planned_quantity: Optional[int] = 1000

class WastagePredictionResponse(BaseModel):
    material_id: str
    quantity_used: float
    predicted_wastage_quantity: float
    predicted_wastage_pct: float

class ModelEvaluationMetrics(BaseModel):
    model_name: str
    target: str
    algorithm: str
    mae: Optional[float] = None
    rmse: Optional[float] = None
    r2_score: Optional[float] = None
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    train_samples: int
    test_samples: int
    features: List[str]
    trained_at: str
