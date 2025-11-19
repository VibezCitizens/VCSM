// src/features/profiles/tabs/components/MutualFriends.jsx

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useIdentity } from "@/state/identityContext";
import ProfileCard from "@/ui/Profile/ProfileCard";
import BackButton from "@/ui/components/Backbutton";

const PAGE_SIZE = 20;

export default function MutualFriends() {
  const { identity } = useIdentity();
  const myActorId = identity?.actorId;

  const [loading, setLoading] = useState(true);
  const [allMutuals, setAllMutuals] = useState([]);
  const [visibleMutuals, setVisibleMutuals] = useState([]);
  const [page, setPage] = useState(1);

  /** LOAD BLOCK RELATIONS  */
  async function loadBlockedRelations() {
    const { data, error } = await supabase
      .schema("vc")
      .from("user_blocks")
      .select("blocker_actor_id, blocked_actor_id")
      .or(
        `blocker_actor_id.eq.${myActorId},blocked_actor_id.eq.${myActorId}`
      );

    if (error) {
      console.error("[loadBlockedRelations] error", error);
      return new Set();
    }

    const blockedSet = new Set();

    for (const row of data || []) {
      if (row.blocker_actor_id === myActorId) {
        blockedSet.add(row.blocked_actor_id);
      }
      if (row.blocked_actor_id === myActorId) {
        blockedSet.add(row.blocker_actor_id);
      }
    }

    return blockedSet;
  }

  /** MUTUAL CALCULATION */
  async function computeMutualActorIds(ownerActorId) {
    const [following, followers] = await Promise.all([
      supabase
        .schema("vc")
        .from("actor_follows")
        .select("followed_actor_id")
        .eq("follower_actor_id", ownerActorId)
        .eq("is_active", true),

      supabase
        .schema("vc")
        .from("actor_follows")
        .select("follower_actor_id")
        .eq("followed_actor_id", ownerActorId)
        .eq("is_active", true),
    ]);

    if (following.error) throw following.error;
    if (followers.error) throw followers.error;

    const followingIds = (following.data || []).map((r) => r.followed_actor_id);
    const followerIds = (followers.data || []).map((r) => r.follower_actor_id);

    const followerSet = new Set(followerIds);
    const mutual = followingIds.filter((id) => followerSet.has(id));

    return Array.from(new Set(mutual));
  }

  /** GET SUBSCRIBER COUNT */
  async function getSubscriberCount(actorId) {
    const { count, error } = await supabase
      .schema("vc")
      .from("actor_follows")
      .select("id", { head: true, count: "exact" })
      .eq("followed_actor_id", actorId)
      .eq("is_active", true);

    if (error) return 0;
    return count ?? 0;
  }

  /** HYDRATE PROFILES + VPORTS */
  async function hydrateMutuals(mutualActorIds, blockedSet) {
    const safeIds = mutualActorIds.filter((id) => !blockedSet.has(id));
    if (!safeIds.length) return [];

    const { data: actorRows, error: actorsError } = await supabase
      .schema("vc")
      .from("actors")
      .select("id, kind, profile_id, vport_id")
      .in("id", safeIds);

    if (actorsError) throw actorsError;

    const profileIds = actorRows
      .filter((a) => a.kind === "user")
      .map((a) => a.profile_id);

    const vportIds = actorRows
      .filter((a) => a.kind === "vport")
      .map((a) => a.vport_id);

    const [{ data: profilesData }, { data: vportsData }] = await Promise.all([
      profileIds.length
        ? supabase
            .from("profiles")
            .select("id, username, display_name, bio, photo_url")
            .in("id", profileIds)
        : { data: [] },

      vportIds.length
        ? supabase
            .schema("vc")
            .from("vports")
            .select("id, name, slug, bio, avatar_url")
            .in("id", vportIds)
        : { data: [] },
    ]);

    const profilesById = Object.fromEntries(
      (profilesData || []).map((p) => [p.id, p])
    );

    const vportsById = Object.fromEntries(
      (vportsData || []).map((v) => [v.id, v])
    );

    const subscriberCounts = {};
    await Promise.all(
      safeIds.map(async (actorId) => {
        subscriberCounts[actorId] = await getSubscriberCount(actorId);
      })
    );

    const entries = safeIds
      .map((actorId) => {
        const a = actorRows.find((x) => x.id === actorId);
        if (!a) return null;

        if (a.kind === "user") {
          const p = profilesById[a.profile_id];
          if (!p) return null;
          return {
            kind: "user",
            actorId,
            avatarUrl: p.photo_url,
            displayName: p.display_name || p.username,
            username: p.username,
            bio: p.bio,
            subscriberCount: subscriberCounts[actorId],
          };
        }

        if (a.kind === "vport") {
          const v = vportsById[a.vport_id];
          if (!v) return null;
          return {
            kind: "vport",
            actorId,
            avatarUrl: v.avatar_url,
            displayName: v.name,
            username: v.slug,
            bio: v.bio || "",
            isVport: true,
            subscriberCount: subscriberCounts[actorId],
          };
        }

        return null;
      })
      .filter(Boolean);

    return entries.sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );
  }

  /** INITIAL LOAD */
  useEffect(() => {
    if (!identity || !identity.actorId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const blockedSet = await loadBlockedRelations();
        const mutualIds = await computeMutualActorIds(identity.actorId);

        // 🔥 FULL FIX: Filter blocked actors AGAIN at bucket-level
        const mutualFiltered = mutualIds.filter(id => !blockedSet.has(id));

        const fullList = await hydrateMutuals(mutualFiltered, blockedSet);

        if (!cancelled) {
          setAllMutuals(fullList);
          setVisibleMutuals(fullList.slice(0, PAGE_SIZE));
        }
      } catch (err) {
        console.error("MutualFriends load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => (cancelled = true);
  }, [identity?.actorId]);

  /** LOAD MORE */
  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    const nextVisible = allMutuals.slice(0, nextPage * PAGE_SIZE);

    setPage(nextPage);
    setVisibleMutuals(nextVisible);
  }, [page, allMutuals]);

  const hasMore = visibleMutuals.length < allMutuals.length;

  return (
    <div className="p-4 space-y-4">
      <BackButton />
      <h1 className="text-xl font-bold">Friends</h1>

      {loading && <p className="text-neutral-500">Loading…</p>}

      {!loading && visibleMutuals.length === 0 && (
        <p className="text-neutral-500">No mutual friends found.</p>
      )}

      {!loading && visibleMutuals.length > 0 && (
        <div className="space-y-4">
          {visibleMutuals.map((entry) => (
            <ProfileCard
              key={entry.actorId}
              avatarUrl={entry.avatarUrl}
              displayName={entry.displayName}
              username={entry.username}
              bio={entry.bio}
              isVport={entry.isVport || false}
              subscriberCount={entry.subscriberCount}
              mutualFriends={[]}
              statusMessage=""
              coverImage={null}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <button
          className="w-full py-2 rounded-lg bg-neutral-800 text-white text-sm font-medium border border-neutral-700"
          onClick={loadMore}
        >
          Load more
        </button>
      )}
    </div>
  );
}
