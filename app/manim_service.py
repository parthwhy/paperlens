"""
ManimService
────────────
1. Gemini analyzes the full PDF → structured concept data with rich visual_hint schema
2. Groq (or Nemotron) plans a JSON scene storyboard from that structured data
3. Qwen-2.5-Coder (or DeepSeek) converts the JSON plan to runnable Manim code
4. Manim renders the script to MP4 via subprocess
5. Frontend polls /animate/status/{id} until "ready", then plays MP4

Key improvements over v1:
- visual_hint is now a structured object (metaphor, objects, steps, layout, color_logic)
- key_equation field carries LaTeX for MathTex rendering
- Planner outputs JSON scene plan instead of freeform prose
- Code-gen system prompt includes a working few-shot example + layout rules
- Retry passes the original context (not empty string) + parsed error details
- Context string puts the most actionable data first, never truncated mid-sentence
- Supports NVIDIA Nemotron as planner and Qwen-2.5-Coder as code-gen via config
"""

import asyncio
import hashlib
import json
import re
from pathlib import Path

from groq import AsyncGroq
from openai import AsyncOpenAI
from loguru import logger

from app.config import settings
from app.schemas import AnimationResponse
from app.ingestion import PaperIngestionService


# ── Prompts ───────────────────────────────────────────────────────────────────

GEMINI_ANALYSIS_PROMPT = """Analyze this research paper and return ONLY a JSON object. No explanation, no markdown, just raw JSON.

Schema:
{
  "concepts": [
    {
      "id": "snake_case_unique_id",
      "label": "Human readable name",
      "type": "method|dataset|metric|concept",
      "explanation": "What it is and how it works in 2-3 sentences. Be precise — mention inputs, outputs, and the core mechanism.",
      "key_equation": "LaTeX string of the central formula if one exists, else null",
      "visual_hint": "A one-sentence description of how to animate this concept. E.g: 'Show query vectors casting attention beams onto key vectors with varying brightness'",
      "importance": 5,
      "frequency": 7
    }
  ],
  "edges": [
    {
      "source": "concept_id",
      "predicate": "extends|uses|evaluates_on|introduces|contrasts|outperforms|part_of|enables",
      "target": "concept_id"
    }
  ]
}

Rules:
- Extract the 8-12 MOST IMPORTANT concepts only. Quality over quantity.
- importance: integer 1-10 indicating how central this concept is to the paper
- visual_hint must be a single string (not an object), max 1 sentence
- key_equation must be valid LaTeX or null
- type must be exactly one of: method, dataset, metric, concept
- All edge source/target must reference an id in the concepts list
- Only add edges where relationship is explicitly stated in the paper
- Keep total response under 3000 tokens"""


PLANNER_SYSTEM_PROMPT = """You are an expert at converting research paper concepts into structured Manim animation storyboards.
Output ONLY a JSON object. No prose, no markdown fences, no explanation.

Schema:
{
  "title": "Short animation title shown at top",
  "total_duration_hint": 25,
  "scenes": [
    {
      "id": 1,
      "title": "Scene label for logging",
      "objects": [
        {
          "name": "python_var_name",
          "type": "Text|Circle|Rectangle|Arrow|MathTex|Line|Dot|VGroup",
          "content": "display text or LaTeX string for MathTex",
          "position": "UP|DOWN|LEFT|RIGHT|CENTER|UP*2|LEFT*3|ORIGIN",
          "color": "BLUE|WHITE|YELLOW|GREEN|RED|ORANGE|GRAY|PURPLE",
          "scale": 1.0
        }
      ],
      "animations": [
        "Write(title)",
        "FadeIn(box, shift=UP*0.3)",
        "Create(arrow)",
        "Transform(obj_a, obj_b)",
        "obj.animate.set_color(YELLOW)",
        "obj.animate.scale(1.3)"
      ],
      "wait": 1.5
    }
  ]
}

Rules:
- 4-6 scenes maximum
- Every object used in animations must appear in that scene's objects list
- Use MathTex for any equation — never Text for math notation
- Prefer showing a process/transformation over a static diagram
- position values must be valid Manim direction expressions
- animation strings must be valid Manim animation calls
- wait is seconds to pause after all animations in that scene complete"""


MANIM_SYSTEM_PROMPT = """You are a Manim Community Edition v0.18 expert. Convert JSON scene plans into complete, runnable Python animation scripts.

ABSOLUTE RULES:
1. Class MUST be named `ConceptAnimation` and extend `Scene`
2. `from manim import *` is the ONLY import — no os, no sys, no external libs
3. Every visual change needs self.play() — never mutate objects silently
4. Use self.wait() between scenes for pacing
5. Use MathTex() for ALL equations/formulas — never Text() for math
6. Keep all objects within frame: use .to_edge(), .shift(), .move_to(), .next_to()
7. After creating multiple related objects wrap them: group = VGroup(a, b, c)
8. Return ONLY raw Python code — no markdown fences, no comments explaining the plan

CLARITY & PACING REQUIREMENTS:
9. Add explanatory text labels for EVERY major step — tell the viewer what they're seeing
10. Use descriptive Text() objects to narrate the process (e.g., "Step 1: Initialize inputs", "Computing attention scores")
11. Space objects generously — minimum 1.0 unit between major elements, use buff=0.5 or higher
12. Time animations properly:
   - Use self.wait(1.5) after introducing new concepts
   - Use self.wait(0.5) between related steps
   - Use self.wait(2) before transitioning to next major scene
   - Never rush — viewer needs time to read text and understand visuals
13. Clear the screen between major scenes: self.play(FadeOut(VGroup(*self.mobjects))) before starting new scene
14. Prevent overlaps:
   - Check object positions before placing new elements
   - Use .next_to() with proper buff parameter instead of absolute positioning
   - Arrange related objects in VGroup with .arrange(RIGHT/DOWN, buff=0.8)
   - Keep text labels away from visual elements (buff >= 0.3)

LAYOUT RULES:
- Title: always Text(..., font_size=36).to_edge(UP)
- Step labels: Text("Step X: ...", font_size=24).to_edge(UP).shift(DOWN*0.5) — clear, readable narration
- Main objects: center or CENTER + slight UP shift, with generous spacing (buff >= 0.8)
- Labels under objects: label.next_to(obj, DOWN, buff=0.3)
- Process flow (A→B→C): arrange LEFT to RIGHT with Arrow() between, buff=1.5 minimum
- Formula: MathTex(...).shift(DOWN*2.5) or .next_to(main_obj, DOWN, buff=0.5)
- Explanation text: Text(..., font_size=20).to_edge(DOWN) — describe what's happening
- Before moving to next scene: self.play(FadeOut(VGroup(*self.mobjects))), then self.wait(0.5)

COLOR CONVENTIONS:
- Input/source: BLUE
- Output/result: ORANGE  
- Active/attended/highlighted: YELLOW
- Correct/positive: GREEN
- Inactive/background: GRAY
- Formula/equation text: WHITE

WORKING EXAMPLE — attention mechanism (copy this structure):
```
from manim import *

class ConceptAnimation(Scene):
    def construct(self):
        # Scene 1: Title
        title = Text("Attention Mechanism", font_size=36).to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Scene 2: Show Q, K, V as labeled circles
        q = Circle(radius=0.5, color=BLUE).shift(LEFT*3)
        k = Circle(radius=0.5, color=BLUE).shift(ORIGIN)
        v = Circle(radius=0.5, color=ORANGE).shift(RIGHT*3)
        q_label = Text("Q", font_size=28).move_to(q)
        k_label = Text("K", font_size=28).move_to(k)
        v_label = Text("V", font_size=28).move_to(v)
        tokens = VGroup(q, k, v, q_label, k_label, v_label)
        self.play(Create(VGroup(q, k, v)), Write(VGroup(q_label, k_label, v_label)))
        self.wait(1)

        # Scene 3: Show score formula
        formula = MathTex(r"\\text{score} = \\frac{QK^T}{\\sqrt{d_k}}", font_size=32).shift(DOWN*2)
        self.play(Write(formula))
        self.wait(1.5)

        # Scene 4: Highlight attended token
        self.play(k.animate.set_color(YELLOW), k.animate.scale(1.5))
        arrow = Arrow(q.get_right(), k.get_left(), color=YELLOW, buff=0.1)
        weight_label = Text("high score", font_size=20, color=YELLOW).next_to(arrow, UP, buff=0.1)
        self.play(Create(arrow), Write(weight_label))
        self.wait(1.5)

        # Scene 5: Output
        self.play(FadeOut(VGroup(tokens, formula, arrow, weight_label)))
        output = Text("Weighted context vector", font_size=28, color=ORANGE).shift(UP*0.5)
        sub = Text("= sum of V vectors, scaled by attention scores", font_size=20).next_to(output, DOWN)
        self.play(Write(output), FadeIn(sub, shift=UP*0.2))
        self.wait(2)
```"""


# ── Service ───────────────────────────────────────────────────────────────────

class ManimService:
    def __init__(self, ingestion_service: PaperIngestionService):
        self.ingestion = ingestion_service

        # ── Planner client (Groq by default, swap to NVIDIA Nemotron via config)
        # To use NVIDIA: set settings.planner_base_url = "https://integrate.api.nvidia.com/v1"
        #                set settings.planner_api_key  = "<nvidia_api_key>"
        #                set settings.planner_model    = "nvidia/llama-3.1-nemotron-70b-instruct"
        if getattr(settings, "planner_base_url", None) and getattr(settings, "planner_api_key", None):
            self.planner_client = AsyncOpenAI(
                base_url=settings.planner_base_url,
                api_key=settings.planner_api_key,
            )
            self.planner_model = settings.planner_model
            logger.info(f"[INIT] Using custom planner: {self.planner_model} at {settings.planner_base_url}")
        else:
            self.planner_client = AsyncGroq(api_key=settings.groq_api_key)
            self.planner_model = settings.groq_model
            logger.info(f"[INIT] Using default planner: Groq {self.planner_model}")

        # ── Code-gen client (OpenRouter/DeepSeek by default, swap to Qwen via config)
        # To use Qwen-2.5-Coder: set settings.codegen_model = "qwen/qwen-2.5-coder-32b-instruct"
        # To use NVIDIA:         set settings.codegen_base_url = "https://integrate.api.nvidia.com/v1"
        #                        set settings.codegen_model    = "nvidia/nemotron-4-340b-instruct"
        if getattr(settings, "codegen_base_url", None):
            self.codegen_client = AsyncOpenAI(
                base_url=settings.codegen_base_url,
                api_key=getattr(settings, "codegen_api_key", settings.openrouter_api_key),
            )
            logger.info(f"[INIT] Using custom codegen: {getattr(settings, 'codegen_model', 'unknown')} at {settings.codegen_base_url}")
        elif getattr(settings, "openrouter_api_key", None):
            self.codegen_client = AsyncOpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=settings.openrouter_api_key,
            )
            logger.info(f"[INIT] Using OpenRouter codegen: {getattr(settings, 'codegen_model', settings.deepseek_model)}")
        else:
            # Fallback: reuse planner client
            self.codegen_client = self.planner_client
            logger.info("[INIT] Using planner client for codegen (fallback)")

        self.codegen_model = getattr(settings, "codegen_model", getattr(settings, "deepseek_model", "qwen/qwen-2.5-coder-32b-instruct"))
        logger.info(f"[INIT] Codegen model: {self.codegen_model}")

        self.output_dir = Path(settings.manim_output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.scripts_dir = Path("./manim_scripts")
        self.scripts_dir.mkdir(exist_ok=True)

        # In-memory caches
        self._paper_analysis_cache: dict[str, dict] = {}
        # Stores the full context string per anim_id so retries have it
        self._context_cache: dict[str, str] = {}
        # Tracks detailed progress of background jobs
        self._job_store: dict[str, dict] = {}

    # ── Public API ────────────────────────────────────────────────────────────

    async def generate(
        self,
        paper_id: str,
        concept: str,
        style: str = "step by step",
        level: str = "simple",
    ) -> AnimationResponse:
        anim_id = hashlib.md5(f"{paper_id}:{concept}".encode()).hexdigest()[:12]
        video_path = self.output_dir / f"{anim_id}.mp4"
        failed_path = self.output_dir / f"{anim_id}.failed"

        # Clear stale failed marker so user can retry
        if failed_path.exists():
            failed_path.unlink()

        if video_path.exists():
            logger.info(f"[CACHE HIT] Returning cached animation for: {concept}")
            return AnimationResponse(
                job_id=anim_id,
                concept=concept,
                video_url=f"/static/animations/{anim_id}.mp4",
                duration_seconds=None,
                status="ready",
            )

        self._job_store[anim_id] = {"status": "planning"}

        asyncio.create_task(
            self._run_animation_pipeline(paper_id, concept, anim_id, video_path)
        )

        return AnimationResponse(
            job_id=anim_id,
            concept=concept,
            video_url=f"/static/animations/{anim_id}.mp4",
            duration_seconds=None,
            status="planning",
        )

    async def _run_animation_pipeline(self, paper_id: str, concept: str, anim_id: str, video_path: Path):
        try:
            self._job_store[anim_id] = {"status": "planning"}
            logger.info(f"[JOB {anim_id}] Starting planning for concept: {concept}")
            
            context = await self._build_context(paper_id, concept)
            self._context_cache[anim_id] = context
            
            self._job_store[anim_id] = {"status": "coding"}
            logger.info(f"[JOB {anim_id}] Starting coding for concept: {concept}")
            
            manim_code = await self._generate_manim_code(concept, context)
            
            script_path = self.scripts_dir / f"{anim_id}.py"
            script_path.write_text(manim_code)
            
            self._job_store[anim_id] = {"status": "rendering"}
            logger.info(f"[JOB {anim_id}] Starting rendering for concept: {concept}")
            
            await self._render_animation(script_path, anim_id, video_path, concept)
            
            self._job_store[anim_id] = {
                "status": "ready",
                "video_url": f"/static/animations/{anim_id}.mp4"
            }
            logger.info(f"[JOB {anim_id}] Pipeline completed")
            
        except Exception as e:
            logger.error(f"[JOB {anim_id}] Pipeline failed: {str(e)}", exc_info=True)
            self._job_store[anim_id] = {"status": "failed", "error": str(e)}
            (self.output_dir / f"{anim_id}.failed").touch()

    async def get_status(self, anim_id: str) -> dict:
        video_path = self.output_dir / f"{anim_id}.mp4"
        failed_path = self.output_dir / f"{anim_id}.failed"
        
        if anim_id in self._job_store:
            return self._job_store[anim_id]
            
        if video_path.exists():
            return {
                "status": "ready",
                "video_url": f"/static/animations/{anim_id}.mp4"
            }
        if failed_path.exists():
            return {"status": "failed", "error": "Unknown rendering error (check server logs)."}
        return {"status": "missing"}

    # ── Context building ──────────────────────────────────────────────────────

    async def _build_context(self, paper_id: str, concept: str) -> str:
        """
        Build a rich, structured context string for the planner.
        Prioritises Gemini's structured visual_hint over raw RAG chunks.
        Falls back to RAG if Gemini analysis fails or concept not found.
        """
        try:
            analysis = await self._analyze_paper_with_gemini(paper_id)
        except Exception as e:
            logger.warning(f"[GEMINI] Analysis failed, falling back to RAG: {e}")
            return self._get_rag_context(paper_id, concept)

        concept_data = next(
            (
                c for c in analysis.get("concepts", [])
                if (
                    c["label"].lower() == concept.lower()
                    or c["id"] == concept.lower().replace(" ", "_")
                    or concept.lower() in c["label"].lower()
                )
            ),
            None,
        )

        if not concept_data:
            logger.info(f"[CONTEXT] Concept '{concept}' not in Gemini analysis, using RAG")
            return self._get_rag_context(paper_id, concept)

        vh = concept_data.get("visual_hint", {})

        # Build context with most actionable data first — never truncated mid-field
        parts = [
            f"CONCEPT: {concept_data['label']}",
            f"TYPE: {concept_data.get('type', 'concept')}",
            f"EXPLANATION: {concept_data['explanation']}",
        ]

        if concept_data.get("key_equation"):
            parts.append(f"KEY EQUATION (LaTeX): {concept_data['key_equation']}")

        if isinstance(vh, dict):
            if vh.get("metaphor"):
                parts.append(f"VISUAL METAPHOR: {vh['metaphor']}")
            if vh.get("layout"):
                parts.append(f"LAYOUT: {vh['layout']}")
            if vh.get("color_logic"):
                parts.append(f"COLOR LOGIC: {vh['color_logic']}")
            if vh.get("objects"):
                obj_lines = "\n".join(
                    f"  - {o['name']} ({o['shape']}): label='{o['label']}', role='{o['role']}'"
                    for o in vh["objects"]
                )
                parts.append(f"OBJECTS TO ANIMATE:\n{obj_lines}")
            if vh.get("steps"):
                step_lines = "\n".join(f"  {s}" for s in vh["steps"])
                parts.append(f"ANIMATION STEPS:\n{step_lines}")
        elif isinstance(vh, str):
            # Backwards compat if old cache entry has string visual_hint
            parts.append(f"VISUAL HINT: {vh}")

        return "\n\n".join(parts)

    def _get_rag_context(self, paper_id: str, concept: str, top_k: int = 4) -> str:
        try:
            collection = self.ingestion.chroma_client.get_collection(name=paper_id)
            query_embedding = (
                self.ingestion.embed_model
                .encode([concept], show_progress_bar=False)[0]
                .tolist()
            )
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                include=["documents"],
            )
            chunks = results["documents"][0]
            return f"CONCEPT: {concept}\n\nPAPER EXCERPTS:\n" + "\n\n---\n\n".join(chunks)
        except Exception as e:
            logger.warning(f"[RAG] Could not retrieve context: {e}")
            return f"CONCEPT: {concept}"

    # ── Paper analysis with NVIDIA Nemotron ──────────────────────────────────

    async def _analyze_paper_with_gemini(self, paper_id: str) -> dict:
        """
        Full-paper analysis using NVIDIA Nemotron with extracted text.
        Returns structured concept + edge graph.
        Result is cached in memory — second call for same paper is instant.
        
        Note: Method name kept as _analyze_paper_with_gemini for backwards compatibility,
        but now uses NVIDIA Nemotron with text extraction instead of Gemini with PDF.
        """
        if paper_id in self._paper_analysis_cache:
            return self._paper_analysis_cache[paper_id]

        # Extract all text from the paper's ChromaDB collection
        logger.info(f"[ANALYSIS] Extracting text from paper {paper_id}")
        try:
            collection = self.ingestion.chroma_client.get_collection(name=paper_id)
            results = collection.get(include=["documents", "metadatas"])
            
            # Organize chunks by section and page for better context
            sections = {}
            for doc, meta in zip(results["documents"], results["metadatas"]):
                section = meta.get("section", "Unknown")
                page = meta.get("page", 0)
                if section not in sections:
                    sections[section] = []
                sections[section].append({"text": doc, "page": page})
            
            # Build full paper text with section headers
            paper_text_parts = []
            for section, chunks in sorted(sections.items(), key=lambda x: min(c["page"] for c in x[1])):
                paper_text_parts.append(f"\n\n## {section}\n")
                # Sort chunks by page within section
                sorted_chunks = sorted(chunks, key=lambda x: x["page"])
                paper_text_parts.append("\n".join(c["text"] for c in sorted_chunks))
            
            paper_text = "".join(paper_text_parts)
            
            # Limit to ~15000 tokens (roughly 60000 characters) to avoid context limits
            if len(paper_text) > 60000:
                logger.warning(f"[ANALYSIS] Paper text too long ({len(paper_text)} chars), truncating to 60000")
                paper_text = paper_text[:60000] + "\n\n[... rest of paper truncated ...]"
            
            logger.info(f"[ANALYSIS] Extracted {len(paper_text)} characters from {len(sections)} sections")
            
        except Exception as e:
            logger.error(f"[ANALYSIS] Failed to extract text from ChromaDB: {e}")
            raise

        # Use NVIDIA Nemotron for analysis
        logger.info(f"[ANALYSIS] Analyzing paper with NVIDIA Nemotron")
        
        try:
            response = await self.planner_client.chat.completions.create(
                model=self.planner_model,
                messages=[
                    {
                        "role": "user",
                        "content": f"{GEMINI_ANALYSIS_PROMPT}\n\nPAPER TEXT:\n{paper_text}"
                    }
                ],
                temperature=0.1,
                max_tokens=4000,
                response_format={"type": "json_object"},
            )

            raw = response.choices[0].message.content or ""
            raw = raw.strip()
            
            # Strip markdown fences if model wraps output despite instructions
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
            
            # Try to parse JSON
            try:
                result = json.loads(raw)
            except json.JSONDecodeError as json_err:
                logger.warning(f"[ANALYSIS] Initial JSON parse failed: {json_err}")
                logger.warning(f"[ANALYSIS] Raw response length: {len(raw)} chars")
                
                # Attempt to repair truncated JSON
                raw_repaired = raw
                
                # If ends with incomplete string, close it
                if raw.count('"') % 2 != 0:
                    raw_repaired += '"'
                
                # Close any unclosed arrays
                open_brackets = raw_repaired.count('[') - raw_repaired.count(']')
                raw_repaired += ']' * open_brackets
                
                # Close any unclosed objects
                open_braces = raw_repaired.count('{') - raw_repaired.count('}')
                raw_repaired += '}' * open_braces
                
                try:
                    result = json.loads(raw_repaired)
                    logger.info(f"[ANALYSIS] JSON repaired successfully")
                except json.JSONDecodeError:
                    # Last resort: extract individual concept objects via regex
                    logger.warning("[ANALYSIS] JSON repair failed, extracting partial concepts via regex")
                    concept_pattern = re.compile(
                        r'\{\s*"id"\s*:\s*"[^"]+"\s*,\s*"label"\s*:\s*"[^"]+"\s*,\s*"type"\s*:\s*"[^"]+"\s*,\s*"explanation"\s*:\s*"[^"]*"[^}]*\}',
                        re.DOTALL
                    )
                    matches = concept_pattern.findall(raw)
                    parsed_concepts = []
                    for m in matches:
                        try:
                            parsed_concepts.append(json.loads(m))
                        except json.JSONDecodeError:
                            continue
                    
                    if parsed_concepts:
                        result = {"concepts": parsed_concepts, "edges": []}
                        logger.info(f"[ANALYSIS] Extracted {len(parsed_concepts)} concepts via regex fallback")
                    else:
                        logger.error(f"[ANALYSIS] All repair attempts failed. First 500 chars: {raw[:500]}")
                        raise json_err
            
            self._paper_analysis_cache[paper_id] = result
            logger.info(
                f"[ANALYSIS] Analyzed {paper_id}: "
                f"{len(result.get('concepts', []))} concepts, "
                f"{len(result.get('edges', []))} edges"
            )
            return result
            
        except Exception as e:
            logger.error(f"[ANALYSIS] NVIDIA Nemotron analysis failed: {e}")
            raise

    # ── Code generation pipeline ──────────────────────────────────────────────

    async def _generate_manim_code(
        self,
        concept: str,
        context: str,
        error_feedback: str = "",
    ) -> str:
        """
        Two-stage pipeline:
          Stage 1 — Planner (Groq / Nemotron): context → JSON scene plan
          Stage 2 — Coder (Qwen / DeepSeek):   JSON scene plan → Manim Python
        """

        # ── Stage 1: JSON scene plan ─────────────────────────────────────────
        logger.info(f"[PLANNER] Building scene plan for: {concept}")
        plan_response = await self.planner_client.chat.completions.create(
            model=self.planner_model,
            messages=[
                {"role": "system", "content": PLANNER_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"{context}\n\n"
                        f"Create a 4-6 scene Manim storyboard that teaches '{concept}' step by step.\n"
                        "Prefer showing a transformation or process over a static diagram.\n"
                        "If a key equation exists in the context, include a MathTex scene for it.\n"
                        "Output only the JSON object."
                    ),
                },
            ],
            temperature=0.2,
            max_tokens=900,
            response_format={"type": "json_object"},
        )

        scene_plan_raw = plan_response.choices[0].message.content or ""
        scene_plan_raw = scene_plan_raw.strip()
        # Validate it parsed — if not, we still pass the raw string (coder is robust)
        try:
            scene_plan_obj = json.loads(scene_plan_raw)
            scene_plan = json.dumps(scene_plan_obj, indent=2)
            logger.info(f"[PLANNER] Got {len(scene_plan_obj.get('scenes', []))} scenes")
        except json.JSONDecodeError:
            logger.warning("[PLANNER] Scene plan was not valid JSON, passing raw text")
            scene_plan = scene_plan_raw

        # ── Stage 2: Manim Python code ───────────────────────────────────────
        error_note = ""
        if error_feedback:
            # Extract the most useful part of the traceback
            relevant_error = _extract_relevant_error(error_feedback)
            error_note = (
                f"\n\nPREVIOUS ATTEMPT FAILED. Fix this specific error before writing code:\n"
                f"{relevant_error}\n"
                f"Common fixes: check object names match between scenes, "
                f"ensure FadeOut is called before reusing the canvas, "
                f"never pass a list to self.play() — use *args or VGroup."
            )

        logger.info(f"[CODER] Generating Manim code for: {concept}")
        code_response = await self.codegen_client.chat.completions.create(
            model=self.codegen_model,
            messages=[
                {"role": "system", "content": MANIM_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"Convert this JSON scene plan to a complete Manim script.\n\n"
                        f"SCENE PLAN:\n{scene_plan}"
                        f"{error_note}"
                    ),
                },
            ],
            temperature=0.15,
            max_tokens=2000,
        )

        code_content = code_response.choices[0].message.content or ""
        code = code_content.strip()
        code = _clean_code_output(code)
        return code

    # ── Rendering ─────────────────────────────────────────────────────────────

    async def _render_animation(
        self,
        script_path: Path,
        anim_id: str,
        video_path: Path,
        concept: str = "",
    ):
        """Run Manim as a subprocess. On failure, regenerate with error context and retry once."""
        quality_flag = "-ql" if getattr(settings, "manim_quality", "low") == "low" else "-qh"
        quality_subdir = "480p15" if quality_flag == "-ql" else "1080p60"

        cmd = ["manim", quality_flag, str(script_path), "ConceptAnimation"]
        logger.info(f"[RENDER] Starting Manim for anim_id={anim_id}")

        try:
            success = await self._run_manim(cmd, script_path, anim_id, video_path, quality_subdir)

            if not success:
                logger.warning(f"[RENDER] First attempt failed for {anim_id}, retrying with error feedback")
                # Re-read stderr from the failed run (stored by _run_manim)
                error_log_path = self.scripts_dir / f"{anim_id}.stderr"
                error_feedback = error_log_path.read_text() if error_log_path.exists() else ""

                # Retrieve the original context for this anim_id
                original_context = self._context_cache.get(anim_id, f"CONCEPT: {concept}")

                corrected_code = await self._generate_manim_code(
                    concept,
                    original_context,
                    error_feedback=error_feedback,
                )
                script_path.write_text(corrected_code)
                logger.info(f"[RENDER] Retrying with corrected code for {anim_id}")
                retry_success = await self._run_manim(cmd, script_path, anim_id, video_path, quality_subdir)

                if not retry_success:
                    logger.error(f"[RENDER] Both attempts failed for {anim_id}")
                    (self.output_dir / f"{anim_id}.failed").touch()

        except asyncio.TimeoutError:
            logger.error(f"[RENDER] Timed out for {anim_id}")
            (self.output_dir / f"{anim_id}.failed").touch()
        except Exception as e:
            logger.error(f"[RENDER] Unexpected error for {anim_id}: {e}")
            (self.output_dir / f"{anim_id}.failed").touch()

    async def _run_manim(
        self,
        cmd: list[str],
        script_path: Path,
        anim_id: str,
        video_path: Path,
        quality_subdir: str,
    ) -> bool:
        """Execute manim subprocess. Returns True if MP4 was produced."""
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
        except asyncio.TimeoutError:
            proc.kill()
            raise

        stderr_text = stderr.decode(errors="replace")

        # Always save stderr for retry context
        stderr_path = self.scripts_dir / f"{anim_id}.stderr"
        stderr_path.write_text(stderr_text)

        if proc.returncode == 0:
            # Manim outputs to media/videos/<script_stem>/<quality>/ConceptAnimation.mp4
            script_stem = script_path.stem
            expected = (
                Path("media") / "videos" / script_stem / quality_subdir / "ConceptAnimation.mp4"
            )
            if expected.exists():
                expected.rename(video_path)
                logger.info(f"[RENDER] Animation ready: {video_path}")
                return True
            else:
                logger.error(f"[RENDER] Manim exited 0 but no MP4 at {expected}")
                return False
        else:
            logger.warning(f"[RENDER] Manim exited {proc.returncode}. stderr tail:\n{stderr_text[-400:]}")
            return False

    # ── Concept extraction (kept for backwards compat / other callers) ────────

    async def _extract_concepts_with_explanations(self, paper_id: str) -> list[dict]:
        """
        Map-reduce over ChromaDB chunks to extract concepts per section.
        Used as a fallback if Gemini is not configured.
        """
        collection = self.ingestion.chroma_client.get_collection(paper_id)
        all_data = collection.get(include=["documents", "metadatas"])

        sections: dict[str, list[str]] = {}
        for doc, meta in zip(all_data["documents"], all_data["metadatas"]):
            section = meta.get("section", "Unknown")
            sections.setdefault(section, []).append(doc)

        section_summaries: list[dict] = []
        for section, chunks in sections.items():
            if any(x in section.lower() for x in ["reference", "acknowledgement", "appendix"]):
                continue

            combined = " ".join(chunks)[:2000]

            response = await self.planner_client.chat.completions.create(
                model=self.planner_model,
                messages=[{
                    "role": "user",
                    "content": (
                        f"Section: {section}\nText: {combined}\n\n"
                        "Extract 2-3 key technical concepts from this section. "
                        "For each return JSON with fields: "
                        "concept (name), explanation (2 sentences on what it does and how), "
                        "key_equation (LaTeX or null), "
                        "visual_hint (object with metaphor, objects list, steps list, layout, color_logic). "
                        "Return as a JSON object with a 'concepts' array."
                    ),
                }],
                temperature=0,
                max_tokens=800,
                response_format={"type": "json_object"},
            )

            try:
                raw = json.loads(response.choices[0].message.content)
                concepts = raw if isinstance(raw, list) else raw.get("concepts", [])
                for c in concepts:
                    c["section"] = section
                section_summaries.extend(concepts)
            except Exception:
                continue

        return section_summaries


# ── Helpers ───────────────────────────────────────────────────────────────────

def _clean_code_output(code: str) -> str:
    """Strip markdown fences and ensure class is named ConceptAnimation."""
    # Remove ```python or ``` fences
    code = re.sub(r"^```(?:python)?\s*\n?", "", code)
    code = re.sub(r"\n?```\s*$", "", code)
    code = code.strip()

    # Fix class name if model used a different name
    if "class ConceptAnimation" not in code:
        code = re.sub(r"class\s+\w+\s*\(\s*Scene\s*\)", "class ConceptAnimation(Scene)", code)

    return code


def _extract_relevant_error(stderr: str) -> str:
    """
    Pull the most useful lines from a Manim traceback:
    the exception type + message and the line that caused it.
    """
    lines = stderr.strip().splitlines()

    # Find the last traceback block
    error_lines = []
    in_traceback = False
    for line in lines:
        if "Traceback" in line:
            in_traceback = True
            error_lines = [line]
        elif in_traceback:
            error_lines.append(line)

    if error_lines:
        # Return last 12 lines of the traceback — enough to see file + line + exception
        return "\n".join(error_lines[-12:])

    # Fallback: last 8 lines of stderr
    return "\n".join(lines[-8:])