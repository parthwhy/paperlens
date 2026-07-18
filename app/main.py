"""
PaperLens — ML Backend
──────────────────────
FastAPI app entry point.
Run: uvicorn app.main:app --reload --port 8080
"""

from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.papers import router


app = FastAPI(
    title="Paper Lens Ai",
    description="Ai powered Paper Analyser and assistant",
    version="1.0.0"
)

# CORS middleware — allow the GitHub Pages frontend.
# For production, restrict allow_origins to your deployed frontend URL.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for Manim animations
static_dir = Path("./static")
static_dir.mkdir(exist_ok=True)
(static_dir / "animations").mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Static files for PDF cache
pdf_cache_dir = Path("./pdf_cache")
pdf_cache_dir.mkdir(exist_ok=True)
app.mount("/pdfs", StaticFiles(directory="pdf_cache"), name="pdfs")

# Include router with /api/v1 prefix
app.include_router(router, prefix="/api/v1")

