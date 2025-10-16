// src/features/settings/components/privacy/UserLookup.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useMyBlocks } from './useMyBlocks';

export default function UserLookup() {
  const { uid: me, isBlocked, block, unblock } = useMyBlocks();

  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  // results: [{ id, username, display_name, photo_url, mutating }]
  const [results, setResults] = useState([]);

  // --- optional: debounce typing so we don't hammer the API
  const debounceMs = 300;
  const tRef = useRef(null);

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
      // Search username OR display_name (case-insensitive); exclude self
      const { data: profs, error: pErr } = await supabase
        .from('profiles')
        .select('id, username, display_name, photo_url')
        .or(`username.ilike.%${needle}%,display_name.ilike.%${needle}%`)
        .limit(10);

      if (pErr) throw pErr;

      const rows = (profs || []).filter(r => r.id !== me);
      if (rows.length === 0) {
        setResults([]);
        setErr('No users found.');
        return;
      }

      setResults(rows.map(r => ({ ...r, mutating: false })));
    } catch (e) {
      setResults([]);
      setErr(e?.message || 'Search failed.');
    } finally {
      setLoading(false);
    }
  }

  // instant search on submit (Enter / button)
  function onSubmit(e) {
    e.preventDefault();
    if (!canSearch) return;
    if (tRef.current) {
      clearTimeout(tRef.current);
      tRef.current = null;
    }
    runSearch(q);
  }

  // optional: live search (debounced) while typing
  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      setErr('');
      setMsg('');
      return;
    }
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => runSearch(q), debounceMs);
    return () => {
      if (tRef.current) clearTimeout(tRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function toggleBlock(targetId, toBlock) {
    if (!me || !targetId) return;
    setMsg('');
    setErr('');

    setResults(prev =>
      prev.map(r => (r.id === targetId ? { ...r, mutating: true } : r))
    );

    const ok = toBlock ? await block(targetId) : await unblock(targetId);

    setResults(prev =>
      prev.map(r => (r.id === targetId ? { ...r, mutating: false } : r))
    );

    if (!ok) return;
    setMsg(toBlock ? 'Blocked.' : 'Unblocked.');
  }

  return (
    <div className="space-y-3 text-white">
      {/* Search input */}
      <form onSubmit={onSubmit} className="flex gap-2" role="search">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by @username or display name"
          className="flex-1 rounded-lg bg-white text-black placeholder:text-zinc-500 border border-zinc-300 px-3 py-2 text-sm"
          aria-label="Search users by username or display name"
        />
        <button
          type="submit"
          disabled={!canSearch || loading}
          className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 text-sm"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {/* Status messages */}
      {err && <div className="text-xs text-amber-300">{err}</div>}
      {msg && !err && <div className="text-xs text-green-300">{msg}</div>}

      {/* Results */}
      {results.length > 0 && (
        <ul className="divide-y divide-zinc-800 rounded-xl overflow-hidden bg-neutral-900/40">
          {results.map((u) => {
            const blocked = isBlocked(u.id);
            return (
              <li key={u.id} className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={u.photo_url || '/avatar.jpg'}
                    alt={u.display_name || u.username || 'avatar'}
                    className="w-10 h-10 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {u.display_name || u.username || 'Unknown'}
                    </div>
                    {u.username && (
                      <div className="text-xs text-zinc-400 truncate">@{u.username}</div>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {blocked ? (
                    <button
                      onClick={() => toggleBlock(u.id, false)}
                      disabled={u.mutating || !me}
                      className="px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 text-sm"
                    >
                      {u.mutating ? 'Working…' : 'Unblock'}
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleBlock(u.id, true)}
                      disabled={u.mutating || !me}
                      className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 text-sm"
                      title={!me ? 'Sign in first' : 'Block this user'}
                    >
                      {u.mutating ? 'Working…' : 'Block'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
