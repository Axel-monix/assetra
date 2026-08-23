"use client";

import { useLanguage } from "@/lib/i18n/languageContext";

export default function ToggleSwitch({ checked, onChange, label }) {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(event) => {
        event.stopPropagation(); // biar klik toggle gak ikut ke-trigger klik baris (buka profil)
        onChange(!checked);
      }}
      className="flex items-center gap-2"
    >
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
          checked ? "bg-cyan-400" : "bg-[#272D3D]"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
            checked ? "translate-x-4.5" : "translate-x-1"
          }`}
          style={{ transform: checked ? "translateX(18px)" : "translateX(4px)" }}
        />
      </span>
      <span className={`text-xs font-medium ${checked ? "text-cyan-400" : "text-[#71717A]"}`}>
        {label || (checked ? t("manageAdmin.active") : t("manageAdmin.inactive"))}
      </span>
    </button>
  );
}