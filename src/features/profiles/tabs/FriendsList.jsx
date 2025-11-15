// src/features/profile/FriendsList.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

  // hydrated entries (users + vports)
  const [mutuals, setMutuals] = useState([]);
  const [fans, setFans] = useState([]);
  const [imAFan, setImAFan] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  // relative navigation from the current profile route
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

      const followingActorIds = (following.data || []).map(
        (r) => r.followed_actor_id,
      );
      const followerActorIds = (followers.data || []).map(
        (r) => r.follower_actor_id,
      );

      const followingSet = new Set(followingActorIds);
      const followerSet = new Set(followerActorIds);

      const mutualActorIds = followingActorIds.filter((id) =>
        followerSet.has(id),
      );
      const onlyIFollowActor = followingActorIds.filter(
        (id) => !followerSet.has(id),
      );
      const onlyTheyFollowActor = followerActorIds.filter(
        (id) => !followingSet.has(id),
      );

      return {
        mutualActorIds: Array.from(new Set(mutualActorIds)),
        imAFanActorIds: Array.from(new Set(onlyIFollowActor)),
        fansActorIds: Array.from(new Set(onlyTheyFollowActor)),
      };
    }

    async function hydrateActorEntriesByBucket({
      mutualActorIds,
      imAFanActorIds,
      fansActorIds,
    }) {
      const allActorIds = Array.from(
        new Set([...mutualActorIds, ...imAFanActorIds, ...fansActorIds]),
      );

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

      const buildEntries = (actorIdList) =>
        actorIdList
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

      const sortEntriesByName = (entries) =>
        [...entries].sort((a, b) => {
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

      const mutualEntries = sortEntriesByName(buildEntries(mutualActorIds));
      const imAFanEntries = sortEntriesByName(buildEntries(imAFanActorIds));
      const fansEntries = sortEntriesByName(buildEntries(fansActorIds));

      return {
        mutualEntries,
        imAFanEntries,
        fansEntries,
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

        const sets = await computeSetsFromActorFollows(ownerActorId);

        const {
          mutualEntries,
          imAFanEntries,
          fansEntries,
        } = await hydrateActorEntriesByBucket(sets);

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

  // 🔥 Only show top 10 when viewing another user’s profile
  const visibleMutuals = isMe ? mutuals : mutuals.slice(0, 10);
  const visibleFans = isMe ? fans : fans.slice(0, 10);
  const visibleImAFan = isMe ? imAFan : imAFan.slice(0, 10);

  const mutualSample = useMemo(() => sampleArray(visibleMutuals, 3), [visibleMutuals]);
  const fansSample = useMemo(() => sampleArray(visibleFans, 3), [visibleFans]);
  const imAFanSample = useMemo(() => sampleArray(visibleImAFan, 3), [visibleImAFan]);

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

  const nothing =
    !visibleMutuals.length && !visibleFans.length && !visibleImAFan.length;

  if (nothing) {
    return <p className="text-center text-neutral-500">No connections yet.</p>;
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
        showUsername={false}
      />
    );
  };

  const sectionButtonClasses =
    'text-xs text-neutral-400 hover:text-white underline-offset-2 hover:underline';

  return (
    <div className="space-y-6">
      {/* Friends (mutuals) */}
      {visibleMutuals.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-neutral-300">Friends</h3>
          <div className="space-y-3">
            {mutualSample.map((entry) => renderEntry(entry))}
          </div>
          <div className="mt-1 flex justify-end">
            <button
              type="button"
              onClick={goMutualList}
              className={sectionButtonClasses}
            >
              View list
            </button>
          </div>
        </section>
      )}

      {/* Fans */}
      {visibleFans.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-neutral-300">Fans</h3>
          <div className="space-y-3">
            {fansSample.map((entry) => renderEntry(entry))}
          </div>
          <div className="mt-1 flex justify-end">
            <button
              type="button"
              onClick={goFansList}
              className={sectionButtonClasses}
            >
              View list
            </button>
          </div>
        </section>
      )}

      {/* I follow them */}
      {visibleImAFan.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-neutral-300">I’m a fan</h3>
          <div className="space-y-3">
            {imAFanSample.map((entry) => renderEntry(entry))}
          </div>
          <div className="mt-1 flex justify-end">
            <button
              type="button"
              onClick={goImAFanList}
              className={sectionButtonClasses}
            >
              View list
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
