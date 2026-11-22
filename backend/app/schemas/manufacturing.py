from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime

class FinishedGoodsSchema(BaseModel):
    product_id: str
    product_name: str
    product_category: str
    standard_unit_cost: float
    selling_price: float
    target_cycle_time_minutes: int

    class Config:
        from_attributes = True

class RawMaterialsSchema(BaseModel):
    material_id: str
    material_name: str
    material_category: str
    unit_cost: float
    stock_quantity: int
    reorder_level: int
    supplier_id: str

    class Config:
        from_attributes = True

class ProductionBatchSchema(BaseModel):
    batch_id: str
    product_id: str
    production_date: date
    production_line: str
    planned_quantity: int
    produced_quantity: int
    rejected_quantity: int
    shift: str
    batch_status: str

    class Config:
        from_attributes = True

class QualityInspectionSchema(BaseModel):
    inspection_id: str
    batch_id: str
    inspection_date: date
    inspected_units: int
    defective_units: int
    defect_type: Optional[str] = None
    inspector_id: str
    inspection_result: str

    class Config:
        from_attributes = True

class MaterialUsageSchema(BaseModel):
    usage_id: str
    batch_id: str
    material_id: str
    usage_date: date
    quantity_used: float
    wastage_quantity: float

    class Config:
        from_attributes = True

class MachineDowntimeSchema(BaseModel):
    downtime_id: str
    machine_id: str
    event_date: date
    production_line: str
    downtime_minutes: int
    reason: str
    maintenance_cost: float
    severity: str

    class Config:
        from_attributes = True

class ExpenseSchema(BaseModel):
    expense_id: str
    expense_date: date
    cost_center: str
    category: str
    amount: float
    vendor: str

    class Config:
        from_attributes = True

class DatasetSummaryResponse(BaseModel):
    total_finished_goods: int
    total_raw_materials: int
    total_batches: int
    total_downtime_records: int
    total_inspections: int
    total_usage_records: int
    total_expenses: int
    date_range_start: str
    date_range_end: str
    last_imported_at: Optional[datetime] = None

class DashboardKPIResponse(BaseModel):
    total_planned_production: int
    total_produced_units: int
    total_rejected_units: int
    production_achievement_pct: float
    production_yield_pct: float
    production_gap: int
    average_daily_production: float
    
    total_inspected_units: int
    total_defective_units: int
    defect_rate_pct: float
    quality_pass_rate_pct: float
    rework_rate_pct: float
    
    total_downtime_minutes: int
    total_downtime_hours: float
    downtime_frequency: int
    total_maintenance_cost: float
    machine_availability_pct: float
    
    total_stock_quantity: int
    low_stock_materials_count: int
    total_inventory_value: float
    total_quantity_used: float
    total_wastage_quantity: float
    material_wastage_pct: float
    
    total_manufacturing_expenses: float
    total_material_cost: float
    avg_gross_margin_pct: float
