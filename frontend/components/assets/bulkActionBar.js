"use client";

import { Printer, Trash2, X } from "lucide-react";

export default function BulkActionBar({ selectedCount, onPrintQr, onDeactivate, onClose }) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-xl border border-[#272D3D] bg-[#131824] px-5 py-3 shadow-2xl">
      <span className="text-sm font-medium">
        {selectedCount} Selected Asset{selectedCount > 1 ? "s" : ""}
      </span>

      <div className="h-5 w-px bg-[#272D3D]" />

      <button
        type="button"
        onClick={onPrintQr}
        className="flex items-center gap-1.5 text-sm text-[#E5E7EB] hover:text-[#8083FF]"
      >
        <Printer size={16} strokeWidth={1.75} /> Print QR
      </button>

      <button
        type="button"
        onClick={onDeactivate}
        className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300"
      >
        <Trash2 size={16} strokeWidth={1.75} /> Nonaktifkan
      </button>

      <button type="button" onClick={onClose} className="ml-1 text-[#71717A] hover:text-white">
        <X size={16} strokeWidth={1.75} />
      </button>
    </div>
  );
}