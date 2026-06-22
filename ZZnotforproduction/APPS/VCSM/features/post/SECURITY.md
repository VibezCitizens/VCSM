# Security Posture — post

Last Updated: 2026-06-04
Highest Open Severity: HIGH
THOR Release Blocker: YES — VEN-POST-001, VEN-POST-002, VEN-POST-003, BW-POST-001, BW-POST-004, BW-POST-005, BW-POST-010

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

7 findings: 0 CRITICAL, 3 HIGH, 3 MEDIUM, 1 LOW

| Finding ID | Severity | Description |
|---|---|---|
| VEN-POST-001 | HIGH | insertPostComment is an orphaned INSERT export in a .read.dal file with no owning controller — potential comment spoofing vector |
| VEN-POST-002 | HIGH | replacePostMentions DELETE step has no ownership check at the delete boundary; race window if posts UPDATE fails silently |
| VEN-POST-003 | HIGH | togglePostReactionController has no self-reaction guard — actor can react to their own post, inflating metrics and generating self-notifications |
| VEN-POST-004 | MEDIUM | sendRoseController has no upper bound on qty per insert and no self-gifting prevention |
| VEN-POST-005 | MEDIUM | Multiple hooks emit console.error/warn without import.meta.env.DEV guards — schema reconnaissance in production |
| VEN-POST-006 | MEDIUM | No comment content length limit in controller or DAL — storage amplification risk |
| VEN-POST-007 | LOW | BEHAVIOR.md is a placeholder — no §5 Security Rules or §9 Must Never Happen invariants authored |

Output: ZZnotforproduction/APPS/VCSM/features/post/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_post-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: NEVER
ELEKTRA Status: NOT RUN

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

9 findings: 0 CRITICAL, 4 HIGH, 3 MEDIUM, 2 LOW, 0 INFO

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-POST-001 | HIGH | replacePostMentions DELETE fires on non-owned posts — mentions erasure without actor ownership gate; editPost data=null path does not abort the mentions try/catch block | PARTIAL (bypass of mentions guard) | OPEN |
| BW-POST-002 | MEDIUM | useEditPost + useDeletePostAction receive actorId as caller parameter — no session-binding inside hook layer; structural weakness (DAL gate prevents actual exploit) | PARTIAL | OPEN |
| BW-POST-003 | MEDIUM | usePostReactionOps returns controller refs directly — actorId not session-bound inside hook; same structural weakness as BW-POST-002 | PARTIAL | OPEN |
| BW-POST-004 | HIGH | togglePostReactionController has no self-reaction guard — actor can react to own post, inflate counts, and receive self-notification (re-confirms VEN-POST-003) | BYPASSED | OPEN |
| BW-POST-005 | HIGH | sendRoseController has no self-gifting guard, no qty upper bound, and no replay protection — unlimited metric inflation via repeated calls with arbitrary qty (extends VEN-POST-004) | BYPASSED | OPEN |
| BW-POST-006 | MEDIUM | toggleCommentLike has no self-like guard — actor can like own comment, inflate like count, and receive self-notification | BYPASSED | OPEN |
| BW-POST-007 | MEDIUM | insertReactionDAL + likeComment perform INSERT with caller-supplied actor_id — no DAL-level ownership assertion; relies on unverified RLS for actor_id enforcement | UNRESOLVED | OPEN |
| BW-POST-008 | LOW | createRootComment has no null actorId guard at controller level — null actorId reaches createComment DAL; DB NOT NULL constraint provides backstop | PARTIAL | OPEN |
| BW-POST-009 | LOW | editPostController has no deleted_at pre-check — actor can edit a soft-deleted post they own; all reaction/comment/rose controllers correctly use checkPostExistsDAL | PARTIAL | OPEN |
| BW-POST-010 | HIGH | All 5 post notification linkPath constructions use raw UUID postId in /post/:id format — violates platform rule "no raw IDs in public-facing URLs" | BYPASSED | OPEN |

Output: ZZnotforproduction/APPS/VCSM/features/post/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_post-adversarial-review.md
