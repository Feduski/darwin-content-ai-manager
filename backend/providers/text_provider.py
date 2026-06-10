from abc import ABC, abstractmethod
from typing import Optional


class TextProvider(ABC):
    """Interfaz común para providers de texto/visión."""

    @abstractmethod
    async def complete(self, prompt: str, system: Optional[str] = None) -> str:
        """Genera texto a partir de un prompt."""

    @abstractmethod
    async def analyze_image(self, image_path: str, prompt: str) -> str:
        """Analiza una imagen y devuelve descripción/concepto."""


def get_text_provider() -> TextProvider:
    import os

    provider = os.getenv("TEXT_PROVIDER", "openai").lower()
    if provider == "openai":
        from providers.openai_provider import OpenAIProvider
        return OpenAIProvider()
    if provider == "anthropic":
        from providers.anthropic_provider import AnthropicProvider
        return AnthropicProvider()
    raise ValueError(f"TEXT_PROVIDER desconocido: '{provider}'. Opciones: openai, anthropic")
