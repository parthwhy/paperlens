"""
TooltipService
──────────────
Given a sentence the user is hovering, explain it in plain English.
Optionally scoped to a specific term within the sentence.

The explanation is grounded in the paper's context (via RAG) so it 
never gives a generic Wikipedia-style definition — it explains what 
the term means *in the context of this specific paper*.
"""

from groq import AsyncGroq
from loguru import logger

from app.config import settings
from app.schemas import TooltipResponse
from app.ingestion import PaperIngestionService


TOOLTIP_PROMPT = """You are PaperLens, an expert at making dense academic text accessible.

A user is reading a research paper and hovering over a sentence they don't understand.
Your job: explain it in plain English in 2-3 sentences MAX.

RULES:
- Use the paper context provided to ground your explanation
- If explaining a specific term, define it in this paper's context (not generically)
- Add a one-line analogy if the concept is abstract (start it with "Think of it as:")
- Do NOT say "the paper says" or "according to" — just explain directly
- Keep it SHORT. This is a tooltip, not an essay.

Return your response as JSON:
{{
  "explanation": "...",
  "analogy": "..." or null,
  "related_terms": ["term1", "term2"]  // other jargon in the sentence worth knowing
}}
"""


class TooltipService:
    def __init__(self, ingestion_service: PaperIngestionService):
        self.ingestion = ingestion_service
        self.client = AsyncGroq(api_key=settings.groq_api_key)

    async def explain(
        self,
        paper_id: str,
        sentence: str,
        term: str | None = None
    ) -> TooltipResponse:

        # 1. Retrieve context — find chunks near this sentence
        query = term if term else sentence
        context = self._get_context(paper_id, query)

        # 2. Build the prompt
        focus = f'Specifically explain the term: "{term}"' if term else "Explain the full sentence."

        user_content = f"""PAPER CONTEXT:
{context}

SENTENCE THE USER IS HOVERING:
"{sentence}"

{focus}"""

        # 3. Call Groq with JSON mode
        response = await self.client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": TOOLTIP_PROMPT},
                {"role": "user", "content": user_content}
            ],
            temperature=0.3,
            max_tokens=300,
            response_format={"type": "json_object"}
        )

        import json
        raw = response.choices[0].message.content

        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse tooltip JSON: {raw}")
            data = {
                "explanation": raw,
                "analogy": None,
                "related_terms": []
            }

        return TooltipResponse(
            explanation=data.get("explanation", ""),
            analogy=data.get("analogy"),
            related_terms=data.get("related_terms", [])
        )

    # ── Private ───────────────────────────────────────────────────────────────

    def _get_context(self, paper_id: str, query: str, top_k: int = 3) -> str:
        """Retrieve top-k relevant chunks as a context string."""
        collection = self.ingestion.chroma_client.get_collection(name=paper_id)
        query_embedding = self.ingestion.embed_model.get_text_embedding(query)

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas"]
        )

        parts = []
        for i, doc in enumerate(results["documents"][0]):
            section = results["metadatas"][0][i].get("section", "")
            parts.append(f"[{section}] {doc}")

        return "\n\n".join(parts)
