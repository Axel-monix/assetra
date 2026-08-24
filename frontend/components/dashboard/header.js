"use client";

import { useTranslations } from "next-intl";
import { User, ChevronDown } from "lucide-react";

export default function Header({ userName }) {
  const t = useTranslations("dashboard");
  
  return (
    <header className="border-b border-[#272D3D] px-6 py-4 flex items-center justify-between">
      <div className="text-sm text-[#A1A1AA]">
        {/* breadcrumb atau apapun */}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#E5E7EB]">
          {userName || "User"}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#272D3D]">
          <User size={16} className="text-[#A1A1AA]" />
        </div>
        <ChevronDown size={16} className="text-[#A1A1AA]" />
      </div>
    </header>
  );
}