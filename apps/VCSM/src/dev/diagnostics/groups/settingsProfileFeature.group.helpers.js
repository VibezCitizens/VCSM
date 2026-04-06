import { supabase } from "@/services/supabase/supabaseClient";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import {
  isMissingRpc,
  isPermissionDenied,
  isRlsDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
import { getFeatureSourceEntries } from "@/dev/diagnostics/helpers/featureSourceIndex";
import { ctrlResolveVportIdByActorId } from "@/features/settings/profile/controller/resolveVportIdByActorId.controller";

export function failWithData(message, data) {
  return {
    skipped: false,
    data,
    error: {
      name: "SettingsProfileFeatureViolation",
      message,
    },
  };
}

export function getSettingsProfileEntries() {
  return getFeatureSourceEntries().filter((entry) =>
    entry.path.startsWith("src/features/settings/profile/")
  );
}

function isPolicyOrRpc(error) {
  return isPermissionDenied(error) || isRlsDenied(error) || isMissingRpc(error);
}

function getState(shared) {
  if (!shared.cache.settingsProfileFeatureState) {
    shared.cache.settingsProfileFeatureState = {};
  }
  return shared.cache.settingsProfileFeatureState;
}

async function resolveOwnedVport(userId) {
  const { data: ownerRows, error: ownerError } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id")
    .eq("user_id", userId)
    .limit(30);

  if (ownerError) throw ownerError;
  const ids = (ownerRows ?? []).map((row) => row.actor_id).filter(Boolean);
  if (!ids.length) return { actorId: null, vportId: null };

  const { data: actorRows, error: actorError } = await supabase
    .schema("vc")
    .from("actors")
    .select("id,vport_id")
    .in("id", ids)
    .eq("kind", "vport")
    .order("created_at", { ascending: true })
    .limit(1);

  if (actorError) throw actorError;
  return {
    actorId: actorRows?.[0]?.id ?? null,
    vportId: actorRows?.[0]?.vport_id ?? null,
  };
}

export async function ensureSettingsProfileContext(shared) {
  const state = getState(shared);
  if (state.ready) return state;

  const actorContext = await ensureActorContext(shared);
  const activeVportId =
    actorContext.actor?.kind === "vport"
      ? await ctrlResolveVportIdByActorId(actorContext.actorId).catch(() => null)
      : null;

  const ownedVport = await resolveOwnedVport(actorContext.userId).catch(() => ({
    actorId: null,
    vportId: null,
  }));

  state.ready = true;
  state.userId = actorContext.userId;
  state.actorId = actorContext.actorId;
  state.kind = actorContext.actor?.kind ?? "user";
  state.activeVportId = activeVportId;
  state.ownedVportActorId = ownedVport.actorId;
  state.ownedVportId = ownedVport.vportId;
  return state;
}

export async function withSettingsProfileContext(localShared, reason, run) {
  let context;
  try {
    context = await ensureSettingsProfileContext(localShared);
    return await run(context);
  } catch (error) {
    if (error?.skipped) return error;
    if (isPolicyOrRpc(error)) {
      return makeSkipped(reason, { context, error });
    }
    throw error;
  }
}
