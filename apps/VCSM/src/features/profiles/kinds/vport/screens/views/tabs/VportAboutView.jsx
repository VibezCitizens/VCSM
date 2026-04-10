// src/features/profiles/kinds/vport/screens/views/tabs/VportAboutView.jsx

import { useEffect, useMemo } from "react";
import { VPORT_TYPE_GROUPS } from "@/features/profiles/kinds/vport/config/vportTypes.config";
import { useLocksmithProfile } from "@/features/profiles/kinds/vport/hooks/locksmith/useLocksmithProfile";

function resolveTypeGroup(type) {
  if (!type) return null;

  const lower = String(type).toLowerCase();

  for (const [group, types] of Object.entries(VPORT_TYPE_GROUPS)) {
    if (types.includes(lower)) return group;
  }

  return "Other";
}

function safeJson(v) {
  if (!v) return {};
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function normalizeUrl(url) {
  const raw = (url || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function formatAddress(addr) {
  const a = safeJson(addr);
  const parts = [a.line1, a.line2, a.city, a.state, a.zip, a.country]
    .map((x) => (x ? String(x).trim() : ""))
    .filter(Boolean);

  return parts.join(", ");
}

// ------------------------------------------------------------
// HOURS (your shape: { weekly: { mon: [{start,end}], ... }, timezone, always_open })
// Render individual days (Mon, Tue, Wed, ...)
// ------------------------------------------------------------
const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABEL = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function formatTimeRange(start, end) {
  const s = (start || "").toString().trim();
  const e = (end || "").toString().trim();
  if (!s && !e) return "";
  if (s && e) return `${s} – ${e}`;
  if (s && !e) return `${s} –`;
  return `– ${e}`;
}

function dayValueFromWeekly(weekly, dayKey) {
  const intervals = Array.isArray(weekly?.[dayKey]) ? weekly[dayKey] : [];
  if (intervals.length === 0) return "Closed";
  const v = intervals
    .map((it) => formatTimeRange(it?.start, it?.end))
    .filter(Boolean)
    .join(", ");
  return v || "Closed";
}

function formatWeeklyHoursPerDay(hoursRaw) {
  const h = safeJson(hoursRaw);
  if (!h || typeof h !== "object") return { days: [], timezone: "" };

  const tz = (h.timezone || h.timeZone || "").toString().trim();
  const alwaysOpen = h.always_open === true || h.alwaysOpen === true;
  const weekly = h.weekly && typeof h.weekly === "object" ? h.weekly : null;

  if (alwaysOpen) {
    return {
      timezone: tz,
      days: DAY_ORDER.map((d) => ({
        day: d,
        label: DAY_LABEL[d],
        value: "Open 24/7",
      })),
    };
  }

  if (!weekly) return { days: [], timezone: tz };

  const days = DAY_ORDER.map((d) => ({
    day: d,
    label: DAY_LABEL[d],
    value: dayValueFromWeekly(weekly, d),
  }));

  const hasAny = days.some((x) => (x.value || "").trim().length > 0);
  return { days: hasAny ? days : [], timezone: tz };
}

// ------------------------------------------------------------
// Chips / arrays
// ------------------------------------------------------------
function normalizeStringArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string") {
    return v
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function Chips({ items }) {
  const list = normalizeStringArray(items);
  if (!list.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {list.map((x, i) => (
        <span
          key={`${x}-${i}`}
          className="
            inline-flex items-center
            px-3 py-1.5
            rounded-full
            text-xs font-medium
            bg-sky-300/10 text-sky-100
            border border-sky-300/25
          "
        >
          {x}
        </span>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
// Small UI helpers
// ------------------------------------------------------------
function SectionCard({ title, subtitle, children }) {
  return (
    <section className="profiles-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-xs uppercase tracking-wider text-white/70/85">
            {title}
          </h4>
          {subtitle ? (
            <div className="mt-1 text-xs text-white/50">{subtitle}</div>
          ) : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[96px,1fr] gap-4 py-2">
      <div className="text-sm text-white/50">{label}</div>
      <div className="text-sm text-white break-words">{children}</div>
    </div>
  );
}


function Divider() {
  return <div className="my-2 h-px bg-white/10" />;
}

function LinkRow({ label, href, text }) {
  if (!href) return null;
  return (
    <Row label={label}>
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        className="text-blue-400 hover:text-blue-300 underline decoration-white/15 hover:decoration-white/30"
      >
        {text || href}
      </a>
    </Row>
  );
}

export default function VportAboutView({ profile, details }) {
  const type =
    profile?.vportType || profile?.type || profile?.vport_type || null;
  const group = resolveTypeGroup(type);
  const actorId = profile?.actor_id ?? profile?.actorId ?? null;
  const { isLocksmith, serviceAreas } = useLocksmithProfile(actorId, type);

  // PUBLIC DETAILS (vc.vport_public_details)
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

  // --- DEBUG + stable recompute key (supports string or object hours) ---
  const hoursKey = useMemo(() => {
    try {
      return typeof d.hours === "string" ? d.hours : JSON.stringify(d.hours ?? {});
    } catch {
      return "";
    }
  }, [d.hours]);

  useEffect(() => {
    try {
      console.log(
        "VportAboutView details.hours (json):",
        typeof d?.hours === "string" ? d.hours : JSON.stringify(d?.hours, null, 2)
      );
    } catch {
      console.log("VportAboutView details.hours (raw):", d?.hours);
    }
  }, [hoursKey, d?.hours]);

  const hours = useMemo(() => formatWeeklyHoursPerDay(d.hours), [d.hours]);
  const hasHours = !!hours.days.length;

  if (!profile) return null;

  return (
    <div className="profiles-card rounded-2xl p-6 space-y-5">
      {/* HEADER */}
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

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BIO */}
        <SectionCard title="Bio">
          <div className="text-sm text-white/85 whitespace-pre-wrap leading-relaxed">
            {profile?.bio || "No information provided yet."}
          </div>
        </SectionCard>

        {/* HOURS (INDIVIDUAL DAYS) */}
        {hasHours && (
          <SectionCard title="Hours">
            <div className="space-y-2">
              {hours.days.map((d) => (
                <div
                  key={d.day}
                  className="flex items-baseline justify-between gap-4"
                >
                  <div className="text-sm text-white/50">{d.label}</div>
                  <div className="text-sm text-white/85 text-right">
                    {d.value}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* HIGHLIGHTS */}
        {highlightsList.length > 0 && (
          <SectionCard title="Highlights">
            <Chips items={highlightsList} />
          </SectionCard>
        )}

        {/* LANGUAGES */}
        {languagesList.length > 0 && (
          <SectionCard title="Languages">
            <Chips items={languagesList} />
          </SectionCard>
        )}

        {/* PAYMENT METHODS */}
        {paymentMethodsList.length > 0 && (
          <SectionCard title="Payment Methods">
            <Chips items={paymentMethodsList} />
          </SectionCard>
        )}

        {/* LOCATION */}
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

        {/* LOCKSMITH SERVICE AREAS */}
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

        {/* CONTACT */}
        {(websiteUrl || bookingUrl || emailPublic || phonePublic) && (
          <SectionCard title="Contact">
            <div>
              <LinkRow label="Website" href={websiteUrl} text={websiteUrl} />
              <LinkRow label="Booking" href={bookingUrl} text={bookingUrl} />
              <LinkRow
                label="Email"
                href={emailPublic ? `mailto:${emailPublic}` : ""}
                text={emailPublic}
              />
              <LinkRow
                label="Phone"
                href={phonePublic ? `tel:${phonePublic}` : ""}
                text={phonePublic}
              />
            </div>
          </SectionCard>
        )}
      </div>

      {/* FOOTER META */}
      <div className="pt-4 border-t border-white/10 text-xs text-white/40">
        Vport: @{profile?.username || "unknown"}
      </div>
    </div>
  );
}
