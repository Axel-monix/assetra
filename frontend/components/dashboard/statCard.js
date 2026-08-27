"use client";

export default function StatCard({
  icon,
  label,
  value,
  badgeText,
  badgeColor = "default",
}) {
  const badgeStyles = {
    default: "bg-[var(--color-border)] text-[var(--color-text-secondary)]",
    info: "bg-[var(--color-info)]/20 text-[var(--color-info)]",
    urgent: "bg-[var(--color-warning)]/20 text-[var(--color-warning)]",
    danger: "bg-[var(--color-danger-background)]/20 text-[var(--color-danger)]",
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 flex flex-col justify-between min-h-[110px]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-[var(--color-surface)] p-2 text-[var(--color-primary)] shrink-0">
            {icon}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] font-medium">
            {label}
          </p>
        </div>

        {badgeText && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium shrink-0 ${badgeStyles[badgeColor]}`}
          >
            {badgeText}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
          {value}
        </p>
      </div>
    </div>
  );
}