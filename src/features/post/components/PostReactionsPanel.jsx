// src/features/post/components/PostReactionsPanel.jsx
import { useEffect, useMemo, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import UserLink from '@/components/UserLink';

const REACTIONS = {
  like:    { icon: '👍', label: 'like' },
  dislike: { icon: '👎', label: 'dislike' },
  rose:    { icon: '🌹', label: 'rose' },
};
const REACTION_ORDER = ['like', 'dislike', 'rose'];

const PILL_BASE =
  'inline-flex items-center justify-center h-8 px-2.5 rounded-lg text-xs sm:text-sm font-medium transition';
const PILL_ON  = 'bg-purple-600 text-white shadow';
const PILL_OFF = 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700';
const ICON_CLS = 'w-4 text-center';
const COUNT_CLS = 'ml-1.5 font-semibold tabular-nums';
const PILL_MIN_W = 'min-w-[72px] sm:min-w-[88px]';

export default function PostReactionsPanel({ postId, initialKind = 'rose' }) {
  const normalize = (k) => {
    const s = (k || 'rose').toLowerCase();
    const singular = s.endsWith('s') ? s.slice(0, -1) : s;
    return REACTIONS[singular] ? singular : 'rose';
  };

  const [tab, setTab] = useState(normalize(initialKind));
  const [summary, setSummary] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paging, setPaging] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const PAGE = 25;

  useEffect(() => setTab(normalize(initialKind)), [initialKind]);

  // ---- block sets (load once, no realtime)
  const iBlockedRef = useRef(new Set());   // profiles I blocked
  const blockedMeRef = useRef(new Set());  // profiles who blocked me
  const [blocksReady, setBlocksReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const me = data?.user?.id ?? null;
      if (!me) { if (active) setBlocksReady(true); return; }

      const [{ data: myBlocks, error: e1 }, { data: blockedBy, error: e2 }] = await Promise.all([
        supabase.schema('vc').from('user_blocks').select('blocked_id').eq('blocker_id', me),
        supabase.schema('vc').from('user_blocks').select('blocker_id').eq('blocked_id', me),
      ]);
      if (!active) return;

      if (e1) console.error('load myBlocks', e1);
      if (e2) console.error('load blockedBy', e2);

      iBlockedRef.current = new Set((myBlocks ?? []).map(r => r.blocked_id));
      blockedMeRef.current = new Set((blockedBy ?? []).map(r => r.blocker_id));
      setBlocksReady(true);
    })();
    return () => { active = false; };
  }, []);

  const isBlockedProfile = (profileId) => {
    if (!profileId) return false;
    return iBlockedRef.current.has(profileId) || blockedMeRef.current.has(profileId);
  };

  async function load(reset = true) {
    if (!postId) return;
    if (reset) { setOffset(0); setHasMore(false); }
    setLoading(true);

    // summary (per post) — unchanged
    const { data: s } = await supabase
      .schema('vc')
      .rpc('post_reactors_summary_one', { post_id: postId });
    setSummary(s ?? []);

    // list (per post, current tab)
    const { data: l } = await supabase
      .schema('vc')
      .rpc('post_reactors_list', {
        post_id: postId,
        kind: tab,
        limit_i: PAGE + 1,
        offset_i: 0,
      });

    const rows = Array.isArray(l) ? l : [];

    // 🔒 filter BEFORE setting state so nothing leaks to UI
    const filtered = rows.filter(r => !isBlockedProfile(r.profile_id));

    setList(filtered.slice(0, PAGE));
    setHasMore(filtered.length > PAGE);
    setOffset(PAGE);
    setLoading(false);
  }

  async function loadMore() {
    if (!postId || paging || !hasMore) return;
    setPaging(true);

    const { data: l } = await supabase
      .schema('vc')
      .rpc('post_reactors_list', {
        post_id: postId,
        kind: tab,
        limit_i: PAGE + 1,
        offset_i: offset,
      });

    const rows = Array.isArray(l) ? l : [];
    const filtered = rows.filter(r => !isBlockedProfile(r.profile_id));

    setList((prev) => [...prev, ...filtered.slice(0, PAGE)]);
    setHasMore(filtered.length > PAGE);
    setOffset(offset + PAGE);
    setPaging(false);
  }

  // Load once blocks are ready; reload on post/tab changes
  useEffect(() => {
    if (!blocksReady) return;
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocksReady, postId, tab]);

  const counts = useMemo(() => {
    const m = Object.fromEntries((summary || []).map(r => [r.kind, r.qty ?? r.total_qty]));
    return {
      like:    m.like ?? 0,
      dislike: m.dislike ?? 0,
      rose:    m.rose ?? 0,
    };
  }, [summary]);

  const Pill = ({ k }) => (
    <button
      onClick={() => setTab(k)}
      className={`${PILL_BASE} ${PILL_MIN_W} ${tab===k ? PILL_ON : PILL_OFF}`}
      title={`Show ${REACTIONS[k].label}${counts[k] === 1 ? '' : 's'}`}
    >
      <span className={ICON_CLS}>{REACTIONS[k].icon}</span>
      <span className={COUNT_CLS}>{counts[k]}</span>
    </button>
  );

  const currentIcon = REACTIONS[tab].icon;

  const showLoading = loading || !blocksReady;

  return (
    <div className="mt-4">
      <div className="grid grid-cols-3 gap-1.5 mb-2 w-full max-w-[260px] sm:max-w-[320px]">
        {REACTION_ORDER.map((k) => <Pill key={k} k={k} />)}
      </div>

      {showLoading ? (
        <div className="text-zinc-400 text-sm">Loading…</div>
      ) : list.length === 0 ? (
        <div className="text-zinc-400 text-sm">
          No {REACTIONS[tab].label}{counts[tab] === 1 ? '' : 's'} yet.
        </div>
      ) : (
        <>
          <ul className="divide-y divide-zinc-800 rounded-xl overflow-hidden bg-zinc-900/40">
            {list.map((r) => (
              <li key={`${r.kind_out}-${r.profile_id}`} className="flex items-center gap-3 p-3">
                <UserLink
                  user={{
                    id: r.profile_id,
                    username: r.username,
                    display_name: r.display_name,
                    photo_url: r.photo_url,
                  }}
                  avatarSize="w-8 h-8"
                  avatarShape="rounded-full"
                  textSize="text-sm"
                  showUsername={true}
                  className="flex-1 min-w-0"
                />
                <div className="text-xs text-zinc-400 mr-2">
                  <span className="tabular-nums font-medium">{r.qty}</span>
                  {' '}
                  {r.kind_out}{r.qty > 1 ? 's' : ''}
                  {' • '}
                  {new Date(r.last_at).toLocaleString()}
                </div>
                <div className="text-lg w-5 text-center">{currentIcon}</div>
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="flex justify-center mt-3">
              <button
                onClick={loadMore}
                disabled={paging}
                className="text-sm px-4 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60"
              >
                {paging ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
