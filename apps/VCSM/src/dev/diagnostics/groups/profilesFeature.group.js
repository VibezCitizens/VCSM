import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import {
  isMissingRpc,
  isPermissionDenied,
  isRlsDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
import { auditFeature } from "@/dev/diagnostics/helpers/featureAudit";
import { getFeatureSourceEntries } from "@/dev/diagnostics/helpers/featureSourceIndex";
import { resolveUsernameToActor } from "@/features/profiles/controller/resolveUsernameToActor.controller";
import { getActorKindController } from "@/features/profiles/controller/getActorKind.controller";
import { getVportTypeController } from "@/features/profiles/controller/getVportType.controller";
import { getProfileView } from "@/features/profiles/controller/getProfileView.controller";
import { getActorPostsController } from "@/features/profiles/screens/views/tabs/post/controllers/getActorPosts.controller";
import { getActorVibeTagsController } from "@/features/profiles/screens/views/tabs/tags/controller/getActorVibeTags.controller";
import { getFriendListsController } from "@/features/profiles/screens/views/tabs/friends/controller/getFriendLists.controller";
import { getTopFriendActorIdsController } from "@/features/profiles/screens/views/tabs/friends/controller/getTopFriendActorIds.controller";
import { getTopFriendCandidatesController } from "@/features/profiles/screens/views/tabs/friends/controller/getTopFriendCandidates.controller";
import { getVportPublicDetailsController } from "@/features/profiles/kinds/vport/controller/getVportPublicDetails.controller";
import getVportServicesController from "@/features/profiles/kinds/vport/controller/services/getVportServices.controller";
import getVportRatesController from "@/features/profiles/kinds/vport/controller/rates/getVportRates.controller";
import { getSubscribersController } from "@/features/profiles/kinds/vport/controller/subscribers/getSubscribers.controller";

export const GROUP_ID = "profilesFeature";
export const GROUP_LABEL = "Profiles Feature";

const TEST_CATALOG = [
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

function failWithData(message, data) {
  return {
    skipped: false,
    data,
    error: { name: "ProfilesFeatureViolation", message },
  };
}

function trimAudit(audit, maxItems = 25) {
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

function getState(shared) {
  if (!shared.cache.profilesFeatureState) {
    shared.cache.profilesFeatureState = {};
  }
  return shared.cache.profilesFeatureState;
}

async function resolveSelfPresentation(actorId) {
  const { data, error } = await supabase
    .schema("vc")
    .from("actor_presentation")
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

async function ensureContext(shared) {
  const state = getState(shared);
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

async function withProfileContext(localShared, reason, run) {
  let context;
  try {
    context = await ensureContext(localShared);
    return await run(context);
  } catch (error) {
    if (isPolicyOrRpc(error)) {
      return makeSkipped(reason, { context, error });
    }
    throw error;
  }
}

export function getProfilesFeatureTests() {
  return TEST_CATALOG.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

export async function runProfilesFeatureGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "feature_inventory"),
      name: "profiles feature file inventory",
      run: async () => {
        const entries = getFeatureSourceEntries().filter((entry) => entry.featureName === "profiles");
        const byDomain = entries.reduce((acc, entry) => {
          const domain = entry.path.split("/")[3] ?? "(root)";
          acc[domain] = (acc[domain] ?? 0) + 1;
          return acc;
        }, {});
        return { fileCount: entries.length, byDomain };
      },
    },
    {
      id: buildTestId(GROUP_ID, "feature_architecture"),
      name: "profiles feature architecture audit",
      run: async () => {
        const audit = trimAudit(auditFeature("profiles"));
        if (audit.issueCount > 0) {
          return failWithData(`Profiles feature has ${audit.issueCount} architecture issues`, audit);
        }
        return audit;
      },
    },
    {
      id: buildTestId(GROUP_ID, "resolve_username_self"),
      name: "resolve self username to actor",
      run: ({ shared: localShared }) =>
        withProfileContext(localShared, "resolveUsernameToActor is blocked by policy.", async (context) => {
          if (!context.username) {
            return makeSkipped("Current actor has no username in actor_presentation.");
          }
          const resolvedActorId = await resolveUsernameToActor(context.username);
          return { username: context.username, actorId: context.actorId, resolvedActorId, matchesSelf: resolvedActorId === context.actorId };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "actor_kind_self"),
      name: "read actor kind for self actor",
      run: ({ shared: localShared }) =>
        withProfileContext(localShared, "getActorKindController blocked by policy.", async (context) => ({
          actorId: context.actorId,
          kind: await getActorKindController(context.actorId),
        })),
    },
    {
      id: buildTestId(GROUP_ID, "vport_type_self"),
      name: "read vport type for self actor",
      run: ({ shared: localShared }) =>
        withProfileContext(localShared, "getVportTypeController blocked by policy.", async (context) => ({
          actorId: context.actorId,
          actorKind: context.actorKind,
          vportType: await getVportTypeController(context.actorId),
        })),
    },
    {
      id: buildTestId(GROUP_ID, "profile_view_self_visible"),
      name: "get profile view self (content on)",
      run: ({ shared: localShared }) =>
        withProfileContext(localShared, "getProfileView (visible) blocked by policy/RPC.", async (context) => {
          const result = await getProfileView({
            viewerActorId: context.actorId,
            profileActorId: context.actorId,
            canViewContent: true,
          });
          return { hasProfile: Boolean(result?.profile), postCount: result?.posts?.length ?? 0, profileKind: result?.profile?.kind ?? null };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "profile_view_self_hidden"),
      name: "get profile view self (content off)",
      run: ({ shared: localShared }) =>
        withProfileContext(localShared, "getProfileView (hidden) blocked by policy/RPC.", async (context) => {
          const result = await getProfileView({
            viewerActorId: context.actorId,
            profileActorId: context.actorId,
            canViewContent: false,
          });
          return { hasProfile: Boolean(result?.profile), postCount: result?.posts?.length ?? 0 };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "posts_tab_controller"),
      name: "profile posts tab controller read",
      run: ({ shared: localShared }) =>
        withProfileContext(localShared, "getActorPostsController blocked by policy.", async (context) => {
          const result = await getActorPostsController({
            actorId: context.actorId,
            page: 0,
            pageSize: 10,
          });
          return { postCount: result?.posts?.length ?? 0, done: Boolean(result?.done) };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "tags_tab_controller"),
      name: "profile vibe tags controller read",
      run: ({ shared: localShared }) =>
        withProfileContext(localShared, "getActorVibeTagsController blocked by policy.", async (context) => {
          const result = await getActorVibeTagsController({ actorId: context.actorId });
          return { ok: Boolean(result?.ok), tagCount: result?.data?.tags?.length ?? 0 };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "friends_tab_controllers"),
      name: "profile friends tab controllers read",
      run: ({ shared: localShared }) =>
        withProfileContext(localShared, "Friends tab controller flow blocked by policy/function grants.", async (context) => {
          const friendLists = await getFriendListsController({ actorId: context.actorId });
          const topIds = await getTopFriendActorIdsController({ ownerActorId: context.actorId, limit: 10, reconcile: false });
          const candidates = await getTopFriendCandidatesController({
            ownerActorId: context.actorId,
            existingIds: topIds?.data?.actorIds ?? [],
            maxRanks: 10,
          });
          return {
            mutual: friendLists?.mutual?.length ?? 0,
            iAmFan: friendLists?.iAmFan?.length ?? 0,
            myFans: friendLists?.myFans?.length ?? 0,
            topIdsOk: Boolean(topIds?.ok),
            topIdsCount: topIds?.data?.actorIds?.length ?? 0,
            candidatesOk: Boolean(candidates?.ok),
            candidatesCount: candidates?.data?.candidateIds?.length ?? 0,
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "vport_read_bundle"),
      name: "vport profile read bundle",
      run: ({ shared: localShared }) =>
        withProfileContext(localShared, "Vport read bundle blocked by policy/RPC.", async (context) => {
          if (!context.ownedVportActorId) {
            return makeSkipped("No owned vport actor found for vport profile diagnostics.");
          }
          const [publicDetails, services, rates, subscribers] = await Promise.all([
            getVportPublicDetailsController(context.ownedVportActorId),
            getVportServicesController({ targetActorId: context.ownedVportActorId, asOwner: false }),
            getVportRatesController({ targetActorId: context.ownedVportActorId }),
            getSubscribersController({ actorId: context.ownedVportActorId, limit: 10, offset: 0 }),
          ]);
          return {
            vportActorId: context.ownedVportActorId,
            hasPublicDetails: Boolean(publicDetails),
            serviceCount: services?.services?.length ?? 0,
            rateCount: rates?.rates?.length ?? 0,
            subscriberCount: subscribers?.count ?? 0,
          };
        }),
    },
  ];

  return runDiagnosticsTests({
    group: GROUP_ID,
    tests,
    onTestUpdate,
    shared,
  });
}
