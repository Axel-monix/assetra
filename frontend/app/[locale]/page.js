"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import DashboardLayout from "@/components/dashboard/dashboardLayout";
import SuperAdminOverview from "@/components/dashboard/superadminOverview";
import AdminOverview from "@/components/dashboard/adminOverview";
import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  ENDPOINTS,
  ROLES,
} from "@/lib/constants";

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations("manageItem");
  const [user, setUser] = useState(null);
  const [assets, setAssets] = useState([]);
  const [assetError, setAssetError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const raw =
        window.localStorage.getItem(AUTH_USER_KEY) ||
        window.sessionStorage.getItem(AUTH_USER_KEY);

      if (!raw) {
        router.replace("/login");
        return;
      }

      let parsedUser;
      try {
        parsedUser = JSON.parse(raw);
      } catch {
        router.replace("/login");
        return;
      }

      setUser(parsedUser);

      try {
        const token =
          window.localStorage.getItem(AUTH_TOKEN_KEY) ||
          window.sessionStorage.getItem(AUTH_TOKEN_KEY);
        const response = await fetch(ENDPOINTS.ASSETS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || t("admin.loadError"));
        }

        setAssets(result.data || []);
      } catch (error) {
        setAssetError(error.message);
      } finally {
        setChecking(false);
      }
    }

    loadDashboard();
  }, [router, t]);

  if (checking || !user) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center text-[var(--color-text-secondary)] text-sm">
        {t("loading")}
      </div>
    );
  }

  return (
    <DashboardLayout role={user.role} userName={user.name || user.username}>
      {user.role === ROLES.SUPER_ADMIN ? (
        <SuperAdminOverview
          userName={user.name || user.username}
          assets={assets}
          error={assetError}
        />
      ) : (
        <AdminOverview assets={assets} error={assetError} />
      )}
    </DashboardLayout>
  );
}
