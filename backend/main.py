import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db, AsyncSessionLocal
from app.services.seed_data import seed_initial_data
from app.api.v1.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seed realistic demo data
    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_initial_data(session)
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Advanced AI-Powered Wearable Health Monitoring & Early Warning Platform. Build4Karnataka & Nitte Pharma Innovation Centre.",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "platform": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "innovation_partner": "Nitte Pharma Innovation Centre",
        "hackathon": "Build4Karnataka",
        "docs_url": "/docs",
        "status": "online"
    }

@app.get("/health")
@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": "demonstration_production_ready",
        "demo_mode": settings.DEMO_MODE,
        "api_version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
