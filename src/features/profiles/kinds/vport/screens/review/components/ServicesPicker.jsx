// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\screens\review\components\ServicesPicker.jsx
import React from "react";

export default function ServicesPicker({
  services,
  selectedKeys,
  onToggle,
  title = "Services",
}) {
  return (
    <div className="w-full rounded-2xl bg-neutral-950 border border-purple-900 p-4 space-y-3">
      <div className="text-white font-semibold">{title}</div>

      <div className="flex flex-wrap gap-2">
        {(services ?? []).map((s) => {
          const key = s.dimensionKey;
          const active = selectedKeys?.includes(key);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle?.(key)}
              className={[
                "px-3 py-1 rounded-2xl border text-sm",
                active
                  ? "bg-purple-700 border-purple-500 text-white"
                  : "bg-neutral-900 border-neutral-700 text-neutral-200",
              ].join(" ")}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}