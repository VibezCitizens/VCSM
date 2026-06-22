# THOR Release Re-Review — VCSM + ENGINE
Date: 2026-05-10 02:00
Scope: apps/VCSM + engines/chat
Prior report: `2026-05-10_01-30_thor_vcsm-engine-release-readiness.md`
Release topic: Legal consent overhaul, private/block/follow, messaging block, dashboard ownership guard, moderation readiness

---

## Previous Blocker Verification

| Blocker | Original Severity | Status | Evidence |
|---|---|---|---|
| CRIT-01 — Migration 02 missing constraint on `legal_documents` | CRITICAL | **FIXED** | `20260510_02_age_verification_consent_type.sql` now includes `DROP/ADD CONSTRAINT` on `platform.legal_documents` (step 2) before seed INSERT. Both `user_consents` and `legal_documents` CHECK constraints updated to include `'age_verification'`. Seed guarded with `NOT EXISTS`. |
| CRIT-02 — Feed cache invalidation unwired | CRITICAL | **FIXED** | All 4 cache invalidation functions now have callers: `invalidateFeedBlockCache` (4 sites in blockActor.controller.js), `invalidateFeedFollowCache` (2 sites in follow.controller.js, 1 in unsubscribe.controller.js), `invalidateActorPrivacyCache` + `invalidateActorBundleEntry` (new actorPrivacy.controller.js). Cross-feature boundary bridged via `feedCache.adapter.js`. |
| CRIT-03 — Migrations 01 and 03 DB application unverifiable | CRITICAL | **CANNOT VERIFY** | Migration SQL files are staged at `zNOTFORPRODUCTION/_ACTIVE/planning/carnage_migrations/`. DB application state cannot be confirmed from code inspection. Manual DB verification required before deployment. |

---

## Additional Fixes Verified (Beyond Original Blockers)

| Finding | Prior Status | Current Status | Evidence |
|---|---|---|---|
| HIGH-07 — `invalidateConsentCache` composite key mismatch | OPEN | **FIXED** | `legalConsent.controller.js`: function now takes `(userId, appId)`, uses `${userId}:${appId}` composite key when both present, `invalidateAll()` fallback when either missing. |
| MED-07 — `deleted_by_actor_id` in feed post select | OPEN | **FIXED** | `feed.read.posts.dal.js`: `deleted_by_actor_id` removed from `.select()` column list. |
| MED-03 — `unblockActorController` no pre-ownership check | OPEN | **FIXED** | `blockActor.controller.js`: `unblockActorController` now calls `checkBlockStatus(...)` before `unblockActorDAL`, returns idempotently if no active block found. |
| KRAVEN-4 — `ctrlUnsubscribe` serial DB writes | OPEN | **FIXED** | `unsubscribe.controller.js`: `dalDeactivateFollow` and `dalUpdateRequestStatus` now executed via `Promise.all`. |

---

## Remaining Open Risks

### Critical

None blocking from the original blocker list (CRIT-01 and CRIT-02 resolved). CRIT-03 is a DB operational requirement.

---

### High

**HIGH-03 — Mention actorId client trust (post creation)**
- Location: `apps/VCSM/src/features/upload/controllers/createPost.controller.js` lines 40–46, 122–124
- Status: OPEN — next-sprint
- Finding: `mentionedActorIdsFromUI` is sourced directly from `input?.mentionsResolved` (client-provided array) and inserted via `insertPostMentions(postId, mentionedActorIdsFromUI)` without any DB-level validation that the provided actorIds exist or are visible.
- Risk: A caller can inject phantom actorIds as mention targets. FK constraint on `post_mentions.actor_id` would catch non-existent actors (error silently swallowed at catch block). Notification batch fires for all resolved mention IDs without block/privacy filter.
- Current mitigation: FK constraint prevents non-existent actor mentions. App-layer catch prevents hard failure. Error is `console.warn`-guarded for prod.
- Release impact: LOW — FK constraint provides data integrity. Phantom mentions fail silently. Notification blast to real actors that happen to be blocked is a real but low-severity risk.
- Recommended: Validate `mentionedActorIdsFromUI` against DB (cross-reference with `findActorsByHandles` pattern) and filter mention notifications through block-check before send.
- Target: Next sprint.

**HIGH-05 — `deleteComment(commentId)` ownerless DAL export**
- Location: `apps/VCSM/src/features/post/commentcard/dal/comments.dal.js` line 92
- Status: OPEN — next-sprint
- Finding: `export async function deleteComment(commentId)` takes only a `commentId` — no `actorId`, no owner gate. This is a hard-delete with no caller validation.
- Current mitigation: Production delete path uses `softDeleteCommentController` → `softDeleteCommentDAL({ actorId, commentId })` which `.eq("actor_id", actorId)` owner-gates the delete. The `deleteComment` export has no callers in the surveyed production paths.
- Risk: The export exists and is importable. Any future caller that imports `deleteComment` directly from the DAL bypasses the owner gate entirely.
- Release impact: LOW — no current active exploit path observed. Dead code risk.
- Recommended: Remove `deleteComment(commentId)` from the DAL or add mandatory `actorId` parameter + `.eq("actor_id", actorId)` gate before next sprint.
- Target: Next sprint.

**HIGH-04 — Post detail privacy gate app-layer only**
- Location: `apps/VCSM/src/features/post/postcard/controller/getPostById.controller.js` lines 23–35
- Status: PARTIALLY MITIGATED
- Finding: Raw post row is fetched via `fetchPostByIdDAL(postId)` before `checkPostVisibilityDAL` is applied. Visibility gate correctly returns `null` for private/blocked posts at app layer, but DB-level RLS for `vc.posts` is not verified.
- `checkPostVisibilityDAL` correctly handles: `viewerActorId = null` → `canView: false` for private accounts; block check via `blocks` table; follow check for private accounts.
- `PostDetail.view.jsx` line 70 passes `actorId` from `useIdentity()` — identity is correctly wired.
- Remaining risk: If `vc.posts` table has permissive RLS (anon read), a direct Supabase API call bypasses the app-layer gate. This is a DB-level concern, not fixable at app layer.
- Release impact: MEDIUM for direct API abuse. NONE for browser UI path (gate is enforced correctly).
- Recommended: DB audit of `vc.posts` RLS policies (anon read policy scope). `/DB` command.
- Target: DB audit next sprint.

---

### Medium

**MED-05 — Chat engine unguarded `console.log` in production**
- Location: `engines/chat/src/controller/startDirectConversation.controller.js` lines 43, 52, 73, 84
- Status: OPEN — HOLD for engine release
- Finding: 4 `console.log` statements fire on every DM start. They log: `fromActorId`, `toActorId`, `picked` (may include handle, displayName, avatarUrl), `realmId`, `conversationId`. These are unguarded — no `process.env.NODE_ENV` check or debug flag.
- Risk: Actor identifiers and conversation IDs emitted to production server logs on every DM initiation. Data exposure in log aggregators, log forwarding pipelines, or any log storage that is not access-controlled.
- This is an ENGINE file — the `import.meta.env.DEV` pattern does not apply. Correct guard: `if (process.env.NODE_ENV !== 'production')` or remove entirely.
- Release impact: MEDIUM — operational data exposure. Engine cannot ship with this in production.
- Recommended: Remove all 4 `console.log` blocks or gate with `process.env.NODE_ENV !== 'production'`.
- Target: **Required before engine deployment.**

**MED-06 — `usePostDetailPost.js` unguarded `console.error`**
- Location: `apps/VCSM/src/features/post/postcard/hooks/usePostDetailPost.js` line 51
- Status: OPEN
- Finding: `console.error("[PostDetail] load post failed:", err)` fires in production on any post load failure. Error object may include network details or Supabase error payloads.
- Release impact: LOW — informational log, no actor identity exposed.
- Recommended: Guard with `if (import.meta.env.DEV)`.
- Target: Next sprint (non-blocking).

---

### Low / DB-Only

**LOW-01 — F-02 / moderation.moderators table**
- Status: DB migration staged in remediation report SQL — not yet as a formal Carnage migration file. `isModerationAuthorizedDAL` reads `learning.platform_admins` until migration runs.
- Release impact: Functional — moderation still works via platform_admins table. Security debt only.
- Target: Carnage migration + DB application next sprint.

**LOW-02 — F-10 / Wanders RLS audit**
- Status: Read-only audit deferred. No DB audit of `wanders.*` RLS policies completed.
- Guest session keyed by localStorage `clientKey` — enforcement depends entirely on DB RLS.
- Target: `/DB` command next sprint.

**LOW-03 — F-13 / learning.platform_admins RLS**
- Status: Deferred — out of scope for this remediation pass.
- Target: DB audit next sprint.

---

## Migration Deployment Order (Confirmed)

Must apply in this exact order. Each migration must succeed before the next is applied.

```
1. 20260510_01_user_consents_immutability.sql
   → Creates user_consents immutability trigger + grants
   → Required before Migration 02

2. 20260510_02_age_verification_consent_type.sql
   → Adds 'age_verification' to CHECK constraint on user_consents AND legal_documents
   → Seeds age_verification document row
   → Requires Migration 01 complete (trigger must exist)

3. 20260510_03_accepted_at_server_default.sql
   → Adds server-default trigger for accepted_at on user_consents
   → Requires Migration 01 schema to exist
```

**Verification queries to run after each migration:**
```sql
-- After 01: confirm trigger exists
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_schema = 'platform' AND event_object_table = 'user_consents';

-- After 02: confirm constraint updated
SELECT pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid = 'platform.user_consents'::regclass AND contype = 'c';

-- After 02: confirm seed row
SELECT id, document_type, version, is_current FROM platform.legal_documents
WHERE document_type = 'age_verification';

-- After 03: confirm accepted_at trigger
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_schema = 'platform' AND event_object_table = 'user_consents'
  AND trigger_name ILIKE '%accepted_at%';
```

---

## Rollback Plan

### App code rollback
```bash
git revert HEAD~<n>  # revert to last stable commit before this release
```
The VENOM remediation changes are all additive assertion guards — safe to revert independently.

### Migration rollback
**Migrations 01–03 are NOT automatically reversible.** Rollback requires:
1. Manually DROP the trigger added in 01 if schema needs to be unwound
2. DROP/ADD CONSTRAINT to remove `'age_verification'` if 02 needs unwinding
3. DELETE the age_verification seed row if needed

**Recommended pre-deployment step:** Run migrations on staging DB first and verify smoke tests before production.

### Safe revert sequence (if needed post-deploy)
```
Revert app code → Revert migrations 03 → 02 → 01
```
Note: Reverting 02 requires re-adding the old CHECK constraint without `'age_verification'`.

---

## Smoke Test Checklist (Updated)

### Legal Consent Flow
- [ ] New user signup → consent gate shown → documents load
- [ ] Accept terms → user_consents row created with correct `accepted_at` (server-set)
- [ ] Accept age_verification document → row created, type accepted
- [ ] `checkLegalConsent` returns `requiresConsent: false` after accepting all docs
- [ ] Re-login same user → consent gate NOT re-shown
- [ ] Edit DB: set `user_consents.accepted_at = NULL` manually → fails (trigger enforces immutability)
- [ ] Cache invalidation: accept consent → immediate UI update (no stale gate)

### Block / Follow / Feed Cache
- [ ] Block actor → feed updates (blocked posts removed) without page reload
- [ ] Unblock actor → feed updates on next load
- [ ] Follow private actor → feed does not show their posts until approved
- [ ] Unfollow actor → feed cache invalidated
- [ ] Set actor private → `checkPostVisibilityDAL` returns `canView: false` for non-followers

### Dashboard Ownership Guard
- [ ] Navigate to `/actor/<your-actorId>/dashboard` while logged in → loads
- [ ] Navigate to `/actor/<other-actorId>/dashboard` while logged in → redirects to `/feed`
- [ ] All dashboard subroutes (team, leads) as non-owner → redirects to `/feed`

### Block Controller Session Binding
- [ ] Block actor from settings → succeeds (callerActorId matches actorId)
- [ ] Unblock actor → succeeds
- [ ] `ctrlBlockActor` called with null callerActorId → throws
- [ ] `ctrlBlockActor` called with mismatched callerActorId → throws

### Moderation Access
- [ ] Non-moderator calls `hideReportedObjectController` → FORBIDDEN at controller layer
- [ ] `isModerationAuthorizedDAL` called directly → returns boolean (no throw)

### Chat — Block Enforcement
- [ ] Start DM with a user who has blocked you → throws blocked relationship error
- [ ] Start DM with user you blocked → throws blocked relationship error
- [ ] Start DM with unrestricted user → succeeds

### Post Visibility (Detail Screen)
- [ ] View own post while logged in → loads
- [ ] View post from private actor you follow → loads
- [ ] View post from private actor you do NOT follow → returns null (no content shown)
- [ ] View post while logged out from private actor → returns null

---

## Release Decision

### THOR VERDICT: CAUTION — CONDITIONAL GO

**App code (apps/VCSM): GO WITH CONDITIONS**

All three original CRIT blockers are resolved in code:
- CRIT-01 (migration 02 constraint): FIXED
- CRIT-02 (feed cache invalidation): FIXED
- HIGH-07 (consent cache composite key): FIXED

Remaining open items are next-sprint scope (HIGH-03, HIGH-05, MED-06) and a DB audit (HIGH-04, LOW-01–03).

**Conditions for app deployment:**
1. Migrations 01, 02, 03 must be confirmed applied to the target DB (CRIT-03 — no code can verify this)
2. Run smoke test checklist above before traffic cutover
3. Monitor feed cache invalidation behavior post-deploy (first 30 minutes)

**Engine (engines/chat): HOLD**

The chat engine has 4 unguarded `console.log` statements in `startDirectConversation.controller.js` (lines 43, 52, 73, 84) that log actor identifiers and conversation IDs in production server logs. This must be resolved before the engine ships.

**Engine deployment condition:**
1. Remove or guard the 4 `console.log` blocks in `startDirectConversation.controller.js`
2. Gate with `if (process.env.NODE_ENV !== 'production')` if debug logs are needed

---

## Next Sprint Backlog (Non-Blocking for This Release)

| Item | Finding | Owner |
|---|---|---|
| Remove `deleteComment(commentId)` ownerless DAL export | HIGH-05 | Wolverine |
| Validate `mentionedActorIdsFromUI` against DB before insert; block-filter mention notifications | HIGH-03 | Wolverine |
| Guard `console.error` in `usePostDetailPost.js` line 51 | MED-06 | Wolverine |
| Remove/guard 4 `console.log` in `startDirectConversation.controller.js` | MED-05 | Engine |
| DB audit of `vc.posts` RLS for anon read scope | HIGH-04 | DB |
| Stage `moderation.moderators` migration as formal Carnage file | LOW-01 | Carnage |
| DB audit of `wanders.*` RLS policy enforcement on `x-client-key` | LOW-02 | DB |
| DB audit of `learning.platform_admins` RLS | LOW-03 | DB |
