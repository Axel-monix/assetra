"use client";

import { X, UserCircle2 } from "lucide-react";
import { useTranslations } from "next-intl"; 
import ToggleSwitch from "./toggleSwitch";

export default function AdminProfileModal({ admin, onClose, onToggleActive }) {
  const t = useTranslations("manageAdmin"); 
  
  if (!admin) return null;

  const joinedDate = admin.created_at
    ? new Date(admin.created_at).toLocaleDateString("id-ID", { 
        day: "2-digit", 
        month: "short", 
        year: "numeric" 
      })
    : "-";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-xl border border-[#272D3D] bg-[#131824] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold">{t("adminProfile")}</h2>
          <button type="button" onClick={onClose} className="text-[#A1A1AA] hover:text-white">
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center mb-6">
          <UserCircle2 size={56} strokeWidth={1.3} className="text-[#A1A1AA] mb-3" />
          <h3 className="text-base font-semibold">{admin.name}</h3>
          <p className="text-sm text-[#71717A]">{admin.email}</p>
        </div>

        <div className="rounded-lg border border-[#272D3D] p-3 mb-5">
          <div className="text-[10px] uppercase tracking-wide text-[#71717A] mb-1">
            {t("joined")} 
          </div>
          <div className="text-sm">{joinedDate}</div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-[#272D3D] p-3">
          <span className="text-sm text-[#A1A1AA]">{t("accountStatus")}</span> 
          <ToggleSwitch 
            checked={admin.active} 
            onChange={(next) => onToggleActive(admin.id, next)} 
          />
        </div>
      </div>
    </div>
  );
}