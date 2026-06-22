# SPIDER-MAN Test Coverage Report

Date: 2026-05-27
Application Scope: VCSM + ENGINE
Branch: vport-booking-feed-security-updates
Environment: Local / Vitest (Node)
Reviewer: SPIDER-MAN
Prior Report: 2026-05-26_14-00_spiderman_vport-booking-feed-security-updates.md

---

## Session Scope

This report covers the second security remediation pass on the `vport-booking-feed-security-updates` branch. All 15 surfaces below were changed in the current session. None appeared in the prior SPIDER-MAN report.

**Declared Scope:** VCSM + ENGINE
**Boundary Contract:** Enforced — PROJECT_BOUNDARY_ISOLATION_CONTRACT loaded.

---

## Coverage Summary

**Test files added this session:** 0
**Test files modified this session:** 0
**Total existing test files covering any changed surface:** 0
**Total unit test files in repo (VCSM):** 1 (authCallback.controller.test.js — unrelated to this session's surfaces)

All 15 changed surfaces have zero test coverage. The session fixed real security bugs (VENOM V-001 through V-008) — none of the fixes have regression locks.

---

## CI Test Gate Review

| Area | Current Status | Risk | Recommendation |
|---|---|---|---|
| VCSM unit test execution | ✅ `vitest run` configured | LOW | Keep |
| Coverage threshold | ❌ No threshold set | HIGH | Add `--coverage --threshold=80` |
| New session surfaces covered by CI | ❌ 0 of 15 | CRITICAL | See findings below |
| Pre-merge gate | ❌ No branch protection requiring green tests | HIGH | Require test:run before merge |

---

## Per-Surface Coverage Report

---

### Surface 1 — `readVportPublicDetails.rpc.dal.js`
- **Coverage:** NONE
- **Test file:** None
- **Security change:** Removed `profile_id` from explicit column select (VENOM V-001 — internal UUID no longer fetched from DB on public surface)
- **Critical test cases missing:**
  1. Verify `profile_id` is absent from the returned `data` object when the primary view returns a row
  2. Verify `profile_id` is absent from the fallback `seoData` path
  3. Verify `actor_id` is present and matches the input in both paths
  4. Verify `{ ok: false, error: 'not_found' }` is returned when both queries return null
  5. Verify an error thrown by either query propagates (no silent swallow)

---

### Surface 2 — `vportPublicDetails.model.js`
- **Coverage:** NONE
- **Test file:** None
- **Security change:** Removed `raw: row` from the return object (VENOM V-001 — raw DB row no longer leaked to callers). Model now maps only explicit fields.
- **Critical test cases missing:**
  1. Verify the returned `details` object contains no `raw` key under any input condition
  2. Verify `profile_id`, `lat`, `lng` are absent from returned `details` (internal-only fields)
  3. Verify `address` maps correctly from `row.address` (not from a raw fallback)
  4. Verify `toSafeUrl` rejects `data:` URIs and `javascript:` URLs in `websiteUrl`, `bannerUrl`, `avatarUrl`
  5. Verify `toSafePhone` strips dangerous characters from phone values
  6. Verify `ok: false` return when source has `ok !== true`
  7. Verify `displayName` fallback chain: `profile_name` → `display_name` → `vport_name` → `name`
  8. Verify `avatarLooksLikeLogoAsset` suppresses avatar when it matches a flyer asset URL
  9. Verify `getSocialLink` normalization handles mixed-case keys
  10. Verify `buildDirectionsUrl` constructs a Google Maps URL from `lat` + `lng` when no direct URL is present

---

### Surface 3 — `VportPublicMenuView.jsx`
- **Coverage:** NONE
- **Test file:** None
- **Security change:** Removed `details?.raw?.address` fallback — address now sourced only from model-mapped `details.address` (VENOM V-001)
- **Critical test cases missing:**
  1. Verify component does not read `details.raw` anywhere — static AST check
  2. Verify address-dependent UI (Directions button) is disabled when `details.address` is null
  3. Verify back-navigation uses `canonicalSlug` when available, never raw `actorId` UUID in `/profile/` path
  4. Verify back-navigation falls back to `/actor/:id/menu` (not `/profile/:uuid`) when slug is unresolved

---

### Surface 4 — `VportActorMenuFlyerView.jsx`
- **Coverage:** NONE
- **Test file:** None
- **Security changes:**
  - Added `isQrSafe` UUID guard — QR and Print button are disabled until slug resolves (VENOM V-004)
  - Fixed `onBack` to never navigate to `/vport/${actorId}` (VENOM V-005)
- **Critical test cases missing:**
  1. Verify `isQrSafe` is `false` when `canonicalSlug` is a raw UUID
  2. Verify `isQrSafe` is `false` when `canonicalSlug` is null or empty
  3. Verify `isQrSafe` is `true` when `canonicalSlug` is a non-UUID slug string
  4. Verify Print button is `disabled` when `isQrSafe` is false
  5. Verify the flyer body renders the "Preparing flyer…" placeholder (not the QR component) when `isQrSafe` is false
  6. Verify `onBack` navigates to `/profile/${canonicalSlug}` (not `/vport/${actorId}`) when slug is present
  7. Verify `onBack` navigates to `/actor/${actorId}/menu` when slug is absent

---

### Surface 5 — `VportActorMenuFlyerScreen.jsx`
- **Coverage:** NONE
- **Test file:** None
- **Security change:** Added `useVportOwnership` auth gate — only the VPORT owner can access the flyer screen (VENOM V-008)
- **Critical test cases missing:**
  1. Verify the screen renders an auth gate message (not the view) when `identity` is null
  2. Verify the screen renders a loading state while `identityLoading` or `ownershipLoading` is true
  3. Verify the screen renders an ownership denial message when `isOwner` is false
  4. Verify the screen renders `VportActorMenuFlyerView` only when `identity` is present AND `isOwner` is true
  5. Verify the screen returns `null` when `actorId` is absent from params
  6. Verify variant normalization: unknown variants fall back to `"classic"`; valid variants ("poster", "sticker", "table", "half", "full") pass through

---

### Surface 6 — `qrUrlBuilders.js` (`isQrSafeSlug`, all builders)
- **Coverage:** NONE
- **Test file:** None
- **Security changes:**
  - Added exported `isQrSafeSlug` — single source of truth for UUID/empty slug rejection (VENOM V-006)
  - Added UUID guard to `buildReviewsQrUrl`, `buildBusinessCardQrUrl`, `buildMenuQrUrl`
- **Critical test cases missing:**
  1. `isQrSafeSlug(null)` returns `false`
  2. `isQrSafeSlug("")` returns `false`
  3. `isQrSafeSlug("550e8400-e29b-41d4-a716-446655440000")` returns `false` (raw UUID)
  4. `isQrSafeSlug("abc123-marias-restaurant-laredo-tx")` returns `true`
  5. `buildReviewsQrUrl(uuid)` returns `""` (UUID blocked at builder level)
  6. `buildReviewsQrUrl(null)` returns `""`
  7. `buildReviewsQrUrl("valid-slug")` returns a string containing `/profile/valid-slug/reviews`
  8. `buildBusinessCardQrUrl(uuid)` returns `""`
  9. `buildBusinessCardQrUrl("valid-slug")` returns a string containing `/vport/valid-slug/card`
  10. `buildMenuQrUrl(uuid)` returns `""`
  11. `buildMenuQrUrl("valid-slug")` returns a string containing `/profile/valid-slug/menu`
  12. `buildMenuShortDisplayUrl("")` returns `""`
  13. `buildMenuShortDisplayUrl("valid-slug")` returns a string ending in `/profile/valid-slug/menu` without a protocol prefix
  14. All builders: special characters in slug are `encodeURIComponent`-escaped

---

### Surface 7 — `getVportProfileIdByActorId.dal.js` (NEW)
- **Coverage:** NONE
- **Test file:** None
- **Purpose:** Internal translation layer — actorId → internal vport.profiles.id. Invisible to public callers (VENOM V-003).
- **Critical test cases missing:**
  1. Returns `null` when `actorId` is null or undefined (no DB call)
  2. Returns `data.id` when query returns a row
  3. Returns `null` when query returns null data (actor has no profile)
  4. Returns `null` (not throws) when Supabase returns an error
  5. Returns `null` (not throws) on network exception

---

### Surface 8 — `resolveVportProfileId.controller.js` (NEW)
- **Coverage:** NONE
- **Test file:** None
- **Purpose:** Thin controller delegating actorId → profileId to the DAL. Architecture compliance: hooks call controller, not DAL directly.
- **Critical test cases missing:**
  1. Returns `null` when `actorId` is null
  2. Returns the resolved profileId from the DAL on success
  3. Returns `null` when DAL returns null (no profile for actor)
  4. Does not call the DAL when actorId is absent

---

### Surface 9 — `useQrLinks.js` (refactored)
- **Coverage:** NONE
- **Test file:** None
- **Security change:** Refactored to accept `actorId` only — never `profileId` or `organizationId`. Routes through `resolveVportProfileIdController` internally (VENOM V-003).
- **Critical test cases missing:**
  1. Does not accept or expose `profileId` in its public interface
  2. Calls `resolveVportProfileIdController` when `actorId` is present
  3. Sets `qrLinks: []` and returns early when `actorId` is null
  4. Sets `qrLinks: []` when profileId resolution returns null (actor has no profile)
  5. Passes `requestActorId: actorId` (not profileId) to `listQrLinksByProfile`
  6. Resets resolved profileId cache when `actorId` changes
  7. `addQrLink` sets `isPending` correctly and reloads after success
  8. `error` state is set when `listQrLinksByProfile` throws

---

### Surface 10 — `BookingQrLinksPanel.jsx`
- **Coverage:** NONE
- **Test file:** None
- **Security change:** Passes `actorId` (not `profileId`) to `useQrLinks` (VENOM V-003 — identity surface adapter)
- **Critical test cases missing:**
  1. Renders `null` when `actorId` prop is absent
  2. Passes `actorId` prop directly to `useQrLinks` with no transformation
  3. Renders loading state when `isLoading` is true
  4. Renders error message when `error` is present
  5. Renders empty state when `qrLinks` is empty
  6. Renders a card per QR link when links are present
  7. `QrLinkCard` returns `null` when `qrLink.slug` is absent (guard)
  8. Copy link constructs URL from `window.location.origin + /qr/ + encodeURIComponent(slug)`

---

### Surface 11 — `listQrLinks.controller.js` (engine)
- **Coverage:** NONE
- **Test file:** None
- **Security change:** Added `requestActorId` + `assertActorCan*` to all three list functions — previously these were unauthenticated reads (VENOM V-002)
- **Critical test cases missing:**
  1. `listQrLinksByOrganization`: throws when `requestActorId` is absent
  2. `listQrLinksByOrganization`: throws when `assertActorCanManageOrganization` rejects (non-member)
  3. `listQrLinksByOrganization`: returns mapped rows when actor is authorized
  4. `listQrLinksByLocation`: throws when `requestActorId` is absent
  5. `listQrLinksByLocation`: throws when `assertActorCanManageLocation` rejects
  6. `listQrLinksByLocation`: returns mapped rows when actor is authorized
  7. `listQrLinksByProfile`: throws when `requestActorId` is absent
  8. `listQrLinksByProfile`: throws when `profileId` is absent
  9. `listQrLinksByProfile`: throws when `dalGetActorByProfileId` returns null (profile not found)
  10. `listQrLinksByProfile`: allows when `profileActor.id === requestActorId` (self-access, no ownership assertion needed)
  11. `listQrLinksByProfile`: delegates to `assertActorOwnsVportActor` when `profileActor.id !== requestActorId`
  12. `listQrLinksByProfile`: throws when ownership assertion rejects
  13. `listQrLinksByProfile`: returns mapped rows when actor is the profile owner

---

### Surface 12 — `useDesktopBreakpoint.js` (shared canonical)
- **Coverage:** NONE
- **Test file:** None
- **Purpose:** Canonical shared hook — the three feature-local copies are now thin re-exports of this file.
- **Critical test cases missing:**
  1. Returns `false` in SSR/non-browser environment (`window === undefined`)
  2. Returns correct initial value from `window.matchMedia` in jsdom
  3. Updates state when media query changes (event-driven)
  4. Removes event listener on unmount (no leak)
  5. Accepts a custom query string and passes it to `matchMedia`

---

### Surfaces 13–15 — Thin re-exports (`features/public/vportMenu`, `features/dashboard/vport/screens`, `features/ads`)
- **Coverage:** NOT REQUIRED — these are single-line re-exports with no logic. If `useDesktopBreakpoint.js` (Surface 12) is tested, re-exports inherit that coverage by virtue of being no-ops.

---

## Missing Coverage Review

| File | Coverage Type Missing | Severity | Why It Matters |
|---|---|---|---|
| `qrUrlBuilders.js` — `isQrSafeSlug` + all builders | LIB / REGRESSION | CRITICAL | Single source of truth for UUID-in-QR prevention (VENOM V-006). If `isQrSafeSlug` regresses, all builders will encode UUIDs into printed QR codes. Pure functions — trivial to test. |
| `listQrLinks.controller.js` (engine) | CONTROLLER / REGRESSION | CRITICAL | Auth gate added to all 3 list functions — previously unauthenticated reads (VENOM V-002). No regression lock. Any actor can read any vport's QR links if the assertion is removed. |
| `VportActorMenuFlyerScreen.jsx` | COMPONENT / AUTH GATE | CRITICAL | Ownership gate is the only thing preventing unauthenticated actors from accessing flyer generation for any VPORT (VENOM V-008). Auth gate behavior must be locked. |
| `vportPublicDetails.model.js` | MODEL | HIGH | `raw: row` removal — no test confirms the raw DB row (including internal fields) is absent from all return paths. A regression reintroduces profile_id / lat / lng leakage to callers. |
| `VportActorMenuFlyerView.jsx` — UUID guard | COMPONENT | HIGH | UUID guard on `isQrSafe` prevents printing QR codes with raw UUIDs. No test locks this. A regression encodes UUIDs into printed physical media. |
| `resolveVportProfileId.controller.js` | CONTROLLER | HIGH | Identity translation layer. Null-safety contract must be locked — callers depend on null return for "no profile" case. |
| `getVportProfileIdByActorId.dal.js` | DAL | HIGH | Foundation of VENOM V-003 identity surface fix. Null return on error must be confirmed — a throw would crash `useQrLinks`. |
| `useQrLinks.js` | HOOK | HIGH | Identity surface contract (actorId-only). No test confirms profileId is never accepted or leaked externally. |
| `readVportPublicDetails.rpc.dal.js` | DAL | HIGH | `profile_id` exclusion from column select must be confirmed. No test verifies it is absent from query results. |
| `BookingQrLinksPanel.jsx` | COMPONENT | MEDIUM | Identity surface component. No test confirms actorId flows correctly without profileId transformation. |
| `useDesktopBreakpoint.js` | HOOK | LOW | Shared canonical hook — SSR safety and event listener cleanup. Low security impact but regression could break multiple surfaces simultaneously. |

---

## Regression Protection Review

| Issue | Protected By Test? | Risk | Recommendation |
|---|---|---|---|
| VENOM V-001 — `profile_id` excluded from public DAL column select | ❌ NO | HIGH | Test that `profile_id` is absent from all DAL return paths |
| VENOM V-001 — `raw: row` removed from model return | ❌ NO | HIGH | Test that `details` object has no `raw` key |
| VENOM V-001 — `details?.raw?.address` fallback removed from view | ❌ NO | MEDIUM | Static check: `details.raw` must not appear in `VportPublicMenuView` |
| VENOM V-002 — QR link list endpoints now require `requestActorId` | ❌ NO | CRITICAL | Test that all 3 list functions throw without `requestActorId` |
| VENOM V-003 — `useQrLinks` accepts `actorId` only | ❌ NO | HIGH | Test that `profileId` is never passed to engine layer from hook |
| VENOM V-004 — UUID guard on flyer QR/Print | ❌ NO | HIGH | Test `isQrSafe` is false for UUID slugs; Print stays disabled |
| VENOM V-005 — `onBack` never routes to `/vport/${uuid}` | ❌ NO | HIGH | Test `onBack` uses slug path or `/actor/:id/menu` redirect |
| VENOM V-006 — `isQrSafeSlug` blocks UUIDs in all builders | ❌ NO | CRITICAL | Test all 4 builders return `""` for UUID input |
| VENOM V-008 — Flyer screen requires VPORT ownership | ❌ NO | CRITICAL | Test screen blocks non-owner and unauthenticated access |

---

## Test Ownership Review

| Area | Test Owner | Status |
|---|---|---|
| `qrUrlBuilders.js` | Wolverine | UNASSIGNED |
| `listQrLinks.controller.js` (engine) | Wolverine | UNASSIGNED |
| `VportActorMenuFlyerScreen.jsx` auth gate | Wolverine | UNASSIGNED |
| `vportPublicDetails.model.js` | Wolverine | UNASSIGNED |
| `VportActorMenuFlyerView.jsx` UUID guard | Wolverine | UNASSIGNED |
| `resolveVportProfileId.controller.js` | Wolverine | UNASSIGNED |
| `getVportProfileIdByActorId.dal.js` | Wolverine | UNASSIGNED |
| `useQrLinks.js` | Wolverine | UNASSIGNED |
| `readVportPublicDetails.rpc.dal.js` | Wolverine | UNASSIGNED |
| `BookingQrLinksPanel.jsx` | Wolverine | UNASSIGNED |
| `useDesktopBreakpoint.js` | Wolverine | UNASSIGNED |

---

## SPIDER-MAN TEST FINDINGS

---

**SPIDER-MAN TEST FINDING**

- **Finding ID:** SPM-S2-001
- **File / Flow:** `engines/booking/src/controller/listQrLinks.controller.js` — all 3 list functions
- **Application Scope:** ENGINE
- **Coverage Type:** CONTROLLER + REGRESSION
- **Coverage Status:** MISSING
- **Severity:** CRITICAL
- **Evidence Type:** OBSERVED
- **Confidence:** HIGH
- **Current Protection:** None
- **Missing Protection:** Auth gate regression lock for `listQrLinksByOrganization`, `listQrLinksByLocation`, `listQrLinksByProfile`. Previously these were unauthenticated reads (VENOM V-002). No test locks the assertion calls in place.
- **Regression Risk:** If `assertActorCanManageOrganization`, `assertActorCanManageLocation`, or `assertActorOwnsVportActor` are removed or weakened, any caller can enumerate QR links for any VPORT/org/location — exposing business analytics data without authorization.
- **Recommended Tests:** Mock all assert controllers to throw; verify each list function propagates the rejection without calling the DAL. Also test authorized paths succeed and return `mapQrLinkRows` output.
- **Recommended Owner:** Wolverine
- **Release Impact:** BLOCKED — security gate added but not locked by any test
- **Recommended Handoff:** VENOM (trust boundary — unauthenticated read → gated read regression risk)

---

**SPIDER-MAN TEST FINDING**

- **Finding ID:** SPM-S2-002
- **File / Flow:** `apps/VCSM/src/lib/qrUrlBuilders.js` — `isQrSafeSlug` + all builders
- **Application Scope:** VCSM
- **Coverage Type:** LIB + REGRESSION
- **Coverage Status:** MISSING
- **Severity:** CRITICAL
- **Evidence Type:** OBSERVED
- **Confidence:** HIGH
- **Current Protection:** None
- **Missing Protection:** `isQrSafeSlug` UUID rejection; all four builder functions' UUID guard (`buildReviewsQrUrl`, `buildBusinessCardQrUrl`, `buildMenuQrUrl`, `buildMenuShortDisplayUrl`).
- **Regression Risk:** This is pure utility code with no side effects — it is the easiest test to write and the highest-impact regression to miss. A broken `isQrSafeSlug` means UUID-containing QR codes are generated and physically printed. Recovery requires recalling printed materials.
- **Recommended Tests:** 14 targeted unit tests (see Surface 6 above). Pure functions, no mocks needed. 10-minute write time for Wolverine.
- **Recommended Owner:** Wolverine
- **Release Impact:** BLOCKED — UUID-in-QR prevention has no regression test; physical printed media is the attack surface
- **Recommended Handoff:** BLACKWIDOW (replay test — generate QR with UUID input before guard was added)

---

**SPIDER-MAN TEST FINDING**

- **Finding ID:** SPM-S2-003
- **File / Flow:** `apps/VCSM/src/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerScreen.jsx` — auth gate
- **Application Scope:** VCSM
- **Coverage Type:** COMPONENT + AUTH GATE
- **Coverage Status:** MISSING
- **Severity:** CRITICAL
- **Evidence Type:** OBSERVED
- **Confidence:** HIGH
- **Current Protection:** None
- **Missing Protection:** Ownership gate behavior — unauthenticated access, non-owner access, correct pass-through to view when owner is verified (VENOM V-008).
- **Regression Risk:** Removal of the `useVportOwnership` call or the `!isOwner` guard allows any logged-in user to access and print marketing materials for a competitor's VPORT. The gate is client-side only (correct for this screen type) but must remain present.
- **Recommended Tests:** Mount with React Testing Library using jsdom environment; mock `useIdentity` and `useVportOwnership`; assert gate states match expected render output for: (a) loading, (b) unauthenticated, (c) non-owner, (d) owner.
- **Recommended Owner:** Wolverine
- **Release Impact:** BLOCKED — auth gate for flyer generation has no behavioral test
- **Recommended Handoff:** VENOM (client-side auth gate regression)

---

**SPIDER-MAN TEST FINDING**

- **Finding ID:** SPM-S2-004
- **File / Flow:** `apps/VCSM/src/features/public/vportMenu/model/vportPublicDetails.model.js` — `raw` field removal
- **Application Scope:** VCSM
- **Coverage Type:** MODEL + REGRESSION
- **Coverage Status:** MISSING
- **Severity:** HIGH
- **Evidence Type:** OBSERVED
- **Confidence:** HIGH
- **Current Protection:** None
- **Missing Protection:** Confirmation that `raw: row` is absent from all return paths; confirmation that `profile_id`, `lat`, `lng` are not present in returned `details`; `toSafeUrl` and `toSafePhone` sanitation contracts.
- **Regression Risk:** The model now maps 10+ explicit fields with fallback chains and URL/phone sanitation. Pure functions with no side effects — any regression in `toSafeUrl` (allowing `data:` or `javascript:` URIs) or the raw field leak is a VENOM V-001 regression.
- **Recommended Tests:** Pure unit tests — no mocks. Cover null input, raw field absence, URL sanitation, phone sanitation, avatar/logo collision logic.
- **Recommended Owner:** Wolverine
- **Release Impact:** WATCH → BLOCKED if `toSafeUrl` sanitation is untested before ship
- **Recommended Handoff:** VENOM (data: URI or raw field leak in model output)

---

**SPIDER-MAN TEST FINDING**

- **Finding ID:** SPM-S2-005
- **File / Flow:** `apps/VCSM/src/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerView.jsx` — UUID guard (`isQrSafe`)
- **Application Scope:** VCSM
- **Coverage Type:** COMPONENT + REGRESSION
- **Coverage Status:** MISSING
- **Severity:** HIGH
- **Evidence Type:** OBSERVED
- **Confidence:** HIGH
- **Current Protection:** None
- **Missing Protection:** `isQrSafe` computed correctly from `canonicalSlug`; Print button disabled state; flyer body gating on `isQrSafe`; `onBack` routing (never `/vport/${uuid}`).
- **Regression Risk:** The UUID_RE pattern is redeclared locally in this view (not imported from `qrUrlBuilders.isQrSafeSlug`). If the pattern drifts from the canonical one, or if `isQrSafe` conditional is removed, the flyer renders and the Print button enables with a UUID-containing QR code embedded.
- **Recommended Tests:** Mount with jsdom; mock `useActorCanonicalSlug` to return UUID → assert Print disabled and body shows placeholder. Mock with valid slug → assert Print enabled. Mock `onBack` with/without slug and assert navigate path.
- **Recommended Owner:** Wolverine
- **Release Impact:** WATCH → upgrade to BLOCKED when considered alongside SPM-S2-002 (defense-in-depth gap)
- **Recommended Handoff:** BLACKWIDOW (UUID in QR code replay scenario)

---

**SPIDER-MAN TEST FINDING**

- **Finding ID:** SPM-S2-006
- **File / Flow:** `apps/VCSM/src/features/booking/dal/getVportProfileIdByActorId.dal.js` + `resolveVportProfileId.controller.js`
- **Application Scope:** VCSM
- **Coverage Type:** DAL + CONTROLLER
- **Coverage Status:** MISSING
- **Severity:** HIGH
- **Evidence Type:** OBSERVED
- **Confidence:** HIGH
- **Current Protection:** None
- **Missing Protection:** Null return on missing actorId; null return on DB error (not throw); correct id extraction from `data?.id`; controller delegates to DAL without transformation.
- **Regression Risk:** `useQrLinks` depends on null-return semantics — if the DAL throws instead of returning null, the hook's try/catch absorbs it silently, leaving `qrLinks: []` indefinitely without error state. The null-return contract must be locked.
- **Recommended Tests:** Mock Supabase client; test null actorId → null; test DB error → null; test successful row → correct id; test missing data → null.
- **Recommended Owner:** Wolverine
- **Release Impact:** WATCH
- **Recommended Handoff:** LOKI (silent null vs throw contract in async hook)

---

**SPIDER-MAN TEST FINDING**

- **Finding ID:** SPM-S2-007
- **File / Flow:** `apps/VCSM/src/features/booking/hooks/useQrLinks.js` — actorId-only identity surface
- **Application Scope:** VCSM
- **Coverage Type:** HOOK + REGRESSION
- **Coverage Status:** MISSING
- **Severity:** HIGH
- **Evidence Type:** OBSERVED
- **Confidence:** HIGH
- **Current Protection:** None
- **Missing Protection:** Confirmation that `profileId` and `organizationId` are never accepted as public parameters; confirmation that `requestActorId` passed to engine is the same as the input `actorId` (not the resolved profileId); cache invalidation on actorId change.
- **Regression Risk:** VENOM V-003 requires that the hook surface never expose or accept internal identity types. A regression accepting `profileId` re-leaks the internal identity surface. A regression passing `profileId` as `requestActorId` breaks the engine's ownership assertion (engine expects the actor ID for `assertActorOwnsVportActor`, not the profile ID).
- **Recommended Tests:** Render hook with `@testing-library/react-hooks`; assert `resolveVportProfileIdController` is called with `actorId`; assert `listQrLinksByProfile` is called with `{ requestActorId: actorId, profileId: resolvedId }` — not `{ requestActorId: resolvedId }`.
- **Recommended Owner:** Wolverine
- **Release Impact:** WATCH
- **Recommended Handoff:** VENOM (identity surface leak — actor vs profile identity confusion)

---

## Recommended Test Priorities

Priority order by security impact:

| Priority | Finding | File | Why First | Est. Effort |
|---|---|---|---|---|
| 1 | SPM-S2-002 | `qrUrlBuilders.js` | Pure functions, 14 tests, 10 min. UUID-in-QR is physical media risk. | XS |
| 2 | SPM-S2-001 | `listQrLinks.controller.js` (engine) | Locks VENOM V-002 auth gate across all 3 list functions | S |
| 3 | SPM-S2-003 | `VportActorMenuFlyerScreen.jsx` | Locks VENOM V-008 ownership gate for flyer generation | S |
| 4 | SPM-S2-004 | `vportPublicDetails.model.js` | Pure model, no mocks. Locks `raw` field and URL sanitization | M |
| 5 | SPM-S2-006 | `getVportProfileIdByActorId.dal.js` + `resolveVportProfileId.controller.js` | Foundation of VENOM V-003 — null contract must be locked | S |
| 6 | SPM-S2-007 | `useQrLinks.js` | Locks identity surface contract end-to-end | M |
| 7 | SPM-S2-005 | `VportActorMenuFlyerView.jsx` | UUID guard + onBack routing | M |

---

## Handoff Matrix

| Finding | Recommended Handoff | Reason |
|---|---|---|
| SPM-S2-001 | VENOM | Unauthenticated-to-gated read regression on QR link listing |
| SPM-S2-002 | BLACKWIDOW | Replay test: generate QR with UUID input, verify builder blocks it |
| SPM-S2-003 | VENOM | Client-side auth gate regression for flyer generation |
| SPM-S2-004 | VENOM | Data URI / raw field leak via model regression |
| SPM-S2-005 | BLACKWIDOW | UUID in printed QR code replay scenario |
| SPM-S2-006 | LOKI | Silent null vs throw semantics in async hook chain |
| SPM-S2-007 | VENOM | Identity surface leak — actor vs profile ID confusion |

---

## Combined Branch Status (this session + prior session)

This session adds 7 new findings to the 7 from the prior report.

| Session | Critical | High | Medium |
|---|---|---|---|
| Prior (2026-05-26) | 4 | 3 | 1 |
| Current (2026-05-27) | 3 | 4 | 0 |
| **Branch total** | **7** | **7** | **1** |

---

## Final SPIDER-MAN Status

```
██████████████████████████████████████████████████████████
  SPIDER-MAN STATUS: BLOCKED

  7 CRITICAL findings across 2 sessions — zero regression tests
  7 HIGH findings — zero regression tests

  This branch remediates VENOM V-001 through V-008.
  Not one of these fixes has a regression test.

  Minimum safe bar before merge:
    SPM-S2-002  qrUrlBuilders (pure functions — 10 min)
    SPM-S2-001  listQrLinks engine auth gate
    SPM-S2-003  VportActorMenuFlyerScreen auth gate
    SPM-003     assertActorOwnsVportActor (from prior report)
    SPM-004     vportLeads controller (VPD-V-016, from prior report)

  Without these 5 test files, the branch ships security fixes
  with no protection against future regression.
██████████████████████████████████████████████████████████
```

**BLOCKED** — 3 new CRITICAL findings added by this session's security remediation work. None of the VENOM V-001 through V-008 fixes have regression locks. Wolverine must write Priority 1–3 from this report and Priority 1–2 from the prior report before this branch is safe to merge.
