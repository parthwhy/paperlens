# Structure

## Root Directory Organization
- `app/` — Backend FastAPI code.
- `new_ui/` — Frontend React application.
- `pdf_cache/` — Storage directory for downloaded arXiv PDFs.
- `chroma_db/` — Storage directory for local persistent vector databases.
- `static/` — Exposed directory containing rendered `manim_scripts` and output `animations`.
- `start.bat` & `start.sh` — Bootstrapping scripts for concurrent boot of both backend and frontend layers.

## Backend (`app/`)
- `main.py` — Entry point wrapping the FastAPI application, CORS configuration, and static mount bindings.
- `papers.py` — API Router. Directs incoming HTTP requests to discrete sub-services.
- `ingestion.py` — Downloads raw PDFs, performs extraction, chunking, embedding, and saving.
- `rag_chat.py` — Performs vector lookup and orchestrates LLM queries for the AI chat panel.
- `tooltip.py` — Handles processing user-highlighted sentence context to produce analogies.
- `concept_map.py` — Handles NER mapping, parsing, and LLM classification for visual mapping.
- `manim_service.py` — Orchestrates the entire animation workflow including Scene Planning and Qwen Code Generation.
- `config.py` — Pydantic logic abstracting environment variables (`.env`).
- `schemas.py` — Request and Response models defined rigorously with Pydantic.

## Frontend (`new_ui/src/`)
- `App.tsx` — Root React Component managing top-level unified state.
- `services/api.ts` — Type-safe wrappers fetching data from the backend APIs via fetch wrappers.
- `components/` — Individual views and elements:
  - `LandingPage.tsx`, `DocumentView.tsx` (PDF tools), `ConceptMap.tsx` (D3 map), `ManimDashboard.tsx`.
- `types/` — Shared TypeScript models (e.g., `ChatMessage`, `ConceptNode`).
