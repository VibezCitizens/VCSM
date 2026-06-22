# MODULE ARCHITECTURE REPORT

**Module:** post
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — Post Rendering & Post Actions
**Primary Root:** `apps/VCSM/src/features/post/`
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Owns all post rendering (PostCard), post actions (react, share, rose, delete, edit), post detail view, comment system (comment list, comment card, comment reactions, reply threads), and post deep-link screens. The module is organized into two sub-modules: `postcard/` (post rendering and actions) and `commentcard/` (comment rendering and actions).

---

## OWNERSHIP

Post owns: PostCard rendering, post reactions (like, dislike, rose, share), post edit/delete, post detail screen, comment list, comment reactions, comment edit/delete, reply threads. Feed consumes PostCard via adapter.

---

## ENTRY POINTS

- `/post/:postId` → `PostDetail.screen.jsx`
- `/feed` → PostFeed.screen.jsx (post-in-feed entry)
- PostCard embedded in CentralFeed via adapter

---

## LAYER MAP

**postcard/ sub-module:**

DAL:
- `post.read.dal.js` — post reads
- `post.write.dal.js` — post writes (edit, delete)
- `postMentions.read.dal.js` — mention reads
- `postMentions.write.dal.js` — mention writes
- `postReactions.read.dal.js` — reaction reads
- `postReactions.write.dal.js` — reaction writes
- `postVisibility.dal.js` — visibility state
- `roseGifts.actor.dal.js` — rose gift record

Controller:
- `deletePost.controller.js`
- `editPost.controller.js`
- `getPostById.controller.js`
- `getPostMentionMap.controller.js`
- `getPostReactions.controller.js`
- `sendRose.controller.js`
- `togglePostReaction.controller.js`

Hook:
- `useCommentCovers.js`
- `useDeletePostAction.js`
- `useEditPost.js`
- `usePostCovers.js`
- `usePostDetailEditing.js`
- `usePostDetailMenus.js`
- `usePostDetailPost.js`
- `usePostDetailReplying.js`
- `usePostDetailReporting.js`
- `usePostReactionOps.js`
- `usePostReactions.js`

Model:
- `post.model.js`

Component:
- `BinaryReactionButton.jsx`
- `CommentButton.jsx`
- `MediaCarousel.jsx`
- `PostActionsMenu.jsx`
- `PostBody.jsx`
- `PostConfirmModal.jsx`
- `PostFooter.jsx`
- `PostHeader.jsx`
- `ReactionBar.jsx`
- `RoseReactionButton.jsx`
- `ShareModal.jsx`
- `ShareReactionButton.jsx`

UI View:
- `EditPost.jsx`
- `PostCard.view.jsx`

**commentcard/ sub-module:**

DAL:
- `commentLikes.dal.js`
- `comments.dal.js`
- `postComments.count.dal.js`
- `postComments.read.dal.js`

Controller:
- `commentReactions.controller.js`
- `commentReactions.hydrator.controller.js`
- `deleteComment.controller.js`
- `editComment.controller.js`
- `postComments.controller.js`
- `postComments.count.controller.js`

Hook:
- `useCommentCard.js`
- `useCommentThread.js`
- `useEditCommentAction.js`
- `usePostCommentCount.js`

Model:
- `Comment.model.js`

Component:
- `CommentCard.container.jsx`
- `CommentComposeModal.jsx`
- `CommentList.jsx`
- `CommentReplies.jsx`
- `CommentReplyModal.jsx`
- `cc/CommentActions.jsx`
- `cc/CommentBody.jsx`
- `cc/CommentHeader.jsx`

UI View:
- `CommentCard.view.jsx`
- `CommentInput.view.jsx`
- `EditComment.jsx`

**Screens (top-level):**
- `PostDetail.screen.jsx` — final screen (route entry + identity gate)
- `PostDetail.view.jsx` — view screen (hook composition)
- `PostFeed.screen.jsx` — post feed screen
- `screens/components/PostDetailModals.jsx`
- `screens/components/PostDetailSparksSection.jsx`

**Adapters:**
- `post.adapter.js` — main feature adapter
- `postCard.adapter.js` — PostCard re-export
- `commentcard/components/CommentCard.container.adapter.js`
- `commentcard/hooks/useCommentThread.adapter.js`
- `postcard/components/BinaryReactionButton.adapter.js`
- `postcard/components/CommentButton.adapter.js`
- `postcard/components/PostActionsMenu.adapter.js`
- `postcard/components/RoseReactionButton.adapter.js`
- `postcard/components/ShareModal.adapter.js`
- `postcard/components/ShareReactionButton.adapter.js`
- `postcard/hooks/useDeletePostAction.adapter.js`
- `adapters/screens/PostDetail.view.adapter.js`
- `postcard/adapters/PostCard.jsx` — PostCard re-export (also in postcard/adapters/)

**STRUCTURAL NOTE:** `postcard/adapters/PostCard.jsx` exists alongside the top-level `adapters/postCard.adapter.js` — dual adapter paths for the same component.

**Store:** None
**Engine Consumers:** None directly (uses DAL for all data)

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Clear post ownership | — |
| Owner defined | PARTIAL | No IRONMAN record | — |
| Entry points mapped | PASS | PostDetail.screen, PostFeed.screen | — |
| Controllers present/delegated | PASS | 13 controllers across two sub-modules | — |
| DAL/repository present/delegated | PASS | 12 DAL files | — |
| Models/transformers present | PASS | 2 model files | — |
| Hooks/view models present | PASS | 15 hooks | — |
| Screens/components present | PASS | 3 screens, 12+ components | — |
| Services/adapters present | PARTIAL | Multiple adapter files — dual PostCard path | Adapter structure fragmented |
| Database objects mapped | PARTIAL | `vc.posts`, `vc.post_reactions`, `vc.comments` | Comment tables schema not fully documented |
| Authorization path mapped | PARTIAL | Owner checks in delete/edit controllers | — |
| Cache/runtime behavior mapped | FAIL | No cache documented | Post reactions likely uncached |
| Error/loading/empty states mapped | PARTIAL | Some loading states | Error state on post load not confirmed |
| Documentation linked | FAIL | No Logan doc | — |
| Tests/validation noted | FAIL | No tests | — |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS | No engine dependencies (direct DAL) | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `feed` feature | feature | feed → post (via adapter) | YES | PostCard consumed by feed |
| `moderation` feature | feature | post → moderation | PARTIAL | usePostDetailReporting calls moderation |
| `social` feature | feature | post → social | PARTIAL | block state consumed in post visibility |
| `vc.posts` | database | post reads/writes | YES | — |
| `vc.post_reactions` | database | post reads/writes | YES | — |
| `vc.comments` | database | post reads/writes | YES | — |
| `vc.post_media` | database | post reads | YES | — |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| PostCard UI | read | post | feed, profiles, explore | Must go through post.adapter |
| Post detail | read/write | post | PostDetail.screen | — |
| Post reactions | read/write | post | feed, detail | — |
| Comment list | read/write | post (commentcard/) | post detail | — |
| Rose gift | write | post | post + notifications | — |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | PostDetail.screen routed | — |
| Loading state | PARTIAL | Some skeleton/loading | PostCard loading not confirmed |
| Empty state | PARTIAL | PostDetail empty state present | — |
| Error state | FAIL | Not confirmed | — |
| Auth/owner gates | PARTIAL | Delete/edit owner-checked in controller | No guard on route level |
| Cache behavior | FAIL | No cache layer documented | — |
| Runtime dependencies | PASS | Direct Supabase access | — |
| Hot paths | HIGH | PostCard renders on every feed load | — |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| Dual PostCard adapter paths | `postcard/adapters/PostCard.jsx` AND `adapters/postCard.adapter.js` | HIGH | SENTRY |
| Deep adapter nesting | `adapters/postcard/components/*.adapter.js` for every component | MEDIUM — verbose | SENTRY |
| `screens/utils/detectIOS.js` | Utility inside screens/ | LOW — should be in shared/ | IRONMAN |
| `post/styles/post-modern.css` | Styles inside feature — acceptable | LOW | — |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | — | MISSING |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | N/A | N/A |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Dual PostCard adapter — consolidate | HIGH | Consumers unclear which to import | SENTRY |
| Error state on post load | HIGH | Silent failure on broken post | IRONMAN |
| Post reaction cache | MEDIUM | Reaction state re-fetched on every render | KRAVEN |
| Logan documentation | HIGH | No canonical post architecture | LOGAN |
| `detectIOS.js` utility placement | LOW | Should be in shared utilities | IRONMAN |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS:
- SENTRY (boundary: dual adapter paths)
- KRAVEN (performance: reaction fetch caching)
- LOGAN (documentation)
- IRONMAN (ownership: error states)
