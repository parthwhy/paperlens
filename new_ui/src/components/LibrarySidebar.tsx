import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { PaperMetadata } from '../types';

interface LibrarySidebarProps {
  currentPaperId: string | null;
  onSelectPaper: (paper: PaperMetadata) => void;
}

export function LibrarySidebar({ currentPaperId, onSelectPaper }: LibrarySidebarProps) {
  const [papers, setPapers] = useState<PaperMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  // We should fetch papers when the sidebar loads
  useEffect(() => {
    async function loadPapers() {
      try {
        setLoading(true);
        const res = await api.getRecentPapers(30);
        setPapers(res.papers);
      } catch (err) {
        console.error("Failed to load papers:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPapers();
  }, [currentPaperId]); // Refetch when currentPaperId changes (new paper ingested)

  return (
    <aside className="w-72 h-full bg-surface-container border-r-2 border-border flex flex-col shrink-0">
      <div className="p-4 border-b-2 border-border bg-surface-container">
        <h2 className="font-bold text-lg flex items-center gap-2 text-on-background">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Your Papers
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && papers.length === 0 ? (
          <div className="text-on-surface-variant text-sm animate-pulse">Loading history...</div>
        ) : papers.length === 0 ? (
          <div className="text-on-surface-variant text-sm italic">No papers ingested yet.</div>
        ) : (
          papers.map((paper) => (
            <button
              key={paper.paper_id}
              onClick={() => onSelectPaper(paper)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-transform ${
                currentPaperId === paper.paper_id
                  ? 'bg-primary-light border-border shadow-[2px_2px_0px_0px_var(--color-border-base)] -translate-y-[1px]'
                  : 'bg-surface border-transparent hover:border-border hover:-translate-y-[1px] hover:shadow-[2px_2px_0px_0px_var(--color-border-base)]'
              }`}
            >
              <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1 text-on-background">
                {paper.title}
              </h3>
              <p className="text-xs text-on-surface-variant truncate">
                {(paper.authors && typeof paper.authors === 'string') 
                  ? paper.authors 
                  : Array.isArray(paper.authors) ? paper.authors.join(', ') : 'Unknown authors'}
              </p>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
