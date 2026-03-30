export type View = 'landing' | 'concept-map' | 'document' | 'manim';

export interface PaperChunk {
  chunk_id: string;
  text: string;
  metadata: {
    section?: string;
    page?: number;
  };
}

export interface CitedChunk {
  text: string;
  section?: string;
  page?: number;
  score?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: CitedChunk[];
}

export interface ConceptNode {
  id: string;
  label: string;
  description: string;
  type?: 'method' | 'dataset' | 'metric' | 'concept';
  explanation?: string;
  key_equation?: string | null;
  importance?: number;
  frequency?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface ConceptEdge {
  source: string;
  target: string;
  label?: string;
  predicate?: string;
}

export interface ConceptMapData {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

export interface IngestionStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  paper_id?: string;
}

export interface TooltipResponse {
  explanation: string;
  analogy?: string | null;
  related_terms?: string[];
}

export interface AnimationJob {
  job_id: string;
  status: 'planning' | 'coding' | 'rendering' | 'ready' | 'failed';
  error?: string;
  video_url?: string;
  script_path?: string;
}

export interface PaperMetadata {
  paper_id: string;
  title: string;
  authors: string[];
  abstract: string;
  ingested_at?: string;
  message?: string;
}
