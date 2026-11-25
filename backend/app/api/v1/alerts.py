from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.entities import Alert, Patient
from app.schemas.all_schemas import AlertResponse, AlertActionRequest
from app.api.deps import get_current_user

router = APIRouter(prefix="/alerts", tags=["Clinical Alerts"])

@router.get("/{patient_id}", response_model=List[AlertResponse])
async def get_patient_alerts(
    patient_id: str,
    severity: Optional[str] = Query(None, description="Normal, Watch, Warning, Critical"),
    status: Optional[str] = Query(None, description="active, acknowledged, snoozed"),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Alert).where(Alert.patient_id == patient_id)
    if severity and severity != "All":
        stmt = stmt.where(Alert.severity == severity)
    if status and status != "All":
        stmt = stmt.where(Alert.status == status)
    stmt = stmt.order_by(desc(Alert.timestamp))

    q = await db.execute(stmt)
    return q.scalars().all()

@router.post("/{alert_id}/action", response_model=AlertResponse)
async def perform_alert_action(
    alert_id: str,
    action_in: AlertActionRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    q = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = q.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    now = datetime.utcnow()
    if action_in.action == "acknowledge":
        alert.status = "acknowledged"
        alert.acknowledged_by = current_user.full_name
        alert.acknowledged_at = now
    elif action_in.action == "snooze":
        alert.status = "snoozed"
        alert.context_notes = f"Snoozed for {action_in.snooze_hours or 4} hours"
    elif action_in.action == "false_alarm":
        alert.false_alarm = True
        alert.status = "resolved"
        alert.context_notes = action_in.context_notes or "Marked as false alarm"
    elif action_in.action == "add_context":
        alert.context_notes = action_in.context_notes

    await db.commit()
    await db.refresh(alert)
    return alert
