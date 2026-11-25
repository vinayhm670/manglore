from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# User & Auth
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "patient"
    phone: Optional[str] = None
    preferred_language: str = "en"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    patient_id: Optional[str] = None

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None

# Patient
class PatientResponse(BaseModel):
    id: str
    user_id: str
    age: Optional[int] = None
    gender: Optional[str] = None
    medical_conditions: List[str] = []
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    baseline_ready: bool = False
    current_risk_score: float = 12.0
    current_risk_level: str = "Normal"
    wearable_connected: bool = True
    wearable_device_name: str = "PULSEORA Sensor Band V2"
    full_name: Optional[str] = None
    email: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

# Vital Readings
class VitalReadingBase(BaseModel):
    heart_rate: float = Field(..., description="Heart rate in BPM")
    resting_heart_rate: float = Field(..., description="Resting heart rate in BPM")
    hrv: float = Field(..., description="Heart rate variability (rMSSD in ms)")
    spo2: float = Field(..., description="SpO2 percentage (90-100%)")
    steps: int = Field(0, description="Step count")
    sleep_duration: float = Field(7.0, description="Sleep duration in hours")
    sleep_quality: float = Field(85.0, description="Sleep quality score (0-100)")
    skin_temperature: float = Field(36.6, description="Skin temperature in Celsius")
    respiratory_rate: float = Field(16.0, description="Breaths per minute")
    is_simulated: bool = True
    source: str = "simulator"

class VitalReadingCreate(VitalReadingBase):
    patient_id: str
    timestamp: Optional[datetime] = None

class VitalReadingResponse(VitalReadingBase):
    id: str
    patient_id: str
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)

class VitalBatchIngest(BaseModel):
    patient_id: str
    readings: List[VitalReadingBase]

# Baseline
class HealthBaselineResponse(BaseModel):
    id: str
    patient_id: str
    metric: str
    mean: float
    std_dev: float
    median: float
    p10: float
    p90: float
    sample_count: int
    hourly_stats: Dict[str, Any] = {}
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Anomaly & Risk
class AnomalyEventResponse(BaseModel):
    id: str
    patient_id: str
    timestamp: datetime
    metric: str
    observed_value: float
    expected_range_low: float
    expected_range_high: float
    deviation_pct: float
    anomaly_type: str
    severity: str
    context_label: Optional[str] = None
    is_explained: bool = False

    model_config = ConfigDict(from_attributes=True)

class RiskAssessmentResponse(BaseModel):
    id: str
    patient_id: str
    timestamp: datetime
    score: float
    status: str
    explanation: str
    contributing_factors: List[Dict[str, Any]] = []
    trend_forecast: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)

# Alert
class AlertResponse(BaseModel):
    id: str
    patient_id: str
    timestamp: datetime
    severity: str
    title: str
    explanation: str
    contributing_metrics: List[str] = []
    deviation_pct: float
    duration_hours: float
    suggested_action: str
    status: str
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    false_alarm: bool = False
    context_notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AlertActionRequest(BaseModel):
    action: str  # "acknowledge", "snooze", "false_alarm", "add_context"
    snooze_hours: Optional[int] = 4
    context_notes: Optional[str] = None

# Symptoms & Medication
class SymptomLogCreate(BaseModel):
    patient_id: str
    symptom_type: str
    severity: str = "Mild"
    notes: Optional[str] = None
    logged_via: str = "ai_companion"

class SymptomLogResponse(SymptomLogCreate):
    id: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class MedicationReminderCreate(BaseModel):
    patient_id: str
    medication_name: str
    dosage: str
    frequency: str = "Once daily"
    reminder_times: List[str] = ["08:00"]

class MedicationReminderResponse(MedicationReminderCreate):
    id: str
    active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# AI Companion
class ChatMessageRequest(BaseModel):
    content: str
    patient_id: Optional[str] = None
    session_id: Optional[str] = None
    language: Optional[str] = None  # auto-detected if None
    include_audio: bool = False

class ChatMessageResponse(BaseModel):
    session_id: str
    response: str
    detected_language: str
    detected_language_confidence: float
    is_emergency: bool = False
    emergency_details: Optional[Dict[str, Any]] = None
    vital_context_used: Optional[Dict[str, Any]] = None
    suggested_questions: List[str] = []

# Simulation Control
class SimulationControlRequest(BaseModel):
    patient_id: str
    action: str  # "start", "pause", "reset", "deteriorate"
    speed_factor: float = 1.0  # 1x, 2x, 5x, 10x
    deterioration_severity: Optional[str] = "moderate"  # mild, moderate, severe
