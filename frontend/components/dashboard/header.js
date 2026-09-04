"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu, User, X } from "lucide-react";
import LanguageSwitcher from "./languageSwitcher";

export default function Header({
  userName,
  isSidebarOpen,
  onToggleSidebar,
  mobileNavItems = [],
}) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();

  return (
    <header className="assetra-dashboard-header border-b border-[var(--color-border)] px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? t("closeMenu") : t("openMenu")}
          aria-expanded={isSidebarOpen}
          className="assetra-menu-toggle"
        >
          {isSidebarOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

        <div className="assetra-mobile-nav" aria-label={t("mobileNavigation")}>
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "is-active" : ""}
            >
              {t(item.label)}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-[var(--color-card)]"
          >
            <span className="text-sm text-[var(--color-text)] assetra-header-user-name">
              {userName || t("user")}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-border)]">
              <User size={16} className="text-[var(--color-text-secondary)]" />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
