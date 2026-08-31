// components/history/HistoryFilterBar.jsx
"use client";

import { useTranslations } from "next-intl";
import { Search, Download } from "lucide-react";

const TABS = ["all", "added", "updated", "deactivated"];

export default function HistoryFilterBar({
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  onExport,
}) {
  const t = useTranslations("history");

  return (
    <div className="flex flex-wrap items-center gap-3 mb-5">
      <div className="assetra-history-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`assetra-history-tab ${activeTab === tab ? "is-active" : ""}`}
          >
            {t(`tabs.${tab}`)} {/* <-- perbaikan di sini */}
          </button>
        ))}
      </div>

      <div className="assetra-history-search flex-1 min-w-[200px]">
        <Search size={15} />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
        />
      </div>

      <button
        type="button"
        onClick={onExport}
        className="assetra-btn assetra-btn-primary flex items-center gap-2 ml-auto"
      >
        <Download size={16} />
        {t("exportButton")}
      </button>
    </div>
  );
}