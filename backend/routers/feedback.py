from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from database import get_db
from models.models import Generation, GenerationStatus

router = APIRouter()


class FeedbackRequest(BaseModel):
    generation_id: int
    decision: str   # "approved" | "rejected"
    rejection_reason: Optional[str] = None

    @field_validator("decision")
    @classmethod
    def validate_decision(cls, v: str) -> str:
        if v not in {"approved", "rejected"}:
            raise ValueError("decision debe ser 'approved' o 'rejected'")
        return v


@router.post("/feedback")
async def submit_feedback(request: FeedbackRequest, db: Session = Depends(get_db)):
    """
    Fase 4+: persistir feedback y disparar synthesizer cada 10 decisiones.
    Por ahora solo persiste el estado básico.
    """
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

    return {"generation_id": gen.id, "status": gen.status}
