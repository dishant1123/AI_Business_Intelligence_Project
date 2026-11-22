import sys, os, uuid
sys.path.insert(0, os.path.abspath("backend"))

# Set local appdata for crewai
storage_dir = os.path.abspath("storage")
os.makedirs(os.path.join(storage_dir, "appdata"), exist_ok=True)
os.environ["LOCALAPPDATA"] = os.path.join(storage_dir, "appdata")

from app.core.database import SessionLocal
from app.models.analysis import AnalysisRun, AgentLog, Recommendation
from app.agents.crew import ManufacturingCrewOrchestrator

db = SessionLocal()
analysis_id = str(uuid.uuid4())
try:
    print(f"Creating AnalysisRun ID: {analysis_id}")
    run = AnalysisRun(id=analysis_id, trigger_type="TEST", status="PENDING")
    db.add(run)
    db.commit()

    print("Executing Multi-Agent Workflow synchronously...")
    ManufacturingCrewOrchestrator._execute_workflow(analysis_id)

    # Re-query
    completed_run = db.query(AnalysisRun).filter(AnalysisRun.id == analysis_id).first()
    print("\nWorkflow Execution Status:", completed_run.status)
    print("Verified:", completed_run.verified)
    print("Confidence Score:", completed_run.confidence_score)
    print("Verification Notes:", completed_run.verification_notes)

    logs = db.query(AgentLog).filter(AgentLog.analysis_id == analysis_id).all()
    print(f"\nTotal Agent Logs Generated: {len(logs)}")
    for l in logs:
        print(f"  [{l.status}] {l.agent_name} ({l.agent_role}) - Output length: {len(l.output_text) if l.output_text else 0} chars")

    recs = db.query(Recommendation).filter(Recommendation.analysis_id == analysis_id).all()
    print(f"\nTotal Recommendations Created: {len(recs)}")
    for r in recs:
        print(f"  - [{r.priority}] {r.problem[:60]}... -> Timeline: {r.implementation_timeline}, Dept: {r.responsible_department}")

finally:
    db.close()
