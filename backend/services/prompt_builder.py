from typing import List, Optional

from models.models import BrandConfig, BrandCorpus


def _format_corpus_example(entry: BrandCorpus, index: int) -> str:
    lines = [f"Ejemplo {index} ({entry.source}):", entry.text]
    if entry.notes:
        lines.append(f"[Estilo: {entry.notes}]")
    return "\n".join(lines)


class PromptBuilder:
    """
    Arma el prompt de generación en tres capas:
      1. Prompt base de marca (brand_config.prompt_base)
      2. Few-shot: últimos N ejemplos del corpus
      3. Feedback summary (si existe)
    """

    def build(
        self,
        concept: str,
        brand_config: BrandConfig,
        corpus_examples: List[BrandCorpus],
        output_type: str,
        user_comment: Optional[str] = None,
    ) -> str:
        sections = [brand_config.prompt_base.strip()]

        if corpus_examples:
            examples_text = "\n\n".join(
                _format_corpus_example(e, i + 1)
                for i, e in enumerate(corpus_examples)
            )
            sections.append(f"## Ejemplos de estilo de la marca\n{examples_text}")

        if brand_config.feedback_summary:
            sections.append(
                f"## Preferencias aprendidas del usuario\n{brand_config.feedback_summary}"
            )

        output_instruction = {
            "text": "Generá únicamente texto para el post (caption/copy).",
            "image": "Generá únicamente un prompt detallado para generar la imagen del post.",
            "both": (
                "Generá: 1) el texto del post (caption/copy), "
                "2) un prompt detallado para generar la imagen."
            ),
        }.get(output_type, "Generá el contenido del post.")

        sections.append(f"## Concepto de inspiración\n{concept}")

        if user_comment:
            sections.append(f"## Indicación adicional del usuario\n{user_comment}")

        sections.append(f"## Tarea\n{output_instruction}")

        return "\n\n".join(sections)

    def select_corpus_examples(
        self, corpus: List[BrandCorpus], n: int = 4
    ) -> List[BrandCorpus]:
        """Devuelve los N más recientes. Mejorar con selección semántica en el futuro."""
        return corpus[:n]
