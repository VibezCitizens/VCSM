// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\screens\gas\components\PriceSourceToggle.jsx

export function PriceSourceToggle({
  value, // 'official' | 'community'
  onChange,
  disabled = false,
}) {
  const isOfficial = value === "official";

  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-950 p-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange?.("official")}
        className={[
          "rounded-2xl px-3 py-1.5 text-sm font-semibold transition",
          isOfficial
            ? "bg-purple-600 text-white"
            : "bg-transparent text-neutral-200 hover:bg-neutral-900",
          disabled ? "opacity-60" : "",
        ].join(" ")}
      >
        Official
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange?.("community")}
        className={[
          "rounded-2xl px-3 py-1.5 text-sm font-semibold transition",
          !isOfficial
            ? "bg-purple-600 text-white"
            : "bg-transparent text-neutral-200 hover:bg-neutral-900",
          disabled ? "opacity-60" : "",
        ].join(" ")}
      >
        Community
      </button>
    </div>
  );
}