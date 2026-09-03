"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";
import { useTranslations } from "next-intl";

import DashboardLayout from "@/components/dashboard/dashboardLayout";
import CategoryFormModal from "@/components/category/categoryModal";
import CategoryDeleteModal from "@/components/category/delete";
import { ENDPOINTS, AUTH_TOKEN_KEY, AUTH_USER_KEY } from "@/lib/constants";

function getToken() {
  return (
    window.localStorage.getItem(AUTH_TOKEN_KEY) ||
    window.sessionStorage.getItem(AUTH_TOKEN_KEY)
  );
}

function getStoredUser() {
  try {
    const raw =
      window.localStorage.getItem(AUTH_USER_KEY) ||
      window.sessionStorage.getItem(AUTH_USER_KEY);

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function ManageCategoryPage() {
  const t = useTranslations("manageCategory");

  const [authUser, setAuthUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setAuthUser(getStoredUser());
  }, []);

  const [formTarget, setFormTarget] = useState(undefined); // undefined = closed, null = create, object = edit
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch(ENDPOINTS.CATEGORIES, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t("loadError"));
      }

      setCategories(result.data || []);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function fetchCategoryDetail(id) {
    const response = await fetch(ENDPOINTS.CATEGORY_BY_ID(id), {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || t("loadError"));
    }

    return result.data;
  }

  async function openEdit(category) {
    try {
      const detail = await fetchCategoryDetail(category.id);
      setFormTarget(detail);
    } catch (err) {
      setLoadError(err.message);
    }
  }

  async function handleCreate(payload) {
    const response = await fetch(ENDPOINTS.CATEGORIES, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || t("createFailed"));
    }

    await fetchCategories();
  }

  async function handleUpdate(payload) {
    const response = await fetch(ENDPOINTS.CATEGORY_BY_ID(formTarget.id), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || t("editFailed"));
    }

    // Kalau ada specification yang gagal dihapus karena masih dipakai
    // asset, backend mengembalikannya lewat retainedSpecifications.
    if (result.data?.retainedSpecifications?.length) {
      setLoadError(
        t("retainedSpecificationsWarning", {
          names: result.data.retainedSpecifications.join(", "),
        }),
      );
    }

    await fetchCategories();
  }

  async function handleDelete() {
    const response = await fetch(ENDPOINTS.CATEGORY_BY_ID(deleteTarget.id), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || t("deleteFailed"));
    }

    await fetchCategories();
  }

  return (
    <DashboardLayout
      role={authUser?.role || authUser?.role_name}
      userName={authUser?.name}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">
            {t("title")}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t("subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFormTarget(null)}
          className="assetra-btn assetra-btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          {t("addNewCategory")}
        </button>
      </div>

      {loadError && <div className="assetra-error-box mb-4">{loadError}</div>}

      {loading ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          {t("loading")}
        </p>
      ) : categories.length === 0 ? (
        <div className="assetra-card p-8 text-center text-sm text-[var(--color-text-muted)]">
          {t("empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="assetra-card p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-[var(--color-text)]">
                    {cat.category_name}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      {cat.description}
                    </p>
                  )}
                </div>

                <span className="assetra-icon-badge assetra-icon-badge--primary shrink-0">
                  <Layers size={16} />
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openEdit(cat)}
                  className="assetra-btn assetra-btn-secondary flex-1 flex items-center justify-center gap-1.5"
                >
                  <Pencil size={14} />
                  {t("edit")}
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(cat)}
                  aria-label={t("deleteCategory")}
                  className="assetra-btn assetra-btn-danger-soft !px-3"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formTarget !== undefined && (
        <CategoryFormModal
          category={formTarget}
          onClose={() => setFormTarget(undefined)}
          onSubmit={formTarget ? handleUpdate : handleCreate}
        />
      )}

      {deleteTarget && (
        <CategoryDeleteModal
          category={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </DashboardLayout>
  );
}