import { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, Star, Clock } from 'lucide-react';
import type { View, PaperMetadata } from '../types';
import { api } from '../services/api';

interface LandingPageProps {
  setView: (v: View) => void;
  onPaperIngested: (paperId: string) => void;
}

const FAMOUS_PAPERS = [
  { id: '1706.03762', title: 'Attention Is All You Need', authors: 'Ashish Vaswani, Noam Shazeer, Niki Parmar, et al.' },
  { id: '1512.03385', title: 'Deep Residual Learning for Image Recognition', authors: 'Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun' },
  { id: '2005.14165', title: 'Language Models are Few-Shot Learners (GPT-3)', authors: 'Tom B. Brown, Benjamin Mann, Nick Ryder, et al.' },
];

export const LandingPage = ({ setView, onPaperIngested }: LandingPageProps) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [recentPapers, setRecentPapers] = useState<PaperMetadata[]>([]);

  useEffect(() => {
    api.getRecentPapers(4).then(res => setRecentPapers(res.papers)).catch(console.error);
  }, []);

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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface brutal-border rounded-full font-bold shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>Welcome to PaperLens</span>
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
              disabled={loading}
              className="bg-primary hover:bg-primary-hover text-white font-black px-8 py-4 rounded-r-xl brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:opacity-50 transition-all flex items-center justify-center min-w-[140px] z-10"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Analyze <ArrowRight className="ml-2 w-5 h-5" /></>
              )}
            </button>
          </div>

          {(error || progress) && (
            <div className={`mt-4 px-6 py-3 rounded-lg font-bold brutal-border brutal-shadow-sm ${error ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
              {error || progress}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Famous Papers */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 font-bold text-xl mb-2">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <h2>Famous Papers</h2>
            </div>
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
    </div>
  );
};
