import { useState, useEffect, useCallback, useRef, RefObject } from "react";

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  sentence: string;
  explanation: string | null;
  analogy: string | null;
  relatedTerms: string[];
  loading: boolean;
  showButton: boolean; // true = show "Explain with AI" button, false = show explanation
}

const INITIAL: TooltipState = {
  visible: false,
  x: 0,
  y: 0,
  sentence: "",
  explanation: null,
  analogy: null,
  relatedTerms: [],
  loading: false,
  showButton: true,
};

function extractSentence(text: string, selected: string): string {
  // Try to grab the full sentence containing the selection
  const sentences = text.match(/[^.!?]*[.!?]+/g) ?? [text];
  const match = sentences.find((s) => s.includes(selected.trim()));
  return (match ?? selected).trim();
}

export function useTooltip(paperId: string, containerRef: RefObject<HTMLElement>) {
  const [state, setState] = useState<TooltipState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);
  const selectedTermRef = useRef<string>("");

  const dismiss = useCallback(() => setState(INITIAL), []);

  const fetchExplanation = useCallback(async () => {
    if (!state.sentence) return;

    setState((prev: TooltipState) => ({ ...prev, loading: true, showButton: false }));

    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/tooltip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper_id: paperId,
          sentence: state.sentence,
          term: selectedTermRef.current,
        }),
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      setState((prev: TooltipState) =>
        prev.visible
          ? {
              ...prev,
              loading: false,
              explanation: data.explanation,
              analogy: data.analogy || null,
              relatedTerms: data.related_terms || [],
            }
          : prev
      );
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setState((prev: TooltipState) =>
          prev.visible
            ? {
                ...prev,
                loading: false,
                explanation: "Failed to load explanation.",
                analogy: null,
                relatedTerms: [],
              }
            : prev
        );
      }
    }
  }, [paperId, state.sentence]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    async function onMouseUp(e: MouseEvent) {
      const selection = window.getSelection();
      const selected = selection?.toString().trim() ?? "";
      if (!selected || selected.length < 5) return;

      // Position the tooltip just above where the mouse is
      const rect = container!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Extract full sentence for better context
      const anchorNode = selection?.anchorNode;
      const fullText = anchorNode?.textContent ?? selected;
      const sentence = extractSentence(fullText, selected);

      // Store the selected term
      selectedTermRef.current = selected;

      // Show the "Explain with AI" button
      setState({
        visible: true,
        x,
        y,
        sentence,
        explanation: null,
        analogy: null,
        relatedTerms: [],
        loading: false,
        showButton: true,
      });
    }

    container.addEventListener("mouseup", onMouseUp);
    return () => container.removeEventListener("mouseup", onMouseUp);
  }, [paperId, containerRef]);

  // Dismiss on outside click
  useEffect(() => {
    if (!state.visible) return;
    function onDown(e: MouseEvent) {
      const el = document.getElementById("paper-tooltip");
      if (el && !el.contains(e.target as Node)) dismiss();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [state.visible, dismiss]);

  return { tooltip: state, dismiss, fetchExplanation };
}
