from pathlib import Path
from typing import Optional
from uuid import uuid4

import aiofiles
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.models import BrandConfig, BrandCorpus, ItemType

router = APIRouter()

UPLOAD_DIR = Path(__file__).parent.parent.parent / "storage" / "uploads"
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


# ── Brand config ────────────────────────────────────────────────────────────

class BrandConfigOut(BaseModel):
    id: int
    prompt_base: str
    feedback_summary: Optional[str]

    class Config:
        from_attributes = True


class BrandConfigUpdate(BaseModel):
    prompt_base: str


@router.get("/config", response_model=BrandConfigOut)
def get_brand_config(db: Session = Depends(get_db)):
    config = db.query(BrandConfig).first()
    if not config:
        raise HTTPException(status_code=404, detail="BrandConfig no inicializado")
    return config


@router.put("/config", response_model=BrandConfigOut)
def update_brand_config(update: BrandConfigUpdate, db: Session = Depends(get_db)):
    config = db.query(BrandConfig).first()
    if not config:
        raise HTTPException(status_code=404, detail="BrandConfig no inicializado")
    config.prompt_base = update.prompt_base
    db.commit()
    db.refresh(config)
    return config


# ── Brand corpus ─────────────────────────────────────────────────────────────

@router.get("/corpus")
def list_corpus(db: Session = Depends(get_db)):
    return db.query(BrandCorpus).order_by(BrandCorpus.created_at.desc()).all()


@router.post("/corpus/text")
async def add_corpus_text(
    content: str = Form(...),
    db: Session = Depends(get_db),
):
    entry = BrandCorpus(type=ItemType.text, content=content)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.post("/corpus/image")
async def add_corpus_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Fase 3+: analiza la imagen con visión y guarda style_description.
    Por ahora sube la imagen y guarda la ruta sin análisis.
    """
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="Tipo de imagen no soportado")

    content = await file.read()
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "corpus").suffix or ".jpg"
    filename = f"corpus_{uuid4().hex}{ext}"
    dest = UPLOAD_DIR / filename

    async with aiofiles.open(dest, "wb") as f:
        await f.write(content)

    entry = BrandCorpus(
        type=ItemType.image,
        content=f"storage/uploads/{filename}",
        style_description=None,  # se llenará con visión en Fase 3
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/corpus/{item_id}")
def delete_corpus_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(BrandCorpus).filter(BrandCorpus.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    db.delete(item)
    db.commit()
    return {"deleted": item_id}
