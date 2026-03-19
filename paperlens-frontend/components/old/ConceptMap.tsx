import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { ConceptMapData } from "@/app/page";

type ConceptMapProps = {
  data: ConceptMapData;
};

export default function ConceptMap({ data }: ConceptMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = 400;

    // Color scale by node type
    const colorScale = d3.scaleOrdinal<string>()
      .domain(["concept", "method", "entity", "metric"])
      .range(["#0c0a09", "#16a34a", "#2563eb", "#dc2626"]);

    // Size scale by frequency
    const sizeScale = d3.scaleLinear()
      .domain([
        d3.min(data.nodes, (d) => d.frequency) || 1,
        d3.max(data.nodes, (d) => d.frequency) || 10,
      ])
      .range([8, 20]);

    // Create force simulation
    const simulation = d3
      .forceSimulation(data.nodes as any)
      .force(
        "link",
        d3
          .forceLink(data.edges)
          .id((d: any) => d.id)
          .distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Create container group
    const g = svg
      .append("g")
      .attr("class", "graph-container");

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    // Draw edges
    const link = g
      .append("g")
      .selectAll("line")
      .data(data.edges)
      .join("line")
      .attr("stroke", "#d6d3d1")
      .attr("stroke-width", (d) => Math.sqrt(d.weight))
      .attr("stroke-opacity", 0.6);

    // Draw nodes
    const node = g
      .append("g")
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", (d) => sizeScale(d.frequency))
      .attr("fill", (d) => colorScale(d.type))
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGCircleElement, any>()
          .on("start", dragStarted)
          .on("drag", dragged)
          .on("end", dragEnded) as any
      );

    // Add labels
    const label = g
      .append("g")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
      .text((d) => d.label)
      .attr("font-size", 10)
      .attr("font-family", "Inter, sans-serif")
      .attr("fill", "#1c1917")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => sizeScale(d.frequency) + 14)
      .style("pointer-events", "none")
      .style("user-select", "none");

    // Add tooltips
    node.append("title").text((d) => `${d.label}\nType: ${d.type}\nFrequency: ${d.frequency}`);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);

      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });

    // Drag functions
    function dragStarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragEnded(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <>
      <style>{`
        .concept-map-svg {
          width: 100%;
          height: 400px;
          background: white;
        }

        .concept-map-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          padding: 12px;
          background: #fafaf9;
          border-top: 1px solid #e7e5e4;
          font-size: 0.75rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 1px solid white;
        }

        .legend-label {
          color: #57534e;
          text-transform: capitalize;
        }
      `}</style>

      <div>
        <svg ref={svgRef} className="concept-map-svg" />
        
        <div className="concept-map-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: "#0c0a09" }} />
            <span className="legend-label">Concept</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: "#16a34a" }} />
            <span className="legend-label">Method</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: "#2563eb" }} />
            <span className="legend-label">Entity</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: "#dc2626" }} />
            <span className="legend-label">Metric</span>
          </div>
        </div>
      </div>
    </>
  );
}
