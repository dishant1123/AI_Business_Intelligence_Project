import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Ensure local storage path for CrewAI/AppData
storage_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "storage"))
os.makedirs(os.path.join(storage_dir, "appdata"), exist_ok=True)
os.makedirs(os.path.join(storage_dir, "reports"), exist_ok=True)
os.makedirs(os.path.join(storage_dir, "uploads"), exist_ok=True)
os.makedirs(os.path.join(storage_dir, "models"), exist_ok=True)
os.environ["LOCALAPPDATA"] = os.path.join(storage_dir, "appdata")

from app.core.database import engine, Base, SessionLocal
from app.models import *
from app.core.security import get_password_hash
from app.services.data_ingestion import DataIngestionService

def init_db():
    print("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    db = SessionLocal()
    try:
        # Check if users already exist
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            print("Seeding default users...")
            users = [
                User(
                    username="admin",
                    email="admin@manufacturing.ai",
                    hashed_password=get_password_hash("admin123"),
                    full_name="Plant Executive Administrator",
                    role="ADMIN"
                ),
                User(
                    username="manager",
                    email="manager@manufacturing.ai",
                    hashed_password=get_password_hash("manager123"),
                    full_name="Plant Operations Manager",
                    role="MANAGER"
                ),
                User(
                    username="analyst",
                    email="analyst@manufacturing.ai",
                    hashed_password=get_password_hash("analyst123"),
                    full_name="Senior Manufacturing Analyst",
                    role="ANALYST"
                )
            ]
            db.add_all(users)
            db.commit()
            print("Default users seeded (admin/admin123, manager/manager123, analyst/analyst123).")
        else:
            print("Users already exist.")

        # Ingest Excel dataset
        candidate_paths = [
            os.path.abspath("04_Manufacturing.xlsx"),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "04_Manufacturing.xlsx")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "04_Manufacturing.xlsx"))
        ]
        excel_path = None
        for p in candidate_paths:
            if os.path.exists(p):
                excel_path = p
                break

        if excel_path and os.path.exists(excel_path):
            print(f"Ingesting dataset from {excel_path}...")
            res = DataIngestionService.import_excel_workbook(excel_path, db)
            print("Dataset imported successfully:", res["counts"])
        else:
            print("Warning: 04_Manufacturing.xlsx not found in candidate paths:", candidate_paths)

    finally:
        db.close()

if __name__ == "__main__":
    init_db()
