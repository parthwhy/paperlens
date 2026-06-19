<div align="center">

# 🔍 PaperLens

### Turn any arXiv paper into an interactive, grounded research assistant

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-async-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Groq](https://img.shields.io/badge/LLM-Groq%20Llama--3.3--70B-F55036?style=flat)](https://groq.com/)
[![ChromaDB](https://img.shields.io/badge/Vector%20DB-ChromaDB-purple?style=flat)](https://www.trychroma.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat)](LICENSE)

[Features](#-features) • [Architecture](#-architecture) • [Engineering Highlights](#-engineering-highlights) • [Setup](#-setup) • [API](#-api-reference)

</div>

<!-- TODO(Parth): drop a 10–15s demo GIF or 3 screenshots here — landing page, chat with citations, concept map. This is the single highest-leverage addition for recruiter scan-time. -->

---

## Why PaperLens

Reading a dense ML paper cold takes hours — tracing notation, re-reading methods sections, cross-checking claims. **PaperLens compresses that into minutes.** Paste an arXiv URL and get citation-grounded Q&A, plain-English explanations on hover, and a visual concept map of how the paper's ideas connect — all running on a self-built multi-model LLM pipeline, not a single API wrapper.

## ⚡ Engineering Highlights

*The parts that took real debugging, not just API calls:*

- **95%+ JSON parsing reliability** in production by building automatic repair logic around LLM structured-output failures
- **Diagnosed and fixed a 75s+ async timeout bug** in FastAPI — traced the root cause through Python's event loop internals down to blocking calls inside background tasks, resolved via `BackgroundTasks` + executor isolation
- **Fine-tuned Qwen2.5-Coder-7B** on a self-built dataset of 50+ Manim animation examples to convert plain-English concept descriptions into executable animation code — meaningfully outperforming the base model on this task
- **Multi-model LLM orchestration**: Groq Llama-3.3-70B for grounded chat, NVIDIA Nemotron for structured storyboard extraction, fine-tuned Qwen for code generation — each model used where its strengths fit, not one model doing everything
- **Strict RAG grounding**: section-aware chunking (512 tokens, 64 overlap) + cosine retrieval + a constrained system prompt that forces the LLM to say "not in this paper" rather than hallucinate — zero ungrounded answers by design, not by luck

## ✨ Features

| | |
|---|---|
| 🔎 **Grounded Chat** | Ask anything about the paper — every answer cites exact section + page, with no hallucination outside the source text |
| 💬 **Hover Explanations** | Select any sentence → plain-English explanation + analogy, generated in context |
| 🕸️ **Concept Map** | Auto-generated force-directed graph (D3.js) of how methods, datasets, and metrics relate |
| 📄 **Inline PDF Viewer** | Read the original PDF with zoom/pagination and a draggable, resizable AI chat panel |
| 🎬 **Manim Animations** *(in progress)* | LLM-generated visual walkthroughs of complex concepts |

## 🏗 Architecture

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

<details>
<summary><b>📊 Data flow detail (ingestion, RAG chat, tooltips, concept map)</b></summary>

**Ingestion**
```
POST /ingest { arxiv_url }
  → Extract arXiv ID → fetch metadata → download PDF
  → Parse with PyMuPDF (page by page) → detect section headers via regex
  → Split with SentenceSplitter (512 tokens, 64 overlap)
  → Embed with all-MiniLM-L6-v2 (batch_size=32) → store in ChromaDB
  → Background job; frontend polls /status/{job_id} every 2s
```

**RAG Chat**
```
POST /chat { paper_id, message, history }
  → Embed query → top-5 chunks by cosine similarity from ChromaDB
  → Build context with section/page metadata + last 6 turns of history
  → Groq llama-3.3-70b-versatile (temp=0.2) → { answer, citations[] }
```

**Tooltip**
```
POST /tooltip { paper_id, sentence, term? }
  → Embed term → top-3 relevant chunks → Groq JSON mode (temp=0.3)
  → { explanation, analogy, related_terms[] }
```

**Concept Map**
```
GET /concept-map/{paper_id}
  → spaCy NER + noun-phrase extraction per chunk
  → Keep concepts appearing 2+ times → NetworkX co-occurrence graph
  → Prune weak edges (weight < 2) → LLM classifies top 30 concepts
  → { nodes[], edges[] } for D3 rendering
```

</details>

## 🧠 Key Technical Decisions

<details>
<summary><b>Embedding model: all-MiniLM-L6-v2</b></summary>

Lightweight, local sentence-transformers model — chosen over OpenAI embeddings for zero cost and full offline capability. 384-dim vectors, batch size 32 keeps ingestion fast even on long papers.
</details>

<details>
<summary><b>Vector store: per-paper ChromaDB collections</b></summary>

Each paper gets its own named collection, so retrieval is always scoped to a single paper with zero cross-paper contamination. Persistent client survives server restarts.
</details>

<details>
<summary><b>Chunking: hybrid paragraph + sentence splitting</b></summary>

PyMuPDF extracts page-by-page text, paragraphs split on double newlines, then anything over 600 characters is re-split via `SentenceSplitter`. Section headers are regex-detected and attached as metadata to every chunk — this is what makes section-level citation possible.
</details>

<details>
<summary><b>RAG grounding: strict system prompt + low temperature</b></summary>

The LLM is constrained to only use retrieved context and explicitly told to say "not in this paper" when it doesn't know. Temperature 0.2 minimizes creative deviation; last 6 turns included for multi-turn coherence.
</details>

<details>
<summary><b>Concept map: co-occurrence graph + NER</b></summary>

spaCy extracts named entities and noun phrases per chunk. Concepts appearing fewer than 2 times are discarded; a NetworkX graph weights edges by shared-chunk co-occurrence; weak edges are pruned before the top 30 concepts are LLM-classified into method/dataset/metric/concept.
</details>

## 🛠 Tech Stack

**Backend** — FastAPI · Groq (Llama-3.3-70B) · ChromaDB · sentence-transformers · PyMuPDF · LlamaIndex · spaCy · NetworkX · Manim · tenacity · loguru

**Frontend** — React 19 · Vite · TypeScript · Tailwind CSS v4 · Framer Motion · react-pdf (PDF.js) · D3.js

## 🚀 Setup

**Prerequisites:** Python 3.11+, Node.js 18+, a [Groq API key](https://console.groq.com)

```bash
# Backend
pip install -r requirements.txt
python -m spacy download en_core_web_sm
echo "GROQ_API_KEY=your_key_here" > .env
uvicorn app.main:app --reload --port 8000

# Frontend
cd new_ui
npm install
npm run dev   # http://localhost:3000
```

<details>
<summary><b>Environment variables</b></summary>

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | Yes | — | Groq LLM API key |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Groq model name |
| `OPENROUTER_API_KEY` | No | `""` | Optional fallback |
| `CHROMA_PERSIST_DIR` | No | `./chroma_db` | Vector store path |
| `MANIM_OUTPUT_DIR` | No | `./static/animations` | Rendered animation output |
| `MANIM_QUALITY` | No | `low` | Manim render quality |

</details>

## 📡 API Reference

All endpoints prefixed with `/api/v1`. Full interactive docs at `/docs` when the backend is running.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/ingest` | Submit arXiv URL, returns `job_id` |
| `GET` | `/status/{job_id}` | Poll ingestion status |
| `GET` | `/paper/{paper_id}` | Paper metadata |
| `GET` | `/paper/{paper_id}/pdf` | Stream PDF |
| `GET` | `/paper/{paper_id}/chunks` | All chunks by section |
| `POST` | `/chat` | RAG chat with citations |
| `POST` | `/tooltip` | Explain a hovered sentence |
| `GET` | `/concept-map/{paper_id}` | Concept graph nodes + edges |
| `POST` | `/animate` | Generate Manim animation |
| `GET` | `/animate/status/{anim_id}` | Poll animation job status |
| `GET` | `/health` | Health check |

## 🗺 Roadmap

- [ ] Ship Manim animation generation to production
- [ ] Multi-paper comparison mode
- [ ] Export grounded Q&A sessions as study notes

## 👤 Author

**Parth Patel** — AI Research Intern @ Lexsi Labs · B.Tech CS, IIIT Naya Raipur

[GitHub](https://github.com/parthwhy) · [LinkedIn](https://linkedin.com/in/parth-patel-0a3294290)

---

<div align="center">
<i>If this project is useful or interesting, a ⭐ would be appreciated.</i>
</div>
