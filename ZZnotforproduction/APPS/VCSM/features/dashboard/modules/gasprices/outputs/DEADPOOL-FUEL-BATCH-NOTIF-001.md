# DEADPOOL — TICKET-FUEL-BATCH-NOTIF-001

Investigation: grouped VPORT gas-price notification card not populating after a fresh citizen multi-fuel submit.

## Root cause (prime suspect)
Batch notification published with `object_id = null` — the first VCSM notification ever to do so; every other (per-fuel gas, bookings) used a non-null object id. Insert failure was silently swallowed by fire-and-forget `publishVcsmNotification`.

## Fix applied (PATCH approved)
- `controller/notifyFuelPriceSubmissionBatch.controller.js` — `objectId: submissionBatchId ?? null`; await publish; return real boolean. No per-fuel change. No engine/DB/RPC/RLS/schema/migration change.

## Temporary debug probe (DEV-only, removable)
BUILDDED DEADPOOL ON FILE apps/VCSM/src/features/vportDashboard/dashboard/cards/gasprices/screens/VportGasPricesView.jsx

- `import.meta.env.DEV`-gated on-screen panel; shows batch notify `{ fuelKeys, count, submissionBatchId, publish result }` after each submit. No console.log.
- REMOVE after confirmation: delete the `batchDebug` state, `onBatchSubmittedProbed` wrapper (restore `onBatchSubmitted={notifyBatchSubmission}`), the DEV probe JSX block, and the `useCallback/useState` import if unused.
