"use client";

import { useState } from "react";
import { AlertCircle, Wrench, X } from "lucide-react";
import { useTranslations } from "next-intl";

const EXIT_DURATION = 180;
const DETAILS_MIN_LENGTH = 5;
export default function NeedRepairModal({
  item,
  repairableSpecs,
  initialSpecIds = [],
  initialDetails = "",
  onClose,
  onConfirm,
}) {
  const t = useTranslations("manageItem");

  const [checkedIds, setCheckedIds] = useState([]);
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  function handleClose() {
    if (loading || closing) return;
    setClosing(true);
    window.setTimeout(() => onClose(), EXIT_DURATION);
  }

  function toggleSpec(id) {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedDetails = details.trim();

    // FR-REP-07/08/09: detail wajib HANYA kalau tidak ada checkbox
    // yang dicentang.
    if (checkedIds.length === 0 && trimmedDetails.length < DETAILS_MIN_LENGTH) {
      setError(t("repairDetailsRequired", { length: DETAILS_MIN_LENGTH }));
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onConfirm({ specIds: checkedIds, details: trimmedDetails });
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
        className={`assetra-modal-overlay ${closing ? "is-closing" : ""}`}
        onClick={loading || closing ? undefined : handleClose}
      />

      <div className="assetra-modal-wrapper">
        <div
          className={`assetra-modal-card assetra-modal-card--sm ${closing ? "is-closing" : ""}`}
        >
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <span className="assetra-icon-badge assetra-icon-badge--warning">
                <Wrench size={18} strokeWidth={1.9} />
              </span>

              <h2 className="text-base font-semibold text-[var(--color-white)]">
                {t("needRepairTitle")}
              </h2>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={loading || closing}
              aria-label={t("close")}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-white)] transition disabled:opacity-50"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>

          {/* A. Informasi barang (read-only) */}
          <div className="mt-4 mb-5 ml-[46px]">
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {item?.name}
            </p>
            <p className="text-xs font-mono uppercase text-[var(--color-text-muted)]">
              {item?.id}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* B. Bagian yang bermasalah */}
            {repairableSpecs.length > 0 && (
              <div>
                <label className="assetra-form-label">
                  {t("whatsWrong")}
                </label>

                <div className="flex flex-col gap-1.5">
                  {repairableSpecs.map((spec) => (
                    <label
                      key={spec.id}
                      className="flex items-center gap-2.5 rounded-lg border border-[var(--assetra-border)] px-3 py-2 cursor-pointer hover:border-[var(--assetra-border-hover)] transition"
                    >
                      <input
                        type="checkbox"
                        checked={checkedIds.includes(spec.id)}
                        onChange={() => toggleSpec(spec.id)}
                        disabled={loading}
                        className="h-4 w-4 accent-[var(--assetra-primary)]"
                      />
                      <span className="text-sm text-[var(--color-text)]">
                        {spec.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* C. Detail masalah */}
            <div>
              <label className="assetra-form-label">
                {t("repairDetails")}{" "}
                {checkedIds.length === 0 && (
                  <span className="text-[var(--color-danger)]">*</span>
                )}
              </label>

              <textarea
                value={details}
                onChange={(e) => {
                  setDetails(e.target.value);
                  setError("");
                }}
                placeholder={t("repairDetailsPlaceholder")}
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
                onClick={handleClose}
                disabled={loading || closing}
                className="assetra-btn assetra-btn-secondary flex-1"
              >
                {t("cancel")}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="assetra-btn assetra-btn-primary flex-1"
              >
                {loading ? t("saving") : t("confirmNeedRepair")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}