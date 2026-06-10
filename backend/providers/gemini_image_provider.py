import os
from pathlib import Path
from uuid import uuid4


class GeminiImageProvider:
    """Genera imágenes con Gemini 2.0 Flash (image generation)."""

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
        Devuelve la ruta relativa del archivo generado (storage/generated/...).
        Fase 3: implementación completa.
        """
        raise NotImplementedError("Generación de imágenes disponible en Fase 3")


def get_image_provider() -> GeminiImageProvider:
    provider = os.getenv("IMAGE_PROVIDER", "gemini").lower()
    if provider != "gemini":
        raise ValueError(f"IMAGE_PROVIDER desconocido: '{provider}'. Solo 'gemini' está soportado.")
    return GeminiImageProvider()
