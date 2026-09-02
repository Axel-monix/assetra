"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import SearchBar from "@/components/common/searchBar";
import DashboardLayout from "@/components/dashboard/dashboardLayout";
import ItemCard from "@/components/items/itemCard";
import ItemDetailPanel from "@/components/items/itemDetailPanel";
import BulkActionBar from "@/components/items/bulkActionBar";
import AddItemForm from "@/components/items/addItemForm";
import EditItemForm from "@/components/items/editItemForm";
import DeactivateItemForm from "@/components/items/deactivateItemForm";

import { LayoutGrid, List, Plus } from "lucide-react";
import FilterForm, {
  createDefaultFilters,
} from "@/components/items/itemFilterForm";

import { AUTH_TOKEN_KEY, AUTH_USER_KEY, ENDPOINTS } from "@/lib/constants";

const DOUBLE_CLICK_DELAY_MS = 220;
function getToken() {
  return (
    window.localStorage.getItem(AUTH_TOKEN_KEY) ||
    window.sessionStorage.getItem(AUTH_TOKEN_KEY)
  );
}
async function apiRequest(url, options = {}, fallbackErrorMessage) {
  const token = getToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const text = await response.text();

  let result;
  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(fallbackErrorMessage || "Server response tidak valid");
  }

  if (!response.ok || !result.success) {
    throw new Error(result.message || fallbackErrorMessage);
  }

  return result;
}

export default function ManageItemsPage() {
  const router = useRouter();
  const t = useTranslations("manageItem");

  // ================= STATE =================
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [mode, setMode] = useState("none");

  const [viewMode, setViewMode] = useState("grid");
  const [filters, setFilters] = useState(createDefaultFilters());
  const [search, setSearch] = useState("");
  // Modal/panel yang sedang terbuka
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const clickTimerRef = useRef(null);

  // ================= FETCH DATA =================

  const fetchItems = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const [assetsResult, categoriesResult] = await Promise.all([
        apiRequest(ENDPOINTS.ASSETS, {}, t("loadError")),
        apiRequest(ENDPOINTS.CATEGORIES, {}, t("loadError")),
      ]);

      const categoryList = categoriesResult.data || [];
      setCategories(categoryList);

      // Map id kategori -> nama kategori, dipakai buat "isi" nama kategori di setiap item
      const categoryNameById = new Map(
        categoryList.map((category) => [
          String(category.id),
          category.category_name,
        ]),
      );

      const itemsWithCategoryNames = (assetsResult.data || []).map((item) => ({
        ...item,
        category: categoryNameById.get(String(item.category)) || item.category,
      }));

      setItems(itemsWithCategoryNames);
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

  // Bersihkan timer double-click kalau komponen unmount
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  // ================= SELEKSI ITEM =================
  // Klik 1x -> pilih 1 item (buka detail panel), atau toggle kalau lagi mode multi.
  // Klik 2x (double click) -> tambah item kedua ke seleksi, jadi mode multi.

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

  // Bedakan single click vs double click pakai delay kecil,
  // karena browser mengirim 2 event click berturut-turut saat user double click.
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

  // ================= AKSI ITEM (add / edit / deactivate / print) =================

  function handlePrintQr() {
    if (selectedIds.length === 0) return;
    router.push(`/printQr?ids=${selectedIds.join(",")}`);
  }

  async function handleDeactivate(ids, reason) {
    try {
      await apiRequest(
        ENDPOINTS.DEACTIVATE_ASSETS,
        { method: "PATCH", body: JSON.stringify({ ids, reason }) },
        t("statusChangeFailed"),
      );
      await fetchItems();
      clearSelection();
    } catch (err) {
      console.error("Deactivate error:", err);
      throw err;
    }
  }

  async function handleAddItem(payload) {
    try {
      const body = {
        name: payload.name,
        code_item: payload.code_item,
        id_category: payload.id_category,
        status: payload.status,
        location: payload.location,
        description: payload.description,
        image_url: payload.image_url,
        specs: payload.specs,
      };

      await apiRequest(
        ENDPOINTS.ASSETS,
        { method: "POST", body: JSON.stringify(body) },
        t("addFailed"),
      );
      await fetchItems();
    } catch (err) {
      console.error("Add item error:", err);
      throw err;
    }
  }

  async function handleEditItem(id, payload) {
    try {
      await apiRequest(
        `${ENDPOINTS.ASSETS}/${id}`,
        { method: "PATCH", body: JSON.stringify(payload) },
        t("editFailed"),
      );
      await fetchItems();
      clearSelection();
    } catch (err) {
      console.error("Edit item error:", err);
      throw err;
    }
  }

  // ================= FILTER & DATA TURUNAN =================

  const selectedItem =
    mode === "single" ? items.find((item) => item.id === selectedIds[0]) : null;

  function matchesFilters(item) {
    const searchTerm = search.trim().toLowerCase();

    if (searchTerm) {
      const searchableText = [
        item.name,
        item.code_item,
        item.category,
        item.location,
        item.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(searchTerm)) {
        return false;
      }
    }

    const itemCategoryId = String(
      item.id_category ?? item.category_id ?? item.categoryId ?? "",
    );
    const itemStatus = String(item.status || "").toLowerCase();

    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(itemCategoryId)
    ) {
      return false;
    }

    if (filters.statuses.length > 0 && !filters.statuses.includes(itemStatus)) {
      return false;
    }

    const createdAt = item.created_at;
    if (!createdAt) {
      // item tanpa tanggal, tapi user sedang filter berdasarkan tanggal -> tidak cocok
      return !(filters.dateFrom || filters.dateTo);
    }

    const itemDate = new Date(createdAt);

    if (
      filters.dateFrom &&
      itemDate < new Date(`${filters.dateFrom}T00:00:00`)
    ) {
      return false;
    }

    if (
      filters.dateTo &&
      itemDate > new Date(`${filters.dateTo}T23:59:59.999`)
    ) {
      return false;
    }

    return true;
  }

  const filteredItems = items.filter(matchesFilters);

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.dateFrom ||
    filters.dateTo ||
    !(
      filters.statuses.length === 2 &&
      filters.statuses.includes("functional") &&
      filters.statuses.includes("needs_repair")
    );

  // ================= RENDER =================

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

          <div className="mb-5 flex items-center gap-2 flex-wrap">
            <FilterForm
              categories={categories}
              filters={filters}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder={t("searchPlaceholder")}
            />

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => handleClearFilters(createDefaultFilters())}
                className="assetra-filter-clear-inline"
              >
                {t("clearAll")}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xl:gap-4 pb-24">
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
