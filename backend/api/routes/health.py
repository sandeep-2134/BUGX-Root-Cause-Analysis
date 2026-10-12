from fastapi import APIRouter
from backend.core.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "BUGX Backend",
        "version": "1.0.0",
        "llm_provider": settings.LLM_PROVIDER
    }
