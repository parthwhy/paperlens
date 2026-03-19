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
  paperData, messages, chatInput, isChatLoading, citations,
  conceptMapData, isConceptMapLoading, tooltipData, tooltipPosition,
  error, onSendMessage, onChatInputChange, onExplainText, onCitationClick, onCloseTooltip,
}: PaperReaderProps) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#f7f4ef; color:#1a1714; font-family:'DM Sans',sans-serif; overflow-x:hidden; }

        .pr { display:grid; grid-template-columns:320px 1fr 340px; height:100vh; gap:0; }
        .pr-col { height:100vh; overflow-y:auto; border-right:1px solid #e8e4dd; }
        .pr-col:last-child { border-right:none; }
        .pr-left { background:#fff; }
        .pr-mid { background:#f7f4ef; }
        .pr-right { background:#fff; }

        .pr-col::-webkit-scrollbar { width:5px; }
        .pr-col::-webkit-scrollbar-track { background:transparent; }
        .pr-col::-webkit-scrollbar-thumb { background:#ddd8d0; border-radius:4px; }
        .pr-col::-webkit-scrollbar-thumb:hover { background:#b5afa8; }

        .pr-err { position:fixed; top:0; left:0; right:0; background:#fff2f2; border-bottom:1px solid #fecaca; color:#dc2626; padding:11px 24px; text-align:center; font-size:0.875rem; z-index:200; animation:pr-slide-down 0.3s ease; font-family:'DM Sans',sans-serif; }
        @keyframes pr-slide-down { from{transform:translateY(-100%)} to{transform:translateY(0)} }

        .highlight-chunk { background:#fef9c3 !important; transition:background 0.3s ease; }

        @media(max-width:1200px){.pr{grid-template-columns:280px 1fr 300px}}
        @media(max-width:960px){
          .pr{grid-template-columns:1fr;grid-template-rows:auto 1fr auto;height:auto}
          .pr-col{height:auto;border-right:none;border-bottom:1px solid #e8e4dd}
          .pr-left{order:3;min-height:400px}
          .pr-mid{order:1;min-height:60vh}
          .pr-right{order:2;min-height:300px}
        }
      `}</style>

      <div className="pr">
        {error && <div className="pr-err">⚠ {error}</div>}

        <div className="pr-col pr-left">
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

        <div className="pr-col pr-mid">
          <PaperViewer paperData={paperData} onExplainText={onExplainText} />
        </div>

        <div className="pr-col pr-right">
          <ConceptMapPanel
            paperData={paperData}
            conceptMapData={conceptMapData}
            isConceptMapLoading={isConceptMapLoading}
          />
        </div>

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
