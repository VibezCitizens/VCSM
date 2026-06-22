# Logan Phase 3d — Runtime Mutation Docs Drift Report

**Date:** 2026-05-11
**Scope:** `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/runtime/` — 12 docs

**Docs Inspected:**
- `vcsm.runtime.mutation-matrix.md` (718 lines) — primary mutation inventory
- `vcsm.runtime.authority-matrix.md` (149 lines) — write authority ownership
- `vcsm.runtime.idempotency-matrix.md` (150 lines) — retry safety classification
- `vcsm.runtime.transaction-boundary-map.md` (150 lines) — atomicity map
- `vcsm.runtime.high-risk-mutations.md` (43 lines) — ranked high-risk write actions
- `vcsm.runtime.silent-failure-map.md` (43 lines) — fail-open/swallowed error map
- `vcsm.runtime.top-mutation-bug-risks.md` (46 lines) — hardening roadmap
- `vcsm.runtime.duplicate-write-authorities.md` (44 lines) — dual-authority write map
- `vcsm.runtime.rpc-audit.md` (107 lines) — live DB RPC verification (April 13, 2026)
- `vcsm.runtime.profile-nav-audit.md` — UI nav audit (May 3, 2026; scope = UI)
- `vcsm.runtime.settings-profile-audit.md` — settings audit (May 3, 2026; scope = UI)
- `vcsm.runtime.vibes-tab-audit.md` — tab audit (May 3, 2026; scope = UI)

**UI audit docs (last 3)** were not reviewed for mutation drift — they are navigation/UI audits dated May 3, 2026 and are outside the mutation scope of this phase.

---

## Immediate Fixes Applied

| File | Fix |
|---|---|
| `vcsm.runtime.high-risk-mutations.md` | Updated stale source path from `logan/VCSM_MUTATION_MATRIX.md` → correct `zNOTFORPRODUCTION/_CANONICAL/logan/...` path |
| `vcsm.runtime.silent-failure-map.md` | Same path fix |
| `vcsm.runtime.mutation-matrix.md` Section 8 | Added migration-complete note with date and source; updated architecture status label from "hybrid" → "engine-backed (migration complete)" |
| `vcsm.runtime.authority-matrix.md` Chat section | Rewrote all 7 chat rows from "Hybrid authority" to "Engine Controller" (or "Engine + App bridge" for spam/cover); added migration-complete note |

---

## Drift Findings

---

### F-3d-01 — Booking mutation sections use `vc.bookings` and missing new vport controllers

**Finding ID:** F-3d-01
**Docs:** `vcsm.runtime.mutation-matrix.md` (Section 12), `vcsm.runtime.authority-matrix.md` (Booking), `vcsm.runtime.idempotency-matrix.md` (Booking), `vcsm.runtime.transaction-boundary-map.md` (Booking)
**Code:** `apps/VCSM/src/features/dashboard/vport/controller/` — current branch new controllers
**Drift Status:** DOC MISSING + CONTRADICTORY (schema dependency on F-3b-01)
**Drift Severity:** HIGH

**What the docs say:**
All four runtime mutation docs reference:
- `createBookingController` → `vc.bookings`
- `confirmBookingController` / `cancelBookingController` → `vc.bookings`
- File paths: `apps/VCSM/src/features/booking/controller/`

**What the code shows (current branch):**
The vport dashboard booking uses a **separate set of controllers** in `apps/VCSM/src/features/dashboard/vport/controller/`:
- `createOwnerBooking.controller.js` (NEW) — owner booking create with ownership gate → `vportSchema.from('bookings')`
- `updateVportBooking.controller.js` (MODIFIED) — dual export: `updateBookingStatusController` + `rescheduleBookingController` → `vportSchema.from('bookings')`
- `vportPublicBooking.controller.js` (MODIFIED) — customer public booking create

These controllers write to `supabase.schema('vport').from('bookings')` via `vportClient`, not `vc.bookings`.

**The original `booking/controller/` files** may still exist and serve a different booking path, but the vport dashboard booking is now distinct and entirely absent from all four mutation docs.

**Missing from all four mutation docs:**

| Action | Controller | Table | Notes |
|---|---|---|---|
| Owner create booking | `createOwnerBooking.controller.js` | `vport.bookings` | Includes ownership assertion gate |
| Owner update booking status | `updateBookingStatusController` (in `updateVportBooking.controller.js`) | `vport.bookings` | Customer-vs-owner path split |
| Owner reschedule booking | `rescheduleBookingController` (in `updateVportBooking.controller.js`) | `vport.bookings` | Overlap check before write |
| Customer public booking | `vportPublicBooking.controller.js` | `vport.bookings` | Modified on branch |

**Blocked on:** F-3b-01 (`/DB` — verify `vport` schema existence) before schema label can be confirmed.

**Required action after `/DB`:**
1. Add new vport booking section to mutation-matrix, authority-matrix, idempotency-matrix, transaction-boundary-map
2. Clarify whether original `booking/controller/` path (`vc.bookings`) is still active or superseded

---

### F-3d-02 — Chat sections described "hybrid" — now corrected

**Finding ID:** F-3d-02
**Drift Status:** FIXED
**Docs Fixed:** mutation-matrix Section 8, authority-matrix Chat section

Both docs described "VCSM chat runtime is **hybrid**" with legacy `vc.*` paths active. This was accurate at document-write time but became stale after 2026-04-05 when all legacy `vc.*` chat code was removed. The `vcsm.chat.migration-status.md` and `vcsm.runtime.duplicate-write-authorities.md` both confirm migration complete.

**Fixes applied:**
- Added migration-complete note with date and source links to both docs
- Authority matrix chat rows updated from "Hybrid authority" → "Engine Controller" for main paths; "Engine Controller + App Controller bridge" for spam/moderation paths

---

### F-3d-03 — RPC audit is 4 weeks old; `delete_my_account` / `delete_my_vport` RPCs were missing as of April 13

**Finding ID:** F-3d-03
**Doc:** `vcsm.runtime.rpc-audit.md`
**Drift Status:** STALE (point-in-time audit)
**Drift Severity:** MEDIUM

As of April 13, 2026:
- `delete_my_account` — ❌ MISSING (account deletion broken)
- `delete_my_vport` — ❌ MISSING (vport deletion via RPC broken)
- `block_actor` / `unblock_actor` — ⚠️ SCHEMA MISMATCH (moderation schema not prefixed)
- `search_actor_directory` / `provision_vcsm_identity` — ⚠️ SCHEMA MISMATCH

These were unresolved at audit time. The 4-week gap means any DB migrations run since April 13 could have added or changed these RPCs.

**Required command:** `/DB` — re-verify which RPCs now exist, particularly `delete_my_account` and `delete_my_vport`. Also confirm whether schema mismatch RPCs were fixed.

---

### F-3d-04 — duplicate-write-authorities chat rows are marked historical but still affect reader

**Finding ID:** F-3d-04
**Doc:** `vcsm.runtime.duplicate-write-authorities.md`
**Drift Status:** MINOR DRIFT
**Drift Severity:** LOW

The doc correctly has a "Resolved duplicate authorities (2026-04-05)" section at the bottom. However, the main table above still lists all chat rows with two authority paths (engine + legacy), and the reader must read to the bottom to know these are resolved. The "historical reference" note is present but easy to miss.

**Recommended fix:** Add `[RESOLVED — see below]` suffix to each resolved chat row in the Authority Path B column to make the resolved status scannable at first read.

---

### F-3d-05 — `top-mutation-bug-risks.md` rank 3 mentions legacy chat send as active risk

**Finding ID:** F-3d-05
**Doc:** `vcsm.runtime.top-mutation-bug-risks.md` — row 3
**Drift Status:** STALE
**Drift Severity:** LOW

Row 3 says:
> **Legacy chat send path** — Hybrid chat authority — "Remove remaining legacy send callers and route all sends through engine RPC" — Difficulty: Medium

This was a valid risk before April 5. As of 2026-04-05, all 9 VCSM chat hooks delegate to @chat engine and legacy callers were removed. This item should be marked RESOLVED.

**Recommended fix:** Strike through or annotate row 3 as RESOLVED (2026-04-05) — same pattern used in `high-risk-mutations.md` rank 3.

---

## Pending Review by Other Commands

| Finding | Required Command | Reason | Priority |
|---|---|---|---|
| F-3d-01: Booking docs schema + new controllers | `/DB` | Schema `vport` vs `vc` must be resolved before booking docs can be corrected (dependent on F-3b-01) | HIGH |
| F-3d-03: RPC audit stale — `delete_my_account` / `delete_my_vport` missing | `/DB` | Re-verify live DB RPCs since April 13; confirm if account/vport deletion RPCs were implemented | MEDIUM |
| F-3d-03: Schema mismatch RPCs (block_actor, provision_vcsm_identity) | `/DB` | Confirm if calling code was fixed to prefix schema correctly | MEDIUM |

---

## Doc Status Summary

| Doc | Drift Found | Severity | Status After |
|---|---|---|---|
| `vcsm.runtime.mutation-matrix.md` | Chat section stale; booking missing new controllers | HIGH (booking), LOW (chat) | Chat FIXED; booking pending /DB |
| `vcsm.runtime.authority-matrix.md` | Chat rows all "Hybrid"; booking missing new controllers | HIGH (booking), LOW (chat) | Chat FIXED; booking pending /DB |
| `vcsm.runtime.idempotency-matrix.md` | Booking missing new vport controllers | HIGH | Pending /DB |
| `vcsm.runtime.transaction-boundary-map.md` | Booking missing new vport controllers | HIGH | Pending /DB |
| `vcsm.runtime.high-risk-mutations.md` | Stale source path; rank 9 booking may be incomplete | LOW | Path FIXED |
| `vcsm.runtime.silent-failure-map.md` | Stale source path | LOW | Path FIXED |
| `vcsm.runtime.top-mutation-bug-risks.md` | Rank 3 chat item not marked resolved | LOW | Flagged |
| `vcsm.runtime.duplicate-write-authorities.md` | Chat resolved rows not visually scannable | LOW | Flagged |
| `vcsm.runtime.rpc-audit.md` | Point-in-time audit; 4 weeks old; 2 missing RPCs unresolved | MEDIUM | Flagged for /DB |
| UI audit docs (3) | Not reviewed — out of mutation scope | — | N/A |

---

## Action Items

| Priority | Action | Owner |
|---|---|---|
| HIGH | `/DB` verify `vport` schema + `vport.bookings` table — resolves F-3b-01 which unblocks booking doc updates | DB |
| HIGH | After /DB: Update booking rows in mutation-matrix, authority-matrix, idempotency-matrix, transaction-boundary-map with new vport dashboard controllers | Logan |
| MEDIUM | `/DB` re-run RPC audit to verify `delete_my_account` / `delete_my_vport` and schema mismatch fixes | DB |
| LOW | Mark `top-mutation-bug-risks.md` rank 3 as RESOLVED (chat send legacy) | Logan |
| LOW | Add `[RESOLVED — see below]` annotation to resolved chat rows in duplicate-write-authorities table | Logan |
| NEXT | Phase 3e: `vcsm/profiles/`, `vcsm/public/`, `vcsm/notifications/` audit (9 docs) | Logan |
