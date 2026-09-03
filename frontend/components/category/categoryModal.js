"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import SpecificationBuilder, { emptyRow } from "./specification";

const EXIT_DURATION = 180;
export default function CategoryFormModal({ category, onClose, onSubmit }) {
  const t = useTranslations("manageCategory");
  const isEdit = Boolean(category);

  const [name, setName] = useState(category?.category_name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [specs, setSpecs] = useState(
    category?.specifications?.length
      ? category.specifications.map((s) => ({
          id: s.id,
          name: s.name,
          type: s.type || "text",
          required: Boolean(s.required),
          repairable: Boolean(s.repairable),
        }))
      : [emptyRow()],
  );

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  function handleClose() {
    if (loading || closing) return;
    setClosing(true);
    window.setTimeout(() => onClose(), EXIT_DURATION);
  }

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError(t("categoryNameRequired"));
      return;
    }

    const cleanedSpecs = specs
      .map((s) => ({ ...s, name: s.name.trim() }))
      .filter((s) => s.name);

    if (cleanedSpecs.length === 0) {
      setError(t("atLeastOneSpecification"));
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        category_name: name.trim(),
        description: description.trim(),
        specifications: cleanedSpecs,
      });

      handleClose();
    } catch (err) {
      setError(err.message || t(isEdit ? "editFailed" : "createFailed"));
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
              {isEdit ? t("editCategory") : t("addNewCategory")}
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
                {t("categoryName")}{" "}
                <span className="text-[var(--color-danger)]">*</span>
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("categoryNamePlaceholder")}
                disabled={loading}
                className="assetra-form-input"
              />
            </div>

            <div>
              <label className="assetra-form-label">
                {t("descriptionOptional")}
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                rows={2}
                disabled={loading}
                className="assetra-form-input"
              />
            </div>

            <SpecificationBuilder
              rows={specs}
              onChange={setSpecs}
              disabled={loading}
            />

            {error && (
              <div className="assetra-error-box">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="assetra-btn assetra-btn-secondary flex-1"
              >
                {t("cancel")}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="assetra-btn assetra-btn-primary flex-1"
              >
                {loading
                  ? t("saving")
                  : isEdit
                    ? t("saveChanges")
                    : t("addCategory")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}