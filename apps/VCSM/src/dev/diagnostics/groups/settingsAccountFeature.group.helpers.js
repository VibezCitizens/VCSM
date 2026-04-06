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
      name: "SettingsAccountFeatureViolation",
      message,
    },
  };
}

export function getSettingsAccountEntries() {
  return getFeatureSourceEntries().filter((entry) =>
    entry.path.startsWith("src/features/settings/account/")
  );
}

function isPolicyOrRpc(error) {
  return isPermissionDenied(error) || isRlsDenied(error) || isMissingRpc(error);
}

function getState(shared) {
  if (!shared.cache.settingsAccountFeatureState) {
    shared.cache.settingsAccountFeatureState = {};
  }
  return shared.cache.settingsAccountFeatureState;
}

async function resolveOwnedVportActorId(userId) {
  const { data: ownerRows, error: ownerError } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id")
    .eq("user_id", userId)
    .limit(25);

  if (ownerError) throw ownerError;

  const ownedIds = (ownerRows ?? []).map((row) => row.actor_id).filter(Boolean);
  if (!ownedIds.length) return null;

  const { data: actorRows, error: actorError } = await supabase
    .schema("vc")
    .from("actors")
    .select("id")
    .in("id", ownedIds)
    .eq("kind", "vport")
    .order("created_at", { ascending: true })
    .limit(1);

  if (actorError) throw actorError;
  return actorRows?.[0]?.id ?? null;
}

export async function ensureSettingsAccountContext(shared) {
  const state = getState(shared);
  if (state.ready) return state;

  const actorContext = await ensureActorContext(shared);
  const ownedVportActorId = await resolveOwnedVportActorId(actorContext.userId).catch(() => null);

  state.ready = true;
  state.userId = actorContext.userId;
  state.actorId = actorContext.actorId;
  state.actorKind = actorContext.actor?.kind ?? null;
  state.ownedVportActorId = ownedVportActorId;
  return state;
}

export async function withSettingsAccountContext(localShared, reason, run) {
  let context;
  try {
    context = await ensureSettingsAccountContext(localShared);
    return await run(context);
  } catch (error) {
    if (error?.skipped) return error;
    if (isPolicyOrRpc(error)) {
      return makeSkipped(reason, { context, error });
    }
    throw error;
  }
}
