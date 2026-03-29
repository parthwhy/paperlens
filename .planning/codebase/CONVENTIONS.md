# Conventions

## Backend Constraints (Python)
- **Typing**: Python type hints are expected, deeply enforced by tools like `pydantic` in `schemas.py`.
- **Asynchronous Execution**: Strict usage of async/await throughout. IO-blocking operations such as ChromaDB embedding uploads should be wrapped to avoid blocking the Uvicorn main thread. Heavy computations scale out via `fastapi.BackgroundTasks`.
- **Module boundaries**: Features map directly to explicit isolated service files (`ingestion.py`, `rag_chat.py`, etc) rather than being nested into large class blobs. Object-Oriented patterns are avoided in favor of procedural single-purpose router-to-service flows.
- **Logging**: `loguru` is universally utilized instead of Python's built-in logging module. 
- **Resilience Strategy**: Implements automatic JSON repair logic out-of-the-box for resolving common syntax failure modes related to un-terminated context token arrays from LLM outputs. Uses `tenacity` exponential retry wrappers where relevant on LLM requests.

## Frontend Constraints (React)
- **Component Style**: Pure functional components (`React.FC`).
- **State Approach**: Heavily decoupled from global state tools like Redux. Utilizes single-file top-down state managed locally inside `App.tsx` via hooks to hydrate props.
- **CSS Strategy**: Zero vanilla CSS outside of root initializers. Every component employs Tailwind CSS 4 utility classes conditionally collapsed using a unified `cn()` function located in `lib/utils.ts`.
- **Layout Approach**: Relies on independent floating panels overlaid onto rendering structures, enhanced visually with `framer-motion` definitions.
