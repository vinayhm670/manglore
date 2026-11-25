from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.models.entities import User, Patient, Caregiver, Doctor, UserConsent
from app.schemas.all_schemas import UserCreate, UserLogin, UserResponse, Token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    q = await db.execute(select(User).where(User.email == user_in.email))
    if q.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="A user with this email address already exists in PULSEORA"
        )
        
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        role=user_in.role,
        phone=user_in.phone,
        preferred_language=user_in.preferred_language
    )
    db.add(user)
    await db.flush()
    
    patient_id = None
    if user.role == "patient":
        pat = Patient(
            user_id=user.id,
            age=65,
            gender="Not specified",
            medical_conditions=[],
            baseline_ready=False
        )
        db.add(pat)
        await db.flush()
        patient_id = pat.id
        # Add default consents
        for ctype in ["wearable_telemetry", "ai_chat_history", "caregiver_sharing"]:
            db.add(UserConsent(user_id=user.id, consent_type=ctype, granted=True))
    elif user.role == "caregiver":
        cg = Caregiver(user_id=user.id, phone=user.phone)
        db.add(cg)
    elif user.role == "doctor":
        doc = Doctor(
            user_id=user.id,
            license_number="KMC-REG-PENDING",
            specialization="General Internal Medicine"
        )
        db.add(doc)
        
    await db.commit()
    await db.refresh(user)
    
    token = create_access_token(user.id, role=user.role)
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
        patient_id=patient_id
    )

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    q = await db.execute(select(User).where(User.email == login_data.email))
    user = q.scalars().first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    patient_id = None
    if user.role == "patient":
        q_pat = await db.execute(select(Patient).where(Patient.user_id == user.id))
        pat = q_pat.scalars().first()
        if pat:
            patient_id = pat.id
            
    token = create_access_token(user.id, role=user.role)
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
        patient_id=patient_id
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.get("/demo-accounts")
async def get_demo_accounts():
    """Returns quick-login credentials for hackathon evaluation and testing."""
    return {
        "status": "success",
        "demo_password": "Pulseora@123",
        "accounts": [
            {
                "role": "Patient (Normal Baseline)",
                "name": "Ramesh Kumar",
                "email": "ramesh@pulseora.health",
                "risk": "Normal (14.0)",
                "description": "Elderly patient with mild hypertension, baseline learned"
            },
            {
                "role": "Patient (Watch Baseline)",
                "name": "Meenakshi Bhat",
                "email": "meenakshi@pulseora.health",
                "risk": "Watch (38.0)",
                "description": "Senior diabetic, native Kannada & Tulu speaker"
            },
            {
                "role": "Patient (Warning Alert)",
                "name": "Prema Shetty",
                "email": "prema@pulseora.health",
                "risk": "Warning (58.0)",
                "description": "Respiratory & sleep disruption, active warning alert"
            },
            {
                "role": "Caregiver",
                "name": "Kavitha Kumar",
                "email": "kavitha@pulseora.health",
                "risk": "N/A",
                "description": "Daughter of Ramesh Kumar with real-time notification alerts"
            },
            {
                "role": "Doctor",
                "name": "Dr. Sudhir Shenoy",
                "email": "dr.shenoy@pulseora.health",
                "risk": "N/A",
                "description": "Consultant Cardiologist at Nitte Medical Complex"
            },
            {
                "role": "Administrator",
                "name": "PULSEORA Admin",
                "email": "admin@pulseora.health",
                "risk": "N/A",
                "description": "System admin and audit console"
            }
        ]
    }
