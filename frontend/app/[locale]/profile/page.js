"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  User,
  Camera,
  Pencil,
  Check,
  X,
  Briefcase,
  Lock,
  Mail,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/dashboardLayout";
import RequestEmailChangeModal from "@/components/admin/requestEmailChangeModal";
import { AUTH_USER_KEY, ROLES } from "@/lib/constants";

export default function ProfilePage() {
  const router = useRouter();
  const t = useTranslations("profile");

  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const raw =
      window.localStorage.getItem(AUTH_USER_KEY) ||
      window.sessionStorage.getItem(AUTH_USER_KEY);

    if (!raw) {
      router.replace("/login");
      return;
    }

    let timer;
    try {
      const parsed = JSON.parse(raw);
      timer = setTimeout(() => {
        setUser(parsed);
        setNameDraft(parsed.name || parsed.username || "");
        setChecking(false);
      }, 0);
    } catch {
      router.replace("/login");
      return;
    }

    return () => clearTimeout(timer);
  }, [router]);

  if (checking || !user) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center text-[var(--color-text-secondary)] text-sm">
        {t("loading")}
      </div>
    );
  }

  const roleLabel =
    user.role === ROLES.SUPER_ADMIN ? t("superAdmin") : t("administrator");

  const handlePickPhoto = () => fileInputRef.current?.click();

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    // TODO: upload ke endpoint yang sesuai (mis. /api/users/me/photo)
    // lalu update user.image_url setelah sukses.
  };

  const handleStartEditName = () => {
    setNameDraft(user.name || user.username || "");
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setNameDraft(user.name || user.username || "");
  };

  const handleSaveName = async () => {
    if (!nameDraft.trim()) return;
    setSavingName(true);
    try {
      const token =
        window.localStorage.getItem("token") ||
        window.sessionStorage.getItem("token");
      const res = await fetch(ENDPOINTS.UPDATE_PROFILE, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: nameDraft.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = { ...user, name: data.data.name };
        setUser(updated);
        window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
        setIsEditingName(false);
      }
    } finally {
      setSavingName(false);
    }
  };

  const handleEmailChangeSuccess = (updatedUser) => {
    const merged = { ...user, email: updatedUser.email };
    setUser(merged);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(merged));
    setShowEmailModal(false);
  };

  const handleSubmitEmailRequest = async (payload) => {
    // TODO: POST /api/email-change-requests { newEmail, reason }
    console.log("Email change request:", payload);
    setShowEmailModal(false);
  };

  return (
    <DashboardLayout role={user.role} userName={user.name || user.username}>
      <div>
        {/* Profile header */}
        <div className="assetra-profile-header">
          <div className="assetra-profile-avatar-wrap">
            <div className="assetra-profile-avatar">
              {avatarPreview || user.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview || user.image_url} alt={user.name} />
              ) : (
                <User size={32} strokeWidth={1.5} />
              )}
            </div>
            <button
              type="button"
              className="assetra-profile-avatar-edit-btn"
              onClick={handlePickPhoto}
              aria-label={t("changePhoto")}
            >
              <Camera size={13} strokeWidth={2} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          <div>
            <div className="assetra-profile-name">
              {user.name || user.username}
            </div>
            <div className="assetra-profile-role-badge">
              <span className="assetra-profile-role-dot" />
              {roleLabel}
            </div>
            <button
              type="button"
              className="assetra-profile-change-photo"
              onClick={handlePickPhoto}
            >
              {t("changePhoto")} &rarr;
            </button>
          </div>
        </div>

        {/* Identity + Security */}
        <div className="assetra-profile-grid">
          {/* Identity */}
          <div className="assetra-card">
            <div className="assetra-profile-card-header">
              <Briefcase size={16} strokeWidth={1.75} />
              {t("identity")}
            </div>
            <div className="assetra-profile-card-body">
              <div>
                <div className="assetra-profile-field-label">
                  {t("fullName")}
                </div>
                {isEditingName ? (
                  <div className="assetra-profile-field-row">
                    <input
                      type="text"
                      className="assetra-form-input assetra-profile-field-input"
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="assetra-profile-icon-btn"
                      onClick={handleSaveName}
                      disabled={savingName}
                      aria-label={t("save")}
                    >
                      <Check size={15} />
                    </button>
                    <button
                      type="button"
                      className="assetra-profile-icon-btn"
                      onClick={handleCancelEditName}
                      aria-label={t("cancel")}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="assetra-profile-field-row">
                    <div className="assetra-profile-field-value">
                      {user.name || user.username}
                    </div>
                    <button
                      type="button"
                      className="assetra-profile-icon-btn"
                      onClick={handleStartEditName}
                      aria-label={t("edit")}
                    >
                      <Pencil size={14} strokeWidth={1.75} />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="assetra-profile-field-label">
                  {t("emailAddress")}
                </div>
                <div className="assetra-profile-field-row">
                  <div className="assetra-profile-field-value">
                    {user.email || "-"}
                  </div>
                  <button
                    type="button"
                    className="assetra-profile-change-btn"
                    onClick={() => setShowEmailModal(true)}
                  >
                    {t("change")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="assetra-card">
            <div className="assetra-profile-card-header">
              <Lock size={16} strokeWidth={1.75} />
              {t("security")}
            </div>
            <div className="assetra-profile-card-body">
              <div>
                <div className="assetra-profile-field-label">
                  {t("password")}
                </div>
                <div className="assetra-profile-field-row">
                  <div className="assetra-profile-field-value">
                    ••••••••••••
                  </div>
                  <button
                    type="button"
                    className="assetra-profile-change-btn"
                    onClick={() => {
                      // TODO: buka modal ganti password (pola sama kayak email modal)
                    }}
                  >
                    {t("change")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEmailModal && (
        <RequestEmailChangeModal
          currentEmail={user.email}
          onClose={() => setShowEmailModal(false)}
          onSuccess={handleEmailChangeSuccess}
        />
      )}
    </DashboardLayout>
  );
}
