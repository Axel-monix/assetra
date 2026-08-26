"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { UserPlus, Users, Zap, ChevronLeft, ChevronRight, User } from "lucide-react";
import DashboardLayout from "@/components/dashboard/dashboardLayout";
import ToggleSwitch from "@/components/admin/toggleSwitch";
import AddAdminModal from "@/components/admin/addAdmin";
import AdminProfile from "@/components/admin/adminProfile";
import {
  AUTH_USER_KEY,
  AUTH_TOKEN_KEY,
  ROLES,
  ENDPOINTS,
} from "@/lib/constants";
import { useTranslations, useLocale } from "next-intl";

const PAGE_SIZE = 4;

function getToken() {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem(AUTH_TOKEN_KEY) ||
    window.sessionStorage.getItem(AUTH_TOKEN_KEY)
  );
}

export default function ManageAdminPage() {
  const router = useRouter();
  const t = useTranslations("manageAdmin");
  const locale = useLocale();

  const [user, setUser] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(ENDPOINTS.ADMINS, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setError(result.message || t("loadError"));
        return;
      }
      setAdmins(result.data || []);
    } catch (err) {
      console.error("Fetch admins error:", err);
      setError(t("connectionError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const raw =
      window.localStorage.getItem(AUTH_USER_KEY) ||
      window.sessionStorage.getItem(AUTH_USER_KEY);
    if (!raw) {
      router.replace("/login");
      return;
    }
    const parsed = JSON.parse(raw);

    if (parsed.role !== ROLES.SUPER_ADMIN) {
      router.replace("/");
      return;
    }

    setUser(parsed);
    fetchAdmins();
  }, [router, fetchAdmins]);

  async function handleToggleActive(id, nextActive) {
    let body;

    if (nextActive) {
      body = { action: "reactivate" };
    } else {
      const reason = window.prompt(t("deactivateReason"));
      if (!reason || !reason.trim()) return;
      body = { action: "deactivate", reason: reason.trim(), type: "temporary" };
    }

    try {
      const res = await fetch(ENDPOINTS.ADMIN_STATUS(id), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        alert(result.message || t("statusUpdateFailed"));
        return;
      }

      setAdmins((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, status: nextActive ? "active" : "inactive" }
            : a,
        ),
      );
      setSelectedAdmin((prev) =>
        prev && prev.id === id
          ? { ...prev, status: nextActive ? "active" : "inactive" }
          : prev,
      );
    } catch (err) {
      console.error("Toggle status error:", err);
      alert(t("connectionError"));
    }
  }

  async function handleAddAdmin(form) {
    const res = await fetch(ENDPOINTS.ADMINS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(form),
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || t("addFailed"));
    }

    setAdmins((prev) => [result.data, ...prev]);
  }

  const totalAdmins = admins.length;
  const activeNow = admins.filter((a) => a.status === "active").length;
  const totalPages = Math.max(1, Math.ceil(totalAdmins / PAGE_SIZE));
  const pageAdmins = admins.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatLastActivity = (admin) => {
    if (admin.last_activity) return admin.last_activity;
    if (admin.last_login) return formatDate(admin.last_login);
    return admin.status === "active" ? "2 mins ago" : "Inactive";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center text-[var(--color-text-secondary)] text-sm">
        {t("loading")}
      </div>
    );
  }

  return (
    <DashboardLayout role={user.role} userName={user.name || user.username}>
      <div className="flex flex-col gap-6 w-full">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
              {t("title")}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t("subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary,#4f46e5)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all shadow-sm shrink-0"
          >
            <UserPlus size={16} strokeWidth={2.2} />
            <span>+ {t("addNewAdmin")}</span>
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-[var(--color-danger-background)]/30 bg-[var(--color-danger-background)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        {/* Stats Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full sm:max-w-2xl">
          {/* Card 1: Total Admins */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              {t("totalAdmins")}
            </span>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-3xl font-extrabold text-[var(--color-text)]">
                {totalAdmins}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                <Users size={18} strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Card 2: Active Now */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              {t("activeNow")}
            </span>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-3xl font-extrabold text-[var(--color-success,#22d3ee)]">
                {activeNow}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-success,#22d3ee)]">
                <Zap size={18} strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden shadow-sm flex flex-col w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] bg-transparent">
                  <th className="py-4 px-6">{t("administrator")}</th>
                  <th className="py-4 px-6">{t("joinedDate")}</th>
                  <th className="py-4 px-6">{t("lastActivity")}</th>
                  <th className="py-4 px-6">{t("status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]/50">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-sm text-[var(--color-text-muted)]"
                    >
                      {t("loading")}
                    </td>
                  </tr>
                ) : pageAdmins.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-sm text-[var(--color-text-muted)]"
                    >
                      {t("empty")}
                    </td>
                  </tr>
                ) : (
                  pageAdmins.map((admin) => (
                    <tr
                      key={admin.id}
                      onClick={() => setSelectedAdmin(admin)}
                      className="group cursor-pointer hover:bg-[var(--color-surface)]/50 transition-colors"
                    >
                      {/* Administrator Column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="h-10 w-10 rounded-full border border-[var(--color-border)] bg-[var(--color-input)] flex items-center justify-center text-sm font-semibold text-[var(--color-text)] shrink-0 group-hover:border-[var(--color-primary,#4f46e5)] transition-colors overflow-hidden">
                            {admin.avatar ? (
                              <img
                                src={admin.avatar}
                                alt={admin.name}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : admin.name ? (
                              admin.name[0].toUpperCase()
                            ) : (
                              <User size={18} className="text-[var(--color-text-muted)]" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <div className="font-semibold text-[var(--color-text)] text-sm">
                              {admin.name}
                            </div>
                            <div className="text-xs text-[var(--color-text-muted)] font-normal">
                              {admin.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Joined Date Column */}
                      <td className="py-4 px-6 text-sm text-[var(--color-text-secondary)] font-normal whitespace-nowrap">
                        {formatDate(admin.created_at)}
                      </td>

                      {/* Last Activity Column */}
                      <td className="py-4 px-6 text-sm text-[var(--color-text-secondary)] font-normal whitespace-nowrap">
                        {formatLastActivity(admin)}
                      </td>

                      {/* Status Column */}
                      <td
                        className="py-4 px-6 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-3">
                          <ToggleSwitch
                            checked={admin.status === "active"}
                            onChange={(next) =>
                              handleToggleActive(admin.id, next)
                            }
                            showLabel={false}
                          />
                          <span
                            className={`text-xs font-semibold ${
                              admin.status === "active"
                                ? "text-[var(--color-success,#22d3ee)]"
                                : "text-[var(--color-text-muted)]"
                            }`}
                          >
                            {admin.status === "active"
                              ? t("active")
                              : t("inactive")}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-[var(--color-border)] gap-4 text-xs text-[var(--color-text-muted)] w-full">
            <span>
              {t("showing", {
                from: totalAdmins === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
                to: Math.min(page * PAGE_SIZE, totalAdmins),
                total: totalAdmins,
              })}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft size={16} strokeWidth={2} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    p === page
                      ? "bg-[var(--color-primary,#4f46e5)] text-white font-semibold shadow-sm"
                      : "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddAdminModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddAdmin}
        />
      )}

      {selectedAdmin && (
        <AdminProfile
          admin={{
            ...selectedAdmin,
            active: selectedAdmin.status === "active",
          }}
          onClose={() => setSelectedAdmin(null)}
          onToggleActive={handleToggleActive}
        />
      )}
    </DashboardLayout>
  );
}