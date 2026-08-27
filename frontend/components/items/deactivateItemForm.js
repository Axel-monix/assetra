"use client";
import { useState } from "react";
import { PackageX, AlertCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import colors from "@/lib/colors";

const REASON_MIN_LENGTH = 5;

export default function DeactivateItemForm({ count = 1, onClose, onConfirm }) {
  const t = useTranslations("manageItem");

  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedReason = reason.trim();

    if (trimmedReason.length < REASON_MIN_LENGTH) {
      setError(
        t("reasonTooShort", {
          length: REASON_MIN_LENGTH,
        }),
      );

      return;
    }

    setLoading(true);
    setError("");

    try {
      await onConfirm(trimmedReason);
      onClose();
    } catch (err) {
      setError(err.message || t("statusChangeFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        className="assetra-modal-overlay"
        onClick={loading ? undefined : onClose}
      />

      <div className="assetra-modal-wrapper">
        <div className="assetra-modal-card assetra-modal-card--sm">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <span className="assetra-icon-badge assetra-icon-badge--warning">
                <PackageX size={18} strokeWidth={1.9} />
              </span>

              <h2 className="text-base font-semibold text-[var(--color-white)]">
                {t("deactivate")}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label={t("close")}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-white)] transition disabled:opacity-50"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>

          <p className="mb-5 ml-[46px] text-sm text-[var(--color-text-secondary)]">
            {t("markUnavailableDescription", {
              count,
            })}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="assetra-form-label">
                {t("reasonForStatusChange")}{" "}
                <span className="text-[var(--color-danger)]">*</span>
              </label>

              <textarea
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setError("");
                }}
                placeholder={t("reasonPlaceholder")}
                rows={3}
                autoFocus
                disabled={loading}
                className="assetra-form-input"
              />
            </div>

            {error && (
              <div className="assetra-error-box">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="assetra-btn assetra-btn-secondary flex-1"
              >
                {t("cancel")}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="assetra-btn assetra-btn-danger flex-1"
                style={{
                  backgroundColor: colors.danger,
                  color: colors.white,
                }}
              >
                {loading ? t("saving") : t("deactivate")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
