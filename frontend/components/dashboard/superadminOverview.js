"use client";

import { Archive, Wrench, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FONTS } from "../../lib/constants";
import StatCard from "./statCard";

const statusStyles = {
  Operating: "bg-emerald-500/15 text-emerald-400",
  "Need Maintenance": "bg-amber-500/15 text-amber-400",
  Repairing: "bg-orange-500/15 text-orange-400",
  Broken: "bg-red-500/15 text-red-400",
};

export default function SuperAdminOverview({ userName, assets = [], error = "" }) {
  const t = useTranslations("dashboard");
  const stats = {
    totalItems: assets.length,
    needMaintenance: assets.filter((asset) => asset.status === "Maintenance").length,
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
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      <h1 className="text-2xl font-semibold mb-6">
        {t("superadmin.greeting") || "Halo,"} {userName || "Super Admin"}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<Archive size={20} strokeWidth={1.75} />}
          label={t("admin.totalItems")}
          value={stats.totalItems.toLocaleString("id-ID")}
          badgeText="+12 This Month"
          badgeColor="info"
        />
        <StatCard
          icon={<Wrench size={20} strokeWidth={1.75} />}
          label={t("admin.needMaintenance") || "Need Maintenance"}
          value={stats.needMaintenance}
          badgeText="Urgent"
          badgeColor="urgent"
        />
        <StatCard
          icon={<AlertTriangle size={20} strokeWidth={1.75} />}
          label={t("admin.broken") || "Broken"}
          value={stats.broken}
          badgeText="High Risk"
          badgeColor="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-xl border border-[#272D3D] bg-[#131824] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">
              {t("superadmin.recentActivity") || "Recent Activity"}
            </h2>
            <Link
              href="/history"
              className="text-xs text-[#A5A7FF] hover:text-[#8083FF]"
            >
              {t("superadmin.viewAll") || "View All History"}
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-[#71717A] border-b border-[#272D3D]">
                <th className="py-2 font-medium">
                  {t("admin.itemId") || "Item"}
                </th>
                <th className="py-2 font-medium">
                  {t("admin.itemName") || "Item Name"}
                </th>
                <th className="py-2 font-medium">
                  {t("admin.user") || "User"}
                </th>
                <th className="py-2 font-medium">
                  {t("admin.status") || "Status"}
                </th>
                <th className="py-2 font-medium">
                  {t("admin.date") || "Date"}
                </th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((row) => (
                <tr
                  key={row.itemId}
                  className="border-b border-[#1D2230] last:border-0"
                >
                  <td className={`${FONTS.CODE} py-3 text-xs text-[#A1A1AA]`}>
                    {row.itemId}
                  </td>
                  <td className="py-3">{row.name}</td>
                  <td className="py-3 text-[#A1A1AA]">{row.user}</td>
                  <td className="py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${statusStyles[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 text-[#71717A] text-xs">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-[#272D3D] bg-[#131824] p-5">
          <h2 className="text-sm font-semibold mb-4">
            {t("superadmin.maintenanceAlerts") || "Maintenance Alerts"}
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
                  level: asset.status === "Rusak" || asset.status === "Broken" ? "danger" : "default",
                };
                return (
              <div
                key={asset.databaseId}
                className={`rounded-lg p-3 ${
                  alert.level === "danger"
                    ? "bg-red-500/10 border border-red-500/20"
                    : "bg-[#0D0D15] border border-[#272D3D]"
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${alert.level === "danger" ? "text-red-400" : "text-[#E5E7EB]"}`}
                >
                  <AlertTriangle size={14} strokeWidth={1.75} />
                  {alert.title}
                </div>
                <p className="text-xs text-[#A1A1AA]">{alert.message}</p>
              </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
