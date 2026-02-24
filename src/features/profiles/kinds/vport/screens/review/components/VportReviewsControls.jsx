import React from "react";
import { Star } from "lucide-react";

export function StarsRow({ label, value, onChange }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2">
      <div className="flex min-w-0 flex-col">
        <div className="truncate text-sm font-medium text-white/90">{label}</div>
        <div className="text-[11px] text-white/45">Rate this category</div>
      </div>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = Number(value) >= n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={[
                "grid h-8 w-8 place-items-center rounded-xl border transition-colors",
                active
                  ? "border-amber-200/35 bg-amber-200/15 text-amber-200"
                  : "border-white/10 bg-black/20 text-white/30 hover:border-white/20 hover:text-white/60",
              ].join(" ")}
              aria-label={`${label} ${n} stars`}
            >
              <Star
                size={14}
                strokeWidth={2.2}
                fill={active ? "currentColor" : "none"}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors",
        active
          ? "border-sky-300/35 bg-sky-300/10 text-sky-100"
          : "border-white/10 bg-black/20 text-white/60 hover:text-white/80 hover:border-sky-300/25",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
