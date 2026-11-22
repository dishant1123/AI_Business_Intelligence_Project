from sqlalchemy import Column, String, Integer, Float, Date, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class FinishedGoods(Base):
    __tablename__ = "finished_goods"
    
    product_id = Column(String(16), primary_key=True, index=True)
    product_name = Column(String(128), nullable=False)
    product_category = Column(String(64), nullable=False, index=True)
    standard_unit_cost = Column(Float, nullable=False)
    selling_price = Column(Float, nullable=False)
    target_cycle_time_minutes = Column(Integer, nullable=False)

    production_batches = relationship("ProductionBatches", back_populates="product")

class RawMaterials(Base):
    __tablename__ = "raw_materials"
    
    material_id = Column(String(16), primary_key=True, index=True)
    material_name = Column(String(128), nullable=False)
    material_category = Column(String(64), nullable=False, index=True)
    unit_cost = Column(Float, nullable=False)
    stock_quantity = Column(Integer, nullable=False)
    reorder_level = Column(Integer, nullable=False)
    supplier_id = Column(String(16), nullable=False, index=True)

    material_usages = relationship("MaterialUsage", back_populates="material")

class ProductionBatches(Base):
    __tablename__ = "production_batches"
    
    batch_id = Column(String(16), primary_key=True, index=True)
    product_id = Column(String(16), ForeignKey("finished_goods.product_id"), nullable=False, index=True)
    production_date = Column(Date, nullable=False, index=True)
    production_line = Column(String(16), nullable=False, index=True)
    planned_quantity = Column(Integer, nullable=False)
    produced_quantity = Column(Integer, nullable=False)
    rejected_quantity = Column(Integer, nullable=False)
    shift = Column(String(8), nullable=False, index=True)
    batch_status = Column(String(32), nullable=False, index=True)

    product = relationship("FinishedGoods", back_populates="production_batches")
    inspections = relationship("QualityInspections", back_populates="batch")
    material_usages = relationship("MaterialUsage", back_populates="batch")

class QualityInspections(Base):
    __tablename__ = "quality_inspections"
    
    inspection_id = Column(String(16), primary_key=True, index=True)
    batch_id = Column(String(16), ForeignKey("production_batches.batch_id"), nullable=False, index=True)
    inspection_date = Column(Date, nullable=False, index=True)
    inspected_units = Column(Integer, nullable=False)
    defective_units = Column(Integer, nullable=False)
    defect_type = Column(String(64), nullable=True, index=True)
    inspector_id = Column(String(16), nullable=False)
    inspection_result = Column(String(32), nullable=False, index=True)

    batch = relationship("ProductionBatches", back_populates="inspections")

class MaterialUsage(Base):
    __tablename__ = "material_usage"
    
    usage_id = Column(String(16), primary_key=True, index=True)
    batch_id = Column(String(16), ForeignKey("production_batches.batch_id"), nullable=False, index=True)
    material_id = Column(String(16), ForeignKey("raw_materials.material_id"), nullable=False, index=True)
    usage_date = Column(Date, nullable=False, index=True)
    quantity_used = Column(Float, nullable=False)
    wastage_quantity = Column(Float, nullable=False)

    batch = relationship("ProductionBatches", back_populates="material_usages")
    material = relationship("RawMaterials", back_populates="material_usages")

class MachineDowntime(Base):
    __tablename__ = "machine_downtime"
    
    downtime_id = Column(String(16), primary_key=True, index=True)
    machine_id = Column(String(16), nullable=False, index=True)
    event_date = Column(Date, nullable=False, index=True)
    production_line = Column(String(16), nullable=False, index=True)
    downtime_minutes = Column(Integer, nullable=False)
    reason = Column(String(64), nullable=False, index=True)
    maintenance_cost = Column(Float, nullable=False)
    severity = Column(String(16), nullable=False, index=True)

class Expenses(Base):
    __tablename__ = "expenses"
    
    expense_id = Column(String(16), primary_key=True, index=True)
    expense_date = Column(Date, nullable=False, index=True)
    cost_center = Column(String(64), nullable=False, index=True)
    category = Column(String(64), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    vendor = Column(String(128), nullable=False)

class DatasetImportHistory(Base):
    __tablename__ = "dataset_import_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(32), nullable=False)
    record_counts = Column(JSON, nullable=False)
    status = Column(String(32), nullable=False)
    imported_at = Column(DateTime, default=datetime.utcnow)
    error_details = Column(Text, nullable=True)
