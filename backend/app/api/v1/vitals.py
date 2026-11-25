from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.entities import VitalReading, Patient, User
from app.schemas.all_schemas import VitalReadingCreate, VitalReadingResponse, VitalBatchIngest
from app.api.deps import get_current_user
import csv
import io

router = APIRouter(prefix="/vitals", tags=["Vitals Telemetry"])

@router.post("/", response_model=VitalReadingResponse)
async def ingest_vital_reading(
    vital_in: VitalReadingCreate,
    db: AsyncSession = Depends(get_db)
):
    reading = VitalReading(
        patient_id=vital_in.patient_id,
        timestamp=vital_in.timestamp or datetime.utcnow(),
        heart_rate=vital_in.heart_rate,
        resting_heart_rate=vital_in.resting_heart_rate,
        hrv=vital_in.hrv,
        spo2=vital_in.spo2,
        steps=vital_in.steps,
        sleep_duration=vital_in.sleep_duration,
        sleep_quality=vital_in.sleep_quality,
        skin_temperature=vital_in.skin_temperature,
        respiratory_rate=vital_in.respiratory_rate,
        is_simulated=vital_in.is_simulated,
        source=vital_in.source
    )
    db.add(reading)
    await db.commit()
    await db.refresh(reading)
    return reading

@router.post("/batch")
async def ingest_batch_vitals(
    batch: VitalBatchIngest,
    db: AsyncSession = Depends(get_db)
):
    now = datetime.utcnow()
    readings = []
    for r in batch.readings:
        readings.append(VitalReading(
            patient_id=batch.patient_id,
            timestamp=now,
            heart_rate=r.heart_rate,
            resting_heart_rate=r.resting_heart_rate,
            hrv=r.hrv,
            spo2=r.spo2,
            steps=r.steps,
            sleep_duration=r.sleep_duration,
            sleep_quality=r.sleep_quality,
            skin_temperature=r.skin_temperature,
            respiratory_rate=r.respiratory_rate,
            is_simulated=r.is_simulated,
            source=r.source
        ))
    db.add_all(readings)
    await db.commit()
    return {"status": "success", "ingested_count": len(readings)}

@router.get("/{patient_id}", response_model=List[VitalReadingResponse])
async def get_patient_vitals(
    patient_id: str,
    range_filter: str = Query("24h", description="24h, 7d, or 30d"),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.utcnow()
    if range_filter == "7d":
        start_time = now - timedelta(days=7)
    elif range_filter == "30d":
        start_time = now - timedelta(days=30)
    else:
        start_time = now - timedelta(hours=24)

    q = await db.execute(
        select(VitalReading)
        .where(VitalReading.patient_id == patient_id, VitalReading.timestamp >= start_time)
        .order_by(VitalReading.timestamp.asc())
    )
    results = q.scalars().all()
    # Fallback to last 20 if time filter returned few due to simulation timestamps
    if len(results) < 5:
        q_fallback = await db.execute(
            select(VitalReading)
            .where(VitalReading.patient_id == patient_id)
            .order_by(desc(VitalReading.timestamp))
            .limit(30)
        )
        results = list(reversed(q_fallback.scalars().all()))
    return results

@router.post("/upload-csv/{patient_id}")
async def upload_vitals_csv(
    patient_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    content = await file.read()
    text = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))
    
    count = 0
    now = datetime.utcnow()
    for row in reader:
        try:
            reading = VitalReading(
                patient_id=patient_id,
                timestamp=now - timedelta(hours=count * 2),
                heart_rate=float(row.get("heart_rate", 72.0)),
                resting_heart_rate=float(row.get("resting_heart_rate", 68.0)),
                hrv=float(row.get("hrv", 38.0)),
                spo2=float(row.get("spo2", 98.0)),
                steps=int(row.get("steps", 0)),
                sleep_duration=float(row.get("sleep_duration", 7.0)),
                respiratory_rate=float(row.get("respiratory_rate", 16.0)),
                is_simulated=False,
                source="csv_import"
            )
            db.add(reading)
            count += 1
        except Exception:
            continue

    await db.commit()
    return {"status": "success", "imported_rows": count}
