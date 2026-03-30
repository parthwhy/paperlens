"""
API Routes
──────────
All endpoints for PaperLens backend.
"""

import re
import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks
from loguru import logger

from app.schemas import (
    IngestRequest, IngestResponse,
    TooltipRequest, TooltipResponse,
    ChatRequest, ChatResponse,
    ConceptMapResponse,
    AnimationRequest, AnimationResponse,
)
from app.ingestion import PaperIngestionService
from app.rag_chat import RAGChatService
from app.tooltip import TooltipService
from app.concept_map import ConceptMapService
from app.manim_service import ManimService


router = APIRouter()

# Job store for background tasks
job_store = {}


# ── Dependency: shared service instances ─────────────────────────────────────

# Services that depend on ingestion share the same instance
_ingestion = PaperIngestionService()
_rag       = RAGChatService(_ingestion)
_tooltip   = TooltipService(_ingestion)
_manim     = ManimService(_ingestion)
_concept_map = ConceptMapService(_ingestion, _manim)


# ── Routes ────────────────────────────────────────────────────────────────────

async def run_ingest(job_id: str, arxiv_url: str):
    """Background task to ingest a paper."""
    try:
        logger.info(f"[JOB {job_id}] Starting ingestion for {arxiv_url}")
        
        # Extract paper_id to check if already exists
        match = re.search(r"(\d{4}\.\d{4,5}(v\d+)?)", arxiv_url)
        if not match:
            logger.error(f"[JOB {job_id}] Invalid arXiv URL format")
            job_store[job_id] = {
                "status": "failed",
                "error": f"Could not extract arXiv ID from: {arxiv_url}"
            }
            return
        
        paper_id = match.group(1)
        logger.info(f"[JOB {job_id}] Extracted paper_id: {paper_id}")
        
        # Check if paper already exists
        if _ingestion.paper_exists(paper_id):
            logger.info(f"[JOB {job_id}] Paper {paper_id} already exists in database")
            # Fetch paper metadata from arXiv
            from arxiv import Search
            search = Search(id_list=[paper_id])
            paper = next(search.results())
            collection = _ingestion.chroma_client.get_collection(name=paper_id)
            
            job_store[job_id] = {
                "status": "completed",
                "paper_id": paper_id,
                "result": {
                    "paper_id": paper_id,
                    "title": paper.title,
                    "authors": [str(a) for a in paper.authors],
                    "abstract": paper.summary,
                    "total_chunks": collection.count(),
                    "message": "Paper already ingested"
                }
            }
            logger.info(f"[JOB {job_id}] Completed (already existed)")
            return
        
        # Update status to processing
        job_store[job_id] = {"status": "processing", "progress": "Downloading paper..."}
        logger.info(f"[JOB {job_id}] Starting fresh ingestion")
        
        # Ingest the paper
        result = await _ingestion.ingest(arxiv_url)
        
        job_store[job_id] = {
            "status": "completed",
            "paper_id": result.paper_id,
            "result": result.model_dump()
        }
        logger.info(f"[JOB {job_id}] Ingestion completed successfully")
        
    except Exception as e:
        logger.error(f"[JOB {job_id}] Ingestion error: {e}", exc_info=True)
        job_store[job_id] = {
            "status": "failed",
            "error": str(e)
        }


@router.post("/ingest", tags=["Paper"])
async def ingest_paper(request: IngestRequest, background_tasks: BackgroundTasks):
    """
    Ingest an arXiv paper by URL.
    Downloads PDF, parses it into chunks, embeds and stores in ChromaDB.
    Returns a job_id to poll for status.
    """
    job_id = str(uuid.uuid4())
    job_store[job_id] = {"status": "processing", "result": None, "error": None}
    
    background_tasks.add_task(run_ingest, job_id, request.arxiv_url)
    
    return {"job_id": job_id, "status": "processing"}


@router.get("/papers", tags=["Paper"])
async def get_recent_papers(limit: int = 20):
    """
    Get a list of recently ingested papers.
    Used for the homepage 'Famous Papers' and 'Recent Papers' section.
    """
    try:
        papers = _ingestion.get_recent_papers(limit)
        return {"papers": papers}
    except Exception as e:
        logger.error(f"Error fetching recent papers: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch recent papers")


@router.get("/paper/{paper_id}", tags=["Paper"])
async def get_paper_details(paper_id: str):
    """
    Get details of an already ingested paper.
    Returns paper metadata if it exists in the system.
    """
    if not _ingestion.paper_exists(paper_id):
        raise HTTPException(status_code=404, detail="Paper not found. Ingest it first.")
    
    try:
        # Check if we have it in our new SQLite cache first
        metadata = _ingestion.get_paper_metadata(paper_id)
        if metadata:
            return {
                "paper_id": metadata["paper_id"],
                "title": metadata["title"],
                "authors": [a.strip() for a in metadata["authors"].split(",") if a.strip()],
                "abstract": metadata["abstract"],
                "message": "Paper found"
            }
            
        # Fallback to arXiv API if not in SQLite (e.g., ingested before SQLite was added)
        from arxiv import Search
        search = Search(id_list=[paper_id])
        paper = next(search.results())
        
        return {
            "paper_id": paper_id,
            "title": paper.title,
            "authors": [str(a) for a in paper.authors],
            "abstract": paper.summary,
            "message": "Paper found (fetched from arXiv fallback)"
        }
    except Exception as e:
        logger.error(f"Error fetching paper details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch paper details")


@router.get("/status/{job_id}", tags=["Paper"])
async def get_job_status(job_id: str):
    """
    Get the status of an ingestion job.
    Returns the job status and result/error if available.
    """
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job_store[job_id]




@router.post("/tooltip", response_model=TooltipResponse, tags=["Reading"])
async def get_tooltip(request: TooltipRequest):
    """
    Explain a sentence (or specific term) in plain English.
    Grounded in the paper's own context — not generic definitions.
    Called on hover in the frontend reader.
    """
    if not _ingestion.paper_exists(request.paper_id):
        raise HTTPException(status_code=404, detail="Paper not found. Ingest it first.")
    try:
        return await _tooltip.explain(
            paper_id=request.paper_id,
            sentence=request.sentence,
            term=request.term
        )
    except Exception as e:
        logger.error(f"Tooltip error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate tooltip")




@router.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat_with_paper(request: ChatRequest):
    """
    Ask any question about the paper.
    Returns an answer grounded strictly in the paper, with citations.
    """
    if not _ingestion.paper_exists(request.paper_id):
        raise HTTPException(status_code=404, detail="Paper not found. Ingest it first.")
    try:
        return await _rag.chat(
            paper_id=request.paper_id,
            message=request.message,
            history=request.history,
            model=request.model
        )
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Chat failed")


# @router.get("/concept-map/{paper_id}",response_model=ConceptMapResponse)
# async def concept_map(paper_id:str):
#     results =await _concept_map.build(paper_id=paper_id)
#     return results

# @router.post("/animate",response_model=AnimationResponse)

# async def animate(request:AnimationRequest):
#     result= await _manim.generate(paper_id=request.paper_id,concept=request.concept)
#     return result




@router.get("/concept-map/{paper_id}", response_model=ConceptMapResponse, tags=["Visualization"])
async def get_concept_map(paper_id: str):
    """
    Build a concept graph for the paper.
    Returns nodes (concepts) + edges (co-occurrence relationships).
    Rendered as a D3.js force graph on the frontend.
    """
    if not _ingestion.paper_exists(paper_id):
        raise HTTPException(status_code=404, detail="Paper not found. Ingest it first.")
    try:
        return await _concept_map.build(paper_id)
    except Exception as e:
        logger.error(f"Concept map error: {e}")
        raise HTTPException(status_code=500, detail="Failed to build concept map")


@router.post("/animate", response_model=AnimationResponse, tags=["Visualization"])
async def generate_animation(request: AnimationRequest):
    """
    Generate a Manim animation for a concept in the paper.
    LLM writes Manim Python code → rendered server-side → MP4 served.
    Initial call returns status: "generating". Poll /animate/status/{id} for completion.
    """
    if not _ingestion.paper_exists(request.paper_id):
        raise HTTPException(status_code=404, detail="Paper not found. Ingest it first.")
    try:
        return await _manim.generate(
            paper_id=request.paper_id,
            concept=request.concept
        )
    except Exception as e:
        logger.error(f"Animation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate animation")


@router.get("/animate/status/{anim_id}", tags=["Visualization"])
async def animation_status(anim_id: str):
    """Poll this endpoint to check if a Manim animation is ready."""
    status_obj = await _manim.get_status(anim_id)
    return {"anim_id": anim_id, **status_obj}


@router.get("/paper/{paper_id}/concepts", tags=["Visualization"])
async def get_paper_concepts(paper_id: str):
    """Returns all animatable concepts with explanations from Gemini analysis."""
    if not _ingestion.paper_exists(paper_id):
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Try NVIDIA Nemotron analysis first (this is the assigned model)
    try:
        logger.info(f"[CONCEPTS] Attempting NVIDIA Nemotron analysis for paper {paper_id}")
        analysis = await _manim._analyze_paper_with_gemini(paper_id)
        concepts = analysis.get("concepts", [])
        
        if concepts:
            logger.info(f"[CONCEPTS] SUCCESS: Returning {len(concepts)} concepts from NVIDIA Nemotron analysis")
            return {"paper_id": paper_id, "concepts": concepts}
        else:
            logger.warning(f"[CONCEPTS] NVIDIA Nemotron returned empty concepts list")
            
    except FileNotFoundError as e:
        logger.error(f"[CONCEPTS] PDF file not found: {e}")
        raise HTTPException(status_code=404, detail=f"PDF file not found for paper {paper_id}")
        
    except Exception as e:
        error_msg = f"[CONCEPTS] NVIDIA Nemotron analysis failed with error: {type(e).__name__}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        # User explicitly said: don't rely on fallback, use the assigned model
        # If analysis fails, report the error instead of silently falling back
        raise HTTPException(
            status_code=500, 
            detail=f"Paper analysis error: {type(e).__name__}: {str(e)}"
        )


@router.get("/paper/{paper_id}/chunks", tags=["Paper"])
async def get_paper_chunks(paper_id: str):
    """
    Get all chunks for a paper organized by sections.
    Returns full paper content for display in PaperViewer.
    """
    if not _ingestion.paper_exists(paper_id):
        raise HTTPException(status_code=404, detail="Paper not found. Ingest it first.")
    
    try:
        collection = _ingestion.get_collection(paper_id)
        results = collection.get(include=["documents", "metadatas"])
        
        # Organize chunks by section
        chunks_by_section = {}
        for i, (doc, meta) in enumerate(zip(results["documents"], results["metadatas"])):
            section = meta.get("section", "Unknown")
            page = meta.get("page", 0)
            chunk_id = results["ids"][i]
            
            if section not in chunks_by_section:
                chunks_by_section[section] = []
            
            chunks_by_section[section].append({
                "chunk_id": chunk_id,
                "text": doc,
                "page": page
            })
        
        # Sort sections by first appearance (page number)
        sorted_sections = sorted(
            chunks_by_section.items(),
            key=lambda x: min(c["page"] for c in x[1])
        )
        
        return {
            "paper_id": paper_id,
            "sections": [
                {
                    "section": section,
                    "chunks": chunks
                }
                for section, chunks in sorted_sections
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching chunks: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch paper chunks")


@router.get("/health", tags=["Meta"])
async def health():
    return {"status": "ok", "service": "PaperLens API"}


@router.get("/paper/{paper_id}/pdf", tags=["Paper"])
async def get_paper_pdf(paper_id: str):
    """
    Get the PDF file for a paper.
    Returns the raw PDF file from the cache.
    """
    from fastapi.responses import FileResponse
    import os
    
    if not _ingestion.paper_exists(paper_id):
        raise HTTPException(status_code=404, detail="Paper not found. Ingest it first.")
    
    # Look for PDF in cache
    pdf_path = os.path.join("pdf_cache", f"{paper_id}.pdf")
    
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found in cache")
    
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"{paper_id}.pdf"
    )



