import React from "react";
import { Sparkles, MessageSquare } from "lucide-react";

interface Props {
  x: number;
  y: number;
  sentence: string;
  explanation: string | null;
  analogy: string | null;
  relatedTerms: string[];
  loading: boolean;
  showButton: boolean;
  onExplain: () => void;
  onExplainMore: () => void;
  onDismiss: () => void;
}

export function SelectionTooltip({
  x,
  y,
  sentence,
  explanation,
  analogy,
  relatedTerms,
  loading,
  showButton,
  onExplain,
  onExplainMore,
  onDismiss,
}: Props) {
  return (
    <div
      id="paper-tooltip"
      style={{
        position: "absolute",
        left: Math.min(x, window.innerWidth - 320),
        top: y - 12,
        transform: "translateY(-100%)",
        zIndex: 50,
        width: showButton ? 200 : 320,
        background: "white",
        border: "1px solid rgba(0,0,0,0.1)",
        borderRadius: 10,
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        padding: showButton ? "8px 10px" : "12px 14px",
        fontSize: 13,
        color: "#0F172A",
      }}
    >
      {/* Show "Explain with AI" button */}
      {showButton && !loading && (
        <button
          onClick={onExplain}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "8px 12px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Sparkles size={14} />
          Explain with AI
        </button>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748B", padding: "8px 0" }}>
          <div
            style={{
              width: 16,
              height: 16,
              border: "2px solid #E2E8F0",
              borderTop: "2px solid #667eea",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ fontSize: 12 }}>Explaining…</span>
        </div>
      )}

      {/* Show explanation */}
      {!showButton && !loading && explanation && (
        <>
          {/* Selected sentence preview */}
          <p style={{ margin: "0 0 8px", color: "#64748B", fontStyle: "italic", lineHeight: 1.5, fontSize: 12 }}>
            "{sentence.length > 80 ? sentence.slice(0, 80) + "…" : sentence}"
          </p>

          {/* Divider */}
          <hr style={{ border: "none", borderTop: "1px solid #E2E8F0", margin: "8px 0" }} />

          {/* Explanation */}
          <p style={{ margin: "0 0 8px", lineHeight: 1.6 }}>{explanation}</p>

          {/* Analogy */}
          {analogy && (
            <div
              style={{
                margin: "8px 0",
                padding: "8px 10px",
                background: "#F8FAFC",
                borderLeft: "3px solid #667eea",
                borderRadius: 4,
              }}
            >
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "#475569" }}>
                <strong style={{ color: "#667eea" }}>💡 Think of it as:</strong> {analogy}
              </p>
            </div>
          )}

          {/* Related Terms */}
          {relatedTerms && relatedTerms.length > 0 && (
            <div style={{ margin: "8px 0" }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#64748B" }}>Related terms:</p>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {relatedTerms.map((term, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      background: "#EEF2FF",
                      color: "#667eea",
                      borderRadius: 4,
                      fontWeight: 500,
                    }}
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Explain More button */}
          <button
            onClick={onExplainMore}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "6px 10px",
              marginTop: 8,
              background: "white",
              color: "#667eea",
              border: "1px solid #667eea",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#667eea";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.color = "#667eea";
            }}
          >
            <MessageSquare size={12} />
            Explain More in Chat
          </button>
        </>
      )}

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        style={{
          position: "absolute",
          top: 8,
          right: 10,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#94A3B8",
          fontSize: 16,
          lineHeight: 1,
          padding: 2,
        }}
        aria-label="Close"
      >
        ×
      </button>

      {/* Add keyframe animation for spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
