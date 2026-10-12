import asyncio
import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks
from backend.api.schemas.investigation import (
    CreateInvestigationRequest,
    CreateInvestigationResponse,
    InvestigationStatusResponse
)
from backend.agents.orchestrator import orchestrator
from backend.core.exceptions import RepositoryError

logger = logging.getLogger("bugx")

router = APIRouter(prefix="/investigations", tags=["Investigation"])

@router.post("", response_model=CreateInvestigationResponse)
async def start_investigation(
    payload: CreateInvestigationRequest,
    background_tasks: BackgroundTasks
):
    try:
        record = orchestrator.create_investigation(
            repository_url=payload.repository_url,
            bug_report=payload.bug_report,
            mode=payload.mode or "WHY"
        )
        
        # Schedule background pipeline execution
        background_tasks.add_task(orchestrator.run_pipeline, record)
        
        return CreateInvestigationResponse(
            id=record.id,
            status="started",
            message="Investigation pipeline initiated in background."
        )
    except RepositoryError as re:
        raise HTTPException(status_code=400, detail=str(re))
    except Exception as e:
        logger.error(f"Error starting investigation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error starting investigation.")

@router.get("/{investigation_id}", response_model=InvestigationStatusResponse)
async def get_investigation_status(investigation_id: str):
    record = orchestrator.get_investigation(investigation_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")
    return record.to_dict()

@router.get("/{investigation_id}/events")
async def get_investigation_events(investigation_id: str):
    record = orchestrator.get_investigation(investigation_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")
    return {"events": record.activity_events}

@router.get("/{investigation_id}/hypotheses")
async def get_investigation_hypotheses(investigation_id: str):
    record = orchestrator.get_investigation(investigation_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")
    hypotheses = record.investigation_result.hypotheses if record.investigation_result else []
    return {"hypotheses": [h.model_dump() for h in hypotheses]}

@router.get("/{investigation_id}/evidence")
async def get_investigation_evidence(investigation_id: str):
    record = orchestrator.get_investigation(investigation_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")
    return record.evidence_report

@router.get("/{investigation_id}/root-cause")
async def get_investigation_root_cause(investigation_id: str):
    record = orchestrator.get_investigation(investigation_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")
    root_cause = record.investigation_result.root_cause if record.investigation_result else None
    return {"root_cause": root_cause.model_dump() if root_cause else None}

@router.get("/{investigation_id}/reproduction")
async def get_investigation_reproduction(investigation_id: str):
    record = orchestrator.get_investigation(investigation_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")
    return {
        "reproduction_result": record.reproduction_result.model_dump() if record.reproduction_result else None
    }

@router.post("/{investigation_id}/reproduce")
async def trigger_investigation_reproduction(investigation_id: str, background_tasks: BackgroundTasks):
    record = orchestrator.get_investigation(investigation_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")
    return {
        "id": investigation_id,
        "status": "reproduction_started",
        "message": "Reproduction execution triggered."
    }

@router.get("", response_model=list)
async def list_investigations():
    return [rec.to_dict() for rec in orchestrator.storage.values()]
