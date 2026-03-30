import React, { useEffect, useState, useRef, useCallback } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, type SimulationNodeDatum, type SimulationLinkDatum } from 'd3-force';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import type { View, ConceptNode, ConceptEdge, ConceptMapData } from '../types';

interface ConceptMapProps {
  setView: (v: View) => void;
  paperId: string | null;
}

// Node colors by type
const typeColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  method:  { bg: '#f5f3ff', border: '#c4b5fd', text: '#5b21b6', dot: '#7c3aed' },
  concept: { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', dot: '#2563eb' },
  dataset: { bg: '#ecfdf5', border: '#6ee7b7', text: '#047857', dot: '#059669' },
  metric:  { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', dot: '#d97706' },
};

function getTypeStyle(type?: string) {
  return typeColors[type || 'concept'] || typeColors.concept;
}

// Predicate display labels
const predicateLabels: Record<string, string> = {
  extends: 'extends',
  uses: 'uses',
  evaluates_on: 'evaluated on',
  introduces: 'introduces',
  contrasts: 'contrasts with',
  outperforms: 'outperforms',
  part_of: 'part of',
  enables: 'enables',
};

interface SimNode extends SimulationNodeDatum {
  id: string;
  label: string;
  type?: string;
  explanation?: string;
  key_equation?: string | null;
  importance?: number;
  frequency?: number;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  predicate?: string;
  label?: string;
}

export const ConceptMap = ({ setView, paperId }: ConceptMapProps) => {
  const [data, setData] = useState<ConceptMapData | null>(null);
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [simLinks, setSimLinks] = useState<SimLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<SimNode | null>(null);
  
  // Pan & zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch concept map data
  useEffect(() => {
    if (!paperId) return;
    setLoading(true);
    setError('');

    api.getConceptMap(paperId)
      .then((d) => {
        setData(d);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [paperId]);

  // Run force simulation
  useEffect(() => {
    if (!data || data.nodes.length === 0) return;

    const nodes: SimNode[] = data.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      explanation: n.explanation || n.description,
      key_equation: n.key_equation,
      importance: n.importance || n.frequency || 5,
      frequency: n.frequency,
    }));

    const nodeIds = new Set(nodes.map(n => n.id));
    const links: SimLink[] = data.edges
      .filter(e => nodeIds.has(e.source as string) && nodeIds.has(e.target as string))
      .map((e) => ({
        source: e.source,
        target: e.target,
        predicate: e.predicate || e.label,
        label: e.label || e.predicate,
      }));

    const sim = forceSimulation<SimNode>(nodes)
      .force('link', forceLink<SimNode, SimLink>(links).id(d => d.id).distance(180).strength(0.5))
      .force('charge', forceManyBody().strength(-400))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide().radius((d: any) => nodeRadius(d.importance) + 30))
      .alphaDecay(0.03);

    sim.on('tick', () => {
      setSimNodes([...nodes]);
      setSimLinks([...links]);
    });

    sim.on('end', () => {
      setSimNodes([...nodes]);
      setSimLinks([...links]);
    });

    return () => { sim.stop(); };
  }, [data]);

  // Center view on load
  useEffect(() => {
    if (simNodes.length > 0 && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTransform({ x: rect.width / 2, y: rect.height / 2, scale: 1 });
    }
  }, [simNodes.length > 0]);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.concept-node')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setTransform(t => ({ ...t, x: e.clientX - panStart.x, y: e.clientY - panStart.y }));
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  // Zoom handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(t => ({
      ...t,
      scale: Math.max(0.3, Math.min(3, t.scale * delta)),
    }));
  }, []);

  const nodeRadius = (importance?: number) => {
    const imp = importance || 5;
    return 28 + imp * 3;
  };

  // Get connected edges for selected node
  const getConnections = (nodeId: string) => {
    return simLinks.filter(l => {
      const s = typeof l.source === 'object' ? (l.source as SimNode).id : l.source;
      const t = typeof l.target === 'object' ? (l.target as SimNode).id : l.target;
      return s === nodeId || t === nodeId;
    }).map(l => {
      const s = typeof l.source === 'object' ? (l.source as SimNode) : simNodes.find(n => n.id === l.source);
      const t = typeof l.target === 'object' ? (l.target as SimNode) : simNodes.find(n => n.id === l.target);
      const isSource = (s?.id || '') === nodeId;
      return {
        other: isSource ? t : s,
        predicate: l.predicate || l.label || '→',
        direction: isSource ? 'outgoing' as const : 'incoming' as const,
      };
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-on-surface-variant font-medium">Building concept map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-dim">
        <div className="text-center max-w-md">
          <p className="text-sm text-danger font-medium mb-4">{error}</p>
          <button onClick={() => paperId && api.getConceptMap(paperId).then(setData)} className="px-5 py-2 primary-gradient text-white rounded-xl text-sm font-semibold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <p className="text-sm text-on-surface-variant">No concept map data available</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full flex bg-background overflow-hidden relative">
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-background dot-grid">
        {/* SVG Canvas */}
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {/* Edges */}
            {simLinks.map((link, i) => {
              const source = typeof link.source === 'object' ? link.source as SimNode : null;
              const target = typeof link.target === 'object' ? link.target as SimNode : null;
              if (!source || !target || source.x == null || target.x == null) return null;

              const sx = source.x!, sy = source.y!;
              const tx = target.x!, ty = target.y!;
              const mx = (sx + tx) / 2;
              const my = (sy + ty) / 2;
              // Slight curve offset
              const dx = tx - sx, dy = ty - sy;
              const offset = 20;
              const cx = mx - dy / Math.sqrt(dx*dx + dy*dy + 1) * offset;
              const cy = my + dx / Math.sqrt(dx*dx + dy*dy + 1) * offset;

              const isHighlighted = selected && (
                (source.id === selected.id || target.id === selected.id)
              );

              return (
                <g key={`edge-${i}`}>
                  <path
                    d={`M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`}
                    fill="none"
                    stroke={isHighlighted ? 'var(--color-border-base)' : 'var(--color-on-surface-variant)'}
                    strokeWidth={isHighlighted ? 3 : 2}
                    opacity={selected ? (isHighlighted ? 1 : 0.15) : 0.6}
                  />
                  {/* Edge label */}
                  {(link.predicate || link.label) && (
                    <text
                      x={cx}
                      y={cy - 6}
                      textAnchor="middle"
                      fill={isHighlighted ? 'var(--color-on-background)' : 'var(--color-on-surface-variant)'}
                      fontSize={10}
                      fontFamily="Inter, sans-serif"
                      fontWeight={800}
                      opacity={selected ? (isHighlighted ? 1 : 0) : 0.8}
                      className="select-none"
                    >
                      {predicateLabels[(link.predicate || link.label)!] || link.predicate || link.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {simNodes.map((node) => {
              if (node.x == null || node.y == null) return null;
              const style = getTypeStyle(node.type);
              const r = nodeRadius(node.importance);
              const isSelected = selected?.id === node.id;
              const isConnected = selected ? getConnections(selected.id).some(c => c.other?.id === node.id) : false;
              const dimmed = selected && !isSelected && !isConnected;

              return (
                <g
                  key={node.id}
                  className="concept-node"
                  style={{ cursor: 'pointer' }}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={(e) => { e.stopPropagation(); setSelected(isSelected ? null : node); }}
                  opacity={dimmed ? 0.2 : 1}
                >
                  <circle
                    r={r}
                    fill={style.bg}
                    stroke="var(--color-border-base)"
                    strokeWidth={isSelected ? 4 : 2}
                  />
                  {/* Type dot */}
                  <circle cx={0} cy={-r + 8} r={4} fill={style.dot} stroke="var(--color-border-base)" strokeWidth={1} />
                  {/* Label */}
                  <text
                    y={2}
                    textAnchor="middle"
                    fill="var(--color-on-background)"
                    fontSize={Math.min(12, r / 3)}
                    fontFamily="Inter, sans-serif"
                    fontWeight={900}
                  >
                    {node.label.length > 20 ? node.label.slice(0, 18) + '…' : node.label}
                  </text>
                  {/* Type label (small) */}
                  <text
                    y={16}
                    textAnchor="middle"
                    fill="var(--color-on-background)"
                    fontSize={8}
                    fontFamily="Inter, sans-serif"
                    fontWeight={800}
                    opacity={0.8}
                  >
                    {node.type || 'concept'}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Legend */}
        <div className="absolute top-6 left-6 bg-surface-container border-2 border-border p-3 flex flex-col gap-2 shadow-[4px_4px_0_0_var(--color-border-base)] z-10">
          {Object.entries(typeColors).map(([type, c]) => (
            <div key={type} className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full border-2 border-border" style={{ backgroundColor: c.dot }} />
              <span className="font-bold text-on-background capitalize">{type}</span>
            </div>
          ))}
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-6 left-6 flex gap-2 z-10">
          <button onClick={() => setTransform(t => ({ ...t, scale: Math.min(3, t.scale * 1.2) }))} className="w-10 h-10 bg-surface-container border-2 border-border flex items-center justify-center font-black shadow-[4px_4px_0_0_var(--color-border-base)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--color-border-base)] transition-transform text-on-background">+</button>
          <button onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.3, t.scale / 1.2) }))} className="w-10 h-10 bg-surface-container border-2 border-border flex items-center justify-center font-black shadow-[4px_4px_0_0_var(--color-border-base)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--color-border-base)] transition-transform text-on-background">−</button>
          <button onClick={() => {
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              setTransform({ x: rect.width / 2, y: rect.height / 2, scale: 1 });
            }
          }} className="w-10 h-10 bg-surface-container border-2 border-border flex items-center justify-center font-black shadow-[4px_4px_0_0_var(--color-border-base)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--color-border-base)] transition-transform text-on-background">⊙</button>
        </div>
      </div>

      {/* 2. Detail Panel (Contextual Right Sidebar) */}
      {selected && (
        <div className="w-96 flex flex-col h-full bg-surface-container shrink-0 z-20 border-l-2 border-border">
          <div className="flex-1 overflow-y-auto bg-background">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full border-2 border-border" style={{ backgroundColor: getTypeStyle(selected.type).dot }} />
                    <span className="text-sm font-black uppercase tracking-wide text-on-background">
                      {selected.type || 'concept'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-on-background leading-none">{selected.label}</h2>
                </div>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg border-2 border-transparent hover:border-border text-on-background flex items-center justify-center transition-colors">
                  <X className="w-5 h-5 font-bold" />
                </button>
              </div>

              {/* Explanation */}
              <div className="mb-8">
                <h3 className="text-sm font-black uppercase tracking-wide text-primary mb-2">Explanation</h3>
                <p className="text-base font-medium text-on-background leading-relaxed bg-surface-container border-2 border-border p-4 shadow-[4px_4px_0_0_var(--color-border-base)]">
                  {selected.explanation || 'No explanation available.'}
                </p>
              </div>

              {/* Key Equation */}
              {selected.key_equation && (
                <div className="mb-8">
                  <h3 className="text-sm font-black uppercase tracking-wide text-primary mb-2">Key Equation</h3>
                  <div className="bg-primary hover:bg-primary text-on-primary border-2 border-border p-4 font-mono font-bold shadow-[4px_4px_0_0_var(--color-border-base)] overflow-x-auto">
                    {selected.key_equation}
                  </div>
                </div>
              )}

              {/* Connections */}
              <div className="mb-8">
                <h3 className="text-sm font-black uppercase tracking-wide text-primary mb-3">Connections</h3>
                <div className="space-y-4">
                  {getConnections(selected.id).map((conn, i) => (
                    <button
                      key={i}
                      onClick={() => conn.other && setSelected(conn.other as SimNode)}
                      className="w-full flex items-center gap-3 p-4 bg-surface-container border-2 border-border shadow-[4px_4px_0_0_var(--color-border-base)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--color-border-base)] transition-transform text-left"
                    >
                      <div className="w-3 h-3 rounded-full border-2 border-border shrink-0" style={{ backgroundColor: getTypeStyle(conn.other?.type).dot }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-on-background truncate">{conn.other?.label}</div>
                        <div className="text-xs font-black text-on-surface-variant uppercase flex items-center gap-1 mt-1">
                          {conn.direction === 'outgoing' ? (
                            <><ArrowRight className="w-3 h-3" />{predicateLabels[conn.predicate] || conn.predicate}</>
                          ) : (
                            <><span className="rotate-180 inline-block"><ArrowRight className="w-3 h-3" /></span>{predicateLabels[conn.predicate] || conn.predicate}</>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                  {getConnections(selected.id).length === 0 && (
                    <p className="font-bold text-on-surface-variant italic bg-background p-4 border-2 border-border text-center">No direct connections</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-surface-container border-t-2 border-border">
            {/* Generate Animation */}
            <button
              onClick={() => setView('manim')}
              className="w-full bg-primary text-on-primary p-4 border-2 border-border shadow-[4px_4px_0px_0px_var(--color-border-base)] text-base font-black flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-border-base)] transition-transform"
            >
              <Zap className="w-5 h-5 fill-on-primary" />
              Generate Animation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
