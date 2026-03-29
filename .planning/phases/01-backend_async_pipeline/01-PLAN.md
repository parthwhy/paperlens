---
wave: 1
depends_on: []
files_modified:
  - app/papers.py
  - app/manim_service.py
autonomous: true
requirements:
  - ANIM-01
  - ANIM-02
---

# Phase 1: Backend Async Pipeline

<objective>
Refactor `/api/v1/animate` and `ManimService` to execute the LLM planner and code generator asynchronously, while providing instantaneous HTTP 202 responses with precise polling statuses.
</objective>

<verification>
Automated `curl` command POSTs to `/animate` and immediately receives `{"job_id": "...", "status": "planning"}` before the background task completes. Successive polling to `/animate/status/{job_id}` cycles through `planning -> coding -> rendering`.
</verification>

<tasks>

<task step="1">
<action>
1. Edit `app/manim_service.py` to add `self._job_store: dict = {}` to `ManimService` class.
2. Add a new async method `_run_animation_pipeline(self, paper_id: str, concept: str, anim_id: str, context: Optional[str] = None)` which wraps `_build_context`, `_generate_manim_code`, and `_render_animation` inside a try/except loop.
3. Throughout `_run_animation_pipeline`, update `self._job_store[anim_id]` to `{"status": "planning"}`, then `coding`, then `rendering`.
4. If an exception is caught in the pipeline, log it and set `self._job_store[anim_id] = {"status": "failed", "error": str(e)}`.
5. Edit `ManimService.get_status(anim_id)` to first check `self._job_store.get(anim_id)`, falling back to the existing file checks for `.mp4` / `.failed` if not running in memory.
</action>
<read_first>
- app/manim_service.py
</read_first>
<acceptance_criteria>
`grep -n '_job_store' app/manim_service.py` returns results.
`grep -n '_run_animation_pipeline' app/manim_service.py` returns results.
</acceptance_criteria>
</task>

<task step="2">
<action>
1. Edit `app/papers.py` to modify the `/animate` route (`router.post("/{paper_id}/animate")`).
2. Add `BackgroundTasks` to the dependencies (`background_tasks: BackgroundTasks`).
3. Extract and remove the blocking execution code (where it calls `_generate_manim_code`).
4. Replace it with `background_tasks.add_task(manim_service._run_animation_pipeline, ...)`.
5. Ensure the route immediately returns `AnimationResponse` with `job_id=anim_id` and `status="planning"`.
</action>
<read_first>
- app/papers.py
</read_first>
<acceptance_criteria>
`grep -n 'BackgroundTasks' app/papers.py` returns results.
`grep -n 'background_tasks.add_task' app/papers.py` returns results.
</acceptance_criteria>
</task>

</tasks>
