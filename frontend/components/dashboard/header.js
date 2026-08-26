"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { User } from "lucide-react";
import LanguageSwitcher from "./languageSwitcher";

export default function Header({ userName }) {
  const t = useTranslations("dashboard");

  return (
    <header className="border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
      <div className="text-sm text-[var(--color-text-secondary)]">
        {/* breadcrumb atau apapun */}
      </div>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-[var(--color-card)]"
        >
          <span className="text-sm text-[var(--color-text)]">
            {userName || t("user")}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-border)]">
            <User size={16} className="text-[var(--color-text-secondary)]" />
          </div>
        </Link>
      </div>
    </header>
  );
}
