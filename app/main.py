# """
# PaperLens — ML Backend
# ──────────────────────
# FastAPI app entry point.
# Run: uvicorn app.main:app --reload
# """

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.staticfiles import StaticFiles
# from pathlib import Path

# from app.api.routes.papers import router


# # ── App ───────────────────────────────────────────────────────────────────────

# app = FastAPI(
#     title="PaperLens API",
#     description="AI-powered research paper reading assistant",
#     version="1.0.0",
# )

# # ── CORS (allow Next.js frontend on localhost:3000) ───────────────────────────

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000", "https://paperlens.vercel.app"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ── Static files (Manim MP4s) ─────────────────────────────────────────────────

# static_dir = Path("./static")
# static_dir.mkdir(exist_ok=True)
# (static_dir / "animations").mkdir(exist_ok=True)
# app.mount("/static", StaticFiles(directory="static"), name="static")

# # ── Routes ────────────────────────────────────────────────────────────────────

# app.include_router(router, prefix="/api/v1")


# # ── Startup ───────────────────────────────────────────────────────────────────

# @app.on_event("startup")
# async def startup():
#     from loguru import logger
#     logger.info("PaperLens API starting up...")
#     logger.info("Docs available at: http://localhost:8000/docs")


from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.papers import router
# uvicorn app.main:app --reload --port 8080



app= FastAPI(
    title="Paper Lens Ai",
    description="Ai powered Paper Analyser and assistant",
    version="1.0.0"
)

# CORS middleware
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

