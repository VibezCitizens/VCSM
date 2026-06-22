## DataEngineer Audit Report

**Date:** 2026-05-27
**Scope:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/` — DB constraint layer, informing Batch C Carnage migration plan
**Triggered by:** User — post Batch B completion; Batch C (Carnage) planning gate
**Application Scope:** VCSM
**Authority:** Read-only. All SQL is text-only, labeled "do not run automatically."
**DB live schema:** CONFIRMED 2026-05-27 — schema addendum appended at bottom of this report

---

### 1. Scope Reviewed

**Routes / Screens:**
- `/vport/:actorId/dashboard/gas` (VportDashboardGasScreen → VportGasPricesView)
- Public gas card rendered on VPORT public profile (VportGasPricesScreen)

**Hooks reviewed:**
- `useVportGasPrices.js` (read path)
- `useSubmitFuelPriceSuggestion.js` (write path)
- `useOwnerPendingSuggestions.js` (owner review path)

**Controllers reviewed:**
- `submitFuelPriceSuggestion.controller.js`
- `reviewFuelPriceSuggestion.controller.js`
- `getVportGasPrices.controller.js`

**DALs reviewed (all 8):**
- `vportFuelPrices.read.dal.js`
- `vportFuelPrices.write.dal.js`
- `vportFuelPriceSubmissions.read.dal.js`
- `vportFuelPriceSubmissions.write.dal.js`
- `vportFuelPriceReviews.write.dal.js`
- `vportFuelPriceHistory.write.dal.js`
- `vportStationPriceSettings.read.dal.js`
- `vportFuelPricePost.read.dal.js`

**Shared services:**
- `resolveVportProfileId.dal.js` (30s TTL cache, resolves actorId → profileId)

**Tables accessed:**
- `vport.fuel_prices` — official price per station per fuelKey
- `vport.fuel_price_submissions` — pending citizen suggestions
- `vport.fuel_price_submission_reviews` — review log
- `vport.fuel_price_history` — historical price ledger
- `vport.station_price_settings` — per-station sanity thresholds
- `vport.profiles` — actorId → profileId resolution

**Migrations inspected:**
- `20260427060000_grant_vport_write_permissions.sql`
- `20260526010000_fuel_price_submissions_rls.sql`
- `20260526020000_fix_fuel_price_submissions_grants.sql`

---

### 2. Query Inventory

| # | DAL File | Table/View | Operation | Key Columns Selected | Filter | Cache |
|---|---|---|---|---|---|---|
| Q1 | `vportFuelPrices.read.dal.js:31` | `vport.fuel_prices` | select | profile_id, fuel_key, price, currency_code, unit, is_available, updated_at, updated_by_actor_id, source | eq(profile_id) | 60s TTL |
| Q2 | `vportFuelPrices.write.dal.js:33` | `vport.fuel_prices` | upsert | profile_id, fuel_key, price, currency_code, unit, is_available, updated_by_actor_id, source, updated_at | onConflict(profile_id,fuel_key) | None (write) |
| Q3 | `vportFuelPrices.write.dal.js:11` | `vport.fuel_prices` | update | unit, updated_at | eq(profile_id) | None (write) |
| Q4 | `vportFuelPriceSubmissions.read.dal.js:30` | `vport.fuel_price_submissions` | select | id, profile_id, fuel_key, proposed_price, currency_code, unit, submitted_by_actor_id, submitted_at, status, **evidence** | eq(profile_id, status='pending') | 30s TTL (no-fuelKey path) |
| Q5 | `vportFuelPriceSubmissions.read.dal.js:59` | `vport.fuel_price_submissions` | select (by id) | SUBMISSION_SELECT incl. **evidence** | eq(id) | None (review must be live) |
| Q6 | `vportFuelPriceSubmissions.write.dal.js:33` | `vport.fuel_price_submissions` | insert | profile_id, fuel_key, proposed_price, currency_code, unit, submitted_by_actor_id, status='pending' | — | None (write) |
| Q7 | `vportFuelPriceReviews.write.dal.js:9` | `vport.fuel_price_submission_reviews` | insert | submission_id, decision, reason, decided_by_actor_id, applied_to_official | — | None (write) |
| Q8 | `vportFuelPriceReviews.write.dal.js:34` | `vport.fuel_price_submissions` | update (status) | status, reviewed_at, reviewed_by_actor_id, decision_reason | eq(id) | None (write) |
| Q9 | `vportFuelPriceReviews.write.dal.js:57` | `vport.fuel_price_submission_reviews` | update | applied_to_official | eq(id) | None (write) |
| Q10 | `vportFuelPriceHistory.write.dal.js:24` | `vport.fuel_price_history` | insert | profile_id, fuel_key, price, currency_code, unit, is_available, actor_id, source | — | None (write) |
| Q11 | `vportStationPriceSettings.read.dal.js:12` | `vport.station_price_settings` | select | profile_id, show_community_suggestion, require_sanity_for_suggestion, min_price, max_price, max_delta_abs, max_delta_pct, updated_at | eq(profile_id) | 300s TTL |
| Q12 | `vportFuelPrices.read.dal.js:12` | `vport.profiles` | select | id | eq(actor_id) | via resolveVportProfileId 30s TTL |

---

### 3. Duplicate DB Calls

**DE-001** — Repeated `resolveVportProfileId` calls within a single write path

- **Priority:** LOW (mitigated by 30s TTL cache)
- **Pattern:** Every DAL in the module calls `resolveVportProfileId(actorId)` internally. The controller also calls it independently for the profile-not-found guard.
- **Duplicate sites (owner write path):**
  - `submitFuelPriceSuggestion.controller.js:62` — controller guard
  - `fetchVportStationPriceSettingsDAL` → `resolveVportProfileId` internally
  - `upsertVportFuelPriceDAL` → `resolveVportProfileId` internally
  - `createVportFuelPriceHistoryDAL` → `resolveVportProfileId` internally
- **Result:** 4 logical calls per owner write — all but the first are 30s cache hits
- **Assessment:** Intentional architecture (each DAL is self-contained). Cache ensures at most 1 real DB round-trip per 30s window. No action required unless the cache is ever disabled.

---

### 4. Expensive Chains

**DE-002** — Citizen path serial fan-out on sanity-check enabled stations

- **Priority:** MEDIUM
- **Chain:**
  ```
  useSubmitFuelPriceSuggestion
    → submitFuelPriceSuggestionController
      → resolveVportProfileId      [1 DB call — cached after first]
      → fetchVportStationPriceSettingsDAL   [1 DB call — 300s TTL]
      → fetchVportFuelPricesDAL    [1 DB call — 60s TTL; only when sanity checks enabled]
      → createFuelPriceSubmissionDAL        [1 DB call — write]
  ```
- **Pattern type:** Serial chain (4 steps, max 4 round-trips on cold path)
- **Business impact:** Citizen price submission; adds perceived latency on first submit per session when all caches are cold
- **Mitigation:** All reads have TTL caches; warm-path cost is 1 write round-trip. No structural change needed — this is by design.

**DE-003** — Owner review path: 6 DB operations in serial

- **Priority:** LOW (owner-only path, infrequent)
- **Chain:**
  ```
  reviewFuelPriceSuggestionController
    → fetchFuelPriceSubmissionByIdDAL   [1 read — uncached, intentionally live]
    → resolveActorIdFromProfileId       [1 read — profiles table, uncached]
    → checkVportOwnershipController     [1+ reads — actor_owners]
    → updateFuelPriceSubmissionStatusDAL [1 write]
    → upsertVportFuelPriceDAL           [1 write, if approved]
    → createVportFuelPriceHistoryDAL    [1 write, if approved]
    → createFuelPriceSubmissionReviewDAL [1 write]
  ```
- **Assessment:** 7 round-trips on full approve path. Acceptable for an owner-triggered action (not a high-frequency path). No N+1 pattern.

---

### 5. RPC Candidates

**DE-004** — Owner approve path as atomic RPC

- **Finding ID:** DE-004
- **Priority:** LOW
- **Current query chain:** 6-7 serial DB operations for approve path (see DE-003)
- **Proposed RPC signature (text only — do not run automatically):**
  ```sql
  -- vport.review_fuel_price_submission(
  --   p_submission_id UUID,
  --   p_decision TEXT,        -- 'approved' | 'rejected'
  --   p_decided_by_actor_id UUID,
  --   p_reason TEXT DEFAULT NULL,
  --   p_apply_to_official BOOLEAN DEFAULT TRUE
  -- ) RETURNS JSON
  ```
- **Rationale:** Atomicity — if the upsert to `fuel_prices` succeeds but the history INSERT fails, the DB is left in inconsistent state. An RPC wraps all writes in a single transaction.
- **Risk:** HIGH — requires new DB function, SECURITY DEFINER or caller policy design, Carnage migration
- **Owner:** DB + Carnage (future consideration — not required for Batch C)
- **Batch C decision:** OUT OF SCOPE for Batch C. Flagged for future consideration only.

---

### 6. View Candidates

None identified for gasprices scope. Tables are schema-isolated in `vport.*` and consumed by a single feature module. No cross-feature join candidates.

---

### 7. Cache Candidates

All appropriate reads are already cached. Cache TTLs confirmed:

| DAL | Table | TTL | Invalidation |
|---|---|---|---|
| `vportFuelPrices.read.dal.js` | `vport.fuel_prices` | 60s | `invalidateFuelPriceCache(actorId)` — called on owner write and approve review |
| `vportFuelPriceSubmissions.read.dal.js` | `vport.fuel_price_submissions` | 30s (full-fetch only) | `invalidatePendingSubmissionsCache(actorId)` — called on insert and review |
| `vportStationPriceSettings.read.dal.js` | `vport.station_price_settings` | 300s | `invalidateSettingsCache(actorId)` — exported but not yet called; settings are infrequently written |
| `resolveVportProfileId.dal.js` | `vport.profiles` | 30s | Not exposed — no current invalidation path |

**DE-005** — `resolveVportProfileId` cache has no invalidation path

- **Finding ID:** DE-005
- **Priority:** INFO
- **Issue:** The 30s profileId cache in `resolveVportProfileId.dal.js` has no exported `invalidate` function. If a VPORT profile is deleted and re-created within 30s (rare edge case), the cached profileId would point to a stale/deleted row.
- **Recommendation:** Export `invalidateResolveVportProfileIdCache(actorId)` and call it from any VPORT profile delete path.
- **Risk:** LOW — profile deletion is not a common user action and 30s TTL limits exposure.
- **Owner:** VCSM feature owner

---

### 8. Backend Ownership Decision

| Finding ID | Title | Owner | Rationale |
|---|---|---|---|
| DE-001 | Repeated resolveVportProfileId | None — already mitigated | TTL cache handles it |
| DE-002 | Citizen path serial fan-out | None — by design | Caches cover cold-path cost |
| DE-003 | Owner review serial chain | DB + Carnage (future) | Atomicity gap — future RPC consideration |
| DE-004 | Approve path RPC candidate | DB + Carnage | Future improvement only |
| DE-005 | resolveVportProfileId no-invalidate | VCSM feature owner | Simple export addition |

---

### 9. Recommended Patch Plan — Batch C (Carnage)

The following DB-layer changes are required to make Batch B's app-layer guards load-bearing. In order of priority:

---

#### PATCH C-001 — CRITICAL: Partial UNIQUE index on `fuel_price_submissions`

**Finding addressed:** ELEK-002 (23505 catch currently DORMANT — no constraint exists in DB)

```sql
-- do not run automatically
CREATE UNIQUE INDEX IF NOT EXISTS uq_fuel_price_submissions_pending
  ON vport.fuel_price_submissions (profile_id, fuel_key, submitted_by_actor_id)
  WHERE status = 'pending';
```

**Why this is CRITICAL:**
- `submitFuelPriceSuggestion.controller.js:160` catches `error.code === "23505"` and returns `{ ok: false, reason: "already_pending" }`
- Without this index, Postgres never raises 23505 — the catch is dead code
- A Citizen can currently submit unlimited duplicate pending suggestions for the same fuelKey at the same station
- This is the primary enforcement mechanism for the duplicate-pending guard

**Impact if not applied:** ELEK-002 remains open at full severity. The 23505 app-layer catch never fires.

**Risk:** LOW — partial index only affects INSERT; does not touch existing rows or other write paths
**Requires:** `GRANT` on index — verify `authenticated` role can still INSERT after index creation
**Owner:** Carnage (migration) + DB (verify grant coverage)

---

#### PATCH C-002 — HIGH: CHECK constraint on `fuel_prices.fuel_key`

**Finding addressed:** ELEK-004 (app-layer `ALLOWED_FUEL_KEYS` guard — DB has no enforcement)

```sql
-- do not run automatically
ALTER TABLE vport.fuel_prices
  ADD CONSTRAINT chk_fuel_prices_fuel_key
  CHECK (fuel_key IN ('regular', 'midgrade', 'premium', 'diesel', 'e85', 'kerosene'));
```

**Why this matters:**
- `submitFuelPriceSuggestion.controller.js:48` rejects unknown `fuelKey` values via `ALLOWED_FUEL_KEYS.has()`
- `reviewFuelPriceSuggestion.controller.js:82` does the same on approve
- Without the DB constraint, a direct DB write (service role, Supabase dashboard, future Edge Function, or RPC that bypasses the app layer) can write an invalid `fuel_key` to the official prices table
- All downstream reads (including public fuel price views) would then display invalid/undefined fuel types

**Risk:** LOW — existing data must already satisfy this constraint if the app has been consistent. DataEngineer recommends DB verify no existing rows violate this before applying.
**Owner:** Carnage + DB

---

#### PATCH C-003 — HIGH: CHECK constraint on `fuel_price_submissions.fuel_key`

**Finding addressed:** Same as C-002, for the submissions table

```sql
-- do not run automatically
ALTER TABLE vport.fuel_price_submissions
  ADD CONSTRAINT chk_fuel_price_submissions_fuel_key
  CHECK (fuel_key IN ('regular', 'midgrade', 'premium', 'diesel', 'e85', 'kerosene'));
```

**Risk:** LOW — same rationale as C-002
**Owner:** Carnage + DB

---

#### PATCH C-004 — MEDIUM: CHECK constraint on `fuel_price_submissions.status`

```sql
-- do not run automatically
ALTER TABLE vport.fuel_price_submissions
  ADD CONSTRAINT chk_fuel_price_submissions_status
  CHECK (status IN ('pending', 'approved', 'rejected'));
```

**Why this matters:**
- `reviewFuelPriceSuggestion.controller.js:30` validates `decision` via `VALID_DECISIONS` set
- `updateFuelPriceSubmissionStatusDAL` writes the `decision` value as `status`
- Without the constraint, a direct DB write or future code path that skips the controller guard could write `status = 'cancelled'`, `status = 'flagged'`, etc.
- The app's `subRow.status !== "pending"` guard (controller:53) would still work, but new upstream reads expecting exactly 3 status values would behave unpredictably

**Risk:** LOW — constraint adds safety without touching existing data
**Owner:** Carnage + DB

---

#### PATCH C-005 — MEDIUM: Verify UNIQUE constraint on `fuel_prices(profile_id, fuel_key)`

**This is a DB verification task, not a new migration.**

`vportFuelPrices.write.dal.js:64` uses:
```js
.upsert([...], { onConflict: "profile_id,fuel_key" })
```

PostgREST's upsert with `onConflict` requires a `UNIQUE` constraint or index on the specified columns to work correctly. If that constraint is absent:
- The upsert silently behaves like an INSERT
- Calling the owner write path twice for the same `(profile_id, fuel_key)` creates duplicate rows
- All downstream reads and the official price display become non-deterministic

**Action required:** DB must run:
```sql
-- do not run automatically — verification only
SELECT indexname, indexdef
  FROM pg_indexes
  WHERE schemaname = 'vport'
    AND tablename = 'fuel_prices'
    AND indexdef ILIKE '%profile_id%fuel_key%';
```

If no UNIQUE index/constraint on `(profile_id, fuel_key)` is found:
```sql
-- do not run automatically
ALTER TABLE vport.fuel_prices
  ADD CONSTRAINT uq_fuel_prices_profile_fuel_key
  UNIQUE (profile_id, fuel_key);
```

**Risk:** HIGH if constraint is missing and table already has duplicate rows — adding the constraint would fail until duplicates are resolved
**Owner:** DB (verification) → Carnage (migration if needed)

---

#### PATCH C-006 — LOW: Strip `evidence` from READ DAL select strings

**Finding addressed:** ELEK-005 residual — write side cleaned in Batch B, read side still selects `evidence`

**Affected lines (code-level inference — not confirmed against live DB):**
- `vportFuelPriceSubmissions.read.dal.js:11` — `SUBMISSION_SELECT` constant includes `evidence`
- `vportFuelPriceSubmissions.read.dal.js:33` — inline select string includes `evidence`
- `vportFuelPriceReviews.write.dal.js:7` — `SUBMISSION_SELECT` includes `evidence`

**If Carnage drops the `evidence` column**, these reads will fail (Supabase returns an error if you SELECT a non-existent column). Clean these before or simultaneously with the column drop migration.

**Recommended app-layer change** (not a DB task — this is a VCSM feature owner task):
Remove `evidence` from all three select string positions.

**DB task:**
```sql
-- do not run automatically
ALTER TABLE vport.fuel_price_submissions DROP COLUMN IF EXISTS evidence;
```

**Recommended sequencing:** Strip from read DAL selects FIRST (app deploy), THEN drop the column (Carnage migration). Never drop column before the select strings are cleaned.
**Owner:** VCSM feature owner (read DAL cleanup) → Carnage (column drop)

---

### 10. Required Downstream Reviews

- **DB** — Live schema verification required before C-001, C-002, C-003, C-004, C-005: confirm existing constraint state, check for data violations that would block new constraints, verify grant coverage after index creation
- **Carnage** — Migration execution for all C-001 through C-005 items; must apply in dependency order (C-005 verification first, then C-001, then C-002/C-003/C-004, then C-006 after app deploy)
- **Venom** — PATCH C-001 partial index: verify RLS `WITH CHECK` policies on `fuel_price_submissions` still behave correctly after unique index is in place; INSERT policy uses `vport.actor_can_manage_profile` — confirm this is not affected
- **VCSM Feature Owner** — PATCH C-006 read DAL cleanup must be deployed before Carnage drops the `evidence` column

---

### Findings Summary

| Finding ID | Title | Priority | Type | Batch C | Owner |
|---|---|---|---|---|---|
| DE-001 | Repeated resolveVportProfileId | INFO | Cache/Duplicate | Not required | None — mitigated |
| DE-002 | Citizen path serial fan-out | INFO | Chain | Not required | None — by design |
| DE-003 | Owner review serial chain | LOW | Chain | Not required | Future — Carnage RPC |
| DE-004 | Approve path RPC candidate | LOW | Architecture | Out of scope | DB + Carnage |
| DE-005 | resolveVportProfileId no-invalidate | INFO | Cache | Not required | VCSM feature owner |
| PATCH C-001 | Partial UNIQUE index — already_pending guard | **CRITICAL** | DB Constraint | **Required** | Carnage + DB |
| PATCH C-002 | CHECK on fuel_prices.fuel_key | **HIGH** | DB Constraint | **Required** | Carnage + DB |
| PATCH C-003 | CHECK on fuel_price_submissions.fuel_key | **HIGH** | DB Constraint | **Required** | Carnage + DB |
| PATCH C-004 | CHECK on fuel_price_submissions.status | MEDIUM | DB Constraint | **Required** | Carnage + DB |
| PATCH C-005 | Verify UNIQUE on fuel_prices(profile_id,fuel_key) | MEDIUM | DB Verification | **Required** | DB → Carnage |
| PATCH C-006 | Strip evidence from READ DAL selects | LOW | App + DB | Required before column drop | VCSM + Carnage |

---

### Recommended Carnage Execution Order

```
1. DB: verify fuel_prices(profile_id, fuel_key) UNIQUE constraint — C-005 verification
2. Carnage: ADD CONSTRAINT uq_fuel_prices_profile_fuel_key (if missing) — C-005 fix
3. Carnage: CREATE UNIQUE INDEX uq_fuel_price_submissions_pending — C-001 (CRITICAL)
4. Carnage: ADD CONSTRAINT chk_fuel_prices_fuel_key — C-002
5. Carnage: ADD CONSTRAINT chk_fuel_price_submissions_fuel_key — C-003
6. Carnage: ADD CONSTRAINT chk_fuel_price_submissions_status — C-004
7. VCSM deploy: strip evidence from read DAL select strings — C-006 app side
8. Carnage: DROP COLUMN evidence from fuel_price_submissions — C-006 DB side
```

**Steps 3–6 can be in one migration file. Steps 7–8 must stay in the listed order.**

---

## Schema Confirmation Addendum — 2026-05-27

Live schema provided by user. Findings below supersede all "code-level inference only" labels in the original report.

---

### Confirmed Facts

| Table | Column / Constraint | Confirmed State | Impact on Batch C |
|---|---|---|---|
| `vport.fuel_prices` | PRIMARY KEY (profile_id, fuel_key) | ✅ Exists | C-005 CLOSED — PK IS the unique constraint |
| `vport.fuel_prices` | `fuel_key_fkey → vport.fuel_types(key)` | ✅ Exists | C-002 REVISED — see below |
| `vport.fuel_price_submissions` | `fuel_key_fkey → vport.fuel_types(key)` | ✅ Exists | C-003 REVISED — see below |
| `vport.fuel_price_submissions` | `status CHECK (status = ANY (ARRAY['pending','approved','rejected','cancelled']))` | ✅ Confirmed | C-004 PREFLIGHT REQUIRED — 'cancelled' present in constraint |
| `vport.fuel_price_submissions` | `evidence jsonb NOT NULL DEFAULT '{}'::jsonb` | ✅ Confirmed | C-006 safe to DROP — default handles existing INSERTs |
| `vport.fuel_price_submissions` | Partial UNIQUE index on pending submissions | ❌ Absent | C-001 still CRITICAL |
| `vport.fuel_types` | `category IN ('gasoline','diesel','ethanol','ev')` | ✅ Confirmed | EV keys exist in fuel_types; FK is more permissive than ALLOWED_FUEL_KEYS |

---

### Revised Finding Status

**C-001 — Partial UNIQUE index on `fuel_price_submissions` — UNCHANGED: CRITICAL**

No constraint on `(profile_id, fuel_key, submitted_by_actor_id) WHERE status = 'pending'` exists.
The 23505 catch in `submitFuelPriceSuggestion.controller.js:160` is still dormant.
Migration required as originally specified.

---

**C-002 — CHECK on `fuel_prices.fuel_key` — REVISED: CLOSED**

Original concern: no DB-layer enforcement of the `ALLOWED_FUEL_KEYS` business rule.

Confirmed schema shows:
- `fuel_prices.fuel_key_fkey → vport.fuel_types(key)` — FK enforces key existence at DB level
- `fuel_types` includes EV category keys — FK is intentionally broader than `ALLOWED_FUEL_KEYS`

Separation of concerns is CORRECT:
- **DB layer (FK):** "this fuel type exists in the catalog" — enforced
- **App layer (ALLOWED_FUEL_KEYS):** "this fuel type is valid for a gas-station price entry" — enforced at controller
- Adding a DB CHECK coupling to the app's specific key list creates maintenance coupling risk: any new fuel type added to `fuel_types` would require a migration to update the CHECK, while the FK handles catalog extension automatically

**Decision: No additional CHECK constraint on `fuel_key`. C-002 closed. App-layer guard is the correct enforcement layer for domain-specific key filtering.**

---

**C-003 — CHECK on `fuel_price_submissions.fuel_key` — REVISED: CLOSED**

Same rationale as C-002. FK → `vport.fuel_types(key)` provides DB-layer key validity.
App-layer `ALLOWED_FUEL_KEYS` guard in the submit controller is the domain filter.
**C-003 closed.**

---

**C-004 — CHECK on `fuel_price_submissions.status` — REVISED: PREFLIGHT REQUIRED**

Confirmed existing constraint includes `'cancelled'`:
```sql
CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text]))
```

App code writes only `'pending'`, `'approved'`, `'rejected'` via `updateFuelPriceSubmissionStatusDAL`.
No app code path currently writes `'cancelled'`.

However: tightening the constraint to remove `'cancelled'` requires a preflight data check.

**Required preflight before migration (do not run automatically):**
```sql
SELECT COUNT(*), status
  FROM vport.fuel_price_submissions
  WHERE status = 'cancelled'
  GROUP BY status;
```

If count = 0: safe to tighten constraint to `('pending', 'approved', 'rejected')`.
If count > 0: choose one of:
  a. Keep `'cancelled'` in the constraint (lowest risk — does not break existing data)
  b. Update cancelled rows to `'rejected'` then tighten (requires explicit data decision)

**Carnage must run this preflight before writing the C-004 migration. C-004 remains PENDING PREFLIGHT.**

---

**C-005 — Verify UNIQUE constraint on `fuel_prices(profile_id, fuel_key)` — CLOSED**

PRIMARY KEY (profile_id, fuel_key) confirmed on `vport.fuel_prices`.
PostgREST resolves `onConflict: "profile_id,fuel_key"` against the PK correctly.
`upsertVportFuelPriceDAL` is load-bearing and behaves correctly.
**C-005 closed.**

---

**C-006 — Evidence column — REVISED: READY TO EXECUTE**

Confirmed: `evidence jsonb NOT NULL DEFAULT '{}'::jsonb`

The `NOT NULL DEFAULT` means:
- App INSERTs that omit `evidence` (all paths since Batch B) receive the default `'{}'` — no INSERT failures
- `DROP COLUMN` removes the column and its `NOT NULL` constraint simultaneously — no pre-migration nullability change needed
- App-side read DAL selects already cleaned in current session (deployed)

DROP is safe now. Carnage can execute:
```sql
-- do not run automatically
ALTER TABLE vport.fuel_price_submissions DROP COLUMN IF EXISTS evidence;
```

---

### Revised Carnage Execution Order

```
1. Preflight: SELECT COUNT(*) FROM vport.fuel_price_submissions WHERE status = 'cancelled'
   → If 0: proceed to step 3 with full status tightening
   → If > 0: decide on 'cancelled' disposition before step 3

2. Carnage: CREATE UNIQUE INDEX — C-001 (CRITICAL, no dependencies)
   CREATE UNIQUE INDEX IF NOT EXISTS uq_fuel_price_submissions_pending
     ON vport.fuel_price_submissions (profile_id, fuel_key, submitted_by_actor_id)
     WHERE status = 'pending';

3. Carnage: ALTER TABLE status constraint — C-004 (after preflight)
   -- If 'cancelled' rows = 0:
   ALTER TABLE vport.fuel_price_submissions
     DROP CONSTRAINT fuel_price_submissions_status_check,
     ADD CONSTRAINT fuel_price_submissions_status_check
       CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]));
   -- If 'cancelled' rows > 0: retain 'cancelled' or migrate rows first

4. Carnage: DROP COLUMN evidence — C-006 DB side (app-layer selects already clean)
   ALTER TABLE vport.fuel_price_submissions DROP COLUMN IF EXISTS evidence;

5. C-002, C-003: CLOSED — no migrations needed
6. C-005: CLOSED — PK already serves as unique constraint
```

**Steps 2–4 can be a single migration file once preflight is confirmed.**

---

### Revised Findings Summary

| Finding ID | Title | Priority | Status |
|---|---|---|---|
| C-001 | Partial UNIQUE index — already_pending guard | **CRITICAL** | **APPLIED 2026-05-27 ✅** |
| C-002 | CHECK on fuel_prices.fuel_key | ~~HIGH~~ | **CLOSED — FK + app-layer sufficient** |
| C-003 | CHECK on fuel_price_submissions.fuel_key | ~~HIGH~~ | **CLOSED — FK + app-layer sufficient** |
| C-004 | CHECK on fuel_price_submissions.status | MEDIUM | **APPLIED 2026-05-27 ✅** (preflight count=0) |
| C-005 | Verify UNIQUE on fuel_prices(profile_id,fuel_key) | ~~MEDIUM~~ | **CLOSED — PK confirmed** |
| C-006 | Evidence column drop | LOW | **APPLIED 2026-05-27 ✅** |
