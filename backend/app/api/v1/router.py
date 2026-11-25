from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.patients import router as patients_router
from app.api.v1.vitals import router as vitals_router
from app.api.v1.baselines import router as baselines_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.companion import router as companion_router
from app.api.v1.simulator import router as simulator_router
from app.api.v1.reports import router as reports_router
from app.api.v1.emergency import router as emergency_router
from app.api.v1.connectivity import router as connectivity_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(patients_router)
api_router.include_router(vitals_router)
api_router.include_router(baselines_router)
api_router.include_router(alerts_router)
api_router.include_router(companion_router)
api_router.include_router(simulator_router)
api_router.include_router(reports_router)
api_router.include_router(emergency_router)
api_router.include_router(connectivity_router)
