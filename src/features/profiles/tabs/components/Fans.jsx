// src/features/profiles/tabs/components/Fans.jsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useIdentity } from "@/state/identityContext";
import UserLink from "@/components/UserLink";
import BackButton from "@/ui/components/Backbutton"; 

export default function Fans() {
  const { identity } = useIdentity();
  const actorId = identity?.actorId;

  const [fans, setFans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actorId) return;
    loadFans();
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

  async function loadFans() {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .schema("vc")
        .from("actor_follows")
        .select("follower_actor_id")
        .eq("followed_actor_id", actorId)
        .eq("is_active", true);

      if (error) throw error;

      const ids = Array.from(
        new Set((data || []).map((row) => row.follower_actor_id))
      );

      const entries = await hydrateActors(ids);
      setFans(entries);
    } catch (err) {
      console.error("Fans load error:", err);
      setFans([]);
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
      <h1 className="text-xl font-bold">Fans</h1>

      {loading && <p>Loading…</p>}
      {!loading && fans.length === 0 && <p>No fans yet.</p>}

      {!loading && fans.length > 0 && (
        <div className="space-y-3">
          {fans.map((entry) => renderEntry(entry))}
        </div>
      )}
    </div>
  );
}
