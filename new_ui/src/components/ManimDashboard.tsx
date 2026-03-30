import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, FileText, ChevronRight, Send, Play, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../services/api';
import type { View, AnimationJob } from '../types';

interface ManimDashboardProps {
  setView: (v: View) => void;
  paperId: string | null;
}

interface Concept {
  id: string;
  label: string;
  type: string;
  explanation: string;
  key_equation?: string | null;
  visual_hint?: any;
  frequency?: number;
}

interface StoredAnimation {
  job_id: string;
  concept: string;
  status: 'planning' | 'coding' | 'rendering' | 'ready' | 'failed';
  video_url?: string;
  error?: string;
  timestamp: number;
}

const STORAGE_KEY = 'paperlens_animations';

export const ManimDashboard = ({ setView, paperId }: ManimDashboardProps) => {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [loadingConcepts, setLoadingConcepts] = useState(false);
  const [animations, setAnimations] = useState<StoredAnimation[]>([]);
  const [error, setError] = useState('');

  // Load animations from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAnimations(parsed);
      } catch (e) {
        console.error('Failed to parse stored animations:', e);
      }
    }
  }, []);

  // Load concepts when paperId changes
  useEffect(() => {
    if (!paperId) return;
    
    const loadConcepts = async () => {
      setLoadingConcepts(true);
      setError('');
      try {
        const response = await api.getPaperConcepts(paperId);
        setConcepts(response.concepts || []);
      } catch (err) {
        console.error('Failed to load concepts:', err);
        setError('Failed to load concepts from paper');
      } finally {
        setLoadingConcepts(false);
      }
    };

    loadConcepts();
  }, [paperId]);

  useEffect(() => {
    const inProgress = animations.filter(
      a => a.status === 'planning' || a.status === 'coding' || a.status === 'rendering'
    );

    if (inProgress.length === 0) return;

    const pollInterval = setInterval(async () => {
      for (const anim of inProgress) {
        try {
          const status = await api.getAnimationStatus(anim.job_id);
          
            if (status.status !== anim.status) {
            setAnimations(prev => {
              const updated = prev.map(a => 
                a.job_id === anim.job_id 
                  ? { ...a, status: status.status as any, video_url: status.video_url, error: (status as any).error }
                  : a
              );
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              return updated;
            });
          }
        } catch (err) {
          console.error(`Failed to poll animation ${anim.job_id}:`, err);
        }
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [animations]);

  const handleStartRendering = async () => {
    if (!paperId || !selectedConcept) {
      setError('Please select a concept first');
      return;
    }

    setError('');

    try {
      console.log('[MANIM] Starting rendering for concept:', selectedConcept.label);
      const { job_id } = await api.generateAnimation(paperId, selectedConcept.label);
      
      const newAnimation: StoredAnimation = {
        job_id,
        concept: selectedConcept.label,
        status: 'planning',
        timestamp: Date.now(),
      };

      setAnimations(prev => {
        const updated = [newAnimation, ...prev];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      console.log('[MANIM] Animation job created:', job_id);
    } catch (err) {
      console.error('[MANIM] Failed to start rendering:', err);
      setError(err instanceof Error ? err.message : 'Failed to start rendering');
    }
  };

  const handleRetry = async (anim: StoredAnimation) => {
    try {
      console.log('[MANIM] Retrying animation:', anim.concept);
      const { job_id } = await api.generateAnimation(paperId!, anim.concept);
      
      const newAnimation: StoredAnimation = {
        job_id,
        concept: anim.concept,
        status: 'planning',
        timestamp: Date.now(),
      };

      setAnimations(prev => {
        const filtered = prev.filter(a => a.job_id !== anim.job_id);
        const updated = [newAnimation, ...filtered];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error('[MANIM] Failed to retry:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'planning': return 'text-primary';
      case 'coding': return 'text-primary';
      case 'rendering': return 'text-primary';
      default: return 'text-on-background/40';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planning': return 'Planning Scene...';
      case 'coding': return 'Writing Code...';
      case 'rendering': return 'Rendering MP4...';
      case 'ready': return 'Ready';
      case 'failed': return 'Failed';
      default: return status;
    }
  };

  return (
    <div className="flex-1 w-full bg-background p-8 overflow-auto flex flex-col gap-8 dot-grid">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('concept-map')}
            className="w-10 h-10 border-2 border-border text-on-background bg-surface-container flex items-center justify-center shadow-[4px_4px_0_0_var(--color-border-base)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--color-border-base)] transition-transform"
          >
            <X className="w-6 h-6 font-bold" />
          </button>
          <h2 className="text-3xl font-black text-on-background uppercase tracking-tight">Animation Studio</h2>
        </div>
      </div>

      <div className="flex gap-8 flex-1 min-h-0">
        {/* Left: Concept Selection */}
        <div className="w-96 bg-surface-container border-2 border-border shadow-[8px_8px_0_0_var(--color-border-base)] p-8 flex flex-col gap-6 shrink-0">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary">
            Main Concepts
          </h3>
          
          {loadingConcepts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : concepts.length === 0 ? (
            <div className="text-base font-bold text-on-surface-variant italic py-8 text-center bg-background border-2 border-border p-4 shadow-[4px_4px_0_0_var(--color-border-base)]">
              No concepts found. Make sure the paper is fully ingested.
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {concepts.map((concept) => (
                <button
                  key={concept.id}
                  onClick={() => setSelectedConcept(concept)}
                  className={cn(
                    "w-full text-left p-4 transition-transform border-2 border-border block relative",
                    selectedConcept?.id === concept.id
                      ? "bg-primary text-on-primary shadow-[4px_4px_0_0_var(--color-border-base)] translate-x-1 -translate-y-1"
                      : "bg-surface hover:-translate-y-1 shadow-[4px_4px_0_0_var(--color-border-base)] hover:shadow-[6px_6px_0_0_var(--color-border-base)]"
                  )}
                >
                  <div className="font-black text-lg mb-1">{concept.label}</div>
                  <div className={cn("text-sm font-medium line-clamp-2", selectedConcept?.id === concept.id ? "text-on-primary/90" : "text-on-surface-variant")}>
                    {concept.explanation}
                  </div>
                  {concept.key_equation && (
                    <div className="text-xs font-black uppercase mt-3 bg-black/10 inline-block px-2 py-1">
                      Has equation
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedConcept && (
            <div className="mt-auto pt-6 border-t-4 border-border border-dashed">
              <button
                onClick={handleStartRendering}
                disabled={!paperId}
                className="w-full bg-primary text-on-primary border-2 border-border p-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_var(--color-border-base)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-border-base)] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5 fill-on-primary" />
                Start Rendering Video
              </button>
              {error && (
                <p className="text-sm text-red-600 font-bold mt-3 bg-red-100 p-2 border-2 border-border text-center">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Center: Selected Concept Details */}
        <div className="flex-1 flex flex-col gap-8 min-w-[500px]">
          <div className="bg-surface-container border-2 border-border shadow-[8px_8px_0_0_var(--color-border-base)] p-8 flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            {selectedConcept ? (
              <>
                <div className="border-b-4 border-border pb-4">
                  <h3 className="text-4xl font-black mb-3 text-on-background">
                    {selectedConcept.label}
                  </h3>
                  <div className="inline-block px-4 py-1 bg-surface border-2 border-border shadow-[2px_2px_0_0_var(--color-border-base)] text-xs font-black uppercase tracking-widest text-on-background">
                    {selectedConcept.type}
                  </div>
                </div>

                <div className="bg-background border-2 border-border p-6 text-lg font-medium leading-relaxed shadow-[4px_4px_0_0_var(--color-border-base)] text-on-background">
                  {selectedConcept.explanation}
                </div>

                {selectedConcept.key_equation && (
                  <div className="bg-primary text-on-primary border-2 border-border p-6 shadow-[4px_4px_0_0_var(--color-border-base)] overflow-x-auto">
                    <div className="text-xs font-black uppercase tracking-widest text-on-primary/70 mb-3">
                      Key Equation
                    </div>
                    <div className="font-mono text-xl font-bold">
                      {selectedConcept.key_equation}
                    </div>
                  </div>
                )}

                {selectedConcept.visual_hint && (
                  <div className="bg-surface border-2 border-border border-dashed p-6 shadow-[4px_4px_0_0_var(--color-border-base)]">
                    <div className="text-xs font-black uppercase tracking-widest text-primary mb-4">
                      Visual Approach
                    </div>
                    {selectedConcept.visual_hint.metaphor && (
                      <div className="text-base font-bold italic text-on-background mb-4 bg-primary/20 p-3 border-2 border-border inline-block">
                        "{selectedConcept.visual_hint.metaphor}"
                      </div>
                    )}
                    {selectedConcept.visual_hint.steps && (
                      <div className="space-y-3">
                        {selectedConcept.visual_hint.steps.slice(0, 3).map((step: string, i: number) => (
                          <div key={i} className="text-sm font-bold text-on-surface-variant flex gap-3">
                            <span className="w-6 h-6 rounded-full bg-border text-on-background shrink-0 flex items-center justify-center font-black">{i + 1}</span>
                            <span className="mt-0.5">{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-on-surface-variant font-bold text-xl italic text-center p-12 bg-background border-2 border-border border-dashed">
                Select a concept from the list to see details
              </div>
            )}
          </div>
        </div>

        {/* Right: Animation Queue & Videos */}
        <div className="w-96 flex flex-col gap-8 shrink-0">
          <div className="bg-surface-container border-2 border-border shadow-[8px_8px_0_0_var(--color-border-base)] p-8 flex flex-col gap-6 flex-1 overflow-hidden">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary pb-4 border-b-4 border-border">
              Animation Queue ({animations.length})
            </h3>
            
            {animations.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm font-bold text-on-surface-variant italic bg-background border-2 border-border border-dashed p-6 text-center">
                No animations yet. Select a concept and click "Start Rendering Video"
              </div>
            ) : (
              <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                {animations.map((anim) => (
                  <div
                    key={anim.job_id}
                    className="bg-background border-2 border-border shadow-[4px_4px_0_0_var(--color-border-base)] p-5 flex flex-col gap-4 text-on-background"
                  >
                    <div className="flex items-start justify-between gap-2 border-b-2 border-border pb-2">
                       <div className="font-black text-base flex-1">{anim.concept}</div>
                      <div className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-1 border-2 border-border bg-surface-container shadow-[2px_2px_0_0_var(--color-border-base)]",
                        getStatusColor(anim.status)
                      )}>
                        {getStatusText(anim.status)}
                      </div>
                    </div>

                    {['planning', 'coding', 'rendering'].includes(anim.status) && (
                      <div className="flex items-center gap-3 bg-surface-container border-2 border-border p-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <div className="text-sm font-bold text-on-background">
                          {getStatusText(anim.status)}
                        </div>
                      </div>
                    )}

                    {anim.status === 'ready' && anim.video_url && (
                      <div className="space-y-3">
                        <div className="border-2 border-border shadow-[4px_4px_0_0_var(--color-border-base)] bg-black p-1">
                          <video
                            src={`http://127.0.0.1:8000${anim.video_url}`}
                            controls
                            className="w-full bg-black outline-none"
                          />
                        </div>
                        <a
                          href={`http://127.0.0.1:8000${anim.video_url}`}
                          download
                          className="block w-full text-center px-4 py-3 bg-primary hover:bg-primary/80 text-on-primary border-2 border-border shadow-[4px_4px_0_0_var(--color-border-base)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--color-border-base)] transition-transform text-xs font-black uppercase tracking-widest"
                        >
                          Download MP4
                        </a>
                      </div>
                    )}

                    {anim.status === 'failed' && (
                      <div className="flex flex-col gap-3">
                        <div className="text-xs font-bold text-red-700 bg-red-100 p-3 border-2 border-border shadow-[4px_4px_0_0_var(--color-border-base)]" title={anim.error}>
                          {anim.error || "Rendering failed. Try again."}
                        </div>
                        <button 
                          onClick={() => handleRetry(anim)}
                          className="w-full text-center px-4 py-3 bg-[#fca5a5] hover:bg-[#f87171] text-black border-2 border-border shadow-[4px_4px_0_0_var(--color-border-base)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--color-border-base)] transition-transform text-[10px] font-black uppercase tracking-widest"
                        >
                          Retry Animation
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
