import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/services/supabase/supabaseClient";
import { useAuth } from "@/app/providers/AuthProvider";
import vc from "@/services/supabase/vcClient";
import { loadIdentity, saveIdentity } from "./identityStorage";

const IdentityContext = createContext(null);

/* ============================================================
   REALM RESOLUTION
   ============================================================ */

async function resolveRealmId(actor) {
  if (!actor) return null;

  // Void actor → void realm
  if (actor.is_void) {
    const { data } = await vc
      .from("realms")
      .select("id")
      .eq("is_void", true)
      .maybeSingle();

    return data?.id ?? null;
  }

  // Normal actor → public realm
  const { data } = await vc
    .from("realms")
    .select("id")
    .eq("is_void", false)
    .maybeSingle();

  return data?.id ?? null;
}

/* ============================================================
   MAPPERS (LOCKED: NEVER EXPOSE profileId/vportId)
   ============================================================ */

function mapProfileActor(actor, profile, realmId) {
  return {
    actorId: actor.id,
    kind: "user",
    realmId,
    isVoid: actor.is_void,

    displayName: profile?.display_name ?? null,
    username: profile?.username ?? null,
    email: profile?.email ?? null,

    avatar: profile?.photo_url ?? null,
    banner: profile?.banner_url ?? null,

    bio: profile?.bio ?? null,
    birthdate: profile?.birthdate ?? null,
    age: profile?.age ?? null,
    sex: profile?.sex ?? null,
    isAdult: profile?.is_adult ?? null,

    discoverable: profile?.discoverable ?? null,
    publish: profile?.publish ?? null,

    lastSeen: profile?.last_seen ?? null,

    createdAt: profile?.created_at ?? null,
    updatedAt: profile?.updated_at ?? null,
  };
}

function mapVportActor(actor, vport, realmId) {
  return {
    actorId: actor.id,
    kind: "vport",
    realmId,
    isVoid: actor.is_void,

    displayName: vport?.name ?? null,
    username: vport?.slug ?? null,

    avatar: vport?.avatar_url ?? null,
    banner: vport?.banner_url ?? null,

    bio: vport?.bio ?? null,
    isActive: vport?.is_active ?? null,

    createdAt: vport?.created_at ?? null,
    updatedAt: vport?.updated_at ?? null,

    // keep if you need it elsewhere
    vportType: vport?.vport_type ?? null,
  };
}

/* ============================================================
   PROVIDER
   ============================================================ */

export function IdentityProvider({ children }) {
  // ✅ USE AUTH LOADING GATE
  const { user, loading: authLoading } = useAuth();

  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- HYDRATE ACTOR ---------------- */
  async function hydrateActor(actor) {
    if (!actor?.id) return null;

    const realmId = await resolveRealmId(actor);

    // ============================================================
    // USER ACTOR
    // ============================================================
    if (actor.kind === "user") {
      const [{ data: profile }, { data: privacy }] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            [
              "id",
              "display_name",
              "username",
              "email",
              "photo_url",
              "banner_url",
              "bio",
              "birthdate",
              "age",
              "sex",
              "is_adult",
              "discoverable",
              "publish",
              "last_seen",
              "created_at",
              "updated_at",
            ].join(",")
          )
          .eq("id", actor.profile_id)
          .single(),

        vc
          .from("actor_privacy_settings")
          .select("is_private")
          .eq("actor_id", actor.id)
          .maybeSingle(),
      ]);

      const mapped = mapProfileActor(actor, profile, realmId);

      return {
        ...mapped,
        private: privacy?.is_private ?? false, // ✅ SSOT
      };
    }

    // ============================================================
    // VPORT ACTOR
    // ============================================================
    if (actor.kind === "vport") {
      const [{ data: vport }, { data: privacy }, { data: ownerRow }] =
        await Promise.all([
          vc
            .from("vports")
            .select(
              [
                "id",
                "owner_user_id",
                "name",
                "slug",
                "avatar_url",
                "bio",
                "is_active",
                "banner_url",
                "created_at",
                "updated_at",
                "vport_type",
              ].join(",")
            )
            .eq("id", actor.vport_id)
            .single(),

          vc
            .from("actor_privacy_settings")
            .select("is_private")
            .eq("actor_id", actor.id)
            .maybeSingle(),

          vc
            .from("actor_owners")
            .select("user_id")
            .eq("actor_id", actor.id)
            .maybeSingle(),
        ]);

      let ownerActorId = null;

      // NOTE: in your schema, actor_owners.user_id points to profiles.id (your inserts confirm that)
      if (ownerRow?.user_id) {
        const { data: ownerActor } = await vc
          .from("actors")
          .select("id")
          .eq("profile_id", ownerRow.user_id)
          .eq("kind", "user")
          .maybeSingle();

        ownerActorId = ownerActor?.id ?? null;
      }

      const mapped = mapVportActor(actor, vport, realmId);

      return {
        ...mapped,
        private: privacy?.is_private ?? false,
        ownerActorId, // ✅ REAL actor_id
      };
    }

    return null;
  }

  /* ---------------- SWITCH ACTOR ---------------- */
  async function switchActor(actorId) {
    if (!actorId) return;

    const { data: actor, error } = await vc
      .from("actors")
      .select("id, kind, profile_id, vport_id, is_void")
      .eq("id", actorId)
      .single();

    if (error || !actor) {
      console.error("[Identity] failed to switch actor", error);
      return;
    }

    const full = await hydrateActor(actor);
    if (full) {
      saveIdentity(actorId);
      setIdentity(full);
    }
  }

  /* ---------------- LOAD DEFAULT IDENTITY ---------------- */
  useEffect(() => {
    let cancelled = false;

    async function run() {
      // ✅ HARD GATE: auth is still hydrating → identity is also hydrating
      if (authLoading) {
        setLoading(true);
        return;
      }

      // ✅ CONFIRMED LOGGED OUT
      if (!user?.id) {
        setIdentity(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: ownership } = await vc
        .from("actor_owners")
        .select(
          `
          actor_id,
          actor:actors (
            id,
            kind,
            profile_id,
            vport_id,
            is_void
          )
        `
        )
        .eq("user_id", user.id);

      const actors = ownership?.map((r) => r.actor).filter(Boolean);

      if (!actors?.length) {
        if (!cancelled) {
          setIdentity(null);
          setLoading(false);
        }
        return;
      }

      const saved = loadIdentity();
      if (saved) {
        const preferred = actors.find((a) => a.id === saved);
        if (preferred) {
          const full = await hydrateActor(preferred);
          if (!cancelled) {
            setIdentity(full);
            setLoading(false);
          }
          return;
        }
      }

      const primary = actors.find((a) => a.kind === "user") || actors[0];
      const full = await hydrateActor(primary);

      if (!cancelled) {
        setIdentity(full);
        setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id]);

  return (
    <IdentityContext.Provider
      value={{
        identity,

        // ✅ FIX: provide BOTH names so screens stop lying
        loading,
        identityLoading: loading,

        setIdentity,
        switchActor,
      }}
    >
      {children}
    </IdentityContext.Provider>
  );
}

/* ---------------- HOOK ---------------- */

export function useIdentity() {
  return useContext(IdentityContext);
}