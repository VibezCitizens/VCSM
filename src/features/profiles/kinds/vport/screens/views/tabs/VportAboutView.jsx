// src/features/profiles/kinds/vport/screens/views/tabs/VportAboutView.jsx

import { VPORT_TYPE_GROUPS } from "@/features/profiles/kinds/vport/config/vportTypes.config";

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
  const parts = [
    a.line1,
    a.line2,
    a.city,
    a.state,
    a.zip,
    a.country,
  ]
    .map((x) => (x ? String(x).trim() : ""))
    .filter(Boolean);

  return parts.join(", ");
}

export default function VportAboutView({ profile, details }) {
  if (!profile) return null;

  const type = profile?.vportType || profile?.type || profile?.vport_type || null;
  const group = resolveTypeGroup(type);

  // PUBLIC DETAILS (vc.vport_public_details)
  const d = details || {};
  const addressText = formatAddress(d.address);
  const locationText = (d.locationText || d.location_text || "").trim();
  const websiteUrl = normalizeUrl(d.websiteUrl || d.website_url);
  const bookingUrl = normalizeUrl(d.bookingUrl || d.booking_url);
  const emailPublic = (d.emailPublic || d.email_public || "").trim();
  const phonePublic = (d.phonePublic || d.phone_public || "").trim();

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h3 className="text-xl font-semibold text-white">
          About {profile?.displayName || profile?.username || ""}
        </h3>

        {(type || group) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {type && (
              <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/80 capitalize">
                {type}
              </span>
            )}
            {group && (
              <span className="px-3 py-1 rounded-full text-xs bg-white/5 text-white/50">
                {group}
              </span>
            )}
          </div>
        )}
      </div>

      {/* BIO */}
      <div>
        <h4 className="text-sm uppercase tracking-wide text-neutral-400">Bio</h4>
        <div className="mt-2 text-sm text-neutral-300 whitespace-pre-wrap">
          {profile?.bio || "No information provided yet."}
        </div>
      </div>

      {/* LOCATION */}
      {(locationText || addressText) && (
        <div>
          <h4 className="text-sm uppercase tracking-wide text-neutral-400">
            Location
          </h4>

          {locationText && (
            <div className="mt-2 text-sm text-neutral-300">{locationText}</div>
          )}

          {addressText && (
            <div className="mt-1 text-sm text-neutral-400">{addressText}</div>
          )}
        </div>
      )}

      {/* CONTACT */}
      {(websiteUrl || bookingUrl || emailPublic || phonePublic) && (
        <div>
          <h4 className="text-sm uppercase tracking-wide text-neutral-400">
            Contact
          </h4>

          <div className="mt-2 space-y-2 text-sm">
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-400 hover:text-blue-300 break-all"
              >
                {websiteUrl}
              </a>
            )}

            {bookingUrl && (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-400 hover:text-blue-300 break-all"
              >
                {bookingUrl}
              </a>
            )}

            {emailPublic && (
              <a
                href={`mailto:${emailPublic}`}
                className="block text-blue-400 hover:text-blue-300 break-all"
              >
                {emailPublic}
              </a>
            )}

            {phonePublic && (
              <a
                href={`tel:${phonePublic}`}
                className="block text-blue-400 hover:text-blue-300 break-all"
              >
                {phonePublic}
              </a>
            )}
          </div>
        </div>
      )}

      {/* FOOTER META */}
      <div className="pt-4 border-t border-white/10 text-xs text-neutral-500">
        Vport: @{profile?.username || "unknown"}
      </div>
    </div>
  );
}
