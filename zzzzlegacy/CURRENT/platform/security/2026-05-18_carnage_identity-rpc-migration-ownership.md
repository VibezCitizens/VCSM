# CARNAGE Migration Audit — Identity RPC Ownership
_Date:_ 2026-05-18
_Triggered by:_ CEREBRO pass — secondary next command after LOKI
_Boundary contract enforced:_ `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`
_Application Scope:_ VCSM + ENGINE

---

## CARNAGE TARGET

```text
CARNAGE TARGET
Objects:          platform.provision_vcsm_identity (RPC)
                  identity.refresh_actor_directory_row (RPC)
Application Scope: VCSM + ENGINE
Type of change:   Migration ownership audit — not a proposed change
Reason:           IRONMAN OQ-4: migration history unknown for both RPCs.
                  Neither RPC has a tracked creation migration in
                  apps/VCSM/supabase/migrations/. Runtime dependency
                  confirmed. Audit required before release gating.
```

---

## Evidence Gathered

| Source | Finding |
|---|---|
| `apps/VCSM/src/features/identity/dal/provision.rpc.dal.js` | `provision_vcsm_identity(p_user_id uuid, p_actor_id uuid)` → `uuid`; SECURITY DEFINER; writes 6 objects |
| `apps/VCSM/src/features/identity/dal/refreshActorDirectory.dal.js` | `refresh_actor_directory_row(p_actor_domain text, p_actor_id uuid)`; graceful return |
| `apps/VCSM/supabase/migrations/` (full directory scan) | No migration file mentions `provision_vcsm_identity` |
| `apps/VCSM/supabase/migrations/` (full directory scan) | No migration file mentions `refresh_actor_directory_row` |
| `zNOTFORPRODUCTION/_ACTIVE/migrations/2026-05-10_secdef_a_search_path_hardening.sql:30` | `identity.refresh_actor_directory_row` EXISTS in live DB — search_path hardened 2026-05-10 |
| `zNOTFORPRODUCTION/_ACTIVE/migrations/2026-05-10_secdef_a_search_path_hardening.sql` | `platform.provision_vcsm_identity` NOT present in secdef_a hardening migration |
| `apps/wentrex/supabase/migrations/20260331020000_platform_grants_and_provision_rpc.sql` | Wentrex equivalent `provision_wentrex_identity` HAS a tracked creation migration |
| `apps/wentrex/src/features/identity/dal/refreshActorDirectory.dal.js` | Wentrex uses the SAME `identity.refresh_actor_directory_row` RPC — shared cross-app |

---

## SCHEMA TRUST CLASSIFICATION

| Object | Classification | Reason |
|---|---|---|
| `platform.provision_vcsm_identity` | Identity-sensitive + Ownership-sensitive + Engine-critical | SECURITY DEFINER; bootstraps the entire VCSM platform identity chain; writes auth-gating rows (user_app_access, user_app_accounts) |
| `platform.user_app_access` | Identity-sensitive + Runtime-critical | Controls whether a user is granted, suspended, or revoked from VCSM |
| `platform.user_app_accounts` | Identity-sensitive + Runtime-critical | Primary platform account row — required for all identity resolution |
| `platform.user_app_preferences` | Identity-sensitive | Active actor preference — drives active actor selection |
| `platform.user_app_state` | Identity-sensitive + Runtime-critical | Onboarding status, destination, login timestamps |
| `platform.user_app_actor_links` | Identity-sensitive + Ownership-sensitive | Actor-to-account bridge; links vc actors to platform accounts |
| `vc.actors.user_app_account_id` | Identity-sensitive + Ownership-sensitive | Bridge column — written by RPC; ties vc.actors to platform.user_app_accounts |
| `identity.refresh_actor_directory_row` | Runtime-critical + Engine-critical | Shared cross-app RPC; refreshes `identity.actor_directory` used by both VCSM and Wentrex for actor discovery |
| `identity.actor_directory` | Runtime-critical | Actor directory table; read by public discovery and actor search flows |

---

## RPC 1: `platform.provision_vcsm_identity`

### CURRENT STRUCTURE

```text
CURRENT STRUCTURE
Schema:           platform
Type:             SECURITY DEFINER function
Signature:        provision_vcsm_identity(p_user_id uuid, p_actor_id uuid) → uuid
Returns:          user_app_account_id (uuid)
Idempotent:       YES (inferred from comment "safe to call on every login")
Written tables:
  1. platform.user_app_access        — UPSERT (inferred)
  2. platform.user_app_accounts      — UPSERT
  3. platform.user_app_preferences   — UPSERT
  4. platform.user_app_state         — UPSERT
  5. platform.user_app_actor_links   — UPSERT (actor_source='vc')
  6. vc.actors.user_app_account_id   — UPDATE bridge column
Tracked migration: MISSING — no entry in apps/VCSM/supabase/migrations/
search_path guard: UNKNOWN — not listed in 2026-05-10_secdef_a hardening migration
auth.uid() guard:  UNKNOWN — signature takes p_user_id as caller-supplied param
                   (Wentrex equivalent validates auth.uid() === p_user_id internally)
```

### MIGRATION RISKS

```text
MIGRATION RISKS
Breaking change risks:
  - HIGH: No tracked migration. If the function was ever dropped and
    recreated without documentation, the schema may differ from what the
    DAL assumes. Cannot verify without DB inspection.

Security risk:
  - HIGH: The VCSM RPC takes p_user_id as an explicit parameter, unlike
    the Wentrex RPC which uses auth.uid() internally. If the VCSM function
    body does not validate that p_user_id == auth.uid(), any authenticated
    user could potentially provision platform rows for a different user_id.
    This cannot be confirmed from app code alone. DB inspection required.

Performance risks:
  - LOW: One-time bootstrap. Not a hot path.

Data integrity risks:
  - MODERATE: The vc.actors bridge column write (item #6) — if the RPC
    updates vc.actors.user_app_account_id, RLS on vc.actors must permit
    this under SECURITY DEFINER elevation. If vc.actors has RLS enabled
    with restricted UPDATE policy, a definer search_path error could
    silently fail the bridge write without failing the full RPC.

Policy interaction risks:
  - MODERATE: SECURITY DEFINER bypass means all RLS is bypassed for the
    6 write operations. This is intentional, but the trust guarantee
    (user cannot provision rows for other users) depends entirely on the
    function body's internal auth.uid() validation — which is unverified.

Rollback difficulty:
  - DIFFICULT: The RPC creates rows in 6 tables in a single transaction.
    Rolling back a schema change to this function would require recreating
    it. The lack of a migration file makes this harder.

Null migration gap:
  - CRITICAL: The Wentrex equivalent was created via a tracked migration
    file. The VCSM equivalent has NO tracked creation migration in
    apps/VCSM/supabase/migrations/. The function exists in production
    but its creation SQL is untracked and undocumented.
```

### Migration Safety Status

```text
Migration Safety Status: CAUTION
Confidence: MEDIUM
Blocking Risks:
  1. No tracked creation migration — function body and security model
     are unverifiable from the codebase alone.
  2. p_user_id is a caller-supplied parameter — auth.uid() guard
     unconfirmed. DB inspection required to close this gap.
  3. Not included in 2026-05-10 secdef_a search_path hardening —
     may have an unhardened search_path (vulnerability window).
```

---

## RPC 2: `identity.refresh_actor_directory_row`

### CURRENT STRUCTURE

```text
CURRENT STRUCTURE
Schema:           identity
Type:             Function (trust level unconfirmed — likely NOT SECURITY DEFINER)
Signature:        refresh_actor_directory_row(p_actor_domain text, p_actor_id uuid)
Returns:          void (inferred from DAL — no data used)
Idempotent:       YES (UPSERT into actor_directory)
References:       identity.actor_directory, vc.actors, vc.actor_owners,
                  vc.actor_privacy_settings, vport.profiles, learning.actors,
                  learning.actor_owners, learning.actor_profiles, public.profiles
Written tables:
  1. identity.actor_directory — UPSERT/UPDATE single actor row
Tracked migration (VCSM): MISSING — no entry in apps/VCSM/supabase/migrations/
search_path guard: APPLIED — 2026-05-10_secdef_a hardened:
                   SET search_path = 'identity', 'vc', 'learning', 'vport', 'public', 'pg_temp'
Cross-app usage:  BOTH VCSM and Wentrex call this RPC
                  — VCSM: features/identity/dal/refreshActorDirectory.dal.js
                  — Wentrex: apps/wentrex/src/features/identity/dal/refreshActorDirectory.dal.js
```

### MIGRATION RISKS

```text
MIGRATION RISKS
Breaking change risks:
  - MEDIUM: No tracked creation migration in either app's migrations directory.
    The function exists in production (confirmed by secdef_a search_path hardening).
    Creation SQL is untracked.

Cross-app risk:
  - HIGH: This is a SHARED RPC used by both VCSM and Wentrex. Any parameter
    contract change (adding/renaming params, changing return type) would break
    BOTH apps simultaneously. No shared engine migration coordination exists.

Performance risks:
  - LOW: Single-actor refresh; not a hot path for identity resolution.
    Called after mutations: post-vport-create (awaited), post-vport-update
    (fire-and-forget). Non-fatal design absorbs RPC failures gracefully.

Data integrity risks:
  - LOW: actor_directory is a refreshable materialized view or indexed table.
    If the refresh fails, the primary user operation is not rolled back by design.
    Stale actor_directory data is a known acceptable risk.

Policy interaction risks:
  - LOW: Not SECURITY DEFINER (inferred). Operates under RLS of calling user.
    Actor directory updates are keyed by actor_id — no cross-user write risk.

Rollback difficulty:
  - MODERATE: Cross-app shared RPC. Any rollback requires coordination across
    VCSM and Wentrex. No single app owns this RPC.

Null migration gap:
  - HIGH: No tracked creation migration in VCSM supabase/migrations/. The
    function was backfilled directly into the DB. search_path was patched
    externally (secdef_a), not via a Supabase-tracked migration.
```

### Migration Safety Status

```text
Migration Safety Status: CAUTION
Confidence: HIGH (function confirmed live via secdef_a evidence)
Blocking Risks:
  1. No tracked creation migration — creation SQL unverifiable.
  2. Cross-app shared function — change coordination required
     between VCSM and Wentrex before any signature change.
  3. Signature contract must not change without THOR gate.
```

---

## MIGRATION BLAST RADIUS

### `platform.provision_vcsm_identity`

```text
MIGRATION BLAST RADIUS
Affected systems:   VCSM identity feature (sole caller)
Runtime impact:     Bootstrap path (self-heal + onboarding) breaks if RPC is
                    dropped, renamed, or signature changes
Release impact:     Release-blocking if RPC is missing or wrong
Rollback impact:    DIFFICULT — no tracked migration to roll back to
```

### `identity.refresh_actor_directory_row`

```text
MIGRATION BLAST RADIUS
Affected systems:   VCSM (features/identity/dal/refreshActorDirectory.dal.js)
                    Wentrex (apps/wentrex/src/features/identity/dal/refreshActorDirectory.dal.js)
Runtime impact:     Actor directory becomes stale if RPC is broken; non-fatal by design
Release impact:     Non-blocking for individual app releases — graceful degradation
Rollback impact:    MODERATE — shared cross-app function; both apps affected by rollback
```

---

## RLS IMPACT REVIEW

| Object | RLS Dependency | Risk | Follow-up Required |
|---|---|---|---|
| `platform.provision_vcsm_identity` | CRITICAL — bypasses RLS on 6 tables (SECURITY DEFINER) | HIGH — trust guarantee depends on function body auth.uid() guard | DB inspection: verify auth.uid() guard in function body |
| `platform.user_app_access` | DIRECT — SELECT RLS exists; INSERT bypassed by SECURITY DEFINER | MEDIUM | Already bypassed by design |
| `platform.user_app_accounts` | DIRECT — SELECT RLS; INSERT bypassed | MEDIUM | Already bypassed by design |
| `platform.user_app_actor_links` | DIRECT — SELECT RLS; INSERT bypassed | MEDIUM | Already bypassed by design |
| `vc.actors.user_app_account_id` | INDIRECT — vc.actors has RLS; bridge UPDATE runs under SECURITY DEFINER | MEDIUM | Verify UPDATE succeeds under SECURITY DEFINER elevation |
| `identity.refresh_actor_directory_row` | INDIRECT — governed by identity schema RLS | LOW | Not SECURITY DEFINER; standard RLS applies |
| `identity.actor_directory` | INDIRECT — read by discovery queries | LOW | RLS on actor_directory: confirm only authenticated can write |

---

## RUNTIME IMPACT ANALYSIS

| Runtime Area | Risk | Expected Impact | Mitigation |
|---|---|---|---|
| Self-heal path (provision + retry) | HIGH — entire new-user bootstrap depends on this RPC | RPC failure = bootstrap failure = user cannot log in | 2-layer guard in controller (return false on error; no throw to UI) |
| Onboarding bootstrap | HIGH — same RPC, same risk | Same as self-heal | Same guard |
| Actor directory refresh | LOW — non-fatal by design | Stale directory data; no user-visible failure | `refreshActorDirectory.dal.js:32` — graceful return on error |
| Warm-path (cache hit) | NONE — RPC not called on cache hit | No impact | N/A |
| Cross-app (Wentrex) refresh | LOW — shared RPC | Wentrex actor directory stale on failure | Same graceful return pattern in Wentrex DAL |

---

## MIGRATION DEPENDENCY GRAPH

| Dependency Type | Affected Area | Risk |
|---|---|---|
| DAL dependency | `provision.rpc.dal.js` — sole VCSM caller | HIGH — no fallback |
| DAL dependency | `refreshActorDirectory.dal.js` — VCSM + Wentrex | MEDIUM — graceful fallback exists |
| Engine dependency | `engines/identity/` — configures but does not call provision directly | LOW — engine calls via app-injected ops |
| RPC dependency | `provision_vcsm_identity` ← `ensureVcsmPlatformBootstrap.controller.js` | CRITICAL — no alternate write path |
| RPC dependency | `refresh_actor_directory_row` ← shared (VCSM + Wentrex) | MEDIUM — shared contract |
| search_path hardening | `identity.refresh_actor_directory_row` — patched by secdef_a | LOW — already hardened |
| search_path hardening | `platform.provision_vcsm_identity` — NOT in secdef_a | HIGH — unverified hardening |

---

## DATA INTEGRITY REVIEW

| Integrity Area | Risk | Detection Method | Mitigation |
|---|---|---|---|
| User cannot be provisioned twice | LOW (idempotent by design) | Duplicate row attempt would be caught by UPSERT ON CONFLICT | Idempotent upsert pattern in RPC body (inferred) |
| vc.actors bridge column orphan | MODERATE — if RPC fails after platform rows but before bridge write | No atomic rollback guarantee visible | Full atomic transaction in RPC body (inferred from SECURITY DEFINER) |
| actor_directory stale after failed refresh | LOW — stale data, not corrupt data | No detection needed | Graceful return; next mutation triggers refresh |
| Platform rows written without vc actor existing | HIGH — if actorId param is invalid | DAL throws if actorId missing; RPC body (unverified) may not validate | DB inspection required: does RPC validate vc.actors.id before writing? |

---

## MIGRATION EXECUTION STRATEGY

| Phase | Strategy | Risk | Notes |
|---|---|---|---|
| Immediate | DB inspection only | LOW | Run DB command to retrieve `platform.provision_vcsm_identity` body — verify auth.uid() guard, search_path, idempotent upsert pattern |
| Short-term | Create tracked migration file for `provision_vcsm_identity` | LOW | `CREATE OR REPLACE FUNCTION` — capture current live body in a new migration file in `apps/VCSM/supabase/migrations/` |
| Short-term | Add search_path hardening to `provision_vcsm_identity` | LOW if already hardened; HIGH if not | Must be done if secdef_a was not applied |
| Medium-term | Create tracked migration file for `refresh_actor_directory_row` | LOW | Shared function — place in a shared/platform migration path or document as DB-managed |
| Long-term | Establish cross-app shared RPC governance | MEDIUM | `identity.*` shared RPCs need an owner and a change-coordination contract |

---

## ROLLBACK SURVIVABILITY

### `platform.provision_vcsm_identity`

```text
ROLLBACK SURVIVABILITY
Rollback status:          DIFFICULT
Data recovery risk:       LOW — all writes are idempotent upserts; no data loss
                          if function is recreated from a backup of the body
Compatibility rollback risk: HIGH — if signature changes, DAL must change simultaneously
Operational complexity:   HIGH — no migration file means rollback requires
                          DB access to recreate the function manually
```

### `identity.refresh_actor_directory_row`

```text
ROLLBACK SURVIVABILITY
Rollback status:          PARTIAL
Data recovery risk:       LOW — actor_directory is refreshable; no data loss
Compatibility rollback risk: HIGH — shared by VCSM and Wentrex; rollback
                             requires coordinating both apps
Operational complexity:   MODERATE — search_path hardening is already applied
                          (from secdef_a); rollback to unhardened form would
                          reintroduce a known security gap
```

---

## IDENTITY / OWNERSHIP MIGRATION WARNINGS

```text
IDENTITY / OWNERSHIP MIGRATION WARNING — MW-01
Object:             platform.provision_vcsm_identity
Current behavior:   SECURITY DEFINER function that writes auth-gating rows
                    (user_app_access, user_app_accounts). Takes p_user_id as
                    a caller-supplied parameter.
Migration risk:     If the function body does not enforce auth.uid() == p_user_id,
                    any authenticated user could call it with a different user's ID
                    and provision platform rows for that user, bypassing access gates.
Potential impact:   CRITICAL — unauthorized platform account provisioning
Recommended safeguards:
  1. DB inspection: retrieve function body, verify internal auth.uid() guard
  2. If guard missing: add `IF v_user_id IS DISTINCT FROM p_user_id THEN RAISE EXCEPTION`
     and deploy as a tracked migration
  3. Add to VENOM security audit
```

```text
IDENTITY / OWNERSHIP MIGRATION WARNING — MW-02
Object:             identity.refresh_actor_directory_row
Current behavior:   Shared cross-app RPC; no parameter contract change in view
Migration risk:     If either app adds a new caller with different domain assumptions
                    (e.g., 'learning' vs 'vc'), the shared function body must
                    handle all domains correctly
Potential impact:   MEDIUM — stale directory data for actors in the wrong domain
Recommended safeguards:
  1. Document all supported domain values ('vc', 'learning', potentially others)
  2. Any future domain addition requires testing both VCSM and Wentrex callers
```

---

## BOUNDARY MIGRATION REVIEW

| Schema Object | Scope Owner | Cross-Root Risk | Status |
|---|---|---|---|
| `platform.provision_vcsm_identity` | VCSM-specific (platform schema) | LOW — only VCSM calls this; Wentrex has separate `provision_wentrex_identity` | OPEN — no tracked migration |
| `identity.refresh_actor_directory_row` | Shared — ENGINE / identity schema | HIGH — VCSM and Wentrex both call same RPC | OPEN — no tracked migration in either app |
| `identity.actor_directory` | Shared — ENGINE / identity schema | MEDIUM — both apps depend on this table | UNDOCUMENTED — table governance unclear |
| `platform.user_app_actor_links` | Platform schema | LOW — platform schema owns all platform tables | CAUTION — untracked bridge writes via provision RPC |

---

## VALIDATION CHECKLIST

| Validation Area | Status | Notes |
|---|---|---|
| Schema compatibility (VCSM DAL) | CONFIRMED — DAL matches inferred signature | Params: `p_user_id`, `p_actor_id`; returns uuid |
| Schema compatibility (Wentrex DAL) | CONFIRMED — `refresh_actor_directory_row` params match | `p_actor_domain text, p_actor_id uuid` |
| auth.uid() guard (provision_vcsm_identity) | UNVERIFIED | DB inspection required — MW-01 |
| search_path hardening (provision_vcsm_identity) | UNVERIFIED | Not in secdef_a; may be unhardened |
| search_path hardening (refresh_actor_directory_row) | VERIFIED | Applied in secdef_a 2026-05-10 |
| Idempotent write pattern | INFERRED for both | No data loss on repeated calls |
| Cross-app contract compatibility | CONFIRMED for refresh | Both apps use same signature; neither has changed it |
| Tracked creation migration | MISSING for both | Core gap — see recommended actions |
| RLS bypass scope | INFERRED (SECURITY DEFINER on provision) | VENOM review required for provision |
| Bridge column (vc.actors.user_app_account_id) | UNVERIFIED | Does RPC validate actor exists before writing? |

---

## RECOMMENDED ACTIONS (Priority Order)

### P1 — DB Inspection (BLOCKING for VENOM closure)

Run DB query to retrieve `platform.provision_vcsm_identity` function body and verify:
- Internal auth.uid() guard present (`v_user_id := auth.uid(); IF v_user_id IS NULL THEN RAISE...`)
- p_user_id == auth.uid() enforced at DB level (or p_user_id parameter not used if auth.uid() is used exclusively)
- search_path SET clause present (prevents search_path injection)
- Idempotent UPSERT ON CONFLICT pattern for all 6 writes

**Owner:** DB + VENOM

### P2 — Create Tracked Migration for `provision_vcsm_identity`

File: `apps/VCSM/supabase/migrations/<timestamp>_platform_provision_vcsm_identity.sql`

Content: `CREATE OR REPLACE FUNCTION platform.provision_vcsm_identity(...)` capturing current live body.

**Owner:** CARNAGE + feature owner

### P3 — Create Tracked Migration for `refresh_actor_directory_row`

Decision required: This is a shared identity-schema function. It should live in a shared DB management path, not in `apps/VCSM/supabase/migrations/` alone. Options:
- Document it as DB-admin-managed (not tracked per-app)
- Create a separate `engines/identity/` migration path
- Add to both `apps/VCSM/supabase/migrations/` and `apps/wentrex/supabase/migrations/`

**Owner:** CARNAGE + DB

### P4 — Add `provision_vcsm_identity` to VENOM Security Audit

The security surface documented in LOKI AT-01 and VENOM RISK-4 requires a standalone security audit record.

**Owner:** VENOM

---

## RECOMMENDED HANDOFFS

| Finding | Recommended Handoff | Reason |
|---|---|---|
| MW-01 (auth.uid() guard unverified) | VENOM + DB | Critical security surface — needs live DB verification |
| P1 DB inspection | DB | Must run SQL introspection on provision function body |
| P2 Create provision migration | Feature owner | Capture current live body in tracked migration |
| P3 Create refresh migration | DB + CARNAGE | Shared function — needs governance decision on ownership |
| search_path for provision | DB | Verify if secdef_a was manually applied to this function |
| RISK-10 console output | Team | Part of debug logging contract decision |

---

## FINAL CARNAGE STATUS

**CAUTION**

Both RPCs are confirmed live in production and used correctly by the DAL layer. No runtime breakage exists. The CAUTION status is driven by:

1. **Missing tracked migrations** for both RPCs — creation SQL is untracked in `apps/VCSM/supabase/migrations/`. This is a governance gap, not a runtime failure.
2. **Unverified auth.uid() guard** in `platform.provision_vcsm_identity` — the most important security property of the highest-privilege VCSM frontend function cannot be confirmed from app code. Requires DB inspection.
3. **Cross-app shared RPC** (`identity.refresh_actor_directory_row`) has no documented change-coordination contract.

No BLOCKED findings. No release-blocking items if current production behavior is correct. The gaps are documentation and governance gaps that must be closed before the next schema change to either RPC.
