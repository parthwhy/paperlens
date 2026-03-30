import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { PaperMetadata, IngestionStatus } from '../types';

interface Props {
  onPaperIngested: (id: string, title?: string) => void;
}

export function LandingPage({ onPaperIngested }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [recentPapers, setRecentPapers] = useState<PaperMetadata[]>([]);

  useEffect(() => {
    api.getRecentPapers(6)
      .then(data => setRecentPapers(data.papers || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setStatusMsg('Starting ingestion…');
    try {
      const { job_id } = await api.ingestPaper(url.trim());
      // Poll for status
      const poll = setInterval(async () => {
        try {
          const status: IngestionStatus = await api.getIngestionStatus(job_id);
          setStatusMsg(status.message || status.status);
          if (status.status === 'completed' && status.paper_id) {
            clearInterval(poll);
            setLoading(false);
            onPaperIngested(status.paper_id, url.trim());
          } else if (status.status === 'failed') {
            clearInterval(poll);
            setLoading(false);
            setStatusMsg('Ingestion failed. Try another URL.');
          }
        } catch {
          clearInterval(poll);
          setLoading(false);
          setStatusMsg('Connection lost.');
        }
      }, 2000);
    } catch (err: any) {
      setLoading(false);
      setStatusMsg(err.message || 'Failed to start ingestion.');
    }
  };

  const famousPapers = [
    { title: 'Attention Is All You Need', authors: 'Ashish Vaswani, Noam Shazeer, Niki Parmar, et al.', url: 'https://arxiv.org/abs/1706.03762' },
    { title: 'Deep Residual Learning for Image Recognition', authors: 'Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun', url: 'https://arxiv.org/abs/1512.03385' },
    { title: 'Language Models are Few-Shot Learners (GPT-3)', authors: 'Tom B. Brown, Benjamin Mann, Nick Ryder, et al.', url: 'https://arxiv.org/abs/2005.14165' },
  ];

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'var(--background)' }}>
      {/* ── TOP NAV ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--paper)',
        borderBottom: '2px solid var(--ink)',
        boxShadow: 'var(--shadow-neo)',
      }}>
        <nav style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          maxWidth: '1400px', margin: '0 auto', padding: '1rem 1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: '1.5rem',
              color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>magnification_small</span>
              PaperLens
            </span>
            <span style={{
              background: 'var(--primary-container)', color: 'var(--on-primary-container)',
              fontFamily: 'var(--font-label)', fontSize: '10px', padding: '2px 8px',
              border: '1px solid var(--ink)', borderRadius: '9999px',
              textTransform: 'uppercase', fontWeight: 700, letterSpacing: '-0.02em',
            }}>beta</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <a href="#how-it-works" style={{
              fontFamily: 'var(--font-label)', fontSize: '0.8rem', textTransform: 'uppercase',
              letterSpacing: '0.1em', color: 'var(--ink)', opacity: 0.8, textDecoration: 'none',
            }}>How it works</a>
            <a href="#features" style={{
              fontFamily: 'var(--font-label)', fontSize: '0.8rem', textTransform: 'uppercase',
              letterSpacing: '0.1em', color: 'var(--ink)', opacity: 0.8, textDecoration: 'none',
            }}>Features</a>
          </div>
        </nav>
      </header>

      <main style={{ paddingTop: '8rem', paddingBottom: '5rem' }}>
        {/* ── HERO ── */}
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <h1 style={{
            fontFamily: 'var(--font-headline)', fontSize: 'clamp(3rem, 7vw, 6rem)',
            fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 0.9,
            color: 'var(--on-surface)', marginBottom: '2rem',
          }}>
            Read research papers without{' '}
            <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>the confusion</span>
          </h1>
          <p style={{
            maxWidth: '640px', margin: '0 auto 2.5rem',
            fontSize: '1.25rem', color: 'var(--on-surface-variant)', fontFamily: 'var(--font-body)',
          }}>
            Paste any arXiv link. Hover sentences for instant explanations. Ask questions. Watch concepts animate in real-time.
          </p>

          {/* ── INPUT BAR ── */}
          <div style={{
            maxWidth: '720px', margin: '0 auto', display: 'flex',
            flexDirection: 'row', gap: '1rem',
          }}>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="https://arxiv.org/abs/..."
              disabled={loading}
              style={{
                flex: 1, height: '4rem', padding: '0 1.5rem',
                background: 'var(--surface-container-lowest)',
                border: '2px solid var(--ink)', borderRadius: '0.75rem',
                fontFamily: 'var(--font-label)', fontSize: '1.1rem',
                boxShadow: 'var(--shadow-neo)', transition: 'all 0.15s',
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                height: '4rem', padding: '0 2rem',
                background: 'var(--primary-container)', color: 'var(--on-surface)',
                border: '2px solid var(--ink)', borderRadius: '0.75rem',
                fontFamily: 'var(--font-label)', fontWeight: 700, fontSize: '1.1rem',
                boxShadow: 'var(--shadow-neo)', cursor: loading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                transition: 'all 0.15s', opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Analysing…' : 'Analyse Paper'}
              {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
            </button>
          </div>
          {statusMsg && (
            <p style={{
              marginTop: '1rem', fontFamily: 'var(--font-label)',
              fontSize: '0.85rem', color: 'var(--primary)',
            }}>{statusMsg}</p>
          )}

          {/* ── FLOATING MOCKUP CARDS ── */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '2rem',
            marginTop: '4rem', flexWrap: 'wrap', position: 'relative',
          }}>
            {/* Card 1: Sentence Hover */}
            <div style={{
              width: '320px', padding: '1.5rem',
              background: 'var(--surface-container-lowest)',
              border: '2px solid var(--ink)', borderRadius: '0.75rem',
              boxShadow: 'var(--shadow-neo)', transform: 'rotate(-2deg)',
              transition: 'transform 0.3s', cursor: 'default', textAlign: 'left',
            }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--error)' }}/>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary-container)' }}/>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--secondary)' }}/>
              </div>
              <p style={{ fontSize: '0.75rem', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
                "...we utilize a{' '}
                <span style={{
                  background: 'rgba(0,108,79,0.15)', borderBottom: '2px solid var(--secondary)',
                  fontWeight: 500, padding: '0 2px',
                }}>Transformer-based architecture</span>{' '}
                with integrated attention mechanisms..."
              </p>
              <div style={{
                marginTop: '1rem', padding: '0.75rem', background: 'var(--secondary)',
                color: 'var(--on-secondary)', borderRadius: '0.5rem',
                fontSize: '0.75rem', fontFamily: 'var(--font-label)',
                position: 'relative', textAlign: 'left',
              }}>
                Think of this as a brain that can focus on specific words while ignoring others to understand context better.
              </div>
            </div>

            {/* Card 2: AI Chat */}
            <div style={{
              width: '288px', padding: '1.5rem',
              background: 'var(--surface-container-lowest)',
              border: '2px solid var(--ink)', borderRadius: '0.75rem',
              boxShadow: 'var(--shadow-neo)', transform: 'rotate(3deg)',
              transition: 'transform 0.3s', cursor: 'default', textAlign: 'left',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '1rem', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '0.5rem',
              }}>
                <span style={{
                  fontFamily: 'var(--font-label)', fontSize: '0.7rem',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em',
                }}>AI Assistant</span>
                <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: '14px' }}>bolt</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{
                  background: 'var(--surface-container)', padding: '0.5rem',
                  borderRadius: '4px', fontSize: '10px', opacity: 0.7,
                }}>How does the loss function work?</div>
                <div style={{
                  background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)',
                  padding: '0.5rem', borderRadius: '4px', fontSize: '10px',
                  border: '1px solid rgba(121,42,226,0.2)',
                }}>It measures the distance between predicted and actual values using Cross-Entropy.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES BENTO GRID ── */}
        <section id="features" style={{ maxWidth: '1200px', margin: '8rem auto 0', padding: '0 1.5rem' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem',
          }}>
            {/* Feature 1: 7-col */}
            <div style={{
              gridColumn: 'span 7', background: 'var(--surface-container-lowest)',
              border: '2px solid var(--ink)', borderRadius: '0.75rem',
              padding: '2.5rem', boxShadow: 'var(--shadow-neo)',
            }}>
              <span style={{
                fontFamily: 'var(--font-label)', fontSize: '0.8rem', fontWeight: 700,
                color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '-0.02em',
              }}>Annotated Intelligence</span>
              <h2 style={{
                fontFamily: 'var(--font-headline)', fontSize: '2.25rem', fontWeight: 700,
                margin: '1rem 0 1.5rem',
              }}>
                AI that <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>reads the paper</span> with you
              </h2>
              <p style={{ color: 'var(--on-surface-variant)', maxWidth: '420px' }}>
                No more switching tabs to Wikipedia. Get instant definitions and context directly over the text.
              </p>
            </div>

            {/* Feature 2: 5-col Purple */}
            <div style={{
              gridColumn: 'span 5', background: 'var(--tertiary)', color: 'var(--on-tertiary)',
              border: '2px solid var(--ink)', borderRadius: '0.75rem',
              padding: '2.5rem', boxShadow: 'var(--shadow-neo)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div>
                <span style={{
                  fontFamily: 'var(--font-label)', fontSize: '0.8rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.8,
                }}>Interactive Dialogue</span>
                <h2 style={{
                  fontFamily: 'var(--font-headline)', fontSize: '2.25rem', fontWeight: 700,
                  margin: '1rem 0', color: '#fff',
                }}>
                  Ask <span style={{ fontStyle: 'italic', color: 'var(--tertiary-fixed)' }}>anything</span>
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '0.5rem',
                  border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.9rem',
                }}>"Can you explain the results section like I'm an undergraduate?"</div>
                <div style={{
                  background: 'rgba(255,255,255,0.2)', padding: '1rem', borderRadius: '0.5rem',
                  border: '1px solid rgba(255,255,255,0.4)', fontSize: '0.9rem',
                }}>"Certainly. In short: they found that the more data they added, the lower the error, but only up to a point..."</div>
              </div>
            </div>

            {/* Feature 3: Full-width green */}
            <div style={{
              gridColumn: 'span 12', background: 'var(--secondary-container)', color: 'var(--on-secondary-container)',
              border: '2px solid var(--ink)', borderRadius: '0.75rem',
              padding: '2.5rem', boxShadow: 'var(--shadow-neo)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3rem',
            }}>
              <div style={{ maxWidth: '560px' }}>
                <span style={{
                  fontFamily: 'var(--font-label)', fontSize: '0.8rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--secondary)',
                }}>Visual Synthesis</span>
                <h2 style={{
                  fontFamily: 'var(--font-headline)', fontSize: '2.75rem', fontWeight: 700,
                  margin: '1rem 0',
                }}>
                  One paper, <span style={{ fontStyle: 'italic' }}>infinite insights</span>
                </h2>
                <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                  Watch static text transform into living diagrams. Our engine parses methodology into logical flowcharts automatically.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" style={{ maxWidth: '1200px', margin: '10rem auto 0', padding: '0 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontFamily: 'var(--font-headline)', fontSize: '2.75rem', fontWeight: 800, marginBottom: '1rem',
            }}>How it works</h2>
            <div style={{ width: '6rem', height: '0.5rem', background: 'var(--primary)', margin: '0 auto' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2.5rem' }}>
            {[
              { num: '01', icon: 'link', title: 'Paste URL', desc: "Drop any arXiv or research link. We'll fetch the full text and process the citations immediately.", bg: 'var(--primary-container)' },
              { num: '02', icon: 'psychology', title: 'Analyze context', desc: 'Our AI reads through the paper, identifies key concepts, and generates plain-english annotations for every section.', bg: 'var(--secondary-container)' },
              { num: '03', icon: 'auto_awesome', title: 'Deep Focus', desc: 'Read without friction. Use the chat, hover for definitions, and see concepts visualized as you go.', bg: 'var(--tertiary-container)' },
            ].map(step => (
              <div key={step.num} style={{
                background: 'var(--surface-container-lowest)',
                border: '2px solid var(--ink)', borderRadius: '0.75rem',
                padding: '2rem', boxShadow: 'var(--shadow-neo)', position: 'relative',
              }}>
                <span style={{
                  fontFamily: 'var(--font-label)', fontSize: '3.5rem', fontWeight: 900,
                  color: 'rgba(26,28,27,0.08)', position: 'absolute', top: '1rem', right: '1.5rem',
                  fontStyle: 'italic',
                }}>{step.num}</span>
                <div style={{
                  width: '48px', height: '48px', background: step.bg,
                  borderRadius: '0.5rem', border: '2px solid var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1.5rem', boxShadow: 'var(--shadow-neo-sm)',
                }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--on-surface)' }}>{step.icon}</span>
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-headline)', fontSize: '1.5rem',
                  fontWeight: 700, marginBottom: '1rem',
                }}>{step.title}</h3>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAMOUS & RECENT PAPERS ── */}
        <section style={{ maxWidth: '1200px', margin: '10rem auto 0', padding: '0 1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
            {/* Famous Papers */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)' }}>star</span>
                <h2 style={{
                  fontFamily: 'var(--font-headline)', fontSize: '1.75rem', fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: '-0.02em',
                }}>Famous Papers</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {famousPapers.map(p => (
                  <button
                    key={p.title}
                    onClick={() => {
                      setUrl(p.url);
                    }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem',
                      background: 'var(--surface-container-lowest)',
                      border: '2px solid var(--ink)', borderRadius: '0.75rem',
                      padding: '1.5rem', boxShadow: 'var(--shadow-neo-sm)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                      width: '100%',
                    }}
                  >
                    <div>
                      <h4 style={{
                        fontFamily: 'var(--font-headline)', fontSize: '1.2rem',
                        fontWeight: 700, color: 'var(--tertiary)', marginBottom: '0.25rem',
                      }}>{p.title}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>{p.authors}</p>
                    </div>
                    <span className="material-symbols-outlined" style={{ color: 'var(--on-surface)' }}>arrow_forward</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recently Processed */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)' }}>schedule</span>
                <h2 style={{
                  fontFamily: 'var(--font-headline)', fontSize: '1.75rem', fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: '-0.02em',
                }}>Recently Processed</h2>
              </div>
              {recentPapers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {recentPapers.map(p => (
                    <button
                      key={p.paper_id}
                      onClick={() => onPaperIngested(p.paper_id, p.title)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'var(--surface-container-lowest)',
                        border: '2px solid var(--ink)', borderRadius: '0.75rem',
                        padding: '1.25rem', boxShadow: 'var(--shadow-neo-sm)',
                        cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s',
                      }}
                    >
                      <div>
                        <h4 style={{
                          fontFamily: 'var(--font-headline)', fontSize: '1rem',
                          fontWeight: 700, marginBottom: '0.25rem',
                        }}>{p.title}</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                          {Array.isArray(p.authors) ? p.authors.join(', ') : p.authors || ''}
                        </p>
                      </div>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{
                  height: '384px', background: 'var(--surface-container)',
                  border: '2px dashed var(--ink)', borderRadius: '1.5rem',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '3rem', boxShadow: 'var(--shadow-neo-sm)',
                }}>
                  <span className="material-symbols-outlined" style={{
                    fontSize: '2.5rem', color: 'var(--on-surface-variant)', opacity: 0.3, marginBottom: '1rem',
                  }}>history</span>
                  <p style={{
                    color: 'var(--on-surface-variant)', fontFamily: 'var(--font-body)',
                    fontSize: '1.1rem', maxWidth: '280px', textAlign: 'center',
                  }}>No recent papers found. Be the first to ingest one!</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ maxWidth: '1200px', margin: '10rem auto 5rem', padding: '0 1.5rem' }}>
          <div style={{
            background: 'var(--primary-container)', border: '2px solid var(--ink)',
            borderRadius: '1.5rem', padding: '5rem 3rem', textAlign: 'center',
            boxShadow: 'var(--shadow-neo-lg)', position: 'relative', overflow: 'hidden',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-headline)', fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 800, maxWidth: '800px', margin: '0 auto 2rem', position: 'relative', zIndex: 1,
            }}>
              Start reading smarter{' '}
              <span style={{
                fontStyle: 'italic', color: 'var(--primary)',
                textDecoration: 'underline', textDecorationColor: 'var(--ink)',
                textUnderlineOffset: '8px',
              }}>today</span>
            </h2>
            <p style={{
              fontSize: '1.2rem', color: 'rgba(26,28,27,0.7)', maxWidth: '520px',
              margin: '0 auto 3rem', position: 'relative', zIndex: 1,
            }}>
              Join researchers, students, and lifelong learners making sense of the frontier.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                padding: '1.25rem 3rem', background: 'var(--on-surface)', color: 'var(--surface)',
                borderRadius: '1rem', fontFamily: 'var(--font-label)', fontSize: '1.2rem',
                fontWeight: 700, textTransform: 'uppercase', border: 'none',
                boxShadow: 'var(--shadow-neo-lg)', cursor: 'pointer',
                transition: 'all 0.15s', position: 'relative', zIndex: 1,
              }}
            >
              Analyze Your First Paper
            </button>
            {/* Decorative circles */}
            <div style={{
              position: 'absolute', top: '-6rem', left: '-6rem',
              width: '16rem', height: '16rem', border: '2px solid rgba(26,26,26,0.1)',
              borderRadius: '50%',
            }}/>
            <div style={{
              position: 'absolute', bottom: '-6rem', right: '-6rem',
              width: '24rem', height: '24rem', border: '2px solid rgba(26,26,26,0.1)',
              borderRadius: '50%',
            }}/>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        background: 'var(--ink)', padding: '3rem 1.5rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem',
      }}>
        <div style={{
          width: '100%', maxWidth: '1400px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid rgba(209,197,177,0.2)', paddingBottom: '3rem',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{
              fontFamily: 'var(--font-headline)', fontWeight: 900,
              color: 'var(--paper)', fontSize: '1.5rem',
            }}>🔬 PaperLens</span>
            <span style={{
              fontFamily: 'var(--font-label)', fontSize: '0.8rem',
              color: 'var(--paper)', opacity: 0.7,
            }}>Academic Authority with a Human Pulse.</span>
          </div>
          <div style={{ display: 'flex', gap: '2.5rem' }}>
            {['Privacy', 'Terms', 'Support'].map(l => (
              <a key={l} href="#" style={{
                fontFamily: 'var(--font-label)', fontSize: '0.8rem',
                textTransform: 'uppercase', letterSpacing: '0.15em',
                color: 'var(--paper)', opacity: 0.7, textDecoration: 'none',
              }}>{l}</a>
            ))}
          </div>
        </div>
        <p style={{
          fontFamily: 'var(--font-label)', fontSize: '0.7rem',
          color: 'var(--paper)', opacity: 0.5,
        }}>© 2024 PaperLens AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
