# VENOM V2 SECURITY REVIEW — hydration

---

## Output Metadata

| Field | Value |
|---|---|
| Category Key | VCSM.hydration |
| Feature | hydration |
| Command | VENOM |
| Ticket | TICKET-SCANNER-VENOM-INTEGRATION-0001 |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/hydration/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_hydration-security-review.md |
| Timestamp | 2026-06-04T19:48:00 |
| Reviewer | VENOM |

---

## 1. VENOM Scanner Preflight

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map | Generated At | Age | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | PASS |
| rpc-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | PASS |
| edge-function-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | PASS |
| security-path-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | PASS |
| route-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | PASS |
| write-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | PASS |
| rpc-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | PASS |
| edge-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | PASS |

Overall Preflight: PASS
Write surfaces in scope: 0
RPC surfaces in scope: 0 (direct)
Edge function surfaces in scope: 0
Security paths in scope: 0
```

> Note: The scanner correctly reports zero write/RPC/edge surfaces for the hydration
> feature. Hydration is a read-only bootstrapping and actor resolution system — it
> performs no INSERT, UPDATE, DELETE operations of its own. The zero-surface result
> is architecturally expected. VENOM proceeds with source inspection for hard-coded
> bypasses, debug leaks, unsafe exports, and sensitive data handling.

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Surfaces In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Primary attack surface inventory |
| rpc-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 1 (engine) | RPC surface inventory |
| edge-function-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Edge function surface inventory |
| security-path-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Security path inventory |
| route-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Route→write chain resolution |
| write-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Write surface caller chain resolution |
| rpc-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | RPC caller chain resolution |
| edge-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Edge caller chain resolution |

Scanner Version: 1.1.0
Overall Preflight: FRESH
Preflight Action: PASSED
Total surfaces in scope: 0 write + 0 rpc + 0 edge (feature-scoped)
Engine RPC noted: `vc.get_actor_summaries` — invoked from `engines/hydration/src/dal.js`
Total security paths in scope: 0
HIGH confidence paths (resolved): 0
LOW confidence paths (unresolved): 0

---

## 3. Security Surface Inventory

```
VENOM SECURITY SURFACE INVENTORY
==================================
Feature: hydration
Scan Date: 2026-06-04T19:48:25.152Z

Write Surfaces: 0
  INSERT: 0 | UPDATE: 0 | DELETE: 0 | UPSERT: 0
  Tables affected: NONE

RPC Calls: 1 (engine-level, not feature-scoped)
  Schema: vc:get_actor_summaries (engines/hydration/src/dal.js)

Edge Functions: 0

Security Paths: 0 (scanner-reported)

Execution Paths Resolved: N/A

Source files inspected (manually):
  apps/VCSM/src/features/hydration/setup.js
  apps/VCSM/src/features/hydration/vcsmActorHydrator.js
  apps/VCSM/src/state/identity/identity.read.dal.js
  apps/VCSM/src/state/identity/identity.controller.js
  apps/VCSM/src/state/identity/identity.model.js
  apps/VCSM/src/state/identity/identityContext.jsx
  engines/hydration/src/config.js
  engines/hydration/src/controller/hydrateActor.controller.js
  engines/hydration/src/store.js
  engines/hydration/src/hydrate.js
  engines/hydration/src/dal.js
  engines/hydration/src/normalize.js
  engines/hydration/src/useActorSummary.js
  engines/hydration/src/extract.js
  apps/VCSM/src/shared/lib/iosProdDebugger.js
  apps/VCSM/src/main.jsx
```

---

## 4. Scanner Signals

| Signal | Source Map | Map Entry | Scanner Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|---|
| RPC vc.get_actor_summaries at engines/hydration/src/dal.js | rpc-map | feature=null, root=engines/hydration | HIGH | YES — dal.js line 35: no caller auth check at engine layer | [SOURCE_VERIFIED] | VEN-HYDRATION-001 |
| profile_actor_access direct query in vcsmActorHydrator.js | source inspection | vcsmActorHydrator.js:64-72 | N/A (source direct) | YES — line 64-72: raw supabaseClient inline query, no auth session bind | [SOURCE_VERIFIED] | VEN-HYDRATION-002 |
| PROFILE_COLUMNS includes email/birthdate/age/sex/is_adult | source inspection | identity.read.dal.js:6-23 | N/A | YES — line 10-17: sensitive PII fields fetched and mapped into hydration output | [SOURCE_VERIFIED] | VEN-HYDRATION-003 |
| ownerActorId exposed via toPublicIdentity() surface | source inspection | identity.model.js:7 | N/A | YES — line 7: ownerActorId passed to public identity surface | [SOURCE_VERIFIED] | VEN-HYDRATION-004 |
| debugLoginEvent logs allActorIds + userId + userAppAccountId in DEV | source inspection | identity.controller.js:107,155-158 | N/A | YES — line 107: full userId; line 158: all actor IDs array; DEV-gated but path confirmed | [SOURCE_VERIFIED] | VEN-HYDRATION-005 |
| Actor store (useActorStore) caches hydrated data with no lifecycle invalidation | source inspection | engines/hydration/src/store.js | N/A | YES — store.js: no is_deleted/is_active/is_blocked eviction path present | [SOURCE_VERIFIED] | VEN-HYDRATION-006 |
| BEHAVIOR.md is a PLACEHOLDER with no §5 Security Rules or §9 Must Never Happen | BEHAVIOR.md | ZZnotforproduction/.../BEHAVIOR.md | N/A | YES — file contains only "Status: PLACEHOLDER" | [SOURCE_VERIFIED] | VEN-HYDRATION-007 |

---

## 5. Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: ZZnotforproduction/APPS/VCSM/features/hydration/BEHAVIOR.md
BEHAVIOR.md exists: YES
BEHAVIOR.md status: PLACEHOLDER (not APPROVED or REVIEWED)
§5 Security Rules declared: 0
§5 Rules verified in source: 0 / 0
§5 Rules unenforced: NONE DECLARED — contract incomplete
§9 Must Never Happen declared: 0
§9 Invariants protected in source: 0 / 0
§9 Invariants unprotected: NONE DECLARED — contract incomplete
```

BEHAVIOR.md exists but is a non-functional placeholder with no declared Security Rules
(§5) or Must Never Happen invariants (§9). The security posture of this feature cannot
be evaluated against a declared contract. All findings below are UNANCHORED — they are
derived from source inspection without a ratified behavioral specification.

---

## 6. Trust Boundary Findings

---

### VEN-HYDRATION-001

```
VENOM SECURITY FINDING
- Finding ID: VEN-HYDRATION-001
- Location: engines/hydration/src/dal.js:35 | engines/hydration/src/config.js:27
- Application Scope: VCSM + ENGINE
- Platform Surface: Shared Engine / Supabase RPC
- Trust Boundary: Authenticated Citizen, Authenticated VPORT Owner, System Service
- Boundary Violated: Any caller can invoke hydrateActorsFromRows / hydrateActorsByIds
  with arbitrary actor IDs — the engine performs no authentication check and no
  ownership verification before issuing the RPC.
- Contract Violated: Actor Ownership Contract
- Current behavior: engines/hydration/src/dal.js calls vc.get_actor_summaries with
  any array of actorIds passed in. The engine itself does not verify the caller is
  authenticated or that the caller has permission to resolve those actor IDs.
  getActorSummariesByIdsDAL accepts actorIds directly from any upstream caller with
  no session check. The Supabase RPC is the only enforcement layer — its policy is
  ASSUMED (not verified in source by VENOM).
- Risk: If the vc.get_actor_summaries RPC does not enforce RLS or caller-identity
  filtering, any actor ID passed in will return profile data (displayName, avatar,
  slug/username) for that actor without the caller proving they are authenticated.
  Since the engine is shared and callable from any feature, a feature that incorrectly
  passes unvetted actor IDs can enumerate actor profiles.
- Severity: MEDIUM
- Exploitability: MEDIUM
- Attack Preconditions:
  - Caller must know actor IDs (UUIDs — not trivially guessable but obtainable
    from feed, chat, or booking responses)
  - No app-layer auth check wraps the engine call
  - Attacker needs access to a context where hydrateActorsFromRows or
    hydrateActorsByIds is invoked with attacker-controlled IDs
- Blast Radius: Multi-actor — actor display summaries (name, avatar, username) for
  any actor ID array supplied to the engine
- Identity Leak Type: Actor correlation, Resource enumeration
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: ASSUMED — the RPC vc.get_actor_summaries is expected to apply
  correct RLS/SECURITY DEFINER filtering but this was not verified in source
- Why it matters: The hydration engine is the canonical actor resolution surface
  for the entire platform. If the RPC over-returns data or has weak RLS, any feature
  using the engine can leak actor summaries for actors that should be private,
  deleted, or inaccessible.
- Recommended mitigation: (1) DB command should verify vc.get_actor_summaries is
  SECURITY DEFINER with explicit lifecycle filtering (is_deleted=false, is_active=true
  for vports). (2) Consider whether the engine should require a session token be
  passed when calling the RPC from server context. (3) Document RLS behavior in
  SECURITY.md once DB inspection is complete.
- Rationale: Engine-level data access with no app-layer auth guard relies entirely
  on DB policy. The policy must be verified, not assumed.
- Follow-up command: DB
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering, Security Assessment and Testing
```

---

### VEN-HYDRATION-002

```
VENOM SECURITY FINDING
- Finding ID: VEN-HYDRATION-002
- Location: apps/VCSM/src/features/hydration/vcsmActorHydrator.js:64-72
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table/View
- Trust Boundary: Authenticated Citizen, Authenticated VPORT Owner
- Boundary Violated: Inline direct Supabase query inside the VCSM hydrator bypasses
  the DAL layer abstraction. The query is issued via the module-level supabaseClient
  import (not through the engine's configured client), with no session verification
  at the call site.
- Contract Violated: Actor Ownership Contract, Security Architecture and Engineering
- Current behavior: vcsmActorHydrator.js lines 64-72 contain an inline direct query:
  ```
  const { data: accessRow } = await supabaseClient
    .schema("vport")
    .from("profile_actor_access")
    .select("actor_id")
    .eq("profile_id", vport.id)
    .eq("is_primary", true)
    .maybeSingle();
  ```
  This query:
  (a) Is NOT routed through any DAL function — it is inline in the hydrator
  (b) Uses a direct module-level supabaseClient import rather than the engine's
      configured/injected client
  (c) Executes with whatever RLS applies to vport.profile_actor_access for the
      current session — but the hydrator itself receives no session parameter
  (d) Is a fallback path triggered when actor_owners lookup returns no user_id
- Risk: (1) Inline DB queries in hydrators violate the DAL abstraction layer and
  are invisible to the scanner surface map. (2) If the hydrator is invoked in a
  context without an active session (e.g., during bootstrap before auth completes),
  the anon client may return unexpected data or silently return null, allowing
  ownerActorId to remain null when it should fail. (3) The vport.profile_actor_access
  table's RLS coverage is UNVERIFIED — if it allows broad reads, this could return
  owner actor IDs for VPORTs the caller is not entitled to inspect.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions:
  - Must reach the VPORT hydration branch (kind === "vport")
  - actor_owners lookup must return no user_id row (uncommon but possible)
  - Attacker needs a session or must reach unauthenticated bootstrap context
- Blast Radius: Single VPORT per call, but repeated calls can enumerate VPORT
  ownership chains
- Identity Leak Type: Ownership inference, Actor correlation
- Cache Trust Type: Identity-sensitive
- RLS Dependency: UNVERIFIED — vport.profile_actor_access RLS not inspected
- Why it matters: Inline DB calls in hydrators are architectural debt that creates
  security blind spots. The query reveals ownerActorId (a sensitive internal
  relationship) without any app-layer ownership check.
- Recommended mitigation: (1) Extract this inline query to a named DAL function
  (readVportPrimaryAccessActorDAL) in identity.read.dal.js. (2) Verify
  vport.profile_actor_access has appropriate RLS. (3) Route to DB for policy
  inspection. Route to ELEKTRA for precise patch.
- Rationale: All DB queries must go through named DAL functions so they appear in
  scanner maps, can be audited, and have named ownership. Inline queries are
  architecturally unsound and become security debt.
- Follow-up command: ELEKTRA, DB
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering, Identity and Access Management
```

---

### VEN-HYDRATION-003

```
VENOM SECURITY FINDING
- Finding ID: VEN-HYDRATION-003
- Location: apps/VCSM/src/state/identity/identity.read.dal.js:6-23 |
            apps/VCSM/src/state/identity/identity.model.js:38-59
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table/View
- Trust Boundary: Authenticated Citizen (self-only)
- Boundary Violated: PII fields (email, birthdate, age, sex, is_adult, last_seen)
  are fetched from the profiles table as part of identity hydration and mapped
  directly into the hydrated actor object. These fields enter the in-memory identity
  state and are accessible to any code that reads identityDetails.
- Contract Violated: Asset Security, Public Identity Surface Contract
- Current behavior:
  PROFILE_COLUMNS in identity.read.dal.js includes:
    "email", "birthdate", "age", "sex", "is_adult", "last_seen"

  mapProfileActor() in identity.model.js maps all of these into the returned actor:
    email: profile?.email ?? null,
    birthdate: profile?.birthdate ?? null,
    age: profile?.age ?? null,
    sex: profile?.sex ?? null,
    isAdult: profile?.is_adult ?? null,
    lastSeen: profile?.last_seen ?? null

  These fields flow into:
    - identityDetails state (IdentityDetailsContext)
    - useIdentityDetailsDeprecated() hook (exposed to any component that calls it)
    - hydratedIdentity object in identity.controller.js (used throughout resolution)

  The VCSM architecture contract states: canonical identity fields are actorId and
  kind. profileId and vportId should never be exposed through useIdentity(). The
  public surface (toPublicIdentity) correctly limits to { actorId, kind, ownerActorId }
  but the deprecated details hook exposes the full hydrated object.
- Risk: (1) Email, birthdate, sex, and is_adult are PII fields that should never
  appear in the actor hydration object — they belong only in account/settings
  screens loaded on demand. (2) useIdentityDetailsDeprecated() leaks these fields
  to any component consumer. (3) If any component reads identityDetails and logs
  it, sends it to analytics, or surfaces it in the UI, PII is exposed beyond the
  intended boundary. (4) last_seen creates a presence-tracking risk — any component
  reading it can expose user activity timing.
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions:
  - Must be the authenticated user (PII is only fetched for self)
  - Must call useIdentityDetailsDeprecated() to access the full object
  - Any accidental logging or analytics event capturing identityDetails exposes PII
- Blast Radius: Single actor (self only) — but affects all sessions for the
  authenticated user
- Identity Leak Type: Private contact exposure, Actor correlation
- Cache Trust Type: Identity-sensitive
- RLS Dependency: NONE — this is an app-layer data minimization issue. The DB
  correctly enforces user-owned access; the problem is fetching more than needed.
- Why it matters: Hydration is the bootstrap surface for the entire platform. PII
  injected into the in-memory identity object at boot time creates persistent
  exposure risk across the entire session. The deprecated details hook amplifies
  this — any component can access email, birthdate, sex without a dedicated
  settings read. VCSM arch rules require actorId + kind as the canonical surface.
- Recommended mitigation: (1) Remove email, birthdate, age, sex, is_adult, last_seen
  from PROFILE_COLUMNS and mapProfileActor. (2) These fields should only be fetched
  in the settings/profile feature when a user explicitly opens their profile settings.
  (3) Deprecate and remove useIdentityDetailsDeprecated() — consumers should use
  useIdentity() (actorId + kind) only. (4) Route to ELEKTRA for a precise patch
  against PROFILE_COLUMNS and mapProfileActor.
- Rationale: Data minimization is the correct defense. Hydration should return only
  what is needed for UI rendering (actorId, kind, displayName, avatar, username).
  PII belongs in an on-demand settings read, not in the bootstrap identity object.
- Follow-up command: ELEKTRA, SPIDER-MAN
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Asset Security
  - Secondary: Identity and Access Management, Software Development Security
```

---

### VEN-HYDRATION-004

```
VENOM SECURITY FINDING
- Finding ID: VEN-HYDRATION-004
- Location: apps/VCSM/src/state/identity/identity.model.js:7 |
            apps/VCSM/src/state/identity/identityContext.jsx:162-176
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen, Authenticated VPORT Owner
- Boundary Violated: ownerActorId (the actor ID of the human owner of a VPORT) is
  included in toPublicIdentity() and propagated into the public IdentityContext value
  exposed to all components via useIdentity().
- Contract Violated: Public Identity Surface Contract, Actor Ownership Contract
- Current behavior:
  toPublicIdentity() in identity.model.js returns:
    { actorId, kind, ownerActorId: source.ownerActorId ?? null }

  This object is set as the public `identity` value in IdentityContext and accessible
  to any component calling useIdentity(). The VCSM architecture contract defines
  canonical identity as actorId + kind only. ownerActorId is an internal ownership
  relationship that should not be part of the public identity surface.
- Risk: (1) ownerActorId reveals the actorId of the human behind a VPORT business
  identity. If a VPORT owner wants business/personal identity separation, exposing
  ownerActorId in the public identity surface breaks that separation. (2) Any
  component reading useIdentity().identity can access ownerActorId and inadvertently
  include it in analytics events, logs, or API calls. (3) The field represents an
  internal actor_owners/profile_actor_access relationship — it should not be
  surfaced as public identity state.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions:
  - Must be the authenticated VPORT owner (ownerActorId is self-referential for
    the logged-in user)
  - Requires code that reads useIdentity() and forwards or logs the full identity
    object
- Blast Radius: Single actor per session — the VPORT owner's personal actorId is
  exposed through their VPORT identity surface
- Identity Leak Type: Actor correlation, Ownership inference
- Cache Trust Type: Identity-sensitive
- RLS Dependency: NONE — app-layer surface exposure issue
- Why it matters: VPORT identity separation is a platform trust promise. A VPORT
  owner operating their business storefront should not expose their personal actorId
  through the business identity surface. ownerActorId breaks that separation in
  the public useIdentity() hook.
- Recommended mitigation: (1) Remove ownerActorId from toPublicIdentity() — the
  public surface should be { actorId, kind } only. (2) Any feature that legitimately
  needs the owner relationship (e.g., VPORT settings, actor-switch UI) should read
  it from identityDetails via a purpose-limited internal hook, not from the public
  identity surface. (3) Route to ELEKTRA for targeted patch.
- Rationale: Minimum necessary disclosure. The public identity surface should expose
  only what is needed for rendering — actorId + kind. All internal relationships
  are out of scope for the public identity hook.
- Follow-up command: ELEKTRA
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Asset Security, Software Development Security
```

---

### VEN-HYDRATION-005

```
VENOM SECURITY FINDING
- Finding ID: VEN-HYDRATION-005
- Location: apps/VCSM/src/state/identity/identity.controller.js:105-158 |
            apps/VCSM/vite.config.js:49-52
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen, Authenticated VPORT Owner
- Boundary Violated: DEV-mode debug logging in the identity resolution flow includes
  full userId, userAppAccountId, full array of all actorIds (allActorIds), actorLinkId,
  and roleKeys. These are logged via debugLoginEvent() which in DEV mode writes to an
  in-memory debug store and dispatches custom window events.
- Contract Violated: Security Operations, Asset Security
- Current behavior:
  In DEV mode (import.meta.env.DEV === true), the identity resolution flow emits:
    - ENGINE_RESOLVE_START: { appKey, userId, resolveAttempt } — full userId (line 107)
    - ENGINE_RESOLVE_SUCCESS: { userId, userAppAccountId, actorId, actorLinkId,
      actorCount, roleKeys, resolveAttempt } — line 128-136
    - HYDRATION_START: { actorId, actorLinkId, actorKind, availableActorCount,
      allActorIds } — line 153-159 — this includes the FULL array of all actor IDs
      for this user account

  In production, @debuggers resolves to debuggers-stub/identity/index.js where all
  functions are no-ops. This is correctly gated via vite.config.js mode check.

  The iOS prod debugger (iosProdDebugger.js) is separately gated to DEV-only via
  IS_PROD checks in the file itself (lines 5, 123, 137, 153, 182, 191, 222).
- Risk: (1) In DEV environments, the full userId and all actor IDs for a user account
  are broadcast as window custom events (IOS_PROD_DEBUG_EVENTS). Any browser extension,
  injected script, or other JavaScript with access to window.addEventListener can
  intercept these events and collect the full actor enumeration. (2) The allActorIds
  array reveals the complete actor identity portfolio of the logged-in user — this
  is a significant actor correlation risk in DEV mode. (3) The iOS prod debugger
  can be enabled via URL query parameter (?iosdbg=1) in non-production builds —
  bootstrapIOSProdDebuggerFromUrl is called from main.jsx only in DEV (line 63),
  but any DEV deployment accessible to external parties is at risk.
- Severity: LOW (production-gated, dev-only risk confirmed)
- Exploitability: LOW
- Attack Preconditions:
  - Must be in a DEV build (not production)
  - Must have browser-level JavaScript access (extension, XSS, shared device)
  - For iOS debug: must be able to pass ?iosdbg=1 query param to a DEV URL
- Blast Radius: Single authenticated session — but reveals full actor portfolio
- Identity Leak Type: Actor correlation, Internal UUID exposure
- Cache Trust Type: Identity-sensitive
- RLS Dependency: NONE — app-layer logging issue
- Why it matters: DEV builds are sometimes shared with QA, reviewers, or external
  testers. The actor enumeration broadcast via window events creates a correlation
  risk in those contexts. The pattern of logging full userId and all actorIds should
  be hardened even in DEV mode.
- Recommended mitigation: (1) Replace full userId with a truncated prefix
  (userId?.slice(0,8)) in all debug payloads — the debug log already does this
  in the ENGINE_RESOLVE_DEDUPED event (line 91) but not in ENGINE_RESOLVE_START
  (line 107). (2) Remove allActorIds from the HYDRATION_START debug payload — actor
  count is sufficient for debugging. (3) Add a note to the iOS prod debugger that
  ?iosdbg=1 must never be in a URL shared externally.
- Rationale: Defense-in-depth in DEV mode. Actor enumeration via debug events
  is avoidable without losing debug utility.
- Follow-up command: ELEKTRA
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Security Operations
  - Secondary: Asset Security, Software Development Security
```

---

### VEN-HYDRATION-006

```
VENOM SECURITY FINDING
- Finding ID: VEN-HYDRATION-006
- Location: engines/hydration/src/store.js:8-116 |
            engines/hydration/src/hydrate.js:28-55
- Application Scope: VCSM + ENGINE
- Platform Surface: Shared Engine / PWA
- Trust Boundary: Authenticated Citizen, Authenticated VPORT Owner
- Boundary Violated: The actor store (Zustand, useActorStore) caches hydrated
  actor summaries with a 5-minute staleness window but has no eviction path for
  lifecycle state changes (actor deleted, VPORT deactivated, actor blocked/suspended).
  A deleted or blocked actor can remain in the cache and be served to UI components
  for up to 5 minutes after the change.
- Contract Violated: VPORT Lifecycle Contract, Cache Trust Classification
- Current behavior:
  store.js defines STALE_AFTER_MS = 5 * 60 * 1000 (5 minutes). The store holds
  cached actor summaries and only re-fetches when the entry is older than 5 minutes
  or explicitly force-refreshed.

  There is no eviction trigger for:
  - Actor soft-deletion (is_deleted = true)
  - VPORT deactivation (is_active = false)
  - Actor blocking/suspension
  - Privacy setting change (is_private = true)

  The normalize.js pipeline does not include is_deleted, is_active, or is_void fields
  — so even if the RPC returns lifecycle flags, they are not stored and cannot be
  used for local eviction decisions.

  The identityContext.jsx has a blocked VPORT auto-switch (line 152-157) but this
  only fires on the authenticated actor's own identity hydration, not on cached
  summaries of other actors displayed in feed/chat.
- Risk: (1) A VPORT owner who is suspended or whose account is deleted may continue
  to appear as an active actor in feed, chat, and booking contexts for up to 5 minutes.
  (2) A citizen who sets their profile to private may continue to have their avatar
  and display name resolved and rendered from cache for up to 5 minutes. (3) In
  chat contexts using hydrateAndReturnSummaries, fresh cache entries bypass the
  network fetch entirely — stale moderation state is served without any re-check.
- Severity: LOW
- Exploitability: LOW
- Attack Preconditions:
  - Lifecycle state change must have occurred (deletion, deactivation, privacy)
  - Attacker or affected user must be in an active session when change occurs
  - Cache must not have been explicitly invalidated or force-refreshed
- Blast Radius: Multi-actor — any actor visible in feed, chat, or booking contexts
  within the 5-minute window
- Identity Leak Type: Actor correlation, Ownership inference
- Cache Trust Type: Moderation-sensitive, Public-profile-sensitive
- RLS Dependency: ASSUMED — the RPC (vc.get_actor_summaries) may filter deleted/
  inactive actors, which would cause them to disappear from next fetch, but the
  5-minute cache window still serves stale state
- Why it matters: Platform trust depends on lifecycle changes being reflected
  promptly. If a user sets their profile to private or is suspended, their data
  should stop appearing immediately, not after 5 minutes. In booking and moderation
  contexts, stale lifecycle state can cause incorrect UI decisions.
- Recommended mitigation: (1) Include is_deleted and is_active in the normalize.js
  pipeline so the store can hold lifecycle flags. (2) Expose a purgeActorFromStore(actorId)
  function in the store for targeted eviction on known lifecycle events. (3) When
  the identity provider detects a blocked/deleted actor event (DELETED_ACCOUNT_SENTINEL
  or blockedVport), also purge the actor from the shared store. (4) Consider reducing
  STALE_AFTER_MS for moderation-sensitive contexts (chat, booking) or adding a force
  flag for those paths.
- Rationale: Cache invalidation on lifecycle changes is a security-critical pattern,
  not a nice-to-have. Moderation actions must be reflected promptly across all
  rendering surfaces.
- Follow-up command: SPIDER-MAN, ELEKTRA
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Security Architecture and Engineering
  - Secondary: Security Operations, Identity and Access Management
```

---

### VEN-HYDRATION-007

```
VENOM SECURITY FINDING
- Finding ID: VEN-HYDRATION-007
- Location: ZZnotforproduction/APPS/VCSM/features/hydration/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Documentation / Governance
- Trust Boundary: N/A — governance finding
- Boundary Violated: The declared behavior contract for the hydration feature is a
  non-functional placeholder. No §5 Security Rules or §9 Must Never Happen invariants
  have been declared.
- Contract Violated: Behavior Contract Governance
- Current behavior:
  BEHAVIOR.md contains only:
    Status: PLACEHOLDER
    Feature: hydration
    Notes: "Behavior contract pending source review."
  No security rules, no invariants, no behavior sections.
- Risk: VENOM and BLACKWIDOW cannot anchor security findings to declared invariants.
  SPIDER-MAN cannot write targeted regression tests. THOR cannot use the behavior
  contract as a release gate. Without declared invariants, security regressions in
  the hydration layer cannot be detected systematically.
- Severity: HIGH
- Exploitability: N/A — governance finding
- Attack Preconditions: N/A
- Blast Radius: Platform-wide — hydration is the bootstrap surface for all actor
  identity resolution; without a behavior contract, any regression in the auth/
  identity flow lacks a test anchor.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The hydration feature bootstraps identity for the entire VCSM
  platform. A missing behavior contract means no declared invariants, no regression
  anchors, and no governance gate. This is a systematic risk amplifier — all other
  findings in this report are UNANCHORED.
- Recommended mitigation: Open a WOLVERINE intake for BEHAVIOR.md authoring. Required
  §5 Security Rules must include: (1) hydrateVcsmActor only runs after session
  is authenticated via resolveAuthenticatedContext, (2) hydration output never
  includes email/PII beyond displayName/avatar/kind, (3) ownerActorId is never
  exposed to public identity surface, (4) deleted actors return null from hydration.
  Required §9 Must Never Happen: (1) a deleted actor must never hydrate successfully,
  (2) PII must never appear in the public useIdentity() surface.
- Rationale: The BEHAVIOR.md contract is a mandatory prerequisite for all other
  security commands (BLACKWIDOW, SPIDER-MAN, THOR) to function correctly for this
  feature.
- Follow-up command: Wolverine (BEHAVIOR.md intake), SPIDER-MAN
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Security Assessment and Testing
```

---

## 7. Source Verification Summary

| Item | Value |
|---|---|
| Total surfaces in scope (scanner) | 0 write, 0 rpc, 0 edge (feature-scoped) |
| Engine RPC inspected | 1 (vc.get_actor_summaries) |
| Source files read | 14 |
| Surfaces source-verified | 14 / 14 |
| CRITICAL findings | 0 |
| HIGH findings | 2 (VEN-HYDRATION-003, VEN-HYDRATION-007) |
| MEDIUM findings | 2 (VEN-HYDRATION-001, VEN-HYDRATION-002) |
| LOW findings | 2 (VEN-HYDRATION-005, VEN-HYDRATION-006) |
| Total findings | 6 |
| All CRITICAL findings SOURCE_VERIFIED | YES (no CRITICAL findings) |

Source files read:
1. apps/VCSM/src/features/hydration/setup.js
2. apps/VCSM/src/features/hydration/vcsmActorHydrator.js
3. apps/VCSM/src/state/identity/identity.read.dal.js
4. apps/VCSM/src/state/identity/identity.controller.js
5. apps/VCSM/src/state/identity/identity.model.js
6. apps/VCSM/src/state/identity/identityContext.jsx
7. engines/hydration/src/config.js
8. engines/hydration/src/controller/hydrateActor.controller.js
9. engines/hydration/src/store.js
10. engines/hydration/src/hydrate.js
11. engines/hydration/src/dal.js
12. engines/hydration/src/normalize.js
13. engines/hydration/src/useActorSummary.js
14. engines/hydration/src/extract.js
15. apps/VCSM/src/shared/lib/iosProdDebugger.js
16. apps/VCSM/src/main.jsx
17. apps/VCSM/vite.config.js (partial — alias section)
18. zzzzlegacy/CURRENT/platform/debuggers/identity/helpers.js

---

## 8. Confidence Summary

| Item | Value |
|---|---|
| HIGH confidence surfaces (scanner) | 0 |
| LOW confidence surfaces (scanner) | 0 |
| [SOURCE_VERIFIED] findings | 6 |
| [SCANNER_LEAD] findings | 0 |
| [SCANNER_LOW_CONF] findings | 0 |
| [SCANNER_STALE] findings | 0 |

All findings in this review are [SOURCE_VERIFIED] — each finding cites the specific
file and line number where the risk was confirmed through source inspection.

The zero scanner surface count for this feature is correct — hydration performs
no writes. The RPC (vc.get_actor_summaries) is correctly attributed to the engine
scope (root=engines/hydration) in the rpc-map, not to a feature scope, which is
why it did not appear in the feature-filtered hydration.json scanner data.

---

## 9. THOR Impact

| Finding | Severity | THOR Release Blocker |
|---|---|---|
| VEN-HYDRATION-003 (PII in identity hydration) | HIGH | YES — PII in bootstrap identity object is a data minimization violation |
| VEN-HYDRATION-007 (Missing BEHAVIOR.md contract) | HIGH | YES — No invariant contract for platform bootstrap surface |
| VEN-HYDRATION-001 (Engine RPC auth assumption) | MEDIUM | NO — requires DB verification first |
| VEN-HYDRATION-002 (Inline DB query in hydrator) | MEDIUM | NO — hardening, not critical |
| VEN-HYDRATION-004 (ownerActorId in public surface) | MEDIUM | NO — information minimization |
| VEN-HYDRATION-005 (Dev debug actor enumeration) | LOW | NO — dev-only |
| VEN-HYDRATION-006 (Cache lifecycle staleness) | LOW | NO — hardening |

**THOR Release Blockers: VEN-HYDRATION-003, VEN-HYDRATION-007**
**Highest Open Severity: HIGH**

---

## 10. Required Follow-Up Commands

| Command | Reason | Priority |
|---|---|---|
| ELEKTRA | Patch VEN-HYDRATION-003: remove PII from PROFILE_COLUMNS and mapProfileActor | P1 |
| Wolverine | BEHAVIOR.md intake for hydration feature (VEN-HYDRATION-007) | P1 |
| DB | Verify vc.get_actor_summaries RPC policy — SECURITY DEFINER, lifecycle filtering (VEN-HYDRATION-001) | P2 |
| DB | Verify vport.profile_actor_access RLS coverage (VEN-HYDRATION-002) | P2 |
| ELEKTRA | Patch VEN-HYDRATION-002: extract inline query to DAL function | P2 |
| ELEKTRA | Patch VEN-HYDRATION-004: remove ownerActorId from toPublicIdentity() | P2 |
| SPIDER-MAN | Add regression tests for: deleted actor hydration returns null, PII not in public identity surface, private profile cache behavior (VEN-HYDRATION-003, VEN-HYDRATION-006) | P2 |
| ELEKTRA | Patch VEN-HYDRATION-005: truncate userId in debug payloads, remove allActorIds from HYDRATION_START | P3 |
| ELEKTRA | Add lifecycle fields to normalize.js and purge function to store (VEN-HYDRATION-006) | P3 |

---

## 11. MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-HYDRATION-003 | PII (email, birthdate, age, sex, is_adult, last_seen) in hydration object | DAL + Model | P1 | App | ELEKTRA |
| VEN-HYDRATION-007 | Missing BEHAVIOR.md behavior contract | Documentation | P1 | App | Wolverine |
| VEN-HYDRATION-001 | Engine RPC auth assumption — no app-layer session gate | RLS + Documentation | P2 | DB + App | DB |
| VEN-HYDRATION-002 | Inline DB query in hydrator bypassing DAL layer | DAL | P2 | App | ELEKTRA |
| VEN-HYDRATION-004 | ownerActorId in public identity surface (useIdentity) | Model | P2 | App | ELEKTRA |
| VEN-HYDRATION-005 | Dev debug actor enumeration via window events | App | P3 | App | ELEKTRA |
| VEN-HYDRATION-006 | Actor store no lifecycle eviction on deletion/block/deactivation | Engine + Cache | P3 | Engine | ELEKTRA |

---

## 12. CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VEN-HYDRATION-007 — missing behavior contract |
| Asset Security | 2 | VEN-HYDRATION-003 (PII overfetch), VEN-HYDRATION-004 (ownerActorId exposure) |
| Security Architecture and Engineering | 3 | VEN-HYDRATION-001 (engine RLS assumption), VEN-HYDRATION-002 (inline query), VEN-HYDRATION-006 (cache staleness) |
| Communication and Network Security | 0 | No network/RPC transport findings in scope — RPC policy delegated to DB |
| Identity and Access Management | 4 | VEN-HYDRATION-001, VEN-HYDRATION-003, VEN-HYDRATION-004, VEN-HYDRATION-006 (lifecycle) |
| Security Assessment and Testing | 1 | VEN-HYDRATION-007 — no test anchors without behavior contract |
| Security Operations | 1 | VEN-HYDRATION-005 — dev debug actor enumeration |
| Software Development Security | 3 | VEN-HYDRATION-002 (inline query), VEN-HYDRATION-003 (PROFILE_COLUMNS), VEN-HYDRATION-005 (debug payloads) |

### CISSP Domain Notes

- **Communication and Network Security** — Not directly applicable in this review.
  The vc.get_actor_summaries RPC transport is delegated to DB inspection (VEN-HYDRATION-001).
  No edge function or custom network transport was found in scope.

- **Identity and Access Management** — Most impacted domain. Hydration is the core
  identity bootstrap surface and findings span RPC auth assumption, PII in identity
  object, ownership field exposure, and lifecycle cache staleness.

- **All 8 CISSP domains assessed** — Communication and Network Security has no
  findings but was explicitly reviewed and found not applicable at the app layer
  (network policy delegated to DB/RPC layer).

---

## VENOM V2 Completion Checklist

- [x] Boundary isolation contract loaded
- [x] Stayed read-only — no source files modified
- [x] Scanner preflight executed — all 8 maps FRESH
- [x] Security surface inventory built from scanner data
- [x] Scanner inputs block emitted
- [x] Scanner signals block emitted
- [x] BEHAVIOR.md read — PLACEHOLDER status documented
- [x] Behavior contract status block emitted
- [x] Trust boundary analysis performed for all surfaces
- [x] Source verification for all 6 findings
- [x] Exploitability classified for each finding
- [x] Blast radius classified for each finding
- [x] Platform surface classified for each finding
- [x] RLS dependency classified for each finding
- [x] Contract violation mapped for each finding
- [x] CISSP domains assigned for each finding
- [x] Mitigation plan table emitted
- [x] CISSP summary table emitted
- [x] Uncovered CISSP domains stated
- [x] All CRITICAL findings SOURCE_VERIFIED (no CRITICAL findings)
- [x] No severity derived from scanner confidence alone
- [x] Report persisted to approved audit path
- [x] SECURITY.md will be written (Write 2 — next step)
