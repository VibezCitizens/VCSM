# SECURITY — identity

**Feature:** identity
**Security Tier:** CRITICAL
**Last VENOM pass:** 2026-05-18
**Auditor:** VENOM
**Live DB verification:** YES — performed 2026-05-18 via `pg_get_functiondef`

---

## Trust Boundary

```
Caller:            Frontend (Supabase JS client) via supabase.schema('platform').rpc(...)
Surface:           platform.provision_vcsm_identity SECURITY DEFINER RPC
Trust boundary:    Frontend caller → SECURITY DEFINER DB function → writes to 6 platform objects
Sensitive objects: platform.user_app_access (auth-gating), platform.user_app_accounts (platform account),
                   platform.user_app_preferences (actor selection), platform.user_app_state (onboarding),
                   platform.user_app_actor_links (actor-to-account bridge),
                   vc.actors.user_app_account_id (bridge column)
```

---

## Security Surface Classification

| Property | Status | Risk |
|----------|--------|------|
| Trust level | SECURITY DEFINER — elevated privilege writes to 6 objects | CRITICAL surface |
| Caller | Frontend (Supabase JS client) — direct browser-to-DB call | HIGH |
| `p_user_id` guard | CONFIRMED ABSENT in live DB | HIGH |
| `p_actor_id` guard | CONFIRMED ABSENT in live DB | HIGH |
| `search_path` | CONFIRMED PARTIAL — `pg_temp` missing | MEDIUM |
| Return value | `RETURNS jsonb` (live DB) — not `uuid` as DAL comments claim | LOW |
| Idempotency | Assumed per DAL comment ("safe to call on every login") | LOW |
| Audit trail | ABSENT — no event emitted on successful provision | LOW |

---

## VENOM Findings

### VF-01 — HIGH — OPEN

```
Finding ID:    VF-01
Surface:       platform.provision_vcsm_identity(p_user_id uuid, p_actor_id uuid)
Status:        OPEN — CONFIRMED by live DB inspection 2026-05-18
```

**Vulnerability:** The live function body does NOT call `auth.uid()` at any point. There is no guard validating that the caller is provisioning for themselves (`auth.uid() IS DISTINCT FROM p_user_id`). There is no guard validating that the caller owns `p_actor_id` (no `vc.actor_owners` check).

**Attack path (confirmed feasible):**
1. Attacker authenticates as User A
2. Attacker calls: `supabase.schema('platform').rpc('provision_vcsm_identity', { p_user_id: victimUserId, p_actor_id: attackerActorId })`
3. Function provisions platform rows for victim without restriction (SECURITY DEFINER bypasses RLS)
4. On victim's next login: engine resolves attacker's actor as victim's identity
5. Victim's actor-to-platform-account mapping is overwritten

**Evidence:** Live `pg_get_functiondef` query run 2026-05-18 confirmed: `auth.uid()` never called; `p_user_id` check absent; `vc.actor_owners` check absent.

**Migration ready:** `apps/VCSM/supabase/migrations/20260518040000_platform_provision_vcsm_identity.sql`
Adds GUARD 2 (`auth.uid() IS DISTINCT FROM p_user_id`), GUARD 3 (`vc.actor_owners` ownership check), `pg_temp` to search_path, and `service_role` EXECUTE grant. VENOM confirmed safe to apply.

**Deployment status:** UNKNOWN — not reported in source files.

---

### VF-02 — MEDIUM — OPEN

```
Finding ID:    VF-02
Surface:       platform.provision_vcsm_identity — search_path
Status:        OPEN — CONFIRMED PARTIAL by live DB inspection 2026-05-18
```

**Vulnerability:** Live function has `SET search_path TO 'platform', 'vc', 'public', 'auth'` but `pg_temp` is absent. Without `pg_temp` in the explicit search_path, temporary table injection via `CREATE TEMP TABLE` is theoretically possible within the same transaction.

**Evidence:** `proconfig` from `pg_proc` confirms partial search_path; `pg_temp` missing.

**Covered by migration:** YES — `20260518040000` adds `pg_temp` to `search_path`.

---

### VF-03 — LOW — OPEN

```
Finding ID:    VF-03
Surface:       No audit trail after successful provisioning
Status:        OPEN
```

**Vulnerability:** When `provision_vcsm_identity` succeeds, the DAL returns `userAppAccountId` and the controller returns `{ ok: true, userAppAccountId }` — no structured audit event is emitted. No durable record of when provisioning occurred, how many times it was called, or what `actorId` was linked.

**Recommended fix:** Add `debugLoginEvent('PLATFORM_BOOTSTRAP_COMPLETE', { phase: 'bootstrap', status: 'success', payload: { userId, actorId, userAppAccountId } })` after successful bootstrap.

---

## Additional Live DB Findings (confirmed 2026-05-18)

| ID | Severity | Status | Finding |
|----|----------|--------|---------|
| VLF-01 | LOW | OPEN | Live return type is `RETURNS jsonb` — DAL comments say `uuid`; type mismatch in documentation |
| VLF-02 | MEDIUM | OPEN | `p_actor_id DEFAULT NULL::uuid` — parameter is optional in live body; provisioning without actor link is possible |
| VLF-03 | LOW | OPEN | `service_role` lacks EXECUTE grant on `provision_vcsm_identity`; only `authenticated` has EXECUTE — service-to-service provisioning calls would fail silently |

---

## Required Actions (from VENOM 2026-05-18)

| Priority | Action | Owner |
|----------|--------|-------|
| P1 — IMMEDIATE | Deploy `20260518040000_platform_provision_vcsm_identity.sql` | DB admin |
| P2 | Verify `auth.uid()` GUARD 2 is present after deployment | DB + VENOM |
| P3 | Create tracked creation migration for live function body | CARNAGE |
| P4 | Add `debugLoginEvent` after successful bootstrap | Feature owner |

---

## Comparison to Wentrex Equivalent

The Wentrex `provision_wentrex_identity` function:
- Uses `auth.uid()` internally (not caller-supplied)
- Validates actor ownership (3 checks)
- Has hardened `search_path`
- Has a tracked creation migration (`20260331020000_platform_grants_and_provision_rpc.sql`)

The VCSM `provision_vcsm_identity` function lacks all four of these properties as confirmed by live DB inspection.

---

## VENOM STATUS

VENOM Last Run: 2026-06-02
VENOM Status: PARTIAL (DB-side RPC must be verified by DB command)

### VF-01 — provision_vcsm_identity Missing auth.uid() Guard (CRITICAL / OPEN)
- Source trace: provision.rpc.dal.js → supabase.schema('platform').rpc('provision_vcsm_identity', { p_user_id: ... })
- p_user_id source: session-bound in all three JS call paths (onboarding, self-heal, join); however RPC is reachable via direct PostgREST with fully attacker-controlled p_user_id
- Auth guard at JS layer: PRESENT in all three paths; does NOT protect direct PostgREST calls
- DB-side guard: UNKNOWN — migration 20260518040000 ready but deployment status unconfirmed
- Exploitability: HIGH if migration undeployed; MEDIUM if migration deployed (JS-layer defense still absent for direct API calls)
- Blast radius: Cross-user identity poisoning — platform.user_app_access, platform.user_app_accounts, platform.user_app_actor_links, vc.actors.user_app_account_id; identity self-heal path silently re-provisions poisoned state on victim's next login
- RLS Dependency: REQUIRED — DB function body must be inspected; SECURITY DEFINER bypasses all RLS on writes
- Required fix: (1) Add IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN RAISE EXCEPTION inside provision_vcsm_identity DB body as first statement before any INSERT/UPSERT; (2) REVOKE EXECUTE on anon role; (3) Confirm migration 20260518040000 is deployed
- Follow-up: DB — confirm migration 20260518040000 is deployed and function body contains auth.uid() check
- THOR Blocker: YES
- CISSP: Identity and Access Management (Primary); Software Development Security, Access Control (Secondary)
- Finding ID cross-reference: VENOM-2026-06-02-001 (2026-06-02 pass); VF-01 (2026-05-18 pass)

### ADAPTER-BYPASS — ~111 Sites Bypass identity.adapter (HIGH / OPEN)
- Finding ID: VENOM-2026-06-02-003
- 64 bypass via direct import from @/state/identity/identityContext; 47 use correct adapter path
- Deprecated hooks useIdentityDisplayDeprecated and useIdentityDetailsDeprecated are reachable but not exported on the adapter surface; any refactor of identityContext internals silently breaks all 64 bypass consumers
- Risk: stale identity state served to UI after actor switch; inconsistent actor ownership between displayed identity and actorId driving mutations; no compile-time warning on breakage
- Exploitability: MEDIUM — requires authenticated session; no direct DB exploit path
- Blast radius: Platform-wide — features/settings, features/post, features/dashboard/vport (12+ screens), features/profiles, features/upload, features/chat/inbox, features/block, features/notifications, features/ads, app/layout, learning/layout
- Required fix: (1) Export useIdentityDisplayDeprecated and useIdentityDetailsDeprecated on identity.adapter.js as explicitly deprecated symbols; (2) Migrate the one direct caller of useIdentityDisplayDeprecated to useIdentity(); (3) Migrate all 64 identityContext direct importers to import from identity.adapter or @identity alias; (4) Seal identityContext.jsx as non-importable internal once migration is complete
- Follow-up: SENTRY — enumerate boundary violations; IRONMAN — assign ownership of migration
- THOR Blocker: NO (no direct exploit path; governance and consistency risk only)
- CISSP: Security Architecture and Engineering (Primary); Software Development Security, Identity and Access Management (Secondary)

### Summary Table (2026-06-02)

| Finding ID | Severity | Status | THOR Blocker | Category | Follow-up |
|---|---|---|---|---|---|
| VENOM-2026-06-02-001 | CRITICAL | OPEN | YES | VF-01 identity provision RPC | DB |
| VENOM-2026-06-02-002 | CRITICAL | OPEN | YES | DR-001 posts INSERT RLS absent | CARNAGE |
| VENOM-2026-06-02-003 | HIGH | OPEN | NO | ADAPTER-BYPASS identity context | SENTRY |
| VENOM-2026-06-02-004 | HIGH | OPEN | NO | ARCH-ACTORS-DRIFT docs/shim gap | IRONMAN |
| VENOM-2026-06-02-005 | HIGH | OPEN | NO | CROSS-FEATURE-OWNERSHIP booking | IRONMAN |
| VENOM-2026-06-02-006 | MEDIUM | OPEN | NO | UNGUARDED-ROUTE /void | WOLVERINE |
| VENOM-2026-06-02-007 | MEDIUM | OPEN | NO | ENGINE-BOUNDARY chat shadow DAL | SENTRY |
| VENOM-2026-06-02-008 | LOW | OPEN | NO | LAYER-CONTRACT feed DAL @hydration | SPIDER-MAN |
| VENOM-2026-06-02-009 | MEDIUM | OPEN | NO | ENGINE-BOUNDARY media wide imports | HAWKEYE |
| VENOM-2026-06-02-010 | HIGH | OPEN | YES | TRUST-BOUNDARY portfolio engine guard | ELEKTRA |

**Highest Open Severity:** CRITICAL
**THOR Release Blocker:** YES — VENOM-2026-06-02-001

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-02
BLACKWIDOW Status: PARTIAL (DB-side provision_vcsm_identity RPC body not inspectable from JS; harness blocked at DB boundary)

### BW-IDENTITY-001 — provision_vcsm_identity Identity Poisoning Path (CRITICAL / DRAFT)
- Attack scenario: Authenticated attacker constructs direct PostgREST call to platform.provision_vcsm_identity with victim p_user_id
- Session check in JS call stack: PRESENT in 3 call sites (session-bound userId derived from dalGetAuthSession/auth state/readCurrentAuthUserDAL)
- DB guard verifiable from JS: NO — SECURITY DEFINER execution context bypasses caller RLS; DB body must be audited
- Self-heal weaponization risk: provision is triggered silently on next login — if DB function body lacks auth.uid() check, poisoned state persists through normal recovery
- Exploit chain: Injection exploit (forged p_user_id parameter to SECURITY DEFINER RPC)
- Defense gate: WEAK — JS session binding enforced; DB body unverified
- Result: PLAUSIBLE_DB_SIDE — cannot confirm BYPASSED or BLOCKED without DB function body inspection
- Governance status: DRAFT
- THOR blocker: YES — CRITICAL path requires DB confirmation before release
- Required fix: Confirm migration 20260518040000 deployed; add auth.uid() = p_user_id assertion to DB function body
- Follow-up: DB

### BW-IDENTITY-002 — Identity Adapter Bypass — Actor Switch Race (HIGH / DRAFT)
- Attack scenario: Multi-actor account holder switches actor; 64 bypass consumers display stale Actor A identity; mutation executes under Actor B actorId scope
- Stale display + wrong mutation scope risk: PLAUSIBLE — identityContext does not guarantee atomic display+mutation update through adapter contract
- 64 consumers confirmed bypassing adapter: useIdentityDisplayDeprecated, useIdentityDetailsDeprecated imported directly
- Exploit chain: Timing-dependent exploit (actor switch window)
- Defense gate: WEAK — no adapter normalization on actor switch for bypass consumers
- Result: PARTIAL — timing window exists; not atomically exploitable on demand
- Governance status: DRAFT
- THOR blocker: NO (no synchronous exploit; governance risk)
- Required fix: Migrate all 64 bypass consumers to identity.adapter surface
- Follow-up: SENTRY

**Highest Open Severity:** CRITICAL
**THOR Release Blocker:** YES — BW-IDENTITY-001
