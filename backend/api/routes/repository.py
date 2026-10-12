from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.analysis.repository import RepositoryAnalyzer

router = APIRouter(prefix="/repository", tags=["Repository"])

class ValidateRepoRequest(BaseModel):
    repository_url: str

@router.post("/validate")
async def validate_repository(payload: ValidateRepoRequest):
    analyzer = RepositoryAnalyzer()
    is_valid = analyzer.validate_url(payload.repository_url)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid GitHub repository URL format. Must be https://github.com/user/repo")
    return {"valid": True, "repository_url": payload.repository_url}
