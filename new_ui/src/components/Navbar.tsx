import { motion } from 'framer-motion';
import { FileText, Network, Video, Home } from 'lucide-react';
import type { View } from '../types';

interface NavbarProps {
  currentView: View;
  setView: (v: View) => void;
  paperTitle?: string;
  paperId?: string | null;
}

const tabs: { id: View; label: string; icon: typeof FileText }[] = [
  { id: 'document', label: 'Document', icon: FileText },
  { id: 'concept-map', label: 'Concept Map', icon: Network },
  { id: 'manim', label: 'Animations', icon: Video },
];

export const Navbar = ({ currentView, setView, paperTitle, paperId }: NavbarProps) => (
  <nav className="h-14 bg-surface border-b border-border flex items-center justify-between px-5 sticky top-0 z-50">
    {/* Left: Logo */}
    <div className="flex items-center gap-3">
      <button 
        onClick={() => setView('landing')}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="w-7 h-7 rounded-lg primary-gradient flex items-center justify-center">
          <Home className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-base font-bold tracking-tight text-on-background">PaperLens</span>
      </button>
      
      {paperTitle && (
        <>
          <div className="h-4 w-px bg-border-strong mx-1" />
          <span className="text-sm text-on-background/50 truncate max-w-[200px]">{paperTitle}</span>
        </>
      )}
    </div>

    {/* Center: Tabs */}
    {paperId && (
      <div className="flex items-center gap-1 bg-surface-dim rounded-xl p-1">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-on-background/50 hover:text-on-background/80'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-surface rounded-lg shadow-sm border border-border"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    )}

    {/* Right: spacer */}
    <div className="w-[200px]" />
  </nav>
);
