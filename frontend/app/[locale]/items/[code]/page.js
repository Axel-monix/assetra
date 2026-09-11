"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AUTH_TOKEN_KEY, ENDPOINTS } from "@/lib/constants";
import PublicItemCard from "@/components/items/publicItemCard";
import EditItemForm from "@/components/items/editItemForm";
import DeactivateItemForm from "@/components/items/deactivateItemForm";

export default function GuestAssetPage() {
  const params = useParams();
  const code = params.code;
  const t = useTranslations("guestAsset");
  const tItem = useTranslations("manageItem")

  const [state, setState] = useState({
    loading: true,
    error: "",
    data: null,
    maintenance: [],
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  function getToken() {
    return (
      window.localStorage.getItem(AUTH_TOKEN_KEY) ||
      window.sessionStorage.getItem(AUTH_TOKEN_KEY)
    );
  }

  const loadAsset = useCallback(async () => {
    const token = getToken();

    try {
      const response = await fetch(ENDPOINTS.PUBLIC_ASSET_BY_CODE(code), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setState({
          loading: false,
          error: result.message || t("notFound"),
          data: null,
          maintenance: [],
        });
        return;
      }

      const maintenanceData =
        result.data.maintenance || result.data.history || [];

      setState({
        loading: false,
        error: "",
        data: result.data,
        maintenance: maintenanceData,
      });
    } catch (err) {
      console.error("Load public asset error:", err);
      setState({
        loading: false,
        error: t("loadError"),
        data: null,
        maintenance: [],
      });
    }
  }, [code, t]);

  useEffect(() => {
    if (code) loadAsset();
  }, [code, loadAsset]);

  const handleEdit = useCallback(() => {
    setShowEditModal(true);
  }, []);

  const handleDeactivate = useCallback(() => {
    setShowDeactivateModal(true);
  }, []);

  async function handleEditSubmit(itemId, payload) {
    const token = getToken();

    const response = await fetch(ENDPOINTS.ASSET_BY_ID(itemId), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || tItem("editFailed"));
    }

    await loadAsset();
  }

  async function handleDeactivateConfirm(reason) {
    const token = getToken();

    const response = await fetch(ENDPOINTS.DEACTIVATE_ASSETS, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ids: [state.data.asset.id], reason }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || tItem("statusChangeFailed"));
    }

    setShowDeactivateModal(false);
    await loadAsset();
  }

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
        <>
          <PublicItemCard
            asset={state.data.asset}
            permissions={state.data.permissions}
            maintenance={state.maintenance}
            onEdit={handleEdit}
            onDeactivate={handleDeactivate}
          />

          {showEditModal && (
            <EditItemForm
              item={state.data.asset}
              onClose={() => setShowEditModal(false)}
              onSubmit={handleEditSubmit}
            />
          )}

          {showDeactivateModal && (
            <DeactivateItemForm
              count={1}
              onClose={() => setShowDeactivateModal(false)}
              onConfirm={handleDeactivateConfirm}
            />
          )}
        </>
      ) : null}
    </div>
  );
}