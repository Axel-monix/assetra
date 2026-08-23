"use client";

import { X, Pencil, Trash2 } from "lucide-react";

const statusBadge = {
  Tersedia: "bg-emerald-500/15 text-emerald-400",
  Maintenance: "bg-amber-500/15 text-amber-400",
  Rusak: "bg-red-500/15 text-red-400",
};

export default function ItemDetailPanel({ item, onClose, onEdit, onDelete }) {
  if (!item) return null;

  return (
    <aside className="w-80 shrink-0 border-l border-[#272D3D] bg-[#0B0F17] p-5 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Detail Item</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-[#A1A1AA] hover:text-white"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>

      <div className="aspect-video rounded-lg bg-gradient-to-br from-[#1B2130] to-[#0D0D15] flex items-center justify-center mb-4">
        <span className="text-4xl opacity-30">📦</span>
      </div>

      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-[#8083FF]">{item.name}</h3>
        <span
          className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${statusBadge[item.status]}`}
        >
          {item.status}
        </span>
      </div>
      <p className="mb-5 font-[family-name:var(--font-code)] text-xs text-[#71717A]">
        {item.id}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-lg border border-[#272D3D] p-3">
          <div className="text-[10px] uppercase tracking-wide text-[#71717A] mb-1">
            Category
          </div>
          <div className="text-sm">{item.category}</div>
        </div>
        <div className="rounded-lg border border-[#272D3D] p-3">
          <div className="text-[10px] uppercase tracking-wide text-[#71717A] mb-1">
            Location
          </div>
          <div className="text-sm">{item.location}</div>
        </div>
      </div>

      {item.specs && Object.keys(item.specs).length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-[#A1A1AA] mb-2">
            Full Specifications
          </h4>
          <div className="flex flex-col gap-1.5">
            {Object.entries(item.specs).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-[#71717A]">{key}</span>
                <span className="font-[family-name:var(--font-desc)]">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {item.treatmentHistory && item.treatmentHistory.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-[#A1A1AA] mb-2">
            Treatment History
          </h4>
          <div className="flex flex-col gap-3">
            {item.treatmentHistory.map((entry, index) => (
              <div key={index} className="flex gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#8083FF] shrink-0" />
                <div>
                  <p className="text-[11px] text-[#71717A] uppercase tracking-wide">
                    {entry.date}
                  </p>
                  <p className="text-sm">{entry.title}</p>
                  <p className="text-xs text-[#71717A]">{entry.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[#272D3D] py-2 text-sm text-[#E5E7EB] hover:bg-[#131824]"
        >
          <Pencil size={16} strokeWidth={1.75} /> Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete([item.id])}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-500/15 py-2 text-sm text-red-400 hover:bg-red-500/25"
        >
          <Trash2 size={16} strokeWidth={1.75} /> Nonaktifkan
        </button>
      </div>
    </aside>
  );
}
