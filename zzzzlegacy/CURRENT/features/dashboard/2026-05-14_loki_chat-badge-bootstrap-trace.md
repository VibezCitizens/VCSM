# LOKI RUNTIME REPORT

**Date:** 2026-05-14
**Application Scope:** VCSM
**Observed Flow:** Chat badge bootstrap polling path — full execution trace from `chat.inbox_entries` to `BottomNavBar`
**TypeScript output allowed:** NO

---

## LOKI TARGET

```
Observed flow:    Chat badge bootstrap polling (readChatInboxUnreadRowsDAL → useChatUnread → BottomNavBar)
Application Scope: VCSM
Entry point:      useBootstrapHydration(actorId) on authentication
Reason for observation: IRONMAN RISK-5 resolution (governance pass) — runtime ownership inferred only, no LOKI trace existed
TypeScript output allowed: NO
```

---

## TRACE IDENTITY

```
Trace ID:        LOKI-2026-05-14-001
Route:           All authenticated routes (badge rendered in BottomNavBar — always mounted)
Screen:          BottomNavBar.jsx (shared/components) — persistent shell
Entry point:     useBootstrapHydration(actorId) — triggered on auth identity resolution
Session state:   Authenticated Citizen OR authenticated VPORT owner
Environment:     Production (inferred from React Query polling config)
Timestamp:       2026-05-14
```

---

## RUNTIME SUMMARY

```
Total duration:         Per poll cycle: ~50–150ms estimated (INFERRED — no timing instrumentation)
Primary records:        1 row per conversation with unread messages (varies per actor)
Total DB reads:         1 per 30s per authenticated session (polling cadence)
Read Amplification:     Not applicable — this is a polling aggregation, not fan-out
Worst bottleneck:       Silent error swallowing — DB failure returns 0 with no trace
Cache behavior:         React Query cache with staleTime=refetchInterval=30s — data always stale at refetch time
```

---

## EXECUTION FLOW MAP

| Step | Operation | Caller | Trigger | Mode | Notes |
|---|---|---|---|---|---|
| 1 | `useBootstrapHydration(actorId)` fires | React root on auth | actorId available | ONCE | Sets `hydratedForActorId` in Zustand store |
| 2 | `setHydrated(actorId)` | `bootstrap.store.js` | Step 1 | ONCE | Records actorId + hydratedAt timestamp |
| 3 | `useChatUnread()` activates | `bootstrap.selectors.js` | `enabled: !!actorId` becomes true | ONCE then POLL | React Query starts polling |
| 4 | `queryFn: getUnreadBadgeCount(actorId)` | `bootstrap.selectors.js` | Initial mount + every 30s | RECURRING | Fires immediately at mount, then every 30s |
| 5 | `getChatInboxUnreadBadgeCount(actorId)` | `chatUnread.controller.js` | Step 4 | RECURRING | Guards: returns 0 if `!actorId` |
| 6 | `readChatInboxUnreadRowsDAL(actorId)` | `chatUnread.controller.js` | Step 5 | RECURRING | Supabase `.from('chat.inbox_entries').select('unread_count')` |
| 7 | DB read: `chat.inbox_entries` | Supabase client | Step 6 | RECURRING | WHERE actor_id=actorId AND archived=false AND archived_until_new=false |
| 8 | Reduce rows → count | `getChatInboxUnreadBadgeCount` | Step 7 | RECURRING | `rows.reduce((sum, row) => sum + Number(row?.unread_count \|\| 0), 0)` |
| 9 | React Query cache updated | React Query | Step 8 | RECURRING | key: `queryKeys.chatUnread(actorId)` — staleTime 30s |
| 10 | Badge terminal re-renders | `BottomNavBar.jsx` (via `chat.adapter.js`) | Step 9 | ON_CHANGE | Only renders if count changed (React memoization) |

### Invalidation Branch (write-path bust)

| Step | Operation | Caller | Trigger | Mode |
|---|---|---|---|---|
| I-1 | Mutation completes (mark read / archive / delete) | Various hooks | User action | ON_ACTION |
| I-2 | `invalidateChatUnread()` called | `bootstrap.invalidate.js` | Step I-1 | IMMEDIATE |
| I-3 | Reads `hydratedForActorId` from Zustand store | `bootstrap.invalidate.js` | Step I-2 | SYNC |
| I-4 | `queryClient.invalidateQueries(queryKeys.chatUnread(actorId))` | React Query | Step I-3 | IMMEDIATE |
| I-5 | React Query fires refetch (stale → refetch) | React Query | Step I-4 | IMMEDIATE |
| I-6 | `readChatInboxUnreadRowsDAL` fires out-of-schedule | Supabase | Step I-5 | ON_ACTION |

### `noti:refresh` Global Event Branch

| Step | Operation | Caller | Trigger | Mode |
|---|---|---|---|---|
| N-1 | `window.dispatchEvent(new Event('noti:refresh'))` | External trigger (realtime, push handler) | INFERRED | ON_EVENT |
| N-2 | `onGlobalRefresh` handler in `useBootstrapHydration` | `bootstrap.hydrate.controller.js` | Step N-1 | ON_EVENT |
| N-3 | `queryClient.invalidateQueries(queryKeys.notificationUnread)` | React Query | Step N-2 | IMMEDIATE |
| N-4 | `queryClient.invalidateQueries(queryKeys.chatUnread(actorId))` | React Query | Step N-2 | IMMEDIATE |
| N-5 | Both badge polls fire immediately out-of-schedule | React Query | Step N-4 | IMMEDIATE |

### Actor Switch / Logout Branch

| Step | Operation | Caller | Trigger | Mode |
|---|---|---|---|---|
| S-1 | Actor identity changes (switch or logout) | Auth system | INFERRED | ON_EVENT |
| S-2 | `useBootstrapHydration` actorId dependency changes | React | Step S-1 | REACT_EFFECT |
| S-3 | `purgeChatMessageCache()` called | `bootstrap.invalidate.js` | Step S-2 | INFERRED |
| S-4 | `queryClient.removeQueries({ queryKey: ['chat', 'messages'] })` | React Query | Step S-3 | HARD_EVICT |
| S-5 | `setHydrated(newActorId)` | `bootstrap.store.js` | Step S-2 | ONCE |
| S-6 | `useChatUnread()` re-enables with new actorId | React Query | Step S-5 | ONCE |

---

## DATABASE READ SUMMARY

| Table/View/RPC | Operation | Count | Cadence | Duplicate Fingerprints | Notes |
|---|---|---:|---|---:|---|
| `chat.inbox_entries` | SELECT (unread_count aggregate) | 1 per 30s | Every 30s per session | 0 | Also fires on invalidation events |

### Query Fingerprint

```
table:       chat.inbox_entries
op:          select
projection:  unread_count
filters:     actor_id (eq), archived (eq.false), archived_until_new (eq.false)
order:       none
limit:       none (all unread conversations for actor)
caller:      useChatUnread → getUnreadBadgeCount → getChatInboxUnreadBadgeCount → readChatInboxUnreadRowsDAL
cadence:     30s polling + invalidation-triggered
```

---

## DUPLICATE QUERY FINGERPRINTS

| Fingerprint | Count | Notes |
|---|---:|---|
| `chat.inbox_entries` unread badge read | 1 per cycle | No duplication observed. Single query per poll. |

No duplicate reads detected. The badge pipeline issues exactly one query per poll cycle. Invalidation and `noti:refresh` events cause additional out-of-schedule reads but do not duplicate — they replace the scheduled read.

---

## TIMING BUDGET STATUS

| Runtime Area | Observed | Budget | Status | Notes |
|---|---|---:|---|---|
| DB read: `chat.inbox_entries` | UNVERIFIED | 150ms | UNKNOWN | No timing instrumentation. Single indexed filter on `actor_id` + two boolean columns — expected fast. |
| Controller orchestration | UNVERIFIED | 300ms | UNKNOWN | No logging. Guard check + reduce — should be <5ms excluding DB. |
| Badge poll total (30s cadence) | UNVERIFIED | 500ms DAL budget | UNKNOWN | No end-to-end timing trace exists. |
| React Query cache update | Not measured | 50ms | UNKNOWN | Standard React Query behavior — expected <5ms. |
| React re-render (badge update) | Not measured | 100ms | UNKNOWN | `BottomNavBar` re-render only when count changes. |

> **Timing evidence classification: INFERRED.** No runtime timing instrumentation exists for this flow. All estimates derived from query shape and architecture analysis.

---

## CACHE OBSERVATIONS

| Cache | Caller | Status | Evidence | Impact |
|---|---|---|---|---|
| React Query `queryKeys.chatUnread(actorId)` | `useChatUnread()` | FUNCTIONAL | staleTime=30_000, refetchInterval=30_000 — data always considered stale at refetch time | Correct — ensures fresh data every 30s |
| React Query (on invalidation) | `invalidateChatUnread()` | BYPASS | `invalidateQueries` marks stale → immediate refetch | Correct — badge freshened after user action |
| React Query (on `noti:refresh`) | `onGlobalRefresh` handler | BYPASS | Same mechanism as invalidation | Correct — badge freshened on push/realtime signal |
| Bootstrap Zustand store | `bootstrap.store.js` | NOT_APPLICABLE | Stores session state only (`hydratedForActorId`, `hydratedAt`) — not badge data | No cache concern here |

**Cache health: FUNCTIONAL.** The badge cache is purpose-built. The `staleTime=refetchInterval=30_000` pattern ensures data is always considered stale exactly when the refetch fires — no premature re-fetching between polls. Invalidation correctly flushes the cache on relevant mutations.

**Cache gap: LOKI FINDING LF-01.** If DB returns an error during a poll cycle, the React Query cache continues to serve the last-good value (via `placeholderData: 0` on first load, then cached data on subsequent loads). Error state is not distinguished from valid `0`. See LF-01.

---

## RENDER / HOOK CHURN

| Component/Hook | Render Trigger | Query Impact | Risk |
|---|---|---|---|
| `useChatUnread()` | Every 30s when data changes | 1 query per cycle | LOW — expected behavior |
| `BottomNavBar.jsx` | When badge count changes | None (reads from React Query) | LOW — conditional re-render |
| `useBootstrapHydration` | On actorId change (mount, actor switch) | Activates polling | LOW — fires once per session |

**No render churn detected.** The badge pipeline is a clean polling loop. Re-renders are triggered only when count changes, not on every tick.

---

## OBSERVABILITY GAP REVIEW

| Flow | Current Visibility | Missing Signals | Severity | Recommended Instrumentation |
|---|---|---|---|---|
| Badge poll DB read timing | NONE | DB read latency per poll | MEDIUM | Log `[badge-poll] actorId kind duration_ms count` at controller — dev-only |
| Badge poll error path | NONE | DB failure silently returns 0 — indistinguishable from legitimate empty inbox | HIGH | Log `[badge-poll ERROR] actorId errorCode` on catch — dev-only; production: emit error to monitoring |
| invalidateChatUnread call frequency | NONE | No trace of how often badge is busted per session — may reveal action frequency | LOW | Log `[badge-invalidate] actorId reason` — dev-only |
| `noti:refresh` event frequency | NONE | No trace of how often push/realtime triggers out-of-schedule refresh | LOW | Log `[noti:refresh] actorId source` — dev-only |
| Actor switch badge transition | NONE | No trace of badge state during actor switch (old → new actorId handoff) | LOW | Log `[bootstrap-hydrate] actorId hydratedAt` — already partially present via Zustand store |
| 30s polling heartbeat | NONE | No visibility into whether polling is running or silently stopped | LOW | Dev-only diagnostic in `useChatUnread` effect — not recommended for prod |
| Badge count delta | NONE | No log of badge count changing (e.g., 5 → 3 after mark-read) | LOW | Dev-only only — never log message count to production |

---

## LOKI RUNTIME FINDINGS

---

### LOKI RUNTIME FINDING — LF-01

```
Finding ID:              LF-01
Location:                apps/VCSM/src/features/chat/inbox/controller/chatUnread.controller.js (catch block)
Application Scope:       VCSM
Runtime Risk Category:   Silent error swallowing — no observable failure state
Evidence Type:           OBSERVED (code read)
Observation Source:      chatUnread.controller.js catch block: `catch { return 0 }`
Confidence:              HIGH

Current runtime behavior:
  If `readChatInboxUnreadRowsDAL` throws (DB unavailable, RLS error, network failure), the controller
  catches the error and returns 0. React Query receives a successful resolution of 0.
  The badge shows 0 (or keeps last cached value on subsequent polls). There is no error state,
  no log, no monitoring signal. The user sees an empty badge indistinguishable from a real zero.

Runtime impact:
  - If Supabase RLS denies the actor, badge silently shows 0 forever — user does not know chat is broken.
  - If DB is intermittently slow, no timeout telemetry exists — the only symptom is badge lag.
  - Incident debugging is blind — no post-hoc reconstruction of whether badge polling was failing.

Read Amplification:      N/A — single read per cycle
Timing impact:           Error may add timeout delay before returning 0 — invisible to monitoring

Caller chain:
  BottomNavBar → useChatUnread (bootstrap.selectors.js) → getUnreadBadgeCount
  → getChatInboxUnreadBadgeCount (chatUnread.controller.js) → [CATCH: silent 0]

Cache status:
  React Query cache continues serving last-good value. On first load with error: placeholderData 0.
  Error is indistinguishable from valid empty inbox.

Severity:                MEDIUM

Recommended handoff:     VENOM (trust boundary — RLS failure produces same UX as zero unread)
                         DEADPOOL (if badge shows stale/wrong values reported in production)
                         LOGAN (update vcsm.dal.chat.md — document error behavior)

Rationale:
  Silent error paths in badge pipelines are an observability gap AND a trust-boundary concern.
  A user who is silently RLS-blocked still sees a valid-looking UI (badge = 0, no error state).
  For a security-adjacent surface (inbox access), silent failure is riskier than an explicit error state.
```

---

### LOKI RUNTIME FINDING — LF-02

```
Finding ID:              LF-02
Location:                apps/VCSM/src/bootstrap/bootstrap.selectors.js (useChatUnread — refetchInterval)
Application Scope:       VCSM
Runtime Risk Category:   Polling noise — continuous DB read for all authenticated sessions
Evidence Type:           OBSERVED (code read)
Observation Source:      bootstrap.selectors.js: staleTime: 30_000, refetchInterval: 30_000
Confidence:              HIGH

Current runtime behavior:
  Every authenticated session fires one SELECT query against chat.inbox_entries every 30 seconds,
  continuously, for the entire duration the BottomNavBar is mounted (i.e., the entire authenticated
  session duration).

  For a 1-hour session: ~120 badge queries.
  For a 2-hour session: ~240 badge queries.
  At 1000 concurrent authenticated users: ~33 queries/second to chat.inbox_entries (badge only).

  staleTime = refetchInterval = 30s: data is always considered stale when refetch fires.
  There is no backoff, no idle detection, no session-awareness.

Runtime impact:
  - Continuous DB load proportional to concurrent session count
  - No reduction during idle/background sessions (browser tab remains active as long as open)
  - No differentiation between high-engagement users and idle sessions
  - Native iOS improvement already implemented: realtime + 20s fallback polling (FALCON DRIFT-01 context)

Read Amplification:      1.0 reads per cycle — not amplified, but continuous
Timing impact:           No individual timing concern, but cumulative load at scale

Caller chain:
  BottomNavBar mounted → useChatUnread enabled → queryFn fires every 30s → readChatInboxUnreadRowsDAL

Cache status:            React Query handles 30s cache window — no bypass

Severity:                LOW (current scale), MEDIUM (at scale)

Recommended handoff:     KRAVEN (performance review — polling frequency vs. index coverage vs. expected user count)
                         DB (confirm chat.inbox_entries has index on actor_id for badge query pattern)

Rationale:
  The 30s polling interval is functional and industry-standard for badge freshness. However, KRAVEN
  should verify that the `chat.inbox_entries` table has an appropriate covering index for the
  badge query pattern (actor_id + archived + archived_until_new → unread_count) and assess
  the projected DB load at expected concurrent session counts. The native improvement (realtime
  + fallback) provides a better model that reduces polling noise — this may be worth a CAPTAIN
  consideration for PWA too.
```

---

### LOKI RUNTIME FINDING — LF-03

```
Finding ID:              LF-03
Location:                apps/VCSM/src/bootstrap/bootstrap.hydrate.controller.js (noti:refresh handler)
Application Scope:       VCSM
Runtime Risk Category:   Dual invalidation — both chat and notification badges bust on single event
Evidence Type:           OBSERVED (code read)
Observation Source:      bootstrap.hydrate.controller.js onGlobalRefresh handler — invalidates both
                         queryKeys.notificationUnread(actorId) AND queryKeys.chatUnread(actorId)
Confidence:              HIGH

Current runtime behavior:
  Any `noti:refresh` event — regardless of whether it is chat-related or notification-related —
  immediately invalidates both the chatUnread and notificationUnread React Query caches,
  causing both to fire out-of-schedule DB reads within the same event tick.

  If a realtime update fires for a notification (non-chat), chat.inbox_entries is still read.
  If a realtime update fires for a chat message, platform.notifications is still queried.
  Both reads fire together regardless of the event source type.

Runtime impact:
  - Every noti:refresh event triggers 2 DB reads (chat + notifications)
  - Chat reads fire on notification-only events (and vice versa)
  - If noti:refresh fires frequently (e.g., high-volume notification period), badge reads double in frequency
  - No correlation between event type and which cache to bust

Read Amplification:      2.0 per noti:refresh event (1 chat + 1 notification read)
Timing impact:           Two concurrent reads — likely fast, but unnecessarily coupled

Caller chain:
  Realtime/push event → window.dispatchEvent('noti:refresh') → onGlobalRefresh
  → invalidateQueries(chatUnread) + invalidateQueries(notificationUnread)
  → readChatInboxUnreadRowsDAL + [notification DAL]

Cache status:            Both caches busted simultaneously — BYPASS

Severity:                LOW

Recommended handoff:     KRAVEN (if noti:refresh fires at high frequency during high-activity periods)

Rationale:
  The dual invalidation is intentional and simple, but it couples two independent badge pipelines
  to a single event type without discriminating by source. This is a minor observability and
  efficiency gap. At low event frequency, impact is negligible. KRAVEN should note this pattern
  in its polling frequency analysis.
```

---

### LOKI RUNTIME FINDING — LF-04

```
Finding ID:              LF-04
Location:                All files in apps/VCSM/src/features/chat/ + apps/VCSM/src/bootstrap/
Application Scope:       VCSM
Runtime Risk Category:   Observability gap — no runtime trace exists for badge pipeline
Evidence Type:           OBSERVED (absence of instrumentation in code read)
Observation Source:      No console.log, no timing, no monitoring in controller, DAL, or hook
Confidence:              HIGH

Current runtime behavior:
  The badge bootstrap pipeline has zero runtime observability:
  - No timing logged for DB reads
  - No count logged for badge values
  - No error logged on failure (catch returns 0 silently)
  - No correlation ID per poll cycle
  - No trace of invalidation event source
  - No alert surface for polling stoppage

  If the badge breaks in production (showing wrong count, never updating, stuck at 0), there is
  no mechanism to reconstruct what happened from logs. The only diagnostic is user reports.

Runtime impact:
  - Incident response for badge issues requires code inspection + reproduction, not log analysis
  - Silent RLS failures (see LF-01) are completely invisible in production
  - No data to support KRAVEN performance analysis — timing must be estimated from query shape

Severity:                MEDIUM (incident response impact)

Recommended handoff:     LOGAN (document observability gap in vcsm.dal.chat.md)
                         VENOM (silent failure on RLS-blocked actor — see LF-01)
                         Future: add dev-only logging at controller entry/exit with timing, count, error

Rationale:
  Per LOKI observability governance: critical polling pipelines must emit sufficient signals
  for incident reconstruction. The badge pipeline is a high-frequency, session-spanning pipeline
  that silently affects UX quality. Minimal dev-only logging (timing, count, error reason)
  would significantly improve debuggability without production risk.
```

---

## HANDOFF MATRIX

| Finding | Recommended Handoff | Reason |
|---|---|---|
| LF-01 — Silent error swallowing | VENOM, DEADPOOL, LOGAN | Trust-boundary silent failure; potential incident blind spot |
| LF-02 — Continuous polling load | KRAVEN, DB | Polling frequency × user count → index + load review |
| LF-03 — Dual badge invalidation on noti:refresh | KRAVEN | Minor coupling — monitor if event frequency increases |
| LF-04 — Zero runtime observability | LOGAN, future instrumentation | Doc gap; dev-only logging recommended |

---

## CORRELATION ID REVIEW

| Flow | Correlation Present | Risk | Recommendation |
|---|---|---|---|
| Badge poll cycle | NONE | LOW | React Query key (actorId) serves as implicit correlation — adequate for single-app debugging |
| Invalidation event | NONE | LOW | Source of invalidation (which mutation triggered bust) is untraceable |
| noti:refresh dispatch | NONE | LOW | No event ID — impossible to correlate badge spike with originating event |

---

## OBSERVABILITY MATURITY CLASSIFICATION

```
Badge bootstrap pipeline observability maturity: MINIMAL

Criteria:
- No timing instrumentation: ✗
- No error signals: ✗ (silently returns 0)
- No count/delta logging: ✗
- No correlation IDs: ✗ (React Query key is implicit only)
- Cache hit/miss visibility: PARTIAL (React Query DevTools in dev only)
- Invalidation source tracing: ✗

Recommended target: BASIC (add dev-only timing + error logging at controller level)
```

---

## RUNTIME BOUNDARY COMPLIANCE

| Area | Status | Notes |
|---|---|---|
| Badge DAL inside `features/chat` | COMPLIANT | `inboxUnread.read.dal.js` owned by chat feature |
| Controller inside `features/chat` | COMPLIANT | `chatUnread.controller.js` — correct layer |
| Bootstrap access via adapter | COMPLIANT | `bootstrap.selectors.js` uses `useChatUnreadOps()` → controller — no direct DAL access |
| Engine boundary | COMPLIANT | Badge path does not touch `engines/chat` — app-level only |
| Zustand store | COMPLIANT | Bootstrap store contains session state only, not domain data |

---

## FINAL LOKI STATUS: WATCH

```
WATCH — No critical runtime failures observed.
The badge bootstrap pipeline is architecturally sound and functionally correct.
Two findings (LF-01, LF-04) represent observability gaps that could impede incident response.
LF-02 is the primary KRAVEN handoff — polling frequency analysis warranted before scale.
LF-03 is a minor coupling pattern — low risk at current event frequency.

No production-blocking findings. KRAVEN may proceed.
```

---

## GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.chat.md` | PRESENT |
| SENTRY review | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_sentry_chat-dal-lib-permissions.md` | PRESENT |
| FALCON review | `zNOTFORPRODUCTION/_ACTIVE/native/falcon_chat_dal_parity_2026-05-14.md` | PRESENT |
| IRONMAN ownership | `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.chat.owner.md` | PRESENT |
| KRAVEN review | — | MISSING — next step |
| CARNAGE migration | — | MISSING — next step |
| VENOM review (silent failure) | — | LF-01 routed — VENOM to evaluate |
