"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Pencil,
  PackageX,
  Wrench,
  History,
  Maximize2,
  Minimize2,
  Calendar,
  User,
} from "lucide-react";
import { FONTS, ENDPOINTS, AUTH_TOKEN_KEY } from "@/lib/constants";
import { getAssetStatusLabelKey, getAssetStatusStyle } from "@/lib/assetStatus";
import { useTranslations } from "next-intl";
import colors from "@/lib/colors";
import ImagePreviewModal from "./imagePreviewModal";

function getHistoryBadgeStyle(type) {
  switch (type) {
    case "add_item":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "edit_item":
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";
    case "deactivate_item":
      return "border-rose-500/30 bg-rose-500/10 text-rose-400";
    default:
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  }
}

function getHistoryLabel(type) {
  switch (type) {
    case "add_item":
      return "Item Created";
    case "edit_item":
      return "Item Updated";
    case "deactivate_item":
      return "Item Deactivated";
    default:
      return "Status Changed";
  }
}

function RenderHistoryDescription({ description }) {
  const t = useTranslations("itemDetail");

  if (!description) return null;

  let parsed = null;
  if (typeof description === "string" && description.trim().startsWith("{")) {
    try {
      parsed = JSON.parse(description);
    } catch {
      parsed = null;
    }
  }

  if (!parsed || typeof parsed !== "object") {
    return (
      <p className="text-xs text-[var(--color-text)] font-normal mb-1.5 leading-snug">
        {description}
      </p>
    );
  }

  const statusMap = {
    functional: "Available",
    needs_repair: "Need Repair",
    unavailable: "Unavailable",
  };
  const getStatusText = (status) => {
    const fallback = statusMap[status] || status;
    const key = getAssetStatusLabelKey(status);
    return key ? t(key, { defaultValue: fallback }) : fallback;
  };

  const fieldMap = {
    name: "Name",
    code: "Code",
    code_item: "Code",
    category: "Category",
    id_category: "Category",
    location: "Location",
    description: "Description",
    image_url: "Image",
    status: "Status",
    specs: "Specifications",
  };

  const otherFields = Array.isArray(parsed.changedFields)
    ? parsed.changedFields.filter((f) => f !== "status")
    : [];

  return (
    <div className="space-y-1.5 mb-2 mt-0.5 text-xs">
      {/* Status Change */}
      {parsed.status && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[var(--color-text-secondary)] font-medium">
            Status:
          </span>
          <span
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${getAssetStatusStyle(parsed.status.from)}`}
          >
            {getStatusText(parsed.status.from)}
          </span>
          <span className="text-[var(--color-text-muted)]">→</span>
          <span
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${getAssetStatusStyle(parsed.status.to)}`}
          >
            {getStatusText(parsed.status.to)}
          </span>
        </div>
      )}

      {/* Fields changed */}
      {otherFields.length > 0 && (
        <div className="text-[11px] text-[var(--color-text-secondary)]">
          <span className="text-[var(--color-text-muted)] font-medium">
            Updated:{" "}
          </span>
          <span className="text-[var(--color-text)] font-medium">
            {otherFields.map((f) => fieldMap[f] || f).join(", ")}
          </span>
        </div>
      )}

      {/* Damaged parts */}
      {Array.isArray(parsed.damagedSpecifications) &&
        parsed.damagedSpecifications.length > 0 && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs">
            <span className="font-semibold text-amber-300 block mb-0.5">
              Damaged Parts:
            </span>
            <span className="text-amber-200/90 text-[11px]">
              {parsed.damagedSpecifications.join(", ")}
            </span>
          </div>
        )}

      {/* Repair details */}
      {parsed.repairDetails && (
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-input)]/70 p-2 text-xs">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-muted)] block mb-1">
            Problem Details:
          </span>
          <p className="whitespace-pre-line text-xs text-[var(--color-text)]">
            {parsed.repairDetails}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ItemDetailPanel({ item, onClose, onEdit, onDelete }) {
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [closing, setClosing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Item history state
  const [historyEntries, setHistoryEntries] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const panelRef = useRef(null);
  const t = useTranslations("itemDetail");

  // Fetch change history for this specific item
  useEffect(() => {
    let isMounted = true;

    async function loadItemHistory() {
      if (!item) return;

      setLoadingHistory(true);
      try {
        const token =
          window.localStorage.getItem(AUTH_TOKEN_KEY) ||
          window.sessionStorage.getItem(AUTH_TOKEN_KEY);

        const queryParams = new URLSearchParams();
        if (item.id) queryParams.set("code", item.id);
        if (item.databaseId)
          queryParams.set("assetId", String(item.databaseId));
        if (item.id) queryParams.set("search", item.id);

        const url = `${ENDPOINTS.HISTORY}?${queryParams.toString()}`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to load history");

        const data = await res.json();
        if (isMounted && data.success) {
          setHistoryEntries(data.data || []);
        }
      } catch (err) {
        console.error("Fetch item history error:", err);
      } finally {
        if (isMounted) {
          setLoadingHistory(false);
        }
      }
    }

    loadItemHistory();

    return () => {
      isMounted = false;
    };
  }, [item]);

  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, 200);
  }, [closing, onClose]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  function handleScroll(event) {
    // When scrolling down on mobile, auto-expand the bottom sheet to full height
    if (!isExpanded && event.currentTarget.scrollTop > 15) {
      setIsExpanded(true);
    }
  }

  if (!item) return null;

  const statusKey = getAssetStatusLabelKey(item.status);
  const statusLabel = statusKey
    ? t(statusKey, {
        defaultValue: item.status,
      })
    : item.status;

  const statusStyle = getAssetStatusStyle(item.status);

  return (
    <>
      {/* Blurred Backdrop Overlay (Desktop & Mobile) */}
      <div
        className={`assetra-sheet-backdrop ${closing ? "is-closing opacity-0" : ""}`}
        onClick={handleClose}
        aria-label="Close detail panel"
      />

      <aside
        ref={panelRef}
        onScroll={handleScroll}
        className={`assetra-detail-panel border-l border-[var(--color-border)] bg-[var(--color-background)] overflow-y-auto ${
          closing ? "is-closing" : ""
        } ${isExpanded ? "is-expanded" : ""}`}
      >
        {/* Sticky Header: Pull Handle, Title, and Close Button */}
        <div className="sticky top-0 z-30 bg-[var(--color-background)]/95 backdrop-blur-md px-4 sm:px-5 pt-2 pb-3 border-b border-[var(--color-border)]/60 transition-colors">
          {/* Mobile Pull Handle Pill */}
          <div
            className="lg:hidden flex flex-col items-center pt-0.5 pb-2.5 cursor-grab select-none active:cursor-grabbing"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            <div className="w-12 h-1.5 rounded-full bg-[var(--color-border)] hover:bg-[var(--color-border-hover)] transition" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">{t("title")}</h2>
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="lg:hidden text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition p-1"
                aria-label={isExpanded ? "Collapse sheet" : "Expand sheet"}
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleClose}
              aria-label={t("close")}
              className="rounded-lg p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-input)] hover:text-[var(--color-white)] transition"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Scrollable content starting directly from the item image */}
        <div className="p-4 sm:p-5 pt-4">
          <div className="aspect-video rounded-lg bg-gradient-to-br from-[var(--color-media-start)] to-[var(--color-input)] flex items-center justify-center mb-4 overflow-hidden">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300 hover:scale-[1.02]"
                onClick={() => setShowImagePreview(true)}
              />
            ) : (
              <span aria-hidden="true" className="text-4xl opacity-30">
                📦
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mb-1 gap-2">
            <h3 className="text-base font-semibold text-[var(--color-primary)] truncate">
              {item.name}
            </h3>

            <span
              className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${statusStyle}`}
            >
              {statusLabel}
            </span>
          </div>

          <p
            className={`${FONTS.CODE} mb-5 text-xs text-[var(--color-text-muted)]`}
          >
            {item.id}
          </p>

          {item.status === "needs_repair" && item.repair && (
            <div className="mb-5 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-warning)]">
                <Wrench size={15} strokeWidth={1.9} />
                {t("repairMarked")}
              </div>

              {item.repair.specifications?.length > 0 && (
                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                  {item.repair.specifications
                    .map((spec) => spec.name)
                    .join(", ")}
                </p>
              )}

              {item.repair.details && (
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {item.repair.details}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-lg border border-[var(--color-border)] p-3">
              <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
                {t("category")}
              </div>
              <div className="text-sm truncate">{item.category || "-"}</div>
            </div>

            <div className="rounded-lg border border-[var(--color-border)] p-3">
              <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
                {t("location")}
              </div>
              <div className="text-sm truncate">{item.location || "-"}</div>
            </div>
          </div>

          {item.description && (
            <div className="mb-5">
              <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
                {t("description")}
              </h4>
              <p
                className={`${FONTS.DESCRIPTION} text-sm text-[var(--color-text-secondary)] leading-relaxed`}
              >
                {item.description}
              </p>
            </div>
          )}

          {item.specs && item.specs.length > 0 && (
            <div className="mb-5">
              <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
                {t("specifications")}
              </h4>

              <div className="flex flex-col gap-1.5">
                {item.specs.map((spec) => (
                  <div
                    key={spec.id_specification}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span
                      title={spec.name}
                      className="text-[var(--color-text-muted)] shrink-0 max-w-[45%] truncate"
                    >
                      {spec.name}
                    </span>

                    <span
                      title={spec.value}
                      className={`${FONTS.DESCRIPTION} min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-right text-[var(--color-text)]`}
                    >
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History of Changes Section */}
          <div className="mb-6 border-t border-[var(--color-border)] pt-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5">
                <History
                  size={14}
                  strokeWidth={1.8}
                  className="text-[var(--color-primary)]"
                />
                {t("historyChanges", { defaultValue: "Riwayat Perubahan" })}
              </h4>
              {historyEntries.length > 0 && (
                <span className="text-[11px] font-medium text-[var(--color-text-muted)] bg-[var(--color-input)] px-2 py-0.5 rounded-full border border-[var(--color-border)]">
                  {historyEntries.length}
                </span>
              )}
            </div>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-4 text-xs text-[var(--color-text-muted)]">
                <span className="animate-pulse">
                  {t("loadingHistory", {
                    defaultValue: "Memuat riwayat perubahan...",
                  })}
                </span>
              </div>
            ) : historyEntries.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] italic py-1">
                {t("noHistoryChanges", {
                  defaultValue: "Belum ada riwayat perubahan untuk item ini.",
                })}
              </p>
            ) : (
              <div className="relative pl-3.5 space-y-3.5 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[1px] before:bg-[var(--color-border)]">
                {historyEntries.map((entry) => {
                  const badgeClass = getHistoryBadgeStyle(entry.type);
                  const label = getHistoryLabel(entry.type);
                  const dateStr = entry.created_at
                    ? new Date(entry.created_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";

                  return (
                    <div key={entry.id} className="relative text-xs">
                      {/* Timeline bullet */}
                      <div className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-[var(--color-primary)] ring-4 ring-[var(--color-background)]" />

                      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/50 p-2.5">
                        <div className="flex items-center justify-between gap-1.5 mb-1 flex-wrap">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${badgeClass}`}
                          >
                            {label}
                          </span>
                          {dateStr && (
                            <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                              <Calendar size={10} />
                              {dateStr}
                            </span>
                          )}
                        </div>

                        <RenderHistoryDescription
                          description={entry.description}
                        />

                        {entry.performed_by_name && (
                          <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] mt-1">
                            <User size={11} />
                            <span>{entry.performed_by_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Existing treatmentHistory if present */}
          {item.treatmentHistory && item.treatmentHistory.length > 0 && (
            <div className="mb-6 border-t border-[var(--color-border)] pt-5">
              <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
                {t("treatmentHistory")}
              </h4>

              <div className="flex flex-col gap-3">
                {item.treatmentHistory.map((entry, index) => (
                  <div key={index} className="flex gap-3 text-xs">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />
                    <div>
                      <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide">
                        {entry.date}
                      </p>
                      <p className="text-sm">{entry.title}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {entry.meta}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 sticky bottom-0 bg-[var(--color-background)] pt-2 pb-1">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="assetra-btn assetra-btn-secondary flex-1 flex items-center justify-center gap-1.5"
            >
              <Pencil size={16} strokeWidth={1.75} />
              {t("edit")}
            </button>

            <button
              type="button"
              onClick={() => onDelete([item.id])}
              className="assetra-btn flex-1 flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: colors.danger,
                color: colors.white,
              }}
            >
              <PackageX size={16} strokeWidth={1.75} />
              {t("deactivate")}
            </button>
          </div>
        </div>
      </aside>

      {showImagePreview && item.imageUrl && (
        <ImagePreviewModal
          src={item.imageUrl}
          alt={item.name}
          onClose={() => setShowImagePreview(false)}
        />
      )}
    </>
  );
}
