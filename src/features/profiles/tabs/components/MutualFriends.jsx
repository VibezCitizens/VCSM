// src/features/profile/MutualFriends.jsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useIdentity } from '@/state/identityContext';
import UserLink from '@/components/UserLink';
import BackButton from '@/ui/components/Backbutton';

export default function MutualFriends() {
  const { identity } = useIdentity();
  const myActorId = identity?.actorId;

  const [loading, setLoading] = useState(true);
  const [mutuals, setMutuals] = useState([]);

  useEffect(() => {
    if (!myActorId) return;

    let cancelled = false;

    async function computeMutualActorIds(ownerActorId) {
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

      const followingActorIds = (following.data || []).map(
        (r) => r.followed_actor_id,
      );
      const followerActorIds = (followers.data || []).map(
        (r) => r.follower_actor_id,
      );

      // mutuals = I follow them AND they follow me
      const followerSet = new Set(followerActorIds);
      const mutualActorIds = followingActorIds.filter((id) =>
        followerSet.has(id),
      );

      return Array.from(new Set(mutualActorIds));
    }

    async function hydrateMutuals(mutualActorIds) {
      if (!mutualActorIds.length) return [];

      const { data: actorRows, error: actorsError } = await supabase
        .schema('vc')
        .from('actors')
        .select('id, kind, profile_id, vport_id')
        .in('id', mutualActorIds);

      if (actorsError) throw actorsError;

      const actorsById = Object.fromEntries(
        (actorRows || []).map((a) => [a.id, a]),
      );

      const profileIds = (actorRows || [])
        .filter((a) => a.kind === 'user' && a.profile_id)
        .map((a) => a.profile_id);

      const vportIds = (actorRows || [])
        .filter((a) => a.kind === 'vport' && a.vport_id)
        .map((a) => a.vport_id);

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

      const profilesById = Object.fromEntries(
        (profilesData || []).map((p) => [p.id, p]),
      );
      const vportsById = Object.fromEntries(
        (vportsData || []).map((v) => [v.id, v]),
      );

      const entries = mutualActorIds
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

      const sortEntriesByName = (items) =>
        [...items].sort((a, b) => {
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

      return sortEntriesByName(entries);
    }

    (async () => {
      setLoading(true);
      try {
        const mutualActorIds = await computeMutualActorIds(myActorId);
        const mutualEntries = await hydrateMutuals(mutualActorIds);

        if (cancelled) return;
        setMutuals(mutualEntries);
      } catch (err) {
        console.error('MutualFriends load error:', err);
        if (!cancelled) setMutuals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [myActorId]);

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
    <div className="p-4 space-y-4">
      <BackButton />
      <h1 className="text-xl font-bold">Friends</h1>

      {!myActorId && (
        <p className="text-neutral-500">Actor is not ready yet.</p>
      )}

      {myActorId && loading && (
        <p className="text-neutral-500">Loading mutual friends…</p>
      )}

      {myActorId && !loading && mutuals.length === 0 && (
        <p className="text-neutral-500">No mutual friends found.</p>
      )}

      {myActorId && !loading && mutuals.length > 0 && (
        <div className="space-y-3">
          {mutuals.map((entry) => renderEntry(entry))}
        </div>
      )}
    </div>
  );
}
