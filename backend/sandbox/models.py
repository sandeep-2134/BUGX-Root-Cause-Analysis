from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ReproductionStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    PREPARING = "PREPARING"
    DEPENDENCIES_FAILED = "DEPENDENCIES_FAILED"
    TEST_GENERATION_FAILED = "TEST_GENERATION_FAILED"
    RUNNING = "RUNNING"
    REPRODUCED = "REPRODUCED"
    NOT_REPRODUCED = "NOT_REPRODUCED"
    INCONCLUSIVE = "INCONCLUSIVE"
    TIMEOUT = "TIMEOUT"
    FAILED = "FAILED"
    UNSUPPORTED_PROJECT = "UNSUPPORTED_PROJECT"

class ReproductionPlan(BaseModel):
    scenario: str
    steps: List[str] = Field(default_factory=list)
    expected: str
    actual: str
    test_command: str
    success_condition: str

class ReproductionAttempt(BaseModel):
    attempt_number: int
    exit_code: int
    passed: bool
    duration_ms: float
    stdout: str
    stderr: str

class ReproductionResult(BaseModel):
    status: ReproductionStatus = ReproductionStatus.NOT_STARTED
    attempts: int = 0
    failures: int = 0
    success_rate: float = 0.0
    expected: Optional[str] = None
    actual: Optional[str] = None
    exit_code: Optional[int] = None
    duration_ms: float = 0.0
    stdout: str = ""
    stderr: str = ""
    evidence_ids: List[str] = Field(default_factory=list)
    plan: Optional[ReproductionPlan] = None
    environment_info: Dict[str, Any] = Field(default_factory=dict)
    detailed_attempts: List[ReproductionAttempt] = Field(default_factory=list)
    unsupported_reason: Optional[str] = None
