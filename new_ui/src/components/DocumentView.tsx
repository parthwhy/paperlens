import React, { useEffect, useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion } from 'framer-motion';
import { MessageSquare, X, GripVertical, ZoomIn, ZoomOut } from 'lucide-react';
import { api } from '../services/api';
import type { ChatMessage, CitedChunk } from '../types';
import { useTooltip } from '../hooks/useTooltip';
import { SelectionTooltip } from './SelectionTooltip';
import { cn } from '../lib/utils';

// Configure PDF.js worker - must match react-pdf's pdfjs-dist version (5.4.296)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

interface DocumentViewProps {
  paperId: string | null;
}

export const DocumentView = ({ paperId }: DocumentViewProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Chat panel state
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  // Resizable state
  const [chatSize, setChatSize] = useState({ width: 400, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const chatRef = useRef<HTMLDivElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const pdfScrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Tooltip state
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const { tooltip, dismiss, fetchExplanation } = useTooltip(paperId || '', pdfContainerRef);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleExplainMore = () => {
    console.log('🔵 handleExplainMore called');
    console.log('🔵 tooltip.sentence:', tooltip.sentence);
    
    if (!tooltip.sentence) {
      console.log('❌ No sentence in tooltip, returning');
      return;
    }
    
    // Create the detailed explanation message
    const detailMessage = `Explain the following sentence in detail: "${tooltip.sentence}"`;
    console.log('🔵 Detail message:', detailMessage);
    
    // Dismiss tooltip
    dismiss();
    console.log('🔵 Tooltip dismissed');
    
    // Open chat if closed
    if (!isChatOpen) {
      console.log('🔵 Opening chat...');
      setIsChatOpen(true);
    }
    
    // Wait a bit for chat to open, then send message
    console.log('🔵 Scheduling message send in 100ms...');
    setTimeout(() => {
      console.log('🔵 Calling sendChatMessage now');
      sendChatMessage(detailMessage);
    }, 100);
  };

  const handleCitationClick = (pageNumber: number) => {
    console.log('🔍 Citation clicked - Page number:', pageNumber);
    
    // Scroll to the specific page in the PDF viewer
    const pageElement = document.getElementById(`pdf-page-${pageNumber}`);
    console.log('🔍 Looking for element:', `pdf-page-${pageNumber}`);
    console.log('🔍 Element found:', pageElement ? 'YES' : 'NO');
    
    if (pageElement && pdfScrollContainerRef.current) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      console.log('🔍 Scrolling to page', pageNumber);
      
      // Add prominent highlight effect with animation
      pageElement.style.transition = 'all 0.3s ease-in-out';
      pageElement.style.boxShadow = '0 0 0 4px #667eea, 0 0 40px rgba(102, 126, 234, 0.4)';
      pageElement.style.backgroundColor = 'rgba(254, 252, 232, 0.8)';
      pageElement.style.transform = 'scale(1.02)';
      
      // Remove highlight after 3 seconds
      setTimeout(() => {
        pageElement.style.boxShadow = '';
        pageElement.style.backgroundColor = '';
        pageElement.style.transform = '';
        console.log('🔍 Highlight removed from page', pageNumber);
      }, 3000);
    } else {
      console.log('❌ Could not scroll - element or container not found');
    }
  };

  const sendChatMessage = async (message: string) => {
    console.log('📤 sendChatMessage called with:', message);
    console.log('📤 paperId:', paperId);
    console.log('📤 isSendingMessage:', isSendingMessage);
    
    if (!message.trim() || !paperId || isSendingMessage) {
      console.log('❌ Validation failed, returning');
      return;
    }

    const userMessage: ChatMessage = { role: 'user', content: message };
    setChatMessages(prev => [...prev, userMessage]);
    console.log('📤 User message added to chat');
    setIsSendingMessage(true);

    try {
      console.log('📤 Calling API...');
      const response = await api.sendChatMessage(paperId, message, chatMessages);
      console.log('📤 API response:', response);
      console.log('📤 Citations received:', response.citations);
      
      // Log each citation's page number
      if (response.citations) {
        response.citations.forEach((cit: CitedChunk, idx: number) => {
          console.log(`📄 Citation ${idx + 1}: page=${cit.page}, section=${cit.section}`);
        });
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
      };
      setChatMessages(prev => [...prev, assistantMessage]);
      console.log('📤 Assistant message added to chat');
    } catch (err) {
      console.error('❌ Failed to send message:', err);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSendingMessage(false);
      console.log('📤 sendChatMessage completed');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const message = chatInput;
    setChatInput(''); // Clear input immediately
    await sendChatMessage(message);
  };

  useEffect(() => {
    if (!paperId) {
      setPdfUrl('');
      return;
    }
    setPdfUrl(`http://127.0.0.1:8000/api/v1/paper/${paperId}/pdf`);
  }, [paperId]);

  // Show message when no paper is loaded
  if (!paperId) {
    return (
      <div className="flex-1 w-full bg-surface-dim overflow-hidden flex items-center justify-center dot-grid">
        <div className="text-center max-w-md p-8">
          <p className="text-lg font-serif text-on-background/60 mb-2">No paper loaded</p>
          <p className="text-sm text-on-background/40">Please ingest a paper from the landing page first</p>
        </div>
      </div>
    );
  }

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // Resizing handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: chatSize.width,
      height: chatSize.height,
    });
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const deltaX = resizeStart.x - e.clientX; // Reverse direction for right-aligned panel
    const deltaY = e.clientY - resizeStart.y;
    setChatSize({
      width: Math.max(320, Math.min(600, resizeStart.width + deltaX)),
      height: Math.max(400, Math.min(800, resizeStart.height + deltaY)),
    });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, resizeStart]);

  const zoomIn = () => setScale(prev => Math.min(2.0, prev + 0.1));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.1));

  // Ctrl+Scroll zoom handler
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          zoomIn();
        } else {
          zoomOut();
        }
      }
    };

    const container = pdfContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, []);

  return (
    <div className="flex-1 w-full h-full flex bg-background overflow-hidden relative">
      
      {/* 1. PDF Area (Main Pane) */}
      <div className={`flex-1 flex flex-col relative h-full overflow-hidden transition-all ${isChatOpen ? 'border-r-2 border-black' : ''}`}>
        {/* PDF Controls - Sticky */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-surface border-b-2 border-black">
          <div className="flex items-center gap-4">
            <span className="font-bold text-on-background">
              {numPages} {numPages === 1 ? 'page' : 'pages'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              className="p-2 brutal-border rounded-lg hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform bg-surface"
              title="Zoom out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="font-bold text-on-background min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-2 brutal-border rounded-lg hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform bg-surface"
              title="Zoom in"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-gray-500 ml-2">Ctrl+Scroll</span>
          </div>

          {!isChatOpen && (
            <button
              onClick={() => setIsChatOpen(true)}
              className="px-4 py-2 bg-primary text-white font-bold brutal-border brutal-shadow-sm hover:-translate-y-0.5 transition-transform flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" /> AI Chat
            </button>
          )}
        </div>

        {/* PDF Viewer - Scrollable All Pages */}
        <div ref={pdfScrollContainerRef} className="flex-1 overflow-auto flex justify-center p-8 bg-surface-dim">
          <div ref={pdfContainerRef} style={{ position: 'relative' }} className="flex flex-col gap-8">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex flex-col items-center gap-4 p-12 bg-surface brutal-border brutal-shadow-sm rounded-xl">
                  <div className="w-12 h-12 border-4 border-black border-t-primary rounded-full animate-spin" />
                  <p className="font-bold">Loading PDF...</p>
                </div>
              }
              error={
                <div className="flex flex-col items-center gap-4 p-12 bg-surface brutal-border brutal-shadow-sm rounded-xl text-center">
                  <p className="font-bold text-red-600">Failed to load PDF</p>
                </div>
              }
            >
              {Array.from(new Array(numPages), (el, index) => (
                <div 
                  key={`page_${index + 1}`} 
                  id={`pdf-page-${index + 1}`}
                  className="bg-white brutal-border mb-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-transform relative"
                >
                  <Page
                    pageNumber={index + 1}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                  {/* Page number label */}
                  <div className="absolute -left-12 top-0 h-full flex items-center justify-center -rotate-90 origin-center text-sm font-black text-gray-400 select-none">
                    PAGE {index + 1}
                  </div>
                </div>
              ))}
            </Document>
            
            {/* Tooltip */}
            {tooltip.visible && (
              <SelectionTooltip
                x={tooltip.x}
                y={tooltip.y}
                sentence={tooltip.sentence}
                explanation={tooltip.explanation}
                analogy={tooltip.analogy}
                relatedTerms={tooltip.relatedTerms}
                loading={tooltip.loading}
                showButton={tooltip.showButton}
                onExplain={fetchExplanation}
                onExplainMore={handleExplainMore}
                onDismiss={dismiss}
              />
            )}
          </div>
        </div>
      </div>

      {/* 2. Contextual Tool Sidebar (AI Chat) */}
      {isChatOpen && (
        <div className="w-96 flex flex-col h-full bg-surface shrink-0 z-20">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b-2 border-black">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary brutal-border flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-lg">AI Assistant</span>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="w-8 h-8 rounded-lg border-2 border-transparent hover:border-black hover:bg-surface-dim transition-colors flex items-center justify-center font-bold"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-dim inner-shadow-brutal">
            {chatMessages.length === 0 ? (
              <div className="text-center font-bold text-gray-400 mt-8 p-4 border-2 border-dashed border-gray-300 rounded-xl">
                Ask me anything about this paper
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1 px-1">
                    {msg.role === 'user' ? 'You' : 'PaperLens'}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-sm font-medium brutal-border ${
                      msg.role === 'user'
                        ? 'bg-primary text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-tr-sm'
                        : 'bg-white text-on-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {msg.citations.map((citation: CitedChunk, i: number) => {
                          const displayPage = citation.page ?? (citation.section ? `Section: ${citation.section}` : `Ref ${i + 1}`);
                          const scrollToPage = citation.page ?? 1;
                          
                          return (
                            <button
                              key={i}
                              onClick={() => handleCitationClick(scrollToPage)}
                              className="text-xs px-2 py-1 bg-surface-dim brutal-border hover:-translate-y-[1px] shadow-[1px_1px_0_0_black] transition-transform text-black font-bold"
                              title={`Page ${scrollToPage}: ${citation.text.substring(0, 100)}...`}
                            >
                              Pg. {scrollToPage}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isSendingMessage && (
              <div className="flex flex-col gap-1 items-start">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1 px-1">
                  PaperLens
                </div>
                <div className="bg-white brutal-border rounded-xl rounded-tl-sm p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2.5 h-2.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2.5 h-2.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatMessagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t-2 border-black bg-surface">
            <div className="flex relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask a question..."
                disabled={isSendingMessage}
                className="w-full bg-surface-dim brutal-border rounded-xl py-3 pl-4 pr-16 text-sm font-bold focus:outline-none focus:bg-white transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isSendingMessage}
                className="absolute right-2 top-2 bottom-2 px-4 bg-primary text-white rounded-lg brutal-border shadow-[2px_2px_0px_0px_black] text-sm font-black hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:hover:translate-y-0"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
