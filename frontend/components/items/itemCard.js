"use client";

import { useState, useRef, useEffect } from "react";
import { FONTS } from "@/lib/constants";
import { getAssetStatusLabelKey, getAssetStatusStyle } from "@/lib/assetStatus";
import { useTranslations } from "next-intl";

function getCategoryName(item) {
  if (typeof item.category === "object" && item.category !== null) {
    return item.category.category_name || item.category.name || "-";
  }

  return item.categoryName || item.category_name || item.category || "-";
}

const HOLD_DURATION_MS = 450;
const MOVE_THRESHOLD_PX = 10;

export default function ItemCard({
  item,
  selected,
  selectedOrder,
  isSelectionMode,
  onClick,
  onHoldSelect,
}) {
  const t = useTranslations("manageItem");
  const [imageError, setImageError] = useState(false);
  const [isPressing, setIsPressing] = useState(false);

  const holdTimerRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const isHoldTriggeredRef = useRef(false);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  function clearHoldTimer() {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsPressing(false);
  }

  function handlePointerDown(event) {
    // Only respond to primary click / touch
    if (event.button !== undefined && event.button !== 0) return;

    startPosRef.current = { x: event.clientX, y: event.clientY };
    isHoldTriggeredRef.current = false;
    setIsPressing(true);

    holdTimerRef.current = setTimeout(() => {
      isHoldTriggeredRef.current = true;
      setIsPressing(false);

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(40);
      }

      if (onHoldSelect) {
        onHoldSelect(item.id);
      }
    }, HOLD_DURATION_MS);
  }

  function handlePointerMove(event) {
    if (!holdTimerRef.current) return;

    const dist = Math.hypot(
      event.clientX - startPosRef.current.x,
      event.clientY - startPosRef.current.y,
    );

    if (dist > MOVE_THRESHOLD_PX) {
      clearHoldTimer();
    }
  }

  function handlePointerUp() {
    clearHoldTimer();
  }

  function handlePointerCancel() {
    clearHoldTimer();
  }

  function handleClick(event) {
    if (isHoldTriggeredRef.current) {
      event.preventDefault();
      event.stopPropagation();
      isHoldTriggeredRef.current = false;
      return;
    }

    if (onClick) {
      onClick(item.id, event);
    }
  }

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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={handleClick}
      style={{ touchAction: "pan-y" }}
      className={`assetra-item-card text-left relative select-none transition-all duration-200 ${
        selected ? "is-selected" : ""
      } ${isPressing ? "scale-[0.98]" : ""}`}
    >
      <div className="assetra-item-media relative">
        {selected && selectedOrder ? (
          <span
            className="assetra-selection-badge"
            aria-label={`Selected ${selectedOrder}`}
          >
            {selectedOrder}
          </span>
        ) : isSelectionMode ? (
          <span
            className="absolute top-2.5 right-2.5 z-10 h-6 w-6 rounded-full border-2 border-white/70 bg-black/40 shadow-sm backdrop-blur-xs transition-transform hover:scale-105"
            aria-hidden="true"
          />
        ) : null}

        {hasImage ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="assetra-item-image pointer-events-none"
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
