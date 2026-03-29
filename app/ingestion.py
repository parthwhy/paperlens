"""
PaperIngestionService
─────────────────────
1. Fetch paper metadata from arXiv API
2. Download PDF
3. Parse PDF into structured chunks (by section)
4. Store chunks in ChromaDB with embeddings
"""
import pickle    
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
        logger.info("[INIT] Initializing PaperIngestionService...")
        # Use sentence-transformers for faster embedding
        logger.info("[INIT] Loading embedding model 'all-MiniLM-L6-v2' (this may take 30-60s on first run)...")
        self.embed_model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("[INIT] Embedding model loaded successfully")
        
        logger.info(f"[INIT] Connecting to ChromaDB at {settings.chroma_persist_dir}...")
        self.chroma_client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
        logger.info("[INIT] ChromaDB connected")
        
        self._pdf_cache_dir = Path("./pdf_cache")
        self._pdf_cache_dir.mkdir(exist_ok=True)
        logger.info(f"[INIT] PDF cache directory: {self._pdf_cache_dir}")
        logger.info("[INIT] PaperIngestionService initialized successfully")

    # ── Public ────────────────────────────────────────────────────────────────

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=2, min=4, max=20))
    async def ingest(self, arxiv_url: str) -> IngestResponse:
        paper_id = self._extract_arxiv_id(arxiv_url)
        logger.info(f"[INGEST] Starting ingestion for paper: {paper_id}")

        # 1. Fetch metadata
        logger.info(f"[INGEST] Step 1/4: Fetching metadata from arXiv...")
        paper = self._fetch_metadata(paper_id)
        logger.info(f"[INGEST] Metadata fetched: {paper.title}")

        # 2. Download + parse PDF
        logger.info(f"[INGEST] Step 2/4: Downloading PDF...")
        pdf_path = self._download_pdf(paper, paper_id)
        logger.info(f"[INGEST] PDF downloaded to {pdf_path}")
        
        logger.info(f"[INGEST] Step 3/4: Parsing PDF into chunks...")
        chunks = self._parse_pdf(pdf_path)
        logger.info(f"[INGEST] Parsed {len(chunks)} chunks from PDF")

        # 3. Embed + store in ChromaDB
        logger.info(f"[INGEST] Step 4/4: Generating embeddings and storing in ChromaDB...")
        self._store_chunks(paper_id, chunks)
        logger.info(f"[INGEST] Ingestion complete for {paper_id}")

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
        """Fetch paper metadata from arXiv with rate limiting and better error handling."""
        import time
        from urllib.error import HTTPError
        
        try:
            logger.info(f"[FETCH] Querying arXiv API for paper: {paper_id}")
            logger.info(f"[FETCH] This may take 10-30 seconds depending on arXiv API response time...")
            
            # Add 3 second delay to respect arXiv rate limits (3 requests/second max)
            time.sleep(3)
            
            search = arxiv.Search(id_list=[paper_id])
            
            try:
                results = next(search.results())
                logger.info(f"[FETCH] Successfully retrieved metadata")
                logger.info(f"[FETCH] Title: {results.title}")
                return results
            except StopIteration:
                logger.error(f"[FETCH] No paper found for ID: {paper_id}")
                raise ValueError(f"No paper found for ID: {paper_id}. Check if the arXiv ID is correct.")
            
        except HTTPError as e:
            if e.code == 429:
                logger.error(f"[FETCH] arXiv rate limit exceeded (HTTP 429)")
                raise ValueError(
                    "arXiv API rate limit exceeded. Please wait 10-15 minutes before trying again. "
                    "arXiv allows maximum 3 requests per second."
                )
            else:
                logger.error(f"[FETCH] arXiv HTTP error: {e.code} - {e}")
                raise ValueError(f"Failed to fetch paper from arXiv: HTTP {e.code}")
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"[FETCH] arXiv API error: {type(e).__name__}: {e}")
            raise ValueError(f"Failed to fetch paper from arXiv: {e}")

    def _download_pdf(self, paper, paper_id: str) -> Path:
        pdf_path = self._pdf_cache_dir / f"{paper_id}.pdf"
        if not pdf_path.exists():
            logger.info(f"[DOWNLOAD] Downloading PDF for {paper_id} from arXiv...")
            try:
                paper.download_pdf(dirpath=str(self._pdf_cache_dir), filename=f"{paper_id}.pdf")
                logger.info(f"[DOWNLOAD] PDF downloaded successfully: {pdf_path}")
            except Exception as e:
                logger.error(f"[DOWNLOAD] Failed to download PDF: {e}")
                raise
        else:
            logger.info(f"[DOWNLOAD] PDF already cached: {pdf_path}")
        return pdf_path

    def _parse_pdf(self, pdf_path: Path) -> list[dict]:
        """
        Parse PDF into chunks, preserving section context.
        Returns list of dicts: {text, section, page}
        Enhanced to better capture equations and formatted text.
        """
        logger.info(f"[PARSE] Opening PDF: {pdf_path}")
        doc = fitz.open(str(pdf_path))
        logger.info(f"[PARSE] PDF has {len(doc)} pages")
        chunks = []
        current_section = "Abstract"

        # Section header pattern — matches "1. Introduction", "2.1 Method", etc.
        section_pattern = re.compile(r"^(\d+\.?\d*)\s+([A-Z][A-Za-z\s]+)$")

        for page_num, page in enumerate(doc):
            if page_num % 5 == 0:
                logger.info(f"[PARSE] Processing page {page_num + 1}/{len(doc)}")
            
            # Use "text" mode for better text extraction including equations
            # This preserves more formatting and special characters
            text = page.get_text("text")
            
            # Split into paragraphs (double newline or significant spacing)
            paragraphs = re.split(r'\n\s*\n', text)
            
            for para in paragraphs:
                para = para.strip()
                if not para or len(para) < 20:
                    continue

                # Detect section headers
                first_line = para.split("\n")[0].strip()
                if section_pattern.match(first_line):
                    current_section = first_line
                    continue

                chunks.append({
                    "text": para,
                    "section": current_section,
                    "page": page_num + 1
                })

        doc.close()
        logger.info(f"[PARSE] Extracted {len(chunks)} raw chunks")

        # Further split large chunks at sentence level
        logger.info(f"[PARSE] Splitting large chunks with SentenceSplitter...")
        splitter = SentenceSplitter(chunk_size=512, chunk_overlap=64)
        final_chunks = []
        for i, chunk in enumerate(chunks):
            if i % 50 == 0:
                logger.info(f"[PARSE] Splitting chunk {i}/{len(chunks)}")
            
            if len(chunk["text"]) > 600:
                sub_docs = splitter.split_text(chunk["text"])
                for sub in sub_docs:
                    final_chunks.append({**chunk, "text": sub})
            else:
                final_chunks.append(chunk)

        logger.info(f"[PARSE] Final chunk count: {len(final_chunks)}")
        return final_chunks

    def _store_chunks(self, paper_id: str, chunks: list[dict]):
        """Embed and store chunks in a paper-specific ChromaDB collection."""
        # Delete existing collection if re-ingesting
        try:
            logger.info(f"[STORE] Checking for existing collection '{paper_id}'...")
            self.chroma_client.delete_collection(name=paper_id)
            logger.info(f"[STORE] Deleted existing collection")
        except Exception:
            logger.info(f"[STORE] No existing collection found")

        logger.info(f"[STORE] Creating new collection '{paper_id}'...")
        collection = self.chroma_client.create_collection(name=paper_id)

        documents = [c["text"] for c in chunks]
        metadatas = [{"section": c["section"], "page": c["page"]} for c in chunks]
        ids = [f"{paper_id}_chunk_{i}" for i in range(len(chunks))]

        logger.info(f"[STORE] Generating embeddings for {len(documents)} chunks (this may take 30-60 seconds)...")
        
        # Embed all documents using sentence-transformers (much faster than fastembed)
        try:
            embeddings = self.embed_model.encode(documents, show_progress_bar=False, batch_size=32).tolist()
            logger.info(f"[STORE] Embeddings generated successfully")
        except Exception as e:
            logger.error(f"[STORE] Failed to generate embeddings: {e}")
            raise

        logger.info(f"[STORE] Adding {len(chunks)} chunks to ChromaDB...")
        try:
            collection.add(
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=ids
            )
            logger.info(f"[STORE] Successfully stored {len(chunks)} chunks in ChromaDB collection '{paper_id}'")
        except Exception as e:
            logger.error(f"[STORE] Failed to store chunks in ChromaDB: {e}")
            raise
