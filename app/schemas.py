from pydantic import BaseModel, HttpUrl
from typing import Optional


# ── Ingest ───────────────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    arxiv_url: str                       # e.g. https://arxiv.org/abs/2305.10601


class IngestResponse(BaseModel):
    paper_id: str                        # arxiv id, used in all future calls
    title: str
    authors: list[str]
    abstract: str
    total_chunks: int
    message: str


# ── Hover Tooltip ─────────────────────────────────────────────────────────────

class TooltipRequest(BaseModel):
    paper_id: str
    sentence: str                        # the sentence user is hovering
    term: Optional[str] = None           # specific word/phrase hovered (optional)


class TooltipResponse(BaseModel):
    explanation: str                     # plain English explanation
    analogy: Optional[str] = None        # one-line analogy if applicable
    related_terms: list[str] = []        # other terms in the paper this connects to


# ── RAG Chat ──────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str                            # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    paper_id: str
    message: str
    history: list[ChatMessage] = []
    model: str = "groq"  # "groq" or "openrouter"


class CitedChunk(BaseModel):
    text: str
    section: Optional[str]
    page: Optional[int]
    score: float


class ChatResponse(BaseModel):
    answer: str
    citations: list[CitedChunk]


# ── Concept Map ───────────────────────────────────────────────────────────────

class ConceptNode(BaseModel):
    id: str
    label: str
    type: str                            # "method", "dataset", "metric", "concept"
    frequency: int


class ConceptEdge(BaseModel):
    source: str
    target: str
    weight: float
    relation: Optional[str] = None   # e.g. "extends", "evaluates_on"


class ConceptMapResponse(BaseModel):
    paper_id: str
    nodes: list[ConceptNode]
    edges: list[ConceptEdge]


# ── Manim Animation ───────────────────────────────────────────────────────────

class AnimationRequest(BaseModel):
    paper_id: str
    concept: str                         # e.g. "attention mechanism", "training loop"


class AnimationResponse(BaseModel):
    job_id: str                          # unique animation ID for polling
    concept: str
    video_url: str                       # served from /static/animations/
    duration_seconds: Optional[float]
    status: str                          # "ready" | "generating" | "failed"


