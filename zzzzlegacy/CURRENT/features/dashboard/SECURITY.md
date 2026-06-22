# dashboard — SECURITY.md
# Last Updated: 2026-06-04
# Ticket: TICKET-DASHBOARD-MODULE-PROMOTION-0002
# Updated By: VENOM / ELEKTRA / BLACKWIDOW module promotion pass
# Status: CURRENT SOURCE OF TRUTH

Security posture for the dashboard feature. Full VENOM dashboard-wide audit completed
2026-06-04 (TICKET-DASHBOARD-CONTINUATION-0001) — verdict: BLOCKED.
VEN-DASH-001 (quickStats ownership gate) is patched in current source by
`TICKET-DASH-vportOwnerStats-ELEK003-PATCH-001`. VEN-DASH-002 (flyer profileId
binding) is patched in current source by `TICKET-DASH-flyerBuilder-ELEK001-PATCH-001`.
VEN-DASH-003 / ELEK-002 (design studio documentId binding) is patched in current
source by `TICKET-DASH-designStudio-ELEK002-PATCH-001`; focused regression tests pass.
Live SQL verification confirmed RLS enabled and owner-scoped on all `vc.design_*`
tables, with zero rows, zero orphans, zero owner-integrity failures, and no SQL
functions touching design tables. Settings, bookings, team, leads, portfolio, gas prices
write paths all source-verified secure (38/38 surfaces traced). Zero exploitable paths
on settings card.

TICKET-DASHBOARD-MODULE-PROMOTION-0002 promotes `calendar`, `exchange`, `locksmith`,
`reviews`, and `services` into first-class dashboard modules because each has adapter-backed
workflow, ownership gating, user workflow, or delegated mutation behavior. No new local DAL
write surface was found in these five modules; security risk is delegated through booking,
profiles, locksmith, reviews, and services adapters.

TICKET-DASHBOARD-TIER4-TRIAD-QR-001 ran a focused Tier 4 triad pass for `qrcode`
and `shared` on 2026-06-04. `shared` remains CLEAR / NOT_APPLICABLE. `qrcode`
has no local write surface, DAL, RPC, or controller path; the pass found one
consumer guard issue in `ActorProfileHeader.jsx` where profile QR URLs could fall
back to a raw `actorId`. `QRCODE-CONSUMER-GUARD-002` is patched in current source:
profile-header QR now requires `isQrSafeSlug(profile.username)` and hides the QR
button when no safe public handle exists.

TICKET-DASH-GAS-SOURCE-COMPLETE-001 patched source-side gas architecture gaps on
2026-06-04. `cards/gasprices/index.js` no longer exports DAL files; the owner screen
is split into Final/View files; submit owner/citizen paths are split into focused
controllers; cache invalidation is centralized in `FuelPriceCacheService`. Regression
coverage exists in `gasprices.index.rule9.test.js`, `gasprices.spiderman.test.js`,
and the gas controller/DAL tests. Gas remains THOR CAUTION until live DB RLS/check
constraint evidence is supplied for gas tables.

TICKET-DASH-PORTFOLIO-COMPLETE-001 completed `portfolio` on 2026-06-04.
`cards/portfolio/index.js` no longer exports DAL or controller files; submit/upload
hooks now live at card-level `hooks/`; dashboard trace diagnostics use
`features/portfolio/adapters/portfolioTrace.adapter.js`; media asset backfill is
profile-scoped. Regression coverage exists in `portfolio.index.rule9.test.js` and
`portfolio.spiderman.test.js`.

TICKET-DASH-LEADS-RULE9-PATCH-001 patched `RULE9-DASH-LEADS-001` on 2026-06-04.
`cards/leads/index.js` no longer exports DAL or controller files; the public barrel
now exposes models, hooks, and screens. Regression coverage exists in
`leads.index.rule9.test.js`.

---

## Security Posture Summary

**Overall:** BLOCKED — qrcode/shared/vportOwnerStats/portfolio are fully complete, but broader SPIDER-MAN coverage and BEHAVIOR approval/sign-off remain open for other modules
**Highest Open Severity:** P1 module regression coverage and governance sign-off
**THOR Blocker State:** BLOCKED — broader SPIDER-MAN coverage and BEHAVIOR approval/sign-off remain open
**VENOM Status:** COMPLETE (TICKET-DASHBOARD-CONTINUATION-0001 2026-06-04) — BLOCKED; full dashboard-wide pass
**ELEKTRA Status:** EVIDENCE-BACKED (ELEK-001 confirmed resolved; ELEK-002/004 RESOLVED 2026-05-29 per governance matrix — reconciled from DEFERRED by TICKET-DASH-DOC-SYNC-001)
**BLACKWIDOW Status:** COMPLETE / CAUTION (TICKET-DASH-BLACKWIDOW-001 2026-06-02) — zero exploitable paths on settings trust chain; 4 findings (0 CRITICAL, 0 HIGH, 1 MEDIUM cross-feature, 1 LOW dead-code, 2 INFO)
**SENTRY Status:** PARTIAL (TICKET-DASH-SENTRY-001 2026-06-02) — source architecturally COMPLIANT; Rules 6 + 9 verified; trust boundaries confirmed

---

## Dashboard Module Security Coverage Matrix

| Tier | Module | VENOM | ELEKTRA | BLACKWIDOW | THOR Classification | BEHAVIOR.md | SPIDER-MAN |
|---|---|---|---|---|---|---|---|
| Tier 1 | flyerBuilder | COMPLETE — parent save patched | COMPLETE — profileId binding patched | COMPLETE — parent non-owner/write binding covered | CAUTION — broader SPIDER-MAN open | DRAFT | PARTIAL |
| Tier 1 | designStudio | COMPLETE — document ownership patched | COMPLETE — caller documentId bound | COMPLETE — design RLS live-verified | CAUTION — broader SPIDER-MAN open | DRAFT | PARTIAL |
| Tier 1 | vportOwnerStats | COMPLETE — ownership gate patched | COMPLETE — callerActorId bound | COMPLETE — non-owner rejected before reads | CLEAR | APPROVED | COMPLETE |
| Tier 1 | bookings | COMPLETE | COMPLETE — update profile scope patched | COMPLETE — RLS hardening live-verified | CAUTION — direct reschedule field updates intentionally not DB-granted | DRAFT | PARTIAL |
| Tier 1 | team | COMPLETE — update/delete scope patched | COMPLETE — direct DAL scopes bound | COMPLETE — scoped write tests added | CAUTION — RLS verification open | DRAFT | PARTIAL |
| Tier 1 | settings | COMPLETE | COMPLETE | COMPLETE | CAUTION | MISSING | PARTIAL |
| Tier 1 | leads | COMPLETE — fast count + Rule 9 patched | COMPLETE — poll path and public barrel patched | COMPLETE — unauthorized fast count rejected | CAUTION — public lead governance open | DRAFT | PARTIAL |
| Tier 2 | portfolio | COMPLETE — Rule 9 + hook boundary patched | COMPLETE — media profile scope and adapter boundary covered | COMPLETE — owner gate/scoped writes covered | CLEAR | APPROVED | COMPLETE |
| Tier 2 | schedule | COMPLETE | COMPLETE | COMPLETE | CAUTION | MISSING | PARTIAL |
| Tier 2 | gas prices | COMPLETE — Rule 9 + source architecture patched | COMPLETE — split owner/citizen paths and cache service covered | COMPLETE — owner gates source-tested; DB RLS pending | CAUTION — live RLS/check verification open | DRAFT | COMPLETE FOR SOURCE |
| Tier 3 | calendar | COMPLETE | COMPLETE | COMPLETE | CAUTION | MISSING | MISSING |
| Tier 3 | exchange | COMPLETE | COMPLETE | COMPLETE | CAUTION | MISSING | MISSING |
| Tier 3 | locksmith | COMPLETE | COMPLETE | COMPLETE | CAUTION | MISSING | MISSING |
| Tier 3 | reviews | COMPLETE | COMPLETE | COMPLETE | CAUTION | MISSING | MISSING |
| Tier 3 | services | COMPLETE | COMPLETE | COMPLETE | CAUTION | MISSING | MISSING |
| Tier 4 | qrcode | COMPLETE — no local write surface | COMPLETE — URL source-to-sink guarded | COMPLETE — UUID bypass patched | CLEAR | APPROVED | COMPLETE |
| Tier 4 | shared | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | CLEAR | APPROVED | COMPLETE |

## Promoted Module Triad Results

| Module | VENOM Result | ELEKTRA Result | BLACKWIDOW Result | Security Status |
|---|---|---|---|---|
| calendar | No local DAL writes; delegated booking availability/resource writes and optional feed publish path found. | Source-to-sink is adapter delegated; no caller-supplied local sink found. | Owner UI gate present; authoritative adapter enforcement not re-proven in this module. | CAUTION — adapter-backed workflow requires delegated tests/contracts. |
| exchange | No local DAL writes; rate save and feed publish go through profiles adapters. | Screen-local normalization/optimistic state does not write directly. | Owner UI gate present before owner workflow; adapter must enforce write authorization. | CAUTION — adapter-backed workflow requires delegated tests/contracts. |
| locksmith | No local DAL writes; add/update/delete service areas and publish flow go through profile adapters. | Form payload construction is local; sink is adapter delegated. | Owner UI gate present; adapter must enforce write authorization. | CAUTION — adapter-backed workflow requires delegated tests/contracts. |
| reviews | No local DAL writes; dashboard passes `owner` or `public` mode into reviews adapter. | No local source-to-sink mutation path found. | Non-owner can render public mode; owner actions must be adapter-gated. | CAUTION — review adapter authorization must remain authoritative. |
| services | No local DAL writes; service editing is delegated through VPORT services adapter after owner gate. | No local source-to-sink mutation path found. | Non-owner denied before `allowOwnerEditing=true`. | CAUTION — dashboard-local tests missing. |

---

## Settings Card Trust Boundary (TICKET-0009)

### Boundary Architecture

```
Client
  ↓ VportSettingsFinalScreen — GATE: useVportOwnership (UI only, not authoritative)
  ↓ VportSettingsScreen
  ↓ useSaveVportSettings (React state + lifecycle only — post TICKET-0009)
  ↓
  ┌──────────────────────────────────────────────────────┐
  │  BOUNDARY 0 — Coordinator Entry Point (NEW)          │
  │  settingsCoordinator.controller.js                   │
  │  - Validation orchestration                          │
  │  - Returns { ok: false, error } on validation fail   │
  │  - Delegates to saveVportPublicDetailsByActorId      │
  └──────────────────────────────────────────────────────┘
  ↓
  ┌──────────────────────────────────────────────────────┐
  │  BOUNDARY 1 — Application Layer Gate                 │
  │  saveVportPublicDetailsByActorIdController           │
  │  assertActorOwnsVportActorController(                │
  │    requestActorId, targetActorId                     │
  │  )  → queries vc.actor_owners                        │
  └──────────────────────────────────────────────────────┘
  ↓
  ┌──────────────────────────────────────────────────────┐
  │  BOUNDARY 2 — DAL Secondary Check (legacy pattern)  │
  │  upsertVportPublicDetailsDAL                         │
  │  supabase.auth.getUser() → userId                    │
  │  WHERE owner_user_id = userId  ← legacy, not actor_owners │
  └──────────────────────────────────────────────────────┘
  ↓
  ┌──────────────────────────────────────────────────────┐
  │  BOUNDARY 3 — Database RLS Gate (canonical)          │
  │  vport.profile_public_details                        │
  │  Policy: actor_can_manage_profile(profile_id)        │
  │  → queries vc.actor_owners                           │
  └──────────────────────────────────────────────────────┘
```

### Trust Boundary Strength

| Boundary | Gate | Strength |
|---|---|---|
| Screen gate | `useVportOwnership` (UI) | WEAK — UI-only, not authoritative |
| Coordinator | Validation orchestration | STRUCTURAL — no auth check here |
| Controller gate | `assertActorOwnsVportActorController` | STRONG — canonical actor_owners |
| DAL secondary | `owner_user_id = userId` | MEDIUM — legacy, belt-and-suspenders |
| DB RLS | `actor_can_manage_profile(profile_id)` | STRONG — canonical |

Defense-in-depth: two strong gates (controller + RLS) protect all writes.

---

## Findings

### RESOLVED

**VENOM-SETTINGS-001 — Controller exported from settings public index**
- Status: RESOLVED (TICKET-0009)
- Finding: `cards/settings/index.js` exported `saveVportPublicDetailsByActorId.controller` — controllers must not be in public adapter
- Resolution: Controller export removed from `index.js` in TICKET-0009
- Verification: grep "controller" in index.js = 0 matches

**VENOM-SETTINGS-002 — profile_public_details missing canonical RLS**
- Status: RESOLVED (prior CARNAGE migration 2026-05-27)
- Finding: Table lacked canonical RLS policies
- Resolution: `public_details_insert_managed` + `public_details_update_managed` added — gate: `actor_can_manage_profile(profile_id)` → `vc.actor_owners`
- Evidence: `CURRENT/features/dashboard/supporting/SETTINGS_SECURITY_ARCHITECTURE.md` §4

**ELEK-001 — ctrlSetVportBusinessCardPublishState missing ownership gate**
- Status: RESOLVED (prior to TICKET-0009)
- Finding: Controller had no `assertActorOwnsVportActorController` call
- Resolution: Gate confirmed present on line 7 of `settings/vports/controller/vportBusinessCard.controller.js`
- Verification: Source read confirmed — `await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: vportActorId })`

**ELEK-002 — ctrlSetActorPrivacy actor impersonation**
- Status: RESOLVED 2026-05-29 — reconciled from DEFERRED by TICKET-DASH-DOC-SYNC-001
- Resolution: callerActorId + self/VPORT ownership check added; chain updated through useUpdateVportVisibility + useActorPrivacy
- Evidence: vport-dashboard-governance-matrix.md settings row (matrix is authoritative; source not independently re-read in this pass)

**ELEK-004 — dalSetActorPrivacy no auth.getUser() binding**
- Status: RESOLVED — reconciled from DEFERRED by TICKET-DASH-DOC-SYNC-001
- Resolution: Verified already resolved in code (governance matrix: "ELEK-003/004/005 verified already resolved in code, findings.md was stale")
- Evidence: vport-dashboard-governance-matrix.md settings row

**VENOM-SETTINGS-004 — listMyVportsDAL uses owner_user_id instead of actor_owners**
- Status: RESOLVED — confirmed in source by TICKET-DASH-VENOM-001
- Prior claim: Read-only query uses legacy `owner_user_id` pattern
- Source reality: `listMyVportsDAL` uses `vc.actor_owners → actors(kind='vport') → vport.profiles(actor_id)` exclusively
- Source comment: "owner_user_id is not used — §1.4 Owner Meaning Rule"
- Prior governance status was DEFERRED P2 based on stale assumption — reconciled to RESOLVED by TICKET-DASH-VENOM-DOC-SYNC-001
- Evidence: `settings/vports/dal/vports.read.dal.js` lines 22–52 (TICKET-DASH-VENOM-001 source read)

---

### PATCHED IN CURRENT SOURCE

**VEN-DASH-001 — loadOwnerQuickStatsController ownership gate — PATCHED [2026-06-04]**
- Status: PATCHED / HIGH / SOURCE_VERIFIED (`TICKET-DASH-vportOwnerStats-ELEK003-PATCH-001`)
- Finding: `vportOwnerStats.controller.js#loadOwnerQuickStatsController` accepted target `actorId` only and read booking stats + staff counts before controller-level ownership verification.
- Resolution: `callerActorId` is now threaded from `VportProfileViewScreen` → `VportBarberShopOwnerBand` → `useVportOwnerQuickStats` → `useOwnerQuickStats` → `loadOwnerQuickStatsController`.
- Controller gate: `loadOwnerQuickStatsController({ actorId, callerActorId })` now requires `callerActorId` and calls `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })` before profile, staff/resource, or booking reads.
- DAL boundary: staff resource reads moved from direct controller Supabase access into `listVportStaffResourcesByProfileIdDAL`.
- Regression test: `apps/VCSM/src/features/dashboard/vport/controller/__tests__/vportOwnerStats.controller.test.js`
- THOR blocker: NO for VEN-DASH-001; dashboard THOR remains BLOCKED by other open items.
- Evidence: CURRENT/outputs/2026/06/04/VENOM/003_TICKET-DASHBOARD-CONTINUATION-0001_venom-dashboard-full-security-review.md

### OPEN

**VENOM-SETTINGS-003 — upsertVportPublicDetailsDAL + syncDirectoryVisibleToPublicDetailsDAL use legacy `owner_user_id` secondary check**
- Status: OPEN / LOW / CONFIRMED (TICKET-DASH-VENOM-001)
- Finding: Both DALs perform `auth.getUser()` + `owner_user_id = userId` check as secondary/tertiary gate. Uses legacy ownership model, not canonical `actor_owners`.
- Controller path: `ctrlSetVportDirectoryVisible` and `saveVportPublicDetailsByActorIdController` both enforce `assertActorOwnsVportActorController` before any DAL call — controller gate STRONG
- DB RLS: `profile_public_details` canonical RLS (`actor_can_manage_profile`) is final backstop
- Exploitable: NO — no path reaches these DALs without first passing the canonical controller gate
- Risk: LOW — two canonical gates confirmed; legacy DAL check is belt-and-suspenders; no attack path demonstrated
- Recommendation: CARNAGE migration — replace `owner_user_id` check with `actor_owners` query in both DALs
- Not a THOR blocker — canonical gates intact

**VENOM-SETTINGS-005 — vportBusinessCardSettings.controller.js imports assertActorOwnsVportActorController via internal path instead of booking adapter**
- Status: PATCHED / SOURCE VERIFIED (2026-06-04)
- Finding: `vportBusinessCardSettings.controller.js` previously imported `assertActorOwnsVportActorController` from `@/features/booking/controller/assertActorOwnsVportActor.controller` (internal path). It now imports through `@/features/booking/adapters/booking.adapter`. `vportSocialSettings.controller.js` was also aligned to the adapter boundary.
- Inconsistency: three controllers in same feature, two different import paths for the same function
- Runtime security impact: NONE — same function executes in all cases
- Architecture impact: LOW — direct import bypasses adapter contract; creates hidden coupling to booking internal structure
- Recommendation: Complete
- Not a THOR blocker

---

## Audit Coverage

| Command | Status | Ticket | Verdict |
|---|---|---|---|
| VENOM | COMPLETE | TICKET-DASH-VENOM-001 | PASS WITH DEFERRED ITEMS — zero exploitable paths |
| SENTRY | PARTIAL | TICKET-DASH-SENTRY-001 | Source architecturally compliant; docs synced |
| BLACKWIDOW | COMPLETE / CAUTION | TICKET-DASH-BLACKWIDOW-001 | Zero exploitable paths on settings trust chain; BW-SETTINGS-002 cross-feature concern (flyer builder scope) |
| ELEKTRA | EVIDENCE-BACKED | Prior settings sprint + 2026-06-04 dashboard pass | Settings-era ELEK findings reconciled; current dashboard blockers tracked above |

### VENOM Source Reads (TICKET-DASH-VENOM-001)

Files read and verified during VENOM pass:
- `settings/controller/settingsCoordinator.controller.js`
- `settings/controller/saveVportPublicDetailsByActorId.controller.js`
- `settings/hooks/useSaveVportSettings.js`
- `settings/hooks/useSaveVportPublicDetailsByActorId.js`
- `settings/dal/vportPublicDetails.write.dal.js`
- `settings/index.js`
- `settings/VportSettingsFinalScreen.jsx`
- `settings/VportSettingsScreen.jsx`
- `settings/model/vportSettingsValidation.model.js`
- `settings/model/vportSettingsDraft.model.js`
- `settings/vports/dal/vports.write.dal.js`
- `settings/vports/dal/vports.read.dal.js`
- `settings/vports/controller/vportBusinessCard.controller.js`
- `settings/vports/controller/vportBusinessCardSettings.controller.js`
- `settings/vports/controller/vportDirectoryVisibility.controller.js`
- `settings/vports/hooks/useVportBusinessCardSettings.js`
- `settings/vports/hooks/useVportDirectoryVisibility.js`
- `booking/controller/assertActorOwnsVportActor.controller.js`

### BLACKWIDOW Source Reads (TICKET-DASH-BLACKWIDOW-001)

Additional files read during BLACKWIDOW adversarial pass:
- `settings/vports/hooks/useResolvedVportId.js`
- `settings/vports/index.js`
- `booking/adapters/booking.adapter.js`
- `flyerBuilder/controller/flyerEditor.controller.js`
- `flyerBuilder/dal/flyer.write.dal.js`
- `settings/profile/dal/vportPublicDetails.write.dal.js` (dead code — deleted 2026-06-04)

---

## BLACKWIDOW Findings (TICKET-DASH-BLACKWIDOW-001)

| ID | Severity | Finding |
|---|---|---|
| BW-SETTINGS-001 | INFO | `useSaveVportSettings.onSave` lacks `if (saving) return;` guard — double-tap fires two concurrent controller calls. Both pass ownership. PostgreSQL UPSERT serializes via row lock. Idempotent result. UX concern only, zero security impact. |
| BW-SETTINGS-002 | MEDIUM | `flyerBuilder/controller/flyerEditor.controller.js` → `saveFlyerPublicDetails` originally wrote caller-supplied `profileId` into `vport.profile_public_details`. PATCHED 2026-06-04: controller now verifies owner actor access, resolves the VPORT profile from `ownerActorId`, and passes only the derived profileId to the DAL. **Scoped to flyer builder; parent save path patched, nested designStudio still tracked separately.** |
| BW-SETTINGS-003 | LOW | PATCHED 2026-06-04: deleted `settings/profile/dal/vportPublicDetails.write.dal.js` and removed the dev diagnostics upsert probe that imported it. Source scan confirms no remaining imports. |
| BW-SETTINGS-004 | INFO | Restatement of VENOM-SETTINGS-003: three settings write DALs use legacy `owner_user_id` as secondary check. All preceded by canonical controller gate. Confirmed non-exploitable in adversarial pass. |

---

## History Index

| Date | Ticket | Security Event |
|---|---|---|
| 2026-05-27 | CARNAGE | profile_public_details RLS canonicalized — VENOM-SETTINGS-002 RESOLVED |
| 2026-06-02 | TICKET-0009 | VENOM-SETTINGS-001 resolved; ELEK-001 verified resolved; settingsCoordinator created; SECURITY.md seeded |
| 2026-06-02 | TICKET-DASH-SENTRY-001 | SENTRY post-execution PARTIAL — source architecturally compliant (Rules 6+9 pass, trust boundaries confirmed) — VENOM pending |
| 2026-06-02 | TICKET-DASH-DOC-SYNC-001 | ELEK-002 + ELEK-004 reconciled from DEFERRED to RESOLVED per governance matrix; BLACKWIDOW status explicit; SENTRY status added |
| 2026-06-02 | TICKET-DASH-VENOM-001 | VENOM post-implementation pass COMPLETE — PASS WITH DEFERRED ITEMS; VENOM-SETTINGS-004 RESOLVED in source; VENOM-SETTINGS-003 confirmed LOW; VENOM-SETTINGS-005 added INFO |
| 2026-06-02 | TICKET-DASH-VENOM-DOC-SYNC-001 | VENOM results synced to governance docs; VENOM-SETTINGS-004 moved to RESOLVED; VENOM-SETTINGS-005 documented; BLACKWIDOW recommended as next command |
| 2026-06-02 | TICKET-DASH-BLACKWIDOW-001 | BLACKWIDOW adversarial pass COMPLETE — CAUTION; zero exploitable paths on settings trust chain; BW-SETTINGS-001 INFO, BW-SETTINGS-002 MEDIUM (flyer builder), BW-SETTINGS-003 LOW (dead code), BW-SETTINGS-004 INFO |
| 2026-06-02 | TICKET-DASH-BLACKWIDOW-002 | BLACKWIDOW findings synced to governance docs; SECURITY.md BLACKWIDOW status COMPLETE; BW-SETTINGS-002/003 added to DEFERRED.md |
| 2026-06-04 | TICKET-DASH-GAS-RULE9-PATCH-001 | RULE9-DASH-GAS-001 resolved in source; gasprices public index no longer exports DAL files; Rule 9 regression test added |
| 2026-06-04 | TICKET-DASH-GAS-SOURCE-COMPLETE-001 | Gas source-side blockers resolved: Final/View split, owner/citizen submit split, centralized cache service, 57 gas tests passing; THOR remains CAUTION pending live DB RLS/check verification |
| 2026-06-04 | TICKET-DASH-PORTFOLIO-RULE9-PATCH-001 | RULE9-DASH-PORTFOLIO-001 resolved in source; portfolio public index no longer exports DAL/controller files; Rule 9 regression test added |
| 2026-06-04 | TICKET-DASH-PORTFOLIO-COMPLETE-001 | portfolio completed; card-level hooks restored; trace adapter boundary added; media profile scope and owner gate covered by focused SPIDER-MAN tests; BEHAVIOR approved; THOR CLEAR |
| 2026-06-04 | TICKET-DASH-LEADS-RULE9-PATCH-001 | RULE9-DASH-LEADS-001 resolved in source; leads public index no longer exports DAL/controller files; Rule 9 regression test added |
| 2026-06-04 | TICKET-DASH-designStudio-ELEK002-PATCH-001 | ELEK-002 / VEN-DASH-003 resolved in source; documentId paths now require document owner binding; live SQL verified `vc.design_*` RLS owner policies; focused regression tests added |
| 2026-06-04 | TICKET-BOOKING-RPC-001 / CARNAGE | Booking RLS policy hardening live-verified; broad authenticated table-level UPDATE removed; authenticated UPDATE column-limited to status/note/timestamp columns; narrow insert/update RLS policies present; no SECURITY DEFINER functions or RPCs |

Evidence TICKET-0009: `HISTORY/2026/06/commands/wolverine/2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md`
Evidence TICKET-DASH-SENTRY-001: governance-only — `CURRENT/outputs/2026/06/02/wolverine/001_wolverine_dashboard_settings-doc-sync.md`
Evidence TICKET-DASH-VENOM-001: governance-only — `CURRENT/outputs/2026/06/02/wolverine/002_dashboard-settings_wolverine_venom-doc-sync.md`
Evidence TICKET-DASH-BLACKWIDOW-001: governance-only — `CURRENT/outputs/2026/06/02/wolverine/006_dashboard-settings_wolverine_blackwidow-doc-sync.md`
