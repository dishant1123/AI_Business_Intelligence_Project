import os
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.manufacturing import (
    FinishedGoods, RawMaterials, ProductionBatches,
    QualityInspections, MaterialUsage, MachineDowntime,
    Expenses, DatasetImportHistory
)

class DataIngestionService:
    @staticmethod
    def parse_date(val: Any) -> datetime.date:
        if pd.isnull(val):
            return datetime.utcnow().date()
        if isinstance(val, (datetime, pd.Timestamp)):
            return val.date()
        return pd.to_datetime(val).date()

    @classmethod
    def import_excel_workbook(cls, file_path: str, db: Session) -> Dict[str, Any]:
        """
        Parses multi-sheet Excel manufacturing file and loads into database.
        Maintains referential integrity and original primary keys.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        counts = {
            "finished_goods": 0,
            "raw_materials": 0,
            "production_batches": 0,
            "quality_inspections": 0,
            "material_usage": 0,
            "machine_downtime": 0,
            "expenses": 0
        }

        try:
            # 1. Finished Goods
            fg_df = pd.read_excel(file_path, sheet_name="Finished_Goods")
            # Clear existing or upsert
            db.query(FinishedGoods).delete()
            fg_objects = []
            for _, r in fg_df.iterrows():
                fg_objects.append(FinishedGoods(
                    product_id=str(r["product_id"]).strip(),
                    product_name=str(r["product_name"]).strip(),
                    product_category=str(r["product_category"]).strip(),
                    standard_unit_cost=float(r["standard_unit_cost"]),
                    selling_price=float(r["selling_price"]),
                    target_cycle_time_minutes=int(r["target_cycle_time_minutes"])
                ))
            db.bulk_save_objects(fg_objects)
            db.commit()
            counts["finished_goods"] = len(fg_objects)

            # 2. Raw Materials
            rm_df = pd.read_excel(file_path, sheet_name="Raw_Materials")
            db.query(RawMaterials).delete()
            rm_objects = []
            for _, r in rm_df.iterrows():
                rm_objects.append(RawMaterials(
                    material_id=str(r["material_id"]).strip(),
                    material_name=str(r["material_name"]).strip(),
                    material_category=str(r["material_category"]).strip(),
                    unit_cost=float(r["unit_cost"]),
                    stock_quantity=int(r["stock_quantity"]),
                    reorder_level=int(r["reorder_level"]),
                    supplier_id=str(r["supplier_id"]).strip()
                ))
            db.bulk_save_objects(rm_objects)
            db.commit()
            counts["raw_materials"] = len(rm_objects)

            # 3. Production Batches
            pb_df = pd.read_excel(file_path, sheet_name="Production_Batches")
            # Delete child tables first to respect FK constraints
            db.query(QualityInspections).delete()
            db.query(MaterialUsage).delete()
            db.query(ProductionBatches).delete()
            db.commit()

            pb_objects = []
            for _, r in pb_df.iterrows():
                pb_objects.append(ProductionBatches(
                    batch_id=str(r["batch_id"]).strip(),
                    product_id=str(r["product_id"]).strip(),
                    production_date=cls.parse_date(r["production_date"]),
                    production_line=str(r["production_line"]).strip(),
                    planned_quantity=int(r["planned_quantity"]),
                    produced_quantity=int(r["produced_quantity"]),
                    rejected_quantity=int(r["rejected_quantity"]),
                    shift=str(r["shift"]).strip(),
                    batch_status=str(r["batch_status"]).strip()
                ))
            db.bulk_save_objects(pb_objects)
            db.commit()
            counts["production_batches"] = len(pb_objects)

            # 4. Quality Inspections
            qi_df = pd.read_excel(file_path, sheet_name="Quality_Inspections")
            qi_objects = []
            for _, r in qi_df.iterrows():
                def_type = str(r["defect_type"]).strip() if pd.notnull(r["defect_type"]) else None
                qi_objects.append(QualityInspections(
                    inspection_id=str(r["inspection_id"]).strip(),
                    batch_id=str(r["batch_id"]).strip(),
                    inspection_date=cls.parse_date(r["inspection_date"]),
                    inspected_units=int(r["inspected_units"]),
                    defective_units=int(r["defective_units"]),
                    defect_type=def_type,
                    inspector_id=str(r["inspector_id"]).strip(),
                    inspection_result=str(r["inspection_result"]).strip()
                ))
            db.bulk_save_objects(qi_objects)
            db.commit()
            counts["quality_inspections"] = len(qi_objects)

            # 5. Material Usage
            mu_df = pd.read_excel(file_path, sheet_name="Material_Usage")
            mu_objects = []
            for _, r in mu_df.iterrows():
                mu_objects.append(MaterialUsage(
                    usage_id=str(r["usage_id"]).strip(),
                    batch_id=str(r["batch_id"]).strip(),
                    material_id=str(r["material_id"]).strip(),
                    usage_date=cls.parse_date(r["usage_date"]),
                    quantity_used=float(r["quantity_used"]),
                    wastage_quantity=float(r["wastage_quantity"])
                ))
            db.bulk_save_objects(mu_objects)
            db.commit()
            counts["material_usage"] = len(mu_objects)

            # 6. Machine Downtime
            md_df = pd.read_excel(file_path, sheet_name="Machine_Downtime")
            db.query(MachineDowntime).delete()
            md_objects = []
            for _, r in md_df.iterrows():
                md_objects.append(MachineDowntime(
                    downtime_id=str(r["downtime_id"]).strip(),
                    machine_id=str(r["machine_id"]).strip(),
                    event_date=cls.parse_date(r["event_date"]),
                    production_line=str(r["production_line"]).strip(),
                    downtime_minutes=int(r["downtime_minutes"]),
                    reason=str(r["reason"]).strip(),
                    maintenance_cost=float(r["maintenance_cost"]),
                    severity=str(r["severity"]).strip()
                ))
            db.bulk_save_objects(md_objects)
            db.commit()
            counts["machine_downtime"] = len(md_objects)

            # 7. Expenses
            ex_df = pd.read_excel(file_path, sheet_name="Expenses")
            db.query(Expenses).delete()
            ex_objects = []
            for _, r in ex_df.iterrows():
                ex_objects.append(Expenses(
                    expense_id=str(r["expense_id"]).strip(),
                    expense_date=cls.parse_date(r["expense_date"]),
                    cost_center=str(r["cost_center"]).strip(),
                    category=str(r["category"]).strip(),
                    amount=float(r["amount"]),
                    vendor=str(r["vendor"]).strip()
                ))
            db.bulk_save_objects(ex_objects)
            db.commit()
            counts["expenses"] = len(ex_objects)

            # Record in DatasetImportHistory
            history = DatasetImportHistory(
                file_name=os.path.basename(file_path),
                file_type="EXCEL",
                record_counts=counts,
                status="SUCCESS",
                imported_at=datetime.utcnow()
            )
            db.add(history)
            db.commit()

            return {
                "status": "SUCCESS",
                "counts": counts,
                "file": os.path.basename(file_path),
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            db.rollback()
            # Record failed history
            history = DatasetImportHistory(
                file_name=os.path.basename(file_path),
                file_type="EXCEL",
                record_counts=counts,
                status="FAILED",
                imported_at=datetime.utcnow(),
                error_details=str(e)
            )
            db.add(history)
            db.commit()
            raise e
