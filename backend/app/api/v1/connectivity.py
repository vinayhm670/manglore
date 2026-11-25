from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.connectivity_service import connectivity_service

router = APIRouter(prefix="/connectivity", tags=["Network & Device Heartbeat Monitoring"])

@router.get("/status/{patient_id}")
async def get_connectivity_status(
    patient_id: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await connectivity_service.get_connectivity_status(db, patient_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/simulate-failure/{patient_id}")
async def simulate_network_failure(
    patient_id: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await connectivity_service.simulate_network_failure(db, patient_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/restore/{patient_id}")
async def restore_network_connection(
    patient_id: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await connectivity_service.restore_network(db, patient_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
