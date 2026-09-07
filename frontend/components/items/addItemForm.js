"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { X, Upload, AlertCircle } from "lucide-react";

import { ENDPOINTS, AUTH_TOKEN_KEY } from "@/lib/constants";

import { ASSET_STATUS } from "@/lib/assetStatus";

import {
  getSpecTemplate,
  buildSpecsPayload,
  validateSpecValues,
} from "@/lib/itemHelper";

import { useTranslations } from "next-intl";

const STATUS_OPTIONS = [
  ASSET_STATUS.FUNCTIONAL,
  ASSET_STATUS.NEEDS_REPAIR,
  ASSET_STATUS.UNAVAILABLE,
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

function SpecField({ field, value, onChange, disabled }) {
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 assetra-form-input cursor-pointer select-none">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="h-4 w-4 accent-[var(--assetra-primary)]"
        />
        {field.name}
      </label>
    );
  }

  return (
    <input
      type={field.type === "number" || field.type === "date" ? field.type : "text"}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`${field.name}${field.required ? " *" : ""}`}
      disabled={disabled}
      className="assetra-form-input"
    />
  );
}

export default function AddItemForm({ onClose, onSubmit }) {
  const t = useTranslations("manageItem");

  const [form, setForm] = useState({
    name: "",
    code_item: "",
    id_category: "",
    status: ASSET_STATUS.FUNCTIONAL,
    location: "",
    description: "",
    image_url: "",
  });

  const [specValues, setSpecValues] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  const fileInputRef = useRef(null);

  function handleClose() {
    if (loading || closing) return;
    setClosing(true);
    window.setTimeout(() => onClose(), 180);
  }

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

  const selectedCategory = useMemo(
    () =>
      categories.find((cat) => String(cat.id) === String(form.id_category)),
    [categories, form.id_category],
  );

  const specTemplate = useMemo(
    () => getSpecTemplate(selectedCategory),
    [selectedCategory],
  );

  useEffect(() => {
    // Reset spec values setiap kali category berubah — field lama
    // (field.id) sudah tidak relevan untuk category baru.
    setSpecValues({});
  }, [selectedCategory?.id]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      if (name === "name") {
        next.code_item = generateCodeFromName(value);
      }

      return next;
    });

    setError("");
  }

  function handleSpecChange(idSpecification, value) {
    setSpecValues((prev) => ({
      ...prev,
      [idSpecification]: value,
    }));
    setError("");
  }

  async function uploadImageToServer(file) {
    const formData = new FormData();

    formData.append("image", file);

    const response = await fetch("/api/upload-proxy", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(t("uploadError"));
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || t("uploadError"));
    }

    return result.data?.url;
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
    } catch (err) {
      setError(err.message || t("uploadError"));

      setImagePreview(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsUploading(false);
    }
  }

  function removeImage() {
    setForm((prev) => ({
      ...prev,
      image_url: "",
    }));

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

    if (!form.name.trim()) {
      setError(t("itemNameRequired"));
      return;
    }

    if (!form.id_category) {
      setError(t("categoryRequired"));
      return;
    }

    const missingRequiredSpec = validateSpecValues(specTemplate, specValues);

    if (missingRequiredSpec) {
      setError(t("specificationRequired", { name: missingRequiredSpec }));
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        name: form.name.trim(),

        code_item: form.code_item,

        id_category: Number(form.id_category),

        status: form.status,

        location: form.location.trim(),

        description: form.description.trim(),

        image_url: form.image_url,

        specs: buildSpecsPayload(specTemplate, specValues),
      });

      handleClose();
    } catch (err) {
      setError(err.message || t("addFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        className={`assetra-modal-overlay ${closing ? "is-closing" : ""}`}
        onClick={loading || closing ? undefined : handleClose}
      />

      <div className="assetra-modal-wrapper">
        <div className={`assetra-modal-card ${closing ? "is-closing" : ""}`}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-[var(--color-white)]">
              {t("addNewItem")}
            </h2>

            <button
              type="button"
              onClick={handleClose}
              disabled={loading || closing}
              aria-label={t("close")}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-white)] transition disabled:opacity-50"
            >
              <X size={20} strokeWidth={1.75} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="assetra-form-label">
                {t("uploadImage")}{" "}
                <span className="text-[var(--color-danger)]">*</span>
              </label>

              <div className="flex flex-col gap-2">
                {imagePreview ? (
                  <div className="relative rounded-lg border border-[var(--color-border)] overflow-hidden">
                    <img
                      src={imagePreview}
                      alt={t("imagePreview")}
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
                      aria-label={t("removeImage")}
                      className="absolute top-2 right-2 p-1.5 bg-[var(--color-danger-background)]/80 rounded-full hover:bg-[var(--color-danger-background)] transition disabled:opacity-50"
                    >
                      <X size={14} />
                    </button>

                    {form.image_url && !isUploading && (
                      <div className="absolute bottom-2 left-2 bg-[var(--color-overlay)]/60 px-2 py-1 rounded text-[10px] text-[var(--color-success)]">
                        {t("imageUploaded")}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="assetra-upload-drop"
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

            <div className="grid grid-cols-2 gap-4">
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

              <div>
                <label className="assetra-form-label">{t("codeItem")}</label>

                <input
                  name="code_item"
                  value={form.code_item}
                  readOnly
                  placeholder={t("codeItemPlaceholder")}
                  className={`${"assetra-form-input"} ${"font-mono"}`}
                />
              </div>
            </div>

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
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {t(`statusOptions.${status}`)}
                  </option>
                ))}
              </select>
            </div>

            {specTemplate.length > 0 && (
              <div>
                <label className="assetra-form-label">
                  {t("specifications")}
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {specTemplate.map((field) => (
                    <SpecField
                      key={field.id}
                      field={field}
                      value={specValues[field.id]}
                      onChange={(value) => handleSpecChange(field.id, value)}
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>
            )}

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

            {error && (
              <div className="assetra-error-box">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="assetra-btn assetra-btn-secondary flex-1"
              >
                {t("cancel")}
              </button>

              <button
                type="submit"
                disabled={loading || isUploading || !form.image_url}
                className="assetra-btn assetra-btn-primary flex-1"
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