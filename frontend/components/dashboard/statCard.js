"use client";

export default function StatCard({
  icon,
  label,
  value,
  badgeText,
  badgeColor = "default",
}) {
  const badgeStyles = {
    default: "bg-[#272D3D] text-[#A1A1AA]",
    info: "bg-blue-500/20 text-blue-400",
    urgent: "bg-amber-500/20 text-amber-400",
    danger: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="rounded-xl border border-[#272D3D] bg-[#131824] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#1D2230] p-2.5 text-[#8083FF]">
            {icon}
          </div>

          <div>
            <p className="text-sm text-[#A1A1AA]">{label}</p>

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
