"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function ImagePreviewModal({
  src,
  alt = "",
  onClose,
}) {
  useEffect(() => {
    if (!src) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-[var(--color-overlay)]/75
        backdrop-blur-md
        p-4
        animate-image-preview-backdrop
      "
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onClick={onClose}
    >
      {/* Preview image */}
      <div
        className="
          relative
          max-w-[min(900px,92vw)]
          max-h-[88vh]
          animate-image-preview-image
        "
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="
            block
            max-h-[88vh]
            max-w-[min(900px,92vw)]
            w-auto
            h-auto
            object-contain
            rounded-xl
            shadow-2xl
          "
        />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close image preview"
          className="
            absolute
            -right-3
            -top-3
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            border
            border-[var(--color-border)]
            bg-[var(--color-input)]
            text-[var(--color-white)]
            shadow-lg
            transition-all
            duration-200
            hover:scale-105
            hover:bg-[var(--color-input-hover)]
            active:scale-95
          "
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}