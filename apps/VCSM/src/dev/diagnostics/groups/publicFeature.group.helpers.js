import { supabase } from "@/services/supabase/supabaseClient";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import {
  isMissingRpc,
  isPermissionDenied,
  isRlsDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
import { getFeatureSourceEntries } from "@/dev/diagnostics/helpers/featureSourceIndex";

export function failWithData(message, data) {
  return {
    skipped: false,
    data,
    error: {
      name: "PublicFeatureViolation",
      message,
    },
  };
}

export function trimAudit(audit, maxItems = 20) {
  return {
    ...audit,
    issues: {
      ...audit.issues,
      oversizedFiles: audit.issues.oversizedFiles.slice(0, maxItems),
      depthViolations: audit.issues.depthViolations.slice(0, maxItems),
      relativeImports: audit.issues.relativeImports.slice(0, maxItems),
      crossFeatureImports: audit.issues.crossFeatureImports.slice(0, maxItems),
      namingViolations: audit.issues.namingViolations.slice(0, maxItems),
    },
  };
}

export function getPublicEntries() {
  return getFeatureSourceEntries().filter((entry) =>
    entry.path.startsWith("src/features/public/")
  );
}

function isPolicyOrRpc(error) {
  return isPermissionDenied(error) || isRlsDenied(error) || isMissingRpc(error);
}

function getState(shared) {
  if (!shared.cache.publicFeatureState) {
    shared.cache.publicFeatureState = {};
  }
  return shared.cache.publicFeatureState;
}

async function resolveOwnedVportActor(userId) {
  const { data: ownerRows, error: ownerError } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id")
    .eq("user_id", userId)
    .limit(30);

  if (ownerError) throw ownerError;

  const ownedIds = (ownerRows ?? []).map((row) => row.actor_id).filter(Boolean);
  if (!ownedIds.length) return null;

  const { data: actorRows, error: actorError } = await supabase
    .schema("vc")
    .from("actors")
    .select("id,vport_id")
    .in("id", ownedIds)
    .eq("kind", "vport")
    .order("created_at", { ascending: true })
    .limit(5);

  if (actorError) throw actorError;
  return actorRows?.[0]?.id ?? null;
}

async function resolveVisibleVportActor() {
  const { data: rows, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("id")
    .eq("kind", "vport")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return rows?.[0]?.id ?? null;
}

export async function ensurePublicContext(shared) {
  const state = getState(shared);
  if (state.ready && state.actorId) {
    return state;
  }

  const auth = await ensureActorContext(shared);
  const ownedActorId = await resolveOwnedVportActor(auth.userId).catch(() => null);
  const publicActorId = ownedActorId ?? (await resolveVisibleVportActor());

  if (!publicActorId) {
    throw makeSkipped("No vport actor is available for public feature diagnostics.");
  }

  state.ready = true;
  state.userId = auth.userId;
  state.viewerActorId = auth.actorId;
  state.actorId = publicActorId;
  state.source = ownedActorId ? "owned_vport_actor" : "visible_vport_actor";
  return state;
}

export async function withPublicContext(localShared, reason, run) {
  let context;
  try {
    context = await ensurePublicContext(localShared);
    return await run(context);
  } catch (error) {
    if (error?.skipped) return error;
    if (isPolicyOrRpc(error)) {
      return makeSkipped(reason, { context, error });
    }
    throw error;
  }
}
