import { PaperData, Message, Citation, ConceptMapData } from "@/app/page";
import ChatPanel from "./ChatPanel";
import PaperViewer from "./PaperViewer";
import ConceptMapPanel from "./ConceptMapPanel";
import Tooltip from "./Tooltip";

type PaperReaderProps = {
  paperData: PaperData | null;
  messages: Message[];
  chatInput: string;
  isChatLoading: boolean;
  citations: Citation[];
  conceptMapData: ConceptMapData | null;
  isConceptMapLoading: boolean;
  tooltipData: { explanation: string; analogy: string } | null;
  tooltipPosition: { x: number; y: number };
  error: string | null;
  onSendMessage: (message: string) => void;
  onChatInputChange: (value: string) => void;
  onExplainText: (text: string, position: { x: number; y: number }) => void;
  onCitationClick: (chunkId: string) => void;
  onCloseTooltip: () => void;
};

export default function PaperReader({
  paperData,
  messages,
  chatInput,
  isChatLoading,
  citations,
  conceptMapData,
  isConceptMapLoading,
  tooltipData,
  tooltipPosition,
  error,
  onSendMessage,
  onChatInputChange,
  onExplainText,
  onCitationClick,
  onCloseTooltip,
}: PaperReaderProps) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          background: #fafaf9;
          color: #1c1917;
          font-family: 'Inter', -apple-system, sans-serif;
          overflow-x: hidden;
        }

        .reader-container {
          display: grid;
          grid-template-columns: 320px 1fr 360px;
          height: 100vh;
          gap: 0;
        }

        .reader-column {
          height: 100vh;
          overflow-y: auto;
          border-right: 1px solid #e7e5e4;
        }

        .reader-column:last-child {
          border-right: none;
        }

        /* Left Column - Chat */
        .left-column {
          background: white;
        }

        /* Center Column - Paper */
        .center-column {
          background: #fafaf9;
        }

        /* Right Column - Concept Map */
        .right-column {
          background: white;
        }

        /* Error Banner */
        .error-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #fee2e2;
          border-bottom: 1px solid #fecaca;
          color: #991b1b;
          padding: 12px 24px;
          text-align: center;
          font-size: 0.9rem;
          z-index: 1000;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }

        /* Highlight animation for cited chunks */
        .highlight-chunk {
          background: #fef3c7 !important;
          transition: background 0.3s ease;
        }

        /* Scrollbar styling */
        .reader-column::-webkit-scrollbar {
          width: 8px;
        }

        .reader-column::-webkit-scrollbar-track {
          background: transparent;
        }

        .reader-column::-webkit-scrollbar-thumb {
          background: #d6d3d1;
          border-radius: 4px;
        }

        .reader-column::-webkit-scrollbar-thumb:hover {
          background: #a8a29e;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .reader-container {
            grid-template-columns: 280px 1fr 320px;
          }
        }

        @media (max-width: 968px) {
          .reader-container {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr auto;
            height: auto;
          }

          .reader-column {
            height: auto;
            border-right: none;
            border-bottom: 1px solid #e7e5e4;
          }

          .left-column {
            order: 3;
            min-height: 400px;
          }

          .center-column {
            order: 1;
            min-height: 60vh;
          }

          .right-column {
            order: 2;
            min-height: 300px;
          }
        }
      `}</style>

      <div className="reader-container">
        {/* Error Banner */}
        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}

        {/* Left Column - Chat Panel */}
        <div className="reader-column left-column">
          <ChatPanel
            messages={messages}
            chatInput={chatInput}
            isChatLoading={isChatLoading}
            citations={citations}
            onSendMessage={onSendMessage}
            onChatInputChange={onChatInputChange}
            onCitationClick={onCitationClick}
          />
        </div>

        {/* Center Column - Paper Viewer */}
        <div className="reader-column center-column">
          <PaperViewer
            paperData={paperData}
            onExplainText={onExplainText}
          />
        </div>

        {/* Right Column - Concept Map */}
        <div className="reader-column right-column">
          <ConceptMapPanel
            paperData={paperData}
            conceptMapData={conceptMapData}
            isConceptMapLoading={isConceptMapLoading}
          />
        </div>

        {/* Tooltip Overlay */}
        {tooltipData && (
          <Tooltip
            explanation={tooltipData.explanation}
            analogy={tooltipData.analogy}
            position={tooltipPosition}
            onClose={onCloseTooltip}
          />
        )}
      </div>
    </>
  );
}
