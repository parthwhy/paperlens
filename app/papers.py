"""
API Routes
──────────
All endpoints for PaperLens backend.
"""

from fastapi import APIRouter, HTTPException, Depends
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


# ── Dependency: shared service instances ─────────────────────────────────────

def get_ingestion() -> PaperIngestionService:
    return PaperIngestionService()

# Services that depend on ingestion share the same instance
_ingestion = PaperIngestionService()
_rag = RAGChatService(_ingestion)
_tooltip = TooltipService(_ingestion)
_concept_map = ConceptMapService(_ingestion)
_manim = ManimService(_ingestion)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/ingest", response_model=IngestResponse, tags=["Paper"])
async def ingest_paper(request: IngestRequest):
    """
    Ingest an arXiv paper by URL.
    Downloads PDF, parses it into chunks, embeds and stores in ChromaDB.
    Call this first before any other endpoint.
    """
    try:
        result = await _ingestion.ingest(request.arxiv_url)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Ingestion error: {e}")
        raise HTTPException(status_code=500, detail="Failed to ingest paper")




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
            history=request.history
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
    status = await _manim.get_status(anim_id)
    return {"anim_id": anim_id, "status": status}


@router.get("/health", tags=["Meta"])
async def health():
    return {"status": "ok", "service": "PaperLens API"}



