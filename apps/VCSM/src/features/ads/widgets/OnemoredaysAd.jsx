import { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';

function toSafeExternalUrl(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

function visit(url) {
  const safeUrl = toSafeExternalUrl(url);
  if (!safeUrl) return;
  try {
    const w = window.open(safeUrl, '_blank', 'noopener,noreferrer');
    if (!w) window.location.href = safeUrl;
  } catch {
    window.location.href = safeUrl;
  }
}

export default function OnemoredaysAd() {
  const omdUrl = useMemo(() => 'https://onemoredays.com', []);

  return (
    <div
      className="rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="min-w-0 flex-1">
        <div className="text-xs text-white/30 mb-0.5">Sponsored</div>
        <div className="text-sm font-semibold text-white/80">OneMoreDays</div>
        <div className="text-xs text-white/40 mt-0.5">Explore onemoredays.com</div>
      </div>
      <button
        onClick={() => visit(omdUrl)}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white/90 transition-colors"
        aria-label="Open onemoredays.com"
      >
        Visit
        <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  );
}
