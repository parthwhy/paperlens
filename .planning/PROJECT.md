# PaperLens

## What This Is
PaperLens is an AI-powered research platform that allows users to upload arXiv papers and explore them via tooltips, RAG-based chat, conceptual maps, and AI-generated Manim animations.

## Core Value
Transform dense research papers into accessible, interactive, and visual learning experiences.

## Requirements

### Validated

- ✓ [Ingestion] Download arXiv PDFs, parse text, chunk by section, and embed concepts into ChromaDB — v1.0
- ✓ [RAG Chat] Chat with papers using Google Gemini grounded context — v1.0
- ✓ [Concept Map] Extact key themes and visualize them via 2D graphs — v1.0

### Active

- [ ] **ANIM-01**: User can request an animation and get an instant job_id without the browser hanging.
- [ ] **ANIM-02**: User can see the specific stage of their background animation (Planning, Coding, Rendering).
- [ ] **ANIM-03**: User can see clear error messages if an animation fails (e.g. LLM timeout, Syntax Error).
- [ ] **ANIM-04**: User can click "Retry" on a failed animation state to re-run the pipeline with the captured error feedback.

### Out of Scope

- Support for complex 3D animations (Requires significant Manim engine upgrade, sticking to 2D for this milestone).
- Fully replacing PDF.js rendering with raw canvas draws.

## Context
The project uses FastAPI on the backend and React 19 on the frontend. The backend integrates Gemini, NVIDIA Nemotron, and Qwen-2.5-Coder for varying AI tasks. We just completed mapping the codebase to prepare for structured development. There is a documented bug (Bug #5) where the initial POST block is synchronous and hangs.

## Constraints

- **Performance**: Animations must resolve or fail gracefully within a reasonable timeframe (2-5 minutes).
- **Architecture**: Stick to the current Python/FastAPI async job patterns (using global dicts or lightweight state) without introducing heavy task queues like Celery unless required.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Two-Stage Animation | Use a Planner (Nvidia) and Coder (Qwen) separately for better reasoning | ✓ Good |

---
*Last updated: 2026-03-29 after Milestone v1.1 initialized*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition**:
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone**:
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
