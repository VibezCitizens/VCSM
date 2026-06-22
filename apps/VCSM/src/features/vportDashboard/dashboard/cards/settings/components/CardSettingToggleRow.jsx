export default function CardSettingToggleRow({ label, value, disabled, onChange }) {
  return (
    <div
      className="flex items-center justify-between rounded-xl px-3 py-2.5"
      style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}
    >
      <div className="text-sm text-zinc-200 min-w-0 flex-1">{label}</div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        aria-label={value ? `Hide: ${label}` : `Show: ${label}`}
        className={`settings-toggle ml-3 shrink-0 ${value ? "is-on" : "is-off"} disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <span className="settings-toggle-knob" />
      </button>
    </div>
  );
}
