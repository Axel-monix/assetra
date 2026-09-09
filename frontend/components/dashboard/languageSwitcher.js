"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { GB, ID } from "country-flag-icons/react/3x2";

const LOCALES = [
  {
    code: "en",
    label: "EN",
    flag: GB,
  },
  {
    code: "id",
    label: "ID",
    flag: ID,
  },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const current = LOCALES.find((l) => l.code === locale) || LOCALES[0];
  const CurrentFlag = current.flag;

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="language-switcher" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="language-switcher-trigger"
        aria-expanded={open}
      >
        <CurrentFlag
          className="language-switcher-flag"
          title={current.label}
        />

        <span>{current.label}</span>

        <ChevronDown
          size={14}
          strokeWidth={1.75}
          className="language-switcher-chevron"
        />
      </button>

      <div
        className="language-switcher-menu"
        data-state={open ? "open" : "closed"}
        aria-hidden={!open}
      >
        {LOCALES.map((l) => {
          const Flag = l.flag;

          return (
            <button
              key={l.code}
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={() => {
                router.replace(pathname, { locale: l.code });
                setOpen(false);
              }}
              className={`language-switcher-option ${
                l.code === locale ? "is-active" : ""
              }`}
            >
              <Flag className="language-switcher-flag" title={l.label} />

              <span>{l.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}