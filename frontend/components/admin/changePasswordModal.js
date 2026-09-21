"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X, Loader2, Eye, EyeOff, MailCheck, ShieldCheck } from "lucide-react";
import {
  ENDPOINTS,
  OTP_LENGTH,
  OTP_EXPIRY_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
  ERROR_MESSAGES,
} from "@/lib/constants";

const PASSWORD_MIN_LENGTH = 8;

const STEP = {
  SEND: "send",
  VERIFY: "verify",
  RESET: "reset",
  DONE: "done",
};

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
const BTN_SECONDARY =
  "inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text)] transition hover:bg-[var(--color-input)] disabled:cursor-not-allowed disabled:opacity-60";

function maskEmail(email = "") {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  return `${name.slice(0, 2)}${"*".repeat(Math.max(name.length - 2, 1))}@${domain}`;
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.success, data };
}

function PasswordField({
  label,
  value,
  onChange,
  showLabel,
  hideLabel,
  autoFocus,
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="assetra-profile-field-label">{label}</div>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          className="assetra-form-input w-full pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
          autoFocus={autoFocus}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? hideLabel : showLabel}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        >
          {show ? (
            <EyeOff size={16} strokeWidth={1.75} />
          ) : (
            <Eye size={16} strokeWidth={1.75} />
          )}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordModal({ email, onClose }) {
  const t = useTranslations("changePassword");

  const [step, setStep] = useState(STEP.SEND);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const run = async (task) => {
    setError("");
    setLoading(true);
    try {
      await task();
    } catch {
      setError(ERROR_MESSAGES.CONNECTION_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  const handleSendCode = () =>
    run(async () => {
      const { ok, data } = await postJson(ENDPOINTS.FORGOT_PASSWORD_REQUEST, {
        email,
      });
      if (!ok) {
        setError(data.message || ERROR_MESSAGES.GENERIC_ERROR);
        return;
      }
      setCode("");
      setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      setStep(STEP.VERIFY);
    });

  const handleVerify = () =>
    run(async () => {
      const { ok, data } = await postJson(ENDPOINTS.FORGOT_PASSWORD_VERIFY, {
        email,
        code,
      });
      if (!ok) {
        setError(data.message || ERROR_MESSAGES.OTP_INVALID);
        return;
      }
      setStep(STEP.RESET);
    });

  const handleReset = () => {
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setError(t("passwordTooShort", { length: PASSWORD_MIN_LENGTH }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }
    return run(async () => {
      const { ok, data } = await postJson(ENDPOINTS.FORGOT_PASSWORD_RESET, {
        email,
        code,
        newPassword,
      });
      if (!ok) {
        setError(data.message || ERROR_MESSAGES.GENERIC_ERROR);
        return;
      }
      setStep(STEP.DONE);
    });
  };

  const subtitle = {
    [STEP.SEND]: t("sendDesc", { email: maskEmail(email) }),
    [STEP.VERIFY]: t("verifyDesc", {
      email: maskEmail(email),
      length: OTP_LENGTH,
      minutes: OTP_EXPIRY_MINUTES,
    }),
    [STEP.RESET]: t("resetDesc", { length: PASSWORD_MIN_LENGTH }),
    [STEP.DONE]: t("doneDesc"),
  }[step];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div className="assetra-card w-full max-w-md">
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2
                id="change-password-title"
                className="text-base font-semibold text-[var(--color-text)]"
              >
                {t("title")}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {subtitle}
              </p>
            </div>
            <button
              type="button"
              className="assetra-profile-icon-btn"
              onClick={handleClose}
              disabled={loading}
              aria-label={t("close")}
            >
              <X size={15} />
            </button>
          </div>

          {error && (
            <p className="mb-4 text-xs text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          )}

          {step === STEP.SEND && (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendCode();
              }}
            >
              <div className="flex items-center gap-2 text-sm text-[var(--color-text)]">
                <MailCheck size={16} strokeWidth={1.75} />
                {maskEmail(email)}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className={BTN_SECONDARY}
                  onClick={handleClose}
                  disabled={loading}
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className={BTN_PRIMARY}
                  disabled={loading || !email}
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? t("sending") : t("sendCode")}
                </button>
              </div>
            </form>
          )}

          {step === STEP.VERIFY && (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify();
              }}
            >
              <div>
                <div className="assetra-profile-field-label">
                  {t("codeLabel")}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={OTP_LENGTH}
                  className="assetra-form-input w-full text-center tracking-[0.5em]"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="text-sm text-[var(--color-primary)] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleSendCode}
                  disabled={cooldown > 0 || loading}
                >
                  {cooldown > 0
                    ? t("resendIn", { seconds: cooldown })
                    : t("resendCode")}
                </button>
                <button
                  type="submit"
                  className={BTN_PRIMARY}
                  disabled={loading || code.length !== OTP_LENGTH}
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? t("verifying") : t("verify")}
                </button>
              </div>
            </form>
          )}

          {step === STEP.RESET && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleReset();
              }}
            >
              <PasswordField
                label={t("newPassword")}
                value={newPassword}
                onChange={setNewPassword}
                showLabel={t("showPassword")}
                hideLabel={t("hidePassword")}
                autoFocus
              />
              <PasswordField
                label={t("confirmPassword")}
                value={confirmPassword}
                onChange={setConfirmPassword}
                showLabel={t("showPassword")}
                hideLabel={t("hidePassword")}
              />
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className={BTN_PRIMARY}
                  disabled={loading || !newPassword || !confirmPassword}
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? t("saving") : t("savePassword")}
                </button>
              </div>
            </form>
          )}

          {step === STEP.DONE && (
            <div className="flex flex-col items-center gap-4 py-2">
              <ShieldCheck
                size={36}
                strokeWidth={1.5}
                className="text-[var(--color-primary)]"
              />
              <button type="button" className={BTN_PRIMARY} onClick={onClose}>
                {t("close")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
