import { useState } from 'react';
import type { View, PaperMetadata } from './types';

import { GlobalNav } from './components/GlobalNav';
import { LibrarySidebar } from './components/LibrarySidebar';
import { LandingPage } from './components/LandingPage';
import { ConceptMap } from './components/ConceptMap';
import { DocumentView } from './components/DocumentView';
import { ManimDashboard } from './components/ManimDashboard';

// Persist state in localStorage
function useLocalStorage<T>(key: string, init: T): [T, (v: T | ((p: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => {
    try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : init; }
    catch { return init; }
  });
  const set = (v: T | ((p: T) => T)) => {
    const next = v instanceof Function ? v(val) : v;
    setVal(next);
    localStorage.setItem(key, JSON.stringify(next));
  };
  return [val, set];
}

export default function App() {
  const [view, setView] = useLocalStorage<View>('paperlens_view', 'landing');
  const [paperId, setPaperId] = useLocalStorage<string | null>('paperlens_paperId', null);

  const handlePaperIngested = (id: string) => {
    setPaperId(id);
    setView('document');
  };

  const handleSelectPaper = (paper: PaperMetadata) => {
    setPaperId(paper.paper_id);
    setView('document');
  };

  return (
    <div className="h-screen w-screen flex bg-background overflow-hidden selection:bg-primary-muted font-sans text-on-background">
      {/* 1. Global Navigation Strip */}
      <GlobalNav view={view} setView={setView} />

      {/* 2. Library Sidebar (History) */}
      <LibrarySidebar currentPaperId={paperId} onSelectPaper={handleSelectPaper} />
      
      {/* 3. Main Content Area */}
      <main className="flex-1 flex overflow-hidden bg-background">
        {view === 'landing' && (
          <LandingPage setView={setView} onPaperIngested={handlePaperIngested} />
        )}
        {view === 'concept-map' && (
          <ConceptMap setView={setView} paperId={paperId} />
        )}
        {view === 'document' && (
          <DocumentView paperId={paperId} />
        )}
        {view === 'manim' && (
          <ManimDashboard setView={setView} paperId={paperId} />
        )}
      </main>
    </div>
  );
}
