from typing import List

from providers.text_provider import TextProvider


EXTRACT_PROMPT = """\
Analizá el siguiente contenido de inspiración y extraé el concepto central de la campaña o post.
Describí:
1. La idea o mensaje principal.
2. El tono y registro (humor, emocional, aspiracional, informativo, etc.).
3. El formato comunicacional (storytelling, dato/estadística, llamada a la acción, etc.).

Respondé en 2-4 oraciones concisas, en español.

Contenido:
{content}
"""

SYNTHESIZE_PROMPT = """\
Analizá los siguientes {count} conceptos de inspiración y sintetizá un único concepto unificado
que capture la esencia común y el hilo conductor entre todos.
Respondé en 3-5 oraciones, en español.

Conceptos:
{concepts}
"""


class ConceptExtractor:
    def __init__(self, provider: TextProvider):
        self.provider = provider

    async def extract_from_text(self, text: str) -> str:
        prompt = EXTRACT_PROMPT.format(content=text)
        return await self.provider.complete(prompt)

    async def extract_from_image(self, image_path: str) -> str:
        prompt = (
            "Analizá esta imagen de inspiración y extraé el concepto central. "
            "Describí: 1) la idea o mensaje principal, 2) el tono visual y comunicacional, "
            "3) el formato. Respondé en 2-4 oraciones en español."
        )
        return await self.provider.analyze_image(image_path, prompt)

    async def synthesize(self, concepts: List[str]) -> str:
        if len(concepts) == 1:
            return concepts[0]
        concepts_text = "\n\n".join(f"[{i+1}] {c}" for i, c in enumerate(concepts))
        prompt = SYNTHESIZE_PROMPT.format(count=len(concepts), concepts=concepts_text)
        return await self.provider.complete(prompt)

    async def extract_items(self, inspo_items: list) -> str:
        """Extrae y sintetiza conceptos de una lista de items [{type, content}]."""
        concepts = []
        for item in inspo_items:
            if item["type"] == "text":
                concept = await self.extract_from_text(item["content"])
            else:
                concept = await self.extract_from_image(item["content"])
            concepts.append(concept)
        return await self.synthesize(concepts)
