"use client";

import { useLocale, useTranslations } from "next-intl";

import { Pencil } from "lucide-react";

import { getHistoryConfig } from "@/lib/historyHelper";

function extractReason(description) {
  if (!description) {
    return "";
  }

  const separatorIndex = description.indexOf(":");

  if (separatorIndex === -1) {
    return description.trim();
  }

  return description.slice(separatorIndex + 1).trim();
}

function parseEditChanges(description) {
  if (!description) return null;

  try {
    const parsed = JSON.parse(description);
    return parsed && Array.isArray(parsed.changedFields) ? parsed : null;
  } catch {
    return null;
  }
}

export default function HistoryItem({ entry, isLast }) {
  const t = useTranslations("history");

  const locale = useLocale();

  const config = getHistoryConfig(entry?.type);

  const Icon = config?.icon || Pencil;

  const time = new Date(entry.created_at).toLocaleTimeString(
    locale === "id" ? "id-ID" : "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  const isDeactivation =
    entry?.type === "deactivate_admin" || entry?.type === "deactivate_item";

  const reason = isDeactivation ? extractReason(entry?.description) : "";

  const editChanges =
    entry?.type === "edit_item" ? parseEditChanges(entry?.description) : null;

  const editDescription = editChanges
    ? [
        editChanges.changedFields
          .map((field) => t(`changedFields.${field}`, { defaultValue: field }))
          .join(", ") &&
          t("fieldsChanged", {
            fields: editChanges.changedFields
              .map((field) =>
                t(`changedFields.${field}`, { defaultValue: field }),
              )
              .join(", "),
          }),
        editChanges.status &&
          t("statusChange", {
            from: t(`statusValues.${editChanges.status.from}`, {
              defaultValue: editChanges.status.from,
            }),
            to: t(`statusValues.${editChanges.status.to}`, {
              defaultValue: editChanges.status.to,
            }),
          }),
        editChanges.damagedSpecifications?.length > 0 &&
          t("damageChange", {
            parts: editChanges.damagedSpecifications.join(", "),
          }),
        editChanges.repairDetails &&
          t("repairChange", { details: editChanges.repairDetails }),
      ]
        .filter(Boolean)
        .join(" ")
    : entry?.description || "";

  const description = t(config?.descriptionKey || "activities.unknown", {
    name: entry?.subject_name || "-",

    performedBy: entry?.performed_by_name || "-",

    reason: reason || "-",

    changes: editDescription,
  });

  return (
    <div className="assetra-history-row">
      <div className="assetra-history-rail">
        <div
          className={`assetra-icon-badge assetra-icon-badge--${config.variant}`}
        >
          <Icon size={16} strokeWidth={2} />
        </div>

        {!isLast && <div className="assetra-history-line" />}
      </div>

      <div className="assetra-history-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className={`assetra-history-badge assetra-history-badge--${config.variant}`}
            >
              {t(config.badgeKey)}
            </span>

            <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5">
              <span className="assetra-history-subject truncate">
                {entry.subject_name}
              </span>

              {entry.subject_code && (
                <span className="assetra-history-code">
                  #{entry.subject_code}
                </span>
              )}
            </div>

            <p className="assetra-history-desc">{description}</p>
          </div>

          <span className="assetra-history-time shrink-0">{time}</span>
        </div>
      </div>
    </div>
  );
}
