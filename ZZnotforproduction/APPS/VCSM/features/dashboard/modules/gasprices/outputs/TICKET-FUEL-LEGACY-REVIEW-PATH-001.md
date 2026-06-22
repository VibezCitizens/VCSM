# TICKET-FUEL-LEGACY-REVIEW-PATH-001

Status: Complete (promoted to implementation — deletion/export cleanup only)
Priority: P2
Type: ENG
App: VCSM
Module: vportDashboard / dashboard / cards / gasprices
Opened by: ELEKTRA E-1 / E-2 (under TICKET-SEC-GASFUEL-REVIEW-001)

---

## Implementation result (deletion / export cleanup)

Deleted: `reviewFuelPriceSuggestion.controller.js`, `useOwnerPendingSuggestions.js`,
`useAfterSubmitSuggestion.js`, `OwnerPendingSuggestionsList.jsx`,
`OwnerSuggestionReviewCard.jsx`, `vportFuelPriceReviews.write.dal.js` (all 3 fns:
`createFuelPriceSubmissionReviewDAL`, `updateFuelPriceSubmissionStatusDAL`,
`markFuelPriceSubmissionReviewAppliedDAL` — legacy controller was their only consumer).

Edited (export/wiring only): `VportDashboardGasView.jsx` (removed dormant cascade),
`gasprices/index.js` barrel (5 exports), `vportDashboard.adapter.js` (2 exports),
`gasprices.spiderman.test.js` (flipped 2 assertions to `.not.toContain` guards;
dropped read of deleted controller), `vportFuelPriceSubmissions.read.dal.js`
(stale comment fixed).

NOT touched (kept by scope): batch RPC path, batch review controller, batch
grouping, stale protection, RLS, schema, owner-direct update, citizen submission,
notifications. `fetchFuelPriceSubmissionByIdDAL` kept (has its own column test).
`resolveActorIdFromProfileId` kept (lives in active read DAL; now production-dead
but out of "review DAL" scope — documented residual). `afterSubmitSuggestion`
optional prop plumbing left in 4 citizen-submit components (defaults null, no longer
fed) to avoid modifying the submission flow — documented residual.

Verification: grep clean (no dangling refs); esbuild bundles barrel + view + adapter
(exit 0, no missing modules); targeted tests 27 passed; full gasprices folder shows
only the 3 pre-existing env failures (unchanged).

---

## Goal

Inventory the **legacy single-submission fuel-price review path** and its dead
review DALs, map every export/importer, and propose a removal plan. This ticket
is **review only** — do not remove or modify any legacy code under it.

## Context

The active owner review surface uses the **batch** path:
`OwnerPendingBatchList` → `useReviewFuelPriceBatch` → `reviewFuelPriceBatch.controller`
→ SECURITY DEFINER RPCs (`approve/reject_fuel_price_submission_batch`), which are
atomic, ownership-enforced, and **stale-aware** (`stale_skipped_count`).

A second, older **single-submission** path still exists in the tree. It performs
app-layer ownership + **direct table upsert with NO stale guard**, and its review
UI is no longer mounted. It is divergent from the active path and weaker; if
re-mounted it would reintroduce the stale-overwrite gap. DB-side it is now also
provably inert for the post-apply UPDATE (see reviews RLS below).

---

## Inventory — Legacy single-review path

### Controller
- `controller/reviewFuelPriceSuggestion.controller.js`
  - `reviewFuelPriceSuggestionController(...)`
  - App-layer ownership via `checkVportOwnershipController`; on approve it calls
    `upsertVportFuelPriceDAL` directly. **No `approved_submission_at` / stale check.**

### Hook
- `hooks/useOwnerPendingSuggestions.js` — `useOwnerPendingSuggestions({ identity, onRefresh })`
  - Exposes `reviewSuggestion`, the only caller of the legacy controller.

### Cascade hook that reaches the legacy path
- `hooks/useAfterSubmitSuggestion.js` — `useAfterSubmitSuggestion(...)`
  - Calls `reviewSuggestionAndRefresh` (→ legacy controller) with
    `decision: "approved"`. On the active dashboard this is **dormant**: the owner
    submit path returns no `submission.id`, so `afterSubmitSuggestion` no-ops.

### UI components (not mounted in the active view)
- `components/OwnerPendingSuggestionsList.jsx`
- `components/OwnerSuggestionReviewCard.jsx`
  - The active `VportDashboardPendingGasPanel` renders `OwnerPendingBatchList`
    instead. These two are exported but not rendered on the active surface.

## Inventory — Dead review DAL(s)

- `dal/vportFuelPriceReviews.write.dal.js`
  - `markFuelPriceSubmissionReviewAppliedDAL(...)` — **no consumers** anywhere in
    `src/`. Issues an UPDATE on `vport.fuel_price_submission_reviews`, which is
    **default-denied** by RLS (verified live: only INSERT/SELECT policies exist,
    no UPDATE policy) — so it is both dead and inert.
  - `createFuelPriceSubmissionReviewDAL` and `updateFuelPriceSubmissionStatusDAL`
    in this same file are **still used by the legacy controller** — they are NOT
    independently dead and must be assessed together with the controller.

---

## Exports / Importers map

| Symbol | Defined in | Re-exported via | Active importer? |
|---|---|---|---|
| `reviewFuelPriceSuggestionController` | `controller/reviewFuelPriceSuggestion.controller.js` | — | Only `useOwnerPendingSuggestions` |
| `useOwnerPendingSuggestions` | `hooks/useOwnerPendingSuggestions.js` | `gasprices/index.js`, `vportDashboard.adapter.js` | `VportDashboardGasView` (wired, but routed through dormant `useAfterSubmitSuggestion`) |
| `OwnerPendingSuggestionsList` | `components/OwnerPendingSuggestionsList.jsx` | `gasprices/index.js`, `vportDashboard.adapter.js` | Not mounted |
| `OwnerSuggestionReviewCard` | `components/OwnerSuggestionReviewCard.jsx` | `gasprices/index.js` | Only by `OwnerPendingSuggestionsList` |
| `markFuelPriceSubmissionReviewAppliedDAL` | `dal/vportFuelPriceReviews.write.dal.js` | — | **None** |

> Note: `vportDashboard.adapter.js` re-exports `useOwnerPendingSuggestions` and
> `OwnerPendingSuggestionsList` on the public feature surface. Removal must update
> the adapter and the module `index.js` barrel to avoid dangling exports.

---

## Proposed removal plan (for a future implementation ticket — not this one)

1. Confirm zero external importers of the adapter-surfaced legacy symbols
   (`useOwnerPendingSuggestions`, `OwnerPendingSuggestionsList`) outside the
   gasprices module. (Quick grep across `apps/VCSM/src`.)
2. Remove the dormant cascade wiring in `VportDashboardGasView`:
   `useOwnerPendingSuggestions`, `useAfterSubmitSuggestion`, and the
   `afterSubmitSuggestion` prop passed into the official panel — verify the owner
   submit + batch review flows are unaffected (they do not depend on it).
3. Delete the legacy controller `reviewFuelPriceSuggestion.controller.js` and the
   hook `useOwnerPendingSuggestions.js`.
4. Delete the unmounted UI: `OwnerPendingSuggestionsList.jsx`,
   `OwnerSuggestionReviewCard.jsx`.
5. Delete dead `markFuelPriceSubmissionReviewAppliedDAL`. Re-evaluate
   `createFuelPriceSubmissionReviewDAL` / `updateFuelPriceSubmissionStatusDAL`:
   if the legacy controller was their only caller, remove them too; otherwise keep.
6. Remove the corresponding barrel + adapter exports (`index.js`,
   `vportDashboard.adapter.js`).
7. Update / remove any tests that target the legacy path; add a guard test
   asserting the single-review controller no longer exists (optional).
8. SECURITY.md + TESTS.md for the gasprices module: note the legacy path retired.

## Constraints carried into the implementation ticket
- Do NOT alter the batch RPC path, grouping, stale protection, RLS, or schema.
- Do NOT change `markFuelPriceSubmissionReviewAppliedDAL` behavior before deleting
  it (it is already DB-inert; deletion is the action, not modification).
- Pure deletion + export cleanup only; no behavior change to the active surface.

## Evidence references
- Security review: `TICKET-SEC-GASFUEL-REVIEW-001` (VENOM/BW/ELEKTRA, this session).
- Live RLS dump: `fuel_price_submission_reviews` has INSERT(owner) + SELECT(manager/submitter)
  only — no UPDATE/DELETE → append-only, confirming the dead DAL is inert.
