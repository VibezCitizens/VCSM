# VCSM-QUERY-PERFORMANCE-REVIEW-001
# Supabase Query Load Audit — Read-Only Baseline

**Date:** 2026-06-07
**Scope:** apps/VCSM/src
**Mode:** Read-only audit — no code changes

---

## PHASE 1 — REALTIME SUBSCRIPTION INVENTORY

### Finding Summary
4 active realtime subscriptions found. All are in the chat engine. All clean up properly. Realtime is NOT the primary driver of Supabase load.

---

### RT-001 — Typing Presence Channel (Chat)

| Field | Value |
|---|---|
| File | `engines/chat/src/dal/typingPresence.dal.js` |
| Feature | Chat — Typing Indicator |
| Table/Schema | Presence channel (no postgres_changes) |
| Event Type | PRESENCE.sync |
| Filter | None (presence key = actorId) |
| Actor-Scoped | YES — presence key = actorId |
| Cleanup | YES — dalRemoveTypingPresenceChannel() in useEffect return |
| Duplication Risk | LOW — channel name includes conversationId + channelRef guard |
| Scope | Per-component (ConversationView) |
| **Classification** | **KEEP** |

---

### RT-002 — Conversation Messages (Chat)

| Field | Value |
|---|---|
| File | `engines/chat/src/dal/subscribeToConversation.js` |
| Feature | Chat — Message Stream |
| Table/Schema | chat.messages |
| Event Type | INSERT, UPDATE, DELETE |
| Filter | conversation_id=eq.${conversationId} |
| Actor-Scoped | PARTIAL — conversation-scoped; RLS enforces actor visibility |
| Cleanup | YES — supabase.removeChannel() on return |
| Duplication Risk | LOW — counter-based unique name (_subCounter) |
| Scope | Per-conversation (useConversationMessages) |
| **Classification** | **KEEP** |

---

### RT-003 — Inbox Entries (Chat)

| Field | Value |
|---|---|
| File | `engines/chat/src/dal/subscribeToInbox.js` |
| Feature | Chat — Inbox |
| Table/Schema | chat.inbox_entries |
| Event Type | INSERT, UPDATE, DELETE (all three) |
| Filter | actor_id=eq.${actorId} (on all three events) |
| Actor-Scoped | YES — explicit actor_id filter |
| Cleanup | YES — removeChannel() on return |
| Duplication Risk | LOW — counter-based name (_inboxSubCounter) |
| Scope | Per-actor (useInbox hook) |
| **Classification** | **KEEP** |

---

### RT-004 — Conversation Metadata (Chat)

| Field | Value |
|---|---|
| File | `engines/chat/src/dal/subscribeToConversation.js` (optional handler) |
| Feature | Chat — Conversation Title/Members |
| Table/Schema | chat.conversations |
| Event Type | UPDATE |
| Filter | id=eq.${conversationId} |
| Actor-Scoped | PARTIAL — conversation-scoped; RLS enforces actor |
| Cleanup | YES — same channel as RT-002 |
| Duplication Risk | LOW — shares channel with RT-002 |
| Scope | Per-conversation |
| **Classification** | **KEEP** |

---

### Intentionally Disabled Subscriptions

- **Chat inbox realtime** — Disabled by code comment in `useChatInbox.js`. Replaced by 30s polling + `noti:refresh` event.
- **Notification realtime** — Disabled by code comment in `useNotificationInbox.js`. Replaced by 60s polling + `noti:refresh` event.

### Phase 1 Conclusion

Realtime subscriptions are **disciplined and clean**. All 4 use narrow filters, proper cleanup, and counter-based unique naming. `realtime.list_changes` overhead in Supabase dashboard is from normal subscription heartbeat/negotiation — not a code problem. No action needed on realtime.

---

## PHASE 2 — POSTGREST QUERY INVENTORY

### Hot Tables Summary

| Table | Schema | Operation | Hot Hook | staleTime | Polling | Batched | select(*) |
|---|---|---|---|---|---|---|---|
| inbox_entries | chat | SELECT | useChatInbox | 30s | 30s | NO | NO |
| profile_public_details | vport | SELECT | useEffect (raw) | 60s TTL (in-memory) | NONE | NO | NO |
| notifications | vc | SELECT | useNotificationInbox | 60s | 60s | NO | NO |
| actor_owners | vc | SELECT | useUserVports | 5m | NONE | NO | NO |
| posts | vc | SELECT | useCentralFeed | 30s | NONE | YES (infinite paginated) | NO |
| post_comments | vc | SELECT | per post query | 60s | NONE | NO | NO |
| actors | vc | SELECT | readActorsBundle | 30s TTL cache | NONE | YES (.in()) | NO |
| profiles | vc | SELECT | readActorsBundle | 30s TTL cache | NONE | YES (.in()) | NO |
| bookings | vc | SELECT/INSERT/UPDATE | listBookingsInRange | — | NONE | NO | NO |

### Global select(*) Status: CLEAN — No select(*) found anywhere in the codebase.

---

### Key Query Files

#### chat.inbox_entries
- **DAL:** `features/chat/inbox/dal/inboxUnread.read.dal.js` — `readChatInboxUnreadRowsDAL(actorId)`
- **Query:** SELECT unread_count WHERE actor_id = ?, archived = false, archived_until_new = false
- **Hook:** `features/chat/inbox/hooks/useChatInbox.js`
- **Cache:** staleTime 30s, gcTime 10m, refetchInterval 30s
- **Enabled:** `!!actorId`

#### vport.profile_public_details
- **DAL 1:** `features/settings/profile/dal/vportPublicDetails.read.dal.js` — single row, eq('profile_id')
- **DAL 2:** `features/profiles/kinds/vport/dal/vportPublicDetails.read.dal.js` — joins vport.profiles, eq('actor_id')
- **Controller:** `features/profiles/kinds/vport/controller/getVportPublicDetails.controller.js` — 60s in-memory TTL cache
- **Hooks:** `useVportDashboardDetails` (raw useEffect) + `useVportPublicDetails` (raw useEffect, no cache)
- **Cache:** In-memory TTL on controller; NO React Query

#### vc.notifications
- **DAL:** `features/professional/briefings/dal/professionalBriefings.read.dal.js`
- **Query:** SELECT 11 columns WHERE recipient_actor_id = ? ORDER BY created_at DESC LIMIT 40
- **Hook:** `features/notifications/inbox/hooks/useNotificationInbox.js`
- **Cache:** staleTime 60s, gcTime 5m, refetchInterval 60s

#### actor_owners
- **DAL:** `features/settings/vports/dal/actorOwners.read.dal.js` (+ 10 other DALs)
- **Query:** SELECT actor:actors(id, kind) WHERE user_id = ?
- **Hook:** `useUserVports` — staleTime 5m, enabled: !!userId

#### posts (feed)
- **DAL:** `features/feed/dal/feed.read.posts.dal.js`
- **Query:** SELECT 14 columns WHERE realm_id = ?, deleted_at IS NULL ORDER BY created_at DESC
- **Hook:** `useCentralFeed` — useInfiniteQuery, staleTime 30s, gcTime 10m, enabled: Boolean(viewerActorId)

#### actors/profiles (feed bundle)
- **DAL:** `features/feed/dal/feed.read.actorsBundle.dal.js`
- **Query:** SELECT 4 columns WHERE id IN (...), is_deleted = false
- **Cache:** Custom 30s in-memory TTL — prevents re-fetching same actors across pagination pages

---

## PHASE 3 — HIGH-VOLUME SUSPECT TRACES

### SUSPECT 1 — chat.inbox_entries unread_count

**Full Call Chain:**
```
ChatInboxScreen / SpamInboxScreen / RequestsInboxScreen / ArchivedInboxScreen
  → useInboxFolder / useInbox
    → useChatInbox (React Query, queryKey: ['chat','inbox',actorId,folder])
      → getInboxEntries({ actorId, folder }) [chat engine]
        → readChatInboxUnreadRowsDAL(actorId)
          → supabase.schema('chat').from('inbox_entries').select('unread_count')...

PLUS: bootstrap.selectors.js
  → global chat badge query (queryKey: ['chat','unread',actorId])
    → getChatInboxUnreadBadgeCount(actorId)
      → readChatInboxUnreadRowsDAL(actorId) [SAME DAL, DIFFERENT CACHE KEY]
```

**Problem — DUAL POLLING ISSUE:**
When a user has the chat inbox open:
- `bootstrap.selectors.js` fires global chat badge poll every **30 seconds** (queryKey: `['chat','unread',actorId]`)
- `useChatInbox` fires inbox poll every **30 seconds** (queryKey: `['chat','inbox',actorId]`)
- These are DIFFERENT React Query cache keys → 2 independent 30s polls = **2 queries per 30s per user on chat screen**

**Per-Folder Cache Fragmentation:**
- `['chat','inbox',actorId,'inbox']`
- `['chat','inbox',actorId,'requests']`
- `['chat','inbox',actorId,'spam']`
- `['chat','inbox',actorId,'archived']`
Each tab switch = cache miss + full refetch.

**Unread badge (useChatUnreadOps):**
- File: `features/chat/inbox/hooks/useChatUnreadOps.js`
- Calls `getChatInboxUnreadBadgeCount` directly — NO React Query cache
- Every component that renders a badge independently hits the DAL

**Verdict:** The 30s dual polling cycle is the primary cause of `chat.inbox_entries` appearing in Supabase stats. At scale (N active users on chat screen) = 2N queries/30s.

---

### SUSPECT 2 — vport.profile_public_details

**Full Call Chain (Dashboard):**
```
VportDashboardScreen / VportSettingsScreen / VportActorMenuFlyerView
  → useVportDashboardDetails(actorId) [raw useState + useEffect — NO React Query]
    → getVportPublicDetailsController(actorId) [60s in-memory TTL cache]
      → fetchVportPublicDetailsByActorId(actorId) [DAL]
        → supabase.schema('vport').from('profile_public_details')...
```

**Full Call Chain (Public Menu):**
```
VportPublicMenuView / VportPublicReviewsView
  → useVportPublicDetails({ actorId }) [raw useState + useEffect — NO React Query, NO cache]
    → getVportPublicDetailsController({ actorId }) [RPC variant]
      → readVportPublicDetailsRpcDAL({ actorId })
        → supabase.rpc('read_vport_public_details', ...)
```

**Is it per-card?** NO — not detected in any feed/list map loops. Screen-level only.

**Batch Support?** NONE — all lookups are single actorId. No `.in()` or `ANY()` operator.

**Cache Analysis:**
- Dashboard: 60s in-memory TTL on controller — lost on reload, not shared across components
- Public menu: NO cache at all — every mount hits DB
- Neither uses React Query → no deduplication across component instances

**Why it shows in Supabase stats:**
- VportPublicMenuView AND VportPublicReviewsView both call `useVportPublicDetails` independently for the same actorId
- 2 DB calls on every public vport page load (no cache sharing between sibling views)
- In-memory controller cache is per-process (not shared between React renders)

---

### SUSPECT 3 — Notification / inbox queries

**Full Call Chain:**
```
NotificationsScreen
  → useNotificationInbox() [React Query, queryKey: ['notifications','inbox',actorId]]
    → getNotifications(identity, ...) [controller]
      → getInboxNotifications + loadBlockSets + resolveSenders + mapNotification
        → supabase.schema('vc').from('notifications')...

PLUS: bootstrap.selectors.js
  → global notification badge query (queryKey: ['notifications','unread',actorId])
    → getUnreadNotificationCount(actorId) [different query, different cache key]
      → countUnread({ recipientActorId }) [from @notifications engine]

PLUS (Settings — Vport Switcher):
VportsTab.view.jsx
  → useVportNotificationBadges(activeVports) [useQueries]
    → for each vport: getUnreadNotificationCount(v.actor_id)
    → N parallel queries, one per vport, each with 60s refetchInterval
```

**Per-vport badge problem:**
- 3 vports = 3 separate 60s polling queries for badge counts
- 5 vports = 5 queries
- No batch endpoint — each vport hits `countUnread` independently
- Badge keys: `['notifications','unread',vport1]` | `['notifications','unread',vport2]` | `['notifications','unread',vport3]`

**Dual polling (same pattern as chat):**
- When on NotificationsScreen: bootstrap badge (60s) + useNotificationInbox inbox (60s) = 2 different queries
- Separate keys means no cache sharing

---

## PHASE 4 — PERFORMANCE RISK MATRIX

| Rank | Feature | File | Query/Table | Cause | Evidence | Fix | Risk |
|---|---|---|---|---|---|---|---|
| 1 | Chat | bootstrap.selectors.js + useChatInbox.js | chat.inbox_entries | DUPLICATE_SUBSCRIPTION (polling) | Bootstrap badge + inbox hook both poll 30s with different query keys; 2 queries/30s per user on chat screen | Eliminate bootstrap chat badge poll; derive badge from useChatInbox data via selector | HIGH |
| 2 | Notifications | bootstrap.selectors.js + useNotificationInbox.js | vc.notifications | DUPLICATE_SUBSCRIPTION (polling) | Bootstrap unread badge + inbox hook both poll 60s with different query keys | Derive unread count from inbox data; remove redundant badge poll | HIGH |
| 3 | Settings/Vports | useVportNotificationBadges.js | vc.notifications (countUnread) | PER_ROW_QUERY | N vports = N separate 60s polling queries; no batch endpoint | Create batch RPC: `get_unread_counts_by_actors(actor_ids[])` → one query | HIGH |
| 4 | VportPublicMenu | useVportPublicDetails.js | vport.profile_public_details | NO_CACHE | Raw useEffect, no React Query; VportPublicMenuView + VportPublicReviewsView both call independently for same actorId | Wrap in React Query with shared queryKey; both views share cache | MEDIUM |
| 5 | VportDashboard | useVportDashboardDetails.js | vport.profile_public_details | NO_CACHE | Raw useEffect, no React Query; multiple screens fetch independently | Migrate to React Query with queryKey matching useVportProfileBySlug Q3 pattern | MEDIUM |
| 6 | Chat | useChatInbox.js | chat.inbox_entries | LOW_STALE_TIME | 30s staleTime + 30s refetchInterval is aggressive; every user on chat screen generates constant load | Raise to 45s or add realtime invalidation to replace polling | MEDIUM |
| 7 | Chat | useChatInbox.js | chat.inbox_entries | LOW_STALE_TIME | Per-folder cache fragmentation: inbox/requests/spam/archived are separate query keys; tab switches cause refetch | Unify base key, use all-folder fetch with client-side filter, or share parent key | MEDIUM |
| 8 | Notifications | useNotificationInbox.js | vc.notifications | LOW_STALE_TIME | 60s polling always active for any user with actorId | Raise to 120s with realtime invalidation on mutation events | MEDIUM |
| 9 | All | queryClient.js | ALL | NO_CACHE | QueryClient instantiated with zero global defaults; staleTime defaults to 0 on any unconfigured query | Add global defaults: staleTime 60000, gcTime 300000, refetchOnWindowFocus false | MEDIUM |
| 10 | Chat | useChatUnreadOps.js | chat.inbox_entries | NO_CACHE | getUnreadBadgeCount calls DAL directly without cache; fires per badge render | Route through React Query or derive from useChatInbox cache | MEDIUM |
| 11 | Feed | useCentralFeed.js | vc.posts | LOW_STALE_TIME | 30s staleTime; feed is read by most sessions; 30s causes aggressive background validation | Raise to 60s; feed content is tolerant of slight staleness | LOW |
| 12 | Profiles | Multiple DALs | vport.profile_public_details | MISSING_FILTER | No batch lookup; each profile page requires separate single-row fetch | Add batch DAL: `fetchVportPublicDetailsByActorIds(actorIds[])` for future multi-vport views | LOW |
| 13 | Notifications | useVportNotificationBadges.js | vc.notifications | POLLING_TOO_FAST | Each vport badge refetches every 60s independently; for multi-vport users this multiplies | After batch RPC is added (Rank 3), single 60s poll covers all vports | LOW |
| 14 | Settings | Multiple hooks | Multiple tables | MISSING_ENABLED_GUARD | Several settings queries lack staleTime despite being low-churn data | Add staleTime: 600000 (10m) to account, privacy, vports settings queries | LOW |
| 15 | Chat | useChatMessagePrefetch.js | chat.messages | SELECT_STAR (potential) | Prefetches up to 10 conversations × 20 messages each on inbox open — verify column projection | Confirm DAL uses explicit column list (not select *) | LOW |
| 16 | Bookings | listBookingsInRange*.dal.js | vc.bookings | SELECT_STAR (potential) | Complex date-range query with 38 columns in owner view — high payload size | Separate owner view (38 col) from customer view (7 col); already done per audit | INFO |
| 17 | Feed | feed.read.actorsBundle.dal.js | vc.actors + vc.profiles | DUPLICATE_SUBSCRIPTION | Custom 30s in-memory TTL cache deduplicates actors within a session; does not persist to React Query | Consider integrating with React Query actor store for cross-component dedup | INFO |
| 18 | Auth | bootstrap.hydrate.controller.js | — | — | Bootstrap hydration uses `noti:refresh` custom events for on-demand invalidation — this is correct pattern | KEEP |
| 19 | Chat | useMarkChatRead.js | chat.inbox_entries | — | Optimistic update + rollback on mark-read is correct | KEEP |
| 20 | Chat/Notifications | useDeleteChat / useArchiveChat | chat.inbox_entries | — | Mutation invalidation is correct and targeted | KEEP |

---

## PHASE 5 — SAFE OPTIMIZATION PLAN

### Tier 1 — Immediate Impact (No behavior change, safe)

#### OPT-001: Add global QueryClient defaults
**File:** `apps/VCSM/src/queries/queryClient.js`
**Change:** Add defaultOptions to QueryClient
**Expected Impact:** All unconfigured useQuery calls gain staleTime baseline; prevents 0ms stale defaults silently hitting DB on every render cycle
```javascript
// Add to QueryClient constructor:
defaultOptions: {
  queries: {
    staleTime: 60_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    retry: 1,
  }
}
```
**Risk:** LOW — only affects queries without explicit settings; all hot queries already have explicit values

---

#### OPT-002: Eliminate duplicate chat badge poll — derive from inbox cache
**File:** `apps/VCSM/src/bootstrap/bootstrap.selectors.js`
**File:** `apps/VCSM/src/features/chat/inbox/hooks/useChatInbox.js`
**Change:** Remove the bootstrap global chat unread query. Instead, expose a selector that reads the chat inbox query data from the React Query cache and derives unread count client-side.
**Expected Impact:** Cuts chat inbox_entries query load by 50% for users with chat screen open
**Risk:** LOW — badge count derived from same data; timing is already approximate (30s polling)

---

#### OPT-003: Eliminate duplicate notification badge poll — derive from inbox data
**File:** `apps/VCSM/src/bootstrap/bootstrap.selectors.js`
**File:** `apps/VCSM/src/features/notifications/inbox/hooks/useNotificationInbox.js`
**Change:** Same pattern as OPT-002: remove bootstrap notification unread query; derive badge count from `useNotificationInbox` React Query cache via selector
**Expected Impact:** Cuts notification query load by 50% for active users
**Risk:** LOW

---

#### OPT-004: Migrate vport public details hooks to React Query
**Files:**
- `apps/VCSM/src/features/public/vportMenu/hooks/useVportPublicDetails.js`
- `apps/VCSM/src/features/vportDashboard/dashboard/hooks/useVportDashboardDetails.js`
**Change:** Replace raw useState/useEffect with `useQuery({ queryKey: queryKeys.vportPublicDetails(actorId), ... })`
**Expected Impact:**
- VportPublicMenuView + VportPublicReviewsView share cache → cuts profile_public_details queries from 2 to 1 per page load
- Dashboard screens across the same session share cache → cache hit on second screen
**Risk:** LOW — pure cache layer change, same data shape

---

#### OPT-005: Batch vport notification badge counts into single RPC
**File:** `apps/VCSM/src/features/settings/vports/hooks/useVportNotificationBadges.js`
**Change:** Replace `useQueries()` with a single `useQuery()` calling a new RPC `get_unread_counts_by_actors(actor_ids[])` that returns `{ [actorId]: count }` map
**Expected Impact:** N vports → 1 query per 60s instead of N queries; eliminates fan-out
**Risk:** MEDIUM — requires new DB function (write to `supabase/migrations/`; owner deploys)

---

### Tier 2 — Tuning (Minor behavior change, safe)

#### OPT-006: Raise chat inbox staleTime from 30s to 45s
**File:** `apps/VCSM/src/features/chat/inbox/hooks/useChatInbox.js`
**Change:** `CHAT_INBOX_REFETCH_MS = 45_000`
**Expected Impact:** 33% reduction in chat inbox_entries load
**Risk:** LOW — realtime subscription (RT-003) handles live inbox changes; polling is only fallback

---

#### OPT-007: Unify chat inbox cache across folders
**File:** `apps/VCSM/src/features/chat/inbox/hooks/useChatInbox.js`
**Change:** Fetch all inbox data under single queryKey `['chat','inbox',actorId]`, return all folders, filter client-side by `folder` param
**Expected Impact:** Tab switching (inbox → requests → spam) uses cache instead of refetching
**Risk:** LOW — minor data shape change; verify all folder consumers accept full-data + client filter

---

#### OPT-008: Route useChatUnreadOps through React Query cache
**File:** `apps/VCSM/src/features/chat/inbox/hooks/useChatUnreadOps.js`
**Change:** Derive `getUnreadBadgeCount()` from `queryClient.getQueryData(queryKeys.chatInbox(actorId))` instead of raw DAL call
**Expected Impact:** Badge renders no longer hit DB independently
**Risk:** LOW — cache may be stale by up to staleTime; acceptable for badge display

---

#### OPT-009: Raise notification staleTime to 120s
**File:** `apps/VCSM/src/features/notifications/inbox/hooks/useNotificationInbox.js`
**Change:** `STALE_MS = 120_000`; `refetchInterval: STALE_MS`
**Expected Impact:** 50% reduction in notification query frequency
**Risk:** LOW — `noti:refresh` event provides on-demand freshness; 120s tolerance acceptable for notification list

---

---

## PHASE 6 — IMPLEMENTATION TICKETS

### TICKET-PERF-QUERY-DEFAULTS-001
**Type:** TASK | Priority: P1 | App: VCSM
**Goal:** Add global QueryClient defaultOptions to establish staleTime baseline
**File:** `apps/VCSM/src/queries/queryClient.js`
**Effort:** 30 minutes — 5 lines of config
**Validation:** Verify no existing queries regress; spot-check hot hooks still have explicit overrides

---

### TICKET-PERF-CHAT-UNREAD-001
**Type:** TASK | Priority: P1 | App: VCSM
**Goal:** Eliminate duplicate chat inbox badge poll from bootstrap; derive from useChatInbox cache
**Files:**
- `apps/VCSM/src/bootstrap/bootstrap.selectors.js`
- `apps/VCSM/src/features/chat/inbox/hooks/useChatInbox.js`
- `apps/VCSM/src/features/chat/inbox/hooks/useChatUnreadOps.js`
**Effort:** 2-3 hours
**Validation:** Chat badge still updates within 30s on new message; no extra DB call per badge render

---

### TICKET-PERF-NOTI-UNREAD-001
**Type:** TASK | Priority: P1 | App: VCSM
**Goal:** Eliminate duplicate notification badge poll from bootstrap; derive from useNotificationInbox cache
**Files:**
- `apps/VCSM/src/bootstrap/bootstrap.selectors.js`
- `apps/VCSM/src/features/notifications/inbox/hooks/useNotificationInbox.js`
**Effort:** 2 hours
**Validation:** Notification badge still updates within 60s; `noti:refresh` event still invalidates correctly

---

### TICKET-PERF-VPORT-PUBLIC-DETAILS-001
**Type:** TASK | Priority: P2 | App: VCSM
**Goal:** Migrate useVportDashboardDetails and useVportPublicDetails from raw useEffect to React Query
**Files:**
- `apps/VCSM/src/features/public/vportMenu/hooks/useVportPublicDetails.js`
- `apps/VCSM/src/features/vportDashboard/dashboard/hooks/useVportDashboardDetails.js`
**Effort:** 3 hours
**Validation:** VportPublicMenuView + VportPublicReviewsView share cache for same actorId; no duplicate fetches

---

### TICKET-PERF-VPORT-BADGE-BATCH-001
**Type:** ENG | Priority: P2 | App: VCSM
**Goal:** Create batch RPC for vport notification badge counts; replace N-query fan-out
**Files:**
- `supabase/migrations/` — new function `get_unread_counts_by_actors(actor_ids uuid[])`
- `apps/VCSM/src/features/settings/vports/hooks/useVportNotificationBadges.js`
**Effort:** 4 hours (migration + hook refactor)
**Validation:** 3 vports = 1 DB call every 60s instead of 3; badge values match individual queries

---

### TICKET-PERF-CHAT-INBOX-TUNING-001
**Type:** TASK | Priority: P3 | App: VCSM
**Goal:** Raise chat refetch interval from 30s to 45s; unify inbox cache across folders
**Files:**
- `apps/VCSM/src/features/chat/inbox/hooks/useChatInbox.js`
**Effort:** 1 hour
**Validation:** Inbox updates within 45s; folder tabs share cache; no UX regression

---

### TICKET-PERF-REALTIME-INVENTORY-001
**Type:** TASK | Priority: P3 | App: VCSM
**Goal:** Document why chat/notification realtime was disabled; evaluate re-enabling as replacement for polling
**Files:**
- `apps/VCSM/src/features/chat/inbox/hooks/useChatInbox.js`
- `apps/VCSM/src/features/notifications/inbox/hooks/useNotificationInbox.js`
- `engines/chat/src/dal/subscribeToInbox.js`
**Note:** RT-003 already subscribes to chat.inbox_entries with actor_id filter — reactivating this as the invalidation source would eliminate 30s polling entirely
**Effort:** 1 day (requires integration testing)
**Validation:** Inbox updates in real-time on new message; no polling load on Supabase

---

## VALIDATION CHECKLIST

After implementation, validate:

- [ ] No duplicate realtime channels per actor/session
- [ ] All realtime subscriptions clean up on unmount (already passing)
- [ ] Bootstrap badge polls removed or consolidated
- [ ] useChatUnreadOps derives from cache, not raw DAL
- [ ] VportPublicMenuView + VportPublicReviewsView share React Query cache for same actorId
- [ ] useVportNotificationBadges issues 1 query total for N vports (after batch RPC)
- [ ] Query count reduced in Supabase stats after deploy
- [ ] App behavior unchanged (badges update, inbox refreshes, notifications appear)

---

## FINAL SUMMARY

### Code Paths Most Responsible for Supabase Load

| Priority | Source | Table | Mechanism | Fix |
|---|---|---|---|---|
| 🔴 1 | bootstrap.selectors.js + useChatInbox | chat.inbox_entries | Dual 30s polling (2 queries/30s/user on chat) | OPT-002: derive badge from cache |
| 🔴 2 | bootstrap.selectors.js + useNotificationInbox | vc.notifications | Dual 60s polling | OPT-003: derive badge from cache |
| 🟠 3 | useVportNotificationBadges | vc.notifications | N queries × 60s per vport in settings | OPT-005: batch RPC |
| 🟠 4 | useVportPublicDetails (public menu) | vport.profile_public_details | No cache — 2 mounts per page hit DB independently | OPT-004: React Query |
| 🟡 5 | useChatInbox | chat.inbox_entries | 30s polling aggressive; folder fragmentation adds extra refetches | OPT-006 + OPT-007 |
| 🟡 6 | useNotificationInbox | vc.notifications | 60s polling on every active session | OPT-009 |
| 🟢 7 | All hooks | All tables | No global staleTime defaults — unconfigured queries stale at 0ms | OPT-001: QueryClient defaults |

### Do Indexes Help or Is Code the Fix?

**Code changes first.** The hot queries are already filtered by actor_id (chat, notifications) or profile_id (vport details). The indexes almost certainly exist on these PK/FK columns. The issue is **query volume**, not query speed. Reducing polling frequency and eliminating duplicate polls will have more impact than any index change.

**Index to verify (optional, secondary):**
- `chat.inbox_entries (actor_id, archived, archived_until_new)` — composite index would help if not present
- `vc.notifications (recipient_actor_id, created_at DESC)` — composite for paginated inbox fetch

### Realtime Assessment

Supabase's `realtime.list_changes` overhead is from the 4 clean, narrow-filtered chat subscriptions. This is expected and acceptable. No action needed.

The highest-leverage change is **re-evaluating why realtime was disabled for chat inbox** (RT-003 already subscribes to `chat.inbox_entries` with actor_id filter). If the disable reason is no longer valid, enabling realtime invalidation would eliminate the 30s chat polling entirely — the biggest single load driver.

---

**Report complete. No code was changed.**
