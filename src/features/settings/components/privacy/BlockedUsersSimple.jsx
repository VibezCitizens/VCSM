// src/features/settings/components/privacy/BlockedUsersSimple.jsx
import { useMemo, useState } from 'react';
import { useMyBlocks } from './useMyBlocks';

export default function BlockedUsersSimple() {
  const { blocks, loading, error, unblock } = useMyBlocks();
  const [mutating, setMutating] = useState(new Set()); // ids being unblocked
  const [msg, setMsg] = useState('');

  const countLabel = useMemo(
    () => (loading ? 'Loading…' : `${blocks.length} blocked`),
    [loading, blocks.length]
  );

  async function handleUnblock(id) {
    if (!id) return;
    // prevent double-click on the same id
    if (mutating.has(id)) return;

    setMsg('');
    setMutating(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    const ok = await unblock(id);

    setMutating(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    if (ok) setMsg('User unblocked.');
  }

  return (
    <div className="text-white">
      <div className="text-xs text-zinc-400 mb-2" role="status" aria-live="polite">
        {countLabel}
      </div>

      {error && (
        <div className="text-xs text-amber-300 mb-2" aria-live="assertive">
          {error}
        </div>
      )}
      {msg && !error && (
        <div className="text-xs text-green-300 mb-2" aria-live="polite">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-zinc-400">Please wait…</div>
      ) : blocks.length === 0 ? (
        <div className="text-sm text-zinc-400">You haven’t blocked anyone.</div>
      ) : (
        <ul
          className="divide-y divide-zinc-800 rounded-xl overflow-hidden bg-neutral-900/40"
          aria-busy={mutating.size > 0 ? 'true' : 'false'}
        >
          {blocks.map((u) => {
            const isBusy = mutating.has(u.id);
            return (
              <li key={u.id} className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={u.photo_url || '/avatar.jpg'}
                    alt={u.display_name || u.username || 'avatar'}
                    className="w-8 h-8 rounded-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      if (e.currentTarget.src !== '/avatar.jpg') {
                        e.currentTarget.src = '/avatar.jpg';
                      }
                    }}
                  />
                  <div className="min-w-0">
                    <div className="text-sm truncate">
                      {u.display_name || u.username || 'Unknown'}
                    </div>
                    {u.username && (
                      <div className="text-xs text-zinc-400 truncate">@{u.username}</div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleUnblock(u.id)}
                  disabled={isBusy}
                  className="text-sm px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                  title="Unblock this user"
                >
                  {isBusy ? 'Working…' : 'Unblock'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
