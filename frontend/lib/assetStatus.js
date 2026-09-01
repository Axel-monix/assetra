export const ASSET_STATUS = {
  FUNCTIONAL: "functional",
  NEEDS_REPAIR: "needs_repair",
  UNAVAILABLE: "unavailable",
};

export const ASSET_STATUS_STYLES = {
  functional:
    "assetra-status-success bg-[var(--assetra-info)]/10 border border-[var(--assetra-info)]/20",
  needs_repair:
    "assetra-status-warning bg-[var(--assetra-warning)]/10 border border-[var(--assetra-warning)]/20",

  unavailable:
    "assetra-status-muted bg-[var(--assetra-text-muted)]/10 border border-[var(--assetra-text-muted)]/20",
};

export const ASSET_STATUS_LABELS = {
  functional: "statusOptions.functional",
  needs_repair: "statusOptions.needs_repair",
  unavailable: "statusOptions.unavailable",
};

export const ASSET_STATUS_OPTIONS = [
  ASSET_STATUS.FUNCTIONAL,
  ASSET_STATUS.NEEDS_REPAIR,
  ASSET_STATUS.UNAVAILABLE,
];

export function getAssetStatusStyle(status) {
  return ASSET_STATUS_STYLES[status] || "assetra-status-muted";
}

export function getAssetStatusLabelKey(status) {
  return ASSET_STATUS_LABELS[status] || null;
}
