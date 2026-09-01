"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Generic numbered pagination — style-nya full dari globals.css
 * (.assetra-pagination-*), bukan hardcoded Tailwind color classes.
 * Sengaja ditaruh di components/common, bukan components/history,
 * karena dipakai lintas halaman (History, Manage Admin, dst).
 *
 * Props:
 * - page: halaman aktif (1-based)
 * - totalPages: total halaman
 * - onPageChange: (nextPage: number) => void
 * - showingLabel: string hasil t("showing", {...}) dari caller
 */
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