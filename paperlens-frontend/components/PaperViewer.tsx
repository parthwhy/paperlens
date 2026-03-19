import { useState } from "react";
import { PaperData } from "@/app/page";

type PaperViewerProps = {
  paperData: PaperData | null;
  onExplainText: (text: string, position: { x: number; y: number }) => void;
};

export default function PaperViewer({ paperData, onExplainText }: PaperViewerProps) {
  const [selectedText, setSelectedText] = useState("");
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0 });
  const [showBtn, setShowBtn] = useState(false);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() || "";
    if (text.length > 10 && sel?.rangeCount) {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setSelectedText(text);
      setBtnPos({ x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 10 });
      setShowBtn(true);
    } else {
      setShowBtn(false);
    }
  };

  const handleExplain = () => {
    const sel = window.getSelection();
    if (sel?.rangeCount) {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      onExplainText(selectedText, { x: rect.left + rect.width / 2, y: rect.bottom + window.scrollY + 8 });
    }
    setShowBtn(false);
  };

  if (!paperData) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh", color:"#b5afa8", fontFamily:"'DM Sans',sans-serif", fontSize:"0.9rem" }}>
        No paper loaded
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&family=DM+Mono:wght@400;500&display=swap');

        .pv { padding:48px 56px; max-width:760px; margin:0 auto; font-family:'DM Sans',sans-serif; }

        .pv-hd { margin-bottom:44px; padding-bottom:32px; border-bottom:2px solid #e8e4dd; }
        .pv-title { font-family:'DM Serif Display',serif; font-size:2rem; font-weight:400; line-height:1.2; color:#1a1714; margin-bottom:16px; letter-spacing:-0.02em; }
        .pv-authors { font-size:0.9rem; color:#57524d; margin-bottom:14px; line-height:1.6; font-weight:300; }
        .pv-meta { display:flex; gap:10px; flex-wrap:wrap; }
        .pv-badge { padding:4px 12px; background:#f7f4ef; border:1px solid #ddd8d0; border-radius:4px; font-family:'DM Mono',monospace; font-size:0.72rem; color:#57524d; }

        .pv-section { margin-bottom:36px; }
        .pv-sec-label { font-family:'DM Mono',monospace; font-size:0.65rem; font-weight:500; text-transform:uppercase; letter-spacing:0.14em; color:#b5afa8; margin-bottom:12px; }
        .pv-sec-body { font-size:0.95rem; line-height:1.82; color:#2d2925; user-select:text; cursor:text; }
        .pv-sec-body::selection { background:#fef3c7; color:#1a1714; }
        .pv-sec-body *::selection { background:#fef3c7; color:#1a1714; }

        .pv-how { background:#fef6f3; border:1px solid #f5ddd5; border-radius:8px; padding:16px 20px; font-size:0.84rem; line-height:1.65; color:#57524d; font-weight:300; }
        .pv-how strong { color:#d4522a; font-weight:500; }

        .pv-explain-btn { position:absolute; z-index:100; display:flex; align-items:center; gap:5px; padding:7px 14px; background:#1a1714; color:#fff; border:none; border-radius:6px; font-family:'DM Sans',sans-serif; font-size:0.8rem; font-weight:500; cursor:pointer; box-shadow:0 4px 16px rgba(0,0,0,0.18); transform:translate(-50%,-100%); transition:background 0.2s,transform 0.15s; animation:pv-btn-in 0.18s ease; }
        .pv-explain-btn:hover { background:#d4522a; transform:translate(-50%,-100%) translateY(-2px); }
        @keyframes pv-btn-in { from{opacity:0;transform:translate(-50%,-100%) scale(0.9)} to{opacity:1;transform:translate(-50%,-100%) scale(1)} }
        .pv-explain-ico { font-size:0.9rem; }

        @media(max-width:768px){.pv{padding:32px 24px}.pv-title{font-size:1.5rem}}
      `}</style>

      <div className="pv">
        <div className="pv-hd">
          <h1 className="pv-title">{paperData.title}</h1>
          <div className="pv-authors">
            {paperData.authors.slice(0, 5).join(", ")}
            {paperData.authors.length > 5 && ` and ${paperData.authors.length - 5} more`}
          </div>
          <div className="pv-meta">
            <span className="pv-badge">{paperData.paper_id}</span>
            {paperData.total_chunks && <span className="pv-badge">{paperData.total_chunks} chunks</span>}
          </div>
        </div>

        {paperData.abstract && (
          <div className="pv-section">
            <div className="pv-sec-label">Abstract</div>
            <div className="pv-sec-body" onMouseUp={handleMouseUp}>
              <p>{paperData.abstract}</p>
            </div>
          </div>
        )}

        <div className="pv-how">
          <strong>✦ Select any text</strong> in the abstract above to get an instant plain-English explanation. Full section-by-section paper rendering coming soon.
        </div>
      </div>

      {showBtn && (
        <button className="pv-explain-btn" style={{ left: btnPos.x, top: btnPos.y }} onClick={handleExplain}>
          <span className="pv-explain-ico">✦</span>
          Explain
        </button>
      )}
    </>
  );
}
