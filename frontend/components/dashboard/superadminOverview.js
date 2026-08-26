"use client";

import { Archive, Wrench, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FONTS } from "../../lib/constants";
import StatCard from "./statCard";

const statusStyles = {
  Operating: "bg-emerald-500/15 text-emerald-400",
  "Need Maintenance":
    "bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
  Repairing: "bg-[var(--color-orange)]/15 text-[var(--color-orange)]",
  Broken: "bg-[var(--color-danger-background)]/15 text-[var(--color-danger)]",
};

export default function SuperAdminOverview({
  userName,
  assets = [],
  error = "",
}) {
  const t = useTranslations("dashboard");
  const stats = {
    totalItems: assets.length,
    needMaintenance: assets.filter((asset) => asset.status === "Maintenance")
      .length,
    broken: assets.filter(
      (asset) => asset.status === "Rusak" || asset.status === "Broken",
    ).length,
  };
  const recentActivity = assets.slice(0, 5).map((asset) => ({
    itemId: asset.id,
    name: asset.name,
    user: "-",
    status: asset.status,
    date: asset.createdAt
      ? new Date(asset.createdAt).toLocaleDateString("id-ID")
      : "-",
  }));
  return (
    <div>
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
          badgeText={t("admin.thisMonth")}
          badgeColor="info"
        />
        <StatCard
          icon={<Wrench size={20} strokeWidth={1.75} />}
          label={t("admin.needMaintenance")}
          value={stats.needMaintenance}
          badgeText={t("admin.urgent")}
          badgeColor="urgent"
        />
        <StatCard
          icon={<AlertTriangle size={20} strokeWidth={1.75} />}
          label={t("admin.broken")}
          value={stats.broken}
          badgeText={t("admin.highRisk")}
          badgeColor="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
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
                <th className="py-2 font-medium">{t("admin.itemId")}</th>
                <th className="py-2 font-medium">{t("admin.itemName")}</th>
                <th className="py-2 font-medium">{t("admin.user")}</th>
                <th className="py-2 font-medium">{t("admin.status")}</th>
                <th className="py-2 font-medium">{t("admin.date")}</th>
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
                  <td className="py-3">{row.name}</td>
                  <td className="py-3 text-[var(--color-text-secondary)]">
                    {row.user}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${statusStyles[row.status]}`}
                    >
                      {row.status}
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

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="text-sm font-semibold mb-4">
            {t("superadmin.maintenanceAlerts")}
          </h2>
          <div className="flex flex-col gap-3">
            {assets
              .filter(
                (asset) =>
                  asset.status === "Maintenance" ||
                  asset.status === "Rusak" ||
                  asset.status === "Broken",
              )
              .slice(0, 3)
              .map((asset) => {
                const alert = {
                  title: asset.status,
                  message: `${asset.name} (${asset.id})`,
                  level:
                    asset.status === "Rusak" || asset.status === "Broken"
                      ? "danger"
                      : "default",
                };
                return (
                  <div
                    key={asset.databaseId}
                    className={`rounded-lg p-3 ${
                      alert.level === "danger"
                        ? "bg-[var(--color-danger-background)]/10 border border-[var(--color-danger-background)]/20"
                        : "bg-[var(--color-input)] border border-[var(--color-border)]"
                    }`}
                  >
                    <div
                      className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${alert.level === "danger" ? "text-[var(--color-danger)]" : "text-[var(--color-text)]"}`}
                    >
                      <AlertTriangle size={14} strokeWidth={1.75} />
                      {alert.title}
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {alert.message}
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
