# IRONMAN — Ownership Audit: Notifications Feature

**Date:** 2026-05-19  
**Application Scope:** VCSM  
**Triggered by:** CEREBRO verification pass — `vcsm.dal.notifications.md`  
**Ownership File:** `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.notifications.owner.md`  

---

## IRONMAN TARGET

Feature / Engine: Notifications (inbox, badge, adapter surface, type dispatch, engine integration)  
Application Scope: VCSM  
Reason for ownership review: Prior AvengersAssemble pass found IRONMAN evidence MISSING; 13+ type-specific view files and inbox/ui/ layer had no documented owner; dead code cluster (5 files) had no deletion decision authority  

---

## OWNERSHIP CLARITY CLASSIFICATION

| Area | Clarity | Confidence | Notes |
|---|---|---|---|
| Adapter surface (`notifications.adapter.js`) | CLEAR | HIGH | Clean boundary; all 15+ consumers confirmed |
| Engine DAL (`notificationRuntime.dal.js`) | CLEAR | HIGH | Engine-encapsulated; no direct feature imports |
| Inbox controller + hooks (active) | CLEAR | HIGH | Correct layer ordering; well-documented |
| `types/` dispatch layer (13 files) | PARTIAL | MEDIUM | Files exist and function; no explicit ownership decision |
| `inbox/ui/` layer (3 views) | PARTIAL | MEDIUM | Files exist and active; not in architecture pipeline |
| Dead code cluster | PARTIAL | HIGH | Confirmed dead; no deletion authority assigned |
| `@notifications` engine | PARTIAL | HIGH | Engine consumed and initialized; no engine audit on file |
| Native parity | MISSING | LOW | No FALCON review; no native ownership doc |

---

## RESPONSIBILITY CLASSIFICATION

| Responsibility Type | Owner | Confidence | Notes |
|---|---|---|---|
| Feature ownership | `notifications` feature | HIGH | Clear |
| Engine ownership | `@notifications` (VCSM-initialized) | PARTIAL | No engine audit on file |
| DAL ownership (`notification.*` schema) | `@notifications` engine | HIGH | Engine-encapsulated |
| DAL ownership (`moderation.blocks` read) | `notifications` feature (consumer) | HIGH | Block feature is primary owner |
| Controller ownership | `notifications/inbox/controller/` | HIGH | Clear |
| UI ownership — inbox/ui/ views | UNASSIGNED | MEDIUM | Files confirmed active, no documented owner |
| UI ownership — types/ dispatch | UNASSIGNED | MEDIUM | 13 files confirmed; booking/comment/follow etc owned by which feature? |
| Runtime ownership | `notifications` feature | HIGH | Adapter + engine init |
| Data ownership — `notification.*` | `@notifications` engine | HIGH | Schema owned by engine |
| Security ownership — block filter | `notifications` feature | HIGH | VENOM verified |
| Migration ownership | CARNAGE (via DB + engine team) | MEDIUM | No recent migrations; schema stable |
| Native parity ownership | UNASSIGNED | LOW | FALCON review missing |
| Documentation ownership | LOGAN (`vcsm.dal.notifications.md`) | HIGH | Document exists; corrections pending |

---

## DATA OWNERSHIP REGISTRY

| Object | Primary Owner | Read Consumers | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|---|
| `notification.recipients` | `@notifications` engine | notifications feature | `@notifications` engine | Unknown (DB audit needed) | CARNAGE | LOGAN |
| `notification.inbox_items` | `@notifications` engine | notifications feature | `@notifications` engine | Unknown | CARNAGE | LOGAN |
| `notification.events` | `@notifications` engine | notifications feature | `@notifications` engine | Unknown | CARNAGE | LOGAN |
| `notification.rendered` | `@notifications` engine | notifications feature | `@notifications` engine | Unknown | CARNAGE | LOGAN |
| `moderation.blocks` | Moderation feature | notifications (READ consumer) | Moderation feature | Unknown | Moderation/CARNAGE | LOGAN |
| `vc.actors` | Identity feature | notifications (READ consumer) | Identity feature | Unknown | Identity/CARNAGE | LOGAN |
| `public.profiles` | Identity feature | notifications (READ consumer) | Identity feature | Unknown | Identity/CARNAGE | LOGAN |
| `vport.profiles` | Vport feature | notifications (READ consumer) | Vport feature | Unknown | Vport/CARNAGE | LOGAN |

**RLS flag:** RLS ownership for `notification.*` tables is undocumented. DB-level audit (via DB command or CARNAGE) required to verify policies before release.

---

## RULE OWNERSHIP REGISTRY

| Rule | Owner | Enforcement Layer | Docs | Risk |
|---|---|---|---|---|
| Block filter in inbox | `notifications` feature | Controller → lib → DAL | VENOM verified | LOW |
| Recipient scoping on read | `@notifications` engine | DAL — `recipientActorId` parameter | Inline code | LOW |
| Mark-seen authorization | `@notifications` engine | Engine + DAL | Inline code | LOW |
| Publish ACL (who can publish) | None documented | None — any caller via adapter can publish | MISSING | MEDIUM — open publish path |
| Sender identity surface | `notifications` feature | Sender resolution returns `actorId` + display fields only | Partial | LOW |

**OWNERSHIP BOUNDARY WARNING — Publish ACL:**  
There is no documented rule governing who can publish notifications. Any controller that imports `publishVcsmNotification` from the adapter can trigger a notification without ACL verification. The engine itself has no caller-identity enforcement. This is by design for the adapter pattern but means abuse prevention must be enforced at each call site. Documenting this as an explicit rule is recommended.

---

## RUNTIME OWNERSHIP MAP

| Runtime Flow | Entry Point | Owning Feature | Controllers | DALs | Hotspots |
|---|---|---|---|---|---|
| Inbox load | `NotificationsScreen` | notifications | `Notifications.controller.js` | blocks.read, senders.read, runtime (via engine) | resolveSenders waterfall |
| Badge count | `useNotiCount` → bootstrap | notifications | `notificationsCount.controller.js` | runtime (countUnread) | 60s polling |
| Notification publish | `notifications.adapter.js` | notifications (adapter surface) | (caller's controller) | runtime (publishEvent) | Serial delivery loop (KF-1) |
| Header mark-all-seen | `useNotificationsHeader` | notifications | `NotificationsHeader.controller.js` | runtime (markSeen) | None |

---

## OWNERSHIP BOUNDARY RISK

| Area | Risk | Reason | Recommended Clarification |
|---|---|---|---|
| `types/` dispatch — 13 files | MEDIUM | Type-specific views (booking, follow, etc.) have no explicit ownership — are these owned by notifications or by each domain feature? | Assign ownership decision: notifications owns type views as presentation logic, not domain logic |
| `inbox/ui/` layer — 3 files | MEDIUM | Active views not in architecture pipeline; ownership undocumented | Add to architecture pipeline; assign to notifications feature |
| Dead code cluster (5 files) | LOW | Confirmed dead; no deletion authority explicitly assigned | Assign SENTRY + user approval authority |
| `@notifications` engine audit | MEDIUM | Engine is consumed by VCSM; no engine audit version on file | Create `@notifications` engine audit before next major change |
| Publish ACL — open publish | MEDIUM | No rule governs who can publish; enforcement at each call site | Document as explicit rule in owner file; consider engine-level logging |
| RLS on `notification.*` | HIGH | RLS ownership unverified; policies exist but not documented | DB audit (DB command) required |

---

## ENGINE OWNERSHIP REVIEW

| Engine | Owner | Consumers | Public Interfaces | Boundary Risk |
|---|---|---|---|---|
| `@notifications` | `notifications` feature (initializer) | VCSM — all 15+ notification callers via adapter | `publishEvent`, `getInboxNotifications`, `countUnread`, `markSeen`, `markRead`, `dismiss`, `archive`, `configureNotificationsEngine`, `invalidateCountUnreadCache` | LOW — engine is properly encapsulated; no direct DAL imports from feature |
| `@hydration` | hydration feature | notifications (sender resolution) | `hydrateAndReturnSummaries` | LOW — consumed correctly via DAL |

---

## NATIVE PARITY OWNERSHIP

| Area | PWA Owner | Native Owner | Parity Doc | Risk |
|---|---|---|---|---|
| Inbox rendering | notifications feature | UNASSIGNED | MISSING | HIGH |
| Badge count | notifications + bootstrap | UNASSIGNED | MISSING | HIGH |
| Type dispatch (13+ views) | notifications feature | UNASSIGNED | MISSING | HIGH |
| Block filter in inbox | notifications feature | UNASSIGNED | MISSING | MEDIUM |
| Mark-seen / mark-read | notifications feature | UNASSIGNED | MISSING | MEDIUM |

**FALCON review required before next native release.**

---

## CROSS-ROOT OWNERSHIP REVIEW

| Area | Claimed Owner | Actual Root | Boundary Status | Notes |
|---|---|---|---|---|
| All notifications files | `apps/VCSM` | `apps/VCSM` | CLEAN | No cross-root contamination |
| `@notifications` engine (if it exists in engines/) | VCSM feature init | `apps/VCSM/src/features/notifications/runtime/` | NOTE | Engine runtime lives inside apps/VCSM — not in `engines/` directory |

**Note:** The `@notifications` engine appears to be implemented inside `apps/VCSM/src/features/notifications/runtime/` rather than in the `engines/` directory. This means it is VCSM-specific and not shared across apps. This is consistent with observed behavior but should be documented explicitly — the engine alias resolves within VCSM's module system.

---

## IRONMAN FINDINGS

**IRONMAN FINDING — IF-1**  
Finding ID: IF-1  
Feature: Notifications  
Application Scope: VCSM  
Responsibility Type: UI ownership  
Ownership Clarity: PARTIAL  
Boundary Risk: MEDIUM  
Severity: MEDIUM  
Current ambiguity: 13 type-specific view files in `types/booking/`, `types/comment/`, `types/follow/`, `types/mention/`, `types/reaction/`, `types/review/`, `types/team/` have no explicit ownership assignment. It is unclear whether these are owned by the notifications feature (as presentation logic) or by each respective domain feature (as domain-specific views).  
Risk: If booking feature team changes booking notification content, they must know to update `types/booking/` views. Without explicit ownership, these could drift.  
Recommended ownership clarification: Assign all `types/` views to the notifications feature as presentation logic. Each view accepts notification payload data but renders using the notification presentation contract — not the domain feature's own logic.  
Recommended handoff: Document in `vcsm.notifications.owner.md` and notify each domain team that type view changes require notifications feature review.

---

**IRONMAN FINDING — IF-2**  
Finding ID: IF-2  
Feature: Notifications  
Application Scope: VCSM  
Responsibility Type: Engine ownership  
Ownership Clarity: PARTIAL  
Boundary Risk: MEDIUM  
Severity: MEDIUM  
Current ambiguity: `@notifications` engine (implemented at `features/notifications/runtime/`) has no engine audit file. Public interfaces, boundary guarantees, and version history are undocumented. The engine is consumed at app startup and used by 15+ callers.  
Risk: Engine changes could break the adapter surface without documented interface guarantees.  
Recommended ownership clarification: Create `@notifications` engine audit v1 documenting public interfaces, initialization contract, and consumer expectations.  
Recommended handoff: LOGAN (create engine audit)

---

**IRONMAN FINDING — IF-3**  
Finding ID: IF-3  
Feature: Notifications  
Application Scope: VCSM  
Responsibility Type: Data ownership (RLS)  
Ownership Clarity: UNKNOWN  
Boundary Risk: HIGH  
Severity: HIGH  
Current ambiguity: RLS policies on `notification.recipients`, `notification.inbox_items`, `notification.events`, `notification.rendered` are not documented. Whether these policies correctly scope reads/writes to the authenticated recipient is unverified in this pass.  
Risk: If RLS is misconfigured, one actor could read another actor's notifications.  
Recommended ownership clarification: Run DB command to inspect RLS policies on `notification.*` tables. Document ownership in `vcsm.notifications.owner.md` and CARNAGE migration log.  
Recommended handoff: DB command

---

**IRONMAN FINDING — IF-4**  
Finding ID: IF-4  
Feature: Notifications  
Application Scope: VCSM  
Responsibility Type: Runtime ownership  
Ownership Clarity: PARTIAL  
Boundary Risk: LOW  
Severity: LOW  
Current ambiguity: `inbox/realtime/badgeSubscriptions.js` is a placeholder file (noops, never called) living in a `realtime/` subdirectory. Ownership of future realtime implementation is unassigned.  
Risk: Low while inert. If realtime is implemented without ownership clarity, it may introduce duplicate subscriptions or lifecycle issues.  
Recommended ownership clarification: Document `badgeSubscriptions.js` as notifications feature placeholder. If realtime is implemented, LOKI review required for subscription lifecycle.

---

## FINAL OWNERSHIP STATUS

**PARTIAL**

Primary ownership is clear for the adapter surface, engine integration, inbox controllers, and DAL layer. Gaps exist in:
- `types/` and `inbox/ui/` ownership assignment (IF-1)
- `@notifications` engine audit missing (IF-2)
- RLS ownership on `notification.*` tables unverified (IF-3)
- Native parity ownership unassigned (FALCON required)
- Dead code cluster deletion authority unassigned (SENTRY + user approval)

No CRITICAL ownership conflicts found. No cross-root violations.
