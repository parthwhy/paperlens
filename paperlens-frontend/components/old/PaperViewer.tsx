import { useState } from "react";
import { PaperData } from "@/app/page";

type PaperViewerProps = {
  paperData: PaperData | null;
  onExplainText: (text: string, position: { x: number; y: number }) => void;
};

export default function PaperViewer({
  paperData,
  onExplainText,
}: PaperViewerProps) {
  const [selectedText, setSelectedText] = useState("");
  const [showExplainButton, setShowExplainButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || "";

    if (text.length > 10) {
      const range = selection!.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectedText(text);
      setButtonPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY - 10,
      });
      setShowExplainButton(true);
    } else {
      setShowExplainButton(false);
    }
  };

  const handleExplain = () => {
    if (selectedText) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        onExplainText(selectedText, {
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY + rect.height + 10,
        });
      }
      setShowExplainButton(false);
    }
  };

  if (!paperData) {
    return (
      <div className="paper-viewer">
        <div className="paper-empty">
          <p>No paper loaded</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .paper-viewer {
          padding: 48px 64px;
          max-width: 800px;
          margin: 0 auto;
        }

        .paper-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          color: #a8a29e;
          font-size: 1rem;
        }

        .paper-header {
          margin-bottom: 48px;
          padding-bottom: 32px;
          border-bottom: 2px solid #e7e5e4;
        }

        .paper-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1.2;
          color: #0c0a09;
          margin-bottom: 20px;
        }

        .paper-authors {
          font-size: 1rem;
          color: #57534e;
          margin-bottom: 12px;
          line-height: 1.6;
        }

        .paper-meta {
          display: flex;
          gap: 16px;
          font-size: 0.85rem;
          color: #78716c;
        }

        .meta-badge {
          padding: 4px 12px;
          background: #f5f5f4;
          border: 1px solid #e7e5e4;
          border-radius: 4px;
          font-weight: 500;
        }

        .paper-section {
          margin-bottom: 40px;
        }

        .section-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #78716c;
          margin-bottom: 12px;
        }

        .section-content {
          font-size: 1rem;
          line-height: 1.8;
          color: #292524;
          user-select: text;
          cursor: text;
        }

        .section-content::selection {
          background: #fef3c7;
          color: #1c1917;
        }

        .section-content p {
          margin-bottom: 16px;
        }

        .explain-button {
          position: absolute;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: #0c0a09;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          transform: translate(-50%, -100%);
          transition: all 0.2s ease;
          animation: fadeIn 0.2s ease;
        }

        .explain-button:hover {
          background: #292524;
          transform: translate(-50%, -100%) translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
        }

        .explain-icon {
          font-size: 1rem;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -100%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%) scale(1);
          }
        }

        @media (max-width: 768px) {
          .paper-viewer {
            padding: 32px 24px;
          }

          .paper-title {
            font-size: 1.8rem;
          }
        }
      `}</style>

      <div className="paper-viewer">
        {/* Paper Header */}
        <div className="paper-header">
          <h1 className="paper-title">{paperData.title}</h1>
          
          <div className="paper-authors">
            {paperData.authors.slice(0, 5).join(", ")}
            {paperData.authors.length > 5 &&
              ` and ${paperData.authors.length - 5} more`}
          </div>

          <div className="paper-meta">
            <span className="meta-badge">
              Paper ID: {paperData.paper_id}
            </span>
            {paperData.total_chunks && (
              <span className="meta-badge">
                {paperData.total_chunks} chunks
              </span>
            )}
          </div>
        </div>

        {/* Abstract Section */}
        {paperData.abstract && (
          <div className="paper-section">
            <div className="section-label">Abstract</div>
            <div
              className="section-content"
              onMouseUp={handleTextSelection}
            >
              <p>{paperData.abstract}</p>
            </div>
          </div>
        )}

        {/* Instruction */}
        <div className="paper-section">
          <div className="section-label">How to Use</div>
          <div className="section-content">
            <p>
              Select any text in the abstract above to get an instant
              explanation. The full paper content will be available once we
              implement section-by-section rendering.
            </p>
          </div>
        </div>

        {/* Explain Button */}
        {showExplainButton && (
          <button
            className="explain-button"
            style={{
              left: buttonPosition.x,
              top: buttonPosition.y,
            }}
            onClick={handleExplain}
          >
            <span className="explain-icon">💡</span>
            <span>Explain</span>
          </button>
        )}
      </div>
    </>
  );
}
