"use client";
import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";

const EXIT_DURATION = 180;
export default function CategoryDeleteModal({ category, onClose, onConfirm }) {
  const t = useTranslations("manageCategory");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  function handleClose() {
    if (loading || closing) return;
    setClosing(true);
    window.setTimeout(() => {
      onClose();
    }, EXIT_DURATION);
  }

  async function handleConfirm() {
    if (loading || closing) return;

    setLoading(true);
    setError("");

    try {
      await onConfirm();

      handleClose();
    } catch (err) {
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
        onClick={loading || closing ? undefined : handleClose}
      />
      <div className="assetra-modal-wrapper">
        <div
          className={`assetra-modal-card assetra-modal-card--sm ${
            closing ? "is-closing" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold text-[var(--color-text)]">
              {t("deleteCategoryTitle")}
            </h2>

            <button
              type="button"
              onClick={handleClose}
              disabled={loading || closing}
              aria-label={t("close")}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 flex gap-3 rounded-xl border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/10 p-4">
            <div className="assetra-icon-badge assetra-icon-badge--warning shrink-0">
              <AlertTriangle size={18} strokeWidth={2} />
            </div>

            <p className="text-sm text-[var(--color-text)]">
              {t("deleteCategoryConfirm", {
                name: category.category_name,
              })}
            </p>
          </div>

          {error && <div className="assetra-error-box mt-3">{error}</div>}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading || closing}
              className="assetra-btn assetra-btn-secondary"
            >
              {t("cancel")}
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || closing}
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
