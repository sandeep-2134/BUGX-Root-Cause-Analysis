from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class CreateInvestigationRequest(BaseModel):
    repository_url: str = Field(..., json_schema_extra={"example": "https://github.com/fastapi/fastapi"})
    bug_report: str = Field(..., min_length=10, json_schema_extra={"example": "Payment API returns HTTP 500 during retry attempt."})
    mode: Optional[str] = Field("WHY", json_schema_extra={"example": "WHY"})

class CreateInvestigationResponse(BaseModel):
    id: str
    status: str
    message: str

class InvestigationStatusResponse(BaseModel):
    id: str
    repository_url: str
    bug_report: str
    mode: str
    state: str
    created_at: float
    updated_at: float
    error_message: Optional[str] = None
    repository_info: Dict[str, Any] = Field(default_factory=dict)
    evidence_report: Dict[str, Any] = Field(default_factory=dict)
    investigation_result: Optional[Dict[str, Any]] = None
    reproduction_result: Optional[Dict[str, Any]] = None
    stages_log: Dict[str, Any] = Field(default_factory=dict)
    activity_events: List[Dict[str, Any]] = Field(default_factory=list)
