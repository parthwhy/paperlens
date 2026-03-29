import { FileText, Network, BarChart2, Layout, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';

interface SidebarProps {
  activeItem: string;
}

export const Sidebar = ({ activeItem }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <aside 
        className={cn(
          "bg-surface-container h-[calc(100vh-3.5rem)] flex flex-col border-r border-outline-variant/5 transition-all duration-300 relative sticky top-[3.5rem]",
          isOpen ? "w-64 p-6" : "w-0 p-0 overflow-hidden"
        )}
      >
        {/* Sidebar Content */}
        <div className={cn("flex flex-col", isOpen ? "opacity-100" : "opacity-0")}>
          <div className="flex items-center justify-between mb-8 px-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-on-background/40">Project Tree</span>
          </div>
          <div className="space-y-1">
            {[
              { id: 'abstract', label: 'Abstract', icon: FileText },
              { id: 'methodology', label: 'Methodology', icon: Layout },
              { id: 'results', label: 'Results', icon: BarChart2 },
              { id: 'concept-map', label: 'Concept Map', icon: Network },
            ].map((item) => (
              <button
                key={item.id}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all",
                  activeItem === item.id 
                    ? "bg-white text-primary shadow-sm font-bold" 
                    : "text-on-background/60 hover:bg-white/50"
                )}
              >
                <item.icon className="w-4 h-4 stroke-[1.5px]" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Toggle Button - Fixed position when sidebar is closed */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 w-8 h-16 rounded-r-lg primary-gradient text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-20",
          isOpen ? "left-[248px]" : "left-0"
        )}
        title={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? (
          <ChevronLeft className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </button>
    </>
  );
};
