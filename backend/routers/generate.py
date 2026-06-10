from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from database import get_db
from models.models import Generation, GenerationStatus, OutputType

router = APIRouter()


class InspoItem(BaseModel):
    type: str   # "text" | "image"
    content: str  # raw text or file path


class GenerateRequest(BaseModel):
    inspo_items: List[InspoItem]
    user_comment: Optional[str] = None
    output_type: str = "text"

    @field_validator("output_type")
    @classmethod
    def validate_output_type(cls, v: str) -> str:
        if v not in {"text", "image", "both"}:
            raise ValueError("output_type debe ser 'text', 'image' o 'both'")
        return v


@router.post("/generate")
async def generate(request: GenerateRequest, db: Session = Depends(get_db)):
    """
    Fase 2+: extrae concepto y genera contenido.
    Por ahora devuelve 501 para que el front sepa que aún no está implementado.
    """
    raise HTTPException(status_code=501, detail="Generación aún no implementada (Fase 2)")


@router.get("/generate/{generation_id}")
def get_generation(generation_id: int, db: Session = Depends(get_db)):
    gen = db.query(Generation).filter(Generation.id == generation_id).first()
    if not gen:
        raise HTTPException(status_code=404, detail="Generación no encontrada")
    return gen


@router.get("/generations")
def list_generations(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return (
        db.query(Generation)
        .order_by(Generation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
