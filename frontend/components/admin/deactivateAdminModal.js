"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";

const STEP_FORM = "form";
const STEP_CONFIRM = "confirm";
const EXIT_DURATION = 180; // harus sama persis dengan durasi animasi exit di globals.css

export default function DeactivateAdminModal({ admin, onClose, onConfirm }) {
  const t = useTranslations("manageAdmin");
  const [step, setStep] = useState(STEP_FORM);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (submitting) return;
    setClosing(true);
    setTimeout(onClose, EXIT_DURATION);
  }, [onClose, submitting]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleClose]);

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err) {
      setError(err.message || t("statusUpdateFailed"));
      setStep(STEP_FORM);
    } finally {
      setSubmitting(false);
    }
  }

  if (!admin) return null;

  return (
    <>
      <div
        className={`assetra-modal-overlay ${closing ? "is-closing" : ""}`}
        onClick={handleClose}
      />
      <div className="assetra-modal-wrapper">
        <div
          className={`assetra-modal-card assetra-modal-card--sm ${closing ? "is-closing" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          {step === STEP_FORM ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  {t("deactivateTitle")}
                </h2>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {t("deactivateSubtitle", { name: admin.name })}
              </p>

              <div className="mt-5">
                <label className="assetra-form-label">{t("reasonLabel")}</label>
                <textarea
                  className="assetra-form-input min-h-[96px] resize-none"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("reasonPlaceholder")}
                  autoFocus
                />
              </div>

              {error && <div className="assetra-error-box mt-3">{error}</div>}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button type="button" onClick={handleClose} className="assetra-btn assetra-btn-secondary">
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  disabled={!reason.trim()}
                  onClick={() => setStep(STEP_CONFIRM)}
                  className="assetra-btn assetra-btn-primary"
                >
                  {t("deactivate")}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-[var(--color-text)]">
                {t("deactivateTitle")}
              </h2>

              <div className="mt-4 flex gap-3 rounded-xl border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/10 p-4">
                <div className="assetra-icon-badge assetra-icon-badge--warning shrink-0">
                  <AlertTriangle size={18} strokeWidth={2} />
                </div>
                <div className="text-sm text-[var(--color-text)]">
                  <p className="font-semibold">{t("finalConfirmation")}</p>
                  <p className="mt-1 text-[var(--color-text-secondary)]">
                    {t("finalConfirmationQuestion", { name: admin.name })}{" "}
                    <span className="italic font-semibold text-[var(--color-text)]">
                      {reason}
                    </span>
                    ?
                  </p>
                </div>
              </div>

              {error && <div className="assetra-error-box mt-3">{error}</div>}

              <div className="mt-6 flex items-center justify-between gap-3">
                <button type="button" onClick={() => setStep(STEP_FORM)} className="assetra-btn assetra-btn-secondary">
                  {t("cancel")}
                </button>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setStep(STEP_FORM)} className="assetra-btn assetra-btn-secondary">
                    {t("no")}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="assetra-btn assetra-btn-danger-soft"
                  >
                    {submitting ? t("submitting") : t("yes")}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}