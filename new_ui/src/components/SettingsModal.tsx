import { useState, useEffect } from 'react';
import { X, KeyRound, ExternalLink } from 'lucide-react';
import { getGroqKey, setGroqKey, hasGroqKey } from '../services/llm';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setKey(getGroqKey());
      setSaved(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    setGroqKey(key);
    setSaved(true);
    setTimeout(onClose, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-surface brutal-border shadow-[8px_8px_0_0_rgba(0,0,0,1)] w-full max-w-md p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xl">
            <KeyRound className="w-6 h-6 text-primary" />
            Settings
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border-2 border-transparent hover:border-black flex items-center justify-center font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-sm font-medium text-gray-700 leading-relaxed">
          The demo RAG chat and AI tooltips run entirely in your browser using a
          free <span className="font-black">Groq</span> API key. Your key is stored only
          in this browser's <code>localStorage</code> and is sent only to Groq — never to our servers.
        </div>

        <label className="font-bold text-sm">Groq API Key</label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="gsk_..."
          className="bg-surface-dim brutal-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:bg-white"
        />

        <div className="flex items-center justify-between">
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
          >
            Get a free key <ExternalLink className="w-3 h-3" />
          </a>
          <span className={`text-xs font-bold ${hasGroqKey() ? 'text-green-600' : 'text-gray-400'}`}>
            {hasGroqKey() ? '● Key set' : '○ No key'}
          </span>
        </div>

        <div className="flex gap-3 mt-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-primary hover:bg-primary-hover text-white font-black py-3 rounded-lg brutal-border shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
          >
            {saved ? 'Saved ✓' : 'Save Key'}
          </button>
          {hasGroqKey() && (
            <button
              onClick={() => { setGroqKey(''); setKey(''); }}
              className="px-4 bg-surface-dim hover:bg-red-100 text-red-700 font-bold py-3 rounded-lg brutal-border"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
