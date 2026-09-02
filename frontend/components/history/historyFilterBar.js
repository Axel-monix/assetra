"use client";

import { Search, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import HistoryFilterForm from "./historyFilterForm";
import SearchBar from "@/components/common/searchBar";

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

      <SearchBar
        value={search}
        onChange={onSearchChange}
        placeholder={t("searchPlaceholder")}
      />

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
