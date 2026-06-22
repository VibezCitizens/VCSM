---
# settings — SECURITY.md
# Last Updated: 2026-06-02
# Updated By: TICKET-DOCS-CLEANUP-001 (backfilled from audit evidence)
# Status: CURRENT SOURCE OF TRUTH
# BLACKWIDOW: PARTIAL (engine version kind-check gap requires IRONMAN canonicalization before BLACKWIDOW can confirm BLOCKED)

Security posture for the settings feature. Findings sourced from ELEKTRA (2026-05-28),
VENOM (TICKET-0004 / 2026-05-27), and BLACKWIDOW (2026-05-27) audit evidence.
A full post-implementation VENOM+ELEKTRA pass has not run since TICKET-0009 — see Pending section.

---

## Security Posture Summary

**Overall:** PARTIAL — gated write paths confirmed on VPORT stacks; privacy controller stack not hardened
**Highest Open Severity:** HIGH (ELEK-2026-05-28-002 — actor privacy hijack)
**THOR Blocker State:** CAUTION — ELEK-002/004 (privacy stack) deferred to separate sprint; not current release-blocking per IRONMAN but represents unmitigated attack surface
**VENOM Status:** RUN (2026-05-27) — evidence-backed; post-TICKET-0009 re-run PENDING
**ELEKTRA Status:** RUN (2026-05-28) — findings documented; post-TICKET-0009 re-run PENDING
**BLACKWIDOW Status:** RUN (2026-06-02) — BW-SETTINGS-001 DRAFT (engine kind-check gap); BW-SETTINGS-005 OPEN, BW-SETTINGS-003 RESOLVED
**SENTRY Status:** NOT RUN — recommended after TICKET-0009 changes

---

## Command Coverage

| Command | Status | Last Run |
|---|---|---|
| VENOM | RUN | 2026-06-02 — new finding VENOM-2026-06-02-005 added; prior run 2026-05-27 carried |
| ELEKTRA | RUN | 2026-05-28 |
| BLACKWIDOW | RUN | 2026-06-02 — BW-SETTINGS-001 added; prior 2026-05-27 run carried |
| SENTRY | NOT RUN | NEVER — recommended post-TICKET-0009 |
| THOR | NOT RUN | NEVER as dedicated settings gate — IRONMAN verdict: may release with caution |

---

## VENOM STATUS

VENOM Last Run: 2026-06-02
VENOM Status: PARTIAL (prior VENOM run 2026-05-27 carried; new finding VENOM-2026-06-02-005 added)

### VENOM-2026-06-02-005 — assertActorOwnsVportActorController Cross-Feature Dependency (HIGH / OPEN)
- assertActorOwnsVportActorController physically lives in features/booking/controller/ (and engines/booking/src/controller/)
- Settings imports this gate from the booking adapter path — cross-feature ownership dependency
- ~45 non-test consumer files across settings, profiles, dashboard, join all import from booking
- Risk: if booking feature is changed, removed, or restructured, ALL ownership gates across the platform break simultaneously
- Single point of failure: one file in booking owns the security gate for ALL VPORT write operations platform-wide
- Exploitability: MEDIUM — requires coordinated code change or module replacement to exploit
- Blast Radius: All VPORT write surfaces — settings, profiles, dashboard, join, booking
- Required fix: Promote assertActorOwnsVportActorController to a platform-shared auth primitive (shared/ or engines/auth/); decouple from booking feature
- Follow-up: IRONMAN (ownership), SENTRY (boundary), ARCHITECT (structural)
- THOR Blocker: NO (current implementation is correct; structural risk only)

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-02
BLACKWIDOW Status: PARTIAL (engine version kind-check gap requires IRONMAN canonicalization before BLACKWIDOW can confirm BLOCKED)

### BW-SETTINGS-001 — VPORT Kind Bypass via Engine assertActorOwnsVportActor (HIGH / DRAFT)
- Attack: VPORT-kind actor (kind='vport') with UUID matching targetActorId calls settings mutation that resolves engine version of assertActorOwnsVportActorController
- Engine version self-shortcut: returns {ok:true,mode:'self'} on requestActorId === targetActorId BEFORE kind check — ELEK-004 fix not ported to engine version
- Feature version (post-ELEK-004): kind check runs FIRST — user kind required — self-shortcut blocked for VPORT-kind actors
- Settings resolve path: 2 direct imports from booking/controller (vportBusinessCardSettings, vportSocialSettings) resolve FEATURE version (post-ELEK-004) — these paths appear SAFE
- Runtime abuse result: PARTIAL — direct settings imports use safe feature version; risk for consumers that resolve engine version via adapter
- Defense gate: PARTIAL — feature version correct; engine version unsafe; canonicalization pending
- Governance status: DRAFT
- THOR blocker: CAUTION — engine version must receive ELEK-004 port before adapter canonicalization
- Required fix: Port ELEK-004 kind check to engine version; canonicalize to single implementation
- Follow-up: IRONMAN

---

## Trust Boundary Architecture

```
Client
  |
  v  VportSettingsFinalScreen — GATE: useVportOwnership (UI only, not authoritative)
  |
  v  VportSettingsScreen
  |
  v  useSaveVportSettings (React state + lifecycle only — post TICKET-0009)
  |
  +----------------------------------------------------------+
  |  BOUNDARY 0 — Coordinator Entry Point (TICKET-0009)     |
  |  settingsCoordinator.controller.js                       |
  |  - Validation orchestration                              |
  |  - Returns { ok: false, error } on validation fail       |
  |  - Delegates to saveVportPublicDetailsByActorId          |
  +----------------------------------------------------------+
  |
  +----------------------------------------------------------+
  |  BOUNDARY 1 — Application Layer Gate                    |
  |  saveVportPublicDetailsByActorIdController               |
  |  assertActorOwnsVportActorController(                    |
  |    requestActorId, targetActorId                         |
  |  )  -> queries vc.actor_owners                           |
  +----------------------------------------------------------+
  |
  +----------------------------------------------------------+
  |  BOUNDARY 2 — DAL Secondary Check (legacy pattern)      |
  |  upsertVportPublicDetailsDAL                             |
  |  supabase.auth.getUser() -> userId                       |
  |  WHERE owner_user_id = userId  (legacy, not actor_owners)|
  +----------------------------------------------------------+
  |
  +----------------------------------------------------------+
  |  BOUNDARY 3 — Database RLS Gate (canonical)             |
  |  vport.profile_public_details                            |
  |  Policy: actor_can_manage_profile(profile_id)            |
  |  -> queries vc.actor_owners                              |
  +----------------------------------------------------------+
```

| Boundary | Gate | Strength |
|---|---|---|
| Screen gate | useVportOwnership (UI) | WEAK — UI only, not authoritative |
| Coordinator | Validation orchestration | STRUCTURAL — no auth check here |
| Controller gate | assertActorOwnsVportActorController | STRONG — canonical actor_owners |
| DAL secondary | owner_user_id = userId | MEDIUM — legacy, belt-and-suspenders |
| DB RLS | actor_can_manage_profile(profile_id) | STRONG — canonical |

---

## Findings

### RESOLVED

**ELEK-2026-05-28-001 | HIGH | RESOLVED**
- Source: `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_settings.md`
- Finding: `ctrlSetVportBusinessCardPublishState` — no controller-layer ownership check before calling SECURITY DEFINER RPC. `vportId` accepted from hook caller with no `assertActorOwnsVportActorController` call. Sole defense was DB-layer SECURITY DEFINER RPC. Pattern was asymmetric with all other write controllers.
- Resolution: TICKET-0009 pre-flight confirmed `assertActorOwnsVportActorController` present on line 7 of `settings/vports/controller/vportBusinessCard.controller.js`.
- Verification: Source read confirmed — `await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: vportActorId })`

**ELEK-2026-05-28-003 | MEDIUM | RESOLVED**
- Source: `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_settings.md`
- Finding: `syncDirectoryVisibleToPublicDetailsDAL` — writes to `profile_public_details` after soft ownership check; table previously had no RLS. Secondary check used `owner_user_id` (legacy), not `actor_owners`.
- Resolution: CARNAGE migration `vport_profile_public_details_write_rls` applied 2026-05-27. RLS canonical on `vport.profile_public_details`. VENOM-SETTINGS-002 confirmed RESOLVED.
- Evidence: `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-27_carnage_team-settings-rls-audit.md`

**VENOM-SETTINGS-001 | MEDIUM | RESOLVED**
- Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/supporting/SETTINGS_SECURITY_ARCHITECTURE.md`
- Finding: `upsertVportPublicDetailsDAL` exported from `cards/settings/index.js` — creating a bypass channel around the controller ownership gate.
- Resolution: TICKET-0009 removed controller export from `index.js`. Grep confirmed zero external callers.

**VENOM-SETTINGS-002 | HIGH | RESOLVED**
- Source: `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-27_carnage_team-settings-rls-audit.md`
- Finding: No RLS on `vport.profile_public_details` — any authenticated user with a known `profile_id` could overwrite email, phone, address, geolocation, hours, `directory_visible`.
- Resolution: Migrations `20260527030000` + `20260527040000` applied. Policies added: `ppd_insert_owner`, `ppd_update_owner` (via `actor_owners`), `ppd_select_public`, `ppd_delete_blocked`.

**VENOM-SETTINGS-006 | MEDIUM | RESOLVED**
- Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_19-00_blackwidow_settings-tab-classification.md`
- Finding: `identity.vportType` used in `useMemo` — client-side state injection risk.
- Resolution: BW-SETTINGS-003 mitigation applied. `vportType` now derived exclusively from `dashboardDetails.vportType` sourced from DB.

---

### NEEDS_REVIEW

**VENOM-SETTINGS-003 | MEDIUM | NEEDS_REVIEW**
- Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/supporting/SETTINGS_SECURITY_ARCHITECTURE.md`
- Finding: `syncDirectoryVisibleToPublicDetailsDAL` auth guard — DAL writes without session binding using legacy `owner_user_id` rather than `actor_owners`.
- Context: `ctrlSetVportDirectoryVisible` has canonical gate (`assertActorOwnsVportActorController`) before calling the DAL. DB RLS on `profile_public_details` is canonical (VENOM-SETTINGS-002 resolved). Legacy DAL check is belt-and-suspenders only.
- Risk: LOW — two canonical gates exist upstream; legacy pattern is redundant but not exploitable in isolation.
- Recommended action: CARNAGE migration to update DAL secondary check to `actor_owners` pattern (same sprint as VENOM-SETTINGS-004). Not a THOR blocker.

---

### OPEN

**ELEK-2026-05-28-002 | HIGH | OPEN / DEFERRED**
- Source: `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_settings.md`
- Finding: `ctrlSetActorPrivacy` — `actorId` accepted from caller with no server-side ownership verification. Any authenticated user can toggle `is_private` for any `actor_id` supplied. No `callerActorId` accepted or checked.
- Attack: Actor A can be forced private by actor B, suppressing discovery.
- Status: DEFERRED — labeled "Separate sprint" in TICKET-0009 run log. No sprint assigned.
- Required fix: Add `callerActorId` parameter and `assertActorOwnsVportActorController` (or equivalent identity assertion) before the DAL call.

**ELEK-2026-05-28-004 | MEDIUM | OPEN / DEFERRED**
- Source: `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_settings.md`
- Finding: `dalSetActorPrivacy` — no `auth.getUser()` binding. `actorId` accepted from caller without any session anchor. UPSERT fires on `vc.actor_privacy_settings` with no `userId`-to-`actorId` cross-reference at DAL layer.
- Context: RLS status on `vc.actor_privacy_settings` not confirmed — DB audit required.
- Status: DEFERRED — labeled "Separate sprint" in TICKET-0009 run log. No sprint assigned.

**ELEK-2026-05-28-005 | LOW | OPEN**
- Source: `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_settings.md`
- Finding: `dalDeleteOwnedVportById` — deprecated DAL still exported and live in bundle. Uses legacy `owner_user_id` model. Omits cascade logic (no `deleted_at`, no booking cancellation, no actor chain). Confirmed live in `settingsAccountFeature.group.js` imports.
- Required fix: Replace with an error-throw stub; implement proper cascade controller when VPORT deletion is formally productized.

**ELEK-2026-05-28-006 | INFO | OPEN**
- Source: `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_settings.md`
- Finding: `readActorOwnersByUserDAL` — `userId` accepted from controller caller without server-session binding in DAL. Read-only; not directly exploitable in isolation.
- Risk: LOW — read-only path; no write surface.
- Recommended action: Add `auth.getUser()` binding at DAL layer for consistency with `actor_owners` canonical pattern.

**VENOM-SETTINGS-004 | MEDIUM | OPEN / DEFERRED P2**
- Source: `zNOTFORPRODUCTION/_ACTIVE/audits/architecture/2026-05-27_architect_venom-settings-004-list-my-vports.md`
- Finding: `listMyVportsDAL` and `readMyVports` query `vport.profiles` via `owner_user_id = auth.uid()`, violating Owner Meaning Rule. Should use `actor_owners` join.
- Context: Pre-flight confirmed zero stranded owners (7/7 VPORTs have canonical `actor_owners` coverage). No migration required — pure DAL code change. Approved `actor_owners` two-hop join pattern documented.
- Status: DEFERRED P2 — no sprint assigned.

**BW-SETTINGS-005 | LOW | OPEN**
- Source: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_19-00_blackwidow_settings-tab-classification.md`
- Finding: `upsertVportPublicDetailsDAL` performs unconditional upsert with no optimistic locking, no CSRF token, no rate limiting. Post-auth attack only — requires session compromise.
- Blast radius: Bounded to owner's own VPORT public identity fields.
- Risk: LOW — precondition is full session compromise.
- Recommended action: Add idempotency key or optimistic lock (updated_at check) in a future hardening sprint.

---

## Pending Migration — Security Scope

**TICKET-SUB-010-B — actor_social_settings owner delegation RLS**
- Status: PENDING — migration proposed, not yet applied
- Proposed policies: `social_settings_select_owner_delegate` + `social_settings_update_owner_delegate` on `vc.actor_social_settings`
- Enables VPORT owners to read/write their VPORT's social settings
- Unblocks `ctrlUpdateVportSocialSettings` (does not yet exist)
- DB must confirm `actor_owners` composite index before production
- Source: `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-28_carnage_actor-social-settings-owner-delegation-rls.md`

---

## Write Surface Risk Assessment

| Surface | Write Type | Ownership Gate | Risk |
|---|---|---|---|
| settings/account/controller/ | PROFILE_MUTATION | YES | HIGH |
| settings/privacy/controller/ | CONFIG_WRITE | YES (Blocks.controller.js) / NO (actorPrivacy.controller.js — ELEK-002) | HIGH |
| settings/profile/controller/ | PROFILE_MUTATION | YES | HIGH |
| settings/vports/controller/ | CONFIG_WRITE | YES | HIGH |

---

## Pending Full Audit

VENOM and ELEKTRA have not run a complete post-implementation pass since TICKET-0009.
The findings above are based on:
- ELEKTRA audit 2026-05-28 (`2026-05-28_elektra_settings.md`)
- VENOM planning artifacts from TICKET-0004 (`SETTINGS_SECURITY_ARCHITECTURE.md`)
- BLACKWIDOW red team 2026-05-27
- Direct source verification during TICKET-0009 execution

Recommended: Run SENTRY post-execution review, then VENOM+ELEKTRA scoped to settings after TICKET-SUB-010-B migration is applied.

---

## History Index

| Date | Ticket | Security Event |
|---|---|---|
| 2026-05-26 | IRONMAN | Ownership audit run — VCSM-DASH-SETTINGS-001 CLEAR; test coverage gap flagged |
| 2026-05-27 | CARNAGE | profile_public_details RLS canonicalized — VENOM-SETTINGS-002 RESOLVED |
| 2026-05-27 | BLACKWIDOW | Red team run — BW-SETTINGS-005 OPEN; VENOM-SETTINGS-006 mitigated |
| 2026-05-28 | ELEKTRA | Full settings audit run — 6 findings (001-006); 001+003 subsequently resolved |
| 2026-06-02 | TICKET-0009 | VENOM-SETTINGS-001 resolved; ELEK-001 verified resolved; settingsCoordinator created; SECURITY.md seeded in dashboard governance |

Evidence files:
- `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-28_elektra_settings.md`
- `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-27_carnage_team-settings-rls-audit.md`
- `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_19-00_blackwidow_settings-tab-classification.md`
- `zNOTFORPRODUCTION/HISTORY/2026/06/commands/wolverine/2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md`
---
