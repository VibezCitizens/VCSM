# Logan Phase 3e — Profiles, Public, Notifications Drift Report

**Date:** 2026-05-11
**Scope:**
- `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/profiles/` — 4 docs
- `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/public/` — 5 docs
- `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/notifications/` — 3 docs

---

## Immediate Fixes Applied

| File | Fix |
|---|---|
| `vcsm.notifications.engine-extraction-plan.md` | Added STATUS: EXECUTED notice at top with link to authoritative pipeline doc; fixed stale path reference at bottom |

---

## Doc-by-Doc Status

### Profiles (4 docs)

| Doc | Date | Status | Notes |
|---|---|---|---|
| `vcsm.profiles.social-pipeline.md` | 2026-05-10 | ALIGNED | Updated same day as branch changes. Block enforcement, session binding on cancel-request, dead `ctrlUnsubscribe` export removal — all documented. |
| `vcsm.profiles.subscribe-pipeline.md` | 2026-05-10 | ALIGNED | `assertingActorId` session binding on `ctrlCancelFollowRequest` documented. Friend ranks decoupling (April 6) documented. Block integration (April 6) documented. |
| `vcsm.profiles.system-audit.md` | 2026-04-09 / updated 2026-04-19 + 2026-05-03 | ALIGNED | Tab system layout updated May 3. Profile URL resolution and render chain current. Main weaknesses noted (avatar shape, lazy loading, empty states) are still accurate. |
| `vcsm.profiles.citizen-vs-vport-audit.md` | 2026-04-05 | UNVERIFIED (historical) | 1159-line architectural reference doc. DB constraints and actor kind model are foundational and stable. Ownership verification section (line 639) cites `assertActorOwnsVportActor.controller.js` which is still the live gate. Identity switch flow (line 646) accurately shows `engineSwitchActiveActor` in the path. No obvious critical drift found in sampled sections. Full code re-verification deferred to Phase 3f if needed. |

### Public (5 docs)

| Doc | Date | Status | Notes |
|---|---|---|---|
| `vcsm.public.business-card-url-routing.md` | 2026-05-09 | ALIGNED | Very recent. Accurately documents TRAZE URL shape, menu route fix, catch-all behavior. |
| `vcsm.public.vport-landing-pages.md` | 2026-04-29 | ALIGNED | Category landing pages + how-to. Not touched by current branch. |
| `vcsm.public.top-nav.md` | 2026-04-29 | ALIGNED | Nav component moved from legal feature to shared. Not touched by current branch. |
| `vcsm.public.conversion-funnel.md` | 2026-04-25 | UNVERIFIED | 269 lines, April 25. Not touched by current branch. Not fully inspected this pass. |
| `vcsm.public.seo-infrastructure.md` | 2026-04-25 | UNVERIFIED | 406 lines, April 25. Not touched by current branch. Not fully inspected this pass. |

### Notifications (3 docs)

| Doc | Date | Status | Notes |
|---|---|---|---|
| `vcsm.notifications.pipeline.md` | 2026-05-10 | ALIGNED | Most current doc. Documents 14 engine-published events including updated booking events (bidirectional confirm/cancel, batch team member notification). Appointments tab flow documented. |
| `vcsm.notifications.coverage-audit.md` | 2026-04-09 / updated 2026-04-19 | ALIGNED (historical) | Has correct "MIGRATION COMPLETE AS OF 2026-04-19" note at top. Sections 2–9 are historical. Authoritative doc pointer is correct. |
| `vcsm.notifications.engine-extraction-plan.md` | 2026-04-05 / executed 2026-04-12 | FIXED | Added EXECUTED status notice; fixed stale path reference. Now clearly marked as historical record. |

---

## Drift Findings

---

### F-3e-01 — `vcsm.notifications.pipeline.md` Appointments tab reads `vc.bookings` — new implication of F-3b-01

**Finding ID:** F-3e-01
**Doc:** `vcsm.notifications.pipeline.md` — Section 10 (Appointments Tab)
**Code:** Same doc line 217
**Drift Status:** UNVERIFIED (dependent on F-3b-01 resolution)
**Drift Severity:** HIGH

**What the doc says:**
```
listBookingsByCustomerDAL({ actorId })   [vc.bookings + profiles!profile_id + resources!resource_id]
```

**What this means:**
The Appointments tab (customer view of their own bookings) reads from `vc.bookings`. But the vport dashboard booking controllers (created/updated in the current branch) write to `supabase.schema('vport').from('bookings')` via `vportClient`.

**The conflict:**
If `vc.bookings` and `vport.bookings` are **different tables** (different schemas with no view or trigger syncing them), then:
- Bookings created via `createOwnerBooking.controller.js` → written to `vport.bookings`
- Bookings read by Appointments tab → reads from `vc.bookings`
- Result: **bookings created through the owner dashboard would never appear in the customer Appointments tab**

If they are the **same table** (e.g., `vport` schema is an alias or view of `vc` schema, or `vport.bookings` IS `vc.bookings` under a different PostgREST schema name), then both sides work correctly.

**This is a new, higher-severity implication of F-3b-01.** It is not just a doc labeling issue — it is a potential functional split between write and read paths.

**Required action:** `/DB` — verify whether `vc.bookings` and `vport.bookings` are the same physical table, or whether they are different tables. If different, this is a critical data pipeline bug, not just doc drift.

---

### F-3e-02 — `vcsm.profiles.citizen-vs-vport-audit.md` uses absolute machine paths

**Finding ID:** F-3e-02
**Doc:** `vcsm.profiles.citizen-vs-vport-audit.md` — multiple lines (e.g., lines 7–9, 22–38)
**Drift Status:** MINOR DRIFT
**Drift Severity:** LOW

The social-pipeline doc also uses absolute machine paths (`/Users/vcsm/Desktop/VCSM/apps/VCSM/src/...`). This is a style issue that makes paths non-portable. Both docs were written with absolute paths for VS Code link navigation. The paths themselves are likely still correct (we didn't verify each one). This is LOW severity — cosmetic only.

No fix applied — would require touching large docs with many occurrences.

---

### F-3e-03 — `vcsm.profiles.citizen-vs-vport-audit.md` references old identity context path

**Finding ID:** F-3e-03
**Doc:** `vcsm.profiles.citizen-vs-vport-audit.md` — line 646
**Drift Status:** MINOR DRIFT
**Drift Severity:** LOW

Line 646: `File: state/identity/identityContext.jsx → switchActor(actorId)`

The switch flow description (steps 1-5) is architecturally correct (it describes `engineSwitchActiveActor`), but the path `state/identity/identityContext.jsx` may use a relative path format that doesn't match the current file's absolute path. The file still exists in the project. The switch logic is documented correctly — this is a path format inconsistency only.

---

## Pending Review by Other Commands

| Finding | Required Command | Reason | Priority |
|---|---|---|---|
| F-3e-01: `vc.bookings` vs `vport.bookings` split — Appointments tab reads vs dashboard writes | `/DB` | New implication of F-3b-01: if different tables, customer bookings created via owner dashboard never appear in Appointments tab. Must verify whether schemas share physical tables. | CRITICAL |

---

## Cumulative /DB Verification Block

Three Phase 3 findings now require the same `/DB` verification (live schema inspection):

| Finding | Context | Impact if schemas differ |
|---|---|---|
| F-3b-01 | `vportClient.js` uses `supabase.schema('vport')` — does `vport` schema exist? | All vport dashboard DALs silently fail |
| F-3d-01 | Mutation runtime docs reference `vc.bookings` for booking mutations | Booking doc updates cannot be corrected until schema confirmed |
| F-3e-01 | Appointments tab reads `vc.bookings`; owner dashboard writes `vport.bookings` | Customer bookings may never appear in Appointments tab |

All three resolve with a single `/DB` query: `SELECT schema_name FROM information_schema.schemata` + `SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'bookings'`.

---

## Action Items

| Priority | Action | Owner |
|---|---|---|
| CRITICAL | `/DB` verify whether `vc.bookings` and `vport.bookings` are the same physical table — resolves F-3b-01, F-3d-01, F-3e-01 in one query | DB |
| LOW | Review `vcsm.public.conversion-funnel.md` and `vcsm.public.seo-infrastructure.md` in Phase 3f (not touched by current branch, low risk) | Logan |
| LOW | Consider de-absoluting paths in `vcsm.profiles.citizen-vs-vport-audit.md` and `vcsm.profiles.social-pipeline.md` | Logan (optional) |
| NEXT | Phase 3 complete — produce summary report of all phases and outstanding /DB, /Venom, /Sentry, /Falcon items | Logan |
