# Module Architecture Report — vcsm.vport
# Generated: 2026-06-02
# Ticket: ARCHITECT-VPORT-0001
# ARCHITECT §26.11 — Dated Immutable Module Report
# Status: IMMUTABLE — do not edit; supersede with a new dated report

---

# vport — Full Module Architecture Report

## Report Header

| Field | Value |
|---|---|
| Feature | vport |
| App | VCSM |
| Security Tier | HIGH |
| Feature Status | ACTIVE |
| Base Source Path | `apps/VCSM/src/features/vport/` |
| Architecture State | EVOLVING |
| Module Status | MOSTLY COMPLETE |
| Run Date | 2026-06-02 |
| Ticket | ARCHITECT-VPORT-0001 |
| Prior ARCHITECT Evidence | 432 files at `_CANONICAL/logan/marvel/architect/VPORT/` |
| Prior ARCHITECTURE.md | Replaced by this report |

---

## Feature Overview

The `vport` feature is the foundational identity creation and lifecycle management system
for all VCSM business actor identities. It owns:

1. **VPORT creation wizard** — multi-tab form (profile + services), async avatar upload,
   booking workspace provisioning (barbershop type), service catalog hydration
2. **Lifecycle management** — soft delete, hard delete, restore via typed RPCs
3. **Service catalog** — read surface for available services during VPORT creation
4. **Preview / showcase** — public-facing VPORT preview components and data models

The base feature path (`apps/VCSM/src/features/vport/`) is the identity root. The full
VPORT governance surface spans 600+ files across:
- `apps/VCSM/src/features/profiles/kinds/vport/` — type-specific screens and controllers
- `apps/VCSM/src/features/dashboard/vport/` — owner management hub
- `apps/VCSM/src/features/public/vportMenu/` — public zero-auth menu/QR surface
- `apps/VCSM/src/features/settings/vports/` — owner settings

---

## Layer Presence

| Layer | Present | Path |
|---|---|---|
| Controllers | YES | `apps/VCSM/src/features/vport/controller/` |
| DALs | YES | `apps/VCSM/src/features/vport/dal/` |
| Models | YES | `apps/VCSM/src/features/vport/model/` + `createVportForm.model.js` (root) |
| Hooks | YES | `apps/VCSM/src/features/vport/hooks/` |
| Screens | YES | `apps/VCSM/src/features/vport/screens/` |
| Components | YES | `apps/VCSM/src/features/vport/components/` |
| Adapters | YES | `apps/VCSM/src/features/vport/adapters/` |
| Public / Preview | YES | `apps/VCSM/src/features/vport/public/` |
| Engine controllers | YES | `engines/booking/` (via `@booking` alias) |
| Engine DALs | YES (indirect) | `engines/hydration/` (via identity ops adapter) |

---

## Active Controllers (Base Feature Path)

| Controller | Purpose | Auth Gate |
|---|---|---|
| `submitCreateVport.controller.js` | Full VPORT creation orchestration: type validation → `create_vport` RPC → booking workspace (barbershop) → async avatar upload + write-back → list refresh | `requireUser()` in DAL; RPC enforces AUTH/DUPLICATE/INVALID server-side |
| `getVportServiceCatalog.controller.js` | Reads service catalog for a vport type; applies in-memory fallback if DB returns empty | None — read-only catalog |
| `vportCoreOps.controller.js` | Thin re-export barrel: `createVport` + `restoreVport` from DAL | Gate delegated to DAL |

**Architecture note on `vportCoreOps.controller.js`:** This file is a migration artifact —
it directly re-exports DAL functions without adding any controller-layer orchestration or
authorization. It violates the DAL→Model→Controller build order. Recommend promoting to a
real controller shell or removing in favour of `submitCreateVport.controller.js`.

---

## Active DALs (Base Feature Path)

| DAL | Tables / RPCs | Auth Guard | Notes |
|---|---|---|---|
| `vport.core.dal.js` | `vportSchema.rpc("create_vport")`, `vportSchema.from("profiles")` SELECT/UPDATE, `rpc("soft_delete_vport")`, `rpc("hard_delete_vport")`, `rpc("restore_vport")` | `requireUser()` on all mutations | Primary lifecycle DAL using `vportClient`. Contains `listMyVports` duplicate. |
| `vport.read.vportRecords.dal.js` | `vportSchema.from("profiles")` SELECT | `requireUser()` | Isolated read DAL — `listMyVports` duplicate. P2 consolidation needed. |
| `vport.write.profileMedia.dal.js` | `vportClient.from("profiles")` UPDATE (`avatar_media_asset_id`, `banner_media_asset_id`) | NONE — no `requireUser()` | Actor-keyed by `eq('actor_id', actorId)`. Gate expected from caller. MEDIUM risk. |
| `readVportServiceCatalogByType.dal.js` | `vportSchema.from("service_catalog")` SELECT | None required — read-only | Explicit column list enforced. No inactive records unless `includeInactive=true`. |

---

## Active Hooks (Base Feature Path)

| Hook | Calls | Purpose |
|---|---|---|
| `useCreateVport.js` | `submitCreateVportController`, `useUpsertVportServices`, `useAuth` | Creation lifecycle state machine — submit/busy/error, post-creation navigation |
| `useVportServiceCatalog.js` | `getVportServiceCatalogController`, `useProfilesOps` | Fetches service catalog for a vport type; wires fallback rows |
| `useRestoreVport.js` | `useVportAccountOps` (settings adapter) | Resolves vportId then calls restoreVport; manages busy/error state |
| `useVportCoreOps.js` | `vportCoreOps.controller.js` | Thin wrapper — exposes `createVport` and `restoreVport` to consumers |

---

## Engine Dependencies

| Engine | Alias / Import Path | Purpose | Direction |
|---|---|---|---|
| `booking` | `@booking` → `engines/booking/src/controller/createOrganizationLocationWorkspace.controller.js` | Creates org/location/resource workspace for barbershop VPORTs during creation | vport → engines/booking |
| `media` (app-level) | `@media` → `uploadMediaController` | Avatar file upload during VPORT creation | vport → media engine alias |
| `hydration` (indirect) | `@/features/identity/adapters/identityOps.adapter` → `refreshVcActorDirectory` | Refreshes actor directory after create/update | vport → identity → hydration |

---

## Cross-Feature Dependencies (Base Feature Path)

| Feature | What Is Imported | Import Surface | Boundary Status |
|---|---|---|---|
| `profiles` | `VPORT_TYPE_GROUPS`, `resolveVportServiceCatalogType` | `profiles/adapters/kinds/vport/config/vportTypes.config.adapter` | COMPLIANT — adapter-gated |
| `profiles` | `useUpsertVportServices` | `profiles/adapters/kinds/vport/hooks/services/useUpsertVportServices.adapter` | COMPLIANT — adapter-gated |
| `profiles` | `useProfilesOps` | `profiles/adapters/profiles.adapter` | COMPLIANT — adapter-gated |
| `media` | `createMediaAssetController`, `resolveVcsmAppId` | `media/adapters/media.adapter`, `media/adapters/mediaAppId.adapter` | COMPLIANT — adapter-gated |
| `identity` | `useIdentity` | `identity/adapters/identity.adapter` | COMPLIANT — adapter-gated |
| `settings` | `useVportAccountOps` | `settings/adapters/settings.adapter` | COMPLIANT — adapter-gated |
| `debuggers` | `bugBunnyUploadStep`, `bugBunnyUploadError` | `@debuggers/media/bugBunnyUploadDebugger` | Acceptable — dev-only conditional path |

**No boundary violations found in the base vport feature path.**

---

## Authorization Pattern

### Creation Path
`requireUser()` → `supabase.auth.getUser()` throws if no session. Server-side `create_vport`
RPC enforces AUTH_REQUIRED, VPORT_ALREADY_EXISTS_FOR_ACTOR, INVALID_CATEGORY. Client-side
type validation against `VPORT_TYPE_GROUPS` catalog before RPC call.

### Delete / Restore Path
RPCs (`soft_delete_vport`, `hard_delete_vport`, `restore_vport`) return
`VPORT_NOT_FOUND_OR_UNAUTHORIZED` if the caller does not own the VPORT. Ownership enforced
at DB layer server-side.

### Media Write-Back Path
`vport.write.profileMedia.dal.js` has no `requireUser()` call. The `eq('actor_id', actorId)`
filter limits blast radius to a single record but does not verify caller session ownership.
The async caller (`submitCreateVportController`) inherits session from the parent flow but
does not re-assert. Risk: MEDIUM.

### Update Path
`updateVport()` in `vport.core.dal.js` calls `requireUser()` but performs no ownership
assertion before the UPDATE. A malicious caller with a valid session could update any
profile row if they know the `vportId`. The RLS policy on `vport.profiles` is the last
line of defense.

---

## Structural Risks Summary

| Risk | Severity | Source | Status |
|---|---|---|---|
| `vport.public.js` migration barrel leaks DAL functions | MEDIUM | `features/vport/vport.public.js` | OPEN — Phase 2 remediation pending |
| `vportCoreOps.controller.js` thin DAL re-export | LOW | `controller/vportCoreOps.controller.js` | OPEN — migration artifact |
| `listMyVports` duplication across 2 DAL files | MEDIUM | `vport.core.dal.js` + `vport.read.vportRecords.dal.js` | OPEN — P2 consolidation |
| `vport.write.profileMedia.dal.js` missing `requireUser()` | MEDIUM | `dal/vport.write.profileMedia.dal.js` | OPEN |
| `updateVport()` missing ownership assertion | MEDIUM | `vport.core.dal.js` line 183 | OPEN — RLS is last defense |
| `vport.adapter.js` exports DAL functions (§5.3 exception) | LOW | `adapters/vport.adapter.js` | TRACKED — documented exception |
| S-BLK-001 — locksmith 3 paths missing ownership gate | CRITICAL | `profiles/kinds/vport/controller/locksmith/` | BEFORE RELEASE BLOCKER |
| ELEK-007/008 — menu delete controllers missing gates | HIGH | `profiles/kinds/vport/controller/menu/` | OPEN |
| ELEK-009 — deleteVportServiceAddonController dual failure | HIGH | `profiles/kinds/vport/controller/` | OPEN — runtime broken |
| VD-01/VD-02 — team management critical auth gaps | CRITICAL | `dashboard/vport/controller/` | OPEN |
| VENOM-DELETE-002 — delete RPCs untracked | HIGH | DB | DEFERRED |
| VENOM-DELETE-003 — hard_delete cascade incomplete | HIGH | DB | DEFERRED |
| Hardcoded PUBLIC_REALM_ID | HIGH (pre-Void) | gas + menu controllers | DEFERRED |
| VENOM-CONTENT-004 — legacy RLS OR-merge | HIGH | DB | OPEN — DB-BLOCKED |
| V-SUB-001/002/003 — 17 CI tests failing | HIGH | CI | OPEN — pending controller fixes |

---

## Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Feature overview documented; source map in DR_STRANGE + prior ARCHITECTURE | None |
| Owner defined | PARTIAL | Auth surfaces identified; no OWNERSHIP.md | OWNERSHIP.md missing — run IRONMAN |
| Entry points mapped | PASS | 3 controllers, 3 adapters, `vport.public.js` barrel, `public/` preview | `vport.public.js` is unofficial entry point pending removal |
| Controllers present | PASS | 3 controllers (1 thin re-export) | `vportCoreOps.controller.js` should be promoted or removed |
| DAL/repository present | PASS | 4 DALs — lifecycle, records, media, service catalog | Duplicate `listMyVports`; media DAL missing session guard |
| Models/transformers | PASS | 3 model files across root + `model/` + `public/` | `vportPreviewModel.js` location inconsistency (in `public/` not `model/`) |
| Hooks/view models | PASS | 4 hooks — creation, catalog, restore, core ops | `useVportCoreOps` is a thin wrapper |
| Screens/components | PASS | `RestoreVportScreen.jsx` + `CreateVportForm.jsx` + 3 tab components | `CreateVportForm.jsx` at feature root, not in `screens/` |
| Authorization path mapped | PARTIAL | Creation: requireUser + RPC server-side; delete/restore: RPC server-side; update: requireUser only | `vport.write.profileMedia.dal.js` missing requireUser; `updateVport` missing ownership assertion |
| Engine dependencies mapped | PASS | booking engine, media alias, hydration via identity | None — all accounted for |
| Tests/validation noted | FAIL | 0 test files in base feature path | SPIDER-MAN BLOCKED — 0 test coverage |

---

## Module Independence Classification

**MOSTLY INDEPENDENT**

The base vport feature path has clean adapter-gated cross-feature dependencies and no import
boundary violations at the time of this scan. The coupling to `profiles` for type
configuration and service catalog resolution is high-frequency but correctly adapter-gated.
The `vport.public.js` migration barrel intentionally leaks DAL functions and must be removed
to achieve INDEPENDENT classification.

---

## Architecture State

**EVOLVING**

Rationale: The base feature path has a clear DAL→Controller→Hook flow and clean adapter
boundaries. Three patterns prevent STABLE classification: (1) `vportCoreOps.controller.js`
is a thin DAL re-export with no controller logic; (2) `vport.public.js` is an active
migration barrel leaking DAL functions with no tracked completion date; (3) `listMyVports`
duplication across two DAL files creates dual-source-of-truth risk. The broader governance
surface has 27 open security findings with CRITICAL blockers before release.

---

## Recommended Handoffs

| Command | Priority | Reason |
|---|---|---|
| VENOM | P0 | S-BLK-001 is BEFORE RELEASE BLOCKER — 3 locksmith paths missing ownership gate |
| IRONMAN | P1 | OWNERSHIP.md missing; VD-01/VD-02 team management CRITICAL auth gaps |
| CARNAGE | P1 | VENOM-DELETE-002 (RPCs untracked), VENOM-DELETE-003 (cascade incomplete), VENOM-CONTENT-004 (RLS — DB-BLOCKED) |
| SPIDER-MAN | P1 | 0 tests in base path; 7 CRITICAL + 7 HIGH missing regression tests; 17 CI tests failing |
| SENTRY | P2 | Runtime verification of RLS policy adequacy for `updateVport()` and `vport.write.profileMedia.dal.js` |

---

## Final Module Status

**MOSTLY COMPLETE**

The base vport feature path has all required layers present, a clean adapter boundary audit,
and a well-structured creation and lifecycle domain. Known gaps requiring resolution:
0 test coverage, `vport.public.js` migration barrel still active, `vportCoreOps.controller.js`
thin-re-export pattern, `listMyVports` duplication, and media DAL missing session guard.
The extended governance surface (27 open findings, CRITICAL team auth gaps, before-release
locksmith blocker) must be resolved before a COMPLETE classification is achievable for
the vport governance domain.

---

## ARCHITECT Run Record

| Field | Value |
|---|---|
| Date | 2026-06-02 |
| Ticket | ARCHITECT-VPORT-0001 |
| Architecture State | EVOLVING |
| Module Status | MOSTLY COMPLETE |
| Source files scanned | 29 (base feature path) |
| Prior governance files read | DR_STRANGE.md, ARCHITECTURE.md (prior), FEATURE_INDEX_RUNTIME/vport.md (prior) |
| Engine cross-references | booking, hydration (indirect), media alias |
| Cross-feature imports audited | profiles, media, identity, settings, debuggers |
| Boundary violations found | 0 (base path) |
| Structural risks identified | 6 (base path); 9+ in extended governance surface |
| Open security findings (total) | 27 |
| Tests found | 0 |
