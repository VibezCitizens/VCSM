export function StepProgress({ current, total }) {
  return (
    <div className="flex items-center gap-1.5 mb-5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-1 rounded-full flex-1 transition-all"
          style={{
            background:
              i < current
                ? "rgba(255,255,255,0.55)"
                : i === current
                ? "rgba(255,255,255,0.9)"
                : "rgba(255,255,255,0.12)",
          }}
        />
      ))}
    </div>
  );
}

export function RadioOption({ selected }) {
  return selected ? (
    <div className="w-4 h-4 rounded-full bg-white/90 flex items-center justify-center shrink-0">
      <div className="w-2 h-2 rounded-full bg-black" />
    </div>
  ) : (
    <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
  );
}

export function StepHeader({ title, subtitle }) {
  return (
    <div className="mb-4">
      <div className="text-base font-bold text-white">{title}</div>
      {subtitle && <div className="text-sm text-white/40 mt-0.5">{subtitle}</div>}
    </div>
  );
}

export function OptionCard({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left rounded-xl border p-3.5 transition-all",
        selected
          ? "border-white/30 bg-white/[0.08]"
          : "border-white/8 bg-white/[0.02] hover:bg-white/[0.05]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
