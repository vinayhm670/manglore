from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.entities import User, Patient, VitalReading, HealthBaseline, Alert
from app.schemas.all_schemas import PatientResponse, VitalReadingResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("/", response_model=List[PatientResponse])
async def list_patients(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # If clinician, caregiver, or admin: return patient list
    # If patient: return only own profile
    if current_user.role in ["doctor", "admin", "caregiver"]:
        q = await db.execute(select(Patient, User).join(User, Patient.user_id == User.id))
        rows = q.all()
        results = []
        for pat, u in rows:
            p_data = PatientResponse.model_validate(pat)
            p_data.full_name = u.full_name
            p_data.email = u.email
            results.append(p_data)
        return results
    else:
        q = await db.execute(
            select(Patient, User)
            .join(User, Patient.user_id == User.id)
            .where(Patient.user_id == current_user.id)
        )
        row = q.first()
        if not row:
            return []
        pat, u = row
        p_data = PatientResponse.model_validate(pat)
        p_data.full_name = u.full_name
        p_data.email = u.email
        return [p_data]

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient_profile(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    q = await db.execute(
        select(Patient, User)
        .join(User, Patient.user_id == User.id)
        .where(Patient.id == patient_id)
    )
    row = q.first()
    if not row:
        raise HTTPException(status_code=404, detail="Patient profile not found")
        
    pat, u = row
    # Patient can only access own profile unless doctor/caregiver/admin
    if current_user.role == "patient" and pat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to patient profile")
        
    p_data = PatientResponse.model_validate(pat)
    p_data.full_name = u.full_name
    p_data.email = u.email
    return p_data

@router.get("/{patient_id}/summary")
async def get_patient_summary(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify access
    q = await db.execute(select(Patient, User).join(User, Patient.user_id == User.id).where(Patient.id == patient_id))
    row = q.first()
    if not row:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    pat, u = row
    if current_user.role == "patient" and pat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to patient record")

    # Get latest vitals
    q_vital = await db.execute(
        select(VitalReading)
        .where(VitalReading.patient_id == patient_id)
        .order_by(desc(VitalReading.timestamp))
        .limit(1)
    )
    latest_vital = q_vital.scalars().first()

    # Get active alerts
    q_alerts = await db.execute(
        select(Alert)
        .where(Alert.patient_id == patient_id, Alert.status == "active")
        .order_by(desc(Alert.timestamp))
    )
    active_alerts = q_alerts.scalars().all()

    # Get baseline summary
    q_baselines = await db.execute(
        select(HealthBaseline).where(HealthBaseline.patient_id == patient_id)
    )
    baselines = {b.metric: {"mean": b.mean, "std_dev": b.std_dev, "p10": b.p10, "p90": b.p90} for b in q_baselines.scalars().all()}

    return {
        "patient": {
            "id": pat.id,
            "full_name": u.full_name,
            "age": pat.age,
            "gender": pat.gender,
            "conditions": pat.medical_conditions,
            "risk_score": pat.current_risk_score,
            "risk_level": pat.current_risk_level,
            "wearable_connected": pat.wearable_connected,
            "wearable_device_name": pat.wearable_device_name,
            "emergency_contact": pat.emergency_contact_name,
            "emergency_phone": pat.emergency_contact_phone,
        },
        "latest_vitals": latest_vital,
        "active_alerts_count": len(active_alerts),
        "active_alerts": active_alerts,
        "baselines": baselines
    }
