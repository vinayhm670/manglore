import random
import math
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.entities import Patient, VitalReading, HealthBaseline, Alert, RiskAssessment, AnomalyEvent
from app.ml.anomaly_engine import anomaly_engine

class WearableSimulatorService:
    def __init__(self):
        # In-memory simulator states per patient: {patient_id: {"is_running": bool, "deterioration_active": bool, "step": int, "speed": float}}
        self.states: Dict[str, Dict[str, Any]] = {}

    def get_state(self, patient_id: str) -> Dict[str, Any]:
        if patient_id not in self.states:
            self.states[patient_id] = {
                "is_running": True,
                "deterioration_active": False,
                "step": 0,
                "speed": 1.0,
                "last_generated_at": datetime.utcnow()
            }
        return self.states[patient_id]

    async def generate_next_reading(
        self,
        db: AsyncSession,
        patient_id: str,
        force_deterioration: bool = False
    ) -> Dict[str, Any]:
        state = self.get_state(patient_id)
        if force_deterioration:
            state["deterioration_active"] = True
            
        # Get patient & baselines
        q_pat = await db.execute(select(Patient).where(Patient.id == patient_id))
        pat = q_pat.scalars().first()
        if not pat:
            raise ValueError("Patient not found")

        q_base = await db.execute(select(HealthBaseline).where(HealthBaseline.patient_id == patient_id))
        baselines = {b.metric: {"mean": b.mean, "std_dev": b.std_dev, "p10": b.p10, "p90": b.p90} for b in q_base.scalars().all()}
        
        base_rhr = baselines.get("resting_heart_rate", {}).get("mean", 68.0)
        base_spo2 = baselines.get("spo2", {}).get("mean", 98.0)
        base_hrv = baselines.get("hrv", {}).get("mean", 40.0)
        base_rr = baselines.get("respiratory_rate", {}).get("mean", 16.0)

        now = datetime.utcnow()
        hour = now.hour
        is_night = 0 <= hour <= 6
        circadian_offset = -8.0 if is_night else 2.0

        if state["deterioration_active"]:
            state["step"] += 1
            step = min(state["step"], 10)
            
            # Progressive deterioration curve
            # 1. Rising Resting HR: +2.0 BPM per step up to +20 BPM
            hr_drift = step * 1.8 + random.uniform(-1.0, 1.5)
            # 2. Declining SpO2: -0.6% per step down to 92.5%
            spo2_drift = -(step * 0.55) + random.uniform(-0.2, 0.2)
            # 3. Reducing HRV: -2.5 ms per step
            hrv_drift = -(step * 2.2)
            # 4. Rising respiratory rate
            rr_drift = step * 0.7
            sleep_dur = 4.2
            sleep_qual = 52.0
            steps_cur = random.randint(100, 300)  # low activity during sickness
        else:
            hr_drift = random.uniform(-2.0, 2.0)
            spo2_drift = random.uniform(-0.4, 0.4)
            hrv_drift = random.uniform(-3.0, 3.0)
            rr_drift = random.uniform(-0.8, 0.8)
            sleep_dur = 7.4
            sleep_qual = 88.0
            steps_cur = random.randint(2800, 6200)

        # Compute final vitals
        rhr = round(max(50.0, base_rhr + hr_drift), 1)
        hr = round(rhr + circadian_offset + random.uniform(-2.0, 4.0), 1)
        spo2 = round(min(99.8, max(88.0, base_spo2 + spo2_drift)), 1)
        hrv = round(max(15.0, base_hrv + hrv_drift), 1)
        rr = round(max(12.0, base_rr + rr_drift), 1)
        skin_temp = round(36.6 + (0.8 if state["deterioration_active"] else random.uniform(-0.2, 0.2)), 1)

        # Save vital reading to database
        reading = VitalReading(
            patient_id=patient_id,
            timestamp=now,
            heart_rate=hr,
            resting_heart_rate=rhr,
            hrv=hrv,
            spo2=spo2,
            steps=steps_cur,
            sleep_duration=sleep_dur,
            sleep_quality=sleep_qual,
            skin_temperature=skin_temp,
            respiratory_rate=rr,
            is_simulated=True,
            source="simulator"
        )
        db.add(reading)
        await db.flush()

        # Run Real Anomaly Detection Pipeline
        current_vitals = {
            "heart_rate": hr,
            "resting_heart_rate": rhr,
            "spo2": spo2,
            "hrv": hrv,
            "respiratory_rate": rr
        }
        
        # Get recent history for EWMA & trend
        q_hist = await db.execute(
            select(VitalReading)
            .where(VitalReading.patient_id == patient_id)
            .order_by(desc(VitalReading.timestamp))
            .limit(10)
        )
        hist = [{"resting_heart_rate": r.resting_heart_rate, "spo2": r.spo2, "hrv": r.hrv, "respiratory_rate": r.respiratory_rate} for r in q_hist.scalars().all()]

        risk_result = anomaly_engine.calculate_risk_score(
            current_vitals=current_vitals,
            baselines=baselines,
            recent_history=hist,
            recent_steps=steps_cur
        )

        # Update patient risk score and risk level
        pat.current_risk_score = risk_result["score"]
        pat.current_risk_level = risk_result["status"]

        # Record risk assessment
        risk_record = RiskAssessment(
            patient_id=patient_id,
            timestamp=now,
            score=risk_result["score"],
            status=risk_result["status"],
            explanation=risk_result["explanation"],
            contributing_factors=risk_result["contributing_factors"],
            trend_forecast=risk_result["trend_forecast"]
        )
        db.add(risk_record)

        # If Warning or Critical risk, generate an explainable alert
        new_alert = None
        if risk_result["score"] >= 50.0:
            # Check if there is already an active alert in past 6 hours to avoid spamming
            q_exist_alert = await db.execute(
                select(Alert)
                .where(Alert.patient_id == patient_id, Alert.status == "active", Alert.timestamp >= (now - timedelta(hours=6)))
            )
            existing = q_exist_alert.scalars().first()
            if not existing or state["deterioration_active"]:
                contrib_metrics = [f["metric"] for f in risk_result["contributing_factors"]]
                dev_pct = risk_result["contributing_factors"][0]["deviation_pct"] if risk_result["contributing_factors"] else 15.0
                
                new_alert = Alert(
                    patient_id=patient_id,
                    timestamp=now,
                    severity=risk_result["status"],
                    title=f"Physiological Deterioration Detected ({risk_result['status']})",
                    explanation=risk_result["explanation"],
                    contributing_metrics=contrib_metrics,
                    deviation_pct=dev_pct,
                    duration_hours=24.0 if state["deterioration_active"] else 6.0,
                    suggested_action=risk_result["suggested_action"],
                    status="active"
                )
                db.add(new_alert)

        await db.commit()

        return {
            "reading": {
                "id": reading.id,
                "timestamp": reading.timestamp.isoformat(),
                "heart_rate": hr,
                "resting_heart_rate": rhr,
                "spo2": spo2,
                "hrv": hrv,
                "respiratory_rate": rr,
                "steps": steps_cur,
                "sleep_duration": sleep_dur,
                "is_simulated": True
            },
            "risk_assessment": risk_result,
            "new_alert_generated": new_alert is not None,
            "alert": {
                "id": new_alert.id if new_alert else None,
                "title": new_alert.title if new_alert else None,
                "severity": new_alert.severity if new_alert else None,
                "explanation": new_alert.explanation if new_alert else None,
                "suggested_action": new_alert.suggested_action if new_alert else None,
            } if new_alert else None,
            "deterioration_active": state["deterioration_active"],
            "step": state["step"]
        }

    def reset_deterioration(self, patient_id: str):
        state = self.get_state(patient_id)
        state["deterioration_active"] = False
        state["step"] = 0

simulator_service = WearableSimulatorService()
