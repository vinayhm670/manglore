from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.all_schemas import ChatMessageRequest, ChatMessageResponse
from app.services.companion_service import companion_service

router = APIRouter(prefix="/companion", tags=["AI Health Companion"])

@router.post("/chat", response_model=ChatMessageResponse)
async def chat_with_companion(
    req: ChatMessageRequest,
    db: AsyncSession = Depends(get_db)
):
    res = await companion_service.process_conversational_message(
        db=db,
        user_message=req.content,
        patient_id=req.patient_id,
        language_override=req.language
    )
    return ChatMessageResponse(
        session_id=req.session_id or "default_session",
        response=res.get("response", ""),
        detected_language=res.get("detected_language", "en"),
        detected_language_confidence=res.get("detected_language_confidence", 1.0),
        is_emergency=res.get("is_emergency", False),
        emergency_details=res.get("emergency_details"),
        vital_context_used=res.get("vital_context_used"),
        suggested_questions=res.get("suggested_questions", [])
    )
