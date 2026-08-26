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
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[var(--color-surface)] p-2.5 text-[var(--color-primary)]">
            {icon}
          </div>

          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {label}
            </p>

            <p className="text-2xl font-semibold">{value}</p>
          </div>
        </div>

        {badgeText && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${badgeStyles[badgeColor]}`}
          >
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}
