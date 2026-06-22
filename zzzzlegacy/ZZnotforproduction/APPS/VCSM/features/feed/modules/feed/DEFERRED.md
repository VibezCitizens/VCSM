---
title: Feed Module — Deferred Items
status: ACTIVE
feature: feed
module: feed
source: sentry-derived
created: 2026-06-05
updated: 2026-06-05
sentry-report: outputs/2026/06/05/SENTRY/2026-06-05_sentry_feed-compliance.md
---

# feed / modules / feed — DEFERRED ITEMS

Items acknowledged by governance but not scheduled for immediate resolution.
Each item requires a follow-up ticket or CAPTAIN note before it can be worked.

---

## Deferred — Functional / Architecture

### DEF-FEED-001 — useFeed.js Lifecycle Decision

| Field | Value |
|---|---|
| ID | DEF-FEED-001 |
| Finding | VEN-MOD-FEED-009 (INFO) |
| Status | OPEN — no decommission plan |
| Reason Deferred | Requires product decision via CAPTAIN. Active consumers: diagnostics group, useFeed.adapter. Not safe to remove without tracing all consumer callsites. |

`useFeed.js` is the legacy manual-cursor pagination hook. `useCentralFeed.js` (React Query) is now canonical. Both coexist. `useFeed.js` is NOT mounted in CentralFeedScreen but remains operational. No decommission plan has been recorded.

Action required: CAPTAIN note to record decision — keep as adapter surface for legacy consumers, or schedule removal with a consumer migration ticket.

---

### DEF-FEED-002 — Legacy feed.posts.dal.js Has No Visibility Guards

| Field | Value |
|---|---|
| ID | DEF-FEED-002 |
| Finding | VEN-MOD-FEED-005 (MEDIUM) |
| Status | OPEN |
| Reason Deferred | Legacy DAL. Confirmed unreachable from production code paths (used only in diagnostics). Requires audit of all callers before removal or hardening. |

`feed.posts.dal.js` has no realm/block/privacy filter. It is currently used only in `feedFeature.group.js` (diagnostics runner). No production code path calls it. Deferred until a diagnostics modernization pass is scheduled.

---

### DEF-FEED-003 — Full Follow Graph Cache Without Size Bound

| Field | Value |
|---|---|
| ID | DEF-FEED-003 |
| Finding | VEN-PIPE-007 (MEDIUM) |
| Status | OPEN |
| Reason Deferred | Scale risk, not current production risk. Requires performance data on follow graph sizes at scale before adding a bound that could break functionality. |

`readFeedFollowRowsDAL` caches the full follow graph for a viewer without an upper bound. At scale (thousands of follows), this cache entry could become large. Deferred until performance monitoring data is available. Kraven pass recommended.

---

### DEF-FEED-004 — Block/Follow Cache TTL Vs. Stale Moderation State

| Field | Value |
|---|---|
| ID | DEF-FEED-004 |
| Finding | VEN-PIPE-006 (MEDIUM) |
| Status | OPEN |
| Reason Deferred | Functional impact is bounded: blocked actor posts can re-appear for up to 60s after a block action. Accepted as a UX limitation pending cache invalidation wiring. |

Block and follow caches have a 60s TTL. After a block action, the viewer may see blocked actor posts for up to 60s on the next feed load (until cache expires). The outbound cache invalidation adapter (`feedCache.adapter.js`) exists but is not confirmed to be wired to the block action controller. Deferred pending wire-up ticket.

---

### DEF-FEED-005 — Unbounded Comment Count Fetch

| Field | Value |
|---|---|
| ID | DEF-FEED-005 |
| Finding | VEN-MOD-FEED-008 (LOW) |
| Status | OPEN |
| Reason Deferred | No production reports of timeout. Scale DoS risk is theoretical at current user volumes. |

`readCommentCountsBatch` fetches all comment rows per post to produce counts rather than using a DB-level `COUNT()` aggregate. On posts with very large comment counts, this could cause slow queries or client-side memory pressure. Deferred to a Kraven performance pass.

---

### DEF-FEED-006 — vport_id in DAL Return Shape Violates Architecture Contract

| Field | Value |
|---|---|
| ID | DEF-FEED-006 |
| Finding | VEN-MOD-FEED-010 (INFO) |
| Status | OPEN |
| Reason Deferred | INFO severity. The field is consumed internally and does not surface through any public hook or controller. Cleanup requires verifying all consumers before removing. |

`feed.read.viewerContext.dal.js` returns `vport_id` in its shape, violating the actor-based identity contract (never expose vport_id through public surfaces). The field appears to be consumed only internally by `getFeedViewerContext.controller.js` to route to a shortcut path. Deferred pending a surgical cleanup pass.

---

## Deferred — Security (Non-THOR)

### DEF-FEED-007 — readProfileAdultFlagDAL Has No Ownership Assertion

| Field | Value |
|---|---|
| ID | DEF-FEED-007 |
| Finding | VEN-MOD-FEED-006 (MEDIUM) |
| Status | OPEN |
| Reason Deferred | `is_adult` is a sensitivity concern but the caller (getFeedViewerIsAdult) is invoked with the viewer's own actorId. The exposure requires an attacker to know another actor's actorId and have a code path to call the controller with it. Low practical risk but requires DB pass to confirm RLS on public.profiles. |

`readProfileAdultFlagDAL` reads `is_adult` from `public.profiles` without confirming the caller owns the profile_id being resolved. Deferred pending DB audit of public.profiles RLS.

---

### DEF-FEED-008 — localStorage Welcome Card Dismiss State Can Be Tampered

| Field | Value |
|---|---|
| ID | DEF-FEED-008 |
| Finding | VEN-MOD-FEED-007 (LOW) |
| Status | ACCEPTED / DEFERRED |
| Reason Deferred | Cosmetic bypass only. No security enforcement lives in the welcome card. User suppressing their own welcome card via localStorage manipulation is an acceptable risk. |

`localStorage` key `vcsm_wfc_${actorId}` can be set by a user in their browser to bypass the welcome card DB read and prevent the card from showing. This is cosmetic — the welcome card has no security function. Documented and deferred indefinitely.

---

## Deferred — Quality

### DEF-FEED-009 — ELEKTRA Has Never Been Run on Feed Module

| Field | Value |
|---|---|
| ID | DEF-FEED-009 |
| Finding | SECURITY.md notes: "ELEKTRA | NEVER RUN | — | —" |
| Status | OPEN |
| Reason Deferred | ELEKTRA pass not yet scheduled. VENOM + BLACKWIDOW completed. ELEKTRA provides source-to-sink chain tracing that complements VENOM's findings. |

Action required: Schedule ELEKTRA run. 15 source-to-sink chains have been built per context — ELEKTRA should be run to formalize and verify these chains and produce patch recommendations.

---

### DEF-FEED-010 — DB Audit of Unverified RLS Tables

| Field | Value |
|---|---|
| ID | DEF-FEED-010 |
| Finding | SECURITY.md RLS table shows 10 of 15 tables as UNVERIFIED |
| Status | OPEN |
| Reason Deferred | Requires DB command execution. Blocked on DB access scheduling. |

Tables with unverified RLS status: `vc.actor_privacy_settings`, `vc.actors`, `vc.actor_follows`, `vc.actor_owners`, `moderation.blocks`, `public.profiles`, `vc.post_media`, `vc.post_comments`, `vc.post_reactions`, `vc.post_mentions`.

Action required: Run DB audit pass to confirm or deny RLS on each table. Update SECURITY.md with verified status.

---

### DEF-FEED-011 — Dead debugPostId Parameter in Pipeline

| Field | Value |
|---|---|
| ID | DEF-FEED-011 |
| Finding | VEN-PIPE-009 (LOW) |
| Status | OPEN |
| Reason Deferred | Low severity. The parameter is accepted by the pipeline function but only used in an unprotected console.log at line 137. The console.log itself is a higher-priority fix. |

`fetchFeedPagePipeline` accepts `debugPostId` as a parameter. It is used only in a console.log at line 137 (no DEV gate). The parameter has no other function. Deferred cleanup: remove the parameter and the console.log together in a surgical pass after the RULE 4 console fix.

---

*DEFERRED.md created by SENTRY, 2026-06-05.*
