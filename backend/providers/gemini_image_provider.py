import asyncio
import os
from pathlib import Path
from uuid import uuid4


class GeminiImageProvider:
    """Genera imágenes con Gemini 2.0 Flash image generation."""

    def __init__(self):
        from google import genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY no está definida en el entorno")
        self.client = genai.Client(api_key=api_key)
        self.model = os.getenv("GEMINI_IMAGE_MODEL", "gemini-2.0-flash-preview-image-generation")

    async def generate_image(self, prompt: str, output_dir: Path) -> str:
        """
        Genera una imagen a partir de un prompt de texto.
        Devuelve la ruta relativa usable como URL: storage/generated/<filename>.
        """
        from google.genai import types

        def _sync_generate():
            return self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    responseModalities=["TEXT", "IMAGE"],
                ),
            )

        response = await asyncio.get_event_loop().run_in_executor(None, _sync_generate)

        image_bytes: bytes | None = None
        mime_type = "image/png"
        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                image_bytes = part.inline_data.data
                mime_type = part.inline_data.mime_type or "image/png"
                break

        if not image_bytes:
            raise RuntimeError("Gemini no devolvió imagen en la respuesta")

        ext = mime_type.split("/")[-1].replace("jpeg", "jpg")
        filename = f"{uuid4().hex}.{ext}"
        output_dir.mkdir(parents=True, exist_ok=True)
        (output_dir / filename).write_bytes(image_bytes)

        return f"storage/generated/{filename}"


def get_image_provider() -> GeminiImageProvider:
    provider = os.getenv("IMAGE_PROVIDER", "gemini").lower()
    if provider != "gemini":
        raise ValueError(f"IMAGE_PROVIDER desconocido: '{provider}'. Solo 'gemini' está soportado.")
    return GeminiImageProvider()
