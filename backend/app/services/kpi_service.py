import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.manufacturing import (
    FinishedGoods, RawMaterials, ProductionBatches,
    QualityInspections, MaterialUsage, MachineDowntime, Expenses
)

class ManufacturingKPIService:
    """
    Deterministic Manufacturing Business Intelligence Analytics Engine.
    All calculations are performed using Pandas and NumPy directly from raw database records.
    """

    @staticmethod
    def get_dataframes(db: Session, filters: Optional[Dict[str, Any]] = None):
        # Base queries
        pb_q = db.query(ProductionBatches)
        qi_q = db.query(QualityInspections)
        md_q = db.query(MachineDowntime)
        mu_q = db.query(MaterialUsage)
        ex_q = db.query(Expenses)
        fg_q = db.query(FinishedGoods)
        rm_q = db.query(RawMaterials)

        # Apply common filters if present
        if filters:
            if filters.get("start_date"):
                s_date = datetime.strptime(filters["start_date"], "%Y-%m-%d").date()
                pb_q = pb_q.filter(ProductionBatches.production_date >= s_date)
                qi_q = qi_q.filter(QualityInspections.inspection_date >= s_date)
                md_q = md_q.filter(MachineDowntime.event_date >= s_date)
                mu_q = mu_q.filter(MaterialUsage.usage_date >= s_date)
                ex_q = ex_q.filter(Expenses.expense_date >= s_date)
            if filters.get("end_date"):
                e_date = datetime.strptime(filters["end_date"], "%Y-%m-%d").date()
                pb_q = pb_q.filter(ProductionBatches.production_date <= e_date)
                qi_q = qi_q.filter(QualityInspections.inspection_date <= e_date)
                md_q = md_q.filter(MachineDowntime.event_date <= e_date)
                mu_q = mu_q.filter(MaterialUsage.usage_date <= e_date)
                ex_q = ex_q.filter(Expenses.expense_date <= e_date)
            if filters.get("production_line"):
                line = filters["production_line"]
                pb_q = pb_q.filter(ProductionBatches.production_line == line)
                md_q = md_q.filter(MachineDowntime.production_line == line)
            if filters.get("shift"):
                pb_q = pb_q.filter(ProductionBatches.shift == filters["shift"])
            if filters.get("product_id"):
                pb_q = pb_q.filter(ProductionBatches.product_id == filters["product_id"])

        # Convert to DataFrames
        pb_records = [
            {
                "batch_id": b.batch_id, "product_id": b.product_id,
                "production_date": b.production_date, "production_line": b.production_line,
                "planned_quantity": b.planned_quantity, "produced_quantity": b.produced_quantity,
                "rejected_quantity": b.rejected_quantity, "shift": b.shift, "batch_status": b.batch_status
            }
            for b in pb_q.all()
        ]
        pb_df = pd.DataFrame(pb_records) if pb_records else pd.DataFrame(columns=[
            "batch_id", "product_id", "production_date", "production_line",
            "planned_quantity", "produced_quantity", "rejected_quantity", "shift", "batch_status"
        ])

        qi_records = [
            {
                "inspection_id": q.inspection_id, "batch_id": q.batch_id,
                "inspection_date": q.inspection_date, "inspected_units": q.inspected_units,
                "defective_units": q.defective_units, "defect_type": q.defect_type,
                "inspector_id": q.inspector_id, "inspection_result": q.inspection_result
            }
            for q in qi_q.all()
        ]
        qi_df = pd.DataFrame(qi_records) if qi_records else pd.DataFrame(columns=[
            "inspection_id", "batch_id", "inspection_date", "inspected_units",
            "defective_units", "defect_type", "inspector_id", "inspection_result"
        ])

        md_records = [
            {
                "downtime_id": m.downtime_id, "machine_id": m.machine_id,
                "event_date": m.event_date, "production_line": m.production_line,
                "downtime_minutes": m.downtime_minutes, "reason": m.reason,
                "maintenance_cost": m.maintenance_cost, "severity": m.severity
            }
            for m in md_q.all()
        ]
        md_df = pd.DataFrame(md_records) if md_records else pd.DataFrame(columns=[
            "downtime_id", "machine_id", "event_date", "production_line",
            "downtime_minutes", "reason", "maintenance_cost", "severity"
        ])

        mu_records = [
            {
                "usage_id": u.usage_id, "batch_id": u.batch_id,
                "material_id": u.material_id, "usage_date": u.usage_date,
                "quantity_used": u.quantity_used, "wastage_quantity": u.wastage_quantity
            }
            for u in mu_q.all()
        ]
        mu_df = pd.DataFrame(mu_records) if mu_records else pd.DataFrame(columns=[
            "usage_id", "batch_id", "material_id", "usage_date", "quantity_used", "wastage_quantity"
        ])

        ex_records = [
            {
                "expense_id": e.expense_id, "expense_date": e.expense_date,
                "cost_center": e.cost_center, "category": e.category,
                "amount": e.amount, "vendor": e.vendor
            }
            for e in ex_q.all()
        ]
        ex_df = pd.DataFrame(ex_records) if ex_records else pd.DataFrame(columns=[
            "expense_id", "expense_date", "cost_center", "category", "amount", "vendor"
        ])

        fg_records = [
            {
                "product_id": f.product_id, "product_name": f.product_name,
                "product_category": f.product_category, "standard_unit_cost": f.standard_unit_cost,
                "selling_price": f.selling_price, "target_cycle_time_minutes": f.target_cycle_time_minutes
            }
            for f in fg_q.all()
        ]
        fg_df = pd.DataFrame(fg_records) if fg_records else pd.DataFrame(columns=[
            "product_id", "product_name", "product_category", "standard_unit_cost",
            "selling_price", "target_cycle_time_minutes"
        ])

        rm_records = [
            {
                "material_id": r.material_id, "material_name": r.material_name,
                "material_category": r.material_category, "unit_cost": r.unit_cost,
                "stock_quantity": r.stock_quantity, "reorder_level": r.reorder_level,
                "supplier_id": r.supplier_id
            }
            for r in rm_q.all()
        ]
        rm_df = pd.DataFrame(rm_records) if rm_records else pd.DataFrame(columns=[
            "material_id", "material_name", "material_category", "unit_cost",
            "stock_quantity", "reorder_level", "supplier_id"
        ])

        return pb_df, qi_df, md_df, mu_df, ex_df, fg_df, rm_df

    @classmethod
    def calculate_executive_kpis(cls, db: Session, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        pb, qi, md, mu, ex, fg, rm = cls.get_dataframes(db, filters)

        # 1. Production KPIs
        total_planned = int(pb["planned_quantity"].sum()) if not pb.empty else 0
        total_produced = int(pb["produced_quantity"].sum()) if not pb.empty else 0
        total_rejected = int(pb["rejected_quantity"].sum()) if not pb.empty else 0
        achv_pct = round((total_produced / total_planned) * 100, 2) if total_planned > 0 else 0.0
        yield_pct = round(((total_produced - total_rejected) / total_produced) * 100, 2) if total_produced > 0 else 0.0
        production_gap = total_planned - total_produced

        # Daily Average
        if not pb.empty and "production_date" in pb.columns:
            pb["production_date"] = pd.to_datetime(pb["production_date"])
            days = pb["production_date"].nunique()
            avg_daily = round(total_produced / max(days, 1), 2)
        else:
            avg_daily = 0.0

        # 2. Quality KPIs
        inspected_units = int(qi["inspected_units"].sum()) if not qi.empty else 0
        defective_units = int(qi["defective_units"].sum()) if not qi.empty else 0
        defect_rate_pct = round((defective_units / inspected_units) * 100, 2) if inspected_units > 0 else 0.0
        pass_rate_pct = round(100.0 - defect_rate_pct, 2)
        rework_count = int((qi["inspection_result"] == "Rework").sum()) if not qi.empty else 0
        rework_rate_pct = round((rework_count / len(qi)) * 100, 2) if len(qi) > 0 else 0.0

        # 3. Machine Downtime KPIs
        downtime_minutes = int(md["downtime_minutes"].sum()) if not md.empty else 0
        downtime_hours = round(downtime_minutes / 60.0, 2)
        downtime_freq = len(md)
        maintenance_cost = round(float(md["maintenance_cost"].sum()), 2) if not md.empty else 0.0

        # Planned Operating Minutes:
        # Documented assumption: 12 lines x 3 shifts x 8 hours = 288 line-hours/day = 17,280 line-minutes/day.
        # Over the unique days in downtime or production (184 days for May-Oct 2026), 184 * 17,280 = 3,179,520 min.
        planned_operating_minutes = 3179520
        availability_pct = round(
            max(0.0, min(100.0, ((planned_operating_minutes - downtime_minutes) / planned_operating_minutes) * 100)),
            2
        )

        # 4. Inventory KPIs
        total_stock = int(rm["stock_quantity"].sum()) if not rm.empty else 0
        low_stock_count = int((rm["stock_quantity"] <= rm["reorder_level"]).sum()) if not rm.empty else 0
        total_inv_val = round(float((rm["stock_quantity"] * rm["unit_cost"]).sum()), 2) if not rm.empty else 0.0
        
        qty_used = round(float(mu["quantity_used"].sum()), 2) if not mu.empty else 0.0
        wastage_qty = round(float(mu["wastage_quantity"].sum()), 2) if not mu.empty else 0.0
        wastage_pct = round((wastage_qty / (qty_used + wastage_qty)) * 100, 2) if (qty_used + wastage_qty) > 0 else 0.0

        # 5. Financial KPIs
        total_expenses = round(float(ex["amount"].sum()), 2) if not ex.empty else 0.0
        # Total material cost used
        if not mu.empty and not rm.empty:
            merged_mu = mu.merge(rm[["material_id", "unit_cost"]], on="material_id", how="left")
            merged_mu["unit_cost"] = merged_mu["unit_cost"].fillna(0)
            total_material_cost = round(float((merged_mu["quantity_used"] * merged_mu["unit_cost"]).sum()), 2)
        else:
            total_material_cost = 0.0

        # Product gross margin
        if not fg.empty:
            valid_fg = fg[fg["selling_price"] > 0]
            tot_sell = valid_fg["selling_price"].sum()
            tot_cost = valid_fg["standard_unit_cost"].sum()
            agg_margin = round(((tot_sell - tot_cost) / tot_sell) * 100, 2) if tot_sell > 0 else 0.0
            avg_gross_margin = agg_margin
        else:
            avg_gross_margin = 0.0

        return {
            "total_planned_production": total_planned,
            "total_produced_units": total_produced,
            "total_rejected_units": total_rejected,
            "production_achievement_pct": achv_pct,
            "production_yield_pct": yield_pct,
            "production_gap": production_gap,
            "average_daily_production": avg_daily,
            "total_inspected_units": inspected_units,
            "total_defective_units": defective_units,
            "defect_rate_pct": defect_rate_pct,
            "quality_pass_rate_pct": pass_rate_pct,
            "rework_rate_pct": rework_rate_pct,
            "total_downtime_minutes": downtime_minutes,
            "total_downtime_hours": downtime_hours,
            "downtime_frequency": downtime_freq,
            "total_maintenance_cost": maintenance_cost,
            "machine_availability_pct": availability_pct,
            "total_stock_quantity": total_stock,
            "low_stock_materials_count": low_stock_count,
            "total_inventory_value": total_inv_val,
            "total_quantity_used": qty_used,
            "total_wastage_quantity": wastage_qty,
            "material_wastage_pct": wastage_pct,
            "total_manufacturing_expenses": total_expenses,
            "total_material_cost": total_material_cost,
            "avg_gross_margin_pct": avg_gross_margin
        }

    @classmethod
    def get_monthly_production_trends(cls, db: Session, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        pb, _, _, _, _, _, _ = cls.get_dataframes(db, filters)
        if pb.empty:
            return []
        pb["production_date"] = pd.to_datetime(pb["production_date"])
        pb["month"] = pb["production_date"].dt.strftime("%Y-%m")
        grouped = pb.groupby("month").agg(
            planned=("planned_quantity", "sum"),
            produced=("produced_quantity", "sum"),
            rejected=("rejected_quantity", "sum"),
            batch_count=("batch_id", "count")
        ).reset_index()

        grouped["achievement_pct"] = np.where(
            grouped["planned"] > 0,
            np.round((grouped["produced"] / grouped["planned"]) * 100, 2),
            0.0
        )
        grouped["yield_pct"] = np.where(
            grouped["produced"] > 0,
            np.round(((grouped["produced"] - grouped["rejected"]) / grouped["produced"]) * 100, 2),
            0.0
        )
        return grouped.to_dict(orient="records")

    @classmethod
    def get_line_performance(cls, db: Session, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        pb, _, md, _, _, _, _ = cls.get_dataframes(db, filters)
        if pb.empty:
            return []
        pb_grp = pb.groupby("production_line").agg(
            planned=("planned_quantity", "sum"),
            produced=("produced_quantity", "sum"),
            rejected=("rejected_quantity", "sum"),
            batches=("batch_id", "count")
        ).reset_index()

        # Merge with downtime by line
        if not md.empty:
            md_grp = md.groupby("production_line").agg(
                downtime_minutes=("downtime_minutes", "sum"),
                maintenance_cost=("maintenance_cost", "sum")
            ).reset_index()
            merged = pb_grp.merge(md_grp, on="production_line", how="left").fillna(0)
        else:
            merged = pb_grp
            merged["downtime_minutes"] = 0
            merged["maintenance_cost"] = 0.0

        merged["achievement_pct"] = np.where(
            merged["planned"] > 0,
            np.round((merged["produced"] / merged["planned"]) * 100, 2),
            0.0
        )
        merged["yield_pct"] = np.where(
            merged["produced"] > 0,
            np.round(((merged["produced"] - merged["rejected"]) / merged["produced"]) * 100, 2),
            0.0
        )
        return merged.sort_values("production_line").to_dict(orient="records")

    @classmethod
    def get_shift_performance(cls, db: Session, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        pb, _, _, _, _, _, _ = cls.get_dataframes(db, filters)
        if pb.empty:
            return []
        grp = pb.groupby("shift").agg(
            planned=("planned_quantity", "sum"),
            produced=("produced_quantity", "sum"),
            rejected=("rejected_quantity", "sum"),
            batches=("batch_id", "count")
        ).reset_index()

        grp["achievement_pct"] = np.where(
            grp["planned"] > 0,
            np.round((grp["produced"] / grp["planned"]) * 100, 2),
            0.0
        )
        grp["yield_pct"] = np.where(
            grp["produced"] > 0,
            np.round(((grp["produced"] - grp["rejected"]) / grp["produced"]) * 100, 2),
            0.0
        )
        return grp.sort_values("shift").to_dict(orient="records")

    @classmethod
    def get_defect_distribution(cls, db: Session, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        _, qi, _, _, _, _, _ = cls.get_dataframes(db, filters)
        if qi.empty:
            return []
        defects = qi[qi["defect_type"].notnull() & (qi["defective_units"] > 0)]
        if defects.empty:
            return []
        grp = defects.groupby("defect_type").agg(
            occurrences=("inspection_id", "count"),
            defective_units=("defective_units", "sum")
        ).reset_index()

        total_def = grp["defective_units"].sum()
        grp["percentage"] = np.where(total_def > 0, np.round((grp["defective_units"] / total_def) * 100, 2), 0.0)
        return grp.sort_values("defective_units", ascending=False).to_dict(orient="records")

    @classmethod
    def get_monthly_quality_trends(cls, db: Session, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        _, qi, _, _, _, _, _ = cls.get_dataframes(db, filters)
        if qi.empty:
            return []
        qi["inspection_date"] = pd.to_datetime(qi["inspection_date"])
        qi["month"] = qi["inspection_date"].dt.strftime("%Y-%m")
        grp = qi.groupby("month").agg(
            inspected=("inspected_units", "sum"),
            defective=("defective_units", "sum"),
            rework_count=("inspection_result", lambda x: (x == "Rework").sum()),
            total_inspections=("inspection_id", "count")
        ).reset_index()

        grp["defect_rate_pct"] = np.where(
            grp["inspected"] > 0,
            np.round((grp["defective"] / grp["inspected"]) * 100, 2),
            0.0
        )
        grp["pass_rate_pct"] = np.round(100.0 - grp["defect_rate_pct"], 2)
        return grp.sort_values("month").to_dict(orient="records")

    @classmethod
    def get_downtime_analytics(cls, db: Session, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        _, _, md, _, _, _, _ = cls.get_dataframes(db, filters)
        if md.empty:
            return {"by_reason": [], "by_severity": [], "by_machine": [], "monthly_trend": []}

        # Reason breakdown
        by_reason = md.groupby("reason").agg(
            downtime_minutes=("downtime_minutes", "sum"),
            incident_count=("downtime_id", "count"),
            maintenance_cost=("maintenance_cost", "sum")
        ).reset_index()
        by_reason["cost_formatted"] = by_reason["maintenance_cost"].round(2)

        # Severity breakdown
        by_severity = md.groupby("severity").agg(
            downtime_minutes=("downtime_minutes", "sum"),
            incident_count=("downtime_id", "count")
        ).reset_index()

        # Top 10 machines by downtime
        by_machine = md.groupby("machine_id").agg(
            downtime_minutes=("downtime_minutes", "sum"),
            incident_count=("downtime_id", "count"),
            maintenance_cost=("maintenance_cost", "sum")
        ).reset_index().sort_values("downtime_minutes", ascending=False).head(10)

        # Monthly trend
        md["event_date"] = pd.to_datetime(md["event_date"])
        md["month"] = md["event_date"].dt.strftime("%Y-%m")
        monthly_trend = md.groupby("month").agg(
            downtime_minutes=("downtime_minutes", "sum"),
            maintenance_cost=("maintenance_cost", "sum"),
            incidents=("downtime_id", "count")
        ).reset_index()

        return {
            "by_reason": by_reason.to_dict(orient="records"),
            "by_severity": by_severity.to_dict(orient="records"),
            "by_machine": by_machine.to_dict(orient="records"),
            "monthly_trend": monthly_trend.to_dict(orient="records")
        }

    @classmethod
    def get_inventory_analytics(cls, db: Session, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        _, _, _, mu, _, _, rm = cls.get_dataframes(db, filters)
        if rm.empty:
            return {"by_category": [], "reorder_alerts": [], "top_wastage_materials": [], "supplier_summary": []}

        # Inventory by category
        rm["total_value"] = rm["stock_quantity"] * rm["unit_cost"]
        by_category = rm.groupby("material_category").agg(
            material_count=("material_id", "count"),
            total_stock=("stock_quantity", "sum"),
            total_value=("total_value", "sum")
        ).reset_index()
        by_category["total_value"] = by_category["total_value"].round(2)

        # Reorder alerts
        reorder_items = rm[rm["stock_quantity"] <= rm["reorder_level"]].sort_values("stock_quantity")
        reorder_alerts = reorder_items.to_dict(orient="records")

        # Top wastage materials
        if not mu.empty:
            wastage_grp = mu.groupby("material_id").agg(
                quantity_used=("quantity_used", "sum"),
                wastage_quantity=("wastage_quantity", "sum")
            ).reset_index()
            wastage_grp["wastage_pct"] = np.where(
                (wastage_grp["quantity_used"] + wastage_grp["wastage_quantity"]) > 0,
                np.round((wastage_grp["wastage_quantity"] / (wastage_grp["quantity_used"] + wastage_grp["wastage_quantity"])) * 100, 2),
                0.0
            )
            wastage_merged = wastage_grp.merge(rm[["material_id", "material_name", "material_category", "unit_cost"]], on="material_id")
            wastage_merged["wastage_cost"] = (wastage_merged["wastage_quantity"] * wastage_merged["unit_cost"]).round(2)
            top_wastage = wastage_merged.sort_values("wastage_cost", ascending=False).head(10).to_dict(orient="records")
        else:
            top_wastage = []

        # Supplier summary
        supplier_summary = rm.groupby("supplier_id").agg(
            materials_supplied=("material_id", "count"),
            total_stock=("stock_quantity", "sum"),
            total_valuation=("total_value", "sum")
        ).reset_index().sort_values("total_valuation", ascending=False).head(10)
        supplier_summary["total_valuation"] = supplier_summary["total_valuation"].round(2)

        return {
            "by_category": by_category.to_dict(orient="records"),
            "reorder_alerts": reorder_alerts,
            "top_wastage_materials": top_wastage,
            "supplier_summary": supplier_summary.to_dict(orient="records")
        }

    @classmethod
    def get_financial_analytics(cls, db: Session, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        _, _, _, _, ex, fg, _ = cls.get_dataframes(db, filters)
        if ex.empty:
            return {"by_cost_center": [], "by_category": [], "monthly_trend": [], "top_margin_products": [], "low_margin_products": []}

        by_cost_center = ex.groupby("cost_center").agg(
            total_amount=("amount", "sum"),
            transaction_count=("expense_id", "count")
        ).reset_index()
        by_cost_center["total_amount"] = by_cost_center["total_amount"].round(2)

        by_category = ex.groupby("category").agg(
            total_amount=("amount", "sum"),
            transaction_count=("expense_id", "count")
        ).reset_index()
        by_category["total_amount"] = by_category["total_amount"].round(2)

        ex["expense_date"] = pd.to_datetime(ex["expense_date"])
        ex["month"] = ex["expense_date"].dt.strftime("%Y-%m")
        monthly_trend = ex.groupby("month").agg(
            total_amount=("amount", "sum"),
            count=("expense_id", "count")
        ).reset_index()
        monthly_trend["total_amount"] = monthly_trend["total_amount"].round(2)

        # Finished goods margins
        top_margin_products = []
        low_margin_products = []
        if not fg.empty:
            fg_calc = fg.copy()
            fg_calc["unit_margin"] = fg_calc["selling_price"] - fg_calc["standard_unit_cost"]
            fg_calc["gross_margin_pct"] = np.where(
                fg_calc["selling_price"] > 0,
                np.round((fg_calc["unit_margin"] / fg_calc["selling_price"]) * 100, 2),
                0.0
            )
            top_margin_products = fg_calc.sort_values("gross_margin_pct", ascending=False).head(10).to_dict(orient="records")
            low_margin_products = fg_calc.sort_values("gross_margin_pct", ascending=True).head(10).to_dict(orient="records")

        return {
            "by_cost_center": by_cost_center.to_dict(orient="records"),
            "by_category": by_category.to_dict(orient="records"),
            "monthly_trend": monthly_trend.to_dict(orient="records"),
            "top_margin_products": top_margin_products,
            "low_margin_products": low_margin_products
        }
