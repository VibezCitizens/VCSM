# KRAVEN — Performance Analysis: Notifications DAL

**Date:** 2026-05-19  
**Application Scope:** VCSM  
**Feature:** Notifications — DAL, engine write path, inbox read path, sender resolution  
**Runtime Criticality:** Notification-critical  
**LOKI Evidence Status:** PARTIAL — static analysis only; live runtime traces not measured  

---

## KRAVEN TARGET

Feature / Route: `/notifications` — inbox, badge count, notification publish  
Application Scope: VCSM  
Entry point: `NotificationsScreen.jsx` (inbox) + `notifications.adapter.js` (publish path)  
Reason for analysis: CEREBRO verification pass flagged `resolveSenders()` waterfall (4 round trips) and `getInboxNotifications()` 5-DAL sequence as uncosted; `publishEvent()` per-recipient loop unanalyzed  

---

## RUNTIME CRITICALITY REVIEW

| Area | Criticality | Reason |
|---|---|---|
| `publishEvent()` write path | Notification-critical | All notification triggers across app funnel through this path |
| `getInboxNotifications()` read path | Notification-critical | Primary inbox load — bottom-nav tab, primary user surface |
| `resolveSenders()` waterfall | Notification-critical | Executes on every inbox load; worst case 4 DB round trips |
| `countUnread()` badge polling | Notification-critical | Polled every 60s while app is open; high frequency |
| `loadBlockSets()` block filter | Notification-critical | Runs on every inbox load; 2 parallel queries |

---

## RUNTIME EVIDENCE

Observed controllers: `Notifications.controller.js` — orchestrates `loadBlockSets`, `resolveSenders`, `mapNotification`  
Observed DAL calls (inbox read path): `readNotificationRecipientRowsDAL`, `readNotificationEventsByIdsDAL`, `readNotificationRenderedByRecipientIdsDAL`, `readNotificationInboxRowsByRecipientIdsDAL`, `markNotificationRecipientsSeenDAL`  
Observed DAL calls (publish write path): `insertNotificationEventDAL`, `insertNotificationRecipientsDAL`, then per-recipient: `upsertNotificationRenderedDAL`, `insertNotificationInboxItemDAL`, `updateNotificationRecipientStatusDAL`  
Observed tables: `notification.recipients`, `notification.inbox_items`, `notification.events`, `notification.rendered`, `vc.actors`, `public.profiles`, `vport.profiles`, `moderation.blocks`  
Timing observations: NOT MEASURED — static analysis only  

---

## QUERY AMPLIFICATION ANALYSIS

| Runtime Path | Primary Records | DB Operations | Amplification | Severity |
|---|---|---|---|---|
| Inbox read (best case — warm hydration cache) | 20 notifications | 6 (4 read + 1 markSeen + 2 blocks) | 0.3 | HEALTHY |
| Inbox read (worst case — cold hydration cache) | 20 notifications | 9 (4 read + 1 markSeen + 2 blocks + 3 sender fallback) | 0.45 | HEALTHY |
| `publishEvent()` — single recipient | 1 notification | 5 (event + recipients + rendered + inbox + status) | 5.0 | ELEVATED |
| `publishEvent()` — 10 recipients | 10 notifications | 32 (2 fixed + 3×10 serial) | 3.2 | ELEVATED |
| `publishEvent()` — 50 recipients | 50 notifications | 152 (2 fixed + 3×50 serial) | 3.04 | ELEVATED — but 152 serial ops |
| `countUnread()` — cache miss | 1 badge count | 2 | 2.0 | HEALTHY |
| `countUnread()` — cache hit (5s TTL) | 1 badge count | 0 | 0 | HEALTHY |

---

## WATERFALL DETECTION

| Caller Chain | Serial Operations | Estimated Delay | Optimization Opportunity |
|---|---|---|---|
| `publishEvent()` recipient delivery loop | 3 serial awaits × N recipients (sequential per recipient) | O(N × 3 × RTT) — e.g. 150ms+ for 10 recipients at 5ms/RTT | Parallelize across recipients with `Promise.allSettled` |
| `getInboxNotifications()` read lead | 1 serial (`readNotificationRecipientRowsDAL`) before 3 parallel | ~1 RTT before parallelism unlocks | Unavoidable — recipient IDs needed for subsequent queries |
| `getInboxNotifications()` autoMarkSeen | 1 serial write after 3 parallel reads | ~1 RTT | Fire-and-forget acceptable; already non-blocking for data return |
| `resolveSenders()` — cold cache | 3 serial tiers (tier 1 → tier 2 → tier 3 serial + parallel) | ~3 RTTs worst case | Warm hydration cache eliminates tiers 1–2; tier 3 is parallel internally |

---

## PERFORMANCE PATTERNS

Duplicate reads: NONE detected on inbox read path — all queries are batched by IDs  
N+1 suspicion: NONE on inbox read path. N+1 EXISTS on `publishEvent()` write path (per-recipient serial loop)  
Serial async chains: `publishEvent()` delivery loop — per-recipient serial pattern  
Controller fan-out: MODERATE — `Notifications.controller.js` orchestrates 3 collaborators (block filter, sender resolution, model) per inbox load  
Cache miss patterns: Sender resolution falls back to 4 tiers when hydration cache is cold; `countUnread()` has 5s in-memory cache (good)  
Payload size risk: LOW — inbox payload for 20 notifications is bounded; explicit column selects throughout  
Hydration cost signals: LOW — `mapNotificationInboxRows` joins 4 result sets in memory; not expensive  

---

## CONTROLLER FAN-OUT REVIEW

| Controller | DAL Calls | Dependencies | Risk |
|---|---|---|---|
| `Notifications.controller.js` | 0 direct (via engine + lib) | `loadBlockSets()`, `resolveSenders()`, `@notifications` engine, `notification.model.js` | MODERATE |
| `NotificationsHeader.controller.js` | 0 direct (via engine) | `countUnread()`, `getInboxNotifications()` from engine | HEALTHY |
| `notificationsCount.controller.js` | 0 direct | `countUnread()` from engine | HEALTHY |

---

## CACHE EFFICIENCY REVIEW

| Cache Area | Status | Problem | Runtime Impact |
|---|---|---|---|
| `countUnread()` in-memory cache | EFFECTIVE | 5s TTL + inflight deduplication — prevents DB spam | LOW RISK |
| Inbox React Query cache | EFFECTIVE | 60s stale, keepPreviousData | LOW RISK |
| DAL-level inbox read cache | NONE | No caching at DAL level — every 60s refetch fires 4-5 DB queries | MEDIUM RISK |
| Hydration engine cache (sender resolution) | EFFECTIVE (when warm) | `@hydration` engine has its own TTL cache; cold cache forces 4 round trips | LOW-MEDIUM RISK |
| Block filter | NONE | `loadBlockSets()` queries `moderation.blocks` on every inbox load | LOW RISK (2 parallel queries) |

---

## PAYLOAD / HYDRATION REVIEW

| Runtime Area | Payload Risk | Hydration Risk | Cause |
|---|---|---|---|
| Inbox read (20 items) | LOW | LOW | Explicit column selects; bounded by `limit=20` |
| Sender resolution | LOW | LOW | Actor shapes are small (5-6 fields) |
| `publishEvent()` write path | LOW | N/A | Write path only |
| Badge count | NONE | NONE | Single integer |

---

## KRAVEN PERFORMANCE FINDINGS

---

**KRAVEN PERFORMANCE FINDING — KF-1**

Finding ID: KF-1  
Location: `apps/VCSM/src/features/notifications/runtime/index.js` — `publishEvent()` delivery loop  
Application Scope: VCSM  
Runtime Criticality: Notification-critical  
Evidence Type: INFERRED  
Observation Source: Static source read — `runtime/index.js:136-155`  
Confidence: HIGH  
**Status: RESOLVED — 2026-05-19** — `Promise.allSettled` parallelization applied. File: 299 lines.  

Current runtime behavior:
```js
for (const recipient of recipientRows) {
  await upsertNotificationRenderedDAL(recipientId, renderedFallback)   // sequential
  await insertNotificationInboxItemDAL(recipientId)                    // sequential
  await updateNotificationRecipientStatusDAL(recipientId, 'delivered') // sequential
}
```
For N recipients: 3N sequential DAL calls after 2 fixed calls. Total: 2 + 3N serial DB operations.

Detected pattern: Serial per-iteration await loop — classic N×M serial waterfall  
Query Amplification: Elevated — 3N serial operations  
Blast Radius: Every notification trigger in the app (15+ adapter consumers)  
Estimated impact: HIGH for multi-recipient notifications. For a notification to 10 actors: ~30 sequential DB operations. For broadcasts to 50 actors: ~150 sequential operations. Per-recipient latency compounds directly.  
Root cause hypothesis: Delivery was designed for per-recipient error tracking, requiring individual status updates. The serial loop ensures each recipient gets a delivered/failed status, but each iteration waits on the previous.  
Recommended optimization: Parallelize the delivery loop with `Promise.allSettled`:

```js
const results = await Promise.allSettled(
  recipientRows.map(async (recipient) => {
    const recipientId = recipient?.id ?? null
    if (!recipientId) return
    await upsertNotificationRenderedDAL(recipientId, renderedFallback)
    await insertNotificationInboxItemDAL(recipientId)
    await updateNotificationRecipientStatusDAL(recipientId, 'delivered', null)
    return recipientId
  })
)
```

This reduces write path time from O(3N × RTT) to O(3 × RTT) — all recipients delivered in parallel. Error handling preserved via `allSettled`.

Optimization ROI: HIGH — expected 80–90% latency reduction for multi-recipient notifications  
Architectural Risk: LOW — `Promise.allSettled` is safe here; error path already handles individual failures  
Requires SENTRY/VENOM: NO — pure parallelization, no boundary change  
Expected improvement: Write path scales from O(N) to O(1) with respect to recipient count  

---

**KRAVEN PERFORMANCE FINDING — KF-2**

Finding ID: KF-2  
Location: `features/notifications/inbox/lib/resolveSenders.js`  
Application Scope: VCSM  
Runtime Criticality: Notification-critical  
Evidence Type: INFERRED  
Observation Source: Static source read — `resolveSenders.js:49-141`  
Confidence: MEDIUM (hydration cache behavior not measured)  

Current runtime behavior: Three-tier waterfall sender resolution.
- Tier 1: `listActorSummaryRowsByIdsDAL` → `@hydration` engine (cache-backed)
- Tier 2 (only if unresolved): `listActorPresentationRowsByIdsDAL` → `@hydration` engine (cache-backed)
- Tier 3 (only if still unresolved): serial `listActorIdentityRowsByIdsDAL` → then parallel `[listProfileRowsByIdsDAL, listVportRowsByIdsDAL]`

Detected pattern: Serial waterfall with early-exit — performance depends entirely on hydration cache warmth  
Blast Radius: Single feature — only notifications inbox load  
Estimated impact: LOW when hydration cache is warm (1 round trip). MEDIUM when cold (up to 4 round trips).  
Root cause hypothesis: The waterfall provides graceful degradation — better quality data from hydration cache when available, falling back to direct DB reads. The design is correct but creates variable latency depending on cache state.  
Recommended optimization: No structural change needed. The `@hydration` engine cache handles the typical case. Document expected cold-start latency for first inbox open. Consider pre-warming hydration cache for the viewer's social graph on login.  
Optimization ROI: LOW without cache pre-warming; MODERATE if social graph is pre-hydrated at login  
Architectural Risk: LOW  
Expected improvement: Consistent 1-round-trip sender resolution if hydration cache is pre-warmed at login  

---

**KRAVEN PERFORMANCE FINDING — KF-3**

Finding ID: KF-3  
Location: `features/notifications/runtime/index.js` — `getInboxNotifications()` + `autoMarkSeen`  
Application Scope: VCSM  
Runtime Criticality: Notification-critical  
Evidence Type: INFERRED  
Observation Source: Static source read — `runtime/index.js:167-219`  
Confidence: MEDIUM  

Current runtime behavior: Every inbox load with unseen notifications fires `markNotificationRecipientsSeenDAL` as a serial write AFTER the 3-parallel reads complete. This means inbox data is returned before mark-seen completes (correct), but the React Query promise does not resolve until after mark-seen.

Detected pattern: Serial trailing write on read path  
Blast Radius: Single feature — every inbox open with unseen notifications  
Estimated impact: LOW — mark-seen is a single batched write. The delay is approximately 1 extra RTT on loads that have unseen notifications. Acceptable for current scale.  
Recommended optimization: Consider making `autoMarkSeen` fire-and-forget by not awaiting it before returning notifications. Currently it adds ~1 RTT to every first inbox open.  
Optimization ROI: LOW  
Architectural Risk: LOW  
Expected improvement: ~1 RTT reduction on inbox open when unseen notifications exist  

---

**KRAVEN PERFORMANCE FINDING — KF-4**

Finding ID: KF-4  
Location: `features/notifications/inbox/hooks/useNotificationInbox.js` — `refetchInterval: 60_000`  
Application Scope: VCSM  
Runtime Criticality: Notification-critical  
Evidence Type: INFERRED  
Observation Source: Static source read — `useNotificationInbox.js:30`  
Confidence: HIGH  

Current runtime behavior: React Query polls `getNotifications()` every 60 seconds while the `/notifications` tab is open and in the foreground. Each poll executes 4-5 Supabase queries (recipient rows + 3 parallel + autoMarkSeen). No DAL-level caching — every poll hits the DB.

Detected pattern: Periodic polling without DAL cache  
Blast Radius: Single route (`/notifications`) — only when tab is open in foreground  
Estimated impact: LOW per cycle (5 batched queries). Cumulative: ~300 DB queries per hour for a user who leaves `/notifications` open. `refetchIntervalInBackground: false` correctly prevents background polling.  
Recommended optimization: DAL-level caching is not recommended here — inbox data must be fresh. The 60s interval is reasonable. No change needed. This finding is INFORMATIONAL.  
Optimization ROI: N/A  
Architectural Risk: N/A  

---

## KRAVEN PRIORITY MATRIX

| Priority | Finding | Runtime Criticality | Estimated Impact | ROI | Severity |
|---|---|---|---|---|---|
| 1 | KF-1 — `publishEvent()` serial recipient loop | Notification-critical | HIGH — O(N×3) serial DB ops | HIGH | HIGH — **RESOLVED 2026-05-19** |
| 2 | KF-2 — `resolveSenders()` cold-cache waterfall | Notification-critical | MEDIUM (cache-dependent) | MODERATE | MEDIUM |
| 3 | KF-3 — `autoMarkSeen` trailing serial write | Notification-critical | LOW — 1 extra RTT | LOW | LOW |
| 4 | KF-4 — Inbox polling 60s no DAL cache | Notification-critical | LOW — informational | N/A | INFO |

---

## OPTIMIZATION SAFETY REVIEW

| Optimization | Architectural Risk | Security Risk | Requires SENTRY/VENOM |
|---|---|---|---|
| KF-1: Parallelize publishEvent delivery loop | LOW — no boundary change | NONE — each recipient still gets individual error tracking | NO |
| KF-2: Pre-warm hydration cache at login | LOW — hydration engine addition | NONE | OPTIONAL (SENTRY if hydration engine modified) |
| KF-3: Fire-and-forget autoMarkSeen | LOW — timing change only | NONE | NO |

---

## LOKI EVIDENCE STATUS

**MISSING**

All findings are INFERRED from static source analysis. Live runtime measurements needed to:
- Confirm actual RTT on inbox load (Supabase latency in prod)
- Measure publish path duration for multi-recipient notifications
- Observe hydration cache hit rate during inbox loads
- Verify 60s polling cost is acceptable under real traffic

---

## Summary

**KF-1 RESOLVED (2026-05-19):** `publishEvent()` delivery loop parallelized with `Promise.allSettled`. Serial O(3N×RTT) → parallel O(3×RTT). Per-recipient error tracking preserved — `failed` status update handled inside each async map function with direct `recipientId` access. File held at 299 lines (contract limit: 300).

All other findings are LOW-MEDIUM priority and informational. The inbox read path is well-structured (batched queries, parallel joins). The badge count has correct in-memory caching. The sender waterfall is cache-aware and degrades gracefully.

**No CRITICAL or release-blocking performance findings. KF-1 resolved.**
