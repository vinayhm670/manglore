import math
import random
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import get_password_hash
from app.models.entities import (
    User, Patient, Caregiver, Doctor, PatientCaregiverLink, PatientDoctorLink,
    VitalReading, HealthBaseline, Alert, RiskAssessment, AnomalyEvent,
    MedicationReminder, UserConsent
)

DEMO_PASSWORD = "Pulseora@123"

DEMO_PATIENTS = [
    {
        "full_name": "Ramesh Kumar",
        "email": "ramesh@pulseora.health",
        "phone": "+91 98450 12345",
        "age": 68,
        "gender": "Male",
        "conditions": ["Mild Hypertension", "Stage 1 Osteoarthritis"],
        "emergency_name": "Kavitha Kumar (Daughter)",
        "emergency_phone": "+91 98450 67890",
        "preferred_language": "en",
        "wearable": "PULSEORA CareBand Elite #A1",
        "base_hr": 68.0,
        "base_spo2": 98.0,
        "base_hrv": 38.0,
        "risk_score": 14.0,
        "risk_level": "Normal"
    },
    {
        "full_name": "Meenakshi Bhat",
        "email": "meenakshi@pulseora.health",
        "phone": "+91 98800 23456",
        "age": 72,
        "gender": "Female",
        "conditions": ["Type 2 Diabetes", "Occasional Sinus Arrhythmia"],
        "emergency_name": "Pradeep Bhat (Son)",
        "emergency_phone": "+91 98800 78901",
        "preferred_language": "kn",
        "wearable": "PULSEORA CareBand Elite #B2",
        "base_hr": 74.0,
        "base_spo2": 97.2,
        "base_hrv": 32.0,
        "risk_score": 38.0,
        "risk_level": "Watch"
    },
    {
        "full_name": "Sharath Hegde",
        "email": "sharath@pulseora.health",
        "phone": "+91 94480 34567",
        "age": 64,
        "gender": "Male",
        "conditions": ["Post-PCI Stent Placement (8 mos)", "Dyslipidemia"],
        "emergency_name": "Anitha Hegde (Spouse)",
        "emergency_phone": "+91 94480 89012",
        "preferred_language": "en",
        "wearable": "PULSEORA VitalPro #C3",
        "base_hr": 70.0,
        "base_spo2": 97.8,
        "base_hrv": 42.0,
        "risk_score": 22.0,
        "risk_level": "Normal"
    },
    {
        "full_name": "Prema Shetty",
        "email": "prema@pulseora.health",
        "phone": "+91 97410 45678",
        "age": 70,
        "gender": "Female",
        "conditions": ["Mild Bronchial Asthma", "Sleep Quality Disruption"],
        "emergency_name": "Rajesh Shetty (Son)",
        "emergency_phone": "+91 97410 90123",
        "preferred_language": "tcy",
        "wearable": "PULSEORA VitalPro #D4",
        "base_hr": 76.0,
        "base_spo2": 95.8,
        "base_hrv": 29.0,
        "risk_score": 58.0,
        "risk_level": "Warning"
    },
    {
        "full_name": "Anand Rao",
        "email": "anand@pulseora.health",
        "phone": "+91 99000 56789",
        "age": 62,
        "gender": "Male",
        "conditions": ["Pre-hypertension", "Active Senior Walking Group"],
        "emergency_name": "Sudha Rao (Spouse)",
        "emergency_phone": "+91 99000 01234",
        "preferred_language": "en",
        "wearable": "PULSEORA SportCare #E5",
        "base_hr": 64.0,
        "base_spo2": 98.4,
        "base_hrv": 46.0,
        "risk_score": 10.0,
        "risk_level": "Normal"
    }
]

def generate_patient_history(patient_id: str, cfg: dict, days: int = 30):
    readings = []
    now = datetime.utcnow()
    start_time = now - timedelta(days=days)
    
    # 4 readings per day (every 6 hours) for 30 days = 120 points per patient
    cur = start_time
    total_steps_cum = 0
    
    while cur <= now:
        hour = cur.hour
        # Circadian effect: HR dips at night (0h-6h) by 8-12 bpm
        is_night = 0 <= hour <= 6
        circadian_hr_offset = -10.0 if is_night else (4.0 if 12 <= hour <= 18 else 0.0)
        
        # Noise
        noise_hr = random.uniform(-2.5, 2.5)
        hr = round(cfg["base_hr"] + circadian_hr_offset + noise_hr, 1)
        rhr = round(cfg["base_hr"] + random.uniform(-1.5, 1.5), 1)
        
        # HRV is inversely related to stress/sympathetic tone
        hrv_night_boost = 12.0 if is_night else 0.0
        hrv = round(cfg["base_hrv"] + hrv_night_boost + random.uniform(-3.0, 3.0), 1)
        
        # SpO2
        spo2 = round(min(99.5, max(92.0, cfg["base_spo2"] + random.uniform(-0.8, 0.8))), 1)
        
        # Steps
        steps_increment = random.randint(30, 200) if is_night else random.randint(600, 2400)
        total_steps_cum += steps_increment
        if hour == 0:
            total_steps_cum = random.randint(20, 80)
            
        sleep_dur = round(random.uniform(6.2, 8.1), 1)
        sleep_qual = round(random.uniform(74.0, 94.0), 1)
        skin_temp = round(36.5 + random.uniform(-0.3, 0.4), 1)
        resp_rate = round(15.5 + random.uniform(-1.2, 1.2), 1)
        
        # Introduce a few simulated warnings in Prema Shetty's recent 3 days (Warning patient)
        if cfg["email"] == "prema@pulseora.health" and cur >= (now - timedelta(days=2)):
            hr += 12.0
            rhr += 11.0
            hrv = max(18.0, hrv - 10.0)
            spo2 = min(94.2, spo2 - 2.5)
            sleep_dur = 4.8
            sleep_qual = 58.0
            resp_rate += 3.5
            
        reading = VitalReading(
            patient_id=patient_id,
            timestamp=cur,
            heart_rate=hr,
            resting_heart_rate=rhr,
            hrv=hrv,
            spo2=spo2,
            steps=total_steps_cum,
            sleep_duration=sleep_dur,
            sleep_quality=sleep_qual,
            skin_temperature=skin_temp,
            respiratory_rate=resp_rate,
            is_simulated=True,
            source="simulator"
        )
        readings.append(reading)
        cur += timedelta(hours=6)
        
    return readings

def compute_baselines_for_readings(patient_id: str, readings: list):
    metrics = ["heart_rate", "resting_heart_rate", "hrv", "spo2", "respiratory_rate", "sleep_duration"]
    baselines = []
    
    for metric in metrics:
        values = [getattr(r, metric) for r in readings if getattr(r, metric) is not None]
        if not values:
            continue
        values.sort()
        n = len(values)
        mean_val = sum(values) / n
        variance = sum((x - mean_val) ** 2 for x in values) / n
        std_val = math.sqrt(variance) if variance > 0 else 1.0
        median_val = values[n // 2]
        p10 = values[int(n * 0.1)]
        p90 = values[int(n * 0.9)]
        
        hourly_stats = {}
        for h in [0, 6, 12, 18]:
            h_vals = [getattr(r, metric) for r in readings if r.timestamp.hour == h]
            if h_vals:
                h_mean = sum(h_vals) / len(h_vals)
                hourly_stats[str(h)] = {"mean": round(h_mean, 2), "count": len(h_vals)}
                
        b = HealthBaseline(
            patient_id=patient_id,
            metric=metric,
            mean=round(mean_val, 2),
            std_dev=round(std_val, 2),
            median=round(median_val, 2),
            p10=round(p10, 2),
            p90=round(p90, 2),
            sample_count=n,
            hourly_stats=hourly_stats,
            updated_at=datetime.utcnow()
        )
        baselines.append(b)
    return baselines

async def seed_initial_data(db: AsyncSession):
    # Check if already seeded
    q = await db.execute(select(User).limit(1))
    if q.scalars().first():
        return  # already seeded
        
    password_hash = get_password_hash(DEMO_PASSWORD)
    
    # 1. Admin
    admin_user = User(
        email="admin@pulseora.health",
        hashed_password=password_hash,
        full_name="PULSEORA System Administrator",
        role="admin",
        phone="+91 824 2200100",
        preferred_language="en"
    )
    db.add(admin_user)
    await db.flush()
    
    # 2. Doctors
    doc1 = User(
        email="dr.shenoy@pulseora.health",
        hashed_password=password_hash,
        full_name="Dr. Sudhir Shenoy, MD, DM",
        role="doctor",
        phone="+91 98451 11223",
        preferred_language="en"
    )
    db.add(doc1)
    await db.flush()
    
    doctor_profile1 = Doctor(
        user_id=doc1.id,
        license_number="KMC-44892",
        specialization="Cardiology & Geriatric Medicine",
        hospital_affiliation="Nitte Medical Sciences Complex, Mangaluru"
    )
    db.add(doctor_profile1)
    await db.flush()

    # 3. Caregivers
    cg1 = User(
        email="kavitha@pulseora.health",
        hashed_password=password_hash,
        full_name="Kavitha Kumar",
        role="caregiver",
        phone="+91 98450 67890",
        preferred_language="en"
    )
    db.add(cg1)
    await db.flush()
    
    cg_profile1 = Caregiver(
        user_id=cg1.id,
        phone=cg1.phone,
        relationship_type="Daughter"
    )
    db.add(cg_profile1)
    await db.flush()
    
    # 4. Patients
    patient_entities = []
    for cfg in DEMO_PATIENTS:
        u = User(
            email=cfg["email"],
            hashed_password=password_hash,
            full_name=cfg["full_name"],
            role="patient",
            phone=cfg["phone"],
            preferred_language=cfg["preferred_language"]
        )
        db.add(u)
        await db.flush()
        
        # User consent records
        for ctype in ["wearable_telemetry", "ai_chat_history", "caregiver_sharing"]:
            db.add(UserConsent(user_id=u.id, consent_type=ctype, granted=True))
            
        pat = Patient(
            user_id=u.id,
            age=cfg["age"],
            gender=cfg["gender"],
            medical_conditions=cfg["conditions"],
            emergency_contact_name=cfg["emergency_name"],
            emergency_contact_phone=cfg["emergency_phone"],
            baseline_ready=True,
            current_risk_score=cfg["risk_score"],
            current_risk_level=cfg["risk_level"],
            wearable_connected=True,
            wearable_device_name=cfg["wearable"]
        )
        db.add(pat)
        await db.flush()
        patient_entities.append((pat, cfg))
        
        # Generate 30 days vitals
        readings = generate_patient_history(pat.id, cfg, days=30)
        db.add_all(readings)
        
        # Baselines
        baselines = compute_baselines_for_readings(pat.id, readings)
        db.add_all(baselines)
        
        # Medication Reminders
        if cfg["email"] == "ramesh@pulseora.health":
            db.add(MedicationReminder(
                patient_id=pat.id,
                medication_name="Telmisartan (40mg)",
                dosage="1 tablet with breakfast",
                frequency="Daily Morning",
                reminder_times=["08:30"]
            ))
            db.add(MedicationReminder(
                patient_id=pat.id,
                medication_name="Atorvastatin (10mg)",
                dosage="1 tablet after dinner",
                frequency="Daily Night",
                reminder_times=["21:00"]
            ))
        elif cfg["email"] == "prema@pulseora.health":
            db.add(MedicationReminder(
                patient_id=pat.id,
                medication_name="Budesonide / Formoterol Inhaler",
                dosage="2 puffs",
                frequency="Twice daily",
                reminder_times=["08:00", "20:00"]
            ))
            
    await db.flush()
    
    # Link Ramesh Kumar to Kavitha (Caregiver)
    ramesh_pat = patient_entities[0][0]
    db.add(PatientCaregiverLink(
        patient_id=ramesh_pat.id,
        caregiver_id=cg_profile1.id,
        relation_type="Daughter",
        permissions=["view_vitals", "receive_alerts", "call_support"]
    ))
    
    # Link all patients to Dr. Shenoy
    for pat, _ in patient_entities:
        db.add(PatientDoctorLink(
            patient_id=pat.id,
            doctor_id=doctor_profile1.id,
            clinical_notes="Registered in Nitte Clinical Remote Monitoring Program"
        ))
        
    # Seed Initial Alerts
    # Ramesh has a mild watch alert
    db.add(Alert(
        patient_id=ramesh_pat.id,
        severity="Watch",
        title="Resting Heart Rate Mild Elevation",
        explanation="Resting heart rate averaged 74 BPM over the last 12 hours, which is 8% above the 14-day personal baseline of 68 BPM. Sleep quality was also slightly reduced.",
        contributing_metrics=["resting_heart_rate", "sleep_duration"],
        deviation_pct=8.8,
        duration_hours=12.0,
        suggested_action="Hydrate with water or tender coconut, rest in the afternoon, and check readings again by 6:00 PM.",
        status="active"
    ))
    
    # Prema Shetty has a Warning alert
    prema_pat = patient_entities[3][0]
    db.add(Alert(
        patient_id=prema_pat.id,
        severity="Warning",
        title="Multi-Metric Physiological Shift Detected",
        explanation="Resting heart rate is 16% above personal baseline, accompanied by a 3.4% reduction in blood oxygen saturation (SpO2: 93.8%) and elevated respiratory rate over the past 48 hours.",
        contributing_metrics=["resting_heart_rate", "spo2", "respiratory_rate"],
        deviation_pct=16.2,
        duration_hours=48.0,
        suggested_action="Avoid physical exertion, keep prescribed inhaler nearby, and inform caregiver or Dr. Sudhir Shenoy if shortness of breath persists.",
        status="active"
    ))
    
    await db.commit()
    print("Database successfully seeded with demo users, 5 patients, 30 days vitals, baselines, and alerts!")
