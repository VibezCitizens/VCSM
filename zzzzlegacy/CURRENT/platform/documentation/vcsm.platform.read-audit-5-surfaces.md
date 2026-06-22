# VCSM Platform — Read Audit: 5 High-Traffic Surfaces

**Last updated:** April 10, 2026
**Scope:** Analysis only — no code changes
**Surfaces:** Central Feed, Citizen Profiles, Notifications, Chat Inbox, Chat Conversation

---

## 1. Central Feed

**Entry:** `features/feed/screens/CentralFeedScreen.jsx` → `useFeed` → `fetchFeedPage.pipeline.js`

### Read Sequence
1. `readFeedPostsPage` → `vc.posts` (11 rows, cursor pagination)
2. **6 parallel reads** via `Promise.all`:
   - `readPostMediaMap` → `vc.post_media`
   - `fetchPostMentionRows` → `vc.post_mentions` + `vc.actor_presentation`
   - `readHiddenPostsForViewer` → `moderation.actions`
   - `readActorsBundle` → `vc.actors` + `public.profiles` + `vc.actor_privacy_settings` + `vc.vports` (internally parallel)
   - `readFeedBlockRowsDAL` → `moderation.blocks`
   - `readFeedFollowRowsDAL` → `vc.actor_follows`
3. Background: `hydrateActorsByIds` → RPC `vc.get_actor_summaries` (non-blocking)
4. `normalizeFeedRows` → visibility filtering (sync)
5. `preloadInitialMedia` → first 3 images (fresh fetch only)

### Cache: Zustand actor store (5min TTL), hiddenPostIds Set, requestVersion tracking
### Realtime: None
### Bottlenecks: May fetch 3 pages to get 3 visible posts; readActorsBundle duplicates actor_presentation data

---

## 2. Citizen / VPORT Profiles

**Entry:** `features/profiles/screens/ActorProfileScreen.jsx` → kind resolution → `UserProfileViewScreen` or `VportProfileKindScreen`

### Read Sequence
1. **Kind resolution** (sequential, blocks screen): `vc.actors` SELECT kind
2. **3 parallel reads** after screen chosen:
   - `useProfileView` → RPC `vc.read_actor_profile` + `vc.actor_privacy_settings` (parallel)
   - `useProfileGate` → `vc.actor_privacy_settings` + `vc.actor_follows` (parallel)
   - `useBlockStatus` → `moderation.blocks` (bidirectional check)
3. If `canView`: `readActorPostsDAL` → `vc.posts` + `vc.post_media` + `vc.post_mentions`
4. VPORT only: `useVportPublicDetails` → `vc.actors` + `vc.vports` + `vc.vport_public_details` (31 fields)
5. Header: `useFollowerCount` → `vc.actor_follows` COUNT

### Cache: Actor hydration store (post authors), profileGateStore (privacy state)
### Realtime: None
### Bottlenecks: Kind resolution blocks render; privacy read duplicated (readActorProfile + useActorPrivacy); vport type resolved twice; follow state DAL is stub

---

## 3. Notifications

**Entry:** `features/notifications/screen/NotificationsScreenView.jsx` → `useNotifications` + `useNotificationsHeader`

### Read Sequence
1. `fetchNotificationsPage` → `vc.notifications` (20 rows, created_at DESC)
2. **Parallel:** `loadBlockSets` → `moderation.blocks` (both directions)
3. `filterByBlocks` → in-memory filter
4. `filterResolvedFollowRequestRows` → follow_requests query (if applicable)
5. **3-tier sender resolution:**
   - Tier 1: RPC `vc.get_actor_summaries` (batch)
   - Tier 2: `vc.actor_presentation` table
   - Tier 3: `vc.actors` + `public.profiles` + `vc.vports` (parallel)
6. **Auto mark-seen** → UPDATE `vc.notifications` SET is_seen=true (async, fire-and-forget)

### Badge reads (separate hooks):
- `useNotiCount` → COUNT on `vc.notifications` (15s TTL cache, 60s poll)
- `useUnreadBadge` → SUM `chat.inbox_entries.unread_count` (10s TTL, 20s poll)

### Cache: Badge counts (TTL-based), inflight deduplication. No list cache.
### Realtime: `vc.notifications` + `chat.inbox_entries` (INSERT/UPDATE/DELETE → invalidate badge cache)
### Bottlenecks: Multi-tier sender resolution; block sets loaded every time; no list pagination UI; auto mark-seen is fire-and-forget

---

## 4. Chat Inbox

**Entry:** `features/chat/inbox/screens/InboxScreen.jsx` → `useInbox` → engine `ctrlGetInboxEntries`

### Read Sequence
1. `getInboxEntriesDAL` → `chat.inbox_entries` with nested joins (conversations, members, last_message)
2. Fallback if empty: membership → conversations → members → messages (sequential)
3. Backfill missing last_message → `chat.messages` (recent per conversation)
4. `getHiddenMessageIdSetDAL` → `chat.message_receipts`
5. `hydrateInboxMemberActors` → external `getActorSummariesByIds` (batch)
6. Sort: pinned DESC, last_message_at DESC

### Folder switching: YES refetches (folder in useEffect deps)
### Cache: None (full refetch on every mount/folder change)
### Realtime: `chat.inbox_entries` INSERT/UPDATE/DELETE → full `load()` triggered
### Bottlenecks: Realtime triggers full reload (no incremental update); hidden IDs fetched every time; fallback path is 4 sequential reads

---

## 5. Chat Conversation

**Entry:** `features/chat/conversation/screen/ConversationView.jsx` → 3 parallel hooks

### Read Sequence (3 parallel hook loads)
**Hook 1 — useConversation:**
- RPC `chat.open_conversation` → conversation metadata + permission check
- Auto `markConversationRead` → UPDATE members + inbox_entries

**Hook 2 — useConversationMessages:**
- Parallel: messages timeline (50 rows) + hidden IDs + history cutoff
- `chat.messages` + `chat.message_attachments` (nested join)
- `chat.message_receipts` (hidden set)
- `chat.inbox_entries` (history_cutoff_at)

**Hook 3 — useConversationMembers:**
- Parallel: all members + current member
- `chat.conversation_members`
- Actor summary hydration (batch fallback)

### Optimistic send: clientId-based reconciliation with intent queues (delete-for-me, unsend)
### Cache: None (full refetch on every route)
### Realtime: Messages INSERT only; Conversations UPDATE; Typing via Presence channel
### Bottlenecks: 3 independent hook loads (could batch); no message cache between visits; realtime INSERT-only means edits/deletes require explicit refetch

---

## 6. Cross-Surface Comparison

### Duplicate Actor Reads

| Surface | Actor Data Source | Cache |
|---|---|---|
| Feed | readActorsBundle + Zustand store | Yes (5min TTL) |
| Profiles | RPC read_actor_profile | No |
| Notifications | 3-tier sender resolution | No |
| Inbox | Nested member join + hydration | No |
| Chat | Member hydration + external | No |

**Problem (partially resolved 2026-04-10):** Actor data was fetched 5 different ways. Now all 5 surfaces go through the shared hydration store (5-min TTL). Feed, Inbox, Chat, Notifications use `hydrateAndReturnSummaries` (store-first). Profiles upsert into store after fetch.

### Shared Tables Hit Repeatedly

| Table | Surfaces | Reads/Visit |
|---|---|---|
| `vc.actors` | All 5 | 5+ |
| `public.profiles` | Feed, Profiles, Notifications | 3+ |
| `moderation.blocks` | Feed, Profiles, Notifications | 3+ |
| `vc.actor_follows` | Feed, Profiles | 2+ |
| `chat.inbox_entries` | Notifications (badge), Inbox | 2+ |
| `chat.message_receipts` | Inbox, Chat | 2+ |

### Duplicate Patterns Between Screens

| Pattern | Screens | Details |
|---|---|---|
| Conversation metadata | Inbox → Chat | Fetched in inbox query, refetched in conversation |
| Conversation members | Inbox → Chat | Nested in inbox, separately loaded in chat |
| Actor summaries | Inbox → Chat | **RESOLVED** — both now use shared store via hydrateAndReturnSummaries |
| Hidden message IDs | Inbox → Chat | Full set loaded in both independently |
| Block status | Feed + Profiles + Notifications | 3 independent queries per session |

### Future Optimization Candidates

**Low-risk app-side fixes:**
1. ~~Share actor store across all surfaces~~ **DONE** (2026-04-10) — all 5 surfaces now wired
2. Cache block set per session (invalidate on block/unblock action)
3. Cache hidden message ID set per actor (invalidate on delete-for-me)
4. Reuse inbox conversation data when opening chat (via Zustand bridge)
5. Parallelize profile kind resolution + gate check (currently sequential)

**DB/query changes (requires approval):**
1. Consolidate `read_actor_profile` RPC to include follower count
2. Add `get_inbox_with_hydration` RPC to eliminate fallback cascade
3. Add composite index on `posts(actor_id, deleted_at, created_at)`
4. Materialized view for notification sender summaries

---

## 7. Change Log

### 2026-04-10 07:00 AM
- Task: Detailed read audit — 5 high-traffic surfaces
- Summary: Traced complete read path for Central Feed, Profiles, Notifications, Inbox, and Chat. Documented all DAL files, tables, RPCs, cache patterns, realtime subscriptions, and bottlenecks. Identified 5 duplicate read patterns across surfaces and 9 optimization candidates.
- Surfaces reviewed: Central Feed, Citizen/VPORT Profiles, Notifications, Chat Inbox, Chat Conversation
- Files reviewed: 40+ DAL/controller/hook/pipeline files across feed, profiles, notifications, chat features

### 2026-04-10 07:30 AM
- Task: Wire shared hydration store into all 5 surfaces
- Summary: Connected Notifications, Inbox, Chat, and Profiles to the shared actor hydration store. `hydrateAndReturnSummaries` now checks cache first. Actor summaries are shared across surface transitions within the 5-min TTL window.
- Files Changed:
  - `engines/hydration/src/hydrate.js`
  - `apps/VCSM/src/features/notifications/inbox/dal/senders.read.dal.js`
  - `apps/VCSM/src/features/profiles/controller/getProfileView.controller.js`
- Cross-surface duplicate status: Actor summaries RESOLVED. Conversation metadata, members, hidden IDs, block status still duplicate.
