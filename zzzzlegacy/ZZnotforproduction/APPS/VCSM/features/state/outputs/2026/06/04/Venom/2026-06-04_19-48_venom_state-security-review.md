# VENOM V2 SECURITY REVIEW
**Feature:** state
**Application Scope:** VCSM
**Date:** 2026-06-04
**Reviewer:** VENOM

---

## Output Metadata

| Field | Value |
|---|---|
| Category Key | APPS/VCSM/features/state |
| Feature | state |
| Command | VENOM |
| Ticket | (no ticket — standalone scan) |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/state/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_state-security-review.md |
| Timestamp | 2026-06-04T19:48:00 |

---

## 1. VENOM Scanner Preflight

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                 | Generated At                 | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map   | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map             | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map   | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map   | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map   | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map  | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
Write surfaces in scope: 0
RPC surfaces in scope: 0
Edge function surfaces in scope: 0
Security paths in scope: 0
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Surfaces In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-04T19:48:25Z | <1h | FRESH | HIGH | 0 | Primary attack surface inventory |
| rpc-map | 2026-06-04T19:48:25Z | <1h | FRESH | HIGH | 0 | RPC surface inventory |
| edge-function-map | 2026-06-04T19:48:25Z | <1h | FRESH | HIGH | 0 | Edge function surface inventory |
| security-path-map | 2026-06-04T19:48:25Z | <1h | FRESH | HIGH | 0 | Security path inventory |
| route-execution-map | 2026-06-04T19:48:25Z | <1h | FRESH | HIGH | 0 | Route→write chain resolution |
| write-execution-map | 2026-06-04T19:48:25Z | <1h | FRESH | HIGH | 0 | Write surface caller chain resolution |
| rpc-execution-map | 2026-06-04T19:48:25Z | <1h | FRESH | HIGH | 0 | RPC caller chain resolution |
| edge-execution-map | 2026-06-04T19:48:25Z | <1h | FRESH | HIGH | 0 | Edge caller chain resolution |

Scanner Version: 1.1.0
Overall Preflight: FRESH
Preflight Action: PASSED
Total surfaces in scope: 0 write + 0 rpc + 0 edge
Total security paths in scope: 0
HIGH confidence paths (resolved): 0
LOW confidence paths (unresolved): 0

**Note:** The scanner reports zero write surfaces, RPCs, and edge functions for the `state` feature. This is consistent with the ARCHITECTURE.md finding that the state module is read-only (no INSERT/UPDATE/DELETE DAL methods). Source inspection confirmed this — identity.read.dal.js contains exclusively SELECT operations. VENOM proceeded to source-level inspection to verify there are no hard-coded bypasses, debug leaks, unsafe exports, or trust boundary violations that scanner static analysis would not surface.

---

## 3. Security Surface Inventory

```
VENOM SECURITY SURFACE INVENTORY
==================================
Feature: state
Scan Date: 2026-06-04T19:48:25Z

Write Surfaces: 0
  INSERT: 0 | UPDATE: 0 | DELETE: 0 | UPSERT: 0
  Tables affected: none (read-only module)

RPC Calls: 0
  Schema: none (engine calls delegate to @identity and @hydration engines)

Edge Functions: 0
  Functions: none

Security Paths: 0
  HIGH confidence (caller chain resolved): 0
  LOW confidence (caller chain unresolved): 0
  Access=protected: 0
  Access=public: 0
  Access=unknown: 0

Execution Paths Resolved: 0 / 0

SOURCE INSPECTION SURFACE (manually derived):
  Source root: apps/VCSM/src/state/
  Files inspected: 16
  Key security-relevant files:
    - identity.read.dal.js         (10 DAL functions, all SELECT)
    - identity.controller.js       (loadDefaultIdentityForUser, loadOwnedActorChoices, resolveRealmId)
    - identityContext.jsx          (IdentityProvider, switchActor, useIdentity)
    - switchActor.controller.js    (actor switch flow with engine write via @identity)
    - identitySelfHeal.controller.js (self-heal bootstrap with engine write via @identity)
    - useIdentityResolutionEffect.hook.js (main resolution loop)
    - IdentityDebugger.jsx         (dev-only debug panel)
    - identity.model.js            (toPublicIdentity, mapProfileActor, mapVportActor)
    - identityStorage.js           (localStorage actorId persistence)
    - identitySelectors.js         (public selector surface)
    - identityEngineQuery.js       (React Query wrapper for resolveAuthenticatedContext)
```

---

## 4. Scanner Signals

| Signal | Source Map | Map Entry | Scanner Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|---|
| Zero write surfaces for state feature | write-surface-map | counts.writes = 0 | HIGH | YES — identity.read.dal.js contains only SELECT queries; no INSERT/UPDATE/DELETE present | [SOURCE_VERIFIED] | N/A — confirms read-only posture |
| Zero RPCs for state feature | rpc-map | counts.rpcs = 0 | HIGH | YES — no direct Supabase RPC calls in state DAL; engine delegates to @identity | [SOURCE_VERIFIED] | N/A — engine delegation confirmed |
| mapProfileActor exposes sensitive personal fields | source inspection | identity.model.js lines 38–59 | N/A | YES — email, birthdate, age, sex, is_adult, discoverable present in identity object | [SOURCE_VERIFIED] | VEN-STATE-001 |
| identityDetails context leaks sensitive fields | source inspection | identityContext.jsx — IdentityDetailsContext | N/A | YES — useIdentityDetailsDeprecated() returns full identityDetails with PII fields | [SOURCE_VERIFIED] | VEN-STATE-002 |
| findSelfHealActorForUser uses profileId-based lookup | source inspection | identitySelfHeal.controller.js line 9 | N/A | YES — readUserActorByProfileIdDAL(userId) passes userId as profileId argument | [SOURCE_VERIFIED] | VEN-STATE-003 |
| BEHAVIOR.md is PLACEHOLDER | source inspection | BEHAVIOR.md | N/A | YES — file contains Status: PLACEHOLDER with no §5 or §9 content | [SOURCE_VERIFIED] | VEN-STATE-004 |
| IdentityDebugger.jsx renders full identity JSON | source inspection | IdentityDebugger.jsx lines 75–77 | N/A | YES — JSON.stringify(identity) rendered; gated behind import.meta.env.DEV check | [SOURCE_VERIFIED] | VEN-STATE-005 |
| assertActorId emits console.error with actor value | source inspection | assertActorId.js line 5 | N/A | YES — console.error("ACTOR CONTRACT VIOLATION:", actor) — no DEV gate | [SOURCE_VERIFIED] | VEN-STATE-006 |
| Blocked VPORT auto-switch depends on user-kind actor availability | source inspection | identityContext.jsx lines 152–157 | N/A | YES — if no citizenActor found, blocked VPORT identity is NOT evicted | [SOURCE_VERIFIED] | VEN-STATE-007 |
| readVportIdentityDAL returns owner_user_id | source inspection | identity.read.dal.js line 123 | N/A | YES — owner_user_id fetched from vport.profiles in SELECT | [SOURCE_VERIFIED] | VEN-STATE-008 |
| identityEngineQuery has 2-minute staleTime on security-sensitive data | source inspection | identityEngineQuery.js line 29 | N/A | YES — staleTime: 120_000 on engine context holding availableActors | [SOURCE_VERIFIED] | VEN-STATE-009 |

---

## 5. Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: ZZnotforproduction/APPS/VCSM/features/state/BEHAVIOR.md
BEHAVIOR.md exists: YES
BEHAVIOR.md status: PLACEHOLDER — no actual behavioral specification
§5 Security Rules declared: 0
§5 Rules verified in source: 0 / 0
§5 Rules unenforced: NONE (no rules declared)
§9 Must Never Happen declared: 0
§9 Invariants protected in source: 0 / 0
§9 Invariants unprotected: NONE (no invariants declared)
```

**Assessment:** BEHAVIOR.md exists but is a PLACEHOLDER containing no content. This means:
- No security rules (§5) have been declared for the most critical boot-time module in the application.
- No Must Never Happen invariants (§9) have been declared despite the module managing session-to-actor binding for every authenticated user.
- VENOM cannot perform §5 or §9 cross-check verification. All source-derived findings are classified as UNANCHORED.
- This is a HIGH finding per the BEHAVIOR CONTRACT INTEGRATION protocol.

---

## 6. Trust Boundary Findings

---

### VEN-STATE-001 — PII Fields in Public Identity Model Surface

```
VENOM SECURITY FINDING
- Finding ID: VEN-STATE-001
- Location: apps/VCSM/src/state/identity/identity.model.js:38–59
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Identity resolution layer → unrestricted internal PII exposure to all consumers
- Contract Violated: Public Identity Surface Contract
- Current behavior: mapProfileActor() builds the identityDetails object with email, birthdate,
  age, sex, is_adult, discoverable, and publish fields. This full object is stored in
  IdentityDetailsContext and accessible to any component via useIdentityDetailsDeprecated().
  The public useIdentity() surface (toPublicIdentity) correctly limits exposure to { actorId, kind,
  ownerActorId }. However, the deprecated context provides unrestricted access to the full PII
  object to any component that consumes it.
- Risk: Any component that calls useIdentityDetailsDeprecated() receives sensitive personal data
  including email address, birthdate, age, sex (biological sex field), and adult-status flags.
  If a component accidentally renders these fields, logs them, or passes them to an analytics
  or third-party service, sensitive PII is exposed. The surface exists as long as the deprecated
  hooks remain in the codebase.
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions:
  - Attacker must have access to the client-side JavaScript bundle (any user)
  - A component that consumes useIdentityDetailsDeprecated() must render or transmit the full object
  - Risk amplifies if analytics, logging, or error-boundary tools capture component state
- Blast Radius: Single actor (own PII), but affects all authenticated users whose full profile
  is loaded into identityDetails
- Identity Leak Type: Private contact exposure (email), sensitive personal attribute exposure
  (birthdate, age, sex, is_adult, discoverable, publish)
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: NONE — this is an app-layer concern; RLS correctly restricts DB access
- Why it matters: The VCSM architecture contract explicitly bans exposing profileId/vportId
  through useIdentity() or any public hook. The same principle applies to PII fields. A user's
  email, birthdate, and sex are not needed for actor-based identity resolution. These fields
  were loaded for historical profile rendering but now sit in a deprecated context with no
  sunset date. The risk is gradual leakage through debug tools, error reporting, or component
  misuse.
- Recommended mitigation:
  1. Remove email, birthdate, age, sex, is_adult from mapProfileActor() return object.
  2. These fields are not needed for identity resolution — they belong in a profile-details
     query owned by the profile feature.
  3. Remove PROFILE_COLUMNS from identity.read.dal.js and replace readProfileIdentityDAL
     with a minimal identity-only query (id, display_name, username, photo_url, banner_url, bio).
  4. Establish a sunset timeline for useIdentityDetailsDeprecated() and
     useIdentityDisplayDeprecated().
- Rationale: The public identity surface should carry only { actorId, kind } plus display-safe
  fields (displayName, username, avatar, banner). PII fields loaded "just in case" are a
  standing data minimization violation.
- Follow-up command: ELEKTRA (verify all callers of useIdentityDetailsDeprecated and
  identify which fields each caller actually uses), SPIDER-MAN (add test asserting toPublicIdentity
  never includes PII fields)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Asset Security (data minimization, PII exposure)
  - Secondary: Software Development Security (deprecated surface without sunset), Identity and Access Management
```

---

### VEN-STATE-002 — Deprecated Identity Context Provides Unrestricted PII Access

```
VENOM SECURITY FINDING
- Finding ID: VEN-STATE-002
- Location: apps/VCSM/src/state/identity/identityContext.jsx:183–200
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Identity public surface contract → internal identityDetails object
  accessible to any component via deprecated hook
- Contract Violated: Public Identity Surface Contract
- Current behavior: IdentityDetailsContext holds the full identityDetails object (including all
  PII fields from VEN-STATE-001). useIdentityDetailsDeprecated() returns this object with no
  field filtering. useIdentityDisplayDeprecated() exposes isDeleted, isVoid, isActive fields
  which are lifecycle/moderation-state fields that should not be generally accessible.
  Neither hook has a documented removal timeline.
- Risk: Two exported hooks — useIdentityDetailsDeprecated() and useIdentityDisplayDeprecated() —
  provide consumers with actor lifecycle state (isDeleted, isVoid, isActive) that the architecture
  contract restricts to internal resolution logic only. isVoid in particular is a realm-routing
  concern that should not be available to arbitrary UI components. isDeleted could allow a component
  to render "soft-deleted" states in unexpected ways.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions:
  - A component must call useIdentityDetailsDeprecated() to access sensitive fields
  - Lifecycle fields could be misread by consuming components
- Blast Radius: Single actor — own identity state only
- Identity Leak Type: Ownership inference (isDeleted, isVoid, isActive moderation/lifecycle state
  exposed to arbitrary consumers)
- Cache Trust Type: Public-profile-sensitive, Moderation-sensitive
- RLS Dependency: NONE
- Why it matters: Lifecycle and moderation state (isDeleted, isVoid) should only be processed
  by the identity resolution layer, not propagated to arbitrary UI components. Two deprecated
  hooks with no sunset plan represent a standing architectural surface that can be misused or
  accidentally included in new components.
- Recommended mitigation:
  1. Audit all callers of useIdentityDetailsDeprecated() and useIdentityDisplayDeprecated().
  2. For each caller: migrate to useIdentity() { actorId, kind } or a purpose-specific hook.
  3. Remove the IdentityDetailsContext and both deprecated hooks once all callers are migrated.
  4. If lifecycle fields are needed by a specific consumer, expose them through a gated
     useActorLifecycle() hook with explicit documentation of its narrow purpose.
- Rationale: Deprecated hooks with no timeline are a security surface that grows over time
  as new engineers reach for the most convenient hook. Removing the surface eliminates the class
  of risk.
- Follow-up command: ELEKTRA (enumerate all callers), IRONMAN (own the deprecation timeline)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Software Development Security (dead/deprecated surface, no sunset plan)
  - Secondary: Asset Security, Identity and Access Management
```

---

### VEN-STATE-003 — Self-Heal Actor Lookup Uses userId as profileId

```
VENOM SECURITY FINDING
- Finding ID: VEN-STATE-003
- Location: apps/VCSM/src/state/identity/identitySelfHeal.controller.js:9
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Identity surface contract — actor ownership should be verified through
  actor_owners, not profileId lookup
- Contract Violated: Actor Ownership Contract
- Current behavior: findSelfHealActorForUser(userId) calls readUserActorByProfileIdDAL(userId).
  The DAL function queries vc.actors WHERE profile_id = $1 AND kind = 'user'. The argument
  passed is the auth userId, which is being used as if it were a profileId. In Supabase,
  auth.users.id is distinct from public.profiles.id — if these happen to share the same UUID
  value in the current schema, this works, but if they differ the self-heal will silently
  fail to find the correct actor. More critically, this lookup does NOT verify actor ownership
  through vc.actor_owners — it queries by profileId match, which is not the canonical ownership
  verification path.
- Risk: If auth.users.id and public.profiles.id are not the same values (or if the schema
  diverges), self-heal will silently find no actor and leave the user with no identity. More
  seriously: this pattern establishes a precedent of using profileId-based actor lookup instead
  of actor_owners verification, which is the canonical ownership mechanism. If this pattern
  is copied by other developers, it creates identity surface violations.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions:
  - Self-heal path must be triggered (user has no engine platform rows)
  - Auth userId and profileId UUID must diverge in the DB
- Blast Radius: Single actor — only affects users who trigger the self-heal path
- Identity Leak Type: Ownership inference (profileId used as actor lookup key instead of actor_owners)
- Cache Trust Type: None
- RLS Dependency: ASSUMED — vc.actors RLS provides a backstop, but the lookup method itself
  is architecturally incorrect
- Why it matters: The VCSM architecture contract defines actor_owners as the sole ownership
  verification mechanism. Using profileId as a proxy for userId in actor lookup violates this
  contract. Even if it works today due to UUID aliasing, it is fragile and sets a bad precedent.
- Recommended mitigation:
  1. Replace readUserActorByProfileIdDAL(userId) with a query that reads through vc.actor_owners:
     SELECT ao.actor_id FROM vc.actor_owners ao
     JOIN vc.actors a ON a.id = ao.actor_id
     WHERE ao.user_id = $userId AND a.kind = 'user' LIMIT 1
  2. Rename the function to make the ownership path explicit: readUserActorByOwnerIdDAL
- Rationale: actor_owners is the canonical ownership table. Self-heal is a privileged path
  that should be grounded in ownership verification, not profileId coincidence.
- Follow-up command: DB (verify whether auth.users.id = public.profiles.id by design or by
  coincidence in current schema), ELEKTRA (trace the full self-heal execution path)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Identity and Access Management (wrong identity authority surface)
  - Secondary: Software Development Security, Security Architecture and Engineering
```

---

### VEN-STATE-004 — MISSING_BEHAVIOR_CONTRACT: state

```
VENOM SECURITY FINDING
- Finding ID: VEN-STATE-004
- Location: ZZnotforproduction/APPS/VCSM/features/state/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: All trust levels — this module is foundational
- Boundary Violated: Security governance — the most critical authentication bootstrap
  module in the application has no declared behavioral contract
- Contract Violated: None (contract is absent)
- Current behavior: BEHAVIOR.md exists but is a PLACEHOLDER with no §5 Security Rules
  and no §9 Must Never Happen invariants. The state module resolves every authenticated
  session — it controls who is logged in, which actor is active, and whether soft-deleted
  accounts are evicted. None of these invariants are formally declared or testable.
- Risk: Without a behavioral contract:
  1. VENOM cannot verify security rule enforcement (no BEH IDs to cross-check)
  2. SPIDER-MAN cannot write targeted regression tests
  3. Future changes to the identity resolution flow have no correctness specification
  4. The DELETED_ACCOUNT_SENTINEL pattern is undocumented — if a caller mishandles it,
     a deleted user could remain authenticated
  5. The isBlockedVportIdentity auto-switch guard is undocumented — its failure modes
     are unspecified
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions:
  - Developer makes a change to identity resolution without understanding undocumented invariants
  - Regression introduced in DELETED_ACCOUNT_SENTINEL handling or blocked VPORT guard
- Blast Radius: All authenticated users — identity resolution is app-wide
- Identity Leak Type: None (documentation gap)
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The state module is the security foundation of the entire VCSM application.
  Every feature, every authorization check, every actor-scoped operation depends on the identity
  it resolves. A placeholder behavioral contract means any engineer can modify this module
  without knowing what invariants must be preserved. This is the highest-impact documentation
  gap in the codebase.
- Recommended mitigation:
  1. LOGAN must write a full BEHAVIOR.md for the state module including:
     §5 Security Rules: session ownership verification, DELETED_ACCOUNT_SENTINEL invariant,
     blocked VPORT eviction rule, actor ownership via actor_owners only, public surface limitation
     §9 Must Never Happen: deleted actor reaching committed identity state, wrong-user identity
     committed to session, profileId or vportId exposed through useIdentity(), blocked VPORT
     remaining as active identity
  2. SPIDER-MAN must add regression coverage for each §9 invariant
- Rationale: Without declared invariants, security regressions in this module are invisible
  until they cause an incident.
- Follow-up command: LOGAN (write BEHAVIOR.md), SPIDER-MAN (add §9 regression tests once
  BEHAVIOR.md is written), THOR (block release on modules with PLACEHOLDER behavior contracts
  at this criticality level)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Security and Risk Management (missing security governance contract)
  - Secondary: Security Assessment and Testing, Software Development Security
```

---

### VEN-STATE-005 — IdentityDebugger Renders Full Identity JSON

```
VENOM SECURITY FINDING
- Finding ID: VEN-STATE-005
- Location: apps/VCSM/src/state/identity/IdentityDebugger.jsx:75–77
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen (dev environment)
- Boundary Violated: Debug tooling boundary — component renders the full identity
  object including all fields exposed by useIdentity()
- Contract Violated: None (correctly gated behind DEV)
- Current behavior: IdentityDebugger renders JSON.stringify(identity, null, 2) inside
  a visible panel. The identity object at this layer is the public identity from
  useIdentity() — { actorId, kind, ownerActorId } — NOT the full identityDetails.
  The component is gated behind `if (!isDev) return null` at line 8.
  The gate is correct and reliable (Vite build-time dead code elimination removes
  this component in production builds).
- Risk: LOW. The identity object rendered is the reduced public identity, not the full
  PII-containing identityDetails. The DEV gate is correctly placed. However, if
  VEN-STATE-001 is not resolved and a future developer passes identityDetails to this
  debugger, full PII would be rendered in the debug panel.
- Severity: LOW
- Exploitability: LOW
- Attack Preconditions:
  - Must be running a development build (import.meta.env.DEV = true)
  - No production risk from current implementation
- Blast Radius: Single developer session — dev-only
- Identity Leak Type: Internal UUID exposure (actorId visible in panel) — acceptable
  in dev context
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The current implementation is safe. This finding is noted as a
  hardening recommendation: the debugger should explicitly document that it receives
  only the public identity surface, and should never be upgraded to accept identityDetails.
  The component lives inside state/identity/ (a non-component layer) which is also
  a layer violation per ARCHITECTURE.md.
- Recommended mitigation:
  1. Add a JSDoc comment to IdentityDebugger noting it must only receive the public
     identity surface { actorId, kind } and must never accept identityDetails.
  2. Move IdentityDebugger.jsx to a debuggers/ directory (per debugger architecture
     pattern in memory) rather than living inside the state/identity/ source tree.
- Rationale: Hardening against future PII leakage through debug tooling, and correcting
  the layer violation.
- Follow-up command: IRONMAN (own the debugger relocation)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Security Operations (debug tooling in production-adjacent path)
  - Secondary: Software Development Security
```

---

### VEN-STATE-006 — assertActorId Emits console.error Without DEV Gate

```
VENOM SECURITY FINDING
- Finding ID: VEN-STATE-006
- Location: apps/VCSM/src/state/identity/actors/assertActorId.js:5
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: All
- Boundary Violated: Debug output policy — console.error with actor object emitted
  without IS_DEV gate
- Contract Violated: None formally, but conflicts with the platform debug logging rule
  (memory: no console.log; debug output must be dev-only)
- Current behavior: assertActorId(actor) calls console.error("ACTOR CONTRACT VIOLATION:", actor)
  when the actor value is not a string. This console.error fires in production if malformed
  actor data reaches this function. The actor value is logged to the console — if it is an
  object (as the guard implies), its contents are exposed in the browser console in production.
- Risk: In production, browser consoles are accessible to users via DevTools. If a malformed
  actor object containing internal IDs or state reaches assertActorId(), that data is logged
  to the production console. Additionally, some error monitoring tools (Sentry, DataDog RUM)
  capture console.error calls and would transmit the actor object to external monitoring
  infrastructure.
- Severity: LOW
- Exploitability: LOW
- Attack Preconditions:
  - Malformed actor data must reach assertActorId() in production
  - User must open DevTools or an error monitoring tool must capture console.error
- Blast Radius: Single user session — own actor data only
- Identity Leak Type: Internal UUID exposure, Actor correlation (if actor object has id/kind fields)
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The platform memory explicitly prohibits console.log in production.
  console.error is equivalent risk. Internal actor objects should never be logged to the
  production console.
- Recommended mitigation:
  1. Add IS_DEV gate: if (IS_DEV) console.error("ACTOR CONTRACT VIOLATION:", actor)
  2. Or replace with a throw-only pattern without logging: throw new Error(`Actor must be a UUID string, got ${typeof actor}`)
- Rationale: Production console output is observable by users and error monitoring tools.
  Actor object internals should not appear there.
- Follow-up command: ELEKTRA
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Security Operations (production log hygiene)
  - Secondary: Asset Security, Software Development Security
```

---

### VEN-STATE-007 — Blocked VPORT Auto-Switch Has Silent Failure Mode

```
VENOM SECURITY FINDING
- Finding ID: VEN-STATE-007
- Location: apps/VCSM/src/state/identity/identityContext.jsx:152–157
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen / VPORT Owner
- Boundary Violated: VPORT Lifecycle Contract — a blocked/deleted/inactive VPORT
  identity can persist as the active identity if no user-kind actor is available
- Contract Violated: VPORT Lifecycle Contract
- Current behavior: The auto-switch guard at lines 152–157 detects isBlockedVportIdentity
  and attempts to switch to a user-kind actor from availableActors. However, if
  availableActors contains no actor with actorKind === "user", the guard returns
  early without evicting the blocked VPORT identity. The user remains authenticated
  as a blocked/deleted/inactive VPORT actor.
  Code: if (!citizenActor?.actorId) return; — silent no-op.
- Risk: A user whose account has only VPORT actors (no personal user-kind actor) and
  whose VPORT becomes blocked, deleted, or inactive will continue to operate under
  that blocked VPORT identity. They will be able to perform actions (post content,
  interact, trigger notifications) as an actor that the system has marked as
  blocked/deleted/inactive. This is a VPORT lifecycle enforcement gap.
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions:
  - User account must have only VPORT-kind actors (no personal user actor)
  - One or more VPORT actors must become blocked, deleted, or inactive
  - The availableActors list must not include a user-kind actor
- Blast Radius: Single VPORT actor — but impacts content integrity and moderation
  enforcement for affected accounts
- Identity Leak Type: None
- Cache Trust Type: Moderation-sensitive (isDeleted, isActive, isVoid are lifecycle
  fields that gate VPORT access)
- RLS Dependency: REQUIRED — if the DB has correct RLS on writes for blocked/deleted
  VPORTs, the risk is partially mitigated at the DB layer. However, reads and UI
  rendering would still function incorrectly for the blocked identity.
- Why it matters: Moderation and lifecycle enforcement requires that a blocked VPORT
  actor cannot continue to operate after the block is applied. The current auto-switch
  guard has a documented hole: it works only when a personal user actor exists. Accounts
  without a personal actor get no eviction. This should be a force-logout with a clear
  error state, not a silent no-op.
- Recommended mitigation:
  1. When isBlockedVportIdentity is true and no user-kind actor is found in availableActors,
     call logout() rather than returning silently.
  2. Pass a reason code (e.g. { vportBlocked: true }) so the auth provider can display
     an appropriate message.
  3. Document this invariant in BEHAVIOR.md §9 Must Never Happen.
- Rationale: A blocked actor must not remain the active identity under any circumstances.
  Silent no-op in the eviction guard is a lifecycle enforcement hole.
- Follow-up command: SPIDER-MAN (add regression test for blocked-VPORT-only-account scenario),
  LOGAN (add §9 invariant to BEHAVIOR.md once written)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Identity and Access Management (lifecycle enforcement gap)
  - Secondary: Security Architecture and Engineering, Security Operations
```

---

### VEN-STATE-008 — readVportIdentityDAL Fetches owner_user_id

```
VENOM SECURITY FINDING
- Finding ID: VEN-STATE-008
- Location: apps/VCSM/src/state/identity/identity.read.dal.js:123
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Asset Security — owner_user_id (auth UID) is fetched from
  vport.profiles and passed into the identity object
- Contract Violated: Public Identity Surface Contract
- Current behavior: readVportIdentityDAL() selects id, owner_user_id, name, slug,
  avatar_url, bio, is_active, is_deleted, banner_url, created_at, updated_at from
  vport.profiles. The owner_user_id field is the auth-layer user UUID (Supabase auth.users.id).
  This field is included in the vport identity object passed to mapVportActor, then into
  identityDetails, and accessible via useIdentityDetailsDeprecated().
- Risk: owner_user_id is the raw Supabase auth user ID. If this value appears in:
  1. Any component that renders identityDetails fields
  2. Any analytics/logging payload that includes the full identity object
  3. Any API response that serializes identityDetails
  ...then the underlying auth UID of a VPORT owner is exposed to the client.
  Cross-referencing owner_user_id with auth logs could allow correlation of VPORT
  identity to a specific Supabase auth account.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions:
  - A component must render or transmit the owner_user_id field from identityDetails
  - The deprecated hook surface (VEN-STATE-002) must be active
- Blast Radius: Single VPORT owner — own auth UID correlation risk
- Identity Leak Type: Internal UUID exposure (auth UID in vport identity object)
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: NONE — this is an app-layer data minimization issue
- Why it matters: Auth UIDs should never travel to the client layer beyond what is
  required for session management. owner_user_id in the vport identity object creates
  a path for auth UID exposure via the deprecated identity context. Even if no component
  currently misuses it, the field should not be fetched.
- Recommended mitigation:
  1. Remove owner_user_id from the SELECT in readVportIdentityDAL().
  2. The VCSM application does not need this field in the identity object — VPORT
     ownership is verified through actor_owners, not owner_user_id.
- Rationale: Data minimization principle — do not fetch fields that are not needed
  in the consuming layer. Auth UIDs belong in the DB layer only.
- Follow-up command: ELEKTRA (check if owner_user_id appears in any downstream consumer)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Asset Security (auth UID fetched unnecessarily)
  - Secondary: Identity and Access Management, Software Development Security
```

---

### VEN-STATE-009 — 2-Minute Stale Cache on Security-Sensitive Engine Context

```
VENOM SECURITY FINDING
- Finding ID: VEN-STATE-009
- Location: apps/VCSM/src/state/identity/queries/identityEngineQuery.js:29
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen / VPORT Owner
- Boundary Violated: Cache Trust Boundary — engine context (availableActors, active actor
  preference) can remain stale for up to 2 minutes after an account change
- Contract Violated: VPORT Lifecycle Contract
- Current behavior: identityEngineQuery has staleTime: 120_000 (2 minutes). This query
  provides the engine context used by switchActorController to validate the list of actors
  the user is allowed to switch to. If an actor is removed from a user's account (revoked
  access, VPORT transfer, admin action), the cached availableActors list will continue
  to include that actor for up to 2 minutes, potentially allowing a switch to an actor
  the user no longer owns.
- Risk: During the 2-minute stale window:
  1. A user whose VPORT access was revoked could still switch to that VPORT actor
  2. The switchActorController link verification step (line 84) checks against the
     cached availableActors list — if the list is stale, a revoked actor is still
     "found" in the list, and the platform write (engineSwitchActiveActor) will execute
  3. The platform write will likely be rejected by DB-layer RLS or the engine's own
     ownership check, but the failure mode depends on engine implementation
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions:
  - Actor access must be revoked at the DB level
  - The user must attempt to switch to the revoked actor within the 2-minute stale window
  - The engine's switchActiveActor must not independently verify current ownership
- Blast Radius: Single actor — affects the user whose access was just revoked
- Identity Leak Type: None
- Cache Trust Type: Identity-sensitive, Moderation-sensitive (availableActors list
  is a security-sensitive artifact)
- RLS Dependency: REQUIRED — the engine's DB-layer ownership check is the last line
  of defense during the stale window. If RLS on the actor_links or platform tables
  correctly enforces current ownership, the worst case is a rejected switch, not
  a successful unauthorized switch.
- Why it matters: A 2-minute window is acceptable for performance but should be
  acknowledged as a security tradeoff. If the engine's platform write does NOT
  independently verify current ownership before writing the active actor preference,
  the stale cache becomes exploitable.
- Recommended mitigation:
  1. Reduce staleTime to 30_000 (30 seconds) as a reasonable tradeoff.
  2. Verify (with DB command) that engineSwitchActiveActor performs current ownership
     verification against the live DB before writing the active actor preference.
  3. If the engine does not verify, add an app-layer freshness check before calling
     engineSwitchActiveActor in switchActorController.
- Rationale: Security-sensitive caches (actor ownership, available actors) should have
  shorter stale windows than cosmetic caches.
- Follow-up command: DB (verify engine RLS on platform.user_app_preferences and
  actor link tables), ELEKTRA (audit engineSwitchActiveActor ownership verification)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Security Architecture and Engineering (cache staleness on security state)
  - Secondary: Identity and Access Management
```

---

## 7. Source Verification Summary

| File | Read | Security-Relevant Finding |
|---|---|---|
| apps/VCSM/src/state/identity/identity.read.dal.js | YES | VEN-STATE-001 (PII columns), VEN-STATE-003 (profileId lookup), VEN-STATE-008 (owner_user_id) |
| apps/VCSM/src/state/identity/identity.model.js | YES | VEN-STATE-001 (mapProfileActor PII fields) |
| apps/VCSM/src/state/identity/identityContext.jsx | YES | VEN-STATE-002 (deprecated hooks), VEN-STATE-007 (blocked VPORT guard) |
| apps/VCSM/src/state/identity/controller/switchActor.controller.js | YES | VEN-STATE-009 (cache trust in actor switch) |
| apps/VCSM/src/state/identity/identitySelfHeal.controller.js | YES | VEN-STATE-003 (userId-as-profileId) |
| apps/VCSM/src/state/identity/IdentityDebugger.jsx | YES | VEN-STATE-005 (debugger rendering) |
| apps/VCSM/src/state/identity/actors/assertActorId.js | YES | VEN-STATE-006 (unguarded console.error) |
| apps/VCSM/src/state/identity/identityStorage.js | YES | VERIFIED SAFE — localStorage scoped by userId |
| apps/VCSM/src/state/identity/identitySelectors.js | YES | VERIFIED SAFE — exposes only actorId, kind, realmId; no PII |
| apps/VCSM/src/state/identity/useIdentityResolutionEffect.hook.js | YES | VERIFIED SAFE — user identity ownership mismatch check present (line 152–160) |
| apps/VCSM/src/state/identity/identityResolutionSelfHeal.helper.js | YES | VERIFIED SAFE — delegates to finalizeSelfHealedIdentity |
| apps/VCSM/src/state/identity/identity.controller.inflight.js | YES | VERIFIED SAFE — in-flight dedup is scoped to userId; console.log gated behind IS_DEV |
| apps/VCSM/src/state/identity/queries/identityEngineQuery.js | YES | VEN-STATE-009 (staleTime); resolve count log gated behind DEV |
| apps/VCSM/src/state/identity/useIdentitySync.js | YES | VERIFIED SAFE — saves actorId scoped to user?.id |
| apps/VCSM/src/state/actors/profileGateStore.js | YES | VERIFIED SAFE — signal-only store, no data |
| apps/VCSM/src/state/social/followRequestsStore.js | YES | VERIFIED SAFE — signal-only store, no data |

Total surfaces in scope: 0 (scanner) + 16 source files (manual)
Surfaces source-verified: 16 / 16
CRITICAL findings: 0 — N/A
All CRITICAL findings [SOURCE_VERIFIED]: N/A

**VERIFIED SAFE paths of note:**
- Identity ownership mismatch guard (useIdentityResolutionEffect.hook.js line 152–160): correctly rejects identities whose _engineMeta.userId does not match the current session userId. This is a critical invariant and it IS enforced in source.
- DELETED_ACCOUNT_SENTINEL detection (useIdentityResolutionEffect.hook.js lines 65–75): correctly calls logout() when sentinel is received. Invariant enforced.
- In-flight dedup (identity.controller.inflight.js): correctly scoped per userId — no cross-user dedup risk.
- localStorage scoping (identityStorage.js): correctly scoped by userId — no cross-user persistence risk.

---

## 8. Confidence Summary

| Category | Count |
|---|---|
| HIGH confidence surfaces (scanner) | 0 |
| LOW confidence surfaces (scanner) | 0 |
| [SOURCE_VERIFIED] findings | 9 |
| [SCANNER_LEAD] findings | 0 |
| [SCANNER_LOW_CONF] findings | 0 |

All findings are [SOURCE_VERIFIED] — no scanner signals generated findings; all findings
derived from manual source inspection of the zero-write-surface state module.

---

## 9. THOR Impact

| Finding | Severity | THOR Blocker? | Reason |
|---|---|---|---|
| VEN-STATE-001 | HIGH | NO — RECOMMENDED P1 | PII in identity model; no active exploit path confirmed |
| VEN-STATE-002 | MEDIUM | NO | Deprecated hook surface; no sunset timeline |
| VEN-STATE-003 | MEDIUM | NO | Wrong ownership lookup method in self-heal |
| VEN-STATE-004 | HIGH | YES — RECOMMEND P1 | Missing behavioral contract for the app's most critical security module |
| VEN-STATE-005 | LOW | NO | Dev-only debugger; correctly gated |
| VEN-STATE-006 | LOW | NO | Unguarded console.error in production |
| VEN-STATE-007 | HIGH | YES — RECOMMEND P1 | Blocked VPORT lifecycle enforcement gap — silent no-op |
| VEN-STATE-008 | MEDIUM | NO | owner_user_id in vport identity object |
| VEN-STATE-009 | MEDIUM | NO | 2-minute stale cache on security-sensitive engine context |

**Highest Open Severity: HIGH**
**THOR Release Blockers (recommended): VEN-STATE-004, VEN-STATE-007**

VEN-STATE-004: The identity resolution module has no behavioral contract. Changes to this
module cannot be safely validated without declared invariants.

VEN-STATE-007: A blocked/deleted/inactive VPORT actor can persist as the active identity
when no personal user actor is available. This is a lifecycle enforcement gap in a module
that is central to all platform authorization.

---

## 10. Required Follow-Up Commands

| Command | Reason |
|---|---|
| LOGAN | Write full BEHAVIOR.md for state module (VEN-STATE-004) — highest priority |
| SPIDER-MAN | Add regression tests: identity ownership mismatch, DELETED_ACCOUNT_SENTINEL logout, blocked-VPORT-only-account lifecycle enforcement |
| ELEKTRA | Audit all callers of useIdentityDetailsDeprecated(); verify no component renders PII fields; trace owner_user_id through downstream consumers |
| DB | Verify: (1) auth.users.id vs public.profiles.id relationship (VEN-STATE-003); (2) engineSwitchActiveActor RLS enforcement (VEN-STATE-009); (3) actor_owners table RLS for blocked VPORT accounts |
| IRONMAN | Own deprecation timeline for useIdentityDetailsDeprecated() and useIdentityDisplayDeprecated(); own IdentityDebugger relocation |
| THOR | Evaluate release gate on VEN-STATE-007 (blocked VPORT lifecycle gap) |

---

## 11. MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-STATE-001 | PII fields (email, birthdate, sex, is_adult) in identity model | DAL + Model | P1 | App | ELEKTRA |
| VEN-STATE-002 | Deprecated hooks expose full identityDetails including lifecycle state | Controller + Documentation | P2 | App + Documentation | IRONMAN |
| VEN-STATE-003 | userId used as profileId in self-heal actor lookup | DAL + Controller | P2 | App | DB |
| VEN-STATE-004 | BEHAVIOR.md is PLACEHOLDER — no security invariants declared | Documentation | P1 | Documentation | LOGAN |
| VEN-STATE-005 | IdentityDebugger in wrong layer; hardening needed | Documentation | P3 | App | IRONMAN |
| VEN-STATE-006 | console.error without IS_DEV gate in assertActorId | Controller | P2 | App | ELEKTRA |
| VEN-STATE-007 | Blocked VPORT lifecycle: silent no-op when no user actor available | Controller | P1 | App | SPIDER-MAN |
| VEN-STATE-008 | owner_user_id (auth UID) fetched unnecessarily in vport identity | DAL | P2 | App | ELEKTRA |
| VEN-STATE-009 | 2-minute stale cache on security-sensitive actor ownership list | Cache | P2 | App | DB |

---

## 12. CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VEN-STATE-004 — missing governance contract for critical module |
| Asset Security | 3 | VEN-STATE-001, VEN-STATE-002, VEN-STATE-008 — PII minimization, auth UID exposure |
| Security Architecture and Engineering | 2 | VEN-STATE-007, VEN-STATE-009 — lifecycle enforcement design, cache staleness |
| Communication and Network Security | 0 | Not applicable — state module is client-side only; no network surfaces |
| Identity and Access Management | 4 | VEN-STATE-001, VEN-STATE-003, VEN-STATE-007, VEN-STATE-009 — wrong authority surface, lifecycle gaps, cache trust |
| Security Assessment and Testing | 1 | VEN-STATE-004 — zero test coverage on most critical path |
| Security Operations | 2 | VEN-STATE-005, VEN-STATE-006 — debug tooling and production log hygiene |
| Software Development Security | 5 | VEN-STATE-001, VEN-STATE-002, VEN-STATE-003, VEN-STATE-005, VEN-STATE-006 — deprecated surfaces, wrong patterns, unguarded logs |

**Uncovered domains:**
- **Communication and Network Security** — Not applicable. The state module operates entirely in the client-side PWA layer. It consumes the Supabase client library which handles transport security. No new network surfaces were introduced by this module.

**CISSP Completion Confirmed:** All 8 domains addressed. 1 domain not applicable (Communication and Network Security) — explicitly stated.

---

## Finding Count Summary

| Severity | Count | Finding IDs |
|---|---|---|
| CRITICAL | 0 | — |
| HIGH | 3 | VEN-STATE-001, VEN-STATE-004, VEN-STATE-007 |
| MEDIUM | 4 | VEN-STATE-002, VEN-STATE-003, VEN-STATE-008, VEN-STATE-009 |
| LOW | 2 | VEN-STATE-005, VEN-STATE-006 |
| **Total** | **9** | |

---

*VENOM V2 Review Complete — 2026-06-04T19:48:00*
*Reviewer: VENOM*
*Provenance: All findings [SOURCE_VERIFIED]*
