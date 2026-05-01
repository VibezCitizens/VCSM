import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { makeSkipped } from "@/dev/diagnostics/helpers/supabaseAssert";
import { auditFeature } from "@/dev/diagnostics/helpers/featureAudit";
import { getFeatureSourceEntries } from "@/dev/diagnostics/helpers/featureSourceIndex";
import {
  failWithData,
  trimAudit,
  withProfilesFeatureContext,
} from "@/dev/diagnostics/groups/profilesFeature.group.helpers";
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
export { getProfilesFeatureTests } from "@/dev/diagnostics/groups/profilesFeature.group.helpers";

export const GROUP_ID = "profilesFeature";
export const GROUP_LABEL = "Profiles Feature";

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
        withProfilesFeatureContext(localShared, "resolveUsernameToActor is blocked by policy.", async (context) => {
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
        withProfilesFeatureContext(localShared, "getActorKindController blocked by policy.", async (context) => ({
          actorId: context.actorId,
          kind: await getActorKindController(context.actorId),
        })),
    },
    {
      id: buildTestId(GROUP_ID, "vport_type_self"),
      name: "read vport type for self actor",
      run: ({ shared: localShared }) =>
        withProfilesFeatureContext(localShared, "getVportTypeController blocked by policy.", async (context) => ({
          actorId: context.actorId,
          actorKind: context.actorKind,
          vportType: await getVportTypeController(context.actorId),
        })),
    },
    {
      id: buildTestId(GROUP_ID, "profile_view_self_visible"),
      name: "get profile view self (content on)",
      run: ({ shared: localShared }) =>
        withProfilesFeatureContext(localShared, "getProfileView (visible) blocked by policy/RPC.", async (context) => {
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
        withProfilesFeatureContext(localShared, "getProfileView (hidden) blocked by policy/RPC.", async (context) => {
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
        withProfilesFeatureContext(localShared, "getActorPostsController blocked by policy.", async (context) => {
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
        withProfilesFeatureContext(localShared, "getActorVibeTagsController blocked by policy.", async (context) => {
          const result = await getActorVibeTagsController({ actorId: context.actorId });
          return { ok: Boolean(result?.ok), tagCount: result?.data?.tags?.length ?? 0 };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "friends_tab_controllers"),
      name: "profile friends tab controllers read",
      run: ({ shared: localShared }) =>
        withProfilesFeatureContext(localShared, "Friends tab controller flow blocked by policy/function grants.", async (context) => {
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
        withProfilesFeatureContext(localShared, "Vport read bundle blocked by policy/RPC.", async (context) => {
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
