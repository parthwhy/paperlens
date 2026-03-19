"""
PaperIngestionService
─────────────────────
1. Fetch paper metadata from arXiv API
2. Download PDF
3. Parse PDF into structured chunks (by section)
4. Store chunks in ChromaDB with embeddings
"""

import re
import asyncio
import arxiv
import fitz                          # PyMuPDF
import chromadb
from pathlib import Path
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from llama_index.core.node_parser import SentenceSplitter

from sentence_transformers import SentenceTransformer

from app.config import settings
from app.schemas import IngestResponse


class PaperIngestionService:
    def __init__(self):
        # Use sentence-transformers for faster embedding
        self.embed_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.chroma_client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
        self._pdf_cache_dir = Path("./pdf_cache")
        self._pdf_cache_dir.mkdir(exist_ok=True)

    def _embed(self, texts: list[str]) -> list[list[float]]:
        """Embed texts using fastembed."""
        return list(self.embed_model.embed(texts))

    # ── Public ────────────────────────────────────────────────────────────────

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def ingest(self, arxiv_url: str) -> IngestResponse:
        paper_id = self._extract_arxiv_id(arxiv_url)
        logger.info(f"Ingesting paper: {paper_id}")

        # 1. Fetch metadata
        paper = self._fetch_metadata(paper_id)

        # 2. Download + parse PDF
        pdf_path = self._download_pdf(paper, paper_id)
        chunks = self._parse_pdf(pdf_path)
        logger.info(f"Parsed {len(chunks)} chunks from PDF")

        # 3. Embed + store in ChromaDB
        self._store_chunks(paper_id, chunks)

        return IngestResponse(
            paper_id=paper_id,
            title=paper.title,
            authors=[str(a) for a in paper.authors],
            abstract=paper.summary,
            total_chunks=len(chunks),
            message="Paper ingested successfully"
        )

    def get_collection(self, paper_id: str):
        """Return ChromaDB collection for this paper."""
        return self.chroma_client.get_collection(name=paper_id)

    def paper_exists(self, paper_id: str) -> bool:
        try:
            self.chroma_client.get_collection(name=paper_id)
            return True
        except Exception:
            return False

    # ── Private ───────────────────────────────────────────────────────────────

    def _extract_arxiv_id(self, url: str) -> str:
        """Extract clean arxiv ID from various URL formats."""
        # handles: arxiv.org/abs/2305.10601, arxiv.org/pdf/2305.10601, raw IDs
        match = re.search(r"(\d{4}\.\d{4,5}(v\d+)?)", url)
        if not match:
            raise ValueError(f"Could not extract arXiv ID from: {url}")
        return match.group(1)

    def _fetch_metadata(self, paper_id: str):
        search = arxiv.Search(id_list=[paper_id])
        results = next(search.results())
        if not results:
            raise ValueError(f"No paper found for ID: {paper_id}")
        return results

    def _download_pdf(self, paper, paper_id: str) -> Path:
        pdf_path = self._pdf_cache_dir / f"{paper_id}.pdf"
        if not pdf_path.exists():
            logger.info(f"Downloading PDF for {paper_id}")
            paper.download_pdf(dirpath=str(self._pdf_cache_dir), filename=f"{paper_id}.pdf")
        return pdf_path

    def _parse_pdf(self, pdf_path: Path) -> list[dict]:
        """
        Parse PDF into chunks, preserving section context.
        Returns list of dicts: {text, section, page}
        """
        doc = fitz.open(str(pdf_path))
        chunks = []
        current_section = "Abstract"

        # Section header pattern — matches "1. Introduction", "2.1 Method", etc.
        section_pattern = re.compile(r"^(\d+\.?\d*)\s+([A-Z][A-Za-z\s]+)$")

        for page_num, page in enumerate(doc):
            blocks = page.get_text("blocks")  # (x0,y0,x1,y1,text,block_no,block_type)
            for block in blocks:
                text = block[4].strip()
                if not text or len(text) < 20:
                    continue

                # Detect section headers
                first_line = text.split("\n")[0].strip()
                if section_pattern.match(first_line):
                    current_section = first_line

                chunks.append({
                    "text": text,
                    "section": current_section,
                    "page": page_num + 1
                })

        doc.close()

        # Further split large chunks at sentence level
        splitter = SentenceSplitter(chunk_size=512, chunk_overlap=64)
        final_chunks = []
        for chunk in chunks:
            if len(chunk["text"]) > 600:
                sub_docs = splitter.split_text(chunk["text"])
                for sub in sub_docs:
                    final_chunks.append({**chunk, "text": sub})
            else:
                final_chunks.append(chunk)

        return final_chunks

    def _store_chunks(self, paper_id: str, chunks: list[dict]):
        """Embed and store chunks in a paper-specific ChromaDB collection."""
        # Delete existing collection if re-ingesting
        try:
            self.chroma_client.delete_collection(name=paper_id)
        except Exception:
            pass

        collection = self.chroma_client.create_collection(name=paper_id)

        documents = [c["text"] for c in chunks]
        metadatas = [{"section": c["section"], "page": c["page"]} for c in chunks]
        ids = [f"{paper_id}_chunk_{i}" for i in range(len(chunks))]

        logger.info(f"Embedding {len(documents)} chunks...")
        
        # Embed all documents using sentence-transformers (much faster than fastembed)
        embeddings = self.embed_model.encode(documents, show_progress_bar=False, batch_size=32).tolist()

        collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

        logger.info(f"Stored {len(chunks)} chunks in ChromaDB collection '{paper_id}'")
