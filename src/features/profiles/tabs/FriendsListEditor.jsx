// src/features/profiles/tabs/FriendsListEditor.jsx
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import SortableFriend from '@/features/profiles/tabs/components/SortableFriend';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

const isUndefinedTable = (err) =>
  String(err?.code) === '42P01' || /does not exist/i.test(String(err?.message || ''));

// resolve actor_id for a given user_id (public.profiles.id)
async function getActorIdForUser(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .schema('vc')
    .from('actor_owners')
    .select('actor_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[FriendsListEditor] failed to resolve actor_id', error);
    return null;
  }
  return data?.actor_id ?? null;
}

/**
 * Editor that shows mutual friends (mutual follows) and lets you reorder.
 * If the optional table `friend_ranks` is not present, we still render,
 * but we won’t persist drag order.
 *
 * NOTE: input prop remains userId (profile/user id). Internally we map to actor_id.
 */
export default function FriendsListEditor({ userId }) {
  const [items, setItems] = useState([]);       // [{id, username, display_name, photo_url, _rank?, _actor_id}]
  const [loading, setLoading] = useState(true);
  const [ranksAvailable, setRanksAvailable] = useState(true);
  const [ownerActorId, setOwnerActorId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const aId = await getActorIdForUser(userId);
      if (!cancelled) setOwnerActorId(aId);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const load = useCallback(async () => {
    if (!ownerActorId) return;
    setLoading(true);
    try {
      // get following/followers (active only) from vc.actor_follows (actor-based)
      const [following, followers] = await Promise.all([
        supabase
          .schema('vc')
          .from('actor_follows')
          .select('followed_actor_id')
          .eq('follower_actor_id', ownerActorId)
          .eq('is_active', true),

        supabase
          .schema('vc')
          .from('actor_follows')
          .select('follower_actor_id')
          .eq('followed_actor_id', ownerActorId)
          .eq('is_active', true),
      ]);
      if (following.error) throw following.error;
      if (followers.error) throw followers.error;

      const followingIds = (following.data || []).map(r => r.followed_actor_id);
      const followerIds  = (followers.data  || []).map(r => r.follower_actor_id);
      const followerSet  = new Set(followerIds);
      const mutualActorIds = Array.from(new Set(followingIds.filter(id => followerSet.has(id))));

      if (mutualActorIds.length === 0) {
        setItems([]);
        return;
      }

      // optional friend_ranks (actor-based)
      let rankMap = {};
      try {
        const { data: ranks, error: rankErr } = await supabase
          .schema('vc')
          .from('friend_ranks') // optional
          .select('friend_actor_id, rank')
          .eq('owner_actor_id', ownerActorId)
          .in('friend_actor_id', mutualActorIds);
        if (rankErr) throw rankErr;
        (ranks || []).forEach(r => { rankMap[r.friend_actor_id] = r.rank; });
        setRanksAvailable(true);
      } catch (e) {
        if (isUndefinedTable(e)) {
          setRanksAvailable(false);
          rankMap = {};
        } else {
          throw e;
        }
      }

      // map actor -> profile
      const { data: actorRows, error: aErr } = await supabase
        .schema('vc')
        .from('actors')
        .select('id, profile_id')
        .in('id', mutualActorIds);
      if (aErr) throw aErr;

      const profileIds = (actorRows || []).map(r => r.profile_id).filter(Boolean);
      const actorByProfile = {};
      (actorRows || []).forEach(r => { if (r.profile_id) actorByProfile[r.profile_id] = r.id; });

      // fetch public profiles
      const { data: profiles, error: pErr } = await supabase
        .from('profiles') // public.profiles
        .select('id, username, display_name, photo_url')
        .in('id', profileIds);
      if (pErr) throw pErr;

      const decorated = (profiles || []).map(p => {
        const friendActorId = actorByProfile[p.id];
        return {
          ...p,
          _actor_id: friendActorId,
          _rank: Number.isFinite(rankMap[friendActorId]) ? rankMap[friendActorId] : null,
        };
      });

      // sort: ranked first (asc), then alphabetical
      decorated.sort((a, b) => {
        const ra = a._rank, rb = b._rank;
        if (ra != null && rb != null) return ra - rb;
        if (ra != null) return -1;
        if (rb != null) return 1;
        const an = (a.display_name || a.username || '').toLowerCase();
        const bn = (b.display_name || b.username || '').toLowerCase();
        return an.localeCompare(bn);
      });

      setItems(decorated);
    } catch (err) {
      console.error('Failed to load friends', err);
      setItems([]);
      if (isUndefinedTable(err)) setRanksAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [ownerActorId]);

  useEffect(() => { load(); }, [load]);

  const onDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    const newOrder = arrayMove(items, oldIndex, newIndex);
    setItems(newOrder);

    if (!ranksAvailable || !ownerActorId) return;

    try {
      // ✅ keep only top 10 and make rank 1–10 (matches CHECK constraint)
      const limited = newOrder.slice(0, 10);
      const upserts = limited.map((f, i) => ({
        owner_actor_id: ownerActorId,
        friend_actor_id: f._actor_id,
        rank: i + 1, // <-- 1-based rank
      }));

      const { error } = await supabase
        .schema('vc')
        .from('friend_ranks')
        .upsert(upserts, { onConflict: ['owner_actor_id', 'friend_actor_id'] });

      if (error) {
        if (isUndefinedTable(error)) {
          setRanksAvailable(false);
        } else {
          throw error;
        }
      }
    } catch (e) {
      console.error(e);
      toast.error(e?.message || 'Failed to save order');
    }
  };

  if (loading) return <p className="text-center text-neutral-500">Loading friends…</p>;
  if (items.length === 0) return <p className="text-center text-neutral-500">No mutual friends yet.</p>;

  return (
    <>
      {!ranksAvailable && (
        <p className="text-xs text-neutral-500 mb-2">
          Reordering works locally, but won’t be saved (ranking table not installed).
        </p>
      )}
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map(f => <SortableFriend key={f.id} friend={f} />)}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}
