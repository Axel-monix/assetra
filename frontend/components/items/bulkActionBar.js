"use client";

import { Printer, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

export default function BulkActionBar({
  selectedCount,
  onPrintQr,
  onDeactivate,
  onClose,
}) {
  const t = useTranslations("bulkAction");

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-3 shadow-2xl">
      <span className="text-sm font-medium">
        {t("selectedItems", {
          count: selectedCount,
          plural: selectedCount > 1 ? "s" : "",
        })}
      </span>

      <div className="h-5 w-px bg-[var(--color-border)]" />

      <button
        type="button"
        onClick={onPrintQr}
        className="flex items-center gap-1.5 text-sm text-[var(--color-text)] hover:text-[var(--color-primary)]"
      >
        <Printer size={16} strokeWidth={1.75} /> {t("printQr")}
      </button>

      <button
        type="button"
        onClick={onDeactivate}
        className="flex items-center gap-1.5 text-sm text-[var(--color-danger)] hover:text-[var(--color-danger-hover)]"
      >
        <Trash2 size={16} strokeWidth={1.75} /> {t("deactivate")}
      </button>

      <button
        type="button"
        onClick={onClose}
        className="ml-1 text-[var(--color-text-muted)] hover:text-[var(--color-white)]"
      >
        <X size={16} strokeWidth={1.75} />
      </button>
    </div>
  );
}
