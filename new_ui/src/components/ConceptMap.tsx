import { useEffect, useState } from 'react';
import { Network, ZoomIn, Edit3, Sparkles } from 'lucide-react';
import { ConceptMapNode } from './ConceptMapNode';
import { AIOverlay } from './AIOverlay';
import { api } from '../services/api';
import type { View, ConceptMapData } from '../types';

interface ConceptMapProps {
  setView: (v: View) => void;
  paperId: string | null;
}

export const ConceptMap = ({ setView, paperId }: ConceptMapProps) => {
  const [conceptData, setConceptData] = useState<ConceptMapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!paperId) return;

    const fetchConceptMap = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await api.getConceptMap(paperId);
        setConceptData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load concept map');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConceptMap();
  }, [paperId]);

  if (isLoading) {
    return (
      <div className="flex-1 w-full bg-surface relative overflow-hidden dot-grid flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium text-on-background/60">Loading concept map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 w-full bg-surface relative overflow-hidden dot-grid flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <p className="text-sm font-medium text-red-600">{error}</p>
          <button
            onClick={() => paperId && api.getConceptMap(paperId).then(setConceptData).catch(() => {})}
            className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:scale-105 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!conceptData || conceptData.nodes.length === 0) {
    return (
      <div className="flex-1 w-full bg-surface relative overflow-hidden dot-grid flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <p className="text-sm font-medium text-on-background/60">No concept map available for this paper</p>
        </div>
      </div>
    );
  }

  // Calculate positions for nodes if not provided
  const nodesWithPositions = conceptData.nodes.map((node, index) => {
    if (node.x !== undefined && node.y !== undefined) {
      return node;
    }
    // Simple circular layout
    const angle = (index / conceptData.nodes.length) * 2 * Math.PI;
    const radius = 300;
    return {
      ...node,
      x: 400 + radius * Math.cos(angle),
      y: 300 + radius * Math.sin(angle),
    };
  });

  return (
    <div className="flex-1 w-full bg-surface relative overflow-hidden dot-grid">
      <div className="relative h-full w-full">
        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          {conceptData.edges.map((edge, index) => {
            const sourceNode = nodesWithPositions.find(n => n.id === edge.source);
            const targetNode = nodesWithPositions.find(n => n.id === edge.target);
            
            if (!sourceNode || !targetNode) return null;

            const x1 = (sourceNode.x || 0) + 144; // Half of node width (288px / 2)
            const y1 = (sourceNode.y || 0) + 50;
            const x2 = (targetNode.x || 0) + 144;
            const y2 = (targetNode.y || 0) + 50;

            return (
              <path
                key={`${edge.source}-${edge.target}-${index}`}
                d={`M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`}
                stroke="var(--color-primary)"
                strokeWidth="1.5"
                fill="none"
              />
            );
          })}
        </svg>

        {/* Concept Nodes */}
        {nodesWithPositions.map((node, index) => (
          <div key={node.id}>
            <ConceptMapNode
              title={node.label}
              content={node.description}
              x={node.x || 0}
              y={node.y || 0}
              hasAnimation={index === 1} // TODO: Determine which nodes have animations
              onAnimationClick={() => setView('manim')}
            />
          </div>
        ))}

        {/* Connection labels */}
        {conceptData.edges.map((edge, index) => {
          if (!edge.label) return null;

          const sourceNode = nodesWithPositions.find(n => n.id === edge.source);
          const targetNode = nodesWithPositions.find(n => n.id === edge.target);
          
          if (!sourceNode || !targetNode) return null;

          const x = ((sourceNode.x || 0) + (targetNode.x || 0)) / 2 + 100;
          const y = ((sourceNode.y || 0) + (targetNode.y || 0)) / 2;

          return (
            <div
              key={`label-${edge.source}-${edge.target}-${index}`}
              className="absolute text-xs font-serif italic text-on-background/40"
              style={{ left: x, top: y }}
            >
              {edge.label}
            </div>
          );
        })}

        {/* Floating AI Panel */}
        <div className="absolute top-10 right-10">
          <AIOverlay 
            content="Based on section 2.3, Superposition allows Qubits to exist in multiple states simultaneously, forming the basis for quantum computation."
            citation="Citation 2.3"
          />
        </div>

        {/* Canvas Controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-surface-bright/80 backdrop-blur-xl rounded-2xl flex items-center p-2 gap-1 shadow-2xl border border-white/20">
          {[
            { icon: Network, label: 'Pan' },
            { icon: ZoomIn, label: 'Zoom' },
            { icon: Edit3, label: 'Add Note' },
            { icon: Sparkles, label: 'Generate Animation' },
          ].map((btn) => (
            <button key={btn.label} className="flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-xl hover:bg-surface-container transition-all group">
              <btn.icon className="w-4 h-4 text-on-background/60 group-hover:text-primary transition-colors" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-on-background/40">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
