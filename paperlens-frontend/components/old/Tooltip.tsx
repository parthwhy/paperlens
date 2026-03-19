import { useState, useEffect } from "react";

type TooltipProps = {
  explanation: string;
  analogy: string;
  position: { x: number; y: number };
  onClose: () => void;
};

export default function Tooltip({
  explanation,
  analogy,
  position,
  onClose,
}: TooltipProps) {
  const [displayText, setDisplayText] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(true);

  // Hyper-text decryption effect
  useEffect(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const targetText = explanation;
    let iteration = 0;
    const speed = 30; // milliseconds per frame

    const interval = setInterval(() => {
      setDisplayText(
        targetText
          .split("")
          .map((char, index) => {
            if (index < iteration) {
              return targetText[index];
            }
            if (char === " ") return " ";
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      iteration += 1 / 3;

      if (iteration >= targetText.length) {
        clearInterval(interval);
        setDisplayText(targetText);
        setIsDecrypting(false);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [explanation]);

  return (
    <>
      <style>{`
        .tooltip-overlay {
          position: fixed;
          inset: 0;
          z-index: 999;
          background: rgba(0, 0, 0, 0.1);
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .tooltip-card {
          position: absolute;
          z-index: 1000;
          background: white;
          border: 2px solid #0c0a09;
          border-radius: 8px;
          padding: 20px;
          max-width: 400px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          transform: translate(-50%, 0);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        .tooltip-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .tooltip-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #78716c;
        }

        .tooltip-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #a8a29e;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          transition: color 0.2s ease;
        }

        .tooltip-close:hover {
          color: #1c1917;
        }

        .tooltip-explanation {
          font-size: 0.95rem;
          line-height: 1.7;
          color: #1c1917;
          margin-bottom: 12px;
          font-family: ${isDecrypting ? "'Courier New', monospace" : "'Inter', sans-serif"};
          transition: font-family 0.3s ease;
        }

        .tooltip-analogy {
          padding: 12px;
          background: #fef3c7;
          border-left: 3px solid #fbbf24;
          border-radius: 4px;
          font-size: 0.85rem;
          line-height: 1.6;
          color: #78350f;
          font-style: italic;
        }

        .analogy-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #92400e;
          margin-bottom: 6px;
          font-style: normal;
        }
      `}</style>

      {/* Overlay to close on click outside */}
      <div className="tooltip-overlay" onClick={onClose} />

      {/* Tooltip Card */}
      <div
        className="tooltip-card"
        style={{
          left: position.x,
          top: position.y,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tooltip-header">
          <div className="tooltip-label">Explanation</div>
          <button className="tooltip-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="tooltip-explanation">{displayText}</div>

        {analogy && (
          <div className="tooltip-analogy">
            <div className="analogy-label">Analogy</div>
            {analogy}
          </div>
        )}
      </div>
    </>
  );
}
