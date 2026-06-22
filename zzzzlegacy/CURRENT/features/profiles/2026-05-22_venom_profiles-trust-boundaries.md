# VENOM SECURITY AUDIT

**Target:** profiles module
**Application Scope:** VCSM
**Date:** 2026-05-22
**Reviewer:** VENOM
**Trigger:** CEREBRO-directed verification of vcsm.profiles.architecture.md
**Findings:** 0 CRITICAL | 5 HIGH | 3 MEDIUM | 1 LOW

---

## VENOM TARGET

Feature / Route / Engine: `apps/VCSM/src/features/profiles/`
Application Scope: VCSM
Reason for review: Profiles module has PARTIAL authorization path mapping, no route-level guard confirmed, owner-gated writes with inconsistent enforcement patterns, and raw UUID exposure in public route.
Primary trust boundary: Authenticated Citizen → Authenticated VPORT Owner (write paths)

---

## SECURITY SURFACE

Entry points:
- `/@:username` → `ActorProfileScreen.jsx` (public view)
- `/u/:username` → `UsernameProfileRedirect.jsx` (redirect)
- `/profile/:actorId` → `ActorProfileScreen.jsx` (raw UUID, public view)
- `/actor/:actorId/dashboard/*` → owner-only dashboard (guarded by `OwnerOnlyDashboardGuard`)

Auth source: Supabase session → identity adapter → `useIdentity()` hook
Authorization layer: Mixed — route guards + controller ownership checks + RLS (inconsistent)
Identity surface: `actorId` + `kind` (correct) — but `/profile/:actorId` exposes raw UUID
Sensitive objects involved: VPORT rates, services, gas prices, actor_owners, post reactions

---

## TRUST BOUNDARY TRACE

Client input: `actorId` (URL param), `username` (URL param)
Validated at: Route level for dashboard routes (OwnerOnlyDashboardGuard); controller level for some write paths
Identity resolved at: `useIdentity()` adapter → session binding
Authorization enforced at: **Inconsistent** — see findings below
Data returned to: PWA client (React)

---

## FINDINGS

---

### VENOM SECURITY FINDING — VF-001

- **Finding ID:** VF-001
- **Location:** `apps/VCSM/src/app/routes/index.jsx` — route `/profile/:actorId`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table/View
- **Trust Boundary:** Public Visitor, Authenticated Citizen
- **Boundary Violated:** None (public route) — but violates internal ID exposure policy
- **Contract Violated:** Public Identity Surface Contract
- **Current behavior:** Route `/profile/:actorId` accepts a raw `actorId` UUID as a URL parameter and renders `ActorProfileScreen.jsx`. This UUID is shareable and bookmarkable.
- **Risk:** Raw internal UUID is exposed in a public-facing URL. UUIDs are enumerable and correlatable. Any logged URL (analytics, referrers, access logs) leaks the internal actor identity directly.
- **Severity:** HIGH
- **Exploitability:** MEDIUM
- **Attack Preconditions:**
  - No auth required — public URL
  - actorId must be known (obtainable from API responses or page source)
  - Enumeration not trivially simple but actor UUIDs appear in API responses
- **Blast Radius:** Single actor; but pattern is systemic — many actors' IDs are in URLs
- **Identity Leak Type:** Internal UUID exposure, Actor correlation
- **Cache Trust Type:** Public-profile-sensitive
- **RLS Dependency:** NONE (read-only public profile, no write)
- **Why it matters:** Platform rule explicitly prohibits raw UUIDs in public URLs. Shareable `/profile/:actorId` URLs expose internal actor IDs to analytics, referrers, and search crawlers. This creates a correlation vector and undermines the intent of slug-based routing.
- **Recommended mitigation:** Confirm whether `/profile/:actorId` is still active or has been superseded by `/@:username` slug routing. If active and public, replace `:actorId` with `:slug` and redirect legacy UUID URLs server-side.
- **Rationale:** Slug-based URLs are the canonical pattern; raw UUID URLs should be internal-only or deprecated.
- **Follow-up command:** SENTRY (routing contract compliance)
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Communication and Network Security

---

### VENOM SECURITY FINDING — VF-002

- **Finding ID:** VF-002
- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/services/upsertVportServices.controller.js`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table/View
- **Trust Boundary:** Authenticated VPORT Owner
- **Boundary Violated:** Authenticated Citizen → Authenticated VPORT Owner (write path has no controller-level gate)
- **Contract Violated:** Actor Ownership Contract
- **Current behavior:** Controller contains a comment `// Ownership enforced by RLS` on line 13. There is **no `assertActorOwnsVportActorController()` call** or any equivalent ownership verification at the controller level. Any authenticated caller can invoke this controller with any `targetActorId`.
- **Risk:** An authenticated Citizen who knows a target actor's ID could invoke the services upsert path for another actor's VPORT. Defense is entirely reliant on the DB-level RLS policy being correct and not having any policy gap. There is no defense-in-depth at the application layer.
- **Severity:** HIGH
- **Exploitability:** HIGH
- **Attack Preconditions:**
  - Authenticated Citizen account required
  - Target actorId known (obtainable from public profile API responses)
  - Must reach the upsert controller — requires calling via UI or direct hook invocation
- **Blast Radius:** Single VPORT (per call); pattern is repeatable across all VPORTs
- **Identity Leak Type:** None (write risk, not read)
- **Cache Trust Type:** None
- **RLS Dependency:** REQUIRED — sole enforcement layer; UNVERIFIED (no db_snapshot available to confirm RLS policy)
- **Why it matters:** Defense-in-depth requires both application-layer and DB-layer ownership verification. A bug or future RLS policy change would silently remove the only protection. Comparable controllers (e.g., `upsertVportRate.controller.js`) correctly call `assertActorOwnsVportActorController()` — this controller is inconsistent with that pattern.
- **Recommended mitigation:** Add `assertActorOwnsVportActorController(identityActorId, targetActorId)` call before any write operation, consistent with `upsertVportRate.controller.js` pattern. Do not rely solely on RLS for ownership enforcement on write paths.
- **Rationale:** The VCSM Actor Ownership Contract requires ownership verified at the controller layer. RLS is a backup, not the primary guard.
- **Follow-up command:** DB (verify RLS on vport services table)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering, Software Development Security

---

### VENOM SECURITY FINDING — VF-003

- **Finding ID:** VF-003
- **Location:** `apps/VCSM/src/features/profiles/controller/checkActorOwnership.controller.js`
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Authenticated Citizen → Authenticated VPORT Owner
- **Boundary Violated:** Controller layer delegates business logic to DAL
- **Contract Violated:** Actor Ownership Contract, Architecture Layer Contract
- **Current behavior:** `checkActorOwnership.controller.js` is a pass-through that directly calls `checkActorOwnershipDAL` and returns its result. The controller adds no business logic, no validation, and no enrichment. The DAL file (`checkActorOwnership.dal.js`) itself performs the ownership semantic check — business logic in the wrong layer.
- **Risk:** Ownership check logic lives in the DAL, not the controller. If the DAL is ever refactored or the query changes, the ownership check may silently break. The controller layer — where ownership assertions should live — is hollow and provides no actual security value.
- **Severity:** HIGH
- **Exploitability:** LOW (not directly exploitable — it's a structural weakness)
- **Attack Preconditions:** N/A — this is an architectural security debt finding
- **Blast Radius:** All callers of `checkActorOwnershipController` — currently `useIsActorOwner.js` hook
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** ASSUMED
- **Why it matters:** Ownership verification is a critical security primitive. It must live in the controller layer where it can be consistently composed with business rules. A DAL-level ownership check cannot be reused safely across different business contexts.
- **Recommended mitigation:** Move ownership check logic into the controller. Controller should validate inputs, call the DAL for raw data, and apply the ownership business rule. DAL should only fetch the `actor_owners` row.
- **Rationale:** Consistent with VCSM architecture contract — DALs do raw data access; controllers own business rules.
- **Follow-up command:** SENTRY
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Identity and Access Management

---

### VENOM SECURITY FINDING — VF-004

- **Finding ID:** VF-004
- **Location:** `apps/VCSM/src/features/profiles/hooks/useProfileGate.js`
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Public Visitor, Authenticated Citizen
- **Boundary Violated:** Client-side gate is sole enforcement for profile privacy
- **Contract Violated:** Actor Ownership Contract (private profile access)
- **Current behavior:** `useProfileGate.js` enforces private profile visibility using client-side checks: `useActorPrivacy()`, `useFollowStatus()`, `useBlockStatus()`. Gate logic runs entirely in React and produces a `canViewContent` boolean passed to downstream hooks. If a user modifies client state or bypasses the gate, the downstream data fetches will still execute.
- **Risk:** Client-side privacy gate can be bypassed. A determined user who can observe and manipulate the React state tree (e.g., via browser devtools) could set `canViewContent = true` and trigger post/photo fetches for a private profile. If the server-side (RLS) is correctly configured, this fetch would return nothing — but this relies entirely on unverified RLS.
- **Severity:** HIGH
- **Exploitability:** MEDIUM
- **Attack Preconditions:**
  - Authenticated Citizen account required
  - Target profile must be private or blocking the viewer
  - Browser devtools access or manipulated React state required
- **Blast Radius:** Single actor's private content
- **Identity Leak Type:** Actor correlation (private profile content exposed)
- **Cache Trust Type:** Public-profile-sensitive, Moderation-sensitive
- **RLS Dependency:** REQUIRED — client gate is insufficient alone; UNVERIFIED
- **Why it matters:** Privacy enforcement must be server-side. Client-side gates are a UX convenience, not a security boundary. If `vc.posts` RLS does not enforce follow-relationship checks, private content is exposed to any authenticated user.
- **Recommended mitigation:** Verify that RLS on `vc.posts` enforces `actor_privacy` and `actor_follows` checks server-side. Add server-side controller validation when fetching posts (e.g., verify viewer-actor relationship before returning post data from `getActorPostsController`).
- **Rationale:** Defense-in-depth requires server-side enforcement for all privacy-sensitive reads.
- **Follow-up command:** DB (verify RLS on vc.posts for privacy/follow enforcement)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering

---

### VENOM SECURITY FINDING — VF-005

- **Finding ID:** VF-005
- **Location:** `apps/VCSM/src/features/profiles/screens/ActorProfileScreen.jsx`
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Public Visitor
- **Boundary Violated:** Debug tooling imported in production screen file
- **Contract Violated:** None (conditional rendering present, but import exists)
- **Current behavior:** `ActorProfileScreen.jsx` imports two debug components:
  ```js
  import { ActorProfileDevProbe } from "@/features/profiles/screens/components/ActorProfileDevProbe"
  import { ActorProfileProdDebugPanel } from "@/features/profiles/screens/components/ActorProfileProdDebugPanel"
  ```
  The `ActorProfileProdDebugPanel` name explicitly suggests it is intended for production environments. The imports exist in the production screen regardless of rendering guard.
- **Risk:** Debug components are bundled into the production build even if conditionally rendered. `ActorProfileProdDebugPanel` (named for prod) could expose internal state, actor IDs, request details, or routing telemetry to production users if its render guard is insufficient or accidentally enabled.
- **Severity:** HIGH
- **Exploitability:** LOW (depends on whether the panel renders in production)
- **Attack Preconditions:**
  - Must be in production build
  - Panel must render (depends on internal guard)
- **Blast Radius:** Any user visiting an actor profile
- **Identity Leak Type:** Internal UUID exposure, Actor correlation (if panel displays internal data)
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** A component named `ActorProfileProdDebugPanel` that ships in production is a red flag. Even with a render guard, it increases bundle size and creates a latent exposure risk if the guard fails.
- **Recommended mitigation:** Move all debug components to `zNOTFORPRODUCTION/debuggers/` per the debugger architecture pattern. Verify `ActorProfileProdDebugPanel` render guard and confirm it never renders for non-dev users in production builds.
- **Rationale:** Debug tooling in production builds is a persistent risk surface. Platform rule requires all debuggers in the `zNOTFORPRODUCTION/` directory.
- **Follow-up command:** LOGAN
- **CISSP Domain:**
  - Primary: Security Operations
  - Secondary: Asset Security

---

### VENOM SECURITY FINDING — VF-006 (MEDIUM)

- **Finding ID:** VF-006
- **Location:** `apps/VCSM/src/features/profiles/dal/post/fetchPostsForActor.dal.js`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table/View
- **Trust Boundary:** Authenticated Citizen (any)
- **Boundary Violated:** Over-broad data fetch — cross-schema read without stated ownership requirement
- **Contract Violated:** Asset Security (data minimization)
- **Current behavior:** `fetchPostsForActor.dal.js` fetches from six different tables/schemas (`vc.posts`, `vc.post_media`, `vc.post_mentions`, `vc.actors`, `public.profiles`, `vport.profiles`) in a single DAL method. This method reads actor data including `public.profiles` and `vport.profiles` for mention resolution. No caller identity check exists in this DAL.
- **Risk:** Cross-schema read pulling `public.profiles` (user profiles) and `vport.profiles` (business profiles) for mention resolution. The mention resolution reads profile display data for every mentioned actor. If an actor's profile is private or deleted, the mention resolution may still expose their display data.
- **Severity:** MEDIUM
- **Exploitability:** LOW
- **Attack Preconditions:** Must be an authenticated user viewing a post with mentions
- **Blast Radius:** Mentioned actors across any post
- **Identity Leak Type:** Actor correlation (mentioned actors' display data)
- **Cache Trust Type:** None
- **RLS Dependency:** ASSUMED — relies on Supabase RLS on all six tables
- **Why it matters:** Mention resolution fetches identity data for actors who may be private, blocked, or deleted. If RLS on `public.profiles` or `vport.profiles` does not filter by lifecycle/privacy state, deleted or private actor display data leaks through mention display.
- **Recommended mitigation:** Verify RLS on `public.profiles` and `vport.profiles` filters out inactive/deleted actors. Add lifecycle filter in mention resolution query. This DAL should be moved to `post` feature and consumed via adapter.
- **Rationale:** Data minimization principle — only fetch visible/active actor data for mentions.
- **Follow-up command:** DB
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Identity and Access Management

---

### VENOM SECURITY FINDING — VF-007 (MEDIUM)

- **Finding ID:** VF-007
- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js`
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Internal (controller layer)
- **Boundary Violated:** Debug log in DAL file
- **Contract Violated:** Security Operations (debug leakage)
- **Current behavior:**
  ```js
  if (import.meta.env?.DEV) {
    console.log("[dalReadActorOwnerRow] actorId=", actorId, "userId=", userId);
  }
  ```
  The DAL logs `actorId` and `userId` to the console in development mode.
- **Risk:** DEV-only guard reduces production risk, but `console.log` with `actorId` and `userId` creates a development security hygiene issue. Platform rule prohibits `console.log` entirely (debug output must render on-screen). Logging identity-sensitive fields (`userId`, `actorId`) via console creates risk if the DEV guard ever fails or is accidentally removed.
- **Severity:** MEDIUM
- **Exploitability:** LOW (DEV-only)
- **Attack Preconditions:** Must be in development environment
- **Blast Radius:** Development environment only
- **Identity Leak Type:** Internal UUID exposure (actorId + userId)
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Logging identity-sensitive fields establishes a bad pattern. If the guard is removed, `actorId` and `userId` are logged in production, violating both platform debug rules and data minimization principles.
- **Recommended mitigation:** Remove the console.log. If debug visibility is needed, use the platform's screen-rendered dev probe pattern.
- **Rationale:** Platform rule: no console.log; all debug output must render on screen and be dev-only.
- **Follow-up command:** LOGAN
- **CISSP Domain:**
  - Primary: Security Operations
  - Secondary: Software Development Security

---

### VENOM SECURITY FINDING — VF-008 (MEDIUM)

- **Finding ID:** VF-008
- **Location:** Multiple — `upsertVportRate.controller.js` (has check), `upsertVportServices.controller.js` (no check), `submitFuelPriceSuggestion.controller.js` (has check), `checkActorOwnership.controller.js` (delegated to DAL)
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Authenticated VPORT Owner
- **Boundary Violated:** Inconsistent defense-in-depth across owner-write controllers
- **Contract Violated:** Actor Ownership Contract
- **Current behavior:** Owner-gated write controllers in the profiles module use inconsistent ownership enforcement patterns:
  - `upsertVportRate` — calls `assertActorOwnsVportActorController()` ✓
  - `submitFuelPriceSuggestion` (owner path) — explicit ownership check ✓
  - `upsertVportServices` — comment "Ownership enforced by RLS," no app-layer check ✗
  - `checkActorOwnership` — delegates to DAL ✗
- **Risk:** The inconsistency means that some VPORT write paths have app-layer ownership defense and others do not. A developer adding a new VPORT write path may follow the `upsertVportServices` pattern (trusting RLS only), creating a systemic escalation risk.
- **Severity:** MEDIUM
- **Exploitability:** MEDIUM (for upsertVportServices — see VF-002)
- **Attack Preconditions:** Authenticated Citizen, target actorId known
- **Blast Radius:** All VPORT write paths using the "RLS only" pattern
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** ASSUMED for inconsistent paths; REQUIRED for defense-in-depth
- **Why it matters:** Security patterns must be consistent. Inconsistency breeds exploitable gaps as the codebase grows.
- **Recommended mitigation:** Establish a single canonical ownership gate function (`assertActorOwnsVportActorController`) and require its use on ALL VPORT owner-write controller paths. Document this as the required pattern in VCSM architecture guidelines.
- **Rationale:** Defense-in-depth requires consistent application of security controls.
- **Follow-up command:** SENTRY (architecture compliance), DB (RLS verification)
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Identity and Access Management

---

### VENOM SECURITY FINDING — VF-009 (LOW)

- **Finding ID:** VF-009
- **Location:** `apps/VCSM/src/features/profiles/dal/readActorPosts.dal.js`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table/View
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Sensitive internal fields returned in post data
- **Contract Violated:** Asset Security
- **Current behavior:** `readActorPosts.dal.js` SELECT includes `deleted_at`, `deleted_by_actor_id`, and `edited_at` in the returned post data. These are internal audit/moderation fields.
- **Risk:** `deleted_by_actor_id` is an internal moderation/admin field. While deleted posts are filtered (`WHERE deleted_at IS NULL`), the field is still present in the SELECT statement. If the filter is ever relaxed (e.g., showing "this post was deleted" placeholder), the `deleted_by_actor_id` leaks to the client — revealing who performed moderation.
- **Severity:** LOW
- **Exploitability:** LOW (filter currently prevents deleted posts from returning)
- **Attack Preconditions:** Would require filter relaxation or a separate query path
- **Blast Radius:** Post data returned to any profile viewer
- **Identity Leak Type:** Moderation-state leakage
- **Cache Trust Type:** None
- **RLS Dependency:** NONE (app-level filter currently prevents issue)
- **Why it matters:** Proactive data minimization — avoid returning fields that could leak moderation identity if query behavior changes.
- **Recommended mitigation:** Remove `deleted_by_actor_id` from the DAL SELECT statement. If needed for moderation UI, create a separate moderation-only DAL method.
- **Rationale:** Data minimization principle — only return fields needed by the consumer.
- **Follow-up command:** DB
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Software Development Security

---

## IDENTITY SURFACE WARNING

Location: `apps/VCSM/src/app/routes/index.jsx` — `/profile/:actorId`
Current identity surface: Raw `actorId` UUID in public URL parameter
Expected identity surface: Human-readable slug (`/@:username` or `/:slug`)
Risk: Internal UUID correlation, analytics/referrer leakage
Suggested correction: Replace `/profile/:actorId` with slug-based routing; add server-side redirect for legacy UUID URLs

---

## DEBUG LEAKAGE WARNING

Location: `apps/VCSM/src/features/profiles/screens/ActorProfileScreen.jsx`
Current behavior: `ActorProfileProdDebugPanel` imported and conditionally rendered in production screen
Leak risk: Internal state, actor IDs, route telemetry potentially visible in production
Severity: HIGH
Recommended mitigation: Move all debug panels to `zNOTFORPRODUCTION/debuggers/profiles/`; verify no debug component renders in production

---

## ACTOR OWNERSHIP WARNING

Location: `upsertVportServices.controller.js`
Caller actor: Authenticated Citizen (identity from `useIdentity()`)
Target actor: `targetActorId` (URL param / hook arg)
Ownership verification: **NONE at controller level** — comment states "Ownership enforced by RLS"
Risk: Any authenticated user can attempt a service upsert for any VPORT if RLS has a gap
Recommended mitigation: Add `assertActorOwnsVportActorController(identityActorId, targetActorId)` before all writes

---

## MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VF-001 | Raw UUID in public URL | Router | P0 | App | SENTRY |
| VF-002 | No controller ownership check on upsertVportServices | Controller | P0 | App | DB |
| VF-003 | Ownership check logic in DAL | Controller + DAL | P1 | App | SENTRY |
| VF-004 | Client-only privacy gate | RLS + Controller | P1 | App + DB | DB |
| VF-005 | Debug panel in production screen | Documentation + UI | P1 | App | LOGAN |
| VF-006 | Cross-schema mention fetch without lifecycle filter | DAL + RLS | P2 | App + DB | DB |
| VF-007 | console.log in DAL with identity fields | DAL | P2 | App | LOGAN |
| VF-008 | Inconsistent ownership enforcement pattern | Controller (all write paths) | P1 | App | SENTRY |
| VF-009 | deleted_by_actor_id in SELECT | DAL | P3 | App | DB |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 0 | Governance risk covered under Architecture and IAM findings |
| Asset Security | 3 | VF-001 (UUID exposure), VF-006 (data minimization), VF-009 (sensitive fields) |
| Security Architecture and Engineering | 4 | VF-002, VF-003, VF-004, VF-008 (inconsistent defense-in-depth) |
| Communication and Network Security | 1 | VF-001 (public URL identity exposure) |
| Identity and Access Management | 5 | VF-002, VF-003, VF-004, VF-006, VF-008 |
| Security Assessment and Testing | 0 | No test coverage exists — flagged in source document; covered by separate finding |
| Security Operations | 2 | VF-005 (debug panel in prod), VF-007 (console.log identity fields) |
| Software Development Security | 4 | VF-003, VF-005, VF-007, VF-008 (coding pattern issues) |

**Uncovered domains:**
- Security and Risk Management — not directly applicable to module-level code review; governance gaps are captured in IRONMAN/LOGAN findings
- Security Assessment and Testing — zero test coverage is a known gap (logged in source document as FAIL); no new findings added here — requires separate test coverage audit

---

## VENOM FINAL STATUS

**Release-blocking findings:** VF-001, VF-002 (BLOCKING — owner write path with no app-layer auth)
**High severity:** VF-001, VF-002, VF-003, VF-004, VF-005
**Medium severity:** VF-006, VF-007, VF-008
**Low severity:** VF-009

**Overall trust boundary assessment:** PARTIAL — profiles has some strong ownership patterns (`upsertVportRate`, `submitFuelPriceSuggestion`) but the inconsistency across write paths and the missing server-side privacy enforcement make the module a MEDIUM security risk overall.

**Recommended next command:** SENTRY (architecture boundary enforcement)
