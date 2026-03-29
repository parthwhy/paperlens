# Concerns & Tech Debt

## Active Architecture Flaws
- **Inconsistent Error Handling**: Multiple API layers are handling exceptions irregularly. Some are propagating basic HTTP 500s directly out of Uvicorn, while others structure customized HTTP Error maps.
- **Database Migrations**: No explicit tracking for ChromaDB data models. If embedding logic strategies swap or semantic lengths mutate across versions, it may mandate hard manual destruction and refactoring of `chroma_db/`.
- **Static Authentication**: Local runtime operates broadly with no true Multi-Tenant context. Keys are hardcoded via server variables, enabling sweeping vulnerability to any origin capable of pinging `localhost`.
- **File System Clutter**: Backend processing stores rendered Manim animations indefinitely in `static/animations/` and caches raw PDFs in `pdf_cache/`, leading to persistent memory creep if unsupported by automated cron cleanup jobs.

## Fragile Features
- **Animation Task Polling Ecosystem**: A prominent issue has been detailed wherein the Background Task executing the heavy-weight Manim engine falls out-of-sync with Frontend status polling (`Bug #5: Animation Status Polling Not Working`). Investigating race conditions between the renderer closing and API read state should be treated as high priority.
- **LLM Context Degradation**: The generation engines are known to randomly hallucinate corrupted JSONs. While `concept_map.py` presently patches these issues heuristically post-generation (`EXPECTING VALUE` fixes), the implementation limits code generator durability.

## Future Constraints
- **Multi-Paper Architecture**: Currently the engine is strictly restricted against mapping contextual relations *between* distinct PDFs. Refactoring database logic to isolate overlapping nodes requires expansive updates to ChromeDB mapping syntax.
