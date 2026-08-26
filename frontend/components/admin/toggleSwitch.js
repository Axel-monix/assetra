"use client";

import React from "react";

/**
 * Komponen ToggleSwitch yang sepenuhnya terintegrasi dengan Global CSS.
 */
export default function ToggleSwitch({
  checked = false,
  onChange,
  disabled = false,
  label = "",
  showLabel = false,
  size = "md",
}) {
  const handleClick = (e) => {
    e.stopPropagation();
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  // Konfigurasi ukuran Switch
  const sizes = {
    sm: {
      track: "w-8 h-4.5 p-0.5",
      knob: "w-3.5 h-3.5",
      translate: "translate-x-3.5",
    },
    md: {
      track: "w-11 h-6 p-1",
      knob: "w-4 h-4",
      translate: "translate-x-5",
    },
    lg: {
      track: "w-14 h-7.5 p-1",
      knob: "w-5.5 h-5.5",
      translate: "translate-x-6.5",
    },
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div
      className={`inline-flex items-center gap-2 select-none ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
      onClick={handleClick}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick(e);
          }
        }}
        className={`
          toggle-track relative inline-flex shrink-0 items-center rounded-full
          ${currentSize.track}
        `}
      >
        <span className="sr-only">{label || "Toggle status"}</span>
        <span
          className={`
            toggle-thumb pointer-events-none inline-block rounded-full
            ${currentSize.knob}
            ${checked ? currentSize.translate : "translate-x-0"}
          `}
        />
      </button>
      {showLabel && label && (
        <span className="text-xs font-semibold text-[var(--color-text)]">
          {label}
        </span>
      )}
    </div>
  );
}