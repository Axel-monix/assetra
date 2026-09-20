"use client";

import { Printer, Trash2, X, CheckSquare, Square } from "lucide-react";
import { useTranslations } from "next-intl";

export default function BulkActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onPrintQr,
  onDeactivate,
  onClose,
}) {
  const t = useTranslations("bulkAction");

  if (selectedCount === 0) return null;

  const isAllSelected = totalCount > 0 && selectedCount >= totalCount;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex max-w-[94vw] items-center gap-2 sm:gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/95 px-3.5 py-2.5 sm:px-5 sm:py-3 shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--color-text)]">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-[var(--color-primary-contrast)]">
          {selectedCount}
        </span>
        <span className="hidden sm:inline">
          {t("selectedItems", {
            count: selectedCount,
            plural: selectedCount > 1 ? "s" : "",
          })}
        </span>
      </div>

      <div className="h-4 w-px bg-[var(--color-border)]" />

      {/* Select All / Deselect All toggle */}
      <button
        type="button"
        onClick={isAllSelected ? onDeselectAll : onSelectAll}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-input)] hover:text-[var(--color-text)] transition"
      >
        {isAllSelected ? (
          <>
            <CheckSquare
              size={15}
              strokeWidth={2}
              className="text-[var(--color-primary)]"
            />
            <span>{t("deselectAll")}</span>
          </>
        ) : (
          <>
            <Square size={15} strokeWidth={2} />
            <span>{t("selectAll")}</span>
          </>
        )}
      </button>

      <div className="h-4 w-px bg-[var(--color-border)]" />

      <button
        type="button"
        onClick={onPrintQr}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs sm:text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition"
      >
        <Printer size={15} strokeWidth={1.8} />
        <span>{t("printQr")}</span>
      </button>

      <button
        type="button"
        onClick={onDeactivate}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs sm:text-sm font-medium text-[var(--color-danger)] hover:text-[var(--color-danger-hover)] transition"
      >
        <Trash2 size={15} strokeWidth={1.8} />
        <span>{t("deactivate")}</span>
      </button>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="ml-1 rounded-full p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-input)] hover:text-[var(--color-white)] transition"
      >
        <X size={16} strokeWidth={1.9} />
      </button>
    </div>
  );
}
