from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.config import settings
from app.core.security import decode_access_token
from app.models.entities import User, Patient, Caregiver, Doctor

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not token:
        if settings.DEMO_MODE:
            # Automatic fallback to Dr. Sudhir Shenoy for seamless demo/judge walkthrough
            q = await db.execute(select(User).where(User.email == "dr.shenoy@pulseora.health"))
            demo_user = q.scalars().first()
            if demo_user:
                return demo_user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_id = payload.get("sub")
    q = await db.execute(select(User).where(User.id == user_id))
    user = q.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
        
    return user

async def get_current_patient(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Patient:
    if current_user.role != "patient":
        # Check if user has an associated patient profile
        q = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
        pat = q.scalars().first()
        if pat:
            return pat
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have patient privileges"
        )
    
    q = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
    pat = q.scalars().first()
    if not pat:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return pat

async def get_current_doctor(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Doctor:
    if current_user.role not in ["doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have clinician privileges"
        )
    q = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    doc = q.scalars().first()
    return doc

async def get_current_caregiver(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Caregiver:
    if current_user.role not in ["caregiver", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have caregiver privileges"
        )
    q = await db.execute(select(Caregiver).where(Caregiver.user_id == current_user.id))
    cg = q.scalars().first()
    return cg
