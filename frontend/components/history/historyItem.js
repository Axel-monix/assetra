"use client";

import { useTranslations } from "next-intl";
import { getHistoryConfig } from "@/lib/historyHelper";

export default function HistoryItem({ entry, isLast }) {
  const t = useTranslations("history");
  const config = getHistoryConfig(entry.type);
  const Icon = config.icon;

  const time = new Date(entry.created_at).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="assetra-history-row">
      <div className="assetra-history-rail">
        <div className={`assetra-icon-badge assetra-icon-badge--${config.variant}`}>
          <Icon size={16} strokeWidth={2} />
        </div>
        {!isLast && <div className="assetra-history-line" />}
      </div>

      <div className="assetra-history-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className={`assetra-history-badge assetra-history-badge--${config.variant}`}>
              {t(config.badgeKey)}
            </span>

            <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5">
              <span className="assetra-history-subject truncate">
                {entry.subject_name}
              </span>
              {entry.subject_code && (
                <span className="assetra-history-code">#{entry.subject_code}</span>
              )}
            </div>

            {entry.description && (
              <p className="assetra-history-desc">
                {entry.description}
                {entry.performed_by_name && (
                  <>
                    {" "}
                    {t("by")}{" "}
                    <span className="font-medium text-[var(--color-text)]">
                      {entry.performed_by_name}
                    </span>
                    .
                  </>
                )}
              </p>
            )}
          </div>

          <span className="assetra-history-time shrink-0">{time}</span>
        </div>
      </div>
    </div>
  );
}