# Stack

## Overview
PaperLens is a full-stack, AI-powered web application designed for academic paper comprehension. It uses a Python-based asynchronous backend for processing and orchestration, and a modern React frontend for the user interface.

## Backend (Python)
- **Language**: Python 3.11+
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (0.115.0) via `uvicorn` (0.30.0)
- **Data Validation**: `pydantic` and `pydantic-settings`
- **PDF Processing**: `pymupdf` (1.24.5) for text and metadata extraction from papers
- **LLM Orchestration / RAG**: `llama-index-core` for chunking context, `chromadb` (0.5.5) for local vector storage, and `fastembed` (0.7.4) + `sentence-transformers` for embeddings.
- **NLP & Graphs**: `spacy` (3.7.5) and `networkx` (3.3) for concept map generation.
- **Animations**: `manim` (0.18.1) for server-side generation of explanation animations.
- **Utilities**: `loguru` (logging), `tenacity` (retry logic), `httpx` (async HTTP client).

## Frontend (React)
- **Framework**: React 19 (`react`, `react-dom`) + TypeScript
- **Bundler / Dev Server**: Vite (`vite` 6.2.0)
- **Styling**: Tailwind CSS 4, `clsx`, `tailwind-merge`
- **Visualization & Animation**: `framer-motion` (UI transitions) and `d3` (force-directed concept graph).
- **PDF Rendering**: `react-pdf` (wrapping PDF.js).

## Environment & Configuration
Configuration on the backend is managed by `pydantic-settings` pulling from a `.env` file containing API keys (`GROQ_API_KEY`, etc.) and database configurations.
