// Browser-side retrieval for the demo paper.
// Mirrors app/rag_chat.py: lexical BM25 retrieval over the bundled chunks,
// then rerank by a simple lexical/length score (no cross-encoder available
// offline). The top chunks are returned as a formatted context block.

export interface DemoChunk {
  chunk_id: string;
  text: string;
  section: string;
  page: number;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// BM25 with idf over the local corpus.
export function buildIndex(chunks: DemoChunk[]) {
  const tokenized = chunks.map((c) => tokenize(c.text));
  const df: Record<string, number> = {};
  for (const toks of tokenized) {
    const seen = new Set(toks);
    for (const t of seen) df[t] = (df[t] || 0) + 1;
  }
  const N = chunks.length;
  const avgdl = tokenized.reduce((s, t) => s + t.length, 0) / Math.max(1, N);
  const k1 = 1.5;
  const b = 0.75;

  function score(query: string): { chunk: DemoChunk; score: number }[] {
    const qToks = tokenize(query);
    if (qToks.length === 0) return [];
    const results = chunks.map((chunk, i) => {
      const doc = tokenized[i];
      const docLen = doc.length;
      const freq: Record<string, number> = {};
      for (const t of doc) freq[t] = (freq[t] || 0) + 1;
      let sum = 0;
      for (const qt of qToks) {
        const f = freq[qt];
        if (!f) continue;
        const idf = Math.log(1 + (N - (df[qt] || 0) + 0.5) / ((df[qt] || 0) + 0.5));
        sum += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + b * (docLen / avgdl))));
      }
      return { chunk, score: sum };
    });
    return results
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  return { score };
}

export function formatContext(retrieved: { chunk: DemoChunk; score: number }[]): string {
  return retrieved
    .map(
      (r, i) =>
        `[${i + 1}] Section: ${r.chunk.section} | Page ${r.chunk.page}\n${r.chunk.text}`
    )
    .join('\n\n---\n\n');
}

export function retrieveContext(
  index: ReturnType<typeof buildIndex>,
  query: string,
  topK = 5
): { context: string; citations: { text: string; section?: string; page?: number }[] } {
  const scored = index.score(query).slice(0, topK);
  const context = formatContext(scored);
  const citations = scored.map((r) => ({
    text: r.chunk.text.slice(0, 200) + '...',
    section: r.chunk.section,
    page: r.chunk.page,
  }));
  return { context, citations };
}
