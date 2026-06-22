# TOXIN SECURITY REPORT — features/shell/modules/bottom-bar

## Output Metadata

| Field | Value |
|---|---|
| Command | TOXIN |
| Scope | `apps/VCSM/src/features/shell/modules/bottom-bar/` |
| Application Scope | VCSM |
| Mode | Full targeted review (sub-files 1–8, source-verified) |
| TONYSTARK Surface Consumed | YES — `outputs/2026/06/06/TONYSTARK/evidence-bundle.md` |
| Run Date | 2026-06-06 |
| Status | COMPLETE |
| Verdict | CAUTION |

---

## Mission

Security architecture review of the newly relocated `bottom-bar` shell module. Scope includes:
- Trust boundary verification of all identity and authorization paths
- Source-to-sink tracing for authentication credentials and sensitive data
- Verification of VEN-BN-005 patch status (three files patched since TONYSTARK run)
- New threat discovery beyond TONYSTARK surface output
- CISSP domain classification of all findings

---

## Boundary Contract Declarations

| Contract | Loaded | Enforced |
|---|---|---|
| `.claude/contracts/boundary.md` | YES | YES |
| `.claude/contracts/blue-team-verification-contract.md` | YES | YES |
| `.claude/contracts/red-vs-blue-security-warfare-contract.md` | YES | YES |

Application Scope: **VCSM**
Cross-root risk: NOT APPLICABLE — module is self-contained within `apps/VCSM/src/`
Code modification: NONE — read-only analysis

---

## Source Files Read (TOXIN Direct Verification)

| File | Purpose | Read |
|---|---|---|
| `components/BottomNavBar.jsx` | Primary nav component | YES |
| `components/VportLeadsChip.jsx` | Leads badge component | YES (post-patch state) |
| `hooks/useVportLeadsCount.js` | Leads polling hook | YES (post-patch state) |
| `hooks/useBottomNavVisibility.js` | Route visibility | YES |
| `constants/bottomBar.constants.js` | POLL_MS | YES |
| `app/layout/RootLayout.jsx` | Module consumer / mount owner | YES (post-patch state) |
| `bootstrap/bootstrap.hydrate.controller.js` | noti:refresh listener owner | YES |
| `bootstrap/bootstrap.selectors.js` | Badge polling via React Query | YES |
| `features/identity/adapters/identity.adapter.js` | Identity adapter surface | YES |
| `state/identity/identityContext.jsx` | Raw context (re-export target) | YES |
| `features/profiles/controller/buildActorCanonicalSlug.controller.js` | Slug controller | YES |
| `features/dashboard/.../controller/vportLeads.controller.js` | Leads count controller | YES |
| `features/booking/controller/assertActorOwnsVportActor.controller.js` | Ownership gate | YES |
| `services/onesignal/onesignalClient.js` | OneSignal SDK wrapper | YES |
| `services/onesignal/initOneSignal.js` | SDK initialization | YES |
| `shared/hooks/useOneSignalPush.js` | OneSignal React hook | YES |

---

## Critical Discovery: Three Files Patched Since TONYSTARK Run

The following files were modified between the TONYSTARK scan and this TOXIN run:

| File | Change |
|---|---|
| `VportLeadsChip.jsx` | `identityContext` → `identity.adapter` (VEN-BN-005 fix) |
| `useVportLeadsCount.js` | `identityContext` → `identity.adapter` (VEN-BN-005 fix) |
| `RootLayout.jsx` | `identityContext` → `identity.adapter` + VportLeadsChip always-mounted |

> **Note on adapter surface:** `identity.adapter.js` re-exports `useIdentity` directly from `identityContext` — the security surface is functionally identical. However, the adapter boundary contract is now formally satisfied. The fix closes the architecture violation; no functional security delta exists.

> **Note on RootLayout mount change:** VportLeadsChip is now always-mounted with `display:none` (same pattern as BottomNavBar). This is a behavioral change — the polling interval now persists across all routes including auth routes. The null-actorId guard in `useVportLeadsCount` prevents DB calls when identity is absent. No security impact, documented below.

---

## Trust Boundary Map

```
[Browser / Client Side]
  │
  ├── BottomNavBar.jsx
  │     ├── useIdentity()              ← identity.adapter [correct adapter]
  │     ├── useBootstrapHydration()    ← bootstrap.hydrate.controller [correct]
  │     ├── useNotificationUnread()    ← bootstrap.selectors → React Query [correct]
  │     ├── useChatUnread()            ← bootstrap.selectors → React Query [correct]
  │     ├── useOneSignalPush()         ← shared/hooks → onesignalClient [see TOXIN-BB-001]
  │     └── getCachedActorCanonicalSlug() ← profiles CONTROLLER direct [BOUNDARY VIOLATION]
  │
  ├── VportLeadsChip.jsx (PATCHED)
  │     ├── useIdentity()              ← identity.adapter [now correct]
  │     ├── useVportLeadsCount()       ← same module hook [correct]
  │     └── navigate(/actor/{UUID}/dashboard/leads)  [ELEK-002 OPEN — UUID in URL]
  │
  └── useVportLeadsCount.js (PATCHED)
        ├── useIdentity()              ← identity.adapter [now correct]
        ├── countNewVportLeadsController()   ← dashboard controller direct [BOUNDARY VIOLATION]
        │     └── assertActorOwnsVportActorController()  [DB ownership gate — CORRECT]
        └── fastCountNewVportLeadsController()  [same controller, same gate]

[DB Authorization Layer]
  └── RLS on vport.business_card_leads + identity.actor_owners
```

---

## CISSP Domain Mapping

| CISSP Domain | Finding(s) | Coverage |
|---|---|---|
| 1 — Security & Risk Management | TOXIN-BB-003 (event surface) | Partial |
| 2 — Asset Security | TOXIN-BB-002 (UUID in URL), actor leads count exposure | Covered |
| 3 — Security Architecture & Engineering | TOXIN-BB-ARCH-001, TOXIN-BB-ARCH-002 | Covered |
| 4 — Communication & Network Security | N/A — client-side component, no direct network calls | Not applicable |
| 5 — Identity & Access Management | VEN-BN-005 (CLOSED), TOXIN-BB-001, TOXIN-BB-004 | Covered |
| 6 — Security Assessment & Testing | Out of scope (SPIDER-MAN domain) | Not covered |
| 7 — Security Operations | TOXIN-BB-001 (OneSignal), TOXIN-BB-003 (DOM events) | Covered |
| 8 — Software Development Security | TOXIN-BB-002, TOXIN-BB-ARCH-001, TOXIN-BB-ARCH-002 | Covered |

**Uncovered domains:** 4, 6

---

## Findings

---

### TOXIN-BB-001 — OneSignal SDK Reference: Partial Freeze, Residual Race Window

**Status:** STILL_OPEN_SOURCE_VERIFIED (partial mitigation confirmed)
**Severity:** MEDIUM
**CISSP Domains:** 5 (IAM), 7 (Security Operations)
**Source File:** `services/onesignal/onesignalClient.js`

**Chain:**
```
BottomNavBar
  └── useOneSignalPush()
        └── loginOneSignalExternalUser(user.id)
              └── os() → _frozenSdk || window.OneSignal
                    └── sdk.login(externalId)   ← externalId = user.id (Supabase auth UUID)
```

**Finding:**

`onesignalClient.js` implements a lazy-freeze pattern via `_frozenSdk`:
```js
let _frozenSdk = null
function os() {
  if (_frozenSdk) return _frozenSdk
  const sdk = window.OneSignal ?? null
  if (sdk) _frozenSdk = sdk
  return sdk
}
```

After the first successful `os()` call, the frozen reference is used for all subsequent calls — this is a meaningful mitigation. If XSS replaces `window.OneSignal` AFTER the first call, the frozen SDK is already bound and the replacement is ignored.

**Residual attack window:** XSS that executes BEFORE the first `loginOneSignalExternalUser()` call (i.e., before `_frozenSdk` is populated) can:
1. Set `window.OneSignal = maliciousObject` with a `.login()` method
2. The subsequent `loginOneSignalExternalUser(user.id)` calls `os()` → captures malicious object as `_frozenSdk`
3. `await sdk.login(user.id)` executes on attacker's object
4. Exfiltration target: `user.id` (Supabase auth UUID — not actorId; used for cross-actor stable push targeting)

**Blast radius:** Requires XSS already present. The Supabase auth UUID alone is not sufficient for API access (JWT required separately). However, the UUID can assist account enumeration or correlation attacks.

**Mitigation (text only):**
```js
// In initOneSignal.js, after SDK init callback:
window.OneSignalDeferred.push(async function (OneSignal) {
  await OneSignal.init({...})
  // Freeze the reference after successful init
  try { Object.defineProperty(window, 'OneSignal', { writable: false, configurable: false }) } catch {}
})
```

Alternatively, call `initOneSignal()` before any `loginOneSignalExternalUser()` trigger, ensuring `_frozenSdk` is populated with the real SDK before identity hydration completes.

---

### TOXIN-BB-002 — Raw actorId UUID in VportLeadsChip Navigation URL

**Status:** STILL_OPEN_SOURCE_VERIFIED
**Severity:** LOW
**CISSP Domain:** 2 (Asset Security)
**Source File:** `components/VportLeadsChip.jsx`

**Chain:**
```
VportLeadsChip.jsx
  └── const actorId = isVport ? identity?.actorId : null
  └── const leadsPath = actorId ? `/actor/${actorId}/dashboard/leads` : null
  └── onClick → navigate(leadsPath)
```

**Finding:**

The leads navigation URL contains the raw UUID actorId. This UUID appears in:
- The browser address bar (visible to shoulder-surfing)
- Browser history
- Referrer headers on outbound navigations from that page
- Any analytics or error-monitoring tools capturing the current URL

**Authorization impact:** NONE — the leads dashboard route enforces its own ownership checks. The UUID alone grants no access.

**Information disclosure:** The actorId is the vport actor's identifier. Leaking this UUID enables:
- Actor enumeration attacks (if combined with other surfaces)
- Cross-referencing the vport actor across platform APIs

**Mitigation (text only):** Replace the raw UUID path with the canonical slug via `getCachedActorCanonicalSlug()` and route to `/profile/{slug}/dashboard/leads` or an equivalent slug-based path. Alternatively, resolve the dashboard route server-side from the authenticated session without requiring the actorId in the URL.

---

### TOXIN-BB-003 — noti:refresh Platform DOM Event — Any-Origin Dispatch

**Status:** STILL_OPEN_SOURCE_VERIFIED
**Severity:** LOW
**CISSP Domains:** 1 (Risk Management), 7 (Security Operations)
**Source Files:** `components/BottomNavBar.jsx`, `bootstrap/bootstrap.hydrate.controller.js`

**Chain:**
```
BottomNavBar.jsx (dispatch, guarded)
  └── useEffect [location.pathname]
        └── if (path.startsWith('/notifications') || path.startsWith('/chat'))
              └── window.dispatchEvent(new Event('noti:refresh'))

bootstrap.hydrate.controller.js (listener)
  └── window.addEventListener('noti:refresh', onGlobalRefresh)
        └── queryClient.invalidateQueries({ notificationUnread, chatUnread })
```

**Finding:**

`noti:refresh` is a platform-wide DOM event with no origin restriction. Any code running in the same browser context (third-party scripts, injected code, browser extensions) can dispatch `noti:refresh` at will, triggering React Query cache invalidations.

**Impact assessment:**
- The handler only invalidates query caches — it does not expose data or trigger writes
- Badge counts refresh from the server via authenticated React Query calls — no unauthorized data flows
- Under XSS: an attacker can trigger continuous badge refreshes, creating unnecessary DB polling load
- BottomNavBar's own dispatch is correctly guarded by the pathname check

**Blast radius:** LOW — maximum impact is React Query polling overhead. No data leakage. The server-side RLS enforces authorization on every query regardless of how the invalidation was triggered.

**Mitigation (text only):** If this becomes a concern, use `CustomEvent` with a namespaced `detail` payload that includes a HMAC or nonce derived from the session. The listener validates the nonce before invalidating. This is defensive-in-depth for a low-severity surface.

---

### TOXIN-BB-004 — Actor-Switch Stale Count Race in useVportLeadsCount

**Status:** NEW_FINDING_CREATED
**Severity:** LOW
**CISSP Domain:** 3 (Security Architecture), 5 (IAM)
**Source File:** `hooks/useVportLeadsCount.js`

**Chain:**
```
useVportLeadsCount(actorId)
  ├── profileIdRef.current = null (initial)
  ├── refresh() → countNewVportLeadsController(actorId, callerActorId)
  │     └── profileIdRef.current = result.resolvedProfileId   ← set to Actor A's profile
  └── [actorId changes: Actor A → Actor B]
        ├── New refresh() callback created (actorId is dep)
        ├── In-flight old refresh() completes → setCount(Actor A count)   ← stale write
        ├── pollRefresh still holds old closure briefly
        └── profileIdRef.current = Actor A's profileId (stale)
              └── fastCountNewVportLeadsController(newActorId, newCallerActorId, actorAProfileId)
                    └── assertActorOwnsVportActorController(newCallerActorId, newActorId)
                          → DB ownership check: does new caller own Actor B? Likely YES (correct)
                          → readNewLeadsCountByProfileDAL(actorAProfileId) ← WRONG profileId
                          → Count for Actor A's profile is returned to Actor B's session
```

**Finding:**

When a user switches personas (e.g., from personal profile to a different vport), `profileIdRef.current` holds the previous actor's `profileId`. On the first `pollRefresh` after the switch, before `refresh()` has completed with the new actor's data:
- `fastCountNewVportLeadsController` is called with `actorId` (new) + `callerActorId` (new) + `profileId` (old Actor A's profile)
- The ownership assertion verifies the NEW caller owns the NEW actor — this passes if the switch is valid
- But `readNewLeadsCountByProfileDAL` is called with the OLD profileId → wrong count

**Impact:** Momentary display of Actor A's lead count while on Actor B's session. Corrects on next `refresh()` completion. No persistent state corruption; no auth bypass; no PII exposure (count only).

**Mitigation (text only):** Clear `profileIdRef.current = null` when `actorId` changes, before the new `refresh()` fires. This prevents `fastCountNewVportLeadsController` from using a stale profileId:
```js
const prevActorIdRef = useRef(null)
useEffect(() => {
  if (prevActorIdRef.current !== actorId) {
    profileIdRef.current = null  // clear stale ref on actor change
    prevActorIdRef.current = actorId
  }
}, [actorId])
```

---

### TOXIN-BB-005 — VportLeadsChip Always-Mount: Polling Active on Auth Routes

**Status:** NEW_FINDING_CREATED
**Severity:** INFO
**CISSP Domain:** 1 (Risk Management)
**Source Files:** `app/layout/RootLayout.jsx`, `hooks/useVportLeadsCount.js`

**Finding:**

Post-patch, VportLeadsChip is now always-mounted (CSS display:none). The 60-second polling interval in `useVportLeadsCount` is active across all routes, including auth routes (`/login`, `/register`, etc.).

**Guard verification (source-confirmed):**
```js
const refresh = useCallback(async () => {
  if (!actorId || !callerActorId) {
    setCount(0)
    return   // ← correct guard: no DB call when identity is absent
  }
  ...
}, [actorId, callerActorId])
```

On auth routes, `identity` is null → `actorId = null` → guard fires → `setCount(0)` → no DB call.

**Security impact:** NONE — the null-identity guard correctly prevents DB access. The polling interval itself (`setInterval`) runs but each tick is a no-op.

**Note:** This is a behavioral change from the TONYSTARK scan state. The prior BEHAVIOR.md documented VportLeadsChip as conditionally mounted. The governance doc should be updated to reflect always-mount.

---

### VEN-BN-005 — Identity Adapter Bypass

**Status:** CLOSED_SOURCE_VERIFIED
**Prior Severity:** LOW
**CISSP Domain:** 5 (IAM)

**Verification:**
- `VportLeadsChip.jsx` — import changed to `@/features/identity/adapters/identity.adapter` ✓
- `useVportLeadsCount.js` — import changed to `@/features/identity/adapters/identity.adapter` ✓
- `RootLayout.jsx` — import changed to `@/features/identity/adapters/identity.adapter` ✓

**Adapter surface note (source-verified):** `identity.adapter.js` re-exports `useIdentity` from `identityContext` directly:
```js
export { useIdentity, IdentityProvider } from '@/state/identity/identityContext'
```

The adapter is a pass-through re-export. There is no functional security difference between the two import paths. The closing of VEN-BN-005 satisfies the architecture boundary contract, not a functional security change.

**Status: CLOSED_SOURCE_VERIFIED**

---

### TOXIN-BB-ARCH-001 — Profiles Controller Direct Import (Architecture)

**Status:** STILL_OPEN_SOURCE_VERIFIED
**Severity:** CRITICAL (architecture) / LOW (security)
**CISSP Domain:** 3 (Security Architecture), 8 (Software Development Security)
**Source File:** `components/BottomNavBar.jsx`

**Finding:**
```js
import { getCachedActorCanonicalSlug } from
  '@/features/profiles/controller/buildActorCanonicalSlug.controller'
```

BottomNavBar bypasses the profiles feature adapter (`profiles.adapter.js`) and imports directly from an internal controller. This is a hard boundary violation per the VCSM architecture contract.

**Security analysis:** `getCachedActorCanonicalSlug()` is a client-side TTL cache lookup returning a slug string. No auth escalation, no data exposure. If XSS poisoned the cache, the user would navigate to a wrong profile URL — a UX issue, not a security breach.

**Architecture severity: CRITICAL** — this pattern, if normalized, allows features to bypass adapter contracts and create hidden coupling chains. The profiles adapter does not re-export `getCachedActorCanonicalSlug`.

**Mitigation (text only):** Add `getCachedActorCanonicalSlug` (or an equivalent async-safe variant) to `features/profiles/adapters/profiles.adapter.js`, then update the BottomNavBar import.

---

### TOXIN-BB-ARCH-002 — Dashboard Controller Direct Import (Architecture)

**Status:** STILL_OPEN_SOURCE_VERIFIED
**Severity:** MEDIUM (architecture) / LOW (security)
**CISSP Domain:** 3 (Security Architecture)
**Source File:** `hooks/useVportLeadsCount.js`

**Finding:**
```js
import { countNewVportLeadsController, fastCountNewVportLeadsController }
  from '@/features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller'
```

The bottom-bar module imports internal controller functions from the dashboard feature — a feature-to-feature internal coupling.

**Authorization analysis:** The imported controllers internally call `assertActorOwnsVportActorController()` — the DB-backed ownership gate. Security enforcement is correct regardless of call site. The boundary violation is an architecture concern, not an authorization bypass.

**Mitigation (text only):** Expose `countNewVportLeads` and `fastCountNewVportLeads` via the dashboard feature's adapter (or a dedicated `leads.adapter.js`), then update useVportLeadsCount to import via that adapter.

---

## Finding Summary

| ID | Severity | Type | Status | File |
|---|---|---|---|---|
| TOXIN-BB-001 | MEDIUM | Security | STILL_OPEN — partial freeze mitigates post-first-call | `onesignalClient.js` |
| TOXIN-BB-002 | LOW | Security | STILL_OPEN_SOURCE_VERIFIED | `VportLeadsChip.jsx` |
| TOXIN-BB-003 | LOW | Security | STILL_OPEN_SOURCE_VERIFIED | `BottomNavBar.jsx` |
| TOXIN-BB-004 | LOW | Security | NEW_FINDING_CREATED | `useVportLeadsCount.js` |
| TOXIN-BB-005 | INFO | Behavioral | NEW_FINDING_CREATED — no security impact | `RootLayout.jsx` |
| VEN-BN-005 | LOW | Security | CLOSED_SOURCE_VERIFIED | 3 files |
| TOXIN-BB-ARCH-001 | CRITICAL(arch)/LOW(sec) | Architecture | STILL_OPEN_SOURCE_VERIFIED | `BottomNavBar.jsx` |
| TOXIN-BB-ARCH-002 | MEDIUM(arch)/LOW(sec) | Architecture | STILL_OPEN_SOURCE_VERIFIED | `useVportLeadsCount.js` |

---

## Severity Counts

| Severity | Count |
|---|---|
| CRITICAL (arch) | 1 |
| MEDIUM | 2 |
| LOW | 4 |
| INFO | 1 |
| CLOSED | 1 |

---

## Authorization Verification Summary

| Surface | Authorization Gate | Layer | Verdict |
|---|---|---|---|
| Badge notification count | React Query → notifications.adapter → RLS | Adapter + DB | PASS |
| Badge chat count | React Query → chat.adapter → RLS | Adapter + DB | PASS |
| Leads count read | `assertActorOwnsVportActorController` → `actor_owners` DB query | Controller + DB | PASS |
| Profile slug navigation | Client-side cache lookup only (no auth) | Client | PASS — read-only |
| VportLeadsChip visibility | Client-side `isVport` check (cosmetic gate) | Client | PASS — server-enforced independently |
| Leads page navigation | Server-enforced on arrival at dashboard route | Server | PASS |

No authorization bypass paths were found. All data reads are gated at the server layer via RLS or the `assertActorOwnsVportActorController` ownership gate.

---

## Identity Verification Summary

| Surface | Identity Source | Adapter Boundary | Verdict |
|---|---|---|---|
| BottomNavBar | `identity.adapter` | CORRECT | PASS |
| VportLeadsChip | `identity.adapter` (post-patch) | CORRECT | PASS |
| useVportLeadsCount | `identity.adapter` (post-patch) | CORRECT | PASS |
| RootLayout | `identity.adapter` (post-patch) | CORRECT | PASS |
| useOneSignalPush | `identity.adapter` | CORRECT | PASS |

VEN-BN-005 is fully closed across all three affected files.

---

## BEHAVIOR.md Cross-Check

| Behavioral Invariant | Source State | Status |
|---|---|---|
| BottomNavBar always-mounted via CSS | VERIFIED — `div style={hideBottomNav ? { display: 'none' } : ...}` | PASS |
| VportLeadsChip mount pattern | CHANGED — now always-mounted (was conditional). BEHAVIOR.md §2 needs update | STALE DOC |
| noti:refresh dispatch guard | VERIFIED — pathname check before dispatch | PASS |
| Leads count poll 60s | VERIFIED — `POLL_MS = 60_000` from constants | PASS |
| No raw UUID in profile navigation | PASS — slug cache + /profile/self fallback | PASS |
| Raw UUID in leads navigation | FAIL — ELEK-002/TOXIN-BB-002 still open | OPEN |

**BEHAVIOR.md §2 is stale:** Documents VportLeadsChip as "Conditionally mounted" — now always-mounted.

---

## Recommended Mitigations (Priority Order)

| Priority | Finding | Action |
|---|---|---|
| P1 | TOXIN-BB-ARCH-001 | Add `getCachedActorCanonicalSlug` to `profiles.adapter.js`; update BottomNavBar import |
| P2 | TOXIN-BB-001 | Freeze `window.OneSignal` after SDK init in `initOneSignal.js` |
| P3 | TOXIN-BB-002 | Replace raw UUID in VportLeadsChip nav path with slug-based route |
| P4 | TOXIN-BB-ARCH-002 | Expose leads count functions via a dashboard or leads adapter |
| P5 | TOXIN-BB-004 | Clear `profileIdRef.current` on actorId change |
| P6 | TOXIN-BB-005 | Update BEHAVIOR.md §2 to reflect always-mount pattern |
| INFO | TOXIN-BB-003 | Monitor noti:refresh dispatch scope; low priority |

---

## Downstream Routing

| Command | Reason | Priority |
|---|---|---|
| THANOS | Adversarial verification of TOXIN-BB-001 race window and TOXIN-BB-004 actor-switch chain | HIGH |
| TASKMASTER | Code scan for additional direct controller imports across the shell module tree | MEDIUM |
| SPIDER-MAN | Regression tests for VEN-BN-005 closure and VportLeadsChip always-mount behavior | MEDIUM |
| CARNAGE | N/A — no migration or schema work identified | — |
| DB | RLS verification on `vport.business_card_leads` for the leads count query path | LOW |

---

## TOXIN Verdict

**CAUTION**

One CRITICAL architecture violation open (CONTRACT-CRIT-001 / TOXIN-BB-ARCH-001). No critical security vulnerabilities found. Three security findings are active (MEDIUM, LOW, LOW). VEN-BN-005 is CLOSED. Authorization gates are correctly enforced at the DB layer across all data read paths. Module is not THOR-eligible until TOXIN-BB-ARCH-001 is resolved.

TOXIN does not emit THOR_RELEASE_ELIGIBLE. Release authority belongs exclusively to THOR.
