import { useMemo } from "react";
import { useLocksmithProfile } from "@/features/profiles/kinds/vport/hooks/locksmith/useLocksmithProfile";
import {
  resolveTypeGroup,
  normalizeUrl,
  formatAddress,
  normalizeStringArray,
  formatWeeklyHoursPerDay,
} from "@/features/profiles/kinds/vport/screens/views/tabs/vportAboutView.model";
import {
  Chips,
  SectionCard,
  Row,
  Divider,
  LinkRow,
} from "@/features/profiles/kinds/vport/screens/views/tabs/components/VportAboutViewComponents";

export default function VportAboutView({ profile, details }) {
  const type =
    profile?.vportType || profile?.type || profile?.vport_type || details?.vportType || null;
  const group = resolveTypeGroup(type);
  const actorId = profile?.actor_id ?? profile?.actorId ?? null;
  const { isLocksmith, serviceAreas } = useLocksmithProfile(actorId, type);

  const d = details || {};

  const addressText = formatAddress(d.address);
  const locationText = (d.locationText || d.location_text || "").trim();

  const websiteUrl = normalizeUrl(d.websiteUrl || d.website_url);
  const bookingUrl = normalizeUrl(d.bookingUrl || d.booking_url);

  const emailPublic = (d.emailPublic || d.email_public || "").trim();
  const phonePublic = (d.phonePublic || d.phone_public || "").trim();

  const highlights = d.highlights ?? [];
  const languages = d.languages ?? [];
  const paymentMethods = d.paymentMethods ?? d.payment_methods ?? [];
  const highlightsList = normalizeStringArray(highlights);
  const languagesList = normalizeStringArray(languages);
  const paymentMethodsList = normalizeStringArray(paymentMethods);

  const hours = useMemo(() => formatWeeklyHoursPerDay(d.hours), [d.hours]);
  const hasHours = !!hours.days.length;

  if (!profile) return null;

  return (
    <div className="profiles-card rounded-2xl p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">
            About {profile?.displayName || profile?.username || ""}
          </h3>
          {(type || group) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {type && (
                <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/85 capitalize border border-white/10">
                  {type}
                </span>
              )}
              {group && (
                <span className="px-3 py-1 rounded-full text-xs bg-white/5 text-white/60 border border-white/10">
                  {group}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Bio">
          <div className="text-sm text-white/85 whitespace-pre-wrap leading-relaxed">
            {profile?.bio || "No information provided yet."}
          </div>
        </SectionCard>

        {hasHours && (
          <SectionCard title="Hours">
            <div className="space-y-2">
              {hours.days.map((d) => (
                <div key={d.day} className="flex items-baseline justify-between gap-4">
                  <div className="text-sm text-white/50">{d.label}</div>
                  <div className="text-sm text-white/85 text-right">{d.value}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {highlightsList.length > 0 && (
          <SectionCard title="Highlights">
            <Chips items={highlightsList} />
          </SectionCard>
        )}

        {languagesList.length > 0 && (
          <SectionCard title="Languages">
            <Chips items={languagesList} />
          </SectionCard>
        )}

        {paymentMethodsList.length > 0 && (
          <SectionCard title="Payment Methods">
            <Chips items={paymentMethodsList} />
          </SectionCard>
        )}

        {(locationText || addressText) && (
          <SectionCard title="Location">
            {locationText && <Row label="City">{locationText}</Row>}
            {addressText && (
              <>
                {locationText ? <Divider /> : null}
                <Row label="Address">{addressText}</Row>
              </>
            )}
          </SectionCard>
        )}

        {isLocksmith && serviceAreas.length > 0 ? (
          <SectionCard title="Service Areas">
            <div className="space-y-2">
              {serviceAreas.map((area) => (
                <div key={area.id} className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">
                      {area.label || area.city || area.zipCode || 'Coverage area'}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-white/45">
                      {area.city && area.stateCode ? <span>{area.city}, {area.stateCode}</span> : null}
                      {area.zipCode ? <span>ZIP {area.zipCode}</span> : null}
                      {area.radiusMiles ? <span>{area.radiusMiles} mi radius</span> : null}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {area.minEtaMinutes != null || area.maxEtaMinutes != null ? (
                      <span className="text-xs text-white/50">
                        ETA {area.minEtaMinutes ?? '?'}–{area.maxEtaMinutes ?? '?'} min
                      </span>
                    ) : null}
                    {area.isEmergencyCovered ? (
                      <span className="rounded-md bg-red-400/10 border border-red-400/20 px-1.5 py-0.5 text-[10px] font-medium text-red-200/70">Emergency</span>
                    ) : null}
                    {area.travelFeeCents > 0 ? (
                      <span className="text-[10px] text-white/35">+${(area.travelFeeCents / 100).toFixed(2)} travel</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}

        {(websiteUrl || bookingUrl || emailPublic || phonePublic) && (
          <SectionCard title="Contact">
            <div>
              <LinkRow label="Website" href={websiteUrl} text={websiteUrl} />
              <LinkRow label="Booking" href={bookingUrl} text={bookingUrl} />
              <LinkRow label="Email" href={emailPublic ? `mailto:${emailPublic}` : ""} text={emailPublic} />
              <LinkRow label="Phone" href={phonePublic ? `tel:${phonePublic}` : ""} text={phonePublic} />
            </div>
          </SectionCard>
        )}
      </div>

      <div className="pt-4 border-t border-white/10 text-xs text-white/40">
        Vport: @{profile?.username || "unknown"}
      </div>
    </div>
  );
}
