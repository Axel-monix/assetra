"use client";

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

const TABS = ["all", "added", "updated", "deactivated"];

export default function HistoryFilterBar({
  activeTab,
  onTabChange,
  search,
  onSearchChange,
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
            {t(`tabs.${tab}`)}
          </button>
        ))}
      </div>

      <div className="assetra-history-search">
        <Search size={15} />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
        />
      </div>
    </div>
  );
}