"use client";

import { Archive, Wrench, AlertTriangle } from "lucide-react";
import StatCard from "./statCard";

// TODO: ganti mock data dengan fetch ke backend (endpoint tetap /api/assets,
// database tetap nama "asset" — cuma UI/JS yang pakai istilah "Item"):
// - stats            -> GET /api/assets/stats?scope=mine
// - categoryBreakdown -> GET /api/assets/categories?scope=mine
// - recentActivity   -> GET /api/history?scope=mine&limit=5
// - attentionItems   -> GET /api/assets?status=broken,maintenance&scope=mine
const stats = { totalItems: 1284, needMaintenance: 12, broken: 8 };

const categoryBreakdown = [
  { label: "Laptop & PC", count: 452, percent: 62, color: "bg-[#8083FF]" },
  { label: "Monitor & Display", count: 312, percent: 45, color: "bg-cyan-400" },
  { label: "Alat Dapur", count: 48, percent: 12, color: "bg-orange-400" },
  { label: "Furniture Kantor", count: 472, percent: 68, color: "bg-[#A1A1AA]" },
];

const recentActivity = [
  { text: "Eji Prasono mengubah property MacBook Pro", meta: "2m lalu · TR-8821" },
  { text: "Irsyad Pramugyo menambahkan item Sony A7 IV", meta: "15m lalu · TR-8820" },
  { text: "IT Support memulai service Server Rack", meta: "1j lalu · SV-412" },
];

const attentionItems = [
  { id: "AF-SRV-B4", name: "Server Rack Unit #B4", category: "Infrastruktur", status: "Broken" },
  { id: "AF-CAM-09", name: "Sony A7 IV Body", category: "Multimedia", status: "Maintenance" },
  { id: "AF-MON-21", name: 'Monitor HP 19"', category: "Display", status: "Broken" },
  { id: "AF-VHC-02", name: "Asus ROG Zephyrus", category: "Laptop", status: "Maintenance" },
];

const statusStyles = {
  Broken: "text-red-400",
  Maintenance: "text-amber-400",
};

export default function AdminOverview() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Overview</h1>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg bg-[#8083FF] px-4 py-2 text-sm font-semibold text-[#111323] hover:bg-[#9295FF]"
        >
          + Tambahkan Item
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<Archive size={20} strokeWidth={1.75} />}
          label="Total Item"
          value={stats.totalItems.toLocaleString("id-ID")}
          badgeText="+12 This Month"
          badgeColor="info"
        />
        <StatCard
          icon={<Wrench size={20} strokeWidth={1.75} />}
          label="Butuh Perawatan"
          value={stats.needMaintenance}
          badgeText="Urgent"
          badgeColor="urgent"
        />
        <StatCard
          icon={<AlertTriangle size={20} strokeWidth={1.75} />}
          label="Rusak"
          value={stats.broken}
          badgeText="Resiko Tinggi"
          badgeColor="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Distribusi kategori - hanya item milik admin ini */}
        <div className="rounded-xl border border-[#272D3D] bg-[#131824] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Distribusi item dalam kategori</h2>
            <a href="/manage-items" className="text-xs text-[#A5A7FF] hover:text-[#8083FF]">
              Lihat Detail
            </a>
          </div>
          <div className="flex flex-col gap-4">
            {categoryBreakdown.map((cat) => (
              <div key={cat.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#A1A1AA]">{cat.label}</span>
                  <span className="text-white font-medium">{cat.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#272D3D] overflow-hidden">
                  <div className={`h-full rounded-full ${cat.color}`} style={{ width: `${cat.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terkini - hanya aktivitas admin ini sendiri */}
        <div className="rounded-xl border border-[#272D3D] bg-[#131824] p-5">
          <h2 className="text-sm font-semibold mb-4">Terkini</h2>
          <div className="flex flex-col gap-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[#8083FF] shrink-0" />
                <div>
                  <p className="text-sm text-[#E5E7EB]">{activity.text}</p>
                  <p className="text-[11px] text-[#71717A] uppercase tracking-wide mt-0.5">{activity.meta}</p>
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
            <AlertTriangle size={16} strokeWidth={1.75} className="text-amber-400" />
            Item Perlu Perhatian
          </h2>
          <span className="rounded-md bg-[#272D3D] px-2 py-0.5 text-[11px] text-[#A1A1AA]">
            {attentionItems.length} Total Issue
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-[#71717A] border-b border-[#272D3D]">
              <th className="py-2 font-medium">ID Item</th>
              <th className="py-2 font-medium">Nama Item</th>
              <th className="py-2 font-medium">Kategori</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {attentionItems.map((item) => (
              <tr key={item.id} className="border-b border-[#1D2230] last:border-0">
                <td className="py-3 font-[family-name:var(--font-code)] text-xs text-[#A1A1AA]">{item.id}</td>
                <td className="py-3">{item.name}</td>
                <td className="py-3 text-[#A1A1AA]">{item.category}</td>
                <td className={`py-3 text-xs font-medium ${statusStyles[item.status]}`}>● {item.status}</td>
                <td className="py-3">
                  <a href={`/manage-items?item=${item.id}`} className="text-[#A5A7FF] hover:text-[#8083FF]">
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