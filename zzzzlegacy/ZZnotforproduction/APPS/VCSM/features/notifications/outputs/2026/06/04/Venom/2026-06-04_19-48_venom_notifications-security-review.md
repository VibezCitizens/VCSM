# VENOM V2 Security Review — notifications

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | notifications |
| Application | VCSM |
| Review Date | 2026-06-04 |
| Review Time | 19:48 |
| Reviewer | VENOM V2 |
| Scanner Version | 1.1.0 |
| Report Version | V2 |
| Highest Finding Severity | HIGH |
| THOR Release Blocker | YES — VEN-NOTIFICATIONS-002 |
| Total Findings | 6 |
| CRITICAL | 0 |
| HIGH | 2 |
| MEDIUM | 2 |
| LOW | 2 |

---

## 2. Scanner Preflight Block

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                 | Generated At               | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map   | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map             | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map   | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map   | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map   | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map  | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs

| Input | Value |
|---|---|
| Scanner data | /tmp/venom_features/notifications.json |
| Feature source root | apps/VCSM/src/features/notifications/ |
| Feature doc root | ZZnotforproduction/APPS/VCSM/features/notifications/ |
| Write surfaces | 9 |
| RPCs | 5 |
| Security paths | 14 |
| Edge functions | 0 |
| Write execution paths | 9 |
| RPC execution paths | 5 |

All scanner signals: HIGH confidence on individual surfaces. All security paths have LOW route-resolution confidence — the notification engine is invoked as a library (via @notifications alias), not via a routable screen surface. Scanner correctly flagged this as "write surface discovered without route-confirmed path."

---

## 4. Security Surface Inventory

### Write Surfaces (9)

| # | Function | Operation | Target | Schema | File |
|---|---|---|---|---|---|
| 1 | insertNotificationEventDAL | RPC | create_event | notification | notificationRuntime.dal.js |
| 2 | insertNotificationRecipientsDAL | RPC | insert_recipients | notification | notificationRuntime.dal.js |
| 3 | upsertNotificationRenderedDAL | RPC | upsert_rendered | notification | notificationRuntime.dal.js |
| 4 | insertNotificationInboxItemDAL | RPC | insert_inbox_item | notification | notificationRuntime.dal.js |
| 5 | updateNotificationRecipientStatusDAL | RPC | update_recipient_status | notification | notificationRuntime.dal.js |
| 6 | markNotificationRecipientsSeenDAL | UPDATE | notification.inbox_items | notification | notificationRuntime.dal.js |
| 7 | markNotificationReadDAL | UPDATE | notification.inbox_items | notification | notificationRuntime.dal.js |
| 8 | dismissNotificationDAL | UPDATE | notification.inbox_items | notification | notificationRuntime.dal.js |
| 9 | archiveNotificationDAL | UPDATE | notification.inbox_items | notification | notificationRuntime.dal.js |

### RPCs (5)

| # | RPC | Schema | Caller |
|---|---|---|---|
| 1 | create_event | notification | insertNotificationEventDAL |
| 2 | insert_recipients | notification | insertNotificationRecipientsDAL |
| 3 | upsert_rendered | notification | upsertNotificationRenderedDAL |
| 4 | insert_inbox_item | notification | insertNotificationInboxItemDAL |
| 5 | update_recipient_status | notification | updateNotificationRecipientStatusDAL |

### Edge Functions (0)

None.

---

## 5. Scanner Signals Block

| Signal | Value |
|---|---|
| Route-confirmed execution paths | 0 of 14 (all LOW confidence) |
| Write surfaces with HIGH confidence | 9 of 9 |
| RPC surfaces with HIGH confidence | 5 of 5 |
| Edge functions | 0 |
| Scanner note | All paths are "discovered without route execution path" — engine is a library, not a routed feature. This is expected architecture. Source inspection required to establish auth trust. |

---

## 6. Behavior Contract Status

**BEHAVIOR.md Status: PLACEHOLDER — NO CONTRACT**

File: `ZZnotforproduction/APPS/VCSM/features/notifications/BEHAVIOR.md`

Contents: Status is `PLACEHOLDER`. The behavior contract is pending source review. No §5 Security Rules and no §9 Must Never Happen invariants are defined.

**Impact:** VENOM cannot cross-check enforcement of named BEH rules. All security analysis must proceed from source inspection alone.

**Finding recorded:** VEN-NOTIFICATIONS-006 (MEDIUM) — Missing behavior contract.

---

## 7. Trust Boundary Findings

---

### VEN-NOTIFICATIONS-001

```
VENOM SECURITY FINDING
- Finding ID: VEN-NOTIFICATIONS-001
- Location: apps/VCSM/src/features/notifications/runtime/notificationRuntime.dal.js:189-201
- Application Scope: VCSM
- Platform Surface: Supabase Table (notification.inbox_items) — UPDATE
- Trust Boundary: markNotificationRecipientsSeenDAL accepts a caller-supplied array of recipientIds and updates all of them.
- Boundary Violated: No ownership verification — any recipientId can be marked seen by any caller that supplies the ID.
- Contract Violated: Actor-isolation contract: writes to notification state must be scoped to the authenticated actor.
- Current behavior: markNotificationRecipientsSeenDAL issues a bulk UPDATE on notification.inbox_items WHERE recipient_id IN (recipientIds). The recipientIds array is assembled in the runtime/index.js engine from the result of readNotificationRecipientRowsDAL, which IS filtered by recipient_actor_id. In normal flow this is safe. However, the DAL function itself has no ownership guard — it accepts an arbitrary recipientIds array.
- Risk: If markNotificationRecipientsSeenDAL is ever called with a non-self recipientIds array (e.g., via the diagnostics panel, a future controller, or a logic bug in the caller), it will mark another actor's inbox items as seen with no DB-level check.
- Severity: HIGH
- Exploitability: LOW (requires application-layer bug or diagnostics abuse; RLS may block this)
- Attack Preconditions: Attacker must supply or influence the recipientIds array. In current flows this requires a logic error in the caller. Diagnostics panel in DEV mode is the highest-risk caller path.
- Blast Radius: Could silently mark any user's inbox items as seen, corrupting badge counts and notification state for targeted actors.
- Identity Leak Type: None (state corruption, not data leak)
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — DB-level RLS status on notification.inbox_items for UPDATE operations is not verified in this review. If RLS enforces auth.uid() ownership of recipient rows, this is partially mitigated. If RLS is absent or uses SECURITY DEFINER, the vulnerability is fully exploitable by any authenticated caller.
- Why it matters: Notifications are the user's awareness layer. Corrupt "seen" state silently harms UX and erodes trust. If exploited at scale, an attacker could suppress notification awareness for any actor.
- Recommended mitigation: The DAL should accept a recipientActorId ownership argument and enforce .eq('recipient_actor_id', recipientActorId) alongside the .in('recipient_id', recipientIds) filter. Alternatively, verify DB RLS enforces ownership and document it.
- Rationale: Defense in depth — application-layer ownership checks must not depend solely on RLS being correct.
- Follow-up command: DB (verify RLS policy on notification.inbox_items UPDATE), SPIDER-MAN (add test asserting cross-actor mark-seen is rejected)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

### VEN-NOTIFICATIONS-002

```
VENOM SECURITY FINDING
- Finding ID: VEN-NOTIFICATIONS-002
- Location: apps/VCSM/src/features/notifications/runtime/notificationRuntime.dal.js:244-263, 265-281, 284-299
- Application Scope: VCSM
- Platform Surface: Supabase Table (notification.inbox_items) — UPDATE (markRead, dismiss, archive)
- Trust Boundary: markNotificationReadDAL, dismissNotificationDAL, and archiveNotificationDAL each accept a bare recipientId and issue an UPDATE WHERE recipient_id = recipientId. No ownership check is performed.
- Boundary Violated: Actor-isolation contract. Any caller that knows or guesses a recipientId can mark it read, dismiss it, or archive it.
- Contract Violated: Write operations on notification state must be scoped to the authenticated actor's own rows.
- Current behavior: All three DAL functions issue unconditional UPDATE on notification.inbox_items WHERE recipient_id = <supplied ID>. The runtime/index.js functions markRead(), dismiss(), archive() pass the recipientId directly from the caller with no actor ownership verification at the engine layer. The controller layer (Notifications.controller.js) does not call these directly; they are exposed as engine exports. The diagnostics panel calls markRead({ recipientId: context.actorId }) — note: actorId is being passed where recipientId is expected, which is a separate bug (see VEN-NOTIFICATIONS-003).
- Risk: Any caller that obtains a valid recipientId (UUID) for a notification belonging to another actor can read, dismiss, or archive that notification on their behalf. recipientIds are UUIDs but may be inferable from notification payloads, event logs, or timing attacks if DB-level RLS is absent.
- Severity: HIGH
- Exploitability: MEDIUM (requires knowing or guessing a valid recipientId UUID; no application-layer check prevents it)
- Attack Preconditions: Attacker needs a valid recipientId UUID belonging to another actor. UUIDs are not guessable by brute force but may be leaked through shared payloads, event IDs, or DB introspection if RLS is incomplete.
- Blast Radius: Any actor's notification inbox state can be silently modified — marks read, dismissed, or archived. This is a denial-of-notification attack.
- Identity Leak Type: None (state tampering)
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — same risk as VEN-NOTIFICATIONS-001. If RLS on notification.inbox_items does not enforce auth.uid() = recipient_actor_id on UPDATE, this is fully exploitable at DB level.
- Why it matters: A malicious actor who knows a target's recipientId (e.g., via a shared event) could suppress notifications — preventing the target from seeing booking confirmations, follow requests, or moderation actions.
- Recommended mitigation: Add a recipient_actor_id ownership filter at the DAL layer: .eq('recipient_actor_id', actorId). This requires the engine functions markRead/dismiss/archive to accept and thread actorId. Alternatively, verify and document DB-level RLS enforcement on all notification.inbox_items UPDATE operations.
- Rationale: THOR BLOCKER. These are the highest-risk write surfaces in the feature and have no application-layer ownership guard.
- Follow-up command: DB (verify RLS on notification.inbox_items UPDATE), Carnage (add actor ownership column filter to all three DAL functions), SPIDER-MAN (add ownership regression tests)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security, Asset Security
```

---

### VEN-NOTIFICATIONS-003

```
VENOM SECURITY FINDING
- Finding ID: VEN-NOTIFICATIONS-003
- Location: apps/VCSM/src/dev/diagnostics/groups/notificationsFeature.group.js:184
- Application Scope: VCSM
- Platform Surface: PWA — Diagnostics Panel (DEV only)
- Trust Boundary: DEV-only diagnostic panel; only accessible in development/staging builds.
- Boundary Violated: Type contract — actorId is passed where recipientId is expected.
- Contract Violated: markRead({ recipientId }) contract: recipientId must be a notification recipient row ID (UUID from notification.recipients), not an actorId.
- Current behavior: Line 184: `await markRead({ recipientId: context.actorId })`. context.actorId is a vc.actors actor UUID. recipientId must be a UUID from notification.recipients. These are different namespaces. The call will silently fail or update a row in notification.inbox_items where recipient_id = actorId, which will match nothing (wrong ID namespace) or in an unlikely UUID collision scenario match a wrong row.
- Risk: Diagnostic test does not correctly exercise the markRead path. Silent mismatch means the diagnostic passes (no error thrown — markNotificationReadDAL returns null for no-match) while not testing the actual behavior. This also represents a developer misunderstanding of the ID contract that may propagate to future production code.
- Severity: MEDIUM
- Exploitability: LOW (DEV-only, no direct exploit in production)
- Attack Preconditions: DEV/staging environment access only.
- Blast Radius: Diagnostic test gives false confidence. Low direct security impact but high risk of propagating the ID confusion to production callers.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: If this pattern (actorId used as recipientId) propagates to a production controller, it creates a silent write failure — marking wrong rows or no rows — while returning success. Trust in notification state correctness would be undermined.
- Recommended mitigation: Fix diagnostic to first fetch a real recipientId by calling getInboxNotifications to get a row, then call markRead with that row's recipientId. Document the ID contract clearly in the engine API.
- Rationale: Correctness in diagnostics prevents ID confusion from reaching production.
- Follow-up command: SPIDER-MAN (fix diagnostic test, add ID contract comment to engine exports), DEADPOOL (trace ID contract through the call stack)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Access Control
```

---

### VEN-NOTIFICATIONS-004

```
VENOM SECURITY FINDING
- Finding ID: VEN-NOTIFICATIONS-004
- Location: apps/VCSM/src/features/notifications/runtime/index.js:114-165 (publishEvent)
- Application Scope: VCSM
- Platform Surface: Supabase RPC (notification.create_event, notification.insert_recipients, notification.upsert_rendered, notification.insert_inbox_item)
- Trust Boundary: publishEvent is the notification fanout entry point. It accepts an arbitrary event and recipients payload with no authentication check at the engine layer.
- Boundary Violated: Session/authentication boundary — the engine accepts and executes notification writes with no verification that a session is active or that the sourceActorId is the authenticated actor.
- Contract Violated: All write operations must be performed in the context of an authenticated session.
- Current behavior: publishEvent() in runtime/index.js (lines 114-165) calls insertNotificationEventDAL(buildEventRpcArgs(event)) with no session validation. The sourceActorId in the event payload is whatever the caller passes (event.sourceActorId). There is no check that supabase.auth.getUser() is active, that sourceActorId matches the authenticated session, or that the caller is authorized to produce events of the given eventKey type. The supabase client used is the VCSM app-level client (injected at setup), which carries the user's JWT — but the engine itself does no explicit auth verification.
- Risk: If the supabase client has an active session, any caller can publish a notification on behalf of any sourceActorId by passing an arbitrary sourceActorId. The event payload (including context object) is stored verbatim with no sanitization check at the engine layer. A misconfigured caller could fanout notifications to arbitrary recipients.
- Severity: MEDIUM
- Exploitability: LOW (requires app-level access; publish.js does enforce self-notification skip; callers are controllers that verify identity upstream)
- Attack Preconditions: Attacker needs to call publishEvent() or publishVcsmNotification() with a valid session but spoofed sourceActorId. Requires app-level code access (no direct web surface).
- Blast Radius: Notification spam to arbitrary recipients; sourced-as-another-actor notifications; payload injection into notification.events.payload column.
- Identity Leak Type: Actor impersonation (sourceActorId spoofing in notification events)
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — DB-level enforcement on notification.create_event RPC is not verified. If the RPC enforces auth.uid() = source_actor verification, this is partially mitigated.
- Why it matters: A notification that appears to come from actor X but was published by actor Y is an identity spoofing vector. Combined with the linkPath rendered in the notification, this could be used to socially engineer users into clicking malicious or misleading deep links.
- Recommended mitigation: publishEvent should verify the supabase session is active before writing. publish.js (publishVcsmNotification) should enforce sourceActorId === authenticated session actor. DB-level: the create_event RPC should enforce auth.uid() matches a known actor and that source_actor_id is consistent with the session.
- Rationale: Source actor should always be the authenticated session actor, not a caller-supplied string.
- Follow-up command: DB (verify notification.create_event RPC security definer and auth checks), ELEKTRA (trace sourceActorId injection chain from UI to DB)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Access Control, Software Development Security
```

---

### VEN-NOTIFICATIONS-005

```
VENOM SECURITY FINDING
- Finding ID: VEN-NOTIFICATIONS-005
- Location: apps/VCSM/src/features/notifications/inbox/hooks/useNotificationInbox.js:47-65
- Application Scope: VCSM
- Platform Surface: PWA — React Hook (client-side cache + event bus)
- Trust Boundary: window event listeners for 'noti:refresh' and 'noti:optimistic:replace' are registered globally on window without any origin or sender verification.
- Boundary Violated: Input trust boundary — DOM custom events can be dispatched by any script running on the page (including third-party scripts, injected content, or XSS payloads).
- Contract Violated: Notification state mutations should only occur via authenticated server operations, not arbitrary DOM events.
- Current behavior: useNotificationInbox.js registers two window event listeners: 'noti:refresh' (line 68-77) invalidates React Query caches for the current actor. 'noti:optimistic:replace' (lines 94-109) mutates the in-memory notification list by removing one notification ID and inserting a caller-supplied 'add' object. The 'add' object is not validated — any shape can be injected into the notifications cache.
- Risk: An XSS payload or malicious third-party script can dispatch window.dispatchEvent(new CustomEvent('noti:optimistic:replace', { detail: { removeId: someId, add: { ...malicious object } } })) to inject arbitrary notification content into the UI. The injected content can include a spoofed sender, malicious linkPath, or fabricated notification type, displayed to the user as if it were a real server-issued notification.
- Severity: MEDIUM
- Exploitability: LOW in production (requires XSS or third-party script injection); MEDIUM in development (window events are easy to dispatch from browser console).
- Attack Preconditions: XSS or third-party script execution in the VCSM PWA context. Not exploitable by an unauthenticated remote attacker without first achieving script execution.
- Blast Radius: Social engineering via injected fake notifications. Can redirect users to attacker-controlled URLs via linkPath. Could trigger UI state confusion.
- Identity Leak Type: None (injection, not leak)
- Cache Trust Type: CLIENT_CACHE_MUTATION — the 'noti:optimistic:replace' payload is trusted to modify the client-side React Query cache without server validation.
- RLS Dependency: NONE (client-side only)
- Why it matters: Fake notifications with malicious linkPath can phish users within their own trusted UI. Bookmark-quality trust in notification taps makes this a high-value XSS payload target.
- Recommended mitigation: (1) Validate the 'add' object shape in the 'noti:optimistic:replace' handler — require known fields, reject unknown keys, sanitize linkPath against known path prefixes. (2) Consider replacing window custom events with a typed event bus or React Query mutation to avoid uncontrolled event dispatch. (3) Ensure Content Security Policy headers block inline script injection.
- Rationale: Custom events on window are an uncontrolled trust boundary in browser environments.
- Follow-up command: ELEKTRA (audit all window.dispatchEvent and window.addEventListener usages for injection risk), SPIDER-MAN (add test that noti:optimistic:replace handler rejects malformed add objects)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security and Risk Management
```

---

### VEN-NOTIFICATIONS-006

```
VENOM SECURITY FINDING
- Finding ID: VEN-NOTIFICATIONS-006
- Location: ZZnotforproduction/APPS/VCSM/features/notifications/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Documentation / Governance
- Trust Boundary: N/A
- Boundary Violated: Governance contract — BEHAVIOR.md is required for all production features.
- Contract Violated: VCSM feature documentation contract: every feature must have a complete BEHAVIOR.md with §5 Security Rules and §9 Must Never Happen invariants.
- Current behavior: BEHAVIOR.md exists but is a PLACEHOLDER with no security rules, no invariants, and no contract content.
- Risk: Without a behavior contract, VENOM, BLACKWIDOW, and ELEKTRA cannot perform cross-check verification. Security regressions in this feature have no automated contract to be checked against.
- Severity: LOW
- Exploitability: LOW (documentation gap, not a direct exploit)
- Attack Preconditions: N/A
- Blast Radius: Governance-only — no direct security impact, but future regressions in this high-traffic feature may go undetected by automated review.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The notifications feature is one of the highest-write-frequency features on the platform. Without a security contract, any future change to notification routing, recipient fanout, or inbox state management has no guard rail.
- Recommended mitigation: Write a complete BEHAVIOR.md for the notifications feature, including: §5 Security Rules covering recipient ownership, self-notification prevention, sourceActorId integrity, and block filtering; §9 Must Never Happen invariants covering cross-actor inbox writes, unauthenticated event publishing, and unvalidated linkPath values.
- Rationale: Contract-driven security review requires a contract.
- Follow-up command: Logan (draft BEHAVIOR.md for notifications), SPIDER-MAN (add BEH-referenced tests once contract is written)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Software Development Security
```

---

## 8. Source Verification Summary

| File | Verified | Notes |
|---|---|---|
| apps/VCSM/src/features/notifications/runtime/notificationRuntime.dal.js | YES | Full read. All 9 write surfaces verified. No auth guard in DAL layer. |
| apps/VCSM/src/features/notifications/runtime/index.js | YES | Full read. Engine layer verified. publishEvent has no session check. markRead/dismiss/archive pass recipientId with no ownership check. |
| apps/VCSM/src/features/notifications/publish.js | YES | Full read. Self-notification guard present (actorId !== recipientActorId). No session verification. sourceActorId is caller-supplied. |
| apps/VCSM/src/features/notifications/inbox/controller/Notifications.controller.js | YES | Full read. Correctly resolves targetActorId from identity (resolveInboxActor). Block filtering present. autoMarkSeen is triggered from verified identity. |
| apps/VCSM/src/features/notifications/inbox/controller/notificationsCount.controller.js | YES | actorId guard present (line 5). VERIFIED_SAFE. |
| apps/VCSM/src/features/notifications/inbox/controller/NotificationsHeader.controller.js | YES | actorId guard present. getInboxNotifications called with caller-supplied actorId — safe in context. VERIFIED_SAFE for normal flow. |
| apps/VCSM/src/features/notifications/inbox/lib/resolveInboxActor.js | YES | Identity adapter only — no writes. VERIFIED_SAFE. |
| apps/VCSM/src/features/notifications/inbox/lib/blockFilter.js | YES | Read-only filter on moderation.blocks. VERIFIED_SAFE. |
| apps/VCSM/src/features/notifications/inbox/dal/blocks.read.dal.js | YES | Read-only, correct actorId guard. VERIFIED_SAFE. |
| apps/VCSM/src/features/notifications/inbox/dal/senders.read.dal.js | YES | Read-only. Uses hydration engine. VERIFIED_SAFE. |
| apps/VCSM/src/features/notifications/inbox/hooks/useNotificationInbox.js | YES | window event listeners are unvalidated. Finding VEN-NOTIFICATIONS-005 raised. |
| apps/VCSM/src/features/notifications/adapters/notifications.adapter.js | YES | Adapter only exports publish + count. VERIFIED_SAFE. |
| apps/VCSM/src/features/notifications/setup.js | YES | Configuration/DI only. VERIFIED_SAFE. |
| apps/VCSM/src/features/notifications/runtime/notificationRuntime.model.js | YES | Pure mapping. VERIFIED_SAFE. |
| apps/VCSM/src/features/notifications/inbox/model/notification.model.js | YES | Pure mapping. linkPath is passed through as-is from DB without sanitization — noted but classified LOW due to render context. VERIFIED_SAFE (context-dependent). |
| apps/VCSM/src/dev/diagnostics/groups/notificationsFeature.group.js | YES | markRead called with actorId instead of recipientId (line 184). Finding VEN-NOTIFICATIONS-003 raised. |

---

## 9. Confidence Summary

| Finding | Provenance | Confidence |
|---|---|---|
| VEN-NOTIFICATIONS-001 | SOURCE_VERIFIED | HIGH — DAL code read, no ownership filter present |
| VEN-NOTIFICATIONS-002 | SOURCE_VERIFIED | HIGH — DAL code read, no ownership filter present |
| VEN-NOTIFICATIONS-003 | SOURCE_VERIFIED | HIGH — exact line identified, ID namespace mismatch confirmed |
| VEN-NOTIFICATIONS-004 | SOURCE_VERIFIED | MEDIUM — engine code read, RPC internals not verified (DB-side unknown) |
| VEN-NOTIFICATIONS-005 | SOURCE_VERIFIED | MEDIUM — hook code read, exploitability requires XSS precondition |
| VEN-NOTIFICATIONS-006 | SOURCE_VERIFIED | HIGH — BEHAVIOR.md is placeholder, confirmed by file read |

---

## 10. THOR Impact

| Finding | Severity | THOR Blocker | Reason |
|---|---|---|---|
| VEN-NOTIFICATIONS-001 | HIGH | YES | Write operation on notification state has no ownership check at DAL level; DB RLS status unverified |
| VEN-NOTIFICATIONS-002 | HIGH | YES (PRIMARY) | markRead/dismiss/archive have no ownership guard; any caller can tamper with any actor's inbox state |
| VEN-NOTIFICATIONS-003 | MEDIUM | NO | DEV-only; no production impact |
| VEN-NOTIFICATIONS-004 | MEDIUM | NO | Caller-layer guards exist; RPC-level risk requires DB verification |
| VEN-NOTIFICATIONS-005 | MEDIUM | NO | XSS precondition required; not directly exploitable from web |
| VEN-NOTIFICATIONS-006 | LOW | NO | Documentation gap only |

**THOR RELEASE BLOCKER: YES**
Primary blocker: VEN-NOTIFICATIONS-002. markRead, dismiss, and archive write to notification.inbox_items with no actor ownership verification at either the DAL or engine layer. Any code path that reaches these functions with an arbitrary recipientId can tamper with any user's notification state.

Clearing criteria: Either (A) add .eq('recipient_actor_id', actorId) ownership filter to all three DAL functions and thread actorId through the engine API, OR (B) confirm via DB audit that notification.inbox_items UPDATE RLS enforces auth.uid() = recipient_actor_id and document this in SECURITY.md.

---

## 11. Required Follow-Up Commands

| Command | Finding | Action |
|---|---|---|
| DB | VEN-NOTIFICATIONS-001, 002, 004 | Verify RLS policies on notification.inbox_items (UPDATE) and notification.create_event RPC. Confirm auth.uid() ownership enforcement. |
| Carnage | VEN-NOTIFICATIONS-002 | Add recipient_actor_id ownership filter to markNotificationReadDAL, dismissNotificationDAL, archiveNotificationDAL. Thread actorId through engine markRead/dismiss/archive exports. |
| SPIDER-MAN | VEN-NOTIFICATIONS-001, 002, 003 | Add regression tests: cross-actor mark-seen rejected; cross-actor mark-read rejected; diagnostic test fixed to use real recipientId. |
| ELEKTRA | VEN-NOTIFICATIONS-004, 005 | Trace sourceActorId injection chain. Audit all window event usages in notifications feature. |
| Logan | VEN-NOTIFICATIONS-006 | Draft complete BEHAVIOR.md for notifications feature. |

---

## 12. MITIGATION PLAN

| Finding | Severity | THOR Blocker | Mitigation | Owner | Effort |
|---|---|---|---|---|---|
| VEN-NOTIFICATIONS-002 | HIGH | YES | Add recipient_actor_id ownership filter to all three inbox_items UPDATE DAL functions. Thread actorId through engine exports. | Carnage / DB | Medium |
| VEN-NOTIFICATIONS-001 | HIGH | YES | Add recipient_actor_id ownership filter to markNotificationRecipientsSeenDAL. Verify DB RLS. | Carnage / DB | Small |
| VEN-NOTIFICATIONS-004 | MEDIUM | NO | Verify notification.create_event RPC enforces session actor. Add session check in publishEvent. Document DB-level constraints. | DB / ELEKTRA | Medium |
| VEN-NOTIFICATIONS-005 | MEDIUM | NO | Validate 'add' object in noti:optimistic:replace handler. Sanitize linkPath. Consider typed event bus. | ELEKTRA / SPIDER-MAN | Small |
| VEN-NOTIFICATIONS-003 | MEDIUM | NO | Fix diagnostic test: fetch real recipientId before calling markRead. Add ID contract comments. | SPIDER-MAN | Small |
| VEN-NOTIFICATIONS-006 | LOW | NO | Write complete BEHAVIOR.md with §5 Security Rules and §9 Must Never Happen. | Logan | Medium |

---

## 13. CISSP Domain Coverage Summary

| CISSP Domain | Findings |
|---|---|
| Access Control | VEN-NOTIFICATIONS-001, VEN-NOTIFICATIONS-002, VEN-NOTIFICATIONS-003, VEN-NOTIFICATIONS-004 |
| Identity and Access Management | VEN-NOTIFICATIONS-004 |
| Software Development Security | VEN-NOTIFICATIONS-001, VEN-NOTIFICATIONS-002, VEN-NOTIFICATIONS-003, VEN-NOTIFICATIONS-004, VEN-NOTIFICATIONS-005, VEN-NOTIFICATIONS-006 |
| Asset Security | VEN-NOTIFICATIONS-002 |
| Security and Risk Management | VEN-NOTIFICATIONS-005, VEN-NOTIFICATIONS-006 |

**Domains NOT covered by active findings (VERIFIED_SAFE or out of scope):**
- Cryptography (no crypto surfaces in this feature)
- Security Architecture and Engineering (engine design is sound)
- Communication and Network Security (no edge functions, no web socket surfaces in this feature)
- Security Assessment and Testing (covered by SPIDER-MAN follow-up)
- Security Operations (no ops surfaces)
