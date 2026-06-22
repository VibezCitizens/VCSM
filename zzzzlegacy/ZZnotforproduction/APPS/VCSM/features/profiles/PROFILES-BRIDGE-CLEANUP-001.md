# PROFILES-BRIDGE-CLEANUP-001 — Remove Dead Bridges & Ownership Round-Trip

```
[PROFILES-BRIDGE-CLEANUP-001] Remove dead gas adapters + retire ownership.adapter round-trip
Status: Complete (IMPLEMENTED)
Priority: P2
Type: ARCHITECTURE / cleanup
App: VCSM
Implements: PROFILES-BRIDGE-AUDIT-001 findings (dead bridges + ownership round-trip)
Date: 2026-06-08
```

> **Result: PASS.** Deleted 7 dead-weight files (6 orphaned gas adapters + the `ownership.adapter`
> round-trip), repointed 6 vportDashboard consumers to the canonical `checkVportOwnership.controller`,
> preserved `VportGasPricesView.adapter` (live). Behavior unchanged; lint clean. No bridge LEAK remains.

---

## Deliverable A — Dead Gas Adapter Removal

Re-verified consumer counts immediately before deletion:

| File | Consumers |
|---|---|
| `adapters/kinds/vport/hooks/gas/useVportGasPrices.adapter.js` | 0 → **deleted** |
| `adapters/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion.adapter.js` | 0 → **deleted** |
| `adapters/kinds/vport/hooks/gas/useOwnerPendingSuggestions.adapter.js` | 0 → **deleted** |
| `adapters/kinds/vport/screens/gas/components/GasPricesPanel.adapter.js` | 0 → **deleted** |
| `adapters/kinds/vport/screens/gas/components/GasStates.adapter.js` | 0 → **deleted** |
| `adapters/kinds/vport/screens/gas/components/OwnerPendingSuggestionsList.adapter.js` | 0 → **deleted** |
| `adapters/kinds/vport/screens/gas/VportGasPricesView.adapter.js` | 1 (`tabs/gas/VportGasTab.jsx`) → **PRESERVED** |

Empty `hooks/gas/` and `screens/gas/components/` directories removed.

## Deliverable B — ownership.adapter Consumers (before)

`adapters/kinds/vport/ownership.adapter.js` — re-exported `checkVportOwnershipController` from
vportDashboard; consumed **only by vportDashboard** (the self-referential round-trip):

| Consumer | Line(s) |
|---|---|
| `vportDashboard/.../gasprices/controller/reviewFuelPriceSuggestion.controller.js` | 8 |
| `vportDashboard/.../gasprices/controller/updateStationFuelUnit.controller.js` | 2 |
| `vportDashboard/.../gasprices/controller/submitOwnerFuelPriceUpdate.controller.js` | 6 |
| `vportDashboard/.../gasprices/controller/publishFuelPriceUpdateAsPost.controller.js` | 7 |
| `vportDashboard/.../gasprices/__tests__/submitFuelPriceSuggestion.controller.test.js` | 98 (`vi.mock`), 115 (import) |

Total: **6 references** across 5 files.

## Deliverable C — Consumer Repoint

All 6 references repointed:
```
@/features/profiles/adapters/kinds/vport/ownership.adapter
  →  @/features/vportDashboard/controller/checkVportOwnership.controller
```
**Target choice:** the vportDashboard **controller** (not its multi-export `vportDashboard.adapter`) —
because the test wholesale-`vi.mock`s the module; mocking the large adapter would clobber its other
exports. The controller is the canonical single source the adapter itself re-exports, so the symbol,
args, return shape, ownership semantics, and telemetry are identical. No authority/redesign change.

## Deliverable D — Verification

| | Before | After |
|---|---|---|
| ownership.adapter consumers | 6 | **0** (file deleted) |
| dead gas adapters | 6 | **0** (deleted) |
| VportGasPricesView.adapter | live (1) | live (1) — preserved |

- `rg ownership.adapter` (profiles + vportDashboard) → **NONE** ✓
- `rg` the 6 deleted gas adapters (whole src) → **NONE** ✓
- `VportGasPricesView.adapter` still consumed by `VportGasTab` ✓
- new `checkVportOwnership.controller` target exists ✓
- **ESLint:** 5 changed files clean (exit 0)
- **Test:** affected gasprices test could **not run in this environment** (`supabaseClient.createClient()` needs env vars absent here; fails at import/setup via `vportClient.js`, unrelated to the import swap). Not run — stated explicitly.

## Deliverable E — Extraction Readiness Update

Remaining profiles-vport outward bridges:

| Bridge | Class | Blocks EXTRACT-VPORT? |
|---|---|---|
| `VportGasPricesView.adapter` (gas) | FACADE | No |
| owner-stats / team / booking / schedule | FACADE | No |
| booking `assertActorOwnsVportActorController` ×13 | COMPATIBILITY (→ authorization; repoint later) | No |
| ~~`ownership.adapter` round-trip~~ | **LEAK — REMOVED** | — |

**No LEAK remains. No bridge blocks PROFILES-EXTRACT-VPORT-001.**

---

## Implementation Return
- Files deleted: 7 (ownership.adapter + 6 gas adapters)
- Files modified: 5 (4 gasprices controllers + 1 test; 6 reference edits)
- Consumers repointed: 6 → `vportDashboard/controller/checkVportOwnership.controller`
- Lint: clean (exit 0) on changed files
- Behavior changed? No (pure import-path swap to the same symbol)
- Remaining bridges: facades (keep) + booking-assert ×13 (future repoint to authorization)
- **PASS**

---

*Implementation complete. Constraints honored: no ownership-authority / booking-wrapper / identity / runtime changes; no unrelated cleanup.*
