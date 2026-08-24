"use client";

import { Bell } from "lucide-react";
import LanguageSwitcher from "./languageSwitcher";
import { useTranslations } from "next-intl";

export default function Header({ userName }) {
  const t = useTranslations("dashboard");
  return (
    <header className="flex items-center justify-end gap-4 border-b border-[#272D3D] px-6 py-3">
      <LanguageSwitcher />

      <button
        type="button"
        className="text-[#A1A1AA] hover:text-white"
        aria-label="Notifications"
      >
        <Bell size={18} strokeWidth={1.75} />
      </button>

      <div className="flex items-center gap-2 text-sm text-[#E5E7EB]">
        <div className="h-8 w-8 rounded-full bg-[#272D3D] flex items-center justify-center text-xs font-semibold">
          {userName?.[0]?.toUpperCase() || "A"}
        </div>
        <span className="hidden sm:inline">
          {userName || t("header.profile")}
        </span>
      </div>
    </header>
  );
}
