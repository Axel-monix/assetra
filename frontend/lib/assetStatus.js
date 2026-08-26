export const ASSET_STATUS = {
  FUNCTIONAL: "functional",
  OPERATING: "operating",
  NEEDS_REPAIR: "needs_repair",
  REPAIRING: "repairing",
  BROKEN: "broken",
  BORROWED: "borrowed",
  UNAVAILABLE: "unavailable",
};

// Map warna badge berdasarkan string status dari database
export const ASSET_STATUS_STYLES = {
  // Tersedia / Berfungsi (Hijau)
  functional: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  operating: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",

  // Perlu Perbaikan / Maintenance (Kuning/Oranye)
  needs_repair: "bg-[var(--color-warning)]/15 text-[var(--color-warning)] border border-[var(--color-warning)]/20",
  needsRepair: "bg-[var(--color-warning)]/15 text-[var(--color-warning)] border border-[var(--color-warning)]/20",
  repairing: "bg-amber-500/15 text-amber-400 border border-amber-500/20",

  // Rusak (Merah)
  broken: "bg-[var(--color-danger-background)]/15 text-[var(--color-danger)] border border-[var(--color-danger-background)]/20",

  // Dipinjam (Biru)
  borrowed: "bg-blue-500/15 text-blue-400 border border-blue-400/20",

  // Tidak Tersedia (Abu-abu/Rose)
  unavailable: "bg-rose-500/15 text-rose-400 border border-rose-500/20",
};

// Map translation key ke dashboard.status
export const ASSET_STATUS_LABELS = {
  functional: "status.functional",
  operating: "status.operating",
  needs_repair: "status.needs_repair",
  needsRepair: "status.needsRepair",
  repairing: "status.repairing",
  broken: "status.broken",
  borrowed: "status.borrowed",
  unavailable: "status.unavailable",
};