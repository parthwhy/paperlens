# PaperLens

> Reading academic papers was never this easy.

PaperLens is an AI-powered research assistant that transforms dense academic papers into interactive, understandable experiences. Paste an arXiv URL and get instant explanations, grounded Q&A with citations, and a visual concept map — all without leaving your browser.

---

## Features

- **Intelligent Chat** — Ask any question about the paper. Answers are strictly grounded in the paper's content with exact section and page citations. No hallucination outside the paper.
- **Hover Tooltips** — Select any sentence to get a plain-English explanation with an analogy, grounded in the paper's own context.
- **Concept Map** — Auto-generated force-directed graph showing how key ideas, methods, datasets, and metrics relate to each other.
- **PDF Viewer** — Read the original PDF inline with zoom, pagination, and a floating AI chat panel that you can drag and resize.
- **Manim Animations** — (Coming soon) LLM-generated visual animations of complex concepts using Manim Community Edition.

---

## Tech Stack

### Backend — FastAPI (Python 3.11+)

| Library | Purpose |
|---|---|
| `fastapi` | Async REST API framework |
| `groq` | LLM inference (llama-3.3-70b-versatile) |
| `chromadb` | Persistent vector database for embeddings |
| `sentence-transformers` | Local embedding model (all-MiniLM-L6-v2) |
| `PyMuPDF (fitz)` | PDF parsing and text extraction |
| `arxiv` | arXiv API client for metadata and PDF download |
| `llama-index` | SentenceSplitter for semantic chunking |
| `spaCy` | NLP for named entity recognition and noun phrase extraction |
| `networkx` | Graph construction for concept co-occurrence |
| `pydantic-settings` | Environment config with `.env` support |
| `loguru` | Structured logging |
| `tenacity` | Retry logic with exponential backoff |
| `manim` | Mathematical animation engine |

### Frontend — React 19 + Vite

| Library | Purpose |
|---|---|
| `react` + `react-dom` | UI library (v19) |
| `vite` | Build tool and dev server |
| `typescript` | Type safety |
| `tailwindcss v4` | Utility-first CSS |
| `framer-motion` | Animations and transitions |
| `react-pdf` | In-browser PDF rendering via PDF.js |
| `lucide-react` | SVG icon library |
| `d3` | Force-directed concept map graph |
| `clsx` + `tailwind-merge` | Conditional class utilities |

---

## Architecture

```
User Browser
    │
    ▼
React Frontend (Vite, port 3000)
    │  REST API calls
    ▼
FastAPI Backend (uvicorn, port 8000)
    ├── /api/v1/ingest        → PaperIngestionService
    ├── /api/v1/chat          → RAGChatService
    ├── /api/v1/tooltip       → TooltipService
    ├── /api/v1/concept-map   → ConceptMapService
    ├── /api/v1/animate       → ManimService
    └── /api/v1/paper/:id/pdf → FileResponse from pdf_cache/
         │
         ├── ChromaDB (./chroma_db)     ← vector store
         ├── PDF Cache (./pdf_cache)    ← downloaded PDFs
         └── Groq API                  ← LLM inference
```

---

## Data Flows

### Ingestion Flow

```
POST /ingest { arxiv_url }
  → Extract arXiv ID from URL (regex)
  → Fetch paper metadata from arXiv API
  → Download PDF → pdf_cache/{paper_id}.pdf
  → Parse PDF with PyMuPDF (page by page)
  → Detect section headers via regex
  → Split large paragraphs with SentenceSplitter (512 tokens, 64 overlap)
  → Embed all chunks with all-MiniLM-L6-v2 (batch_size=32)
  → Store in ChromaDB collection named by paper_id
  → Return job_id (background task)

Frontend polls GET /status/{job_id} every 2s until status = "completed"
```

### RAG Chat Flow

```
POST /chat { paper_id, message, history }
  → Embed query with all-MiniLM-L6-v2
  → Query ChromaDB: top 5 chunks by cosine similarity
  → Format context: [chunk_n] Section: X | Page Y\n{text}
  → Build messages: system prompt + last 6 history turns + context + question
  → Call Groq (llama-3.3-70b-versatile, temp=0.2, max_tokens=800)
  → Return { answer, citations[] }
```

### Tooltip Flow

```
POST /tooltip { paper_id, sentence, term? }
  → Embed term (or sentence) with all-MiniLM-L6-v2
  → Retrieve top 3 relevant chunks from ChromaDB
  → Call Groq with JSON mode (temp=0.3, max_tokens=300)
  → Return { explanation, analogy, related_terms[] }
```

### Concept Map Flow

```
GET /concept-map/{paper_id}
  → Fetch all chunks from ChromaDB
  → For each chunk: run spaCy NER + noun phrase extraction
  → Count concept frequency across all chunks
  → Keep concepts appearing 2+ times
  → Build co-occurrence graph (NetworkX): edge weight = shared chunk count
  → Prune edges with weight < 2
  → Classify top 30 concepts via Groq (method/dataset/metric/concept)
  → Return { nodes[], edges[] } for D3.js rendering
```

---

## File Structure

```
paperlens/
│
├── app/                          # Backend (FastAPI)
│   ├── main.py                   # App entry point, CORS, static mounts
│   ├── papers.py                 # All API route handlers
│   ├── ingestion.py              # PDF download, parsing, embedding, ChromaDB storage
│   ├── rag_chat.py               # RAG retrieval + Groq LLM chat
│   ├── tooltip.py                # Hover explanation service
│   ├── concept_map.py            # spaCy NER + NetworkX graph builder
│   ├── manim_service.py          # Animation generation service
│   ├── config.py                 # Pydantic settings from .env
│   └── schemas.py                # All Pydantic request/response models
│
├── new_ui/                       # Frontend (React + Vite)
│   ├── src/
│   │   ├── App.tsx               # Root component, view state controller
│   │   ├── main.tsx              # React DOM entry point
│   │   ├── index.css             # Tailwind + custom design tokens
│   │   ├── components/
│   │   │   ├── LandingPage.tsx   # Hero, arXiv URL input, ingestion polling
│   │   │   ├── DocumentView.tsx  # PDF viewer + draggable/resizable chat panel
│   │   │   ├── ConceptMap.tsx    # D3 force-directed graph
│   │   │   ├── Navbar.tsx        # Top navigation bar
│   │   │   ├── Sidebar.tsx       # Left sidebar navigation
│   │   │   └── ManimDashboard.tsx # Animation generation UI
│   │   ├── services/
│   │   │   └── api.ts            # Typed fetch wrapper for all API calls
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript interfaces (ChatMessage, ConceptNode, etc.)
│   │   └── lib/
│   │       └── utils.ts          # cn() utility (clsx + tailwind-merge)
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── pdf_cache/                    # Downloaded PDFs (gitignored)
├── chroma_db/                    # ChromaDB vector store (gitignored)
├── static/animations/            # Rendered Manim MP4s (gitignored)
├── .env                          # Environment variables (gitignored)
└── requirements.txt              # Python dependencies
```

---

## Key Technical Decisions

### Embedding Model: all-MiniLM-L6-v2
A lightweight sentence-transformers model that runs locally. Chosen over OpenAI embeddings for zero cost and offline capability. Produces 384-dimensional vectors. Batch encoding at size 32 keeps ingestion fast even for long papers.

### Vector Store: ChromaDB (persistent)
Each paper gets its own named collection (`paper_id`). This means queries are always scoped to a single paper — no cross-paper contamination. Persistent client writes to `./chroma_db` so ingested papers survive server restarts.

### Chunking Strategy: Hybrid paragraph + sentence splitting
PyMuPDF extracts text page by page. Paragraphs are split on double newlines. Chunks over 600 characters are further split by `SentenceSplitter` (512 token chunks, 64 token overlap). Section headers are detected via regex (`^\d+\.?\d*\s+[A-Z]...`) and attached as metadata to every chunk, enabling section-level citations.

### RAG Grounding: Strict system prompt
The LLM is instructed to only use information from the retrieved context chunks. If the answer isn't in the paper, it says so. Temperature is set to 0.2 to minimize creative deviation. The last 6 conversation turns are included for multi-turn coherence.

### Concept Map: Co-occurrence + NER
spaCy's `en_core_web_sm` model extracts named entities and noun phrases from each chunk. Concepts appearing fewer than 2 times are discarded. A NetworkX graph is built where nodes are concepts and edge weights are the number of chunks they co-appear in. Weak edges (weight < 2) are pruned. The top 30 concepts are classified by the LLM into method/dataset/metric/concept types.

### Frontend State: No global state library
All state lives in `App.tsx` and is passed down as props. View transitions are state-based (not routing). This keeps the architecture simple for a single-page tool.

### PDF Rendering: react-pdf + PDF.js
PDFs are served directly from the backend at `/api/v1/paper/{paper_id}/pdf`. The frontend renders them with `react-pdf` which wraps PDF.js. The worker version must exactly match `react-pdf`'s internal `pdfjs-dist` dependency (currently 5.4.296).

---

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- A [Groq API key](https://console.groq.com)

### Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Create .env file
echo "GROQ_API_KEY=your_key_here" > .env

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd new_ui
npm install
npm run dev   # starts on http://localhost:3000
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | Yes | — | Groq LLM API key |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Groq model name |
| `OPENROUTER_API_KEY` | No | `""` | Optional OpenRouter fallback |
| `CHROMA_PERSIST_DIR` | No | `./chroma_db` | ChromaDB storage path |
| `MANIM_OUTPUT_DIR` | No | `./static/animations` | Rendered animation output |
| `MANIM_QUALITY` | No | `low` | Manim render quality |

---

## API Reference

All endpoints are prefixed with `/api/v1`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/ingest` | Submit arXiv URL, returns `job_id` |
| `GET` | `/status/{job_id}` | Poll ingestion job status |
| `GET` | `/paper/{paper_id}` | Get paper metadata |
| `GET` | `/paper/{paper_id}/pdf` | Stream PDF file |
| `GET` | `/paper/{paper_id}/chunks` | Get all chunks by section |
| `POST` | `/chat` | RAG chat with citation response |
| `POST` | `/tooltip` | Explain a hovered sentence |
| `GET` | `/concept-map/{paper_id}` | Get concept graph nodes + edges |
| `POST` | `/animate` | Generate Manim animation |
| `GET` | `/animate/status/{anim_id}` | Poll animation job status |
| `GET` | `/health` | Health check |

Full interactive docs available at `http://127.0.0.1:8000/docs` when the backend is running.
