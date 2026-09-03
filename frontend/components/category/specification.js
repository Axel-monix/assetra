"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

const SPEC_TYPES = ["text", "number", "date", "boolean"];
function emptyRow() {
  return {
    id: null,
    name: "",
    type: "text",
    required: false,
    repairable: false,
  };
}
export default function SpecificationBuilder({ rows, onChange, disabled }) {
  const t = useTranslations("manageCategory");

  function updateRow(index, patch) {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  }

  function addRow() {
    onChange([...rows, emptyRow()]);
  }

  function removeRow(index) {
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="assetra-form-label mb-0">
          {t("specifications")}
        </label>

        <button
          type="button"
          onClick={addRow}
          disabled={disabled}
          className="assetra-btn assetra-btn-secondary flex items-center gap-1.5 !min-h-0 !py-1.5 !px-2.5 text-xs"
        >
          <Plus size={14} />
          {t("addDetail")}
        </button>
      </div>

      <div className="rounded-lg border border-[var(--assetra-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--assetra-surface)] text-[var(--assetra-text-secondary)]">
              <th className="text-left font-semibold px-3 py-2 text-xs">
                {t("detailBarang")}
              </th>
              <th className="text-left font-semibold px-3 py-2 text-xs w-28">
                {t("type")}
              </th>
              <th className="text-center font-semibold px-3 py-2 text-xs w-20">
                {t("required")}
              </th>
              <th className="text-center font-semibold px-3 py-2 text-xs w-24">
                {t("repairable")}
              </th>
              <th className="w-10" />
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-center text-xs text-[var(--assetra-text-muted)]"
                >
                  {t("noSpecifications")}
                </td>
              </tr>
            )}

            {rows.map((row, index) => (
              <tr
                key={row.id ?? `new-${index}`}
                className="border-t border-[var(--assetra-divider)]"
              >
                <td className="px-3 py-2">
                  <input
                    value={row.name}
                    onChange={(e) => updateRow(index, { name: e.target.value })}
                    placeholder={t("detailBarangPlaceholder")}
                    disabled={disabled}
                    className="assetra-form-input !py-1.5"
                  />
                </td>

                <td className="px-3 py-2">
                  <select
                    value={row.type}
                    onChange={(e) => updateRow(index, { type: e.target.value })}
                    disabled={disabled}
                    className="assetra-form-input !py-1.5"
                  >
                    {SPEC_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {t(`specType.${type}`)}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={row.required}
                    onChange={(e) =>
                      updateRow(index, { required: e.target.checked })
                    }
                    disabled={disabled}
                    className="h-4 w-4 accent-[var(--assetra-primary)]"
                  />
                </td>

                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={row.repairable}
                    onChange={(e) =>
                      updateRow(index, { repairable: e.target.checked })
                    }
                    disabled={disabled}
                    className="h-4 w-4 accent-[var(--assetra-primary)]"
                  />
                </td>

                <td className="px-2 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    disabled={disabled}
                    aria-label={t("removeRow")}
                    className="text-[var(--assetra-text-muted)] hover:text-[var(--assetra-danger)] transition disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { emptyRow };