---
name: vcsm.post.architecture
description: ARCHITECT V2 module architecture report for VCSM:post
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** post
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/post
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The post module is the core social content layer for VCSM. It handles reading, rendering, editing, deleting, reacting to, and commenting on social posts ("Vibes"). It also manages post-specific engagement mechanics including binary reactions (like/dislike), rose gifts, comment threads with nested replies, mention parsing/persistence, and all associated notification dispatch. Post modules — self-contained "Vibe attachments" such as fuel prices, barbershop hours, locksmith portfolio, exchange rates, and menu drops — are rendered inline and owned by this feature.

## OWNERSHIP

Post feature team — social domain. Primary responsibility covers the full social engagement surface: post display, interaction (reactions, roses, comments), edit/delete lifecycle, mention resolution, and downstream notification publishing via the notifications engine adapter.

## ENTRY POINTS

- `/post/:postId` — PostDetail screen (PostDetailScreen.jsx → PostDetailView.jsx), public-accessible route displaying a single Vibe with full comment thread
- `/posts/:postId/edit` — Edit post route (navigate target referenced in PostDetailView.jsx; screen implementation owned by upload feature or a sibling route)
- PostCard component exported via `adapters/postCard.adapter.js` — consumed by feed and profiles features as a shared card unit
- `post.adapter.js` — exports `usePostReactionOps` hook for cross-feature consumption

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 33 | post.read.dal.js, post.write.dal.js, postReactions.write.dal.js, postReactions.read.dal.js, comments.dal.js, commentLikes.dal.js, postMentions.write.dal.js, roseGifts.actor.dal.js |
| Model | 22 | post.model.js, Comment.model.js, barbershopHoursPostModule.model.js, fuelPricesPostModule.model.js, exchangeRatesPostModule.model.js, locksmithHoursPostModule.model.js, locksmithPortfolioPostModule.model.js |
| Controller | 18 | togglePostReaction.controller.js, sendRose.controller.js, postComments.controller.js, deletePost.controller.js, editPost.controller.js, getPostById.controller.js, getPostReactions.controller.js, commentReactions.controller.js, deleteComment.controller.js, editComment.controller.js |
| Service | N/A | — |
| Adapter | 1 | post.adapter.js, postCard.adapter.js (postcard-level), PostCard.jsx (postcard adapter), PostDetail.view.adapter.js, commentcard adapter files |
| Hook | 22 | usePostReactionOps.js, usePostReactions.js, useDeletePostAction.js, useEditPost.js, usePostDetailPost.js, usePostDetailMenus.js, usePostDetailEditing.js, usePostDetailReplying.js, useCommentThread.js, useCommentCard.js, usePostCommentCount.js |
| Component | 38 | PostHeader.jsx, PostBody.jsx, PostFooter.jsx, ReactionBar.jsx, BinaryReactionButton.jsx, RoseReactionButton.jsx, CommentCard.container.jsx, CommentList.jsx, CommentReplies.jsx, all postModule components |
| Screen | 14 | PostDetail.screen.jsx, PostDetail.view.jsx, PostFeed.screen.jsx |
| Barrel | 19 | index.js files across postModules and adapter directories |

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | BEHAVIOR.md is PLACEHOLDER only | BEHAVIOR.md contract body is empty — no happy paths, no edge cases documented |
| Owner defined | PARTIAL | Inferred from domain structure | No explicit ownership record |
| Entry points mapped | PASS | PostDetail.screen.jsx, postCard.adapter.js confirmed | /posts/:postId/edit is navigate target but no screen found in this feature |
| Controllers present/delegated | PASS | 18 controllers (cg count) | All key operations have dedicated controllers |
| DAL/repository present/delegated | PASS | 33 DAL files (cg count) | — |
| Models/transformers present | PASS | 22 models (cg count) | post.model.js maps minimal fields; post_media multi-asset support not in PostModel |
| Hooks/view models present | PASS | 22 hooks (cg count) | — |
| Screens/components present | PASS | 14 screens, 38 components (cg count) | — |
| Services/adapters present | PASS | Adapters present at feature and postcard level | post.adapter.js exposes only usePostReactionOps — thin surface |
| Database objects mapped | PASS | vc.posts, vc.post_reactions, vc.post_comments, vc.comment_likes, vc.post_mentions, vc.post_rose_gifts, identity.actor_directory | postReactions.write.dal.js does not enforce actor_id owner gate on update/delete — relies on DB RLS |
| Authorization path mapped | PASS | post.write.dal.js enforces .eq("actor_id", actorId) for update and soft-delete; controllers check postExists via checkPostExistsDAL | Rose send does not check self-gifting prevention at controller layer |
| Cache/runtime behavior mapped | FAIL | No cache layer documented or observed | Reaction counts use optimistic delta in hook path — no persistence cache |
| Error/loading/empty states mapped | PASS | PostDetailView.jsx has loading spinner, empty ("Vibes not found") state | Error state on failed reactions only surfaced via window.alert in view |
| Documentation linked | FAIL | BEHAVIOR.md is PLACEHOLDER | No happy paths, no edge cases, no state machine |
| Tests/validation noted | FAIL | 0 tests (scanner) | No test files in feature |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS | hydration, identity, notification, profile all confirmed in source imports | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/hydration | Engine | Inbound (post.read.dal.js calls hydrateAndReturnSummaries) | Approved | Used in DAL layer for actor resolution |
| engines/identity | Engine | Inbound (PostDetailView.jsx calls useIdentity via identity.adapter) | Approved | Actor identity resolution at view layer |
| engines/notification | Engine | Inbound (controllers call publishVcsmNotification via notifications.adapter) | Approved | Dispatched from togglePostReaction, sendRose, postComments controllers |
| engines/profile | Engine | Inbound (scanner-detected, profile engine usage) | Approved | Profile data consumed via hydration path |
| features/notifications | Cross-feature (adapter boundary) | Inbound | Approved — via adapter | publishVcsmNotification imported via notifications.adapter |
| features/identity | Cross-feature (adapter boundary) | Inbound | Approved — via adapter | useIdentity via identity.adapter |
| features/profiles | Cross-feature (CSS import) | Inbound | Risk — CSS cross-import | PostDetailView.jsx imports profiles-modern.css from profiles feature |
| vc.posts | DB Table | Write | — | update (text, edited_at), soft-delete (deleted_at) |
| vc.post_reactions | DB Table | Write | — | insert, update, delete |
| vc.post_comments | DB Table | Write | — | insert (new comments/replies), update (edit content, soft-delete) |
| vc.comment_likes | DB Table | Write | — | insert (like), delete (unlike) |
| vc.post_mentions | DB Table | Write | — | delete (old), insert (new) on edit |
| vc.post_rose_gifts | DB Table | Write | — | insert only |
| identity.actor_directory | DB Table (identity schema) | Read | — | Used in post.write.dal.js for mention resolution |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| vc.posts (text, edited_at) | UPDATE | post feature | post.write.dal.js (updatePostTextDAL) | Owner-gated by .eq("actor_id") |
| vc.posts (deleted_at, deleted_by_actor_id) | UPDATE (soft-delete) | post feature | post.write.dal.js (softDeletePostDAL) | Owner-gated by .eq("actor_id") |
| vc.post_reactions | INSERT / UPDATE / DELETE | post feature | postReactions.write.dal.js | No self-reaction guard at DAL layer; RLS-dependent |
| vc.post_comments | INSERT / UPDATE (content, deleted_at) | post feature | comments.dal.js, postComments.read.dal.js | Soft-delete sets deleted_at — no hard delete path |
| vc.comment_likes | INSERT / DELETE | post feature | commentLikes.dal.js | — |
| vc.post_mentions | DELETE + INSERT (replace) | post feature | postMentions.write.dal.js | Full replacement on each edit — no partial update |
| vc.post_rose_gifts | INSERT | post feature | roseGifts.actor.dal.js | No self-gift prevention at controller layer |
| identity.actor_directory | READ (select actor_id by username) | identity engine | post.write.dal.js (mention resolution) | Crosses schema boundary inside DAL — acceptable via supabase client |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | READY | PostDetail.screen.jsx wraps PostDetail.view.jsx; route param useParams("postId") confirmed | /posts/:postId/edit route target not found in this feature |
| Loading state | READY | PostDetailView.jsx renders Spinner on loadingPost | — |
| Empty state | READY | PostDetailView.jsx returns "Vibes not found" div on !post | — |
| Error state | PARTIAL | Delete error uses window.alert; reaction errors bubble from hooks but no UI error toast observed in source | window.alert is a runtime risk — not production-appropriate error surface |
| Auth/owner gates | READY | post.write.dal.js enforces .eq("actor_id", actorId) on all mutations; controllers validate actorId presence | Rose send and reaction mutations rely partly on DB RLS for auth |
| Cache behavior | WATCH | Reaction counts support optimistic delta via applyReactionDelta in controller | No TTL cache — every PostDetail mount triggers fresh DB reads |
| Runtime dependencies | READY | hydrateAndReturnSummaries, useIdentity, publishVcsmNotification all confirmed reachable via adapters | — |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/post/BEHAVIOR.md | PRESENT (PLACEHOLDER) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a stub with no contract body | HIGH | No happy paths, no edge cases, no state machine documented — any refactor operates without contract baseline | LOGAN |
| Zero tests | HIGH | 15 write surfaces, 18 controllers, 0 tests — a reaction toggle regression or comment deletion bug ships silently | SPIDER-MAN |
| window.alert used for delete error feedback | MEDIUM | alert() blocks the main thread and is not platform-appropriate in a PWA/React app — should use toast or inline error state | IRONMAN |
| PostDetailView.jsx imports profiles-modern.css | MEDIUM | Cross-feature CSS import creates hidden style coupling — post feature's visual behavior can break if profiles CSS changes | ARCHITECT / IRONMAN |
| post.model.js does not map post_media multi-asset array | MEDIUM | PostModel.media only maps legacy media_url — multi-image posts rely on raw row.media passing through without canonical model shape | IRONMAN |
| Rose self-gift not prevented at controller layer | LOW | Actor can send roses to their own post — no guard in sendRose.controller.js (relies on DB RLS) | VENOM |
| No route map entry for this feature | LOW | Route scanner reports 0 routes — PostDetail.screen.jsx handles /post/:postId but this is not captured in route-map | ARCHITECT |
| CURRENT_STATUS.md was missing | LOW | Governance gap — created this run | ARCHITECT |

---

## MODULE BOUNDARY WARNINGS

1. **Cross-feature CSS import:** `PostDetailView.jsx` imports `@/features/profiles/styles/profiles-modern.css`. CSS is not gated by an adapter boundary — this creates an undeclared style dependency on the profiles feature.

2. **DAL-level mention resolution crosses identity schema:** `post.write.dal.js` queries `identity.actor_directory` directly via supabase client. This is a schema crossing inside a DAL function, not through the identity engine adapter. Acceptable at current scale but should be routed through an identity engine call if the directory schema moves.

3. **post.adapter.js is underweight:** Exports only `usePostReactionOps`. PostCard and PostDetail view are exposed via separate adapter files (`postCard.adapter.js`, `adapters/screens/PostDetail.view.adapter.js`). The feature adapter surface is fragmented across three adapter files rather than consolidated.

---

## SPAGHETTI SCORE

**Module:** post
**Score:** WATCH
**Reasons:** Cross-feature CSS import; fragmented adapter surface (three separate adapter files); post.model.js does not fully represent the post shape (post_media array missing); window.alert error surface in production view; minor schema crossing in DAL. No circular imports found. Layer structure is mostly clean.
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no body content

**Check A (Source without behavior):** FAIL — BEHAVIOR.md is a stub. Source exists and is functional. Contract is absent.
**Check B (Behavior without source):** N/A — BEHAVIOR.md has no declared happy paths to verify against source.
**Check C (§13 engine consistency):** PARTIAL — Scanner declares hydration, identity, notification, profile engines. Source confirms hydration (hydrateAndReturnSummaries in post.read.dal.js), identity (useIdentity via adapter), notification (publishVcsmNotification via notifications adapter). Profile engine usage inferred — no direct profile engine import found in scanned files, likely consumed transitively via hydration.
**Check D (§6 data change consistency):** PASS — 15 write surfaces in scanner match source review: vc.post_reactions (insert/update/delete), vc.posts (update, soft-delete), vc.post_comments (insert, update x2), vc.comment_likes (insert/delete), vc.post_mentions (delete/insert), vc.post_rose_gifts (insert), and vc RPC post_reactors_summary_one.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write real BEHAVIOR.md contract | Zero documentation on happy paths, state machines, edge cases — governance gap | LOGAN |
| P1 | Add tests for reaction toggle, comment creation, soft-delete | 0 tests across 15 write surfaces is a release risk | SPIDER-MAN |
| P2 | Fix window.alert in PostDetailView delete handler | Not production-appropriate error feedback | IRONMAN |
| P2 | Consolidate adapter surface (3 adapter files → 1) and complete PostModel media mapping | Fragmented export surface + model gap creates consumer confusion | IRONMAN |

## RECOMMENDED HANDOFFS

- **LOGAN** — Fill BEHAVIOR.md with real contract (happy paths, state machine, edge cases)
- **SPIDER-MAN** — Add regression tests for togglePostReaction, sendRose, postComments (create/delete)
- **IRONMAN** — Replace window.alert with toast; consolidate adapters; fix PostModel.media mapping
- **VENOM** — Review rose self-gift gap and reaction mutation RLS reliance

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
