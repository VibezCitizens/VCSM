# VENOM Security Report — Gas Tab (Fuel Price Update)
**Date:** 2026-05-27
**Reviewer:** VENOM
**Application Scope:** VCSM
**Trigger:** Price write path ownership audit — can a non-owner perform an official fuel price update?

---

## Scope

The gas tab has two distinct write paths: (1) VPORT owner updating the official fuel price, (2) citizen submitting a price suggestion. This audit traces whether the owner path has an authoritative ownership gate that cannot be bypassed by a malicious actor manipulating the `ownerUpdate` advisory flag.

---

## Trace Chain

```
VportGasPricesView.jsx
  ↓
useSubmitFuelPriceSuggestion({ actorId: vportActorId })
  → me = useIdentity()
  → isOwner = String(me.actorId) === String(targetActorId)   [STRING COMPARISON — ADVISORY ONLY]
  → onSubmit → submitFuelPriceSuggestionController({
        actorId: me.actorId,
        targetActorId,
        ownerUpdate: isOwner,    ← ADVISORY FLAG — not the authority source
        fuelType, price, unit
      })
  ↓
submitFuelPriceSuggestion.controller.js
  → guard: if (!actorId) throw
  → guard: if (!targetActorId) throw
  → if (ownerUpdate) {
      const isOwner = await checkVportOwnershipController({
        callerActorId: actorId,
        targetActorId
      })                         ← DB-BACKED AUTHORITATIVE CHECK via ownership.adapter.js
      if (!isOwner) return { ok: false, reason: "not_owner" }
      [official price write + cache invalidation]
    }
  → else {
      [citizen suggestion path — separate table, no price write]
    }

ownership.adapter.js
  → export { checkVportOwnershipController }
    from "@/features/dashboard/vport/controller/checkVportOwnership.controller"
```

---

## Security Checklist

| Check | Result | Evidence |
|---|---|---|
| Controller ownership check is DB-backed (not UI-derived) | ✅ PASS | `checkVportOwnershipController` performs DB lookup via `actor_owners` |
| Hook `isOwner` string comparison is advisory only | ✅ PASS | Only determines `ownerUpdate` flag passed to controller — not authority |
| Controller independently re-validates ownership | ✅ PASS | `checkVportOwnershipController` called inside controller regardless of flag source |
| Non-owner with `ownerUpdate: true` is rejected | ✅ PASS | Controller's DB check returns false → `return { ok: false, reason: "not_owner" }` |
| Citizen path writes to separate table (suggestions) | ✅ PASS | `createFuelPriceSubmissionDAL` — not the official price record |
| `invalidateFuelPriceCache` called after owner write | ✅ PASS | After successful `checkVportOwnershipController` + write |
| actorId guard at controller entry | ✅ PASS | `if (!actorId) throw` |
| targetActorId guard at controller entry | ✅ PASS | `if (!targetActorId) throw` |
| Ownership adapter uses approved boundary pattern | ✅ PASS | Import via `features/profiles/adapters/kinds/vport/ownership.adapter.js` |

---

## Trust Boundary Analysis

**Hypothesis:** Can a malicious user bypass the owner write path by setting `ownerUpdate: true`?

**Answer: NO.**

The `ownerUpdate` flag is set by `useSubmitFuelPriceSuggestion` based on a string comparison of actorIds. However, `submitFuelPriceSuggestion.controller.js` does NOT trust this flag as the authorization source. When `ownerUpdate` is true, the controller performs its own independent DB-backed ownership check:

```js
const isOwner = await checkVportOwnershipController({ callerActorId: actorId, targetActorId });
if (!isOwner) return { ok: false, reason: "not_owner" };
```

A non-owner passing `ownerUpdate: true` would still fail this check. The flag only acts as a routing signal to enter the owner code branch — the branch immediately re-validates.

**Classification:** The hook-level string comparison is an optimization (UX routing, avoids DB call for obvious non-owners). The actual authority is the controller-level check. This is the correct pattern.

---

## VENOM Findings

### VENOM-GAS-001 — No Regression Test for Ownership Rejection
**Severity:** HIGH (coverage gap)
**Evidence Type:** OBSERVED
**Confidence:** HIGH

**Current behavior:** No test verifies that calling `submitFuelPriceSuggestionController` with `ownerUpdate: true` and a non-owner `actorId` returns `{ ok: false, reason: "not_owner" }` without executing the price write.

**Risk:** If `checkVportOwnershipController` is refactored, mocked incorrectly, or accidentally removed, the ownership gate silently disappears. No CI signal would catch this.

**This finding is addressed by SPIDER-MAN tests written in this audit session.**

---

### VENOM-GAS-002 — Hook Advisory isOwner Semantic Drift Risk
**Severity:** LOW
**Evidence Type:** HYPOTHESIS
**Confidence:** MEDIUM

**Current behavior:** `isOwner` in the hook is a string comparison used to set `ownerUpdate`. This is correct.

**Potential future risk:** If a developer reads the hook and assumes `isOwner` is authoritative (it's named `isOwner`, not `isOwnerHint`), they might use it to gate other write operations without the controller-level DB check.

**Recommendation:** Consider renaming to `isLikelyOwner` or `ownerHint` to signal its advisory nature in the hook's return value.

---

## VENOM Status

**COMPLETE — Gas tab ownership enforcement is sound. Critical path is properly defended. VENOM-GAS-001 (HIGH coverage gap) addressed by SPIDER-MAN regression tests.**

| Finding | Severity | Status |
|---|---|---|
| VENOM-GAS-001 — No ownership rejection test | HIGH | RESOLVED — tests written |
| VENOM-GAS-002 — Hook advisory naming drift | LOW | OPEN — advisory; consider rename in cleanup sprint |

**THOR Release Gate Assessment:** RELEASE APPROVED (gas tab security is sound; VENOM-GAS-001 resolved by tests)
