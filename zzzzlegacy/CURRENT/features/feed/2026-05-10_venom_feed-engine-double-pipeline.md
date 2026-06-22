# VENOM Security Audit — Feed Engine Double Pipeline
Date: 2026-05-10
Scope: VCSM — Feed Engine (`apps/VCSM/src/features/feed/`)
Trigger: "do we still have a double line of feed?"
Status: READ-ONLY ANALYSIS — no code changed

---

## VENOM TARGET

```
Feature / Route / Engine: Feed Engine — dual pipeline audit
Application Scope:        VCSM
Reason for review:        Confirm / disprove "double line of feed" and surface
                          any security risk introduced by the parallel pipelines
Primary trust boundary:   Viewer actor identity → post visibility filtering →
                          block / follow / hidden-post enforcement
```

---

## SECURITY SURFACE

```
Entry points:
  /feed  → CentralFeedScreen.jsx → useCentralFeed.js → fetchCentralFeedPage.js
  /posts → PostFeed.screen.jsx   → useFeed.js (via useFeed.adapter.js)
                                 → fetchFeedPage.pipeline.js (direct)

Auth source:        useAuth() / useIdentity() — session-bound
Authorization layer: Client-side pipeline (block/follow/hidden filters)
                     + DB RLS (assumed, not verified in code)
Identity surface:   viewerActorId (passed as prop through pipeline)
Sensitive objects:  vc.posts, moderation.blocks, vc.actor_follows,
                    moderation.actions (hidden posts), vport.profiles,
                    vc.actor_privacy_settings
```

---

## TRUST BOUNDARY TRACE

```
Client input:          actorId / realmId sourced from useIdentity()
Validated at:          useFeed / useCentralFeed (null guard only — UUID format
                       validated downstream in blockRows DAL only)
Identity resolved at:  Pipeline receives viewerActorId as a plain string —
                       never re-verified against the authenticated session
Authorization enforced: Block / follow / hidden post filtered in-process
                        after DB read (client-side enforcement)
Data returned to:      React state / React Query cache → JSX render
```

---

## DIRECT ANSWER

**YES — the double line of feed is still live.**

| Route | Hook | Pipeline | Status |
|---|---|---|---|
| `/feed` | `useCentralFeed` (React Query) | `fetchCentralFeedPage.js` → `fetchFeedPagePipeline` | CURRENT |
| `/posts` | `useFeed` (legacy, via adapter) | `fetchFeedPage.pipeline.js` directly | SHADOW — should be retired |

Both are registered in `app.routes.jsx` lines 100 and 104. Both are publicly navigable. Both call the same `fetchFeedPagePipeline` and hit the same `vc.posts` table. `/posts` is the legacy surface and divergence risk.

---

## FINDINGS

### F1 — HIGH — Double-Pipeline: Two Live Feed Routes With Diverging Security Postures

- **Location:** `apps/VCSM/src/app/routes/protected/app.routes.jsx:100-104`
- **CISSP Primary:** Identity and Access Management
- **CISSP Secondary:** Security Architecture and Engineering, Software Development Security

**Current behavior:**
`/feed` uses `CentralFeedScreen` → `useCentralFeed` (React Query, current).
`/posts` uses `PostFeed.screen.jsx` → `useFeed` (legacy hook via adapter).

Security patches applied to the `useCentralFeed` path may never reach the legacy `/posts` path.

**Risk:** Shadow surface. Exploit attempts against the less-reviewed legacy path succeed even when the current path is hardened.

**Recommended mitigation:**
1. Add a route-level redirect: `/posts` → `/feed`
2. Delete `apps/VCSM/src/features/post/screens/PostFeed.screen.jsx`
3. Delete `apps/VCSM/src/features/feed/adapters/hooks/useFeed.adapter.js`
4. Confirm `useFeed.js` has no other callers, then delete it

**Follow-up command:** Wolverine

---

### F2 — MEDIUM — Unguarded `console.log` in Production Pipeline

- **Location:** `apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js:125-129`
- **CISSP Primary:** Security Operations
- **CISSP Secondary:** Software Development Security

**Current behavior:**
```js
if (debugPostId && pagePostIds.includes(debugPostId)) {
  console.log("[useFeed][mentions][DBG] debugPostId is on this page", {
    debugPostId,
    pagePostIds,
  });
}
```
Not wrapped in `import.meta.env.DEV`. Logs full `pagePostIds` batch to browser console in production if any caller passes `debugPostId`.

**Recommended mitigation:**
```js
if (import.meta.env.DEV && debugPostId && pagePostIds.includes(debugPostId)) {
  console.log(...)
}
```

**Follow-up command:** Wolverine

---

### F3 — MEDIUM — `PostFeed.screen.jsx` Uses Stale Identity Import Path

- **Location:** `apps/VCSM/src/features/post/screens/PostFeed.screen.jsx:7`
- **CISSP Primary:** Identity and Access Management
- **CISSP Secondary:** Software Development Security

**Current behavior:**
```js
// Legacy screen:
import { useIdentity } from "@/state/identity/identityContext";

// Canonical (CentralFeedScreen):
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
```

Two identity resolution paths. If context shape drifts, the legacy screen silently receives incorrect actor identity, meaning block/follow/hidden-post filters are computed against the wrong viewer.

**Recommended mitigation:** Retire the screen (F1). If kept, update import to canonical adapter.

---

### F4 — LOW — `console.warn` Error Leakage in Production

- **Location:** `apps/VCSM/src/features/feed/hooks/useFeed.js:241`
- **CISSP Primary:** Security Operations
- **CISSP Secondary:** Asset Security

```js
console.warn("[useFeed] error", e);
```
Not gated. May expose stack traces, Supabase error payloads, or internal field names.

**Recommended mitigation:** `if (import.meta.env.DEV) console.warn(...)`

---

### F5 — LOW — `profile_id` / `vport_id` Exposed in Debug Controller Return

- **Location:** `apps/VCSM/src/features/feed/controllers/getDebugPrivacyRows.controller.js:72-83`
- **CISSP Primary:** Asset Security
- **CISSP Secondary:** Identity and Access Management

The controller returns `profile_id` and `vport_id` as named fields — both are prohibited identity surfaces per the architecture contract. The panel consuming these is dev-only gated in the screen, but the controller itself is not gated and permanently encodes the violation.

**Recommended mitigation:** Remove `profile_id` and `vport_id` from return shape. If display is needed, scope to a `__dev_only__` wrapper with a DEV guard at the controller.

---

### F6 — MEDIUM — Feed DAL Has No Viewer Auth Anchor (RLS-Only Enforcement)

- **Location:** `apps/VCSM/src/features/feed/dal/feed.read.posts.dal.js`
- **CISSP Primary:** Security Architecture and Engineering
- **CISSP Secondary:** Security Assessment and Testing

`readFeedPostsPage` filters only by `realm_id` and `deleted_at`. The viewer's actorId does not appear in the DB query. Post visibility is enforced in-process (block/follow/hidden) after the read completes. If RLS on `vc.posts` is misconfigured or absent for any role, the DAL returns all posts to any caller. In-process filters reduce render output but cannot undo what was read.

**Recommended mitigation:** Request RLS audit via `/DB`. Confirm authenticated viewer session is enforced at the `vc.posts` table level with no anon policy gap.

**Follow-up command:** /DB

---

## MITIGATION PRIORITY

| Priority | Finding | Action |
|---|---|---|
| 1 | F1 — Double pipeline | Redirect `/posts` → `/feed`, retire legacy screen |
| 2 | F2 — Unguarded console.log | Gate with DEV flag |
| 3 | F6 — RLS assumption | Delegate to /DB for policy audit |
| 4 | F3 — Stale identity import | Fix or retire (covered by F1) |
| 5 | F4 — console.warn in prod | Gate with DEV flag |
| 6 | F5 — prohibited fields in debug return | Remove from return shape |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 0 | No governance/policy violations found |
| Asset Security | 2 | F4 (error leak), F5 (prohibited ID fields) |
| Security Architecture and Engineering | 2 | F1 (shadow surface), F6 (RLS-only enforcement) |
| Communication and Network Security | 0 | Out of scope — no public RPC or storage URL reviewed |
| Identity and Access Management | 3 | F1 (diverging posture), F3 (stale identity path), F5 (prohibited fields) |
| Security Assessment and Testing | 1 | F6 (RLS assumption unverified) |
| Security Operations | 2 | F2 (prod console.log), F4 (prod console.warn) |
| Software Development Security | 3 | F1 (dead legacy surface), F2 (ungated debug), F3 (import drift) |

**Uncovered:** Communication and Network Security — out of scope for this internal feed pipeline audit; no public-facing RPC or storage URL surface was in the reviewed path.

---

VENOM is read-only. No files were modified.
Fixes require explicit Wolverine task authorization.
