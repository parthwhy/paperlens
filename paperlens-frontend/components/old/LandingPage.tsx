import { useState } from "react";

type LandingPageProps = {
  onSubmit: (arxivUrl: string) => void;
  isIngesting: boolean;
  ingestionStatus: string;
  error: string | null;
};

export default function LandingPage({
  onSubmit,
  isIngesting,
  ingestionStatus,
  error,
}: LandingPageProps) {
  const [arxivUrl, setArxivUrl] = useState("");

  const handleSubmit = () => {
    if (arxivUrl.trim()) {
      onSubmit(arxivUrl);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isIngesting) {
      handleSubmit();
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          background: #fafaf9;
          color: #1c1917;
          font-family: 'Inter', -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* Navbar */
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(250, 250, 249, 0.95);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid #e7e5e4;
        }

        .navbar-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 16px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .navbar-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 900;
          color: #0c0a09;
          letter-spacing: -0.02em;
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .navbar-link {
          font-size: 0.95rem;
          font-weight: 500;
          color: #57534e;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .navbar-link:hover {
          color: #0c0a09;
        }

        .navbar-button {
          padding: 10px 20px;
          background: #0c0a09;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-block;
        }

        .navbar-button:hover {
          background: #292524;
          transform: translateY(-1px);
        }

        /* Landing Container */
        .landing-container {
          min-height: calc(100vh - 64px);
          display: flex;
          flex-direction: column;
        }

        /* Hero Section */
        .hero-section {
          position: relative;
          text-align: center;
          max-width: 1200px;
          margin: 0 auto;
          padding: 120px 32px 80px;
          background: #fafaf9;
          animation: fadeInUp 0.8s ease;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          background: white;
          border: 1px solid #e7e5e4;
          border-radius: 20px;
          font-size: 0.85rem;
          color: #57534e;
          margin-bottom: 24px;
          font-weight: 500;
        }

        .hero-badge-icon {
          color: #2563eb;
        }

        .hero-headline {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 4rem;
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.025em;
          color: #0c0a09;
          margin-bottom: 48px;
          position: relative;
          z-index: 10;
        }

        @media (min-width: 768px) {
          .hero-headline {
            font-size: 4.5rem;
          }
        }

        .hero-headline .highlight {
          position: relative;
          display: inline-block;
        }

        .hero-headline .highlight::after {
          content: '';
          position: absolute;
          bottom: 8px;
          left: 0;
          right: 0;
          height: 12px;
          background: #fbbf24;
          opacity: 0.4;
          z-index: -1;
          border-radius: 4px;
        }

        .hero-subtitle {
          display: none;
        }

        /* Floating Preview Cards */
        .preview-card {
          position: absolute;
          background: white;
          border: 1px solid #e7e5e4;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          width: 280px;
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(var(--rotation)); }
          50% { transform: translateY(-20px) rotate(var(--rotation)); }
        }

        .preview-left {
          --rotation: -3deg;
          top: 50%;
          left: 40px;
          transform: translateY(-50%) rotate(-3deg);
          animation: floatLeft 6s ease-in-out infinite;
        }

        @keyframes floatLeft {
          0%, 100% { transform: translateY(-50%) rotate(-3deg) translateY(0); }
          50% { transform: translateY(-50%) rotate(-3deg) translateY(-20px); }
        }

        .preview-right {
          --rotation: 3deg;
          top: 50%;
          right: 40px;
          transform: translateY(-50%) rotate(3deg);
          animation: floatRight 6s ease-in-out infinite;
          animation-delay: 1s;
        }

        @keyframes floatRight {
          0%, 100% { transform: translateY(-50%) rotate(3deg) translateY(0); }
          50% { transform: translateY(-50%) rotate(3deg) translateY(-20px); }
        }

        .preview-header {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #2563eb;
          margin-bottom: 8px;
        }

        .preview-content {
          font-size: 0.85rem;
          line-height: 1.5;
          color: #57534e;
          background: #fafaf9;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e7e5e4;
        }

        /* Input Section */
        .input-section {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin: 0 auto;
          position: relative;
          z-index: 10;
        }

        .arxiv-input {
          width: 384px;
          padding: 12px 16px;
          font-size: 1rem;
          border: 1px solid #d6d3d1;
          border-radius: 12px;
          background: white;
          color: #1c1917;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s ease;
          outline: none;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .arxiv-input:focus {
          border-color: #0c0a09;
          box-shadow: 0 0 0 3px rgba(12, 10, 9, 0.1);
        }

        .arxiv-input::placeholder {
          color: #a8a29e;
        }

        .submit-button {
          padding: 12px 24px;
          font-size: 1rem;
          font-weight: 500;
          background: #0c0a09;
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          font-family: 'Inter', sans-serif;
        }

        .submit-button:hover:not(:disabled) {
          background: #292524;
        }

        .submit-button:active:not(:disabled) {
          transform: scale(0.98);
        }

        .submit-button:disabled {
          background: #d6d3d1;
          cursor: not-allowed;
        }

        .upload-hint {
          display: none;
        }

        /* Status Messages */
        .status-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px 24px;
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 10px;
          color: #92400e;
          font-size: 0.95rem;
          margin-top: 24px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #fde68a;
          border-top-color: #92400e;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-message {
          padding: 16px 24px;
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #991b1b;
          font-size: 0.95rem;
          margin-top: 24px;
          text-align: center;
        }

        /* Features Section */
        .features-section {
          background: #f5f5f4;
          padding: 100px 32px;
        }

        .features-container {
          max-width: 1280px;
          margin: 0 auto;
        }

        .features-label {
          font-family: 'Inter', monospace;
          font-size: 0.75rem;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #a8a29e;
          margin-bottom: 16px;
        }

        .features-heading {
          font-family: 'Playfair Display', serif;
          font-size: 2.25rem;
          font-weight: 700;
          color: #0c0a09;
          margin-bottom: 48px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .feature-card {
          background: white;
          border: 1px solid #e7e5e4;
          border-radius: 16px;
          padding: 32px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          animation: slideUp 0.6s ease;
          animation-fill-mode: both;
        }

        .feature-card:nth-child(1) { animation-delay: 0s; }
        .feature-card:nth-child(2) { animation-delay: 0.1s; }
        .feature-card:nth-child(3) { animation-delay: 0.2s; }
        .feature-card:nth-child(4) { animation-delay: 0.3s; }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .feature-card:hover:not(.coming-soon) {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .feature-card.coming-soon {
          opacity: 0.6;
          filter: grayscale(100%);
          cursor: not-allowed;
        }

        .feature-icon-wrapper {
          width: 40px;
          height: 40px;
          background: #0c0a09;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .feature-icon {
          width: 16px;
          height: 16px;
          color: white;
        }

        .feature-label {
          font-family: 'Inter', monospace;
          font-size: 0.75rem;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #78716c;
          margin-bottom: 12px;
        }

        .feature-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #0c0a09;
          margin-bottom: 16px;
          font-family: 'Playfair Display', serif;
          line-height: 1.2;
        }

        .feature-description {
          font-size: 1rem;
          line-height: 1.7;
          color: #57534e;
          margin-bottom: 24px;
        }

        .feature-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.95rem;
          font-weight: 500;
          color: #0c0a09;
          text-decoration: underline;
          text-underline-offset: 4px;
          transition: opacity 0.2s ease;
        }

        .feature-link:hover {
          opacity: 0.7;
        }

        .coming-soon-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          background: #fef3c7;
          color: #92400e;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 16px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Footer */
        .footer {
          padding: 40px 32px;
          border-top: 1px solid #e7e5e4;
          text-align: center;
        }

        .footer-text {
          font-size: 0.9rem;
          color: #78716c;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .preview-card {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .navbar-content {
            padding: 16px 24px;
          }

          .navbar-actions {
            gap: 16px;
          }

          .navbar-link {
            display: none;
          }

          .hero-section {
            padding: 80px 24px 60px;
          }

          .hero-headline {
            font-size: 2.75rem;
          }

          .hero-subtitle {
            font-size: 1.1rem;
          }

          .input-wrapper {
            flex-direction: column;
          }

          .features-section {
            padding: 60px 24px;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-logo">PaperLens</div>
          <div className="navbar-actions">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="navbar-link"
            >
              GitHub
            </a>
            <button className="navbar-button">Get Started</button>
          </div>
        </div>
      </nav>

      <div className="landing-container">
        {/* Hero Section */}
        <div className="hero-section">
          {/* Floating Preview Cards */}
          <div className="preview-card preview-left">
            <div className="preview-header">Tooltip Explain</div>
            <div className="preview-content">
              "This refers to the attention mechanism, which allows the model
              to focus on relevant parts of the input..."
            </div>
          </div>

          <div className="preview-card preview-right">
            <div className="preview-header">Chat Assistant</div>
            <div className="preview-content">
              Q: What is the main contribution?
              <br />
              <br />
              A: The paper introduces the Transformer architecture...
            </div>
          </div>

          {/* Badge */}
          <div className="hero-badge">
            <span className="hero-badge-icon">✦</span>
            <span>arXiv · PDF · Research Assistant</span>
          </div>

          {/* Headline */}
          <h1 className="hero-headline">
            Reading Academic Papers Was Never This{" "}
            <span className="highlight">Easy</span>
          </h1>

          {/* Input Section */}
          <div className="input-section">
            <input
              type="text"
              className="arxiv-input"
              placeholder="https://arxiv.org/abs/1706.03762"
              value={arxivUrl}
              onChange={(e) => setArxivUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isIngesting}
            />
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={isIngesting || !arxivUrl.trim()}
            >
              {isIngesting ? "Processing..." : "Analyze Paper"}
            </button>
          </div>

          {/* Status/Error Messages */}
          {isIngesting && (
            <div className="status-message">
              <div className="spinner" />
              <span>{ingestionStatus}</span>
            </div>
          )}

          {error && <div className="error-message">⚠️ {error}</div>}
        </div>

        {/* Features Section */}
        <section className="features-section">
          <div className="features-container">
            <div style={{ textAlign: 'center' }}>
              <div className="features-label">What PaperLens Does</div>
              <h2 className="features-heading">
                Everything you need to understand any paper
              </h2>
            </div>

            <div className="features-grid">
              {/* Feature 1 - Tooltip Explain */}
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <svg className="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="feature-label">Explain</div>
                <h3 className="feature-title">Hover to Understand</h3>
                <p className="feature-description">
                  Select any sentence in the paper and get an instant
                  plain-English explanation with analogies
                </p>
                <a href="#" className="feature-link">
                  Try it →
                </a>
              </div>

              {/* Feature 2 - Concept Map */}
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <svg className="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div className="feature-label">Structure</div>
                <h3 className="feature-title">See the Structure</h3>
                <p className="feature-description">
                  Auto-generated concept map showing how ideas connect across
                  the paper
                </p>
                <a href="#" className="feature-link">
                  Try it →
                </a>
              </div>

              {/* Feature 3 - Chat */}
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <svg className="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="feature-label">Converse</div>
                <h3 className="feature-title">Ask Anything</h3>
                <p className="feature-description">
                  Chat with the paper. Every answer references exact sections
                  you can jump to
                </p>
                <a href="#" className="feature-link">
                  Try it →
                </a>
              </div>

              {/* Feature 4 - Animated Explanation (Coming Soon) */}
              <div className="feature-card coming-soon">
                <span className="coming-soon-badge">Coming Soon</span>
                <div className="feature-icon-wrapper">
                  <svg className="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="feature-label">Animate</div>
                <h3 className="feature-title">Watch it Explained</h3>
                <p className="feature-description">
                  Manim-powered visual animations of key concepts
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <p className="footer-text">PaperLens · Built for researchers</p>
        </footer>
      </div>
    </>
  );
}
