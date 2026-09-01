"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import Header from "./header";
import { LayoutGrid, Boxes, History, Users, LogOut } from "lucide-react";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, FONTS, ROLES } from "@/lib/constants";

const NAV_ITEMS = [
  {
    href: "/",
    label: "navigation.dashboard",
    icon: LayoutGrid,
  },
  {
    href: "/manage-items",
    label: "navigation.manageItems",
    icon: Boxes,
  },
  {
    href: "/history",
    label: "navigation.history",
    icon: History,
  },
  {
    href: "/manage-admin",
    label: "navigation.manageAdmin",
    icon: Users,
    requiresRole: ROLES.SUPER_ADMIN,
  },
];

export default function DashboardLayout({ role, userName, children }) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const router = useRouter();

  const normalizedRole =
    typeof role === "object" ? role.name || role.role || role.role_name : role;

  if (!role) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center text-[var(--color-text-secondary)] text-sm">
        {t("loading")}
      </div>
    );
  }

  const navItems = NAV_ITEMS.filter(
    (item) => !item.requiresRole || item.requiresRole === normalizedRole,
  );
  const roleLabel =
    normalizedRole === ROLES.SUPER_ADMIN
      ? t("roles.superAdmin")
      : t("roles.admin");

  function handleLogout() {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
    window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
    window.sessionStorage.removeItem(AUTH_USER_KEY);
    router.push("/login");
  }

  return (
    <div
      className={`${FONTS.MAIN} h-screen overflow-hidden bg-[var(--color-background)] text-[var(--color-text)] flex`}
    >
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-[var(--color-border)] flex flex-col px-4 py-5 overflow-y-auto">
        <div className="mb-6 px-2 text-lg font-semibold">Assetra</div>

        <div className="mb-6 px-2">
          <div className="text-sm font-semibold text-[var(--color-primary)]">
            {roleLabel}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            {t("Trackyourstuff")}
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)] font-medium"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-white)]"
                }`}
              >
                <Icon size={18} strokeWidth={1.75} />
                {t(item.label)}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[var(--color-danger)] hover:bg-[var(--color-card)]"
          >
            <LogOut size={18} strokeWidth={1.75} />
            {t("logout")}
          </button>
          <div className="mt-2 px-3 text-[10px] text-[var(--color-text-subtle)]">
            v1.0.4
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Header userName={userName || t("user")} />
        <main className="flex-1 min-h-0 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
