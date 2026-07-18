# PaperLens — Version History

## Branches

| Branch | Commit | Description |
|--------|--------|-------------|
| `main` | current | **Old working UI** — Neo-Brutalist v1 with full API connectivity |
| `stitch-ui-v2` | `1e26e2f` | **Stitch redesign (WIP)** — Pixel-perfect Stitch HTML port, new landing page + workspace. Needs chunk API fix. |

## Commit History

| Hash | Message | Notes |
|------|---------|-------|
| `73d4b1b` | neo brutalist all working version 1 | ✅ Stable. Full pipeline working: ingestion, chat, concept map, manim |
| `5c7627f` | feat: async animation pipeline + frontend state persistence | Animation pipeline + localStorage persistence |
| `8788fb1` | feat: stabilize backend, add persistent caching | Backend caching for concept maps and scripts. Uvicorn fix. |
| `1e26e2f` | stitch-ui-v2: complete neo-brutalist redesign | Full Stitch HTML port. New landing page. Chunk API format mismatch. |

## How to Switch Versions

```bash
# Current (old working UI):
git checkout main

# Stitch redesign (WIP):
git checkout stitch-ui-v2

# Restore a specific version:
git checkout <hash> -- new_ui/
```

## Known Issues per Version

### `main` (current, old working UI)
- Manim rendering sometimes fails with subprocess error on Windows
- Backend caching is active (pdf_cache/ and manim_scripts/)

### `stitch-ui-v2` (saved on branch)
- Landing page renders beautifully
- Workspace: chunks API returns `{ sections: [] }` format — code expects `{ chunks: [] }`
- Paper title shows URL instead of real title (partially fixed in latest commit)
- Concept map loading hangs (API call may be slow, not a frontend bug)
