"use client";

import { useEffect, useState, useRef } from "react";
import { X, Upload, AlertCircle } from "lucide-react";
import { ENDPOINTS, AUTH_TOKEN_KEY } from "@/lib/constants";
import { useTranslations } from "next-intl";

const STATUS_OPTIONS = [
  { value: "functional", label: "functional" },
  { value: "needs_repair", label: "needs_repair" },
  { value: "borrowed", label: "borrowed" },
  { value: "unavailable", label: "unavailable" },
];

function generateCodeFromName(name) {
  if (!name) return "";
  const prefix = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, "X");
  const random = String(Math.floor(1000 + Math.random() * 9000));
  return `${prefix}-${random}`;
}

export default function AddItemForm({ onClose, onSubmit }) {
  const t = useTranslations("manageItem");
  const [form, setForm] = useState({
    asset_name: "",
    code_item: "",
    id_category: "",
    status: "functional",
    description: "",
    image_url: "",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const token =
          window.localStorage.getItem(AUTH_TOKEN_KEY) ||
          window.sessionStorage.getItem(AUTH_TOKEN_KEY);
        const response = await fetch(ENDPOINTS.CATEGORIES, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || t("categoryLoadError"));
        }
        setCategories(result.data || []);
        if (result.data?.length) {
          setForm((prev) => ({
            ...prev,
            id_category: String(result.data[0].id),
          }));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, [t]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => {
      const newForm = { ...prev, [name]: value };
      if (name === "asset_name") {
        newForm.code_item = generateCodeFromName(value);
      }
      return newForm;
    });
    setError("");
  }

  // 🔥 FIX: UPLOAD PAKE PROXY
  async function uploadImageToServer(file) {
    const formData = new FormData();
    formData.append("foto", file);

    try {
      console.log("📤 Uploading to proxy...");

      const response = await fetch("/api/upload-proxy", {
        method: "POST",
        body: formData,
      });

      console.log("📊 Response status:", response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error("Response text:", text);
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      console.log("📥 Upload result:", result);

      if (!result.success) {
        throw new Error(result.message || t("uploadError"));
      }

      return result.foto;
    } catch (err) {
      console.error("❌ Upload error:", err);
      throw err;
    }
  }

  async function handleImageChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t("fileMustBeImage"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t("fileTooLarge"));
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    setError("");
    setIsUploading(true);

    try {
      const imageUrl = await uploadImageToServer(file);
      setForm((prev) => ({ ...prev, image_url: imageUrl }));
      setIsUploading(false);
      console.log("✅ Image uploaded successfully:", imageUrl);
    } catch (err) {
      console.error("❌ Upload error:", err);
      setError(err.message || t("uploadError"));
      setIsUploading(false);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removeImage() {
    setForm((prev) => ({ ...prev, image_url: "" }));
    setImagePreview(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.image_url) {
      setError(t("imageRequired"));
      return;
    }
    if (!form.asset_name.trim()) {
      setError(t("itemNameRequired"));
      return;
    }
    if (!form.id_category) {
      setError(t("categoryRequired"));
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        asset_name: form.asset_name.trim(),
        id_category: Number(form.id_category),
        status: form.status,
        description: form.description.trim(),
        image_url: form.image_url,
      });
      onClose();
    } catch (err) {
      setError(err.message || t("addFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[var(--color-overlay)]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-[var(--color-white)]">
              {t("addNewItem")}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-white)] transition"
            >
              <X size={20} strokeWidth={1.75} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Upload Gambar */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                {t("uploadImage")}{" "}
                <span className="text-[var(--color-danger)]">*</span>
              </label>
              <div className="flex flex-col gap-2">
                {imagePreview ? (
                  <div className="relative rounded-lg border border-[var(--color-border)] overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-[var(--color-overlay)]/60 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-[var(--color-white)]">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--color-primary)] border-t-transparent" />
                          {t("uploading")}
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={removeImage}
                      disabled={isUploading}
                      className="absolute top-2 right-2 p-1.5 bg-[var(--color-danger-background)]/80 rounded-full hover:bg-[var(--color-danger-background)] transition disabled:opacity-50"
                    >
                      <X size={14} />
                    </button>
                    {form.image_url && !isUploading && (
                      <div className="absolute bottom-2 left-2 bg-[var(--color-overlay)]/60 px-2 py-1 rounded text-[10px] text-[var(--color-success)]">
                        ✅ {t("imageUploaded")}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex flex-col items-center justify-center gap-2 h-48 w-full rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-input)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-primary)] border-t-transparent" />
                        <span className="text-xs">{t("uploading")}</span>
                      </>
                    ) : (
                      <>
                        <Upload size={32} strokeWidth={1.5} />
                        <span className="text-sm">{t("uploadImageHere")}</span>
                        <span className="text-[10px] text-[var(--color-text-placeholder)]">
                          {t("imageRecommended")}
                        </span>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* Nama Item + Code Item */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  {t("itemName")}{" "}
                  <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  name="asset_name"
                  value={form.asset_name}
                  onChange={handleChange}
                  placeholder={t("itemNamePlaceholder")}
                  className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-primary)] transition"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  {t("codeItem")}
                </label>
                <input
                  name="code_item"
                  value={form.code_item}
                  readOnly
                  placeholder={t("codeItemPlaceholder")}
                  className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-sm text-[var(--color-text-muted)] outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* Kategori */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                {t("category")}{" "}
                <span className="text-[var(--color-danger)]">*</span>
              </label>
              <select
                name="id_category"
                value={form.id_category}
                onChange={handleChange}
                disabled={loadingCategories}
                className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-sm text-[var(--color-white)] outline-none focus:border-[var(--color-primary)] transition disabled:opacity-50"
              >
                {loadingCategories && (
                  <option value="">{t("loadingCategories")}</option>
                )}
                {!loadingCategories && categories.length === 0 && (
                  <option value="">{t("noCategories")}</option>
                )}
                <option value="" disabled>
                  {t("selectCategory")}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                {t("status")}{" "}
                <span className="text-[var(--color-danger)]">*</span>
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-sm text-[var(--color-white)] outline-none focus:border-[var(--color-primary)] transition"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(`statusOptions.${opt.value}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                {t("descriptionOptional")}
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder={t("descriptionPlaceholder")}
                rows={3}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-primary)] transition resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-[var(--color-danger-background)]/20 bg-[var(--color-danger-background)]/10 px-3 py-2 text-xs text-[var(--color-danger)]">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={loading || isUploading || !form.image_url}
                className="flex-1 h-11 rounded-lg bg-[var(--color-primary)] text-sm font-semibold text-[var(--color-primary-contrast)] hover:bg-[var(--color-primary-hover)] transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t("adding") : t("addItem")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
