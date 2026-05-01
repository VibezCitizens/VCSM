export const TONES = {
  birthday: {
    ring: "ring-pink-400/25",
    border: "border-pink-200/60",
    glow: "bg-[radial-gradient(220px_120px_at_50%_0%,rgba(236,72,153,0.20),transparent)]",
    iconRing: "ring-pink-400/20",
    iconBg: "bg-pink-50",
    iconBorder: "border-pink-200/70",
  },
  valentines: {
    ring: "ring-rose-400/25",
    border: "border-rose-200/60",
    glow: "bg-[radial-gradient(220px_120px_at_50%_0%,rgba(244,63,94,0.20),transparent)]",
    iconRing: "ring-rose-400/20",
    iconBg: "bg-rose-50",
    iconBorder: "border-rose-200/70",
  },
  christmas: {
    ring: "ring-emerald-400/20",
    border: "border-emerald-200/60",
    glow: "bg-[radial-gradient(220px_120px_at_50%_0%,rgba(16,185,129,0.18),transparent)]",
    iconRing: "ring-emerald-400/15",
    iconBg: "bg-emerald-50",
    iconBorder: "border-emerald-200/70",
  },
  business: {
    ring: "ring-sky-400/20",
    border: "border-sky-200/60",
    glow: "bg-[radial-gradient(220px_120px_at_50%_0%,rgba(56,189,248,0.18),transparent)]",
    iconRing: "ring-sky-400/15",
    iconBg: "bg-sky-50",
    iconBorder: "border-sky-200/70",
  },
  photo: {
    ring: "ring-violet-400/20",
    border: "border-violet-200/60",
    glow: "bg-[radial-gradient(220px_120px_at_50%_0%,rgba(168,85,247,0.16),transparent)]",
    iconRing: "ring-violet-400/15",
    iconBg: "bg-violet-50",
    iconBorder: "border-violet-200/70",
  },
  mothers_day: {
    ring: "ring-fuchsia-400/25",
    border: "border-fuchsia-200/60",
    glow: "bg-[radial-gradient(220px_120px_at_50%_0%,rgba(236,72,153,0.22),transparent)]",
    iconRing: "ring-fuchsia-400/20",
    iconBg: "bg-fuchsia-50",
    iconBorder: "border-fuchsia-200/70",
  },
  teacher_appreciation: {
    ring: "ring-amber-400/25",
    border: "border-amber-200/60",
    glow: "bg-[radial-gradient(220px_120px_at_50%_0%,rgba(245,158,11,0.18),transparent)]",
    iconRing: "ring-amber-400/20",
    iconBg: "bg-amber-50",
    iconBorder: "border-amber-200/70",
  },
  generic: {
    ring: "ring-zinc-400/20",
    border: "border-zinc-200/80",
    glow: "bg-[radial-gradient(220px_120px_at_50%_0%,rgba(148,163,184,0.16),transparent)]",
    iconRing: "ring-zinc-400/15",
    iconBg: "bg-zinc-50",
    iconBorder: "border-zinc-200/80",
  },
};

export function CardTypeTile({ t, active, disabled, onClick }) {
  const toneKey = t?.key || "generic";
  const tone = TONES[toneKey] || TONES.generic;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "relative overflow-hidden rounded-2xl border p-3 text-left transition",
        "bg-white hover:bg-zinc-50 active:scale-[0.99]",
        "shadow-[0_10px_25px_-22px_rgba(0,0,0,0.35)]",
        active ? "ring-2" : "ring-1 ring-black/5",
        active ? tone.ring : "ring-black/5",
        active ? tone.border : "border-zinc-200",
        disabled ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute inset-0 opacity-0 transition",
          active ? "opacity-100" : "",
          tone.glow,
        ].join(" ")}
      />

      <div className="relative flex items-start gap-3">
        <div
          className={[
            "flex h-10 w-10 items-center justify-center rounded-xl border text-lg",
            "ring-1",
            active ? tone.iconRing : "ring-black/5",
            active ? tone.iconBorder : "border-zinc-200",
            active ? tone.iconBg : "bg-white",
          ].join(" ")}
        >
          {t.icon}
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-gray-900">{t.label}</div>
          <div className="mt-1 truncate text-xs text-gray-600">{t.sub}</div>
        </div>
      </div>
    </button>
  );
}
