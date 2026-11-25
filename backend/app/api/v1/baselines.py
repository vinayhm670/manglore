from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.entities import HealthBaseline, Patient
from app.schemas.all_schemas import HealthBaselineResponse

router = APIRouter(prefix="/baselines", tags=["Health Baselines"])

@router.get("/{patient_id}", response_model=List[HealthBaselineResponse])
async def get_patient_baselines(
    patient_id: str,
    db: AsyncSession = Depends(get_db)
):
    q = await db.execute(
        select(HealthBaseline).where(HealthBaseline.patient_id == patient_id)
    )
    baselines = q.scalars().all()
    if not baselines:
        raise HTTPException(status_code=404, detail="No baseline data found for patient")
    return baselines
