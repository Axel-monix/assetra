"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";

const EXIT_DURATION = 180;

/**
 * props:
 *  - category: { id, category_name }
 *  - onClose()
 *  - onConfirm() -> Promise
 */
export default function CategoryDeleteModal({ category, onClose, onConfirm }) {
  const t = useTranslations("manageCategory");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  function handleClose() {
    if (loading || closing) return;
    setClosing(true);
    window.setTimeout(() => onClose(), EXIT_DURATION);
  }

  async function handleConfirm() {
    setError("");
    setLoading(true);

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      // err.message di sini biasanya berisi pesan "kategori masih
      // digunakan oleh N item" dari backend (409 categoryInUse).
      setError(err.message || t("deleteFailed"));
    } finally {
      setLoading(false);
    }
  }

  if (!category) return null;

  return (
    <>
      <div
        className={`assetra-modal-overlay ${closing ? "is-closing" : ""}`}
        onClick={handleClose}
      />

      <div className="assetra-modal-wrapper">
        <div
          className={`assetra-modal-card assetra-modal-card--sm ${closing ? "is-closing" : ""}`}
        >
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold text-[var(--color-text)]">
              {t("deleteCategoryTitle")}
            </h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 flex gap-3 rounded-xl border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/10 p-4">
            <div className="assetra-icon-badge assetra-icon-badge--warning shrink-0">
              <AlertTriangle size={18} strokeWidth={2} />
            </div>
            <p className="text-sm text-[var(--color-text)]">
              {t("deleteCategoryConfirm", { name: category.category_name })}
            </p>
          </div>

          {error && <div className="assetra-error-box mt-3">{error}</div>}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="assetra-btn assetra-btn-secondary"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="assetra-btn assetra-btn-danger-soft"
            >
              {loading ? t("deleting") : t("deleteCategory")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}