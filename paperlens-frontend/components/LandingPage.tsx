"use client";

import { useState, useEffect, useRef } from "react";

type LandingPageProps = {
  onSubmit: (arxivUrl: string) => void;
  isIngesting: boolean;
  ingestionStatus: string;
  error: string | null;
};

export default function LandingPage({ onSubmit, isIngesting, ingestionStatus, error }: LandingPageProps) {
  const [url, setUrl] = useState("");
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = () => { if (url.trim() && !isIngesting) onSubmit(url.trim()); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');

        .lp { --cream:#f7f4ef; --ink:#1a1714; --ink-2:#57524d; --ink-3:#b5afa8; --accent:#d4522a; --border:#ddd8d0; --white:#fff; }
        .lp, .lp * { box-sizing:border-box; margin:0; padding:0; }
        .lp { min-height:100vh; background:var(--cream); font-family:'DM Sans',sans-serif; overflow-x:hidden; }

        .lp-nav { position:sticky; top:0; z-index:50; display:flex; align-items:center; justify-content:space-between; padding:0 56px; height:64px; background:rgba(247,244,239,0.94); backdrop-filter:blur(12px); border-bottom:1px solid var(--border); }
        .lp-logo { font-family:'DM Serif Display',serif; font-size:1.45rem; color:var(--ink); letter-spacing:-0.02em; }
        .lp-logo b { color:var(--accent); font-weight:400; font-style:italic; }
        .lp-nav-r { display:flex; align-items:center; gap:28px; }
        .lp-nav-link { font-size:0.875rem; color:var(--ink-2); text-decoration:none; transition:color 0.2s; }
        .lp-nav-link:hover { color:var(--ink); }
        .lp-nav-btn { padding:9px 22px; background:var(--ink); color:#fff; font-family:'DM Sans',sans-serif; font-size:0.875rem; font-weight:500; border:none; border-radius:7px; cursor:pointer; transition:background 0.2s,transform 0.15s; }
        .lp-nav-btn:hover { background:#2d2925; transform:translateY(-1px); }

        .lp-hero { position:relative; min-height:calc(100vh - 64px); display:flex; align-items:center; justify-content:center; padding:80px 56px; overflow:hidden; }
        .lp-dots { position:absolute; inset:0; background-image:radial-gradient(circle,#ddd8d0 1.2px,transparent 1.2px); background-size:28px 28px; opacity:0.55; pointer-events:none; }
        .lp-glow { position:absolute; top:-60px; right:-60px; width:480px; height:480px; background:radial-gradient(circle,rgba(212,82,42,0.07) 0%,transparent 68%); pointer-events:none; }
        .lp-glow2 { position:absolute; bottom:-40px; left:-40px; width:360px; height:360px; background:radial-gradient(circle,rgba(212,82,42,0.04) 0%,transparent 68%); pointer-events:none; }

        .lp-center { position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; text-align:center; max-width:760px; width:100%; }

        .lp-badge { display:inline-flex; align-items:center; gap:8px; padding:7px 18px; background:#fff; border:1px solid var(--border); border-radius:100px; font-family:'DM Mono',monospace; font-size:0.72rem; color:var(--ink-2); letter-spacing:0.04em; margin-bottom:36px; box-shadow:0 2px 8px rgba(0,0,0,0.06); opacity:0; animation:lp-up 0.6s ease 0.1s forwards; }
        .lp-dot { width:7px; height:7px; border-radius:50%; background:var(--accent); animation:lp-pulse 2s ease-in-out infinite; }
        @keyframes lp-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.75)} }

        .lp-h1 { font-family:'DM Serif Display',serif; font-size:clamp(2.8rem,6.5vw,5.2rem); line-height:1.06; letter-spacing:-0.025em; color:var(--ink); margin-bottom:28px; opacity:0; animation:lp-up 0.7s ease 0.2s forwards; }
        .lp-h1 em { font-style:italic; color:var(--accent); position:relative; }
        .lp-h1 em::after { content:''; position:absolute; bottom:4px; left:0; right:0; height:2px; background:var(--accent); opacity:0.3; border-radius:2px; }

        .lp-sub { font-size:1.08rem; line-height:1.75; color:var(--ink-2); max-width:500px; margin-bottom:44px; font-weight:300; opacity:0; animation:lp-up 0.7s ease 0.3s forwards; }

        .lp-iw { width:100%; max-width:580px; display:flex; background:#fff; border:1.5px solid var(--border); border-radius:10px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.07); transition:border-color 0.2s,box-shadow 0.2s; opacity:0; animation:lp-up 0.7s ease 0.4s forwards; }
        .lp-iw:focus-within { border-color:var(--ink); box-shadow:0 4px 28px rgba(0,0,0,0.12); }
        .lp-input { flex:1; padding:15px 20px; font-family:'DM Mono',monospace; font-size:0.84rem; color:var(--ink); background:transparent; border:none; outline:none; min-width:0; }
        .lp-input::placeholder { color:var(--ink-3); }
        .lp-go { padding:15px 28px; background:var(--ink); color:#fff; font-family:'DM Sans',sans-serif; font-size:0.9rem; font-weight:500; border:none; cursor:pointer; transition:background 0.2s; white-space:nowrap; flex-shrink:0; }
        .lp-go:hover:not(:disabled) { background:var(--accent); }
        .lp-go:disabled { background:var(--ink-3); cursor:not-allowed; }

        .lp-hint { margin-top:14px; font-family:'DM Mono',monospace; font-size:0.75rem; color:var(--ink-3); opacity:0; animation:lp-up 0.6s ease 0.5s forwards; }
        .lp-status { display:flex; align-items:center; gap:10px; margin-top:20px; padding:12px 20px; background:#fff; border:1px solid var(--border); border-radius:8px; font-family:'DM Mono',monospace; font-size:0.8rem; color:var(--ink-2); animation:lp-up 0.3s ease forwards; }
        .lp-spin { width:14px; height:14px; border:2px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:lp-rotate 0.8s linear infinite; flex-shrink:0; }
        @keyframes lp-rotate { to{transform:rotate(360deg)} }
        .lp-err { margin-top:16px; padding:12px 16px; background:#fff2f2; border:1px solid #fecaca; border-radius:8px; font-size:0.84rem; color:#dc2626; animation:lp-up 0.3s ease forwards; }

        @keyframes lp-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

        /* Float cards */
        .lp-fc { position:absolute; background:#fff; border:1px solid var(--border); border-radius:12px; padding:16px 18px; box-shadow:0 8px 36px rgba(0,0,0,0.09); max-width:215px; z-index:1; }
        .lp-fc-l { left:5%; top:50%; animation:lp-bob-l 6s ease-in-out infinite; }
        .lp-fc-r { right:5%; top:44%; animation:lp-bob-r 7s ease-in-out infinite; }
        @keyframes lp-bob-l { 0%,100%{transform:translateY(-50%) rotate(-4deg) translateY(0)} 50%{transform:translateY(-50%) rotate(-4deg) translateY(-10px)} }
        @keyframes lp-bob-r { 0%,100%{transform:translateY(-50%) rotate(3deg) translateY(0)} 50%{transform:translateY(-50%) rotate(3deg) translateY(-12px)} }
        .lp-fc-tag { font-family:'DM Mono',monospace; font-size:0.62rem; letter-spacing:0.12em; text-transform:uppercase; color:var(--accent); margin-bottom:8px; }
        .lp-fc-hr { height:1px; background:var(--border); margin:8px 0; }
        .lp-fc-body { font-size:0.78rem; line-height:1.5; color:var(--ink-2); }
        .lp-fc-body strong { color:var(--ink); font-weight:500; }
        .lp-fc-q { font-size:0.73rem; color:var(--ink-3); margin-bottom:5px; }
        .lp-fc-a { font-size:0.78rem; color:var(--ink); line-height:1.45; }

        /* Features */
        .lp-features { padding:88px 56px; background:#fff; border-top:1px solid var(--border); }
        .lp-feat-ey { text-align:center; font-family:'DM Mono',monospace; font-size:0.68rem; letter-spacing:0.22em; text-transform:uppercase; color:var(--ink-3); margin-bottom:14px; }
        .lp-feat-h { text-align:center; font-family:'DM Serif Display',serif; font-size:clamp(1.7rem,3vw,2.5rem); color:var(--ink); letter-spacing:-0.02em; margin-bottom:60px; line-height:1.2; }
        .lp-feat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; max-width:1080px; margin:0 auto; }

        .lp-card { background:var(--cream); border:1px solid var(--border); border-radius:12px; padding:28px 24px; position:relative; overflow:hidden; transition:transform 0.22s,box-shadow 0.22s,border-color 0.22s; }
        .lp-card::after { content:''; position:absolute; top:0;left:0;right:0; height:2px; background:var(--ink); transform:scaleX(0); transform-origin:left; transition:transform 0.3s; }
        .lp-card:hover { transform:translateY(-5px); box-shadow:0 16px 48px rgba(0,0,0,0.09); border-color:var(--ink); }
        .lp-card:hover::after { transform:scaleX(1); }
        .lp-card.dim { opacity:0.5; pointer-events:none; }

        .lp-card-ico { width:40px; height:40px; background:var(--ink); border-radius:8px; display:flex; align-items:center; justify-content:center; margin-bottom:18px; flex-shrink:0; }
        .lp-card-ico.muted { background:var(--ink-3); }
        .lp-card-ico svg { width:18px; height:18px; stroke:#fff; fill:none; stroke-width:1.6; stroke-linecap:round; stroke-linejoin:round; }
        .lp-card-tag { font-family:'DM Mono',monospace; font-size:0.64rem; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink-2); margin-bottom:8px; }
        .lp-card-name { font-family:'DM Serif Display',serif; font-size:1.18rem; color:var(--ink); margin-bottom:10px; letter-spacing:-0.01em; line-height:1.25; }
        .lp-card-desc { font-size:0.84rem; line-height:1.68; color:var(--ink-2); font-weight:300; }
        .lp-card-link { display:inline-block; margin-top:18px; font-size:0.82rem; font-weight:500; color:var(--ink); text-decoration:none; border-bottom:1px solid var(--ink); padding-bottom:1px; transition:color 0.2s,border-color 0.2s; }
        .lp-card-link:hover { color:var(--accent); border-color:var(--accent); }
        .lp-soon { display:inline-block; margin-top:16px; padding:4px 10px; background:var(--border); border-radius:4px; font-family:'DM Mono',monospace; font-size:0.62rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-3); }

        .lp-footer { padding:24px 56px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:var(--cream); }
        .lp-footer span { font-family:'DM Mono',monospace; font-size:0.73rem; color:var(--ink-3); }

        @media(max-width:1200px){.lp-fc{display:none}}
        @media(max-width:900px){.lp-feat-grid{grid-template-columns:repeat(2,1fr)}.lp-hero,.lp-features{padding:60px 24px}.lp-nav{padding:0 24px}.lp-footer{padding:20px 24px;flex-direction:column;gap:8px;text-align:center}}
        @media(max-width:560px){.lp-feat-grid{grid-template-columns:1fr}.lp-iw{flex-direction:column}.lp-go{border-radius:0 0 8px 8px}}
      `}</style>

      <div className="lp">
        <nav className="lp-nav">
          <div className="lp-logo">Paper<b>Lens</b></div>
          <div className="lp-nav-r">
            <a href="https://github.com" className="lp-nav-link">GitHub</a>
            <button className="lp-nav-btn" onClick={() => inputRef.current?.focus()}>Get Started</button>
          </div>
        </nav>

        <section className="lp-hero">
          <div className="lp-dots" />
          <div className="lp-glow" />
          <div className="lp-glow2" />

          <div className="lp-fc lp-fc-l">
            <div className="lp-fc-tag">Tooltip Explain</div>
            <div className="lp-fc-body">
              <strong>"attention mechanism"</strong>
              <div className="lp-fc-hr" />
              Allows the model to focus on relevant parts of the input sequence dynamically.
            </div>
          </div>

          <div className="lp-fc lp-fc-r">
            <div className="lp-fc-tag">Chat Assistant</div>
            <div className="lp-fc-q">Q: Main contribution?</div>
            <div className="lp-fc-a">The Transformer — eliminating recurrence in favour of attention entirely.</div>
          </div>

          <div className="lp-center">
            <div className="lp-badge">
              <div className="lp-dot" />
              arXiv · PDF · Research Assistant
            </div>

            <h1 className="lp-h1">
              Reading Academic Papers<br />
              Was Never This <em>Easy</em>
            </h1>

            <p className="lp-sub">
              Paste an arXiv link. Get instant explanations, citations,
              concept maps — and ask anything about the paper.
            </p>

            <div className="lp-iw">
              <input ref={inputRef} className="lp-input" type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={handleKeyDown} placeholder="https://arxiv.org/abs/1706.03762" disabled={isIngesting} />
              <button className="lp-go" onClick={handleSubmit} disabled={isIngesting || !url.trim()}>
                {isIngesting ? "Loading..." : "Analyze Paper →"}
              </button>
            </div>

            <div className="lp-hint">or upload a PDF · coming soon</div>

            {isIngesting && (
              <div className="lp-status">
                <div className="lp-spin" />
                {ingestionStatus}
              </div>
            )}
            {error && <div className="lp-err">⚠ {error}</div>}
          </div>
        </section>

        <section className="lp-features">
          <div className="lp-feat-ey">What PaperLens does</div>
          <h2 className="lp-feat-h">Everything you need to<br />understand any paper</h2>

          <div className="lp-feat-grid">
            <div className="lp-card">
              <div className="lp-card-ico">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
              </div>
              <div className="lp-card-tag">Explain</div>
              <div className="lp-card-name">Select to Understand</div>
              <p className="lp-card-desc">Highlight any sentence and get a plain-English explanation with analogies instantly.</p>
              <a href="#" className="lp-card-link">Try it →</a>
            </div>

            <div className="lp-card">
              <div className="lp-card-ico">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v4M12 11l-5 6M12 11l5 6"/></svg>
              </div>
              <div className="lp-card-tag">Structure</div>
              <div className="lp-card-name">See the Structure</div>
              <p className="lp-card-desc">Auto-generated concept map shows how ideas connect across the paper. Drag, zoom, explore.</p>
              <a href="#" className="lp-card-link">Try it →</a>
            </div>

            <div className="lp-card">
              <div className="lp-card-ico">
                <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div className="lp-card-tag">Converse</div>
              <div className="lp-card-name">Ask Anything</div>
              <p className="lp-card-desc">Chat with the paper. Every answer cites exact sections — click a reference to jump to it.</p>
              <a href="#" className="lp-card-link">Try it →</a>
            </div>

            <div className="lp-card dim">
              <div className="lp-card-ico muted">
                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
              <div className="lp-card-tag">Animate</div>
              <div className="lp-card-name">Watch it Explained</div>
              <p className="lp-card-desc">Manim-powered visual animations break down key concepts into step-by-step visuals.</p>
              <div className="lp-soon">Coming Soon</div>
            </div>
          </div>
        </section>

        <footer className="lp-footer">
          <span>PaperLens · Built for researchers</span>
          <span>FastAPI · ChromaDB · Groq</span>
        </footer>
      </div>
    </>
  );
}
