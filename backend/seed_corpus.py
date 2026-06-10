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

CORPUS_FILE = ROOT / "corpus_inicial" / "corpus-data.json"


def seed(reset: bool = False):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed BrandConfig singleton si no existe
        if not db.query(BrandConfig).first():
            db.add(BrandConfig(
                prompt_base=(
                    "Sos un experto en contenido de marca. "
                    "Tomá la inspiración recibida, identificá el concepto central "
                    "y generá un post adaptado al estilo y voz de nuestra empresa. "
                    "Editá este prompt desde /brand > Settings."
                )
            ))
            db.commit()

        if reset:
            deleted = db.query(BrandCorpus).delete()
            db.commit()
            print(f"  Eliminados {deleted} registros previos.")

        data = json.loads(CORPUS_FILE.read_text(encoding="utf-8"))
        posts = data["brand_corpus"]
        inserted = 0
        for post in posts:
            entry = BrandCorpus(
                source=post["source"],
                source_url=post.get("source_url"),
                text=post["text"],
                image_path=post.get("image_file"),
                notes=post.get("notes") or None,
            )
            db.add(entry)
            inserted += 1

        db.commit()
        print(f"  Seed completo: {inserted} posts cargados en brand_corpus.")
    finally:
        db.close()


if __name__ == "__main__":
    reset = "--reset" in sys.argv
    seed(reset=reset)
