# PaperLens 🔬
> Turn any research paper into an interactive, fully explained reading experience.

## What it does
- **Assisted Reader** — hover any sentence → instant plain-English explanation grounded in the paper
- **RAG Chat** — ask questions, get answers with section-level citations (never hallucinates outside the paper)
- **Manim Animations** — key concepts auto-animated like 3Blue1Brown, generated on-the-fly
- **Concept Map** — D3.js force graph of all key terms and their relationships

---

## Backend Architecture

```
arxiv URL
    │
    ▼
PaperIngestionService
    ├── arxiv API → metadata
    ├── PyMuPDF → PDF parsing (section-aware chunking)
    ├── HuggingFace Embeddings (BAAI/bge-small-en-v1.5)
    └── ChromaDB (one collection per paper)
    
    ▼
FastAPI Endpoints
    ├── POST /api/v1/ingest          → ingest paper
    ├── POST /api/v1/tooltip         → hover explanation (RAG-grounded)
    ├── POST /api/v1/chat            → Q&A with citations
    ├── GET  /api/v1/concept-map/:id → D3.js graph data
    └── POST /api/v1/animate         → Manim animation generation
    
    ▼
Groq LLM (llama-3.3-70b-versatile)
    ├── Tooltip explanations (JSON mode)
    ├── RAG chat answers
    ├── Concept classification
    └── Manim code generation
```

---

## Setup

### 1. Clone and install
```bash
git clone https://github.com/yourhandle/paperlens
cd paperlens
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 2. Configure environment
```bash
cp .env.example .env
# Add your GROQ_API_KEY (free at console.groq.com)
```

### 3. Run the backend
```bash
uvicorn app.main:app --reload
```

API docs auto-generated at: **http://localhost:8000/docs**

---

## API Usage Examples

### Ingest a paper
```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{"arxiv_url": "https://arxiv.org/abs/1706.03762"}'
```

### Get hover tooltip
```bash
curl -X POST http://localhost:8000/api/v1/tooltip \
  -H "Content-Type: application/json" \
  -d '{
    "paper_id": "1706.03762",
    "sentence": "We apply multi-head attention with scaled dot-product attention.",
    "term": "scaled dot-product attention"
  }'
```

### Chat with paper
```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "paper_id": "1706.03762",
    "message": "What is the main contribution of this paper?",
    "history": []
  }'
```

### Generate Manim animation
```bash
curl -X POST http://localhost:8000/api/v1/animate \
  -H "Content-Type: application/json" \
  -d '{
    "paper_id": "1706.03762",
    "concept": "multi-head attention mechanism"
  }'
# Returns status: "generating" — poll /api/v1/animate/status/{anim_id}
```

---

## Project Structure

```
paperlens/
├── app/
│   ├── main.py                  # FastAPI entrypoint
│   ├── core/
│   │   └── config.py            # Settings via pydantic-settings
│   ├── models/
│   │   └── schemas.py           # All request/response models
│   ├── services/
│   │   ├── ingestion.py         # arXiv → PDF → ChromaDB pipeline
│   │   ├── rag_chat.py          # RAG Q&A with citations
│   │   ├── tooltip.py           # Hover explanation service
│   │   ├── concept_map.py       # spaCy + NetworkX concept graph
│   │   └── manim_service.py     # LLM → Manim code → MP4
│   └── api/
│       └── routes/
│           └── papers.py        # All API route handlers
├── static/
│   └── animations/              # Rendered Manim MP4s served here
├── chroma_db/                   # ChromaDB persistence
├── pdf_cache/                   # Downloaded PDFs
├── requirements.txt
└── .env.example
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| API | FastAPI + Uvicorn |
| LLM | Groq (llama-3.3-70b-versatile) |
| Embeddings | BAAI/bge-small-en-v1.5 (local) |
| Vector Store | ChromaDB |
| RAG | LlamaIndex |
| PDF Parsing | PyMuPDF |
| NLP | spaCy |
| Graph | NetworkX |
| Animations | Manim Community Edition |
| Frontend | Next.js + D3.js (separate repo) |

---

## Day-by-Day Build Plan

| Day | Task |
|---|---|
| 1 | ✅ Backend scaffold + ingestion pipeline |
| 2 | Tooltip service + RAG chat working |
| 3 | Concept map + Manim pipeline |
| 4 | Next.js frontend + hover UI |
| 5 | D3.js concept map + animation player |
| 6 | Deploy Railway (backend) + Vercel (frontend) |
| 7 | Polish + README + LinkedIn post |

---

Built by [Parth Patel](https://github.com/yourhandle) — B.Tech CSE @ IIIT Naya Raipur
