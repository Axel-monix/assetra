export const SPEC_TEMPLATES = {
  komputer: [
    { key: "brand", label: "Merek" },
    { key: "processor", label: "Processor / CPU" },
    { key: "ram", label: "RAM" },
    { key: "storage", label: "Storage" },
  ],
  laptop: [
    { key: "brand", label: "Merek" },
    { key: "processor", label: "Processor / CPU" },
    { key: "ram", label: "RAM" },
    { key: "storage", label: "Storage" },
  ],
  layar: [
    { key: "brand", label: "Merek" },
    { key: "screen_size", label: "Ukuran Layar" },
  ],
  monitor: [
    { key: "brand", label: "Merek" },
    { key: "screen_size", label: "Ukuran Layar" },
  ],
  elektronik: [{ key: "brand", label: "Merek" }],
  furniture: [{ key: "brand", label: "Merek / Material" }],
};

export const DEFAULT_SPEC_TEMPLATE = [{ key: "brand", label: "Merek" }];

export function getSpecTemplate(categoryName) {
  if (!categoryName) return DEFAULT_SPEC_TEMPLATE;
  const normalized = String(categoryName).toLowerCase();
  const matchedKey = Object.keys(SPEC_TEMPLATES).find((key) =>
    normalized.includes(key),
  );
  return matchedKey ? SPEC_TEMPLATES[matchedKey] : DEFAULT_SPEC_TEMPLATE;
}

export function buildSpecsPayload(template, values) {
  const specs = {};
  template.forEach(({ key }) => {
    const value = (values[key] || "").trim();
    if (value) specs[key] = value;
  });
  return specs;
}

const STATUS_ALIASES = {
  functional: "functional",
  tersedia: "functional",
  needs_repair: "needs_repair",
  maintenance: "needs_repair",
  perbaikan: "needs_repair",
  borrowed: "borrowed",
  dipinjam: "borrowed",
  unavailable: "unavailable",
  "tidak tersedia": "unavailable",
  rusak: "unavailable",
};

export function normalizeStatus(raw) {
  if (!raw) return "functional";
  const key = String(raw).trim().toLowerCase();
  return STATUS_ALIASES[key] || "functional";
}