"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  showingLabel,
}) {
  if (totalPages <= 1) {
    return showingLabel ? (
      <div className="assetra-pagination">
        <span className="assetra-pagination-info">{showingLabel}</span>
      </div>
    ) : null;
  }

  return (
    <div className="assetra-pagination">
      {showingLabel && (
        <span className="assetra-pagination-info">{showingLabel}</span>
      )}

      <div className="assetra-pagination-controls">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="assetra-pagination-nav"
        >
          <ChevronLeft size={16} strokeWidth={2} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`assetra-pagination-page ${p === page ? "is-active" : ""}`}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="assetra-pagination-nav"
        >
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
