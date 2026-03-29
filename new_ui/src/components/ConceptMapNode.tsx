import { motion } from 'framer-motion';
import { Play, Maximize2 } from 'lucide-react';

interface ConceptMapNodeProps {
  title: string;
  content: string;
  x: number;
  y: number;
  hasAnimation?: boolean;
  onAnimationClick?: () => void;
}

export const ConceptMapNode = ({ title, content, x, y, hasAnimation, onAnimationClick }: ConceptMapNodeProps) => (
  <motion.div 
    drag
    dragMomentum={false}
    style={{ left: x, top: y }}
    className="absolute paper-card p-6 w-72 ambient-shadow cursor-grab active:cursor-grabbing border border-outline-variant/5 group"
  >
    <h3 className="text-xl font-serif font-bold mb-3 text-on-background group-hover:text-primary transition-colors">{title}</h3>
    <p className="text-xs leading-relaxed text-on-background/60 mb-6 font-sans">
      {content}
    </p>
    {hasAnimation && (
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onAnimationClick?.();
        }}
        className="flex items-center gap-2 bg-primary-fixed/50 text-primary px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        Manim Animations
      </button>
    )}
    <div className="absolute bottom-3 right-3 opacity-10 group-hover:opacity-30 transition-opacity">
      <Maximize2 className="w-3.5 h-3.5" />
    </div>
  </motion.div>
);
