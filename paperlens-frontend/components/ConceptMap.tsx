import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { ConceptMapData } from "@/app/page";

type ConceptMapProps = { data: ConceptMapData };

export default function ConceptMap({ data }: ConceptMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth || 320;
    const height = 380;

    const colorMap: Record<string, string> = {
      concept: "#1a1714",
      method: "#d4522a",
      entity: "#57524d",
      metric: "#b5afa8",
    };

    const sizeScale = d3.scaleLinear()
      .domain([d3.min(data.nodes, d => d.frequency) || 1, d3.max(data.nodes, d => d.frequency) || 10])
      .range([6, 18]);

    const simulation = d3.forceSimulation(data.nodes as any)
      .force("link", d3.forceLink(data.edges).id((d: any) => d.id).distance(70))
      .force("charge", d3.forceManyBody().strength(-180))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(28));

    const g = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.4, 3]).on("zoom", e => g.attr("transform", e.transform));
    svg.call(zoom as any);

    const link = g.append("g").selectAll("line").data(data.edges).join("line")
      .attr("stroke", "#ddd8d0").attr("stroke-width", d => Math.max(1, Math.sqrt(d.weight))).attr("stroke-opacity", 0.7);

    const node = g.append("g").selectAll("circle").data(data.nodes).join("circle")
      .attr("r", d => sizeScale(d.frequency))
      .attr("fill", d => colorMap[d.type] || "#b5afa8")
      .attr("stroke", "#fff").attr("stroke-width", 2)
      .style("cursor", "pointer")
      .call(d3.drag<SVGCircleElement, any>()
        .on("start", (e) => { if (!e.active) simulation.alphaTarget(0.3).restart(); e.subject.fx = e.subject.x; e.subject.fy = e.subject.y; })
        .on("drag", (e) => { e.subject.fx = e.x; e.subject.fy = e.y; })
        .on("end", (e) => { if (!e.active) simulation.alphaTarget(0); e.subject.fx = null; e.subject.fy = null; }) as any
      );

    node.append("title").text(d => `${d.label}\n${d.type} · freq ${d.frequency}`);

    const label = g.append("g").selectAll("text").data(data.nodes).join("text")
      .text(d => d.label.length > 14 ? d.label.slice(0, 13) + "…" : d.label)
      .attr("font-size", 9).attr("font-family", "'DM Mono', monospace")
      .attr("fill", "#57524d").attr("text-anchor", "middle")
      .attr("dy", d => sizeScale(d.frequency) + 12)
      .style("pointer-events", "none").style("user-select", "none");

    simulation.on("tick", () => {
      link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });

    return () => { simulation.stop(); };
  }, [data]);

  return (
    <>
      <style>{`
        .cm-svg { width:100%; height:380px; background:#fafaf9; display:block; }
        .cm-legend { display:flex; flex-wrap:wrap; gap:10px; padding:10px 14px; border-top:1px solid #e8e4dd; background:#fff; }
        .cm-leg { display:flex; align-items:center; gap:5px; }
        .cm-leg-dot { width:9px; height:9px; border-radius:50%; }
        .cm-leg-lbl { font-family:'DM Mono',monospace; font-size:0.65rem; color:#57524d; text-transform:capitalize; }
      `}</style>
      <div>
        <svg ref={svgRef} className="cm-svg" />
        <div className="cm-legend">
          {[["concept","#1a1714"],["method","#d4522a"],["entity","#57524d"],["metric","#b5afa8"]].map(([label,color]) => (
            <div key={label} className="cm-leg">
              <div className="cm-leg-dot" style={{background:color}} />
              <span className="cm-leg-lbl">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
