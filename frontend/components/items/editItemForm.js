"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { X, Upload, AlertCircle } from "lucide-react";
import { ENDPOINTS, AUTH_TOKEN_KEY } from "@/lib/constants";
import {
  getSpecTemplate,
  buildSpecsPayload,
  normalizeStatus,
} from "@/lib/itemHelper";
import { useTranslations } from "next-intl";

const STATUS_OPTIONS = [
  { value: "functional" },
  { value: "needs_repair" },
  { value: "unavailable" },
];

// item.category currently arrives as a plain name string (see
// fetchItems in the manage-items page), so we match it back to an id
// once the category list has loaded.
function findCategoryId(categories, categoryName) {
  if (!categoryName) return "";

  const match = categories.find(
    (cat) =>
      String(cat.category_name).toLowerCase() ===
      String(categoryName).toLowerCase(),
  );

  return match ? String(match.id) : "";
}

function normalizeSpecs(specs = {}) {
  return Object.fromEntries(
    Object.entries(specs)
      .map(([key, value]) => [key, String(value ?? "").trim()])
      .filter(([, value]) => value),
  );
}

export default function EditItemForm({ item, onClose, onSubmit }) {
  const t = useTranslations("manageItem");

  const [form, setForm] = useState({
    name: item?.name || "",
    id_category: "",
    status: normalizeStatus(item?.status),
    location: item?.location || "",
    description: item?.description || "",
    image_url: item?.imageUrl || "",
  });

  const [specValues, setSpecValues] = useState(item?.specs || {});
  const [imagePreview, setImagePreview] = useState(item?.imageUrl || null);
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || t("categoryLoadError"));
        }

        setCategories(result.data || []);

        setForm((prev) => ({
          ...prev,
          id_category:
            String(
              item?.id_category ||
                item?.category_id ||
                item?.categoryId ||
                findCategoryId(result.data || [], item?.category),
            ) || String(result.data?.[0]?.id || ""),
        }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const selectedCategoryName = useMemo(() => {
    const match = categories.find(
      (cat) => String(cat.id) === String(form.id_category),
    );

    return match?.category_name || "";
  }, [categories, form.id_category]);

  const specTemplate = useMemo(
    () => getSpecTemplate(selectedCategoryName),
    [selectedCategoryName],
  );

  const initialCategoryId = useMemo(
    () =>
      String(
        item?.id_category ||
          item?.category_id ||
          item?.categoryId ||
          findCategoryId(categories, item?.category),
      ),
    [categories, item],
  );

  const hasChanges = useMemo(() => {
    if (loadingCategories) return false;

    return (
      form.name.trim() !== String(item?.name || "").trim() ||
      String(form.id_category) !== String(initialCategoryId) ||
      form.status !== normalizeStatus(item?.status) ||
      form.location.trim() !== String(item?.location || "").trim() ||
      form.description.trim() !== String(item?.description || "").trim() ||
      form.image_url !== String(item?.imageUrl || "") ||
      JSON.stringify(
        normalizeSpecs(buildSpecsPayload(specTemplate, specValues)),
      ) !== JSON.stringify(normalizeSpecs(item?.specs))
    );
  }, [
    form,
    initialCategoryId,
    item,
    loadingCategories,
    specTemplate,
    specValues,
  ]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  }

  function handleSpecChange(key, value) {
    setSpecValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function uploadImageToServer(file) {
    const formData = new FormData();
    formData.append("foto", file);

    const response = await fetch("/api/upload-proxy", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Upload failed: ${response.status} ${text}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || t("uploadError"));
    }

    return result.foto;
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

    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result);
    };

    reader.readAsDataURL(file);

    setError("");
    setIsUploading(true);

    try {
      const imageUrl = await uploadImageToServer(file);

      setForm((prev) => ({
        ...prev,
        image_url: imageUrl,
      }));

      setIsUploading(false);
    } catch (err) {
      setError(err.message || t("uploadError"));
      setIsUploading(false);

      setImagePreview(item?.imageUrl || null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError(t("itemNameRequired"));
      return;
    }

    if (!form.id_category) {
      setError(t("categoryRequired"));
      return;
    }

    setLoading(true);

    try {
      await onSubmit(item.id, {
        name: form.name.trim(),
        id_category: Number(form.id_category),
        status: form.status,
        location: form.location.trim(),
        description: form.description.trim(),
        image_url: form.image_url,
        specs: buildSpecsPayload(specTemplate, specValues),
      });

      onClose();
    } catch (err) {
      setError(err.message || t("editFailed"));
    } finally {
      setLoading(false);
    }
  }

  if (!item) return null;

  return (
    <>
      <div className="assetra-modal-overlay" onClick={onClose} />

      <div className="assetra-modal-wrapper">
        <div className="assetra-modal-card">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-[var(--color-white)]">
              {t("editItem")}
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-white)] transition"
            >
              <X size={20} strokeWidth={1.75} />
            </button>
          </div>

          <p className="mb-5 text-[11px] font-mono uppercase tracking-wide text-[var(--color-text-muted)]">
            {item.id}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Gambar */}
            <div>
              <label className="assetra-form-label">{t("uploadImage")}</label>

              <div className="relative rounded-lg border border-[var(--color-border)] overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt={t("imagePreview")}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-[var(--color-input)] text-[var(--color-text-muted)]">
                    <span className="text-3xl opacity-30">📦</span>
                  </div>
                )}

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
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-md bg-[var(--color-overlay)]/70 px-2.5 py-1.5 text-xs text-[var(--color-white)] hover:bg-[var(--color-overlay)]/90 transition disabled:opacity-50"
                >
                  <Upload size={13} strokeWidth={1.75} />
                  {t("changeImage")}
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="assetra-form-label">
                {t("itemName")}{" "}
                <span className="text-[var(--color-danger)]">*</span>
              </label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder={t("itemNamePlaceholder")}
                className="assetra-form-input"
              />
            </div>

            {/* Kategori + Lokasi */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="assetra-form-label">
                  {t("category")}{" "}
                  <span className="text-[var(--color-danger)]">*</span>
                </label>

                <select
                  name="id_category"
                  value={form.id_category}
                  onChange={handleChange}
                  disabled={loadingCategories}
                  className="assetra-form-input"
                >
                  {loadingCategories && (
                    <option value="">{t("loadingCategories")}</option>
                  )}

                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="assetra-form-label">{t("location")}</label>

                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder={t("locationPlaceholder")}
                  className="assetra-form-input"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="assetra-form-label">
                {t("status")}{" "}
                <span className="text-[var(--color-danger)]">*</span>
              </label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="assetra-form-input"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(`statusOptions.${opt.value}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Spesifikasi */}
            {specTemplate.length > 0 && (
              <div>
                <label className="assetra-form-label">
                  {t("specifications")}
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {specTemplate.map((field) => (
                    <input
                      key={field.key}
                      value={specValues[field.key] || ""}
                      onChange={(e) =>
                        handleSpecChange(field.key, e.target.value)
                      }
                      placeholder={field.label}
                      className="assetra-form-input"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Deskripsi */}
            <div>
              <label className="assetra-form-label">
                {t("descriptionOptional")}
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder={t("descriptionPlaceholder")}
                rows={3}
                className="assetra-form-input"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="assetra-error-box">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="assetra-btn assetra-btn-secondary flex-1"
              >
                {t("cancel")}
              </button>

              <button
                type="submit"
                disabled={loading || isUploading || !hasChanges}
                className="assetra-btn assetra-btn-primary flex-1"
              >
                {loading ? t("saving") : t("editItem")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
