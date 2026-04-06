import { supabase } from "@/services/supabase/supabaseClient";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import {
  isMissingRpc,
  isPermissionDenied,
  isRlsDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
import { getFeatureSourceEntries } from "@/dev/diagnostics/helpers/featureSourceIndex";
import { ctrlListMyBlocks } from "@/features/settings/privacy/controller/Blocks.controller";

export function failWithData(message, data) {
  return {
    skipped: false,
    data,
    error: {
      name: "SettingsPrivacyFeatureViolation",
      message,
    },
  };
}

export function getSettingsPrivacyEntries() {
  return getFeatureSourceEntries().filter((entry) =>
    entry.path.startsWith("src/features/settings/privacy/")
  );
}

function isPolicyOrRpc(error) {
  return isPermissionDenied(error) || isRlsDenied(error) || isMissingRpc(error);
}

function getState(shared) {
  if (!shared.cache.settingsPrivacyFeatureState) {
    shared.cache.settingsPrivacyFeatureState = {};
  }
  return shared.cache.settingsPrivacyFeatureState;
}

async function resolveSelfPresentation(actorId) {
  const { data, error } = await supabase
    .schema("vc")
    .from("actor_presentation")
    .select("actor_id,username,display_name")
    .eq("actor_id", actorId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function resolveUnblockedCandidate(actorId, blockedIds) {
  const { data, error } = await supabase
    .schema("vc")
    .from("actor_presentation")
    .select("actor_id")
    .neq("actor_id", actorId)
    .limit(40);

  if (error) throw error;

  const blocked = blockedIds ?? new Set();
  const candidate = (data ?? []).find((row) => row.actor_id && !blocked.has(row.actor_id));
  return candidate?.actor_id ?? null;
}

export async function ensureSettingsPrivacyContext(shared) {
  const state = getState(shared);
  if (state.ready) return state;

  const actorContext = await ensureActorContext(shared);
  const presentation = await resolveSelfPresentation(actorContext.actorId).catch(() => null);
  const blocks = await ctrlListMyBlocks({
    actorId: actorContext.actorId,
    scope: actorContext.actor?.kind === "vport" ? "vport" : "user",
  }).catch(() => []);

  const blockedIds = new Set((blocks ?? []).map((row) => row.blockedActorId).filter(Boolean));
  const candidateActorId = await resolveUnblockedCandidate(actorContext.actorId, blockedIds).catch(() => null);

  state.ready = true;
  state.userId = actorContext.userId;
  state.actorId = actorContext.actorId;
  state.kind = actorContext.actor?.kind ?? "user";
  state.scope = state.kind === "vport" ? "vport" : "user";
  state.username = presentation?.username ?? null;
  state.displayName = presentation?.display_name ?? null;
  state.blockedIds = blockedIds;
  state.candidateActorId = candidateActorId;
  return state;
}

export async function withSettingsPrivacyContext(localShared, reason, run) {
  let context;
  try {
    context = await ensureSettingsPrivacyContext(localShared);
    return await run(context);
  } catch (error) {
    if (error?.skipped) return error;
    if (isPolicyOrRpc(error)) {
      return makeSkipped(reason, { context, error });
    }
    throw error;
  }
}
