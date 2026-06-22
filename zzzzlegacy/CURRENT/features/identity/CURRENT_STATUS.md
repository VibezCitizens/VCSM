# CURRENT STATUS — identity

**Feature:** identity
**App:** VCSM
**As of:** 2026-05-18 (last audit date)

---

## Command Coverage Status

| Command    | Status      | Notes |
|------------|-------------|-------|
| VENOM      | COMPLETE    | 2026-05-18 — `platform.provision_vcsm_identity` RPC security audit; live DB verification performed; 3 findings (1 HIGH, 1 MEDIUM, 1 LOW) + 3 additional live findings (VLF-01/02/03) |
| LOKI       | COMPLETE    | 2026-05-18 — Identity resolution trace (normal auth, self-heal, context resolution, bootstrap); static analysis — no live runtime instrumentation captured |
| IRONMAN    | COMPLETE    | 2026-05-18 — Feature ownership audit; layer map produced; open questions identified |
| CARNAGE    | COMPLETE    | 2026-05-18 — Migration ownership audit for both identity RPCs; gaps confirmed |
| DB         | COMPLETE    | 2026-05-18 — Live DB verification via `pg_get_functiondef`; VF-01 and VF-02 status confirmed from inferred to confirmed |
| SENTRY     | NOT_STARTED | No source file found |
| SPIDER-MAN | NOT_STARTED | No source file found |
| BLACKWIDOW | NOT_STARTED | No source file found |

---

## Critical Finding Status

### VF-01 — HIGH — `provision_vcsm_identity` missing `auth.uid()` guard

- **Status:** OPEN
- **Confirmed:** Live DB inspection 2026-05-18 — `auth.uid()` is NEVER called in live function body
- **Migration ready:** `apps/VCSM/supabase/migrations/20260518040000_platform_provision_vcsm_identity.sql`
- **Migration verified safe:** YES (per VENOM 2026-05-18 final status section)
- **Migration deployed:** UNKNOWN — deployment status not reported in source files
- **Impact if undeployed:** Any authenticated user can call `provision_vcsm_identity(p_user_id := victimUserId)` and provision platform rows for any user — cross-user identity poisoning

### VF-02 — MEDIUM — `provision_vcsm_identity` search_path partially hardened

- **Status:** OPEN
- **Confirmed:** `pg_temp` missing from live `search_path`
- **Covered by migration:** YES — `20260518040000` adds `pg_temp`

### VF-03 — LOW — No audit trail after successful provisioning

- **Status:** OPEN
- **Fix recommended:** Add `debugLoginEvent('PLATFORM_BOOTSTRAP_COMPLETE', ...)` after successful bootstrap

---

## Additional Live DB Findings

| ID | Status | Finding |
|----|--------|---------|
| VLF-01 | OPEN | Live function returns `RETURNS jsonb` — DAL comments say `uuid`; mismatch |
| VLF-02 | OPEN | `p_actor_id DEFAULT NULL::uuid` — parameter is optional in live body; may allow provisioning without actor link |
| VLF-03 | OPEN | `service_role` lacks EXECUTE grant on `provision_vcsm_identity` — only `authenticated` has EXECUTE |

---

## Migration Status

| RPC | Tracked Creation Migration | Status |
|-----|---------------------------|--------|
| `platform.provision_vcsm_identity` | MISSING in `apps/VCSM/supabase/migrations/` | OPEN — no creation migration; security fix migration `20260518040000` ready but deployment UNKNOWN |
| `identity.refresh_actor_directory_row` | MISSING in `apps/VCSM/supabase/migrations/` | OPEN — no creation migration; confirmed live via secdef_a hardening migration (2026-05-10) |

---

## Runtime Performance (LOKI 2026-05-18)

Evidence basis: INFERRED — static code analysis only; no live runtime instrumentation captured.

| Path | DB Reads | RPC Writes | Read Amplification |
|------|----------|------------|-------------------|
| Normal auth (cold cache) | ~8–11 | 0 | HIGH (8–11x) |
| Normal auth (warm cache) | 1 | 0 | HEALTHY (1x) |
| Self-heal path | ~18–22 | 1 (provision + finalize) | SEVERE (18–22x) |
| Bootstrap (onboarding) | ~6–8 | 2 (provision + refresh) | HIGH (6–8x) |

Cold cache HIGH rating is one-per-120s (cache TTL). Self-heal SEVERE rating occurs at most once per new user. No LOKI performance action items flagged as blocking.

---

## Layer Architecture (IRONMAN 2026-05-18)

From first 80 lines of IRONMAN audit:

| Layer | Files | Notes |
|-------|-------|-------|
| DAL | `provision.rpc.dal.js`, `refreshActorDirectory.dal.js` | Present |
| Model | MISSING | RPC responses consumed raw — no model files |
| Controller | `ensureVcsmPlatformBootstrap.controller.js` (real logic), `refreshActorDirectory.controller.js` (hollow pass-through) | Pass-through controller is an open IRONMAN item |
| Adapter | `identity.adapter.js`, `identityOps.adapter.js` | Present |
| Hook | `useIdentityOps.js` | Present |
| Resolver | `vcsmIdentity.resolver.js` | Non-standard layer — IRONMAN RISK-9 |
| Setup | `setup.js` | Non-standard layer |
| Component/Screen | MISSING | Feature has no own UI |

**Companion state layer** (`state/identity/`) manages in-memory actor state and is separate from the feature DAL chain.
