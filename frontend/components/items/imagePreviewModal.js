"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import colors from "@/lib/colors";

const overlayMix = (percent) =>
  `color-mix(in srgb, ${colors.overlay} ${percent}%, transparent)`;

const styles = {
  backdrop: {
    backgroundColor: overlayMix(75),
  },
  image: {
    boxShadow: `0 25px 50px -12px ${overlayMix(25)}`,
  },
};

export default function ImagePreviewModal({ src, alt = "", onClose }) {
  const [closeHovered, setCloseHovered] = useState(false);

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
        backdrop-blur-md
        p-4
        animate-image-preview-backdrop
      "
      style={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onClick={onClose}
    >
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
          "
          style={styles.image}
        />

        <button
          type="button"
          onClick={onClose}
          onMouseEnter={() => setCloseHovered(true)}
          onMouseLeave={() => setCloseHovered(false)}
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
    transition-all
    duration-200
    hover:scale-105
    active:scale-95
  "
          style={{
            border: `1px solid ${colors.border}`,
            backgroundColor: closeHovered ? colors.surface : colors.input,
            color: colors.white,
            boxShadow: `0 10px 15px -3px ${overlayMix(10)}, 0 4px 6px -4px ${overlayMix(10)}`,
          }}
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
