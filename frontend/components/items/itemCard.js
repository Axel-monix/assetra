"use client";

import { useState } from "react";
import { FONTS } from "@/lib/constants";
import { getAssetStatusLabelKey, getAssetStatusStyle } from "@/lib/assetStatus";
import { useTranslations } from "next-intl";

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
      className={`assetra-item-card text-left ${selected ? "is-selected" : ""}`}
    >
      <div className="assetra-item-media">
        {hasImage ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="assetra-item-image"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <span aria-hidden="true" className="assetra-item-empty-icon">
            📦
          </span>
        )}
      </div>

      <div className="assetra-item-content">
        <div className="assetra-item-header">
          <h3 className={`${FONTS.MAIN} assetra-item-name`}>{item.name}</h3>
          <span className="assetra-item-tag">{categoryName}</span>
        </div>

        <p className={`${FONTS.CODE} assetra-item-id`}>{item.id}</p>

        <div className="assetra-item-footer">
          <span className={`${FONTS.MAIN} assetra-item-status ${statusStyle}`}>
            <span className={`assetra-status-dot ${statusStyle}`} />
            {displayStatus}
          </span>

          <span className={`${FONTS.MAIN} assetra-item-location`}>
            {item.location || ""}
          </span>
        </div>
      </div>
    </button>
  );
}
