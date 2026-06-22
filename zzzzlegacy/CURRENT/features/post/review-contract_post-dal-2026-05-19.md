# review-contract — Post DAL Compliance Check

**Date:** 2026-05-19
**Scope:** `apps/VCSM/src/features/post/`, `apps/VCSM/src/features/upload/`
**Triggered by:** CEREBRO — DAL governance pass on `vcsm.dal.post.md`
**Status:** ONE OPEN STRUCTURAL VIOLATION — no blocking items

---

## RC-1 — Console.warn Gates — RESOLVED

**Previous finding (AvengersAssemble 2026-05-11):** Three ungated `console.warn` calls in upload feature.

**2026-05-19 verification:**

| File | Line | Call | Gate Status |
|---|---|---|---|
| `upload/controllers/createPost.controller.js` | 138 | `console.warn("[createPostController] mention insert failed:", e)` | ✅ `import.meta.env.DEV` |
| `upload/lib/compressIfNeeded.js` | 12 | `console.warn("Compression failed, using original:", err)` | ✅ `import.meta.env?.DEV` |
| `upload/hooks/useMentionAutocomplete.js` | 91 | `console.warn("[useMentionAutocomplete] search failed:", e)` | ✅ `import.meta.env?.DEV` |
| `post/postcard/dal/post.write.dal.js` | ~100 | `console.warn("[updatePostTextDAL] mention persistence failed:", e)` | ✅ `import.meta.env?.DEV` |

All four calls are correctly DEV-gated. **RESOLVED** by Codex Fix Pass 2026-05-11.

---

## RC-2 — Dual Controller Folder — OPEN

**Finding:** The `upload` feature has two separate physical controller folders:

| Folder | Files |
|---|---|
| `upload/controllers/` (plural) | `createPost.controller.js` |
| `upload/controller/` (singular) | `recordPostMedia.controller.js`, `searchMentionSuggestions.controller.js` |

VCSM convention uses plural for all controller group folders. Two files are in the wrong location.

**Impact:** Ambiguous imports, inconsistent import paths, potential future confusion when adding controllers.

**Recommended fix:** Move `recordPostMedia.controller.js` and `searchMentionSuggestions.controller.js` into `upload/controllers/` and update import paths in their callers:
- `upload/hooks/useUploadSubmit.js` (imports `recordPostMedia.controller`)
- `upload/hooks/useMentionAutocomplete.js` (imports `searchMentionSuggestions.controller`)

**Blocking?** NO — paths work as-is. Low urgency structural cleanup.

---

## RC-3 — CLAUDE.md Command Table — OUT OF SCOPE

**Previous finding (AvengersAssemble 2026-05-11):** 5 commands active on disk but not listed in CLAUDE.md table (`AvengersAssemble`, `WinterSoldier`, `Sentry`, `SHIELD`, `Cerebro`).

**Status:** DEFERRED — not a post DAL finding. Belongs to a LOGAN or SHIELD sync pass.

---

## Cross-Feature Import Review

**`createPost.controller.js` → `@/features/block`:** Imports `ctrlGetBlockedActorSet` through block feature index — correct adapter boundary pattern. ✅

**`posts.adapter.js` → `@/features/upload/dal/insertPost.dal`:** Adapter calling its own feature's DAL — correct pattern. ✅

**`postReactions.write.dal.js` → cross-feature profiles tab:** Access goes through `post.adapter.js` → `usePhotoReactions.js` — correct adapter pattern. ✅

---

## Summary

| Finding | Status | Blocking? |
|---|---|---|
| RC-1: Ungated console.warn (3 instances) | RESOLVED | — |
| RC-2: Dual controller folders (`controller/` vs `controllers/`) | OPEN | NO |
| RC-3: CLAUDE.md command table drift | DEFERRED (out of scope) | NO |

**Document:** `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.post.md`
