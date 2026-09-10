"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import Header from "./header";
import {
  LayoutGrid,
  Boxes,
  History,
  Users,
  Layers,
  LogOut,
} from "lucide-react";
import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  ENDPOINTS,
  FONTS,
  ROLES,
} from "@/lib/constants";
import BrandLogo from "@/components/common/brandLogo";

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
    href: "/manage-category",
    label: "navigation.manageCategory",
    icon: Layers,
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

export default function DashboardLayout({
  role,
  userName,
  userImage,
  children,
}) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [storedUser, setStoredUser] = useState(null);

  useEffect(() => {
    function readUserFromStorage() {
      try {
        const raw =
          window.localStorage.getItem(AUTH_USER_KEY) ||
          window.sessionStorage.getItem(AUTH_USER_KEY);
        setStoredUser(raw ? JSON.parse(raw) : null);
      } catch {
        setStoredUser(null);
      }
    }

    readUserFromStorage();
    window.addEventListener("storage", readUserFromStorage);
    window.addEventListener("focus", readUserFromStorage);

    return () => {
      window.removeEventListener("storage", readUserFromStorage);
      window.removeEventListener("focus", readUserFromStorage);
    };
  }, []);

  const effectiveRole = role ?? storedUser?.role;
  const effectiveUserName =
    userName ?? storedUser?.name ?? storedUser?.username;
  const effectiveUserImage = userImage ?? storedUser?.image_url;

  const normalizedRole =
    typeof effectiveRole === "object"
      ? effectiveRole.name || effectiveRole.role || effectiveRole.role_name
      : effectiveRole;

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    let isLoggedOut = false;

    function clearSession() {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      window.localStorage.removeItem(AUTH_USER_KEY);
      window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
      window.sessionStorage.removeItem(AUTH_USER_KEY);
    }

    async function validateSession() {
      const token =
        window.localStorage.getItem(AUTH_TOKEN_KEY) ||
        window.sessionStorage.getItem(AUTH_TOKEN_KEY);

      if (!token || isLoggedOut) {
        return;
      }

      try {
        const response = await fetch(ENDPOINTS.CURRENT_USER, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!response.ok && !isLoggedOut) {
          isLoggedOut = true;
          clearSession();
          router.replace("/login");
        }
      } catch {}
    }

    validateSession();
    const intervalId = window.setInterval(validateSession, 5000);
    window.addEventListener("focus", validateSession);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", validateSession);
    };
  }, [router]);

  useEffect(() => {
    document.body.classList.toggle("assetra-menu-open", isSidebarOpen);

    return () => document.body.classList.remove("assetra-menu-open");
  }, [isSidebarOpen]);

  if (!effectiveRole) {
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
      className={`${FONTS.MAIN} assetra-dashboard-shell h-screen overflow-hidden bg-[var(--color-background)] text-[var(--color-text)] flex`}
    >
      {isSidebarOpen && (
        <button
          type="button"
          aria-label={t("closeMenu")}
          onClick={() => setIsSidebarOpen(false)}
          className="assetra-sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`assetra-dashboard-sidebar w-60 shrink-0 border-r border-[var(--color-border)] flex flex-col px-4 py-5 overflow-y-auto ${isSidebarOpen ? "is-open" : ""}`}
      >
        <div className="mb-6 px-2">
          <BrandLogo className="text-lg font-semibold" />
          <div className="mt-2 text-xs text-[var(--color-text-muted)]">
            {t("Trackyourstuff")}
          </div>
          <div className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
            {roleLabel}
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
                onClick={() => setIsSidebarOpen(false)}
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
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Header
          userName={effectiveUserName || t("user")}
          userImage={effectiveUserImage}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
          mobileNavItems={navItems.filter(
            (item) => item.href === "/" || item.href === "/manage-items",
          )}
        />
        <main className="assetra-dashboard-main flex-1 min-h-0 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
