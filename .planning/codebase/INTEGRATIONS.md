# Integrations

## External AI APIs
- **Groq API**: Currently utilizes `llama-3.3-70b-versatile` as the main LLM for RAG Chat, Tooltips (hover explanations), and general text tasks. Chosen for high-speed inference.
- **NVIDIA API**: Configured to use Nemotron (`nvidia/llama-3.3-nemotron-super-49b-v1.5`) primarily for advanced analysis required in Concept Maps and Animation Scene Planning.
- **OpenRouter (Optional)**: Provided as an optional fallback in configuration (`OPENROUTER_API_KEY`).
- **Google GenAI**: Package is present in the UI dependencies (`@google/genai`), potentially for future multi-modal capabilities or client-side generation.

## Data Sources
- **arXiv API**: Uses the Python `arxiv` library to fetch paper metadata and download PDF source documents given an arXiv URL.

## Local Services
- **ChromaDB**: Persists vectors locally to the filesystem at `./chroma_db`. It isolates each paper into a dynamically named collection based on `paper_id`.
- **FastEmbed**: Generates vector embeddings for RAG locally without pinging external APIs, currently mapping via `BAAI/bge-small-en-v1.5` or `all-MiniLM-L6-v2`.

## Execution Environment Integrations
- **Manim Engine**: Generates animations by directly invoking local Manim command-line functionality server-side to output MP4 files into the `static/animations/` static directory.
