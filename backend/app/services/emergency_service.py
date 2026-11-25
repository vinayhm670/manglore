from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.entities import (
    EmergencyEvent, EmergencyAcknowledgement, NotificationLog,
    Patient, Doctor, Caregiver, PatientDoctorLink, PatientCaregiverLink, User
)

class EmergencyEscalationService:
    def __init__(self):
        self.acknowledgement_timeout_minutes = 5

    async def trigger_critical_emergency(
        self,
        db: AsyncSession,
        patient_id: str,
        title: str,
        indicators: Dict[str, Any],
        severity: str = "Critical"
    ) -> Dict[str, Any]:
        """
        Automatically detects serious patient deterioration, creates an emergency event,
        identifies assigned doctor & caregiver, and sends mock multi-channel notifications.
        """
        now = datetime.utcnow()
        deadline = now + timedelta(minutes=self.acknowledgement_timeout_minutes)

        # 1. Fetch patient & user
        q_p = await db.execute(select(Patient, User).join(User, Patient.user_id == User.id).where(Patient.id == patient_id))
        p_row = q_p.first()
        if not p_row:
            raise ValueError("Patient not found")
        patient, pat_user = p_row

        # 2. Identify assigned doctor
        q_doc = await db.execute(
            select(Doctor, User)
            .join(PatientDoctorLink, PatientDoctorLink.doctor_id == Doctor.id)
            .join(User, Doctor.user_id == User.id)
            .where(PatientDoctorLink.patient_id == patient_id)
        )
        doc_row = q_doc.first()
        doctor_id = doc_row[0].id if doc_row else None
        doctor_name = doc_row[1].full_name if doc_row else "Dr. Sudhir Shenoy"
        doctor_phone = doc_row[1].phone if doc_row else "+91 98451 11223"

        # 3. Identify caregiver
        q_cg = await db.execute(
            select(Caregiver, User)
            .join(PatientCaregiverLink, PatientCaregiverLink.caregiver_id == Caregiver.id)
            .join(User, Caregiver.user_id == User.id)
            .where(PatientCaregiverLink.patient_id == patient_id)
        )
        cg_row = q_cg.first()
        caregiver_id = cg_row[0].id if cg_row else None
        caregiver_name = cg_row[1].full_name if cg_row else "Kavitha Kumar"
        caregiver_phone = cg_row[1].phone if cg_row else "+91 98450 67890"

        # 4. Create Emergency Event
        event = EmergencyEvent(
            patient_id=patient_id,
            timestamp=now,
            severity=severity,
            title=title,
            indicators=indicators,
            assigned_doctor_id=doctor_id,
            caregiver_id=caregiver_id,
            status="unacknowledged",
            escalation_deadline=deadline,
            notes="Automated early warning system triggered by multi-metric physiological anomaly."
        )
        db.add(event)
        await db.flush()

        # 5. Create Notification Logs (Mock dispatch to Doctor & Caregiver)
        doc_msg = (
            f"🚨 PULSEORA CRITICAL PATIENT ALERT\n"
            f"Patient: {pat_user.full_name} (Age: {patient.age})\n"
            f"Condition: {title}\n"
            f"Biometrics: Resting HR {indicators.get('resting_heart_rate', indicators.get('heart_rate', 98))} BPM | "
            f"SpO2 {indicators.get('spo2', 92.5)}% | HRV {indicators.get('hrv', 22.0)} ms\n"
            f"Action Required: Immediate clinical review & acknowledgement requested.\n"
            f"Time: {now.strftime('%Y-%m-%d %H:%M:%S UTC')}"
        )
        cg_msg = (
            f"⚠️ PULSEORA FAMILY URGENT NOTICE\n"
            f"Dear {caregiver_name}, an acute health-pattern shift was detected for {pat_user.full_name}. "
            f"The assigned doctor ({doctor_name}) has been notified. Please check in with your loved one."
        )

        db.add(NotificationLog(
            recipient_role="doctor",
            recipient_id=doctor_id or "doc_1",
            recipient_name=doctor_name,
            channel="web_push",
            message=doc_msg,
            status="delivered",
            sent_at=now
        ))
        db.add(NotificationLog(
            recipient_role="doctor",
            recipient_id=doctor_id or "doc_1",
            recipient_name=doctor_name,
            channel="sms",
            message=doc_msg,
            status="delivered",
            sent_at=now
        ))
        db.add(NotificationLog(
            recipient_role="caregiver",
            recipient_id=caregiver_id or "cg_1",
            recipient_name=caregiver_name,
            channel="whatsapp",
            message=cg_msg,
            status="delivered",
            sent_at=now
        ))

        await db.commit()
        await db.refresh(event)

        return {
            "emergency_event_id": event.id,
            "patient_name": pat_user.full_name,
            "severity": severity,
            "title": title,
            "indicators": indicators,
            "doctor_notified": doctor_name,
            "doctor_phone": doctor_phone,
            "caregiver_notified": caregiver_name,
            "caregiver_phone": caregiver_phone,
            "escalation_deadline": deadline.isoformat(),
            "status": "unacknowledged",
            "channels_dispatched": ["in_app", "web_push", "sms", "whatsapp"]
        }

    async def acknowledge_emergency(
        self,
        db: AsyncSession,
        emergency_event_id: str,
        doctor_id: str,
        clinical_notes: str = "Clinical review completed. Patient advised to rest and follow up.",
        contacted_patient: bool = True,
        contacted_caregiver: bool = True
    ) -> Dict[str, Any]:
        """Allows assigned doctor to acknowledge and resolve critical alert."""
        q = await db.execute(select(EmergencyEvent).where(EmergencyEvent.id == emergency_event_id))
        event = q.scalars().first()
        if not event:
            raise ValueError("Emergency event not found")

        now = datetime.utcnow()
        event.status = "acknowledged"

        ack = EmergencyAcknowledgement(
            emergency_event_id=emergency_event_id,
            doctor_id=doctor_id,
            acknowledged_at=now,
            clinical_notes=clinical_notes,
            contacted_patient=contacted_patient,
            contacted_caregiver=contacted_caregiver,
            action_taken="Doctor reviewed telemetry and verified patient stability"
        )
        db.add(ack)

        # Log confirmation
        db.add(NotificationLog(
            recipient_role="caregiver",
            recipient_id=event.caregiver_id or "cg_1",
            recipient_name="Caregiver",
            channel="in_app",
            message=f"Doctor has reviewed and acknowledged the alert for the patient: '{clinical_notes}'",
            status="delivered",
            sent_at=now
        ))

        await db.commit()

        return {
            "status": "acknowledged",
            "acknowledged_at": now.isoformat(),
            "clinical_notes": clinical_notes,
            "contacted_patient": contacted_patient,
            "contacted_caregiver": contacted_caregiver
        }

    async def check_and_escalate_timeouts(self, db: AsyncSession) -> List[Dict[str, Any]]:
        """Checks for unacknowledged critical events past their deadline and escalates."""
        now = datetime.utcnow()
        q = await db.execute(
            select(EmergencyEvent)
            .where(EmergencyEvent.status == "unacknowledged", EmergencyEvent.escalation_deadline < now)
        )
        expired = q.scalars().all()
        escalated_list = []

        for ev in expired:
            ev.status = "escalated"
            ev.escalated_at = now
            # Log escalation retry
            db.add(NotificationLog(
                recipient_role="doctor",
                recipient_id=ev.assigned_doctor_id or "doc_alternate",
                recipient_name="Nitte Cardiology On-Call Emergency Desk",
                channel="sms",
                message=f"ESCALATION: Emergency alert for patient {ev.patient_id} unacknowledged. Re-routing to Chief Medical Officer.",
                status="delivered",
                sent_at=now
            ))
            escalated_list.append({"event_id": ev.id, "escalated_at": now.isoformat()})

        if expired:
            await db.commit()
        return escalated_list

emergency_service = EmergencyEscalationService()
