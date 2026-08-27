"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Filter,
  RotateCcw,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

const STATUS_OPTIONS = [
  {
    value: "functional",
    labelKey: "functional",
  },
  {
    value: "need_repair",
    labelKey: "needRepair",
  },
  {
    value: "borrowed",
    labelKey: "borrowed",
  },
  {
    value: "unavailable",
    labelKey: "unavailable",
  },
];

function createDefaultFilters() {
  return {
    categories: [],
    statuses: ["functional", "need_repair", "borrowed"],
    dateFrom: "",
    dateTo: "",
  };
}

export default function FilterForm({
  categories = [],
  filters,
  onApply,
  onClear,
}) {
  const t = useTranslations("manageItem");
  const [open, setOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters);

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  function toggleCategory(categoryId) {
    setDraftFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(String(categoryId))
        ? prev.categories.filter((id) => id !== String(categoryId))
        : [...prev.categories, String(categoryId)],
    }));
  }

  function toggleStatus(status) {
    setDraftFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((value) => value !== status)
        : [...prev.statuses, status],
    }));
  }

  function handleApply() {
    onApply(draftFilters);
    setOpen(false);
  }

  function handleClear() {
    const defaultFilters = createDefaultFilters();

    setDraftFilters(defaultFilters);
    onClear(defaultFilters);
    setOpen(false);
  }

  const hasDateFilter =
    draftFilters.dateFrom !== "" || draftFilters.dateTo !== "";

  const hasCategoryFilter = draftFilters.categories.length > 0;

  const statusIsDefault =
    draftFilters.statuses.length === 3 &&
    ["functional", "need_repair", "borrowed"].every((status) =>
      draftFilters.statuses.includes(status),
    );

  const hasCustomFilter =
    hasCategoryFilter || hasDateFilter || !statusIsDefault;

  return (
    <div className="assetra-filter-wrapper">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`assetra-filter-trigger ${
          hasCustomFilter ? "is-active" : ""
        }`}
      >
        <Filter size={15} strokeWidth={1.8} />

        <span>{t("filter")}</span>

        <ChevronDown
          size={14}
          strokeWidth={1.8}
          className={`assetra-filter-chevron ${
            open ? "is-open" : ""
          }`}
        />
      </button>

      {open && (
        <div className="assetra-filter-panel">
          <div className="assetra-filter-header">
            <div>
              <h3>{t("filter")}</h3>
              <p>{t("filterDescription")}</p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="assetra-filter-close"
              aria-label={t("close")}
            >
              <X size={16} strokeWidth={1.8} />
            </button>
          </div>

          <div className="assetra-filter-body">
            {/* CATEGORY */}

            <section className="assetra-filter-section">
              <div className="assetra-filter-section-header">
                <h4>{t("category")}</h4>

                {draftFilters.categories.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        categories: [],
                      }))
                    }
                    className="assetra-filter-reset-section"
                  >
                    {t("clear")}
                  </button>
                )}
              </div>

              <div className="assetra-filter-options">
                {categories.length === 0 ? (
                  <p className="assetra-filter-empty">
                    {t("noCategories")}
                  </p>
                ) : (
                  categories.map((category) => {
                    const categoryId = String(category.id);
                    const checked =
                      draftFilters.categories.includes(categoryId);

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className={`assetra-filter-option ${
                          checked ? "is-selected" : ""
                        }`}
                      >
                        <span className="assetra-filter-checkbox">
                          {checked && (
                            <Check size={12} strokeWidth={2.5} />
                          )}
                        </span>

                        <span>
                          {category.category_name}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            {/* STATUS */}

            <section className="assetra-filter-section">
              <div className="assetra-filter-section-header">
                <h4>{t("status")}</h4>

                <button
                  type="button"
                  onClick={() =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      statuses: [
                        "functional",
                        "need_repair",
                        "borrowed",
                      ],
                    }))
                  }
                  className="assetra-filter-reset-section"
                >
                  {t("reset")}
                </button>
              </div>

              <div className="assetra-filter-options">
                {STATUS_OPTIONS.map((status) => {
                  const checked = draftFilters.statuses.includes(
                    status.value,
                  );

                  return (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => toggleStatus(status.value)}
                      className={`assetra-filter-option ${
                        checked ? "is-selected" : ""
                      }`}
                    >
                      <span className="assetra-filter-checkbox">
                        {checked && (
                          <Check size={12} strokeWidth={2.5} />
                        )}
                      </span>

                      <span>{t(status.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* DATE */}

            <section className="assetra-filter-section">
              <div className="assetra-filter-section-header">
                <div className="assetra-filter-title-with-icon">
                  <CalendarDays size={14} strokeWidth={1.8} />
                  <h4>{t("dateAdded")}</h4>
                </div>

                {hasDateFilter && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        dateFrom: "",
                        dateTo: "",
                      }))
                    }
                    className="assetra-filter-reset-section"
                  >
                    {t("clear")}
                  </button>
                )}
              </div>

              <div className="assetra-filter-date-grid">
                <label className="assetra-filter-date-field">
                  <span>{t("from")}</span>

                  <input
                    type="date"
                    value={draftFilters.dateFrom}
                    onChange={(event) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        dateFrom: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="assetra-filter-date-field">
                  <span>{t("to")}</span>

                  <input
                    type="date"
                    value={draftFilters.dateTo}
                    onChange={(event) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        dateTo: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </section>
          </div>

          <div className="assetra-filter-footer">
            <button
              type="button"
              onClick={handleClear}
              className="assetra-filter-clear-button"
            >
              <RotateCcw size={14} strokeWidth={1.8} />
              {t("resetAll")}
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="assetra-filter-apply-button"
            >
              {t("applyFilter")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { createDefaultFilters };