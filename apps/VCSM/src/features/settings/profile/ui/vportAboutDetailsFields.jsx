import { toPhoneDigits, formatPhoneDisplay } from "@/features/settings/profile/model/vportAboutDetails.model";

export function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  helper = "",
  inputMode,
  maxLength,
  autoCapitalize,
}) {
  return (
    <section className="space-y-1">
      <label className="text-xs text-white/70">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        className="settings-input w-full rounded-xl px-3 py-2 text-base disabled:opacity-60 disabled:cursor-not-allowed"
        placeholder={placeholder}
        disabled={disabled}
      />
      {helper ? <div className="text-[11px] text-white/40">{helper}</div> : null}
    </section>
  );
}

export function PhoneField({ label, value, onChange, placeholder, disabled }) {
  const displayValue = formatPhoneDisplay(value);

  return (
    <section className="space-y-1">
      <label className="text-xs text-white/70">{label}</label>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={14}
        value={displayValue}
        onChange={(e) => onChange(toPhoneDigits(e.target.value))}
        className="settings-input w-full rounded-xl px-3 py-2 text-base disabled:opacity-60 disabled:cursor-not-allowed"
        placeholder={placeholder}
        disabled={disabled}
      />
      <div className="text-[11px] text-white/40">Enter 10 digits</div>
    </section>
  );
}

export function ChipsField({ label, value, onChange, placeholder, disabled }) {
  const onKeyDown = (e) => {
    if (disabled) return;
    if (e.key !== "Enter") return;

    e.preventDefault();
    const v = e.currentTarget.value.trim();
    if (!v) return;

    const next = Array.from(new Set([...(value || []), v]));
    onChange(next);
    e.currentTarget.value = "";
  };

  const remove = (chip) => {
    const next = (value || []).filter((x) => x !== chip);
    onChange(next);
  };

  return (
    <section className="space-y-2">
      <label className="text-xs text-white/70">{label}</label>

      <input
        onKeyDown={onKeyDown}
        className="settings-input w-full rounded-xl px-3 py-2 text-base disabled:opacity-60 disabled:cursor-not-allowed"
        placeholder={placeholder}
        disabled={disabled}
      />

      <div className="flex flex-wrap gap-2">
        {(value || []).map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => remove(chip)}
            disabled={disabled}
            className="settings-btn settings-btn--ghost px-3 py-1 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
            title="Remove"
          >
            {chip} <span className="text-white/40">x</span>
          </button>
        ))}
      </div>
    </section>
  );
}
