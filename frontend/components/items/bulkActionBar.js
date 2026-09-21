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
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex w-max max-w-[calc(100vw-1rem)] flex-wrap items-center justify-center gap-x-1 gap-y-1 sm:flex-nowrap sm:gap-3 rounded-xl sm:rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/95 px-2 py-2 sm:px-5 sm:py-3 shadow-2xl backdrop-blur-md">
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 pl-0.5 text-[10px] sm:text-sm font-semibold text-[var(--color-text)]">
        <span className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[9px] sm:text-[10px] font-bold text-[var(--color-primary-contrast)]">
          {selectedCount}
        </span>
        <span className="hidden sm:inline">
          {t("selectedItems", {
            count: selectedCount,
            plural: selectedCount > 1 ? "s" : "",
          })}
        </span>
      </div>

      <div className="hidden sm:block h-4 w-px shrink-0 bg-[var(--color-border)]" />

      {/* Select All / Deselect All toggle */}
      <button
        type="button"
        onClick={isAllSelected ? onDeselectAll : onSelectAll}
        className="flex shrink-0 items-center gap-1 sm:gap-1.5 whitespace-nowrap rounded-lg px-1 py-1 sm:px-2 text-[10px] sm:text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-input)] hover:text-[var(--color-text)] transition"
      >
        {isAllSelected ? (
          <>
            <CheckSquare
              strokeWidth={2}
              className="h-3.5 w-3.5 sm:h-[15px] sm:w-[15px] text-[var(--color-primary)]"
            />
            <span>{t("deselectAll")}</span>
          </>
        ) : (
          <>
            <Square
              strokeWidth={2}
              className="h-3.5 w-3.5 sm:h-[15px] sm:w-[15px]"
            />
            <span>{t("selectAll")}</span>
          </>
        )}
      </button>

      <div className="hidden sm:block h-4 w-px shrink-0 bg-[var(--color-border)]" />

      <button
        type="button"
        onClick={onPrintQr}
        className="flex shrink-0 items-center gap-1 sm:gap-1.5 whitespace-nowrap rounded-lg px-1 py-1 sm:px-2 text-[10px] sm:text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition"
      >
        <Printer
          strokeWidth={1.8}
          className="h-3.5 w-3.5 sm:h-[15px] sm:w-[15px]"
        />
        <span>{t("printQr")}</span>
      </button>

      <button
        type="button"
        onClick={onDeactivate}
        className="flex shrink-0 items-center gap-1 sm:gap-1.5 whitespace-nowrap rounded-lg px-1 py-1 sm:px-2 text-[10px] sm:text-sm font-medium text-[var(--color-danger)] hover:text-[var(--color-danger-hover)] transition"
      >
        <Trash2
          strokeWidth={1.8}
          className="h-3.5 w-3.5 sm:h-[15px] sm:w-[15px]"
        />
        <span>{t("deactivate")}</span>
      </button>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="shrink-0 rounded-full p-1 sm:ml-1 text-[var(--color-text-muted)] hover:bg-[var(--color-input)] hover:text-[var(--color-white)] transition"
      >
        <X strokeWidth={1.9} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>
    </div>
  );
}