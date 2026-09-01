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

export const HISTORY_TYPE_OPTIONS = [
  {
    value: "added",
    labelKey: "added",
  },
  {
    value: "updated",
    labelKey: "updated",
  },
  {
    value: "deactivated",
    labelKey: "deactivated",
  },
];

export function createDefaultHistoryFilters() {
  return {
    types: [],
    dateFrom: "",
    dateTo: "",
  };
}

export default function HistoryFilterForm({
  filters,
  onApply,
  onClear,
}) {
  const t = useTranslations("history");

  const [open, setOpen] = useState(false);

  const [draftFilters, setDraftFilters] =
    useState(() => ({
      ...createDefaultHistoryFilters(),
      ...(filters || {}),
    }));

  useEffect(() => {
    setDraftFilters({
      ...createDefaultHistoryFilters(),
      ...(filters || {}),
    });
  }, [filters]);

  const activeTypes = draftFilters.types;

  const hasDateFilter =
    draftFilters.dateFrom !== "" ||
    draftFilters.dateTo !== "";

  const hasTypeFilter =
    activeTypes.length > 0;

  const hasCustomFilter =
    hasTypeFilter || hasDateFilter;

  const allTypesSelected =
    activeTypes.length ===
    HISTORY_TYPE_OPTIONS.length;

  function toggleType(type) {
    setDraftFilters((prev) => {
      if (prev.types.includes(type)) {
        return {
          ...prev,
          types: prev.types.filter(
            (value) => value !== type,
          ),
        };
      }

      return {
        ...prev,
        types: [...prev.types, type],
      };
    });
  }

  function handleApply() {
    onApply(
      {
        ...draftFilters,
        types: [...draftFilters.types],
      },
    );

    setOpen(false);
  }

  function handleClear() {
    const defaults =
      createDefaultHistoryFilters();

    setDraftFilters(defaults);

    onClear(defaults);

    setOpen(false);
  }

  function clearTypes() {
    setDraftFilters((prev) => ({
      ...prev,
      types: [],
    }));
  }

  function selectAllTypes() {
    setDraftFilters((prev) => ({
      ...prev,
      types: HISTORY_TYPE_OPTIONS.map(
        (option) => option.value,
      ),
    }));
  }

  function clearDateFilter() {
    setDraftFilters((prev) => ({
      ...prev,
      dateFrom: "",
      dateTo: "",
    }));
  }

  return (
    <div className="assetra-filter-wrapper">
      <button
        type="button"
        onClick={() =>
          setOpen((prev) => !prev)
        }
        className={`assetra-filter-trigger ${
          hasCustomFilter
            ? "is-active"
            : ""
        }`}
      >
        <Filter
          size={15}
          strokeWidth={1.8}
        />

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

              <p>
                {t("filterDescription")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="assetra-filter-close"
              aria-label={t("close")}
            >
              <X
                size={16}
                strokeWidth={1.8}
              />
            </button>
          </div>

          <div className="assetra-filter-body">
            <section className="assetra-filter-section">
              <div className="assetra-filter-section-header">
                <h4>
                  {t("activityType")}
                </h4>

                {hasTypeFilter ? (
                  <button
                    type="button"
                    onClick={clearTypes}
                    className="assetra-filter-reset-section"
                  >
                    {t("clear")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={selectAllTypes}
                    className="assetra-filter-reset-section"
                  >
                    {t("selectAll")}
                  </button>
                )}
              </div>

              <div className="assetra-filter-options">
                {HISTORY_TYPE_OPTIONS.map(
                  (option) => {
                    const checked =
                      activeTypes.includes(
                        option.value,
                      );

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          toggleType(
                            option.value,
                          )
                        }
                        className={`assetra-filter-option ${
                          checked
                            ? "is-selected"
                            : ""
                        }`}
                      >
                        <span className="assetra-filter-checkbox">
                          {checked && (
                            <Check
                              size={12}
                              strokeWidth={2.5}
                            />
                          )}
                        </span>

                        <span>
                          {t(
                            option.labelKey,
                          )}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>

              {allTypesSelected && (
                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                  {t(
                    "allActivitiesSelected",
                  )}
                </p>
              )}
            </section>

            <section className="assetra-filter-section">
              <div className="assetra-filter-section-header">
                <div className="assetra-filter-title-with-icon">
                  <CalendarDays
                    size={14}
                    strokeWidth={1.8}
                  />

                  <h4>
                    {t("dateRange")}
                  </h4>
                </div>

                {hasDateFilter && (
                  <button
                    type="button"
                    onClick={clearDateFilter}
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
                    value={
                      draftFilters.dateFrom
                    }
                    onChange={(event) =>
                      setDraftFilters(
                        (prev) => ({
                          ...prev,
                          dateFrom:
                            event.target.value,
                        }),
                      )
                    }
                  />
                </label>

                <label className="assetra-filter-date-field">
                  <span>{t("to")}</span>

                  <input
                    type="date"
                    value={
                      draftFilters.dateTo
                    }
                    onChange={(event) =>
                      setDraftFilters(
                        (prev) => ({
                          ...prev,
                          dateTo:
                            event.target.value,
                        }),
                      )
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
              <RotateCcw
                size={14}
                strokeWidth={1.8}
              />

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