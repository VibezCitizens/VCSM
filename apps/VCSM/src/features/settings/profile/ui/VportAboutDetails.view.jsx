import Card from "@/features/settings/ui/Card";
import HoursEditor from "@/features/settings/profile/ui/HoursEditor";
import useDesktopBreakpoint from "@/shared/hooks/useDesktopBreakpoint";
import {
  sanitizeCityInput,
  sanitizeStateInput,
  sanitizeZipInput,
  sanitizeCountryInput,
  US_STATE_LETTERS,
  US_ZIP_DIGITS,
} from "@/features/settings/profile/ui/vportAboutDetails.model";
import { Field, PhoneField, ChipsField } from "@/features/settings/profile/ui/vportAboutDetailsFields";

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
        <div className="py-6 text-sm text-white/50">Loading About...</div>
      </Card>
    );
  }

  const address = draft?.address || {};
  const hours = draft?.hours || {};

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-white">VPORT About (Public)</div>
        {saved && !saving && <div className="text-xs text-emerald-300">Saved</div>}
      </div>

      <div className="space-y-4">
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
          <div className="text-xs text-white/70 font-semibold">Address (optional)</div>

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
              helper="2-letter code"
              maxLength={2}
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
