import { useState } from 'react';
import { motion } from 'framer-motion';
import { LinkIcon, Upload, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import type { View } from '../types';
import { api } from '../services/api';

interface LandingPageProps {
  setView: (v: View) => void;
  onPaperIngested: (paperId: string) => void;
}

export const LandingPage = ({ setView, onPaperIngested }: LandingPageProps) => {
  const [activeTab, setActiveTab] = useState('canvases');
  const [arxivUrl, setArxivUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!arxivUrl.trim()) {
      setError('Please enter an arXiv URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Start ingestion
      const { job_id } = await api.ingestPaper(arxivUrl);

      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const status = await api.getIngestionStatus(job_id);

          if (status.status === 'completed' && status.paper_id) {
            clearInterval(pollInterval);
            setIsLoading(false);
            onPaperIngested(status.paper_id);
            setView('document');
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setIsLoading(false);
            setError(status.message || 'Failed to process paper');
          }
        } catch (err) {
          clearInterval(pollInterval);
          setIsLoading(false);
          setError('Failed to check ingestion status');
        }
      }, 2000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isLoading) {
          setIsLoading(false);
          setError('Ingestion timeout - please try again');
        }
      }, 300000);
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to start ingestion');
    }
  };

  return (
    <div className="min-h-screen w-full bg-inverse-surface text-white flex flex-col relative dot-grid overflow-x-hidden selection:bg-primary/30">
      {/* Top Bar Overlay */}
      <div className="w-full mt-10 px-6 md:px-12 z-20 flex justify-center">
        <div className="max-w-6xl w-full bg-white text-on-background rounded-xl p-3 flex items-center justify-between shadow-2xl border border-white/10">
          <div className="flex items-center gap-2 ml-4">
            <span className="font-serif text-2xl font-bold text-on-background">PaperLens</span>
            <span className="text-[10px] bg-surface-container px-1.5 py-0.5 rounded text-on-background/40 font-mono uppercase tracking-widest">beta</span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-sm font-medium">
            <div className="flex items-center gap-2 text-on-background/60">
              <div className="w-3 h-3 bg-[#8fb38f] rounded-sm" /> cross-format
            </div>
            <div className="flex items-center gap-2 text-on-background/60">
              <div className="w-3 h-3 bg-[#d4c185] rounded-sm" /> organisation
            </div>
            <div className="flex items-center gap-2 text-on-background/60">
              <div className="w-3 h-3 bg-[#9e8fb3] rounded-sm" /> ai-chat
            </div>
          </div>
          <button 
            onClick={() => setView('concept-map')}
            className="bg-inverse-surface text-white px-8 py-2.5 rounded-lg text-sm font-bold hover:scale-105 transition-all"
          >
            try it now
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-12 py-24 relative z-10 w-full overflow-hidden">
        {/* Floating Sticky Notes Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {[
            { text: "what is attention model?", color: "bg-[#fef9c3]", top: "15%", left: "5%", rotate: "-8deg", delay: 0 },
            { text: "explain transformers architecture?", color: "bg-[#dcfce7]", top: "60%", left: "2%", rotate: "6deg", delay: 0.2 },
            { text: "how does backpropagation work?", color: "bg-[#ffdcbf]", top: "80%", left: "15%", rotate: "-4deg", delay: 0.4 },
            { text: "what is a latent space?", color: "bg-[#dbeafe]", top: "10%", right: "8%", rotate: "10deg", delay: 0.1 },
            { text: "summarize this paper", color: "bg-[#fce7f3]", top: "45%", right: "3%", rotate: "-6deg", delay: 0.3 },
            { text: "visualize the loss function", color: "bg-[#eddcff]", top: "75%", right: "10%", rotate: "9deg", delay: 0.5 },
          ].map((note, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ 
                opacity: 0.4, 
                scale: 1, 
                y: [0, -15, 0],
                rotate: [note.rotate, (parseInt(note.rotate) + 2) + "deg", note.rotate]
              }}
              whileHover={{ 
                scale: 1.1, 
                rotate: "0deg", 
                opacity: 1,
                zIndex: 50,
                transition: { type: "spring", stiffness: 300 }
              }}
              transition={{ 
                delay: note.delay,
                y: { duration: 6 + i, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 7 + i, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: 0.5 }
              }}
              className={cn(
                "absolute px-6 py-8 w-44 h-44 flex items-center justify-center text-center shadow-2xl border border-black/5 cursor-pointer pointer-events-auto",
                "clip-path-fold",
                note.color
              )}
              style={{ 
                top: note.top, 
                left: note.left, 
                right: note.right,
              }}
            >
              <span className="text-on-background/80 font-sans font-bold text-xs leading-relaxed">
                {note.text}
              </span>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-black/10 clip-path-fold rotate-180 opacity-50" />
            </motion.div>
          ))}
        </div>

        <div className="max-w-5xl w-full relative">
          {/* Tabs */}
          <div className="flex gap-1 mb-[-1px] md:ml-16 relative z-30">
            {[
              { id: 'ai-chats', label: 'ai-chats', color: 'bg-[#eddcff]' },
              { id: 'notes', label: 'notes', color: 'bg-[#ffdcbf]' },
              { id: 'canvases', label: 'canvases', color: 'bg-[#e8f5e9]' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-8 py-3 rounded-t-xl text-sm font-bold transition-all border-x border-t border-transparent",
                  activeTab === tab.id 
                    ? cn("text-on-background", tab.color) 
                    : "text-white/40 hover:text-white/60"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Main Card */}
          <div className="bg-gradient-to-br from-white to-[#fcf9f8] text-on-background rounded-3xl p-12 md:p-20 shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden min-h-[550px] flex flex-col justify-center border border-white/5">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-10"
            >
              <div className="mb-8">
                <span className="text-3xl font-serif font-bold">PaperLens</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-sans font-medium leading-[1.1] tracking-tight max-w-3xl mb-12">
                brings <span className="bg-[#f6f3f2] px-2 italic">notes</span>, <span className="bg-[#f6f3f2] px-2 italic">canvases</span> and <span className="bg-[#f6f3f2] px-2 italic">AI chats</span> into one connected workspace
              </h1>
              
              {/* Input Bar Area */}
              <div className="mt-12 max-w-2xl relative z-20">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col md:flex-row gap-3 p-2 bg-surface-container-low rounded-2xl border border-outline-variant/10 shadow-inner focus-within:ring-2 focus-within:ring-primary/20 transition-all"
                >
                  <div className="flex-1 flex items-center px-4 gap-3 min-h-[56px]">
                    <LinkIcon className="w-5 h-5 text-on-background/30" />
                    <input 
                      type="text" 
                      placeholder="Paste arXiv url of paper or Upload a pdf"
                      value={arxivUrl}
                      onChange={(e) => setArxivUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      disabled={isLoading}
                      className="flex-1 bg-transparent outline-none text-sm font-medium text-on-background placeholder:text-on-background/40"
                    />
                  </div>
                  <button 
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-inverse-surface text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:scale-[1.02] transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        Start
                      </>
                    )}
                  </button>
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-sm text-red-600 font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="mt-6 flex items-center gap-4">
                  <button className="flex items-center gap-2 text-sm font-medium text-on-background/60 hover:text-primary transition-colors">
                    <Upload className="w-4 h-4" />
                    or upload PDF
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Background Blobs */}
            <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-[#d4c185]/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#9e8fb3]/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
          </div>
        </div>

        {/* Global Dot Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-10 dot-grid" />
      </section>
    </div>
  );
};
