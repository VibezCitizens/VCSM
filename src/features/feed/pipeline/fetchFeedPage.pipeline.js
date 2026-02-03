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

  const mediaMap = await readPostMediaMap(pagePostIds);

  // ✅ mentions
  if (debugPostId && pagePostIds.includes(debugPostId)) {
    console.log("[useFeed][mentions][DBG] debugPostId is on this page", {
      debugPostId,
      pagePostIds,
    });
  }

  const mentionRows = await fetchPostMentionRows(pagePostIds);

  // ✅ FIX: buildMentionMaps is async → must await
  const mentionMapsByPostId = await buildMentionMaps(mentionRows);

  const hiddenByMeSet = await readHiddenPostsForViewer({
    viewerActorId,
    postIds: pagePostIds,
  });

  const actorIds = [...new Set(pageRows.map((r) => r.actor_id).filter(Boolean))];
  const { actors, actorMap, profileMap, vportMap } = await readActorsBundle(actorIds);

  const blockedActorSet = await filterBlockedActors(viewerActorId, actorIds);

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
