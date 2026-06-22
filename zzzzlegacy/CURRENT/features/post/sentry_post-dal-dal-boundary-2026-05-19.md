# SENTRY — Post DAL Architecture Boundary Review

**Date:** 2026-05-19
**Scope:** `apps/VCSM/src/features/post/postcard/dal/`
**Triggered by:** CEREBRO — DAL governance pass on `vcsm.dal.post.md`
**Status:** VIOLATION CONFIRMED — OPEN

---

## Finding S-1 — DAL→DAL Boundary Violation (RISK-3)

**Severity:** MEDIUM
**File:** `apps/VCSM/src/features/post/postcard/dal/post.write.dal.js`
**Lines:** 3 (import), 65 (call via `replacePostMentions`)

### Evidence

`post.write.dal.js` imports `insertPostMentionsDAL` from a sibling DAL:

```js
// line 3
import { insertPostMentionsDAL } from "@/features/post/postcard/dal/postMentions.write.dal";
```

It defines a private helper `replacePostMentions(postId, actorIds)` that:
1. Deletes existing mention edges via direct `supabase.schema("vc").from("post_mentions").delete()` — raw DB call
2. Calls `insertPostMentionsDAL(postId, actorIds)` — DAL calling DAL

This helper is invoked inside `updatePostTextDAL` (the post-edit path):

```
updatePostTextDAL → replacePostMentions → insertPostMentionsDAL
```

No controller layer mediates this coordination. `editPost.controller.js` calls `updatePostTextDAL` which orchestrates the multi-table write internally.

### What the Contract Requires

Per the VCSM architecture contract:

- **DAL role:** Raw Supabase access only — single responsibility
- **Controller role:** Business rules, orchestration, multi-DAL writes
- **DAL must NOT:** call other DALs, coordinate multiple tables, contain business logic

`replacePostMentions` is coordination logic (delete + insert + error handling) — it belongs in a controller.

### Mitigation Path

Move `replacePostMentions` into `editPost.controller.js`:

```
editPost.controller.js
  → updatePostTextDAL (posts table only)
  → deletePostMentionsDAL (new) or raw mentions delete
  → insertPostMentionsDAL (postMentions.write.dal.js)
```

This restores single-responsibility to each DAL and keeps multi-DAL orchestration in the controller layer.

### Risk Assessment

| Dimension | Assessment |
|---|---|
| Production safety | LOW — writes are correct and owner-gated at DB level |
| Architecture correctness | FAIL — contract violation |
| Urgency | LOW-MEDIUM — stable pattern, not causing bugs |
| Blocking? | NO — not a release blocker |

### Owner Gates Present

Both `updatePostTextDAL` and `softDeletePostDAL` use `.eq("actor_id", actorId)` as PostgREST WHERE clauses — ownership is enforced at the DB query level even though coordination is in the wrong layer.

---

## Summary

| Finding | Severity | Status | Action |
|---|---|---|---|
| S-1: DAL→DAL in `post.write.dal.js` | MEDIUM | OPEN | Move `replacePostMentions` to `editPost.controller.js` |

**Handoff:** IRONMAN (for refactor ownership decision), WOLVERINE (for scheduling the move)

**Document:** `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.post.md`
