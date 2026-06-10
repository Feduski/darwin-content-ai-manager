from typing import List

from providers.text_provider import TextProvider


SYNTHESIZE_PROMPT = """\
Sos un asistente que analiza el historial de feedback de un usuario sobre posts generados por IA.

A continuación hay {count} decisiones recientes (concepto de inspiración, resumen del output, decisión y razón si fue rechazado).

Escribí UN párrafo conciso (máximo 5 oraciones) que describa las preferencias del usuario:
qué tipo de posts aprueba, qué rechaza, qué patrones se repiten.
Este párrafo se usará como instrucción en futuros prompts de generación.

Decisiones:
{decisions_text}

Párrafo de preferencias:"""


def _format_decision(d: dict) -> str:
    status = "✓ APROBADO" if d["status"] == "approved" else "✗ RECHAZADO"
    line = f"{status} | Concepto: {d['concept'][:120]} | Output: {d['output'][:120]}"
    if d.get("rejection_reason"):
        line += f" | Razón: {d['rejection_reason']}"
    return line


class FeedbackSynthesizer:
    def __init__(self, provider: TextProvider):
        self.provider = provider

    async def synthesize(self, recent_decisions: List[dict]) -> str:
        """
        recent_decisions: lista de dicts con keys:
          - concept: str
          - output: str (texto resumido o descripción)
          - status: "approved" | "rejected"
          - rejection_reason: str | None
        """
        if not recent_decisions:
            return ""

        decisions_text = "\n".join(
            f"{i+1}. {_format_decision(d)}" for i, d in enumerate(recent_decisions)
        )
        prompt = SYNTHESIZE_PROMPT.format(
            count=len(recent_decisions), decisions_text=decisions_text
        )
        return await self.provider.complete(prompt)
