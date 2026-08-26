"use client";

import { Archive, Wrench, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FONTS } from "../../lib/constants";
import StatCard from "./statCard";
import {
  ASSET_STATUS,
  ASSET_STATUS_STYLES,
  ASSET_STATUS_LABELS,
} from "../../lib/assetStatus";

export default function SuperAdminOverview({
  userName,
  assets = [],
  error = "",
}) {
  const t = useTranslations("dashboard");

  const stats = {
    totalItems: assets.length,
    available: assets.filter((asset) => asset.status === ASSET_STATUS.OPERATING)
      .length,
    needMaintenance: assets.filter(
      (asset) => asset.status === ASSET_STATUS.NEEDS_REPAIR,
    ).length,
  };

  const recentActivity = assets.slice(0, 5).map((asset) => ({
    itemId: asset.id,
    name: asset.name,
    user: asset.user || "-",
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
    <div>
      {error && (
        <p className="mb-4 text-sm text-[var(--color-danger)]">{error}</p>
      )}

      <h1 className="text-2xl font-semibold mb-6">
        {t("superadmin.greeting")} {userName || t("roles.superAdmin")}
      </h1>

      {/* Grid Stat Cards (1 Layer Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<Archive size={20} strokeWidth={1.75} />}
          label={t("admin.totalItems")}
          value={stats.totalItems.toLocaleString("id-ID")}
          /* Badge dihapus sesuai permintaan */
        />

        <StatCard
          icon={<Archive size={20} strokeWidth={1.75} />}
          label={t("admin.available")}
          value={stats.available}
          badgeText={t("admin.availableBadge")}
          badgeColor="info"
        />

        <StatCard
          icon={<Wrench size={20} strokeWidth={1.75} />}
          label={t("admin.needMaintenance")}
          value={stats.needMaintenance}
          badgeText={t("admin.urgent")}
          badgeColor="urgent"
        />
      </div>

      {/* Grid Content Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Aktivitas Terbaru */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
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
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th className="py-2.5 font-medium">{t("admin.itemId")}</th>
                <th className="py-2.5 font-medium">{t("admin.itemName")}</th>
                <th className="py-2.5 font-medium">{t("admin.user")}</th>
                <th className="py-2.5 font-medium">{t("admin.status")}</th>
                <th className="py-2.5 font-medium">{t("admin.date")}</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((row) => (
                <tr
                  key={row.itemId}
                  className="border-b border-[var(--color-surface)] last:border-0"
                >
                  <td
                    className={`${FONTS.CODE} py-3 text-xs text-[var(--color-text-secondary)]`}
                  >
                    {row.itemId}
                  </td>
                  <td className="py-3 font-medium">{row.name}</td>
                  <td className="py-3 text-[var(--color-text-secondary)]">
                    {row.user}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                        ASSET_STATUS_STYLES[row.status] || ""
                      }`}
                    >
                      {ASSET_STATUS_LABELS[row.status]
                        ? t(ASSET_STATUS_LABELS[row.status])
                        : row.status}
                    </span>
                  </td>
                  <td className="py-3 text-[var(--color-text-muted)] text-xs">
                    {row.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alert Perawatan */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}