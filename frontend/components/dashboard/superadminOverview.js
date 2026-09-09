"use client";

import { Archive, Wrench, AlertTriangle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FONTS } from "../../lib/constants";
import StatCard from "./statCard";
import {
  ASSET_STATUS,
  ASSET_STATUS_LABELS,
  getAssetStatusStyle,
} from "../../lib/assetStatus";

export default function SuperAdminOverview({
  userName,
  assets = [],
  error = "",
}) {
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

  const recentActivity = assets.slice(0, 5).map((asset) => ({
    itemId: asset.id,
    name: asset.name,
    category:
      typeof asset.category === "object" && asset.category !== null
        ? asset.category.category_name || asset.category.name || "-"
        : asset.category || asset.categoryName || asset.category_name || "-",
    status: asset.status,
    date: asset.createdAt
      ? new Date(asset.createdAt).toLocaleDateString("id-ID")
      : "-",
  }));

  const maintenanceAlerts = assets.filter(
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

      <h1 className="text-2xl font-semibold mb-6">
        {t("superadmin.greeting")} {userName || t("roles.superAdmin")}
      </h1>

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

      {/* Grid Content Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Aktivitas Terbaru */}
        <div className="lg:col-span-2 min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">
              {t("superadmin.recentActivity")}
            </h2>

            <Link
              href="/history"
              className="text-xs text-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
            >
              {t("superadmin.viewAll")}
            </Link>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm border-collapse">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th className="py-2.5 pr-4 font-medium whitespace-nowrap w-[100px]">
                    {t("admin.itemId")}
                  </th>
                  <th className="py-2.5 pr-4 font-medium whitespace-nowrap w-[160px]">
                    {t("admin.itemName")}
                  </th>
                  <th className="py-2.5 pr-4 font-medium whitespace-nowrap w-[140px]">
                    {t("admin.user")}
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
                {recentActivity.map((row) => (
                  <tr
                    key={row.itemId}
                    className="border-b border-[var(--color-surface)] last:border-0"
                  >
                    <td
                      className={`${FONTS.CODE} py-3 pr-4 text-xs text-[var(--color-text-secondary)] whitespace-nowrap`}
                    >
                      {row.itemId}
                    </td>

                    <td className="py-3 pr-4 font-medium whitespace-nowrap">
                      {row.name}
                    </td>

                    <td className="py-3 pr-4 text-[var(--color-text-secondary)] whitespace-nowrap">
                      {row.category}
                    </td>

                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${getAssetStatusStyle(row.status)}`}
                      >
                        {ASSET_STATUS_LABELS[row.status]
                          ? t(ASSET_STATUS_LABELS[row.status])
                          : row.status}
                      </span>
                    </td>

                    <td className="py-3 text-[var(--color-text-muted)] text-xs whitespace-nowrap">
                      {row.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance Alerts */}
        <div className="min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="text-sm font-semibold mb-4">
            {t("superadmin.maintenanceAlerts")}
          </h2>

          <div className="flex flex-col gap-3">
            {maintenanceAlerts.slice(0, 4).map((asset) => {
              const isBroken = asset.status === ASSET_STATUS.BROKEN;

              return (
                <div
                  key={asset.id || asset.databaseId}
                  className={`rounded-lg p-3 ${
                    isBroken
                      ? "bg-[var(--color-danger-background)]/10 border border-[var(--color-danger-background)]/20"
                      : "bg-[var(--color-input)] border border-[var(--color-border)]"
                  }`}
                >
                  <div
                    className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${
                      isBroken
                        ? "text-[var(--color-danger)]"
                        : "text-[var(--color-text)]"
                    }`}
                  >
                    <AlertTriangle size={14} strokeWidth={1.75} />

                    {ASSET_STATUS_LABELS[asset.status]
                      ? t(ASSET_STATUS_LABELS[asset.status])
                      : asset.status}
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {asset.name} ({asset.id})
                  </p>

                  {asset.repair && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRepairId((current) =>
                            current === asset.id ? null : asset.id,
                          )
                        }
                        className="assetra-repair-details-toggle mt-2"
                      >
                        {t(
                          expandedRepairId === asset.id
                            ? "admin.hideRepairDetails"
                            : "admin.viewRepairDetails",
                        )}

                        <ChevronDown
                          size={14}
                          className={
                            expandedRepairId === asset.id ? "rotate-180" : ""
                          }
                        />
                      </button>

                      {expandedRepairId === asset.id && (
                        <div className="mt-2 border-t border-[var(--color-border)] pt-2 text-xs text-[var(--color-text-secondary)]">
                          {asset.repair.specifications?.length > 0 && (
                            <p>
                              {t("admin.affectedParts")}:{" "}
                              {asset.repair.specifications
                                .map((spec) => spec.name)
                                .join(", ")}
                            </p>
                          )}

                          {asset.repair.details && (
                            <p>{asset.repair.details}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
