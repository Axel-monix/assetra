"use client";

import { X, User } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import ToggleSwitch from "./toggleSwitch";

export default function AdminProfileModal({ admin, onClose, onToggleActive }) {
  const t = useTranslations("manageAdmin");
  const locale = useLocale();

  if (!admin) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getInitial = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)]/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] mb-5">
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            {t("adminProfile")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] transition-colors"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Profile Info */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-20 w-20 rounded-full border-2 border-[var(--color-border)] bg-[var(--color-input)] flex items-center justify-center text-2xl font-bold text-[var(--color-text)] mb-3 overflow-hidden shadow-inner">
            {admin.avatar ? (
              <img
                src={admin.avatar}
                alt={admin.name}
                className="h-full w-full object-cover"
              />
            ) : admin.name ? (
              getInitial(admin.name)
            ) : (
              <User size={32} className="text-[var(--color-text-muted)]" />
            )}
          </div>
          <h3 className="text-base font-bold text-[var(--color-text)]">
            {admin.name}
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {admin.email}
          </p>
        </div>

          {/* Info Cards */}
        <div className="space-y-3">
          {/* Tanggal Bergabung */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-3.5">
            <div className="text-[10px] uppercase font-semibold tracking-wider text-[var(--color-text-muted)] mb-1">
              {t("joined")}
            </div>
            <div className="text-sm font-medium text-[var(--color-text)]">
              {formatDate(admin.created_at)}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-3.5">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              {t("accountStatus")}
            </span>
            <ToggleSwitch
              checked={admin.active ?? admin.status === "active"}
              onChange={(next) => onToggleActive(admin.id, next)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}