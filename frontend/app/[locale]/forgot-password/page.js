"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  ENDPOINTS,
  VALIDATION,
  OTP_LENGTH,
  OTP_RESEND_COOLDOWN_SECONDS,
  FORGOT_PASSWORD_STEP,
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

function MailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="4.5"
        width="19"
        height="15"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M3.5 6.5 12 13l8.5-6.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 12.5 10 16.5 18 8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const t = useTranslations("forgotPassword");

  const [step, setStep] = useState(FORGOT_PASSWORD_STEP.EMAIL);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(new Array(OTP_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldError, setFieldError] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // ---------- STEP 1: kirim email, minta kode ----------
  async function handleSendCode(event) {
    event.preventDefault();
    setServerError("");
    setFieldError("");

    if (!email.trim()) {
      setFieldError(t("emailRequired"));
      return;
    }
    if (!VALIDATION.EMAIL_REGEX.test(email.trim())) {
      setFieldError(t("emailInvalid"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS.FORGOT_PASSWORD_REQUEST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const result = await res.json();

      // Backend mengecek apakah email terdaftar. Kalau tidak terdaftar,
      // backend mengembalikan success:false dengan message yang jelas.
      if (!res.ok || !result.success) {
        setServerError(result.message || t("emailNotRegistered"));
        return;
      }

      setStep(FORGOT_PASSWORD_STEP.VERIFY_CODE);
      setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
    } catch {
      console.error("Send code error:", err);
      setServerError(t("connectionError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (cooldown > 0) return;
    setServerError("");
    try {
      const res = await fetch(ENDPOINTS.FORGOT_PASSWORD_REQUEST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setServerError(result.message || t("genericError"));
        return;
      }
      setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
    } catch {
      setServerError(t("connectionError"));
    }
  }

  // ---------- STEP 2: input kode ----------
  function handleCodeChange(index, value) {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const nextCode = [...code];
    nextCode[index] = digit;
    setCode(nextCode);
    setServerError("");

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleCodeKeyDown(index, event) {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyCode(event) {
    event.preventDefault();
    setServerError("");

    const fullCode = code.join("");
    if (fullCode.length < OTP_LENGTH) {
      setServerError(t("otpInvalid"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS.FORGOT_PASSWORD_VERIFY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: fullCode }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setServerError(result.message || t("otpInvalid"));
        return;
      }

      setStep(FORGOT_PASSWORD_STEP.NEW_PASSWORD);
    } catch (err) {
      console.error("Verify code error:", err);
      setServerError(t("connectionError"));
    } finally {
      setLoading(false);
    }
  }

  // ---------- STEP 3: password baru ----------
  async function handleResetPassword(event) {
    event.preventDefault();
    setServerError("");
    setFieldError("");

    if (!newPassword) {
      setFieldError(t("passwordRequired"));
      return;
    }
    if (newPassword.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      setFieldError(
        t("passwordTooShort", { length: VALIDATION.PASSWORD_MIN_LENGTH }),
      );
      return;
    }
    if (confirmPassword !== newPassword) {
      setFieldError(t("passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS.FORGOT_PASSWORD_RESET, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: code.join(""),
          newPassword,
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setServerError(result.message || t("genericError"));
        return;
      }

      setStep(FORGOT_PASSWORD_STEP.SUCCESS);
    } catch (err) {
      console.error("Reset password error:", err);
      setServerError(t("connectionError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col items-center justify-center px-4 relative">
      <div className="mb-12 text-2xl font-semibold">Assetra</div>

      <div className="w-full max-w-[405px] rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-7 shadow-2xl">
        {/* ---------- STEP 1: EMAIL ---------- */}
        {step === FORGOT_PASSWORD_STEP.EMAIL && (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-xl font-semibold">{t("title")}</h1>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {t("subtitle")}
              </p>
            </div>

            <form onSubmit={handleSendCode}>
              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]"
                >
                  {t("emailLabel")}
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3">
                  <span className="text-[var(--color-text-placeholder)]">
                    <MailIcon />
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setFieldError("");
                    }}
                    placeholder={t("emailPlaceholder")}
                    className="h-11 w-full bg-transparent text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-text-placeholder)]"
                    required
                  />
                </div>
                {fieldError && (
                  <p className="mt-2 text-xs text-[var(--color-danger)]">
                    {fieldError}
                  </p>
                )}
              </div>

              {serverError && (
                <div className="mb-4 rounded-lg border border-[var(--color-danger-background)]/20 bg-[var(--color-danger-background)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-lg bg-[var(--color-primary)] font-semibold text-[var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t("sending") : t("sendCode")}
              </button>

              <Link
                href="/login"
                className="mt-5 block text-center text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-white)]"
              >
                {t("backToLogin")}
              </Link>
            </form>
          </>
        )}

        {/* ---------- STEP 2: VERIFY CODE ---------- */}
        {step === FORGOT_PASSWORD_STEP.VERIFY_CODE && (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-xl font-semibold">{t("codeTitle")}</h1>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {t("codeSubtitle", { email })}
              </p>
            </div>

            <form onSubmit={handleVerifyCode}>
              <div className="mb-6 flex justify-between gap-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) =>
                      handleCodeChange(index, event.target.value)
                    }
                    onKeyDown={(event) => handleCodeKeyDown(index, event)}
                    className="h-12 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] text-center text-lg font-semibold text-[var(--color-white)] outline-none focus:border-[var(--color-primary)]"
                  />
                ))}
              </div>

              {serverError && (
                <div className="mb-4 rounded-lg border border-[var(--color-danger-background)]/20 bg-[var(--color-danger-background)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-lg bg-[var(--color-primary)] font-semibold text-[var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t("verifying") : t("verifyCode")}
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={cooldown > 0}
                className="mt-4 block w-full text-center text-xs text-[var(--color-primary-soft)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:text-[var(--color-text-placeholder)]"
              >
                {cooldown > 0
                  ? t("resendCooldown", { seconds: cooldown })
                  : t("resendCode")}
              </button>

              <Link
                href="/login"
                className="mt-3 block text-center text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-white)]"
              >
                {t("backToLogin")}
              </Link>
            </form>
          </>
        )}

        {/* ---------- STEP 3: NEW PASSWORD ---------- */}
        {step === FORGOT_PASSWORD_STEP.NEW_PASSWORD && (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-xl font-semibold">{t("newPasswordTitle")}</h1>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {t("newPasswordSubtitle")}
              </p>
            </div>

            <form onSubmit={handleResetPassword}>
              <div className="mb-5">
                <label
                  htmlFor="newPassword"
                  className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]"
                >
                  {t("newPasswordLabel")}
                </label>
                <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3">
                  <input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                      setFieldError("");
                    }}
                    placeholder={t("newPasswordPlaceholder")}
                    className="h-11 w-full bg-transparent text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-text-placeholder)]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="ml-2 text-[var(--color-icon-muted)] hover:text-[var(--color-white)]"
                    aria-label={
                      showNewPassword ? t("hidePassword") : t("showPassword")
                    }
                  >
                    {showNewPassword ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]"
                >
                  {t("confirmPasswordLabel")}
                </label>
                <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setFieldError("");
                    }}
                    placeholder={t("confirmPasswordPlaceholder")}
                    className="h-11 w-full bg-transparent text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-text-placeholder)]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="ml-2 text-[var(--color-icon-muted)] hover:text-[var(--color-white)]"
                    aria-label={
                      showConfirmPassword
                        ? t("hidePassword")
                        : t("showPassword")
                    }
                  >
                    {showConfirmPassword ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
              </div>

              {fieldError && (
                <div className="mb-4 rounded-lg border border-[var(--color-danger-background)]/20 bg-[var(--color-danger-background)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
                  {fieldError}
                </div>
              )}
              {serverError && (
                <div className="mb-4 rounded-lg border border-[var(--color-danger-background)]/20 bg-[var(--color-danger-background)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-lg bg-[var(--color-primary)] font-semibold text-[var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t("saving") : t("resetPassword")}
              </button>
            </form>
          </>
        )}

        {/* ---------- STEP 4: SUCCESS ---------- */}
        {step === FORGOT_PASSWORD_STEP.SUCCESS && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/15 text-teal-400">
              <CheckCircleIcon />
            </div>
            <h1 className="text-xl font-semibold">{t("successTitle")}</h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              {t("successSubtitle")}
            </p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-6 h-11 w-full rounded-lg bg-[var(--color-primary)] font-semibold text-[var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)]"
            >
              {t("backToSignIn")}
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-6 left-6 text-[10px] tracking-widest text-[var(--color-divider)]">
        SECURITY_PROTOCOL_v1.0.4
      </div>
    </main>
  );
}
