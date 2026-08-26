"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation"; // ← PAKE INI!
import { Link } from "@/i18n/navigation"; // ← PAKE INI!
import { useTranslations } from "next-intl";
import {
  ENDPOINTS,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  ERROR_MESSAGES,
} from "@/lib/constants";

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.6 5.1A10.7 10.7 0 0 1 12 5c7 0 10.5 7 10.5 7a13.3 13.3 0 0 1-3.1 3.9M6.6 6.6C3.4 8.6 1.5 12 1.5 12S5 19 12 19a10.3 10.3 0 0 0 4.4-.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 9.9a3 3 0 0 0 4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter(); // ← OTOMATIS PAKE LOCALE!
  const t = useTranslations("login");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(ENDPOINTS.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          email: identifier.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || ERROR_MESSAGES.LOGIN_FAILED);
        return;
      }

      if (!result.data?.token || !result.data?.user) {
        setError(ERROR_MESSAGES.GENERIC_ERROR);
        return;
      }

      const { token, user } = result.data;

      const storage = rememberMe ? window.localStorage : window.sessionStorage;
      storage.setItem(AUTH_TOKEN_KEY, token);
      storage.setItem(AUTH_USER_KEY, JSON.stringify(user));

      // Dashboard berada di halaman utama locale: /en atau /id.
      router.push("/");
    } catch (err) {
      console.error("Login error:", err);
      setError(ERROR_MESSAGES.CONNECTION_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col items-center justify-center px-4">
      <div className="mb-12 text-2xl font-semibold">Assetra</div>

      <div className="w-full max-w-[405px] rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-7 shadow-2xl">
        <div className="mb-8">
          <h1 className="text-xl font-semibold">{t("title")}</h1>

          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {t("subtitle")}
          </p>
        </div>

        <form onSubmit={handleLogin}>
          {/* Username or Email */}
          <div className="mb-7">
            <label
              htmlFor="identifier"
              className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]"
            >
              {t("identifierLabel")}
            </label>

            <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3">
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={t("identifierPlaceholder")}
                autoComplete="username"
                className="h-11 w-full bg-transparent text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-text-placeholder)]"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]"
            >
              {t("passwordLabel")}
            </label>

            <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="h-11 w-full bg-transparent text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-text-placeholder)]"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-[var(--color-icon-muted)] hover:text-[var(--color-white)]"
                aria-label={
                  showPassword ? t("hidePassword") : t("showPassword")
                }
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="mb-7 flex items-center justify-between text-xs">
            <label className="flex cursor-pointer items-center gap-2 text-[var(--color-text-secondary)]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              {t("rememberMe")}
            </label>

            <Link
              href="/forgot-password"
              className="text-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
            >
              {t("forgotPassword")}
            </Link>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-[var(--color-danger-background)]/20 bg-[var(--color-danger-background)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-[var(--color-primary)] font-semibold text-[var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t("signingIn") : t("signIn")}
          </button>
        </form>

        <div className="mt-6 border-t border-[var(--color-border)] pt-5 text-center text-xs text-[var(--color-text-muted)]">
          {t("accessRestricted")}
        </div>
      </div>
    </main>
  );
}
