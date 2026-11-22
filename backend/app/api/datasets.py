import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.api.auth import get_current_user, require_role
from app.models.manufacturing import (
    FinishedGoods, RawMaterials, ProductionBatches,
    QualityInspections, MaterialUsage, MachineDowntime,
    Expenses, DatasetImportHistory
)
from app.services.data_ingestion import DataIngestionService
from app.schemas.manufacturing import DatasetSummaryResponse

router = APIRouter(prefix="/datasets", tags=["Datasets"])

UPLOADS_DIR = os.path.abspath(settings.UPLOADS_DIR)
os.makedirs(UPLOADS_DIR, exist_ok=True)

@router.get("/summary", response_model=DatasetSummaryResponse)
def get_dataset_summary(db: Session = Depends(get_db)):
    fg_c = db.query(FinishedGoods).count()
    rm_c = db.query(RawMaterials).count()
    pb_c = db.query(ProductionBatches).count()
    qi_c = db.query(QualityInspections).count()
    mu_c = db.query(MaterialUsage).count()
    md_c = db.query(MachineDowntime).count()
    ex_c = db.query(Expenses).count()

    last_import = db.query(DatasetImportHistory).order_by(DatasetImportHistory.id.desc()).first()

    return {
        "total_finished_goods": fg_c,
        "total_raw_materials": rm_c,
        "total_batches": pb_c,
        "total_downtime_records": md_c,
        "total_inspections": qi_c,
        "total_usage_records": mu_c,
        "total_expenses": ex_c,
        "date_range_start": "2026-05-01",
        "date_range_end": "2026-10-31",
        "last_imported_at": last_import.imported_at if last_import else None
    }

@router.get("/history")
def get_import_history(db: Session = Depends(get_db)):
    history = db.query(DatasetImportHistory).order_by(DatasetImportHistory.id.desc()).limit(20).all()
    return history

@router.post("/import-seed")
def trigger_seed_import(db: Session = Depends(get_db), current_user = Depends(require_role(["ADMIN", "MANAGER"]))):
    excel_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "04_Manufacturing.xlsx"))
    if not os.path.exists(excel_path):
        excel_path = os.path.abspath("04_Manufacturing.xlsx")
    if not os.path.exists(excel_path):
        raise HTTPException(status_code=404, detail="Seed Excel dataset 04_Manufacturing.xlsx not found")
    
    result = DataIngestionService.import_excel_workbook(excel_path, db)
    return {"message": "Dataset successfully re-imported from master workbook", "result": result}

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["ADMIN", "MANAGER"]))
):
    if not (file.filename.endswith(".xlsx") or file.filename.endswith(".xls")):
        raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) are currently supported for multi-sheet import")

    save_path = os.path.join(UPLOADS_DIR, file.filename)
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        res = DataIngestionService.import_excel_workbook(save_path, db)
        return {
            "message": "File uploaded and processed successfully",
            "filename": file.filename,
            "summary": res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse and import dataset: {str(e)}")
