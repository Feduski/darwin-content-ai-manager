import base64
import os
from pathlib import Path
from typing import Optional

from providers.text_provider import TextProvider


class OpenAIProvider(TextProvider):
    def __init__(self):
        from openai import AsyncOpenAI
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY no está definida en el entorno")
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o")

    async def complete(self, prompt: str, system: Optional[str] = None) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            timeout=60,
        )
        return response.choices[0].message.content or ""

    async def analyze_image(self, image_path: str, prompt: str) -> str:
        full_path = Path(__file__).parent.parent.parent / image_path
        with open(full_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode("utf-8")

        ext = full_path.suffix.lstrip(".").lower()
        media_type = f"image/{ext}" if ext in {"jpg", "jpeg", "png", "webp", "gif"} else "image/jpeg"
        if ext == "jpg":
            media_type = "image/jpeg"

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{media_type};base64,{image_data}"},
                        },
                        {"type": "text", "text": prompt},
                    ],
                }
            ],
            timeout=60,
        )
        return response.choices[0].message.content or ""
