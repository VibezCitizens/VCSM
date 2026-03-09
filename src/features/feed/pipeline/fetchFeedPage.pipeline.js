// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\feed\pipeline\fetchFeedPage.pipeline.js
import { readFeedPostsPage } from "@/features/feed/dal/feed.read.posts.dal";
import { readPostMediaMap } from "@/features/feed/dal/feed.read.media.dal";
import { readHiddenPostsForViewer } from "@/features/feed/dal/feed.read.hiddenPosts.dal";
import { readActorsBundle } from "@/features/feed/dal/feed.read.actorsBundle.dal";
import { readFeedBlockRowsDAL } from "@/features/feed/dal/feed.read.blockRows.dal";
import { readFeedFollowRowsDAL } from "@/features/feed/dal/feed.read.followRows.dal";
import { normalizeFeedRows } from "@/features/feed/model/normalizeFeedRows";
import { buildBlockedActorSetModel } from "@/features/feed/model/feedBlockVisibility.model";
import { buildFollowedActorSetModel } from "@/features/feed/model/feedFollowVisibility.model";

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
    blockRows,
    followRows,
  ] = await Promise.all([
    readPostMediaMap(pagePostIds),
    hasPotentialMentions ? fetchPostMentionRows(pagePostIds) : Promise.resolve([]),
    readHiddenPostsForViewer({
      viewerActorId,
      postIds: pagePostIds,
    }),
    readActorsBundle(actorIds),
    readFeedBlockRowsDAL({
      viewerActorId,
      actorIds,
    }),
    readFeedFollowRowsDAL({
      viewerActorId,
      actorIds,
    }),
  ]);

  const blockedActorSet = buildBlockedActorSetModel({
    viewerActorId,
    blockRows,
  });
  const followedActorSet = buildFollowedActorSetModel({
    followRows,
  });

  // ✅ mentions
  if (debugPostId && pagePostIds.includes(debugPostId)) {
    console.log("[useFeed][mentions][DBG] debugPostId is on this page", {
      debugPostId,
      pagePostIds,
    });
  }

  const mentionMapsByPostId = buildMentionMaps(mentionRows);

  const { normalized, debugRows } = normalizeFeedRows({
    pageRows,
    actorMap,
    profileMap,
    vportMap,
    blockedActorSet,
    followedActorSet,
    viewerActorId,
    hiddenByMeSet,
    mediaMap,
    mentionMapsByPostId,
    includeDebug: true,
  });

  return {
    normalized,
    debugRows,
    hasMoreNow,
    nextCursorCreatedAt,
    hiddenByMeSet,
    actors,
    profileMap,
    vportMap,
  };
}
