"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Boxes, History, Users, Search, Bell, LogOut } from "lucide-react";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, ROLES } from "@/lib/constants";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/manage-assets", label: "Manage Asset", icon: Boxes },
  { href: "/history", label: "History", icon: History },
  // Manage Admin cuma muncul untuk super_admin, di-filter di bawah.
  { href: "/manage-admin", label: "Manage Admin", icon: Users, requiresRole: ROLES.SUPER_ADMIN },
];

export default function DashboardLayout({ role, userName, children }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = NAV_ITEMS.filter((item) => !item.requiresRole || item.requiresRole === role);
  const roleLabel = role === ROLES.SUPER_ADMIN ? "Super Admin" : "Admin";

  function handleLogout() {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
    window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
    window.sessionStorage.removeItem(AUTH_USER_KEY);
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#E5E7EB] flex font-[family-name:var(--font-main)]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-[#272D3D] flex flex-col px-4 py-5">
        <div className="mb-6 px-2 text-lg font-semibold">Assetra</div>

        <div className="mb-6 px-2">
          <div className="text-sm font-semibold text-[#8083FF]">{roleLabel}</div>
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
                {item.label}
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
            Logout
          </button>
          <div className="mt-2 px-3 text-[10px] text-[#4B5162]">v1.0.4</div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center gap-4 border-b border-[#272D3D] px-6 py-3">
          <div className="flex-1 flex items-center gap-2 rounded-lg border border-[#272D3D] bg-[#0D0D15] px-3 h-10 max-w-md">
            <span className="text-[#555866]">
              <Search size={16} strokeWidth={1.75} />
            </span>
            <input
              type="text"
              placeholder="Cari aset, serial number, atau pengguna..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#555866]"
            />
          </div>

          <button type="button" className="text-[#A1A1AA] hover:text-white">
            <Bell size={18} strokeWidth={1.75} />
          </button>

          <div className="flex items-center gap-2 text-sm text-[#E5E7EB]">
            <div className="h-8 w-8 rounded-full bg-[#272D3D] flex items-center justify-center text-xs font-semibold">
              {userName?.[0]?.toUpperCase() || "A"}
            </div>
            <span className="hidden sm:inline">{userName || "Admin User"}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}