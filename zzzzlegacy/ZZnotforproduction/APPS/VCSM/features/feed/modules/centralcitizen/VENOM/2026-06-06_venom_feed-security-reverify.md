---
name: vcsm.feed.venom.2026-06-06
description: VENOM re-verify — VCSM:feed — BLIND_REVERIFY_MODE — 2026-06-06
metadata:
  type: venom-output
  owner: VENOM
  run-date: 2026-06-06
  mode: BLIND_REVERIFY_MODE
  prior-run: 2026-06-04
  branch: vport-booking-feed-security-updates
---

# VENOM SECURITY RE-VERIFY — VCSM:feed — 2026-06-06

**Run mode:** BLIND_REVERIFY_MODE
**ARCHITECT gate:** PASS — Same-session ARCHITECT run completed 2026-06-06 (freshness: FRESH)
**Prior VENOM run:** 2026-06-04
**Trigger:** User request — "inside here re-verify venom"
**Scope:** Central feed feature — all trust boundaries, authorization surfaces, debug leakage, identity surfaces

---

## BLIND REVERIFY CHECK

| Check | Status |
|---|---|
| Historical reports not loaded during reconstruction | PASS — SECURITY.md loaded AFTER independent source reconstruction; no prior VENOM/ELEKTRA/BLACKWIDOW output read before chain rebuild |
| Current ARCHITECT artifacts loaded | PASS — 2026-06-06 ARCHITECT output read before source analysis |
| Current source files re-read | PASS — 12 source files read independently: controller, DAL, pipeline, query, hooks, screen, adapters, models |
| Chain rebuilt from source | PASS — Trust boundary traced from screen → hook → query → pipeline → 9 DALs → model |
| Exploitability assessed before report comparison | PASS — All exploitability/severity determined from source before loading SECURITY.md |

All five checks PASS. This re-verify is valid for THOR consumption.

---

## VENOM TARGET

```
Feature / Route / Engine: VCSM:feed — Central Feed
Application Scope: VCSM
Reason for review: BLIND re-verify of prior VENOM 2026-06-04 findings; scope expansion for new surfaces identified by ARCHITECT 2026-06-06
Primary trust boundary: Authenticated Citizen → Feed read pipeline → Post visibility gate → DB (RLS)
```

---

## SECURITY SURFACE

```
Entry point: CentralFeedScreen.jsx — authenticated route; Navigate to /login if !user
Auth source: Supabase session via useAuth(); actorId resolved via useIdentity() adapter
Authorization layer: App-layer: realmId scoping, block/follow/private visibility model
                    DB-layer: Supabase RLS on vc.posts, moderation.blocks, vc.actor_follows
Identity surface: actorId (canonical) — derived from identity adapter, not raw from session
Sensitive objects involved: vc.posts (content), moderation.blocks (relationships),
                            vc.actor_follows (relationships), vc.actor_onboarding_steps (write),
                            actor_privacy_settings (private flags), vport.profiles (lifecycle)
```

---

## Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: ZZnotforproduction/APPS/VCSM/features/feed/BEHAVIOR.md
BEHAVIOR.md exists: YES
BEHAVIOR.md status: PLACEHOLDER — "Behavior contract pending source review." — no content
§5 Security Rules declared: 0 (MISSING — placeholder)
§5 Rules verified in source: N/A
§5 Rules unenforced: N/A — contract not written
§9 Must Never Happen declared: 0 (MISSING — placeholder)
§9 Invariants protected in source: N/A
§9 Invariants unprotected: N/A — contract not written
```

BEHAVIOR.md being a placeholder means security posture cannot be fully evaluated against declared invariants. All findings below are classified UNANCHORED — no declared §5/§9 baseline exists.

---

## TRUST BOUNDARY TRACE

```
TRUST BOUNDARY TRACE
Client input: viewerActorId (derived from identity adapter), realmId (derived from identity adapter)
Validated at: useIdentity() adapter — resolves from Supabase session; not directly user-submitted
Identity resolved at: App-layer via identity adapter; no hook-level session re-binding
Authorization enforced at: 
  - App: realmId scoping in DAL, visibility model (block/follow/private), hiddenPosts gate
  - DB: RLS on all queried tables (ASSUMED — not verified in this session)
Data returned to: React Query cache → useCentralFeed state → CentralFeedScreen → PostCard rendering
```

---

## PRIOR FINDING RE-CLASSIFICATION

### VEN-FEED-001 — BEHAVIOR.md is a PLACEHOLDER

**Status:** STILL_OPEN_SOURCE_VERIFIED
**Evidence:** Source confirms BEHAVIOR.md status is still PLACEHOLDER with comment "Behavior contract pending source review." and no §5/§9 content.
**Severity:** HIGH (unchanged)

---

### VEN-FEED-002 — Unguarded console.log in fetchFeedPage.pipeline.js:137

**Status:** CLOSED_SOURCE_VERIFIED
**Evidence:** Source line 137 confirmed: `if (import.meta.env.DEV && debugPostId && pagePostIds.includes(debugPostId))` — fully DEV-guarded. This was a false finding in the 2026-06-04 VENOM report. ARCHITECT 2026-06-06 already documented this correction.
**Severity:** N/A — closed

---

### VEN-FEED-003 — actorId passed as userId to readOwnedActorIdsByUserIdDAL in debug controller

**Status:** STILL_OPEN_SOURCE_VERIFIED
**Evidence:** `getDebugPrivacyRows.controller.js` line 42: `readOwnedActorIdsByUserIdDAL(actorId)` — function parameter is named `userId` but receives an actorId. This causes the actor_owners lookup to query `user_id = <actorId>`, which always returns empty (UUID mismatch). isOwner is always false in debug panel for all actors.
**Severity:** LOW — DEV-only context (debug controller only fires when DebugPrivacyPanel is enabled in DEV mode); no production security impact
**Note:** This is a functional bug (incorrect ownership detection in debug panel) but not a production security risk.

---

### VEN-FEED-004 — listActorPosts accepts viewerActorId but discards it — RLS-only dependency

**Status:** STILL_OPEN_SOURCE_VERIFIED
**Evidence:** `listActorPosts.controller.js` lines 33-37:
```js
export async function listActorPosts({ actorId, viewerActorId, limit }) {
  if (!actorId) throw new Error("Missing actorId");
  if (!viewerActorId) throw new Error("Missing viewerActorId");
  return listActorPostsByActorDAL({ actorId, ...(limit != null && { limit }) });
}
```
`viewerActorId` is validated (non-empty check) but NEVER passed to the DAL. The authorization interface is misleading: the caller is required to supply a viewerActorId, but its value is irrelevant — any non-empty UUID is accepted. RLS is the sole enforcement. No app-layer assertion verifies that `viewerActorId` matches the authenticated Supabase session user's actorId.
**Severity:** MEDIUM (unchanged)

---

### VEN-FEED-005 — vport.profiles owner-only RLS causes null vport bundle entries

**Status:** NOT_VERIFIABLE_SOURCE_MISSING
**Reason:** This finding is about DB-layer RLS behavior on `vport.profiles`. Source inspection cannot verify RLS policies. A DB review (CARNAGE or DB command) is required to confirm or refute this finding.
**Severity:** HIGH (pending DB verification)

---

### VEN-FEED-006 — null realmId skips realm filter — all realms exposed

**Status:** CLOSED_SOURCE_VERIFIED (PRIOR FINDING WAS INCORRECT)
**Evidence:** `feed.read.posts.dal.js` lines 7-10:
```js
if (!realmId) {
  return { pageRows: [], hasMoreNow: false, nextCursorCreatedAt: null };
}
```
When realmId is null, the DAL returns an EMPTY result — no posts from any realm are returned. The prior finding claimed "all realms exposed to partially-onboarded users" — this is incorrect. The null guard is a safe, graceful default that returns nothing. Partially-onboarded users see an empty feed, not all realms.
**Severity:** N/A — closed; finding was incorrect

---

### BW-FEED-001 — ctrlMarkWelcomeCardSeen has no ownership check — actorId unverified against session

**Status:** STILL_OPEN_SOURCE_VERIFIED
**Evidence:** `feedWelcomeCard.controller.js` line 12: `ctrlMarkWelcomeCardSeen({ actorId })` passes actorId directly to `markWelcomeFeedCardSeenDAL` with no verification that the actorId matches the authenticated Supabase session user. Any authenticated actor who knows a target actorId can mark that actor's welcome card as "seen" by calling this controller.
**Severity:** HIGH (structural pattern — ownership check absent on write path)
**Note:** Low data sensitivity (onboarding state only), but the pattern of accepting caller-provided actorId without session binding is a security contract violation. RLS on `vc.actor_onboarding_steps` is ASSUMED but unverified.

---

### BW-FEED-002 — Feed hooks delegate actorId from caller — no session binding enforcement at hook layer

**Status:** STILL_OPEN_SOURCE_VERIFIED
**Evidence:** `useCentralFeed.js` signature: `useCentralFeed(viewerActorId, realmId, ...)` — accepts caller-provided actorId. No hook-level assertion that actorId matches the current Supabase session user. The identity adapter (`useIdentity()`) derives actorId from session, but this is a convention; the hook itself does not enforce it.
**Severity:** MEDIUM (unchanged)

---

### BW-FEED-003 — getDebugPrivacyRowsController has no production environment gate

**Status:** CLOSED_SOURCE_VERIFIED
**Evidence:**
- `DebugPrivacyPanel.jsx` line 12: `const isDev = import.meta.env.DEV`
- `DebugPrivacyPanel.jsx` line 16-20: `useDebugPrivacyRows({ actorId, postIds, enabled: isDev })` — `enabled: isDev` means hook is inactive in production
- `DebugPrivacyPanel.jsx` line 32: `if (!isDev || !rows.length) return null` — component renders nothing in production
- `CentralFeedScreen.jsx` line 106: `const debugPrivacy = IS_DEV && (debugMode === 'privacy' || ...)` — screen-level IS_DEV gate
The controller is three-layer protected from production activation.
**Severity:** N/A — closed

---

### BW-FEED-004 — getDebugPrivacyRows passes actorId as userId (confirms VEN-FEED-003)

**Status:** STILL_OPEN_SOURCE_VERIFIED — same finding as VEN-FEED-003; confirmed by source
**Severity:** LOW — DEV-only; no production impact

---

### BW-FEED-005 — vc.actor_onboarding_steps write RLS unverified

**Status:** NOT_VERIFIABLE_SOURCE_MISSING
**Reason:** RLS policy on `vc.actor_onboarding_steps` cannot be verified from source. DB review required.
**Severity:** MEDIUM (pending DB verification)

---

### BW-FEED-006 — 60s stale follow/block cache may serve incorrect visibility decisions

**Status:** STILL_OPEN_SOURCE_VERIFIED
**Evidence:**
- `feed.read.blockRows.dal.js`: `createTTLCache(60_000)` — 60s TTL per viewer
- `feed.read.followRows.dal.js`: (confirmed 60s TTL from ARCHITECT artifacts)
- `useCentralFeedActions.js` line 189: `invalidateFeedBlockCache(actorId)` — called only on viewer's own block action
- No cache invalidation path exists for: external deactivation of a blocked actor, account deletion, privacy setting changes by a third-party actor, moderation-triggered account suspension
**Severity:** LOW (unchanged) — limited window; self-blocking invalidates correctly; external events are the gap

---

### BW-FEED-007 — Share URL constructed with raw UUID postId

**Status:** STILL_OPEN_SOURCE_VERIFIED
**Evidence:** `useCentralFeedActions.js` line 246:
```js
const url = `${window.location.origin}/post/${postId}`
```
`postId` is the raw UUID from the feed post object. Platform invariant: "Raw UUIDs must never appear in public-facing URLs — always use human-readable slugs." This generates share URLs in the form `https://app.vcsm.com/post/550e8400-e29b-41d4-a716-446655440000`, exposing internal post UUIDs in distributed share links.
**Severity:** MEDIUM (unchanged)

---

### BW-FEED-008 — getDebugPrivacyRowsController exposes actor privacy in production — THOR BLOCKER

**Status:** CLOSED_SOURCE_VERIFIED — **THOR BLOCKER IS RESOLVED**
**Evidence:**
- `DebugPrivacyPanel.jsx` line 32: `if (!isDev || !rows.length) return null` — never renders in production
- `useDebugPrivacyRows.js` line 11: `if (!enabled || ...)` — `enabled: isDev` means never executes in production
- `CentralFeedScreen.jsx` line 106-107: IS_DEV guard on screen level
Three independent DEV gates prevent this controller from executing or rendering in production. The THOR release blocker BW-FEED-008 is cleared.
**Severity:** N/A — closed

---

## NEW FINDINGS FROM THIS RE-VERIFY PASS

---

### VENOM SECURITY FINDING

- **Finding ID:** VEN-FEED-007 (new)
- **Location:** `apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js:163` and `apps/VCSM/src/features/feed/queries/fetchCentralFeedPage.js:103`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Feed Engine, Supabase Table/View
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** App-internal visibility data exposed in client-side React Query cache
- **Contract Violated:** Feed Publishing Contract — visibility decisions for filtered posts (blocked actors, private profiles) should not persist in client state
- **Current behavior:** `fetchFeedPagePipeline` is called with `includeDebug: true` (unconditional at pipeline line 163). `normalizeFeedRows` builds `debugRows` containing visibility metadata for ALL posts — including invisible ones: `{ post_id, actor_id, visible: false, reason: "private_not_following", is_private: true, is_following: false, is_owner: false, actor_kind: "user" }`. These rows are returned from `fetchCentralFeedPage` as `debugRows` (line 103) and stored in React Query cache. `useCentralFeed` computes `filterDebugRows` from this data and exposes it as part of the hook's public return value. In production, this data sits in the React Query cache for every user session.
- **Risk:** An attacker who can inspect their browser's React Query cache (via DevTools → Application → React Query cache, or React Query DevTools) can see the private profile status (`is_private: true`) and visibility reason (`reason: "private_not_following"`) for actors whose posts were fetched but filtered out of the visible feed. This discloses: which specific actors have private profiles (by UUID), follow relationship inferences, and actor existence for blocked actors.
- **Severity:** MEDIUM
- **Exploitability:** LOW — requires browser DevTools access; only discloses data to the session user themselves, not across users
- **Attack Preconditions:**
  - Must be the authenticated user (access to their own browser session)
  - Must know how to inspect React Query cache via DevTools
  - No cross-user exposure
- **Blast Radius:** Single actor (viewer only — sees own cache)
- **Identity Leak Type:** Ownership inference, private profile disclosure
- **Cache Trust Type:** Identity-sensitive (is_private flags), Moderation-sensitive (blocked actor existence)
- **RLS Dependency:** NONE — this is purely app-layer data stored in client memory
- **Why it matters:** Privacy-sensitive actors expect their private status to be opaque. While `debugRows` doesn't expose post content, it discloses that a specific actor (UUID) has a private profile and that the viewer isn't following them. The `includeDebug: true` flag was intended for DEV-only use (debug panel) but is unconditional in the pipeline, meaning this data accumulates in production React Query cache indefinitely during a session.
- **Recommended mitigation:** Gate `includeDebug` behind `import.meta.env.DEV` in `fetchFeedPagePipeline` call site in `fetchCentralFeedPage.js`. In production, pass `includeDebug: false` and do not include `debugRows` in the `fetchCentralFeedPage` return value. This eliminates visibility metadata from the production React Query cache entirely.
- **Rationale:** Defense of privacy requires that visibility decisions for private actors not be preserved in client-accessible state. The data has no production UI use — the only consumer is `DebugFeedFilterPanel` which is already DEV-gated.
- **Follow-up command:** ELEKTRA
- **CISSP Domain:**
  - Primary: Asset Security (private profile state classification)
  - Secondary: Software Development Security (unconditional debug path in production code)

---

### VENOM SECURITY FINDING

- **Finding ID:** VEN-FEED-008 (new)
- **Location:** `apps/VCSM/src/features/feed/screens/CentralFeedScreen.jsx:16-17,41` and `apps/VCSM/src/features/feed/hooks/useCentralFeed.js:16` and `apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js:22`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Feed Engine
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Production bundle integrity — debug modules imported unconditionally
- **Contract Violated:** None explicit; platform security principle requires debug tooling excluded from production bundles
- **Current behavior:** Three production-facing modules import from `@debuggers/` without DEV guards:
  1. `CentralFeedScreen.jsx` line 16: `import { FeedDebugPanel, debugFeedEvent } from '@debuggers/feed'`
  2. `CentralFeedScreen.jsx` line 17: `import { useActorConsistencyCheck } from '@debuggers/identity/useActorConsistencyCheck'`
  3. `useCentralFeed.js` line 16: `import { debugFeedEvent, debugFeedResult } from '@debuggers/feed'`
  4. `fetchFeedPage.pipeline.js` line 22: `import { wrapDAL, recordStep } from "@debuggers/feed/feedProfiler"`
  Individual usages are DEV-gated, but the imports themselves are unconditional.
- **Risk:** If Vite's tree-shaking fails to eliminate these modules (e.g., due to side effects in the module graph, incorrect `sideEffects: false` config, or build misconfiguration), the full `@debuggers/feed` profiler, event logger, and `@debuggers/identity` consistency check code is bundled into production. This could expose: session-based DAL call counters, actor identity snapshots, feed profile data, and internal diagnostic hooks to production users who inspect the bundle.
- **Severity:** MEDIUM
- **Exploitability:** LOW — requires build misconfiguration for exploitation; correct Vite tree-shaking eliminates the risk; not exploitable with default Vite config
- **Attack Preconditions:**
  - Vite tree-shaking must fail to eliminate `@debuggers/` imports
  - Attacker must have access to production bundle (public JS files)
- **Blast Radius:** Feed-wide (all users receive the same bundle)
- **Identity Leak Type:** Actor correlation (profiler captures actorId in session data)
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Production bundles containing debug tooling violate the principle that diagnostic infrastructure must be invisible to production users. If the debugger bundle does ship (even partially), it reveals internal architecture, actorId values stored in session profiler, and DAL timing data.
- **Recommended mitigation:** Move all `@debuggers/` imports inside `if (import.meta.env.DEV)` blocks using dynamic import syntax, or wrap them in a dead-code-eliminatable pattern:
  ```js
  const { FeedDebugPanel, debugFeedEvent } = import.meta.env.DEV
    ? await import('@debuggers/feed')
    : { FeedDebugPanel: null, debugFeedEvent: () => {} }
  ```
  Alternatively, confirm and document that `@debuggers/` modules have `"sideEffects": false` and that tree-shaking is verified in CI.
- **Rationale:** Defense-in-depth: even if tree-shaking works in practice, unconditional imports create a latent risk that a build system change or misconfiguration could silently include debug modules in production.
- **Follow-up command:** ELEKTRA
- **CISSP Domain:**
  - Primary: Security Operations (debug tooling exposure)
  - Secondary: Software Development Security (unconditional debug imports in production modules)

---

### VENOM SECURITY FINDING

- **Finding ID:** VEN-FEED-009 (new)
- **Location:** `apps/VCSM/src/features/feed/adapters/hooks/useFeed.adapter.js`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Feed Engine
- **Trust Boundary:** Authenticated Citizen, Authenticated VPORT Owner
- **Boundary Violated:** Adapter boundary integrity — external consumers receive legacy hook
- **Contract Violated:** Boundary Isolation Contract — the adapter should expose the canonical hook, not the legacy implementation
- **Current behavior:** `useFeed.adapter.js` contains a single line: `export * from "@/features/feed/hooks/useFeed"` — this re-exports the state-based legacy hook (`useFeed.js`), not the canonical React Query hook (`useCentralFeed.js`). Any external feature that consumes `useFeed.adapter.js` receives the legacy implementation with different state management behavior, different pagination logic, and a double-fetch race condition.
- **Risk:** Future security fixes applied to `useCentralFeed.js` (e.g., improved actorId validation, session binding, cache invalidation logic) will NOT reach consumers via the adapter boundary. The adapter boundary is meant to be the isolation enforcement point — if it's frozen on the wrong implementation, the security posture of all adapter consumers is decoupled from canonical security improvements. Current consumer: `PostFeed.screen.jsx` at `/posts` route.
- **Severity:** HIGH — structural boundary defect that breaks forward security improvement propagation
- **Exploitability:** MEDIUM — requires a security fix to be made to `useCentralFeed.js` that isn't mirrored to `useFeed.js`; currently exploitable via `/posts` route which uses legacy hook
- **Attack Preconditions:**
  - Must know the `/posts` route uses a different hook than `/feed`
  - Must be authenticated
  - Exploitability depends on divergence between legacy and canonical hooks
- **Blast Radius:** Multi-actor (all users on `/posts` route)
- **Identity Leak Type:** None currently — structural risk for future divergence
- **Cache Trust Type:** None
- **RLS Dependency:** ASSUMED — same RLS as canonical hook; unknown if legacy hook has different call paths
- **Why it matters:** The adapter boundary exists to allow internal hook migration without breaking external consumers. A frozen adapter means the migration has been effectively abandoned from the external consumer's perspective. Any security hardening of the canonical hook is invisible to adapter consumers.
- **Recommended mitigation:** Update `useFeed.adapter.js` to re-export `useCentralFeed.js`:
  ```js
  export * from "@/features/feed/hooks/useCentralFeed";
  ```
  Then update `PostFeed.screen.jsx` to handle the changed hook API (React Query vs state-based).
- **Rationale:** The adapter boundary's purpose is to decouple internal implementation from external consumers while allowing forward migration. It must track the canonical implementation.
- **Follow-up command:** IRONMAN
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering (trust boundary design)
  - Secondary: Software Development Security (dependency boundary integrity)

---

## IDENTITY SURFACE WARNINGS

### IDENTITY SURFACE WARNING — listActorPosts controller

```
Location: apps/VCSM/src/features/feed/controllers/listActorPosts.controller.js:33-37
Current identity surface: viewerActorId received, validated as non-empty, then discarded
Expected identity surface: viewerActorId should be verified against the authenticated Supabase session
Risk: Controller accepts any non-empty viewerActorId without session binding; RLS is sole enforcement
Suggested correction: Inject verified session actorId from a session context rather than accepting
  caller-provided viewerActorId; or add session binding assertion before the DAL call
```

### IDENTITY SURFACE WARNING — feedWelcomeCard write path

```
Location: apps/VCSM/src/features/feed/controllers/feedWelcomeCard.controller.js:12
Current identity surface: actorId accepted from caller with no session binding
Expected identity surface: actorId must be verified to match authenticated session user's actorId via actor_owners
Risk: Any authenticated user can mark any actorId's welcome card as seen by supplying a known actorId
Suggested correction: Verify actorId belongs to the authenticated session user via actor_owners check before upsert
```

---

## DEBUG LEAKAGE WARNINGS

### DEBUG LEAKAGE WARNING — filterDebugRows in production React Query cache

```
Location: apps/VCSM/src/features/feed/queries/fetchCentralFeedPage.js:103
         apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js:163
Current behavior: debugRows (visibility metadata including is_private flags for filtered posts)
  stored in React Query cache unconditionally in production
Leak risk: Browser DevTools access reveals private profile status of filtered actors;
  is_private, is_following, visibility reason exposed for posts not shown in feed
Severity: MEDIUM
Recommended mitigation: Gate includeDebug behind import.meta.env.DEV at fetchCentralFeedPage.js call site
```

### DEBUG LEAKAGE WARNING — unconditional @debuggers imports

```
Location: CentralFeedScreen.jsx:16-17, useCentralFeed.js:16, fetchFeedPage.pipeline.js:22
Current behavior: @debuggers/feed and @debuggers/identity modules imported unconditionally in production files
Leak risk: If tree-shaking fails, debug profiler (including actorId session data) ships in production bundle
Severity: MEDIUM
Recommended mitigation: Move @debuggers imports inside DEV-conditional blocks or dynamic imports
```

---

## FEED CONTAMINATION / VCSM-SPECIFIC RISK ASSESSMENT

### Visibility Gate Integrity

The app-layer visibility gate (`resolveFeedRowVisibilityModel`) is the primary mechanism for:
- Private profile enforcement (profile.private flag)
- Block enforcement (blockedActorSet built from cached block rows)
- VPORT lifecycle enforcement (vportEntry.is_active check)

**Risk:** Private profile enforcement is entirely app-layer. If `blockedActorSet` or `followedActorSet` is stale (60s TTL), visibility decisions are stale for up to 60 seconds. There is no RLS-level enforcement of the private profile rule — if a caller bypasses the normalization model and queries `vc.posts` directly via the Supabase client, private posts would be visible (assuming RLS allows it).

**Classification:** RLS ASSUMED — private post visibility relies on app-layer model; RLS policy on vc.posts for private actors is not verified.

### Actor Ownership Risk Assessment

No feed write path attempts to write posts as another actor. The single write surface (`vc.actor_onboarding_steps`) is low-sensitivity. No evidence of feed contamination vectors in current source.

---

## MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-FEED-001 — BEHAVIOR.md placeholder | No declared invariants to enforce | Documentation | P1 | Documentation | LOGAN |
| VEN-FEED-003 — actorId as userId in debug controller | Incorrect ownership detection in debug panel | Controller | P3 | App | DEADPOOL |
| VEN-FEED-004 — listActorPosts discards viewerActorId | Illusory authorization; RLS-only | Controller | P2 | App | IRONMAN |
| VEN-FEED-005 — vport.profiles RLS (unverifiable) | vport posts hidden for non-owners | RLS | P2 | DB | CARNAGE |
| BW-FEED-001 — ctrlMarkWelcomeCardSeen no ownership check | Write path without session binding | Controller | P1 | App | IRONMAN |
| BW-FEED-002 — Hook actorId not session-bound | Hook accepts caller-controlled identity | Controller | P2 | App | IRONMAN |
| BW-FEED-005 — actor_onboarding_steps RLS unverified | Write surface RLS unknown | RLS | P2 | DB | CARNAGE |
| BW-FEED-006 — 60s stale cache visibility | Stale block/follow → stale visibility | Cache | P3 | App | IRONMAN |
| BW-FEED-007 — Share URL raw UUID | Platform invariant violation; post enumeration | UI | P2 | App | IRONMAN |
| VEN-FEED-007 (new) — filterDebugRows in production cache | Private profile flags in client cache | Controller | P1 | App | ELEKTRA |
| VEN-FEED-008 (new) — Unconditional @debuggers imports | Debug modules in production bundle risk | Software | P2 | App | ELEKTRA |
| VEN-FEED-009 (new) — useFeed.adapter.js frozen on legacy hook | Adapter boundary integrity failure | Controller | P1 | App | IRONMAN |

---

## FINDING STATUS SUMMARY

| Finding ID | Severity | Description | Status |
|---|---|---|---|
| VEN-FEED-001 | HIGH | BEHAVIOR.md is a placeholder — no §5/§9 contract | STILL_OPEN_SOURCE_VERIFIED |
| VEN-FEED-002 | MEDIUM | Unguarded console.log in pipeline:137 | CLOSED_SOURCE_VERIFIED — prior finding was incorrect |
| VEN-FEED-003 | LOW | actorId as userId in debug controller (DEV-only) | STILL_OPEN_SOURCE_VERIFIED |
| VEN-FEED-004 | MEDIUM | listActorPosts discards viewerActorId — illusory auth | STILL_OPEN_SOURCE_VERIFIED |
| VEN-FEED-005 | HIGH | vport.profiles owner-only RLS — unverifiable from source | NOT_VERIFIABLE_SOURCE_MISSING |
| VEN-FEED-006 | LOW | null realmId "exposes all realms" — prior finding incorrect | CLOSED_SOURCE_VERIFIED — null returns empty, not all realms |
| BW-FEED-001 | HIGH | ctrlMarkWelcomeCardSeen no ownership check | STILL_OPEN_SOURCE_VERIFIED |
| BW-FEED-002 | MEDIUM | Feed hooks no session binding at hook layer | STILL_OPEN_SOURCE_VERIFIED |
| BW-FEED-003 | MEDIUM | getDebugPrivacyRowsController no production gate | CLOSED_SOURCE_VERIFIED |
| BW-FEED-004 | LOW | actorId as userId in debug controller (confirms VEN-FEED-003) | STILL_OPEN_SOURCE_VERIFIED |
| BW-FEED-005 | MEDIUM | actor_onboarding_steps write RLS unverified | NOT_VERIFIABLE_SOURCE_MISSING |
| BW-FEED-006 | LOW | 60s stale cache visibility decisions | STILL_OPEN_SOURCE_VERIFIED |
| BW-FEED-007 | MEDIUM | Share URL with raw UUID postId | STILL_OPEN_SOURCE_VERIFIED |
| BW-FEED-008 | HIGH | getDebugPrivacyRowsController exposes privacy in production — THOR BLOCKER | CLOSED_SOURCE_VERIFIED — **THOR BLOCKER RESOLVED** |
| VEN-FEED-007 (new) | MEDIUM | filterDebugRows with private flags in production React Query cache | NEW FINDING |
| VEN-FEED-008 (new) | MEDIUM | Unconditional @debuggers imports in production-facing modules | NEW FINDING |
| VEN-FEED-009 (new) | HIGH | useFeed.adapter.js frozen on legacy hook — boundary integrity failure | NEW FINDING |

**Closed this run:** VEN-FEED-002, VEN-FEED-006, BW-FEED-003, BW-FEED-008
**Still open:** VEN-FEED-001, VEN-FEED-003, VEN-FEED-004, BW-FEED-001, BW-FEED-002, BW-FEED-004, BW-FEED-006, BW-FEED-007
**Not verifiable:** VEN-FEED-005, BW-FEED-005
**New findings:** VEN-FEED-007, VEN-FEED-008, VEN-FEED-009

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VEN-FEED-001 (missing behavior contract) |
| Asset Security | 2 | VEN-FEED-007 (private flags in cache), BW-FEED-007 (UUID in URLs) |
| Security Architecture and Engineering | 4 | VEN-FEED-009 (adapter), VEN-FEED-008 (debugger imports), BW-FEED-002 (hook session binding), VEN-FEED-005 (RLS assumed) |
| Communication and Network Security | 0 | Not applicable to feed — no Edge Function or external API exposure identified |
| Identity and Access Management | 4 | VEN-FEED-004 (viewerActorId discarded), BW-FEED-001 (welcome card no ownership), VEN-FEED-003 (actorId/userId confusion), BW-FEED-005 (RLS unverified) |
| Security Assessment and Testing | 1 | 0 tests on feed pipeline (from ARCHITECT) — not a direct VENOM finding but coverage gap noted |
| Security Operations | 3 | VEN-FEED-008 (debug module imports), VEN-FEED-007 (filterDebugRows in cache), BW-FEED-006 (stale cache visibility) |
| Software Development Security | 2 | VEN-FEED-008 (unconditional debug imports), VEN-FEED-009 (frozen adapter boundary) |

**Uncovered domains:** Communication and Network Security — not applicable; feed is a client-side read layer with no Edge Functions or external API exposure.

---

## THOR GATE ASSESSMENT

**Prior THOR Release Blocker:** BW-FEED-008 — **CLOSED_SOURCE_VERIFIED** — THOR BLOCKER IS RESOLVED

**Remaining open findings by severity:**
- HIGH: VEN-FEED-001 (BEHAVIOR.md), VEN-FEED-005 (unverifiable), BW-FEED-001 (write ownership), VEN-FEED-009 (adapter)
- MEDIUM: VEN-FEED-004, BW-FEED-002, BW-FEED-005 (unverifiable), BW-FEED-007, VEN-FEED-007, VEN-FEED-008
- LOW: VEN-FEED-003, BW-FEED-004, BW-FEED-006

**THOR recommendation:**
- BW-FEED-001 (HIGH — write path with no ownership check on actor_onboarding_steps) → warrants THOR consideration before release
- VEN-FEED-005 (HIGH — RLS unverifiable from source) → DB verification required before THOR can clear
- VEN-FEED-009 (HIGH — adapter boundary frozen) → structural risk; IRONMAN review required before THOR

**THOR GATE STATUS:** CONDITIONAL — three HIGH findings remain open or unverifiable; DB review (CARNAGE) and IRONMAN review required before a clean THOR gate is possible. BW-FEED-008 blocker is resolved.

---

## VENOM COMPLETION CHECK

- [x] Loaded boundary isolation contract
- [x] Stayed read-only — no writes to source code
- [x] Identified trust boundaries
- [x] Traced auth and authorization chains
- [x] Inspected identity surfaces
- [x] Classified exploitability for each finding
- [x] Classified blast radius for each finding
- [x] Classified platform surface for each finding
- [x] Classified RLS dependency for each finding
- [x] Mapped contract violations
- [x] Mapped CISSP domains
- [x] Included mitigation plan table
- [x] Included CISSP summary table
- [x] Stated uncovered domains (Communication and Network Security — not applicable)
- [x] BLIND REVERIFY CHECK table present — all 5 checks PASS
- [x] SOURCE_REVERIFY_BIAS_DETECTED: NOT EMITTED
- [x] All prior findings classified with required status values
- [x] Persisted to approved audit path
- [ ] Write 2 — SECURITY.md update — **NEXT STEP**
