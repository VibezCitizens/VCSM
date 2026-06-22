# VENOM + SENTRY — VPORT Dashboard Calendar Card

**Date:** 2026-05-27
**Reviewer:** VENOM + SENTRY
**Ticket:** TICKET-0003 — VPORT Dashboard Card Logan Inventory (Phase 3, Step 5)
**Trigger:** VENOM security + SENTRY architecture compliance review for calendar card module
**Findings:** 0 CRITICAL | 0 HIGH | 2 MEDIUM | 2 LOW + 1 NEEDS_VERIFICATION (security); 2 architecture compliance findings

---

## VENOM TARGET

```
Feature / Route / Engine: VPORT Dashboard — Calendar Card (Working Hours / Availability)
Application Scope: VCSM
Reason for review: Module documented 2026-05-27; thin card delegating to booking engine; auto-bootstrap write path; conditional feed publishing
Primary trust boundary: useVportOwnership(viewerActorId, actorId) — screen-level gate; booking engine adapter gates
```

---

## SECURITY SURFACE

```
Entry point:        VportDashboardCalendarScreen.jsx (single combined screen)
Auth source:        useIdentity() → @/state/identity/identityContext
Authorization layer: Screen-level useVportOwnership + booking engine enabled guards
Identity surface:   actorId + kind (correct); identity.vportType also used for feed publish routing
Sensitive objects:  vport.resources (auto-bootstrap INSERT on first visit)
                    vport.availability_rules (working hours write path)
                    vc.posts (feed publish on availability save)
```

---

## TRUST BOUNDARY TRACE

```
Client input:       actorId from route params, viewerActorId from identity context
Validated at:       Screen level (useVportOwnership), engine adapter level (enabled guards)
Identity resolved at: useIdentity() → identity.actorId → viewerActorId
Authorization enforced at:
  - Screen: useVportOwnership(viewerActorId, actorId) — gates all hooks via enabled conditions
  - Engine: useOwnerBookingResources, useBookingAvailability — enabled: isOwner && ...
  - Engine: useEnsureOwnerBookingResource — gated by screen effect guard
  - DB: resources INSERT RLS via actor_owners (migration 20260515020000)
  - DB: availability_rules SELECT/INSERT/UPDATE/DELETE RLS (migration 20260515010000)
Data returned to:   VportDashboardCalendarScreen (owner-gated)
```

---

## CONFIRMED SECURE

| Path | Status | Evidence |
|---|---|---|
| Screen ownership gate | VERIFIED | `useVportOwnership(viewerActorId, actorId)` — early return for non-owners before any content renders |
| Hook `enabled` conditions | VERIFIED | `useOwnerBookingResources(enabled: isOwner && ...)`, `useBookingAvailability(enabled: Boolean(selectedResourceId) && isOwner)` — non-owners never trigger data fetches |
| Auto-bootstrap effect guard | VERIFIED | `if (!isOwner || !actorId || !viewerActorId) return;` in `useEffect` — three-way null guard |
| `didBootstrap.current` ref | VERIFIED | Prevents repeated `ensureOwnerResource` calls within the same `actorId` session |
| `vport.resources` RLS | VERIFIED | `resources_insert_owner` policy via `vc.actor_owners` (migration `20260515020000`) — DB rejects INSERT for non-owners |
| `vport.availability_rules` RLS | VERIFIED | Full policy set in migration `20260515010000` |
| Error message redaction | VERIFIED | `DEV ? error.message : "Calendar settings are unavailable"` — production errors are non-informative |
| `index.js` boundary | VERIFIED | Only exports the screen component — no controllers, hooks, or DALs exported |

---

## VENOM SECURITY FINDING — VENOM-CAL-001

```
Location: cards/calendar/VportDashboardCalendarScreen.jsx — combined Final + View Screen
Application Scope: VCSM
```

**Current behavior:** `VportDashboardCalendarScreen` combines:
1. Identity loading + ownership gating (`useIdentity`, `useVportOwnership`)
2. Hook wiring (`useOwnerBookingResources`, `useBookingAvailability`, `useManageAvailability`, `useEnsureOwnerBookingResource`)
3. State management (`selectedResourceId`, `rangeAnchor`, `shareToFeed`)
4. Component composition (`WeeklyAvailabilityGrid`, `ResourceDropdown`)
5. Portal rendering for desktop

Per the architecture contract, Final Screen handles only identity gates, and View Screen handles hooks + composition.

**Mitigation from prior analysis:** The hooks are correctly conditioned on `isOwner` via `enabled` guards. The early return `if (!isOwner) return ...` is in place. The functional security is correct — non-owners are rejected before any booking engine work fires.

**Risk:** Architecture non-compliance and defense regression risk. The combined structure means a future change to the component could inadvertently remove `enabled` guards or the early return, removing all protection without a second gate.

**Severity:** MEDIUM (architecture — security impact if degraded)

**Exploitability:** LOW (no current exploit; hooks are correctly conditioned)

**Blast Radius:** Single VPORT — one actor's availability data.

**Recommended mitigation:**
Split into:
- `VportCalendarFinalScreen` — route params + `useVportOwnership` + loading/gate states
- `VportCalendarScreen` — receives `actorId`, `viewerActorId`, `isOwner`; all hooks and composition

**Follow-up command:** SENTRY (architecture compliance)

**CISSP Domain:**
- Primary: Security Architecture and Engineering
- Secondary: Software Development Security

---

## VENOM SECURITY FINDING — VENOM-CAL-002

```
Location: cards/calendar/VportDashboardCalendarScreen.jsx — lines 63-66 (vportType for feed routing)
Application Scope: VCSM
```

**Current behavior:**
```javascript
const isBarbershop = ["barbershop", "barber"].includes(
  String(identity?.vportType ?? "").toLowerCase()
);
const isLocksmith = String(identity?.vportType ?? "").toLowerCase() === "locksmith";
```

`identity?.vportType` is used to determine which feed publisher to call after saving availability. `vportType` is not part of the canonical identity surface (`actorId` + `kind`). If `identity.vportType` is stale (from a prior VPORT context after an identity switch), the wrong feed publisher could be called — posting barbershop hours when the current actor is a locksmith, or vice versa.

**Risk:**
1. Wrong feed publisher called if `identity.vportType` is stale.
2. The `blocks` content from `WeeklyAvailabilityGrid` is passed directly to the publisher — if the publisher expects a type-specific schema and receives wrong content, the post may be malformed.

**Severity:** MEDIUM (identity surface non-compliance + feed contamination risk)

**Exploitability:** LOW (requires stale identity state — typically only on actor switch)

**Blast Radius:** Feed contamination — incorrect working hours post published to feed with wrong type.

**Why it matters:** Feed posts are public social content. Publishing incorrect type-content confuses followers and may expose format inconsistencies.

**Recommended mitigation:**
Replace `identity?.vportType` with the VPORT's `kind` field from the DB (already available as part of the VPORT actor identity loaded during the dashboard). The `kind` field is part of the canonical identity contract; `vportType` is not.

**Follow-up command:** SENTRY (identity surface compliance: replace vportType with kind)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Software Development Security

---

## VENOM SECURITY FINDING — VENOM-CAL-003

```
Location: cards/calendar/VportDashboardCalendarScreen.jsx — handleSaveSuccess → publishBarbershopHoursPost / publishLocksmithHoursPost
Application Scope: VCSM
```

**Current behavior:**
```javascript
const handleSaveSuccess = useCallback(
  async ({ blocks }) => {
    if (!shareToFeed) return;
    if (isBarbershop) {
      await publishBarbershopHoursPost({ blocks });
    } else if (isLocksmith) {
      await publishLocksmithHoursPost({ blocks });
    }
  }, [...]
);
```

The `blocks` value comes from `WeeklyAvailabilityGrid.onSaveSuccess`. This value is passed directly to the feed publisher with no validation or sanitization. The shape of `blocks` has not been inspected as part of this audit.

**Risk:** If `blocks` contains fields beyond working-hours data (e.g., resource IDs, internal booking data, error state flags), those fields could be published into the social feed. The `publishBarbershopHoursPost` and `publishLocksmithHoursPost` functions are responsible for shaping the post content — but they receive the raw `blocks` value, and their handling of unexpected fields is unverified.

**Severity:** LOW / NEEDS_VERIFICATION (content contamination risk — no privilege escalation)

**Exploitability:** LOW (requires `blocks` to contain unintended data — depends on `WeeklyAvailabilityGrid` implementation)

**Blast Radius:** Feed post — one post per save action, for barbershop/locksmith VPORTs only, when `shareToFeed` is checked.

**Recommended mitigation:**
Read `WeeklyAvailabilityGrid.onSaveSuccess` callback to confirm `blocks` shape. Verify `publishBarbershopHoursPost` and `publishLocksmithHoursPost` validate or whitelist fields before constructing the post content.

**Follow-up command:** VENOM (follow-up: read WeeklyAvailabilityGrid to verify blocks shape)

**CISSP Domain:**
- Primary: Asset Security
- Secondary: Communication and Network Security

---

## VENOM SECURITY FINDING — VENOM-CAL-004

```
Location: cards/calendar/VportDashboardCalendarScreen.jsx — useEnsureOwnerBookingResource call
          @/features/booking/adapters/booking.adapter → ensureOwnerResource controller
Application Scope: VCSM + ENGINE
```

**Current behavior:**
```javascript
const res = await ensureOwnerResource({ requestActorId: viewerActorId, ownerActorId: actorId, timezone: tz });
```

The booking engine's `useEnsureOwnerBookingResource` hook is called with `requestActorId: viewerActorId` and `ownerActorId: actorId`. The screen already verified `isOwner === true` before this effect fires. However, the internal ownership verification inside the booking engine controller has not been directly traced in this audit pass.

**What IS verified:**
- `vport.resources INSERT` RLS policy enforces `vc.actor_owners WHERE actor_id = owner_actor_id AND user_id = auth.uid()` — if the controller inserts with the correct `owner_actor_id`, RLS provides DB-layer enforcement regardless of controller logic

**What is NEEDS_VERIFICATION:**
- Whether `ensureOwnerResource` controller itself calls `assertActorOwnsVportActorController` before the INSERT
- Whether `owner_actor_id` in the new resource row is set to `actorId` (not `viewerActorId`)

**Risk:** If the controller does not verify ownership AND sets `owner_actor_id` to a caller-controlled value, the RLS INSERT check (`actor_id = owner_actor_id`) would succeed for any authenticated user — but only if they pass `ownerActorId = their own actorId`. Since `actorId` comes from route params (not from the caller's own actor), this path is not exploitable from the UI under normal conditions. The screen's `isOwner` check gates the effect.

**Severity:** LOW (screen gate + RLS provide two enforcement layers; controller path not verified)

**Exploitability:** LOW (three conditions must align: screen gate bypassed, controller has no ownership check, attacker knows valid actorId)

**Blast Radius:** Single resource — one booking resource created for wrong VPORT.

**Recommended mitigation:**
Verify that `ensureOwnerResource` controller calls `assertActorOwnsVportActorController` before any INSERT. If it does, CALENDAR-FIND-002 is RESOLVED. If it does not, add the ownership check to the engine controller.

**Follow-up command:** VENOM (follow-up: trace booking engine ensureOwnerResource controller)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Security Architecture and Engineering

---

## SENTRY ARCHITECTURE COMPLIANCE

### SENTRY-CAL-001 — No Final/View Screen Split

**Contract reference:** `ARCHITECTURE.md` — Screen Role Boundaries
**Severity:** HIGH (architecture non-compliance)

`VportDashboardCalendarScreen` violates the architecture contract by mixing:
- Final Screen responsibilities (identity loading, ownership gate, early returns)
- View Screen responsibilities (hook wiring, state, component composition)
- Portal rendering

**Current state:** Single 211-line file handling all responsibilities.
**Required state:** `VportCalendarFinalScreen` (identity gate only) + `VportCalendarScreen` (hook wiring + composition).

**Note:** The hooks are `enabled`-conditioned, so there is no active security regression. The SENTRY concern is architecture drift and future regression risk.

### SENTRY-CAL-002 — `identity?.vportType` Outside Canonical Identity Surface

**Contract reference:** `ARCHITECTURE.md` — Identity section: "The canonical identity fields are `actorId` and `kind`"
**Severity:** LOW

`identity?.vportType` is not part of the canonical identity surface. The correct field for VPORT kind classification is `kind` from `vc.actors`. Using `vportType` from the identity context creates:
- Dependency on a non-canonical field
- Risk of stale data after actor switch (see VENOM-CAL-002)

---

## MITIGATION PLAN SUMMARY

| Finding | Severity | Type | Layer to Fix | Follow-up |
|---|---|---|---|---|
| VENOM-CAL-001 | MEDIUM | Security + Architecture | Screen (add Final Screen) | SENTRY |
| VENOM-CAL-002 | MEDIUM | Security + Architecture | Screen (replace vportType with kind) | SENTRY |
| VENOM-CAL-003 | LOW / NV | Security | Trace (verify blocks shape) | VENOM (follow-up) |
| VENOM-CAL-004 | LOW / NV | Security | Trace (verify engine controller gate) | VENOM (follow-up) |
| SENTRY-CAL-001 | HIGH | Architecture | Screen split | SENTRY |
| SENTRY-CAL-002 | LOW | Architecture | Identity surface | SENTRY |

---

## RESOLVED PRELIMINARY FINDINGS

| Preliminary ID | Resolution |
|---|---|
| CALENDAR-FIND-001 | Confirmed as VENOM-CAL-001 + SENTRY-CAL-001 (architecture non-compliance, MEDIUM/HIGH). Hooks correctly conditioned on `isOwner` — no active security regression. |
| CALENDAR-FIND-002 | Partially confirmed as VENOM-CAL-004 (LOW — RLS provides DB-layer enforcement; controller ownership not directly traced). |
| CALENDAR-FIND-003 | Confirmed as VENOM-CAL-003 (LOW/NEEDS_VERIFICATION — blocks shape not verified). |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 0 | No policy-level risks; screen + RLS gates are in place |
| Asset Security | 1 | VENOM-CAL-003 — unverified `blocks` content in feed post |
| Security Architecture and Engineering | 2 | VENOM-CAL-001 (primary), VENOM-CAL-004 (secondary) |
| Communication and Network Security | 1 | VENOM-CAL-003 (secondary) — feed post as external-visible communication |
| Identity and Access Management | 2 | VENOM-CAL-002 (primary), VENOM-CAL-004 (primary) |
| Security Assessment and Testing | 0 | No test files; SPIDER-MAN follow-up queued |
| Security Operations | 0 | No logging risks identified |
| Software Development Security | 2 | VENOM-CAL-001 (secondary), VENOM-CAL-002 (secondary) |

**Uncovered domains:**
- **Security Assessment and Testing** — no test files found; already queued for SPIDER-MAN from CALENDAR-FIND-002 tracking
- **Security Operations** — no findings; error messages are correctly redacted in production

**VENOM/SENTRY completion status:** COMPLETE — all security and architecture findings classified. Two NEEDS_VERIFICATION items remain (VENOM-CAL-003 + VENOM-CAL-004) requiring follow-up trace of `WeeklyAvailabilityGrid.onSaveSuccess` and `ensureOwnerResource` controller.
