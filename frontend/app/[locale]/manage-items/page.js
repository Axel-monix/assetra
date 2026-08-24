"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import DashboardLayout from "@/components/dashboard/dashboardLayout";
import ItemCard from "@/components/items/itemCard";
import ItemDetailPanel from "@/components/items/itemDetailPanel";
import BulkActionBar from "@/components/items/bulkActionBar";
import AddItemForm from "@/components/items/addItemForm";
import { LayoutGrid, List, Plus, X } from "lucide-react";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, ENDPOINTS } from "@/lib/constants";

const DOUBLE_CLICK_DELAY_MS = 220;

export default function ManageItemsPage() {
  const router = useRouter();
  const t = useTranslations("manageItem");
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [mode, setMode] = useState("none");
  const [viewMode, setViewMode] = useState("grid");
  const [activeFilters, setActiveFilters] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const clickTimerRef = useRef(null);

  const fetchItems = useCallback(async () => {
    const token =
      window.localStorage.getItem(AUTH_TOKEN_KEY) ||
      window.sessionStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch(ENDPOINTS.ASSETS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengambil data asset.");
      }

      setItems(result.data || []);
    } catch (err) {
      console.error("Fetch items error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    async function init() {
      const raw =
        window.localStorage.getItem(AUTH_USER_KEY) ||
        window.sessionStorage.getItem(AUTH_USER_KEY);

      if (!raw) {
        router.replace("/login");
        return;
      }

      let parsedUser;
      try {
        parsedUser = JSON.parse(raw);
      } catch {
        router.replace("/login");
        return;
      }

      setUser(parsedUser);
      setIsInitialized(true);
      await fetchItems();
    }

    init();
  }, [router, fetchItems]);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, []);

  function handleSingleSelect(id) {
    if (mode === "multi") {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
      return;
    }
    setSelectedIds([id]);
    setMode("single");
  }

  function handleDoubleSelect(id) {
    if (mode === "single" && selectedIds[0] && selectedIds[0] !== id) {
      setSelectedIds([selectedIds[0], id]);
      setMode("multi");
    } else if (mode === "multi" && !selectedIds.includes(id)) {
      setSelectedIds((prev) => [...prev, id]);
    } else if (mode === "none") {
      setSelectedIds([id]);
      setMode("single");
    }
  }

  function handleCardClick(id, event) {
    if (event.detail >= 2) {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      handleDoubleSelect(id);
      return;
    }

    clickTimerRef.current = setTimeout(() => {
      handleSingleSelect(id);
      clickTimerRef.current = null;
    }, DOUBLE_CLICK_DELAY_MS);
  }

  function clearSelection() {
    setSelectedIds([]);
    setMode("none");
  }

  function removeFilter(filter) {
    setActiveFilters((prev) => prev.filter((f) => f !== filter));
  }

  async function handlePrintQr() {
    try {
      const token = getToken();
      const response = await fetch(ENDPOINTS.PRINT_QR, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal print QR");
      }

      if (result.data?.qrCode) {
        window.open(result.data.qrCode, "_blank");
      }
    } catch (err) {
      console.error("Print QR error:", err);
      alert(err.message);
    }
  }

  async function handleDeactivate(ids) {
    const token = getToken();
    try {
      const response = await fetch(ENDPOINTS.DEACTIVATE_ASSETS, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menonaktifkan item.");
      }

      await fetchItems();
      clearSelection();
    } catch (err) {
      console.error("Deactivate error:", err);
      alert(err.message);
    }
  }

  function getToken() {
    return (
      window.localStorage.getItem(AUTH_TOKEN_KEY) ||
      window.sessionStorage.getItem(AUTH_TOKEN_KEY)
    );
  }

  async function handleAddItem(payload) {
  const token = getToken();

  console.log("🚀 Payload:", payload);
  console.log("🔑 Token:", token);

  try {
    const response = await fetch(ENDPOINTS.ASSETS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        asset_name: payload.asset_name,
        id_category: payload.id_category,
        status: payload.status,
        image_url: payload.image_url,
      }),
    });

    console.log("📊 Response status:", response.status);
    
    // Coba baca response sebagai text dulu
    const text = await response.text();
    console.log("📄 Response text:", text);
    
    let result;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ Gagal parse JSON:", parseError);
      throw new Error(`Server response: ${text.substring(0, 100)}`);
    }

    console.log("📦 Result:", result);

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Gagal menambahkan item.");
    }

    await fetchItems();
  } catch (err) {
    console.error("❌ Add item error:", err);
    throw err;
  }
}

  // =============================================
  // 🔥 TAMBAHKAN INI - filteredItems & selectedItem
  // =============================================

  const selectedItem =
    mode === "single" ? items.find((i) => i.id === selectedIds[0]) : null;

  const filteredItems = items.filter((item) => {
    if (activeFilters.length === 0) return true;
    return activeFilters.some((f) => f === item.category || f === item.status);
  });

  // =============================================

  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-[#A1A1AA] text-sm">
        {t("loading") || "Memuat..."}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-red-400 text-sm">
        Silakan login ulang.
      </div>
    );
  }

  return (
    <DashboardLayout role={user.role} userName={user.name || user.username}>
      <div className="flex h-full">
        <div className="flex-1 min-w-0">
          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
          {loading && (
            <p className="mb-4 text-sm text-[#A1A1AA]">
              {t("loading") || "Memuat asset..."}
            </p>
          )}

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[#71717A] uppercase tracking-wide mr-1">
                {t("filters")}
              </span>
              {activeFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => removeFilter(filter)}
                  className="flex items-center gap-1 rounded-md bg-[#8083FF]/15 text-[#A5A7FF] px-2 py-1"
                >
                  {filter} <X size={10} strokeWidth={2} />
                </button>
              ))}
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilters([])}
                  className="text-[#A5A7FF] hover:text-[#8083FF] ml-1"
                >
                  {t("clearAll")}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-[#272D3D] p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md ${viewMode === "grid" ? "bg-[#8083FF] text-[#111323]" : "text-[#A1A1AA]"}`}
              >
                <LayoutGrid size={16} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md ${viewMode === "list" ? "bg-[#8083FF] text-[#111323]" : "text-[#A1A1AA]"}`}
              >
                <List size={16} strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                selected={selectedIds.includes(item.id)}
                onClick={handleCardClick}
              />
            ))}

            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="rounded-xl border border-dashed border-[#272D3D] flex flex-col items-center justify-center gap-2 text-[#71717A] hover:border-[#8083FF] hover:text-[#8083FF] min-h-[168px]"
            >
              <Plus size={22} strokeWidth={1.9} />
              <span className="text-xs">{t("addItem")}</span>
            </button>
          </div>
        </div>

        {selectedItem && (
          <ItemDetailPanel
            item={selectedItem}
            onClose={clearSelection}
            onEdit={(item) => {
              console.log("Edit:", item.id);
            }}
            onDelete={handleDeactivate}
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[#8083FF] text-[#111323] flex items-center justify-center shadow-2xl hover:bg-[#9295FF]"
      >
        <Plus size={22} strokeWidth={1.9} />
      </button>

      <BulkActionBar
        selectedCount={selectedIds.length}
        onPrintQr={handlePrintQr}
        onDeactivate={() => handleDeactivate(selectedIds)}
        onClose={clearSelection}
      />

      {showAddForm && (
        <AddItemForm
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddItem}
        />
      )}
    </DashboardLayout>
  );
}
