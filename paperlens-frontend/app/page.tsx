"use client";

import { useState, useRef, useEffect } from "react";
import LandingPage from "@/components/LandingPage";
import PaperReader from "@/components/PaperReader";

const API_BASE = "http://127.0.0.1:8000";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type Citation = {
  chunk_id?: string;
  text: string;
  section: string;
  page: number;
  score?: number;
};

export type PaperData = {
  paper_id: string;
  title: string;
  authors: string[];
  abstract: string;
  total_chunks: number;
  message?: string;
};

export type ConceptMapData = {
  paper_id: string;
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    frequency: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    weight: number;
  }>;
};

export default function Page() {
  // Page state
  const [currentPage, setCurrentPage] = useState<"landing" | "reader">("landing");
  
  // Paper data
  const [paperId, setPaperId] = useState<string>("");
  const [paperData, setPaperData] = useState<PaperData | null>(null);
  
  // Ingestion state
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStatus, setIngestionStatus] = useState("");
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [citations, setCitations] = useState<Citation[]>([]);
  
  // Tooltip state
  const [tooltipData, setTooltipData] = useState<{
    explanation: string;
    analogy: string;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Concept map state
  const [conceptMapData, setConceptMapData] = useState<ConceptMapData | null>(null);
  const [isConceptMapLoading, setIsConceptMapLoading] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // ── API Functions ──────────────────────────────────────────────────────────

  const handleIngestPaper = async (arxivUrl: string) => {
    setError(null);
    setIsIngesting(true);
    setIngestionStatus("Submitting paper...");

    try {
      const response = await fetch(`${API_BASE}/api/v1/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arxiv_url: arxivUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to submit paper");
      }

      const data = await response.json();
      const jobId = data.job_id;

      // Start polling for status
      setIngestionStatus("Downloading PDF...");
      pollIngestionStatus(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ingest paper");
      setIsIngesting(false);
    }
  };

  const pollIngestionStatus = (jobId: string) => {
    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/status/${jobId}`);
        const data = await response.json();

        if (data.status === "processing") {
          setIngestionStatus("Embedding chunks (~60s)...");
        } else if (data.status === "complete") {
          clearInterval(pollIntervalRef.current!);
          setPaperData(data.result);
          setPaperId(data.result.paper_id); // Set paper_id from the completed result
          setIsIngesting(false);
          setCurrentPage("reader");
          
          // Auto-load concept map
          loadConceptMap(data.result.paper_id);
        } else if (data.status === "failed") {
          clearInterval(pollIntervalRef.current!);
          setError(data.error || "Ingestion failed");
          setIsIngesting(false);
        }
      } catch (err) {
        clearInterval(pollIntervalRef.current!);
        setError("Failed to check status");
        setIsIngesting(false);
      }
    }, 3000);
  };

  const handleSendMessage = async (message: string) => {
    if (!paperId || !message.trim()) return;

    setError(null);
    setIsChatLoading(true);
    
    const userMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setChatInput("");

    try {
      const response = await fetch(`${API_BASE}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper_id: paperId,
          message: message,
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      setCitations(data.citations || []);
    } catch (err) {
      setError("Failed to get response");
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleExplainText = async (selectedText: string, position: { x: number; y: number }) => {
    if (!paperId || !selectedText.trim()) return;

    setTooltipPosition(position);
    setTooltipData(null);

    try {
      const response = await fetch(`${API_BASE}/api/v1/tooltip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper_id: paperId,
          sentence: selectedText,
          term: selectedText,
        }),
      });

      if (!response.ok) {
        throw new Error("Tooltip request failed");
      }

      const data = await response.json();
      setTooltipData(data);
    } catch (err) {
      console.error("Failed to get explanation:", err);
    }
  };

  const loadConceptMap = async (paper_id: string) => {
    setIsConceptMapLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/v1/concept-map/${paper_id}`);
      
      if (!response.ok) {
        throw new Error("Failed to load concept map");
      }

      const data = await response.json();
      setConceptMapData(data);
    } catch (err) {
      console.error("Concept map error:", err);
    } finally {
      setIsConceptMapLoading(false);
    }
  };

  const handleCitationClick = (chunkId: string) => {
    // Scroll to chunk in paper viewer
    const element = document.querySelector(`[data-chunk-id="${chunkId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      
      // Highlight temporarily
      element.classList.add("highlight-chunk");
      setTimeout(() => {
        element.classList.remove("highlight-chunk");
      }, 2000);
    }
  };

  const closeTooltip = () => {
    setTooltipData(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (currentPage === "landing") {
    return (
      <LandingPage
        onSubmit={handleIngestPaper}
        isIngesting={isIngesting}
        ingestionStatus={ingestionStatus}
        error={error}
      />
    );
  }

  return (
    <PaperReader
      paperData={paperData}
      messages={messages}
      chatInput={chatInput}
      isChatLoading={isChatLoading}
      citations={citations}
      conceptMapData={conceptMapData}
      isConceptMapLoading={isConceptMapLoading}
      tooltipData={tooltipData}
      tooltipPosition={tooltipPosition}
      error={error}
      onSendMessage={handleSendMessage}
      onChatInputChange={setChatInput}
      onExplainText={handleExplainText}
      onCitationClick={handleCitationClick}
      onCloseTooltip={closeTooltip}
    />
  );
}
