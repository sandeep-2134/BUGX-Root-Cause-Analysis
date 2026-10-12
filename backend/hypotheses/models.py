from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from backend.evidence.models import EvidenceItem

class HypothesisStatus(str, Enum):
    SUPPORTED = "supported"
    NEEDS_VALIDATION = "needs_validation"
    UNTESTED = "untested"
    REJECTED = "rejected"
    UNVERIFIED = "unverified"

class Hypothesis(BaseModel):
    id: str  # e.g., "H1", "H2"
    title: str
    description: str
    confidence: float = Field(ge=0.0, le=1.0)
    evidence: List[EvidenceItem] = Field(default_factory=list)
    evidence_ids: List[str] = Field(default_factory=list)
    predictions: List[str] = Field(default_factory=list)
    validation_tests: List[str] = Field(default_factory=list)
    tests: List[str] = Field(default_factory=list)
    contradictions: List[str] = Field(default_factory=list)
    status: HypothesisStatus = HypothesisStatus.NEEDS_VALIDATION

class CausalStep(BaseModel):
    step: int
    component: str
    action: str

class RootCause(BaseModel):
    summary: str
    description: Optional[str] = None
    primary_hypothesis_id: str
    supporting_evidence_ids: List[str] = Field(default_factory=list)
    contradicting_evidence_ids: List[str] = Field(default_factory=list)
    causal_chain: List[CausalStep] = Field(default_factory=list)
    status: str = "supported"

class ActivityEvent(BaseModel):
    timestamp: float
    message: str
    type: str = "info"
    stage: str = "Pipeline"

class InvestigationResult(BaseModel):
    hypotheses: List[Hypothesis] = Field(default_factory=list)
    root_cause: Optional[RootCause] = None
