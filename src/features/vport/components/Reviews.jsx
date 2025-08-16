import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  const y = Math.floor(mo / 12);
  return `${y}y ago`;
}

/* compact star strip (no halves here; individual rows are integers 1..5) */
function RowStars({ value = 0 }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className="text-base leading-none">
      <span aria-hidden className="align-middle">{'★'.repeat(v)}</span>
      <span aria-hidden className="align-middle opacity-40">{'☆'.repeat(5 - v)}</span>
      <span className="sr-only">{v} out of 5 stars</span>
    </span>
  );
}

/* half-star display for averages */
const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.174c.969 0 1.371 1.24.588 1.81l-3.378 2.455a1 1 0 00-.364 1.118l1.287 3.971c.3.921-.755 1.688-1.54 1.118l-3.379-2.455a1 1 0 00-1.175 0l-3.379 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.971a1 1 0 00-.364-1.118L2.95 9.397c-.783-.57-.38-1.81.588-1.81h4.174a1 1 0 00.95-.69l1.387-3.97z';

const roundToHalf = (n) => Math.round(Number(n || 0) * 2) / 2;

function StarFraction({ fraction = 0 }) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <span className="relative inline-block align-middle" style={{ width: 18, height: 18 }}>
      <svg aria-hidden viewBox="0 0 20 20" className="absolute inset-0 w-[18px] h-[18px] text-gray-400" fill="currentColor">
        <path d={STAR_PATH} />
      </svg>
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
        <svg aria-hidden viewBox="0 0 20 20" className="w-[18px] h-[18px] text-yellow-400" fill="currentColor">
          <path d={STAR_PATH} />
        </svg>
      </span>
    </span>
  );
}
function StarsHalf({ value }) {
  const v = roundToHalf(value);
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${v.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const rem = v - i;
        const frac = rem >= 1 ? 1 : rem > 0 ? (rem >= 0.5 ? 0.5 : 0) : 0;
        return <StarFraction key={i} fraction={frac} />;
      })}
    </span>
  );
}

export default function Reviews({
  vportId,
  limit = 20,
  autoRotate = true,
  intervalMs = 3000, // ✅ 3 seconds by default
  showTime = true,
}) {
  const [rows, setRows] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [paused, setPaused] = useState(false);

  const avg = useMemo(() => {
    if (!rows.length) return 0;
    const s = rows.reduce((a, r) => a + (Number(r.rating) || 0), 0);
    return s / rows.length;
  }, [rows]);

  async function load() {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from('vport_reviews')
      .select('id, rating, body, created_at')
      .eq('vport_id', vportId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      setErr(error);
      setRows([]);
      setIdx(0);
    } else {
      setRows(data || []);
      setIdx(0);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!vportId) return;
    load();
    const channel = supabase
      .channel('vport_reviews_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vport_reviews', filter: `vport_id=eq.${vportId}` },
        () => load()
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vportId, limit]);

  useEffect(() => {
    if (!autoRotate || !rows.length || paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % rows.length), intervalMs);
    return () => clearInterval(t);
  }, [autoRotate, rows.length, intervalMs, paused]);

  const header = (
    <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
      <h4 className="font-semibold text-red-500">Customer Reviews</h4>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 whitespace-nowrap">
        <StarsHalf value={avg} />
        <span className="text-xs md:text-sm text-white/80">
          {avg.toFixed(1)} / 5 • {rows.length} {rows.length === 1 ? 'review' : 'reviews'}
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="rounded-xl ring-1 ring-red-500/30 bg-white/5 p-4 text-sm text-white">
        {header}
        <div className="opacity-50 text-xs">Fetching latest ratings…</div>
      </div>
    );
  }
  if (err) {
    return (
      <div className="rounded-xl ring-1 ring-red-500/30 bg-white/5 p-4 text-sm text-white">
        {header}
        <div className="text-red-400">Couldn’t load reviews. {err.message || 'Unknown error.'}</div>
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div className="rounded-xl ring-1 ring-red-500/30 bg-white/5 p-4 text-sm text-white">
        {header}
        <div className="opacity-70">No reviews yet.</div>
      </div>
    );
  }

  const cur = rows[idx];

  return (
    <div className="rounded-xl ring-1 ring-red-500/30 bg-white/5 p-4 md:p-5 text-white">
      {header}

      <div
        className="rounded-lg border border-white/10 p-3 transition-colors"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Stars + time for current review */}
        <div className="flex items-center justify-between mb-2">
          <RowStars value={cur.rating} />
          {showTime && <div className="text-xs opacity-60">{timeAgo(cur.created_at)}</div>}
        </div>

        {/* Text */}
        <blockquote className="text-sm md:text-base leading-relaxed text-white">
          {cur.body?.trim()?.length ? cur.body : <span className="opacity-60">No comment provided.</span>}
        </blockquote>

        {/* Pager */}
        {rows.length > 1 && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIdx((i) => (i - 1 + rows.length) % rows.length)}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition text-xs"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setIdx((i) => (i + 1) % rows.length)}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition text-xs"
              >
                Next
              </button>
            </div>
            <div className="flex gap-1">
              {rows.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to review ${i + 1}`}
                  onClick={() => setIdx(i)}
                  className={`h-1.5 w-4 rounded-full ${i === idx ? 'bg-red-500' : 'bg-white/20 hover:bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
