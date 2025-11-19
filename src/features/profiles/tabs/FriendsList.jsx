// src/features/profiles/tabs/FriendsList.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import UserLink from '@/components/UserLink';
import { useIdentity } from '@/state/identityContext';

function sampleArray(arr, n) {
  if (!arr || arr.length <= n) return arr || [];
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export default function FriendsList({ userId, isPrivate = false }) {
  const { identity } = useIdentity();
  const isMe = identity?.user?.id === userId;

  const [loading, setLoading] = useState(true);

  const [mutuals, setMutuals] = useState([]);
  const [fans, setFans] = useState([]);
  const [imAFan, setImAFan] = useState([]);

  const navigate = useNavigate();

  const goFansList = () => navigate('fans');
  const goImAFanList = () => navigate('imafan');
  const goMutualList = () => navigate('mutual-friends');

  useEffect(() => {
    let cancelled = false;

    async function getOwnerActorId(uId) {
      if (!uId) return null;
      const { data, error } = await supabase
        .schema('vc')
        .from('actor_owners')
        .select('actor_id')
        .eq('user_id', uId)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data?.actor_id ?? null;
    }

    async function getBlockedActorIds(actorId) {
  if (!actorId) return new Set();

  const { data, error } = await supabase
    .schema('vc')
    .from('user_blocks')
    .select('blocker_actor_id, blocked_actor_id')
    .or(`blocker_actor_id.eq.${actorId},blocked_actor_id.eq.${actorId}`);

  if (error) {
    console.error('Block load error:', error);
    return new Set();
  }

  const blocked = new Set();

  for (const row of data || []) {
    // If YOU are the blocker, hide the blocked actor
    if (row.blocker_actor_id === actorId) {
      blocked.add(row.blocked_actor_id);
    }

    // If YOU are blocked by someone, hide the blocker actor
    if (row.blocked_actor_id === actorId) {
      blocked.add(row.blocker_actor_id);
    }
  }

  return blocked;
}


    async function computeSetsFromActorFollows(ownerActorId) {
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

      const followingIds = following.data.map((r) => r.followed_actor_id);
      const followerIds = followers.data.map((r) => r.follower_actor_id);

      const followingSet = new Set(followingIds);
      const followerSet = new Set(followerIds);

      const mutualActorIds = followingIds.filter((id) => followerSet.has(id));
      const imAFanActorIds = followingIds.filter(
        (id) => !followerSet.has(id)
      );
      const fansActorIds = followerIds.filter(
        (id) => !followingSet.has(id)
      );

      return {
        mutualActorIds,
        imAFanActorIds,
        fansActorIds,
      };
    }

    async function hydrateActorEntriesByBucket({
      mutualActorIds,
      imAFanActorIds,
      fansActorIds,
      blockedSet,
    }) {
      const allActorIds = Array.from(
        new Set([
          ...mutualActorIds,
          ...imAFanActorIds,
          ...fansActorIds,
        ])
      ).filter((id) => !blockedSet.has(id));

      if (!allActorIds.length) {
        return {
          mutualEntries: [],
          imAFanEntries: [],
          fansEntries: [],
        };
      }

      const { data: actorRows, error: actorsError } = await supabase
        .schema('vc')
        .from('actors')
        .select('id, kind, profile_id, vport_id')
        .in('id', allActorIds);

      if (actorsError) throw actorsError;

      const actorsById = Object.fromEntries(
        actorRows.map((a) => [a.id, a])
      );

      const profileIds = actorRows
        .filter((a) => a.kind === 'user')
        .map((a) => a.profile_id);

      const vportIds = actorRows
        .filter((a) => a.kind === 'vport')
        .map((a) => a.vport_id);

      const [{ data: profilesData }, { data: vportsData }] = await Promise.all(
        [
          profileIds.length
            ? supabase
                .from('profiles')
                .select('id, username, display_name, photo_url')
                .in('id', profileIds)
            : { data: [] },

          vportIds.length
            ? supabase
                .schema('vc')
                .from('vports')
                .select('id, name, slug, bio, avatar_url')
                .in('id', vportIds)
            : { data: [] },
        ]
      );

      const profilesById = Object.fromEntries(
        profilesData.map((p) => [p.id, p])
      );
      const vportsById = Object.fromEntries(
        vportsData.map((v) => [v.id, v])
      );

      const buildEntries = (ids) =>
        ids
          .filter((i) => !blockedSet.has(i))
          .map((actorId) => {
            const actor = actorsById[actorId];
            if (!actor) return null;

            if (actor.kind === 'user') {
              const p = profilesById[actor.profile_id];
              return p
                ? {
                    kind: 'user',
                    actorId,
                    profile: p,
                    profileId: p.id,
                  }
                : null;
            }

            if (actor.kind === 'vport') {
              const v = vportsById[actor.vport_id];
              return v
                ? {
                    kind: 'vport',
                    actorId,
                    vport: v,
                    vportId: v.id,
                  }
                : null;
            }

            return null;
          })
          .filter(Boolean);

      const sortByName = (entries) =>
        [...entries].sort((a, b) => {
          const nameA =
            a.kind === 'user'
              ? (a.profile.display_name ||
                  a.profile.username ||
                  '')
                  .toLowerCase()
              : (a.vport.name || '').toLowerCase();
          const nameB =
            b.kind === 'user'
              ? (b.profile.display_name ||
                  b.profile.username ||
                  '')
                  .toLowerCase()
              : (b.vport.name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });

      return {
        mutualEntries: sortByName(buildEntries(mutualActorIds)),
        imAFanEntries: sortByName(buildEntries(imAFanActorIds)),
        fansEntries: sortByName(buildEntries(fansActorIds)),
      };
    }

    (async () => {
      if (!userId) return;
      setLoading(true);

      try {
        const ownerActorId = await getOwnerActorId(userId);
        if (!ownerActorId) {
          if (!cancelled) {
            setMutuals([]);
            setImAFan([]);
            setFans([]);
          }
          return;
        }

        const blockedSet = await getBlockedActorIds(ownerActorId);

       const sets = await computeSetsFromActorFollows(ownerActorId);

sets.mutualActorIds = sets.mutualActorIds.filter(id => !blockedSet.has(id));
sets.imAFanActorIds = sets.imAFanActorIds.filter(id => !blockedSet.has(id));
sets.fansActorIds = sets.fansActorIds.filter(id => !blockedSet.has(id));


        const {
          mutualEntries,
          imAFanEntries,
          fansEntries,
        } = await hydrateActorEntriesByBucket({
          ...sets,
          blockedSet,
        });

        if (cancelled) return;

        setMutuals(mutualEntries);
        setImAFan(imAFanEntries);
        setFans(fansEntries);
      } catch (err) {
        console.error('FriendsList load error:', err);
        if (!cancelled) {
          setMutuals([]);
          setImAFan([]);
          setFans([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const visibleMutuals = isMe ? mutuals : mutuals.slice(0, 10);
  const visibleFans = isMe ? fans : fans.slice(0, 10);
  const visibleImAFan = isMe ? imAFan : imAFan.slice(0, 10);

  const mutualSample = useMemo(
    () => sampleArray(visibleMutuals, 3),
    [visibleMutuals]
  );
  const fansSample = useMemo(
    () => sampleArray(visibleFans, 3),
    [visibleFans]
  );
  const imAFanSample = useMemo(
    () => sampleArray(visibleImAFan, 3),
    [visibleImAFan]
  );

  if (loading) {
    return <p className="text-center text-neutral-500">Loading friends…</p>;
  }

  if (isPrivate) {
    return (
      <p className="text-center text-neutral-500">
        Friends are hidden for this private profile.
      </p>
    );
  }

  const none =
    !visibleMutuals.length &&
    !visibleFans.length &&
    !visibleImAFan.length;

  if (none) {
    return (
      <p className="text-center text-neutral-500">
        No connections yet.
      </p>
    );
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

    return (
      <UserLink
        key={`vport-${entry.vportId}`}
        user={entry.vport}
        authorType="vport"
        className="min-w-0 flex-1"
        avatarSize="w-10 h-10"
        avatarShape="rounded-md"
        textSize="text-base"
      />
    );
  };

  const sectionBtn =
    'text-xs text-neutral-400 hover:text-white underline-offset-2 hover:underline';

  return (
    <div className="space-y-6">
      {visibleMutuals.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-neutral-300">
            Friends
          </h3>
          <div className="space-y-3">
            {mutualSample.map(renderEntry)}
          </div>
          <div className="mt-1 flex justify-end">
            <button onClick={goMutualList} className={sectionBtn}>
              View list
            </button>
          </div>
        </section>
      )}

      {visibleFans.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-neutral-300">
            Fans
          </h3>
          <div className="space-y-3">
            {fansSample.map(renderEntry)}
          </div>
          <div className="mt-1 flex justify-end">
            <button onClick={goFansList} className={sectionBtn}>
              View list
            </button>
          </div>
        </section>
      )}

      {visibleImAFan.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-neutral-300">
            I'm a fan
          </h3>
          <div className="space-y-3">
            {imAFanSample.map(renderEntry)}
          </div>
          <div className="mt-1 flex justify-end">
            <button onClick={goImAFanList} className={sectionBtn}>
              View list
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
