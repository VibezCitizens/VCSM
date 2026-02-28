// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\feed\pipeline\fetchFeedPage.pipeline.js
import { readFeedPostsPage } from "@/features/feed/dal/feed.read.posts.dal";
import { readPostMediaMap } from "@/features/feed/dal/feed.read.media.dal";
import { readHiddenPostsForViewer } from "@/features/feed/dal/feed.read.hiddenPosts.dal";
import { readActorsBundle } from "@/features/feed/dal/feed.read.actorsBundle.dal";
import { normalizeFeedRows } from "@/features/feed/model/normalizeFeedRows";
import { filterBlockedActors } from "@/features/block/dal/block.read.dal";

// ✅ use existing mentions DAL
import { fetchPostMentionRows } from "@/features/feed/dal/feed.mentions.dal";
import { buildMentionMaps } from "@/features/feed/model/buildMentionMaps";

export async function fetchFeedPagePipeline({
  viewerActorId,
  realmId,
  cursorCreatedAt,
  pageSize,
  debugPostId,
}) {
  const { pageRows, hasMoreNow, nextCursorCreatedAt } = await readFeedPostsPage({
    realmId,
    cursorCreatedAt,
    pageSize,
  });

  const pagePostIds = pageRows.map((r) => r.id).filter(Boolean);
  const actorIds = [...new Set(pageRows.map((r) => r.actor_id).filter(Boolean))];

  const hasPotentialMentions = pageRows.some(
    (row) => typeof row?.text === "string" && row.text.includes("@")
  );

  const [
    mediaMap,
    mentionRows,
    hiddenByMeSet,
    { actors, actorMap, profileMap, vportMap },
    blockedActorSet,
  ] = await Promise.all([
    readPostMediaMap(pagePostIds),
    hasPotentialMentions ? fetchPostMentionRows(pagePostIds) : Promise.resolve([]),
    readHiddenPostsForViewer({
      viewerActorId,
      postIds: pagePostIds,
    }),
    readActorsBundle(actorIds),
    filterBlockedActors(viewerActorId, actorIds),
  ]);

  // ✅ mentions
  if (debugPostId && pagePostIds.includes(debugPostId)) {
    console.log("[useFeed][mentions][DBG] debugPostId is on this page", {
      debugPostId,
      pagePostIds,
    });
  }

  const mentionMapsByPostId = buildMentionMaps(mentionRows);

  const normalized = normalizeFeedRows({
    pageRows,
    actorMap,
    profileMap,
    vportMap,
    blockedActorSet,
    viewerActorId,
    hiddenByMeSet,
    mediaMap,
    mentionMapsByPostId,
  });

  return {
    normalized,
    hasMoreNow,
    nextCursorCreatedAt,
    hiddenByMeSet,
    actors,
    profileMap,
    vportMap,
  };
}
