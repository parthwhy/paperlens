"""
RAGChatService
──────────────
Retrieves relevant chunks from ChromaDB, then answers using Groq LLM.
Every answer is strictly grounded in the paper — no hallucination outside it.
"""

from groq import AsyncGroq
from loguru import logger

from app.config import settings
from app.schemas import ChatMessage, ChatResponse, CitedChunk
from app.ingestion import PaperIngestionService


SYSTEM_PROMPT = """You are PaperLens, an expert research assistant.
Your ONLY job is to answer questions about the paper provided in the context.

STRICT RULES:
- Only use information from the provided context chunks. 
- If the answer is not in the context, say "This isn't covered in the paper."
- Always cite which section your answer comes from.
- Be concise but precise. Use plain English — explain jargon when used.
- Format: answer first, then "📄 Source: [Section Name], Page X"
"""


class RAGChatService:
    def __init__(self, ingestion_service: PaperIngestionService):
        self.ingestion = ingestion_service
        self.client = AsyncGroq(api_key=settings.groq_api_key)

    async def chat(
        self,
        paper_id: str,
        message: str,
        history: list[ChatMessage]
    ) -> ChatResponse:

        # 1. Retrieve relevant chunks from ChromaDB
        retrieved = self._retrieve(paper_id, message, top_k=5)
        logger.debug(f"Retrieved {len(retrieved)} chunks for query: {message[:60]}")

        # 2. Build context string with section labels
        context = self._format_context(retrieved)

        # 3. Build message history for Groq
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Add prior conversation turns
        for turn in history[-6:]:  # last 6 turns to stay within context window
            messages.append({"role": turn.role, "content": turn.content})

        # Add current query with retrieved context
        user_content = f"""CONTEXT FROM PAPER:
{context}

QUESTION: {message}"""
        messages.append({"role": "user", "content": user_content})

        # 4. Call Groq
        response = await self.client.chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            temperature=0.2,         # low temp = factual, grounded
            max_tokens=800,
        )

        answer = response.choices[0].message.content

        # 5. Build citation objects
        citations = [
            CitedChunk(
                text=chunk["text"][:200] + "...",
                section=chunk["metadata"].get("section"),
                page=chunk["metadata"].get("page"),
                score=round(chunk["score"], 3)
            )
            for chunk in retrieved
        ]

        return ChatResponse(answer=answer, citations=citations)

    # ── Private ───────────────────────────────────────────────────────────────

    def _retrieve(self, paper_id: str, query: str, top_k: int = 5) -> list[dict]:
        """Query ChromaDB collection for most relevant chunks."""
        collection = self.ingestion.chroma_client.get_collection(name=paper_id)
        query_embedding = self.ingestion.embed_model.get_text_embedding(query)

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )

        chunks = []
        for i in range(len(results["documents"][0])):
            chunks.append({
                "text": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "score": 1 - results["distances"][0][i]  # convert distance to similarity
            })

        return chunks

    def _format_context(self, chunks: list[dict]) -> str:
        """Format retrieved chunks into a numbered context block."""
        parts = []
        for i, chunk in enumerate(chunks, 1):
            section = chunk["metadata"].get("section", "Unknown")
            page = chunk["metadata"].get("page", "?")
            parts.append(
                f"[{i}] Section: {section} | Page {page}\n{chunk['text']}"
            )
        return "\n\n---\n\n".join(parts)
