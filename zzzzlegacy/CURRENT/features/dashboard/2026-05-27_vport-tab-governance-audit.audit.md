# Task Audit — vport-tab-governance-audit
**Date:** 2026-05-27
**Scope:** VCSM
**Task:** Run 5 highest-risk governance audit commands against VPORT tabs (ARCHITECT ×2, VENOM ×3, SPIDER-MAN ×1)
**Tracker:** `zNOTFORPRODUCTION/_ACTIVE/planning/may/27/27-12.md`

---

## Command Execution Log

| # | Command | Target | Status | Severity | Report |
|---|---|---|---|---|---|
| 1 | ARCHITECT | DTAB-001 Duplicate Registry | COMPLETE | MEDIUM | `governance/architect/2026-05-27_architect_vport-dtab-001-duplicate-registry.md` |
| 2 | ARCHITECT | DTAB-006 Adapter Boundary | COMPLETE | MODERATE DRIFT | `governance/architect/2026-05-27_architect_vport-dtab-006-adapter-boundary.md` |
| 3 | VENOM | Book tab | COMPLETE | MEDIUM | `governance/venom/2026-05-27_venom_vport-book-tab.md` |
| 4 | VENOM | Owner tab injection gate | COMPLETE | LOW | `governance/venom/2026-05-27_venom_vport-owner-tab.md` |
| 5 | VENOM | Gas tab trust boundary | COMPLETE | MEDIUM | `governance/venom/2026-05-27_venom_vport-gas-tab.md` |
| 6 | SPIDER-MAN | Gas tab regression tests | COMPLETE | HIGH (coverage gap) | Test file written |

---

## ARCHITECT — DTAB-001

**Date:** 2026-05-27
**Reviewer:** ARCHITECT
**Trigger:** Duplicate registry risk — two files export `getVportTabsByType` with different implementations

### Finding

**Files Inspected:**
- `apps/VCSM/src/features/profiles/kinds/vport/vportTypeRegistry.js`
- `apps/VCSM/src/features/profiles/kinds/vport/model/getVportTabsByType.model.js`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx`
- `apps/VCSM/src/dev/diagnostics/groups/profilesKindsFeature.group.js`

**Summary:**
Two separate files export a function named `getVportTabsByType`. They are not equivalent.

| Property | `vportTypeRegistry.js` | `getVportTabsByType.model.js` |
|---|---|---|
| Group entries | 3 | 12 |
| Type overrides | 2 (gas, exchange) | 5 (gas, exchange, barber, barbershop, locksmith) |
| "Beauty & Wellness" → | `VPORT_SERVICE_TABS` | `VPORT_SERVICE_BOOK_TABS` |
| Used by VportProfileViewScreen | NO | YES (line 22) |
| Active importers | 1 (dev diagnostics only) | Production code |

**Critical Divergence:**
"Beauty & Wellness" maps to `VPORT_SERVICE_TABS` in the registry and `VPORT_SERVICE_BOOK_TABS` in the canonical model. These have different tab sets — the model includes a `book` tab; the registry does not. Any dev who imports from `vportTypeRegistry.js` in a production context gets incorrect, incomplete tab layouts for 73+ VPORT types.

**Active Importer of vportTypeRegistry.js:**
```
apps/VCSM/src/dev/diagnostics/groups/profilesKindsFeature.group.js:4
```
This is a DEV-ONLY diagnostics panel — not in any production code path.

**Risk Level:** MEDIUM
- No production impact today (registry not imported in production)
- Risk materializes if any developer imports `vportTypeRegistry.js` in a feature file by mistake (same function name, different behavior)
- Diagnostics panel would show incorrect tab data for affected types

**Recommendation:**
1. Add a deprecation comment to `vportTypeRegistry.js` immediately
2. Update `profilesKindsFeature.group.js` to import from the canonical model
3. Schedule deletion of `vportTypeRegistry.js` after DTAB-001 review approval

**ARCHITECT Status:** FINDING — MEDIUM risk drift — not blocking

---

## ARCHITECT — DTAB-006

**Date:** 2026-05-27
**Reviewer:** ARCHITECT
**Trigger:** Booking adapter boundary — VportProfileTabContent.jsx direct import pattern

### Finding

**Files Inspected:**
- `apps/VCSM/src/features/profiles/kinds/vport/screens/components/VportProfileTabContent.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/view/VportBookingView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/barbershop/VportBarberShopBookingView.jsx`

**Summary:**
`VportProfileTabContent.jsx` imports ALL 15+ tab view components directly with no adapter boundary layer. Every cross-sub-feature import is a hard `@/features/profiles/kinds/vport/screens/...` path.

**Boundary Type:** This violation is WITHIN a single protected root (`apps/VCSM/`). It is NOT a cross-root violation. However, it does cross sub-feature boundaries between:
- `profiles/kinds/vport/screens/components/` (the tab container)
- `profiles/kinds/vport/screens/booking/` (booking sub-feature)
- `profiles/kinds/vport/screens/barbershop/` (barbershop sub-feature)
- `profiles/kinds/vport/screens/gas/` (gas sub-feature)
- `profiles/kinds/vport/screens/views/tabs/` (generic tab views)

**Pattern observed (lines 9-30):**
```js
import VportBookingView from "@/features/profiles/kinds/vport/screens/views/tabs/VportBookingView";
import VportBarberShopBookingView from "@/features/profiles/kinds/vport/screens/barbershop/VportBarberShopBookingView";
// + 13 more direct imports
```

**Risk Assessment:**
- MODERATE DRIFT: Component boundary discipline is eroded. Any refactoring of sub-feature paths will break the tab container.
- There is a thin wrapper at `screens/views/tabs/VportBookingView.jsx` that re-exports the real booking view — this IS an informal adapter, but it's inconsistently applied only to booking (not barbershop, gas, menu, etc.)
- `VportBarberShopBookingView` imported directly from barbershop sub-directory, bypassing any wrapper layer

**Drift Level:** MODERATE DRIFT
**Severity:** MEDIUM

**Recommendation:**
- Extend the `screens/views/tabs/` pattern to all sub-feature tab views (formalize it as the tab-view adapter layer)
- OR create a `VportTabViews` barrel file at `screens/views/tabs/index.js` that acts as the single import surface for `VportProfileTabContent.jsx`
- Defer to SENTRY for full boundary review if refactoring planned

**ARCHITECT Status:** FINDING — MODERATE DRIFT — not blocking release but should be tracked

---

## VENOM — Book Tab

**Date:** 2026-05-27
**Reviewer:** VENOM
**Trigger:** Highest-risk unaudited tab — booking write path, no prior security review

### Trace Chain

```
VportPublicBookingFlow.jsx
  → useVportPublicBooking hook (line 239: await createBooking({...}))
  → useVportBookingOps() → createVportPublicBookingController
  → createVportPublicBookingController (vportPublicBooking.controller.js)
    → getVportResourceByIdDAL  (resolves resource, gets profile_id from DB)
    → readActorVportLinkDAL    (validates requestActorId kind = "user")
    → getVportServiceByIdDAL   (resolves service label from DB)
    → insertVportBookingDAL    (insert with server-resolved profile_id)
    → publishVcsmNotificationBatch (fire-and-forget)
```

### Security Findings

**STRENGTHS (verified):**

| Check | Status | Evidence |
|---|---|---|
| `customer_actor_id` forced from server-resolved requestActor | PASS | Line 84: `customer_actor_id: requestActorId ?? null` — comment VPD-V-019 |
| `profile_id` from DB resource, not caller-supplied | PASS | Line 79: `profile_id: resource.profile_id` |
| Service label resolved from DB | PASS | Lines 68-74: `getVportServiceByIdDAL` — comment VPD-V-019 |
| Past-time booking rejected | PASS | Line 63: `new Date(startsAt).getTime() <= Date.now()` throws |
| Only `kind: "user"` citizens can book | PASS | Lines 58-61: `actor.kind !== "user"` throws |
| Guest booking (null requestActorId) intentional | PASS | Lines 54-61 comment |
| `serviceLabelSnapshot` not trusted from client | PASS | Client-supplied `serviceLabelSnapshot` in hook is IGNORED by controller |
| `linkPath: null` in notification to prevent VPORT UUID leak | PASS | Line 116 comment VPD-V-020 |

**GAPS:**

| ID | Finding | Severity | Detail |
|---|---|---|---|
| VENOM-BOOK-001 | No slot collision check before insert | MEDIUM | `createVportPublicBookingController` does not verify the selected time slot is still free before calling `insertVportBookingDAL`. Simultaneous submissions for the same slot will both succeed unless DB has unique constraint on (resource_id, starts_at). No SELECT FOR UPDATE or equivalent. |
| VENOM-BOOK-002 | No regression test for kind-gate enforcement | MEDIUM | No test verifying that a VPORT actor (kind="vport") attempting to book is rejected with "Switch to your citizen profile to book." |
| VENOM-BOOK-003 | `customerName` and `customerNote` stored unsanitized | LOW | Both fields are caller-supplied text stored directly into the bookings table. Low risk in closed system but worth noting. |

### VENOM Status: PARTIAL — MEDIUM gaps exist, not release-blocking but should have test coverage

---

## VENOM — Owner Tab

**Date:** 2026-05-27
**Reviewer:** VENOM
**Trigger:** Injection gate audit — can non-owners access the owner tab?

### Trace Chain

```
VportProfileViewScreen.jsx
  → isDirectMatch = viewerActorId === profileActorId (synchronous)
  → ownsViaAccount = useIsActorOwner(profileActorId) (async, DB-backed)
  → isOwner = isDirectMatch || ownsViaAccount
  → tabs = isOwner ? [...baseTabs, { key:"owner" }] : baseTabs.filter(t=>t.key!=="owner")

VportProfileTabContent.jsx
  → line 117: {tab === "owner" && isOwner ? <VportOwnerView actorId={...} /> : null}

VportOwnerView.jsx
  → renders ONLY: nav link to /dashboard, nav link to /settings
  → labeled "Private" in UI
  → NO sensitive data fetched or rendered
```

### Security Findings

| Check | Status | Detail |
|---|---|---|
| Owner tab only injected when `isOwner` | PASS | `VportProfileViewScreen.jsx` lines 105-109 — tab only added to array when `isOwner === true` |
| Tab content double-gated | PASS | `VportProfileTabContent.jsx` line 117: `tab === "owner" && isOwner` — content cannot render even if tab key is present without isOwner |
| `isDirectMatch` synchronous | PASS | Resolves immediately for own-profile views — no flash window for owner |
| `ownsViaAccount` DB-backed | PASS | `useIsActorOwner` performs DB lookup via ownership chain |
| `VportOwnerView` content is nav links only | PASS | Absolutely no sensitive data exposed — just links to /dashboard and /settings |
| actorId in VportOwnerView is already public | INFO | actorId is the public identifier — passing it to VportOwnerView is safe |

**GAPS:**

| ID | Finding | Severity | Detail |
|---|---|---|---|
| VENOM-OWNER-001 | No test for isOwner = false rendering | LOW | No test verifying that the owner tab renders nothing when `isOwner` is false (double-gate test) |
| VENOM-OWNER-002 | async `ownsViaAccount` race window for non-owners | INFO | During initial render before `ownsViaAccount` resolves, `isOwner` could briefly be `true` if `isDirectMatch` is true for a different reason. In practice, `isDirectMatch` compares `viewerActorId === profileActorId` which is synchronously correct. No real risk identified. |

### VENOM Status: COMPLETE — LOW risk — owner tab injection gate is sound

---

## VENOM — Gas Tab

**Date:** 2026-05-27
**Reviewer:** VENOM
**Trigger:** Price write path ownership audit — gas station fuel price update security

### Trace Chain

```
VportGasPricesView.jsx
  → useSubmitFuelPriceSuggestion({ actorId: vportActorId })
    → me = useIdentity()
    → isOwner = String(me.actorId) === String(targetActorId)  [ADVISORY ONLY — string compare]
  → onSubmit → submitFuelPriceSuggestionController({
      actorId: me.actorId,
      targetActorId,
      ownerUpdate: isOwner,   ← advisory flag — not trusted by controller
      ...priceData
    })

submitFuelPriceSuggestion.controller.js
  → if (!actorId) throw
  → if (!targetActorId) throw
  → if (ownerUpdate) {
      const isOwner = await checkVportOwnershipController({ callerActorId: actorId, targetActorId })
      if (!isOwner) return { ok: false, reason: "not_owner" }   ← DB-backed gate
      [official price write path]
      invalidateFuelPriceCache(targetActorId)
    }
  → else {
      [citizen suggestion path — no direct price write]
    }

ownership.adapter.js
  → export { checkVportOwnershipController } from "@/features/dashboard/vport/controller/checkVportOwnership.controller"
```

### Security Findings

| Check | Status | Detail |
|---|---|---|
| Controller ownership check is DB-backed | PASS | `checkVportOwnershipController` performs authoritative DB lookup |
| Hook string comparison is advisory only | PASS | Hook `isOwner` only determines the `ownerUpdate` flag — it does NOT gate the write |
| Controller re-checks ownership independently | PASS | Even if a malicious actor sets `ownerUpdate: true`, the controller's `checkVportOwnershipController` call will return false for a non-owner |
| Citizen path has no direct price write | PASS | Citizen path calls `createFuelPriceSubmissionDAL` — a separate table for suggestions, not the official price record |
| Cache invalidation on owner write | PASS | `invalidateFuelPriceCache(targetActorId)` called after successful owner write |
| actorId guard at controller entry | PASS | `if (!actorId) throw` |

**GAPS:**

| ID | Finding | Severity | Detail |
|---|---|---|---|
| VENOM-GAS-001 | No test for ownership rejection on owner path | HIGH | No regression test verifying that passing `ownerUpdate: true` with a non-owner `actorId` is rejected. If `checkVportOwnershipController` were removed or broken, this gate would silently fail. |
| VENOM-GAS-002 | Hook advisory `isOwner` could send wrong flag | LOW | If `useSubmitFuelPriceSuggestion` logic is ever changed to trust the flag rather than relay it, the trust boundary breaks. Current code is correct. |

### VENOM Status: COMPLETE — HIGH coverage gap (VENOM-GAS-001) addressed by SPIDER-MAN tests below

---

## SPIDER-MAN — Gas Tab Regression Tests

**Date:** 2026-05-27
**Reviewer:** SPIDER-MAN
**Trigger:** VENOM-GAS-001 — no test verifying ownership rejection on owner path

### Coverage Summary

**File:** `apps/VCSM/src/features/profiles/kinds/vport/controller/gas/__tests__/submitFuelPriceSuggestion.controller.test.js`

**Test Scenarios Written:**
1. Throws when `actorId` is missing
2. Throws when `targetActorId` is missing
3. Owner path: returns `{ok:false, reason:'not_owner'}` when `checkVportOwnershipController` returns false
4. Owner path: does NOT call the price write DAL when ownership check fails
5. Owner path: calls price write DAL on verified ownership
6. Owner path: calls `invalidateFuelPriceCache` after successful write
7. Owner path: does NOT call `invalidateFuelPriceCache` when write fails
8. Citizen path: calls `createFuelPriceSubmissionDAL` (suggestion, not price write)
9. Citizen path: validates suggestion data (rejects missing fuel type)

**SPIDER-MAN Status:** COMPLETE — critical ownership regression protected

---
