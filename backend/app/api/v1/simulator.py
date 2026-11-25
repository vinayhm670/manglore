from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.all_schemas import SimulationControlRequest
from app.services.simulator_service import simulator_service

router = APIRouter(prefix="/simulator", tags=["Wearable Telemetry Simulator"])

@router.post("/next/{patient_id}")
async def generate_simulated_vital(
    patient_id: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await simulator_service.generate_next_reading(db, patient_id=patient_id, force_deterioration=False)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/deteriorate/{patient_id}")
async def simulate_deterioration(
    patient_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Introduces 3-day physiological decline and processes through real anomaly detector."""
    try:
        result = await simulator_service.generate_next_reading(db, patient_id=patient_id, force_deterioration=True)
        return {
            "status": "deterioration_active",
            "message": "Health deterioration injected. Vital readings processed through ensemble anomaly pipeline.",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/reset/{patient_id}")
async def reset_simulation(patient_id: str):
    simulator_service.reset_deterioration(patient_id)
    return {"status": "success", "message": "Simulation reset to patient's normal baseline trajectory"}
