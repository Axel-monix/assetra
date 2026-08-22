"use client";

import { Archive, Wrench, AlertTriangle } from "lucide-react";
import StatCard from "./StatCard";

// TODO: ganti mock data ini dengan fetch ke backend:
// - stats        -> GET /api/dashboard/stats
// - recentActivity -> GET /api/history?limit=5 (semua admin, karena super admin)
// - maintenanceAlerts -> GET /api/assets?status=critical
const stats = { totalAssets: 1284, needMaintenance: 12, broken: 8 };

const recentActivity = [
  { assetId: "KL-MAC-8842", item: "MacBook Pro M3 14\"", user: "Fikar Sanjaya", status: "Operating", date: "20 Jul 2026" },
  { assetId: "KL-MON-8129", item: "EPSON L3110", user: "Eji Prasono", status: "Need Maintenance", date: "18 Jul 2026" },
  { assetId: "KL-TAB-8045", item: "iPad Pro 12.9\" Gen 6", user: "Irsyad Pramugyo", status: "Repairing", date: "12 Jul 2026" },
  { assetId: "KL-CAM-8921", item: "Sony A7 IV Body", user: "Gilang Armada Putra", status: "Operating", date: "29 Jun 2026" },
  { assetId: "KL-LPT-8332", item: "Asus ROG Zephyrus", user: "Muhammad Ilham", status: "Broken", date: "20 Jun 2026" },
];

const maintenanceAlerts = [
  { title: "Critical Failure", message: "The living room chair is damaged, please have it repaired immediately!", level: "danger" },
  { title: "Scheduled Service", message: "Office Computer Cleaning (cleaned 3 months ago)", level: "default" },
];

const statusStyles = {
  Operating: "bg-emerald-500/15 text-emerald-400",
  "Need Maintenance": "bg-amber-500/15 text-amber-400",
  Repairing: "bg-orange-500/15 text-orange-400",
  Broken: "bg-red-500/15 text-red-400",
};

export default function SuperAdminOverview({ userName }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Halo, {userName || "Super Admin"}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<Archive size={20} strokeWidth={1.75} />} label="Total Assets" value={stats.totalAssets.toLocaleString("id-ID")} badgeText="+12 This Month" badgeColor="info" />
        <StatCard icon={<Wrench size={20} strokeWidth={1.75} />} label="Need Maintenance" value={stats.needMaintenance} badgeText="Urgent" badgeColor="urgent" />
        <StatCard icon={<AlertIcon />} label="Broken" value={stats.broken} badgeText="High Risk" badgeColor="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity - super admin melihat aktivitas SEMUA admin */}
        <div className="lg:col-span-2 rounded-xl border border-[#272D3D] bg-[#131824] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
            <a href="/history" className="text-xs text-[#A5A7FF] hover:text-[#8083FF]">
              View All History
            </a>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-[#71717A] border-b border-[#272D3D]">
                <th className="py-2 font-medium">Asset</th>
                <th className="py-2 font-medium">Item Name</th>
                <th className="py-2 font-medium">User</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((row) => (
                <tr key={row.assetId} className="border-b border-[#1D2230] last:border-0">
                  <td className="py-3 font-[family-name:var(--font-code)] text-xs text-[#A1A1AA]">{row.assetId}</td>
                  <td className="py-3">{row.item}</td>
                  <td className="py-3 text-[#A1A1AA]">{row.user}</td>
                  <td className="py-3">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${statusStyles[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 text-[#71717A] text-xs">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Maintenance Alerts */}
        <div className="rounded-xl border border-[#272D3D] bg-[#131824] p-5">
          <h2 className="text-sm font-semibold mb-4">Maintenance Alerts</h2>
          <div className="flex flex-col gap-3">
            {maintenanceAlerts.map((alert) => (
              <div
                key={alert.title}
                className={`rounded-lg p-3 ${
                  alert.level === "danger" ? "bg-red-500/10 border border-red-500/20" : "bg-[#0D0D15] border border-[#272D3D]"
                }`}
              >
                <div className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${alert.level === "danger" ? "text-red-400" : "text-[#E5E7EB]"}`}>
                  <AlertTriangle size={14} strokeWidth={1.75} />
                  {alert.title}
                </div>
                <p className="text-xs text-[#A1A1AA]">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}