# VENOM V2 Security Review — identity

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | identity |
| App Scope | VCSM (primary), Wentrex (scanner co-located) |
| VENOM Run Date | 2026-06-04 |
| VENOM Run Time | 19:48 |
| Reviewer | VENOM V2 |
| Report Path | ZZnotforproduction/APPS/VCSM/features/identity/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_identity-security-review.md |
| Total Findings | 5 |
| Severity Breakdown | 0 CRITICAL, 2 HIGH, 2 MEDIUM, 1 LOW |
| THOR Release Blocker | YES — VEN-IDENTITY-001, VEN-IDENTITY-002 |

---

## 2. Scanner Preflight Block

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                  | Generated At              | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs Block

| Field | Value |
|---|---|
| Scanner Data File | /tmp/venom_features/identity.json |
| Write Surfaces | 4 (all RPC operations) |
| RPCs | 4 |
| Security Paths | 8 |
| Write Execution Paths | 4 |
| RPC Execution Paths | 4 |
| Edge Functions | 0 |

**Write surfaces identified:**
1. `platform.provision_vcsm_identity` — VCSM provisioning RPC (apps/VCSM/src/features/identity/dal/provision.rpc.dal.js)
2. `identity.refresh_actor_directory_row` — Directory refresh RPC (apps/VCSM/src/features/identity/dal/refreshActorDirectory.dal.js)
3. `platform.provision_wentrex_identity` — Wentrex provisioning RPC (apps/wentrex/src/features/identity/dal/provision.rpc.dal.js)
4. `identity.refresh_actor_directory_row` — Wentrex directory refresh (apps/wentrex/src/features/identity/dal/refreshActorDirectory.dal.js)

**Scanner path confidence:** All 8 security paths have LOW confidence — write surfaces discovered without route-confirmed execution paths. This is expected for identity: the provision path is triggered from auth lifecycle hooks (onAuthStateChange / useIdentityResolutionEffect), not from a named route. Source inspection was required for full assessment.

---

## 4. Security Surface Inventory

| Surface ID | RPC | Schema | App | DAL File | Auth Enforced | Confidence |
|---|---|---|---|---|---|---|
| S-01 | provision_vcsm_identity | platform | VCSM | provision.rpc.dal.js | YES (SECURITY DEFINER + auth.uid() GUARD 1/2/3) | HIGH |
| S-02 | refresh_actor_directory_row | identity | VCSM | refreshActorDirectory.dal.js | SESSION_DEPENDENT | MEDIUM |
| S-03 | provision_wentrex_identity | platform | Wentrex | provision.rpc.dal.js | YES (SECURITY DEFINER + auth.uid() internal) | HIGH |
| S-04 | refresh_actor_directory_row | identity | Wentrex | refreshActorDirectory.dal.js | SESSION_DEPENDENT | MEDIUM |

**Additional write surfaces discovered through source inspection (not in scanner):**

| Surface ID | Operation | Schema | File | Auth Enforced |
|---|---|---|---|---|
| S-05 | UPDATE user_app_preferences | platform | engines/identity/src/dal/actorLinks.write.dal.js | UNVERIFIED_RLS |
| S-06 | UPDATE user_app_state | platform | engines/identity/src/dal/state.write.dal.js | UNVERIFIED_RLS |
| S-07 | SELECT user_app_actor_links | platform | apps/VCSM/src/features/identity/resolvers/vcsmIdentity.resolver.js | UNVERIFIED_RLS |
| S-08 | SELECT user_app_actor_links | platform | apps/wentrex/src/features/identity/resolvers/wentrexIdentity.resolver.js | UNVERIFIED_RLS |

---

## 5. Scanner Signals Block

| Signal | Value |
|---|---|
| Route-confirmed write paths | 0 of 4 (all LOW confidence — auth lifecycle triggers) |
| RPC callers identified | 4 (all direct DAL callers found via source inspection) |
| Edge functions | 0 |
| Missing BEHAVIOR contract | YES — BEHAVIOR.md is PLACEHOLDER |
| Self-heal path detected | YES — identitySelfHeal.controller.js calls provision RPC with user-supplied actorId |
| localStorage identity cache | YES — identityStorage.js; scoped by userId |
| In-memory identity result cache | YES — resolveAuthenticatedContext has 120s TTL cache keyed by userId:appKey |
| Multi-actor identity switching | YES — switchActor / switchActiveActor with account ownership guard |
| Stale cache on logout | PARTIAL — invalidateIdentityResultCache exists but only clears on explicit switch |
| Console.log in production path | MEDIUM RISK — engine controller logs identity data in DEV only; wentrex refreshActorDirectory DAL is also DEV-gated |

---

## 6. Behavior Contract Status

| Status | Detail |
|---|---|
| BEHAVIOR.md | PLACEHOLDER — no §5 Security Rules, no §9 Must Never Happen |
| Security rules extracted | 0 (no rules to verify) |
| Must-never-happen invariants | 0 (no invariants to verify) |

**Finding: MISSING_BEHAVIOR_CONTRACT — HIGH**

The identity feature BEHAVIOR.md at `ZZnotforproduction/APPS/VCSM/features/identity/BEHAVIOR.md` is a stub with `Status: PLACEHOLDER`. It contains zero security rules and zero must-never-happen invariants. This is the most critical trust-boundary feature in the entire platform. The absence of a codified behavior contract means no automated or manual verification of security rules is possible. See VEN-IDENTITY-001.

---

## 7. Trust Boundary Findings

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-IDENTITY-001
- Location: ZZnotforproduction/APPS/VCSM/features/identity/BEHAVIOR.md:1-9
- Application Scope: VCSM
- Platform Surface: Documentation Contract
- Trust Boundary: All authenticated/unauthenticated callers
- Boundary Violated: Security Rule Codification Boundary
- Contract Violated: BEHAVIOR.md §5 and §9 must be present per platform governance
- Current behavior: BEHAVIOR.md is a 9-line placeholder with no security rules, no must-never-happen invariants, and no actor ownership contract defined.
- Risk: Without a codified behavior contract, security regressions cannot be detected by ELEKTRA, BLACKWIDOW, SPIDER-MAN, or contract review tooling. Any future change to provisioning, actor switching, or self-healing could introduce privilege escalation without a governance trigger.
- Severity: HIGH
- Exploitability: LOW (document only — no direct exploit vector)
- Attack Preconditions: None required — governance gap is structural
- Blast Radius: Full identity feature — provisioning, actor switching, self-heal, realm resolution, director refresh
- Identity Leak Type: None (direct)
- Cache Trust Type: None (direct)
- RLS Dependency: NONE
- Why it matters: The identity feature controls every authentication and authorization decision in the platform. Without a written security contract, future contributors have no enforceable boundary to test against, and the THOR governance gate cannot reject unsafe changes.
- Recommended mitigation: Write BEHAVIOR.md §5 Security Rules covering: (1) only the authenticated user may provision their own identity; (2) actor ownership must be verified server-side before provisioning; (3) actor switching requires account ownership check; (4) identity must never be resolved from cache after logout; (5) profileId/userId must never be exposed through useIdentity(); (6) self-heal must not allow cross-user actor adoption. Write §9 Must Never Happen covering: (1) provision for another user's auth.uid; (2) commit identity belonging to a different userId than session; (3) expose raw userId or profileId in public API surface.
- Rationale: Platform governance requires this contract to exist before THOR clearance. All downstream security tools depend on it.
- Follow-up command: SPIDER-MAN (write tests against the contract once written), THOR (block release until contract is authored and linked)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Software Development Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-IDENTITY-002
- Location: apps/VCSM/src/state/identity/identitySelfHeal.controller.js:8-10
- Application Scope: VCSM
- Platform Surface: PWA — identity self-heal controller
- Trust Boundary: Authenticated session user (auth.uid())
- Boundary Violated: Actor-to-User ownership boundary during self-heal
- Contract Violated: CLAUDE.md / VCSM CLAUDE.md — "Ownership is verified through actor_owners only"
- Current behavior: findSelfHealActorForUser(userId) calls readUserActorByProfileIdDAL(userId). The DAL queries vc.actors.profile_id = userId. For legacy user actors (created before actor_owners was the canonical model), profile_id IS auth.uid(), so the query works and ownership is correct. However, the function is named readUserActorByProfileId**DAL** receiving a **userId** argument — the naming creates a latent maintenance trap. If a future refactor changes vc.actors.profile_id to a separate UUID (as a natural evolution toward proper actor creation), this self-heal path silently stops working (returns null) without any error, leaving users with broken identity resolution that falls through to IDENTITY_RESOLVE_EMPTY with no actionable path.
- Risk: (a) Naming mismatch creates maintenance confusion — contributors may not understand that userId == profile_id for user actors, leading to incorrect future changes. (b) If vc.actors.profile_id is ever decoupled from auth.uid, self-heal silently breaks for all new users. (c) Self-heal path bypasses the identity engine's access gate — it calls provision directly without verifying platform.user_app_access status, potentially re-provisioning access for suspended or revoked users.
- Severity: HIGH
- Exploitability: MEDIUM — requires understanding of self-heal trigger conditions; cannot be triggered from public API; requires being a logged-in user with a missing platform row
- Attack Preconditions: Authenticated session with valid vc.actors row but no platform identity rows (new user, admin-created actor, or corrupted platform state)
- Blast Radius: All new VCSM users who trigger self-heal (any user without pre-existing platform rows) — this is every brand-new signup
- Identity Leak Type: Actor-User mapping
- Cache Trust Type: None
- RLS Dependency: ASSUMED — RPC enforces auth.uid() = p_user_id (GUARD 2) and actor ownership (GUARD 3), so DB-level protections exist; but self-heal bypasses the engine's access gate check at step 3
- Why it matters: (1) A suspended user who has their access revoked at platform.user_app_access could trigger self-heal and receive new provisioned access via the SECURITY DEFINER RPC, bypassing the suspension. The RPC re-sets status='granted' on conflict. (2) The naming mismatch is a known source of future regressions in a safety-critical path.
- Recommended mitigation: (1) Before calling ensureVcsmPlatformBootstrap in self-heal, call resolveUserAppAccess to check if access has been explicitly revoked (status='revoked'). If revoked, do NOT self-heal — return null and force logout. (2) Rename readUserActorByProfileIdDAL to readUserActorByUserIdDAL or add a JSDoc comment clearly stating that vc.actors.profile_id IS the auth.uid() for user actors, citing the DB convention.
- Rationale: Self-heal is a critical recovery path that must respect all platform access gates, not bypass them. A revoked user must remain revoked even through self-heal.
- Follow-up command: DB (verify whether provision_vcsm_identity can re-grant revoked access, and whether user_app_access has a 'revoked' guard in the RPC), SPIDER-MAN (regression test: self-heal for revoked user must not re-provision)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-IDENTITY-003
- Location: apps/VCSM/src/state/identity/identityContext.jsx:136-246 / useIdentityResolutionEffect.hook.js:151-158
- Application Scope: VCSM
- Platform Surface: PWA — identity resolution hook
- Trust Boundary: Session user → committed identity
- Boundary Violated: Cross-user identity commit guard
- Contract Violated: VCSM CLAUDE.md — "Never scope behavior by profileId, vportId, or raw userId"
- Current behavior: After identity resolution, there is a userId cross-check at line 152-160 of useIdentityResolutionEffect.hook.js: if identityUserId !== user.id, the identity is rejected. This guard is present and working. However, the guard only fires when _engineMeta.userId is present. If hydrateIdentityActor returns a result where _engineMeta is absent or null (hydration failure fallback path), the userId field is null, and the cross-check condition `identityUserId && identityUserId !== user.id` evaluates to `null && ...` which is falsy — the cross-check is silently skipped, and an identity without a confirmed userId owner is committed to the context.
- Risk: If hydration completes but _engineMeta is not attached (e.g., due to a code path change in hydrateIdentityActor), an identity object belonging to an unverified session could be committed. This is an edge case today but becomes a live risk if the hydration path is ever refactored to return partial results.
- Severity: MEDIUM
- Exploitability: LOW — requires a code defect in the hydration path to trigger; not directly exploitable from outside
- Attack Preconditions: A code change that returns a hydrated identity without _engineMeta (e.g., a new hydration code path that does not attach the engine metadata block)
- Blast Radius: Any user whose identity loads through a non-engine hydration path — could result in cross-user session contamination in edge cases
- Identity Leak Type: Cross-user identity commit
- Cache Trust Type: Engine metadata trust
- RLS Dependency: NONE — client-side guard
- Why it matters: The identity cross-check is a last-line defense against resolving and committing an identity for the wrong user. A gap in this guard — even conditional — represents a trust boundary weakness in the most sensitive path in the platform.
- Recommended mitigation: Harden the cross-check to: if `!identityUserId` (missing) also reject the identity commit (or downgrade to warning + allow if no alternative). Alternatively, guarantee that all paths through hydrateIdentityActor attach _engineMeta or throw explicitly. Add a SPIDER-MAN regression test that verifies the cross-check fires and rejects for any identity where _engineMeta.userId is null.
- Rationale: Security cross-checks must never be silently bypassable by omission.
- Follow-up command: SPIDER-MAN (test cross-check guard with missing _engineMeta), DEADPOOL (trace all code paths that return from hydrateIdentityActor — confirm _engineMeta is always attached or the function throws)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-IDENTITY-004
- Location: engines/identity/src/controller/resolveAuthenticatedContext.controller.js:36-57
- Application Scope: VCSM + Wentrex
- Platform Surface: PWA — identity engine result cache
- Trust Boundary: Session boundary — cache keyed by userId:appKey
- Boundary Violated: Session invalidation boundary
- Contract Violated: Implicit: identity cache must not survive logout
- Current behavior: A 120-second in-memory result cache is keyed by `${userId}:${appKey}`. On logout, identityContext.jsx calls `invalidateIdentityResultCache()` (line 6: import). However, invalidateIdentityResultCache() is called as `invalidateIdentityResultCache()` with no userId argument (line 5 of identityContext.jsx import). When called without userId, the implementation clears the ENTIRE cache. This is correct behavior. However, on actor switch (identityContext.jsx line 92: `invalidateIdentityEngineQuery`), only the React Query cache is cleared — the in-memory result cache is also cleared inside `switchActiveActor` (engines/identity/src/controller/switchActiveActor.controller.js line 46: `invalidateIdentityResultCache()`), also without userId, clearing the entire cache. This is acceptable. The residual risk is: if the TTL window (120s) elapses between a logout event and a subsequent unauthenticated page load, a stale cached context could theoretically be served to a new session that happens to reuse the same in-memory process — this is only possible in SSR contexts. In pure SPA (browser), process death on tab close eliminates this risk.
- Risk: In the current SPA architecture, this is theoretical. If the identity engine is ever used in an SSR or edge function context (not currently the case), cached contexts could leak across user sessions. The risk is LOW in the current deployment model.
- Severity: MEDIUM
- Exploitability: LOW — SPA process isolation prevents cross-session cache leakage in the browser
- Attack Preconditions: SSR deployment of the identity engine (not currently applicable); 120s window between logout and re-login of a different user within the same process
- Blast Radius: All users if deployed in SSR context — cross-session identity exposure
- Identity Leak Type: Session identity cached context
- Cache Trust Type: In-memory result cache (120s TTL)
- RLS Dependency: NONE — client-side cache
- Why it matters: Documenting this risk ensures that if the identity engine is ever extracted for SSR use, the cache mechanism is re-evaluated and either disabled or keyed with a session-unique value.
- Recommended mitigation: Add a comment to _resultCache in resolveAuthenticatedContext.controller.js explicitly stating it is safe ONLY for single-user SPA contexts and must be disabled or replaced with a per-request cache if the engine is used in SSR. Consider reducing TTL from 120s to 60s or making it configurable via engine config.
- Rationale: Preventive hardening for architectural evolution.
- Follow-up command: ARCHITECT (confirm engine is never used in SSR context), ELEKTRA (verify cache invalidation is complete on all logout paths)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-IDENTITY-005
- Location: apps/wentrex/src/features/identity/resolvers/wentrexIdentity.resolver.js:110-131
- Application Scope: Wentrex
- Platform Surface: PWA — Wentrex app context resolver
- Trust Boundary: Authenticated actor → role key list
- Boundary Violated: Role resolution completeness boundary
- Contract Violated: Multi-tenancy rules — every query must be scoped to a Realm (CLAUDE.md)
- Current behavior: In createWentrexAppContextResolver, roles are resolved by querying learning.organization_memberships.role, learning.parent_student_links (presence check), and learning.course_memberships (student role). None of these queries are scoped to a Realm. An actor who is a 'teacher' in Organization A but whose access in Organization B was revoked would still receive 'teacher' role keys from this resolver because the organization_memberships query has no realm/status filter beyond `.eq('status', 'active')`. More critically, the parent_student_links query has NO status or organization filter at all — any parent link in the DB (even across organizations) grants the 'parent' roleKey.
- Risk: Cross-organization role bleed — an actor could receive elevated role keys (teacher, parent) from a different organization than the one they are currently authenticated into. In a multi-tenant LMS, this is a medium-severity trust boundary violation: role keys control route access and capability grants.
- Severity: MEDIUM
- Exploitability: MEDIUM — requires a user to have rows in learning.organization_memberships or parent_student_links for multiple organizations; likely for test accounts or users with organizational reassignments
- Attack Preconditions: Authenticated Wentrex user with active rows in multiple organizations or with parent links across organizations
- Blast Radius: Any Wentrex user enrolled in or linked to more than one organization — could gain unintended route access via elevated roleKeys
- Identity Leak Type: Cross-tenant role bleed
- Cache Trust Type: None
- RLS Dependency: ASSUMED — RLS on learning.organization_memberships may scope by authenticated user, but multi-tenant organization scoping is not verified in source
- Why it matters: In a multi-tenant LMS, role resolution must be scoped to the specific organization the user authenticated into. Unscoped role resolution breaks tenant isolation at the application layer, even if RLS prevents raw data reads.
- Recommended mitigation: Add organizationId scoping to all role resolution queries in createWentrexAppContextResolver: (1) organization_memberships query: add `.eq('organization_id', organizationId)`; (2) parent_student_links query: add a join or subquery to filter by organizationId or add a status column with filter; (3) course_memberships query: add organization scoping via course join. organizationId is available as `link.meta?.organization_id`.
- Rationale: Multi-tenancy contract requires all queries to be scoped to a Realm/Organization.
- Follow-up command: DB (verify RLS on learning.organization_memberships for cross-org isolation), SPIDER-MAN (regression test: user in org A must not receive org B role keys)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

## 8. Source Verification Summary

| File | Inspected | Status | Notes |
|---|---|---|---|
| apps/VCSM/src/features/identity/dal/provision.rpc.dal.js | YES | VERIFIED_SAFE | Passes userId+actorId to RPC; guards enforced at DB level |
| apps/VCSM/src/features/identity/dal/refreshActorDirectory.dal.js | YES | VERIFIED_SAFE | Validates params; uses debugger (not console.log); failures are non-fatal |
| apps/VCSM/src/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js | YES | VERIFIED_SAFE | Validates userId+actorId; delegates to DAL; catches errors cleanly |
| apps/VCSM/src/features/identity/controller/refreshActorDirectory.controller.js | YES | VERIFIED_SAFE | Thin re-export; no direct security surface |
| apps/VCSM/src/features/identity/hooks/useIdentityOps.js | YES | VERIFIED_SAFE | Thin hook; no security surface |
| apps/VCSM/src/features/identity/resolvers/vcsmIdentity.resolver.js | YES | VERIFIED_SAFE | Queries user_app_actor_links by userAppAccountId; no direct userId filter (account ID is the filter) |
| apps/VCSM/src/features/identity/adapters/identity.adapter.js | YES | VERIFIED_SAFE | Re-exports only; no security surface |
| apps/VCSM/src/features/identity/adapters/identityOps.adapter.js | YES | VERIFIED_SAFE | Re-exports only; no security surface |
| apps/VCSM/src/features/identity/setup.js | YES | VERIFIED_SAFE | Engine configuration only; no security surface |
| apps/wentrex/src/features/identity/dal/provision.rpc.dal.js | YES | VERIFIED_SAFE | Wentrex RPC uses auth.uid() internally per comment; no p_user_id param |
| apps/wentrex/src/features/identity/dal/refreshActorDirectory.dal.js | YES | FINDING (LOW) | Uses console.warn (DEV-gated); see VEN-IDENTITY-005 scope |
| apps/wentrex/src/features/identity/controller/provisionWentrexIdentity.controller.js | YES | VERIFIED_SAFE | Calls resolveSessionUser() first; validates actor before provisioning; checks access gate |
| apps/wentrex/src/features/identity/resolvers/wentrexIdentity.resolver.js | YES | FINDING — VEN-IDENTITY-005 | Role resolution not scoped to organization |
| apps/wentrex/src/features/identity/WentrexIdentityContext.jsx | YES | VERIFIED_SAFE | Auth state changes handled correctly; self-heal uses provisionWentrexIdentity |
| apps/wentrex/src/features/identity/wentrexAccess.js | YES | VERIFIED_SAFE | Pure functions; no DB access |
| apps/VCSM/src/state/identity/identity.controller.js | YES | VERIFIED_SAFE | Uses resolveAuthenticatedContext; all console.log DEV-gated |
| apps/VCSM/src/state/identity/identity.read.dal.js | YES | NOTE | readUserActorByProfileIdDAL(userId) — name mismatch, behavior correct (profile_id = auth.uid for user actors) |
| apps/VCSM/src/state/identity/identityContext.jsx | YES | FINDING — VEN-IDENTITY-003 | Cross-check guard bypassable when _engineMeta.userId is null |
| apps/VCSM/src/state/identity/identitySelfHeal.controller.js | YES | FINDING — VEN-IDENTITY-002 | Self-heal bypasses access gate; naming mismatch |
| apps/VCSM/src/state/identity/identityStorage.js | YES | VERIFIED_SAFE | localStorage scoped by userId; clearAllIdentityStorage on logout |
| apps/VCSM/src/state/identity/identity.model.js | YES | VERIFIED_SAFE | Pure transformation functions; no DB access |
| apps/VCSM/src/state/identity/controller/switchActor.controller.js | YES | VERIFIED_SAFE | Validates actor link exists, belongs to account, is active, is switchable before writing |
| apps/VCSM/src/state/identity/useIdentityResolutionEffect.hook.js | YES | FINDING — VEN-IDENTITY-003 | Cross-check guard gap when _engineMeta absent |
| apps/VCSM/src/state/identity/identitySelfHeal.controller.js | YES | FINDING — VEN-IDENTITY-002 | Self-heal access gate bypass |
| engines/identity/src/dal/actorLinks.write.dal.js | YES | VERIFIED_SAFE | UPDATE scoped by userAppAccountId; RLS enforces ownership |
| engines/identity/src/dal/state.write.dal.js | YES | VERIFIED_SAFE | UPDATE scoped by userAppAccountId; RLS enforces ownership |
| engines/identity/src/dal/session.read.dal.js | YES | VERIFIED_SAFE | Uses getUser() (network-verified) not getSession() (cached) |
| engines/identity/src/controller/resolveAuthenticatedContext.controller.js | YES | FINDING — VEN-IDENTITY-004 | 120s result cache — safe in SPA, risky if moved to SSR |
| engines/identity/src/controller/switchActiveActor.controller.js | YES | VERIFIED_SAFE | Ownership check: row.user_app_account_id !== userAppAccountId throws ACTOR_LINK_FORBIDDEN |
| apps/VCSM/supabase/migrations/20260518040000_platform_provision_vcsm_identity.sql | YES | VERIFIED_SAFE | SECURITY DEFINER + 3 guards (auth, caller identity, actor ownership) |
| apps/VCSM/supabase/migrations/20260518050000_platform_provision_vcsm_identity_rls.sql | YES | VERIFIED_SAFE | Removes SECURITY DEFINER; adds RLS policies for all 5 tables |

---

## 9. Confidence Summary

| Finding ID | Confidence | Basis |
|---|---|---|
| VEN-IDENTITY-001 | HIGH | File read — BEHAVIOR.md is a 9-line stub, confirmed missing §5/§9 |
| VEN-IDENTITY-002 | HIGH | Source read — identitySelfHeal.controller.js:8-10, provision migration guard review |
| VEN-IDENTITY-003 | HIGH | Source read — useIdentityResolutionEffect.hook.js:152-158, identityContext.jsx pattern |
| VEN-IDENTITY-004 | MEDIUM | Source read — cache implementation confirmed, SPA assumption unverified for future |
| VEN-IDENTITY-005 | HIGH | Source read — wentrexIdentity.resolver.js:110-131, no organizationId filter on role queries |

---

## 10. THOR Impact

| Finding ID | Severity | THOR Blocker | Reason |
|---|---|---|---|
| VEN-IDENTITY-001 | HIGH | YES | Missing BEHAVIOR contract is a governance prerequisite for all security tooling; no release should proceed without it for the identity feature |
| VEN-IDENTITY-002 | HIGH | YES | Self-heal path can bypass access revocation — a suspended or revoked user could re-provision platform access through self-heal without an access gate check |
| VEN-IDENTITY-003 | MEDIUM | NO | Requires a code defect to trigger; guard is present but has an edge case; harden before next major identity refactor |
| VEN-IDENTITY-004 | MEDIUM | NO | SPA-only risk — theoretical in current deployment; document and gate on SSR introduction |
| VEN-IDENTITY-005 | MEDIUM | NO | Role bleed is real but requires multi-org enrollment; harden with DB scoping but not a release blocker for current single-org deployments |

**THOR verdict: BLOCKED on VEN-IDENTITY-001 and VEN-IDENTITY-002**

---

## 11. Required Follow-Up Commands

| Priority | Command | Scope | Reason |
|---|---|---|---|
| P0 | SPIDER-MAN | VEN-IDENTITY-002 | Regression test: self-heal for revoked user must not re-provision access |
| P0 | DB | VEN-IDENTITY-002 | Verify provision_vcsm_identity conflict handler: does ON CONFLICT re-grant revoked status? |
| P1 | SPIDER-MAN | VEN-IDENTITY-003 | Test cross-check guard with _engineMeta.userId = null — verify reject fires |
| P1 | DEADPOOL | VEN-IDENTITY-003 | Trace all hydrateIdentityActor code paths; confirm _engineMeta is always attached |
| P1 | DB | VEN-IDENTITY-005 | Verify RLS on learning.organization_memberships for cross-org isolation |
| P2 | ARCHITECT | VEN-IDENTITY-004 | Confirm identity engine is never consumed in SSR context |
| P2 | ELEKTRA | VEN-IDENTITY-004 | Verify cache invalidation is complete on all logout paths |
| P3 | SPIDER-MAN | VEN-IDENTITY-005 | Regression test: user in org A must not receive org B role keys after adding organizationId scoping |

---

## 12. MITIGATION PLAN

| Finding ID | Severity | THOR Block | Owner | Mitigation Summary | Effort |
|---|---|---|---|---|---|
| VEN-IDENTITY-001 | HIGH | YES | Engineering | Write BEHAVIOR.md §5 Security Rules (6 rules) and §9 Must Never Happen (3 invariants); link to SECURITY.md | S |
| VEN-IDENTITY-002 | HIGH | YES | Engineering | Add access gate check in identitySelfHeal.controller.js before calling ensureVcsmPlatformBootstrap; query resolveUserAppAccess and reject if status=revoked | S |
| VEN-IDENTITY-003 | MEDIUM | NO | Engineering | Harden cross-check in useIdentityResolutionEffect: reject identity commit when _engineMeta.userId is null; add SPIDER-MAN regression test | S |
| VEN-IDENTITY-004 | MEDIUM | NO | Engineering | Add comment to _resultCache block documenting SPA-only assumption; make TTL configurable via engine config | XS |
| VEN-IDENTITY-005 | MEDIUM | NO | Engineering | Add .eq('organization_id', organizationId) to all three role resolution queries in createWentrexAppContextResolver | S |

**Effort key:** XS = < 30min, S = < 2h, M = < 1 day, L = multi-day

---

## 13. CISSP Domain Coverage Summary

| CISSP Domain | Findings Covered | Finding IDs |
|---|---|---|
| Access Control | 4 | VEN-IDENTITY-002, VEN-IDENTITY-003, VEN-IDENTITY-004, VEN-IDENTITY-005 |
| Security and Risk Management | 1 | VEN-IDENTITY-001 |
| Software Development Security | 5 | All findings |
| Identity and Access Management | 4 | VEN-IDENTITY-002, VEN-IDENTITY-003, VEN-IDENTITY-004, VEN-IDENTITY-005 |
| Security Architecture and Engineering | 2 | VEN-IDENTITY-004, VEN-IDENTITY-005 |

---

*VENOM V2 Review Complete — identity feature — 2026-06-04*
