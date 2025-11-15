// src/features/profiles/tabs/RankedFriendsPublic.jsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import UserLink from '@/components/UserLink';

const isUndefinedTable = (err) =>
  String(err?.code) === '42P01' || /does not exist/i.test(String(err?.message || ''));

// Resolve vc.actors.id for a given public.profiles.id
async function getOwnerActorId(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .schema('vc')
    .from('actor_owners')
    .select('actor_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[RankedFriendsPublic] failed to resolve actor_id', error);
    return null;
  }
  return data?.actor_id ?? null;
}

/**
 * Public-only list: "Top Friends" (Instagram-style).
 *
 * 1) Try vc.friend_ranks(owner_actor_id, friend_actor_id, rank) → public read.
 * 2) If no ranks, fall back to mutuals from vc.actor_follows (actor-based).
 * 3) Hydrate vc.actors → profiles/vports and render.
 */
export default function RankedFriendsPublic({ userId }) {
  const [loading, setLoading] = useState(true);
  const [topFriends, setTopFriends] = useState([]); // [{ kind, actorId, profile?, vport? }]

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!userId) {
        setTopFriends([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 0) Resolve actor for this profile owner
        const ownerActorId = await getOwnerActorId(userId);
        if (!ownerActorId) {
          if (!cancelled) setTopFriends([]);
          return;
        }

        // 1) Try to load explicit ranking from vc.friend_ranks
        let rankedActorIds = [];
        let hasRankingTable = true;

        try {
          const { data: ranks, error } = await supabase
            .schema('vc')
            .from('friend_ranks')
            .select('friend_actor_id, rank')
            .eq('owner_actor_id', ownerActorId)
            .order('rank', { ascending: true })
            .limit(10);

          if (error) throw error;
          rankedActorIds = (ranks || []).map((r) => r.friend_actor_id);
        } catch (e) {
          if (isUndefinedTable(e)) {
            hasRankingTable = false;
            rankedActorIds = [];
          } else {
            throw e;
          }
        }

        let finalActorIds = rankedActorIds;

        // 2) If no explicit ranking, fall back to mutuals via vc.actor_follows
        if (!finalActorIds.length) {
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

          const followingIds = (following.data || []).map((r) => r.followed_actor_id);
          const followerIds = (followers.data || []).map((r) => r.follower_actor_id);

          const followerSet = new Set(followerIds);
          const mutualActorIds = Array.from(
            new Set(followingIds.filter((id) => followerSet.has(id))),
          );

          finalActorIds = mutualActorIds.slice(0, 50); // hydrate some for alpha sort
        }

        if (!finalActorIds.length) {
          if (!cancelled) setTopFriends([]);
          return;
        }

        // 3) Hydrate vc.actors for those ids
        const { data: actorRows, error: actorsError } = await supabase
          .schema('vc')
          .from('actors')
          .select('id, kind, profile_id, vport_id')
          .in('id', finalActorIds);

        if (actorsError) throw actorsError;

        const actorsById = Object.fromEntries((actorRows || []).map((a) => [a.id, a]));

        const profileIds = (actorRows || [])
          .filter((a) => a.kind === 'user' && a.profile_id)
          .map((a) => a.profile_id);

        const vportIds = (actorRows || [])
          .filter((a) => a.kind === 'vport' && a.vport_id)
          .map((a) => a.vport_id);

        // 4) Hydrate profiles + vports
        const [
          { data: profilesData, error: profilesError },
          { data: vportsData, error: vportsError },
        ] = await Promise.all([
          profileIds.length
            ? supabase
                .from('profiles')
                .select('id, username, display_name, photo_url')
                .in('id', profileIds)
            : Promise.resolve({ data: [], error: null }),
          vportIds.length
            ? supabase
                .schema('vc')
                .from('vports')
                .select('id, name, slug, avatar_url')
                .in('id', vportIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (profilesError) throw profilesError;
        if (vportsError) throw vportsError;

        const profilesById = Object.fromEntries((profilesData || []).map((p) => [p.id, p]));
        const vportsById = Object.fromEntries((vportsData || []).map((v) => [v.id, v]));

        // 5) Build entries list preserving actor type
        let entries = finalActorIds
          .map((actorId) => {
            const actor = actorsById[actorId];
            if (!actor) return null;

            if (actor.kind === 'user' && actor.profile_id) {
              const profile = profilesById[actor.profile_id];
              if (!profile) return null;
              return {
                kind: 'user',
                actorId,
                profileId: profile.id,
                profile,
              };
            }

            if (actor.kind === 'vport' && actor.vport_id) {
              const vport = vportsById[actor.vport_id];
              if (!vport) return null;
              return {
                kind: 'vport',
                actorId,
                vportId: vport.id,
                vport,
              };
            }

            return null;
          })
          .filter(Boolean);

        // 6) Sort:
        //    - If we have an explicit ranking (and table exists), keep rank order
        //    - Else alphabetical
        if (rankedActorIds.length > 0 && hasRankingTable) {
          const order = new Map(rankedActorIds.map((id, i) => [id, i]));
          entries.sort(
            (a, b) =>
              (order.get(a.actorId) ?? Number.POSITIVE_INFINITY) -
              (order.get(b.actorId) ?? Number.POSITIVE_INFINITY),
          );
        } else {
          entries.sort((a, b) => {
            const nameA =
              a.kind === 'user'
                ? (a.profile.display_name || a.profile.username || '').toLowerCase()
                : (a.vport.name || a.vport.slug || '').toLowerCase();
            const nameB =
              b.kind === 'user'
                ? (b.profile.display_name || b.profile.username || '').toLowerCase()
                : (b.vport.name || b.vport.slug || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
        }

        entries = entries.slice(0, 10);

        if (!cancelled) setTopFriends(entries);
      } catch (err) {
        console.error('RankedFriendsPublic load error:', err);
        if (!cancelled) setTopFriends([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return <p className="text-center text-neutral-500">Loading friends…</p>;
  }

  if (!topFriends.length) {
    return <p className="text-center text-neutral-500">No friends to show.</p>;
  }

  const renderEntry = (entry) => {
    if (entry.kind === 'user') {
      return (
        <UserLink
          key={`user-${entry.profileId}`}
          user={entry.profile}
          className="min-w-0 flex-1"
          avatarSize="w-10 h-10"
          avatarShape="rounded-md"
          textSize="text-base"
          showUsername
        />
      );
    }

    // vport branch now uses UserLink → clickable
    return (
      <UserLink
        key={`vport-${entry.vportId}`}
        user={entry.vport}
        authorType="vport"
        className="min-w-0 flex-1"
        avatarSize="w-10 h-10"
        avatarShape="rounded-md"
        textSize="text-base"
        showUsername={false}
      />
    );
  };

  return (
    <div className="space-y-3">
      {topFriends.map((entry) => renderEntry(entry))}
    </div>
  );
}
