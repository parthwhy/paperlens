# Architecture

## High-Level Architecture
PaperLens uses a standard client-server pattern communicating via REST APIs.
The system relies heavily on decoupled asynchronous background processing due to the intensive nature of PDF parsing, embedding generation, LLM inference, and Manim rendering.

### 1. Data Flow: Ingestion
1. Client submits an arXiv URL to `app/ingestion.py`.
2. A background task is spawned. The PDF is saved locally, parsed by PyMuPDF, split by a semantic chunker, and mapped (via FastEmbed) to local ChromaDB collections.
3. The frontend polls a status endpoint until the state switches to "completed".

### 2. Data Flow: Chat and Tooltips
1. Real-time REST endpoints (`app/rag_chat.py` and `app/tooltip.py`).
2. The user query is embedded via FastEmbed.
3. ChromaDB retrieves top relevant context chunks based on vector distance metadata.
4. An LLM (Groq Llama 3.3) takes context and returns answers, directly embedding exact citations.

### 3. Data Flow: Concept Maps
1. Triggers heavy AI analysis on paper load via `app/concept_map.py`.
2. Retrieves all chunks from local Chroma, detects concepts with `spaCy` NER, builds a frequency graph using `NetworkX`.
3. An advanced LLM (NVIDIA Nemotron 49B) filters, structures the JSON, which the backend auto-repairs on failure.
4. Returns D3.js-ready node and edge data structures to the client.

### 4. Data Flow: Animation Service
1. Implements a Two-Stage Pipeline inside `app/manim_service.py`.
   - **Stage 1 (Planner)**: NVIDIA Nemotron plans a storyboard.
   - **Stage 2 (Coder)**: A fine-tuned Qwen-2.5-Coder model generates Python Manim executable code.
2. Manim code executes server-side, saves to a static folder to be served back to the React UI as an MP4.

## Layer Abstractions
- **Presentation**: React 19 + TypeScript.
- **Routing & Controllers**: FastAPI `papers.py` acts as the router for different services.
- **Service Layer**: Discrete `.py` files containing isolated operational flow logic (e.g. `ingestion.py`, `manim_service.py`).
- **Persistence**: File system for PDFs/Videos, ChromaDB for semantic vectors.
