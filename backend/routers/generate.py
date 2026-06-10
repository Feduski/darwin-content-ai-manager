from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy.orm import Session

from database import get_db
from models.models import BrandConfig, BrandCorpus, Generation, GenerationStatus, OutputType
from providers.text_provider import get_text_provider
from services.concept_extractor import ConceptExtractor
from services.prompt_builder import PromptBuilder

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class InspoItem(BaseModel):
    type: str
    content: str

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in {"text", "image"}:
            raise ValueError("type debe ser 'text' o 'image'")
        return v


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


class GenerationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    inspo_items: Any
    user_comment: Optional[str] = None
    extracted_concept: Optional[str] = None
    output_type: str
    output_text: Optional[str] = None
    output_image_path: Optional[str] = None
    status: str
    rejection_reason: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/generate", response_model=GenerationOut)
async def generate(request: GenerateRequest, db: Session = Depends(get_db)):
    if request.output_type == "image":
        raise HTTPException(status_code=501, detail="Generación de imágenes disponible en Fase 3")

    # Inicializar provider (valida que la key exista)
    try:
        provider = get_text_provider()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Brand config (siempre existe, seeded en startup)
    config = db.query(BrandConfig).first()
    if not config:
        raise HTTPException(status_code=500, detail="BrandConfig no inicializado — reiniciá el servidor")

    # Corpus: últimos 4 ejemplos para few-shot
    corpus = db.query(BrandCorpus).order_by(BrandCorpus.created_at.desc()).limit(4).all()

    # Extraer concepto de cada item de inspiración
    items_dicts = [{"type": i.type, "content": i.content} for i in request.inspo_items]
    try:
        concept = await ConceptExtractor(provider).extract_items(items_dicts)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error al extraer concepto: {e}")

    # Armar prompt con las tres capas de contexto de marca
    builder = PromptBuilder()
    prompt = builder.build(
        concept=concept,
        brand_config=config,
        corpus_examples=builder.select_corpus_examples(corpus),
        output_type=request.output_type,
        user_comment=request.user_comment,
    )

    # Generar texto
    output_text: Optional[str] = None
    if request.output_type in ("text", "both"):
        try:
            output_text = await provider.complete(prompt)
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Error al generar texto: {e}")

    # Persistir generación
    gen = Generation(
        inspo_items=items_dicts,
        user_comment=request.user_comment,
        extracted_concept=concept,
        output_type=OutputType(request.output_type),
        output_text=output_text,
        output_image_path=None,
        status=GenerationStatus.pending,
    )
    db.add(gen)
    db.commit()
    db.refresh(gen)

    return gen


@router.get("/generate/{generation_id}", response_model=GenerationOut)
def get_generation(generation_id: int, db: Session = Depends(get_db)):
    gen = db.query(Generation).filter(Generation.id == generation_id).first()
    if not gen:
        raise HTTPException(status_code=404, detail="Generación no encontrada")
    return gen


@router.get("/generations", response_model=List[GenerationOut])
def list_generations(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return (
        db.query(Generation)
        .order_by(Generation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
