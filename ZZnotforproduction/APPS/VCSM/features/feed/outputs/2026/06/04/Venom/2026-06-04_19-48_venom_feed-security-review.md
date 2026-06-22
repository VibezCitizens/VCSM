# VENOM V2 Security Review — feed

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | feed |
| App | VCSM |
| Review Date | 2026-06-04 |
| Review Time | 19:48 |
| Reviewer | VENOM V2 |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/feed/outputs/2026/06/04/Venom/ |
| THOR Release Blocker | NO |
| Findings Summary | 0 CRITICAL, 2 HIGH, 3 MEDIUM, 1 LOW |

---

## 2. Scanner Preflight

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                 | Generated At             | Age  | Freshness | Confidence | Status |
|---------------------|--------------------------|------|-----------|------------|--------|
| write-surface-map   | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map             | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map   | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map   | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map   | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map  | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs

```json
{
  "writeSurfaces": 1,
  "rpcs": 0,
  "securityPaths": 1,
  "writeExecutionPaths": 1,
  "rpcExecutionPaths": 0,
  "edgeFunctions": 0
}
```

Write surface identified:
- `markWelcomeFeedCardSeenDAL` — upsert on `vc.actor_onboarding_steps`
  - File: `apps/VCSM/src/features/feed/dal/feedWelcomeCard.dal.js`
  - Scanner confidence: HIGH

Security path confidence: LOW (write discovered without confirmed route execution path)

---

## 4. Security Surface Inventory

### Write Surfaces
| ID | Table | Operation | File | Layer |
|---|---|---|---|---|
| WS-1 | vc.actor_onboarding_steps | UPSERT | feedWelcomeCard.dal.js | DAL |

### RPCs
None identified by scanner.

### Edge Functions
None identified by scanner.

### Additional Surfaces Discovered During Source Inspection
The following read surfaces were identified from manual source inspection and represent security-relevant data access not captured by the write scanner:

| ID | Table/Schema | Operation | File |
|---|---|---|---|
| RS-1 | vc.posts | SELECT (paginated) | feed.read.posts.dal.js |
| RS-2 | vc.posts | SELECT (actor-scoped) | listActorPostsByActor.dal.js |
| RS-3 | vc.actor_onboarding_steps | SELECT | feedWelcomeCard.dal.js |
| RS-4 | vc.actors | SELECT | feed.read.actorsBundle.dal.js, feed.read.debugPrivacyRows.dal.js |
| RS-5 | vc.actor_privacy_settings | SELECT | feed.read.actorsBundle.dal.js, feed.read.debugPrivacyRows.dal.js |
| RS-6 | vc.actor_follows | SELECT | feed.read.followRows.dal.js, feed.read.debugPrivacyRows.dal.js |
| RS-7 | vc.actor_owners | SELECT | feed.read.debugPrivacyRows.dal.js |
| RS-8 | moderation.actions | SELECT | feed.read.hiddenPosts.dal.js |
| RS-9 | moderation.blocks | SELECT | feed.read.blockRows.dal.js |
| RS-10 | vc.post_media | SELECT | feed.read.media.dal.js |
| RS-11 | vc.post_comments | SELECT (counts) | feed.read.commentCounts.dal.js |
| RS-12 | vc.post_reactions | SELECT | feed.read.reactionCounts.dal.js, feed.read.viewerReactions.dal.js |
| RS-13 | vc.post_rose_gifts | SELECT | feed.read.reactionCounts.dal.js |
| RS-14 | vc.post_mentions | SELECT | feed.mentions.dal.js |
| RS-15 | vport.profiles | SELECT | feed.read.actorsBundle.dal.js |
| RS-16 | profiles (public schema) | SELECT | feed.read.actorsBundle.dal.js, feed.read.viewerContext.dal.js |

---

## 5. Scanner Signals

```
SCANNER SIGNALS
===============
- 1 write surface (HIGH confidence): markWelcomeFeedCardSeenDAL
  Route resolution: UNRESOLVED (LOW confidence path)
  This means the scanner found the write but could not confirm the full route
  from a named route → screen → hook → controller → DAL.
  Source inspection required: CONFIRMED (performed in Step 4).

- 0 RPCs
- 0 Edge Functions

Manual source inspection expanded coverage to 16 additional read surfaces
across 7 schemas/tables not captured by the write scanner.
```

---

## 6. Behavior Contract Status

```
BEHAVIOR CONTRACT STATUS
========================
File: ZZnotforproduction/APPS/VCSM/features/feed/BEHAVIOR.md
Status: PLACEHOLDER

§5 Security Rules:    MISSING (contract is PLACEHOLDER — no §5 section)
§9 Must Never Happen: MISSING (contract is PLACEHOLDER — no §9 section)

BEH IDs extracted:    NONE
```

The BEHAVIOR.md for the feed feature exists but is a PLACEHOLDER stub. It contains no security rules and no invariants to cross-check. This is documented as finding VEN-FEED-001.

---

## 7. Trust Boundary Findings

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-FEED-001
- Location: ZZnotforproduction/APPS/VCSM/features/feed/BEHAVIOR.md:1
- Application Scope: VCSM
- Platform Surface: Feature Contract
- Trust Boundary: Governance — all authenticated callers
- Boundary Violated: Security contract boundary — no §5 Security Rules or §9 Must Never Happen defined
- Contract Violated: VCSM Feature Behavior Contract standard (BEHAVIOR.md must have §5 and §9)
- Current behavior: BEHAVIOR.md is a placeholder stub with status "PLACEHOLDER" and no security rules
- Risk: Security reviews (VENOM, ELEKTRA, BLACKWIDOW) have no authoritative contract
  to verify against. Privacy rules, blocked-actor enforcement, and realm isolation
  guarantees have no formal definition. Future regressions cannot be detected by
  contract cross-check.
- Severity: HIGH
- Exploitability: LOW
- Attack Preconditions: N/A — this is a governance gap, not a direct exploit surface
- Blast Radius: All future audits of this feature lack ground truth; regressions may be
  missed in PR review
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The feed is the primary content surface for all VCSM users. Without a
  formal security contract, privacy enforcement (blocked actors, private accounts,
  realm separation) cannot be systematically verified across sprints.
- Recommended mitigation: Write a complete BEHAVIOR.md with §5 Security Rules and
  §9 Must Never Happen, covering: (1) blocked actor exclusion, (2) private account
  visibility gates, (3) realm isolation, (4) welcome card ownership, (5) debug panel
  DEV-only gate, (6) no raw userId exposure in feed context.
- Rationale: A contract-first feed prevents silent privacy regressions across the
  highest-traffic feature in the platform.
- Follow-up command: SPIDER-MAN (regression tests against the new contract invariants)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Security Assessment and Testing
  - Secondary: Software Development Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-FEED-002
- Location: apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js:136-141
- Application Scope: VCSM
- Platform Surface: PWA — feed pipeline (client-side)
- Trust Boundary: Unauthenticated-adjacent — any user who passes a debugPostId param
- Boundary Violated: Debug output must never reach production builds
- Contract Violated: VCSM debug logging rule (no console.log in production paths)
- Current behavior: Lines 136-141 contain an unconditional console.log("[useFeed][mentions][DBG] debugPostId is on this page", { debugPostId, pagePostIds }) — this fires in every environment (DEV and PROD) when a debugPostId is supplied and that post ID is present in the current page.
- Risk: In production, this logs post IDs (UUIDs) and page post ID arrays to the browser
  console for every feed page load where debugPostId is set. If debugPostId is ever
  wired to a URL param or a persistent config value in production, this becomes an
  information leak exposing internal post ID sets to any user who opens DevTools.
  Even without a visible attack vector today, the console.log violates the no-debug-
  in-prod rule and establishes a pattern that WILL cause a leak if debugPostId is
  ever exposed through a route param or persistent store key.
- Severity: MEDIUM
- Exploitability: LOW (debugPostId has no current production activation path visible
  in source; risk escalates if one is added)
- Attack Preconditions: debugPostId must be non-null and match a post ID in the
  current page batch; attacker must have DevTools access (trivially true in a PWA)
- Blast Radius: Exposure of post ID arrays for the current feed page — low immediate
  impact but violates the debug logging contract
- Identity Leak Type: Post ID enumeration (low severity)
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The debug logging rule exists to prevent information leakage in
  production. A misnamed variable that happens to receive a post ID from a URL param
  in a future sprint would silently expose page-level post ID sets to all users.
- Recommended mitigation: Wrap lines 136-141 in `if (import.meta.env.DEV) { ... }`
  guard. The debugPostId parameter is already present as a named pipeline argument;
  the guard is the only missing protection.
- Rationale: Consistent with the existing pattern — all other debug output in this
  file uses `if (import.meta.env.DEV) recordStep(...)`. This one block was missed.
- Follow-up command: ELEKTRA (verify no other production console.log paths exist in
  feed or adjacent pipeline files)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Information and Asset Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-FEED-003
- Location: apps/VCSM/src/features/feed/controllers/getDebugPrivacyRows.controller.js:42
            apps/VCSM/src/features/feed/dal/feed.read.debugPrivacyRows.dal.js:42-49
- Application Scope: VCSM
- Platform Surface: PWA — debug controller called from useDebugPrivacyRows hook
- Trust Boundary: Authenticated user (actorId passed from screen)
- Boundary Violated: Identity boundary — actorId used as userId in actor_owners lookup
- Contract Violated: VCSM Architecture Contract (actor-pure — no raw userId, ownership
  verified through actor_owners only using user_id = auth.uid())
- Current behavior: getDebugPrivacyRowsController receives { actorId } and passes it
  directly to readOwnedActorIdsByUserIdDAL(actorId). That DAL runs:
    .from("actor_owners").select("actor_id").eq("user_id", actorId)
  This queries actor_owners with actorId in the user_id column — an actor UUID is
  semantically different from a user UUID. An actorId will never match a user_id,
  so readOwnedActorIdsByUserIdDAL always returns [] for the debug controller call.
  This causes myActorIds = [] in the controller, making isOwner always false and
  followSet always empty for the debug privacy rows output.
- Risk: (1) Ownership detection is silently broken for the debug panel — it will
  always show isOwner: false even for posts the viewer owns. (2) The misuse of
  actorId as userId establishes a pattern that could be copied into non-debug
  code, where silent empty returns would cause real authorization failures.
  (3) If a user's actorId happened to match a user_id in another context
  (UUID collision is astronomically unlikely but architecturally wrong), the
  result would be incorrect ownership data.
- Severity: MEDIUM
- Exploitability: LOW — this is a debug-only path gated by import.meta.env.DEV
  in DebugPrivacyPanel; no production path; the data is display-only
- Attack Preconditions: DEV environment only; no production attack surface
- Blast Radius: Incorrect debug output only — isOwner always false, isFollower
  always false in the debug privacy table. No production data affected.
- Identity Leak Type: Incorrect ownership display (debug only)
- Cache Trust Type: None
- RLS Dependency: ASSUMED (actor_owners has RLS; the query is wrong but RLS
  applies correctly to whatever it returns — which is nothing)
- Why it matters: The architecture contract prohibits mixing actorId and userId.
  Debug panels are copied into production code. The silent-empty return from
  readOwnedActorIdsByUserIdDAL means the debug panel gives misleading data,
  defeating the purpose of the debug tool.
- Recommended mitigation: The controller should receive the viewer's userId from
  the identity session (auth.uid()) rather than passing actorId to a userId query.
  OR: rename readOwnedActorIdsByUserIdDAL and pass the correct identity field.
  The debug controller should call the same actor_owners lookup used by the
  feed pipeline (which correctly uses auth.uid() via RLS), not construct its own.
- Rationale: Actor-pure identity contract requires that userId (auth.uid()) and
  actorId (vc.actors.id) are never interchanged.
- Follow-up command: DEADPOOL (trace why this was missed in previous debug panel
  reviews; confirm no production callers pass actorId where userId is expected)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-FEED-004
- Location: apps/VCSM/src/features/feed/dal/listActorPostsByActor.dal.js:3-26
            apps/VCSM/src/features/feed/controllers/listActorPosts.controller.js:33-37
- Application Scope: VCSM
- Platform Surface: PWA — controller called from useFeed / profile view
- Trust Boundary: Authenticated caller supplies both actorId and viewerActorId
- Boundary Violated: Application-layer ownership check absent — RLS-only dependency
- Contract Violated: VCSM defense-in-depth principle; listActorPosts controller
  accepts viewerActorId but never uses it
- Current behavior: listActorPosts({ actorId, viewerActorId, limit }) validates
  actorId and viewerActorId are both present (throws if missing), then calls
  listActorPostsByActorDAL({ actorId }) passing ONLY actorId. The viewerActorId
  parameter is accepted but immediately discarded — zero application-layer
  visibility check is performed. Visibility enforcement is delegated entirely
  to vc.posts RLS (posts_select_actor_based policy).
- Risk: The controller's signature implies a viewer-scoped access check but
  performs none. Any authenticated caller who can supply a valid actorId can
  enumerate all non-deleted posts for that actor via this path, subject only
  to RLS. If the posts RLS policy has any gap (e.g., vport actors with no
  privacy setting row, or a missing force-RLS migration), all posts for the
  target actor are exposed. Additionally, the function accepts viewerActorId
  to create a false sense of access control at the application layer.
- Severity: MEDIUM
- Exploitability: MEDIUM — requires only a valid actorId; viewerActorId can be
  the caller's own actor (trivially available after login)
- Attack Preconditions: Authenticated session + knowledge of target actorId
- Blast Radius: Post enumeration for any actor whose posts RLS policy has a gap;
  specifically high risk for actors with no actor_privacy_settings row (defaults
  to public in the RLS policy) and for vport actors
- Identity Leak Type: Post content enumeration
- Cache Trust Type: None
- RLS Dependency: REQUIRED — the DAL relies entirely on posts_select_actor_based
  RLS policy for visibility enforcement; no application-layer guard exists
- Why it matters: The controller interface advertises viewer-scoped access (takes
  viewerActorId) but discards it. This is a trust boundary where the application
  layer contributes zero protection. A caller who bypasses the hook layer (e.g.,
  direct controller import) or who passes their own actorId as viewerActorId gets
  full post access gated only by DB RLS.
- Recommended mitigation: Either (a) implement an explicit privacy check in the
  controller using the viewerActorId before calling the DAL, matching the logic in
  feedRowVisibility.model.js (check privacy setting + follow status + ownership),
  OR (b) rename/remove the viewerActorId parameter if it is intentionally a no-op,
  and document that this is RLS-delegated-only. Option (a) is preferred for
  defense in depth.
- Rationale: Defense in depth requires at least one application-layer check in
  addition to RLS, especially for actor-scoped post enumeration.
- Follow-up command: DB (verify posts_select_actor_based policy covers all actor
  kinds including vports with no privacy_settings row; verify FORCE RLS is enabled)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-FEED-005
- Location: apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js:64-89
- Application Scope: VCSM
- Platform Surface: PWA — feed pipeline (readActorsBundle called from fetchFeedPagePipeline)
- Trust Boundary: Authenticated feed viewer
- Boundary Violated: Cross-schema data fetch with differing RLS context
- Contract Violated: Minimal column selection principle; schema trust boundary
- Current behavior: readActorsBundle fetches from three sources in parallel:
  (1) vc.actors — uses supabase client (session-authenticated, RLS applies)
  (2) profiles (public schema) — uses supabase client, no explicit schema(), relies on
      search_path default
  (3) vport.profiles — uses vportSchema (same supabase client, schema('vport'))
  The comment at line 159 in useFeed.js acknowledges: "vport.profiles has owner-only
  RLS → vportMap is empty for non-owner users." This means vport profile data
  (name, slug, avatar_url) is SILENTLY EMPTY for non-owners. The pipeline then
  force-hydrates via get_actor_summaries RPC for these actors, which is correct.
  However, the silent empty from vport.profiles is not explicitly guarded — the
  bundle result contains null vport entries that downstream normalizeFeedRows treats
  as "missing_vport_profile" → visible: false. This means vport posts are HIDDEN
  from non-owner viewers in the feed even when the vport is active and public.
- Risk: Vport actors' posts are invisibly excluded from non-owner feeds whenever
  vport.profiles has owner-only RLS, because the actorsBundle returns null for
  vport entries. The force-hydration via get_actor_summaries runs AFTER normalization
  and does not affect the current page's visibility decisions. This is a functional
  content access issue (vport posts hidden) with a secondary security dimension:
  the trust boundary between the two schema access patterns (direct vport.profiles
  vs. SECURITY DEFINER RPC) is inconsistent within the same pipeline call.
- Severity: HIGH
- Exploitability: N/A — this is a data access gap that hides content rather than
  exposes it; the security dimension is architectural inconsistency
- Attack Preconditions: Non-owner viewer requests a feed page containing vport-actor posts
- Blast Radius: All vport posts silently hidden for non-owner viewers unless
  subsequent hydration patches them on re-render; functional feed breakage
- Identity Leak Type: None (content hidden, not exposed)
- Cache Trust Type: Cache-miss path correctly bypasses; issue is in fresh fetch
- RLS Dependency: BYPASSED — vport.profiles RLS causes empty result; pipeline falls
  through to force-hydration after normalization, which is too late for visibility
- Why it matters: Vport actors are the commercial identity type in VCSM. If their
  posts are silently hidden in the central feed for non-owner users, the discovery
  and engagement model for business accounts is broken. The architectural inconsistency
  (direct schema access vs. SECURITY DEFINER RPC for the same data in the same pipeline)
  is a trust boundary smell that should be resolved.
- Recommended mitigation: For vport actors, replace the direct vport.profiles SELECT
  in readActorsBundle with a call to the get_actor_summaries SECURITY DEFINER RPC
  (which already works for non-owners). This makes the trust boundary consistent:
  all actor display data flows through the same RPC, and vport visibility decisions
  in normalizeFeedRows are made on real data rather than null entries.
- Rationale: Consistent trust boundary — all actor resolution should use the same
  RPC path; direct schema access should only be used where the caller has guaranteed
  ownership or explicit admin context.
- Follow-up command: DB (verify vport.profiles RLS policies; confirm get_actor_summaries
  returns name/slug/avatar for all vport actor IDs regardless of ownership)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-FEED-006
- Location: apps/VCSM/src/features/feed/dal/feed.read.posts.dal.js:8-33
- Application Scope: VCSM
- Platform Surface: PWA — feed pipeline (readFeedPostsPage → fetchFeedPagePipeline)
- Trust Boundary: Authenticated viewer; realmId supplied from identity context
- Boundary Violated: Realm isolation — no null-realmId enforcement at DAL layer
- Contract Violated: Void Realm / Public Realm isolation rule (system posts must
  stay in public realm; viewer must not see cross-realm content)
- Current behavior: readFeedPostsPage accepts realmId as optional. If realmId is
  null or undefined, the realm_id filter is simply not applied (line 30-32:
  `if (realmId) { q = q.eq("realm_id", realmId); }`). This means a null realmId
  causes the query to return posts from ALL realms — including the void realm —
  regardless of the viewer's realm membership.
  The identity context supplies realmId from identity?.realmId, which defaults to
  null if the user has no realm association (new users, partially onboarded users).
  A viewer with no realmId will see all posts across all realms.
- Risk: If realmId is null (unauthenticated-adjacent, new user, onboarding incomplete),
  the feed returns posts from all realms including the void realm (18+ anonymous-but-
  DB-tracked realm per platform vocabulary). Void realm content must never be visible
  outside the void realm. This is a functional isolation failure with privacy implications
  for void realm participants who expect realm-scoped visibility.
- Severity: LOW (depends on whether void realm is active in production; void realm
  is documented as a planned feature; risk is pre-emptive but architecturally real)
- Exploitability: LOW — requires realmId to be null, which should not occur for
  normal authenticated users with a complete identity; however partially onboarded
  users or edge cases in identity resolution can produce null realmId
- Attack Preconditions: Authenticated user with null realmId (new account,
  incomplete onboarding, or identity resolution failure)
- Blast Radius: Cross-realm post visibility — void realm posts visible to public
  realm users if void realm is active
- Identity Leak Type: Realm content cross-contamination
- Cache Trust Type: None
- RLS Dependency: ASSUMED — posts table RLS enforces visibility but may not enforce
  realm isolation (the policy in 20260510020000 does not filter by realm_id)
- Why it matters: The Void Realm isolation rule is canonical platform policy. A null
  realmId gate failure would expose void realm content to all users, violating the
  expectation of realm participants. The fix is cheap; the miss is architectural.
- Recommended mitigation: In readFeedPostsPage (or at the pipeline call site), enforce
  that realmId must be a non-null value before executing the query. If realmId is null,
  either (a) default to the canonical public realm ID (resolvePublicRealmIdDAL), or
  (b) return empty results with a clear error. Never execute a realm-less posts query.
- Rationale: Per platform memory (Void Realm — System Post Exclusion Rule), realm
  isolation must be enforced at every query boundary. The DAL is the last defense before
  data is returned.
- Follow-up command: DB (verify vc.posts RLS policy includes realm_id scope; verify
  resolvePublicRealmIdDAL is available and used consistently)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

## 8. Source Verification Summary

| Surface | File Inspected | Auth Check Present | RLS Dependency | Application Layer Guard | Status |
|---|---|---|---|---|---|
| markWelcomeFeedCardSeenDAL (WS-1) | feedWelcomeCard.dal.js | actorId guard only | VERIFIED (migration 20260518010000) | actorId null check | VERIFIED_SAFE |
| readWelcomeFeedCardStateDAL | feedWelcomeCard.dal.js | actorId guard | VERIFIED | actorId null check | VERIFIED_SAFE |
| readFeedPostsPage | feed.read.posts.dal.js | no auth guard | REQUIRED (posts_select_actor_based) | none — see VEN-FEED-006 | FINDING |
| listActorPostsByActorDAL | listActorPostsByActor.dal.js | no auth guard | REQUIRED | viewerActorId discarded — see VEN-FEED-004 | FINDING |
| readFeedFollowRowsDAL | feed.read.followRows.dal.js | viewerActorId + isUuid() | ASSUMED | UUID validation | VERIFIED_SAFE |
| readFeedBlockRowsDAL | feed.read.blockRows.dal.js | viewerActorId + isUuid() | ASSUMED | UUID validation | VERIFIED_SAFE |
| readActorsBundle | feed.read.actorsBundle.dal.js | none — batch query | ASSUMED | none — see VEN-FEED-005 | FINDING |
| readHiddenPostsForViewer | feed.read.hiddenPosts.dal.js | viewerActorId guard | VERIFIED (migration 20260518020000) | actor_id guard | VERIFIED_SAFE |
| readViewerReactionsBatch | feed.read.viewerReactions.dal.js | actorId guard | ASSUMED | actorId null check | VERIFIED_SAFE |
| readCommentCountsBatch | feed.read.commentCounts.dal.js | post IDs only | ASSUMED | postIds array check | VERIFIED_SAFE |
| readReactionCountsBatch | feed.read.reactionCounts.dal.js | post IDs only | ASSUMED | postIds array check | VERIFIED_SAFE |
| readPostMediaMap | feed.read.media.dal.js | post IDs only | ASSUMED | postIds array check | VERIFIED_SAFE |
| fetchRawPostMentionEdgesDAL | feed.mentions.dal.js | post IDs only | ASSUMED | postIds array check | VERIFIED_SAFE |
| getDebugPrivacyRowsController | getDebugPrivacyRows.controller.js | actorId guard | ASSUMED | DEV-only path | FINDING (VEN-FEED-003) |
| DebugPrivacyPanel / DebugFeedFilterPanel | DebugPrivacyPanel.jsx, DebugFeedFilterPanel.jsx | import.meta.env.DEV | N/A | IS_DEV gates render | VERIFIED_SAFE |
| CentralFeedScreen debug URL params | CentralFeedScreen.jsx | IS_DEV gate | N/A | IS_DEV AND debugMode | VERIFIED_SAFE |
| fetchFeedPagePipeline debugPostId log | fetchFeedPage.pipeline.js | MISSING guard | N/A | no DEV guard — see VEN-FEED-002 | FINDING |

### Key Verified Protections

1. **actor_onboarding_steps RLS** — Migration 20260518010000 confirmed: RLS enabled, USING + WITH CHECK enforce actor_owners ownership. markWelcomeFeedCardSeenDAL cannot write for non-owned actors.

2. **moderation.actions RLS** — Migration 20260518020000 confirmed: actions_select_own_actor and actions_insert_own_actor policies in place. readHiddenPostsForViewer cannot cross actor boundaries.

3. **vc.posts RLS** — Migration 20260510020000 confirmed: posts_select_actor_based policy enforces owner + (not blocked) AND (public OR following). Block exclusion is bidirectional.

4. **Block/Follow TTL caches** — viewerActorId-keyed and UUID-validated before use. Cache invalidation functions exist and are exported.

5. **Debug panels** — Both DebugPrivacyPanel and DebugFeedFilterPanel are gated behind `import.meta.env.DEV` at render time. URL debug mode is also gated by `IS_DEV`.

---

## 9. Confidence Summary

| Finding | Confidence | Basis |
|---|---|---|
| VEN-FEED-001 (BEHAVIOR.md PLACEHOLDER) | HIGH | File read, status=PLACEHOLDER confirmed |
| VEN-FEED-002 (unguarded console.log) | HIGH | Source line 137 of fetchFeedPage.pipeline.js confirmed, no DEV guard |
| VEN-FEED-003 (actorId-as-userId identity confusion) | HIGH | Source lines 42 of controller + line 49 of DAL confirmed; eq("user_id", actorId) |
| VEN-FEED-004 (viewerActorId discarded in listActorPosts) | HIGH | Controller source confirms viewerActorId not passed to DAL |
| VEN-FEED-005 (vport.profiles RLS empty → missing_vport_profile) | HIGH | Source + comment at useFeed.js:159 confirm the known behavior; normalizeFeedRows model confirmed |
| VEN-FEED-006 (null realmId exposes all realms) | HIGH | feed.read.posts.dal.js:30-32 confirmed; `if (realmId)` pattern confirmed |

---

## 10. THOR Impact

| Finding | Severity | THOR Blocker | Rationale |
|---|---|---|---|
| VEN-FEED-001 | HIGH | NO | Governance gap — no active exploit; contract creation is separate sprint work |
| VEN-FEED-002 | MEDIUM | NO | DEV-only path in practice; no production activation vector confirmed |
| VEN-FEED-003 | MEDIUM | NO | DEV-only path (debug panel gated); incorrect output only |
| VEN-FEED-004 | MEDIUM | NO | RLS provides real protection; application-layer gap is defense-in-depth concern |
| VEN-FEED-005 | HIGH | NO | Content hidden (not exposed); functional issue but not a data leak; DB verification needed |
| VEN-FEED-006 | LOW | NO | Void realm is a planned feature; risk is pre-emptive; null realmId guard is a hardening measure |

No THOR release blockers identified. The two HIGH findings should be resolved before the next major feed sprint.

---

## 11. Required Follow-Up Commands

| Finding | Command | Priority | Reason |
|---|---|---|---|
| VEN-FEED-001 | SPIDER-MAN | P2 | Write BEHAVIOR.md with §5 + §9 and add regression coverage for feed visibility invariants |
| VEN-FEED-002 | ELEKTRA | P2 | Scan for any other production console.log paths in feed and adjacent pipeline files |
| VEN-FEED-003 | DEADPOOL | P2 | Root-cause why actorId was passed as userId; confirm no production callers |
| VEN-FEED-004 | DB | P2 | Verify posts RLS covers all actor kinds; confirm viewerActorId path is intentionally RLS-delegated |
| VEN-FEED-005 | DB | P1 | Verify vport.profiles RLS policies; confirm get_actor_summaries returns data for non-owners |
| VEN-FEED-006 | DB | P2 | Verify vc.posts RLS policy includes realm_id scope; verify resolvePublicRealmIdDAL availability |

---

## 12. Mitigation Plan

| Finding ID | Severity | File | Action | Owner | Priority |
|---|---|---|---|---|---|
| VEN-FEED-001 | HIGH | ZZnotforproduction/.../feed/BEHAVIOR.md | Write complete BEHAVIOR.md with §5 Security Rules and §9 Must Never Happen covering 6 invariants | Engineering | P2 |
| VEN-FEED-002 | MEDIUM | apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js:136-141 | Wrap console.log in `if (import.meta.env.DEV) { ... }` guard | Engineering | P2 |
| VEN-FEED-003 | MEDIUM | apps/VCSM/src/features/feed/controllers/getDebugPrivacyRows.controller.js:42 | Pass userId (from auth session) instead of actorId to readOwnedActorIdsByUserIdDAL; or restructure to use the same actor_owners lookup as the main pipeline | Engineering | P2 |
| VEN-FEED-004 | MEDIUM | apps/VCSM/src/features/feed/controllers/listActorPosts.controller.js:33-37 | Either implement application-layer privacy check using viewerActorId OR document the RLS-delegated design and remove the misleading parameter | Engineering | P2 |
| VEN-FEED-005 | HIGH | apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js:84-89 | Replace direct vport.profiles SELECT with get_actor_summaries RPC call for vport actors; ensure normalizeFeedRows receives real vport data for non-owners | Engineering | P1 |
| VEN-FEED-006 | LOW | apps/VCSM/src/features/feed/dal/feed.read.posts.dal.js:30-32 | Add guard: if no realmId, either use resolvePublicRealmIdDAL() as default or throw and return empty; never execute realm-less posts query | Engineering | P3 |

---

## 13. CISSP Domain Coverage Summary

| CISSP Domain | Findings Covered |
|---|---|
| Access Control | VEN-FEED-004, VEN-FEED-005, VEN-FEED-006 |
| Identity and Access Management | VEN-FEED-003 |
| Software Development Security | VEN-FEED-001, VEN-FEED-002, VEN-FEED-003, VEN-FEED-004 |
| Security Assessment and Testing | VEN-FEED-001 |
| Information and Asset Security | VEN-FEED-002 |
| Communications and Network Security | None |
| Security Operations | None |
| Security Architecture and Engineering | VEN-FEED-005, VEN-FEED-006 |

---

## Appendix: Verified Safe Surfaces

The following surfaces were inspected and found to be correctly protected:

- **markWelcomeFeedCardSeenDAL / readWelcomeFeedCardStateDAL** — actorId null guard + RLS migration 20260518010000 verified. No cross-actor write possible.
- **readHiddenPostsForViewer** — viewerActorId guard + RLS migration 20260518020000 verified. No cross-actor read possible.
- **readFeedFollowRowsDAL / readFeedBlockRowsDAL** — UUID validation on viewerActorId; TTL caches are viewer-keyed; invalidation functions exported.
- **DebugPrivacyPanel / DebugFeedFilterPanel** — Hard-gated by `import.meta.env.DEV` at both render and data fetch layers.
- **CentralFeedScreen debug URL mode** — `IS_DEV && debugMode === '...'` gate confirmed; no production debug activation path.
- **useFeedWelcomeCard dismiss** — Correct: uses actorId from hook param (identity context); localStorage key is actorId-scoped.
- **vc.posts RLS** — Migration 20260510020000 confirmed block exclusion policy (bidirectional) + owner + public/following gates.
