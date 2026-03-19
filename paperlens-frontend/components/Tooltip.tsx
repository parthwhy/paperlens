import { useState, useEffect } from "react";

type TooltipProps = {
  explanation: string;
  analogy: string;
  position: { x: number; y: number };
  onClose: () => void;
};

export default function Tooltip({ explanation, analogy, position, onClose }: TooltipProps) {
  const [displayText, setDisplayText] = useState("");
  const [decrypting, setDecrypting] = useState(true);

  useEffect(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const target = explanation;
    let iter = 0;
    const interval = setInterval(() => {
      setDisplayText(target.split("").map((ch, i) => {
        if (i < iter) return target[i];
        if (ch === " ") return " ";
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(""));
      iter += 1 / 3;
      if (iter >= target.length) { clearInterval(interval); setDisplayText(target); setDecrypting(false); }
    }, 28);
    return () => clearInterval(interval);
  }, [explanation]);

  // Keep tooltip in viewport
  const left = Math.min(position.x, window.innerWidth - 420);
  const top = position.y + 8;

  return (
    <>
      <style>{`
        .tt-overlay { position:fixed; inset:0; z-index:998; background:rgba(26,23,20,0.06); animation:tt-fade 0.2s ease; }
        @keyframes tt-fade { from{opacity:0} to{opacity:1} }
        .tt-card { position:fixed; z-index:999; background:#fff; border:1.5px solid #1a1714; border-radius:10px; padding:20px; max-width:400px; min-width:280px; box-shadow:0 12px 48px rgba(0,0,0,0.14); animation:tt-up 0.25s ease; }
        @keyframes tt-up { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .tt-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
        .tt-label { font-family:'DM Mono',monospace; font-size:0.65rem; letter-spacing:0.14em; text-transform:uppercase; color:#b5afa8; }
        .tt-close { background:none; border:none; font-size:1.3rem; color:#b5afa8; cursor:pointer; padding:0; line-height:1; transition:color 0.2s; margin-left:12px; flex-shrink:0; }
        .tt-close:hover { color:#1a1714; }
        .tt-text { font-size:0.92rem; line-height:1.72; color:#1a1714; word-break:break-word; transition:font-family 0.3s; }
        .tt-analogy { margin-top:14px; padding:12px 14px; background:#fef6f3; border-left:2px solid #d4522a; border-radius:0 6px 6px 0; font-size:0.84rem; line-height:1.6; color:#57524d; font-style:italic; }
        .tt-analogy-label { font-family:'DM Mono',monospace; font-size:0.62rem; letter-spacing:0.1em; text-transform:uppercase; color:#d4522a; margin-bottom:5px; font-style:normal; font-weight:500; }
      `}</style>

      <div className="tt-overlay" onClick={onClose} />
      <div className="tt-card" style={{ left, top }} onClick={(e) => e.stopPropagation()}>
        <div className="tt-head">
          <div className="tt-label">Explanation</div>
          <button className="tt-close" onClick={onClose}>×</button>
        </div>
        <div className="tt-text" style={{ fontFamily: decrypting ? "'DM Mono', monospace" : "'DM Sans', sans-serif" }}>
          {displayText}
        </div>
        {!decrypting && analogy && (
          <div className="tt-analogy">
            <div className="tt-analogy-label">Analogy</div>
            {analogy}
          </div>
        )}
      </div>
    </>
  );
}
