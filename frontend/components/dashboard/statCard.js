"use client";

export default function StatCard({ icon, label, value, badgeText, badgeColor = "default" }) {
  const badgeStyles = {
    default: "bg-[#272D3D] text-[#A1A1AA]",
    urgent: "bg-amber-500/15 text-amber-400",
    danger: "bg-red-500/15 text-red-400",
    info: "bg-[#8083FF]/15 text-[#A5A7FF]",
  };

  return (
    <div className="rounded-xl border border-[#272D3D] bg-[#131824] p-5">
      <div className="flex items-start justify-between mb-4">
        <span className="text-[#8083FF]">{icon}</span>
        {badgeText && (
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${badgeStyles[badgeColor]}`}>
            {badgeText}
          </span>
        )}
      </div>
      <div className="text-[11px] uppercase tracking-wide text-[#71717A] mb-1">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}