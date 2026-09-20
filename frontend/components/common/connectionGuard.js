"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import LoadingScreen from "@/components/common/loadingScreen";

const CHECK_INTERVAL_MS = 10000;
const CHECK_TIMEOUT_MS = 8000;

export default function ConnectionGuard() {
  const t = useTranslations("loading");
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;

    async function check() {
      if (!navigator.onLine) {
        setOffline(true);
        return;
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

      try {
        await fetch("/favicon.ico", {
          method: "HEAD",
          cache: "no-store",
          signal: controller.signal,
        });
        if (active) setOffline(false);
      } catch {
        if (active) setOffline(true);
      } finally {
        clearTimeout(timer);
      }
    }

    const handleOffline = () => setOffline(true);
    const handleOnline = () => check();

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <LoadingScreen
      title={t("offlineTitle")}
      message={t("offlineMessage")}
    />
  );
}