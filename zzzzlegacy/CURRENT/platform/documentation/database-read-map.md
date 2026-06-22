# VCSM Workspace — Database Read Map

**Generated:** 2026-04-12
**Total DAL Files:** 337 (engines: 70, VCSM app: 187, Wentrex: 80)
**Files with .from() calls:** 235 in VCSM app alone

---

## 1. Feed Pipeline Reads

### readFeedPostsPage
- **File:** features/feed/dal/feed.read.posts.dal.js
- **Tables:** vc.posts
- **Columns:** id, actor_id, text, title, media_url, media_type, post_type, created_at, realm_id, edited_at, deleted_at, deleted_by_actor_id, location_text
- **Called By:** fetchFeedPagePipeline
- **Call Chain:** CentralFeedScreen → useFeed → fetchFeedPagePipeline → readFeedPostsPage

### readPostMediaMap
- **File:** features/feed/dal/feed.read.media.dal.js
- **Tables:** vc.post_media
- **Columns:** post_id, url, media_type, sort_order
- **Called By:** fetchFeedPagePipeline (Promise.all)

### fetchPostMentionRows
- **File:** features/feed/dal/feed.mentions.dal.js
- **Tables:** vc.post_mentions, vc.actor_presentation
- **Called By:** fetchFeedPagePipeline (Promise.all, conditional on @ in text)

### readHiddenPostsForViewer
- **File:** features/feed/dal/feed.read.hiddenPosts.dal.js
- **Tables:** moderation.actions
- **Called By:** fetchFeedPagePipeline (Promise.all)

### readActorsBundle
- **File:** features/feed/dal/feed.read.actorsBundle.dal.js
- **Tables:** vc.actors, public.profiles, vc.actor_privacy_settings, vc.vports
- **Internal Pattern:** 1 sequential read (actors), then 3 parallel reads (profiles, privacy, vports)
- **Called By:** fetchFeedPagePipeline (Promise.all)
- **WARNING:** Reads 4 tables. Per pagination page = 4 DB round-trips. With 3 pages = 12 profile-related reads.

### readFeedBlockRowsDAL
- **File:** features/feed/dal/feed.read.blockRows.dal.js
- **Tables:** moderation.blocks
- **Called By:** fetchFeedPagePipeline (Promise.all)

### readFeedFollowRowsDAL
- **File:** features/feed/dal/feed.read.followRows.dal.js
- **Tables:** vc.actor_follows
- **Called By:** fetchFeedPagePipeline (Promise.all)

### Feed Pipeline Total Per Page
| DAL | Tables Read | Execution |
|-----|-------------|-----------|
| readFeedPostsPage | 1 | sequential (first) |
| readPostMediaMap | 1 | parallel |
| fetchPostMentionRows | 2 | parallel (conditional) |
| readHiddenPostsForViewer | 1 | parallel |
| readActorsBundle | 4 (1 seq + 3 par) | parallel |
| readFeedBlockRowsDAL | 1 | parallel |
| readFeedFollowRowsDAL | 1 | parallel |
| **Total** | **~10 table reads** | **1 seq + 6 parallel groups** |

**Per pagination loop iteration (max 3):** ~12-15 reads first page, ~5-8 subsequent pages (was 30 before feed cache optimization on 2026-04-12). 4 DALs now cached: actorsBundle (30s), blockRows (60s), followRows (60s), postMedia (60s). Duplicate hydration eliminated via getMissingOrStale() check.

---

## 2. Identity Reads

### identity.read.dal (VCSM app-side)
- **File:** state/identity/identity.read.dal.js
- **Tables:** vc.actors, public.profiles, vc.vports, vc.actor_privacy_settings, vc.realms
- **Called By:** identity.controller → identityContext

### Identity Engine DALs
- **Files:** engines/identity/src/dal/ (10 files)
- **Tables:** platform.user_app_access, platform.user_app_accounts, platform.user_app_actor_links, platform.user_app_preferences, platform.user_app_state
- **Called By:** resolveAuthenticatedContext

---

## 3. Profile Reads

### readActorProfile
- **File:** features/profiles/dal/readActorProfile.dal.js
- **Tables:** vc.actors, public.profiles
- **Cached:** Yes (TTL)

### readVportType
- **File:** features/profiles/dal/readVportType.dal.js
- **Tables:** vc.vports
- **Cached:** Yes (TTL)

### readActorKind
- **File:** features/profiles/dal/readActorKind.dal.js
- **Tables:** vc.actors
- **Cached:** Yes (TTL)

### fetchPostsForActor
- **File:** features/profiles/dal/post/fetchPostsForActor.dal.js
- **Tables:** vc.posts (+ possibly media, actors)
- **Called By:** profile detail screen

### vportPublicDetails.read
- **File:** features/profiles/dal/vportPublicDetails.read.dal.js
- **Tables:** vc.vport_public_details
- **Cached:** Yes (TTL)

---

## 4. Notification Reads

### notifications.read.dal
- **File:** features/notifications/inbox/dal/notifications.read.dal.js
- **Tables:** vc.notifications
- **Called By:** Notifications.controller → useNotificationsInternal

### notifications.count.dal
- **File:** features/notifications/inbox/dal/notifications.count.dal.js
- **Tables:** vc.notifications
- **Called By:** notificationsCount.controller → useNotiCount

### senders.read.dal
- **File:** features/notifications/inbox/dal/senders.read.dal.js
- **Tables:** vc.actor_presentation, vc.actors, public.profiles, vc.vports
- **Called By:** Notifications.controller (sender resolution cascade)

### blocks.read.dal
- **File:** features/notifications/inbox/dal/blocks.read.dal.js
- **Tables:** moderation.blocks
- **Called By:** Notifications.controller (block filtering)

### inboxUnreadCount.dal
- **File:** features/notifications/inbox/dal/inboxUnreadCount.dal.js
- **Tables:** chat.inbox_entries
- **Called By:** inboxUnread.controller → useUnreadBadge

---

## 5. Post Reads

### post.read.dal
- **File:** features/post/postcard/dal/post.read.dal.js
- **Tables:** vc.posts

### postReactions.read.dal
- **File:** features/post/postcard/dal/postReactions.read.dal.js
- **Tables:** vc.post_reactions

### postComments.read.dal
- **File:** features/post/commentcard/dal/postComments.read.dal.js
- **Tables:** vc.post_comments

### postMentions.read.dal
- **File:** features/post/postcard/dal/postMentions.read.dal.js
- **Tables:** vc.post_mentions

---

## 6. Booking Reads

17 DAL files in features/booking/dal/:
- **Tables:** vport.bookings, vport.resources, vport.availability_rules, vport.availability_exceptions, vport.service_booking_profiles, vport.services, vc.actor_owners

---

## 7. Table Read Frequency (Across All Features)

| Table | Read Count (DAL files) | Features Reading |
|-------|----------------------|-----------------|
| **vc.actors** | 8+ | feed, identity, profiles, auth, booking, notifications, explore |
| **public.profiles** | 7+ | feed, identity, profiles, notifications, settings, auth |
| **vc.posts** | 5+ | feed, post, profiles, upload |
| **vc.vports** | 5+ | feed, identity, profiles, settings, dashboard |
| **vc.actor_follows** | 3+ | feed, social, profiles |
| **moderation.blocks** | 3+ | feed, block, notifications |
| **vc.actor_privacy_settings** | 3+ | feed, identity, social |
| **vc.notifications** | 3 | notifications (read, count, write) |
| **vc.post_media** | 2+ | feed, profiles |
| **vc.post_mentions** | 2+ | feed, upload |
| **vc.actor_presentation** | 2+ | feed mentions, notifications senders |
| **moderation.actions** | 2+ | feed, moderation |

---

## 8. Engine DAL Inventory

| Engine | DAL Files | Schema | Key Tables |
|--------|-----------|--------|------------|
| Identity | 11 | platform | user_app_access, user_app_accounts, user_app_actor_links, user_app_preferences, user_app_state, apps, user_capabilities, user_app_account_roles, role_capabilities |
| Chat | 33 | chat | conversations, conversation_members, messages, inbox_entries, outbox_events, message_attachments, message_receipts, message_reactions, saved_messages, typing_states, legacy_mappings |
| Reviews | 7 | reviews | reviews, review_dimensions, review_dimension_ratings (+ 3 RPCs) |
| Portfolio | 9 | vc | vport_portfolio_items, vport_portfolio_media, vport_portfolio_tags, vport_barber_portfolio_details, vport_locksmith_portfolio_details (+ 1 RPC) |
| Notifications | 11 | notification | events, event_types, recipients, inbox_items, rendered, templates, preferences, delivery_attempts |
| Hydration | 1 | vc | RPC: get_actor_summaries |

## 9. RPC Usage (Atomic Operations)

| RPC | Engine/Feature | Purpose |
|-----|---------------|---------|
| chat.send_message_atomic | Chat engine | Message insert + attachments + inbox update (transactional) |
| vc.get_actor_summaries | Hydration engine | Canonical actor summary batch read |
| vc.get_vport_portfolio | Portfolio engine | Portfolio items + media + tags |
| vc.create_notification | VCSM notifications | Legacy notification creation (SECURITY DEFINER) |
| reviews.upsert_neutral_review | Reviews engine | Review write (transactional) |
| reviews.get_review_author_card | Reviews engine | Author card enrichment |
| reviews.get_target_overall_stats | Reviews engine | Aggregate review stats |

---

## DATABASE READ AUDIT

### Duplicate Read Warnings

| Warning | Location | Impact |
|---------|----------|--------|
| ~~profiles read via readActorsBundle + hydrateActorsByIds~~ | useFeed.js:210 | **RESOLVED (2026-04-12):** `getMissingOrStale()` check added. Hydration now skipped when actors are fresh from pipeline upsert. |
| **vc.actors read by feed + identity + profiles** | 8+ DAL files | Each feature has its own actor read. No shared cache layer for cross-feature actor resolution. |
| **public.profiles read by feed + identity + notifications** | 7+ DAL files | Profile data fetched independently by each pipeline. Hydration store mitigates but only after first fetch. |
| **moderation.blocks read by feed + notifications + block** | 3 features | Block state fetched per-feature. No shared block cache. |

### N+1 Risk Warnings

| Risk | Location | Pattern |
|------|----------|---------|
| **readActorsBundle per pagination page** | useFeed pagination loop | If feed pagination drains 3 empty pages, readActorsBundle fires 3x with different actor sets — each reading 4 tables. |
| **senders.read multi-cascade** | notifications senders.read.dal | 3-level resolution cascade (hydration → actor_presentation → actors+profiles+vports). For N notifications with N unique senders, worst case = N queries. Mitigated by batch IN clause. |
| **postReactions per post** | post/postcard/dal/ | If reactions are loaded per-card (not batched), this is N+1. Needs verification at component level. |

### Serial Chain Warnings

| Warning | Location |
|---------|----------|
| **readActorsBundle internal** | Reads actors first (sequential), THEN parallel (profiles, privacy, vports). Could be restructured to read all 4 in parallel if actor→profile mapping is pre-computed. |
| **getFeedViewerIsAdult** | Reads actors → then conditionally reads profiles. Sequential 2-step. |

### Recommendations

1. **Eliminate duplicate actor hydration:** useFeed line 205 calls `hydrateActorsByIds()` after `readActorsBundle` already fetched the same actors. Skip hydration if data is already in store.

2. **Share block state across features:** Feed, notifications, and block features each read `moderation.blocks` independently. Consider a shared block cache with TTL.

3. **Batch profile reads:** Multiple features independently read `public.profiles`. The hydration store helps but only after first fetch. Consider eagerly populating the store from identity resolution.

4. **readActorsBundle parallelization:** The sequential actors→(profiles|privacy|vports) pattern could be restructured. If profile_id/vport_id are preloaded from a view or RPC, all 4 reads could run in parallel.

5. **Feed pagination multiplier:** ~~Each pagination page fires the full 7-DAL pipeline with up to 30 uncached reads.~~ **RESOLVED (2026-04-12):** 4 feed DALs now cached (actorsBundle 30s, blockRows 60s, followRows 60s, postMedia 60s). Duplicate hydration eliminated. First page ~12-15 reads, subsequent pages ~5-8.
