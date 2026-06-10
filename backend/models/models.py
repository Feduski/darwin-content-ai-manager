import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Enum as SAEnum
from database import Base


class OutputType(str, enum.Enum):
    text = "text"
    image = "image"
    both = "both"


class GenerationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class BrandCorpus(Base):
    __tablename__ = "brand_corpus"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(50), nullable=False)      # "instagram" | "linkedin" | "manual"
    source_url = Column(String, nullable=True)
    text = Column(Text, nullable=False)
    image_path = Column(String, nullable=True)       # relativo a corpus_inicial/
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class BrandConfig(Base):
    """Singleton (always id=1). Prompt base + feedback summary acumulado."""
    __tablename__ = "brand_config"

    id = Column(Integer, primary_key=True, default=1)
    prompt_base = Column(Text, nullable=False)
    feedback_summary = Column(Text, nullable=True)


class Generation(Base):
    __tablename__ = "generations"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    inspo_items = Column(JSON, nullable=False)          # [{type, content/path}]
    user_comment = Column(Text, nullable=True)
    extracted_concept = Column(Text, nullable=True)
    output_type = Column(SAEnum(OutputType), nullable=False)
    output_text = Column(Text, nullable=True)
    output_image_path = Column(String, nullable=True)
    status = Column(
        SAEnum(GenerationStatus),
        default=GenerationStatus.pending,
        nullable=False,
    )
    rejection_reason = Column(Text, nullable=True)
