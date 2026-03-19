import { Citation } from "@/app/page";

type CitationChipProps = {
  number: number;
  citation: Citation;
  onClick: () => void;
};

export default function CitationChip({ number, citation, onClick }: CitationChipProps) {
  return (
    <>
      <style>{`
        .cc { display:inline-flex; align-items:center; gap:6px; padding:5px 10px; background:#fff; border:1px solid #e8e4dd; border-radius:6px; font-size:0.74rem; color:#57524d; cursor:pointer; transition:all 0.18s ease; user-select:none; font-family:'DM Sans',sans-serif; }
        .cc:hover { border-color:#1a1714; background:#f7f4ef; transform:translateY(-1px); box-shadow:0 2px 8px rgba(0,0,0,0.08); }
        .cc-num { display:flex; align-items:center; justify-content:center; width:18px; height:18px; background:#1a1714; color:#fff; border-radius:4px; font-family:'DM Mono',monospace; font-size:0.68rem; font-weight:500; flex-shrink:0; }
        .cc-info { display:flex; flex-direction:column; gap:1px; min-width:0; }
        .cc-section { font-weight:500; color:#1a1714; max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.74rem; }
        .cc-page { font-family:'DM Mono',monospace; font-size:0.66rem; color:#b5afa8; }
      `}</style>
      <div className="cc" onClick={onClick} title={citation.text}>
        <div className="cc-num">{number}</div>
        <div className="cc-info">
          <div className="cc-section">{citation.section}</div>
          <div className="cc-page">p.{citation.page}</div>
        </div>
      </div>
    </>
  );
}
