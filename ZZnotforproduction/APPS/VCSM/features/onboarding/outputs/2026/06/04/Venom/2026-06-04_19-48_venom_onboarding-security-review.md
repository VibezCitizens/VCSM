# VENOM V2 Security Review — onboarding

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report ID | VENOM-ONBOARDING-2026-06-04 |
| Feature | onboarding |
| App | VCSM |
| Reviewer | VENOM V2 |
| Date | 2026-06-04 |
| Scanner Version | 1.1.0 |
| Source Root | apps/VCSM/src/features/onboarding/ |
| Doc Root | ZZnotforproduction/APPS/VCSM/features/onboarding/ |
| THOR Release Blocker | YES — VEN-ONBOARDING-001, VEN-ONBOARDING-002 |
| Highest Severity | HIGH |

---

## 2. Scanner Preflight

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                 | Generated At               | Age  | Freshness | Confidence | Status |
|---------------------|----------------------------|------|-----------|------------|--------|
| write-surface-map   | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map             | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map   | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map   | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map   | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map  | 2026-06-04T19:48:25.152Z   | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs

| Field | Value |
|---|---|
| Write Surfaces | 3 |
| RPCs | 0 |
| Security Paths | 3 |
| Write Execution Paths | 3 |
| RPC Execution Paths | 0 |
| Edge Functions | 0 |

### Write Surfaces Detail

| Surface # | Table | Operation | Function | Confidence | Route Resolved |
|---|---|---|---|---|---|
| 1 | vc.actor_onboarding_steps | upsert | markActorOnboardingStepCompletedDAL | HIGH | NO (LOW path confidence) |
| 2 | vc.vibe_actor_tags | update | replaceSelectedVibeTagsDAL | HIGH | NO (LOW path confidence) |
| 3 | vc.vibe_actor_tags | upsert | replaceSelectedVibeTagsDAL | HIGH | NO (LOW path confidence) |

Note: All 3 security paths had LOW confidence due to "write surface discovered without route-confirmed path." Source inspection was performed to compensate.

---

## 4. Security Surface Inventory

### Tables Written To

| Table | Schema | Operations | DAL File |
|---|---|---|---|
| actor_onboarding_steps | vc | upsert | dal/onboardingSteps.dal.js |
| vibe_actor_tags | vc | update, upsert (replace flow) | dal/vibeTags.dal.js |

### Tables Read From (not in scanner, discovered via source inspection)

| Table | Schema | DAL File | Notes |
|---|---|---|---|
| onboarding_steps | vc | dal/onboardingSteps.dal.js | Public read — step catalog |
| actor_onboarding_steps | vc | dal/onboardingSteps.dal.js | Per-actor read |
| vibe_tags | vc | dal/vibeTags.dal.js | Public read — tag catalog |
| vibe_actor_tags | vc | dal/vibeTags.dal.js | Per-actor read |
| vibe_invites | vc | dal/vibeInvites.dal.js | Per-actor read (invites sent by actor) |
| actors | vc | dal/profileCompletion.dal.js | Per-actor read |
| profiles | (default) | dal/profileCompletion.dal.js | Per-actor read via profileId |
| profiles | vport schema | dal/profileCompletion.dal.js | Per-actor read via vportId |

### Controllers

| Controller | Writes | Auth Check |
|---|---|---|
| onboarding.controller.js / getOnboardingCardsController | None (read-only) | actorId guard only |
| vibeTagsOnboarding.controller.js / getVibeTagsOnboardingController | None (read-only) | actorId guard only |
| vibeTagsOnboarding.controller.js / saveVibeTagsOnboardingController | replaceSelectedVibeTagsDAL | actorId guard only |

### Hooks

| Hook | Write Path |
|---|---|
| useOnboardingCards | None |
| useOnboardingVibeTags | save() -> saveVibeTagsOnboardingController -> replaceSelectedVibeTagsDAL |

---

## 5. Scanner Signals

| Signal | Detail |
|---|---|
| Route resolution gap | All 3 execution paths have LOW confidence — no route confirmed by scanner. Source inspection was required and performed. |
| No RPCs | Zero RPCs for this feature. All writes go directly to tables via Supabase client. |
| No Edge Functions | Zero edge functions. No server-side enforcement layer exists for this feature. |
| markActorOnboardingStepCompletedDAL never called | DAL exists in scanner surface but no controller or hook calls it. Dead write surface. |
| replaceSelectedVibeTagsDAL actorId sourced from JS identity | actorId comes from useIdentity() hook, not server session. Client-side identity is trusted for the write target. |

---

## 6. Behavior Contract Status

### BEHAVIOR.md Status

```
Status: PLACEHOLDER
```

The BEHAVIOR.md for onboarding is a placeholder with no content:
- No §5 Security Rules defined
- No §9 Must Never Happen invariants defined

This is a HIGH finding. Without a behavior contract, VENOM cannot cross-check:
- Whether actorId isolation is contractually required
- Whether step-key enumeration is expected to be server-validated
- Whether vibe tag replacement is meant to be atomic/transactional

### BEH IDs Verified: NONE (contract absent)

---

## 7. Trust Boundary Findings

---

### VENOM SECURITY FINDING

- **Finding ID:** VEN-ONBOARDING-001
- **Location:** `apps/VCSM/src/features/onboarding/dal/vibeTags.dal.js:47-77`
- **Application Scope:** VCSM
- **Platform Surface:** Supabase Table (vc.vibe_actor_tags)
- **Trust Boundary:** Authenticated PWA session (Supabase anon/user key)
- **Boundary Violated:** Client-supplied actorId is used as the write target without server-side ownership verification
- **Contract Violated:** VCSM architecture contract — ownership verified through actor_owners only; actorId must not be trusted from client context
- **Current behavior:** `replaceSelectedVibeTagsDAL({ actorId, tagIds })` uses the caller-supplied `actorId` directly in `.eq('actor_id', actorId)` for the UPDATE and in the `upsert` rows. The actorId flows from `useIdentity()` in the hook, which derives it from the client-side identity state. No server-side enforcement verifies that the calling Supabase auth session user owns the actor record being written.
- **Risk:** An authenticated user who obtains or constructs a different actorId (e.g., by observing network traffic, another user's profile page, or API probing) can call the controller with an arbitrary actorId and overwrite that actor's vibe tags — replacing their entire tag set. The update path first voids ALL existing tags for the target actor, then upserts new ones. This is a full data destruction + replacement attack.
- **Severity:** HIGH
- **Exploitability:** MEDIUM
- **Attack Preconditions:** Attacker must have a valid Supabase session (authenticated user). Attacker must know or guess a victim's actorId. RLS must not be enforcing ownership on vc.vibe_actor_tags writes.
- **Blast Radius:** Any actor's vibe tags can be wiped and replaced by a different authenticated user. Affects discovery, personalization, and feed relevance for targeted accounts.
- **Identity Leak Type:** None (exploitation vector, not leak)
- **Cache Trust Type:** None
- **RLS Dependency:** UNVERIFIED — source code provides no evidence that RLS enforces auth.uid() ownership on vc.vibe_actor_tags. No RPC wrapper. Direct table access with client key. If RLS is absent or misconfigured, this is exploitable.
- **Why it matters:** Vibe tags drive feed personalization and discovery. Mass-replacing a victim's tags with irrelevant or offensive tags degrades their experience and potentially their visibility. The void-all-then-upsert pattern means the attack is irreversible without audit logs.
- **Recommended mitigation:** Enforce RLS policy on `vc.vibe_actor_tags` requiring `auth.uid()` to match the profile row that owns the actor. Alternatively, gate `replaceSelectedVibeTagsDAL` behind an RPC that derives the actor from `auth.uid()` server-side, removing actorId from the client payload entirely.
- **Rationale:** The entire write target is client-controlled. Without RLS or an RPC wall, the Supabase client key grants direct table access scoped only by the supplied actorId value.
- **Follow-up command:** DB (verify RLS policy on vc.vibe_actor_tags), ELEKTRA (source-to-sink trace), Carnage (RPC migration)
- **Provenance:** SOURCE_VERIFIED
- **CISSP Domain:**
  - Primary: Access Control
  - Secondary: Software Development Security, Identity and Access Management

---

### VENOM SECURITY FINDING

- **Finding ID:** VEN-ONBOARDING-002
- **Location:** `apps/VCSM/src/features/onboarding/dal/onboardingSteps.dal.js:30-52` + `apps/VCSM/src/features/onboarding/controller/onboarding.controller.helpers.js` (dead surface — no caller found)
- **Application Scope:** VCSM
- **Platform Surface:** Supabase Table (vc.actor_onboarding_steps)
- **Trust Boundary:** Authenticated PWA session
- **Boundary Violated:** Write surface exists with client-supplied actorId and client-supplied stepKey; no ownership check and no caller in the codebase
- **Contract Violated:** VCSM architecture contract — write surfaces must have verified caller chains
- **Current behavior:** `markActorOnboardingStepCompletedDAL({ actorId, stepKey })` upserts into `vc.actor_onboarding_steps` with `status: 'completed'` for any provided actorId + stepKey pair. The scanner confirmed this as a HIGH-confidence write surface. However, source inspection of all controllers and hooks in the feature found **zero callers** of this function. The function is exported but orphaned.
- **Risk:** Two separate risks: (1) **Dead exported write surface** — the function is exported and could be imported and called by any future code, including during rushed feature work, without the author understanding the missing ownership guard. The function will accept any actorId without verifying it belongs to the calling session. (2) **Onboarding step forgery** — if this function were called with an arbitrary actorId and stepKey (e.g., 'complete_citizen_card'), it would mark that step completed for any actor, potentially bypassing onboarding gates or unlock conditions.
- **Severity:** HIGH
- **Exploitability:** LOW (currently no caller exists — not directly exploitable today without code change; risk is forward-looking and governance-critical)
- **Attack Preconditions:** A caller must be added (intentionally or accidentally). RLS must not block the write. Attacker needs valid session + known actorId.
- **Blast Radius:** Onboarding step status is used for progress tracking and potentially unlock gates (e.g., invite step completion short-circuits invite count checks). Forging completion of onboarding steps could bypass progressive unlock flows.
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** UNVERIFIED — no evidence RLS enforces auth.uid() ownership on vc.actor_onboarding_steps writes
- **Why it matters:** Orphaned exported write functions are a governance hazard. Future PRs may call this function assuming it is safe because it passed prior reviews. The missing ownership check will not be visible at the call site.
- **Recommended mitigation:** Either (a) delete the function if onboarding step marking is handled by DB triggers or RPCs, or (b) add an ownership verification step — derive actorId server-side via RPC rather than accepting it as a client parameter. Add a code comment warning that this function requires RLS enforcement to be safe.
- **Rationale:** Exported functions with no current callers but active write capability represent deferred security debt. The risk window is every future PR that touches onboarding.
- **Follow-up command:** DB (verify RLS on vc.actor_onboarding_steps), SPIDER-MAN (add regression test asserting no caller can forge step completion), ELEKTRA
- **Provenance:** SOURCE_VERIFIED
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Access Control

---

### VENOM SECURITY FINDING

- **Finding ID:** VEN-ONBOARDING-003
- **Location:** `apps/VCSM/src/features/onboarding/dal/profileCompletion.dal.js:4-17`
- **Application Scope:** VCSM
- **Platform Surface:** Supabase Table (vc.actors)
- **Trust Boundary:** Authenticated PWA session
- **Boundary Violated:** profileId and vportId are read from the vc.actors row and then used as direct query keys against the profiles tables, with no re-verification that those linked IDs belong to the calling session
- **Contract Violated:** VCSM architecture contract — profileId and vportId must never be exposed through public hooks or controller surfaces; ownership verified through actor_owners only
- **Current behavior:** `readActorRowDAL(actorId)` reads `profile_id` and `vport_id` from `vc.actors`. These values are returned to the controller (`onboarding.controller.js:99-113`) and then used directly as query parameters to `readProfileCompletionFieldsDAL(actor.profileId)` and `readVportCompletionFieldsDAL(actor.vportId)`. The `mapActorRow` function in `onboarding.model.js:36-43` surfaces `profileId` and `vportId` into the controller's working data.
- **Risk:** The VCSM architecture contract explicitly bans exposing `profileId` and `vportId` through public surfaces. While this particular use is internal (controller-to-DAL), the pattern establishes a precedent for passing profileId/vportId through layers. More concretely: if an attacker could influence the actorId passed to `getOnboardingCardsController`, they would receive a model containing profileId and vportId for the target actor, which the controller currently uses for DB lookups but which could leak in error states or future expansions of the response shape.
- **Severity:** MEDIUM
- **Exploitability:** LOW (currently contained within the controller — not surfaced to the UI response)
- **Attack Preconditions:** Attacker must supply a foreign actorId to getOnboardingCardsController. The profileId/vportId are not currently returned in the API response but exist in intermediate state.
- **Blast Radius:** Architecture contract violation creates a drift vector. If the controller response shape is ever extended to include raw identity fields, this becomes a direct identity leak.
- **Identity Leak Type:** Indirect — profileId/vportId transiently held in controller layer
- **Cache Trust Type:** None
- **RLS Dependency:** ASSUMED — Supabase RLS on profiles table is assumed to restrict cross-actor reads
- **Why it matters:** The architecture contract was written specifically to prevent profileId/vportId from traveling through the stack. This pattern violates the contract's intent even if not currently exploitable.
- **Recommended mitigation:** Refactor `readActorRowDAL` to not return `profile_id` and `vport_id` directly. Instead, use a single DB query or RPC that joins actors to profiles/vport profiles and returns the completion fields in one hop, keeping the raw IDs server-side.
- **Rationale:** Eliminates the profileId/vportId from the JS layer entirely, consistent with the architecture contract.
- **Follow-up command:** ELEKTRA (trace profileId/vportId flow), DB (verify profiles RLS)
- **Provenance:** SOURCE_VERIFIED
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Identity and Access Management

---

### VENOM SECURITY FINDING

- **Finding ID:** VEN-ONBOARDING-004
- **Location:** `apps/VCSM/src/features/onboarding/dal/vibeInvites.dal.js:70-77`
- **Application Scope:** VCSM
- **Platform Surface:** PWA (dev-only console.log)
- **Trust Boundary:** Dev environment only
- **Boundary Violated:** Soft — debug probe present in production-eligible code path
- **Contract Violated:** VCSM debug logging rules — no console.log in production code; debug output must render on screen and be dev-only
- **Current behavior:** `readQualifyingVibeInviteCountDAL` contains a `console.log` guarded by `import.meta.env.DEV`. The log emits `senderActorId`, `count`, and `error.message` to the browser console. A second DEV-guarded log exists in `useOnboardingCards.js:32-37` emitting `actorId` and full card progress state.
- **Risk:** The `import.meta.env.DEV` guard prevents production emission, but: (1) The log in `vibeInvites.dal.js` violates the project's debug logging contract which requires debug output to render on-screen in dev, not via console.log. (2) The comment "DEV PROBE — remove after invite tracking confirmed working" indicates this was meant to be temporary and has not been cleaned up. (3) Both logs emit `actorId` which is a sensitive identity field.
- **Severity:** LOW
- **Exploitability:** LOW (dev-only guard present; not exploitable in production)
- **Attack Preconditions:** Developer must have browser console open in dev environment. Not a production risk.
- **Blast Radius:** Minimal — dev environment only. Governance/hygiene issue.
- **Identity Leak Type:** actorId logged to console in dev builds
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Stale debug probes with actorId in the log payload violate the project debug contract and accumulate tech debt. The comment on both probes acknowledges they should be removed.
- **Recommended mitigation:** Remove both DEV PROBE console.log blocks. If invite tracking observability is still needed, implement per the debugger architecture pattern (zNOTFORPRODUCTION/debuggers/).
- **Rationale:** Project rules explicitly ban console.log; debug output must render on screen in dev-only panels. These probes also carry a self-described removal instruction.
- **Follow-up command:** SPIDER-MAN (lint rule to block console.log in dal/ layer)
- **Provenance:** SOURCE_VERIFIED
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Security Operations

---

### VENOM SECURITY FINDING

- **Finding ID:** VEN-ONBOARDING-005
- **Location:** `apps/VCSM/src/features/onboarding/controller/onboarding.controller.helpers.js:68-81`
- **Application Scope:** VCSM
- **Platform Surface:** PWA (production console.error)
- **Trust Boundary:** All environments including production
- **Boundary Violated:** Internal error detail (actorId, Supabase error code, error details, hint) emitted to browser console with no production guard
- **Contract Violated:** VCSM debug logging rules — no console.log/error in production paths
- **Current behavior:** `logOnboardingStepFailure` calls `console.error` unconditionally with `actorId`, `error.message`, `error.code`, `error.details`, and `error.hint`. This function is called by the `loadStep` wrapper which wraps every DAL call in the onboarding cards controller. In production, any onboarding DAL failure emits the full Supabase error payload — including column names and constraint details — to the browser console.
- **Risk:** Browser console is readable by any browser extension, XSS payload, or anyone with DevTools open on a shared/public device. Supabase error details and hints can expose schema information (table names, column names, constraint names) that assist reconnaissance. actorId emission in production also violates identity hygiene.
- **Severity:** MEDIUM
- **Exploitability:** LOW (requires physical/extension access to the user's browser; not remotely exploitable)
- **Attack Preconditions:** Attacker needs access to victim's browser console (XSS, malicious extension, physical access, or shared device).
- **Blast Radius:** Schema reconnaissance aid + actorId exposure in all production error paths for the onboarding cards load flow.
- **Identity Leak Type:** actorId + Supabase schema details in production console
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Supabase error detail payloads routinely include constraint names, column names, and query hints. Combined with actorId, this is meaningful signal for an attacker building a targeted attack.
- **Recommended mitigation:** Wrap `logOnboardingStepFailure` with `if (import.meta.env.DEV)` guard. In production, log only a sanitized message without actorId or raw Supabase error fields. Mirror pattern applied in other controllers this sprint.
- **Rationale:** Defense in depth — error details should never leave the server boundary. Client-side error logging should be opaque in production.
- **Follow-up command:** ELEKTRA (sweep all controller error loggers for production guards)
- **Provenance:** SOURCE_VERIFIED
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Security Operations

---

### VENOM SECURITY FINDING

- **Finding ID:** VEN-ONBOARDING-006
- **Location:** `apps/VCSM/src/features/onboarding/controller/onboarding.controller.js` (entire file — no session verification)
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Client-side actorId from identity hook
- **Boundary Violated:** No Supabase session verification before executing 7 parallel DAL calls with the supplied actorId
- **Contract Violated:** VCSM architecture contract — session must be verified before identity-scoped data access
- **Current behavior:** `getOnboardingCardsController({ actorId })` accepts actorId as a plain parameter. It performs a null check (`if (!actorId)`) but does not verify that the active Supabase auth session corresponds to the supplied actorId. The controller then fans out to 7 parallel DAL reads and up to 2 additional reads, all scoped to that actorId. The actorId originates from `useIdentity()` which derives it from client-side identity state.
- **Risk:** If the client-side identity state can be manipulated (e.g., via a React state race, session confusion, or future identity switching logic), the controller will happily execute all reads against the attacker-controlled actorId. Combined with VEN-ONBOARDING-001, this creates a full read+write path for cross-actor data access. For reads specifically: an attacker could view another actor's onboarding completion state, selected vibe tags, invite list (including metadata and invite codes), and profile completion status.
- **Severity:** MEDIUM
- **Exploitability:** LOW (requires client-side identity state manipulation; not directly exploitable via normal API calls — depends on RLS for server-side enforcement)
- **Attack Preconditions:** Client-side identity state must be manipulable, or RLS must be absent. In a correctly configured Supabase deployment, RLS provides the backstop.
- **Blast Radius:** All onboarding data for any actor (read path). Combined with VEN-ONBOARDING-001, includes write path for vibe_actor_tags.
- **Identity Leak Type:** Cross-actor data access via unverified actorId parameter
- **Cache Trust Type:** None
- **RLS Dependency:** ASSUMED — this pattern relies entirely on RLS being correctly configured for all 8 tables touched by this controller. No source-level verification of RLS exists for any of them.
- **Why it matters:** The controller is the trust boundary for this feature. Accepting actorId as a client parameter without server-side binding to the auth session makes the controller's security entirely dependent on RLS correctness — which is unverified.
- **Recommended mitigation:** Add a session verification step at the top of the controller: fetch `supabase.auth.getUser()`, derive the authenticated actor from `user.id`, and compare against the supplied actorId. Reject mismatches before any DAL call is made. Alternatively, restructure all DAL calls to derive actor from auth session server-side.
- **Rationale:** The controller should not trust client-supplied actorId without verification. Defense in depth requires validation at the controller boundary, not just at the DB layer.
- **Follow-up command:** DB (audit RLS policies for all 8 tables), ELEKTRA
- **Provenance:** SOURCE_VERIFIED
- **CISSP Domain:**
  - Primary: Access Control
  - Secondary: Identity and Access Management, Software Development Security

---

## 8. Source Verification Summary

| File | Read | Key Finding |
|---|---|---|
| dal/onboardingSteps.dal.js | YES | markActorOnboardingStepCompletedDAL has no ownership check; actorId is caller-supplied; no callers found in feature |
| dal/vibeTags.dal.js | YES | replaceSelectedVibeTagsDAL writes with caller-supplied actorId; no ownership verification |
| dal/vibeInvites.dal.js | YES | DEV PROBE console.log with actorId (VEN-ONBOARDING-004) |
| dal/profileCompletion.dal.js | YES | profileId and vportId surfaced to controller layer (architecture contract violation) |
| controller/onboarding.controller.js | YES | No session verification; 7 parallel DAL calls on client-supplied actorId |
| controller/onboarding.controller.helpers.js | YES | Production console.error emitting actorId + Supabase error details (VEN-ONBOARDING-005) |
| controller/vibeTagsOnboarding.controller.js | YES | saveVibeTagsOnboardingController passes actorId directly to replaceSelectedVibeTagsDAL without ownership check |
| hooks/useOnboardingCards.js | YES | DEV-guarded console.log with actorId (VEN-ONBOARDING-004); actorId sourced from useIdentity() |
| hooks/useOnboardingVibeTags.js | YES | actorId from useIdentity(); save path flows to replaceSelectedVibeTagsDAL |
| model/onboarding.model.js | YES | mapActorRow surfaces profileId + vportId (VEN-ONBOARDING-003) |
| adapters/onboarding.adapter.js | YES | Clean — exports only screens, no internal leakage |
| screens/OnboardingCardsView.jsx | YES | Clean — reads identity from useIdentity(); no direct DAL access |
| screens/CitizenVibesScreen.jsx | YES | Clean — write path goes through hook and controller |

### Dead Write Surface

`markActorOnboardingStepCompletedDAL` — exported, scanner-detected, but NO callers found in:
- controller/onboarding.controller.js
- controller/vibeTagsOnboarding.controller.js
- hooks/useOnboardingCards.js
- hooks/useOnboardingVibeTags.js
- screens/

This is a ghost write surface. See VEN-ONBOARDING-002.

---

## 9. Confidence Summary

| Finding | Provenance | Source Evidence |
|---|---|---|
| VEN-ONBOARDING-001 | SOURCE_VERIFIED | vibeTags.dal.js:47-77, vibeTagsOnboarding.controller.js:37-55, useOnboardingVibeTags.js:75-105 |
| VEN-ONBOARDING-002 | SOURCE_VERIFIED | onboardingSteps.dal.js:30-52; zero callers confirmed via full feature source sweep |
| VEN-ONBOARDING-003 | SOURCE_VERIFIED | profileCompletion.dal.js:10-11, onboarding.model.js:36-43, onboarding.controller.js:99-113 |
| VEN-ONBOARDING-004 | SOURCE_VERIFIED | vibeInvites.dal.js:70-77, useOnboardingCards.js:32-37 |
| VEN-ONBOARDING-005 | SOURCE_VERIFIED | onboarding.controller.helpers.js:68-81 (no DEV guard on console.error) |
| VEN-ONBOARDING-006 | SOURCE_VERIFIED | onboarding.controller.js:38-45 (null check only, no session verification) |

**Scanner gap note:** The scanner assigned LOW confidence to all 3 security paths due to missing route resolution. Source inspection recovered full coverage and produced 6 findings. All findings are source-verified.

---

## 10. THOR Impact

| Finding | Severity | THOR Blocker | Rationale |
|---|---|---|---|
| VEN-ONBOARDING-001 | HIGH | YES | Cross-actor write to vibe_actor_tags with void-all semantics; ownership unverified; RLS unverified |
| VEN-ONBOARDING-002 | HIGH | YES | Dead exported write surface with no ownership guard; onboarding step forgery risk |
| VEN-ONBOARDING-003 | MEDIUM | NO (but pre-release required) | Architecture contract violation; profileId/vportId in controller layer |
| VEN-ONBOARDING-004 | LOW | NO | Dev-only guard present; hygiene issue only |
| VEN-ONBOARDING-005 | MEDIUM | NO (recommended fix before release) | Production console.error with actorId + schema details |
| VEN-ONBOARDING-006 | MEDIUM | NO (recommended fix before release) | No session verification in controller; entirely RLS-dependent |

**THOR Release Status: BLOCKED** pending resolution of VEN-ONBOARDING-001 and VEN-ONBOARDING-002.

---

## 11. Required Follow-Up Commands

| Command | Purpose | Triggered By |
|---|---|---|
| DB | Verify RLS policy on vc.vibe_actor_tags — confirm auth.uid() ownership enforcement | VEN-ONBOARDING-001 |
| DB | Verify RLS policy on vc.actor_onboarding_steps — confirm auth.uid() ownership enforcement | VEN-ONBOARDING-002 |
| DB | Audit RLS on all 8 tables read by getOnboardingCardsController | VEN-ONBOARDING-006 |
| ELEKTRA | Source-to-sink trace for replaceSelectedVibeTagsDAL — actorId injection chain | VEN-ONBOARDING-001 |
| ELEKTRA | profileId/vportId flow through model → controller layer | VEN-ONBOARDING-003 |
| ELEKTRA | Sweep all controller error loggers for production console.error without DEV guard | VEN-ONBOARDING-005 |
| Carnage | RPC migration for replaceSelectedVibeTagsDAL — derive actorId from auth session server-side | VEN-ONBOARDING-001 |
| Carnage | RPC migration or deletion for markActorOnboardingStepCompletedDAL | VEN-ONBOARDING-002 |
| SPIDER-MAN | Regression test: cross-actor vibe tag write attempt must fail | VEN-ONBOARDING-001 |
| SPIDER-MAN | Regression test: step completion forgery must fail | VEN-ONBOARDING-002 |
| SPIDER-MAN | Lint rule to block console.log/error in dal/ layer without DEV guard | VEN-ONBOARDING-004 |
| Logan | Write full BEHAVIOR.md for onboarding (§5 Security Rules + §9 Must Never Happen) | MISSING_BEHAVIOR_CONTRACT |

---

## 12. Mitigation Plan

| Finding ID | Severity | Action | Owner Command | Priority |
|---|---|---|---|---|
| VEN-ONBOARDING-001 | HIGH | Add RLS ownership policy on vc.vibe_actor_tags OR migrate replaceSelectedVibeTagsDAL to RPC that derives actor from auth.uid() | DB / Carnage | P0 — THOR blocker |
| VEN-ONBOARDING-002 | HIGH | Delete markActorOnboardingStepCompletedDAL if unused, OR add RLS + RPC wrapper. Add dead-code audit to SPIDER-MAN coverage. | DB / Carnage / SPIDER-MAN | P0 — THOR blocker |
| VEN-ONBOARDING-006 | MEDIUM | Add supabase.auth.getUser() session verification at top of getOnboardingCardsController before any DAL call | ELEKTRA | P1 — pre-release |
| VEN-ONBOARDING-005 | MEDIUM | Wrap logOnboardingStepFailure in import.meta.env.DEV guard; strip actorId and raw Supabase error fields from production logs | ELEKTRA | P1 — pre-release |
| VEN-ONBOARDING-003 | MEDIUM | Refactor readActorRowDAL to not surface profileId/vportId; use joined query or RPC to fetch completion fields without exposing raw IDs | ELEKTRA / DB | P2 — architecture compliance |
| VEN-ONBOARDING-004 | LOW | Remove both DEV PROBE console.log blocks from vibeInvites.dal.js and useOnboardingCards.js | Inline | P3 — hygiene |
| MISSING_BEHAVIOR_CONTRACT | HIGH | Write full BEHAVIOR.md §5 + §9 for onboarding feature | Logan | P1 — governance |

---

## 13. CISSP Domain Coverage Summary

| CISSP Domain | Findings | Finding IDs |
|---|---|---|
| Access Control | 3 | VEN-ONBOARDING-001, VEN-ONBOARDING-002, VEN-ONBOARDING-006 |
| Software Development Security | 5 | VEN-ONBOARDING-001, VEN-ONBOARDING-002, VEN-ONBOARDING-003, VEN-ONBOARDING-004, VEN-ONBOARDING-005 |
| Identity and Access Management | 3 | VEN-ONBOARDING-001, VEN-ONBOARDING-003, VEN-ONBOARDING-006 |
| Security Operations | 2 | VEN-ONBOARDING-004, VEN-ONBOARDING-005 |

**Total Findings: 6**
- CRITICAL: 0
- HIGH: 2 (VEN-ONBOARDING-001, VEN-ONBOARDING-002)
- MEDIUM: 3 (VEN-ONBOARDING-003, VEN-ONBOARDING-005, VEN-ONBOARDING-006)
- LOW: 1 (VEN-ONBOARDING-004)

**Additional Governance Issue:** MISSING_BEHAVIOR_CONTRACT (BEHAVIOR.md is a placeholder — no §5 Security Rules, no §9 Must Never Happen)

---

*VENOM V2 Review Complete — 2026-06-04*
