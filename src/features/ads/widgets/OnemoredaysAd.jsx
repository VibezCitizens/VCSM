import { useMemo } from 'react';
import Card from '@/shared/components/PageContainer'; // change if your Card path differs
import { ExternalLink } from 'lucide-react';

function visit(url) {
  try {
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (!w) window.location.href = url;
  } catch {
    window.location.href = url;
  }
}

export default function OnemoredaysAd() {
  const omdUrl = useMemo(() => 'https://onemoredays.com', []);

  return (
    <Card className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.03)] overflow-hidden">
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white/90">Sponsored</div>
            <h2 className="text-lg font-semibold tracking-tight mt-1">OneMoreDays</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Jump over to <span className="text-neutral-200">onemoredays.com</span> — explore and come back anytime.
            </p>
          </div>

          <button
            onClick={() => visit(omdUrl)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-neutral-900/80 text-neutral-100 border-neutral-800 hover:bg-neutral-800 hover:ring-1 hover:ring-white/10 transition text-sm whitespace-nowrap"
            aria-label="Open onemoredays.com"
          >
            Visit site
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* Inline preview */}
        <div className="mt-4 rounded-xl overflow-hidden border border-neutral-800 bg-black/40">
          <iframe
            title="onemoredays.com"
            src={omdUrl}
            className="w-full h-[420px] bg-black"
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>

        <div className="mt-3 text-xs text-neutral-500">
          The preview is embedded for convenience. For the best experience, use the “Visit site” button above.
        </div>
      </div>
    </Card>
  );
}
