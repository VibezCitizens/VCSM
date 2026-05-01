import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import {
  isMissingRpc,
  isPermissionDenied,
  isRlsDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";

const GROUP_ID = "profilesFeature";

export const TEST_CATALOG = [
  { key: "feature_inventory", name: "profiles feature file inventory" },
  { key: "feature_architecture", name: "profiles feature architecture audit" },
  { key: "resolve_username_self", name: "resolve self username to actor" },
  { key: "actor_kind_self", name: "read actor kind for self actor" },
  { key: "vport_type_self", name: "read vport type for self actor" },
  { key: "profile_view_self_visible", name: "get profile view self (content on)" },
  { key: "profile_view_self_hidden", name: "get profile view self (content off)" },
  { key: "posts_tab_controller", name: "profile posts tab controller read" },
  { key: "tags_tab_controller", name: "profile vibe tags controller read" },
  { key: "friends_tab_controllers", name: "profile friends tab controllers read" },
  { key: "vport_read_bundle", name: "vport profile read bundle" },
];

export function getProfilesFeatureTests() {
  return TEST_CATALOG.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

export function failWithData(message, data) {
  return {
    skipped: false,
    data,
    error: { name: "ProfilesFeatureViolation", message },
  };
}

export function trimAudit(audit, maxItems = 25) {
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

function isPolicyOrRpc(error) {
  return isPermissionDenied(error) || isRlsDenied(error) || isMissingRpc(error);
}

export function getProfilesFeatureState(shared) {
  if (!shared.cache.profilesFeatureState) {
    shared.cache.profilesFeatureState = {};
  }
  return shared.cache.profilesFeatureState;
}

async function resolveSelfPresentation(actorId) {
  const { data, error } = await supabase
    .schema("identity")
    .from("actor_directory")
    .select("actor_id,kind,username,display_name")
    .eq("actor_id", actorId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function resolveOwnedVportActorId(userId) {
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
    .select("id,kind")
    .in("id", ownedIds)
    .eq("kind", "vport")
    .limit(1);

  if (actorError) throw actorError;
  return actorRows?.[0]?.id ?? null;
}

async function ensureProfilesFeatureContext(shared) {
  const state = getProfilesFeatureState(shared);
  if (state.actorId && state.userId) return state;

  const actorContext = await ensureActorContext(shared);
  const presentation = await resolveSelfPresentation(actorContext.actorId).catch(() => null);
  const ownedVportActorId = await resolveOwnedVportActorId(actorContext.userId).catch(() => null);

  state.actorId = actorContext.actorId;
  state.userId = actorContext.userId;
  state.actorKind = actorContext.actor?.kind ?? null;
  state.username = presentation?.username ?? null;
  state.displayName = presentation?.display_name ?? null;
  state.ownedVportActorId = ownedVportActorId;

  return state;
}

export async function withProfilesFeatureContext(localShared, reason, run) {
  let context;
  try {
    context = await ensureProfilesFeatureContext(localShared);
    return await run(context);
  } catch (error) {
    if (isPolicyOrRpc(error)) {
      return makeSkipped(reason, { context, error });
    }
    throw error;
  }
}
