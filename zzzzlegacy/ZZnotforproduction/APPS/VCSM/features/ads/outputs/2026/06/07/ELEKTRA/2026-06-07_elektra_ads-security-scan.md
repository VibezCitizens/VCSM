# ELEKTRA PRECISION SECURITY SCAN — ads
**Date:** 2026-06-07T11:30:00
**Scanner Version:** 1.1.0
**Application Scope:** VCSM
**Command:** ELEKTRA
**VENOM Gate:** PASS — 2026-06-07
**BLACKWIDOW Gate:** PASS — 2026-06-07

## Output Metadata
| Field | Value |
|---|---|
| Feature | ads |
| Command | ELEKTRA |
| Scope | VCSM:ads |
| VENOM Reference | 2026-06-07_venom_ads-security-review.md |
| BLACKWIDOW Reference | 2026-06-07_blackwidow_ads-adversarial-review.md |
| Timestamp | 2026-06-07T11:30:00 |

---

## Gate Status

```
ELEKTRA GATE CHECK
===================
ARCHITECT Gate: PASS (0 days old)
VENOM Gate: PASS (2026-06-07, COMPLETE)
BLACKWIDOW Gate: PASS (2026-06-07, COMPLETE)
Proceeding with source-to-sink chain analysis
```

---

## Scan Areas Activated

- Area 1: Actor Ownership / IDOR (primary)
- Area 2: Controller Input Trust (primary)
- Area 7: URL and Redirect (URL validation)

---

## ELEK-ADS-2026-001 — actorId Ownership Chain [HIGH]

**Finding ID:** ELEK-ADS-2026-001
**Verifying:** VEN-ADS-2026-001 / BW-ADS-2026-001 (BYPASSED)
**Severity:** HIGH
**Patch Type:** OWNERSHIP_GUARD (usecase layer)

**Source-to-Sink Chain:**
```
SOURCE: URL param actorId
  ↓ /vport/:actorId/ads route (ProtectedRoute + ProfileGatedOutlet — auth only)
  ↓ VportAdsSettingsScreen receives actorId prop from URL
  ↓ useVportAds(actorId) — hook receives unchecked actorId
  ↓ adPipeline.usecase.js: listAdsUseCase(actorId) / saveDraftUseCase(actorId, ad) / deleteAdUseCase(id)
SINK: ad.storage.dal.js: listAdsByActor(actorId) / upsertAd(ad) / removeAd(id)

TRUST BOUNDARY VIOLATION: actorId travels source→sink with NO ownership check
Missing defense: sessionActorId === actorId verification at usecase entry point
```

**Patch Advisory:**

At the top of `adPipeline.usecase.js` (or in the calling hook `useVportAds.js`):
```js
import { useIdentity } from '@/engines/identity';

// At usecase entry or hook initialization:
const { identity } = useIdentity();
if (!identity?.actorId) throw new Error('SESSION_REQUIRED');
if (actorId !== identity.actorId) throw new Error('OWNERSHIP_VIOLATION: actorId does not match session actor');
```

**Why this works:** `useIdentity()` is the authoritative session-actor binding. The check cannot be bypassed from the client since `identity.actorId` is derived from the server-verified session. Any URL param that differs from the session actor is rejected.

**Pre-migration gate:** This patch MUST be applied before any ads Supabase migration. Without it, the unowned actorId would be used in all DB writes, creating a server-side IDOR.

**False Positive Rejection:** N/A — chain confirmed BYPASSED by BLACKWIDOW.

---

## ELEK-ADS-2026-002 — removeAd Without Ownership Check [MEDIUM]

**Finding ID:** ELEK-ADS-2026-002
**Verifying:** VEN-ADS-2026-003 / BW-ADS-2026-002 (PARTIAL)
**Severity:** MEDIUM
**Patch Type:** OWNERSHIP_GUARD (usecase layer)

**Source-to-Sink Chain:**
```
SOURCE: ad id (UI action — "delete ad" click)
  ↓ useVportAds.deleteAdUseCase(id)
  ↓ deleteAd(id) → ad.api.js
  ↓ removeAd(id) — ad.storage.dal.js:61
SINK: localStorage.remove(id)

MISSING DEFENSE: actorId ownership pre-check before removeAd
```

**Patch Advisory:**

In `deleteAdUseCase` or the calling usecase:
```js
async function deleteAdUseCase(sessionActorId, id) {
  // Verify the ad belongs to the session actor before deletion
  const existing = await fetchAds(sessionActorId); // listAdsByActor
  const targetAd = existing.find(ad => ad.id === id);
  if (!targetAd) throw new Error('AD_NOT_FOUND');
  if (targetAd.actorId !== sessionActorId) throw new Error('OWNERSHIP_VIOLATION');
  return deleteAd(id);
}
```

**Why this works:** The pre-check verifies the ad being deleted belongs to the session actor before the delete executes. At Supabase migration, this pattern maps to a `WHERE id = $id AND actor_id = $sessionActorId` DB delete clause.

---

## ELEK-ADS-2026-003 — validateAdDraft Accepts http:// URLs [MEDIUM]

**Finding ID:** ELEK-ADS-2026-003
**Verifying:** VEN-ADS-2026-004 / BW-ADS-2026-003 (BYPASSED)
**Severity:** MEDIUM
**Patch Type:** INPUT_SANITIZE (validation layer)

**Source-to-Sink Chain:**
```
SOURCE: destinationUrl, mediaUrl (user input in ad creation form)
  ↓ validateAdDraft(draft) — ad.validation.js:4
  ↓ isValidHttpUrl(url): new URL(url); accepts http: OR https:
SINK: ad.storage.dal.js upsertAd(ad) — stored ad with http:// URL

MISSING DEFENSE: protocol must be https: only
```

**Patch Advisory:**

In `apps/VCSM/src/features/ads/lib/ad.validation.js`:
```js
// Replace:
export function isValidHttpUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) { return false; }
}

// With:
export function isValidHttpsUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'https:';
  } catch (_) { return false; }
}
```

Update all callers: `isValidHttpUrl` → `isValidHttpsUrl`.

**Why this works:** One-line fix. Rejects http:// URLs at validation time before storage. Simple and complete.

---

## ELEK-ADS-2026-004 — OwnerOnlyDashboardGuard Missing from Route [HIGH]

**Finding ID:** ELEK-ADS-2026-004
**Verifying:** VEN-ADS-2026-002 / BW-ADS-2026-001 (BYPASSED)
**Severity:** HIGH
**Patch Type:** ROUTE_GUARD (routing layer)

**Source-to-Sink Chain:**
```
SOURCE: URL navigation to /vport/:actorId/ads
  ↓ ProtectedRoute: auth check PASSES
  ↓ ProfileGatedOutlet: profile check PASSES
SINK: VportAdsSettingsScreen renders with unchecked actorId

MISSING DEFENSE: OwnerOnlyDashboardGuard or equivalent ownership gate at route level
```

**Patch Advisory:**

In the route definition for `/vport/:actorId/ads` in `apps/VCSM/src/app/routes/index.jsx`:
```jsx
// Wrap with OwnerOnlyDashboardGuard (existing platform pattern):
{
  path: 'vport/:actorId/ads',
  element: (
    <OwnerOnlyDashboardGuard>
      <VportAdsSettingsScreen />
    </OwnerOnlyDashboardGuard>
  )
}
```

If `OwnerOnlyDashboardGuard` is UI-only (per VEN-APP-004/PORT-V-006), also apply ELEK-ADS-2026-001 at the usecase layer. Defense-in-depth: both route guard AND usecase guard.

---

## False Positives Rejected

**FP-ADS-001:** localStorage-backed ads — REJECTED as CRITICAL. Since ads is currently localStorage-only with no server persistence, the impact of ownership bypass is self-contained to the browser. All findings are rated HIGH (not CRITICAL) for current state. CRITICAL classification applies at Supabase migration.

**FP-ADS-002:** DevTools localStorage tampering — REJECTED as unique finding. This is a known limitation of localStorage-based storage; not an application-layer vulnerability. Filed as informational in BW-ADS-2026-005.

---

## THOR Release Gate Assessment

```
THOR Release Blockers: NONE (current localStorage scope)
Pre-migration mandatory patches: ELEK-ADS-2026-001 (OWNERSHIP_GUARD), ELEK-ADS-2026-004 (ROUTE_GUARD)
Recommendation: CAUTION
Highest Open Severity: HIGH
```

---

## Output Summary

```
CRITICAL: 0
HIGH: 2 (ELEK-ADS-2026-001, ELEK-ADS-2026-004)
MEDIUM: 2 (ELEK-ADS-2026-002, ELEK-ADS-2026-003)
LOW: 0
False Positives Rejected: 2
```
