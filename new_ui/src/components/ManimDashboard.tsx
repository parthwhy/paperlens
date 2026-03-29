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
    <div className="flex-1 w-full bg-surface-container p-8 overflow-auto flex flex-col gap-8 dot-grid">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('concept-map')}
            className="p-2 hover:bg-surface-container-highest rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-on-background/40" />
          </button>
          <h2 className="text-2xl font-serif font-bold">Animation Studio</h2>
        </div>
      </div>

      <div className="flex gap-8 flex-1 min-h-0">
        {/* Left: Concept Selection */}
        <div className="w-96 paper-card p-8 flex flex-col gap-6 ambient-shadow shrink-0">
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-on-background/40">
            Main Concepts
          </h3>
          
          {loadingConcepts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : concepts.length === 0 ? (
            <div className="text-sm text-on-background/40 italic py-8 text-center">
              No concepts found. Make sure the paper is fully ingested.
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2">
              {concepts.map((concept) => (
                <button
                  key={concept.id}
                  onClick={() => setSelectedConcept(concept)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all",
                    selectedConcept?.id === concept.id
                      ? "bg-inverse-surface text-white border-inverse-surface shadow-md"
                      : "border-outline-variant/20 hover:bg-surface-container-highest"
                  )}
                >
                  <div className="font-bold text-sm mb-1">{concept.label}</div>
                  <div className="text-xs opacity-60 line-clamp-2">
                    {concept.explanation}
                  </div>
                  {concept.key_equation && (
                    <div className="text-[10px] font-mono mt-2 opacity-40">
                      Has equation
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedConcept && (
            <div className="mt-auto pt-6 border-t border-outline-variant/10">
              <button
                onClick={handleStartRendering}
                disabled={!paperId}
                className="w-full primary-gradient text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Rendering Video
              </button>
              {error && (
                <p className="text-xs text-red-600 font-medium mt-3">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Center: Selected Concept Details */}
        <div className="flex-1 flex flex-col gap-8 min-w-[500px]">
          <div className="paper-card p-8 flex-1 flex flex-col gap-6 ambient-shadow">
            {selectedConcept ? (
              <>
                <div>
                  <h3 className="text-xl font-serif font-bold mb-2">
                    {selectedConcept.label}
                  </h3>
                  <div className="inline-block px-3 py-1 rounded-full bg-surface-container-highest text-[10px] font-mono font-bold uppercase tracking-widest text-on-background/60">
                    {selectedConcept.type}
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-xl p-4 text-sm leading-relaxed">
                  {selectedConcept.explanation}
                </div>

                {selectedConcept.key_equation && (
                  <div className="bg-inverse-surface/5 rounded-xl p-4 border border-outline-variant/10">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-on-background/40 mb-2">
                      Key Equation
                    </div>
                    <div className="font-mono text-sm text-on-background/80">
                      {selectedConcept.key_equation}
                    </div>
                  </div>
                )}

                {selectedConcept.visual_hint && (
                  <div className="bg-surface-container-low rounded-xl p-4">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-on-background/40 mb-3">
                      Visual Approach
                    </div>
                    {selectedConcept.visual_hint.metaphor && (
                      <div className="text-sm italic text-on-background/70 mb-3">
                        "{selectedConcept.visual_hint.metaphor}"
                      </div>
                    )}
                    {selectedConcept.visual_hint.steps && (
                      <div className="space-y-2">
                        {selectedConcept.visual_hint.steps.slice(0, 3).map((step: string, i: number) => (
                          <div key={i} className="text-xs text-on-background/60">
                            {step}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-on-background/40 text-sm">
                Select a concept from the list to see details
              </div>
            )}
          </div>
        </div>

        {/* Right: Animation Queue & Videos */}
        <div className="w-96 flex flex-col gap-8 shrink-0">
          <div className="paper-card p-8 flex flex-col gap-6 ambient-shadow flex-1 overflow-hidden">
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-on-background/40">
              Animation Queue ({animations.length})
            </h3>
            
            {animations.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-on-background/40 italic">
                No animations yet. Select a concept and click "Start Rendering Video"
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto pr-2">
                {animations.map((anim) => (
                  <div
                    key={anim.job_id}
                    className="border border-outline-variant/20 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm flex-1">{anim.concept}</div>
                      <div className={cn(
                        "text-[10px] font-mono font-bold uppercase tracking-widest",
                        getStatusColor(anim.status)
                      )}>
                        {getStatusText(anim.status)}
                      </div>
                    </div>

                    {['planning', 'coding', 'rendering'].includes(anim.status) && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                        <div className="text-xs text-on-background/60">
                          {getStatusText(anim.status)}
                        </div>
                      </div>
                    )}

                    {anim.status === 'ready' && anim.video_url && (
                      <div className="space-y-2">
                        <video
                          src={`http://127.0.0.1:8000${anim.video_url}`}
                          controls
                          className="w-full rounded-lg bg-inverse-surface"
                        />
                        <a
                          href={`http://127.0.0.1:8000${anim.video_url}`}
                          download
                          className="block w-full text-center px-4 py-2 rounded-lg bg-surface-container-highest hover:bg-surface-container text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                          Download MP4
                        </a>
                      </div>
                    )}

                    {anim.status === 'failed' && (
                      <div className="flex flex-col gap-2">
                        <div className="text-xs text-red-600 line-clamp-3" title={anim.error}>
                          {anim.error || "Rendering failed. Try again."}
                        </div>
                        <button 
                          onClick={() => handleRetry(anim)}
                          className="w-full text-center px-4 py-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-600 text-[10px] font-bold uppercase tracking-widest transition-colors"
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
