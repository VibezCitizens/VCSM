# BLACKWIDOW V2 — Adversarial Runtime Verification Report
## Feature: notifications | App: VCSM | Date: 2026-06-04

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report ID | BW-NOTIFICATIONS-2026-06-04 |
| BW Version | BW2.5 V2 |
| Feature | notifications |
| App | VCSM |
| Reviewer | BLACKWIDOW V2 |
| Run Date | 2026-06-04 |
| Run Time | 19:48 UTC (approximate) |
| Status | COMPLETE |

---

## 2. Scanner Preflight

| Field | Value |
|---|---|
| Scanner Version | 1.1.0 |
| Maps Generated | 2026-06-04T19:48:25.152Z |
| Map Age | FRESH (~7h old) |
| Security Paths (feature) | 14 |
| Security Paths (total platform) | 598 |
| Feature Share | 2.3% of platform |

All scanner maps confirmed loaded and readable. No stale map warnings.

---

## 3. Scanner Inputs Block

### Files Read

| File | Layer | Purpose |
|---|---|---|
| `apps/VCSM/src/features/notifications/publish.js` | adapter | publishVcsmNotification + publishVcsmNotificationBatch |
| `apps/VCSM/src/features/notifications/setup.js` | setup | engine DI wiring |
| `apps/VCSM/src/features/notifications/runtime/notificationRuntime.dal.js` | dal | all write DAL surfaces (mark seen/read/dismiss/archive + RPC wrappers) |
| `apps/VCSM/src/features/notifications/runtime/notificationRuntime.model.js` | model | mapNotificationInboxRows |
| `apps/VCSM/src/features/notifications/inbox/controller/Notifications.controller.js` | controller | getNotifications — primary read+autoMarkSeen path |
| `apps/VCSM/src/features/notifications/inbox/controller/notificationsCount.controller.js` | controller | getUnreadNotificationCount |
| `apps/VCSM/src/features/notifications/inbox/controller/NotificationsHeader.controller.js` | controller | loadNotificationHeader + markAllNotificationsSeen |
| `apps/VCSM/src/features/notifications/inbox/hooks/useNotificationInbox.js` | hook | primary inbox hook — noti:optimistic:replace event listener |
| `apps/VCSM/src/features/notifications/inbox/hooks/useNotificationsHeader.js` | hook | markAllSeen — actorId from caller |
| `apps/VCSM/src/features/notifications/inbox/lib/resolveInboxActor.js` | lib | inbox actor resolution from identity |
| `apps/VCSM/src/features/notifications/inbox/lib/blockFilter.js` | lib | block set filtering |
| `apps/VCSM/src/features/notifications/inbox/lib/resolveSenders.js` | lib | sender hydration |
| `apps/VCSM/src/features/notifications/inbox/model/notification.model.js` | model | mapNotification, normalizeSender |
| `apps/VCSM/src/dev/diagnostics/groups/notifications.group.js` | dev | legacy vc.notifications diagnostics (DEV only) |
| `apps/VCSM/src/dev/diagnostics/groups/notificationsFeature.group.js` | dev | engine diagnostics (DEV only) — markRead namespace mismatch |
| `engines/notifications/src/controller/inboxState.controller.js` | engine/controller | markSeen/markRead/dismiss/archive — NO ownership guard |
| `engines/notifications/src/controller/publishEvent.controller.js` | engine/controller | publishEvent — sourceActorId accepted from caller |
| `engines/notifications/src/dal/inbox.write.dal.js` | engine/dal | dalMarkInboxSeen/Read/Dismiss/Archive — .eq('recipient_id', ...) only |
| `engines/notifications/src/dal/events.write.dal.js` | engine/dal | dalInsertEvent — sourceActorId caller-supplied |

### Behavior Contract Status

**BEHAVIOR.md: PLACEHOLDER** — All §9 invariants are UNANCHORED. No §4 Failure Paths or §9 Must Never Happen entries defined. This is the condition that makes VENOM-006 a governance blocker: every §9 invariant attack below is derived from source-inferred logic, not a locked contract.

### Existing Open VENOM Findings (cross-reference targets)

| ID | Severity | Description |
|---|---|---|
| VEN-NOTIFICATIONS-001 | HIGH | markNotificationRecipientsSeenDAL bulk UPDATE on inbox_items — no actor guard at DAL layer |
| VEN-NOTIFICATIONS-002 | HIGH | markRead/dismiss/archive DAL functions — no ownership guard, any caller with recipientId can tamper |
| VEN-NOTIFICATIONS-003 | MEDIUM | Diagnostics panel markRead({ recipientId: actorId }) — ID namespace mismatch |
| VEN-NOTIFICATIONS-004 | MEDIUM | publishEvent accepts caller-supplied sourceActorId — no session verification |
| VEN-NOTIFICATIONS-005 | MEDIUM | noti:optimistic:replace event listener accepts unvalidated payload — XSS vector |
| VEN-NOTIFICATIONS-006 | LOW | BEHAVIOR.md is PLACEHOLDER — §5 and §9 missing |

---

## 4. Attack Surface Inventory

### Security Paths by Confidence

**LOW Confidence (14/14) — PRIMARY ATTACK TARGETS per Rule BW-002**
All 14 scanner security paths are LOW confidence: no route-confirmed path exists for any notification write surface. The scanner detected write operations but cannot trace them to a resolved source route. This means:
- No sourceRoute → no confirmed UI entry point
- Write surfaces are reachable via engine DI but not attributable to a specific authenticated route in the scanner

**No HIGH confidence paths recorded for this feature.**

### Write Surfaces

| DAL Function | Operation | Table/RPC | Ownership Guard (App Layer) | Ownership Guard (Engine Layer) | RLS Assumed |
|---|---|---|---|---|---|
| `markNotificationRecipientsSeenDAL` | UPDATE | notification.inbox_items | NONE | NONE | UNKNOWN |
| `markNotificationReadDAL` | UPDATE | notification.inbox_items | NONE | NONE | UNKNOWN |
| `dismissNotificationDAL` | UPDATE | notification.inbox_items | NONE | NONE | UNKNOWN |
| `archiveNotificationDAL` | UPDATE | notification.inbox_items | NONE | NONE | UNKNOWN |
| `insertNotificationEventDAL` | RPC | notification.create_event | NONE (publisher provides sourceActorId) | NONE | UNKNOWN |
| `insertNotificationRecipientsDAL` | RPC | notification.insert_recipients | NONE | NONE | UNKNOWN |
| `upsertNotificationRenderedDAL` | RPC | notification.upsert_rendered | NONE | NONE | UNKNOWN |
| `insertNotificationInboxItemDAL` | RPC | notification.insert_inbox_item | NONE | NONE | UNKNOWN |
| `updateNotificationRecipientStatusDAL` | RPC | notification.update_recipient_status | NONE | NONE | UNKNOWN |

### Hook Entry Points (UI-accessible)

| Hook | Writes Triggered | Identity Source |
|---|---|---|
| `useNotificationInbox` | autoMarkSeen (via getNotifications) | `useIdentity()` — session-sourced actorId |
| `useNotificationsHeader` | markAllNotificationsSeen | `actorId` — passed from caller |
| `noti:optimistic:replace` event handler | React Query cache mutation (client-only) | Unvalidated event.detail payload |
| `noti:refresh` event handler | React Query invalidation | N/A (no write) |

### Engine Controller Entry Points

| Controller | Accepts | Ownership Check |
|---|---|---|
| `markSeen({ recipientIds })` | array of recipientIds | NONE |
| `markRead({ recipientId })` | single recipientId | NONE |
| `dismiss({ recipientId })` | single recipientId | NONE |
| `archive({ recipientId })` | single recipientId | NONE |
| `publishEvent({ event, recipients })` | event with sourceActorId, recipients | NONE on sourceActorId |

---

## 5. Scanner Signals Block

| Signal Type | Count | Notes |
|---|---|---|
| Total security paths (feature) | 14 | All LOW confidence |
| Write operations (direct table) | 4 | inbox_items UPDATE x4 |
| RPC operations | 5 | create_event, insert_recipients, upsert_rendered, insert_inbox_item, update_recipient_status |
| Callgraph nodes | 213 | across app + engine |
| Callgraph edges | 307 | |
| Hook entry points | 7 | |
| Controller entry points | 20 | |
| Unresolved source routes | 14/14 | 100% of paths have null sourceRoute |

---

## 6. Adversarial Path Analysis

### A) OWNERSHIP BYPASS (§5.1)

**Attack Vector:** Actor A supplies Actor B's `recipientId` to `markRead`, `dismiss`, or `archive`. Since the engine layer accepts `recipientId` directly with no ownership assertion, Actor A can tamper with Actor B's inbox state.

**Source Trace:**
- `engines/notifications/src/controller/inboxState.controller.js` line 35: `export async function markRead({ recipientId })` — no caller identity parameter
- `engines/notifications/src/controller/inboxState.controller.js` line 36: `await dalMarkInboxRead({ recipientId, trace })` — passes recipientId directly
- `engines/notifications/src/dal/inbox.write.dal.js` line 74: `dalMarkInboxRead({ recipientId, trace })` — `.eq('recipient_id', recipientId)` — no actor ownership filter
- `notificationsFeature.group.js` line 184: `await markRead({ recipientId: context.actorId })` — diagnostics panel passes `actorId` where `recipientId` is expected, confirming the namespace is interchangeable from caller's perspective
- Same pattern applies to `dismiss` (line 52) and `archive` (line 69) in `inboxState.controller.js`

**Result: BYPASSED** — No ownership check at any layer between caller and DB for markRead, dismiss, archive, markSeen.

**Exploit Chain Type:** Single-step

**Finding:** BW-NOTI-001 — CRITICAL

---

**Attack Vector:** Actor A supplies Actor B's `recipientId` array to `markSeen` bulk operation, silently marking B's entire inbox as seen.

**Source Trace:**
- `engines/notifications/src/controller/inboxState.controller.js` line 18: `export async function markSeen({ recipientIds })` — accepts array, no ownership param
- `engines/notifications/src/dal/inbox.write.dal.js` line 44: `dalMarkInboxSeen` — `.in('recipient_id', recipientIds)` only — no actor ownership filter

**Result: BYPASSED** — Bulk mark-seen accepts arbitrary recipientId array.

**Exploit Chain Type:** Single-step

**Finding:** Confirmed by VEN-NOTIFICATIONS-001 and VEN-NOTIFICATIONS-002. BW confirms BYPASSED with source verification.

---

### B) SESSION MUTATION (§5.2)

**Attack Vector:** Is `viewerActorId` / `actorId` taken from session or caller payload in the notification inbox path?

**Source Trace:**
- `useNotificationInbox.js` line 18: `const actorId = identity?.actorId ?? null` — identity from `useIdentity()` (session-sourced, trusted)
- `Notifications.controller.js` line 64: `const { targetActorId, myActorId } = await resolveInboxActor(identity)` — identity is passed from hook (session-sourced)
- `resolveInboxActor.js` line 17: `if (!identity || !identity.actorId || !identity.kind) return { targetActorId: null, myActorId: null }` — null check present

**Result: BLOCKED** for the read path. `actorId` is session-sourced through `useIdentity()`. Null identity returns empty inbox.

**Attack Vector:** `useNotificationsHeader.js` `markAllSeen` path — `actorId` is passed from caller at line 14: `await markAllNotificationsSeen(actorId)`. The hook caller is `useNotificationsHeader(actorId)` (line 7) — `actorId` is a prop passed from the component.

**Source Trace:**
- `useNotificationsHeader.js` line 7: `export function useNotificationsHeader(actorId)` — actorId is a prop
- `useNotificationsHeader.js` line 14: `await markAllNotificationsSeen(actorId)` — actorId flows to markAllNotificationsSeen
- `NotificationsHeader.controller.js` line 16: `if (!actorId) return` — null guard present but no session cross-check

**Result: PARTIAL** — If the calling component passes the wrong actorId (e.g., a stale or swapped actorId), markAllSeen will operate on the wrong actor's inbox. The controller does not independently verify `actorId` against session. This is a trust delegation risk rather than a direct bypass.

**Finding:** BW-NOTI-002 — MEDIUM

---

### C) RUNTIME ABUSE (§5.3)

**Attack Vector:** Can a VPORT actor read a user actor's inbox or vice versa via a kind mismatch in `resolveInboxActor`?

**Source Trace:**
- `resolveInboxActor.js` lines 24-49: kind-based routing is correct — `user` identity maps `targetActorId = actorId`, `vport` identity maps `targetActorId = actorId` (vport's own actorId), `myActorId = ownerActorId`
- `resolveInboxActor.js` line 34: if `kind === 'vport'` and `ownerActorId` is missing, returns `targetActorId = identity.actorId, myActorId: null` — block filter is skipped (myActorId null → no block sets loaded)

**Result: PARTIAL** — Missing ownerActorId on vport identity silently disables block filtering. An attacker who can inject a vport identity without ownerActorId bypasses content filtering.

**Source Reference:** `resolveInboxActor.js` lines 33-46, `blockFilter.js` line 6: `if (!myActorId) return { iBlocked: new Set(), blockedMe: new Set() }`

**Finding:** BW-NOTI-003 — MEDIUM

---

**Attack Vector:** Can a non-owner actor type reach owner-only inbox state mutation paths (engine controllers)?

**Source Trace:**
- `engines/notifications/src/controller/inboxState.controller.js` — no actor kind check on any of the four mutation functions
- All four functions (`markSeen`, `markRead`, `dismiss`, `archive`) accept a raw `recipientId` with no kind validation

**Result: BYPASSED** — No actor kind guard. Any caller can reach any inbox state mutation regardless of actor kind.

This is a component of BW-NOTI-001 (already CRITICAL).

---

### D) RLS VERIFICATION (§5.4)

**Attack Vector:** Are there ownership filters in the DAL queries, or is RLS the only barrier for inbox_items mutations?

**Source Trace:**
- `engines/notifications/src/dal/inbox.write.dal.js` `dalMarkInboxRead` (line 74): `.eq('recipient_id', recipientId)` — filters on `recipient_id` only
- `engines/notifications/src/dal/inbox.write.dal.js` `dalMarkInboxSeen` (line 44): `.in('recipient_id', recipientIds)` — filters on `recipient_id` array only
- `engines/notifications/src/dal/inbox.write.dal.js` `dalDismissInboxItem` (line 102): `.eq('recipient_id', recipientId)` only
- `engines/notifications/src/dal/inbox.write.dal.js` `dalArchiveInboxItem` (line 130): `.eq('recipient_id', recipientId)` only
- None of these queries include `.eq('recipient_actor_id', callerActorId)` or any ownership-scoped filter

**Result: UNRESOLVED** — The `notification.inbox_items` table is filtered only by `recipient_id` (notification recipient UUID), not by `recipient_actor_id` (actor UUID). If the Supabase session does not have an RLS policy on `notification.inbox_items` that restricts UPDATE to the authenticated actor's own recipients, then any authenticated user can modify any inbox item by supplying the recipient_id. RLS presence on this table is UNVERIFIED in SECURITY.md and not confirmed by any DB scan entry.

**Finding:** BW-NOTI-004 — HIGH (RLS unverified for notification.inbox_items mutations)

---

**Attack Vector:** `notification.events` RPC `create_event` — sourceActorId is caller-supplied with no session verification.

**Source Trace:**
- `engines/notifications/src/dal/events.write.dal.js` line 55: `p_source_actor_id: sourceActorId` — caller value passed directly
- `engines/notifications/src/controller/publishEvent.controller.js` line 43: `sourceActorId: event.sourceActorId ?? null` — no session cross-check
- `apps/VCSM/src/features/notifications/publish.js` line 62: `sourceActorId: actorId` — `actorId` is the `actorId` parameter passed to `publishVcsmNotification`, not extracted from session

**Result: BYPASSED** — Any caller can supply an arbitrary `sourceActorId` to impersonate a different actor as the notification source. VEN-NOTIFICATIONS-004 confirmed; BW adds source-verified evidence.

**Finding:** Confirmed by VEN-NOTIFICATIONS-004. BW-NOTI-005 confirms BYPASSED with line citations.

---

### E) VIEWER CONTEXT FUZZING (§5.5)

**Attack Vector:** What happens if null actorId is passed to `getUnreadNotificationCount`?

**Source Trace:**
- `notificationsCount.controller.js` line 4: `if (!actorId) return 0` — null guard present, returns 0 safely

**Result: BLOCKED**

**Attack Vector:** What if null actorId is passed to `loadNotificationHeader`?

**Source Trace:**
- `NotificationsHeader.controller.js` line 4: `if (!actorId) return { unreadCount: 0 }` — null guard present

**Result: BLOCKED**

**Attack Vector:** What if null identity is passed to `getNotifications`?

**Source Trace:**
- `Notifications.controller.js` line 64: `const { targetActorId } = await resolveInboxActor(identity)`
- `resolveInboxActor.js` line 17: `if (!identity || !identity.actorId || !identity.kind) return { targetActorId: null, myActorId: null }`
- `Notifications.controller.js` line 67: `if (!targetActorId) return []` — returns empty array

**Result: BLOCKED** — Null identity returns empty array, no engine calls made.

**Attack Vector:** What if null/undefined recipientId is passed to `markRead` engine controller?

**Source Trace:**
- `engines/notifications/src/controller/inboxState.controller.js` line 36: `await dalMarkInboxRead({ recipientId, trace })` — no null check on recipientId at controller level
- `engines/notifications/src/dal/inbox.write.dal.js` line 74: `dalMarkInboxRead` — no null guard. `.eq('recipient_id', undefined)` would match no rows (Supabase would either return 0 rows or error)
- App-layer: `notificationRuntime.dal.js` line 244: `if (!recipientId) return null` — the APP-layer DAL has a null guard, but the engine controller does not

**Result: PARTIAL** — Null recipientId at the engine controller level may produce a DB query with no filter match (safe), but the missing null guard in the engine is a defense-in-depth gap.

**Finding:** BW-NOTI-006 — LOW

---

### F) MUTATION REPLAY (§5.6)

**Attack Vector:** Can a dismissed or archived notification be re-dismissed or re-archived (replay of terminal state)?

**Source Trace:**
- `engines/notifications/src/dal/inbox.write.dal.js` `dalDismissInboxItem` (line 102): `update({ is_dismissed: true, ... }).eq('recipient_id', recipientId)` — no `.eq('is_dismissed', false)` guard
- `engines/notifications/src/dal/inbox.write.dal.js` `dalArchiveInboxItem` (line 130): `update({ archived_at: now, ... }).eq('recipient_id', recipientId)` — no `.is('archived_at', null)` guard
- Compare: `dalMarkInboxSeen` (line 44) DOES include `.eq('is_seen', false)` — state-machine guard present for seen only

**Result: BYPASSED** — dismiss and archive operations lack idempotency guards. A replay attack re-dismisses an already-dismissed item (updating dismissed_at timestamp), and re-archives an already-archived item. This differs from markSeen which has the idempotency guard. The inconsistency means dismiss/archive can be replayed indefinitely to timestamp-spam.

**Finding:** BW-NOTI-007 — LOW (timestamp spam vector, no data loss, but inconsistent with markSeen pattern)

---

### G) HYDRATION POISONING (§5.7)

**Attack Vector:** Can actor summaries served to the notification inbox be poisoned via the `resolveSenders` fallback chain?

**Source Trace:**
- `resolveSenders.js` line 55: `listActorSummaryRowsByIdsDAL({ actorIds: ids }).catch(() => [])` — graceful degradation
- `resolveSenders.js` lines 70-96: fallback to `listActorPresentationRowsByIdsDAL` → `listActorIdentityRowsByIdsDAL` → join profiles/vports
- `notification.model.js` `normalizeSender` (line 81): if no sender resolved, falls back to `ctx.senderDisplayName` (from notification payload) — payload is caller-supplied

**Source Trace for Poisoning:**
- `publish.js` line 61: `payload: context` — `context` is the caller-supplied `context` object
- `notification.model.js` line 82: `ctx?.senderDisplayName ?? ctx?.actorDisplayName ?? ctx?.displayName ?? ctx?.senderUsername ?? ...` — if sender hydration fails, the display name falls back to payload-embedded values
- If a malicious publisher supplies `context: { senderDisplayName: '<img onerror=...>' }` and sender hydration fails, the poisoned display name is rendered

**Result: PARTIAL** — Hydration fallback to payload-embedded sender display names is a stored XSS vector if output is not escaped by the UI rendering layer. The attack requires: (1) publisher injects malicious senderDisplayName in context, (2) sender hydration fails (network error or missing actor). Risk is conditional on UI escaping.

**Finding:** BW-NOTI-008 — MEDIUM

---

### H) URL SURFACE (§5.9)

**Attack Vector:** Do notification linkPaths expose raw UUIDs in violation of the platform no-raw-IDs-in-public-URLs rule?

**Source Trace:**
- `publish.js` line 17 (JSDoc): `@param {string} [params.linkPath] — navigation path for the notification`
- `publish.js` line 73: `renderContext: { linkPath }` — linkPath is passed through to rendered notification without validation
- `notificationsFeature.group.js` line 175: `linkPath: '/profile/${context.actorId}'` — DIAGNOSTICS uses raw actorId in linkPath

**Result: BYPASSED for diagnostics; UNRESOLVED for production paths.** The diagnostics panel writes `/profile/${context.actorId}` (raw UUID) as a linkPath. Production callers of `publishVcsmNotification` are responsible for passing slug-based paths, but there is no enforcement gate at the `publishVcsmNotification` or `publishEvent` level that rejects UUID-containing linkPaths.

**Finding:** BW-NOTI-009 — LOW (diagnostics only; no enforced linkPath validation at publish layer)

---

### I) §9 INVARIANT ATTACK (HIGHEST PRIORITY)

**Note: BEHAVIOR.md is a PLACEHOLDER. All §9 invariants are UNANCHORED. The following attacks are designed from source-inferred invariants.**

**Source-Inferred Invariant SI-1: An actor must only be able to read and modify their own inbox.**

Attack Harness: Actor A calls `markRead({ recipientId: B_recipient_id })` directly.

Result: **BYPASSED** — confirmed in §A above. Engine controller has no ownership assertion. Only RLS (unverified) stands between the call and the DB mutation. This is the most severe finding.

**Source-Inferred Invariant SI-2: A notification must not be attributed to an actor who did not generate the triggering event.**

Attack Harness: Call `publishVcsmNotification({ recipientActorId: victim, actorId: impersonated_actor_id, kind: 'follow' })`.

Result: **BYPASSED** — `sourceActorId` is not session-verified at any layer. The engine accepts it as-is. A malicious caller can publish a notification appearing to come from any actor.

**Source-Inferred Invariant SI-3: An actor must not receive notifications from blocked actors.**

Attack Harness: Block actor B. Publish a notification from B's actorId. Check if it appears in the inbox.

Result: **BLOCKED** — `blockFilter.js` loads `iBlocked` and `blockedMe` sets. `filterByBlocks` (line 22) removes rows where `sourceActorId` is in either set. Block filter runs server-side (DAL reads) before the inbox is returned.

**Note:** SI-3 is partially weakened by the missing `ownerActorId` case in `resolveInboxActor` (BW-NOTI-003) — block filtering is skipped when `myActorId` is null.

**Source-Inferred Invariant SI-4: Self-notifications must never be delivered.**

Attack Harness: Call `publishVcsmNotification({ recipientActorId: actorId, actorId: actorId, kind: 'follow' })`.

Result: **BLOCKED** — `publish.js` line 53: `if (actorId && String(actorId) === String(recipientActorId)) return false`

**Source-Inferred Invariant SI-5: Optimistic inbox cache updates must not inject notifications from external sources.**

Attack Harness: Dispatch `window.dispatchEvent(new CustomEvent('noti:optimistic:replace', { detail: { removeId: 'X', add: { id: 'Y', title: '<script>...', body: '...' } } }))`.

Result: **BYPASSED (client-only)** — `useNotificationInbox.js` line 97: `const { removeId, add } = e?.detail ?? {}` — `e.detail` is from an untrusted window event. No schema validation on `add`. The injected object is placed directly into React Query cache at line 101: `return [add, ...prev.filter((n) => n.id !== removeId)]`. Any script with DOM access can inject a fake notification into the visible inbox. VEN-NOTIFICATIONS-005 confirmed; BW adds line-level verification.

---

## 7. Exploitability Assessment

| Finding ID | Severity | Attack Type | Exploitability | Result |
|---|---|---|---|---|
| BW-NOTI-001 | CRITICAL | Ownership Bypass | High — engine accepts any recipientId | BYPASSED |
| BW-NOTI-002 | MEDIUM | Session Mutation | Low — requires stale/swapped actorId prop | PARTIAL |
| BW-NOTI-003 | MEDIUM | Runtime Abuse | Low — requires missing ownerActorId | PARTIAL |
| BW-NOTI-004 | HIGH | RLS Verification | Medium — unverified RLS = latent bypass | UNRESOLVED |
| BW-NOTI-005 | MEDIUM | Source Impersonation | High — no session check on sourceActorId | BYPASSED |
| BW-NOTI-006 | LOW | Viewer Context Fuzzing | Very Low — Supabase handles gracefully | PARTIAL |
| BW-NOTI-007 | LOW | Mutation Replay | Low — timestamp spam only | BYPASSED |
| BW-NOTI-008 | MEDIUM | Hydration Poisoning | Medium — conditional on hydration failure + UI | PARTIAL |
| BW-NOTI-009 | LOW | URL Surface | Low — diagnostics only | BYPASSED (dev) |
| BW-NOTI-010 | HIGH | MISSING_BEHAVIOR_CONTRACT | Governance — §9 unanchored | FINDING |

### Critical Exploit Chain

**BW-NOTI-001 confirmed multi-vector single-step exploit:**

```
Attacker (authenticated session) → calls engine markRead/dismiss/archive directly
  → passes target actor's notification recipient_id
  → engine controller: NO ownership check
  → engine DAL: .eq('recipient_id', id) only
  → RLS: UNVERIFIED on notification.inbox_items
  → RESULT: arbitrary actor inbox state tampered
```

---

## 8. Source Verification Summary

| Finding ID | Source File | Line(s) | Verification Status |
|---|---|---|---|
| BW-NOTI-001 | engines/notifications/src/controller/inboxState.controller.js | 18, 35, 52, 69 | SOURCE_VERIFIED |
| BW-NOTI-001 | engines/notifications/src/dal/inbox.write.dal.js | 44, 74, 102, 130 | SOURCE_VERIFIED |
| BW-NOTI-002 | apps/VCSM/src/features/notifications/inbox/hooks/useNotificationsHeader.js | 7, 14 | SOURCE_VERIFIED |
| BW-NOTI-003 | apps/VCSM/src/features/notifications/inbox/lib/resolveInboxActor.js | 33-46 | SOURCE_VERIFIED |
| BW-NOTI-003 | apps/VCSM/src/features/notifications/inbox/lib/blockFilter.js | 6 | SOURCE_VERIFIED |
| BW-NOTI-004 | engines/notifications/src/dal/inbox.write.dal.js | 44, 74, 102, 130 | SOURCE_VERIFIED |
| BW-NOTI-005 | engines/notifications/src/dal/events.write.dal.js | 55 | SOURCE_VERIFIED |
| BW-NOTI-005 | engines/notifications/src/controller/publishEvent.controller.js | 43 | SOURCE_VERIFIED |
| BW-NOTI-005 | apps/VCSM/src/features/notifications/publish.js | 62 | SOURCE_VERIFIED |
| BW-NOTI-006 | engines/notifications/src/controller/inboxState.controller.js | 36 | SOURCE_VERIFIED |
| BW-NOTI-007 | engines/notifications/src/dal/inbox.write.dal.js | 102, 130 | SOURCE_VERIFIED |
| BW-NOTI-008 | apps/VCSM/src/features/notifications/inbox/model/notification.model.js | 82-92 | SOURCE_VERIFIED |
| BW-NOTI-009 | apps/VCSM/src/dev/diagnostics/groups/notificationsFeature.group.js | 175 | SOURCE_VERIFIED |
| noti:optimistic:replace | apps/VCSM/src/features/notifications/inbox/hooks/useNotificationInbox.js | 97-108 | SOURCE_VERIFIED |

---

## 9. Confidence Summary

| Category | Count | Notes |
|---|---|---|
| BYPASSED with SOURCE_VERIFIED | 4 | BW-NOTI-001, BW-NOTI-005, BW-NOTI-007, noti:optimistic:replace (VEN-005) |
| PARTIAL with SOURCE_VERIFIED | 4 | BW-NOTI-002, BW-NOTI-003, BW-NOTI-006, BW-NOTI-008 |
| UNRESOLVED (RLS) | 1 | BW-NOTI-004 — requires DB-level verification |
| BLOCKED with SOURCE_VERIFIED | 4 | null identity guard, self-notification, null actorId, block filter |
| GOVERNANCE (contract) | 1 | BW-NOTI-010 MISSING_BEHAVIOR_CONTRACT |

**Overall confidence: HIGH for CRITICAL and HIGH findings.** All BYPASSED results carry full source file + line citations.

---

## 10. §9 Invariant Attack Map

| Source-Inferred Invariant | Attack Designed | Result | Severity |
|---|---|---|---|
| SI-1: Actor reads/modifies own inbox only | markRead with foreign recipientId | BYPASSED | CRITICAL |
| SI-2: Notification source must match event generator | publishVcsmNotification with spoofed actorId | BYPASSED | MEDIUM |
| SI-3: Blocked actors must not appear in inbox | Post-block notification delivery test | BLOCKED | — |
| SI-4: Self-notifications must not be delivered | self-notification publish test | BLOCKED | — |
| SI-5: Optimistic cache must not inject external notifications | noti:optimistic:replace payload injection | BYPASSED | MEDIUM |

**UNANCHORED NOTE:** Because BEHAVIOR.md is a PLACEHOLDER, these invariants are not locked. Any of them could be intentionally revised. The BYPASSED results above represent current-state gaps relative to source-inferred expected behavior.

---

## 11. Behavior Contract Attack Summary

| Contract Gap | Impact |
|---|---|
| BEHAVIOR.md is PLACEHOLDER | All §9 invariants are unanchored — no authoritative statement of what must never happen |
| §4 Failure Paths undefined | No documented expected behavior for null identity, expired session, blocked actor, or cross-actor tamper attempts |
| §5 Security Rules undefined | No locked ownership model documented — attackers have no published contract to audit against |

**Recommendation:** BEHAVIOR.md must be promoted from PLACEHOLDER before any THOR release gate. All SI-* invariants confirmed here should become locked §9 entries.

---

## 12. THOR Impact

### Release Blockers (OPEN BYPASSED findings)

| Finding | Severity | THOR Block Reason |
|---|---|---|
| BW-NOTI-001 | CRITICAL | Inbox ownership bypass — any authenticated actor can mark/dismiss/archive any notification |
| BW-NOTI-004 | HIGH | RLS on notification.inbox_items unverified — latent bypass if RLS absent |
| BW-NOTI-010 | HIGH | BEHAVIOR.md PLACEHOLDER — §9 invariants unanchored, governance blocker |

**THOR Release Blocker: YES**

BW-NOTI-001 (CRITICAL) is a hard THOR blocker. The ownership bypass on engine inbox state mutations means any authenticated user can silently clear, archive, or dismiss another user's notifications. This has user trust and data integrity implications.

BW-NOTI-004 must be resolved by DB-level verification or explicit confirmation that RLS covers this table — it cannot be cleared by code review alone.

---

## 13. SPIDER-MAN Test Requirements

The following regression tests are required before THOR clearance:

| Test Case | Finding | Priority |
|---|---|---|
| `markRead({ recipientId })` with foreign actor's recipientId must be rejected | BW-NOTI-001 | P0 |
| `dismiss({ recipientId })` with foreign actor's recipientId must be rejected | BW-NOTI-001 | P0 |
| `archive({ recipientId })` with foreign actor's recipientId must be rejected | BW-NOTI-001 | P0 |
| `markSeen({ recipientIds: [foreignRecipientId] })` must be rejected | BW-NOTI-001 | P0 |
| `publishVcsmNotification({ actorId: spoofed_id })` must NOT attribute notification to spoofed actor | BW-NOTI-005 | P1 |
| `noti:optimistic:replace` event with malformed payload must be rejected/ignored | VEN-005/BW | P1 |
| `resolveInboxActor({ kind: 'vport', actorId: x })` with missing ownerActorId must not return null myActorId silently | BW-NOTI-003 | P1 |
| `dismiss` on already-dismissed item must not update dismissed_at (idempotency) | BW-NOTI-007 | P2 |
| `archive` on already-archived item must not update archived_at (idempotency) | BW-NOTI-007 | P2 |
| Verified RLS test: authenticated actor cannot UPDATE notification.inbox_items for foreign recipient | BW-NOTI-004 | P0 |

---

*Report generated by BLACKWIDOW V2 — 2026-06-04*
*All BYPASSED findings carry [SOURCE_VERIFIED] status with file:line citations.*
*No production source code was modified. No fixes applied. No git commits created.*
