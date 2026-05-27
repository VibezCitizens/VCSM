import { useQrLinks } from "@/features/booking/adapters/booking.adapter";

/**
 * BookingQrLinksPanel
 *
 * Displays QR links for a VPORT actor's booking experience.
 *
 * Identity Contract:
 * - Accepts actorId only. profileId and organizationId are never accepted as props.
 * - useQrLinks now resolves actorId → profileId internally via getVportProfileIdByActorIdDAL.
 *   The translation is invisible to this caller — actorId is the only identity surface here.
 *
 * (VENOM V-003 — identity surface adapter implemented in useQrLinks; TODO resolved)
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
  // actorId is the only identity surface. useQrLinks resolves actorId → profileId internally.
  const { qrLinks, isLoading, error } = useQrLinks({
    actorId,
    enabled: !!actorId,
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
