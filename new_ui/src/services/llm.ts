// Frontend LLM config — user-supplied Groq key (stored only in localStorage).
// Mirrors the backend's Groq setup so the demo RAG chat behaves the same.

export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODEL = 'llama-3.3-70b-versatile';

const GROQ_KEY_KEY = 'paperlens_groq_key';

export function getGroqKey(): string {
  try {
    return localStorage.getItem(GROQ_KEY_KEY) || '';
  } catch {
    return '';
  }
}

export function setGroqKey(key: string): void {
  try {
    if (key) localStorage.setItem(GROQ_KEY_KEY, key.trim());
    else localStorage.removeItem(GROQ_KEY_KEY);
  } catch {
    /* ignore */
  }
}

export function hasGroqKey(): boolean {
  return getGroqKey().length > 0;
}
