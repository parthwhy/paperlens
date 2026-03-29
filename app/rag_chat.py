"""
RAGChatService
──────────────
Retrieves relevant chunks from ChromaDB, then answers using Groq LLM.
Every answer is strictly grounded in the paper — no hallucination outside it.
"""

import math


from groq import AsyncGroq
from openai import AsyncOpenAI
from loguru import logger
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder

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
        self.reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
        self.groq_client = AsyncGroq(api_key=settings.groq_api_key)
        self.openrouter_client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key
        ) if settings.openrouter_api_key else None

    async def chat(
        self,
        paper_id: str,
        message: str,
        history: list[ChatMessage],
        model: str = "groq"
    ) -> ChatResponse:

        # 1. Retrieve relevant chunks from ChromaDB
        search_query = await self._rewrite_query(message, history)
        retrieved = self._retrieve(paper_id, search_query, top_k=5)
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

        # 4. Call LLM (Groq or OpenRouter)
        if model == "openrouter" and self.openrouter_client:
            response = await self.openrouter_client.chat.completions.create(
                model="nvidia/nemotron-super-49b-v1:free",
                messages=messages,
                temperature=0.2,
                max_tokens=800,
            )
        else:
            response = await self.groq_client.chat.completions.create(
                model=settings.groq_model,
                messages=messages,
                temperature=0.2,
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

    async def _rewrite_query(self, message: str, history: list) -> str:
        if not history:
            return message  # no history = no rewriting needed

        recent = history[-3:]
        history_text = "\n".join(f"{t.role}: {t.content}" for t in recent)

        response = await self.groq_client.chat.completions.create(
            model=settings.groq_model,
            messages=[{
                "role": "user",
                "content": f"Given this conversation:\n{history_text}\n\nRewrite this follow-up question as a standalone search query (no pronouns, no references to 'it' or 'they'). Return ONLY the rewritten query, nothing else.\n\nFollow-up: {message}"
            }],
            temperature=0,
            max_tokens=100
        )
        rewritten = (response.choices[0].message.content or "").strip()
        logger.debug(f"[REWRITE] '{message}' → '{rewritten}'")
        return rewritten

    def _retrieve(self, paper_id: str, query: str, top_k: int = 5) -> list[dict]:
        collection = self.ingestion.chroma_client.get_collection(name=paper_id)

        # get all chunks for BM25
        all_data = collection.get(include=["documents", "metadatas"])
        all_docs = all_data["documents"]
        all_meta = all_data["metadatas"]

        # BM25 — exact keyword match
        tokenized = [doc.lower().split() for doc in all_docs]
        bm25 = BM25Okapi(tokenized)
        bm25_scores = bm25.get_scores(query.lower().split())
        bm25_top20 = sorted(range(len(all_docs)), key=lambda i: -bm25_scores[i])[:20]

        # Vector — semantic match
        query_embedding = self.ingestion.embed_model.encode([query], show_progress_bar=False)[0].tolist()
        vec_results = collection.query(query_embeddings=[query_embedding], n_results=20, include=["documents", "metadatas", "distances"])
        vec_docs = vec_results["documents"][0]

        # RRF — combine ranks
        doc_index = {doc: i for i, doc in enumerate(all_docs)}
        rrf_scores = {}
        for rank, idx in enumerate(bm25_top20):
            rrf_scores[idx] = rrf_scores.get(idx, 0) + 1 / (rank + 60)
        for rank, doc in enumerate(vec_docs):
            idx = doc_index.get(doc, -1)
            if idx >= 0:
                rrf_scores[idx] = rrf_scores.get(idx, 0) + 1 / (rank + 60)

        # top 20 fused candidates
        fused = sorted(rrf_scores, key=rrf_scores.get, reverse=True)[:20]
        candidates = [{"text": all_docs[i], "metadata": all_meta[i]} for i in fused]

        # cross-encoder rerank
        pairs = [[query, c["text"]] for c in candidates]
        scores = self.reranker.predict(pairs)
        ranked = sorted(zip(candidates, scores), key=lambda x: -x[1])

        return [
            {**c, "score": round(float(1 / (1 + math.exp(-s))), 3)}
            for c, s in ranked[:top_k]
        ]

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
