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
  Loader2,
  ArrowLeft,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/dashboardLayout";
import RequestEmailChangeModal from "@/components/admin/requestEmailChangeModal";
import {
  AUTH_USER_KEY,
  AUTH_TOKEN_KEY,
  ROLES,
  ENDPOINTS,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/constants";

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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
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
      <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center gap-3 text-[var(--color-text-secondary)] text-sm">
        <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
        <span>{t("loading")}</span>
      </div>
    );
  }

  const roleLabel =
    user.role === ROLES.SUPER_ADMIN ? t("superAdmin") : t("administrator");

  const getToken = () =>
    window.localStorage.getItem(AUTH_TOKEN_KEY) ||
    window.sessionStorage.getItem(AUTH_TOKEN_KEY);

  const handlePickPhoto = () => fileInputRef.current?.click();

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError("");

    if (!file.type.startsWith("image/")) {
      setPhotoError(t("photoMustBeImage"));
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setPhotoError(t("photoTooLarge"));
      return;
    }

    const token = getToken();
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("foto", file);

      const uploadResponse = await fetch(ENDPOINTS.UPLOAD_IMAGE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadResult.success) {
        throw new Error(uploadResult.message || t("photoUploadError"));
      }

      const imageUrl = uploadResult.foto;
      if (!imageUrl) {
        throw new Error(t("photoUploadError"));
      }

      const profileResponse = await fetch(ENDPOINTS.UPDATE_PROFILE, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image_url: imageUrl }),
      });
      const profileResult = await profileResponse.json();

      if (!profileResponse.ok || !profileResult.success) {
        throw new Error(profileResult.message || t("photoUploadError"));
      }

      const updated = { ...user, image_url: imageUrl };
      setUser(updated);
      const storage = window.localStorage.getItem(AUTH_TOKEN_KEY)
        ? window.localStorage
        : window.sessionStorage;
      storage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
    } catch (error) {
      setAvatarPreview(user.image_url || null);
      setPhotoError(error.message || t("photoUploadError"));
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
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
      const res = await fetch(ENDPOINTS.UPDATE_PROFILE, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
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

  return (
    <DashboardLayout role={user.role} userName={user.name || user.username} userImage={user.image_url}>
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition"
      >
        <ArrowLeft size={16} strokeWidth={1.75} />
        {t("back")}
      </button>

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
              disabled={uploadingPhoto}
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
            {uploadingPhoto && (
              <p className="mt-2 text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" />
                {t("uploadingPhoto")}
              </p>
            )}
            {photoError && (
              <p className="mt-2 text-xs text-[var(--color-danger)]">
                {photoError}
              </p>
            )}
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