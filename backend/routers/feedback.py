from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from database import get_db
from models.models import BrandConfig, Generation, GenerationStatus
from providers.text_provider import get_text_provider
from services.feedback_synthesizer import FeedbackSynthesizer

router = APIRouter()

SYNTHESIZE_EVERY = 5


class FeedbackOut(BaseModel):
    generation_id: int
    status: str


class FeedbackRequest(BaseModel):
    generation_id: int
    decision: str
    rejection_reason: Optional[str] = None

    @field_validator("decision")
    @classmethod
    def validate_decision(cls, v: str) -> str:
        if v not in {"approved", "rejected"}:
            raise ValueError("decision debe ser 'approved' o 'rejected'")
        return v


@router.post("/feedback", response_model=FeedbackOut)
async def submit_feedback(request: FeedbackRequest, db: Session = Depends(get_db)):
    gen = db.query(Generation).filter(Generation.id == request.generation_id).first()
    if not gen:
        raise HTTPException(status_code=404, detail="Generación no encontrada")

    if gen.status != GenerationStatus.pending:
        raise HTTPException(
            status_code=409,
            detail=f"Esta generación ya tiene feedback: {gen.status}",
        )

    gen.status = GenerationStatus(request.decision)
    if request.decision == "rejected":
        gen.rejection_reason = request.rejection_reason
    db.commit()
    db.refresh(gen)

    # Fase 5: re-sintetizar preferencias cada SYNTHESIZE_EVERY decisiones
    decided_count = (
        db.query(Generation)
        .filter(Generation.status.in_([GenerationStatus.approved, GenerationStatus.rejected]))
        .count()
    )
    if decided_count % SYNTHESIZE_EVERY == 0:
        await _run_synthesis(db)

    return FeedbackOut(generation_id=gen.id, status=gen.status.value)


async def _run_synthesis(db: Session) -> None:
    """Actualiza BrandConfig.feedback_summary con las últimas 20 decisiones."""
    try:
        provider = get_text_provider()
    except ValueError:
        return  # sin API key configurada, skip silencioso

    recent = (
        db.query(Generation)
        .filter(Generation.status.in_([GenerationStatus.approved, GenerationStatus.rejected]))
        .order_by(Generation.created_at.desc())
        .limit(20)
        .all()
    )

    decisions = [
        {
            "concept": gen.extracted_concept or "",
            "output": gen.output_text or "(imagen)",
            "status": gen.status.value,
            "rejection_reason": gen.rejection_reason,
        }
        for gen in recent
    ]

    try:
        summary = await FeedbackSynthesizer(provider).synthesize(decisions)
    except Exception:
        return  # error de API, no bloquear el flujo principal

    config = db.query(BrandConfig).first()
    if config and summary:
        config.feedback_summary = summary
        db.commit()
