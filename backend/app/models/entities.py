from datetime import datetime
from typing import Optional, List
import uuid
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="patient")  # patient, caregiver, doctor, admin
    phone = Column(String(50), nullable=True)
    preferred_language = Column(String(20), default="en")  # en, kn, tcy (tulu)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    patient_profile = relationship("Patient", back_populates="user", uselist=False, cascade="all, delete-orphan")
    caregiver_profile = relationship("Caregiver", back_populates="user", uselist=False, cascade="all, delete-orphan")
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    consents = relationship("UserConsent", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    medical_conditions = Column(JSON, default=list)  # ["Hypertension", "Type 2 Diabetes"]
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)
    baseline_ready = Column(Boolean, default=False)
    current_risk_score = Column(Float, default=12.0)
    current_risk_level = Column(String(50), default="Normal")  # Normal (0-24), Watch (25-49), Warning (50-74), Critical (75-100)
    wearable_connected = Column(Boolean, default=True)
    wearable_device_name = Column(String(100), default="PULSEORA Sensor Band V2")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="patient_profile")
    vital_readings = relationship("VitalReading", back_populates="patient", cascade="all, delete-orphan")
    baselines = relationship("HealthBaseline", back_populates="patient", cascade="all, delete-orphan")
    anomalies = relationship("AnomalyEvent", back_populates="patient", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="patient", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="patient", cascade="all, delete-orphan")
    symptoms = relationship("SymptomLog", back_populates="patient", cascade="all, delete-orphan")
    medications = relationship("MedicationReminder", back_populates="patient", cascade="all, delete-orphan")
    caregiver_links = relationship("PatientCaregiverLink", back_populates="patient")
    doctor_links = relationship("PatientDoctorLink", back_populates="patient")

class Caregiver(Base):
    __tablename__ = "caregivers"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    phone = Column(String(50), nullable=True)
    relationship_type = Column(String(100), default="Family Member")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="caregiver_profile")
    patient_links = relationship("PatientCaregiverLink", back_populates="caregiver")

class Doctor(Base):
    __tablename__ = "doctors"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    license_number = Column(String(100), nullable=False)
    specialization = Column(String(100), default="Internal Medicine")
    hospital_affiliation = Column(String(255), default="Nitte Medical Sciences Complex, Mangaluru")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="doctor_profile")
    patient_links = relationship("PatientDoctorLink", back_populates="doctor")

class PatientCaregiverLink(Base):
    __tablename__ = "patient_caregiver_links"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    caregiver_id = Column(String(36), ForeignKey("caregivers.id"), nullable=False)
    relation_type = Column(String(100), default="Daughter / Son")
    permissions = Column(JSON, default=lambda: ["view_vitals", "receive_alerts", "view_reports"])
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="caregiver_links")
    caregiver = relationship("Caregiver", back_populates="patient_links")

class PatientDoctorLink(Base):
    __tablename__ = "patient_doctor_links"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("doctors.id"), nullable=False)
    clinical_notes = Column(Text, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="doctor_links")
    doctor = relationship("Doctor", back_populates="patient_links")

class VitalReading(Base):
    __tablename__ = "vital_readings"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), index=True, nullable=False)
    timestamp = Column(DateTime, index=True, default=datetime.utcnow)
    
    heart_rate = Column(Float, nullable=False)
    resting_heart_rate = Column(Float, nullable=False)
    hrv = Column(Float, nullable=False)  # ms (rMSSD)
    spo2 = Column(Float, nullable=False)  # %
    steps = Column(Integer, default=0)
    sleep_duration = Column(Float, default=7.0)  # hours
    sleep_quality = Column(Float, default=85.0)  # 0-100 score
    skin_temperature = Column(Float, default=36.6)  # Celsius
    respiratory_rate = Column(Float, default=16.0)  # breaths/min
    
    is_simulated = Column(Boolean, default=True)
    source = Column(String(50), default="simulator")  # simulator, csv_import, fitbit, ble_sensor
    
    patient = relationship("Patient", back_populates="vital_readings")

class HealthBaseline(Base):
    __tablename__ = "health_baselines"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), index=True, nullable=False)
    metric = Column(String(50), nullable=False)  # heart_rate, resting_heart_rate, hrv, spo2, respiratory_rate, sleep_duration
    
    mean = Column(Float, nullable=False)
    std_dev = Column(Float, nullable=False)
    median = Column(Float, nullable=False)
    p10 = Column(Float, nullable=False)
    p90 = Column(Float, nullable=False)
    sample_count = Column(Integer, default=0)
    hourly_stats = Column(JSON, default=dict)  # {"0": {"mean": 58, "std": 3}, "1": ...}
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="baselines")

class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    metric = Column(String(50), nullable=False)
    observed_value = Column(Float, nullable=False)
    expected_range_low = Column(Float, nullable=False)
    expected_range_high = Column(Float, nullable=False)
    deviation_pct = Column(Float, nullable=False)
    anomaly_type = Column(String(50), default="z_score")  # z_score, ewma, isolation_forest, multi_day_trend
    severity = Column(String(50), default="Watch")  # Normal, Watch, Warning, Critical
    context_label = Column(String(100), nullable=True)  # "High step count / post-exercise"
    is_explained = Column(Boolean, default=False)
    
    patient = relationship("Patient", back_populates="anomalies")

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    score = Column(Float, nullable=False)  # 0 to 100
    status = Column(String(50), nullable=False)  # Normal, Watch, Warning, Critical
    explanation = Column(Text, nullable=False)
    contributing_factors = Column(JSON, default=list)  # [{"metric": "resting_heart_rate", "weight": 0.4, "deviation": "+18%"}]
    trend_forecast = Column(JSON, default=dict)  # {"forecast_hours": 48, "direction": "elevated", "confidence": "experimental"}
    
    patient = relationship("Patient", back_populates="risk_assessments")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    severity = Column(String(50), nullable=False)  # Normal, Watch, Warning, Critical
    title = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=False)
    contributing_metrics = Column(JSON, default=list)  # ["resting_heart_rate", "hrv"]
    deviation_pct = Column(Float, default=0.0)
    duration_hours = Column(Float, default=1.0)
    suggested_action = Column(Text, nullable=False)
    
    status = Column(String(50), default="active")  # active, acknowledged, snoozed, resolved
    acknowledged_by = Column(String(255), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    false_alarm = Column(Boolean, default=False)
    context_notes = Column(Text, nullable=True)
    
    patient = relationship("Patient", back_populates="alerts")

class SymptomLog(Base):
    __tablename__ = "symptom_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    symptom_type = Column(String(100), nullable=False)  # "Fatigue", "Dizziness", "Palpitations"
    severity = Column(String(50), default="Mild")  # Mild, Moderate, Severe
    notes = Column(Text, nullable=True)
    logged_via = Column(String(50), default="ai_companion")  # ai_companion, manual_ui
    
    patient = relationship("Patient", back_populates="symptoms")

class MedicationReminder(Base):
    __tablename__ = "medication_reminders"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), index=True, nullable=False)
    medication_name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), default="Once daily")
    reminder_times = Column(JSON, default=lambda: ["08:00"])
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="medications")

class ChatbotSession(Base):
    __tablename__ = "chatbot_sessions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=True)
    language = Column(String(20), default="en")
    consent_granted = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class ChatbotMessage(Base):
    __tablename__ = "chatbot_messages"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("chatbot_sessions.id"), nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    language = Column(String(20), default="en")
    is_emergency = Column(Boolean, default=False)
    tool_calls = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserConsent(Base):
    __tablename__ = "user_consents"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    consent_type = Column(String(100), nullable=False)  # "wearable_telemetry", "ai_chat_history", "caregiver_sharing"
    granted = Column(Boolean, default=True)
    granted_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="consents")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)  # "LOGIN", "VIEW_PATIENT", "EXPORT_REPORT", "ACK_ALERT"
    target_type = Column(String(100), nullable=True)
    target_id = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(JSON, default=dict)
    
    user = relationship("User", back_populates="audit_logs")

class TranslationFeedback(Base):
    __tablename__ = "translation_feedback"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    language = Column(String(20), nullable=False)
    original_text = Column(Text, nullable=False)
    translated_text = Column(Text, nullable=False)
    suggested_correction = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class EmergencyEvent(Base):
    __tablename__ = "emergency_events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    severity = Column(String(50), default="Critical")  # Level 4 Critical
    title = Column(String(255), nullable=False)
    indicators = Column(JSON, default=dict)  # {"heart_rate": 108, "spo2": 91.2, "hrv": 18.0}
    assigned_doctor_id = Column(String(36), ForeignKey("doctors.id"), nullable=True)
    caregiver_id = Column(String(36), ForeignKey("caregivers.id"), nullable=True)
    status = Column(String(50), default="unacknowledged")  # unacknowledged, acknowledged, escalated
    escalation_deadline = Column(DateTime, nullable=True)
    escalated_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

class EmergencyAcknowledgement(Base):
    __tablename__ = "emergency_acknowledgements"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    emergency_event_id = Column(String(36), ForeignKey("emergency_events.id"), nullable=False, index=True)
    doctor_id = Column(String(36), ForeignKey("doctors.id"), nullable=False)
    acknowledged_at = Column(DateTime, default=datetime.utcnow)
    clinical_notes = Column(Text, nullable=True)
    contacted_patient = Column(Boolean, default=False)
    contacted_caregiver = Column(Boolean, default=False)
    action_taken = Column(String(255), default="Reviewed telemetry, requested senior rest and vitals follow-up")

class DeviceHeartbeat(Base):
    __tablename__ = "device_heartbeats"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False, unique=True, index=True)
    device_id = Column(String(100), default="PULSEORA CareBand Elite #A1")
    last_heartbeat = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="online")  # online, unstable, offline
    battery_level = Column(Integer, default=92)
    firmware_version = Column(String(50), default="v2.10.8")

class ConnectivityEvent(Base):
    __tablename__ = "connectivity_events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)  # network_disconnected, network_restored, device_offline, server_unreachable
    timestamp = Column(DateTime, default=datetime.utcnow)
    resolved = Column(Boolean, default=False)
    duration_seconds = Column(Integer, default=0)
    source = Column(String(50), default="gateway_monitor")

class NotificationLog(Base):
    __tablename__ = "notification_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    recipient_role = Column(String(50), nullable=False)  # doctor, caregiver, patient
    recipient_id = Column(String(36), nullable=False)
    recipient_name = Column(String(255), nullable=False)
    channel = Column(String(50), nullable=False)  # in_app, web_push, sms, whatsapp
    message = Column(Text, nullable=False)
    status = Column(String(50), default="delivered")  # delivered, queued, failed, acknowledged
    sent_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)
    retry_count = Column(Integer, default=0)
