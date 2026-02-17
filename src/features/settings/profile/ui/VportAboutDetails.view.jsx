// src/features/settings/profile/ui/VportAboutDetails.view.jsx

import Card from "@/features/settings/ui/Card";
import HoursEditor from "@/features/settings/profile/ui/HoursEditor";

export default function VportAboutDetailsView({
  loading,
  saving,
  error,
  draft,
  onChange,
  onSave,
  saved,
}) {
  if (loading) {
    return (
      <Card>
        <div className="py-6 text-sm text-zinc-400">Loading About…</div>
      </Card>
    );
  }

  const address = draft?.address || {};
  const hours = draft?.hours || {};

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">VPORT About (Public)</div>
        {saved && !saving && (
          <div className="text-xs text-green-400">✓ Saved</div>
        )}
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

        <Field
          label="Public phone"
          value={draft?.phonePublic || ""}
          onChange={(v) => onChange({ phonePublic: v })}
          placeholder="+1..."
          disabled={saving}
        />

        {/* ADDRESS (structured) */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-3">
          <div className="text-xs text-zinc-300 font-semibold">
            Address (optional)
          </div>

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
              onChange={(v) => onChange({ address: { ...address, city: v } })}
              placeholder="San Antonio"
              disabled={saving}
            />
            <Field
              label="State"
              value={address.state || ""}
              onChange={(v) => onChange({ address: { ...address, state: v } })}
              placeholder="TX"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="ZIP"
              value={address.zip || ""}
              onChange={(v) => onChange({ address: { ...address, zip: v } })}
              placeholder="78205"
              disabled={saving}
            />
            <Field
              label="Country"
              value={address.country || ""}
              onChange={(v) =>
                onChange({ address: { ...address, country: v } })
              }
              placeholder="US"
              disabled={saving}
            />
          </div>
        </div>

        {/* HOURS (visual editor) */}
        <HoursEditor
          value={hours}
          onChange={(next) => onChange({ hours: next })}
          disabled={saving}
        />

        <ChipsField
          label="Highlights"
          value={draft?.highlights || []}
          onChange={(arr) => onChange({ highlights: arr })}
          placeholder="Type and press Enter"
          disabled={saving}
        />

        <ChipsField
          label="Languages"
          value={draft?.languages || []}
          onChange={(arr) => onChange({ languages: arr })}
          placeholder="Type and press Enter"
          disabled={saving}
        />

        <ChipsField
          label="Payment methods"
          value={draft?.paymentMethods || []}
          onChange={(arr) => onChange({ paymentMethods: arr })}
          placeholder="Type and press Enter"
          disabled={saving}
        />

        {error && (
          <div className="rounded-xl bg-red-950 border border-red-900 text-red-200 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onSave}
            disabled={saving}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              saving
                ? "bg-zinc-800 text-zinc-400"
                : "bg-violet-600 hover:bg-violet-700 text-white"
            }`}
          >
            {saving ? "Saving…" : "Save About"}
          </button>
        </div>
      </div>
    </Card>
  );
}

function Field({ label, value, onChange, placeholder, disabled }) {
  return (
    <section className="space-y-1">
      <label className="text-xs text-zinc-300">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full rounded-xl
          bg-white border border-zinc-300 text-black
          px-3 py-2 outline-none
          focus:ring-2 focus:ring-violet-600
          placeholder-black/50
          disabled:bg-zinc-200 disabled:text-zinc-500 disabled:cursor-not-allowed
        "
        placeholder={placeholder}
        disabled={disabled}
      />
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
      <label className="text-xs text-zinc-300">{label}</label>

      <input
        onKeyDown={onKeyDown}
        className="
          w-full rounded-xl
          bg-white border border-zinc-300 text-black
          px-3 py-2 outline-none
          focus:ring-2 focus:ring-violet-600
          placeholder-black/50
          disabled:bg-zinc-200 disabled:text-zinc-500 disabled:cursor-not-allowed
        "
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
            className="
              px-3 py-1 rounded-full text-xs
              bg-zinc-900 text-white/85
              border border-zinc-700
              hover:bg-zinc-800
              disabled:opacity-60 disabled:cursor-not-allowed
            "
            title="Remove"
          >
            {chip} <span className="text-white/40">×</span>
          </button>
        ))}
      </div>
    </section>
  );
}
