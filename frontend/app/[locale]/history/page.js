"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

import DashboardLayout from "@/components/dashboard/dashboardLayout";
import HistoryFilterBar from "@/components/history/historyFilterBar";
import HistoryItem from "@/components/history/historyItem";
import ExportModal from "@/components/history/exportModal";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, ENDPOINTS } from "@/lib/constants";
import { groupHistoryByDate } from "@/lib/historyHelper";

export default function HistoryPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("history");
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [entries, setEntries] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);

  function getToken() {
    return (
      window.localStorage.getItem(AUTH_TOKEN_KEY) ||
      window.sessionStorage.getItem(AUTH_TOKEN_KEY)
    );
  }

  const fetchHistory = useCallback(
    async ({ append = false, cursorOverride = null } = {}) => {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      append ? setLoadingMore(true) : setLoading(true);

      try {
        const params = new URLSearchParams();
        if (activeTab !== "all") params.set("type", activeTab);
        if (search.trim()) params.set("search", search.trim());
        if (cursorOverride) params.set("cursor", cursorOverride);

        const response = await fetch(`${ENDPOINTS.HISTORY}?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || t("loadError"));
        }

        setEntries((prev) =>
          append ? [...prev, ...result.data] : result.data,
        );
        setCursor(result.meta?.nextCursor ?? null);
        setHasMore(Boolean(result.meta?.hasMore));
      } catch (err) {
        console.error("Fetch history error:", err);
        setError(err.message);
      } finally {
        append ? setLoadingMore(false) : setLoading(false);
      }
    },
    [activeTab, search, router, t],
  );

  useEffect(() => {
    const raw =
      window.localStorage.getItem(AUTH_USER_KEY) ||
      window.sessionStorage.getItem(AUTH_USER_KEY);

    if (!raw) {
      router.replace("/login");
      return;
    }

    try {
      setUser(JSON.parse(raw));
    } catch {
      router.replace("/login");
      return;
    }

    setIsInitialized(true);
  }, [router]);

  useEffect(() => {
    if (!isInitialized) return;
    const delay = setTimeout(() => fetchHistory(), 300);
    return () => clearTimeout(delay);
  }, [isInitialized, activeTab, search]);

  const groups = groupHistoryByDate(entries, locale);
  const handleExportSuccess = useCallback(() => {
    console.log("Export berhasil");
  }, []);

  if (!isInitialized || (loading && entries.length === 0 && !error)) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center text-[var(--color-text-secondary)] text-sm">
        {t("loading")}
      </div>
    );
  }

  return (
    <DashboardLayout role={user?.role} userName={user?.name || user?.username}>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[var(--color-text)]">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {t("subtitle")}
        </p>
      </div>

      <HistoryFilterBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        search={search}
        onSearchChange={setSearch}
        onExport={() => setShowExportModal(true)} 
      />

      {error && (
        <p className="mb-4 text-sm text-[var(--color-danger)]">{error}</p>
      )}

      {!loading && groups.length === 0 && !error && (
        <p className="assetra-history-empty">{t("empty")}</p>
      )}

      <div>
        {groups.map((group) => (
          <div key={group.key} className="mb-2">
            <div className="mb-3 flex items-baseline gap-2">
              <span className="assetra-history-group-label">{group.label}</span>
              <span className="assetra-history-group-date">
                {group.dateDisplay}
              </span>
            </div>
            {group.items.map((entry, i) => (
              <HistoryItem
                key={entry.id}
                entry={entry}
                isLast={i === group.items.length - 1}
              />
            ))}
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pb-8">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() =>
              fetchHistory({ append: true, cursorOverride: cursor })
            }
            className="assetra-btn assetra-btn-secondary"
          >
            {loadingMore ? t("loading") : t("loadPrevious")}
          </button>
        </div>
      )}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        activeTab={activeTab}
        search={search}
        entries={entries}
        onExportSuccess={handleExportSuccess}
      />
    </DashboardLayout>
  );
}