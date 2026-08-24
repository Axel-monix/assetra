"use client";

import { Archive, Wrench, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FONTS } from "../../lib/constants";
import StatCard from "./statCard";

const statusStyles = {
  Broken: "text-red-400",
  Maintenance: "text-amber-400",
};

export default function AdminOverview({ assets = [], error = "" }) {
  const t = useTranslations("dashboard");
  const stats = {
    totalItems: assets.length,
    needMaintenance: assets.filter((asset) => asset.status === "Maintenance")
      .length,
    broken: assets.filter(
      (asset) => asset.status === "Rusak" || asset.status === "Broken",
    ).length,
  };
  const categoryCounts = assets.reduce((counts, asset) => {
    counts[asset.category] = (counts[asset.category] || 0) + 1;
    return counts;
  }, {});
  const categoryBreakdown = Object.entries(categoryCounts).map(
    ([label, count], index) => ({
      label,
      count,
      percent: Math.round((count / Math.max(assets.length, 1)) * 100),
      color: ["bg-[#8083FF]", "bg-cyan-400", "bg-orange-400", "bg-[#A1A1AA]"][
        index % 4
      ],
    }),
  );
  const attentionItems = assets.filter(
    (asset) =>
      asset.status === "Maintenance" ||
      asset.status === "Rusak" ||
      asset.status === "Broken",
  );

  return (
    <div>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          {t("admin.title") || "Overview"}
        </h1>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg bg-[#8083FF] px-4 py-2 text-sm font-semibold text-[#111323] hover:bg-[#9295FF]"
        >
          + {t("admin.addItem") || "Tambahkan Item"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<Archive size={20} strokeWidth={1.75} />}
          label={t("admin.totalItems") || "Total Item"}
          value={stats.totalItems.toLocaleString("id-ID")}
          badgeText="+12 This Month"
          badgeColor="info"
        />
        <StatCard
          icon={<Wrench size={20} strokeWidth={1.75} />}
          label={t("admin.needMaintenance") || "Butuh Perawatan"}
          value={stats.needMaintenance}
          badgeText="Urgent"
          badgeColor="urgent"
        />
        <StatCard
          icon={<AlertTriangle size={20} strokeWidth={1.75} />}
          label={t("admin.broken") || "Rusak"}
          value={stats.broken}
          badgeText="Resiko Tinggi"
          badgeColor="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Distribusi kategori */}
        <div className="rounded-xl border border-[#272D3D] bg-[#131824] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">
              {t("admin.categoryDistribution") ||
                "Distribusi item dalam kategori"}
            </h2>
            <Link
              href="/manage-items"
              className="text-xs text-[#A5A7FF] hover:text-[#8083FF]"
            >
              {t("admin.viewDetail") || "Lihat Detail"}
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {categoryBreakdown.map((cat) => (
              <div key={cat.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#A1A1AA]">{cat.label}</span>
                  <span className="text-white font-medium">{cat.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#272D3D] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cat.color}`}
                    style={{ width: `${cat.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terkini */}
        <div className="rounded-xl border border-[#272D3D] bg-[#131824] p-5">
          <h2 className="text-sm font-semibold mb-4">
            {t("admin.recentActivity") || "Terkini"}
          </h2>
          <div className="flex flex-col gap-4">
            {assets.slice(0, 3).map((activity) => (
              <div key={activity.databaseId} className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[#8083FF] shrink-0" />
                <div>
                  <p className="text-sm text-[#E5E7EB]">{activity.name}</p>
                  <p className="text-[11px] text-[#71717A] uppercase tracking-wide mt-0.5">
                    {activity.id}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Item Perlu Perhatian */}
      <div className="rounded-xl border border-[#272D3D] bg-[#131824] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle
              size={16}
              strokeWidth={1.75}
              className="text-amber-400"
            />
            {t("admin.attentionItems") || "Item Perlu Perhatian"}
          </h2>
          <span className="rounded-md bg-[#272D3D] px-2 py-0.5 text-[11px] text-[#A1A1AA]">
            {attentionItems.length} Total Issue
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-[#71717A] border-b border-[#272D3D]">
              <th className="py-2 font-medium">
                {t("admin.itemId") || "ID Item"}
              </th>
              <th className="py-2 font-medium">
                {t("admin.itemName") || "Nama Item"}
              </th>
              <th className="py-2 font-medium">
                {t("admin.category") || "Kategori"}
              </th>
              <th className="py-2 font-medium">
                {t("admin.status") || "Status"}
              </th>
              <th className="py-2 font-medium">
                {t("admin.action") || "Aksi"}
              </th>
            </tr>
          </thead>
          <tbody>
            {attentionItems.map((item) => (
              <tr
                key={item.id}
                className="border-b border-[#1D2230] last:border-0"
              >
                <td className={`${FONTS.CODE} py-3 text-xs text-[#A1A1AA]`}>
                  {item.id}
                </td>
                <td className="py-3">{item.name}</td>
                <td className="py-3 text-[#A1A1AA]">{item.category}</td>
                <td
                  className={`py-3 text-xs font-medium ${statusStyles[item.status]}`}
                >
                  ● {item.status}
                </td>
                <td className="py-3">
                  <a
                    href={`/manage-items?item=${item.id}`}
                    className="text-[#A5A7FF] hover:text-[#8083FF]"
                  >
                    ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
