"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AddAdminModal({ onClose, onSubmit }) {
  const t = useTranslations("manageAdmin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError(t("allFieldsRequired"));
      return;
    }
    if (form.password.length < 8) {
      setError(t("passwordMinLength"));
      return;
    }

    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err.message || t("addFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)]/60 px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold">{t("addNewAdmin")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-white)]"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              {t("name")}
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder={t("namePlaceholder")}
              className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              {t("email")}
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder={t("emailPlaceholder")}
              className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              {t("temporaryPassword")}
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder={t("passwordPlaceholder")}
              className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-primary)]"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-[var(--color-danger-background)]/20 bg-[var(--color-danger-background)]/10 px-3 py-2 text-xs text-[var(--color-danger)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-[var(--color-primary)] font-semibold text-[var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t("adding") : t("addAdmin")}
          </button>
        </form>
      </div>
    </div>
  );
}
