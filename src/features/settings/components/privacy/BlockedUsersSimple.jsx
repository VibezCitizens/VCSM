// src/features/settings/components/privacy/BlockedUsersSimple.jsx
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';   // keep as-is if default export: `import supabase from ...`
import { vc } from '@/lib/vcClient';
import { useIdentity } from '@/state/identityContext';

const DBG = false;
const log = (...a) => DBG && console.debug('[BlockedUsersSimple]', ...a);

/**
 * Lists blocks created by the CURRENT persona actor (identity.actorId).
 * Hydrates USER + VPORT targets. UI is minimal: square avatar, name, Unblock.
 */
export default function BlockedUsersSimple() {
  const { identity } = useIdentity();
  const actorId = identity?.actorId || null;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);      // raw vc.user_blocks rows
  const [cards, setCards] = useState([]);    // hydrated rows for rendering
  const [err, setErr] = useState('');

  // 1) Load blocks for this persona actor
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        if (!actorId) {
          if (alive) { setRows([]); setLoading(false); }
          return;
        }
        const { data, error } = await vc
          .from('user_blocks')
          .select('id, blocker_actor_id, blocked_actor_id, created_at')
          .eq('blocker_actor_id', actorId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (alive) setRows(data || []);
      } catch (e) {
        log('load blocks error', e);
        if (alive) {
          setErr(e?.message || 'Failed to load blocked users.');
          setRows([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [actorId]);

  // 2) Hydrate blocked_actor_id → title + avatar
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!rows.length) { if (alive) setCards([]); return; }

        const actorIds = Array.from(new Set(rows.map(r => r.blocked_actor_id)));

        const { data: actors, error: aErr } = await vc
          .from('actors')
          .select('id, kind, profile_id, vport_id')
          .in('id', actorIds);
        if (aErr) throw aErr;

        const profileIds = actors.filter(a => a.profile_id).map(a => a.profile_id);
        const vportIds   = actors.filter(a => a.vport_id).map(a => a.vport_id);

        const [profilesRes, vportsRes] = await Promise.all([
          profileIds.length
            ? supabase.from('profiles')
                .select('id, display_name, username, photo_url')
                .in('id', profileIds)
            : Promise.resolve({ data: [] }),
          vportIds.length
            ? vc.from('vports')
                .select('id, name, slug, avatar_url')
                .in('id', vportIds)
            : Promise.resolve({ data: [] }),
        ]);
        if (profilesRes.error) throw profilesRes.error;
        if (vportsRes.error) throw vportsRes.error;

        const profMap  = new Map((profilesRes.data || []).map(p => [p.id, p]));
        const vportMap = new Map((vportsRes.data || []).map(v => [v.id, v]));
        const actorMap = new Map(actors.map(a => [a.id, a]));

        const hydrated = rows.map(r => {
          const a = actorMap.get(r.blocked_actor_id);
          if (!a) {
            return {
              actorId: r.blocked_actor_id,
              title: 'Unknown',
              avatarUrl: '/avatar.jpg',
              createdAt: r.created_at,
            };
          }
          if (a.profile_id) {
            const p = profMap.get(a.profile_id);
            return {
              actorId: a.id,
              title: p?.display_name || p?.username || 'Unknown',
              avatarUrl: p?.photo_url || '/avatar.jpg',
              createdAt: r.created_at,
            };
          }
          if (a.vport_id) {
            const v = vportMap.get(a.vport_id);
            return {
              actorId: a.id,
              title: v?.name || v?.slug || 'Untitled VPORT',
              avatarUrl: v?.avatar_url || '/avatar.jpg',
              createdAt: r.created_at,
            };
          }
          return {
            actorId: a.id,
            title: 'Unknown',
            avatarUrl: '/avatar.jpg',
            createdAt: r.created_at,
          };
        });

        if (alive) setCards(hydrated);
      } catch (e) {
        log('hydrate error', e);
        if (alive) {
          setErr(e?.message || 'Failed to load blocked identities.');
          setCards([]);
        }
      }
    })();
    return () => { alive = false; };
  }, [rows]);

  // 3) Unblock
  const onUnblock = useCallback(
    async (blockedActorId) => {
      if (!actorId || !blockedActorId) return;
      try {
        const { error } = await vc
          .from('user_blocks')
          .delete()
          .match({ blocker_actor_id: actorId, blocked_actor_id: blockedActorId });
        if (error) throw error;

        // Optimistic update
        setRows(prev => prev.filter(r => r.blocked_actor_id !== blockedActorId));
        setCards(prev => prev.filter(c => c.actorId !== blockedActorId));
      } catch (e) {
        setErr(e?.message || 'Unblock failed.');
      }
    },
    [actorId]
  );

  // ---- UI (minimal) ----
  if (!actorId) return <div className="text-xs text-zinc-500">Preparing your persona…</div>;
  if (loading)   return <div className="text-xs text-zinc-400">Loading blocked users…</div>;
  if (!cards.length) return <div className="text-xs text-zinc-500">No blocked users.</div>;

  return (
    <div className="space-y-2">
      {err && <div className="text-xs text-amber-300">{err}</div>}
      <ul className="rounded-xl overflow-hidden bg-neutral-900/40 divide-y divide-zinc-800">
        {cards.map(c => (
          <li key={c.actorId} className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* square picture */}
              <img
                src={c.avatarUrl}
                alt={c.title}
                className="w-14 h-14 rounded-md object-cover flex-shrink-0"
                loading="lazy"
              />
              {/* name only */}
              <div className="min-w-0">
                <div className="text-sm font-medium truncate text-white">{c.title}</div>
              </div>
            </div>

            {/* Unblock button only */}
            <button
              onClick={() => onUnblock(c.actorId)}
              className="px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-sm flex-shrink-0"
              aria-label={`Unblock ${c.title}`}
            >
              Unblock
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
