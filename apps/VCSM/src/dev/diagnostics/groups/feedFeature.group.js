import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { auditFeature } from "@/dev/diagnostics/helpers/featureAudit";
import {
  isPermissionDenied,
  isRlsDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
import {
  extractImportSpecifiers,
  failWithData,
  FEED_FEATURE_TEST_CATALOG,
  getFeedEntries,
  getFeedSource,
  getRootDomain,
  isCrossFeatureBoundaryViolation,
  trimAudit,
  withFeedFeatureContext,
} from "@/dev/diagnostics/groups/feedFeature.group.helpers";
import { useFeed } from "@/features/feed/hooks/useFeed";
import { fetchFeedPagePipeline } from "@/features/feed/pipeline/fetchFeedPage.pipeline";
import { getFeedViewerIsAdult } from "@/features/feed/controllers/getFeedViewerContext.controller";
import { listActorPosts } from "@/features/feed/controllers/listActorPosts.controller";
import { listFeedPosts } from "@/features/feed/dal/feed.posts.dal";
import { inferMediaType } from "@/features/feed/model/inferMediaType";
import { buildMentionMaps } from "@/features/feed/model/buildMentionMaps";
import {
  buildBlockedActorSetModel,
  isActorBlockedForViewerModel,
} from "@/features/feed/model/feedBlockVisibility.model";
import {
  buildFollowedActorSetModel,
  isActorFollowedByViewerModel,
} from "@/features/feed/model/feedFollowVisibility.model";
import { canViewPrivateFeedActorModel } from "@/features/feed/model/feedPrivateVisibility.model";
import { resolveFeedRowVisibilityModel } from "@/features/feed/model/feedRowVisibility.model";
import { normalizeFeedRows } from "@/features/feed/model/normalizeFeedRows";
import CentralFeed from "@/features/feed/screens/CentralFeedScreen";
import DebugFeedFilterPanel from "@/features/feed/screens/DebugFeedFilterPanel";
import DebugPrivacyPanel from "@/features/feed/screens/DebugPrivacyPanel";

export const GROUP_ID = "feedFeature";
export const GROUP_LABEL = "Feed Feature";

export function getFeedFeatureTests() {
  return FEED_FEATURE_TEST_CATALOG.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

export async function runFeedFeatureGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "feature_inventory"),
      name: "feed file inventory",
      run: async () => {
        const entries = getFeedEntries();
        const byDomain = entries.reduce((acc, entry) => {
          const domain = getRootDomain(entry.path);
          acc[domain] = (acc[domain] ?? 0) + 1;
          return acc;
        }, {});
        return { fileCount: entries.length, byDomain };
      },
    },
    {
      id: buildTestId(GROUP_ID, "feature_architecture"),
      name: "feed architecture audit",
      run: async () => {
        const audit = trimAudit(auditFeature("feed"));
        if (audit.issueCount > 0) {
          return failWithData(`Feed feature has ${audit.issueCount} architecture issues`, audit);
        }
        return audit;
      },
    },
    {
      id: buildTestId(GROUP_ID, "import_path_contract"),
      name: "feed import path contract check",
      run: async () => {
        const entries = getFeedEntries();
        const importPattern = /(?:from\s+["'](\.{1,2}\/[^"']+)["']|import\s*\(\s*["'](\.{1,2}\/[^"']+)["']\s*\))/g;
        const violations = [];

        for (const entry of entries) {
          const hits = [];
          let match = importPattern.exec(entry.source ?? "");
          while (match) {
            hits.push(match[1] ?? match[2]);
            match = importPattern.exec(entry.source ?? "");
          }
          importPattern.lastIndex = 0;
          if (hits.length) violations.push({ path: entry.path, imports: hits });
        }

        if (violations.length > 0) {
          return failWithData("Relative imports detected in feed source.", {
            count: violations.length,
            sample: violations.slice(0, 25),
          });
        }

        return { checkedFiles: entries.length, violations: 0 };
      },
    },
    {
      id: buildTestId(GROUP_ID, "cross_feature_boundary"),
      name: "feed cross-feature boundary check",
      run: async () => {
        const entries = getFeedEntries();
        const violations = [];
        for (const entry of entries) {
          const specifiers = extractImportSpecifiers(entry.source);
          const bad = specifiers.filter((specifier) =>
            isCrossFeatureBoundaryViolation("feed", specifier)
          );
          if (bad.length) violations.push({ path: entry.path, imports: bad });
        }

        if (violations.length > 0) {
          return failWithData("Cross-feature internal imports detected in feed feature.", {
            count: violations.length,
            sample: violations.slice(0, 25),
          });
        }

        return { checkedFiles: entries.length, violations: 0 };
      },
    },
    {
      id: buildTestId(GROUP_ID, "folder_shape_contract"),
      name: "feed folder shape contract",
      run: async () => {
        const entries = getFeedEntries();
        const domains = new Set(entries.map((entry) => getRootDomain(entry.path)));
        const payload = {
          domains: Array.from(domains).sort((a, b) => a.localeCompare(b)),
          hasAdapters: domains.has("adapters"),
          hasControllers: domains.has("controllers"),
          hasPipeline: domains.has("pipeline"),
          hasUsecases: domains.has("usecases"),
          hasIndex: entries.some((entry) => entry.path === "src/features/feed/index.js"),
        };

        if (!payload.hasPipeline || !payload.hasControllers || !payload.hasAdapters) {
          return failWithData("Feed feature folder shape missing expected domains.", payload);
        }
        return payload;
      },
    },
    {
      id: buildTestId(GROUP_ID, "surface_contract"),
      name: "feed export surface contract",
      run: async () => ({
        hasUseFeedHook: typeof useFeed === "function",
        hasFeedPipeline: typeof fetchFeedPagePipeline === "function",
        hasViewerController: typeof getFeedViewerIsAdult === "function",
        hasListActorPostsController: typeof listActorPosts === "function",
        hasListFeedPostsDal: typeof listFeedPosts === "function",
        hasInferMediaTypeModel: typeof inferMediaType === "function",
        hasBuildMentionMapsModel: typeof buildMentionMaps === "function",
        hasBuildBlockedActorSetModel: typeof buildBlockedActorSetModel === "function",
        hasBuildFollowedActorSetModel: typeof buildFollowedActorSetModel === "function",
        hasCanViewPrivateModel: typeof canViewPrivateFeedActorModel === "function",
        hasResolveVisibilityModel: typeof resolveFeedRowVisibilityModel === "function",
        hasNormalizeFeedRowsModel: typeof normalizeFeedRows === "function",
        hasCentralFeedScreen: typeof CentralFeed === "function",
        hasDebugFilterPanel: typeof DebugFeedFilterPanel === "function",
        hasDebugPrivacyPanel: typeof DebugPrivacyPanel === "function",
      }),
    },
    {
      id: buildTestId(GROUP_ID, "pure_model_contract"),
      name: "feed pure model contract checks",
      run: async () => {
        const blocked = buildBlockedActorSetModel({
          viewerActorId: "viewer-1",
          blockRows: [{ blocker_actor_id: "viewer-1", blocked_actor_id: "actor-2" }],
        });
        const followed = buildFollowedActorSetModel({
          followRows: [{ follower_actor_id: "viewer-1", followed_actor_id: "actor-2", is_active: true }],
        });
        const mentionMap = buildMentionMaps([
          { post_id: "p1", mentioned_actor_id: "a1", kind: "user", username: "alice" },
          { post_id: "p1", mentioned_actor_id: "a2", kind: "vport", slug: "studio42", vport_id: "v1" },
        ]);

        return {
          inferVideo: inferMediaType("https://x/y/video.mp4"),
          inferImage: inferMediaType("https://x/y/photo.jpg"),
          blockedActorDetected: isActorBlockedForViewerModel({ actorId: "actor-2", blockedActorSet: blocked }),
          followedActorDetected: isActorFollowedByViewerModel({ actorId: "actor-2", followedActorSet: followed }),
          privateVisibleAsOwner: canViewPrivateFeedActorModel({ isPrivate: true, isOwner: true, isFollowing: false }),
          mentionPostKeys: Object.keys(mentionMap),
          mentionP1Keys: Object.keys(mentionMap.p1 ?? {}),
        };
      },
    },
    {
      id: buildTestId(GROUP_ID, "viewer_context_controller"),
      name: "feed viewer context controller read path",
      run: ({ shared: localShared }) =>
        withFeedFeatureContext(
          localShared,
          "Feed viewer context read is blocked by policy/RLS.",
          async (context) => {
            const isAdult = await getFeedViewerIsAdult({ viewerActorId: context.actorId });
            return { actorId: context.actorId, isAdult };
          }
        ),
    },
    {
      id: buildTestId(GROUP_ID, "list_actor_posts_controller"),
      name: "feed list actor posts controller read path",
      run: ({ shared: localShared }) =>
        withFeedFeatureContext(
          localShared,
          "Feed listActorPosts read is blocked by policy/RLS.",
          async (context) => {
            const rows = await listActorPosts({
              actorId: context.actorId,
              viewerActorId: context.actorId,
            });
            return { actorId: context.actorId, count: rows.length, sample: rows.slice(0, 5) };
          }
        ),
    },
    {
      id: buildTestId(GROUP_ID, "feed_page_pipeline"),
      name: "feed page pipeline read path",
      run: ({ shared: localShared }) =>
        withFeedFeatureContext(
          localShared,
          "Feed pipeline read is blocked by policy/RLS.",
          async (context) => {
            const result = await fetchFeedPagePipeline({
              viewerActorId: context.actorId,
              realmId: null,
              cursorCreatedAt: null,
              pageSize: 5,
            });
            return {
              normalizedCount: result?.normalized?.length ?? 0,
              debugCount: result?.debugRows?.length ?? 0,
              hasMoreNow: result?.hasMoreNow ?? false,
              sample: (result?.normalized ?? []).slice(0, 3),
            };
          }
        ),
    },
    {
      id: buildTestId(GROUP_ID, "legacy_feed_posts_dal"),
      name: "feed legacy listFeedPosts DAL read path",
      run: async () => {
        try {
          const rows = await listFeedPosts({ limit: 5 });
          return { count: rows.length, sample: rows.slice(0, 5) };
        } catch (error) {
          if (isPermissionDenied(error) || isRlsDenied(error)) {
            return makeSkipped("Legacy feed.posts DAL read blocked by policy/RLS.", { error });
          }
          throw error;
        }
      },
    },
    {
      id: buildTestId(GROUP_ID, "source_contract"),
      name: "feed source contract checks",
      run: async () => {
        const useFeedSource = getFeedSource("src/features/feed/hooks/useFeed.js");
        const screenSource = getFeedSource("src/features/feed/screens/CentralFeedScreen.jsx");
        const debugSource = getFeedSource("src/features/feed/screens/DebugPrivacyPanel.jsx");
        const dalIndexSource = getFeedSource("src/features/feed/dal/index.js");
        return {
          useFeedHasTimeoutGuard: useFeedSource.includes("FEED_FETCH_TIMEOUT_MS"),
          useFeedHasMediaPreload: useFeedSource.includes("preloadInitialMedia"),
          useFeedHasPaginationGuard: useFeedSource.includes("MAX_EMPTY_PAGES_PER_FETCH"),
          centralFeedImportsCrossFeatureInternals: screenSource.includes("@/features/post/") || screenSource.includes("@/features/social/"),
          debugPanelImportsSupabaseDirectly: debugSource.includes("supabaseClient"),
          dalIndexIsEmpty: dalIndexSource.trim().length === 0,
        };
      },
    },
  ];

  return runDiagnosticsTests({
    group: GROUP_ID,
    tests,
    onTestUpdate,
    shared,
  });
}
