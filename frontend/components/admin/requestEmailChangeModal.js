"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, ShieldCheck, ArrowRight } from "lucide-react";
import {
  ENDPOINTS,
  AUTH_TOKEN_KEY,
  OTP_LENGTH,
  VALIDATION,
  ERROR_MESSAGES,
} from "@/lib/constants";

const STEP = { EMAIL: "email", VERIFY: "verify" };

function getToken() {
  return (
    window.localStorage.getItem(AUTH_TOKEN_KEY) ||
    window.sessionStorage.getItem(AUTH_TOKEN_KEY)
  );
}

export default function RequestEmailChangeModal({
  currentEmail,
  onClose,
  onSuccess,
}) {
  const t = useTranslations("profile");
  const [step, setStep] = useState(STEP.EMAIL);
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = async () => {
    if (!VALIDATION.EMAIL_REGEX.test(newEmail)) {
      setError(t("newEmailInvalid"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS.REQUEST_EMAIL_CHANGE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ newEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || ERROR_MESSAGES.GENERIC_ERROR);
        return;
      }
      setStep(STEP.VERIFY);
    } catch {
      setError(ERROR_MESSAGES.CONNECTION_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== OTP_LENGTH) {
      setError(ERROR_MESSAGES.OTP_INVALID);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS.VERIFY_EMAIL_CHANGE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || ERROR_MESSAGES.OTP_INVALID);
        return;
      }
      onSuccess(data.data);
    } catch {
      setError(ERROR_MESSAGES.CONNECTION_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assetra-modal-overlay" onClick={onClose}>
      <div className="assetra-modal-wrapper">
        <div
          className="assetra-modal-card assetra-modal-card--sm"
          onClick={(e) => e.stopPropagation()}
        >
          {step === STEP.EMAIL ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Mail size={17} className="text-[var(--color-primary)]" />
                <h2 className="text-base font-semibold text-[var(--color-text)]">
                  {t("changeEmailTitle")}
                </h2>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mb-5">
                {t("changeEmailDesc")}
              </p>

              {error && <div className="assetra-error-box mb-4">{error}</div>}

              <div className="mb-4">
                <label className="assetra-form-label">{t("currentEmail")}</label>
                <input
                  type="email"
                  className="assetra-form-input"
                  value={currentEmail || ""}
                  disabled
                />
              </div>

              <div className="mb-5">
                <label className="assetra-form-label">{t("newEmail")}</label>
                <input
                  type="email"
                  className="assetra-form-input"
                  placeholder={t("newEmailPlaceholder")}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="assetra-btn assetra-btn-secondary"
                  onClick={onClose}
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  className="assetra-btn assetra-btn-primary flex items-center gap-1.5"
                  onClick={handleSendCode}
                  disabled={loading}
                >
                  {loading ? t("sending") : t("sendCode")}
                  <ArrowRight size={13} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={17} className="text-[var(--color-primary)]" />
                <h2 className="text-base font-semibold text-[var(--color-text)]">
                  {t("verifyCodeTitle")}
                </h2>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mb-5">
                {t("verifyCodeDesc", { email: newEmail })}
              </p>

              {error && <div className="assetra-error-box mb-4">{error}</div>}

              <div className="mb-5">
                <label className="assetra-form-label">{t("verificationCode")}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={OTP_LENGTH}
                  className="assetra-form-input text-center tracking-[0.5em] font-semibold"
                  placeholder={"0".repeat(OTP_LENGTH)}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="assetra-filter-clear-inline"
                  onClick={() => setStep(STEP.EMAIL)}
                >
                  {t("changeAddress")}
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="assetra-btn assetra-btn-secondary"
                    onClick={onClose}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    className="assetra-btn assetra-btn-primary"
                    onClick={handleVerify}
                    disabled={loading}
                  >
                    {loading ? t("verifying") : t("verifyAndSave")}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}