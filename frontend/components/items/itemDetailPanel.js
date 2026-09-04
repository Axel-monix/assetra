"use client";

import { useState } from "react";
import { X, Pencil, PackageX, Wrench } from "lucide-react";
import { FONTS } from "@/lib/constants";
import { getAssetStatusLabelKey, getAssetStatusStyle } from "@/lib/assetStatus";
import { useTranslations } from "next-intl";
import colors from "@/lib/colors";

export default function ItemDetailPanel({ item, onClose, onEdit, onDelete }) {
  const t = useTranslations("itemDetail");
  const [closing, setClosing] = useState(false);

  if (!item) return null;

  function handleClose() {
    if (closing) return;

    setClosing(true);
    window.setTimeout(onClose, 180);
  }

  const statusKey = getAssetStatusLabelKey(item.status);

  const statusLabel = statusKey
    ? t(statusKey, {
        defaultValue: item.status,
      })
    : item.status;

  const statusStyle = getAssetStatusStyle(item.status);

  return (
    <aside
      className={`assetra-detail-panel w-80 shrink-0 border-l border-[var(--color-border)] bg-[var(--color-background)] p-5 overflow-y-auto ${closing ? "is-closing" : ""}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">{t("title")}</h2>

        <button
          type="button"
          onClick={handleClose}
          aria-label={t("close")}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-white)] transition"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>

      <div className="aspect-video rounded-lg bg-gradient-to-br from-[var(--color-media-start)] to-[var(--color-input)] flex items-center justify-center mb-4 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span aria-hidden="true" className="text-4xl opacity-30">
            📦
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-1 gap-2">
        <h3 className="text-base font-semibold text-[var(--color-primary)] truncate">
          {item.name}
        </h3>

        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${statusStyle}`}
        >
          {statusLabel}
        </span>
      </div>

      <p
        className={`${FONTS.CODE} mb-5 text-xs text-[var(--color-text-muted)]`}
      >
        {item.id}
      </p>

      {item.status === "needs_repair" && item.repair && (
        <div className="mb-5 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-warning)]">
            <Wrench size={15} strokeWidth={1.9} />
            {t("repairMarked")}
          </div>
          {item.repair.specifications?.length > 0 && (
            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
              {item.repair.specifications.map((spec) => spec.name).join(", ")}
            </p>
          )}
          {item.repair.details && (
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              {item.repair.details}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-lg border border-[var(--color-border)] p-3">
          <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
            {t("category")}
          </div>

          <div className="text-sm">{item.category || "-"}</div>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] p-3">
          <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
            {t("location")}
          </div>

          <div className="text-sm">{item.location || "-"}</div>
        </div>
      </div>

      {item.description && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
            {t("description")}
          </h4>

          <p
            className={`${FONTS.DESCRIPTION} text-sm text-[var(--color-text-secondary)]`}
          >
            {item.description}
          </p>
        </div>
      )}

      {item.specs && item.specs.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
            {t("specifications")}
          </h4>

          <div className="flex flex-col gap-1.5">
            {item.specs.map((spec) => (
              <div
                key={spec.id_specification}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span
                  title={spec.name}
                  className="text-[var(--color-text-muted)] shrink-0 max-w-[45%] truncate"
                >
                  {spec.name}
                </span>

                <span
                  title={spec.value}
                  className={`${FONTS.DESCRIPTION} min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-right`}
                >
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {item.treatmentHistory && item.treatmentHistory.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
            {t("treatmentHistory")}
          </h4>

          <div className="flex flex-col gap-3">
            {item.treatmentHistory.map((entry, index) => (
              <div key={index} className="flex gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />

                <div>
                  <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide">
                    {entry.date}
                  </p>

                  <p className="text-sm">{entry.title}</p>

                  <p className="text-xs text-[var(--color-text-muted)]">
                    {entry.meta}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="assetra-btn assetra-btn-secondary flex-1 flex items-center justify-center gap-1.5"
        >
          <Pencil size={16} strokeWidth={1.75} />

          {t("edit")}
        </button>

        <button
          type="button"
          onClick={() => onDelete([item.id])}
          className="assetra-btn flex-1 flex items-center justify-center gap-1.5"
          style={{
            backgroundColor: colors.danger,
            color: colors.white,
          }}
        >
          <PackageX size={16} strokeWidth={1.75} />

          {t("deactivate")}
        </button>
      </div>
    </aside>
  );
}
