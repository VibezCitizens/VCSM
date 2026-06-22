# CARNAGE Migration Report — QR Scan Count Atomicity

**Date:** 2026-05-27
**Time:** 03:25
**Reviewer:** CARNAGE
**Trigger:** ELEK-2026-05-27-004 — `dalIncrementQrScanCountRaw` uses application-level read-modify-write for scan count updates on `vport.qr_links`. Flagged as non-atomic by ELEKTRA.
**Scope:** ENGINE (`engines/booking`)
**Finding:** Non-atomic increment confirmed. RPC fix required. Scan path not yet live in production.

---

## CARNAGE TARGET

```
Object being changed:  vport.qr_links — scan_count column update path
Application Scope:     ENGINE
Type of change:        Write path replacement — application read-modify-write → DB-side atomic RPC
Reason for migration:  Concurrent QR code scans lose increments. Under N simultaneous scans all
                       reading scan_count = K, all N writes compute K+1. Final result: K+1
                       instead of K+N. Lost N-1 increments per concurrent burst.
```

---

## 1. End-to-End Flow Trace

### Current execution path

```
[QR scan event — future /qr/:slug handler]
  → resolveQrScan({ slug })
       engines/booking/src/controller/resolveQrScan.controller.js
       ↓
  → dalGetQrLinkBySlug({ slug })
       engines/booking/src/dal/qrLink.read.dal.js
       SELECT id, ..., scan_count, ... FROM vport.qr_links WHERE slug = ? AND is_active = true
       ← Returns row including scan_count (STALE READ — moment of read, not moment of write)
       ↓
  → dalIncrementQrScanCountRaw({ qrLinkId: row.id, currentCount: row.scan_count ?? 0 })
       engines/booking/src/dal/qrLink.write.dal.js
       UPDATE vport.qr_links SET scan_count = (currentCount + 1) WHERE id = ?
       ← Non-atomic: computed value depends on application-local read
```

### Key code — controller (fire-and-forget)

```js
// engines/booking/src/controller/resolveQrScan.controller.js
export async function resolveQrScan({ slug }) {
  const row = await dalGetQrLinkBySlug({ slug })
  if (!row) throw new Error('QR link not found.')

  // Fire-and-forget increment — do not block the redirect on this
  dalIncrementQrScanCountRaw({ qrLinkId: row.id, currentCount: row.scan_count ?? 0 }).catch(() => {})

  return { destinationPath: row.destination_path, qrLink: mapQrLinkRow(row) }
}
```

### Key code — DAL write (non-atomic)

```js
// engines/booking/src/dal/qrLink.write.dal.js
export async function dalIncrementQrScanCountRaw({ qrLinkId, currentCount }) {
  const { data, error } = await getVportClient()
    .from('qr_links')
    .update({ scan_count: (currentCount ?? 0) + 1 })  // ← APPLICATION-LEVEL ADD
    .eq('id', qrLinkId)
    .select('id,scan_count')
    .single()
  if (error) throw error
  return data
}
```

### Key code — DAL read (stale read feeds the increment)

```js
// engines/booking/src/dal/qrLink.read.dal.js
const QR_SELECT = [
  'id', 'organization_id', 'location_id', 'profile_id', 'resource_id', 'service_id',
  'qr_type', 'label', 'slug', 'destination_path', 'scan_count', 'is_active', 'created_at',
].join(',')

export async function dalGetQrLinkBySlug({ slug }) {
  const { data, error } = await getVportClient()
    .from('qr_links')
    .select(QR_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}
```

`scan_count` is fetched here and passed directly to the increment function. By the time the update executes, the value is stale.

---

## 2. Race Condition Analysis

### The lost-update pattern

```
Time    Connection A          Connection B
──────────────────────────────────────────────────────
T0      SELECT scan_count=5
T1                            SELECT scan_count=5
T2      UPDATE SET scan_count=6
T3                            UPDATE SET scan_count=6   ← Overwrites A's write
T4      Result: scan_count=6  (expected: 7)
```

Under N concurrent reads of `scan_count = K`:
- All N workers receive `currentCount = K`
- All N workers compute `K + 1`
- All N writes execute `UPDATE SET scan_count = K+1`
- PostgreSQL last-writer-wins: final value = `K+1`
- Expected value: `K+N`
- **Lost increments per burst: N-1**

### Real-world scan burst scenarios

| Scenario | Concurrent scans | Expected increment | Actual increment | Lost |
|---|---|---|---|---|
| Single scan | 1 | +1 | +1 | 0 |
| Two simultaneous | 2 | +2 | +1 | 1 |
| Restaurant table display | 5–10 | +5 to +10 | +1 | 4–9 |
| Viral social share | 50+ | +50 | +1 | 49 |

### Fire-and-forget amplification

The fire-and-forget pattern (`.catch(() => {})`) silently discards all increment errors. Under concurrent load:
- Failed increments are never retried
- Application does not know counts are wrong
- No monitoring or alerting on lost writes
- Owner sees artificially low scan counts in the dashboard

### Retry amplification (future risk)

If a future route handler implements retry logic on the scan increment, retries would multiply the lost-write surface — each retry attempt racing against others at the same stale `currentCount`.

### Multi-tab / duplicate-scan inflation (lower risk)

Under the current pattern, multi-tab scans actually under-count rather than over-count due to lost writes. The atomic RPC eliminates both directions of error.

---

## 3. Production Deployment Status — CRITICAL CONTEXT

```
IMPORTANT: resolveQrScan has ZERO call sites in the application layer.
```

**Evidence:**
- `apps/VCSM/src/` — no import or call to `resolveQrScan`
- `apps/VCSM/functions/` — no `/qr/[slug].js` Cloudflare Pages Function exists
- React Router config — no `/qr/:slug` route registered
- Engine adapter exports `resolveQrScan` correctly but it is not consumed

**What IS wired:**
- `BookingQrLinksPanel.jsx` constructs QR short URLs: `${window.location.origin}/qr/${slug}`
- `scanCount` is displayed in the dashboard UI
- `createQrLink` and `listQrLinksByProfile` are live (QR creation and listing work)

**What is NOT wired:**
- The redirect handler at `/qr/:slug` — the page that resolves slug → destination and increments the count

**Consequence:** The race condition is NOT live in production today. It will become live the moment a `/qr/:slug` handler is implemented. That handler MUST use the atomic RPC from day one — retrofitting atomicity after live traffic begins risks permanent scan count drift.

---

## CARNAGE MIGRATION REPORT

```
Application Scope:   ENGINE
Migration reason:    Non-atomic read-modify-write in application code must be replaced with
                     a DB-side atomic increment before the /qr/:slug route handler is deployed
Migration type:      New RPC (additive) + engine DAL swap
Migration Safety:    CAUTION
Confidence:          HIGH
```

---

## SCHEMA TRUST CLASSIFICATION

| Object | Classification | Reason |
|---|---|---|
| `vport.qr_links` | Ownership-sensitive, Analytics-sensitive | Linked to VPORT profile ownership; scan_count is business analytics data surfaced to owners |
| `vport.qr_links.scan_count` | Analytics-sensitive | Displayed to VPORT owners as engagement metric; inaccurate counts damage owner trust |
| `vport.increment_qr_scan_count` (proposed RPC) | Runtime-critical | Called on every QR scan — high-frequency hot path once route handler is live |

---

## CURRENT STRUCTURE

| Object | Purpose | Dependencies |
|---|---|---|
| `vport.qr_links` | QR link registry: slug, destination_path, scan_count, owner linkage | Owned by profile/location/org; RLS-protected |
| `dalGetQrLinkBySlug` | Read QR link row including scan_count | qrLink.read.dal.js |
| `dalIncrementQrScanCountRaw` | Application-level read-modify-write increment | qrLink.write.dal.js |
| `resolveQrScan` | Controller: slug lookup + fire-and-forget increment | resolveQrScan.controller.js |
| `mapQrLinkRow` | Row → domain model transform | QrLink.model.js |

---

## MIGRATION BLAST RADIUS

```
Affected systems:
  - engines/booking/src/dal/qrLink.write.dal.js  (DAL swap)
  - engines/booking/src/controller/resolveQrScan.controller.js  (remove currentCount arg)
  - vport schema (new RPC)

Runtime impact:
  - Zero impact today (no live call sites)
  - After /qr/:slug handler deployment: every QR scan hits this path
  - High-frequency once live — must be atomic before first real traffic

Release impact:
  - /qr/:slug route handler MUST NOT ship until RPC is deployed and DAL is updated
  - Safe to ship QR link creation/listing changes independently

Rollback impact:
  - FULL rollback possible: drop RPC, revert DAL function — no data loss
  - scan_count values already in DB are not affected by the migration
```

---

## RLS IMPACT REVIEW

| Object | RLS Dependency | Risk | Follow-up Required |
|---|---|---|---|
| `vport.qr_links` SELECT | DIRECT — `qr_links_select_authenticated` (`TO authenticated, is_active = true`) | Anon client cannot read; service role bypasses RLS | DB confirm: service role used by getVportClient() |
| `vport.qr_links` UPDATE | DIRECT — `qr_links_update_owner` (`actor_can_manage_profile` required) | **CRITICAL**: Authenticated users cannot UPDATE unless they own the profile. Anonymous scanners cannot update at all. The increment CANNOT go through the anon or authenticated client — it requires service role or SECURITY DEFINER. | VENOM + DB review |
| `vport.increment_qr_scan_count` (proposed RPC) | CRITICAL — SECURITY DEFINER bypasses RLS | The RPC must be narrowly scoped: accepts only `p_id uuid`, updates only `scan_count`, no other columns. No caller identity check inside RPC — trust boundary is at the engine service role. | VENOM review required |

### RLS Critical Finding

The existing `qr_links_update_owner` policy requires `vport.actor_can_manage_profile(vc.current_actor_id(), profile_id)`. This means:

- An anonymous QR scanner **cannot** call `.update({ scan_count: ... })` directly — they fail the RLS check
- An authenticated non-owner also cannot update
- `getVportClient()` uses the **service role client** which bypasses RLS entirely

This means the current `dalIncrementQrScanCountRaw` works today because it uses the service role — but it is still non-atomic. The proposed RPC must also use the service role (via `SECURITY DEFINER`) or be called exclusively from service-role contexts.

**The SECURITY DEFINER RPC is the correct pattern for this operation.** It provides:
- Atomicity at the DB layer
- Narrow operation scope (only `scan_count` on a specific row)
- No RLS bypass for data the caller shouldn't see — it only writes one column

---

## RUNTIME IMPACT ANALYSIS

| Runtime Area | Risk | Expected Impact | Mitigation |
|---|---|---|---|
| QR scan redirect path | HIGH (future) | High-frequency on-demand reads + atomic write; each scan = 1 SELECT + 1 RPC call | Atomic RPC reduces lock contention vs read-modify-write |
| Dashboard scan count display | LOW | Reads `scan_count` via `listQrLinksByProfile` — read-only, unaffected by write path change | None |
| PostgreSQL lock contention | LOW with RPC | Atomic `UPDATE` on a single row by primary key is lock-minimal (row-level exclusive) | RPC uses single-statement UPDATE — no transaction overhead |
| Fire-and-forget error silencing | MEDIUM | Failed increments are swallowed; monitoring blind spot | DB should add logging or alerting if RPC fails frequently |
| Retry amplification | LOW (current) / MEDIUM (future) | If retry logic is added to the route handler, retries compound lost-write risk | Fix atomicity before implementing retry |

---

## MIGRATION DEPENDENCY GRAPH

| Dependency Type | Affected Area | Risk |
|---|---|---|
| DAL dependency | `dalIncrementQrScanCountRaw` → replaced by `dalIncrementQrScanCount` (RPC) | Engine-internal; no app-layer exposure |
| Controller dependency | `resolveQrScan` passes `currentCount` → no longer needed after RPC | Remove `currentCount` arg from call site |
| RPC dependency | `vport.increment_qr_scan_count` must be deployed before DAL is updated | Sequential: DB first, then engine DAL |
| Route handler dependency | `/qr/:slug` handler MUST NOT ship before RPC + DAL are live | Release gate: THOR must enforce this ordering |
| RLS dependency | Proposed RPC must be `SECURITY DEFINER` and callable from service role context | VENOM must review RPC trust boundary |

---

## DATA INTEGRITY REVIEW

| Integrity Area | Risk | Detection Method | Mitigation |
|---|---|---|---|
| Lost increment under concurrency | HIGH | Compare (current scan_count) vs (expected from server logs) | Atomic RPC eliminates entirely |
| scan_count drift already in DB | LOW | Values already stored may be under-counted from pre-live testing | Acceptable — counts are advisory, not financial; DB can reset if needed |
| Stale read serving wrong count in redirect response | LOW | `resolveQrScan` returns the pre-increment `qrLink` in its response | After RPC migration, controller can optionally return updated count from RPC |
| RPC called with invalid UUID | LOW | PostgreSQL will return 0 rows updated — not an error | Add RETURNS void vs RETURNS integer depending on whether caller needs confirmation |

---

## PROPOSED RPC — SQL TEXT ONLY (DO NOT EXECUTE)

### Option A — Returns void (recommended for fire-and-forget)

```sql
-- vport.increment_qr_scan_count
-- Atomic scan count increment for QR link tracking.
-- Called from the booking engine service role context on every QR scan.
-- SECURITY DEFINER: bypasses RLS to allow service-role-equivalent increment
-- without requiring a policy exception on the authenticated role.
-- Narrow operation: updates only scan_count on the targeted row.
-- Safe: UPDATE on non-existent id is a no-op (0 rows affected, no error).

CREATE OR REPLACE FUNCTION vport.increment_qr_scan_count(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = vport, public
AS $$
  UPDATE vport.qr_links
  SET scan_count = scan_count + 1
  WHERE id = p_id;
$$;

-- Grant execute to the service role only.
-- Do not grant to authenticated or anon — engine uses service role client.
REVOKE ALL ON FUNCTION vport.increment_qr_scan_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vport.increment_qr_scan_count(uuid) TO service_role;
```

### Option B — Returns updated count (if controller needs post-increment value)

```sql
CREATE OR REPLACE FUNCTION vport.increment_qr_scan_count(p_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = vport, public
AS $$
  UPDATE vport.qr_links
  SET scan_count = scan_count + 1
  WHERE id = p_id
  RETURNING scan_count;
$$;

REVOKE ALL ON FUNCTION vport.increment_qr_scan_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vport.increment_qr_scan_count(uuid) TO service_role;
```

**Recommendation: Option A.** The scan increment is fire-and-forget. The controller does not use the updated count in its return value — it returns the pre-fetch `mapQrLinkRow(row)`. Returning void keeps the RPC simple and avoids unnecessary result parsing.

### Why this SQL is safe

- `UPDATE ... SET scan_count = scan_count + 1` is evaluated atomically within PostgreSQL's MVCC engine — no application-level read is required
- Single-statement SQL in a `LANGUAGE sql` function is implicitly transactional
- Row-level exclusive lock is held only for the duration of the single-row update — minimal contention
- `SET search_path = vport, public` prevents search_path injection attacks
- `REVOKE ALL FROM PUBLIC` before explicit GRANT prevents accidental exposure

### Concurrency behavior under proposed RPC

```
Time    Connection A                    Connection B
────────────────────────────────────────────────────────────
T0      BEGIN implicit (single-stmt)
T1      UPDATE qr_links SET             BEGIN implicit
        scan_count = scan_count+1       (waits for A's row lock)
        WHERE id = ?
T2      COMMIT → scan_count = 6
T3                                      UPDATE qr_links SET
                                        scan_count = scan_count+1
                                        WHERE id = ?
T4                                      COMMIT → scan_count = 7 ✓
```

Both increments land. `N` concurrent scans produce exactly `+N`.

---

## ENGINE DAL CHANGES REQUIRED (after RPC is deployed)

### New DAL function

```js
// engines/booking/src/dal/qrLink.write.dal.js
// Add after dalInsertQrLink, replace dalIncrementQrScanCountRaw

export async function dalIncrementQrScanCount({ qrLinkId }) {
  if (!qrLinkId) throw new Error('[BookingEngine] qrLinkId is required')
  const { error } = await getVportClient()
    .rpc('increment_qr_scan_count', { p_id: qrLinkId })
  if (error) throw error
}
```

### Updated controller call site

```js
// engines/booking/src/controller/resolveQrScan.controller.js
// Remove currentCount from fire-and-forget call

dalIncrementQrScanCount({ qrLinkId: row.id }).catch(() => {})
```

`currentCount` argument is no longer needed — the DB owns the increment logic.

### Deprecation of dalIncrementQrScanCountRaw

`dalIncrementQrScanCountRaw` should be **renamed to** `_dalIncrementQrScanCountLegacy` and **not deleted** until the RPC is confirmed live in production. Deletion is a follow-up action after the RPC migration is verified.

---

## MIGRATION EXECUTION STRATEGY

| Phase | Strategy | Risk | Notes |
|---|---|---|---|
| Phase 1: Deploy RPC | Additive — new DB function only | SAFE | No existing code paths affected; RPC is dormant until called |
| Phase 2: Update engine DAL | Swap `dalIncrementQrScanCountRaw` → `dalIncrementQrScanCount` + rename legacy | SAFE | `resolveQrScan` has no call sites — no live traffic impact |
| Phase 3: Deploy /qr/:slug handler | New Cloudflare Pages Function wired to `resolveQrScan` | CAUTION | First live traffic; monitor scan counts for anomalies |
| Phase 4: Remove legacy DAL | Delete `_dalIncrementQrScanCountLegacy` after Phase 3 verified | SAFE | Cleanup only |

**Critical sequencing rule: Phase 1 must complete before Phase 2. Phase 2 must complete before Phase 3.** THOR must enforce this ordering at release.

---

## ROLLBACK SURVIVABILITY

```
Rollback status:        FULL
Data recovery risk:     NONE — scan_count values in DB are not affected by this migration
Compatibility risk:     NONE — additive RPC; existing DAL function coexists until removed
Operational complexity: LOW — drop the RPC function and revert the one DAL import change
```

Rollback SQL (text only, do not execute):

```sql
DROP FUNCTION IF EXISTS vport.increment_qr_scan_count(uuid);
```

Engine DAL reverts to `dalIncrementQrScanCountRaw` (un-rename the legacy function). No data migration required. Existing scan counts in the DB remain unchanged.

---

## IDENTITY / OWNERSHIP MIGRATION WARNING

```
Object:           vport.qr_links (scan_count column)
Current behavior: Service role client updates scan_count via application-computed value
Migration risk:   SECURITY DEFINER RPC must not allow caller to increment arbitrary rows —
                  the engine is the only authorized caller via service role
Potential impact: If RPC is exposed to authenticated or anon role, any user could inflate
                  scan counts for any QR link
Recommended safeguards:
  1. REVOKE ALL FROM PUBLIC before GRANT EXECUTE
  2. GRANT EXECUTE TO service_role only — not authenticated, not anon
  3. VENOM must review RPC trust boundary before deployment
  4. DB must confirm getVportClient() uses service role (not authenticated client)
```

---

## BOUNDARY MIGRATION REVIEW

| Schema Object | Scope Owner | Cross-Root Risk | Status |
|---|---|---|---|
| `vport.qr_links` | ENGINE (booking engine owns qr_links write path) | NONE — no app-layer schema assumptions | CLEAR |
| `vport.increment_qr_scan_count` (proposed) | ENGINE | NONE — RPC called exclusively from engine DAL | CLEAR |
| `dalIncrementQrScanCountRaw` | ENGINE internal | NONE | ENGINE-scoped change only |
| `/qr/:slug` route handler | VCSM app layer (Cloudflare Pages Function) | NONE — separate deployment concern | OUT OF SCOPE for this migration |

---

## VALIDATION CHECKLIST

| Validation Area | Status | Notes |
|---|---|---|
| Schema compatibility | PASS | Additive RPC — no table structure changes |
| DAL compatibility | PASS (after swap) | `dalIncrementQrScanCount` is a drop-in replacement |
| Controller compatibility | PASS | Remove `currentCount` from one call site |
| Engine compatibility | PASS | No engine public API changes |
| RLS validation | REQUIRED | DB must confirm RPC is SECURITY DEFINER and service_role grant only |
| Runtime performance validation | REQUIRED | Kraven: single-row atomic UPDATE is faster than read-modify-write under load |
| Rollback validation | PASS | DROP FUNCTION + un-rename DAL is fully reversible |
| Native compatibility | N/A | No native surfaces |
| Release sequencing | REQUIRED | THOR must gate /qr/:slug handler behind RPC deployment confirmation |

---

## ADDITIONAL FINDING — Missing Route Handler

```
Finding type:    Architecture gap (out of scope for this migration, but blocking for scan counting)
Finding:         /qr/:slug redirect handler does not exist
Evidence:        BookingQrLinksPanel.jsx constructs QR short URLs as /qr/:slug
                 No functions/qr/[slug].js Cloudflare Pages Function exists
                 No React Router route for /qr/:slug registered
                 resolveQrScan has zero call sites in apps/
Impact:          scan_count is NEVER incremented in production today
                 QR codes printed on physical flyers point to a 404 or SPA fallback
Action required: Implement functions/qr/[slug].js AFTER Phase 1 + Phase 2 complete
                 This is a product delivery gap — IRONMAN or product owner to track
```

---

## RECOMMENDED HANDOFFS

| Command | Reason | Priority |
|---|---|---|
| **DB** | Confirm `getVportClient()` uses service role. Confirm RLS on `qr_links_update_owner` blocks authenticated writes (correct). Confirm no existing SECURITY DEFINER function covers this path already. Deploy proposed RPC SQL after VENOM review. | P1 — blocking Phase 2 |
| **VENOM** | Review SECURITY DEFINER RPC trust boundary. Verify service_role-only grant prevents anon/authenticated inflation attacks. Verify RPC cannot be called from client-side paths. | P1 — required before RPC deployment |
| **KRAVEN** | Benchmark atomic single-row RPC UPDATE vs read-modify-write under concurrent load. Confirm no index gap on `vport.qr_links.id` (PK — assumed indexed). Validate fire-and-forget pattern is acceptable for analytics (eventual consistency) vs blocking for accuracy. | P2 — after RPC is deployed |
| **THOR** | Gate the `/qr/:slug` route handler deployment behind Phase 1 (RPC) + Phase 2 (DAL swap) completion. Do not approve route handler PR unless CARNAGE phases 1 and 2 are confirmed live. | P1 — release sequencing |

---

## OPEN QUESTIONS FOR DB

1. Is `getVportClient()` confirmed to use the Supabase service role? If it uses the authenticated client, the proposed RPC grant must be updated accordingly.
2. Does `vport.qr_links` have an index on `id` (beyond the primary key)? Expected: PK index exists; confirm for RPC update path.
3. Is there an existing SECURITY DEFINER function for any scan/analytics increment pattern already in the DB? If so, align with that pattern for consistency.
4. Confirm `scan_count` column is `integer` type with `DEFAULT 0 NOT NULL` — the RPC assumes it is never NULL.

---

## FINAL CARNAGE STATUS

```
FINAL CARNAGE STATUS: CAUTION

Migration Safety Status: CAUTION
Confidence: HIGH

Reason for CAUTION (not BLOCKED):
  - Additive migration (new RPC only) — no table rewrite, no destructive change
  - Race condition is NOT live in production today (no route handler)
  - Full rollback survivability
  - CAUTION because:
      (a) SECURITY DEFINER RPC requires VENOM sign-off before deployment
      (b) Phase ordering (DB → Engine → Route Handler) must be THOR-gated
      (c) Missing route handler is a product delivery gap that could cause
          QR codes to silently fail if deployed before this migration

Blocking risks:
  - Do NOT deploy /qr/:slug route handler before Phase 1 (RPC) and Phase 2 (DAL) complete
  - Do NOT grant EXECUTE on RPC to authenticated or anon roles
  - Do NOT remove dalIncrementQrScanCountRaw until Phase 3 (route handler) is verified live

CARNAGE is complete. Downstream review required: VENOM (P1), DB (P1), THOR (P1), KRAVEN (P2).
```
