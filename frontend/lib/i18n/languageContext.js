"use client";

// lib/i18n/languageContext.js
// Context ringan buat ganti bahasa tanpa perlu restrukturisasi routing
// Next.js (app/[locale]/...). Cukup bungkus root layout sekali pakai
// <LanguageProvider>, terus di komponen manapun tinggal:
//
//   const { t, locale, setLocale } = useLanguage();
//   t("header.profile")  ->  "Admin User Profile" / "Profil Admin"

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import translations from "./translations";

const LANGUAGE_STORAGE_KEY = "assetra_locale";
const DEFAULT_LOCALE = "en";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && translations[saved]) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((next) => {
    if (!translations[next]) return;
    setLocaleState(next);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
  }, []);

  // t("manageAdmin.showing", { from: 1, to: 4, total: 24 }) -> replace {from}/{to}/{total}
  const t = useCallback(
    (key, vars) => {
      const parts = key.split(".");
      let value = translations[locale];
      for (const part of parts) {
        value = value?.[part];
      }
      if (typeof value !== "string") return key;

      if (vars) {
        return Object.entries(vars).reduce(
          (str, [varKey, varValue]) => str.replaceAll(`{${varKey}}`, varValue),
          value
        );
      }
      return value;
    },
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage() harus dipanggil di dalam <LanguageProvider>");
  }
  return ctx;
}