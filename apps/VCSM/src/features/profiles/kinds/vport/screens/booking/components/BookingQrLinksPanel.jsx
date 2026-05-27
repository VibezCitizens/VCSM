import { useQrLinks } from "@/features/booking/adapters/booking.adapter";

/**
 * BookingQrLinksPanel
 *
 * Displays QR links for a VPORT actor's booking experience.
 *
 * Identity Contract:
 * - Accepts actorId only. Never profileId, organizationId, or any banned identity surface.
 * - The @booking engine requires profileId/organizationId internally.
 *
 * TODO [P1 — ADAPTER REQUIRED]:
 *   The @booking engine's listQrLinksByProfile / listQrLinksByOrganization requires
 *   an internal booking profileId or organizationId, NOT an actorId.
 *   A dedicated booking adapter must be built to resolve actorId → booking profile internally.
 *   Until that adapter exists, this component renders an empty state.
 *   Do NOT restore profileId or organizationId as component props — the resolution
 *   must happen inside the adapter boundary, invisible to callers.
 *
 * @param {string|null} actorId — VCSM actor ID (kind='vport')
 */
function QrLinkCard({ qrLink }) {
  // Guard: slug must be present before constructing a URL.
  // Encode slug for URL safety — consistent with qrUrlBuilders.js pattern.
  if (!qrLink?.slug) return null;
  const fullUrl = `${window.location.origin}/qr/${encodeURIComponent(String(qrLink.slug))}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(fullUrl).catch(() => {});
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-3 py-3">
      <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center text-base" aria-hidden="true">
        📱
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/90 truncate">
          {qrLink.label || qrLink.qrType}
        </p>
        <p className="text-[11px] text-white/40 truncate">{qrLink.destinationPath}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <p className="text-[10px] text-white/30">{qrLink.scanCount} scans</p>
        <button
          onClick={handleCopy}
          aria-label={`Copy link for ${qrLink.label || qrLink.qrType}`}
          className="text-[10px] text-purple-400 hover:text-purple-300 font-medium"
        >
          Copy link
        </button>
      </div>
    </div>
  );
}

export function BookingQrLinksPanel({ actorId = null }) {
  // profileId and organizationId are intentionally NOT exposed at this boundary.
  // When the booking adapter is built, it will resolve them from actorId internally.
  // Until then, enabled=false renders an empty state without a contract violation.
  const { qrLinks, isLoading, error } = useQrLinks({
    organizationId: null, // resolved by adapter — not from props
    profileId: null,       // resolved by adapter — not from props
    enabled: false,        // disabled until actorId → booking profile adapter is implemented
  });

  if (!actorId) return null;

  if (isLoading) {
    return <p className="text-sm text-white/40 py-4 text-center">Loading QR links…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-400 py-2">{String(error?.message ?? error)}</p>;
  }

  if (!qrLinks.length) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/4 p-4 text-center">
        <p className="text-sm text-white/40">No QR links yet.</p>
        <p className="text-[11px] text-white/30 mt-1">
          Generate a QR code to let customers book directly.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {qrLinks.map((qrLink) => (
        <QrLinkCard key={qrLink.id} qrLink={qrLink} />
      ))}
    </div>
  );
}
