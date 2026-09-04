"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

import { AUTH_TOKEN_KEY, ENDPOINTS } from "@/lib/constants";
import PublicItemCard from "@/components/items/publicItemCard";

export default function GuestAssetPage() {
  const params = useParams();
  const code = params.code;

  const router = useRouter();
  const t = useTranslations("guestAsset");

  const [state, setState] = useState({
    loading: true,
    error: "",
    data: null,
    maintenance: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token =
        window.localStorage.getItem(AUTH_TOKEN_KEY) ||
        window.sessionStorage.getItem(AUTH_TOKEN_KEY);

      try {
        const response = await fetch(ENDPOINTS.PUBLIC_ASSET_BY_CODE(code), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const result = await response.json();

        if (cancelled) return;

        if (!response.ok || !result.success) {
          setState({
            loading: false,
            error: result.message || t("notFound"),
            data: null,
            maintenance: [],
          });
          return;
        }

        // Extract maintenance dari response
        const maintenanceData = result.data.maintenance || result.data.history || [];

        setState({ 
          loading: false, 
          error: "", 
          data: result.data,
          maintenance: maintenanceData,
        });
      } catch (err) {
        if (cancelled) return;

        console.error("Load public asset error:", err);
        setState({ 
          loading: false, 
          error: t("loadError"), 
          data: null,
          maintenance: [],
        });
      }
    }

    if (code) load();

    return () => {
      cancelled = true;
    };
  }, [code, t]);

  const handleEdit = useCallback(() => {
    router.push("/manage-items");
  }, [router]);

  const handleDeactivate = useCallback(() => {
    router.push("/manage-items");
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-start justify-center pt-6 pb-12">
      {state.loading ? (
        <div className="flex flex-col items-center gap-3 mt-20">
          <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">{t("loading")}</p>
        </div>
      ) : state.error ? (
        <div className="w-full max-w-md mx-4 p-6 text-center bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl">
          <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
        </div>
      ) : state.data ? (
        <PublicItemCard
          asset={state.data.asset}
          permissions={state.data.permissions}
          maintenance={state.maintenance}
          onEdit={handleEdit}
          onDeactivate={handleDeactivate}
        />
      ) : null}
    </div>
  );
}