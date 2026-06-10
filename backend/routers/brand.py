from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from database import get_db
from models.models import BrandConfig, BrandCorpus

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class BrandConfigOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    prompt_base: str
    feedback_summary: Optional[str] = None


class BrandConfigUpdate(BaseModel):
    prompt_base: str


class CorpusItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    source: str
    source_url: Optional[str] = None
    text: str
    image_path: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime


class CorpusItemCreate(BaseModel):
    source: str
    source_url: Optional[str] = None
    text: str
    image_path: Optional[str] = None
    notes: Optional[str] = None


# ── Brand config ──────────────────────────────────────────────────────────────

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


# ── Brand corpus ──────────────────────────────────────────────────────────────

@router.get("/corpus", response_model=List[CorpusItemOut])
def list_corpus(db: Session = Depends(get_db)):
    return db.query(BrandCorpus).order_by(BrandCorpus.created_at.desc()).all()


@router.post("/corpus", response_model=CorpusItemOut)
def add_corpus_item(item: CorpusItemCreate, db: Session = Depends(get_db)):
    entry = BrandCorpus(**item.model_dump())
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
