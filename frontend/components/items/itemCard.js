"use client";

import { useState } from "react";
import { FONTS } from "@/lib/constants";
import {
  getAssetStatusLabelKey,
  getAssetStatusStyle,
} from "@/lib/assetStatus";
import { useTranslations } from "next-intl";

function getCategoryName(item) {
  if (typeof item.category === "object" && item.category !== null) {
    return item.category.category_name || item.category.name || "-";
  }

  return (
    item.categoryName ||
    item.category_name ||
    item.category ||
    "-"
  );
}

export default function ItemCard({ item, selected, onClick }) {
  const t = useTranslations("manageItem");
  const [imageError, setImageError] = useState(false);

  const categoryName = getCategoryName(item);
  const hasImage = item.imageUrl && !imageError;

  const statusKey = getAssetStatusLabelKey(item.status);

  const displayStatus = statusKey
    ? t(statusKey, {
        defaultValue: item.status,
      })
    : item.status;

  const statusStyle = getAssetStatusStyle(item.status);

  return (
    <button
      type="button"
      onClick={(event) => onClick(item.id, event)}
      className={`assetra-item-card text-left ${
        selected ? "is-selected" : ""
      }`}
    >
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
          <span
            aria-hidden="true"
            className="text-3xl opacity-30"
          >
            📦
          </span>
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

        <div className="flex items-center justify-between gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-medium leading-none whitespace-nowrap ${statusStyle}`}
          >
            <span className={`assetra-status-dot ${statusStyle}`} />

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