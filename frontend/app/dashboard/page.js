"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dashboardLayout from "@/components/dashboard/dashboardLayout";
import superAdminOverview from "@/components/dashboard/superAdminOverview";
import adminOverview from "@/components/dashboard/adminOverview";
import { AUTH_USER_KEY, ROLES } from "@/lib/constants";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Token/user bisa ada di localStorage (remember me) atau sessionStorage.
    const raw =
      window.localStorage.getItem(AUTH_USER_KEY) ||
      window.sessionStorage.getItem(AUTH_USER_KEY);

    if (!raw) {
      router.replace("/login");
      return;
    }

    try {
      setUser(JSON.parse(raw));
    } catch (err) {
      router.replace("/login");
      return;
    } finally {
      setChecking(false);
    }
  }, [router]);

  if (checking || !user) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-[#A1A1AA] text-sm">
        Memuat...
      </div>
    );
  }

  return (
    <dashboardLayout role={user.role} userName={user.name || user.username}>
      {user.role === ROLES.SUPER_ADMIN ? (
        <superAdminOverview userName={user.name || user.username} />
      ) : (
        <adminOverview />
      )}
    </dashboardLayout>
  );
}
