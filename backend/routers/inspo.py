from pathlib import Path
from uuid import uuid4

import aiofiles
from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter()

UPLOAD_DIR = Path(__file__).parent.parent.parent / "storage" / "uploads"
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/upload")
async def upload_inspo_image(file: UploadFile = File(...)):
    """Sube una imagen de inspiración. Devuelve la ruta relativa para usar en /generate."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Tipo de archivo no soportado: {file.content_type}",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Archivo demasiado grande (máx 10 MB)")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "upload").suffix or ".jpg"
    filename = f"{uuid4().hex}{ext}"
    dest = UPLOAD_DIR / filename

    async with aiofiles.open(dest, "wb") as f:
        await f.write(content)

    return {"path": f"storage/uploads/{filename}", "filename": filename}
