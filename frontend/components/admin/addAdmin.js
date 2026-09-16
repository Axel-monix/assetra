"use client";

import { useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AddAdminModal({ onClose, onSubmit }) {
  const t = useTranslations("manageAdmin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    const nextValue = name === "email" ? value.toLowerCase() : value;

    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setError("");
  }
  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError(t("allFieldsRequired"));
      return;
    }
    if (form.password.length < 8) {
      setError(t("passwordMinLength", { min: 8 }));
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
            <label
              htmlFor="add-admin-name"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]"
            >
              {t("name")}
            </label>
            <input
              id="add-admin-name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              placeholder={t("namePlaceholder")}
              className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label
              htmlFor="add-admin-email"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]"
            >
              {t("email")}
            </label>
            <input
              id="add-admin-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder={t("emailPlaceholder")}
              className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label
              htmlFor="add-admin-password"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]"
            >
              {t("temporaryPassword")}
            </label>
            <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3">
              <input
                id="add-admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                placeholder={t("passwordPlaceholder")}
                className="h-11 w-full bg-transparent text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-text-placeholder)]"
              />

              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="ml-2 text-[var(--color-icon-muted)] hover:text-[var(--color-white)]"
                aria-label={
                  showPassword ? t("hidePassword") : t("showPassword")
                }
                aria-pressed={showPassword}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
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
