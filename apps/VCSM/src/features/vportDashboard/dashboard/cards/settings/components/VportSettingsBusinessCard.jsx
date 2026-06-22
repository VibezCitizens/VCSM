import { Card } from "@/features/settings/adapters/settings.adapter";
import CardSettingToggleRow from "./CardSettingToggleRow";
import { getSectionToggles } from "@/shared/lib/businessCard/businessCardSettings.model";

const CONTACT_TOGGLES = [
  { key: "show_contact_section", label: "Show contact section" },
  { key: "show_phone",            label: "Show phone number" },
  { key: "show_address",          label: "Show address" },
  { key: "show_email",            label: "Show email" },
];

const ACTION_TOGGLES = [
  { key: "show_call_btn",    label: "Show Call button" },
  { key: "show_text_btn",    label: "Show Text button" },
  { key: "show_profile_btn", label: "Show Profile button" },
  { key: "show_request_btn", label: "Show 'Send a request' button" },
];

export default function VportSettingsBusinessCard({
  vportType,
  cardSettings,
  cardSettingsLoading,
  cardSettingsSaving,
  cardSettingsError,
  updateCardSettings,
}) {
  return (
    <Card>
      <div className="space-y-3">
        <div className="text-sm font-semibold text-zinc-100">Business Card Display</div>
        <div className="text-xs text-zinc-400">
          Control what visitors see on your public business card.
        </div>

        {cardSettingsLoading ? (
          <div className="text-xs text-zinc-500">Loading…</div>
        ) : (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider pt-1 pb-0.5">
              Identity
            </div>
            <CardSettingToggleRow
              label="Show review stars"
              value={cardSettings.identity?.show_reviews !== false}
              disabled={cardSettingsSaving}
              onChange={(val) => updateCardSettings({ identity: { show_reviews: val } })}
            />

            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider pt-2 pb-0.5">
              Contact Info
            </div>
            {CONTACT_TOGGLES.map(({ key, label }) => (
              <CardSettingToggleRow
                key={key}
                label={label}
                value={cardSettings.contact?.[key] !== false}
                disabled={cardSettingsSaving}
                onChange={(val) => updateCardSettings({ contact: { [key]: val } })}
              />
            ))}

            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider pt-2 pb-0.5">
              Actions
            </div>
            {ACTION_TOGGLES.map(({ key, label }) => (
              <CardSettingToggleRow
                key={key}
                label={label}
                value={cardSettings.actions?.[key] !== false}
                disabled={cardSettingsSaving}
                onChange={(val) => updateCardSettings({ actions: { [key]: val } })}
              />
            ))}

            {getSectionToggles(vportType).length > 0 && (
              <>
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider pt-2 pb-0.5">
                  Sections
                </div>
                {getSectionToggles(vportType).map(({ key, label }) => (
                  <CardSettingToggleRow
                    key={key}
                    label={label}
                    value={cardSettings.sections?.[key] !== false}
                    disabled={cardSettingsSaving}
                    onChange={(val) => updateCardSettings({ sections: { [key]: val } })}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {cardSettingsError && (
          <p className="text-xs text-rose-400">{cardSettingsError}</p>
        )}
      </div>
    </Card>
  );
}
