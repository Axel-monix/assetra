"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
        setError(result.message || "Gagal memuat data admin.");
        return;
      }
      setAdmins(result.data);
    } catch (err) {
      console.error("Fetch admins error:", err);
      setError("Tidak bisa terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }, []);

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
      const reason = window.prompt("Alasan menonaktifkan admin ini?");
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
        alert(result.message || "Gagal memperbarui status admin.");
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
      alert("Tidak bisa terhubung ke server.");
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
      throw new Error(result.message || "Gagal menambahkan admin.");
    }

    setAdmins((prev) => [result.data, ...prev]);
  }

  const totalAdmins = admins.length;
  const activeNow = admins.filter((a) => a.status === "active").length;
  const totalPages = Math.max(1, Math.ceil(totalAdmins / PAGE_SIZE));
  const pageAdmins = admins.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-[#A1A1AA] text-sm">
        Memuat...
      </div>
    );
  }

  return (
    <DashboardLayout role={user.role} userName={user.name || user.username}>
      <div>
        <div className="text-xs text-[#71717A] uppercase tracking-wide mb-1">
          Main Content Canvas
        </div>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">{t("title")}</h1>{" "}
            {/* ← HAPUS "manageAdmin." */}
            <p className="mt-1 text-sm text-[#A1A1AA]">
              {t("subtitle")} {/* ← HAPUS "manageAdmin." */}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#8083FF] px-4 py-2.5 text-sm font-semibold text-[#111323] hover:bg-[#9295FF]"
          >
            <UserPlus size={16} strokeWidth={2} />
            {t("addNewAdmin")} {/* ← HAPUS "manageAdmin." */}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-[#272D3D] bg-[#131824] p-5 sm:col-span-2 sm:max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wide text-[#71717A]">
                {t("totalAdmins")} {/* ← HAPUS "manageAdmin." */}
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#272D3D] text-[#A5A7FF]">
                <Users size={14} strokeWidth={1.75} />
              </span>
            </div>
            <div className="text-2xl font-semibold text-[#8083FF]">
              {totalAdmins}
            </div>
          </div>

          <div className="rounded-xl border border-[#272D3D] bg-[#131824] p-5 sm:col-span-2 sm:max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wide text-[#71717A]">
                {t("activeNow")} {/* ← HAPUS "manageAdmin." */}
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-400/15 text-cyan-400">
                <Zap size={14} strokeWidth={1.75} />
              </span>
            </div>
            <div className="text-2xl font-semibold text-cyan-400">
              {activeNow}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#272D3D] bg-[#131824] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-[#71717A] border-b border-[#272D3D]">
                <th className="py-3 px-5 font-medium">
                  {t("administrator")} {/* ← HAPUS "manageAdmin." */}
                </th>
                <th className="py-3 px-5 font-medium">
                  {t("joinedDate")} {/* ← HAPUS "manageAdmin." */}
                </th>
                <th className="py-3 px-5 font-medium">
                  {t("status")} {/* ← HAPUS "manageAdmin." */}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-8 text-center text-sm text-[#71717A]"
                  >
                    Memuat...
                  </td>
                </tr>
              ) : pageAdmins.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-8 text-center text-sm text-[#71717A]"
                  >
                    Belum ada admin.
                  </td>
                </tr>
              ) : (
                pageAdmins.map((admin) => (
                  <tr
                    key={admin.id}
                    onClick={() => setSelectedAdmin(admin)}
                    className="cursor-pointer border-b border-[#1D2230] last:border-0 hover:bg-[#0D0D15]"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-[#272D3D] flex items-center justify-center text-xs font-semibold text-[#A1A1AA]">
                          {admin.name[0]}
                        </div>
                        <div>
                          <div className="font-medium">{admin.name}</div>
                          <div className="text-xs text-[#71717A]">
                            {admin.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-[#A1A1AA]">
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

          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#272D3D] text-xs text-[#71717A]">
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
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[#272D3D] disabled:opacity-40"
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
                      ? "bg-[#8083FF] text-[#111323] font-semibold"
                      : "border border-[#272D3D] text-[#A1A1AA]"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[#272D3D] disabled:opacity-40"
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
