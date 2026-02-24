export default function PrimaryActionButton({ label, disabled, onClick }) {
  return (
    <div className="mt-5 px-1 pb-1">
      <button
        disabled={disabled}
        onClick={onClick}
        className={[
          "module-modern-btn w-full rounded-2xl py-3.5 text-lg font-semibold tracking-wide transition",
          disabled
            ? "cursor-not-allowed border border-slate-300/15 bg-slate-900/45 text-slate-500"
            : "border border-indigo-300/45 bg-gradient-to-r from-indigo-500/85 via-violet-500/80 to-fuchsia-500/78 text-white shadow-[0_10px_24px_rgba(76,70,180,0.24)] hover:brightness-105 active:translate-y-[1px]",
        ].join(" ")}
        type="button"
      >
        {label}
      </button>
    </div>
  );
}
