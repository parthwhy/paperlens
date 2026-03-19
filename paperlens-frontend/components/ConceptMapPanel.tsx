import { PaperData, ConceptMapData } from "@/app/page";
import ConceptMap from "./ConceptMap";

type ConceptMapPanelProps = {
  paperData: PaperData | null;
  conceptMapData: ConceptMapData | null;
  isConceptMapLoading: boolean;
};

export default function ConceptMapPanel({ paperData, conceptMapData, isConceptMapLoading }: ConceptMapPanelProps) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&family=DM+Mono:wght@400;500&display=swap');

        .cmp { padding:20px; display:flex; flex-direction:column; gap:16px; font-family:'DM Sans',sans-serif; }

        .cmp-card { background:#fff; border:1px solid #e8e4dd; border-radius:10px; overflow:hidden; }
        .cmp-card-head { padding:14px 16px; border-bottom:1px solid #f0ece6; }
        .cmp-card-title { font-family:'DM Mono',monospace; font-size:0.63rem; letter-spacing:0.14em; text-transform:uppercase; color:#b5afa8; }
        .cmp-card-body { padding:16px; }

        .cmp-info-row { margin-bottom:12px; }
        .cmp-info-label { font-family:'DM Mono',monospace; font-size:0.6rem; letter-spacing:0.1em; text-transform:uppercase; color:#b5afa8; margin-bottom:4px; }
        .cmp-info-val { font-size:0.84rem; line-height:1.55; color:#1a1714; }
        .cmp-info-val.small { font-size:0.78rem; color:#57524d; font-weight:300; }

        .cmp-map-wrap { min-height:380px; background:#fafaf9; border-radius:0 0 10px 10px; overflow:hidden; }
        .cmp-map-loading,.cmp-map-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:380px; padding:32px 20px; text-align:center; gap:10px; }
        .cmp-map-loading-spin { width:20px; height:20px; border:2px solid #e8e4dd; border-top-color:#d4522a; border-radius:50%; animation:cmp-spin 0.8s linear infinite; }
        @keyframes cmp-spin { to{transform:rotate(360deg)} }
        .cmp-map-loading-txt,.cmp-map-empty-txt { font-family:'DM Mono',monospace; font-size:0.72rem; color:#b5afa8; }

        .cmp-soon { background:#fafaf9; border:1px dashed #ddd8d0; border-radius:10px; padding:24px 20px; text-align:center; }
        .cmp-soon-ico { width:40px; height:40px; background:#f0ece6; border-radius:8px; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; }
        .cmp-soon-ico svg { width:18px; height:18px; stroke:#b5afa8; fill:none; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; }
        .cmp-soon-title { font-family:'DM Serif Display',serif; font-size:0.98rem; color:#57524d; margin-bottom:6px; }
        .cmp-soon-desc { font-size:0.78rem; color:#b5afa8; line-height:1.55; font-weight:300; }
        .cmp-soon-badge { display:inline-block; margin-top:12px; padding:4px 10px; background:#f0ece6; border-radius:4px; font-family:'DM Mono',monospace; font-size:0.6rem; letter-spacing:0.1em; text-transform:uppercase; color:#b5afa8; }
      `}</style>

      <div className="cmp">
        {paperData && (
          <div className="cmp-card">
            <div className="cmp-card-head">
              <div className="cmp-card-title">Paper Info</div>
            </div>
            <div className="cmp-card-body">
              <div className="cmp-info-row">
                <div className="cmp-info-label">Title</div>
                <div className="cmp-info-val">{paperData.title}</div>
              </div>
              <div className="cmp-info-row">
                <div className="cmp-info-label">Authors</div>
                <div className="cmp-info-val small">
                  {paperData.authors.slice(0, 3).join(", ")}
                  {paperData.authors.length > 3 && ` +${paperData.authors.length - 3} more`}
                </div>
              </div>
              {paperData.total_chunks && (
                <div className="cmp-info-row" style={{marginBottom:0}}>
                  <div className="cmp-info-label">Chunks indexed</div>
                  <div className="cmp-info-val small">{paperData.total_chunks}</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="cmp-card">
          <div className="cmp-card-head">
            <div className="cmp-card-title">Concept Map</div>
          </div>
          <div className="cmp-map-wrap">
            {isConceptMapLoading ? (
              <div className="cmp-map-loading">
                <div className="cmp-map-loading-spin" />
                <span className="cmp-map-loading-txt">Building concept map...</span>
              </div>
            ) : conceptMapData ? (
              <ConceptMap data={conceptMapData} />
            ) : (
              <div className="cmp-map-empty">
                <span className="cmp-map-empty-txt">Concept map will appear<br />once paper is loaded</span>
              </div>
            )}
          </div>
        </div>

        <div className="cmp-soon">
          <div className="cmp-soon-ico">
            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <div className="cmp-soon-title">Animated Explanation</div>
          <div className="cmp-soon-desc">Manim-powered visual animations of key concepts, step by step.</div>
          <div className="cmp-soon-badge">Coming Soon</div>
        </div>
      </div>
    </>
  );
}
