"use client";

import {
  useState,
  useEffect,
} from "react";

import {
  useLocale,
  useTranslations,
} from "next-intl";

import {
  X,
  CheckCircle,
  FileText,
  FileSpreadsheet,
  Download,
  Loader2,
} from "lucide-react";

import {
  AUTH_TOKEN_KEY,
  ENDPOINTS,
} from "@/lib/constants";

export default function ExportModal({
  isOpen,
  onClose,
  types = [],
  search,
  entries,
  dateFrom = "",
  dateTo = "",
  onExportSuccess,
}) {
  const t =
    useTranslations("history");

  const locale = useLocale();

  const [format, setFormat] =
    useState("pdf");

  const [status, setStatus] =
    useState("idle");

  const [errorMsg, setErrorMsg] =
    useState("");

  const [fileUrl, setFileUrl] =
    useState("");

  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setErrorMsg("");
      setFileUrl("");
    }
  }, [isOpen]);

  const getDateRange = () => {
    if (
      dateFrom ||
      dateTo
    ) {
      const formatDate = (
        value,
      ) => {
        if (!value) return "—";

        return new Date(
          `${value}T00:00:00`,
        ).toLocaleDateString(
          locale === "id"
            ? "id-ID"
            : "en-US",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          },
        );
      };

      return `${formatDate(
        dateFrom,
      )} – ${formatDate(
        dateTo,
      )}`;
    }

    if (
      !entries ||
      entries.length === 0
    ) {
      return "—";
    }

    const dates = entries.map(
      (entry) =>
        new Date(
          entry.created_at,
        ).getTime(),
    );

    const min = new Date(
      Math.min(...dates),
    );

    const max = new Date(
      Math.max(...dates),
    );

    const formatDate = (
      date,
    ) =>
      date.toLocaleDateString(
        locale === "id"
          ? "id-ID"
          : "en-US",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        },
      );

    return `${formatDate(
      min,
    )} – ${formatDate(max)}`;
  };

  const getActivityLabel = () => {
    if (
      !types ||
      types.length === 0
    ) {
      return t(
        "allActivities",
      );
    }

    return types
      .map((type) =>
        t(`tabs.${type}`),
      )
      .join(", ");
  };

  const getToken = () =>
    window.localStorage.getItem(
      AUTH_TOKEN_KEY,
    ) ||
    window.sessionStorage.getItem(
      AUTH_TOKEN_KEY,
    );

  const handleDownload = async () => {
    const token = getToken();

    if (!token) {
      setStatus("error");
      setErrorMsg(
        t("export.authError"),
      );
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const params =
        new URLSearchParams();

      params.set(
        "format",
        format,
      );

      if (
        types &&
        types.length > 0
      ) {
        params.set(
          "types",
          types.join(","),
        );
      }

      if (search.trim()) {
        params.set(
          "search",
          search.trim(),
        );
      }

      if (dateFrom) {
        params.set(
          "dateFrom",
          dateFrom,
        );
      }

      if (dateTo) {
        params.set(
          "dateTo",
          dateTo,
        );
      }

      params.set(
        "locale",
        locale,
      );

      const response =
        await fetch(
          `${ENDPOINTS.EXPORT_HISTORY}?${params}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      if (!response.ok) {
        const text =
          await response.text();

        if (
          response.status === 408 ||
          response.status === 504
        ) {
          throw new Error(
            t(
              "export.timeoutError",
            ),
          );
        }

        throw new Error(
          text ||
            t(
              "export.exportError",
            ),
        );
      }

      const blob =
        await response.blob();

      const url =
        URL.createObjectURL(
          blob,
        );

      setFileUrl(url);
      setStatus("success");

      onExportSuccess?.();

      const link =
        document.createElement(
          "a",
        );

      link.href = url;

      const extension =
        format === "pdf"
          ? "pdf"
          : "xlsx";

      link.download =
        `history-export.${extension}`;

      document.body.appendChild(
        link,
      );

      link.click();

      document.body.removeChild(
        link,
      );

      setTimeout(() => {
        URL.revokeObjectURL(
          url,
        );
      }, 60000);
    } catch (err) {
      console.error(
        "Export error:",
        err,
      );

      setStatus("error");
      setErrorMsg(
        err.message ||
          t(
            "export.exportError",
          ),
      );
    }
  };

  const FormatCard = ({
    value,
    label,
    icon: Icon,
    description,
  }) => (
    <button
      type="button"
      onClick={() =>
        setFormat(value)
      }
      className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
        format === value
          ? "border-[var(--assetra-primary)] bg-[var(--assetra-primary)]/5 shadow-sm"
          : "border-[var(--assetra-border)] hover:border-[var(--assetra-primary)] hover:bg-[var(--assetra-surface)]"
      }`}
    >
      <div
        className={`mt-0.5 rounded-lg p-2 ${
          format === value
            ? "bg-[var(--assetra-primary)] text-[var(--assetra-primary-contrast)]"
            : "bg-[var(--assetra-surface)] text-[var(--assetra-text-secondary)]"
        }`}
      >
        <Icon size={20} />
      </div>

      <div>
        <div className="font-medium text-[var(--assetra-text)]">
          {label}
        </div>

        <div className="text-sm text-[var(--assetra-text-secondary)]">
          {description}
        </div>
      </div>
    </button>
  );

  const renderSuccess =
    () => (
      <div className="flex flex-col items-center py-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--assetra-primary)]/10 text-[var(--assetra-primary)]">
          <CheckCircle
            size={40}
            strokeWidth={1.5}
          />
        </div>

        <h3 className="text-xl font-semibold text-[var(--assetra-text)]">
          {t(
            "export.successTitle",
          )}
        </h3>

        <p className="mt-1 text-sm text-[var(--assetra-text-secondary)]">
          {t(
            "export.successMessage",
          )}
        </p>

        <div className="mt-3 rounded-lg bg-[var(--assetra-surface)] px-4 py-2 text-sm text-[var(--assetra-text-secondary)]">
          {t(
            "export.fileLabel",
          )}{" "}
          {entries.length}{" "}
          {t("export.records")}{" "}
          —{" "}
          {format.toUpperCase()}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={fileUrl}
            download={`history-export.${
              format === "pdf"
                ? "pdf"
                : "xlsx"
            }`}
            className="assetra-btn assetra-btn-primary flex items-center gap-2"
          >
            <Download size={16} />

            {format === "pdf"
              ? t(
                  "export.viewPdf",
                )
              : t(
                  "export.download",
                )}
          </a>

          <button
            type="button"
            onClick={onClose}
            className="assetra-btn assetra-btn-secondary"
          >
            {t(
              "export.backToHistory",
            )}
          </button>
        </div>
      </div>
    );

  const renderError =
    () => (
      <div className="flex flex-col items-center py-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--assetra-danger)]/10 text-[var(--assetra-danger)]">
          <X
            size={40}
            strokeWidth={1.5}
          />
        </div>

        <h3 className="text-xl font-semibold text-[var(--assetra-danger)]">
          {t(
            "export.errorTitle",
          )}
        </h3>

        <p className="mt-1 text-sm text-[var(--assetra-danger)]">
          {errorMsg}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={
              handleDownload
            }
            className="assetra-btn assetra-btn-primary"
          >
            {t(
              "export.tryAgain",
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="assetra-btn assetra-btn-secondary"
          >
            {t("export.cancel")}
          </button>
        </div>
      </div>
    );

  const renderLoading =
    () => (
      <div className="flex flex-col items-center py-8 text-center">
        <Loader2
          size={40}
          className="animate-spin text-[var(--assetra-primary)]"
        />

        <p className="mt-4 text-sm text-[var(--assetra-text-secondary)]">
          {t(
            "export.generating",
          )}
        </p>
      </div>
    );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--assetra-border)] bg-[var(--assetra-card)] p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-[var(--assetra-text)]">
              <Download
                size={20}
                className="text-[var(--assetra-primary)]"
              />

              {t(
                "export.title",
              )}
            </h2>

            <p className="mt-0.5 text-sm text-[var(--assetra-text-secondary)]">
              {t(
                "export.subtitle",
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--assetra-text-muted)] hover:bg-[var(--assetra-surface)] hover:text-[var(--assetra-text)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {status === "idle" && (
          <>
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-[var(--assetra-text-secondary)]">
                {t(
                  "export.selectFormat",
                )}
              </label>

              <div className="grid grid-cols-2 gap-3">
                <FormatCard
                  value="pdf"
                  label={t(
                    "export.pdfLabel",
                  )}
                  icon={FileText}
                  description={t(
                    "export.pdfDesc",
                  )}
                />

                <FormatCard
                  value="excel"
                  label={t(
                    "export.excelLabel",
                  )}
                  icon={
                    FileSpreadsheet
                  }
                  description={t(
                    "export.excelDesc",
                  )}
                />
              </div>
            </div>

            <div className="mb-6 rounded-xl bg-[var(--assetra-surface)] p-4">
              <div className="mb-2 text-sm font-medium text-[var(--assetra-text-secondary)]">
                {t(
                  "export.filterSummary",
                )}
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--assetra-text-secondary)]">
                    {t(
                      "export.activity",
                    )}
                  </span>

                  <span className="font-medium text-right text-[var(--assetra-text)]">
                    {getActivityLabel()}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[var(--assetra-text-secondary)]">
                    {t(
                      "export.dateRange",
                    )}
                  </span>

                  <span className="font-medium text-right text-[var(--assetra-text)]">
                    {getDateRange()}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[var(--assetra-text-secondary)]">
                    {t(
                      "export.records",
                    )}
                  </span>

                  <span className="font-medium text-right text-[var(--assetra-text)]">
                    {entries.length}{" "}
                    {t(
                      "export.activities",
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="assetra-btn assetra-btn-secondary"
              >
                {t(
                  "export.cancel",
                )}
              </button>

              <button
                type="button"
                onClick={
                  handleDownload
                }
                className="assetra-btn assetra-btn-primary flex items-center gap-2"
              >
                <Download size={16} />

                {t(
                  "export.download",
                )}
              </button>
            </div>
          </>
        )}

        {status ===
          "loading" &&
          renderLoading()}

        {status ===
          "success" &&
          renderSuccess()}

        {status ===
          "error" &&
          renderError()}
      </div>
    </div>
  );
}