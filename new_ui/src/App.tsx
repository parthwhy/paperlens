import { useState, useEffect } from 'react';
import { cn } from './lib/utils';
import type { View } from './types';

// Import split components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { ConceptMap } from './components/ConceptMap';
import { DocumentView } from './components/DocumentView';
import { ManimDashboard } from './components/ManimDashboard';

// Custom hook to persist state to localStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

// --- Main App ---

export default function App() {
  const [view, setView] = useLocalStorage<View>('paperlens_view', 'landing');
  const [paperId, setPaperId] = useLocalStorage<string | null>('paperlens_paperId', null);
  const [paperTitle, setPaperTitle] = useLocalStorage<string>('paperlens_paperTitle', 'Quantum Computing Paper');

  const handlePaperIngested = (newPaperId: string) => {
    setPaperId(newPaperId);
    // TODO: Fetch paper title from API if needed
    setPaperTitle('Research Paper'); // Placeholder
  };

  return (
    <div className={cn("min-h-screen flex flex-col", view === 'landing' ? "bg-inverse-surface" : "bg-background")}>
      {view !== 'landing' && <Navbar currentView={view} setView={setView} paperTitle={paperTitle} />}
      
      <main className="flex-1 flex overflow-hidden w-full">
        {view === 'landing' && (
          <LandingPage 
            setView={setView} 
            onPaperIngested={handlePaperIngested}
          />
        )}
        
        {view === 'concept-map' && (
          <>
            <Sidebar activeItem="concept-map" />
            <ConceptMap setView={setView} paperId={paperId} />
          </>
        )}
        
        {view === 'document' && (
          <>
            <Sidebar activeItem="methodology" />
            <DocumentView paperId={paperId} />
          </>
        )}

        {view === 'manim' && (
          <ManimDashboard setView={setView} paperId={paperId} />
        )}
      </main>

      {/* View Switcher (for demo purposes) */}
      <div className="fixed bottom-4 right-4 flex gap-2 z-[100] bg-white/10 backdrop-blur-md p-1 rounded-full border border-white/10">
        {(['landing', 'concept-map', 'document', 'manim'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
              view === v ? "bg-primary text-white" : "bg-white text-primary border border-black/10 shadow-sm"
            )}
          >
            {v.replace('-', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}
