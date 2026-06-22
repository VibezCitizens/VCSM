# Module: Post detail / comments / reactions

## PWA Source of Truth

**Routes:** `/posts/:id`, `/posts/:id/edit`, `/noti/post/:id`

**Screens/components:**
- `apps/VCSM/src/features/post/*`
- `apps/VCSM/src/features/post/commentcard/*`
- `apps/VCSM/src/features/post/reactions/*`

**Services/DAL:**
- `apps/VCSM/src/features/post/postcard/dal/*`
- `apps/VCSM/src/features/post/postcard/controller/*`

**Supabase schema/tables/RPCs:**
- `vc.posts`
- `vc.post_comments`
- `vc.post_reactions`
- `vc.post_mentions`
- `vc.post_media`
- `vc.post_rose_gifts`

**RLS expectations:** Only authenticated users can comment/react; edit/delete must be owner-scoped; hidden/reported/blocked content must stay hidden.

**Current PWA status:** Source of truth for nested comments, reaction state, edits, deletes, report/share actions, and notification deep-link targets.

---

## Native Transfer Status

**Status:** `Partial`

---

## Transferred Native Files

- `VCSMNativeApp/Features/PostDetail/PostDetailView.swift`
- `VCSMNativeApp/Features/PostDetail/PostDetailViewModel.swift`
- `VCSMNativeApp/Services/Post/LivePostService.swift`
- `VCSMNativeApp/Services/Post/PostService.swift`
- `VCSMNativeApp/Features/Safety/Controller/HideCommentForActor.controller.swift`
- `VCSMNativeApp/Features/Safety/Controller/UnhideCommentForActor.controller.swift`

---

## Native Behavior Currently Present

- Full post detail with post body, media, reactions (like/dislike/rose with counts and active viewer state), share, edit, and delete.
- Nested/threaded comments (`CommentNode` with recursive reply rendering, depth-based indentation up to 3 levels).
- Comment compose with reply targeting (inline on phone, sheet on iPad).
- Comment editing (inline TextEditor with save/cancel), deletion (owner-only with confirmation).
- Comment reactions (like/unlike with count and heart toggle).
- Comment reporting with 12 reason categories and details input.
- Safety filtering: `ActorGuardStore` for block checking, `ContentVisibilityStore` for hidden comments with cascading hide (hiding parent hides child replies), `ReportedContentCoverCard` overlay.
- Post edit sheet with TextEditor and save/cancel.

---

## Native Gaps

- No @mention autocomplete in comment compose (post composer has `MentionSuggestionOverlay` but comments use plain text).
- No "original poster" badge on post author's comments.
- No comment pagination for very long threads.
- These are polish items — core comment functionality is at parity.

---

## Risk Notes

- Comment/reaction writes are high-RLS areas and must not be duplicated outside PostService/DAL patterns.
- Notification deep links into post detail must open the same state as direct navigation.

---

## Pending Transfer Checklist

- [x] Nested comment tree with recursive rendering and depth indentation — verified implemented.
- [x] Comment add/edit/delete/report writes — verified via PostDetailViewModel methods.
- [x] Blocked/reported author filtering — verified via ActorGuardStore + ContentVisibilityStore with cascading hide.
- [ ] Ensure notification post links open the same detail state (runtime test).
- [ ] Add @mention autocomplete in comment compose (P2 polish).
- [ ] Runtime QA for deeply nested threads and large comment counts.

---

## PWA → Native Transfer Log

### 2026-05-03 — Tracker audit: core features verified complete

- Date: 2026-05-03
- Change type: Audit
- PWA files changed: none
- Routes affected: none
- Screens/components changed: none — audit only
- Services/DAL changed: none
- Behavior change: none — tracker updated to reflect existing implementation
- Supabase schema/RPC change: none
- RLS expectations changed: no
- Affected native modules: Post detail
- Priority: P1
- Native status: Partial → near-Complete (core features at parity; polish items remain)
- Testing notes: Code audit verified nested comments, reactions, editing, deletion, reporting, and safety filtering all implemented. Runtime QA pending.
- Notes: Tracker was significantly out of date. 1,162-line PostDetailView.swift already has full threaded comments, inline editing, safety filtering, and report composer.

---

## Transfer History

- Last synced date: 2026-05-03
- Native files updated: none — audit and tracker correction only
- Delta status: Near-Complete — threaded comments, reactions, editing, deletion, reporting, safety filtering all verified implemented. Polish items remain (mention autocomplete, OP badge, pagination).
- Notes: Full code audit revealed tracker was significantly out of date. Core post detail functionality has been at parity.

---

## Archived Notes

No archived notes yet.
