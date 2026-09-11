"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  X,
  Upload,
  AlertCircle,
  AlertTriangle,
  Wrench,
  Plus,
} from "lucide-react";
import {
  ENDPOINTS,
  AUTH_TOKEN_KEY,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/constants";
import {
  getSpecTemplate,
  buildSpecsPayload,
  validateSpecValues,
  normalizeStatus,
} from "@/lib/itemHelper";
import { useTranslations } from "next-intl";
import NeedRepairModal from "./needRepairModal";
import ImagePreviewModal from "./imagePreviewModal";

const STATUS_OPTIONS = [
  { value: "functional" },
  { value: "needs_repair" },
  { value: "unavailable" },
];

function findCategoryId(categories, categoryName) {
  if (!categoryName) return "";

  const match = categories.find(
    (cat) =>
      String(cat.category_name).toLowerCase() ===
      String(categoryName).toLowerCase(),
  );

  return match ? String(match.id) : "";
}
function specsArrayToValues(specs) {
  if (!Array.isArray(specs)) {
    return specs && typeof specs === "object"
      ? Object.fromEntries(
          Object.entries(specs).map(([key, value]) => [String(key), value]),
        )
      : {};
  }

  return Object.fromEntries(
    specs
      .map((spec) => {
        const id = spec.id_specification ?? spec.idSpecification ?? spec.id;
        const value = spec.value ?? spec.spec_value ?? spec.specValue ?? "";

        return id == null ? null : [String(id), value];
      })
      .filter(Boolean),
  );
}

function normalizeSpecsForCompare(specValues) {
  return Object.fromEntries(
    Object.entries(specValues)
      .map(([key, value]) => [key, String(value ?? "").trim()])
      .filter(([, value]) => value),
  );
}

function SpecField({
  field,
  value,
  onChange,
  disabled,
  isDamaged,
  damageNote,
}) {
  if (field.type === "boolean") {
    return (
      <div className="assetra-spec-field-wrap">
        <label
          className={`flex items-center gap-2 assetra-form-input cursor-pointer select-none ${
            isDamaged ? "is-damaged" : ""
          }`}
        >
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 accent-[var(--assetra-primary)]"
          />
          {field.name}
        </label>

        {isDamaged && (
          <span
            className="assetra-spec-damage-icon"
            title={damageNote || undefined}
          >
            <AlertTriangle size={14} strokeWidth={2} />
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="assetra-spec-field-wrap">
      <input
        type={
          field.type === "number" || field.type === "date" ? field.type : "text"
        }
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`${field.name}${field.required ? " *" : ""}`}
        disabled={disabled}
        className={`assetra-form-input ${isDamaged ? "is-damaged" : ""}`}
      />

      {isDamaged && (
        <span
          className="assetra-spec-damage-icon"
          title={damageNote || undefined}
        >
          <AlertTriangle size={14} strokeWidth={2} />
        </span>
      )}
    </div>
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

  const [specValues, setSpecValues] = useState(specsArrayToValues(item?.specs));
  const [imagePreview, setImagePreview] = useState(item?.imageUrl || null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [repairPayload, setRepairPayload] = useState(null);
  const [showNeedRepairModal, setShowNeedRepairModal] = useState(false);

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
  }, [t]);

  useEffect(() => {
    setSpecValues(specsArrayToValues(item?.specs));
    setRepairPayload(item?.repair || null);
  }, [item]);

  const selectedCategory = useMemo(
    () => categories.find((cat) => String(cat.id) === String(form.id_category)),
    [categories, form.id_category],
  );

  const specTemplate = useMemo(
    () => getSpecTemplate(selectedCategory),
    [selectedCategory],
  );

  const repairableSpecs = useMemo(
    () => specTemplate.filter((field) => field.repairable),
    [specTemplate],
  );

  const selectedRepairNames = useMemo(() => {
    if (repairPayload?.specifications) {
      return repairPayload.specifications.map((spec) => spec.name);
    }

    return repairableSpecs
      .filter((spec) => repairPayload?.specIds?.includes(spec.id))
      .map((spec) => spec.name);
  }, [repairPayload, repairableSpecs]);
  const damagedSpecIds = useMemo(() => {
    if (!repairPayload) return [];

    if (repairPayload.specifications) {
      return repairPayload.specifications.map(
        (spec) => spec.id_specification ?? spec.id,
      );
    }

    return repairPayload.specIds || [];
  }, [repairPayload]);

  function getDamageNote(fieldId) {
    if (!repairPayload) return "";

    if (repairPayload.specifications) {
      const match = repairPayload.specifications.find(
        (spec) => (spec.id_specification ?? spec.id) === fieldId,
      );

      if (match?.details) return match.details;
    }

    return repairPayload.details || "";
  }

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

  const initialSpecValues = useMemo(
    () => specsArrayToValues(item?.specs),
    [item],
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
      JSON.stringify(normalizeSpecsForCompare(specValues)) !==
        JSON.stringify(normalizeSpecsForCompare(initialSpecValues)) ||
      JSON.stringify(repairPayload || null) !==
        JSON.stringify(item?.repair || null)
    );
  }, [
    form,
    initialCategoryId,
    initialSpecValues,
    item,
    loadingCategories,
    repairPayload,
    specValues,
  ]);

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "status") {
      // FR-REP-02: transisi ke Need Repair harus lewat modal dulu.
      // Kalau sebelumnya sudah needs_repair, dropdown ini tidak akan
      // fire onChange (value tidak berubah) — untuk kasus "tambah
      // laporan lagi", lihat tombol addDamageReport di bawah, bukan
      // di sini.
      if (value === "needs_repair" && form.status !== "needs_repair") {
        setShowNeedRepairModal(true);
        return; // status belum di-set, menunggu konfirmasi modal
      }

      if (value !== "needs_repair") {
        setRepairPayload(null);
      }
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

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

    const token =
      window.localStorage.getItem(AUTH_TOKEN_KEY) ||
      window.sessionStorage.getItem(AUTH_TOKEN_KEY);

    const response = await fetch(ENDPOINTS.UPLOAD_IMAGE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

    return result.url;
  }

  async function handleImageChange(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t("fileMustBeImage"));
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
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

    const missingRequiredSpec = validateSpecValues(specTemplate, specValues);

    if (missingRequiredSpec) {
      setError(t("specificationRequired", { name: missingRequiredSpec }));
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
        ...(repairPayload ? { repair: repairPayload } : {}),
      });

      handleClose();
    } catch (err) {
      setError(err.message || t("editFailed"));
    } finally {
      setLoading(false);
    }
  }

  if (!item) return null;

  return (
    <>
      <div
        className={`assetra-modal-overlay ${closing ? "is-closing" : ""}`}
        onClick={closing ? undefined : handleClose}
      />

      <div className="assetra-modal-wrapper">
        <div className={`assetra-modal-card ${closing ? "is-closing" : ""}`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-[var(--color-white)]">
              {t("editItem")}
            </h2>

            <button
              type="button"
              onClick={handleClose}
              disabled={closing}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-white)] transition disabled:opacity-50"
            >
              <X size={20} strokeWidth={1.75} />
            </button>
          </div>

          <p className="mb-5 text-[11px] font-mono uppercase tracking-wide text-[var(--color-text-muted)]">
            {item.id}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="assetra-form-label">{t("uploadImage")}</label>

              <div className="relative rounded-lg border border-[var(--color-border)] overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt={t("imagePreview")}
                    className="
    w-full
    h-48
    object-cover
    cursor-zoom-in
    transition-transform
    duration-300
    hover:scale-[1.02]
  "
                    onClick={() => {
                      if (!isUploading) {
                        setShowImagePreview(true);
                      }
                    }}
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

              {repairPayload && (
                <div className="assetra-repair-summary">
                  <div className="assetra-repair-summary-header">
                    <span className="assetra-icon-badge assetra-icon-badge--warning">
                      <Wrench size={15} strokeWidth={1.9} />
                    </span>

                    <div className="assetra-repair-summary-heading">
                      <p className="assetra-repair-summary-title">
                        {t("repairMarked")}
                      </p>

                      {selectedRepairNames.length > 0 && (
                        <div className="assetra-repair-tag-list">
                          {selectedRepairNames.map((name) => (
                            <span key={name} className="assetra-repair-tag">
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {repairPayload.details && (
                    <p className="assetra-repair-summary-details">
                      {repairPayload.details}
                    </p>
                  )}
                </div>
              )}

              {form.status === "needs_repair" && (
                <button
                  type="button"
                  onClick={() => setShowNeedRepairModal(true)}
                  className="assetra-btn assetra-btn-warning-soft assetra-repair-add-btn mt-2 inline-flex items-center gap-1.5"
                >
                  <Plus size={13} strokeWidth={2.25} />
                  {t("addDamageReport")}
                </button>
              )}
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
                      isDamaged={damagedSpecIds.includes(field.id)}
                      damageNote={getDamageNote(field.id)}
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

      {showNeedRepairModal && (
        <NeedRepairModal
          item={item}
          repairableSpecs={repairableSpecs}
          initialSpecIds={form.status === "needs_repair" ? damagedSpecIds : []}
          initialDetails={
            form.status === "needs_repair" ? repairPayload?.details || "" : ""
          }
          onClose={() => setShowNeedRepairModal(false)}
          onConfirm={async (payload) => {
            setRepairPayload(payload);
            setForm((prev) => ({ ...prev, status: "needs_repair" }));
            setShowNeedRepairModal(false);
          }}
        />
      )}
      {showImagePreview && imagePreview && (
        <ImagePreviewModal
          src={imagePreview}
          alt={t("imagePreview")}
          onClose={() => setShowImagePreview(false)}
        />
      )}
    </>
  );
}
