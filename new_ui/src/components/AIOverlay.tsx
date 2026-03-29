import { motion } from 'framer-motion';
import { Sparkles, ChevronDown, History, Settings, Plus } from 'lucide-react';

interface AIOverlayProps {
  title?: string;
  content: string;
  citation?: string;
}

export const AIOverlay = ({ title, content, citation }: AIOverlayProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    className="glass p-6 rounded-2xl max-w-sm ambient-shadow border border-white/20"
  >
    {title && <h4 className="text-sm font-bold mb-3 font-serif italic text-on-background">{title}</h4>}
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-full primary-gradient flex items-center justify-center shrink-0 shadow-lg">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <div className="text-sm leading-relaxed text-on-background/80 font-sans">
        {content}
        {citation && (
          <span className="text-primary font-bold underline ml-1 cursor-pointer">[{citation}]</span>
        )}
      </div>
    </div>
    <div className="mt-6 flex items-center justify-between border-t border-outline-variant/10 pt-4">
      <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-on-background/40">
        <span>Chapter 1</span>
        <ChevronDown className="w-3 h-3" />
      </div>
      <div className="flex items-center gap-4 text-on-background/30">
        <History className="w-4 h-4 hover:text-primary transition-colors cursor-pointer" />
        <Settings className="w-4 h-4 hover:text-primary transition-colors cursor-pointer" />
        <div className="w-5 h-5 rounded-full bg-on-background/5 flex items-center justify-center text-[10px] font-bold text-on-background/40 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer">?</div>
      </div>
    </div>
    <div className="mt-4 relative">
      <input 
        type="text" 
        placeholder="Ask a question..." 
        className="w-full bg-surface-container-low border border-outline-variant/5 rounded-xl py-3 pl-4 pr-12 text-xs font-medium focus:ring-1 focus:ring-primary/20 outline-none"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <Plus className="w-4 h-4 text-on-background/20 hover:text-primary transition-colors cursor-pointer" />
      </div>
    </div>
  </motion.div>
);
