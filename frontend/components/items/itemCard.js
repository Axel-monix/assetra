"use client";

import { FONTS } from "../../lib/constants";

const statusDot = {
  Tersedia: "bg-emerald-400",
  Maintenance: "bg-amber-400",
  Rusak: "bg-red-400",
};

const statusText = {
  Tersedia: "text-emerald-400",
  Maintenance: "text-amber-400",
  Rusak: "text-red-400",
};

export default function ItemCard({ item, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={(event) => onClick(item.id, event)}
      className={`text-left rounded-xl border bg-[#131824] overflow-hidden transition ${
        selected
          ? "border-[#8083FF] ring-1 ring-[#8083FF]"
          : "border-[#272D3D] hover:border-[#3A4258]"
      }`}
    >
      <div className="aspect-video bg-gradient-to-br from-[#1B2130] to-[#0D0D15] flex items-center justify-center">
        <span className="text-3xl opacity-30">📦</span>
      </div>

      <div className="p-3.5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium leading-snug pr-2 line-clamp-1">
            {item.name}
          </h3>
          <span className="shrink-0 rounded-md bg-[#272D3D] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[#A5A7FF]">
            {item.category}
          </span>
        </div>

        <p className={`${FONTS.CODE} mb-2.5 text-[11px] text-[#71717A]`}>
          {item.id}
        </p>

        <div className="flex items-center justify-between text-xs">
          <span
            className={`flex items-center gap-1.5 font-medium ${statusText[item.status]}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusDot[item.status]}`}
            />
            {item.status}
          </span>
          <span className="text-[#71717A]">{item.location}</span>
        </div>
      </div>
    </button>
  );
}
