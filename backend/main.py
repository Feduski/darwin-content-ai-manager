from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

load_dotenv()

from database import engine, SessionLocal, Base
from models.models import BrandConfig
from routers import inspo, generate, feedback, brand


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Ensure storage dirs exist
    Path("../storage/uploads").mkdir(parents=True, exist_ok=True)
    Path("../storage/generated").mkdir(parents=True, exist_ok=True)

    # Seed brand_config singleton
    db = SessionLocal()
    try:
        if not db.query(BrandConfig).first():
            db.add(
                BrandConfig(
                    prompt_base=(
                        "Sos un experto en contenido de marca. "
                        "Tomá la inspiración recibida, identificá el concepto central "
                        "y generá un post adaptado al estilo y voz de nuestra empresa. "
                        "Editá este prompt desde /brand > Settings."
                    )
                )
            )
            db.commit()
    finally:
        db.close()

    yield


app = FastAPI(title="Darwin Content Manager", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated images statically
app.mount(
    "/storage/generated",
    StaticFiles(directory="../storage/generated"),
    name="generated",
)

app.include_router(inspo.router, prefix="/api/inspo", tags=["inspo"])
app.include_router(generate.router, prefix="/api", tags=["generate"])
app.include_router(feedback.router, prefix="/api", tags=["feedback"])
app.include_router(brand.router, prefix="/api/brand", tags=["brand"])


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok", "service": "darwin-content-manager", "version": "0.1.0"}
