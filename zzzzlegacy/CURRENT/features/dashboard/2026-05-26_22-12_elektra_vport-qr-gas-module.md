# ELEKTRA Security Report

**Date:** 2026-05-26  
**Scope:** VCSM  
**Reviewer:** ELEKTRA  
**Scan Trigger:** VENOM cross-reference + BLACKWIDOW referral — post-session security pipeline on all session-modified files  
**Findings Summary:** 1 HIGH | 1 LOW | 1 INFO  
**False Positives Rejected:** 2  
**Suggested Patches:** 3

---

## ELEKTRA SCAN TARGET

**Feature / Route / Engine:** VCSM vport QR code system + gas station dashboard  
**Application Scope:** VCSM  
**Reason for scan:** End-of-session security sweep on all files modified during `vport-booking-feed-security-updates` — session implemented P0 UUID-leak fixes; ELEKTRA validates chain completeness and proposes concrete patches  
**Scan trigger:** VENOM cross-reference + BLACKWIDOW BW-001 CONFIRMED referral

---

## ENTRY POINT MAP

| Route / Surface | Input Sources | Trusted Input Boundary | Validation Present |
|---|---|---|---|
| Public QR views (`/actor/:actorId/menu-qr`, `/actor/:actorId/reviews-qr`) | `actorId` from route params; network response from Supabase RPC | `useActorCanonicalSlug` hook gate | PARTIAL — error and null-slug paths bypass gate |
| Settings — business card copy button | `v.slug` from authenticated VPORT data | No boundary needed (slug is trusted) | MISSING (domain hardcoded, not input validation issue) |
| Gas dashboard — `GasPricesPanel` | `identity` object from `useIdentity()` | Controller + `useVportOwnership` DB check | PRESENT for ownership; EXCESS surface passed to UI |

---

## Executive Summary

ELEKTRA scanned all session-modified files in the VCSM vport QR and gas station dashboard module. The primary finding (ELEK-2026-05-26-001) is a **HIGH severity** double-path UUID leak: the session's P0 fix protected against the loading-window UUID leak but left two separate bypass paths open — (1) the hook's error catch block, and (2) the controller's "no slug data" success path. ELEKTRA discovered that the controller itself (`buildActorCanonicalSlugController`) also falls back to `actorId` (UUID) when no slug data exists in the database, and this result is cached for 10 minutes. The combined effect means UUID exposure can occur on flaky networks AND on any actor that doesn't yet have slug data. Two candidates were rejected as false positives (QrCode URL injection — no client-controlled input path; BookingQrLinksPanel — disabled component). One LOW and one INFO finding with no direct exploit paths are also reported.

---

## High Findings

---

**SECURITY FINDING**

- **Finding ID:** ELEK-2026-05-26-001
- **Title:** Double-Path UUID Leak in Public QR Views — Error Fallback AND No-Slug-Data Fallback Both Return Raw actorId as Canonical Slug
- **Category:** Auth Bypass (trust boundary bypass); URL Safety (UUID in public URL)
- **Severity:** HIGH
- **Status:** Open
- **Scope:** VCSM
- **Location:**
  - Primary source: `apps/VCSM/src/features/profiles/controller/buildActorCanonicalSlugController.js:85-90` (controller no-slug fallback)
  - Secondary source: `apps/VCSM/src/features/profiles/hooks/useActorCanonicalSlug.js:80-81` (hook error fallback)
  - Sinks: `apps/VCSM/src/features/public/vportMenu/view/VportPublicReviewsQrView.jsx:120`, `apps/VCSM/src/features/public/vportMenu/view/VportPublicMenuQrView.jsx:111`

---

**DATA FLOW TRACE — Path 1: Network Error**

```
Source: Network failure during Supabase RPC call in buildActorCanonicalSlugController
  → Trust Boundary: useActorCanonicalSlug catch block
    → Intermediate: setCanonicalSlug(actorId), setResolvedActorId(actorId)
      → Sink: QrCode component receives buildReviewsQrUrl(actorId)
        → Defense: loading || !canonicalSlug gate
          → Why insufficient: actorId is truthy → gate evaluates false → QR renders
```

**DATA FLOW TRACE — Path 2: Success with no slug data**

```
Source: Actor has no slug data in DB (no vport profile slug, no display_name)
  → buildActorCanonicalSlugController.js:85-90:
      if (!canonicalSlug) { canonicalSlug = actorId }
  → Controller SUCCEEDS (no error thrown) — returns { canonicalSlug: actorId }
  → controllerCache.set(actorId, { canonicalSlug: actorId }) — CACHES UUID for 10 min
  → Trust Boundary: useActorCanonicalSlug hook (success path):
      setCanonicalSlug(actorId), setResolvedActorId(actorId)
      → Sink: QrCode component receives buildReviewsQrUrl(actorId)
        → Defense: loading || !canonicalSlug gate
          → Why insufficient: actorId is truthy → gate evaluates false → QR renders
```

**CHAIN VALIDATION:**

```
Source: actorId (UUID) — confirmed at controller:89 and hook:80
Trust boundary: QR gate (loading || !canonicalSlug) — confirmed at views:120/111
Sink: QrCode value = buildReviewsQrUrl(actorId) → QR encodes UUID URL — confirmed
Impact: Raw actorId UUID encoded in publicly visible QR code; also leaked in navigation URL on close (onClose uses canonicalSlug which contains UUID)
Missing defense: Gate does not distinguish between a resolved real slug and a UUID fallback slug
Finding Status: VALID
```

**Evidence:**

```js
// buildActorCanonicalSlugController.js:85-90
if (!canonicalSlug) {
  // Fall back to bare actorId so /profile/{uuid} works without a redirect loop.
  canonicalSlug = actorId  // ← UUID assigned on success path (no error thrown)
}
// Line 99: this result is CACHED for 10 minutes:
if (canonicalSlug) {  // actorId is always truthy
  controllerCache.set(actorId, output)  // ← UUID-fallback is now cached
}

// useActorCanonicalSlug.js:80-81 (error path)
setCanonicalSlug(actorId)    // ← UUID assigned on error path
setResolvedActorId(actorId)  // ← "resolved" flag set
// Both paths produce: canonicalSlug = actorId (UUID), isResolvedForCurrentActor = true

// VportPublicReviewsQrView.jsx:20 — error not destructured
const { canonicalSlug, loading } = useActorCanonicalSlug(actorId)
// VportPublicReviewsQrView.jsx:120 — gate does not cover UUID fallback
{loading || !canonicalSlug ? (spinner) : (QR renders with UUID)}
```

**Impact:**
- Raw `actorId` UUID encoded in QR code readable by anyone who scans it
- UUID also leaked in `onClose` navigation URL when `canonicalSlug = UUID` is truthy
- 10-minute cache means UUID-fallback is served from cache even after actor adds a slug (until TTL expires or write-path invalidation fires)
- Affects all actors without slug data (new VPORTs, incomplete profiles)
- Affects all actors on unreliable networks during slug resolution

**Reproduction Steps:**
1. Open a VPORT's public QR view (`/actor/{actorId}/reviews-qr`)
2a. (Error path) Throttle network to offline immediately after page load — slug RPC fails → UUID QR appears
2b. (No-slug path) Use an actor with no profile name/slug data in DB → controller returns UUID, QR renders with UUID
3. Scan the QR code — URL contains raw `actorId` UUID

**Existing Defense:** `loading || !canonicalSlug` gate at views:120/111 — protects during loading window only

**Why Defense Is Insufficient:** Both UUID-returning code paths produce a truthy, non-null `canonicalSlug` that satisfies the gate condition — the gate cannot distinguish between a real slug and a UUID fallback

**Recommended Fix:**  
The cleanest fix is a **view-level UUID guard** that validates the resolved slug is not a raw UUID. This avoids changing the hook or controller API (which would require auditing all other consumers that rely on the UUID fallback for profile screen navigation).

**Suggested Patch:**

Apply to both `VportPublicReviewsQrView.jsx` and `VportPublicMenuQrView.jsx`:

```jsx
// After: const { canonicalSlug, loading } = useActorCanonicalSlug(actorId);
// Add a UUID-shape detector:
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// A QR-safe slug is resolved, non-empty, and NOT a bare UUID
const isQrSafeSlug = !!canonicalSlug && !UUID_RE.test(canonicalSlug);

// Change URL builder guard:
const reviewsUrl = isQrSafeSlug ? buildReviewsQrUrl(canonicalSlug) : "";

// Change QR render gate from:
//   loading || !canonicalSlug
// to:
//   loading || !isQrSafeSlug

// Change URL/actions display gate from:
//   !loading && canonicalSlug
// to:
//   !loading && isQrSafeSlug

// Optional: add error UI when !loading && !isQrSafeSlug && !!canonicalSlug
// (the UUID case — slug "resolved" but unsafe):
// {!loading && !isQrSafeSlug && (
//   <p>Unable to generate QR code. Profile setup may be incomplete.</p>
// )}
```

**Why This Works:**
- UUIDs are precisely 36 chars: 8-4-4-4-12 hex + dashes
- Real canonical slugs always include a name/location suffix (e.g. `abc123-marias-restaurant-laredo-tx`) — never match the UUID pattern
- Does not change the hook or controller API; profile screens continue to receive UUID fallback for redirect logic
- `isQrSafeSlug = false` when slug is UUID → gate stays closed → no UUID QR
- Works for both error path and no-slug-data success path

**Note on controller-level cache:** The controller caches `canonicalSlug = actorId` for 10 minutes on the no-slug-data path. After an actor adds a slug to their profile, `invalidateActorCanonicalSlugCache(actorId)` must be called from the profile write path to bust this cache. Verify this is wired in the profile update controller.

**Follow-up Command:** Wolverine (implement patch); SENTRY (post-execution review of both view files); THOR (re-evaluate release gate)

---

## Medium Findings

*None. V-002 (hardcoded domain) re-classified as LOW by ELEKTRA — see below.*

---

## Low Findings

---

**SECURITY FINDING**

- **Finding ID:** ELEK-2026-05-26-002
- **Title:** Hardcoded Production Domain in Business Card Copy Button and Display URL
- **Category:** URL Safety (environment inconsistency)
- **Severity:** LOW
- **Status:** Open
- **Scope:** VCSM
- **Location:** `apps/VCSM/src/features/settings/vports/ui/VportsBusinessCardSection.jsx:7, 46`

**Source:** `v.slug` from authenticated VPORT data (trusted, human-readable — not a UUID)  
**Trust Boundary:** URL construction in component  
**Sink:** `https://vibezcitizens.com/vport/${v.slug}/card` (string template) at lines 7 and 46  
**Impact:** On non-production environments, copy-link button copies the production URL; display URL shows production. No auth bypass, no UUID exposure, no actor data leak.

**Evidence:**
```js
// VportsBusinessCardSection.jsx:7
const url = `https://vibezcitizens.com/vport/${v.slug}/card`

// VportsBusinessCardSection.jsx:46
const cardUrl = `https://vibezcitizens.com/vport/${v.slug}/card`

// VportsQrModal.jsx (sibling, fixed in session):
const qrUrl = buildBusinessCardQrUrl(v.slug) // uses window.location.origin ✓
```

**Reproduction Steps:** Open settings on a staging or local environment → business card section shows production domain URL and copy button copies production URL, while the QR modal encodes staging URL — inconsistency.

**Existing Defense:** None (no environment check)  
**Why Defense Is Insufficient:** No centralized URL builder used  

**Recommended Fix:** Replace template literals with `buildBusinessCardQrUrl(v.slug)` at both locations.

**Suggested Patch:**
```js
// VportsBusinessCardSection.jsx — add import:
import { buildBusinessCardQrUrl } from "@/lib/qrUrlBuilders";

// Line 7 — handleCopyLink:
const url = buildBusinessCardQrUrl(v.slug)

// Line 46 — card display:
const cardUrl = buildBusinessCardQrUrl(v.slug)
```

**Follow-up Command:** Wolverine (one-file patch)

---

## Info Findings

---

**SECURITY FINDING**

- **Finding ID:** ELEK-2026-05-26-003
- **Title:** Full Identity Object Passed Through Presentational Component Tree — Exceeds Data Minimization Principle
- **Category:** (None — no direct exploit path)
- **Severity:** INFO
- **Status:** Open
- **Scope:** VCSM
- **Location:**
  - `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardGasScreen.jsx:135`
  - `apps/VCSM/src/features/dashboard/vport/screens/components/VportDashboardGasPanels.jsx:54`
  - `apps/VCSM/src/features/profiles/kinds/vport/screens/gas/components/GasPricesPanel.jsx:40`

**Source:** `identity` object from `useIdentity()` hook  
**Sink:** `me.actorId` read at `GasPricesPanel:40` for `canSubmit` boolean — only field used  
**Impact:** Full identity object in component render scope; no logging, no external output, no client exposure; risk is future misuse by developers adding to `GasPricesPanel`

**Chain validation:** CHAIN INCOMPLETE — no path from `me` object to any dangerous sink currently exists. No logging, no external fetch, no render of forbidden fields. Finding is INFO (defense-in-depth improvement).

**Suggested Patch:**
```jsx
// VportDashboardGasScreen.jsx — replace me={identity} with primitive:
<VportDashboardOfficialGasPanel canSubmit={!!identity?.actorId} ... />

// VportDashboardGasPanels.jsx:
<GasPricesPanel canSubmit={canSubmit} ... />

// GasPricesPanel.jsx — remove me prop, use canSubmit directly:
// const canSubmit = !!me?.actorId  →  prop: { canSubmit }
```

**Follow-up Command:** Wolverine (optional refactor, P2 priority)

---

## False Positives Rejected

---

**FALSE POSITIVE REJECTED**

- **Candidate:** QrCode component `value` prop URL injection — untrusted user input could reach `react-qr-code` and encode a malicious URL
- **Location:** `apps/VCSM/src/features/dashboard/qrcode/components/QrCode.jsx`
- **Rejection reason:** Chain broken at **Source** — no path from user-controlled input to `QrCode.value` exists in the current codebase. All callers use builder functions (`buildMenuQrUrl`, `buildReviewsQrUrl`, `buildBusinessCardQrUrl`) or controlled state (`cleanMenuUrl`, `menuUrl` from flyer state). An attacker cannot supply a `value` prop to `QrCode` without modifying production code or compromising the Supabase database to store a malicious slug.
- **Chain gap:** Source
- **Notes:** Worth adding a scheme guard (`https:` / `http:` allowlist) as defense-in-depth if the component is ever exposed to external data. Currently the risk is theoretical only.

---

**FALSE POSITIVE REJECTED**

- **Candidate:** `BookingQrLinksPanel.QrLinkCard` constructs URL with unencoded `qrLink.slug` — potential URL injection or malformed link
- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/components/BookingQrLinksPanel.jsx`
- **Rejection reason:** Chain broken at **Source** — the component is `enabled: false`; no data is fetched, no URL is constructed, `QrLinkCard` is never rendered. The vulnerable code path is dormant. No input flows to the sink.
- **Chain gap:** Source (data flow never starts)
- **Notes:** When the booking adapter sprint activates this component, add `encodeURIComponent(String(qrLink.slug))` to the URL construction before enabling. This must be addressed before `enabled: true` is set.

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-05-26-001 | UUID leak in QR views — UUID guard in gate | HIGH | UI (2 view files) | SIMPLE | No |
| 2 | ELEK-2026-05-26-002 | Hardcoded domain in business card section | LOW | UI (1 component file) | SIMPLE | No |
| 3 | ELEK-2026-05-26-003 | Full identity object in gas panel tree | INFO | UI (3 files) | SIMPLE | No |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| Wolverine | Implement ELEK-001 patch in both QR view files (UUID guard) | REQUIRED BEFORE RELEASE |
| Wolverine | Implement ELEK-002 patch in VportsBusinessCardSection.jsx | REQUIRED |
| SENTRY | Post-execution architecture review of view file changes | REQUIRED AFTER FIX |
| THOR | Release gate evaluation — ELEK-001 HIGH finding blocks release | BLOCKED UNTIL ELEK-001 RESOLVED |
| Wolverine | Implement ELEK-003 patch (identity minimization — P2) | OPTIONAL |
| DB | Verify `invalidateActorCanonicalSlugCache` is wired in profile write path | RECOMMENDED |
