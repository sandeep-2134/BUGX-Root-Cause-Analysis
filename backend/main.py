from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.core.logging import logger
from backend.api.routes import health, repository, investigation

app = FastAPI(
    title="BUGX Backend API",
    description="Evidence-Based Autonomous Debugging & Root-Cause Analysis System",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health.router, prefix="/api")
app.include_router(repository.router, prefix="/api")
app.include_router(investigation.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "BUGX Backend API is running.",
        "frontend_url": "http://localhost:3000",
        "api_docs": "http://localhost:8000/docs",
        "health_check": "http://localhost:8000/api/health"
    }

@app.on_event("startup")
async def startup_event():
    logger.info(f"BUGX Backend starting on {settings.HOST}:{settings.PORT} [LLM Provider: {settings.LLM_PROVIDER}]")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
