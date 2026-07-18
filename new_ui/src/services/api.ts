import type {
  IngestionStatus,
  PaperChunk,
  ChatMessage,
  CitedChunk,
  ConceptMapData,
  TooltipResponse,
  AnimationJob,
  PaperMetadata,
} from '../types';
import { isDemoMode, demoMetadata, demoConceptMap, demoChunks, DEMO_PAPER_ID } from './demo';

// Backend API base. Defaults to local dev. Override at build time with
// VITE_API_BASE_URL (e.g. the Render URL) once the backend is deployed.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export const API_BASE_URL_RESOLVED = API_BASE_URL;

// When demo mode is on, a subset of calls is served from bundled static data
// so the deployed site works without a backend. Everything else still hits the
// real backend (chat, animations, tooltip).
function demoActive(): boolean {
  return isDemoMode();
}

// True when a real backend URL has been configured (via VITE_API_BASE_URL)
// AND it isn't just the local-dev default. The localhost default means "no
// backend deployed" — used by the frontend-only GitHub Pages demo, where we
// never attempt backend calls.
const _configuredUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const BACKEND_CONFIGURED =
  !!_configuredUrl && !_configuredUrl.includes('127.0.0.1') && !_configuredUrl.includes('localhost');

// Re-export so components can avoid backend calls in the demo deploy.
export const BACKEND_CONFIGURED_FLAG = BACKEND_CONFIGURED;

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText || response.statusText);
  }

  return response.json();
}

export const api = {
  // Paper Ingestion
  async ingestPaper(arxivUrl: string): Promise<{ job_id: string }> {
    return fetchApi('/ingest', {
      method: 'POST',
      body: JSON.stringify({ arxiv_url: arxivUrl }),
    });
  },

  async getIngestionStatus(jobId: string): Promise<IngestionStatus> {
    return fetchApi(`/status/${jobId}`);
  },

  // Paper Content
  async getRecentPapers(limit: number = 20): Promise<{ papers: PaperMetadata[] }> {
    // Demo mode or no backend configured → serve the bundled demo paper only.
    if (demoActive() || !BACKEND_CONFIGURED) {
      return { papers: [demoMetadata] };
    }
    return fetchApi(`/papers?limit=${limit}`);
  },

  async getPaperDetails(paperId: string): Promise<PaperMetadata> {
    if (demoActive() && paperId === DEMO_PAPER_ID) {
      return demoMetadata;
    }
    return fetchApi(`/paper/${paperId}`);
  },

  async getPaperChunks(paperId: string): Promise<{ chunks: PaperChunk[] }> {
    if (demoActive() && paperId === DEMO_PAPER_ID) {
      const chunksFlat: PaperChunk[] = [];
      demoChunks.sections.forEach((s) =>
        s.chunks.forEach((c) =>
          chunksFlat.push({
            chunk_id: c.chunk_id,
            text: c.text,
            metadata: { section: s.section, page: c.page },
          })
        )
      );
      return { chunks: chunksFlat };
    }
    return fetchApi(`/paper/${paperId}/chunks`);
  },

  // Chat
  async sendChatMessage(
    paperId: string,
    message: string,
    history: ChatMessage[]
  ): Promise<{ answer: string; citations: CitedChunk[] }> {
    return fetchApi('/chat', {
      method: 'POST',
      body: JSON.stringify({
        paper_id: paperId,
        message,
        history,
      }),
    });
  },

  // Tooltip
  async getTooltip(
    paperId: string,
    sentence: string,
    term?: string
  ): Promise<TooltipResponse> {
    if (demoActive()) {
      const focus = term || sentence.slice(0, 80);
      return {
        explanation: `In this paper, "${focus}" refers to a core idea of the Transformer architecture. Try the live backend to get a context-aware explanation grounded in the full document.`,
        analogy: 'Think of attention like a highlighter: it brightens the words that matter most for understanding the current one.',
        related_terms: ['self-attention', 'multi-head attention', 'positional encoding'],
      };
    }
    return fetchApi('/tooltip', {
      method: 'POST',
      body: JSON.stringify({
        paper_id: paperId,
        sentence,
        term,
      }),
    });
  },

  // Concept Map
  async getConceptMap(paperId: string): Promise<ConceptMapData> {
    if (demoActive() && paperId === DEMO_PAPER_ID) {
      return demoConceptMap;
    }
    return fetchApi(`/concept-map/${paperId}`);
  },

  // Manim Animation
  async generateAnimation(
    paperId: string,
    prompt: string,
    style?: string
  ): Promise<{ job_id: string }> {
    return fetchApi('/animate', {
      method: 'POST',
      body: JSON.stringify({
        paper_id: paperId,
        concept: prompt,
        style,
      }),
    });
  },

  async getAnimationStatus(jobId: string): Promise<AnimationJob> {
    return fetchApi(`/animate/status/${jobId}`);
  },

  async getPaperConcepts(paperId: string): Promise<{ paper_id: string; concepts: any[] }> {
    return fetchApi(`/paper/${paperId}/concepts`);
  },
};
