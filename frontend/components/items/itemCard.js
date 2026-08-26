"use client";

import { FONTS } from "../../lib/constants";
import { useState } from "react";
import { useTranslations } from "next-intl";

const statusDot = {
  Tersedia: "assetra-status-success",
  Maintenance: "assetra-status-warning",
  Rusak: "assetra-status-danger",
  functional: "assetra-status-success",
  needs_repair: "assetra-status-warning",
  borrowed: "assetra-status-success",
  unavailable: "assetra-status-danger",
};

const statusText = {
  Tersedia: "assetra-status-success",
  Maintenance: "assetra-status-warning",
  Rusak: "assetra-status-danger",
  functional: "assetra-status-success",
  needs_repair: "assetra-status-warning",
  borrowed: "assetra-status-success",
  unavailable: "assetra-status-danger",
};

function getCategoryName(item) {
  if (typeof item.category === "object" && item.category !== null) {
    return item.category.category_name || item.category.name || "-";
  }
  return item.categoryName || item.category_name || item.category || "-";
}

export default function ItemCard({ item, selected, onClick }) {
  const t = useTranslations("manageItem");
  const [imageError, setImageError] = useState(false);
  const categoryName = getCategoryName(item);

  // Cek apakah ada gambar
  const hasImage = item.imageUrl && !imageError;

  // Format status biar konsisten
  const statusMap = {
    functional: "Tersedia",
    needs_repair: "Maintenance",
    borrowed: "Dipinjam",
    unavailable: "Tidak Tersedia",
  };

  const displayStatus = t(`statusOptions.${item.status}`, {
    defaultValue: statusMap[item.status] || item.status,
  });

  return (
    <button
      type="button"
      onClick={(event) => onClick(item.id, event)}
      className={`assetra-item-card text-left overflow-hidden ${
        selected ? "is-selected" : ""
      }`}
    >
      {/* Gambar */}
      <div className="aspect-video bg-gradient-to-br from-[var(--color-media-start)] to-[var(--color-input)] flex items-center justify-center relative overflow-hidden">
        {hasImage ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <span className="text-3xl opacity-30">📦</span>
        )}
      </div>

      <div className="p-3.5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium leading-snug pr-2 line-clamp-1">
            {item.name}
          </h3>
          <span className="shrink-0 rounded-md bg-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[var(--color-primary-soft)]">
            {categoryName}
          </span>
        </div>

        <p
          className={`${FONTS.CODE} mb-2.5 text-[11px] text-[var(--color-text-muted)]`}
        >
          {item.id}
        </p>

        <div className="flex items-center justify-between text-xs">
          <span
            className={`flex items-center gap-1.5 font-medium ${statusText[item.status] || statusText[displayStatus]}`}
          >
            <span
              className={`assetra-status-dot ${statusDot[item.status] || statusDot[displayStatus]}`}
            />
            {displayStatus}
          </span>
          <span className="text-[var(--color-text-muted)]">
            {item.location || ""}
          </span>
        </div>
      </div>
    </button>
  );
}
