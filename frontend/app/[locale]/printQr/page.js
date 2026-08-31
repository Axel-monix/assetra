"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  ArrowLeft,
  Minus,
  Plus,
} from "lucide-react";

import DashboardLayout from "@/components/dashboard/dashboardLayout";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, ENDPOINTS } from "@/lib/constants";

const LAYOUT_OPTIONS = [
  { key: "2x2", cols: 2, rows: 2 },
  { key: "3x3", cols: 3, rows: 3 },
  { key: "3x4", cols: 3, rows: 4 },
  { key: "4x4", cols: 4, rows: 4 },
];

const LABEL_SIZE_OPTIONS = [
  { key: "small", widthMm: 50, heightMm: 25 },
  { key: "medium", widthMm: 64, heightMm: 34 },
  { key: "large", widthMm: 90, heightMm: 50 },
];

export default function PrintQrLabelsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("printQr");

  const ids = useMemo(() => {
    const raw = searchParams.get("ids");
    if (!raw) return [];
    return raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }, [searchParams]);

  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [paperSize, setPaperSize] = useState("a4");
  const [orientation, setOrientation] = useState("portrait");
  const [layoutKey, setLayoutKey] = useState("3x4");
  const [labelSizeKey, setLabelSizeKey] = useState("medium");
  const [content, setContent] = useState({
    qrCode: true,
    assetName: true,
    assetId: true,
    category: false,
    location: false,
  });
  const [previewPage, setPreviewPage] = useState(0);
  const [zoom, setZoom] = useState(100);

  const layout = LAYOUT_OPTIONS.find((l) => l.key === layoutKey);
  const labelSize = LABEL_SIZE_OPTIONS.find((s) => s.key === labelSizeKey);
  const perPage = layout.cols * layout.rows;
  const labelRatio = labelSize.widthMm / labelSize.heightMm;

  useEffect(() => {
    async function init() {
      const rawUser =
        window.localStorage.getItem(AUTH_USER_KEY) ||
        window.sessionStorage.getItem(AUTH_USER_KEY);

      if (!rawUser) {
        router.replace("/login");
        return;
      }

      try {
        setUser(JSON.parse(rawUser));
      } catch {
        router.replace("/login");
        return;
      }

      if (ids.length === 0) {
        setError(t("noItemsSelected"));
        setLoading(false);
        return;
      }

      const token =
        window.localStorage.getItem(AUTH_TOKEN_KEY) ||
        window.sessionStorage.getItem(AUTH_TOKEN_KEY);

      try {
        const response = await fetch(ENDPOINTS.ASSETS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || t("loadError"));
        }

        const idSet = new Set(ids);
        setItems(
          (result.data || []).filter((item) => idSet.has(String(item.id))),
        );
      } catch (err) {
        console.error("Load print items error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [ids, router, t]);

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const pageItems = items.slice(
    previewPage * perPage,
    previewPage * perPage + perPage,
  );

  const toggleContent = useCallback((key) => {
    setContent((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  function handlePrint() {
    const images = Array.from(document.querySelectorAll(".print-only img"));

    const waitForImages = Promise.all(
      images.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            }),
      ),
    );

    waitForImages.then(() => window.print());
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center text-[var(--color-text-secondary)] text-sm">
        {t("loading")}
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout role={user.role} userName={user.name || user.username}>
      <div className="no-print">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">
              {t("title")}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t("subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-text-secondary)]">
              {t("assetsSelected", { count: items.length })}
            </span>
            <button
              type="button"
              onClick={() => router.push("/manage-items")}
              className="assetra-btn assetra-btn-secondary flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> {t("backToManageItems")}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 mt-5">
          {/* PRINT SETTINGS PANEL */}
          <div className="assetra-card p-4 h-fit">
            <h3 className="text-sm font-bold text-[var(--color-text)] mb-4">
              {t("printSettings")}
            </h3>

            <div className="assetra-filter-section pt-0">
              <label className="assetra-form-label">{t("paperSize")}</label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value)}
                className="assetra-form-input"
              >
                <option value="a4">A4</option>
              </select>
            </div>

            <div className="assetra-filter-section">
              <label className="assetra-form-label">{t("orientation")}</label>
              <div className="flex gap-2">
                {["portrait", "landscape"].map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOrientation(o)}
                    className={`assetra-btn flex-1 ${
                      orientation === o
                        ? "assetra-btn-primary"
                        : "assetra-btn-secondary"
                    }`}
                  >
                    {t(o)}
                  </button>
                ))}
              </div>
            </div>

            <div className="assetra-filter-section">
              <label className="assetra-form-label">{t("labelsPerPage")}</label>
              <div className="grid grid-cols-4 gap-2">
                {LAYOUT_OPTIONS.map((l) => (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => {
                      setLayoutKey(l.key);
                      setPreviewPage(0);
                    }}
                    className={`assetra-filter-option justify-center border ${
                      layoutKey === l.key
                        ? "border-[var(--color-primary)] text-[var(--color-primary-soft)]"
                        : "border-[var(--color-border)]"
                    }`}
                  >
                    {l.key}
                  </button>
                ))}
              </div>
              <p className="assetra-text-muted text-xs mt-2">
                {t("labelsPerPageHint", { count: perPage })}
              </p>
            </div>

            <div className="assetra-filter-section">
              <label className="assetra-form-label">{t("labelSize")}</label>
              <select
                value={labelSizeKey}
                onChange={(e) => setLabelSizeKey(e.target.value)}
                className="assetra-form-input"
              >
                {LABEL_SIZE_OPTIONS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {t(`labelSize_${s.key}`, {
                      w: s.widthMm,
                      h: s.heightMm,
                    })}
                  </option>
                ))}
              </select>
            </div>

            <div className="assetra-filter-section border-b-0">
              <label className="assetra-form-label">{t("labelContent")}</label>
              <div className="assetra-filter-options">
                {Object.keys(content).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleContent(key)}
                    className={`assetra-filter-option ${
                      content[key] ? "is-selected" : ""
                    }`}
                  >
                    <span className="assetra-filter-checkbox">
                      {content[key] ? "✓" : ""}
                    </span>
                    {t(`content_${key}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PRINT PREVIEW PANEL */}
          <div className="assetra-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--color-text)]">
                {t("printPreview")}
              </h3>
              <span className="assetra-text-muted text-xs">
                {t("previewMeta", {
                  labels: items.length,
                  pages: totalPages,
                  paper: paperSize.toUpperCase(),
                  orientation: t(orientation),
                  layout: layoutKey,
                })}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(50, z - 10))}
                  className="assetra-btn-secondary assetra-btn px-2"
                >
                  <Minus size={14} />
                </button>
                <span className="text-xs w-10 text-center">{zoom}%</span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(150, z + 10))}
                  className="assetra-btn-secondary assetra-btn px-2"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div
              className="assetra-print-page-preview mx-auto"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
              data-orientation={orientation}
            >
              <div
                className="assetra-print-grid"
                style={{
                  gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
                  "--label-ratio": labelRatio,
                }}
              >
                {Array.from({ length: perPage }).map((_, i) => {
                  const item = pageItems[i];
                  return (
                    <div key={i} className="assetra-print-label">
                      {item ? (
                        <PrintLabelContent item={item} content={content} />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                type="button"
                disabled={previewPage === 0}
                onClick={() => setPreviewPage((p) => p - 1)}
                className="assetra-icon-badge assetra-btn-secondary disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {t("pageOf", { current: previewPage + 1, total: totalPages })}
              </span>
              <button
                type="button"
                disabled={previewPage >= totalPages - 1}
                onClick={() => setPreviewPage((p) => p + 1)}
                className="assetra-icon-badge assetra-btn-secondary disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="no-print fixed bottom-0 left-0 right-0 flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-card)] px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-[var(--color-text)]">
          <Printer size={16} />
          {t("labelsReady", { count: items.length })}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/manage-items")}
            className="assetra-btn assetra-btn-secondary"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={items.length === 0}
            className="assetra-btn assetra-btn-primary flex items-center gap-1.5"
          >
            <Printer size={14} />
            {t("printLabels", { count: items.length })}
          </button>
        </div>
      </div>

      {/* PRINT-ONLY AREA: renders ALL items (not just current preview page) */}
      <div
        className="print-only"
        data-orientation={orientation}
        style={{
          "--label-w": `${labelSize.widthMm}mm`,
          "--label-h": `${labelSize.heightMm}mm`,
        }}
      >
        {Array.from({ length: totalPages }).map((_, pageIndex) => (
          <div
            key={pageIndex}
            className="assetra-print-page"
            style={{
              gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
              "--label-ratio": labelRatio,
            }}
          >
            {items
              .slice(pageIndex * perPage, pageIndex * perPage + perPage)
              .map((item) => (
                <div key={item.id} className="assetra-print-label">
                  <PrintLabelContent item={item} content={content} />
                </div>
              ))}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

function PrintLabelContent({ item, content }) {
  const metaParts = [
    content.assetId ? item.id : null,
    content.category && item.category ? item.category : null,
    content.location && item.location ? item.location : null,
  ].filter(Boolean);

  return (
    <div className="assetra-print-label-inner">
      {content.qrCode && item.qrCodeUrl && (
        <img
          src={item.qrCodeUrl}
          alt={item.name}
          className="assetra-print-qr"
        />
      )}
      {content.assetName && (
        <div className="assetra-print-name">{item.name}</div>
      )}
      {metaParts.length > 0 && (
        <div className="assetra-print-meta">
          {metaParts.map((part, index) => (
            <span key={index}>
              {index > 0 && (
                <span className="assetra-print-meta-separator">|</span>
              )}
              {part}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
