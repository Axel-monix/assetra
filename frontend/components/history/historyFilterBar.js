"use client";

import { Search, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import HistoryFilterForm from "./historyFilterForm";

export default function HistoryFilterBar({
  filters,
  onApplyFilters,
  onClearFilters,
  search,
  onSearchChange,
  onExport,
}) {
  const t = useTranslations("history");

  return (
    <div className="flex flex-wrap items-center gap-3 mb-5">
      <HistoryFilterForm
        filters={filters}
        onApply={onApplyFilters}
        onClear={onClearFilters}
      />

      <div className="assetra-history-search flex-1 min-w-[200px]">
        <Search size={15} />

        <input
          type="text"
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder={t("searchPlaceholder")}
        />
      </div>

      <button
        type="button"
        onClick={onExport}
        className="assetra-btn assetra-btn-primary flex items-center gap-2"
      >
        <Download size={16} />
        {t("exportButton")}
      </button>
    </div>
  );
}