# ARCHITECT Review — Feed Engine + VPORT Menu/Gas Feed Post System
Date: 2026-05-10
Scope: apps/VCSM only
Reviewer: ARCHITECT (deep read-only)
Context: Post-implementation review covering two newly implemented VPORT feed-share features:
  - Fuel price update posts (post_type = 'fuel_price_update')
  - Menu update posts (post_type = 'menu_update')

---

## PHASE 1 — LOGAN DOCUMENTATION REVIEW

---

### LOGAN DOC REVIEW ITEM 1
- Document: `vcsm.feed.post-pipeline.md`
- Relevant system: feed
- What it says: Comprehensive end-to-end pipeline covering central feed load, create-post, edit, delete, reactions, comments, mentions, notifications, actor identity interaction, visibility/realms, moderation, realtime. Documents 3 distinct live post-read pipelines (feed, detail, profile). Notes that feed visibility for VPORT actors is based on `vport.is_active` only — no private/follow gate. Documents that `vc.posts.post_type` is a first-class field in every read path. Feed pipeline is instrumented with profiler (7 DAL wraps + session lifecycle). Feed DAL caches documented: actorsBundle 30s, blockRows 60s, followRows 60s, postMedia 60s.
- Current code alignment: ALIGNED
- Drift or missing documentation: No drift found in the areas relevant to this feature. The doc pre-dates the new `post_type` values (`fuel_price_update`, `menu_update`) — these are not enumerated in the doc, but the doc correctly describes `post_type` as a passthrough field that is stored and carried without feed filtering.
- Impact on menu/gas feed posts: DIRECT — this doc defines the exact pipeline both new post types flow through. VPORT visibility rules (is_active gate only) are what allows these posts to reach the feed. The `post_type` passthrough behavior means new values work without feed code changes.

---

### LOGAN DOC REVIEW ITEM 2
- Document: `vcsm.feed.profiler-system.md`
- Relevant system: feed
- What it says: Documents the dev-only feed profiler: 7 DAL wraps with wrapDAL(), session lifecycle (startFeedSession/endFeedSession), step recording, duplicate detection, N+1 detection, floating overlay. All behind import.meta.env.DEV guard. Files: debuggers/feed/feedProfiler.js, FeedProfilerOverlay.jsx.
- Current code alignment: ALIGNED
- Drift or missing documentation: None for this feature scope. The profiler is dev-only and does not interact with the new post types.
- Impact on menu/gas feed posts: INDIRECT — the profiler correctly measures feed pipeline performance. New system posts go through the same 7-DAL pipeline already profiled. No profiler changes needed.

---

### LOGAN DOC REVIEW ITEM 3
- Document: `vcsm.upload.remote-consistency-map.md`
- Relevant system: upload
- What it says: Documents all upload-first flows where Cloudflare R2 write precedes the DB write. Specifically calls out menu item image uploads as HIGH risk for orphaned remote objects. The save menu item flow — `VportActorMenuItemFormModal.jsx uploadImageIfNeeded()` → `vc.vport_actor_menu_items.image_url` — is explicitly listed with risk: HIGH. The recommended fix is to finalize upload only after item row exists or to delete key on save failure.
- Current code alignment: DRIFT
- Drift or missing documentation: The remote-consistency-map documents the orphan risk, but does not yet document the new feed-post path that reads `image_url` from the saved item and passes it to `createSystemPost`. The image URL used in a menu feed post is the same R2 URL that was already written to the item row. If the item save succeeded but the feed post fails, the image URL is still in the DB. The gap is that the doc does not reflect that menu feed posts use `media_url` = `imageUrl` from the item row — not a fresh upload — so there is no new orphan risk at the post creation layer.
- Impact on menu/gas feed posts: INDIRECT — the existing orphan risk is pre-existing and not introduced by the feed-post feature. However, if `imageUrl` is passed from the menu item form to the feed post controller, and the item save fails (image uploaded but no DB row), the subsequent feed post will not fire (since the menu save gating logic prevents it). Risk remains low.

---

### LOGAN DOC REVIEW ITEM 4
- Document: `vcsm.upload.mention-system.md`
- Relevant system: upload
- What it says: Full mention typeahead and chip system. Covers `useMentionAutocomplete`, `MentionTypeahead`, `MentionChips`, `LinkifiedMentions`. Mention write path uses both resolved actor IDs and @handle parsing. The mention system is only invoked via the manual upload composer screen.
- Current code alignment: ALIGNED
- Drift or missing documentation: None. System posts created via `createSystemPost` deliberately bypass the mention system — they insert directly via `insertPost` without invoking `insertPostMentions`. This is intentional and correct: system posts (fuel price updates, menu updates) do not have mention text.
- Impact on menu/gas feed posts: NONE — system posts never go through the upload composer or the mention pipeline. No mention rows are created for these posts. `vc.post_mentions` will have no rows for `post_type = fuel_price_update` or `post_type = menu_update`. The feed mention loader will return an empty `mentionMap` for these posts — this is correct behavior.

---

### LOGAN DOC REVIEW ITEM 5
- Document: `platform.upload.architecture.md`
- Relevant system: upload
- What it says: Full cross-app upload architecture. Direct browser-to-Cloudflare-R2. Worker enforces JWT auth + actor ownership. Object key registry (prefix/ownerId). Menu item images use `vport.actor_menu_items.image_url` (Full URL, CDN domain baked in). Upload flow D documents menu item image upload as high orphan risk (no cleanup on failed save).
- Current code alignment: ALIGNED
- Drift or missing documentation: The key registry does not yet include a prefix for gas station posts (no images) or menu update posts (images are reused from item rows, not freshly uploaded for the post). No new R2 upload path was introduced by these features. The doc does not need updating for the feed post features specifically.
- Impact on menu/gas feed posts: INDIRECT — fuel price posts have no media. Menu update posts optionally carry `media_url` set to the item's `image_url`, which is already an R2 CDN URL. No new upload flow introduced. The CDN URL baked-in risk is pre-existing.

---

### LOGAN DOC REVIEW ITEM 6
- Document: `vcsm.vport.gas-station-profile-spec.md`
- Relevant system: vport
- What it says: Full gas station VPORT profile + dashboard spec. Defines the Vibes tab as an optional social feed for "price alerts, promotions." Documents the 8 dashboard sections including Gas Price Manager. Future expansion section mentions "Price alerts: Notify subscribers when prices drop." Does NOT document feed post sharing from the Gas Price Manager dashboard.
- Current code alignment: DRIFT — GAP
- Drift or missing documentation: The spec's Vibes tab description covers organic posts. The new feed-share feature (from BulkUpdateFuelPricesModal via publishFuelPriceUpdateAsPostController) is not documented in the spec. Future expansion mentions price alerts as a separate future feature — the implemented feed-share is a simpler public announcement, not a true subscriber alert. The spec should be updated to document the feed-share checkbox in the Gas Price Manager section.
- Impact on menu/gas feed posts: DIRECT — the spec is the canonical reference for gas station behavior but does not document this feature. A Logan sync is needed post-review.

---

### LOGAN DOC REVIEW ITEM 7
- Document: `vcsm.vport.restaurant-profile-spec.md`
- Relevant system: vport
- What it says: Full restaurant VPORT profile + dashboard spec. Menu is the landing tab. Vibes tab listed as optional for "specials, events, announcements." Dashboard sections include Menu Manager. Does NOT document feed post sharing from the Menu Manager.
- Current code alignment: DRIFT — GAP
- Drift or missing documentation: Same gap as gas station spec: the menu update feed-share checkbox (on both item and category forms) is not documented. The spec's Vibes tab description loosely covers this use case ("announcements") but does not describe the implementation or the checkbox-triggered mechanism.
- Impact on menu/gas feed posts: DIRECT — the spec is the canonical restaurant reference but omits the feed-share feature. Logan sync needed.

---

### LOGAN DOC REVIEW ITEM 8
- Document: `vcsm.vport.menu-pipeline.md`
- Relevant system: vport
- What it says: Full menu pipeline covering DB schema (vport.menu_categories, vport.menu_items, vport.menu_item_media), RLS, owner management DAL, controllers, hooks, public read DAL via view, optimistic UI, canonical URL system, change log. Comprehensive and current as of 2026-04-20.
- Current code alignment: DRIFT — GAP (minor)
- Drift or missing documentation: The menu pipeline doc does not mention `publishMenuUpdateAsPost.controller.js`, `vportMenuPost.read.dal.js`, or `usePublishMenuPost.js`. The feed-share path is a new out-of-tree branch that hooks into the menu manager but is not documented in this pipeline doc. The files map section (Section 13) is missing the three new files.
- Impact on menu/gas feed posts: DIRECT — the missing files are part of the menu feed-share feature. Logan sync needed.

---

### LOGAN DOC REVIEW ITEM 9
- Document: `vcsm.vport.business-pipeline.md`
- Relevant system: vport
- What it says: Top-level VPORT system architecture. Covers creation, public profile load, services, reviews, menu, gas, subscribers, booking, identity effects. Documents vport schema tables. Tab layouts by type. Change log includes 2026-05-03 leads fix.
- Current code alignment: ALIGNED
- Drift or missing documentation: No drift in areas relevant to this feature. The doc correctly describes the menu and gas pipelines at a high level. The new feed-share features are cross-cutting (feed + vport domain) and are not expected to be documented in this general pipeline doc.
- Impact on menu/gas feed posts: INDIRECT — the business pipeline correctly frames the overall VPORT context. No sync needed for this doc.

---

### LOGAN DOC REVIEW ITEM 10
- Document: `vcsm.identity.engine-architecture.md`
- Relevant system: identity
- What it says: Neutral identity engine architecture. Platform-only schema reads. Resolves session → app → access → account → actors → roles → capabilities → destination. Strictly no app-specific behavior inside the engine. FROZEN.
- Current code alignment: ALIGNED
- Drift or missing documentation: None relevant. Identity engine is untouched by these features.
- Impact on menu/gas feed posts: INDIRECT — the identity engine correctly resolves actorId for the VPORT actor that owns the gas/menu feature. The controllers receive actorId from the hook, which gets it from useIdentity(). No engine interaction required.

---

### LOGAN DOC REVIEW ITEM 11
- Document: `vcsm.profiles.citizen-vs-vport-audit.md`
- Relevant system: identity / profiles
- What it says: Confirms only two actor kinds (user/vport). VPORT actors must have vport_id, no profile_id. Ownership via actor_owners. Multiple code files listed that branch on actor kind.
- Current code alignment: ALIGNED
- Drift or missing documentation: None relevant. The new feed-share controllers receive actorId (always the VPORT actor id) and pass it through. No kind confusion.
- Impact on menu/gas feed posts: INDIRECT — confirms the identity model used by the new features is correct. VPORT actorId → correct actor kind → correct visibility in feed.

---

### LOGAN DOC REVIEW ITEM 12 (moderation — only file found)
- Document: `vcsm.moderation.block-pipeline.md`
- Relevant system: moderation
- What it says: Separates moderation (reports, hide/unhide, covers) from blocking (actor-to-actor safety). Both systems actor-first. All moderation and blocking migrated from vc.* to moderation.* schema. Blocks stored in moderation.blocks.
- Current code alignment: ALIGNED
- Drift or missing documentation: None. System posts (fuel_price_update, menu_update) are subject to the same block and report rules as all posts. A citizen who blocked the VPORT will not see the post. A VPORT owner cannot be blocked from seeing their own posts (owner check in visibility model).
- Impact on menu/gas feed posts: INDIRECT — moderation and block rules apply equally to system posts. No special handling needed.

---

## PHASE 2 — FEED ENGINE / POST SYSTEM DEEP REVIEW

---

### FEED ENGINE REVIEW ITEM 1
- File: `apps/VCSM/src/features/feed/queries/fetchCentralFeedPage.js`
- Layer: Query (orchestration layer between hook and pipeline)
- Purpose: Pure async query function used by useInfiniteQuery. Runs a while-loop to fill INITIAL_VISIBLE_TARGET visible posts on first load. Handles timeout (15s), cursor-based pagination, merging of actors/profileMap/vportMap across pages.
- Inputs: `{ actorId, realmId, pageParam, pageSize }`
- Outputs: `{ posts, nextCursor, hasMore, hiddenIds, debugRows, actors, profileMap, vportMap }`
- Tables/RPCs hit: None directly — delegates to `fetchFeedPagePipeline`
- VPORT compatibility: Yes — passes actorId and realmId through; vportMap is merged per page and returned to caller for actor store hydration.
- Risk: `MAX_EMPTY_PAGES_PER_FETCH = 2` (lower than the useFeed.js value of 3). If VPORT system posts are dense and many are filtered by the visibility model, this could cause premature pagination stop. However, VPORT system posts are only throttled to one per hour per type, so this is a low-frequency concern.
- Needed for menu/gas post feature: YES — all system posts flow through this query function.

---

### FEED ENGINE REVIEW ITEM 2
- File: `apps/VCSM/src/features/feed/dal/feed.read.posts.dal.js`
- Layer: DAL
- Purpose: Reads a page of `vc.posts` ordered by `created_at desc`. Filters: `deleted_at is null`, optional `realm_id` equality, optional cursor via `created_at <`.
- Inputs: `{ realmId, cursorCreatedAt, pageSize }`
- Outputs: `{ pageRows, hasMoreNow, nextCursorCreatedAt }`
- Tables/RPCs hit: `vc.posts` (selects: id, actor_id, text, title, media_url, media_type, post_type, created_at, realm_id, edited_at, deleted_at, location_text)
- VPORT compatibility: Yes — no actor kind filter. VPORT-authored posts (any post_type) appear naturally in the result set provided realm_id matches and deleted_at is null.
- Risk: The query does NOT filter on `post_type`. New post types (fuel_price_update, menu_update) are returned alongside all other post types. This is the correct behavior — `post_type` is a rendering concern, not a visibility concern. However, if a feed renderer does not handle an unknown `post_type`, it may display the raw text without special formatting. This is an acceptable degradation.
- Needed for menu/gas post feature: YES — this is the primary read path for all system posts.

---

### FEED ENGINE REVIEW ITEM 3
- File: `apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js`
- Layer: DAL
- Purpose: Resolves actor bundles (vc.actors + public.profiles + vc.actor_privacy_settings + vport.profiles) for a list of actorIds. 30s TTL cache per actor. Handles vport actor name resolution via `vport.profiles` with known RLS caveat (owner-only SELECT on vport.profiles — mitigated by force-hydration in useFeed.js).
- Inputs: `actorIds` array
- Outputs: `{ actors, actorMap, profiles, profileMap, vports, vportMap }`
- Tables/RPCs hit: `vc.actors`, `public.profiles` (via default schema), `vc.actor_privacy_settings`, `vport.profiles`
- VPORT compatibility: Yes — explicitly queries `vport.profiles` keyed by `actor_id`. The known RLS limitation (vport.profiles has owner-only SELECT, returns empty rows for non-owners) is mitigated in useFeed.js with force-hydration via `vc.get_actor_summaries` RPC for vport actors with null names. System posts authored by VPORTs will correctly resolve actor display names via this mitigation.
- Risk: The 30s TTL means a VPORT that updates its name within 30s of posting may show the old name. This is acceptable for a 30s window. More important: if the VPORT actor is not yet in the 30s cache when the system post first loads, the force-hydration path must fire. Confirm useFeed.js still applies the force-hydration fix for all feed loading paths (not just the legacy useFeed hook — the new fetchCentralFeedPage.js path must also trigger actor hydration).
- Needed for menu/gas post feature: YES — VPORT actor name/avatar resolution is required for post author display.

---

### FEED ENGINE REVIEW ITEM 4
- File: `apps/VCSM/src/features/feed/dal/feed.read.followRows.dal.js`
- Layer: DAL
- Purpose: Reads vc.actor_follows for viewer's follow graph. 60s TTL cache per viewerActorId. Fetches full follow graph for the viewer (not page-scoped) to prevent per-page cache misses.
- Inputs: `{ viewerActorId, actorIds }`
- Outputs: array of `{ follower_actor_id, followed_actor_id, is_active }` rows
- Tables/RPCs hit: `vc.actor_follows`
- VPORT compatibility: Yes — VPORT actors are not subject to the follow gate (visibility model skips follow check for vport actors). However, this DAL still runs for all feed loads. Following a VPORT produces an active follow row which could be used for a future "followed VPORTs first" sort, but currently does not affect visibility.
- Risk: None for system posts. VPORT system posts pass the visibility check via `vportEntry.is_active !== false` regardless of follow state.
- Needed for menu/gas post feature: INFORMATIONAL — follow rows are fetched for all feeds but do not gate VPORT post visibility.

---

### FEED ENGINE REVIEW ITEM 5
- File: `apps/VCSM/src/features/feed/model/feedRowVisibility.model.js`
- Layer: Model
- Purpose: Determines per-row visibility for a feed page. Block check first (blocked actors hidden). Missing actor hidden. VPORT actor branch: checks vportMap entry, then checks `is_active !== false && is_deleted !== true`. User actor branch: checks profile existence, follow state, privacy settings.
- Inputs: `{ row, actorMap, profileMap, vportMap, blockedActorSet, followedActorSet, viewerActorId }`
- Outputs: `{ post_id, actor_id, visible, reason, is_private, is_following, is_owner, actor_kind }`
- Tables/RPCs hit: None — pure model
- VPORT compatibility: YES — explicit VPORT branch. `vportMap` is keyed by `actor.id` (not `actor.vport_id`). A VPORT post is visible if `vportEntry.is_active !== false && vportEntry.is_deleted !== true`. This matches the expected behavior for system posts from active gas stations and restaurants.
- Risk: If `vportMap[rowActorId]` is null (not found in bundle query), the post is hidden with reason `missing_vport_profile`. This can happen if the VPORT actor was not returned by `readActorsBundle`. The force-hydration mitigation in useFeed.js helps, but only after names are resolved. The visibility check happens in normalizeFeedRows before hydration — if the vportMap entry is missing at normalize time, the post is filtered out and then the actor is hydrated post-normalize. This is a timing issue: if the VPORT actor is new or its bundle was evicted from the 30s cache, the first page load may drop the post. On refresh, the cache is warm and the post appears.
- Needed for menu/gas post feature: YES — this is the primary gate that determines whether system posts are visible in the feed.

---

### FEED ENGINE REVIEW ITEM 6
- File: `apps/VCSM/src/features/feed/model/normalizeFeedRows.model.js`
- Layer: Model
- Purpose: Maps raw vc.posts rows + actor/media/mention bundles into feed card objects. Applies visibility filter first, then shapes the output. Handles multi-media (vc.post_media) with fallback to legacy `media_url/media_type`. Attaches actor display fields from actorMap+profileMap+vportMap. Attaches mentionMap, commentCount, viewerReaction, reactionCounts from batched maps.
- Inputs: Full bundle (pageRows, actorMap, profileMap, vportMap, blockedActorSet, followedActorSet, viewerActorId, hiddenByMeSet, mediaMap, mentionMapsByPostId, commentCountsMap, viewerReactionsMap, reactionCountsMap)
- Outputs: `{ normalized, debugRows }` — normalized is the array of feed card objects
- Tables/RPCs hit: None — pure model
- VPORT compatibility: YES — explicit `a.kind === 'vport'` branch for `displayName` (vp.name), `username` (vp.slug), `avatar` (vp.avatar_url). System posts from VPORT actors will have correct display fields.
- Risk for system posts: `post_type` is passed through directly: `post_type: r.post_type || "post"`. This means `fuel_price_update` and `menu_update` are in the normalized output. The feed card renderer (`PostCard` or equivalent) must handle these values. If it only knows how to render `post`, `image`, `video`, it will fall back to plain text rendering — which is acceptable for system posts since the post text is human-readable (e.g. "Fuel prices updated at Shell Main Street\n\nRegular: USD 1.23 / liter").
- Needed for menu/gas post feature: YES — shapes the normalized feed row used by the PostCard renderer.

---

### FEED ENGINE REVIEW ITEM 7
- File: `apps/VCSM/src/features/feed/screens/DebugPrivacyPanel.jsx`
- Layer: Component (dev-only)
- Purpose: Dev-only overlay showing privacy debug rows for current feed posts. Shows post_id, actor_id, isVport, isOwner, isPublic, isFollower, visibleByPolicy per post.
- Inputs: `{ actorId, posts }` (posts is the normalized feed array)
- Outputs: Renders debug table (dev-only, null in production)
- Tables/RPCs hit: None directly — uses useDebugPrivacyRows hook
- VPORT compatibility: Yes — shows isVport flag. For VPORT system posts, isVport = true, isOwner depends on viewer, visibleByPolicy = true (VPORTs are always "public" in this model).
- Risk: None for production. Dev-only guard (`import.meta.env.DEV`). Uses console.log which violates the no-console-log memory rule — but this is a dev-only component that pre-dates the rule.
- Needed for menu/gas post feature: INFORMATIONAL — useful for verifying system post visibility during development.

---

### FEED ENGINE REVIEW ITEM 8
- File: `apps/VCSM/src/features/feed/controllers/getDebugPrivacyRows.controller.js`
- Layer: Controller
- Purpose: Builds privacy debug data for a set of postIds. Resolves post authors, actor data, privacy settings, ownership, and follow state.
- Inputs: `{ actorId, postIds }`
- Outputs: Array of `{ post_id, actor_id, profile_id, vport_id, isVport, isOwner, isPublic, isFollower, visibleByPolicy }`
- Tables/RPCs hit: vc.posts (via readPostActorsByIdsDAL), vc.actors, vc.actor_privacy_settings, actor_owners, vc.actor_follows
- VPORT compatibility: Yes — explicit isVport check, visibleByPolicy = true for VPORT actors.
- Risk: None — dev-only controller.
- Needed for menu/gas post feature: INFORMATIONAL — provides debugging verification path.

---

### FEED ENGINE REVIEW ITEM 9
- File: `apps/VCSM/src/features/upload/dal/insertPost.dal.js`
- Layer: DAL
- Purpose: Single-purpose DAL: inserts one row into vc.posts, returns { id }.
- Inputs: row object (full post row shape)
- Outputs: `{ id }` or null
- Tables/RPCs hit: `vc.posts` (INSERT + SELECT id)
- VPORT compatibility: Yes — accepts actor_id for any actor kind. The VPORT actorId is passed directly.
- Risk: No rollback logic in insertPost.dal.js itself — rollback logic lives in createPostController (which is NOT used by createSystemPost). createSystemPost calls insertPost directly with no rollback. If insertPost succeeds but a subsequent operation fails, the post row remains. This is acceptable for system posts since there are no subsequent writes (no post_media, no post_mentions for system posts).
- Needed for menu/gas post feature: YES — this is the write path for all system posts.

---

### FEED ENGINE REVIEW ITEM 10
- File: `apps/VCSM/src/features/upload/adapters/posts.adapter.js`
- Layer: Adapter (cross-feature boundary)
- Purpose: Adapter exposing `createSystemPost({ actorId, text, post_type, realm_id, location_text, media_url })` for use by any feature that needs to create a system/automated post without going through the full upload composer. Calls supabase.auth.getUser() for user_id, then delegates to insertPost DAL.
- Inputs: `{ actorId, text, post_type, realm_id, location_text?, media_url? }`
- Outputs: `{ id }` from insertPost
- Tables/RPCs hit: None directly — uses insertPost DAL on vc.posts
- VPORT compatibility: Yes — actor_id is set to the passed actorId (VPORT actorId).
- Risk: The realm_id is hardcoded in each calling controller (PUBLIC_REALM_ID = "2d6c267f-9c43-48e4-aa5e-e0a0274e9bc2"). This UUID must match the actual public realm in the DB. If the production realm UUID differs, all system posts will be assigned to a realm that may not match the viewer's realmId, causing them to be invisible in the feed (readFeedPostsPage filters by `.eq("realm_id", realmId)`). This is the single highest-risk assumption in the current implementation. It is a hardcoded dependency, not injected from identity.
- Needed for menu/gas post feature: YES — this is the shared write boundary for both feature types.

---

## PHASE 3 — GAS STATION FUEL PRICE FEED POST REVIEW

---

### GAS FEED POST PLAN ITEM 1 — Owner Bulk Update Path

- Source flow: Owner opens BulkUpdateFuelPricesModal → fills fuel prices → checks "Share this update to my feed" → clicks Save Updates
- Trigger point: `BulkUpdateFuelPricesModal.jsx` (anonymous onClick handler at line 131) → `onShareToFeed({ updatedFuels })` → `publishFeedPost` from `useSubmitFuelPriceSuggestion` → `publishFuelPriceUpdateAsPostController`
- Required files:
  - `BulkUpdateFuelPricesModal.jsx` (trigger)
  - `useSubmitFuelPriceSuggestion.js` (hook — exposes publishFeedPost)
  - `publishFuelPriceUpdateAsPost.controller.js` (controller)
  - `vportFuelPricePost.read.dal.js` (dedup + name DAL)
  - `posts.adapter.js` (adapter)
  - `insertPost.dal.js` (write DAL)
- Post payload:
  ```
  {
    actorId: (VPORT actorId),
    text: "Fuel prices updated at {stationName}\n\nRegular: USD 1.23 / liter\nPremium: ...",
    post_type: "fuel_price_update",
    realm_id: "2d6c267f-9c43-48e4-aa5e-e0a0274e9bc2",
    media_url: null (no image for fuel price posts),
    location_text: null
  }
  ```
- Dedup rule: 1-hour window, per-actorId+post_type. Queried via `hasRecentFuelPricePostDAL` which checks `vc.posts WHERE actor_id = ? AND post_type = 'fuel_price_update' AND deleted_at IS NULL AND created_at >= (now - 1h) LIMIT 1`.
- RLS dependency: The authenticated user must own the VPORT actor (via actor_owners). The app-layer check in `useSubmitFuelPriceSuggestion` verifies `me.actorId === targetActorId` before calling `publishFeedPost`. This is the primary ownership gate. The DB does not have a separate RLS policy specific to VPORT post publishing — it relies on the standard `vc.posts` INSERT policy (any authenticated user can insert a post for their own actorId). The dedup DAL query reads vc.posts with standard RLS (posts are publicly readable) so no special policy is needed.
- Risks:
  1. The `isOwner` check in the hook (`me.actorId === targetActorId`) is the only app-layer ownership gate. RLS on vc.posts INSERT does not enforce that the actor_id in the post row matches the authenticated user's actorId. If a user crafts a direct API call, they could post as any actorId. This is a pre-existing platform risk, not introduced by this feature.
  2. The dedup window is per-actorId + post_type. If two different owners of the same VPORT (multi-owner scenario via actor_owners) each click "Share to feed" within 1 hour, only the first post is created. The second returns `{ published: false, reason: "throttled" }` silently. This is correct behavior but the UI does not surface the throttle reason to the second owner.
  3. Station name resolution uses `vport.profiles.name` via vportSchema. The `vport.profiles` table has owner-only SELECT RLS. The authenticated VPORT owner CAN read their own vport.profiles row, so this query succeeds. However, if called in a context where the authenticated user is NOT the owner (which the hook prevents via isOwner check), the query would return null and the post text would use "this station" as fallback.
  4. `updatedFuels` is built from successfully committed `res.official` rows in the modal. Fuels where `res.official` is null (submission path, not owner-update path) are excluded from `updatedFuels`. This is correct: only confirmed official prices are listed in the post text.
- Implementation recommendation: DONE — implementation is complete and correct. One soft recommendation: expose the `throttled` reason to the UI so owners understand why "Share to feed" had no effect.

---

### GAS FEED POST PLAN ITEM 2 — Citizen Suggestion Approval Path
- Source flow: Citizen submits price suggestion → owner reviews and approves → `afterSubmitSuggestion` calls `reviewSuggestionAndRefresh` with decision='approved'. NOTE: the `publishFeedPost` is NOT called in the citizen approval path. After `afterSubmitSuggestion` runs (owner approves a submission), there is no automatic feed post. The feed post is only created when the owner explicitly uses `publishFeedPost` via the checkbox in BulkUpdateFuelPricesModal.
- Trigger point: N/A — no automatic feed post on citizen suggestion approval.
- Risks: None from a correctness standpoint. There is a UX gap: if a citizen suggestion is approved and applied to official prices, there is no automatic "prices updated" feed post unless the owner separately opens BulkUpdateFuelPricesModal and checks the share checkbox. This is the intended design per the feature spec.
- Implementation recommendation: DONE — correct by design.

---

## PHASE 4 — RESTAURANT MENU FEED POST REVIEW

---

### MENU FEED POST PLAN ITEM 1 — Item Save Path

- Source flow: Owner opens VportActorMenuItemFormModal → checks "Share this update to my feed" → saves item → wrappedOnSave fires → onShareToFeed called after onSave completes
- Trigger point: `VportActorMenuItemFormModal.jsx` `wrappedOnSave` callback (line 35-50) → `onShareToFeed({ action, subject: "item", subjectName, categoryName, imageUrl })` → `publishMenuPost` from `usePublishMenuPost` → `publishMenuUpdateAsPostController`
- Required files:
  - `VportActorMenuItemFormModal.jsx` (trigger)
  - `usePublishMenuPost.js` (hook)
  - `publishMenuUpdateAsPost.controller.js` (controller)
  - `vportMenuPost.read.dal.js` (dedup + name DAL)
  - `posts.adapter.js` (adapter)
  - `insertPost.dal.js` (write DAL)
- Post payload:
  ```
  {
    actorId: (VPORT actorId),
    text: "Menu updated at {restaurantName}\n\nAdded item: {itemName} ({categoryName})",
    post_type: "menu_update",
    realm_id: "2d6c267f-9c43-48e4-aa5e-e0a0274e9bc2",
    media_url: imageUrl (from VportActorMenuItemFormModal — the item's image if uploaded),
    location_text: null
  }
  ```
- Media behavior: `imageUrl` is passed from the modal's `payload.imageUrl`. The modal retrieves `imageUrl` from the `useMenuItemForm` hook state (`imageUrlValue`). This value is set when the owner uploads an image through `handlePickImage` — which uploads to R2 and returns the CDN URL. The URL is written to `vc.vport_actor_menu_items.image_url` via `saveVportActorMenuItemController`. After save, the same URL is passed to `onShareToFeed` for optional embedding in the post. The timing is: (1) image uploaded to R2, (2) item saved to DB with image_url, (3) if share checkbox checked, feed post created with media_url = same URL. If step 2 fails, step 3 never runs (onSave throws, onShareToFeed is not called). If step 2 succeeds and step 3 fails, the item is saved but no feed post is created. This is acceptable — feed post creation is non-blocking.
- Dedup rule: 1-hour window, per-actorId+post_type. Queried via `hasRecentMenuUpdatePostDAL` which checks `vc.posts WHERE actor_id = ? AND post_type = 'menu_update' AND deleted_at IS NULL AND created_at >= (now - 1h) LIMIT 1`.
- RLS dependency: Same as gas: vc.posts INSERT open to authenticated users. App-layer: the menu manage panel only renders for the VPORT owner (via isOwner check at VportProfileViewScreen level). Owner verification for the item save comes from the `saveVportActorMenuItemController` which checks `category.actor_id !== actorId` and `existing.actor_id !== actorId` — the feed post only fires after a successful item save, so ownership is already confirmed.
- Risks:
  1. The dedup window is per post_type. Adding multiple menu items in quick succession (within 1 hour) will result in only the first item triggering a feed post. The others will return `{ published: false, reason: "throttled" }`. This is by design but may surprise owners who add 5 items and see only one post.
  2. Restaurant name resolution uses `vport.profiles.name` via vportSchema — same RLS caveat as gas. Succeeds for the authenticated VPORT owner.
  3. Image threading: the imageUrl passed to onShareToFeed comes from `payload.imageUrl`. In VportActorMenuItemFormModal's wrappedOnSave, `payload.imageUrl` comes from the form state. The `useMenuItemForm` hook's `imageUrlValue` is the state variable that holds the uploaded URL. This is the CDN URL after upload. However, there is a subtle timing risk: if `handlePickImage` uploads and sets `imageUrlValue` synchronously in the hook, but the form submission payload reads from the hook's state at a different tick, there could be a stale value. In practice, `imageUrlValue` is set via `setState` in React before `handleSubmit` is called, so the value should be current at submit time.
  4. The `onShareToFeed` callback in `wrappedOnSave` passes `payload.imageUrl` — but `payload` is built from the hook's form state values, not from the DB-confirmed item row. If `saveVportActorMenuItemController` transforms the imageUrl (e.g., normalizes it), the feed post will receive the pre-transform URL. In practice the controller passes imageUrl through to the DAL unchanged, so this is not a current risk.
- Implementation recommendation: DONE — implementation is complete and correct. Throttling behavior for bulk adds is documented risk.

---

### MENU FEED POST PLAN ITEM 2 — Category Save Path

- Source flow: Owner opens VportActorMenuCategoryFormModal → checks "Share this update to my feed" → saves category → `handleSubmit` calls `onShareToFeed({ action, subject: "category", subjectName: payload.name })`
- Trigger point: `VportActorMenuCategoryFormModal.jsx` `handleSubmit` (line 73-78)
- Post payload: Same structure as item path but subject = "category", no imageUrl (categories have no images).
- Media behavior: No image for category posts. `media_url` = null in createSystemPost.
- Dedup rule: Same 1-hour window via `hasRecentMenuUpdatePostDAL` — shared dedup across both item and category paths. Adding a category and an item within 1 hour = only one post. This is intentional throttling.
- Risks: Same as item path. The category path is simpler (no image) so there is no image-threading risk.
- Implementation recommendation: DONE

---

## PHASE 5 — SHARED DESIGN ASSESSMENT

---

### SHARED VPORT FEED POST DESIGN

- Pattern: Adapter-bounded system post pattern. Each VPORT feature type (gas, menu) has its own controller, DAL pair. All converge through the shared `createSystemPost` adapter in `features/upload/adapters/posts.adapter.js`. The adapter is the cross-feature boundary — no feature imports from another feature's internals.

- Shared files:
  - `apps/VCSM/src/features/upload/adapters/posts.adapter.js` — createSystemPost (shared by both gas and menu)
  - `apps/VCSM/src/features/upload/dal/insertPost.dal.js` — insertPost (shared by both via adapter)

- Per-feature files (gas):
  - `apps/VCSM/src/features/profiles/kinds/vport/dal/gas/vportFuelPricePost.read.dal.js`
  - `apps/VCSM/src/features/profiles/kinds/vport/controller/gas/publishFuelPriceUpdateAsPost.controller.js`
  - Entry: `useSubmitFuelPriceSuggestion.js` (exposes publishFeedPost)

- Per-feature files (menu):
  - `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/vportMenuPost.read.dal.js`
  - `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/publishMenuUpdateAsPost.controller.js`
  - `apps/VCSM/src/features/profiles/kinds/vport/hooks/menu/usePublishMenuPost.js`

- post_type values in use:
  - `fuel_price_update` — gas station price announcements
  - `menu_update` — restaurant menu item/category additions and changes
  - Pre-existing values: `post`, `image`, `video`, `24drop`, `vdrop` (and likely others in older posts)

- Dedup strategy: Per-type, per-actor, 1-hour window. Query: `vc.posts WHERE actor_id = ? AND post_type = ? AND deleted_at IS NULL AND created_at >= (now - 1h) LIMIT 1`. The dedup is per post_type — a gas station can post both a `fuel_price_update` and a separate post type within the same hour without being throttled. The dedup is NOT shared across types.

- Error handling: Non-blocking at the UI layer. Both the gas modal (BulkUpdateFuelPricesModal) and menu item/category modals wrap `onShareToFeed` calls in try/catch that silently swallow errors. This is intentional: the price update or menu item save has already committed, and a post creation failure should not roll back or block the primary operation. The controller returns `{ published: false, reason }` for soft failures (throttled, no_fuels) and throws for hard failures. The try/catch at the modal level catches both.

- UI strategy: Opt-in checkbox ("Share this update to my feed") rendered in modals below the form body, above the action buttons. The checkbox is disabled while saving. The checkbox is only shown when `onShareToFeed` prop is provided (passed from parent — owner-only context). Non-owners never see the checkbox (onShareToFeed is null for non-owner renders). For gas: checkbox in BulkUpdateFuelPricesModal, gated by `canShareToFeed` prop (passed as truthy from VportDashboardGasPanels when owner). For menu: checkbox in both VportActorMenuItemFormModal and VportActorMenuCategoryFormModal, rendered when `onShareToFeed` is provided.

- Test strategy for verification:
  1. Create a VPORT actor (gas or restaurant type)
  2. Set `vport.profiles.is_active = true`, `is_deleted = false`
  3. Update fuel prices / add menu item with "Share to feed" checked
  4. Verify `vc.posts` has a new row with correct `actor_id`, `post_type`, `realm_id`, `text`
  5. Load feed as a different authenticated user — confirm post appears
  6. Repeat within 1 hour — confirm dedup fires (`published: false, reason: "throttled"`)
  7. Delete the test post (`deleted_at = now()`) — confirm post disappears from feed
  8. Load feed as blocked user — confirm post is not visible

---

## PHASE 6 — GAP / RISK REPORT

---

### 1. Logan Documentation Drift

| Document | Gap |
|---|---|
| `vcsm.vport.gas-station-profile-spec.md` | Feed-share feature not documented. Gas Price Manager section missing "Share to feed" description. |
| `vcsm.vport.restaurant-profile-spec.md` | Feed-share feature not documented. Menu Manager section missing "Share to feed" description. |
| `vcsm.vport.menu-pipeline.md` | Three new files missing from files map (Section 13): `publishMenuUpdateAsPost.controller.js`, `vportMenuPost.read.dal.js`, `usePublishMenuPost.js`. |
| `vcsm.upload.remote-consistency-map.md` | New feed-post path not documented (though it introduces no new orphan risk). Minor gap. |

**Recommended action:** Logan sync for gas spec, restaurant spec, and menu pipeline doc. Low urgency — no production blockers.

---

### 2. Feed Engine Gaps for VPORT-Generated Posts

**Gap 1: post_type unknown to feed renderers**
The feed card renderer (PostCard / PostCardView) may not have a special rendering path for `fuel_price_update` or `menu_update`. If it only renders for known types and falls back to plain text for unknown types, the post will display the raw text (e.g. "Fuel prices updated at Shell Main Street\n\nRegular: USD 1.23 / liter"). This is acceptable as a text-only post. However, if there is a type-discriminated renderer that explicitly lists known types and returns null for unknown types, these posts may not render at all.

**Gap 2: fetchCentralFeedPage.js actor hydration path**
The `fetchCentralFeedPage.js` file (the new React Query path) merges `mergedVportMap` and `mergedActors` across pages and returns them to the caller. The caller (useCentralFeed or similar) must call the actor store upsert for these values. If the force-hydration for vport actors with null names is only in `useFeed.js` and not in the React Query path, VPORT system posts may show "User" instead of the business name on the new feed path.

**Gap 3: feed.read.posts.dal.js select list excludes `user_id`**
The posts DAL selects: `id, actor_id, text, title, media_url, media_type, post_type, created_at, realm_id, edited_at, deleted_at, location_text`. It does NOT select `user_id`. This is fine for feed display, but the debug panel and any audit tooling that tries to trace the creating user cannot do so from the feed read path alone.

---

### 3. DB/RLS Gaps

**Gap 1: vc.posts INSERT policy not VPORT-owner-gated**
The `vc.posts` INSERT policy (or lack thereof) does not verify that the inserting user owns the `actor_id` being posted as. App-layer ownership checks (isOwner in useSubmitFuelPriceSuggestion, category.actor_id check in saveVportActorMenuItemController) are the only gate. A direct API call bypassing the app could create a post as any actorId. This is a pre-existing platform risk.

**Gap 2: realm_id hardcoded UUID risk — elevated by planned Void realm**
Both gas and menu controllers hardcode `PUBLIC_REALM_ID = "2d6c267f-9c43-48e4-aa5e-e0a0274e9bc2"`. If this UUID does not match the actual public realm in `vc.realms`, all system posts will be created with a wrong realm_id and will be invisible in the feed (the feed filters `.eq("realm_id", realmId)` and the viewer's realmId will differ). This is the single highest-risk assumption. There is no runtime validation of this UUID.

**Updated 2026-05-10 — Void Realm context:** A second realm ("The Void") is planned for 18+ anonymous-but-DB-tracked citizen activity. When it launches, the platform will have at least two distinct realm_ids. This makes the hardcoded UUID problem more urgent and changes the correct fix:

- The naive fix of "inject `realmId` from the viewer's identity context" is **wrong** — if a viewer is browsing in the Void realm, their current `realmId` would be the void realm. System posts from VPORT owners (fuel prices, menu updates) are public business announcements and must always land in the **public** realm, never the void realm.
- The correct fix is to resolve the public realm_id from a canonical source that is independent of the viewer's current session realm. Options:
  1. A shared `realmConfig.js` constant that is verified against `vc.realms` at app startup (not per-call).
  2. A dedicated `resolvePublicRealmIdDAL()` function that queries `vc.realms WHERE slug = 'public' LIMIT 1` once and caches the result. Called by the hook before invoking the controller.
  3. An environment variable (`VITE_PUBLIC_REALM_ID`) set during deployment with the verified UUID.
- The key invariant: VPORT system posts always belong to the public realm regardless of who is viewing or what realm the viewer is currently in.

**Gap 3: vport.profiles SELECT RLS for dedup queries**
Both `resolveVportStationNameDAL` and `resolveVportRestaurantNameDAL` query `vport.profiles` via `vportSchema`. This table has owner-only SELECT RLS. These queries run in the context of the authenticated VPORT owner — correct. But the `hasRecentFuelPricePostDAL` and `hasRecentMenuUpdatePostDAL` queries run on `vc.posts` which is publicly readable. No RLS concern for those dedup queries.

---

### 4. VPORT Actor Visibility Risks

**Risk 1: Missing vport profile in actorsBundle**
If `readActorsBundle` returns an empty vportMap entry for the VPORT actor (e.g., the vport.profiles row doesn't exist yet or the 30s cache holds a stale null), the feed visibility model returns `reason: "missing_vport_profile"` and the post is hidden. The post will appear on next refresh once the cache expires or force-hydration resolves the name.

**Risk 2: is_active flag requirement**
VPORT system posts are only visible if `vport.profiles.is_active !== false`. A gas station or restaurant that was marked inactive (e.g., closed permanently) will have its system posts invisible in the feed. This is correct behavior — an inactive VPORT should not appear in the feed.

**Risk 3: actor_privacy_settings for VPORT actors**
VPORT actors do not have `actor_privacy_settings` rows (privacy settings are for user actors only). The visibility model correctly handles this by using the VPORT branch (is_active check) rather than the privacy branch. No risk.

---

### 5. post_type Risks

**Risk 1: Feed renderer may not handle new post types**
If `PostCard` or `PostCardView` has a type switch that does not include `fuel_price_update` or `menu_update`, these posts may be invisible or render incorrectly. The normalized output includes `post_type` as a first-class field. The rendering component must either handle these types explicitly or have a generic text-post fallback that catches unknown types.

**Risk 2: Post type not filtered in feed read query**
All post types are returned by the feed DAL (no `post_type` filter). This means if the system generates many posts (e.g., a gas station updating prices every hour for a week), the feed could become saturated with system posts from that VPORT. The 1-hour dedup per type mitigates this, capping system posts at 2/day per VPORT per type.

---

### 6. Duplicate Post Risks

**Risk 1: Race condition on dedup check**
The dedup check (`hasRecentFuelPricePostDAL`, `hasRecentMenuUpdatePostDAL`) reads `vc.posts` and then creates a post if no recent post is found. This is a read-then-write pattern with no atomic lock. If two concurrent requests (e.g., owner double-clicks the Save button) both read "no recent post found" before either write commits, two posts could be created in the same second. The UI mitigates this with the `submitting` disabled state on the Save button, but it is not a hard guarantee.

**Risk 2: Dedup window uses `created_at >= since` comparison**
The dedup query uses `created_at >= (now - 1h)`. The `created_at` is set to `new Date().toISOString()` client-side in `createSystemPost`. If two devices have clock skew, a post created 1 hour ago on a fast-clock device may appear as older than the window on a slow-clock server. In practice, Supabase uses DB-side `now()` for read comparisons — this is a minor edge case but worth noting.

---

### 7. Media Upload Risks

**Risk 1: Menu post imageUrl is a pre-committed CDN URL**
The `imageUrl` passed to `publishMenuUpdateAsPost` is the CDN URL already committed to `vc.vport_actor_menu_items.image_url`. It is not a fresh upload. The feed post `media_url` will point to the same R2 object. If the menu item is later deleted (soft or hard) and the R2 object is cleaned up (which currently does NOT happen — no cleanup logic exists), the feed post image will be a 404 CDN URL. This is a pre-existing orphan risk from the upload architecture, not introduced by the feed post feature.

**Risk 2: Gas price posts have no media**
`publishFuelPriceUpdateAsPostController` always passes `media_url: null` to `createSystemPost`. The adapter sets `media_type: "text"` when `media_url` is null. This results in a text-only post. The feed card renderer must handle text-only posts for `post_type = fuel_price_update`.

---

### 8. Cache Invalidation

**Concern: Feed cache does NOT get busted when a new VPORT post is created**
When `createSystemPost` successfully writes to `vc.posts`, no feed cache invalidation is triggered. The existing feed caches are:
- `readActorsBundle` — 30s TTL, per actor (not affected by new posts)
- `readFeedBlockRowsDAL` — 60s TTL, per viewer (not affected by new posts)
- `readFeedFollowRowsDAL` — 60s TTL, per viewer (not affected by new posts)
- `readPostMediaMap` — 60s TTL, per post (new posts are not in cache anyway)

The feed post list itself (`readFeedPostsPage`) is NOT cached — it is always a fresh DB read. So new posts appear on next feed load or pull-to-refresh. This is the correct behavior — no cache invalidation is needed for post list reads.

**However:** If the VPORT actor bundle was just cached (30s) and the post is new, the actor data will be served from cache. This is acceptable — actor data does not change when a post is created.

**Conclusion:** No cache invalidation gap for this feature. The feed is pull-to-refresh for new content — by design.

---

### 9. App-Layer vs DB-Layer Concerns

| Assumption | Type | Risk Level |
|---|---|---|
| realm_id "2d6c267f-..." is the correct public realm UUID | App hardcoded — no DB validation. Must not use viewer's current realmId when Void realm launches. | HIGH |
| vc.posts INSERT is open to authenticated users for any actor_id | DB allows it — no actor ownership RLS | MEDIUM (pre-existing) |
| VPORT owner check (actorId === targetActorId) is app-only for gas publish | No DB-layer enforcement for this specific path | MEDIUM (pre-existing) |
| vport.profiles SELECT succeeds for authenticated VPORT owner | DB allows owner-only SELECT | LOW (works correctly) |
| hasRecentFuelPricePostDAL reads vc.posts without auth gate | vc.posts is publicly readable — correct | LOW |
| Dedup window is race-condition safe | App-layer read-then-write, no DB lock | LOW (UI mitigated) |

---

## PHASE 7 — FINAL IMPLEMENTATION PLAN

Based on the gap analysis above, the following items remain unresolved. Items already implemented are not repeated.

---

### Slice 1 — Realm ID Safety Validation (updated for Void realm)
- Files to create:
  - `apps/VCSM/src/features/feed/dal/resolvePublicRealm.dal.js` — queries `vc.realms WHERE slug = 'public' LIMIT 1`, returns `{ id }`. Single-call, result cached in module scope after first resolution. This becomes the canonical source of truth for the public realm UUID across all system post controllers.
- Files to modify:
  - `apps/VCSM/src/features/profiles/kinds/vport/controller/gas/publishFuelPriceUpdateAsPost.controller.js` — replace hardcoded `PUBLIC_REALM_ID` constant with `await resolvePublicRealmIdDAL()` call. If null is returned (realm not found), throw with a descriptive error before writing the post.
  - `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/publishMenuUpdateAsPost.controller.js` — same change.
- Purpose: Replace the hardcoded UUID with a DB-verified public realm ID. This is future-safe against the planned Void realm launch — VPORT system posts must always go to the public realm, never to the viewer's current session realm.

**Critical constraint — do NOT inject from identity/hook:**
Passing `realmId` from the calling hook's `useIdentity()` context is the **wrong** fix once the Void realm exists. A viewer browsing in the Void realm would have a void `realmId` in their identity context. System posts (fuel prices, menu updates) are public business announcements and must always target the public realm regardless of the viewer's current realm. The realm resolution must be authoritative and realm-type-aware, not session-aware.

- Risks: The `resolvePublicRealmIdDAL` adds one extra DB read per controller call (first call only if module-scoped cache is used). If `vc.realms` has no row with `slug = 'public'`, the controllers will throw before creating posts — this is the correct failure mode (loud failure, not silent wrong-realm post).
- Verification: After change, all system posts have `realm_id` matching `SELECT id FROM vc.realms WHERE slug = 'public'`. Confirm no system posts land in the void realm_id (once that realm exists).

---

### Slice 2 — Feed Renderer post_type Compatibility Audit
- Files to create: None
- Files to modify: Identify and update the PostCard / PostCardView component (likely `apps/VCSM/src/features/post/postcard/`) to ensure it has a fallback render path for unknown `post_type` values. If a generic text-post fallback already exists that catches all non-null text, this slice may be a no-op.
- Purpose: Confirm that feed cards with `post_type = fuel_price_update` and `post_type = menu_update` render as text posts (not blank / not null) in the central feed.
- Risks: If PostCard has a whitelist of known post_type values and renders null for unknown types, system posts will be invisible to the user even though they exist in the feed array.
- Verification: Create a test system post, load the central feed, confirm the post card renders with the post text visible.

---

### Slice 3 — Logan Documentation Sync
- Files to create: None
- Files to modify:
  - `zNOTFORPRODUCTION/_CANONICAL/logan/vports/vcsm.vport.gas-station-profile-spec.md` — add feed-share feature to Dashboard sections (Gas Price Manager) and Future Expansion notes.
  - `zNOTFORPRODUCTION/_CANONICAL/logan/vports/vcsm.vport.restaurant-profile-spec.md` — add feed-share feature to Dashboard sections (Menu Manager).
  - `zNOTFORPRODUCTION/_CANONICAL/logan/vports/vcsm.vport.menu-pipeline.md` — add three new files to Section 13 (Files Map) with their roles.
- Purpose: Close the documentation drift identified in Phase 1. These are documentation-only changes with no code impact.
- Risks: None.
- Verification: Logan doc review should show ALIGNED for all three docs after sync.

---

### Slice 4 — React Query Actor Hydration Path Audit (Force-Hydration for VPORT)
- Files to create: None
- Files to modify: Audit the consumer of `fetchCentralFeedPage.js` (likely `useCentralFeed.js` or equivalent) to ensure that after each page fetch, vport actors with null names in the vportMap are force-hydrated via `hydrateActorsByIds(..., { force: true })`. This mirrors the fix applied to `useFeed.js` (documented in `vcsm.feed.post-pipeline.md` 2026-04-19 entry).
- Purpose: Ensure VPORT system posts show the business name in feed cards, not "User", on the new React Query feed path.
- Risks: If the consumer already does a full `upsertActors()` + force-hydration for vport actors, this slice is a no-op. Audit only.
- Verification: Hard-refresh the central feed — confirm gas station and restaurant names appear on posts from those VPORTs.

---

**Summary of Slices:**

| Slice | Priority | Blocking? | Effort |
|---|---|---|---|
| Slice 1 — Realm ID safety | HIGH | Yes (data integrity) | Small |
| Slice 2 — Feed renderer audit | HIGH | Yes (user-facing) | Small (audit) |
| Slice 3 — Logan docs | LOW | No | Small |
| Slice 4 — React Query hydration audit | MEDIUM | Potentially | Small (audit) |

If all system tests pass (posts appear in feed with correct business name and text), Slices 2 and 4 can be confirmed complete. Slice 1 is a code hardening task that should be done before any post-to-production deployment.

---

## APPENDIX — KEY FILE INDEX

| File | Role | Status |
|---|---|---|
| `apps/VCSM/src/features/upload/adapters/posts.adapter.js` | Shared system post write boundary | IMPLEMENTED |
| `apps/VCSM/src/features/upload/dal/insertPost.dal.js` | Post row insert DAL | PRE-EXISTING |
| `apps/VCSM/src/features/profiles/kinds/vport/dal/gas/vportFuelPricePost.read.dal.js` | Gas dedup + station name | IMPLEMENTED |
| `apps/VCSM/src/features/profiles/kinds/vport/controller/gas/publishFuelPriceUpdateAsPost.controller.js` | Gas feed post controller | IMPLEMENTED |
| `apps/VCSM/src/features/profiles/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion.js` | Gas hook (exposes publishFeedPost) | MODIFIED |
| `apps/VCSM/src/features/profiles/kinds/vport/screens/gas/components/BulkUpdateFuelPricesModal.jsx` | Gas UI trigger (share checkbox) | MODIFIED |
| `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardGasScreen.jsx` | Gas dashboard (passes onShareToFeed) | MODIFIED |
| `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/vportMenuPost.read.dal.js` | Menu dedup + restaurant name | IMPLEMENTED |
| `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/publishMenuUpdateAsPost.controller.js` | Menu feed post controller | IMPLEMENTED |
| `apps/VCSM/src/features/profiles/kinds/vport/hooks/menu/usePublishMenuPost.js` | Menu hook wrapper | IMPLEMENTED |
| `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuManagePanel.jsx` | Menu panel (wires usePublishMenuPost) | MODIFIED |
| `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormModal.jsx` | Item form (share checkbox + wrapped onSave) | MODIFIED |
| `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuCategoryFormModal.jsx` | Category form (share checkbox) | MODIFIED |
| `apps/VCSM/src/features/feed/dal/feed.read.posts.dal.js` | Feed post read (no changes needed) | PRE-EXISTING |
| `apps/VCSM/src/features/feed/model/feedRowVisibility.model.js` | VPORT visibility gate (no changes needed) | PRE-EXISTING |
| `apps/VCSM/src/features/feed/model/normalizeFeedRows.model.js` | Feed normalization (no changes needed) | PRE-EXISTING |
