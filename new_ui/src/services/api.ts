import type {
  IngestionStatus,
  PaperChunk,
  ChatMessage,
  CitedChunk,
  ConceptMapData,
  TooltipResponse,
  AnimationJob,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

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
  async getPaperChunks(paperId: string): Promise<{ chunks: PaperChunk[] }> {
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
