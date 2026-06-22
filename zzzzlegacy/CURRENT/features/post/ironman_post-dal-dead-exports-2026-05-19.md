# IRONMAN — Post DAL Dead Export Ownership

**Date:** 2026-05-19
**Scope:** `apps/VCSM/src/features/post/` — dead code ownership decisions
**Triggered by:** CEREBRO — DAL governance pass on `vcsm.dal.post.md`
**Status:** TWO DEAD EXPORTS — DELETION RECOMMENDED — DECISION PENDING

---

## I-1 — `insertPostComment` — Dead Export in `postComments.read.dal.js`

**Severity:** LOW
**File:** `apps/VCSM/src/features/post/commentcard/dal/postComments.read.dal.js`
**Export:** `insertPostComment` (line 40)
**Callers:** ZERO production callers

### Evidence

Live grep across all of `apps/VCSM/src/`:
- Only match is the export declaration itself — zero import sites
- Comment creation is handled exclusively by `createComment` in `comments.dal.js`
- These are duplicate insert functions targeting the same table (`vc.post_comments`)

### Architecture Issues

1. **Naming violation:** An INSERT function (`insertPostComment`) lives in a file named `postComments.read.dal.js`
2. **Duplicate surface:** `createComment` in `comments.dal.js` handles the same operation and is actively used
3. **Dead code risk:** Function may have been written pre-`createComment` and abandoned when the create flow was refactored

### Recommended Action

**DELETE** `insertPostComment` from `postComments.read.dal.js`. Verify no dynamic imports before deletion.

After deletion, `postComments.read.dal.js` retains two active exports:
- `listPostComments` — active, thread load
- `readPostCommentActorIdDAL` — active, ownership lookup

The filename is then accurate (read-only functions remaining).

### Owner

Post feature — no dedicated feature owner assigned.

---

## I-2 — `listRoseGiftsByPostDAL` — Dead Export in `roseGifts.actor.dal.js`

**Severity:** LOW
**File:** `apps/VCSM/src/features/post/postcard/dal/roseGifts.actor.dal.js`
**Export:** `listRoseGiftsByPostDAL` (line 15)
**Callers:** ZERO production callers

### Evidence

Live grep across all of `apps/VCSM/src/`:
- Only match is the export declaration itself — zero import sites
- `insertRoseGiftDAL` in the same file IS active (used by `sendRose.controller.js`)

### Background

`listRoseGiftsByPostDAL` was likely written in anticipation of a "view who gifted a rose" feature that was never implemented. The read-side of rose gifts has no UI consumer, no hook, and no controller.

### Recommended Action

**DELETE** `listRoseGiftsByPostDAL` from `roseGifts.actor.dal.js`. After deletion, the file retains one active export (`insertRoseGiftDAL`).

The "view gifters" feature, if ever implemented, should be designed from a fresh DAL based on product requirements at that time.

### Owner

Post feature — no dedicated feature owner assigned.

---

## Summary

| Finding | File | Export | Callers | Recommended Action |
|---|---|---|---|---|
| I-1 | `postComments.read.dal.js` | `insertPostComment` | 0 | DELETE — verify no dynamic imports |
| I-2 | `roseGifts.actor.dal.js` | `listRoseGiftsByPostDAL` | 0 | DELETE — no consumers exist |

**Both deletions are safe:** zero callers, zero dynamic import risk (functions are not generic strings used in dynamic invocation patterns).

**Next step:** WOLVERINE — schedule deletion in a dedicated cleanup pass (append-safe, no behavior change).

**Document:** `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.post.md`
