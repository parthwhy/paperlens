import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import type { PaperMetadata, PaperChunk, ChatMessage, ConceptMapData, AnimationJob } from '../types';

interface FlatChunk {
  chunk_id: string;
  text: string;
  section?: string;
  page?: number;
}

interface Props {
  paperId: string | null;
  paperTitle: string;
  onBack: () => void;
  onSelectPaper: (paper: PaperMetadata) => void;
}

type RightTab = 'chat' | 'concept' | 'animate';

export function Workspace({ paperId, paperTitle, onBack, onSelectPaper }: Props) {
  const [rightTab, setRightTab] = useState<RightTab>('chat');
  const [chunks, setChunks] = useState<FlatChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(paperTitle);
  const [authors, setAuthors] = useState('');

  // Chat
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Concept Map
  const [conceptMap, setConceptMap] = useState<ConceptMapData | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<any>(null);
  const [conceptLoading, setConceptLoading] = useState(false);

  // Animation
  const [animJobs, setAnimJobs] = useState<{ concept: string; job: AnimationJob }[]>([]);
  const [animGenerating, setAnimGenerating] = useState(false);

  // Load paper details (title, authors)
  useEffect(() => {
    if (!paperId) return;
    api.getPaperDetails(paperId)
      .then(details => {
        if (details.title) setTitle(details.title);
        if (details.authors) {
          setAuthors(Array.isArray(details.authors) ? details.authors.join(', ') : String(details.authors));
        }
      })
      .catch(() => {});
  }, [paperId]);

  // Load paper chunks (API returns { sections: [{ section, chunks }] })
  useEffect(() => {
    if (!paperId) return;
    setLoading(true);
    api.getPaperChunks(paperId)
      .then((data: any) => {
        // Flatten the sections structure into a flat chunk list
        const sections = data.sections || [];
        const flat: FlatChunk[] = [];
        for (const sec of sections) {
          const sectionChunks = sec.chunks || [];
          for (const chunk of sectionChunks) {
            flat.push({
              chunk_id: chunk.chunk_id || chunk.id || `${sec.section}_${flat.length}`,
              text: chunk.text,
              section: sec.section,
              page: chunk.page,
            });
          }
        }
        // Also handle old format { chunks: [...] } as fallback
        if (flat.length === 0 && data.chunks) {
          setChunks(data.chunks);
        } else {
          setChunks(flat);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [paperId]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // ─── Chat ──────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim() || !paperId) return;
    const msg: ChatMessage = { role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, msg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await api.sendChatMessage(paperId, chatInput, chatHistory);
      setChatHistory(prev => [...prev, { role: 'assistant', content: res.answer, citations: res.citations }]);
    } catch {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
    }
    setChatLoading(false);
  };

  // ─── Concept Map ──────────────────
  const loadConceptMap = async () => {
    if (!paperId) return;
    setConceptLoading(true);
    try {
      const data = await api.getConceptMap(paperId);
      setConceptMap(data);
    } catch { }
    setConceptLoading(false);
  };

  useEffect(() => {
    if (rightTab === 'concept' && !conceptMap && paperId) {
      loadConceptMap();
    }
  }, [rightTab, paperId]);

  // ─── Animation ────────────────────
  const generateAnimation = async (concept: string) => {
    if (!paperId) return;
    setAnimGenerating(true);
    try {
      const { job_id } = await api.generateAnimation(paperId, concept);
      const newJob = { concept, job: { job_id, status: 'planning' as const } };
      setAnimJobs(prev => [...prev, newJob]);

      // Poll
      const poll = setInterval(async () => {
        try {
          const status = await api.getAnimationStatus(job_id);
          setAnimJobs(prev => prev.map(j =>
            j.job.job_id === job_id ? { ...j, job: status } : j
          ));
          if (status.status === 'ready' || status.status === 'failed') {
            clearInterval(poll);
          }
        } catch {
          clearInterval(poll);
        }
      }, 3000);
    } catch { }
    setAnimGenerating(false);
  };

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── TOP NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--paper)', borderBottom: '2px solid var(--ink)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onBack}
            className="neo-border neo-shadow-sm"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', borderRadius: '0.5rem',
              background: 'var(--surface-container-lowest)',
              fontFamily: 'var(--font-label)', fontSize: '0.8rem',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_back</span>
            Back
          </button>
          <h1 style={{
            fontFamily: 'var(--font-headline)', fontStyle: 'italic',
            fontSize: '1.25rem', fontWeight: 700, maxWidth: '400px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title || 'Research Paper'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['Read', 'Chat', 'Explore'] as const).map((label, i) => (
            <button key={label} style={{
              padding: '0.5rem 1.5rem', border: '2px solid var(--ink)',
              borderRadius: '0.5rem', fontFamily: 'var(--font-label)',
              fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase',
              letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.15s',
              background: i === 0 ? 'var(--primary-container)' : 'var(--surface-container-lowest)',
            }}>{label}</button>
          ))}
        </div>
      </nav>

      {/* ── MAIN SPLIT ── */}
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT: PDF Reader (60%) */}
        <section className="custom-scrollbar" style={{
          width: '60%', height: '100%', overflowY: 'auto',
          background: 'var(--surface)', padding: '4rem 3rem',
        }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            {paperId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <span className="neo-border" style={{
                  background: 'var(--primary-container)', padding: '0.25rem 0.75rem',
                  fontFamily: 'var(--font-label)', fontSize: '0.7rem', fontWeight: 700,
                  borderRadius: '9999px',
                }}>{paperId.substring(0, 12)}</span>
                <span style={{
                  color: 'var(--secondary)', fontFamily: 'var(--font-label)',
                  fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                }}>• Verified Source</span>
              </div>
            )}

            <h2 style={{
              fontFamily: 'var(--font-headline)', fontSize: '3rem', fontWeight: 800,
              lineHeight: 1.1, marginBottom: '1rem',
            }}>
              {title || 'Loading…'}
            </h2>

            {loading ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                color: 'var(--on-surface-variant)', padding: '4rem 0',
              }}>
                <span className="material-symbols-outlined animate-pulse-glow">hourglass_empty</span>
                Loading paper content…
              </div>
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '2rem',
                fontSize: '1.1rem', lineHeight: 1.8,
              }}>
                {authors && (
                  <p style={{
                    fontFamily: 'var(--font-label)', fontSize: '0.85rem',
                    color: 'var(--on-surface-variant)', marginBottom: '2rem',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                  }}>{authors}</p>
                )}
                {chunks.map((chunk, i) => {
                  // Show section heading only for the first chunk in each section
                  const prevSection = i > 0 ? chunks[i - 1].section : null;
                  const showSection = chunk.section && chunk.section !== prevSection;
                  return (
                    <div key={chunk.chunk_id || i}>
                      {showSection && (
                        <h3 style={{
                          fontFamily: 'var(--font-headline)', fontSize: '1.5rem',
                          fontWeight: 700, marginBottom: '0.75rem', fontStyle: 'italic',
                          color: 'var(--primary)', marginTop: i > 0 ? '2rem' : 0,
                        }}>{chunk.section}</h3>
                      )}
                      <p style={{ marginBottom: '0.75rem' }}>{chunk.text}</p>
                    </div>
                  );
                })}
                {chunks.length === 0 && (
                  <p style={{ color: 'var(--on-surface-variant)' }}>No content chunks found for this paper.</p>
                )}
              </div>
            )}
          </div>

          {/* Floating bottom toolbar */}
          <div style={{
            position: 'fixed', bottom: '2rem', left: '30%', transform: 'translateX(-50%)',
            display: 'flex', gap: '1rem', zIndex: 40,
          }}>
            <button
              onClick={() => { setRightTab('animate'); }}
              className="neo-border neo-shadow hover-lift"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.5rem', borderRadius: '9999px',
                background: 'var(--primary-container)', cursor: 'pointer',
                fontFamily: 'var(--font-label)', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}
            >
              <span className="material-symbols-outlined">movie</span>
              Animate
            </button>
            <button
              onClick={() => { setRightTab('concept'); }}
              className="neo-border neo-shadow hover-lift"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.5rem', borderRadius: '9999px',
                background: 'var(--surface-container-lowest)', cursor: 'pointer',
                fontFamily: 'var(--font-label)', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}
            >
              <span className="material-symbols-outlined">hub</span>
              Concept Map
            </button>
          </div>
        </section>

        {/* RIGHT: Tools Panel (40%) */}
        <aside style={{
          width: '40%', height: '100%', background: '#F0EDE6',
          borderLeft: '2px solid var(--ink)', display: 'flex', flexDirection: 'column',
        }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '2px solid var(--ink)' }}>
            {([
              { key: 'chat' as RightTab, icon: 'forum', label: 'Chat' },
              { key: 'concept' as RightTab, icon: 'hub', label: 'Concept' },
              { key: 'animate' as RightTab, icon: 'movie', label: 'Animate' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setRightTab(tab.key)}
                style={{
                  flex: 1, padding: '1rem', fontFamily: 'var(--font-label)',
                  fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase',
                  letterSpacing: '0.15em', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  background: rightTab === tab.key ? 'var(--primary-container)' : 'var(--surface-container-lowest)',
                  borderRight: '2px solid var(--ink)', border: 'none',
                  borderBottom: rightTab === tab.key ? '3px solid var(--primary)' : 'none',
                  transition: 'background 0.15s',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="custom-scrollbar" style={{
            flex: 1, overflowY: 'auto', padding: '1.5rem',
            display: 'flex', flexDirection: 'column', gap: '1.5rem',
          }}>
            {/* ─── CHAT TAB ─── */}
            {rightTab === 'chat' && (
              <>
                {chatHistory.length === 0 && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', flex: 1, opacity: 0.5, textAlign: 'center',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '3rem', marginBottom: '1rem' }}>forum</span>
                    <p style={{ fontFamily: 'var(--font-body)' }}>Ask anything about this paper…</p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className="animate-fade-in" style={{
                    maxWidth: '85%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}>
                    <div className="neo-border neo-shadow-sm" style={{
                      padding: '1rem', borderRadius: '0.75rem',
                      background: msg.role === 'user' ? 'var(--primary-container)' : 'var(--surface-container-lowest)',
                    }}>
                      <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{msg.content}</p>
                      {msg.citations && msg.citations.length > 0 && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {msg.citations.map((c, j) => (
                            <span key={j} className="neo-border" style={{
                              padding: '2px 8px', background: 'var(--secondary-container)',
                              color: 'var(--on-secondary-container)', fontSize: '10px',
                              fontFamily: 'var(--font-label)', fontWeight: 700, borderRadius: '9999px',
                            }}>CIT: {c.section || `Page ${c.page}`}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ alignSelf: 'flex-start', opacity: 0.6 }}>
                    <span className="material-symbols-outlined animate-pulse-glow">more_horiz</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}

            {/* ─── CONCEPT TAB ─── */}
            {rightTab === 'concept' && (
              <>
                {conceptLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', padding: '4rem 0' }}>
                    <span className="material-symbols-outlined animate-pulse-glow">hub</span>
                    <span>Loading concept map…</span>
                  </div>
                ) : conceptMap ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{
                        fontFamily: 'var(--font-label)', fontSize: '0.7rem',
                        fontWeight: 700, textTransform: 'uppercase',
                      }}>
                        {conceptMap.nodes.length} Concepts • {conceptMap.edges.length} Relations
                      </span>
                      <button onClick={loadConceptMap} style={{
                        fontFamily: 'var(--font-label)', fontSize: '0.7rem',
                        fontWeight: 700, color: 'var(--primary)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        textDecoration: 'underline',
                      }}>Regenerate</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {conceptMap.nodes.map(node => (
                        <button
                          key={node.id}
                          onClick={() => setSelectedConcept(selectedConcept?.id === node.id ? null : node)}
                          className="neo-border"
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '0.75rem 1rem', borderRadius: '0.75rem',
                            background: selectedConcept?.id === node.id ? 'var(--primary-container)' : 'var(--surface-container-lowest)',
                            boxShadow: selectedConcept?.id === node.id ? 'none' : 'var(--shadow-neo-sm)',
                            transform: selectedConcept?.id === node.id ? 'translate(2px, 2px)' : 'none',
                            cursor: 'pointer', textAlign: 'left', width: '100%',
                            transition: 'all 0.15s',
                          }}
                        >
                          <span style={{
                            fontFamily: 'var(--font-headline)', fontWeight: 700,
                            fontStyle: 'italic', fontSize: '1rem',
                          }}>{node.label}</span>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px', opacity: 0.4 }}>
                            {selectedConcept?.id === node.id ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                      ))}
                    </div>
                    {/* Selected concept detail panel */}
                    {selectedConcept && (
                      <div className="animate-fade-in" style={{
                        marginTop: '1.5rem', padding: '1.5rem',
                        background: 'var(--surface-container-lowest)',
                        border: '2px solid var(--ink)', borderRadius: '0.75rem',
                        boxShadow: 'var(--shadow-neo)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                          <div>
                            <span style={{
                              display: 'inline-block', background: 'var(--tertiary-container)',
                              color: 'var(--on-tertiary-container)', border: '1px solid var(--ink)',
                              padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
                              fontFamily: 'var(--font-label)', fontWeight: 700,
                              textTransform: 'uppercase', marginBottom: '0.5rem',
                            }}>AI Synthesized</span>
                            <h3 style={{
                              fontFamily: 'var(--font-headline)', fontWeight: 900,
                              fontSize: '1.75rem', fontStyle: 'italic',
                            }}>{selectedConcept.label}</h3>
                          </div>
                        </div>
                        <p style={{
                          fontSize: '1rem', lineHeight: 1.7, color: 'rgba(26,28,27,0.9)',
                          marginBottom: '1.5rem',
                        }}>
                          {selectedConcept.description || selectedConcept.explanation || 'No description available.'}
                        </p>
                        {/* Animate button */}
                        <div style={{
                          background: 'var(--ink)', color: 'var(--surface)',
                          padding: '1.5rem', borderRadius: '0.75rem',
                          boxShadow: 'var(--shadow-neo)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{
                              width: '48px', height: '48px', background: 'var(--tertiary)',
                              borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '1.75rem' }}>movie_filter</span>
                            </div>
                            <div>
                              <h4 style={{
                                fontFamily: 'var(--font-headline)', fontWeight: 700,
                                fontSize: '1.25rem', fontStyle: 'italic',
                                color: 'var(--primary-container)',
                              }}>Visualize Logic</h4>
                              <p style={{
                                fontSize: '0.7rem', fontFamily: 'var(--font-label)', opacity: 0.7,
                              }}>Generate Manim mathematical animation</p>
                            </div>
                          </div>
                          <button
                            onClick={() => generateAnimation(selectedConcept.label)}
                            disabled={animGenerating}
                            style={{
                              width: '100%', padding: '1rem',
                              background: 'var(--primary-container)', color: 'var(--ink)',
                              border: '2px solid #fff', borderRadius: '0.5rem',
                              fontFamily: 'var(--font-label)', fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.15em',
                              cursor: animGenerating ? 'wait' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                              transition: 'background 0.15s', opacity: animGenerating ? 0.7 : 1,
                            }}
                          >
                            <span className="material-symbols-outlined">play_circle</span>
                            🎬 Generate Animation
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', flex: 1, opacity: 0.5,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '3rem', marginBottom: '1rem' }}>hub</span>
                    <p>No concept map loaded.</p>
                    <button onClick={loadConceptMap} style={{
                      marginTop: '1rem', padding: '0.5rem 1rem',
                      background: 'var(--primary-container)', border: '2px solid var(--ink)',
                      borderRadius: '0.5rem', cursor: 'pointer',
                      fontFamily: 'var(--font-label)', fontWeight: 700,
                    }}>Load Concept Map</button>
                  </div>
                )}
              </>
            )}

            {/* ─── ANIMATE TAB ─── */}
            {rightTab === 'animate' && (
              <>
                {animJobs.length === 0 ? (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', flex: 1, opacity: 0.5, textAlign: 'center',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '3rem', marginBottom: '1rem' }}>movie</span>
                    <p>No animations yet. Select a concept and hit "Generate Animation".</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {animJobs.map((aj, i) => (
                      <div key={i} className="neo-border" style={{
                        padding: '1rem', borderRadius: '0.75rem',
                        background: 'var(--surface-container-lowest)',
                        boxShadow: 'var(--shadow-neo-sm)',
                      }}>
                        <h4 style={{
                          fontFamily: 'var(--font-headline)', fontWeight: 700,
                          fontStyle: 'italic', marginBottom: '0.5rem',
                        }}>{aj.concept}</h4>
                        {aj.job.status === 'ready' && aj.job.video_url ? (
                          <video
                            src={`http://127.0.0.1:8000${aj.job.video_url}`}
                            controls
                            style={{
                              width: '100%', borderRadius: '0.5rem',
                              border: '2px solid var(--ink)',
                            }}
                          />
                        ) : aj.job.status === 'failed' ? (
                          <p style={{ color: 'var(--error)', fontSize: '0.85rem' }}>
                            ❌ Failed: {aj.job.error || 'Unknown error'}
                          </p>
                        ) : (
                          <div style={{
                            aspectRatio: '16/9', background: 'var(--ink)',
                            borderRadius: '0.75rem', border: '2px solid var(--ink)',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                          }}>
                            <div className="neo-border" style={{
                              width: '48px', height: '48px', borderRadius: '50%',
                              background: 'var(--primary-container)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <span className="material-symbols-outlined">play_arrow</span>
                            </div>
                            <span style={{
                              fontFamily: 'var(--font-label)', fontSize: '0.7rem',
                              color: '#fff', fontWeight: 700, letterSpacing: '0.15em',
                            }} className="animate-pulse-glow">
                              {aj.job.status === 'planning' ? '📋 PLANNING...' :
                               aj.job.status === 'coding' ? '💻 CODING...' :
                               '🎬 RENDERING WITH MANIM...'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Chat input (only show when chat tab is active) */}
          {rightTab === 'chat' && (
            <div style={{
              padding: '1.5rem', background: 'var(--surface-container-lowest)',
              borderTop: '2px solid var(--ink)',
            }}>
              <div style={{ position: 'relative' }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder={`Ask about '${title}'...`}
                  style={{
                    width: '100%', padding: '1rem 3.5rem 1rem 1.5rem',
                    border: '2px solid var(--ink)', borderRadius: '0.75rem',
                    background: 'var(--surface)', fontFamily: 'var(--font-body)',
                    fontSize: '0.9rem', transition: 'all 0.15s',
                  }}
                />
                <button
                  onClick={sendChat}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    width: '40px', height: '40px', background: 'var(--on-surface)',
                    color: 'var(--surface)', borderRadius: '0.5rem', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
