"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboardLayout";
import ItemCard from "@/components/items/itemCard";
import ItemDetailPanel from "@/components/items/itemDetailPanel";
import BulkActionBar from "@/components/items/bulkActionBar";
import { LayoutGrid, List, Plus, X } from "lucide-react";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, ENDPOINTS } from "@/lib/constants";

// ============================================================
// LOGIC SELECTION ITEM (ini bagian intinya):
//
// - Klik SATU item (saat belum ada yang ke-select / mode "none")
//     -> masuk mode "single", panel detail item itu muncul.
// - Klik item LAIN saat mode "single"
//     -> detail panel GANTI ke item yang baru diklik (tetap mode "single").
// - DOUBLE klik item LAIN saat mode "single"
//     -> masuk mode "multi": kedua item (yang lama + yang di-double-click)
//        jadi ke-select bareng, panel detail HILANG total, cuma bottom bar
//        (print QR / nonaktifkan) yang aktif.
// - Klik item (toggle in/out) saat mode "multi" -> tetap di mode multi.
//
// Catatan teknis: browser selalu fire "click" DULU sebelum "dblclick" /
// event.detail === 2. Kalau logic single-click langsung dijalankan saat
// event.detail === 1, maka pas detik terjadinya double-click, state udah
// keburu ke-replace duluan oleh click pertama -> perbandingan "item lama
// vs baru" jadi rusak. Makanya single-click SENGAJA ditunda pakai
// setTimeout, dan dibatalkan kalau ternyata click kedua datang (jadi
// double-click). Dengan begitu pas handleDoubleSelect jalan, state masih
// murni kondisi SEBELUM sequence klik ini dimulai.
// ============================================================

const DOUBLE_CLICK_DELAY_MS = 220;

export default function ManageItemsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [mode, setMode] = useState("none"); // "none" | "single" | "multi"
  const [viewMode, setViewMode] = useState("grid");
  const [activeFilters, setActiveFilters] = useState([]);

  const clickTimerRef = useRef(null);

  useEffect(() => {
    async function loadItems() {
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

      try {
        const token =
          window.localStorage.getItem(AUTH_TOKEN_KEY) ||
          window.sessionStorage.getItem(AUTH_TOKEN_KEY);
        const response = await fetch(ENDPOINTS.ASSETS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Gagal mengambil data asset.");
        }

        setItems(result.data || []);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    }

    loadItems();
  }, [router]);

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

  function handlePrintQr() {
    // TODO: POST /api/assets/print-qr { ids: selectedIds }
    console.log("Print QR untuk:", selectedIds);
  }

  function handleDeactivate(ids) {
    // TODO: PATCH /api/assets/deactivate { ids }
    console.log("Nonaktifkan:", ids);
    clearSelection();
  }

  const selectedItem =
    mode === "single" ? items.find((i) => i.id === selectedIds[0]) : null;

  const filteredItems = items.filter((item) => {
    if (activeFilters.length === 0) return true;
    return activeFilters.some((f) => f === item.category || f === item.status);
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-[#A1A1AA] text-sm">
        Memuat...
      </div>
    );
  }

  return (
    <DashboardLayout role={user.role} userName={user.name || user.username}>
      <div className="flex h-full">
        <div className="flex-1 min-w-0">
          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
          {loading && (
            <p className="mb-4 text-sm text-[#A1A1AA]">Memuat asset...</p>
          )}
          {/* Filter bar */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[#71717A] uppercase tracking-wide mr-1">
                Filters:
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
                  Hapus Semua
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

          {/* Grid item */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                selected={selectedIds.includes(item.id)}
                onClick={handleCardClick}
              />
            ))}

            {/* Tombol tambah item, ditaruh di grid biar konsisten sama desain */}
            <button
              type="button"
              className="rounded-xl border border-dashed border-[#272D3D] flex flex-col items-center justify-center gap-2 text-[#71717A] hover:border-[#8083FF] hover:text-[#8083FF] min-h-[168px]"
            >
              <Plus size={22} strokeWidth={1.9} />
              <span className="text-xs">Tambah Item</span>
            </button>
          </div>
        </div>

        {/* Detail panel - cuma muncul di mode single */}
        {selectedItem && (
          <ItemDetailPanel
            item={selectedItem}
            onClose={clearSelection}
            onEdit={
              (item) => console.log("Edit:", item.id) /* TODO: buka form edit */
            }
            onDelete={handleDeactivate}
          />
        )}
      </div>

      {/* Floating add button (mobile-friendly, sesuai desain) */}
      <button
        type="button"
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
    </DashboardLayout>
  );
}
