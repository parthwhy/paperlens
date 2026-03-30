import { useState } from 'react';
import type { View, PaperMetadata } from './types';

import { LandingPage } from './components/LandingPage';
import { Workspace } from './components/Workspace';

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
  const [paperTitle, setPaperTitle] = useLocalStorage<string>('paperlens_paperTitle', '');

  const handlePaperIngested = (id: string, title?: string) => {
    setPaperId(id);
    setPaperTitle(title || 'Research Paper');
    setView('document');
  };

  const handleSelectPaper = (paper: PaperMetadata) => {
    setPaperId(paper.paper_id);
    setPaperTitle(paper.title);
    setView('document');
  };

  const goHome = () => {
    setView('landing');
  };

  if (view === 'landing') {
    return <LandingPage onPaperIngested={handlePaperIngested} />;
  }

  return (
    <Workspace
      paperId={paperId}
      paperTitle={paperTitle}
      onBack={goHome}
      onSelectPaper={handleSelectPaper}
    />
  );
}
