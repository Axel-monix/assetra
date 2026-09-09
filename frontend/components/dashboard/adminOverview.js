"use client";

import { Archive, Wrench, AlertTriangle, ChevronDown } from "lucide-react";
import { Fragment, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FONTS } from "../../lib/constants";
import StatCard from "./statCard";
import {
  ASSET_STATUS,
  ASSET_STATUS_LABELS,
  ASSET_STATUS_STYLES,
} from "../../lib/assetStatus";

export default function AdminOverview({ assets = [], error = "" }) {
  const t = useTranslations("dashboard");
  const [expandedRepairId, setExpandedRepairId] = useState(null);

  const stats = {
    totalItems: assets.length,
    available: assets.filter(
      (asset) => asset.status === ASSET_STATUS.FUNCTIONAL,
    ).length,
    needMaintenance: assets.filter(
      (asset) => asset.status === ASSET_STATUS.NEEDS_REPAIR,
    ).length,
  };

  const categoryCounts = assets.reduce((counts, asset) => {
    if (asset.category) {
      counts[asset.category] = (counts[asset.category] || 0) + 1;
    }
    return counts;
  }, {});

  const categoryBreakdown = Object.entries(categoryCounts).map(
    ([label, count], index) => ({
      label,
      count,
      percent: Math.round((count / Math.max(assets.length, 1)) * 100),
      color: [
        "bg-[var(--color-primary)]",
        "bg-[var(--color-cyan)]",
        "bg-[var(--color-orange)]",
        "bg-[var(--color-text-secondary)]",
      ][index % 4],
    }),
  );

  const attentionItems = assets.filter(
    (asset) =>
      asset.status === ASSET_STATUS.NEEDS_REPAIR ||
      asset.status === ASSET_STATUS.REPAIRING ||
      asset.status === ASSET_STATUS.BROKEN,
  );

  return (
    <div className="min-w-0">
      {error && (
        <p className="mb-4 text-sm text-[var(--color-danger)]">{error}</p>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t("admin.title")}</h1>

        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-contrast)] hover:bg-[var(--color-primary-hover)] transition"
        >
          + {t("admin.addItem")}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<Archive size={20} strokeWidth={1.75} />}
          label={t("admin.totalItems")}
          value={stats.totalItems.toLocaleString("id-ID")}
        />

        <StatCard
          icon={<Archive size={20} strokeWidth={1.75} />}
          label={t("admin.available")}
          value={stats.available}
          badgeText={
            stats.available > 0 ? t("admin.availableBadge") : undefined
          }
          badgeColor="info"
        />

        <StatCard
          icon={<Wrench size={20} strokeWidth={1.75} />}
          label={t("admin.needMaintenance")}
          value={stats.needMaintenance}
          badgeText={stats.needMaintenance > 0 ? t("admin.urgent") : undefined}
          badgeColor="urgent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Distribusi Kategori */}
        <div className="min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">
              {t("admin.categoryDistribution")}
            </h2>

            <Link
              href="/manage-items"
              className="text-xs text-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
            >
              {t("admin.viewDetail")}
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {categoryBreakdown.map((cat) => (
              <div key={cat.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[var(--color-text-secondary)]">
                    {cat.label}
                  </span>

                  <span className="text-[var(--color-white)] font-medium">
                    {cat.count}
                  </span>
                </div>

                <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cat.color}`}
                    style={{ width: `${cat.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aktivitas Terkini */}
        <div className="min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="text-sm font-semibold mb-4">
            {t("admin.recentActivity")}
          </h2>

          <div className="w-full min-w-0 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm border-collapse whitespace-nowrap">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th className="py-2.5 font-medium">
                    {t("admin.itemId")}
                  </th>
                  <th className="py-2.5 font-medium">
                    {t("admin.itemName")}
                  </th>
                </tr>
              </thead>

              <tbody>
                {assets.slice(0, 3).map((activity) => (
                  <tr
                    key={activity.id || activity.databaseId}
                    className="border-b border-[var(--color-surface)] last:border-0"
                  >
                    <td
                      className={`${FONTS.CODE} py-3 text-xs text-[var(--color-text-secondary)]`}
                    >
                      {activity.id}
                    </td>

                    <td className="py-3 font-medium">
                      {activity.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Item Perlu Perhatian */}
      <div className="min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle
              size={16}
              strokeWidth={1.75}
              className="text-[var(--color-warning)]"
            />
            {t("admin.attentionItems")}
          </h2>

          <span className="rounded-md bg-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-text-secondary)]">
            {t("admin.totalIssues", { count: attentionItems.length })}
          </span>
        </div>

        <div className="w-full min-w-0 overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm whitespace-nowrap">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th className="py-2.5 font-medium">
                  {t("admin.itemId")}
                </th>
                <th className="py-2.5 font-medium">
                  {t("admin.itemName")}
                </th>
                <th className="py-2.5 font-medium">
                  {t("admin.category")}
                </th>
                <th className="py-2.5 font-medium">
                  {t("admin.status")}
                </th>
                <th className="py-2.5 font-medium">
                  {t("admin.action")}
                </th>
              </tr>
            </thead>

            <tbody>
              {attentionItems.map((item) => (
                <Fragment key={item.id}>
                  <tr className="border-b border-[var(--color-surface)] last:border-0">
                    <td
                      className={`${FONTS.CODE} py-3 text-xs text-[var(--color-text-secondary)]`}
                    >
                      {item.id}
                    </td>

                    <td className="py-3 font-medium">
                      <span className="flex items-center gap-2">
                        {item.status === ASSET_STATUS.NEEDS_REPAIR && (
                          <Wrench
                            size={14}
                            className="text-[var(--color-warning)]"
                          />
                        )}
                        {item.name}
                      </span>
                    </td>

                    <td className="py-3 text-[var(--color-text-secondary)]">
                      {item.category}
                    </td>

                    <td className="py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                          ASSET_STATUS_STYLES[item.status] || ""
                        }`}
                      >
                        {ASSET_STATUS_LABELS[item.status]
                          ? t(ASSET_STATUS_LABELS[item.status])
                          : item.status}
                      </span>
                    </td>

                    <td className="py-3">
                      {item.repair && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedRepairId((current) =>
                              current === item.id ? null : item.id,
                            )
                          }
                          className="assetra-repair-details-toggle mr-3"
                          aria-label={t("admin.viewRepairDetails")}
                        >
                          <ChevronDown
                            size={16}
                            className={
                              expandedRepairId === item.id
                                ? "rotate-180"
                                : ""
                            }
                          />
                        </button>
                      )}

                      <Link
                        href={`/manage-items?item=${item.id}`}
                        className="text-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                      >
                        ↗
                      </Link>
                    </td>
                  </tr>

                  {expandedRepairId === item.id && item.repair && (
                    <tr
                      key={`${item.id}-repair`}
                      className="border-b border-[var(--color-surface)]"
                    >
                      <td
                        colSpan={5}
                        className="px-3 py-3 text-xs text-[var(--color-text-secondary)]"
                      >
                        <p className="mb-1 font-semibold text-[var(--color-warning)]">
                          {t("admin.repairDetails")}
                        </p>

                        {item.repair.specifications?.length > 0 && (
                          <p>
                            {t("admin.affectedParts")}:{" "}
                            {item.repair.specifications
                              .map((spec) => spec.name)
                              .join(", ")}
                          </p>
                        )}

                        {item.repair.details && (
                          <p>{item.repair.details}</p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}