---
title: Feed Module — THOR Blockers
status: ACTIVE
feature: feed
module: feed
source: sentry-derived
created: 2026-06-05
updated: 2026-06-05
sentry-report: outputs/2026/06/05/SENTRY/2026-06-05_sentry_feed-compliance.md
---

# feed / modules / feed — THOR BLOCKERS

## Status

2 THOR blockers active. No release of feed-related features should proceed until both are resolved.

These blockers were originally identified by BLACKWIDOW (2026-06-05) and confirmed by SENTRY (2026-06-05).

---

## Active THOR Blockers

### THOR-1 — VEN-PIPE-002: Null realmId Bypasses Realm Filter

| Field | Value |
|---|---|
| ID | VEN-PIPE-002 |
| Severity | HIGH |
| Status | OPEN |
| Classification | EXPLOITABLE |
| Surface | `apps/VCSM/src/features/feed/dal/feed.read.posts.dal.js:30-33` |
| SENTRY Rule Violated | Rule 5 (Visibility Models — upstream realm boundary) |

**Description:**
When `realmId` is null, the `.eq("realm_id", realmId)` filter in `readFeedPostsPage` is skipped. Posts from all realms are returned to the viewer — cross-realm post exposure.

**Impact:**
Viewers in the standard public realm can receive posts from restricted or private realms (e.g., Void Realm). This is a data isolation failure at the DAL boundary, upstream of all client-side visibility models. Visibility models cannot compensate for posts that should never have entered the pipeline.

**Required Fix:**
Enforce non-null realmId in `readFeedPostsPage`. If `realmId` is null, the DAL must throw or return an empty result — never execute an unfiltered query.

**Security Regression Test Required:**
SEC-REG-001 — call `fetchFeedPagePipeline` with `realmId = null`. Assert DAL throws or returns empty. Assert no cross-realm posts returned.

---

### THOR-2 — VEN-PIPE-003: vport.profiles Owner-Only RLS Nulls Vport Bundle for Non-Owners

| Field | Value |
|---|---|
| ID | VEN-PIPE-003 |
| Severity | HIGH |
| Status | OPEN |
| Classification | EXPLOITABLE |
| Surface | `apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js:84-89` |
| SENTRY Rule Violated | Rule 5 (Visibility Models — vport actor resolution path) |

**Description:**
`readActorsBundle` performs a direct SELECT on `vport.profiles`. This table has owner-only RLS: non-owners receive an empty result for a vport's profile row. When `vportMap[rowActorId]` is null, `resolveFeedRowVisibilityModel` returns `visible = false, reason = 'missing_vport_profile'`. This makes ALL vport posts invisible to non-owners — vport actors effectively cannot post to the public feed for non-subscribers.

**Impact:**
Vport actors' posts are rendered invisible to all viewers who do not own that vport. This is a functional regression (vport content never surfaces in the feed) masquerading as an RLS safety feature. The correct fix is to provide a SECURITY DEFINER RPC that can return the public-facing vport profile data without hitting the owner-only policy.

**Required Fix:**
Replace the direct `vport.profiles` SELECT in `readActorsBundle` with a SECURITY DEFINER RPC that returns only public-facing vport profile fields (name, slug, avatar_url, is_active, is_deleted). The RPC bypasses the owner-only RLS for non-sensitive public fields.

**Security Regression Test Required:**
SEC-REG-002 — call pipeline as non-owner viewer for a vport actor. Assert vport posts are visible after RPC fix. Assert current behavior (null bundle → hidden) is the known regression state before fix.

---

## Blocker Resolution Checklist

- [ ] VEN-PIPE-002: Enforce non-null realmId in `readFeedPostsPage` DAL
- [ ] VEN-PIPE-002: Write SEC-REG-001 regression test
- [ ] VEN-PIPE-003: Create SECURITY DEFINER RPC for public vport profile data
- [ ] VEN-PIPE-003: Update `readActorsBundle` to call new RPC instead of direct SELECT
- [ ] VEN-PIPE-003: Write SEC-REG-002 regression test
- [ ] Both: Re-run THOR gate after fixes. All must PASS before any feed-related release.

---

## Prior Blocker Tracking

Both blockers carried forward from BlackWidow 2026-06-05. No new THOR blockers were introduced by this SENTRY run.

No blockers have been resolved since last governance pass.

---

*BLOCKERS.md created by SENTRY, 2026-06-05.*
