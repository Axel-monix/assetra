"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Calendar,
  Activity,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/dashboardLayout";
import { Link } from "@/i18n/navigation";
import { AUTH_USER_KEY, ROLES } from "@/lib/constants";

export default function ProfilePage() {
  const router = useRouter();
  const t = useTranslations("profile");

  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const raw =
      window.localStorage.getItem(AUTH_USER_KEY) ||
      window.sessionStorage.getItem(AUTH_USER_KEY);

    if (!raw) {
      router.replace("/login");
      return;
    }

    let timer;
    try {
      const parsed = JSON.parse(raw);
      timer = setTimeout(() => {
        setUser(parsed);
        setChecking(false);
      }, 0);
    } catch {
      router.replace("/login");
      return;
    }

    return () => clearTimeout(timer);
  }, [router]);

  if (checking || !user) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center text-[var(--color-text-secondary)] text-sm">
        {t("loading")}
      </div>
    );
  }

  const roleLabel =
    user.role === ROLES.SUPER_ADMIN ? t("superAdmin") : t("admin");
  const isActive = user.status === "active";

  const infoItems = [
    {
      icon: User,
      label: t("name"),
      value: user.name || user.username || "-",
    },
    {
      icon: Mail,
      label: t("email"),
      value: user.email || "-",
    },
    {
      icon: Shield,
      label: t("role"),
      value: roleLabel,
    },
    {
      icon: Activity,
      label: t("status"),
      value: isActive ? t("active") : t("inactive"),
      valueClass: isActive
        ? "text-[var(--color-success)]"
        : "text-[var(--color-danger)]",
    },
    {
      icon: Calendar,
      label: t("joined"),
      value: user.created_at
        ? new Date(user.created_at).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "-",
    },
  ];

  return (
    <DashboardLayout role={user.role} userName={user.name || user.username}>
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition mb-4"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          {t("backToDashboard")}
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {t("subtitle")}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          {/* Profile header */}
          <div className="flex items-center gap-4 px-6 py-5 border-b border-[var(--color-border)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
              <User size={28} strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-lg font-semibold">
                {user.name || user.username}
              </div>
              <div className="text-sm text-[var(--color-text-muted)]">
                {roleLabel}
              </div>
            </div>
          </div>

          {/* Profile info */}
          <div className="divide-y divide-[var(--color-border)]">
            {infoItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-border)]">
                    <Icon
                      size={16}
                      strokeWidth={1.75}
                      className="text-[var(--color-text-secondary)]"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
                      {item.label}
                    </div>
                    <div
                      className={`text-sm font-medium ${item.valueClass || "text-[var(--color-text)]"}`}
                    >
                      {item.value}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
