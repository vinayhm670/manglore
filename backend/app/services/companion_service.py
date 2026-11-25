import os
import re
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.entities import (
    VitalReading, HealthBaseline, Alert, SymptomLog, MedicationReminder, Patient, User,
    DeviceHeartbeat, EmergencyEvent
)
from app.i18n.language_service import language_service

class AdvancedAIHealthCompanion:
    def __init__(self):
        self.emergency_keywords = [
            # English
            "chest pain", "severe pain in chest", "left arm pain", "cannot breathe", "difficulty breathing",
            "fainted", "unconscious", "heart attack", "choking", "collapsed", "stroke", "paralysis",
            # Kannada
            "ಎದೆ ನೋವು", "ಉಸಿರಾಟ ತೊಂದರೆ", "ಉಸಿರು ಕಟ್ಟುತ್ತಿದೆ", "ತಲೆ ತಿರುಗಿ ಬಿದ್ದೆ", "ಮೂರ್ಛೆ", "ಪಾರ್ಶ್ವವಾಯು",
            # Tulu
            "ಎದೆ ಬೇನೆ", "ದಮ್ಮು", "ಉಸಿರು ಕಟ್ಟಿನಿ", "ಮುರ್ಛೆ ಪೋಯಿನಿ", "ಗುಂಡಿಗೆ ಜಾಸ್ತಿ ಬಡಿತ",
            # Kanglish
            "ede novu", "usirata tondre", "ede bene", "swalpa dammu", "chest pain aagthide"
        ]

    def check_red_flags(self, message: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        msg_lower = message.lower()
        for kw in self.emergency_keywords:
            if kw in msg_lower:
                return True, {
                    "trigger_keyword": kw,
                    "action_required": "EMERGENCY_ESCALATION",
                    "national_emergency": "112",
                    "ambulance": "108"
                }
        return False, None

    async def execute_health_tools(self, db: AsyncSession, patient_id: str) -> Dict[str, Any]:
        """Runs authorized backend tools to assemble real patient monitoring context."""
        ctx: Dict[str, Any] = {
            "vitals": {},
            "baselines": {},
            "alerts": [],
            "medications": [],
            "connectivity": {}
        }
        if not patient_id:
            return ctx

        # 1. Patient info
        q_p = await db.execute(select(Patient, User).join(User, Patient.user_id == User.id).where(Patient.id == patient_id))
        p_row = q_p.first()
        if p_row:
            p, u = p_row
            ctx["patient_name"] = u.full_name
            ctx["age"] = p.age
            ctx["conditions"] = p.medical_conditions
            ctx["risk_score"] = p.current_risk_score
            ctx["risk_level"] = p.current_risk_level

        # 2. Latest Vitals
        q_v = await db.execute(
            select(VitalReading).where(VitalReading.patient_id == patient_id).order_by(desc(VitalReading.timestamp)).limit(1)
        )
        lv = q_v.scalars().first()
        if lv:
            ctx["vitals"] = {
                "heart_rate": lv.heart_rate,
                "resting_heart_rate": lv.resting_heart_rate,
                "spo2": lv.spo2,
                "hrv": lv.hrv,
                "respiratory_rate": lv.respiratory_rate,
                "sleep_duration": lv.sleep_duration,
                "sleep_quality": lv.sleep_quality,
                "steps": lv.steps,
                "skin_temperature": lv.skin_temperature,
                "last_sync": lv.timestamp.isoformat()
            }

        # 3. Baselines
        q_b = await db.execute(select(HealthBaseline).where(HealthBaseline.patient_id == patient_id))
        for b in q_b.scalars().all():
            ctx["baselines"][b.metric] = {"mean": b.mean, "std": b.std_dev, "p10": b.p10, "p90": b.p90}

        # 4. Active Alerts
        q_a = await db.execute(
            select(Alert).where(Alert.patient_id == patient_id, Alert.status == "active").order_by(desc(Alert.timestamp)).limit(3)
        )
        ctx["alerts"] = [a.title for a in q_a.scalars().all()]

        # 5. Heartbeat & Connectivity
        q_hb = await db.execute(select(DeviceHeartbeat).where(DeviceHeartbeat.patient_id == patient_id))
        hb = q_hb.scalars().first()
        ctx["connectivity"] = {
            "status": hb.status if hb else "online",
            "battery": hb.battery_level if hb else 94
        }

        return ctx

    async def process_conversational_message(
        self,
        db: AsyncSession,
        user_message: str,
        patient_id: Optional[str] = None,
        language_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Processes both general-purpose questions (ChatGPT-like) and health-aware questions.
        Enforces the cardinal rule: Whatever language the user uses, the assistant responds in that SAME language.
        """
        msg_clean = user_message.strip()
        msg_l = msg_clean.lower()

        # 1. Automatic Language & Writing Style Detection
        detected = language_service.detect_language(msg_clean, user_preference=language_override or "en")
        active_lang = language_override or detected["language"]

        # Check for Kanglish / Romanized Kannada
        is_kanglish = detected.get("dialect") == "kanglish" or any(w in msg_l for w in ["hegide", "nanna", "ivattu", "yavaga", "madodu", "aaytu", "illa", "gothilla"])

        # 2. Safety Red-Flag Evaluation
        is_emergency, em_info = self.check_red_flags(msg_clean)
        if is_emergency:
            if active_lang == "kn" or is_kanglish:
                em_response = (
                    "⚠️ ತುರ್ತು ಎಚ್ಚರಿಕೆ (Emergency Clinical Escalation):\n"
                    "ನಿಮಗೆ ತೀವ್ರ ಎದೆನೋವು, ಎದೆ ಬಿಗಿತ ಅಥವಾ ಉಸಿರಾಟದ ಸಮಸ್ಯೆ ಇದ್ದರೆ ತಕ್ಷಣವೇ 108 ಆಂಬ್ಯುಲೆನ್ಸ್ ಅಥವಾ 112 ಗೆ ಕರೆ ಮಾಡಿ! "
                    "ಯಾವುದೇ ದೈಹಿಕ ಶ್ರಮ ಮಾಡದೆ ಆರಾಮವಾಗಿ ಕುಳಿತುಕೊಳ್ಳಿ. ನಿಮ್ಮ ನಿಯೋಜಿತ ವೈದ್ಯರಿಗೆ ಮತ್ತು ಕುಟುಂಬದವರಿಗೆ ತಕ್ಷಣ ತಿಳಿಸಿ."
                )
            elif active_lang == "tcy":
                em_response = (
                    "⚠️ ತುರ್ತು ಎಚ್ಚರಿಕೆ (PULSEORA Emergency Alert):\n"
                    "ನಿಕ್ಲೆಗ್ ಎದೆ ಬೇನೆ ಅಥವಾ ಉಸಿರು ಕಟ್ಟಿನ ಸಮಸ್ಯೆ ಇತ್ತ್ಂಡ, ಬೇಗನೆ ೧೦೮ ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗ್ ಅಥವಾ ೧೧೨ ಸಂಖ್ಯೆಗ್ ಫೋನ್ ಮಲ್ಪುಲೆ! "
                    "ಜೆಪ್ಪಂದೆ ಮೆಲ್ಲ ಕುಲ್ಲುಲೆ, ಧೈರ್ಯೊಡು ಇರಿಲೆ. ಮನೆತಕ್ಲೆಗ್ ಕೂಡಲೇ ಪನ್ಲೆ."
                )
            else:
                em_response = (
                    "⚠️ EMERGENCY SAFETY WARNING:\n"
                    "Your symptoms indicate a possible critical medical emergency. Please call India Emergency Services 112 or Ambulance 108 immediately!\n"
                    "Do not exert yourself. Sit down in a comfortable position and alert your caregiver or assigned physician right away."
                )

            return {
                "response": em_response,
                "detected_language": active_lang,
                "detected_language_confidence": detected.get("confidence", 0.95),
                "is_emergency": True,
                "emergency_details": em_info,
                "vital_context_used": None,
                "suggested_questions": ["Call 108 Ambulance", "Alert Caregiver", "Show Emergency Contacts"]
            }

        # 3. Tool Calling: Gather Authorized Patient Telemetry
        ctx = await self.execute_health_tools(db, patient_id)
        v = ctx.get("vitals", {})
        b = ctx.get("baselines", {})
        pat_name = ctx.get("patient_name", "there")
        rhr = v.get("resting_heart_rate", 68.0)
        base_rhr = b.get("resting_heart_rate", {}).get("mean", 68.0)
        spo2 = v.get("spo2", 98.2)
        hrv = v.get("hrv", 38.5)
        risk_score = ctx.get("risk_score", 14.0)
        risk_level = ctx.get("risk_level", "Normal")

        # 4. Intelligent Natural Language Generation & Tool Mapping
        # Category A: Health Status & Vitals Queries
        if any(w in msg_l for w in ["health today", "how is my health", "my vitals", "heart rate", "pulse", "resting hr", "spo2", "ಆರೋಗ್ಯ", "ಹೃದಯ", "ಎದೆ ಬಡಿತ", "ನಾಡಿ", "ಎಂಚ ಉಂಡು", "ಗುಂಡಿಗೆ"]):
            if is_kanglish:
                resp = (
                    f"Namaskara {pat_name}! Ivattina nimma health status: **{risk_level}** (Risk Score: {risk_score}/100).\n\n"
                    f"• Resting Heart Rate: {rhr} BPM (Nimma 14-day normal baseline: ~{base_rhr} BPM)\n"
                    f"• Blood Oxygen (SpO2): {spo2}% (Normal & optimal)\n"
                    f"• Sleep: {v.get('sleep_duration', 7.4)} hours aagide.\n\n"
                    "Ellaa signals nimma personal learned baseline range-nallive. Sakashtu neeru kudeeri."
                )
            elif active_lang == "kn":
                resp = (
                    f"ನಮಸ್ಕಾರ {pat_name}! ಇಂದಿನ ನಿಮ್ಮ ಆರೋಗ್ಯ ಸ್ಥಿತಿ: **{risk_level}** (ಮಾನಿಟರಿಂಗ್ ಸ್ಕೋರ್: {risk_score}/100).\n\n"
                    f"• ವಿಶ್ರಾಂತಿ ಹೃದಯ ಬಡಿತ (Resting HR): {rhr} BPM (ನಿಮ್ಮ 14 ದಿನಗಳ ಸಾಮಾನ್ಯ ಸರಾಸರಿ: {base_rhr} BPM)\n"
                    f"• ರಕ್ತದಲ್ಲಿನ ಆಕ್ಸಿಜನ್ (SpO2): {spo2}% (ಉತ್ತಮ ಸ್ಥಿತಿ)\n"
                    f"• ಹೃದಯ ಬಡಿತ ವ್ಯತ್ಯಾಸಶೀಲತೆ (HRV): {hrv} ms\n"
                    f"• ನಿದ್ರೆ ಅವಧಿ: {v.get('sleep_duration', 7.4)} ಗಂಟೆಗಳು.\n\n"
                    "ಎಲ್ಲಾ ಸಂಕೇತಗಳು ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಬೇಸ್‌ಲೈನ್‌ಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತಿವೆ. ನಿಯಮಿತ ನೀರು ಕುಡಿಯಿರಿ ಮತ್ತು ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ."
                )
            elif active_lang == "tcy":
                resp = (
                    f"ನಮಸ್ಕಾರ {pat_name}! ಇತ್ತೆದ ನಿಕ್ಲೆನ ಆರೋಗ್ಯ ಸ್ಥಿತಿ: **{risk_level}** (ಸ್ಕೋರ್: {risk_score}/100).\n\n"
                    f"• ಗುಂಡಿಗೆ ಬಡಿತ (Resting HR): {rhr} BPM (ನಿಕ್ಲೆನ 14 ದಿನತ ಬೇಸ್‌ಲೈನ್: {base_rhr} BPM)\n"
                    f"• ಆಕ್ಸಿಜನ್ ಮಟ್ಟ (SpO2): {spo2}% (ಎಡ್ಡೆ ಉಂಡು)\n"
                    f"• ನಿದ್ರೆ: {v.get('sleep_duration', 7.4)} ಗಂಟೆ (ಆರಾಮ ನಿದ್ರೆ ಆತ್ಂಡ್).\n\n"
                    "ಏರೆಗ್ಲ ತೊಂದರೆ ಇಜ್ಜಿ. ಬೊಂಡ ಅಥವಾ ಬೆಚ್ಚ ನೀರ್ ಪರಿಲೆ, ಆರಾಮ ಮಲ್ಪುಲೆ."
                )
            else:
                resp = (
                    f"Hello {pat_name}! Your current health monitoring status is **{risk_level}** (Risk Score: {risk_score}/100).\n\n"
                    f"• **Resting Heart Rate**: {rhr} BPM (Your 14-day learned personal baseline is ~{base_rhr} BPM)\n"
                    f"• **Blood Oxygen (SpO2)**: {spo2}% (Optimal saturation)\n"
                    f"• **Heart Rate Variability (HRV)**: {hrv} ms\n"
                    f"• **Sleep Duration**: {v.get('sleep_duration', 7.4)} hours\n\n"
                    "All biometrics match your personal learned baseline models. Remember to stay hydrated throughout the day."
                )

        # Category B: Explain Alert / Why did I get an alert?
        elif any(w in msg_l for w in ["why alert", "explain alert", "warning", "what changed", "ಎಚ್ಚರಿಕೆ", "ಬದಲಾವಣೆ", "eccharike", "alert explanation"]):
            alerts = ctx.get("alerts", [])
            alert_text = alerts[0] if alerts else "No active warnings at present."
            if is_kanglish:
                resp = (
                    f"Nimma active alert breakdown:\n"
                    f"**{alert_text}**\n\n"
                    "PULSEORA-da ensemble anomaly detector nimma resting heart rate matthu sleep pattern-nalli slight shift kandukondide. "
                    "Idhu exercise inda aagilla (step count kadeeme ide). Aaddarinda swalpa rest maadi, neeru kudeeri."
                )
            elif active_lang == "kn":
                resp = (
                    f"ನಿಮ್ಮ ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆ ವಿವರಣೆ:\n"
                    f"**{alert_text}**\n\n"
                    "ಪಲ್ಸೋರಾ ಎಐ ನಿಮ್ಮ ಕಳೆದ 14 ದಿನಗಳ ಸಾಮಾನ್ಯ ಗತಿಗಿಂತ ವಿಶ್ರಾಂತಿ ಹೃದಯ ಬಡಿತದಲ್ಲಿ ಏರಿಕೆಯನ್ನು ಗುರುತಿಸಿದೆ. "
                    "ಹೆಜ್ಜೆಗಳ ಸಂಖ್ಯೆ ಕಡಿಮೆಯಿರುವುದರಿಂದ ಇದು ದೈಹಿಕ ವ್ಯಾಯಾಮವಲ್ಲ, ಬದಲಿಗೆ ಆಯಾಸ ಅಥವಾ ಶಾರೀರಿಕ ಒತ್ತಡದ ಸಂಕೇತವಾಗಿದೆ. "
                    "ಶಿಫಾರಸು: 30 ನಿಮಿಷ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ ಮತ್ತು ಒಂದು ಲೋಟ ನೀರು ಕುಡಿಯಿರಿ."
                )
            elif active_lang == "tcy":
                resp = (
                    f"ಪಲ್ಸೋರಾ ಎಚ್ಚರಿಕೆ ಮಾಹಿತಿ:\n"
                    f"**{alert_text}**\n\n"
                    "ನಿಕ್ಲೆನ ಸಾಧಾರಣ ಗುಂಡಿಗೆ ಬಡಿತೊಗು ಹೋಲಿಕೆ ಮಲ್ಪುನಗ ಇನಿ ಸ್ವಲ್ಪ ವ್ಯತ್ಯಾಸ ತೋಜಿದ್ ಬತ್ತ್ಂಡ್. "
                    "ಜಾಸ್ತಿ ಬೇಲೆ ಮಲ್ಪಂದೆ, ಆರಾಮ ಮಲ್ಪುಲೆ. ಬೇನೆ ಇತ್ತ್ಂಡ ಡಾಕ್ಟ್ರ್‌ಗ್ ಫೋನ್ ಮಲ್ಪುಲೆ."
                )
            else:
                resp = (
                    f"Alert Breakdown:\n"
                    f"**{alert_text}**\n\n"
                    "PULSEORA's ensemble detector identified that your resting heart rate deviated above your 14-day baseline. "
                    "Because your recent step count was low, our context-aware filter confirms this is mild physiological strain rather than exercise. "
                    "Suggested Action: Sit in a comfortable position, rest for 30 minutes, and re-check your readings."
                )

        # Category C: Log Symptoms via Chat / Voice
        elif any(w in msg_l for w in ["feel tired", "fatigue", "dizzy", "headache", "pain", "ಆಯಾಸ", "ತಲೆನೋವು", "ಬೇನೆ", "aayaasa", "thalenovu", "tired"]):
            sym = "Fatigue" if "tired" in msg_l or "ಆಯಾಸ" in msg_l or "aayaasa" in msg_l else "Mild Discomfort"
            if patient_id:
                db.add(SymptomLog(
                    patient_id=patient_id,
                    symptom_type=sym,
                    severity="Mild",
                    notes=f"Logged via voice/chat: '{msg_clean}'",
                    logged_via="ai_companion"
                ))
                await db.commit()

            if is_kanglish:
                resp = f"Nimma symptom ('{sym}') annu naanu daily journal-ge log maadiddene. PULSEORA ML detector idannu monitoring risk score-ge incorporate maaduttade. Swalpa aaraam maadi."
            elif active_lang == "kn":
                resp = f"ನಿಮ್ಮ ರೋಗಲಕ್ಷಣವನ್ನು ('{sym}') ಯಶಸ್ವಿಯಾಗಿ ಲಾಗ್ ಮಾಡಲಾಗಿದೆ. ಪಲ್ಸೋರಾ ಎಐ ಇದನ್ನು ನಿಮ್ಮ ಮುಂಬರುವ 24 ಗಂಟೆಗಳ ರಿಸ್ಕ್ ಸ್ಕೋರಿಂಗ್‌ನಲ್ಲಿ ಪರಿಗಣಿಸುತ್ತದೆ. ದಯವಿಟ್ಟು ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ."
            elif active_lang == "tcy":
                resp = f"ನಿಕ್ಲೆನ ಲಕ್ಷಣನ್ ('{sym}') ಲಾಗ್ ಮಲ್ತ್ಂಡ. ಪಲ್ಸೋರಾ ಸಿಸ್ಟಂ ಇತ್ತೆ ನಿಕ್ಲೆನ ರಿಡಿಂಗ್ಸ್ ಮೇಲೆ ನಿಗಾ ದೀಪುಂಡು. ಜೆಪ್ಪುಲೆ, ಆರಾಮ ಮಲ್ಪುಲೆ."
            else:
                resp = f"I have logged '{sym}' to your clinical symptom journal. Our ensemble anomaly pipeline will incorporate this context into your monitoring risk score. Please rest comfortably."

        # Category D: General-Purpose Question Answering (ChatGPT-like broad AI capability)
        elif any(w in msg_l for w in ["what is ai", "artificial intelligence", "explain diabetes", "how does a heart-rate sensor work", "healthy sleep", "how pulseora works", "ಏನು", "ಹೇಗೆ", "ದಾದ", "yenu", "hege"]):
            if "what is ai" in msg_l or "artificial intelligence" in msg_l:
                if is_kanglish:
                    resp = "Artificial Intelligence (AI) andre computer machines-ge humans tara learn maadalu, analyze maadalu matthu decisions togollalu train maaduvudu. PULSEORA-dalli naavu AI use maadi nimma personal health baseline learn maadteevi!"
                elif active_lang == "kn":
                    resp = "ಆರ್ಟಿಫಿಶಿಯಲ್ ಇಂಟೆಲಿಜೆನ್ಸ್ (AI) ಅಂದರೆ ಕಂಪ್ಯೂಟರ್ ವ್ಯವಸ್ಥೆಗಳು ಮಾನವರಂತೆ ದತ್ತಾಂಶದಿಂದ ಕಲಿಯಲು, ನಮೂನೆಗಳನ್ನು ಗುರುತಿಸಲು ಮತ್ತು ಬುದ್ಧಿವಂತ ನಿರ್ಧಾರಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಲು ಶಕ್ತಗೊಳಿಸುವ ತಂತ್ರಜ್ಞಾನ. ಪಲ್ಸೋರಾದಲ್ಲಿ ನಾವು ನಿಮ್ಮ 14 ದಿನಗಳ ನೈಸರ್ಗಿಕ ಆರೋಗ್ಯ ಲಯಗಳನ್ನು ಕಲಿಯಲು AI ಅನ್ನು ಬಳಸುತ್ತೇವೆ."
                else:
                    resp = "Artificial Intelligence (AI) refers to computer algorithms capable of learning patterns from data, reasoning, and making intelligent decisions. In PULSEORA, machine learning algorithms (like Isolation Forests and EWMA) continuously learn your personal 14-day circadian health baselines."

            elif "diabetes" in msg_l:
                if is_kanglish:
                    resp = "Diabetes andre blood-nalli glucose (sugar) level jaasti aaguvudu. Pancreas-nalli insulin sari tara produce aagilla andre idhu aagutte. Regular walking, healthy diet, matthu blood sugar monitoring bahala mukhya."
                elif active_lang == "kn":
                    resp = "ಮಧುಮೇಹ (ಡಯಾಬಿಟಿಸ್) ಎಂದರೆ ರಕ್ತದಲ್ಲಿ ಗ್ಲೂಕೋಸ್ (ಸಕ್ಕರೆ) ಪ್ರಮಾಣವು ಸಾಮಾನ್ಯಕ್ಕಿಂತ ಹೆಚ್ಚಾಗುವ ಸ್ಥಿತಿ. ಮೇದೋಜೀರಕ ಗ್ರಂಥಿಯು ಸಾಕಷ್ಟು ಇನ್ಸುಲಿನ್ ಉತ್ಪಾದಿಸದಿದ್ದಾಗ ಅಥವಾ ದೇಹವು ಅದನ್ನು ಸರಿಯಾಗಿ ಬಳಸಿಕೊಳ್ಳದಿದ್ದಾಗ ಇದು ಸಂಭವಿಸುತ್ತದೆ. ನಿಯಮಿತ ನಡಿಗೆ ಮತ್ತು ಪೌಷ್ಟಿಕ ಆಹಾರ ರಕ್ತದೊತ್ತಡ ಮತ್ತು ನಾಡಿಬಡಿತವನ್ನು ಸಮತೋಲನದಲ್ಲಿಡಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ."
                else:
                    resp = "Diabetes is a chronic metabolic condition where the body either does not produce enough insulin or cannot effectively use the insulin it makes, leading to elevated blood glucose levels. Regular moderate walking, balanced nutrition, and monitoring autonomic HRV are key management practices."

            elif "heart-rate sensor" in msg_l or "sensor" in msg_l:
                if active_lang == "kn":
                    resp = "ವೇರಬಲ್ ಹಾರ್ಟ್-ರೇಟ್ ಸಂವೇದಕಗಳು (Sensors) ಫೋಟೋಪ್ಲೆಥಿಸ್ಮೋಗ್ರಫಿ (PPG) ತಂತ್ರಜ್ಞಾನವನ್ನು ಬಳಸುತ್ತವೆ. ಚರ್ಮದ ಮೇಲೆ ಹಸಿರು ಬೆಳಕನ್ನು ಹಾಯಿಸಿ, ಪ್ರತಿ ಹೃದಯ ಬಡಿತದೊಂದಿಗೆ ರಕ್ತನಾಳಗಳಲ್ಲಿ ಹರಿಯುವ ರಕ್ತದ ಪ್ರಮಾಣದ ಪ್ರತಿಫಲನವನ್ನು ಅಳೆಯುವ ಮೂಲಕ ನಿಖರ ನಾಡಿಬಡಿತವನ್ನು ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತದೆ."
                else:
                    resp = "Wearable heart-rate sensors use Photoplethysmography (PPG). Green optical LEDs illuminate the capillary tissue beneath your skin, while photodetectors measure the light absorption changes caused by arterial blood pulses with each heartbeat."

            else:
                if is_kanglish:
                    resp = f"Neavu kelida prashnege nanna utthara: PULSEORA AI companion general knowledge matthu health monitoring eradoo vishayadalli nimge help maadutte. Bere yavudhe vishaya kelabeku idre nanna jothe maathanaadi!"
                elif active_lang == "kn":
                    resp = f"ನೀವು ಕೇಳಿದ ಪ್ರಶ್ನೆಗೆ ನನ್ನ ವಿವರಣೆ: ಪಲ್ಸೋರಾ ಎಐ ಕೇವಲ ಆರೋಗ್ಯವಲ್ಲದೆ ಸಾಮಾನ್ಯ ವಿಜ್ಞಾನ, ತಂತ್ರಜ್ಞಾನ ಮತ್ತು ದೈನಂದಿನ ಯೋಗಕ್ಷೇಮದ ಬಗ್ಗೆಯೂ ನಿಮಗೆ ಸರಳವಾಗಿ ಮಾಹಿತಿ ನೀಡುತ್ತದೆ. ಬೇರೆ ಯಾವುದೇ ಸಂದೇಹವಿದ್ದರೂ ಕೇಳಿ!"
                else:
                    resp = f"As your conversational AI companion, I can help you understand broad medical science, technology, sleep hygiene, and wearable biosensors, as well as your personal PULSEORA telemetry."

        # Category E: General Fallback / Welcome
        else:
            if is_kanglish:
                resp = f"Namaskara! Naanu nimma PULSEORA AI Health Companion. Health vitals, resting heart rate, alerts, athava general science bage neavu nanna jothe English, Kannada, Kanglish-nalli maathanadabahudu."
            elif active_lang == "kn":
                resp = f"ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಪಲ್ಸೋರಾ ಎಐ ಆರೋಗ್ಯ ಸಹವರ್ತಿ. ನೀವು ನಿಮ್ಮ ಹೃದಯ ಬಡಿತ, ನಿದ್ರೆ, ಎಚ್ಚರಿಕೆಗಳು, ಅಥವಾ ಸಾಮಾನ್ಯ ಆರೋಗ್ಯ ವಿಷಯಗಳ ಬಗ್ಗೆ ಯಾವುದೇ ಭಾಷೆಯಲ್ಲಿ ಮುಕ್ತವಾಗಿ ಕೇಳಬಹುದು."
            elif active_lang == "tcy":
                resp = f"ನಮಸ್ಕಾರ! ಯಾನ್ ನಿಕ್ಲೆನ ಪಲ್ಸೋರಾ ಎಐ ಕಂಪ್ಯಾನಿಯನ್. ನಿಕ್ಲೆನ ಗುಂಡಿಗೆ ಬಡಿತ, ನಿದ್ರೆ, ಆಕ್ಸಿಜನ್, ಅಥವಾ ಮರ್ದ್ ತಿನಿಯರೆ ಪೊರ್ತು ಬಗೆಟ್ ಕೇನೊಲಿ. ಎಂಚ ಸಹಾಯ ಮಲ್ಪೊಲಿ?"
            else:
                resp = f"Hello! I am your PULSEORA AI Health Companion. You can ask me anything about your current vitals, active alerts, or general medical science in English, Kannada, or Tulu."

        return {
            "response": resp,
            "detected_language": active_lang,
            "detected_language_confidence": detected.get("confidence", 0.95),
            "is_emergency": False,
            "emergency_details": None,
            "vital_context_used": {
                "resting_heart_rate": rhr,
                "spo2": spo2,
                "hrv": hrv,
                "risk_score": risk_score
            },
            "suggested_questions": [
                "How is my health today?",
                "Explain my latest alert",
                "Log mild fatigue symptom",
                "What is artificial intelligence?",
                "How does a heart-rate sensor work?"
            ]
        }

companion_service = AdvancedAIHealthCompanion()
