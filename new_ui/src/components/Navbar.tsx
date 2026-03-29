import { ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import type { View } from '../types';

interface NavbarProps {
  currentView: View;
  setView: (v: View) => void;
  paperTitle?: string;
}

export const Navbar = ({ currentView, setView, paperTitle = 'Quantum Computing Paper' }: NavbarProps) => (
  <nav className="h-14 bg-surface-bright backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50 border-b border-outline-variant/10">
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
        <span className="font-serif text-xl font-bold tracking-tight text-on-background">PaperLens</span>
        <span className="text-[10px] font-mono font-medium bg-surface-container px-1.5 py-0.5 rounded text-on-background/60 uppercase tracking-widest">beta</span>
      </div>
      <div className="h-4 w-[1px] bg-outline-variant mx-4" />
      <div className="flex items-center gap-4 text-sm font-medium text-on-background/60">
        <button onClick={() => setView('document')} className={cn("hover:text-primary transition-colors", currentView === 'document' && "text-primary")}>Projects</button>
        <ChevronRight className="w-3 h-3 opacity-30" />
        <button className="hover:text-primary transition-colors">{paperTitle}</button>
        <ChevronRight className="w-3 h-3 opacity-30" />
        <span className="text-primary font-semibold capitalize">{currentView.replace('-', ' ')}</span>
      </div>
    </div>
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-4 text-sm font-medium text-on-background/60">
        <button className="hover:text-primary transition-colors">hover-explain</button>
        <button className="hover:text-primary transition-colors">rag-chat</button>
        <button onClick={() => setView('concept-map')} className={cn("hover:text-primary transition-colors", currentView === 'concept-map' && "text-primary")}>concept-map</button>
      </div>
      <button 
        onClick={() => setView('concept-map')}
        className="primary-gradient text-white px-5 py-2 rounded-full text-sm font-bold hover:scale-105 transition-all shadow-lg"
      >
        try it now
      </button>
    </div>
  </nav>
);
