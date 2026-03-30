import React from 'react';
import type { View } from '../types';

interface GlobalNavProps {
  view: View;
  setView: (v: View) => void;
}

export function GlobalNav({ view, setView }: GlobalNavProps) {
  return (
    <nav className="w-16 h-full flex flex-col items-center py-4 bg-surface border-r-2 border-black z-20 shrink-0">
      <div 
        className="w-10 h-10 bg-primary rounded-xl brutal-border brutal-shadow-sm flex items-center justify-center text-white font-bold text-xl mb-8 cursor-pointer transform transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        onClick={() => setView('landing')}
        title="PaperLens Home"
      >
        P
      </div>

      <div className="flex flex-col gap-4 w-full px-2">
        <NavIcon 
          active={view === 'landing'} 
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>}
          label="Home"
          onClick={() => setView('landing')}
        />
        <NavIcon 
          active={view === 'document'} 
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>}
          label="Document"
          onClick={() => setView('document')}
        />
        <NavIcon 
          active={view === 'concept-map'} 
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>}
          label="Concept Map"
          onClick={() => setView('concept-map')}
        />
        <NavIcon 
          active={view === 'manim'} 
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>}
          label="Animations"
          onClick={() => setView('manim')}
        />
      </div>
    </nav>
  );
}

function NavIcon({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center transition-all ${
        active 
          ? 'bg-primary text-white brutal-border brutal-shadow-sm -translate-y-0.5' 
          : 'text-gray-500 hover:bg-surface-container hover:text-black border-2 border-transparent hover:border-black'
      }`}
    >
      {icon}
    </button>
  );
}
