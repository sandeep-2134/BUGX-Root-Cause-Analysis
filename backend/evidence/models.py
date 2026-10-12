from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class EvidenceType(str, Enum):
    SOURCE_CODE = "source_code"
    STACK_TRACE = "stack_trace"
    LOG = "log"
    HTTP_REQUEST = "http_request"
    HTTP_RESPONSE = "http_response"
    DATABASE = "database"
    NETWORK = "network"
    BROWSER = "browser"
    TEST_RESULT = "test_result"
    COMMAND_OUTPUT = "command_output"

class EvidenceItem(BaseModel):
    id: str = "E1"
    type: EvidenceType = EvidenceType.SOURCE_CODE
    source: str = "repository"
    file: Optional[str] = None
    line: Optional[int] = None
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    description: str
    snippet: Optional[str] = None
    verified: bool = True
    unverified_reason: Optional[str] = None

class EvidenceCollection(BaseModel):
    items: List[EvidenceItem] = Field(default_factory=list)
    total_count: int = 0
