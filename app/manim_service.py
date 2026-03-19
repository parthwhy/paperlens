"""
ManimService
────────────
1. LLM generates a Manim Python script for the given concept
2. Script is executed server-side via subprocess
3. Resulting MP4 is saved to static/animations/
4. Frontend polls /animations/{id} for status, then plays MP4

This is the most complex service — the key insight is that the LLM
writes Manim code, not the animation itself. This means any concept
can be animated with no pre-built templates.
"""

import asyncio
import hashlib
import subprocess
import textwrap
from pathlib import Path

from groq import AsyncGroq
from loguru import logger

from app.config import settings
from app.schemas import AnimationResponse
from app.ingestion import PaperIngestionService


# ── Manim Code Generation Prompt ─────────────────────────────────────────────

MANIM_SYSTEM_PROMPT = """You are an expert at writing Manim Community Edition animations.
Generate a complete, runnable Manim Python script that visualizes the given concept.

STRICT RULES:
1. The class MUST be named `ConceptAnimation` and extend `Scene`
2. Use only Manim Community v0.18+ APIs
3. Keep animations under 30 seconds
4. Use simple shapes — Circle, Rectangle, Arrow, Text, MathTex
5. Add clear Text labels so the viewer understands what's happening
6. Use self.play() and self.wait() properly
7. DO NOT import anything outside of manim
8. Return ONLY the Python code, no markdown, no explanation

Example structure:
from manim import *

class ConceptAnimation(Scene):
    def construct(self):
        title = Text("Attention Mechanism", font_size=36)
        self.play(Write(title))
        self.wait(1)
        ...
"""


class ManimService:
    def __init__(self, ingestion_service: PaperIngestionService):
        self.ingestion = ingestion_service
        self.client = AsyncGroq(api_key=settings.groq_api_key)
        self.output_dir = Path(settings.manim_output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.scripts_dir = Path("./manim_scripts")
        self.scripts_dir.mkdir(exist_ok=True)

    async def generate(self, paper_id: str, concept: str) -> AnimationResponse:
        # Deterministic ID so same concept reuses cached animation
        anim_id = hashlib.md5(f"{paper_id}:{concept}".encode()).hexdigest()[:12]
        video_path = self.output_dir / f"{anim_id}.mp4"

        # Return cached if exists
        if video_path.exists():
            logger.info(f"Returning cached animation for: {concept}")
            return AnimationResponse(
                concept=concept,
                video_url=f"/static/animations/{anim_id}.mp4",
                duration_seconds=None,
                status="ready"
            )

        # Get paper context for this concept
        context = self._get_context(paper_id, concept)

        # Generate Manim code
        logger.info(f"Generating Manim script for concept: {concept}")
        manim_code = await self._generate_manim_code(concept, context)

        # Save script
        script_path = self.scripts_dir / f"{anim_id}.py"
        script_path.write_text(manim_code)

        # Execute Manim in background
        asyncio.create_task(
            self._render_animation(script_path, anim_id, video_path)
        )

        return AnimationResponse(
            concept=concept,
            video_url=f"/static/animations/{anim_id}.mp4",
            duration_seconds=None,
            status="generating"   # frontend polls until "ready"
        )

    async def get_status(self, anim_id: str) -> str:
        video_path = self.output_dir / f"{anim_id}.mp4"
        failed_path = self.output_dir / f"{anim_id}.failed"
        if video_path.exists():
            return "ready"
        if failed_path.exists():
            return "failed"
        return "generating"

    # ── Private ───────────────────────────────────────────────────────────────

    def _get_context(self, paper_id: str, concept: str, top_k: int = 3) -> str:
        try:
            collection = self.ingestion.chroma_client.get_collection(name=paper_id)
            
            # Embed query and convert to plain list
            embedding = list(self.ingestion.embed_model.embed([concept]))[0]
            query_embedding = embedding.tolist()  # converts ndarray to plain list
            
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                include=["documents"]
            )
            return "\n\n".join(results["documents"][0])
        except Exception as e:
            logger.warning(f"Could not retrieve context: {e}")
            return ""

    async def _generate_manim_code(self, concept: str, context: str) -> str:
        user_content = f"""Create a Manim animation that visually explains: "{concept}"

Here's how this concept is described in the paper:
{context[:800]}

Generate a clear, educational animation. Use arrows, boxes, and labels to show the process step by step."""

        response = await self.client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": MANIM_SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            temperature=0.4,
            max_tokens=1500,
        )

        code = response.choices[0].message.content.strip()

        # Strip markdown fences if model added them
        if code.startswith("```"):
            code = "\n".join(code.split("\n")[1:])
        if code.endswith("```"):
            code = "\n".join(code.split("\n")[:-1])

        # Safety check — ensure class name is correct
        if "class ConceptAnimation" not in code:
            code = code.replace("class Scene", "class ConceptAnimation")

        return code

    async def _render_animation(
        self,
        script_path: Path,
        anim_id: str,
        video_path: Path
    ):
        """Run Manim as a subprocess to render the animation."""
        quality_flag = "-ql" if settings.manim_quality == "low" else "-qh"

        cmd = [
            "manim",
            quality_flag,
            str(script_path),
            "ConceptAnimation",
        ]

        logger.info(f"Rendering Manim animation: {anim_id}")

        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)

            if proc.returncode == 0:
                # Find the rendered file in media/videos/{script_stem}/480p15/ConceptAnimation.mp4
                script_stem = script_path.stem
                expected_path = Path("media") / "videos" / script_stem / "480p15" / "ConceptAnimation.mp4"
                
                if expected_path.exists():
                    expected_path.rename(video_path)
                    logger.info(f"Animation ready: {video_path}")
                else:
                    logger.error(f"Manim ran but no MP4 found at {expected_path}")
                    (self.output_dir / f"{anim_id}.failed").touch()
            else:
                logger.error(f"Manim failed:\n{stderr.decode()}")
                (self.output_dir / f"{anim_id}.failed").touch()

        except asyncio.TimeoutError:
            logger.error(f"Manim render timed out for {anim_id}")
            proc.kill()
            (self.output_dir / f"{anim_id}.failed").touch()
        except Exception as e:
            logger.error(f"Manim render error: {e}")
            (self.output_dir / f"{anim_id}.failed").touch()
