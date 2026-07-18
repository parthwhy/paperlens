import { GROQ_API_URL, GROQ_MODEL, getGroqKey } from './llm';
import { demoIndex } from './demo';
import { retrieveContext } from './rag';

// Mirrors app/rag_chat.py's SYSTEM_PROMPT and retrieval+answer flow,
// but runs entirely in the browser against the bundled demo chunks.

const SYSTEM_PROMPT = `You are PaperLens, an expert research assistant.
Your ONLY job is to answer questions about the paper provided in the context.

STRICT RULES:
- Only use information from the provided context chunks.
- If the answer is not in the context, say "This isn't covered in the paper."
- Always cite which section your answer comes from.
- Be concise but precise. Use plain English — explain jargon when used.
- Format: answer first, then "📄 Source: [Section Name], Page X"
`;

export interface DemoAnswer {
  answer: string;
  citations: { text: string; section?: string; page?: number }[];
}

export async function demoChat(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<DemoAnswer> {
  const key = getGroqKey();
  if (!key) throw new Error('NO_KEY');

  const { context, citations } = retrieveContext(demoIndex, message, 5);

  const messages: { role: string; content: string }[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];
  for (const turn of history.slice(-6)) {
    messages.push({ role: turn.role, content: turn.content });
  }
  messages.push({
    role: 'user',
    content: `CONTEXT FROM PAPER:\n${context}\n\nQUESTION: ${message}`,
  });

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return {
    answer: data.choices?.[0]?.message?.content || 'No response.',
    citations,
  };
}

const TOOLTIP_PROMPT = `You are PaperLens. Explain the selected sentence from a research paper in plain English for a curious reader.
Rules:
- Ground the explanation strictly in the paper context provided.
- Keep it to 2-3 sentences.
- If a specific TERM is given, focus on clarifying that term.
- End with one short analogy if helpful.
- Plain text only, no markdown headings.`;

export async function demoTooltip(
  sentence: string,
  term?: string
): Promise<{ explanation: string; analogy?: string | null; related_terms?: string[] }> {
  const key = getGroqKey();
  if (!key) throw new Error('NO_KEY');

  const { context } = retrieveContext(demoIndex, term || sentence, 3);

  const messages = [
    { role: 'system', content: TOOLTIP_PROMPT },
    {
      role: 'user',
      content: `PAPER CONTEXT:\n${context}\n\nSELECTED SENTENCE: "${sentence}"${
        term ? `\nTERM TO CLARIFY: "${term}"` : ''
      }`,
    },
  ];

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content || '';
  // Split out an analogy if present (heuristic).
  const analogyMatch = text.match(/analog[a-z]*[:\-]\s*(.+)$/i);
  const explanation = analogyMatch ? text.slice(0, analogyMatch.index).trim() : text.trim();
  const analogy = analogyMatch ? analogyMatch[1].trim() : null;
  return { explanation, analogy, related_terms: term ? [term] : [] };
}
