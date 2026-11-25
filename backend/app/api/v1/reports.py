from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.pdf_report_service import generate_clinical_pdf_report

router = APIRouter(prefix="/reports", tags=["Clinical Reports"])

@router.get("/pdf/{patient_id}")
async def download_clinical_report(
    patient_id: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        pdf_bytes = await generate_clinical_pdf_report(db, patient_id)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Pulseora_Clinical_Report_{patient_id[:8]}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to generate clinical report: {str(e)}")
