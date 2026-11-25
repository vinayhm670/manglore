from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.entities import EmergencyEvent, EmergencyAcknowledgement, NotificationLog
from app.services.emergency_service import emergency_service
from pydantic import BaseModel
from typing import Dict, Any, Optional

router = APIRouter(prefix="/emergency", tags=["Emergency Doctor Alerts & Escalation"])

class TriggerEmergencyRequest(BaseModel):
    patient_id: str
    title: str = "Severe Multi-Metric Physiological Deterioration"
    indicators: Dict[str, Any] = {"resting_heart_rate": 104, "spo2": 91.2, "hrv": 16.5}
    severity: str = "Critical"

class AcknowledgeEmergencyRequest(BaseModel):
    emergency_event_id: str
    doctor_id: str = "doc_1"
    clinical_notes: str = "Ambulatory review completed. Patient advised to rest in semi-Fowler position; follow-up vitals scheduled in 30 mins."
    contacted_patient: bool = True
    contacted_caregiver: bool = True

@router.post("/trigger")
async def trigger_emergency_alert(
    req: TriggerEmergencyRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        res = await emergency_service.trigger_critical_emergency(
            db=db,
            patient_id=req.patient_id,
            title=req.title,
            indicators=req.indicators,
            severity=req.severity
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/acknowledge")
async def doctor_acknowledge_emergency(
    req: AcknowledgeEmergencyRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        res = await emergency_service.acknowledge_emergency(
            db=db,
            emergency_event_id=req.emergency_event_id,
            doctor_id=req.doctor_id,
            clinical_notes=req.clinical_notes,
            contacted_patient=req.contacted_patient,
            contacted_caregiver=req.contacted_caregiver
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/active")
async def list_active_emergencies(db: AsyncSession = Depends(get_db)):
    q = await db.execute(
        select(EmergencyEvent)
        .order_by(desc(EmergencyEvent.timestamp))
        .limit(20)
    )
    events = q.scalars().all()
    return events

@router.get("/notifications")
async def list_notification_logs(db: AsyncSession = Depends(get_db)):
    q = await db.execute(
        select(NotificationLog)
        .order_by(desc(NotificationLog.sent_at))
        .limit(30)
    )
    logs = q.scalars().all()
    return logs
