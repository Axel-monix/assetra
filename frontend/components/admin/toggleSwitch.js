"use client";

import { useTranslations } from "next-intl"; 

export default function ToggleSwitch({ checked, onChange, label }) {
  const t = useTranslations("manageAdmin"); 

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(event) => {
        event.stopPropagation();
        onChange(!checked);
      }}
      className="flex items-center gap-2"
    >
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
          checked ? "bg-[var(--color-cyan)]" : "bg-[var(--color-border)]"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-[var(--color-white)] transition ${
            checked ? "translate-x-4.5" : "translate-x-1"
          }`}
          style={{ transform: checked ? "translateX(18px)" : "translateX(4px)" }}
        />
      </span>
      <span className={`text-xs font-medium ${checked ? "text-[var(--color-cyan)]" : "text-[var(--color-text-muted)]"}`}>
        {label || (checked ? t("active") : t("inactive"))} 
      </span>
    </button>
  );
}