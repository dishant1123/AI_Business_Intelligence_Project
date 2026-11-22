from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class AgentLogSchema(BaseModel):
    id: int
    analysis_id: str
    agent_name: str
    agent_role: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    input_context: Optional[str] = None
    output_text: Optional[str] = None
    structured_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True

class RecommendationSchema(BaseModel):
    id: str
    analysis_id: str
    problem: str
    supporting_evidence: str
    business_impact: str
    recommended_action: str
    priority: str
    expected_benefit: str
    implementation_timeline: str
    responsible_department: str
    kpi_to_monitor: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ApprovalDecisionCreate(BaseModel):
    decision: str  # APPROVED, REJECTED
    comments: Optional[str] = None

class ApprovalDecisionSchema(BaseModel):
    id: int
    recommendation_id: str
    user_id: int
    user_name: str
    decision: str
    comments: Optional[str] = None
    decided_at: datetime

    class Config:
        from_attributes = True

class AnalysisRunResponse(BaseModel):
    id: str
    trigger_type: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    metrics_summary: Optional[Dict[str, Any]] = None
    executive_summary: Optional[str] = None
    verified: bool
    verification_notes: Optional[str] = None
    confidence_score: Optional[float] = None
    agent_logs: List[AgentLogSchema] = []
    recommendations: List[RecommendationSchema] = []

    class Config:
        from_attributes = True

class ChatMessageRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = None

class ChatMessageResponse(BaseModel):
    response: str
    metrics: Optional[Dict[str, Any]] = None
    sources: Optional[List[str]] = None
    confidence: float = 1.0

class ReportSchema(BaseModel):
    id: str
    analysis_id: Optional[str] = None
    title: str
    file_path: str
    file_name: str
    file_size_bytes: int
    generated_at: datetime
    status: str
    metadata_payload: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
