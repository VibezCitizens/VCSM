# THOR RELEASE READINESS REPORT
**Date:** 2026-05-10 01:30
**Application Scope:** VCSM + ENGINE (chat)
**Reviewer:** THOR (read-only)
**Source signals:** VENOM (full-scan + legal + private-block + post-system), ARCHITECT (ToS + block/follow), KRAVEN (block/follow performance), CARNAGE migrations (staged), VENOM legal-fixes verification

---

## Release Readiness: GO WITH CAUTION

**Not a clean GO.** Three items require resolution before a production deployment is safe. All other findings are tracked, understood, and carry accepted or deferred risk.

---

## Critical Risks

### CRIT-01 — Migration 02 will fail in production mid-execution
**Source:** VENOM legal-fixes-verification — HIGH finding
**File:** `zNOTFORPRODUCTION/_ACTIVE/planning/carnage_migrations/20260510_02_age_verification_consent_type.sql`

Migration 02 updates the `CHECK` constraint on `platform.user_consents` to add `'age_verification'`, then attempts to `INSERT` a seed row into `platform.legal_documents` with `document_type = 'age_verification'`. The `legal_documents` table has its own independent CHECK constraint (`legal_documents_document_type_check`) that does **not** include `'age_verification'`. The migration will succeed on `user_consents` but immediately fail on the INSERT, leaving the system in a split state:
- `user_consents` accepts `age_verification` consent type
- `legal_documents` has no row for it
- Any code that fetches active docs and tries to record age verification consent will throw a FK violation

**Resolution required:** Add `DROP CONSTRAINT / ADD CONSTRAINT` step on `legal_documents` before the seed INSERT. Must be patched before applying.

---

### CRIT-02 — Feed block/follow cache invalidation not wired (privacy correctness failure)
**Source:** KRAVEN Finding 1+2 (HIGH), VENOM private-block Finding 004 (HIGH)
**Files:** `engines not applicable — app layer:` `apps/VCSM/src/features/block/controllers/blockActor.controller.js`, `apps/VCSM/src/features/social/friend/subscribe/controllers/unsubscribe.controller.js`

Four cache invalidation functions were written and exported but have **zero callers** across the entire codebase:
- `invalidateFeedBlockCache(viewerActorId)` — `feed.read.blockRows.dal.js`
- `invalidateFeedFollowCache(viewerActorId)` — `feed.read.followRows.dal.js`
- `invalidateActorsBundleCache()` — `feed.read.actorsBundle.dal.js`
- `invalidateActorPrivacyCache(actorId)` — `social/privacy/dal/actorPrivacy.dal.js`

Confirmed consequences:
- **After block:** Blocked actor's posts remain visible in feed for up to 60 seconds (block write succeeds in DB, cache serves stale state)
- **After unfollow from private account:** The just-unfollowed actor's private posts remain visible for up to 60 seconds — a live privacy disclosure window
- **After privacy toggle (public → private):** Non-followers see the newly-private actor's posts for up to 30 seconds

The unfollow→private-content case is the most severe: the user intent (revoke access) is not honored until TTL expires.

**Resolution required:** Wire `invalidateFeedBlockCache` into `blockActorController` and `unblockActorController`. Wire `invalidateFeedFollowCache` into `ctrlUnsubscribe`. Wire `invalidateActorsBundleCache` and `invalidateActorPrivacyCache` into the privacy settings write path.

---

### CRIT-03 — Carnage migrations 01 and 03 not yet applied to production DB
**Source:** CARNAGE migration files, VENOM legal-fixes-verification
**Files:**
- `20260510_01_user_consents_immutability_and_grant.sql` — STAGED, not applied
- `20260510_03_accepted_at_server_default.sql` — STAGED, not applied

Migration 01 adds:
- `GRANT INSERT ON platform.user_consents TO authenticated` — **required for any consent write to succeed**
- RESTRICTIVE `deny UPDATE` and `deny DELETE` policies — consent immutability enforcement
- Trigger `trg_prevent_consent_audit_mutation` — immutability backstop for service_role bypasses

Without migration 01, the entire re-consent flow is broken — `dalRecordLegalAcceptance` will fail silently or throw a permissions error when inserting consent rows for existing users.

**Resolution required:** Apply migration 01 and migration 03 before deploying the legal consent overhaul. Apply corrected migration 02 after fixing CRIT-01.

---

## High Risks

### HIGH-01 — Feed follow cache page-scoped, not graph-scoped
**Source:** KRAVEN Finding 5
Cache hit rate for follow rows degrades with feed diversity. Each new feed page with different actor IDs triggers a cache miss. Users following 200+ actors effectively get a DB read on every page scroll. Not a correctness issue but a throughput concern at scale.

### HIGH-02 — Block list enumeration via fetchActorsWhoBlockedMe
**Source:** VENOM private-block Finding 001
`fetchActorsWhoBlockedMe(actorId)` accepts any actorId with no ownership assertion. An authenticated user can enumerate who has blocked any actor — violating the concealment intent of the block system. Mitigation requires RLS policy on `moderation.blocks`: `USING (blocker_actor_id = auth.uid()::uuid OR blocked_actor_id = auth.uid()::uuid)`.

### HIGH-03 — Post mention actorIds not validated against DB before notification dispatch
**Source:** VENOM post-system Finding-02
`createPost.controller.js` takes `mentionsResolved[].actorId` from client input and dispatches notifications to those IDs without DB validation. An authenticated user can spam arbitrary actorIds with mention notifications or probe for valid actor IDs.

### HIGH-04 — Post detail direct URL bypass for private actor posts
**Source:** VENOM private-block Finding 006 (from excerpt)
`/post/:postId` fetches the post with no viewer context, no follow check, no privacy gate. A visitor who knows a post ID can read it directly even if the author's profile is private.

### HIGH-05 — deleteComment ownerless export in comments.dal.js
**Source:** VENOM post-system Finding-01
`deleteComment(commentId)` in `comments.dal.js` is exported without an actorId parameter and without ownership enforcement. It is not currently called by any controller (the correct `softDeleteCommentDAL` is used). The export remains as a footgun — any future accidental import bypasses all comment ownership.

### HIGH-06 — moderation.moderators migration pending
**Source:** VENOM full-scan F-02, VENOM remediation report
Moderation authorization still routes through `learning.platform_admins`. The code side (F-01) is fixed — authorization is now in the controller layer, DAL returns boolean only. But the `moderation.moderators` table does not exist yet. Until the migration runs, any actor in `learning.platform_admins` is also a VCSM moderator. The cross-domain privilege coupling remains.

### HIGH-07 — invalidateConsentCache composite key mismatch
**Source:** VENOM legal-fixes-verification, MEDIUM finding
`invalidateConsentCache(userId)` is called with just `userId`, but the cache stores keys as `${userId}:${appId}`. The Map.delete() on a non-matching key is a no-op. After a user re-consents, the cache entry is never removed. The user's consent state remains stale for up to 90 seconds, potentially causing a double-gate loop on navigation.

---

## Medium Risks

### MED-01 — Wanders RLS and guest auth boundary unaudited
**Source:** VENOM full-scan F-10, remediation report
`wandersSupabaseClient.js` creates an isolated guest auth context keyed by localStorage device key. The RLS policies on `wanders.*` tables have not been audited. It is unknown whether `x-client-key` enforcement exists at the DB level. Guest write surfaces may be broader than intended.

### MED-02 — Privacy cache not invalidated on privacy settings write
Covered under CRIT-02 (`invalidateActorPrivacyCache` and `invalidateActorsBundleCache` not wired). Specifically: after a user goes private, their feed posts remain visible to non-followers for up to 30 seconds.

### MED-03 — unblockActorController has no pre-read ownership check
**Source:** VENOM private-block Finding 003
`unblockActorController` does not verify the caller owns the block row before calling the RPC. `blockActorController` has `checkBlockStatus()` pre-read; unblock lacks this. Mitigated by RPC-level auth enforcement if present.

### MED-04 — ActorActionsMenu receives viewerActorId as prop (no internal session binding)
**Source:** VENOM private-block Finding 002
UI adapter `ActorActionsMenu.jsx` receives `viewerActorId` as a caller-supplied prop rather than deriving it from `useIdentity()` internally. Controller assertion now protects block/unblock paths, but the surface remains fragile.

### MED-05 — Console.log calls in chat engine startDirectConversation (production-visible)
**Source:** Code inspection — `engines/chat/src/controller/startDirectConversation.controller.js:43,52,73,84`
Four unguarded `console.log` calls in the chat engine's conversation creation controller include internal actor IDs, realm IDs, and conversation IDs. These are production-visible in any environment that uses the engine. The engine has no `import.meta.env.DEV` equivalent as it is framework-agnostic — a debug flag or `config.debug` approach is needed.

### MED-06 — readFollowState.dal.js is a permanent stub (profile.isFollowing always false)
**Source:** ARCHITECT block/follow audit, Gap 2
`features/profiles/dal/readFollowState.dal.js` returns `{ is_active: false }` unconditionally. The `isFollowing` field on the `getProfileView.controller.js` response is always false regardless of actual follow state. Profile gate works correctly via its own `useFollowStatus` path, but any code consuming `profile.isFollowing` from the controller result gets wrong data.

### MED-07 — deleted_by_actor_id returned in feed pipeline
**Source:** VENOM post-system Finding-03
`readFeedPostsPage` selects `deleted_by_actor_id` as part of the post row shape. This internal moderation metadata (identifying the actor who deleted a post) flows through the full feed pipeline to the client — potentially revealing moderator identities.

### MED-08 — CSS cross-feature import (feed → profiles)
**Source:** ARCHITECT block/follow audit, Gap 5
`CentralFeedScreen.jsx` imports `@/features/profiles/styles/profiles-modern.css` — a direct style dependency across feature boundaries, bypassing the adapter layer.

---

## Low Risks

### LOW-01 — useBlockActorAction exposes blockerActorId as caller-supplied parameter
**Source:** VENOM full-scan F-13
Hook API allows callers to supply `blockerActorId` rather than deriving it from session internally. Controller assertion now protects against misuse, but API ergonomics remain weaker than necessary.

### LOW-02 — Cache TTL mismatch: actor bundle (30s) vs block/follow rows (60s)
**Source:** KRAVEN Finding 9
Visibility decisions can be computed from data up to 30 seconds apart in staleness. Unlikely to cause user-visible issues but should be documented.

### LOW-03 — block feature index imports in profile controllers (not adapter boundary)
**Source:** ARCHITECT block/follow audit
`features/profiles/controller/friends/getTopFriendActorIds.controller.js` and `getTopFriendCandidates.controller.js` import from `@/features/block` (the index.js) rather than via `adapters/`. Soft contract violation.

### LOW-04 — F-14: appendIOSProdDebugLog logs userId in ProtectedRoute
**Source:** VENOM full-scan F-14
Correctly production-gated (`IS_PROD` check). No immediate action.

---

## Architecture Findings

**Compliant:**
- Layer order (DAL → Model → Controller → Hook → Screen) observed across all reviewed features
- Cross-feature access via adapters enforced in the block, follow, social, and legal systems
- F-01 FIXED: Authorization logic moved out of DAL into controller layer (`assertModerationAccess.controller.js`)
- F-04 FIXED: `OwnerOnlyDashboardGuard` route-level ownership gate added — all 14 dashboard routes protected
- F-05 FIXED: `vportTeamAccess.controller.js` and `vportLeads.controller.js` — `assertCallerOwns` + `callerActorId` session binding in place
- F-03 FIXED: `ctrlBlockActor`/`ctrlUnblockActor` now require `callerActorId` matching session
- Chat engine correctly uses DI (`configureChatEngine`) — no app-specific imports in engine source
- `OwnerOnlyDashboardGuard` nested inside `BlockedVportGuard` — two independent route-layer checks before any dashboard screen renders

**Violations / gaps:**
- CSS import across feature boundary: `CentralFeedScreen` → `profiles-modern.css` (MED-08)
- Block feature index used as adapter substitute in profile friend controllers (LOW-03)
- readFollowState.dal.js stub never replaced (MED-06)

---

## Performance Findings

**Accepted costs with known bounds:**
- Block write: 2 serial DB round-trips (idempotency check + RPC) — acceptable
- Follow write: 2 serial round-trips on happy path (pre-flight + upsert) — acceptable
- Unsubscribe: 2 sequential writes, can be parallelized (KRAVEN Finding 4 — deferred)
- Feed pipeline: 5 parallel DAL reads per page — efficient, no concern

**Must-fix before release:**
- Cache invalidation gap (CRIT-02) — the 60s window for block and unfollow is not a performance issue; it is a correctness and privacy failure

**Deferred (not release-blocking):**
- Follow rows cache page-scoped vs graph-scoped (KRAVEN Finding 3)
- Follow pre-flight uncached follow status check (KRAVEN Finding 6)
- Block query bidirectional OR — confirm dual-index coverage on `moderation.blocks` table (KRAVEN Finding 7)
- Dual privacy read race on cold profile page load (KRAVEN Finding 4 — requires in-flight deduplication)

---

## Security Findings

### Applied fixes (verified)
| Finding | Severity | Status |
|---|---|---|
| F-01: Auth logic in DAL | CRITICAL | ✅ FIXED — moved to assertModerationAccess.controller.js |
| F-03: Block controller no session binding | HIGH | ✅ FIXED — callerActorId assertion added to ctrlBlockActor/ctrlUnblockActor |
| F-04: Dashboard route guard missing | HIGH | ✅ FIXED — OwnerOnlyDashboardGuard wrapping all dashboard routes |
| F-05: Dashboard controllers no caller binding | HIGH | ✅ FIXED — team + leads controllers + hooks wired |
| F-06: Join invite no ownership check | HIGH | ✅ FIXED — useExistingBarberVportAndAccept now verifies ownership |
| F-07: profileId in identity debug payload | MEDIUM | ✅ FIXED |
| F-08: isOwner profile_id type mismatch | MEDIUM | ✅ FIXED — uses myActorIds.includes() |
| F-09: profile_id/vport_id in debug panel | MEDIUM | ✅ FIXED — columns removed |
| F-11: Unguarded console.error (primary) | MEDIUM | ✅ FIXED — profile.write.dal, usePendingFollowRequestActions, Blocks.controller, wandersSupabaseClient |
| F-12: profile_id in joinInvite RESOURCE_COLS | MEDIUM | ✅ FIXED |
| Legal: fail-closed gate | CRITICAL | ✅ VERIFIED — gateError blocks all outlet rendering |
| Legal: synthetic age data | CRITICAL | ✅ VERIFIED — syntheticAdultBirthdate removed |
| Legal: accepted_at from server | HIGH | ✅ VERIFIED — DB trigger + no client timestamp |
| Legal: ip_address client-side capture | MEDIUM | ✅ VERIFIED — getPublicIp not imported anywhere |
| Legal: ToS/Privacy dead links | MEDIUM | ✅ VERIFIED — correct hrefs in JoinSignupForm |
| Legal: cache key includes appId | MEDIUM | ✅ VERIFIED |
| Legal: LegalDocumentScreen lazy-split | MEDIUM | ✅ VERIFIED |
| Legal: recordSignupConsent adapter boundary | LOW | ✅ VERIFIED |

### Open findings not yet fixed
| Finding | Severity | Source | Status |
|---|---|---|---|
| CRIT-01: Migration 02 constraint failure | CRITICAL | VENOM legal | MUST FIX before migration |
| CRIT-02: Feed cache not invalidated (block/unfollow) | HIGH | VENOM + KRAVEN | MUST FIX before release |
| CRIT-03: Migrations 01+03 not applied | HIGH | CARNAGE | MUST APPLY before deploy |
| HIGH-02: Block list enumeration (fetchActorsWhoBlockedMe) | HIGH | VENOM block | OPEN — needs RLS policy |
| HIGH-03: Post mention actorIds unvalidated | HIGH | VENOM post | OPEN |
| HIGH-04: Post detail direct URL bypass (private actors) | HIGH | VENOM block | OPEN |
| HIGH-05: deleteComment ownerless export | HIGH | VENOM post | OPEN — remove export |
| HIGH-06: moderation.moderators migration pending | HIGH | VENOM full-scan F-02 | OPEN — migration written, not staged |
| HIGH-07: invalidateConsentCache key mismatch | MEDIUM | VENOM legal | OPEN — one-line fix |
| MED-01: Wanders RLS unaudited | MEDIUM | VENOM F-10 | DEFERRED — DB command needed |
| MED-03: unblockActorController no pre-check | MEDIUM | VENOM block | OPEN |
| MED-05: console.log in chat engine (prod) | MEDIUM | Code inspection | OPEN |
| MED-06: readFollowState.dal.js stub | MEDIUM | ARCHITECT | DEFERRED — technical debt |
| MED-07: deleted_by_actor_id in feed pipeline | MEDIUM | VENOM post | OPEN |
| F-13: useBlockActorAction prop-based blockerActorId | LOW | VENOM full-scan | ACCEPTED — controller protected |

---

## Migration Findings

| Migration | Status | Risk |
|---|---|---|
| `20260510_01_user_consents_immutability_and_grant.sql` | STAGED — NOT APPLIED | **MUST APPLY** — without this, consent inserts fail for existing users |
| `20260510_02_age_verification_consent_type.sql` | STAGED — BROKEN | **MUST FIX CONSTRAINT on legal_documents before applying** |
| `20260510_03_accepted_at_server_default.sql` | STAGED — NOT APPLIED | **MUST APPLY** — server-side timestamp enforcement |
| `moderation.moderators` table migration | WRITTEN IN AUDIT REPORT — NOT YET STAGED | DEFERRED — current system falls back to learning.platform_admins |

**DB-first deployment is mandatory.** Migrations must be applied before the app code ships. The legal consent code assumes migration 01 RLS grants are in place. Without them, authenticated users cannot write consent rows.

**Rollback notes:**
- Migration 01 can be rolled back: drop policies + trigger. No data changes.
- Migration 02 (after fix): drop the new constraint and remove seed row. No data changes.
- Migration 03: drop trigger + function. No data changes.
- All three migrations are schema-only, no data mutations. Safe to reverse.

---

## Documentation Findings

**Persisted:**
- `2026-05-10_00-00_venom_vcsm-full-deep-scan.md` — 14-finding full VCSM security scan
- `2026-05-10_01-00_venom_vcsm-full-scan-remediation.md` — remediation log for F-01 through F-12
- `2026-05-10_venom_legal-fixes-verification.md` — verified legal fixes
- `2026-05-10_venom_terms-of-service-logic.md` — ToS security audit
- `2026-05-10_venom_private-block-profile-logic.md` — block/follow/privacy security audit
- `2026-05-10_venom_post-system-deep.md` — post system security audit
- `2026-05-10_architect_private-block-profile-logic.md` — block/follow architecture map
- `2026-05-10_architect_terms-of-service-logic.md` — ToS architecture map
- `2026-05-10_kraven_private-block-profile-logic.md` — block/follow performance audit

**Missing:**
- No LOGAN doc update recorded for the `OwnerOnlyDashboardGuard` addition — dashboard security model is undocumented
- No release notes document for this release batch
- No KRAVEN performance audit for the post system (only block/follow scoped)
- Wanders architecture not documented — guest auth handoff flow has no formal spec

---

## Ownership Findings

| Risk | Owner | System |
|---|---|---|
| CRIT-01: Migration 02 constraint fix | Carnage/DB | DB |
| CRIT-02: Feed cache invalidation wiring | Wolverine | VCSM app |
| CRIT-03: Apply migrations 01 + 03 | DB | DB |
| HIGH-02: Block list enumeration RLS | Carnage/DB | DB |
| HIGH-03: Post mention actorId validation | Wolverine | VCSM app |
| HIGH-04: Post detail direct URL bypass | Wolverine | VCSM app |
| HIGH-05: deleteComment export removal | Wolverine | VCSM app |
| HIGH-06: moderation.moderators migration | Carnage | DB |
| HIGH-07: invalidateConsentCache key fix | Wolverine | VCSM app |
| MED-01: Wanders RLS audit | DB | DB |
| MED-03: unblock pre-check | Wolverine | VCSM app |
| MED-05: chat engine console.log | Engine owner | ENGINE |
| MED-07: deleted_by_actor_id in feed | Wolverine | VCSM app |

---

## Recommended Actions Before Release

### Must-do (blocking)
1. **Fix migration 02** — add `DROP/ADD CONSTRAINT` on `platform.legal_documents` before the `age_verification` seed INSERT. Apply only after fix is verified.
2. **Apply migration 01** — grants + immutability policies for `platform.user_consents`. Required for re-consent flow to function.
3. **Apply migration 03** — `accepted_at` server-default trigger. Apply after migration 01.
4. **Wire feed cache invalidation** — call `invalidateFeedBlockCache(viewerActorId)` from `blockActorController` and `unblockActorController`; call `invalidateFeedFollowCache(viewerActorId)` from `ctrlUnsubscribe`. These functions already exist and are correct — they just need callers. Also wire `invalidateActorPrivacyCache` from the privacy settings write path.
5. **Fix invalidateConsentCache composite key** — change `consentCache.invalidate(userId)` to `consentCache.invalidate(\`${userId}:${appId}\`)`.

### Should-do (high priority, can ship with known risk if timeline is tight)
6. **Remove deleteComment ownerless export** from `comments.dal.js` — it is unused but a permanent footgun.
7. **Remove deleted_by_actor_id from feed pipeline select** — internal moderation metadata should not reach clients.
8. **Validate post mention actorIds via DB lookup** before notification dispatch in `createPost.controller.js`.
9. **Add RLS on moderation.blocks** to prevent block list enumeration by third parties.
10. **Guard console.log in chat engine** (`startDirectConversation.controller.js`) behind a configurable debug flag.

### Can defer (next sprint)
11. Stage and apply `moderation.moderators` migration to decouple moderation from learning schema.
12. Audit Wanders RLS policies via `/DB` command.
13. Fix `readFollowState.dal.js` stub to return actual follow state.
14. Parallelize unsubscribe writes (KRAVEN Finding 4).
15. Fix post detail (`/post/:postId`) to enforce privacy gate on direct URL access.
16. Add in-flight deduplication to privacy DAL (KRAVEN Finding 6).
17. Redesign follow rows cache from page-scoped to viewer-graph-scoped (KRAVEN Finding 5).
18. Document OwnerOnlyDashboardGuard in LOGAN.

---

## Deployment Order

```
1. DB MIGRATIONS (must complete before app deploy)
   a. Apply migration 01 (user_consents immutability + grant)
   b. Apply FIXED migration 02 (age_verification consent type — fix constraint first)
   c. Apply migration 03 (accepted_at server-default trigger)
   d. Verify all three with post-migration SQL checks provided in migration files

2. ENGINE (no changes required this release)
   — chat engine has no pending migrations or code changes for this release
   — console.log hardening is deferred

3. VCSM APP DEPLOY
   — legal consent gate overhaul
   — private/block/follow enforcement
   — VENOM remediation: dashboard guard, controller session binding, identity surface cleanup
   — moderation auth layer refactor (F-01)

4. SMOKE TESTS (see checklist below)
```

---

## Smoke Test Checklist

### Legal consent gate
- [ ] New user registers → consent gate shown → accepts → admitted to /feed
- [ ] Existing user whose consent is current → no gate → admitted directly
- [ ] User whose consent is outdated → gate shown → accepts → admitted
- [ ] **Supabase consent query fails (simulate error)** → gate shows "Verification Unavailable" → user blocked → retry works
- [ ] New user (email confirm required) → verifies email → consent gate shown on first protected route entry

### Post privacy — direct URL
- [ ] Navigate to `/post/<id>` authored by a public actor → post renders ✅
- [ ] Navigate to `/post/<id>` authored by a private actor you do not follow → **should be gated** (currently HIGH-04 risk — may not pass)
- [ ] Navigate to `/post/<id>` that is soft-deleted → post not shown

### Profile private posts
- [ ] Actor sets profile to private → non-follower cannot see posts in feed (allow 30s cache window if not yet wired)
- [ ] Actor sets profile to private → non-follower visits profile → blocked gate shown
- [ ] Actor sets profile to private → follower can still see posts in feed

### Block/follow cache invalidation
- [ ] Block actor → their posts disappear from feed **immediately** (not after 60s) — requires CRIT-02 fix
- [ ] Unfollow private actor → their posts disappear from feed **immediately** — requires CRIT-02 fix
- [ ] Follow private actor (they accept) → posts appear in feed within next feed refresh

### Messaging block (both directions)
- [ ] Actor A blocks Actor B → Actor B cannot send message to Actor A (throws at sendMessage controller)
- [ ] Actor A blocks Actor B → Actor A cannot start new conversation with Actor B (throws at startDirectConversation)
- [ ] Unblock → messaging allowed again
- [ ] Chat engine with no checkBlockRelation configured → fails closed (no conversation allowed)

### Dashboard owner route guard
- [ ] Owner navigates to `/actor/<own-actorId>/dashboard/leads` → screen loads
- [ ] Non-owner navigates to `/actor/<other-actorId>/dashboard/leads` → redirects to /feed
- [ ] Non-owner navigates to `/actor/<other-actorId>/dashboard/team` → redirects to /feed
- [ ] Unauthenticated user navigates to any dashboard URL → redirected to login

### Moderation action permission
- [ ] Non-moderator attempts `hideReportedObjectController` → FORBIDDEN thrown at controller layer
- [ ] Moderator (in learning.platform_admins) → action succeeds

### Legal document release scripts
- [ ] `platform.public_legal_documents_v` returns active ToS and Privacy Policy rows for app_key='vcsm'
- [ ] Consent acceptance inserts a row with `accepted_at` set by server trigger, not client
- [ ] Attempting to UPDATE a consent row → rejected by RESTRICTIVE policy + trigger
- [ ] Attempting to DELETE a consent row → rejected by RESTRICTIVE policy

---

## Rollback Plan

### App rollback
- Revert to previous VCSM build. All changes are app-layer only (no RPC changes required for VENOM remediation).
- The `OwnerOnlyDashboardGuard` is additive — removing it reverts to the previous `BlockedVportGuard`-only behavior.
- Controller session binding (`callerActorId` assertions) — if hooks pass `null` for `sessionActorId`, controllers will throw. A rollback must include both the controller changes and the hook changes atomically.

### Engine rollback
- No engine changes in this release. No engine rollback needed.

### DB rollback
- **Migration 01:** `DROP POLICY user_consents_deny_update ON platform.user_consents;`, `DROP POLICY user_consents_deny_delete ON platform.user_consents;`, `DROP TRIGGER trg_prevent_consent_audit_mutation ON platform.user_consents;`, `DROP FUNCTION platform.prevent_consent_audit_mutation();`, `REVOKE INSERT ON platform.user_consents FROM authenticated;`
- **Migration 02 (fixed):** Drop the `age_verification` seed row from `platform.legal_documents`. Revert CHECK constraint on `user_consents` and `legal_documents` if needed.
- **Migration 03:** `DROP TRIGGER trg_enforce_server_accepted_at ON platform.user_consents;`, `DROP FUNCTION platform.enforce_server_accepted_at();`
- All migrations are schema-only. No user data is mutated. Rollbacks are safe.

### Known safe irreversible changes
- `profile_id` removed from `joinInvite.dal.js` RESOURCE_COLS — backward compatible (column still exists in DB, just not fetched)
- `profileId` removed from identity debug event payload — additive removal, safe
- Moderation DAL export rename (`assertModerationAccessDAL` → `isModerationAuthorizedDAL`) — no external callers outside moderation feature

---

## Final Decision

### GO WITH CAUTION

**Rationale:**

The legal consent enforcement overhaul is substantially complete and verified. The VENOM full-scan remediation closed all CRITICAL and HIGH app-layer findings. The dashboard ownership gate is in place. Block and messaging enforcement is wired. The chat engine correctly fails closed on unconfigured block checks.

However, **three items must be resolved before a production deployment is safe:**

1. **Migration 02 will fail mid-execution** and leave the DB in a split state. This is a data integrity issue, not a minor inconvenience.
2. **Feed cache invalidation is not wired.** After an unfollow from a private account, private posts remain visible in the feed for 60 seconds. This is a live privacy disclosure window on a platform that promises privacy controls.
3. **Migrations 01 and 03 must be applied** before the app ships. Without migration 01, re-consent writes will fail for any user who doesn't already have the INSERT grant.

None of these require architectural rethinking. All three have clear, bounded fixes. The recommended path is: fix CRIT-01, apply migrations in order, wire cache invalidation (4 one-line call additions), fix consent cache key mismatch — then this release is production-ready.

---

*THOR is read-only. THOR does not apply fixes, run migrations, or modify code.*
*Report persisted to: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_01-30_thor_vcsm-engine-release-readiness.md`*
