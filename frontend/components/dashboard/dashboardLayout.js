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

  // ← CEK KALAU role NULL
  if (!role) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-[#A1A1AA] text-sm">
        Loading...
      </div>
    );
  }

  const navItems = NAV_ITEMS.filter(
    (item) => !item.requiresRole || item.requiresRole === role,
  );
  const roleLabel = role === ROLES.SUPER_ADMIN ? "Super Admin" : "Admin";

  function handleLogout() {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
    window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
    window.sessionStorage.removeItem(AUTH_USER_KEY);
    router.push("/login");
  }

  return (
    <div
      className={`${FONTS.MAIN} min-h-screen bg-[#0B0F17] text-[#E5E7EB] flex`}
    >
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-[#272D3D] flex flex-col px-4 py-5">
        <div className="mb-6 px-2 text-lg font-semibold">Assetra</div>

        <div className="mb-6 px-2">
          <div className="text-sm font-semibold text-[#8083FF]">
            {roleLabel}
          </div>
          <div className="text-xs text-[#71717A]">Inventory Manager</div>
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
                    ? "bg-[#8083FF] text-[#111323] font-medium"
                    : "text-[#A1A1AA] hover:bg-[#131824] hover:text-white"
                }`}
              >
                <Icon size={18} strokeWidth={1.75} />
                {t(item.label)}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-[#272D3D]">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-[#131824]"
          >
            <LogOut size={18} strokeWidth={1.75} />
            {t("logout")}
          </button>
          <div className="mt-2 px-3 text-[10px] text-[#4B5162]">v1.0.4</div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header userName={userName || "User"} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}