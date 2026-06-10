import base64
import os
from pathlib import Path
from typing import Optional

from providers.text_provider import TextProvider


class AnthropicProvider(TextProvider):
    def __init__(self):
        import anthropic as sdk
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY no está definida en el entorno")
        self.client = sdk.AsyncAnthropic(api_key=api_key)
        self.model = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")

    async def complete(self, prompt: str, system: Optional[str] = None) -> str:
        kwargs: dict = {
            "model": self.model,
            "max_tokens": 2048,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system:
            kwargs["system"] = system

        response = await self.client.messages.create(**kwargs)
        return response.content[0].text if response.content else ""

    async def analyze_image(self, image_path: str, prompt: str) -> str:
        full_path = Path(__file__).parent.parent.parent / image_path
        with open(full_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode("utf-8")

        ext = full_path.suffix.lstrip(".").lower()
        media_type_map = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp", "gif": "image/gif"}
        media_type = media_type_map.get(ext, "image/jpeg")

        response = await self.client.messages.create(
            model=self.model,
            max_tokens=2048,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": image_data,
                            },
                        },
                        {"type": "text", "text": prompt},
                    ],
                }
            ],
        )
        return response.content[0].text if response.content else ""
