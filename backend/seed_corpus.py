"""
Carga corpus_inicial/corpus-data.json en la tabla brand_corpus.
Uso: python seed_corpus.py [--reset]
  --reset  borra todas las entradas existentes antes de insertar
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(Path(__file__).parent))

from database import engine, SessionLocal, Base
from models.models import BrandCorpus, BrandConfig
from main import BRAND_BASE_PROMPT

CORPUS_FILE = ROOT / "corpus_inicial" / "corpus-data.json"


def seed(reset: bool = False):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        config = db.query(BrandConfig).first()
        if not config:
            db.add(BrandConfig(prompt_base=BRAND_BASE_PROMPT))
            db.commit()
        else:
            # Actualizar el prompt aunque ya exista
            config.prompt_base = BRAND_BASE_PROMPT
            db.commit()

        if reset:
            deleted = db.query(BrandCorpus).delete()
            db.commit()
            print(f"  Eliminados {deleted} registros previos.")

        data = json.loads(CORPUS_FILE.read_text(encoding="utf-8"))
        posts = data["brand_corpus"]
        inserted = 0
        skipped = 0
        existing_urls = {
            url for (url,) in db.query(BrandCorpus.source_url).all() if url
        }
        for post in posts:
            url = post.get("source_url")
            if url and url in existing_urls:
                skipped += 1
                continue
            db.add(BrandCorpus(
                source=post["source"],
                source_url=url,
                text=post["text"],
                image_path=post.get("image_file"),
                notes=post.get("notes") or None,
            ))
            if url:
                existing_urls.add(url)
            inserted += 1

        db.commit()
        print(f"  Seed completo: {inserted} insertados, {skipped} ya existían.")
    finally:
        db.close()


if __name__ == "__main__":
    reset = "--reset" in sys.argv
    seed(reset=reset)
