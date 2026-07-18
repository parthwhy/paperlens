import type { ConceptMapData, PaperMetadata } from '../types';
import paperMeta from '../demo/paper.json';
import conceptMap from '../demo/conceptMap.json';
import chunks from '../demo/chunks.json';
import { buildIndex, type DemoChunk } from './rag';

// Pre-loaded demo paper (Attention Is All You Need) bundled with the app.
// This lets the deployed frontend show a fully working read/concept-map
// experience WITHOUT a backend. With a user-supplied Groq key, the RAG chat
// and tooltips also work fully client-side. Animations still require backend.

export const DEMO_PAPER_ID = '1706.03762';

export const demoMetadata: PaperMetadata = paperMeta as PaperMetadata;

export const demoConceptMap: ConceptMapData = conceptMap as ConceptMapData;

export const demoChunks = chunks as { paper_id: string; sections: { section: string; chunks: { chunk_id: string; text: string; page: number }[] }[] };

// Flattened chunks + a BM25 index for browser-side RAG.
export const demoChunkList: DemoChunk[] = demoChunks.sections.flatMap((s) =>
  s.chunks.map((c) => ({
    chunk_id: c.chunk_id,
    text: c.text,
    section: s.section,
    page: c.page,
  }))
);

export const demoIndex = buildIndex(demoChunkList);

// LocalStorage key that flags whether the user is currently in demo mode.
export const DEMO_FLAG_KEY = 'paperlens_demo_mode';

export function isDemoMode(): boolean {
  try {
    return localStorage.getItem(DEMO_FLAG_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setDemoMode(on: boolean): void {
  try {
    localStorage.setItem(DEMO_FLAG_KEY, on ? 'true' : 'false');
  } catch {
    /* ignore */
  }
}
