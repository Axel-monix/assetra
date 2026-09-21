"use client";

import {
  Archive,
  Wrench,
  AlertTriangle,
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import { Fragment, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FONTS } from "../../lib/constants";
import StatCard from "./statCard";
import {
  ASSET_STATUS,
  ASSET_STATUS_LABELS,
  getAssetStatusStyle,
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

      <h1 className="text-3xl font-semibold mb-6">{t("admin.title")}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<Archive size={20} strokeWidth={1.75} />}
          label={t("admin.totalItems")}
          value={stats.totalItems.toLocaleString("id-ID")}
        />

        <StatCard
          icon={<CheckCircle size={20} strokeWidth={1.75} />}
          label={t("admin.available")}
          value={stats.available}
          badgeText={t("admin.availableBadge")}
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
        <div className="min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">
              {t("admin.categoryDistribution")}
            </h2>

            <Link
              href="/manage-items"
              className="text-sm text-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
            >
              {t("admin.viewDetail")}
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {categoryBreakdown.map((cat) => (
              <div key={cat.label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
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

        <div className="min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="text-base font-semibold mb-4">
            {t("admin.recentActivity")}
          </h2>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm border-collapse">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th className="py-2.5 pr-4 font-medium whitespace-nowrap w-[100px]">
                    {t("admin.itemId")}
                  </th>
                  <th className="py-2.5 pr-4 font-medium whitespace-nowrap w-[160px]">
                    {t("admin.itemName")}
                  </th>
                  <th className="py-2.5 pr-4 font-medium whitespace-nowrap w-[140px]">
                    {t("admin.category")}
                  </th>
                  <th className="py-2.5 pr-4 font-medium whitespace-nowrap w-[110px]">
                    {t("admin.status")}
                  </th>
                  <th className="py-2.5 font-medium whitespace-nowrap w-[100px]">
                    {t("admin.date")}
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
                      className={`${FONTS.CODE} py-3 pr-4 text-xs text-[var(--color-text-secondary)] whitespace-nowrap`}
                    >
                      {activity.id}
                    </td>

                    <td className="py-3 pr-4 font-medium whitespace-nowrap">
                      {activity.name}
                    </td>

                    <td className="py-3 pr-4 text-[var(--color-text-secondary)] whitespace-nowrap">
                      {typeof activity.category === "object" &&
                      activity.category !== null
                        ? activity.category.category_name ||
                          activity.category.name ||
                          "-"
                        : activity.category ||
                          activity.categoryName ||
                          activity.category_name ||
                          "-"}
                    </td>

                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-medium ${getAssetStatusStyle(activity.status)}`}
                      >
                        {ASSET_STATUS_LABELS[activity.status]
                          ? t(ASSET_STATUS_LABELS[activity.status])
                          : activity.status || "-"}
                      </span>
                    </td>

                    <td className="py-3 text-[var(--color-text-muted)] text-sm whitespace-nowrap">
                      {activity.createdAt
                        ? new Date(activity.createdAt).toLocaleDateString(
                            "id-ID",
                          )
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle
              size={16}
              strokeWidth={1.75}
              className="text-[var(--color-warning)]"
            />
            {t("admin.attentionItems")}
          </h2>

          <span className="rounded-md bg-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)]">
            {t("admin.totalIssues", { count: attentionItems.length })}
          </span>
        </div>

        <div className="w-full min-w-0 overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm whitespace-nowrap border-collapse">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th className="w-[140px] py-2.5 font-medium">
                  {t("admin.itemId")}
                </th>
                <th className="w-[240px] py-2.5 font-medium">
                  {t("admin.itemName")}
                </th>
                <th className="w-[180px] py-2.5 font-medium">
                  {t("admin.category")}
                </th>
                <th className="w-[140px] py-2.5 font-medium">
                  {t("admin.status")}
                </th>
                <th className="w-[100px] py-2.5 font-medium">
                  {t("admin.detail")}
                </th>
              </tr>
            </thead>

            <tbody>
              {attentionItems.map((item) => (
                <Fragment key={item.id}>
                  <tr className="border-b border-[var(--color-surface)] last:border-0">
                    <td
                      className={`${FONTS.CODE} py-3 text-xs text-[var(--color-text-secondary)] whitespace-nowrap`}
                    >
                      {item.id}
                    </td>

                    <td className="py-3 font-medium whitespace-nowrap">
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

                    <td className="py-3 text-[var(--color-text-secondary)] whitespace-nowrap">
                      {item.category}
                    </td>

                    <td className="py-3 whitespace-nowrap">
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-medium ${getAssetStatusStyle(item.status)}`}
                      >
                        {ASSET_STATUS_LABELS[item.status]
                          ? t(ASSET_STATUS_LABELS[item.status])
                          : item.status}
                      </span>
                    </td>

                    <td className="py-3 whitespace-nowrap">
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
                              expandedRepairId === item.id ? "rotate-180" : ""
                            }
                          />
                        </button>
                      )}

                      <Link
                        href={`/manage-items?itemId=${encodeURIComponent(item.id)}`}
                        aria-label={t("admin.detail")}
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

                        {item.repair.details && <p>{item.repair.details}</p>}
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
