import React from "react";
import { Star } from "lucide-react";

export function OverallStars({ value, size = 16 }) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? Math.max(0, Math.min(5, n)) : 0;

  return (
    <div className="flex items-center gap-0.5" aria-label={`rating ${safe} out of 5`}>
      {[1, 2, 3, 4, 5].map((step) => {
        const active = safe >= step;
        return (
          <Star
            key={step}
            size={size}
            strokeWidth={2}
            className={active ? "text-amber-300" : "text-white/20"}
            fill={active ? "currentColor" : "none"}
          />
        );
      })}
    </div>
  );
}

export function InputStars({ value, onChange, label }) {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;

  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((step) => {
        const active = safe >= step;
        return (
          <button
            key={step}
            type="button"
            onClick={() => onChange(step)}
            className={[
              "grid h-10 w-10 place-items-center rounded-xl border transition-all",
              active
                ? "border-amber-300/40 bg-amber-300/15 text-amber-300 scale-105"
                : "border-white/10 bg-black/20 text-white/25 hover:border-white/25 hover:text-white/50",
            ].join(" ")}
            aria-label={`${label} ${step} stars`}
          >
            <Star size={18} strokeWidth={2} fill={active ? "currentColor" : "none"} />
          </button>
        );
      })}
    </div>
  );
}
