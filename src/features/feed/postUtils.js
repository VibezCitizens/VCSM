// src/features/feed/postUtils.js
// DEPRECATED IN NEW CODE: keep as a thin wrapper so older imports still work.
// New code should call `db.feed.fetchPage` via the useFeed hook or directly.
import { db } from '@/data/data';

/**
 * Signature preserved to avoid churn; forwards to the centralized DAL:
 * db.feed.fetchPage({ page, pageSize, viewerIsAdult, includeVideos, userAuthorCache, vportAuthorCache })
 */
export async function fetchUnifiedFeedWithAuthors(params) {
  return db.feed.fetchPage(params);
}

export default { fetchUnifiedFeedWithAuthors };
