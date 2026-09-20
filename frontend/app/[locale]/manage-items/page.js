"use client";

import { useState, useEffect, useCallback } from "react";

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
import { Plus } from "lucide-react";
import FilterForm, {
  createDefaultFilters,
} from "@/components/items/itemFilterForm";

import { AUTH_TOKEN_KEY, AUTH_USER_KEY, ENDPOINTS } from "@/lib/constants";
import LoadingScreen from "../../../components/common/loadingScreen";
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

  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [filters, setFilters] = useState(createDefaultFilters());
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

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

  const isSelectionMode = selectedIds.length > 0;

  function handleHoldSelect(id) {
    setSelectedItemId(null);
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }

  function handleCardClick(id) {
    if (selectedIds.length > 0) {
      setSelectedIds((prev) => {
        if (prev.includes(id)) {
          return prev.filter((x) => x !== id);
        }
        return [...prev, id];
      });
      return;
    }

    if (selectedItemId === id) {
      clearSelection();
    } else {
      setSelectedItemId(id);
    }
  }

  function handleSelectAll() {
    const allFilteredIds = filteredItems.map((item) => item.id);
    setSelectedItemId(null);
    setSelectedIds(allFilteredIds);
  }

  function handleDeselectAll() {
    setSelectedIds([]);
  }

  function clearSelection() {
    setSelectedIds([]);
    setSelectedItemId(null);
  }

  function handleApplyFilters(nextFilters) {
    setFilters(nextFilters);
    clearSelection();
  }

  function handleClearFilters(nextFilters) {
    setFilters(nextFilters);
    clearSelection();
  }

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

  const selectedItem = items.find((item) => item.id === selectedItemId) || null;

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

    const createdAt = item.createdAt ?? item.created_at;
    if (!createdAt) {
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

  const isUnavailable = (item) =>
    String(item.status || "").toLowerCase() === "unavailable";

  const filteredItems = items
    .filter(matchesFilters)
    .sort((a, b) => Number(isUnavailable(a)) - Number(isUnavailable(b)));

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.statuses.length > 0 ||
    filters.dateFrom ||
    filters.dateTo;

  if (!isInitialized || loading) {
    return <LoadingScreen instant />;
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
      <div
        className={`assetra-items-layout h-full ${selectedItem ? "has-detail-panel" : ""}`}
      >
        <div className="assetra-items-content min-w-0 min-h-[640px]">
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

            {isSelectionMode && (
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-xs shadow-sm">
                <span className="font-semibold text-[var(--color-primary)]">
                  {selectedIds.length} / {filteredItems.length}
                </span>
                <button
                  type="button"
                  onClick={
                    selectedIds.length >= filteredItems.length
                      ? handleDeselectAll
                      : handleSelectAll
                  }
                  className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition"
                >
                  {selectedIds.length >= filteredItems.length
                    ? t("deselectAll", { defaultValue: "Deselect All" })
                    : t("selectAll", { defaultValue: "Select All" })}
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="ml-1 text-[var(--color-text-muted)] hover:text-[var(--color-white)] transition"
                >
                  {t("clear", { defaultValue: "Clear" })}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xl:gap-4 pb-24">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const selectedOrder = isSelected
                ? selectedIds.indexOf(item.id) + 1
                : null;
              const isPanelActive = selectedItemId === item.id;

              return (
                <ItemCard
                  key={item.id}
                  item={item}
                  selected={isSelected || isPanelActive}
                  selectedOrder={selectedOrder}
                  isSelectionMode={isSelectionMode}
                  onClick={handleCardClick}
                  onHoldSelect={handleHoldSelect}
                />
              );
            })}

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
        totalCount={filteredItems.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
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
