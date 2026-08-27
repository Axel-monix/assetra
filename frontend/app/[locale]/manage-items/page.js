"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

import DashboardLayout from "@/components/dashboard/dashboardLayout";
import ItemCard from "@/components/items/itemCard";
import ItemDetailPanel from "@/components/items/itemDetailPanel";
import BulkActionBar from "@/components/items/bulkActionBar";
import AddItemForm from "@/components/items/addItemForm";
import EditItemForm from "@/components/items/editItemForm";
import DeactivateItemForm from "@/components/items/deactivateItemForm";

import { LayoutGrid, List, Plus, X } from "lucide-react";
import FilterForm, {
  createDefaultFilters,
} from "@/components/items/itemFilterForm";

import { AUTH_TOKEN_KEY, AUTH_USER_KEY, ENDPOINTS } from "@/lib/constants";

const DOUBLE_CLICK_DELAY_MS = 220;

export default function ManageItemsPage() {
  const router = useRouter();
  const t = useTranslations("manageItem");

  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);

  const [mode, setMode] = useState("none");

  const [viewMode, setViewMode] = useState("grid");

  const [filters, setFilters] = useState(createDefaultFilters());

  const [showAddForm, setShowAddForm] = useState(false);

  const [editingItem, setEditingItem] = useState(null);

  const [deactivateTarget, setDeactivateTarget] = useState(null);

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
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [response, categoriesResponse] = await Promise.all([
        fetch(ENDPOINTS.ASSETS, { headers }),

        fetch(ENDPOINTS.CATEGORIES, { headers }),
      ]);

      const result = await response.json();

      const categoryResult = await categoriesResponse.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t("loadError"));
      }

      const categoryData = categoryResult.success
        ? categoryResult.data || []
        : [];

      setCategories(categoryData);

      const categoryNames = new Map(
        categoryData.map((category) => [
          String(category.id),
          category.category_name,
        ]),
      );

      setItems(
        (result.data || []).map((item) => ({
          ...item,

          category:
            typeof item.category === "number" ||
            (typeof item.category === "string" && /^\d+$/.test(item.category))
              ? categoryNames.get(String(item.category)) || item.category
              : item.category,
        })),
      );
    } catch (err) {
      console.error("Fetch items error:", err);

      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router, t]);

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

      setUser({
        ...parsedUser,

        role: parsedUser.role || parsedUser.role_name || parsedUser.userRole,
      });

      setIsInitialized(true);

      await fetchItems();
    }

    init();
  }, [router, fetchItems]);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
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
  function handleApplyFilters(nextFilters) {
    setFilters(nextFilters);
    clearSelection();
  }

  function handleClearFilters(nextFilters) {
    setFilters(nextFilters);
    clearSelection();
  }
  function getToken() {
    return (
      window.localStorage.getItem(AUTH_TOKEN_KEY) ||
      window.sessionStorage.getItem(AUTH_TOKEN_KEY)
    );
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

        body: JSON.stringify({
          ids: selectedIds,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t("printQrError"));
      }

      if (result.data?.qrCode) {
        window.open(result.data.qrCode, "_blank");
      }
    } catch (err) {
      console.error("Print QR error:", err);

      alert(err.message);
    }
  }

  async function handleDeactivate(ids, reason) {
    const token = getToken();

    try {
      const response = await fetch(ENDPOINTS.DEACTIVATE_ASSETS, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids, reason }),
      });

      console.log("Deactivate response status:", response.status);
      const text = await response.text();
      console.log("Deactivate response body:", text);

      if (!response.ok) {
        let errorMessage = t("statusChangeFailed");
        try {
          const errorData = JSON.parse(text);
          if (errorData.message) errorMessage = errorData.message;
        } catch {
          errorMessage = response.statusText || t("statusChangeFailed");
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(t("serverResponseError"));
      }

      if (!result.success) {
        throw new Error(result.message || t("statusChangeFailed"));
      }

      await fetchItems();
      clearSelection();
    } catch (err) {
      console.error("Deactivate error:", err);
      throw err;
    }
  }
  async function handleAddItem(payload) {
    const token = getToken();

    try {
      const response = await fetch(ENDPOINTS.ASSETS, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          name: payload.name,

          id_category: payload.id_category,

          status: payload.status,

          location: payload.location,

          description: payload.description,

          image_url: payload.image_url,

          specs: payload.specs,
        }),
      });

      const text = await response.text();

      let result;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(t("serverResponseError"));
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || t("addFailed"));
      }

      await fetchItems();
    } catch (err) {
      console.error("Add item error:", err);

      throw err;
    }
  }

  async function handleEditItem(id, payload) {
    const token = getToken();

    try {
      const response = await fetch(`${ENDPOINTS.ASSETS}/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      const text = await response.text();
      console.log("Response body:", text);

      if (!response.ok) {
        let errorMessage = t("editFailed");
        try {
          const errorData = JSON.parse(text);
          if (errorData.message) errorMessage = errorData.message;
        } catch {
          errorMessage = response.statusText || t("editFailed");
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(t("serverResponseError"));
      }

      if (!result.success) {
        throw new Error(result.message || t("editFailed"));
      }

      await fetchItems();
      clearSelection();
    } catch (err) {
      console.error("Edit item error:", err);
      throw err;
    }
  }

  const selectedItem =
    mode === "single" ? items.find((item) => item.id === selectedIds[0]) : null;

  const filteredItems = items.filter((item) => {
    const itemCategoryId = String(
      item.id_category ?? item.category_id ?? item.categoryId ?? "",
    );

    const itemStatus = String(item.status || "").toLowerCase();

    // CATEGORY
    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(itemCategoryId)
    ) {
      return false;
    }

    // STATUS
    if (filters.statuses.length > 0 && !filters.statuses.includes(itemStatus)) {
      return false;
    }

    // DATE
    const createdAt = item.created_at;

    if (createdAt) {
      const itemDate = new Date(createdAt);

      if (filters.dateFrom) {
        const fromDate = new Date(`${filters.dateFrom}T00:00:00`);

        if (itemDate < fromDate) {
          return false;
        }
      }

      if (filters.dateTo) {
        const toDate = new Date(`${filters.dateTo}T23:59:59.999`);

        if (itemDate > toDate) {
          return false;
        }
      }
    } else if (filters.dateFrom || filters.dateTo) {
      return false;
    }

    return true;
  });
  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center text-[var(--color-text-secondary)] text-sm">
        {t("loading")}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center text-[var(--color-danger)] text-sm">
        {t("loginRequired")}
      </div>
    );
  }

  return (
    <DashboardLayout role={user.role} userName={user.name || user.username}>
      <div className="flex h-full">
        <div className="flex-1 min-w-0">
          {error && (
            <p className="mb-4 text-sm text-[var(--color-danger)]">{error}</p>
          )}

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 flex-wrap">
              <FilterForm
                categories={categories}
                filters={filters}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
              />

              {(filters.categories.length > 0 ||
                filters.dateFrom ||
                filters.dateTo ||
                !(
                  filters.statuses.length === 3 &&
                  filters.statuses.includes("functional") &&
                  filters.statuses.includes("need_repair") &&
                  filters.statuses.includes("borrowed")
                )) && (
                <button
                  type="button"
                  onClick={() => handleClearFilters(createDefaultFilters())}
                  className="assetra-filter-clear-inline"
                >
                  {t("clearAll")}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label={t("gridView")}
                className={`p-1.5 rounded-md transition ${
                  viewMode === "grid"
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                <LayoutGrid size={16} strokeWidth={1.75} />
              </button>

              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label={t("listView")}
                className={`p-1.5 rounded-md transition ${
                  viewMode === "list"
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                <List size={16} strokeWidth={1.75} />
              </button>
            </div>

          </div>

          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-24"
                : "flex flex-col gap-3 pb-24"
            }
          >
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
              className="assetra-add-item-card"
            >
              <Plus size={22} strokeWidth={1.9} />

              <span className="text-xs">{t("addItem")}</span>
            </button>
          </div>
        </div>

        {selectedItem && (
          <ItemDetailPanel
            key={selectedItem.id}
            item={selectedItem}
            onClose={clearSelection}
            onEdit={(item) => setEditingItem(item)}
            onDelete={(ids) => setDeactivateTarget(ids)}
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowAddForm(true)}
        aria-label={t("addItem")}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-contrast)] flex items-center justify-center shadow-2xl transition hover:bg-[var(--color-primary-hover)] hover:-translate-y-0.5 active:translate-y-0"
      >
        <Plus size={22} strokeWidth={1.9} />
      </button>

      <BulkActionBar
        selectedCount={selectedIds.length}
        onPrintQr={handlePrintQr}
        onDeactivate={() => setDeactivateTarget(selectedIds)}
        onClose={clearSelection}
      />

      {showAddForm && (
        <AddItemForm
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddItem}
        />
      )}

      {editingItem && (
        <EditItemForm
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSubmit={handleEditItem}
        />
      )}

      {deactivateTarget && (
        <DeactivateItemForm
          count={deactivateTarget.length}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={(reason) => handleDeactivate(deactivateTarget, reason)}
        />
      )}
    </DashboardLayout>
  );
}
