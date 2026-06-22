---
name: vcsm.actors.security.venom-v2
description: VENOM V2 Security Review — actors feature
metadata:
  type: security
  owner: VENOM
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# VENOM V2 SECURITY REVIEW — actors

**Feature:** actors
**Application Scope:** VCSM
**Review Date:** 2026-06-04
**Reviewer:** VENOM (automated + source-verified)
**Scanner Version:** 1.1.0

---

## 1. OUTPUT METADATA

| Field | Value |
|---|---|
| Feature | actors |
| App | VCSM |
| Review Type | VENOM V2 Full |
| Date | 2026-06-04 |
| Time | 19:48 UTC |
| Scanner Version | 1.1.0 |
| Overall Preflight | PASS |
| Source Directory | apps/VCSM/src/features/actors/ |
| Source Files Inspected | 4 |
| Total Findings | 4 |
| CRITICAL | 0 |
| HIGH | 2 |
| MEDIUM | 2 |
| LOW | 0 |
| THOR Release Blocker | YES — VEN-ACTORS-001 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/actors/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_actors-security-review.md |

---

## 2. SCANNER PREFLIGHT

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                 | Generated At                | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map   | 2026-06-04T19:48:25.152Z    | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map             | 2026-06-04T19:48:25.152Z    | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map   | 2026-06-04T19:48:25.152Z    | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map   | 2026-06-04T19:48:25.152Z    | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map | 2026-06-04T19:48:25.152Z    | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map | 2026-06-04T19:48:25.152Z    | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map   | 2026-06-04T19:48:25.152Z    | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map  | 2026-06-04T19:48:25.152Z    | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. SCANNER INPUTS

| Map | Surfaces Found | Notes |
|---|---|---|
| write-surface-map | 1 | search_actor_directory RPC (HIGH confidence) |
| rpc-map | 1 | search_actor_directory in identity schema |
| edge-function-map | 0 | No edge functions for this feature |
| security-path-map | 2 | Both LOW confidence — no confirmed route execution path |
| write-execution-map | 1 | LOW confidence — no confirmed route chain |
| rpc-execution-map | 1 | LOW confidence — no confirmed route chain |

**Scanner note:** All security paths and execution paths carry LOW confidence because the actors module has no UI routes of its own. The module is API-only — it is consumed by explore, chat, upload, settings/privacy, and vport/team features. Route confirmation requires tracing through those callers, which is done in Source Verification below.

---

## 4. SECURITY SURFACE INVENTORY

| Surface ID | Type | Schema | RPC / Table | DAL File | Callers |
|---|---|---|---|---|---|
| SRF-001 | RPC Read | identity | search_actor_directory | searchActors.dal.js | searchActors.controller.js → actors.adapter.js → (explore, settings/privacy, vport/team) |
| SRF-002 | RPC Read (duplicate) | identity | search_actor_directory | chat/setup.js | setupVcsmChatEngine → configureChatEngine |
| SRF-003 | RPC Read (duplicate) | identity | search_actor_directory | explore/dal/search.dal.js | searchDal → explore controllers |
| SRF-004 | RPC Read (duplicate) | identity | search_actor_directory | upload/dal/searchMentionSuggestions.dal.js | mention suggestion inline composers |

Edge Functions: NONE

---

## 5. SCANNER SIGNALS

| Signal | Type | Confidence | Disposition |
|---|---|---|---|
| search_actor_directory called from searchActors.dal.js | WRITE_SURFACE / RPC | HIGH | SOURCE_VERIFIED — see SRF-001 |
| No route execution path confirmed | COVERAGE_GAP | LOW | EXPECTED — module is API-only; callers are external |
| 3 additional out-of-module callers detected in source search | NOT IN SCANNER | N/A | ARCHITECTURE_FRAGMENTATION — see VEN-ACTORS-003 |
| p_filter forced 'public' when viewerActorId null | AUTH_SIGNAL | HIGH | Partially mitigated — see VEN-ACTORS-001 |

---

## 6. BEHAVIOR CONTRACT STATUS

| Section | Status | Details |
|---|---|---|
| BEHAVIOR.md present | YES | File exists at ZZnotforproduction/APPS/VCSM/features/actors/BEHAVIOR.md |
| BEHAVIOR.md quality | PLACEHOLDER | File contains only stub text — no §5 Security Rules, no §9 Must Never Happen |
| §5 Security Rules | NONE | 0 BEH IDs found |
| §9 Must Never Happen | NONE | 0 BEH IDs found |

**Finding:** BEHAVIOR.md is a placeholder with no actionable security contract. Zero §5 Security Rules and zero §9 Must Never Happen invariants are defined. This is recorded as a HIGH finding (VEN-ACTORS-004) because no contract exists to verify against, meaning security expectations are undocumented and unchecked across all consumers.

---

## 7. TRUST BOUNDARY FINDINGS

---

### VEN-ACTORS-001

```
VENOM SECURITY FINDING
- Finding ID: VEN-ACTORS-001
- Location: apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js:54-58
- Application Scope: VCSM
- Platform Surface: PWA — settings/privacy feature
- Trust Boundary: Authenticated actor performing search in the Blocks UI
- Boundary Violated: Caller identity (viewerActorId) is never injected into the actor search call path from the Blocks controller
- Contract Violated: Platform identity contract — actor-scoped operations must pass the authenticated caller's actorId to the search surface
- Current behavior: ctrlSearchActors({ query }) calls searchActorsAdapter({ query, limit: 12 }) — no viewerActorId is passed. The controller has access to callerActorId in other functions (ctrlBlockActor, ctrlUnblockActor) but does not thread it to the search call. The DAL defaults viewerActorId = null, which forces p_filter = 'public', which means private-profile actors are excluded from Blocks UI search results.
- Risk: Authenticated users searching for actors to block cannot find private-profile actors — they are silently excluded. An attacker with a private profile can harass from a private account and the victim cannot block them by search. The filter downgrade is a functional privacy gap: the visibility boundary between public and private actors is applied inconsistently — it only applies in one specific callsite (ctrlSearchActors) while all other callsites (explore, chat, vport team) pass viewerActorId.
- Severity: HIGH
- Exploitability: HIGH
- Attack Preconditions: User must have a private actor profile. Victim must use the Blocks search UI to find and block them.
- Blast Radius: All authenticated users using the privacy/blocks search feature. Platform-wide privacy contract inconsistency.
- Identity Leak Type: None — the issue is information withholding, not leakage
- Cache Trust Type: None
- RLS Dependency: ASSUMED — RPC enforces public filter internally when p_filter = 'public'; side effect is visibility suppression of private actors
- Why it matters: A harassment/safety feature (block) is undermined by a misconfigured search surface. Victims cannot block actors they cannot find. This is a safety gap, not just a UX bug.
- Recommended mitigation: Thread viewerActorId into ctrlSearchActors. The caller (useActorLookup hook) has identity available via useIdentity(). Pass it through: ctrlSearchActors({ query, viewerActorId: actorId }) from the hook, propagate to adapter and DAL.
- Rationale: The DAL already has the correct p_filter logic — it sets 'all' when viewerActorId is present. The fix is purely wiring, no DB changes needed.
- Follow-up command: SPIDER-MAN (add regression test: ctrlSearchActors with authenticated viewer returns private profiles; without viewer returns only public)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control (AC)
  - Secondary: Software Development Security (SDS)
```

---

### VEN-ACTORS-002

```
VENOM SECURITY FINDING
- Finding ID: VEN-ACTORS-002
- Location: apps/VCSM/src/features/upload/dal/searchMentionSuggestions.dal.js:19 and apps/VCSM/src/features/chat/setup.js:44-49
- Application Scope: VCSM
- Platform Surface: PWA — mention composer (upload), chat participant search (chat engine)
- Trust Boundary: Authenticated actor composing a post or starting a chat
- Boundary Violated: p_filter is hardcoded to 'all' with no visibility guard when viewerActorId is null
- Contract Violated: Unauthenticated access gating — the actors module contract (searchActorsDAL) enforces p_filter = 'public' for null viewers; these duplicate callsites bypass that logic entirely
- Current behavior: searchMentionSuggestions (upload) always passes p_filter: 'all' regardless of viewerActorId value. The chat/setup.js searchActors function similarly hardcodes p_filter: 'all'. If viewerActorId is null (unauthenticated or race condition before identity resolves), the RPC receives p_filter = 'all' with a null viewer. The RPC's SECURITY DEFINER behavior and internal filtering logic determine what is actually returned — the app layer provides no fallback guard.
- Risk: If the DB function does not independently reject all-filter requests from null viewers, private-profile actors could appear in mention suggestions or chat search for unauthenticated users (guest visitors, race-condition windows during session load). The canonical actors DAL correctly guards this; these duplicate callsites do not.
- Severity: HIGH
- Exploitability: MEDIUM — requires either unauthenticated access or a race condition during session hydration; both are realistic in a PWA
- Attack Preconditions: Unauthenticated request or identity hydration race — valid in PWA environments where JS executes before auth resolves
- Blast Radius: Any mention suggestion or chat actor search that fires before identity is confirmed. Potentially exposes private profiles to unauthenticated or pre-auth contexts.
- Identity Leak Type: Potential private profile enumeration via mention/chat search
- Cache Trust Type: None
- RLS Dependency: ASSUMED — relies entirely on RPC internal logic to reject null-viewer all-filter requests; no app-layer guard
- Why it matters: Private actors (is_private = true) opted out of public discovery. These callsites may silently override that preference in edge cases. Consistency with the canonical actors module guard is required.
- Recommended mitigation: In searchMentionSuggestions and chat/setup.js searchActors: apply the same guard as the canonical DAL — if viewerActorId is null, pass p_filter: 'public'. Alternatively, consolidate all three callsites to use searchActorsDAL from the actors module instead of duplicating the RPC call.
- Rationale: Defense-in-depth — do not rely solely on DB-side behavior when an app-layer guard is trivial and the canonical implementation already has it.
- Follow-up command: DB (verify search_actor_directory handles null viewer + 'all' filter safely at DB level); SPIDER-MAN (add test: mention search with null viewerActorId does not return private profiles)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control (AC)
  - Secondary: Software Development Security (SDS)
```

---

### VEN-ACTORS-003

```
VENOM SECURITY FINDING
- Finding ID: VEN-ACTORS-003
- Location: apps/VCSM/src/features/upload/dal/searchMentionSuggestions.dal.js, apps/VCSM/src/features/chat/setup.js, apps/VCSM/src/features/explore/dal/search.dal.js
- Application Scope: VCSM
- Platform Surface: PWA — multiple features (upload, chat, explore) calling search_actor_directory independently
- Trust Boundary: Any authenticated or unauthenticated surface that triggers actor search
- Boundary Violated: Security contract fragmentation — 3 additional callsites bypass the canonical security gateway (actors module) and call the RPC directly with independent parameter logic
- Contract Violated: Adapter boundary contract — all cross-feature access must go through actors.adapter.js; direct RPC calls from other features' DAL layers violate the module isolation contract
- Current behavior: The actors module defines a single authoritative callsite (searchActors.dal.js) that applies correct null-viewer gating, strip-prefix normalization, and filter selection. Three other features (chat/setup.js, explore/dal/search.dal.js, upload/dal/searchMentionSuggestions.dal.js) duplicate the RPC call with their own independent logic. This creates 4 separate code paths where security policy changes must be applied in 4 places to be effective.
- Risk: Future security patches to the canonical actors DAL (e.g., adding rate limiting, adding void-actor filtering, changing null-viewer behavior) will not automatically propagate to the 3 duplicate callsites. One-fix-misses-three is a systematic patch gap. The explore/dal/search.dal.js callsite notably does NOT apply the canonical null-viewer p_filter guard at all.
- Severity: MEDIUM
- Exploitability: LOW — not directly exploitable today; risk is latent in future change velocity
- Attack Preconditions: Future security patch applied to canonical DAL only; duplicate callsites retain old behavior
- Blast Radius: Any security rule change to actor search would require coordinated updates across 4 files; risk of inconsistency grows with each missed update
- Identity Leak Type: Systematic policy drift risk
- Cache Trust Type: None
- RLS Dependency: ASSUMED — all callsites trust RPC enforcement
- Why it matters: Fragmented security surfaces are a governance failure. The module boundary contract exists to prevent this exact pattern. All 3 duplicate callsites should consume actors.adapter.js or at minimum mirror the same parameter guards.
- Recommended mitigation: Consolidate chat/setup.js, explore/dal/search.dal.js, and upload/dal/searchMentionSuggestions.dal.js to call through searchActorsAdapter (or a new overloaded version that accepts filter and offset). Each callsite has slightly different needs (offset support in explore, shape mapping in chat) so a thin wrapper over the canonical DAL with those options is the cleanest path.
- Rationale: Single security perimeter for a single RPC. Any future audit, patch, or RLS change has one place to apply.
- Follow-up command: IRONMAN (establish ownership and consolidation ticket); DB (document search_actor_directory security contract so duplicate callers can be safely migrated)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security (SDS)
  - Secondary: Access Control (AC)
```

---

### VEN-ACTORS-004

```
VENOM SECURITY FINDING
- Finding ID: VEN-ACTORS-004
- Location: ZZnotforproduction/APPS/VCSM/features/actors/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Governance — documentation contract
- Trust Boundary: All consumers of the actors module
- Boundary Violated: No security contract exists to govern what the actors module must and must not expose
- Contract Violated: BEHAVIOR.md contract requirement — §5 Security Rules and §9 Must Never Happen are mandatory
- Current behavior: BEHAVIOR.md is a placeholder stub. Zero §5 Security Rules are defined. Zero §9 Must Never Happen invariants are defined. The only content is "Status: PLACEHOLDER — Behavior contract pending source review."
- Risk: Consumers have no authoritative reference for security expectations (e.g., "private actors must never appear to null viewers", "void actors must never appear in search", "viewerActorId must be the authenticated actor — never client-supplied without verification"). Without a contract, regressions cannot be detected, tests cannot be written against invariants, and future engineers cannot know what is intentional vs accidental.
- Severity: MEDIUM
- Exploitability: LOW — no direct exploit vector; risk is governance and regression coverage
- Attack Preconditions: Future code change that violates an unwritten invariant
- Blast Radius: All consumers of the actors module (explore, chat, upload, settings/privacy, vport/team) — 5 active consumers with no shared contract
- Identity Leak Type: None — governance gap, not runtime leak
- Cache Trust Type: None
- RLS Dependency: NONE — governance issue
- Why it matters: Security contracts drive test coverage, audit scope, and future engineer expectations. A PLACEHOLDER contract is equivalent to no contract. The findings in this review (VEN-ACTORS-001, -002) would have been detectable earlier if §9 had "private actors must never appear to unauthenticated callers" as an invariant.
- Recommended mitigation: LOGAN must write the full BEHAVIOR.md contract for actors, including at minimum: §5 defining the null-viewer gating rule, the void-actor exclusion rule, and the viewerActorId origin rule; §9 defining "private actors must never appear to null-viewer callers" and "void actors must never appear in search results."
- Rationale: Governance contract is the upstream fix for all runtime findings. Write the contract first; test coverage follows.
- Follow-up command: LOGAN (write BEHAVIOR.md); SPIDER-MAN (write unit tests against the contract once written)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security (SDS)
  - Secondary: Security Assessment and Testing (SAT)
```

---

## 8. SOURCE VERIFICATION SUMMARY

| File | Read | Key Finding | Status |
|---|---|---|---|
| apps/VCSM/src/features/actors/dal/searchActors.dal.js | YES | Null-viewer guard present (p_filter = 'public' when viewerActorId null). Canonical implementation is correct. | VERIFIED_SAFE (canonical) |
| apps/VCSM/src/features/actors/controllers/searchActors.controller.js | YES | Passes viewerActorId through cleanly. No auth logic here — delegates to DAL. | VERIFIED_SAFE |
| apps/VCSM/src/features/actors/adapters/actors.adapter.js | YES | Thin wrapper. No security concern. | VERIFIED_SAFE |
| apps/VCSM/src/features/actors/model/searchActors.model.js | YES | Pure mapping. No auth. Filters null rows (row.actor_id required). | VERIFIED_SAFE |
| apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js | YES | ctrlSearchActors does not pass viewerActorId — FINDING VEN-ACTORS-001 | FINDING |
| apps/VCSM/src/features/settings/privacy/hooks/useActorLookup.js | YES | Has actorId from useIdentity but does not pass to ctrlSearchActors. Confirms VEN-ACTORS-001. | FINDING |
| apps/VCSM/src/features/chat/setup.js | YES | Hardcodes p_filter: 'all'; uses Zustand store for viewerActorId (may resolve null during hydration race) — FINDING VEN-ACTORS-002 | FINDING |
| apps/VCSM/src/features/upload/dal/searchMentionSuggestions.dal.js | YES | Hardcodes p_filter: 'all'; no null-viewer guard — FINDING VEN-ACTORS-002 | FINDING |
| apps/VCSM/src/features/explore/dal/search.dal.js | YES | Duplicate RPC call, no null-viewer guard for p_filter — FINDING VEN-ACTORS-003 | FINDING |
| apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/controller/vportTeamAccess.controller.js | YES | Passes viewerActorId correctly — VERIFIED_SAFE | VERIFIED_SAFE |

**Additional context from legacy documentation:**
- vcsm.explore.search-pipeline.md notes "ISSUE 5 — VOID ACTORS IN search_actor_directory — The RPC may not filter is_void actors." No DB-level confirmation available in source files. Void-actor filtering is unverified at RPC level. This is a DB-scope concern — referred to DB command, not classified as a separate VENOM finding without source evidence of the DB function body.
- vcsm.dal.explore.md confirms all console.log/console.warn removed from search.dal.js as of 2026-05-11. Verified in current source — no console calls found in actors feature source files.

---

## 9. CONFIDENCE SUMMARY

| Finding | Confidence | Basis |
|---|---|---|
| VEN-ACTORS-001 | HIGH | Source-verified: Blocks.controller.js:54-58 confirmed, useActorLookup.js confirmed, DAL logic confirmed |
| VEN-ACTORS-002 | HIGH | Source-verified: upload/dal/searchMentionSuggestions.dal.js:29, chat/setup.js:56 confirmed |
| VEN-ACTORS-003 | HIGH | Source-verified: 3 duplicate callsite files confirmed, each read and inspected |
| VEN-ACTORS-004 | HIGH | Source-verified: BEHAVIOR.md read — stub confirmed, 0 security rules |

Overall review confidence: HIGH. All 4 findings are source-verified with file and line evidence. No findings derived from scanner confidence alone.

---

## 10. THOR IMPACT

| Finding | Severity | THOR Blocker | Rationale |
|---|---|---|---|
| VEN-ACTORS-001 | HIGH | YES | Safety feature (block) is compromised — victim cannot find private harassers via Blocks search. This is a user safety regression. |
| VEN-ACTORS-002 | HIGH | NO | Risk is conditional on null-viewer race condition or unauthenticated request; DB-level enforcement assumed. Requires DB verification before upgrading to blocker. |
| VEN-ACTORS-003 | MEDIUM | NO | Latent risk — no active exploit. Governance cleanup required. |
| VEN-ACTORS-004 | MEDIUM | NO | Documentation gap. Does not block feature release directly. |

**THOR Gate Recommendation:** VEN-ACTORS-001 is a THOR blocker for any release that includes the settings/privacy Blocks feature. Fix is low-effort (pass viewerActorId through one callsite) — should be resolved before release.

---

## 11. REQUIRED FOLLOW-UP COMMANDS

| Command | Finding | Reason |
|---|---|---|
| SPIDER-MAN | VEN-ACTORS-001 | Add regression test: ctrlSearchActors with authenticated viewer returns private profiles; ctrlSearchActors without viewer returns only public profiles |
| SPIDER-MAN | VEN-ACTORS-002 | Add test: searchMentionSuggestions with null viewerActorId does not return is_private=true actors |
| DB | VEN-ACTORS-002 | Verify search_actor_directory DB function behavior when called with p_filter='all' and p_viewer_actor_id=null — confirm whether DB rejects or allows private actor return |
| DB | VEN-ACTORS-003 | Document the security contract of search_actor_directory (parameters, visibility rules, void-actor behavior, private-actor filtering) so duplicate callers can be safely migrated |
| LOGAN | VEN-ACTORS-004 | Write full BEHAVIOR.md contract for actors module — §5 Security Rules, §9 Must Never Happen invariants |
| IRONMAN | VEN-ACTORS-003 | Establish ownership of the actors module; create consolidation ticket to remove 3 duplicate RPC callsites |

---

## 12. MITIGATION PLAN

| Finding ID | Severity | Effort | Owner | Action | Blocks Release |
|---|---|---|---|---|---|
| VEN-ACTORS-001 | HIGH | LOW | Feature dev | Thread viewerActorId from useActorLookup through ctrlSearchActors to searchActorsAdapter. One-line change in hook + one-param change in controller. | YES |
| VEN-ACTORS-002 | HIGH | LOW | Feature dev | Add null-viewer guard in searchMentionSuggestions.dal.js and chat/setup.js: if viewerActorId is null, pass p_filter: 'public'. Mirror canonical DAL logic. | NO — pending DB verification |
| VEN-ACTORS-003 | MEDIUM | MEDIUM | IRONMAN + Feature dev | Consolidate 3 duplicate RPC callsites to use searchActorsAdapter (with offset/filter extension if needed). Long-term: enforce via adapter boundary contract. | NO |
| VEN-ACTORS-004 | MEDIUM | MEDIUM | LOGAN | Write BEHAVIOR.md contract for actors module. Establish §5 and §9 invariants. | NO |

---

## 13. CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---|---|
| Access Control (AC) | VEN-ACTORS-001, VEN-ACTORS-002, VEN-ACTORS-003 | Visibility gating, null-viewer boundary, filter enforcement |
| Software Development Security (SDS) | VEN-ACTORS-001, VEN-ACTORS-002, VEN-ACTORS-003, VEN-ACTORS-004 | Secure coding patterns, adapter boundary enforcement, contract documentation |
| Security Assessment and Testing (SAT) | VEN-ACTORS-004 | Zero test coverage on security invariants; no BEHAVIOR.md contract to test against |
| Identity and Access Management (IAM) | VEN-ACTORS-001 | Actor identity not threaded to search surface in Blocks controller |
| Security Architecture and Engineering (SAE) | VEN-ACTORS-003 | Fragmented RPC callsites undermine security perimeter consistency |

---

*VENOM V2 review complete. 4 findings. 0 CRITICAL, 2 HIGH, 2 MEDIUM, 0 LOW.*
*THOR blocker: VEN-ACTORS-001 (HIGH — Blocks search does not pass viewerActorId, safety feature compromised).*
