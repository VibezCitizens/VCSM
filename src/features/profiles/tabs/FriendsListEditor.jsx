// src/features/profile/FriendsListEditor.jsx
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import SortableFriend from "@/features/profiles/tabs/components/SortableFriend";


import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

const isUndefinedTable = (err) =>
  String(err?.code) === '42P01' ||
  /does not exist/i.test(String(err?.message || ''));

/**
 * Editor that shows mutual friends (mutual follows) and lets you reorder.
 * If the optional table `public.friend_ranks` is not present, we still render,
 * but we won’t persist drag order.
 */
export default function FriendsListEditor({ userId }) {
  const [items, setItems] = useState([]);       // [{id, username, display_name, photo_url, _rank?}]
  const [loading, setLoading] = useState(true);
  const [ranksAvailable, setRanksAvailable] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // get following (active only)
      const [following, followers] = await Promise.all([
        supabase.from('followers').select('followed_id').eq('follower_id', userId).eq('is_active', true),
        supabase.from('followers').select('follower_id').eq('followed_id', userId).eq('is_active', true),
      ]);
      if (following.error) throw following.error;
      if (followers.error) throw followers.error;

      const followingIds = (following.data || []).map((r) => r.followed_id);
      const followerIds  = (followers.data  || []).map((r) => r.follower_id);
      const setFollowers = new Set(followerIds);
      const mutualIds = Array.from(new Set(followingIds.filter((id) => setFollowers.has(id))));

      if (mutualIds.length === 0) {
        setItems([]);
        return;
      }

      // try to fetch ranks (optional table)
      let rankMap = {};
      try {
        const { data: ranks, error: rankErr } = await supabase
          .from('friend_ranks')
          .select('friend_id, rank')
          .eq('owner_id', userId)
          .in('friend_id', mutualIds);
        if (rankErr) throw rankErr;
        (ranks || []).forEach((r) => { rankMap[r.friend_id] = r.rank; });
        setRanksAvailable(true);
      } catch (e) {
        if (isUndefinedTable(e)) {
          setRanksAvailable(false);
          rankMap = {};
        } else {
          throw e;
        }
      }

      // fetch profiles for mutuals
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, username, display_name, photo_url')
        .in('id', mutualIds);
      if (pErr) throw pErr;

      const decorated = (profiles || []).map((p) => ({
        ...p,
        _rank: Number.isFinite(rankMap[p.id]) ? rankMap[p.id] : null,
      }));

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
      // keep the UI usable even if ranking table is missing
      if (isUndefinedTable(err)) setRanksAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const onDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const newOrder = arrayMove(items, oldIndex, newIndex);
    setItems(newOrder);

    // persist ranks only if table exists
    if (!ranksAvailable) return;
    try {
      const upserts = newOrder.map((f, i) => ({
        owner_id: userId,
        friend_id: f.id,
        rank: i,
      }));
      const { error } = await supabase
        .from('friend_ranks')
        .upsert(upserts, { onConflict: ['owner_id', 'friend_id'] });
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
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((f) => <SortableFriend key={f.id} friend={f} />)}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}
