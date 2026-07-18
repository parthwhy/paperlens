import { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, Star, Clock, Sparkles, Play, Key, Settings as SettingsIcon } from 'lucide-react';
import type { View, PaperMetadata } from '../types';
import { api } from '../services/api';
import { setDemoMode, DEMO_PAPER_ID } from '../services/demo';
import { SettingsModal } from './SettingsModal';
import { hasGroqKey } from '../services/llm';

interface LandingPageProps {
  setView: (v: View) => void;
  onPaperIngested: (paperId: string) => void;
}

const FAMOUS_PAPERS = [
  { id: '1706.03762', title: 'Attention Is All You Need', authors: 'Ashish Vaswani, Noam Shazeer, Niki Parmar, et al.' },
  { id: '1512.03385', title: 'Deep Residual Learning for Image Recognition', authors: 'Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun' },
  { id: '2005.14165', title: 'Language Models are Few-Shot Learners (GPT-3)', authors: 'Tom B. Brown, Benjamin Mann, Nick Ryder, et al.' },
];

interface Feature {
  icon: string;
  title: string;
  desc: string;
  live: boolean; // true = works in the offline demo without a Groq key
}

const FEATURES: Feature[] = [
  {
    icon: '🗺️',
    title: 'Knowledge Graph',
    desc: 'See how concepts connect at a glance. We build an interactive concept map so you grasp the paper’s structure before reading a word.',
    live: true,
  },
  {
    icon: '💬',
    title: 'RAG Chat',
    desc: 'Ask anything about the paper. Answers are grounded in the actual text with citations back to the exact chunks — no hallucinated facts.',
    live: false,
  },
  {
    icon: '✨',
    title: 'Selection Tooltips',
    desc: 'Highlight any sentence and get an instant, plain-English explanation of that specific part — like a tutor reading over your shoulder.',
    live: false,
  },
  {
    icon: '🎬',
    title: 'Manim Animations',
    desc: 'Turn dense equations and ideas into playable 3Blue1Brown-style animations generated from the paper. (Requires the backend.)',
    live: false,
  },
  {
    icon: '📄',
    title: 'Smart Reader',
    desc: 'The full PDF with built-in citation jumping and concept highlighting, so you never lose track of where an idea came from.',
    live: true,
  },
  {
    icon: '🔑',
    title: 'Your Key, Your Browser',
    desc: 'AI features run on a free Groq key you paste in Settings. It never leaves your browser and never touches our servers.',
    live: false,
  },
];

export const LandingPage = ({ setView, onPaperIngested }: LandingPageProps) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [recentPapers, setRecentPapers] = useState<PaperMetadata[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    setHasKey(hasGroqKey());
  }, [settingsOpen]);

  useEffect(() => {
    api.getRecentPapers(4).then(res => setRecentPapers(res.papers)).catch(() => {});
  }, []);

  const handleTryDemo = async () => {
    setDemoLoading(true);
    setError('');
    try {
      // Load the pre-bundled famous paper — no backend required.
      setDemoMode(true);
      const meta = await api.getPaperDetails(DEMO_PAPER_ID);
      setDemoLoading(false);
      onPaperIngested(meta.paper_id);
    } catch {
      setDemoLoading(false);
      setError('Failed to load demo. Please try again.');
    }
  };

  const handleIngest = async (targetUrl: string) => {
    if (!targetUrl.trim()) { setError('Please enter an arXiv URL'); return; }
    setLoading(true);
    setError('');
    setProgress('Starting ingestion...');

    try {
      const { job_id } = await api.ingestPaper(targetUrl);
      setProgress('Processing paper (this might take 1-2 minutes)...');

      const poll = setInterval(async () => {
        try {
          const status = await api.getIngestionStatus(job_id);
          if (status.status === 'completed' && status.paper_id) {
            clearInterval(poll);
            setLoading(false);
            onPaperIngested(status.paper_id);
          } else if (status.status === 'failed') {
            clearInterval(poll);
            setLoading(false);
            setError(status.message || 'Processing failed');
          } else {
            setProgress(status.message || 'Processing paper...');
          }
        } catch {
          // ignore transient poll errors
        }
      }, 3000);

      setTimeout(() => { clearInterval(poll); if (loading) { setLoading(false); setError('Timeout — please try again'); } }, 300000);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to start');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto w-full flex flex-col items-center bg-[#f4f4f0] bg-plus-pattern px-8 py-16">
      <div className="max-w-4xl w-full flex flex-col gap-16 mt-8">
        
        {/* Header Section */}
        <section className="text-center flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface brutal-border rounded-full font-bold shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>Welcome to PaperLens</span>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              title="Settings — add your Groq API key for demo chat"
              className={`w-9 h-9 rounded-full brutal-border shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center justify-center bg-surface hover:-translate-y-0.5 transition-transform ${hasGroqKey() ? 'text-green-600' : 'text-gray-600'}`}
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
            Read AI Papers <br className="hidden md:block" />
            <span className="text-primary underline decoration-black decoration-4 underline-offset-8">Without</span> the Headache
          </h1>
          <p className="text-lg font-medium text-gray-700 max-w-2xl">
            Drop an arXiv link below. We generate an interactive concept map, tooltips for complex equations, and ready-to-play Manim animations.
          </p>

          <div className="flex w-full max-w-2xl mt-4 relative">
            <input 
              type="text" 
              placeholder="e.g., https://arxiv.org/abs/1706.03762"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleIngest(url)}
              disabled={loading}
              className="flex-1 bg-surface brutal-border border-r-0 rounded-l-xl px-6 py-4 text-lg font-mono focus:outline-none focus:bg-primary-light transition-colors shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-10"
            />
            <button
              onClick={() => handleIngest(url)}
              disabled={loading || demoLoading}
              className="bg-primary hover:bg-primary-hover text-white font-black px-8 py-4 rounded-r-xl brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:opacity-50 transition-all flex items-center justify-center min-w-[140px] z-10"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Analyze <ArrowRight className="ml-2 w-5 h-5" /></>
              )}
            </button>
            <button
              onClick={handleTryDemo}
              disabled={loading || demoLoading}
              title="Load a pre-processed paper instantly — no backend needed"
              className="ml-3 bg-black hover:bg-gray-800 text-white font-black px-6 py-4 rounded-xl brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:opacity-50 transition-all flex items-center justify-center z-10"
            >
              {demoLoading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Play className="mr-2 w-5 h-5 fill-white" /> Try Demo</>
              )}
            </button>
            {!hasKey && (
              <button
                onClick={() => setSettingsOpen(true)}
                className="ml-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black px-6 py-4 rounded-xl brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex items-center justify-center z-10"
              >
                <Key className="mr-2 w-5 h-5" /> Add Groq Key
              </button>
            )}
          </div>

          <p className="text-xs font-medium text-gray-500 mt-3 text-center max-w-2xl">
            Demo loads a pre-processed paper instantly. Reading & concept map work with no setup.
            For AI chat & hover explanations, click <span className="font-black">Add Groq Key</span> (free, from console.groq.com) — it stays in your browser.
          </p>

          {(error || progress) && (
            <div className={`mt-4 px-6 py-3 rounded-lg font-bold brutal-border brutal-shadow-sm ${error ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
              {error || progress}
            </div>
          )}
        </section>

        {/* ===== Features ===== */}
        <section className="w-full mt-20">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 bg-yellow-300 brutal-border border-black rounded-full font-black text-sm uppercase tracking-widest shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
              What it does
            </span>
            <h2 className="text-3xl md:text-4xl font-black mt-4">Everything you need to actually understand a paper</h2>
            <p className="text-gray-600 font-medium mt-2 max-w-2xl mx-auto">
              Try the live demo — no signup, no backend. Add a free Groq key for the AI features.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group bg-surface brutal-border rounded-2xl p-6 shadow-[5px_5px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[7px_7px_0_0_rgba(0,0,0,1)] transition-all flex flex-col"
              >
                <div className="w-14 h-14 rounded-xl border-2 border-black flex items-center justify-center mb-4 bg-white group-hover:scale-110 transition-transform">
                  <span className="text-2xl">{f.icon}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-lg">{f.title}</h3>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border border-black ${f.live ? 'bg-green-300' : 'bg-gray-200'}`}>
                    {f.live ? 'In demo' : 'Needs key'}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Famous Papers */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-xl">
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  <h2>Famous Papers</h2>
                </div>
                <span className="text-xs font-bold text-gray-500 bg-surface-muted brutal-border px-2 py-1 rounded">needs backend</span>
              </div>
              <p className="text-sm font-medium text-gray-500 -mt-2">
                These fetch live from the backend. Use <span className="font-black">Try Demo</span> for an instant offline preview.
              </p>
            {FAMOUS_PAPERS.map(paper => (
              <button 
                key={paper.id}
                onClick={() => handleIngest(paper.id)}
                className="text-left bg-surface brutal-border rounded-xl p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-transform group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg leading-snug group-hover:text-primary transition-colors">{paper.title}</h3>
                    <p className="text-sm font-medium text-gray-500 mt-1">{paper.authors}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </section>

          {/* Recent Papers */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 font-bold text-xl mb-2">
              <Clock className="w-6 h-6 text-blue-500" />
              <h2>Recently Processed</h2>
            </div>
            {recentPapers.length === 0 ? (
              <div className="h-full flex items-center justify-center bg-surface-muted brutal-border border-dashed rounded-xl p-8 text-center font-medium text-gray-500">
                No recent papers found. Be the first to ingest one!
              </div>
            ) : (
              recentPapers.map(paper => (
                <button 
                  key={paper.paper_id}
                  onClick={() => onPaperIngested(paper.paper_id)}
                  className="text-left bg-surface brutal-border rounded-xl p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-transform group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg leading-snug group-hover:text-primary transition-colors line-clamp-1">{paper.title}</h3>
                      <p className="text-sm font-medium text-gray-500 mt-1 truncate">
                        {Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                  </div>
                </button>
              ))
            )}
          </section>
        </div>
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};
