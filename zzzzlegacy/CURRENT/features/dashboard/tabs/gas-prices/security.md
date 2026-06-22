# Tab: gas-prices — Security

**Last Updated:** 2026-05-27
**VENOM Status:** COMPLETE — See `governance/venom/2026-05-27_venom_vport-gas-tab.md`

## Security Findings Summary (VENOM 2026-05-27)

| ID | Finding | Severity | Status |
|---|---|---|---|
| VENOM-GAS-001 | No ownership rejection regression test | HIGH (coverage) | RESOLVED — 18 tests written |
| VENOM-GAS-002 | Hook advisory `isOwner` naming could mislead future devs | LOW | OPEN |

## Confirmed Trust Boundary Model

```
useSubmitFuelPriceSuggestion
  → isOwner = String(me.actorId) === String(targetActorId)  [ADVISORY — string compare]
  → submitFuelPriceSuggestionController({ ownerUpdate: isOwner, ... })

submitFuelPriceSuggestion.controller.js
  OWNER PATH (ownerUpdate: true):
    → checkVportOwnershipController({ callerActorId, targetActorId })  [DB-backed via actor_owners]
    → if (!isOwner) return { ok: false, reason: "not_owner" }
    → upsertVportFuelPriceDAL + createVportFuelPriceHistoryDAL
    → invalidateFuelPriceCache(targetActorId)

  CITIZEN PATH (ownerUpdate: false):
    → createFuelPriceSubmissionDAL  [separate suggestions table — no price write]
```

## Key Security Properties
- Malicious actor setting `ownerUpdate: true` is STILL rejected by DB ownership check
- Hook string comparison is an optimization, not an authority
- Citizen path has NO direct price write capability
- Cache invalidated on every owner write
