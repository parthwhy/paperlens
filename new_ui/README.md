<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PaperLens — Frontend

Interactive AI-paper reader: concept maps, plain-English tooltips, and Manim animations.

## Demo Mode (works with no backend)

The deployed site includes a **"Try Demo"** button on the landing page that loads a
pre-processed famous paper (Attention Is All You Need) entirely from bundled static
data. The document reader, concept map, and tooltips work **without any backend**.
AI chat and Manim video generation require the backend — connect it via
`VITE_API_BASE_URL` (see `.env.example`).

## Run Locally

**Prerequisites:** Node.js

1. `cd new_ui && npm install`
2. Set `GEMINI_API_KEY` in `.env.local` (for backend-backed features)
3. `npm run dev`

## Deploy to GitHub Pages

Push to `main`. The workflow in `.github/workflows/deploy.yml` builds `new_ui` and
publishes to GitHub Pages. The base path is auto-derived from the repo name, so
set **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Stable URL: `https://<your-username>.github.io/<repo-name>/`

To later enable chat/animations, set `VITE_API_BASE_URL` to your Render backend URL
in the workflow's `build` step and redeploy.
