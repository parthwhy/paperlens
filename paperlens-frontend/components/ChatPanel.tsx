"use client";

import { useRef, useEffect } from "react";
import { Message, Citation } from "@/app/page";
import CitationChip from "./CitationChip";

type ChatPanelProps = {
  messages: Message[];
  chatInput: string;
  isChatLoading: boolean;
  citations: Citation[];
  onSendMessage: (message: string) => void;
  onChatInputChange: (value: string) => void;
  onCitationClick: (chunkId: string) => void;
};

export default function ChatPanel({ messages, chatInput, isChatLoading, citations, onSendMessage, onChatInputChange, onCitationClick }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = () => { if (chatInput.trim() && !isChatLoading) onSendMessage(chatInput); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&family=DM+Mono:wght@400;500&display=swap');

        .cp { display:flex; flex-direction:column; height:100%; background:#fafaf9; font-family:'DM Sans',sans-serif; }
        .cp-head { padding:18px 20px 16px; border-bottom:1px solid #e8e4dd; background:#fff; flex-shrink:0; }
        .cp-head-title { font-family:'DM Mono',monospace; font-size:0.65rem; letter-spacing:0.16em; text-transform:uppercase; color:#b5afa8; }
        .cp-head-sub { font-size:0.8rem; color:#57524d; margin-top:3px; font-weight:300; }

        .cp-msgs { flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:16px; }
        .cp-msgs::-webkit-scrollbar { width:4px; }
        .cp-msgs::-webkit-scrollbar-thumb { background:#ddd8d0; border-radius:4px; }

        .cp-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:40px 20px; gap:12px; }
        .cp-empty-icon { width:44px; height:44px; background:#f0ece6; border-radius:10px; display:flex; align-items:center; justify-content:center; }
        .cp-empty-icon svg { width:20px; height:20px; stroke:#b5afa8; fill:none; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; }
        .cp-empty-text { font-size:0.84rem; color:#b5afa8; line-height:1.6; font-weight:300; }

        .cp-msg { display:flex; flex-direction:column; gap:6px; animation:cp-in 0.25s ease; }
        @keyframes cp-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        .cp-role { font-family:'DM Mono',monospace; font-size:0.6rem; letter-spacing:0.1em; text-transform:uppercase; color:#b5afa8; }
        .cp-bubble { padding:12px 14px; border-radius:8px; font-size:0.875rem; line-height:1.65; white-space:pre-wrap; word-wrap:break-word; }
        .cp-user .cp-bubble { background:#fff; border:1px solid #e8e4dd; color:#1a1714; }
        .cp-assistant .cp-bubble { background:#f0ece6; border:1px solid #e8e4dd; color:#1a1714; }
        .cp-cites { display:flex; flex-wrap:wrap; gap:6px; margin-top:4px; }

        .cp-typing { display:flex; align-items:center; gap:8px; padding:12px 14px; background:#f0ece6; border:1px solid #e8e4dd; border-radius:8px; animation:cp-in 0.25s ease; }
        .cp-dots { display:flex; gap:3px; }
        .cp-dot { width:5px; height:5px; background:#b5afa8; border-radius:50%; animation:cp-bounce 1.4s infinite ease-in-out; }
        .cp-dot:nth-child(1){animation-delay:-0.32s}.cp-dot:nth-child(2){animation-delay:-0.16s}
        @keyframes cp-bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        .cp-typing-txt { font-size:0.8rem; color:#b5afa8; font-style:italic; }

        .cp-foot { padding:14px 16px; border-top:1px solid #e8e4dd; background:#fff; flex-shrink:0; }
        .cp-row { display:flex; gap:8px; align-items:flex-end; }
        .cp-ta { flex:1; padding:11px 14px; font-family:'DM Sans',sans-serif; font-size:0.875rem; border:1.5px solid #e8e4dd; border-radius:8px; background:#fafaf9; color:#1a1714; resize:none; outline:none; transition:border-color 0.2s; min-height:42px; max-height:120px; line-height:1.5; }
        .cp-ta:focus { border-color:#1a1714; background:#fff; }
        .cp-ta::placeholder { color:#b5afa8; }
        .cp-send { padding:11px 18px; background:#1a1714; color:#fff; font-family:'DM Sans',sans-serif; font-size:0.84rem; font-weight:500; border:none; border-radius:8px; cursor:pointer; transition:background 0.2s,transform 0.15s; flex-shrink:0; }
        .cp-send:hover:not(:disabled) { background:#d4522a; transform:translateY(-1px); }
        .cp-send:disabled { background:#ddd8d0; cursor:not-allowed; transform:none; }
        .cp-hint { margin-top:8px; font-family:'DM Mono',monospace; font-size:0.63rem; color:#b5afa8; text-align:center; }
      `}</style>

      <div className="cp">
        <div className="cp-head">
          <div className="cp-head-title">Chat with Paper</div>
          <div className="cp-head-sub">Every answer cites exact sections</div>
        </div>

        <div className="cp-msgs">
          {messages.length === 0 ? (
            <div className="cp-empty">
              <div className="cp-empty-icon">
                <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div className="cp-empty-text">Ask anything about this paper.<br />Answers are grounded in the text.</div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const isLastAssistant = msg.role === "assistant" && i === messages.length - 1;
                return (
                  <div key={i} className={`cp-msg cp-${msg.role}`}>
                    <div className="cp-role">{msg.role}</div>
                    <div className="cp-bubble">{msg.content}</div>
                    {isLastAssistant && citations.length > 0 && (
                      <div className="cp-cites">
                        {citations.map((c, ci) => (
                          <CitationChip key={ci} number={ci + 1} citation={c} onClick={() => c.chunk_id && onCitationClick(c.chunk_id)} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {isChatLoading && (
                <div className="cp-typing">
                  <div className="cp-dots"><div className="cp-dot"/><div className="cp-dot"/><div className="cp-dot"/></div>
                  <span className="cp-typing-txt">Thinking...</span>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="cp-foot">
          <div className="cp-row">
            <textarea className="cp-ta" placeholder="Ask a question about the paper..." value={chatInput} onChange={(e) => onChatInputChange(e.target.value)} onKeyDown={handleKeyDown} disabled={isChatLoading} rows={1} />
            <button className="cp-send" onClick={handleSend} disabled={isChatLoading || !chatInput.trim()}>Send</button>
          </div>
          <div className="cp-hint">Enter to send · Shift+Enter for new line</div>
        </div>
      </div>
    </>
  );
}
