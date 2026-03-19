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

export default function ChatPanel({
  messages,
  chatInput,
  isChatLoading,
  citations,
  onSendMessage,
  onChatInputChange,
  onCitationClick,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (chatInput.trim() && !isChatLoading) {
      onSendMessage(chatInput);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <style>{`
        .chat-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .chat-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e7e5e4;
          background: white;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .chat-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #78716c;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .chat-empty {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #a8a29e;
          font-size: 0.9rem;
          padding: 40px 20px;
          line-height: 1.6;
        }

        .message {
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-role {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #78716c;
        }

        .message-content {
          padding: 14px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          line-height: 1.6;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .message-user .message-content {
          background: #f5f5f4;
          border: 1px solid #e7e5e4;
          color: #1c1917;
        }

        .message-assistant .message-content {
          background: #ecfdf5;
          border: 1px solid #d1fae5;
          color: #064e3b;
        }

        .message-citations {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 16px;
          background: #f5f5f4;
          border-radius: 8px;
          font-size: 0.85rem;
          color: #78716c;
          font-style: italic;
        }

        .typing-dots {
          display: flex;
          gap: 4px;
        }

        .typing-dot {
          width: 6px;
          height: 6px;
          background: #a8a29e;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
        }

        .typing-dot:nth-child(1) {
          animation-delay: -0.32s;
        }

        .typing-dot:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }

        .chat-input-area {
          padding: 16px 24px;
          border-top: 1px solid #e7e5e4;
          background: white;
          position: sticky;
          bottom: 0;
        }

        .input-wrapper {
          display: flex;
          gap: 8px;
        }

        .chat-textarea {
          flex: 1;
          padding: 12px 14px;
          font-size: 0.9rem;
          font-family: 'Inter', sans-serif;
          border: 1px solid #e7e5e4;
          border-radius: 6px;
          background: #fafaf9;
          color: #1c1917;
          resize: none;
          outline: none;
          transition: all 0.2s ease;
          min-height: 44px;
          max-height: 120px;
        }

        .chat-textarea:focus {
          border-color: #0c0a09;
          background: white;
        }

        .chat-textarea::placeholder {
          color: #a8a29e;
        }

        .send-button {
          padding: 12px 20px;
          font-size: 0.85rem;
          font-weight: 600;
          background: #0c0a09;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          align-self: flex-end;
        }

        .send-button:hover:not(:disabled) {
          background: #292524;
          transform: translateY(-1px);
        }

        .send-button:disabled {
          background: #d6d3d1;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>

      <div className="chat-panel">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-title">Chat with Paper</div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              Ask anything about this paper...
              <br />
              Every answer is grounded in the text.
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isLastAssistant =
                  message.role === "assistant" &&
                  index === messages.length - 1;
                const messageCitations = isLastAssistant ? citations : [];

                return (
                  <div
                    key={index}
                    className={`message message-${message.role}`}
                  >
                    <div className="message-role">{message.role}</div>
                    <div className="message-content">{message.content}</div>
                    
                    {messageCitations.length > 0 && (
                      <div className="message-citations">
                        {messageCitations.map((citation, citIndex) => (
                          <CitationChip
                            key={citIndex}
                            number={citIndex + 1}
                            citation={citation}
                            onClick={() =>
                              citation.chunk_id &&
                              onCitationClick(citation.chunk_id)
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {isChatLoading && (
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                  <span>Thinking...</span>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-input-area">
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              placeholder="Ask a question..."
              value={chatInput}
              onChange={(e) => onChatInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isChatLoading}
              rows={1}
            />
            <button
              className="send-button"
              onClick={handleSend}
              disabled={isChatLoading || !chatInput.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
