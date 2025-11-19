// src/features/settings/components/privacy/UserLookup.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useMyBlocks } from './useMyBlocks';

export default function UserLookup() {
  const {
  actorId: me,     // ← use ACTOR ID, not profile ID
  isBlockedByActor,
  resolveActorId,
  blockByActor,
  unblockByActor,
} = useMyBlocks();


  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [results, setResults] = useState([]);

  const tRef = useRef(null);
  const debounceMs = 300;

  const canSearch = useMemo(() => q.trim().length > 0, [q]);

  async function runSearch(term) {
    const needle = (term || '').trim().replace(/^@/, '');

    if (!needle) {
      setResults([]);
      setErr('');
      setMsg('');
      return;
    }

    setLoading(true);
    setErr('');
    setMsg('');

    try {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, username, display_name, photo_url')
        .or(`username.ilike.%${needle}%,display_name.ilike.%${needle}%`)
        .limit(10);

      const profileRows = (profs || [])
        .filter(r => r.id !== me)
        .map(r => ({
          id: r.id,
          display_name: r.display_name || r.username || 'Unknown',
          username: r.username,
          photo_url: r.photo_url || '/avatar.jpg',
          type: 'profile',
          mutating: false,
        }));

      const { data: vps } = await supabase
        .schema('vc')
        .from('vports')
        .select('id, name, slug, avatar_url')
        .or(`name.ilike.%${needle}%,slug.ilike.%${needle}%`)
        .limit(10);

      const vportRows = (vps || []).map(v => ({
        id: v.id,
        display_name: v.name || v.slug || 'Unknown',
        username: v.slug,
        photo_url: v.avatar_url || '/avatar.jpg',
        type: 'vport',
        mutating: false,
      }));

      const merged = [...profileRows, ...vportRows];

      if (merged.length === 0) {
        setResults([]);
        setErr('No users or vports found.');
        return;
      }

      // Resolve actorIds for each search result
      const withActorIds = [];
      for (const item of merged) {
        const actorId = await resolveActorId(item.id, item.type);
        withActorIds.push({ ...item, actorId });
      }

      setResults(withActorIds);
    } catch (e) {
      setErr(e.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!canSearch) return;

    if (tRef.current) clearTimeout(tRef.current);
    runSearch(q);
  }

  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      setErr('');
      setMsg('');
      return;
    }

    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => runSearch(q), debounceMs);

    return () => clearTimeout(tRef.current);
  }, [q]);

  async function toggleBlock(res, toBlock) {
    if (!me) return;

    setResults(prev =>
      prev.map(r => (r.actorId === res.actorId ? { ...r, mutating: true } : r))
    );

    const action = toBlock ? blockByActor : unblockByActor;
    const ok = await action(res.actorId);

    setResults(prev =>
      prev.map(r => (r.actorId === res.actorId ? { ...r, mutating: false } : r))
    );

    if (ok) setMsg(toBlock ? 'Blocked.' : 'Unblocked.');
  }

  return (
    <div className="space-y-3 text-white">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by @username / display name / vport"
          className="flex-1 rounded-lg bg-white text-black border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={!canSearch || loading}
          className="px-3 py-2 rounded-lg bg-red-600 text-white"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {err && <div className="text-xs text-amber-300">{err}</div>}
      {msg && !err && <div className="text-xs text-green-300">{msg}</div>}

      {results.length > 0 && (
        <ul className="divide-y divide-zinc-800 rounded-xl bg-neutral-900/40">
          {results.map((u) => {
            const blocked = isBlockedByActor(u.actorId);

            return (
              <li key={u.actorId} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={u.photo_url}
                    alt={u.display_name}
                    className="w-10 h-10 rounded-md object-cover"
                  />

                  <div>
                    <div className="text-sm font-medium">{u.display_name}</div>

                    {u.type === 'vport' && (
                      <div className="text-[10px] text-purple-300 uppercase">
                        VPORT
                      </div>
                    )}
                  </div>
                </div>

                {blocked ? (
                  <button
                    onClick={() => toggleBlock(u, false)}
                    disabled={u.mutating}
                    className="px-3 py-2 rounded-lg bg-purple-600"
                  >
                    {u.mutating ? 'Working…' : 'Unblock'}
                  </button>
                ) : (
                  <button
                    onClick={() => toggleBlock(u, true)}
                    disabled={u.mutating}
                    className="px-3 py-2 rounded-lg bg-red-600"
                  >
                    {u.mutating ? 'Working…' : 'Block'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
