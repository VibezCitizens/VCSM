import Card from "@/features/settings/ui/Card";
import HoursEditor from "@/features/settings/profile/ui/HoursEditor";
import useDesktopBreakpoint from "@/features/dashboard/adapters/vport/screens/useDesktopBreakpoint.adapter";

const US_PHONE_DIGITS = 10;
const US_STATE_LETTERS = 2;
const US_ZIP_DIGITS = 5;

function toPhoneDigits(value) {
  const raw = String(value || "").replace(/\D+/g, "");
  const withoutCountryCode =
    raw.length > US_PHONE_DIGITS && raw.startsWith("1") ? raw.slice(1) : raw;
  return withoutCountryCode.slice(0, US_PHONE_DIGITS);
}

function formatPhoneDisplay(value) {
  const digits = toPhoneDigits(value);
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function sanitizeCityInput(value) {
  return String(value || "").replace(/[^A-Za-z\s.'-]/g, "");
}

function sanitizeStateInput(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, US_STATE_LETTERS);
}

function sanitizeZipInput(value) {
  return String(value || "")
    .replace(/\D+/g, "")
    .slice(0, US_ZIP_DIGITS);
}

function sanitizeCountryInput(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, "")
    .replace(/\s{2,}/g, " ")
    .trimStart()
    .slice(0, 56);
}

export default function VportAboutDetailsView({
  loading,
  saving,
  error,
  draft,
  onChange,
  onSave,
  saved,
}) {
  const isDesktop = useDesktopBreakpoint();
  const chipsPlaceholder = isDesktop ? "Type and press Enter" : "Type and tap Done";

  if (loading) {
    return (
      <Card>
        <div className="py-6 text-sm text-slate-400">Loading About...</div>
      </Card>
    );
  }

  const address = draft?.address || {};
  const hours = draft?.hours || {};

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-100">VPORT About (Public)</div>
        {saved && !saving && <div className="text-xs text-emerald-300">Saved</div>}
      </div>

      <div className="space-y-4">
        <Field
          label="Location text"
          value={draft?.locationText || ""}
          onChange={(v) => onChange({ locationText: v })}
          placeholder="e.g. San Antonio, Texas"
          disabled={saving}
        />

        <Field
          label="Website"
          value={draft?.websiteUrl || ""}
          onChange={(v) => onChange({ websiteUrl: v })}
          placeholder="https://..."
          disabled={saving}
        />

        <Field
          label="Booking URL"
          value={draft?.bookingUrl || ""}
          onChange={(v) => onChange({ bookingUrl: v })}
          placeholder="https://..."
          disabled={saving}
        />

        <Field
          label="Public email"
          value={draft?.emailPublic || ""}
          onChange={(v) => onChange({ emailPublic: v })}
          placeholder="email@example.com"
          disabled={saving}
        />

        <PhoneField
          label="Public phone"
          value={draft?.phonePublic || ""}
          onChange={(v) => onChange({ phonePublic: v })}
          placeholder="(555) 123-4567"
          disabled={saving}
        />

        <div className="settings-card-surface rounded-xl p-3 space-y-3">
          <div className="text-xs text-slate-300 font-semibold">Address (optional)</div>

          <Field
            label="Line 1"
            value={address.line1 || ""}
            onChange={(v) => onChange({ address: { ...address, line1: v } })}
            placeholder="123 Main St"
            disabled={saving}
          />
          <Field
            label="Line 2"
            value={address.line2 || ""}
            onChange={(v) => onChange({ address: { ...address, line2: v } })}
            placeholder="Suite / Apt"
            disabled={saving}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="City"
              value={address.city || ""}
              onChange={(v) =>
                onChange({ address: { ...address, city: sanitizeCityInput(v) } })
              }
              placeholder="San Antonio"
              disabled={saving}
            />
            <Field
              label="State"
              value={address.state || ""}
              onChange={(v) =>
                onChange({ address: { ...address, state: sanitizeStateInput(v) } })
              }
              placeholder="TX"
              helper="2-letter code"
              maxLength={US_STATE_LETTERS}
              autoCapitalize="characters"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="ZIP"
              value={address.zip || ""}
              onChange={(v) =>
                onChange({ address: { ...address, zip: sanitizeZipInput(v) } })
              }
              placeholder="78205"
              helper="5 digits"
              inputMode="numeric"
              maxLength={US_ZIP_DIGITS}
              disabled={saving}
            />
            <Field
              label="Country"
              value={address.country || ""}
              onChange={(v) =>
                onChange({ address: { ...address, country: sanitizeCountryInput(v) } })
              }
              placeholder="US"
              autoCapitalize="characters"
              disabled={saving}
            />
          </div>
        </div>

        <HoursEditor
          value={hours}
          onChange={(next) => onChange({ hours: next })}
          disabled={saving}
        />

        <ChipsField
          label="Highlights"
          value={draft?.highlights || []}
          onChange={(arr) => onChange({ highlights: arr })}
          placeholder={chipsPlaceholder}
          disabled={saving}
        />

        <ChipsField
          label="Languages"
          value={draft?.languages || []}
          onChange={(arr) => onChange({ languages: arr })}
          placeholder={chipsPlaceholder}
          disabled={saving}
        />

        <ChipsField
          label="Payment methods"
          value={draft?.paymentMethods || []}
          onChange={(arr) => onChange({ paymentMethods: arr })}
          placeholder={chipsPlaceholder}
          disabled={saving}
        />

        {error && (
          <div className="settings-danger-error rounded-xl px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onSave}
            disabled={saving}
            className="settings-btn settings-btn--primary px-4 py-2 text-sm font-semibold"
          >
            {saving ? "Saving..." : "Save About"}
          </button>
        </div>
      </div>
    </Card>
  );
}

function Field({
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
      <label className="text-xs text-slate-300">{label}</label>
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
      {helper ? <div className="text-[11px] text-slate-500">{helper}</div> : null}
    </section>
  );
}

function PhoneField({ label, value, onChange, placeholder, disabled }) {
  const displayValue = formatPhoneDisplay(value);

  return (
    <section className="space-y-1">
      <label className="text-xs text-slate-300">{label}</label>
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
      <div className="text-[11px] text-slate-500">Enter 10 digits</div>
    </section>
  );
}

function ChipsField({ label, value, onChange, placeholder, disabled }) {
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
      <label className="text-xs text-slate-300">{label}</label>

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
