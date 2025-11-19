// src/features/profiles/tabs/components/ImaFan.jsx
// People who follows me BUT i don’t follow back

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useIdentity } from "@/state/identityContext";
import UserLink from "@/components/UserLink";
import BackButton from "@/ui/components/Backbutton";

export default function ImaFan() {
  const { identity } = useIdentity();
  const actorId = identity?.actorId;

  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actorId) return;
    loadTargets();
  }, [actorId]);

  async function hydrateActors(actorIds) {
    if (!actorIds.length) return [];

    const { data: actorRows, error: actorsError } = await supabase
      .schema("vc")
      .from("actors")
      .select("id, kind, profile_id, vport_id")
      .in("id", actorIds);

    if (actorsError) throw actorsError;

    const actorsById = Object.fromEntries(
      (actorRows || []).map((a) => [a.id, a])
    );

    const profileIds = (actorRows || [])
      .filter((a) => a.kind === "user" && a.profile_id)
      .map((a) => a.profile_id);

    const vportIds = (actorRows || [])
      .filter((a) => a.kind === "vport" && a.vport_id)
      .map((a) => a.vport_id);

    const [
      { data: profilesData, error: profilesError },
      { data: vportsData, error: vportsError },
    ] = await Promise.all([
      profileIds.length
        ? supabase
            .from("profiles")
            .select("id, username, display_name, photo_url")
            .in("id", profileIds)
        : Promise.resolve({ data: [], error: null }),
      vportIds.length
        ? supabase
            .schema("vc")
            .from("vports")
            .select("id, name, slug, avatar_url")
            .in("id", vportIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (profilesError) throw profilesError;
    if (vportsError) throw vportsError;

    const profilesById = Object.fromEntries(
      (profilesData || []).map((p) => [p.id, p])
    );
    const vportsById = Object.fromEntries(
      (vportsData || []).map((v) => [v.id, v])
    );

    const entries = actorIds
      .map((id) => {
        const actor = actorsById[id];
        if (!actor) return null;

        if (actor.kind === "user" && actor.profile_id) {
          const profile = profilesById[actor.profile_id];
          if (!profile) return null;
          return {
            kind: "user",
            actorId: id,
            profileId: profile.id,
            profile,
          };
        }

        if (actor.kind === "vport" && actor.vport_id) {
          const vport = vportsById[actor.vport_id];
          if (!vport) return null;
          return {
            kind: "vport",
            actorId: id,
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
          a.kind === "user"
            ? (a.profile.display_name || a.profile.username || "").toLowerCase()
            : (a.vport.name || a.vport.slug || "").toLowerCase();
        const nameB =
          b.kind === "user"
            ? (b.profile.display_name || b.profile.username || "").toLowerCase()
            : (b.vport.name || b.vport.slug || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });

    return sortEntriesByName(entries);
  }

  async function loadTargets() {
    setLoading(true);

    try {
      // 1. Who I follow
      const { data: iFollow, error: followErr } = await supabase
        .schema("vc")
        .from("actor_follows")
        .select("followed_actor_id")
        .eq("follower_actor_id", actorId)
        .eq("is_active", true);

      if (followErr) throw followErr;

      const iFollowIds = new Set(
        (iFollow || []).map((r) => r.followed_actor_id)
      );

      // 2. Who follows me back
      const { data: followsMe, error: meErr } = await supabase
        .schema("vc")
        .from("actor_follows")
        .select("follower_actor_id")
        .eq("followed_actor_id", actorId)
        .eq("is_active", true);

      if (meErr) throw meErr;

      const followsMeIds = new Set(
        (followsMe || []).map((r) => r.follower_actor_id)
      );

      // 3. Remove mutual follows → keep only:
      //    I follow them AND they do NOT follow me back
      const filtered = [...iFollowIds].filter(
        (id) => !followsMeIds.has(id)
      );

      const entries = await hydrateActors(filtered);
      setTargets(entries);
    } catch (err) {
      console.error("ImaFan load error:", err);
      setTargets([]);
    } finally {
      setLoading(false);
    }
  }

  const renderEntry = (entry) => {
    if (entry.kind === "user") {
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
      <h1 className="text-xl font-bold">I'm a Fan Of</h1>

      {loading && <p>Loading…</p>}
      {!loading && targets.length === 0 && <p>None.</p>}

      {!loading && targets.length > 0 && (
        <div className="space-y-3">
          {targets.map((entry) => renderEntry(entry))}
        </div>
      )}
    </div>
  );
}
