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
      name: "ProfilesKindsFeatureViolation",
      message,
    },
  };
}

export function getKindsEntries() {
  return getFeatureSourceEntries().filter((entry) =>
    entry.path.startsWith("src/features/profiles/kinds/")
  );
}

function isPolicyOrRpc(error) {
  return isPermissionDenied(error) || isRlsDenied(error) || isMissingRpc(error);
}

function getState(shared) {
  if (!shared.cache.profilesKindsFeatureState) {
    shared.cache.profilesKindsFeatureState = {};
  }
  return shared.cache.profilesKindsFeatureState;
}

async function readVportInfo(vportId) {
  if (!vportId) return null;

  const { data, error } = await supabase
    .schema("vc")
    .from("vports")
    .select("id,name,slug,vport_type")
    .eq("id", vportId)
    .maybeSingle();

  if (error) {
    if (isPermissionDenied(error) || isRlsDenied(error)) {
      return null;
    }
    throw error;
  }

  return data ?? null;
}

async function resolveOwnedVportActor(userId) {
  const { data: ownerRows, error: ownerError } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id")
    .eq("user_id", userId)
    .limit(40);

  if (ownerError) throw ownerError;

  const ownedActorIds = (ownerRows ?? []).map((row) => row.actor_id).filter(Boolean);
  if (!ownedActorIds.length) return null;

  const { data: actorRows, error: actorError } = await supabase
    .schema("vc")
    .from("actors")
    .select("id,kind,vport_id")
    .in("id", ownedActorIds)
    .eq("kind", "vport")
    .order("created_at", { ascending: true })
    .limit(5);

  if (actorError) throw actorError;
  const actor = actorRows?.[0] ?? null;
  if (!actor?.id) return null;

  const vport = await readVportInfo(actor.vport_id);
  return {
    actorId: actor.id,
    vportId: actor.vport_id ?? null,
    vportType: vport?.vport_type ?? null,
    vportName: vport?.name ?? null,
    source: "owned",
  };
}

async function resolveVisibleVportActor() {
  const { data: actorRows, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("id,kind,vport_id")
    .eq("kind", "vport")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;

  const actor = actorRows?.[0] ?? null;
  if (!actor?.id) return null;

  const vport = await readVportInfo(actor.vport_id);
  return {
    actorId: actor.id,
    vportId: actor.vport_id ?? null,
    vportType: vport?.vport_type ?? null,
    vportName: vport?.name ?? null,
    source: "visible",
  };
}

export async function ensureKindsContext(shared) {
  const state = getState(shared);
  if (state.ready) return state;

  const actorContext = await ensureActorContext(shared);
  const selected =
    (await resolveOwnedVportActor(actorContext.userId)) ??
    (await resolveVisibleVportActor());

  if (!selected?.actorId) {
    throw makeSkipped("No owned or visible vport actor available for profiles kinds diagnostics.");
  }

  state.ready = true;
  state.userId = actorContext.userId;
  state.primaryActorId = actorContext.actorId;
  state.vportActorId = selected.actorId;
  state.vportId = selected.vportId;
  state.vportType = selected.vportType;
  state.vportName = selected.vportName;
  state.selectionSource = selected.source;
  state.isOwned = selected.source === "owned";
  return state;
}

export async function withKindsContext(localShared, reason, run) {
  let context;
  try {
    context = await ensureKindsContext(localShared);
    return await run(context);
  } catch (error) {
    if (error?.skipped) return error;
    if (isPolicyOrRpc(error)) {
      return makeSkipped(reason, { context, error });
    }
    throw error;
  }
}
