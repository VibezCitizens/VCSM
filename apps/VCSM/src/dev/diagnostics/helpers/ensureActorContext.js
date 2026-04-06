import { supabase } from "@/services/supabase/supabaseClient";
import { ensureAuthContext } from "@/dev/diagnostics/helpers/ensureAuthContext";
import {
  isMissingColumn,
  isMissingRpc,
  isPermissionDenied,
  isUniqueViolation,
} from "@/dev/diagnostics/helpers/supabaseAssert";

function sanitizeUsernameCandidate(input) {
  const text = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return text.slice(0, 24);
}

function buildProfileCandidates({ userId, email, user }) {
  const uidToken = String(userId).replace(/-/g, "");
  const metadata = user?.user_metadata ?? {};
  const emailBase = email ? String(email).split("@")[0] : "";
  const preferredBase =
    metadata.username ?? metadata.user_name ?? metadata.preferred_username ?? emailBase;

  const usernameBase = sanitizeUsernameCandidate(preferredBase);
  const usernameCandidates = [
    usernameBase,
    sanitizeUsernameCandidate(`${usernameBase}_${uidToken.slice(0, 6)}`),
    sanitizeUsernameCandidate(`user_${uidToken.slice(0, 12)}`),
  ].filter(Boolean);

  const displayNameFromMeta =
    metadata.display_name ?? metadata.full_name ?? metadata.name ?? null;

  const displayName =
    String(displayNameFromMeta ?? "").trim() ||
    String(emailBase || usernameCandidates[0] || "User").trim();

  return { usernameCandidates, displayName };
}

function normalizeActor(row, fallbackProfileId) {
  if (!row || typeof row !== "object") return null;

  const id = row.id ?? row.actor_id ?? null;
  if (!id) return null;

  return {
    id,
    kind: row.kind ?? "user",
    profile_id: row.profile_id ?? row.user_id ?? fallbackProfileId ?? null,
    vport_id: row.vport_id ?? null,
    is_void: Boolean(row.is_void ?? false),
  };
}

function normalizeRpcPayload(payload, fallbackProfileId) {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    return normalizeActor(payload[0], fallbackProfileId);
  }

  if (typeof payload === "object") {
    return normalizeActor(payload, fallbackProfileId);
  }

  return null;
}

async function ensureProfileRow({ userId, email, user }) {
  const nowIso = new Date().toISOString();

  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("id,email,username,display_name,created_at,updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (readError) throw readError;
  if (profile?.id) return profile;

  const { usernameCandidates, displayName } = buildProfileCandidates({
    userId,
    email,
    user,
  });

  const payloadCandidates = usernameCandidates.flatMap((username) => [
    {
      id: userId,
      email: email ?? null,
      username,
      display_name: displayName,
      discoverable: true,
      publish: true,
      updated_at: nowIso,
    },
    {
      id: userId,
      email: email ?? null,
      username,
      display_name: displayName,
      updated_at: nowIso,
    },
    {
      id: userId,
      email: email ?? null,
      username,
      display_name: displayName,
    },
  ]);

  let lastUpsertError = null;

  for (const payload of payloadCandidates) {
    const { error: upsertError } = await supabase.from("profiles").upsert(payload);

    if (!upsertError) {
      lastUpsertError = null;
      break;
    }

    lastUpsertError = upsertError;
    if (!isMissingColumn(upsertError)) {
      throw upsertError;
    }
  }

  if (lastUpsertError) throw lastUpsertError;

  const { data: created, error: rereadError } = await supabase
    .from("profiles")
    .select("id,email,username,display_name,created_at,updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (rereadError) throw rereadError;
  return created;
}

async function readUserActor(profileId) {
  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("id,kind,profile_id,vport_id,is_void")
    .eq("profile_id", profileId)
    .eq("kind", "user")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return normalizeActor(data, profileId);
}

async function createUserActorViaLegacyRpc(profileId) {
  const { data, error } = await supabase
    .schema("vc")
    .rpc("create_actor_for_user", {
      p_kind: "user",
      p_profile_id: profileId,
      p_vport_id: null,
      p_is_void: false,
      p_is_primary: true,
    });

  if (error) throw error;
  return normalizeRpcPayload(data, profileId);
}

async function ensureUserActor(profileId) {
  const existing = await readUserActor(profileId);
  if (existing?.id) return existing;

  let legacyRpcBlocked = null;

  try {
    const actor = await createUserActorViaLegacyRpc(profileId);
    if (actor?.id) return actor;
  } catch (legacyRpcError) {
    if (!isMissingRpc(legacyRpcError) && !isPermissionDenied(legacyRpcError)) {
      throw legacyRpcError;
    }
    legacyRpcBlocked = legacyRpcError;
  }

  const reread = await readUserActor(profileId);
  if (reread?.id) return reread;

  if (legacyRpcBlocked) {
    throw legacyRpcBlocked;
  }

  throw new Error("Failed to ensure user actor for authenticated profile.");
}

async function readOwnerLink({ actorId, userId }) {
  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id,user_id,is_primary,created_at,is_void")
    .eq("actor_id", actorId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function ensureActorOwnerLink({ actorId, userId }) {
  const existing = await readOwnerLink({ actorId, userId });
  if (existing?.actor_id) return existing;

  let ownerLink = await readOwnerLink({ actorId, userId });
  if (ownerLink?.actor_id) {
    return ownerLink;
  }

  const { error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .upsert(
      {
        actor_id: actorId,
        user_id: userId,
        is_primary: true,
      },
      {
        onConflict: "actor_id,user_id",
        ignoreDuplicates: true,
      }
    );

  if (error && !isUniqueViolation(error) && !isPermissionDenied(error)) {
    throw error;
  }

  ownerLink = await readOwnerLink({ actorId, userId });
  if (!ownerLink?.actor_id) {
    throw new Error("Failed to ensure actor ownership link for authenticated user.");
  }

  return ownerLink;
}

export async function ensureActorContext(shared) {
  if (shared?.cache?.actorContext) {
    return shared.cache.actorContext;
  }

  const auth = await ensureAuthContext(shared);
  const profile = await ensureProfileRow({
    userId: auth.userId,
    email: auth.email,
    user: auth.user,
  });
  const actor = await ensureUserActor(profile.id);
  const ownerLink = await ensureActorOwnerLink({
    actorId: actor.id,
    userId: auth.userId,
  });

  const actorContext = {
    ...auth,
    profile,
    actor,
    ownerLink,
    actorId: actor.id,
  };

  if (shared?.cache) {
    shared.cache.actorContext = actorContext;
  }

  return actorContext;
}
