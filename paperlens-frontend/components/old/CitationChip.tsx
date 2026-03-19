import { Citation } from "@/app/page";

type CitationChipProps = {
  number: number;
  citation: Citation;
  onClick: () => void;
};

export default function CitationChip({
  number,
  citation,
  onClick,
}: CitationChipProps) {
  return (
    <>
      <style>{`
        .citation-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: white;
          border: 1px solid #d6d3d1;
          border-radius: 6px;
          font-size: 0.75rem;
          color: #57534e;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }

        .citation-chip:hover {
          border-color: #0c0a09;
          background: #fafaf9;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .citation-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          background: #0c0a09;
          color: white;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .citation-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .citation-section {
          font-weight: 500;
          color: #1c1917;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .citation-page {
          font-size: 0.7rem;
          color: #78716c;
        }
      `}</style>

      <div className="citation-chip" onClick={onClick} title={citation.text}>
        <div className="citation-number">{number}</div>
        <div className="citation-info">
          <div className="citation-section">{citation.section}</div>
          <div className="citation-page">Page {citation.page}</div>
        </div>
      </div>
    </>
  );
}
