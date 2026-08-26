"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { UserPlus, Users, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import DashboardLayout from "@/components/dashboard/dashboardLayout";
import ToggleSwitch from "@/components/admin/toggleSwitch";
import AddAdminModal from "@/components/admin/addAdmin";
import AdminProfile from "@/components/admin/adminProfile"; // ← Perhatikan ini
import {
  AUTH_USER_KEY,
  AUTH_TOKEN_KEY,
  ROLES,
  ENDPOINTS,
} from "@/lib/constants";
import { useTranslations } from "next-intl"; // ← PAKAI INI

const PAGE_SIZE = 4;

function getToken() {
  return (
    window.localStorage.getItem(AUTH_TOKEN_KEY) ||
    window.sessionStorage.getItem(AUTH_TOKEN_KEY)
  );
}

export default function ManageAdminPage() {
  const router = useRouter();
  const t = useTranslations("manageAdmin");

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
      setAdmins(result.data);
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

    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center text-[var(--color-text-secondary)] text-sm">
        {t("loading")}
      </div>
    );
  }

  return (
    <DashboardLayout role={user.role} userName={user.name || user.username}>
      <div>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">{t("title")}</h1>{" "}
            {/* ← HAPUS "manageAdmin." */}
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {t("subtitle")} {/* ← HAPUS "manageAdmin." */}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-contrast)] hover:bg-[var(--color-primary-hover)]"
          >
            <UserPlus size={16} strokeWidth={2} />
            {t("addNewAdmin")} {/* ← HAPUS "manageAdmin." */}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-[var(--color-danger-background)]/20 bg-[var(--color-danger-background)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:col-span-2 sm:max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
                {t("totalAdmins")} {/* ← HAPUS "manageAdmin." */}
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-border)] text-[var(--color-primary-soft)]">
                <Users size={14} strokeWidth={1.75} />
              </span>
            </div>
            <div className="text-2xl font-semibold text-[var(--color-primary)]">
              {totalAdmins}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:col-span-2 sm:max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
                {t("activeNow")} {/* ← HAPUS "manageAdmin." */}
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]">
                <Zap size={14} strokeWidth={1.75} />
              </span>
            </div>
            <div className="text-2xl font-semibold text-[var(--color-cyan)]">
              {activeNow}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th className="py-3 px-5 font-medium">{t("administrator")}</th>
                <th className="py-3 px-5 font-medium">{t("joinedDate")}</th>
                <th className="py-3 px-5 font-medium">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-8 text-center text-sm text-[var(--color-text-muted)]"
                  >
                    {t("loading")}
                  </td>
                </tr>
              ) : pageAdmins.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-8 text-center text-sm text-[var(--color-text-muted)]"
                  >
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                pageAdmins.map((admin) => (
                  <tr
                    key={admin.id}
                    onClick={() => setSelectedAdmin(admin)}
                    className="cursor-pointer border-b border-[var(--color-surface)] last:border-0 hover:bg-[var(--color-input)]"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-[var(--color-border)] flex items-center justify-center text-xs font-semibold text-[var(--color-text-secondary)]">
                          {admin.name[0]}
                        </div>
                        <div>
                          <div className="font-medium">{admin.name}</div>
                          <div className="text-xs text-[var(--color-text-muted)]">
                            {admin.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-[var(--color-text-secondary)]">
                      {new Date(admin.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-5">
                      <ToggleSwitch
                        checked={admin.status === "active"}
                        onChange={(next) => handleToggleActive(admin.id, next)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
            <span>
              {t("showing", {
                from: totalAdmins === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
                to: Math.min(page * PAGE_SIZE, totalAdmins),
                total: totalAdmins,
              })}{" "}
              {/* ← HAPUS "manageAdmin." */}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-border)] disabled:opacity-40"
              >
                <ChevronLeft size={14} strokeWidth={1.75} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`flex h-7 w-7 items-center justify-center rounded-md ${
                    p === page
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)] font-semibold"
                      : "border border-[var(--color-border)] text-[var(--color-text-secondary)]"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-border)] disabled:opacity-40"
              >
                <ChevronRight size={14} strokeWidth={1.75} />
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
