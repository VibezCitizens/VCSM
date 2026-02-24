import React from "react";

export function StarsRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="text-sm text-white/90">{label}</div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = Number(value) >= n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={[
                "h-8 w-8 rounded-full border text-sm",
                active
                  ? "border-white/30 bg-white/15 text-white"
                  : "border-white/10 bg-black/20 text-white/40",
              ].join(" ")}
              aria-label={`${label} ${n} stars`}
            >
              *
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

