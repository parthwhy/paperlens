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
    def __init__(self, ingestion_service: PaperIngestionService):
        self.ingestion = ingestion_service
        self.client = AsyncGroq(api_key=settings.groq_api_key)
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.warning("spaCy model not found. Run: python -m spacy download en_core_web_sm")
            self.nlp = None

    async def build(self, paper_id: str) -> ConceptMapResponse:
        logger.info(f"Building concept map for {paper_id}")

        # 1. Fetch all chunks from ChromaDB
        chunks = self._get_all_chunks(paper_id)

        # 2. Extract concepts per chunk
        concept_chunks = []   # list of sets, one per chunk
        concept_freq = Counter()

        for chunk_text in chunks:
            concepts = self._extract_concepts(chunk_text)
            concept_chunks.append(concepts)
            concept_freq.update(concepts)

        # 3. Keep only meaningful concepts (appear 2+ times)
        valid_concepts = {c for c, freq in concept_freq.items() if freq >= 2}
        logger.info(f"Found {len(valid_concepts)} valid concepts")

        # 4. Build co-occurrence graph
        G = nx.Graph()
        for concept in valid_concepts:
            G.add_node(concept, frequency=concept_freq[concept])

        for chunk_concepts in concept_chunks:
            valid_in_chunk = [c for c in chunk_concepts if c in valid_concepts]
            for i in range(len(valid_in_chunk)):
                for j in range(i + 1, len(valid_in_chunk)):
                    a, b = valid_in_chunk[i], valid_in_chunk[j]
                    if G.has_edge(a, b):
                        G[a][b]["weight"] += 1
                    else:
                        G.add_edge(a, b, weight=1)

        # 5. Prune weak edges (keep top connections)
        edges_to_remove = [
            (u, v) for u, v, d in G.edges(data=True) if d["weight"] < 2
        ]
        G.remove_edges_from(edges_to_remove)

        # 6. Classify node types via LLM
        top_concepts = [c for c, _ in concept_freq.most_common(30) if c in valid_concepts]
        node_types = await self._classify_concepts(top_concepts)

        # 7. Build response objects
        nodes = [
            ConceptNode(
                id=concept,
                label=concept,
                type=node_types.get(concept, "concept"),
                frequency=concept_freq[concept]
            )
            for concept in valid_concepts
            if concept in G.nodes
        ]

        edges = [
            ConceptEdge(
                source=u,
                target=v,
                weight=round(d["weight"] / max(1, G.degree(u) + G.degree(v)), 3)
            )
            for u, v, d in G.edges(data=True)
        ]

        logger.info(f"Concept map: {len(nodes)} nodes, {len(edges)} edges")

        return ConceptMapResponse(
            paper_id=paper_id,
            nodes=nodes,
            edges=edges
        )

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
