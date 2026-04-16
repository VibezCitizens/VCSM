// src/features/feed/pipeline/fetchFeedPage.pipeline.js
import { readFeedPostsPage as _readFeedPostsPage } from "@/features/feed/dal/feed.read.posts.dal";
import { readPostMediaMap as _readPostMediaMap } from "@/features/feed/dal/feed.read.media.dal";
import { readHiddenPostsForViewer as _readHiddenPostsForViewer } from "@/features/feed/dal/feed.read.hiddenPosts.dal";
import { readActorsBundle as _readActorsBundle } from "@/features/feed/dal/feed.read.actorsBundle.dal";
import { readFeedBlockRowsDAL as _readFeedBlockRowsDAL } from "@/features/feed/dal/feed.read.blockRows.dal";
import { readFeedFollowRowsDAL as _readFeedFollowRowsDAL } from "@/features/feed/dal/feed.read.followRows.dal";
import { normalizeFeedRows } from "@/features/feed/model/normalizeFeedRows";
import { buildBlockedActorSetModel } from "@/features/feed/model/feedBlockVisibility.model";
import { buildFollowedActorSetModel } from "@/features/feed/model/feedFollowVisibility.model";

import { fetchPostMentionRows as _fetchPostMentionRows } from "@/features/feed/dal/feed.mentions.dal";
import { buildMentionMaps } from "@/features/feed/model/buildMentionMaps";

import { readCommentCountsBatch as _readCommentCountsBatch } from "@/features/feed/dal/feed.read.commentCounts.dal";
import { readViewerReactionsBatch as _readViewerReactionsBatch } from "@/features/feed/dal/feed.read.viewerReactions.dal";
import { readReactionCountsBatch as _readReactionCountsBatch } from "@/features/feed/dal/feed.read.reactionCounts.dal";

// DEV-ONLY: Wrap DALs with profiler instrumentation
import { wrapDAL, recordStep } from "@debuggers/feed/feedProfiler";

const readFeedPostsPage = import.meta.env.DEV
  ? wrapDAL("readFeedPostsPage", "vc.posts", _readFeedPostsPage)
  : _readFeedPostsPage;

const readPostMediaMap = import.meta.env.DEV
  ? wrapDAL("readPostMediaMap", "vc.post_media", _readPostMediaMap)
  : _readPostMediaMap;

const readHiddenPostsForViewer = import.meta.env.DEV
  ? wrapDAL("readHiddenPostsForViewer", "moderation.actions", _readHiddenPostsForViewer)
  : _readHiddenPostsForViewer;

const readActorsBundle = import.meta.env.DEV
  ? wrapDAL("readActorsBundle", "vc.actors+profiles+vports+privacy", _readActorsBundle)
  : _readActorsBundle;

const readFeedBlockRowsDAL = import.meta.env.DEV
  ? wrapDAL("readFeedBlockRowsDAL", "moderation.blocks", _readFeedBlockRowsDAL)
  : _readFeedBlockRowsDAL;

const readFeedFollowRowsDAL = import.meta.env.DEV
  ? wrapDAL("readFeedFollowRowsDAL", "vc.actor_follows", _readFeedFollowRowsDAL)
  : _readFeedFollowRowsDAL;

const fetchPostMentionRows = import.meta.env.DEV
  ? wrapDAL("fetchPostMentionRows", "vc.post_mentions+actor_presentation", _fetchPostMentionRows)
  : _fetchPostMentionRows;

const readCommentCountsBatch = import.meta.env.DEV
  ? wrapDAL("readCommentCountsBatch", "vc.post_comments", _readCommentCountsBatch)
  : _readCommentCountsBatch;

const readViewerReactionsBatch = import.meta.env.DEV
  ? wrapDAL("readViewerReactionsBatch", "vc.post_reactions", _readViewerReactionsBatch)
  : _readViewerReactionsBatch;

const readReactionCountsBatch = import.meta.env.DEV
  ? wrapDAL("readReactionCountsBatch", "vc.post_reactions+post_rose_gifts", _readReactionCountsBatch)
  : _readReactionCountsBatch;

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
    commentCountsMap,
    viewerReactionsMap,
    reactionCountsMap,
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
    readCommentCountsBatch(pagePostIds),
    readViewerReactionsBatch({ postIds: pagePostIds, actorId: viewerActorId }),
    readReactionCountsBatch(pagePostIds),
  ]);

  if (import.meta.env.DEV) recordStep("parallel_dal_complete", { dalCount: 9 });

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

  if (import.meta.env.DEV) recordStep("normalize_start", { rowCount: pageRows.length });

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
    commentCountsMap,
    viewerReactionsMap,
    reactionCountsMap,
    includeDebug: true,
  });

  if (import.meta.env.DEV) recordStep("normalize_complete", { visiblePosts: normalized.length });

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
