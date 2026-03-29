"""
ConceptMapService
─────────────────
Extracts key concepts from the paper and builds a graph of relationships.
Output is a list of nodes + edges that the frontend renders with D3.js.

Approach:
1. Pull all chunks from ChromaDB
2. Run spaCy NER + noun phrase extraction
3. Count co-occurrences in the same chunk → edge weight
4. Classify node type with a quick LLM call
5. Return nodes + edges for D3.js force graph
"""

import re
from collections import defaultdict, Counter

import spacy
import networkx as nx
from groq import AsyncGroq
from loguru import logger

from app.config import settings
from app.schemas import ConceptMapResponse, ConceptNode, ConceptEdge
from app.ingestion import PaperIngestionService


# Terms to always exclude from concept maps
STOP_CONCEPTS = {
    "paper", "model", "method", "approach", "result", "figure", "table",
    "section", "work", "et al", "show", "use", "propose", "present","we", "the", "in", "on", "as", "this", "that", 
"these", "while", "even", "many", "one", "each",
"our", "for", "an", "also", "end", "long"
}


class ConceptMapService:
    def __init__(self, ingestion_service: PaperIngestionService, manim_service=None):
        self.ingestion = ingestion_service
        self.manim_service = manim_service
        self.client = AsyncGroq(api_key=settings.groq_api_key)
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.warning("spaCy model not found. Run: python -m spacy download en_core_web_sm")
            self.nlp = None

    async def build(self, paper_id: str) -> ConceptMapResponse:
        logger.info(f"Building concept map for {paper_id}")

        # Use shared Gemini analysis — no extra API call if already cached
        analysis = await self.manim_service._analyze_paper_with_gemini(paper_id)

        nodes = [
            ConceptNode(
                id=c["id"],
                label=c["label"],
                type=c["type"],
                frequency=c["frequency"]
            )
            for c in analysis["concepts"]
        ]

        edges = [
            ConceptEdge(
                source=e["source"],
                target=e["target"],
                weight=1.0,
                relation=e["predicate"]
            )
            for e in analysis["edges"]
        ]

        logger.info(f"Concept map: {len(nodes)} nodes, {len(edges)} edges")
        return ConceptMapResponse(paper_id=paper_id, nodes=nodes, edges=edges)

    # ── Private ───────────────────────────────────────────────────────────────

    def _get_all_chunks(self, paper_id: str) -> list[str]:
        collection = self.ingestion.chroma_client.get_collection(name=paper_id)
        results = collection.get(include=["documents"])
        return results["documents"]

    def _extract_concepts(self, text: str) -> list[str]:
        """Extract noun phrases and named entities as concepts."""
        if self.nlp is None:
            # Fallback: basic regex for capitalized phrases
            words = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
            return [w.lower() for w in words if w.lower() not in STOP_CONCEPTS]

        doc = self.nlp(text[:1000])  # cap at 1000 chars for speed

        concepts = set()

        # Named entities (ORG, PRODUCT, WORK_OF_ART, etc.)
        for ent in doc.ents:
            if ent.label_ not in {"DATE", "TIME", "PERCENT", "MONEY", "CARDINAL"}:
                concept = ent.text.lower().strip()
                if concept not in STOP_CONCEPTS and len(concept) > 3:
                    concepts.add(concept)

        # Noun chunks (e.g. "attention mechanism", "transformer architecture")
        for chunk in doc.noun_chunks:
            concept = chunk.root.text.lower().strip()
            if concept not in STOP_CONCEPTS and len(concept) >4 :
                concepts.add(concept)
            # Also add multi-word if meaningful
            full = chunk.text.lower().strip()
            if len(full.split()) <= 3 and full not in STOP_CONCEPTS:
                concepts.add(full)

        return list(concepts)

    async def _extract_triples(self, chunks: list[str]) -> list[dict]:
        """Extract typed subject-predicate-object triples from chunks via LLM."""
        # only sample top 20 chunks to limit Groq calls
        sample = chunks[:20]
        combined = "\n\n".join(sample[:5])  # batch 5 at a time

        prompt = f"""Extract knowledge graph triples from this research paper text. Return ONLY a JSON array of triples. Each triple: {{"subject": "entity name", "predicate": one of [extends|uses|evaluates_on|introduces|contrasts|outperforms], "object": "entity name"}}

Rules:
- Entities must be specific (model names, dataset names, metrics) not generic words
- Max 15 triples
- Return [] if nothing clear found

Text: {combined}"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.groq_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_tokens=600,
                response_format={"type": "json_object"}
            )
            import json
            raw = json.loads(response.choices[0].message.content)
            # handle both {"triples": [...]} and direct array
            if isinstance(raw, list):
                return raw
            return raw.get("triples", raw.get("data", []))
        except Exception as e:
            logger.warning(f"Triple extraction failed: {e}")
            return []

    async def _classify_concepts(self, concepts: list[str]) -> dict[str, str]:
        """Classify each concept into: method, dataset, metric, concept."""
        if not concepts:
            return {}

        prompt = f"""Classify each of these terms from a research paper into one of:
- "method" (algorithms, techniques, models, architectures)
- "dataset" (data sources, benchmarks, corpora)
- "metric" (evaluation measures, scores)
- "concept" (abstract ideas, theories)

Terms: {', '.join(concepts)}

Respond ONLY as JSON: {{"term": "type", ...}}"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.groq_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_tokens=500,
                response_format={"type": "json_object"}
            )
            import json
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.warning(f"Concept classification failed: {e}")
            return {c: "concept" for c in concepts}
