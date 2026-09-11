export function getSpecTemplate(category) {
  return category?.specifications || [];
}
export function buildSpecsPayload(template, values) {
  return template
    .map((field) => {
      const raw = values[field.id];

      let value;

      if (field.type === "boolean") {
        value = raw ? "true" : "false";
      } else {
        value = String(raw ?? "").trim();
      }

      return { id_specification: field.id, value };
    })
    .filter((entry) => entry.value !== "");
}
export function validateSpecValues(template, values) {
  for (const field of template) {
    if (!field.required) continue;

    const raw = values[field.id];
    const isEmpty =
      field.type === "boolean" ? raw === undefined : !String(raw ?? "").trim();

    if (isEmpty) {
      return field.name;
    }
  }

  return null;
}

const STATUS_ALIASES = {
  functional: "functional",
  needs_repair: "needs_repair",
  unavailable: "unavailable",
};

export function normalizeStatus(raw) {
  if (!raw) return "functional";
  const key = String(raw).trim().toLowerCase();
  return STATUS_ALIASES[key] || "functional";
}
