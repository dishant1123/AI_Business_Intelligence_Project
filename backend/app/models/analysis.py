from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(String(36), primary_key=True, index=True)
    trigger_type = Column(String(32), default="MANUAL")
    status = Column(String(32), default="PENDING", index=True)  # PENDING, RUNNING, COMPLETED, FAILED, VERIFIED
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    metrics_summary = Column(JSON, nullable=True)
    executive_summary = Column(Text, nullable=True)
    verified = Column(Boolean, default=False)
    verification_notes = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)

    agent_logs = relationship("AgentLog", back_populates="analysis", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="analysis", cascade="all, delete-orphan")

class AgentLog(Base):
    __tablename__ = "agent_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(String(36), ForeignKey("analysis_runs.id"), nullable=False, index=True)
    agent_name = Column(String(64), nullable=False)
    agent_role = Column(String(128), nullable=False)
    status = Column(String(32), default="PENDING")  # PENDING, RUNNING, COMPLETED, FAILED, VERIFIED
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    input_context = Column(Text, nullable=True)
    output_text = Column(Text, nullable=True)
    structured_data = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)

    analysis = relationship("AnalysisRun", back_populates="agent_logs")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String(36), primary_key=True, index=True)
    analysis_id = Column(String(36), ForeignKey("analysis_runs.id"), nullable=False, index=True)
    problem = Column(Text, nullable=False)
    supporting_evidence = Column(Text, nullable=False)
    business_impact = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    priority = Column(String(16), default="MEDIUM", index=True)  # HIGH, MEDIUM, LOW
    expected_benefit = Column(Text, nullable=False)
    implementation_timeline = Column(String(64), nullable=False)
    responsible_department = Column(String(64), nullable=False)
    kpi_to_monitor = Column(String(128), nullable=False)
    status = Column(String(32), default="PENDING_REVIEW", index=True)  # PENDING_REVIEW, APPROVED, REJECTED
    created_at = Column(DateTime, default=datetime.utcnow)

    analysis = relationship("AnalysisRun", back_populates="recommendations")
    decisions = relationship("ApprovalDecision", back_populates="recommendation", cascade="all, delete-orphan")

class ApprovalDecision(Base):
    __tablename__ = "approval_decisions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    recommendation_id = Column(String(36), ForeignKey("recommendations.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_name = Column(String(128), nullable=False)
    decision = Column(String(16), nullable=False)  # APPROVED, REJECTED
    comments = Column(Text, nullable=True)
    decided_at = Column(DateTime, default=datetime.utcnow)

    recommendation = relationship("Recommendation", back_populates="decisions")

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, index=True)
    analysis_id = Column(String(36), ForeignKey("analysis_runs.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    generated_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(32), default="READY")
    metadata_payload = Column(JSON, nullable=True)
