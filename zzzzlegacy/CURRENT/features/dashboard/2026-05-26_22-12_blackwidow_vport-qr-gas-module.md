# BLACKWIDOW Runtime Adversarial Report

**Date:** 2026-05-26  
**Time:** 22:12  
**Scope:** VCSM  
**Reviewer:** BLACKWIDOW  
**Environment:** Source-level adversarial simulation (repository-scoped, non-destructive)  
**Governance Status:** DRAFT  
**VENOM Input:** `2026-05-26_22-12_venom_vport-qr-gas-module.md`  
**Findings:** 1 CONFIRMED BYPASS | 1 PARTIAL | 3 BLOCKED  
**Exploit Chains:** 1 CONFIRMED (BW-001) | 0 CRITICAL | 1 HIGH

---

## Attack Surface Summary

Session scope: vport QR code system, gas station dashboard, public QR views, flyer print surfaces.

**Attack entry points simulated:**
1. Public QR views (`VportPublicReviewsQrView`, `VportPublicMenuQrView`) — unauthenticated, URL-driven
2. Owner settings (`VportsBusinessCardSection`) — authenticated VPORT owner only
3. Dashboard gas panel chain — authenticated VPORT owner only
4. Shared `QrCode` primitive — callable by any consumer component
5. Booking QR panel — disabled, dormant

**Primary adversarial goal:** Confirm whether VENOM's V-001 (error-path UUID leak) is a provable, triggerable exploit — or merely theoretical.

---

## Simulated Threat Scenarios

| Scenario | Target | Method | Result |
|---|---|---|---|
| Error path slug bypass | `useActorCanonicalSlug` + QR views | Network failure simulation | **CONFIRMED BYPASS** |
| Close navigation UUID leak | `VportPublicReviewsQrView.onClose` | Error state + close action | **CONFIRMED secondary impact** |
| Hardcoded domain mismatch | `VportsBusinessCardSection` | Non-production environment | PARTIAL (operational, not auth) |
| Identity object exfiltration | `GasPricesPanel me={identity}` | Component prop inspection | BLOCKED |
| QrCode URL injection | `QrCode value` prop | Client-controlled string | BLOCKED |
| Booking panel activation | `BookingQrLinksPanel enabled={false}` | Prop manipulation | BLOCKED |

---

## Ownership Bypass Results

**OWNERSHIP BYPASS ATTEMPT**  
Target: `GasPricesPanel` edit controls (`allowOwnerUpdate && isOwner`)  
Attack vector: Passing `allowOwnerUpdate=true` from a non-owner context  
Result: **BLOCKED**  
Evidence:
- `allowOwnerUpdate` is computed at `VportDashboardGasScreen` from `identity`-derived state — not from client URL params or user input
- `isOwner` comes from `useVportOwnership` → `checkVportOwnershipController` → `actor_owners` DB check
- An unauthenticated or non-owner actor cannot satisfy the `actor_owners` DB verification
- Neither prop can be injected from the client without modifying production code

Controller gate: PRESENT (dual gate, DB-backed)  
Severity: N/A — not bypassed

---

## Session Mutation Results

**SESSION MUTATION ATTEMPT**  
Target: `useActorCanonicalSlug` — can a stale or wrong `actorId` corrupt slug resolution?  
Attack vector: Navigate to QR view with a different `actorId` before the first fetch completes  
Result: **BLOCKED**  
Evidence:
- Hook uses `alive` flag (via closure in `useEffect` cleanup) to prevent stale writes
- `resolvedActorId === actorId` guard prevents a slug resolved for Actor A from being returned when prop has changed to Actor B
- `loading = loading || pendingForCurrentActor` correctly holds the loading state open during actor switch

Session binding: ENFORCED  
Severity: N/A — not bypassed

---

## Runtime Abuse Results

**RUNTIME ABUSE ATTEMPT — Error path bypass of QR gate**  
Target: `VportPublicReviewsQrView` QR render gate (`loading || !canonicalSlug`)  
Actor role used: Public Visitor (unauthenticated)  
Expected access: Gate holds — QR must not render until canonical slug resolves  
Result: **BYPASSED** ← CONFIRMED EXPLOIT  

Evidence (code-level, from `useActorCanonicalSlug.js`):  
```
State after error:
  error         = Error (network failure)
  canonicalSlug = actorId  (UUID — line 80)
  resolvedActorId = actorId (line 81)
  loading       = false    (finally block)

Return computation:
  isResolvedForCurrentActor = !!actorId && resolvedActorId === actorId = TRUE
  pendingForCurrentActor    = !!actorId && !true = FALSE
  return {
    canonicalSlug: TRUE ? actorId : null  → actorId (UUID) returned
    loading:       false || FALSE         → false
    error:         TRUE ? Error : null    → Error returned (but view ignores it)
  }

View destructuring:
  const { canonicalSlug, loading } = useActorCanonicalSlug(actorId)
  // 'error' not destructured

Gate evaluation:
  loading || !canonicalSlug
  = false || !actorId
  = false || false
  = false ← GATE OPENS

QR renders with:
  reviewsUrl = buildReviewsQrUrl(actorId)
             = `${window.location.origin}/profile/${actorId}/reviews`
             ← CONTAINS RAW UUID
```

Privilege gate: WEAK — bypassed by error state that satisfies gate condition  
Severity: HIGH  

---

## RLS Verification Results

RLS verification is out of scope for this session's changed files — all QR views are client-side React components, not DB queries. The hook's controller (`buildActorCanonicalSlugController`) makes a Supabase call, but no RLS-relevant bypass was identified here; the attack vector is the error fallback, not a DB policy gap.

RLS status: NOT APPLICABLE to this finding  

---

## Viewer Context Fuzz Results

**VIEWER CONTEXT FUZZ ATTEMPT — null actorId to QR views**  
Target: `VportPublicReviewsQrView`  
Injected context: `actorId = null`  
Expected result: Component returns null  
Actual result: **BLOCKED** — line 25: `if (!actorId) return null`  
Context validation: ENFORCED  
Severity: N/A

**VIEWER CONTEXT FUZZ ATTEMPT — empty string actorId**  
Target: `useActorCanonicalSlug`  
Injected context: `actorId = ""`  
Expected result: Hook returns `canonicalSlug = null, loading = false`  
Actual result: **BLOCKED**  
Evidence: `if (!actorId)` at line 43 catches falsy values, sets all state to null/false  
Context validation: ENFORCED  
Severity: N/A

**VIEWER CONTEXT FUZZ ATTEMPT — actorId as UUID string to QR views (error path)**  
Target: `VportPublicReviewsQrView`  
Injected context: `actorId = "3f7a1b2c-0000-0000-0000-000000000000"` (simulated; slug RPC fails)  
Expected result: Spinner shown — QR does not render  
Actual result: **BYPASSED** — QR renders with UUID (see Runtime Abuse above)  
Context validation: WEAK (error path not covered)  
Severity: HIGH  

---

## Mutation Replay Results

Not applicable to session-modified scope. No booking cancel, thread mutation, or VPORT deactivation flows were modified.

---

## Hydration Poisoning Results

Not applicable to session-modified scope. No hydration store changes in this session.

---

## Cross-Feature Abuse Results

**CROSS-FEATURE ABUSE ATTEMPT — Direct QrCode import bypass of adapter**  
Source feature: Any external feature  
Target feature internal: `@/features/dashboard/qrcode/components/QrCode.jsx`  
Attack vector: Direct import bypassing adapter layer  
Result: **BLOCKED**  
Evidence: `grep react-qr-code` across all VCSM src confirms zero direct `react-qr-code` imports outside `QrCode.jsx`. All known consumers route through either the adapter (`qrcode.adapter.js`) or the direct component path within the same feature. Adapter boundary is enforced at import level.  
Adapter isolation: ENFORCED  
Severity: N/A

---

## URL Surface Results

**URL SURFACE TEST — Success path (slug resolved)**  
Route: `buildReviewsQrUrl(canonicalSlug)` → `/profile/abc123-restaurant-name-city-tx/reviews`  
UUID exposure: ABSENT  
Slug enforcement: ENFORCED  
Severity: N/A

**URL SURFACE TEST — Error path (V-001 exploit active)**  
Route: `buildReviewsQrUrl(actorId)` → `/profile/3f7a1b2c-0000-0000-0000-000000000000/reviews`  
UUID exposure: **PRESENT**  
Slug enforcement: MISSING (error bypass)  
Severity: HIGH  

**URL SURFACE TEST — Business card section copy button (V-002)**  
Route: `https://vibezcitizens.com/vport/${v.slug}/card`  
UUID exposure: ABSENT (slug is used, not UUID)  
Domain hardcoding: **PRESENT** (wrong on non-production environments)  
Slug enforcement: ENFORCED (slug is human-readable)  
Severity: MEDIUM  

**URL SURFACE TEST — onClose navigation in QR view (V-001 secondary)**  
When error path triggered: `navigate(\`/profile/${canonicalSlug}/reviews\`)` where `canonicalSlug = actorId`  
UUID exposure: **PRESENT** — secondary leak on close action  
Slug enforcement: MISSING  
Severity: HIGH (same source as BW-001)  

---

## Notification Abuse Results

Not in session scope. Not simulated.

---

## Auth Callback Replay Results

Not in session scope. Not simulated.

---

## Search Abuse Results

Not in session scope. Not simulated.

---

## Successful Exploit Chains

### BW-001 — Error-Path QR Gate Bypass (CONFIRMED)

**Exploit Type:** Single-step exploit (one gate assumption violated by error fallback)

**Full Chain:**
```
1. User navigates to public QR view (e.g. /actor/{actorId}/reviews-qr)
2. Component renders → useActorCanonicalSlug(actorId) called
3. useEffect fires → buildActorCanonicalSlugController(actorId) called
4. Network failure / Supabase RPC error / timeout occurs
5. catch block: setCanonicalSlug(actorId) + setResolvedActorId(actorId)
6. finally block: setLoading(false)
7. Next render: canonicalSlug = UUID, loading = false, error = Error
8. Hook return: isResolvedForCurrentActor = true → returns UUID as canonicalSlug
9. View: { canonicalSlug = UUID, loading = false } (error ignored)
10. Gate: loading || !canonicalSlug = false || false = false → OPENS
11. QR renders with buildReviewsQrUrl(UUID) = "https://…/profile/{UUID}/reviews"
12. CONFIRMED: Raw actorId UUID encoded in public QR code
```

**Secondary impact — close navigation:**
```
13. User closes the QR view
14. onClose: canonicalSlug is truthy (UUID) → navigate(`/profile/${UUID}/reviews`)
15. Browser address bar shows UUID in URL — confirmed secondary leak
```

**Trigger conditions:**
- Network interruption (WiFi drop, mobile handoff, Supabase cold start, throttled connection)
- No special privileges needed
- Reproducible on any device with DevTools Network throttling → Offline mode applied after page load

**Evidence class:** Code-level proof (lines 80-81 of `useActorCanonicalSlug.js`; gate lines 120 of `VportPublicReviewsQrView.jsx`)

**Governance Status:** CONFIRMED  
**Blast Radius:** All consumers of `useActorCanonicalSlug` that gate on `loading || !canonicalSlug` without also checking `!error` — currently: `VportPublicReviewsQrView`, `VportPublicMenuQrView`

---

## Failed Exploit Chains (Defenses That Held)

| Attempted Exploit | Defense | Why It Held |
|---|---|---|
| Cross-actor ownership bypass (gas panel) | `actor_owners` DB check + dual prop gate | DB verification cannot be spoofed from client |
| Stale actor switch during slug fetch | `alive` closure + `resolvedActorId` guard | React effect cleanup prevents stale writes |
| Null/empty actorId to QR views | `if (!actorId) return null` early return | Explicit null check at render boundary |
| `QrCode` URL injection from untrusted input | No client-controlled path to QrCode value | All callers use builder functions, not raw user input |
| `BookingQrLinksPanel` activation | `enabled={false}` prop in call site | Render gated; no data fetched |
| Direct `react-qr-code` import bypass | Adapter layer enforced; zero direct imports | Import audit clean |

---

## Runtime Evidence

**V-001 evidence source:** `useActorCanonicalSlug.js` lines 79-82 + `VportPublicReviewsQrView.jsx` line 20 (destructure) + line 120 (gate)

**Code trace:**
```js
// useActorCanonicalSlug.js:71-84
} catch (e) {
  if (!alive) return
  // ... debug log ...
  setError(e)
  setCanonicalSlug(actorId)    // UUID assigned
  setResolvedActorId(actorId)  // "resolved" flag set
} finally {
  if (alive) setLoading(false)  // loading cleared
}
// Return:
// isResolvedForCurrentActor = true (resolvedActorId === actorId)
// canonicalSlug returned = actorId (UUID)
// loading = false
// error = Error object (returned but not consumed by view)

// VportPublicReviewsQrView.jsx:20
const { canonicalSlug, loading } = useActorCanonicalSlug(actorId);
//    ↑ 'error' not destructured — view is blind to error state

// VportPublicReviewsQrView.jsx:120
{loading || !canonicalSlug ? (spinner) : (QR renders)}
// With UUID: false || false = false → QR renders
```

**BW-001 Governance Status:** CONFIRMED (code-level proof; no runtime test required to classify as real)

---

## Blast Radius

| Finding | Scope |
|---|---|
| BW-001 (V-001 confirmed) | Any user on flaky network visiting a VPORT's public QR page — UUID in QR, UUID in browser address bar on close. Affects both `VportPublicReviewsQrView` and `VportPublicMenuQrView`. |
| BW-002 (V-002 partial) | VPORT owners on staging/local who use copy-link button — copies production URL, not environment URL. No auth impact. |

---

---

## BLACKWIDOW ADVERSARIAL FINDING — BW-001

**Finding ID:** BW-001  
**Scenario:** Error-path QR gate bypass — hook error fallback defeats UUID protection  
**Target:** `useActorCanonicalSlug.js` catch block → `VportPublicReviewsQrView.jsx` QR render gate  
**Application Scope:** VCSM  
**Platform Surface:** Public QR view pages (unauthenticated)  
**Attack Vector:** Network failure or Supabase RPC error during slug resolution  
**Exploit Chain Type:** Single-step exploit  
**Governance Status:** CONFIRMED  
**Result:** BYPASSED  
**Evidence:** Code-level proof — hook error fallback at lines 80-81 sets `canonicalSlug = actorId` (UUID) which satisfies the gate condition `!canonicalSlug` as false, causing QR to render with raw UUID URL. Secondary leak: `onClose` navigation also uses the UUID-as-slug.  
**Defense Gate:** WEAK — gate present, but error path bypasses its intent  
**Blast Radius:** All public QR views consuming `useActorCanonicalSlug` — currently 2 views  
**Severity:** HIGH  
**VENOM Finding Cross-Reference:** V-001  

**Recommended Fix:**  
Modify `useActorCanonicalSlug.js` catch block — remove the `setCanonicalSlug(actorId)` and `setResolvedActorId(actorId)` lines. Let `canonicalSlug` remain `null` on error. The hook's `error` state (already set) is sufficient for callers to distinguish error from loading.

```js
// CURRENT (vulnerable):
} catch (e) {
  if (!alive) return
  setError(e)
  setCanonicalSlug(actorId)    // ← REMOVE: assigns UUID
  setResolvedActorId(actorId)  // ← REMOVE: falsely marks as resolved
}

// FIXED:
} catch (e) {
  if (!alive) return
  setError(e)
  // canonicalSlug stays null → gate stays closed → no UUID QR
}
```

Views should also destructure `error` and show a user-facing error state:
```jsx
const { canonicalSlug, loading, error } = useActorCanonicalSlug(actorId);
// Gate: loading || !canonicalSlug (already correct once hook is fixed)
// Error UI: show if !loading && !canonicalSlug && error
```

**Layer to Fix:** Hook (`useActorCanonicalSlug.js`) — primary; Views — add error UI (secondary)  
**Required Follow-up Command:** Wolverine (implementation); SENTRY (post-execution review); THOR (re-gate after fix)

---

## BLACKWIDOW ADVERSARIAL FINDING — BW-002

**Finding ID:** BW-002  
**Scenario:** Copy button and display URL diverge from QR on non-production environments  
**Target:** `VportsBusinessCardSection.jsx` lines 7 and 46  
**Application Scope:** VCSM  
**Platform Surface:** Authenticated owner settings  
**Attack Vector:** Non-production environment usage (staging, local dev)  
**Exploit Chain Type:** N/A — operational inconsistency, not security exploit  
**Governance Status:** DRAFT  
**Result:** PARTIAL — operational impact only; no auth bypass  
**Evidence:** Lines 7 and 46 confirmed hardcoded `https://vibezcitizens.com`; QR modal uses `buildBusinessCardQrUrl` (origin-relative); inconsistency confirmed  
**Defense Gate:** PRESENT (auth required; slug is human-readable, not UUID)  
**Blast Radius:** Staging/preview users copying the business card link — copies production URL  
**Severity:** MEDIUM (operational)  
**VENOM Finding Cross-Reference:** V-002  
**Recommended Fix:** Replace hardcoded strings with `buildBusinessCardQrUrl(v.slug)` at both locations  
**Layer to Fix:** Component  
**Required Follow-up Command:** Wolverine (one-line patch)

---

## Recommended Fixes

| BW ID | Fix | Layer | Priority |
|---|---|---|---|
| BW-001 | Remove `setCanonicalSlug(actorId)` and `setResolvedActorId(actorId)` from catch block | Hook | P0 — RELEASE BLOCKER |
| BW-001 secondary | Views: destructure `error`, show user-facing error state instead of persistent spinner | Component | P1 |
| BW-002 | Replace lines 7+46 in `VportsBusinessCardSection.jsx` with `buildBusinessCardQrUrl(v.slug)` | Component | P1 |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| Wolverine | Implement BW-001 fix in `useActorCanonicalSlug.js` and update view error states | REQUIRED BEFORE RELEASE |
| SENTRY | Post-execution review of hook changes | REQUIRED AFTER FIX |
| ELEKTRA | Code-level scan and patch proposal (next in pipeline) | IN PROGRESS |
| THOR | Re-evaluate release gate after BW-001 resolution | BLOCKED UNTIL BW-001 RESOLVED |

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| VENOM | Trust-boundary findings already consumed as input | COMPLETE |
| LOKI | Runtime telemetry for error path — can capture slug_error log in production to measure frequency | OPTIONAL |
| THOR | Release gate evaluation | BLOCKED — BW-001 CONFIRMED HIGH |
