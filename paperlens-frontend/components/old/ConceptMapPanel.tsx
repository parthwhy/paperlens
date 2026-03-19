import { PaperData, ConceptMapData } from "@/app/page";
import ConceptMap from "./ConceptMap";

type ConceptMapPanelProps = {
  paperData: PaperData | null;
  conceptMapData: ConceptMapData | null;
  isConceptMapLoading: boolean;
};

export default function ConceptMapPanel({
  paperData,
  conceptMapData,
  isConceptMapLoading,
}: ConceptMapPanelProps) {
  return (
    <>
      <style>{`
        .concept-panel {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .panel-section {
          background: #fafaf9;
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          padding: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #78716c;
        }

        .info-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }

        .info-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #a8a29e;
        }

        .info-value {
          font-size: 0.9rem;
          line-height: 1.6;
          color: #1c1917;
        }

        .concept-map-container {
          min-height: 400px;
          background: white;
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          overflow: hidden;
        }

        .map-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: #a8a29e;
          font-size: 0.9rem;
        }

        .map-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          padding: 40px 20px;
          text-align: center;
          color: #a8a29e;
          font-size: 0.85rem;
          line-height: 1.6;
        }

        .map-icon {
          font-size: 3rem;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .coming-soon-section {
          background: #f5f5f4;
          border: 1px dashed #d6d3d1;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
        }

        .coming-soon-icon {
          font-size: 2.5rem;
          margin-bottom: 12px;
          opacity: 0.4;
        }

        .coming-soon-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #57534e;
          margin-bottom: 8px;
        }

        .coming-soon-text {
          font-size: 0.8rem;
          color: #78716c;
          line-height: 1.5;
        }

        .coming-soon-badge {
          display: inline-block;
          margin-top: 12px;
          padding: 4px 12px;
          background: #fef3c7;
          color: #92400e;
          font-size: 0.7rem;
          font-weight: 600;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>

      <div className="concept-panel">
        {/* Paper Info Section */}
        {paperData && (
          <div className="panel-section">
            <div className="section-title">Paper Info</div>
            
            <div className="info-row">
              <div className="info-label">Title</div>
              <div className="info-value">{paperData.title}</div>
            </div>

            <div className="info-row">
              <div className="info-label">Authors</div>
              <div className="info-value">
                {paperData.authors.slice(0, 3).join(", ")}
                {paperData.authors.length > 3 &&
                  ` +${paperData.authors.length - 3} more`}
              </div>
            </div>

            {paperData.total_chunks && (
              <div className="info-row">
                <div className="info-label">Chunks</div>
                <div className="info-value">{paperData.total_chunks}</div>
              </div>
            )}
          </div>
        )}

        {/* Concept Map Section */}
        <div className="panel-section">
          <div className="section-header">
            <div className="section-title">Concept Map</div>
          </div>

          <div className="concept-map-container">
            {isConceptMapLoading ? (
              <div className="map-loading">Loading concept map...</div>
            ) : conceptMapData ? (
              <ConceptMap data={conceptMapData} />
            ) : (
              <div className="map-empty">
                <div className="map-icon">🗺️</div>
                <div>
                  Concept map will appear here once generated.
                  <br />
                  It shows how key ideas connect across the paper.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Animated Explanation Section (Coming Soon) */}
        <div className="coming-soon-section">
          <div className="coming-soon-icon">🎬</div>
          <div className="coming-soon-title">Animated Explanation</div>
          <div className="coming-soon-text">
            Manim-powered visual animations of key concepts
          </div>
          <div className="coming-soon-badge">Coming Soon</div>
        </div>
      </div>
    </>
  );
}
