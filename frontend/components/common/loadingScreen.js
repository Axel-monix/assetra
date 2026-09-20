"use client";

import { useTranslations } from "next-intl";

export default function LoadingScreen({ title, message, instant = false }) {
  const t = useTranslations("loading");

  return (
    <div
      className={`modal-overlay ${instant ? "assetra-loading-instant" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="modal-box popup-card">
        <div className="icon-box">
          <span className="assetra-feedback-spinner" aria-hidden="true" />
        </div>
        <h2>{title ?? t("title")}</h2>
        <p>{message ?? t("message")}</p>
      </div>
    </div>
  );
}