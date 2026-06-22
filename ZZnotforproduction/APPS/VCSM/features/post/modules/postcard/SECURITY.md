---
title: Postcard Module — Security
status: STUB
feature: post
module: postcard
source: venom+bw-derived
created: 2026-06-05
---

# post / modules / postcard — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — POSTCARD-SEC-001, POSTCARD-SEC-002, POSTCARD-SEC-003, POSTCARD-SEC-004**

## Findings

### POSTCARD-SEC-001 — Self-Reaction Not Guarded [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | POSTCARD-SEC-001 |
| Source Findings | VEN-POST-003, BW-POST-004 (HIGH) |
| Severity | HIGH |
| Surface | postcard/controller/togglePostReaction.controller.js |
| Description | No self-reaction guard. Actor can react to their own post, inflate reaction counts, and receive self-notification. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### POSTCARD-SEC-002 — Rose Self-Gifting and Qty Unbounded [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | POSTCARD-SEC-002 |
| Source Findings | VEN-POST-004, BW-POST-005 (HIGH) |
| Severity | HIGH |
| Surface | postcard/controller/sendRose.controller.js |
| Description | No self-gifting guard. No qty upper bound. No replay protection. Actor can gift unlimited roses to own posts with arbitrary qty per call. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### POSTCARD-SEC-003 — replacePostMentions DELETE No Ownership Guard [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | POSTCARD-SEC-003 |
| Source Findings | VEN-POST-002, BW-POST-001 (HIGH) |
| Severity | HIGH |
| Surface | postcard/dal/postMentions.write.dal.js → replacePostMentions DELETE step |
| Description | DELETE step has no ownership check at the delete boundary. Race window: if post UPDATE fails silently, mentions are still deleted. On non-owned posts, DELETE fires before ownership is confirmed. Adversarially PARTIAL (bypasses mentions guard). |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### POSTCARD-SEC-004 — Raw UUID in Notification linkPath [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | POSTCARD-SEC-004 |
| Source Findings | BW-POST-010 (HIGH) |
| Severity | HIGH |
| Surface | 5 post notification linkPath constructions — /post/:postId (raw UUID) |
| Description | All post notification deep-links use raw UUID postId in /post/:id format. Violates platform no-raw-IDs-in-public-URLs policy. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### POSTCARD-SEC-005 — actor_id Caller-Supplied in Reaction/Rose DALs
| Field | Value |
|---|---|
| ID | POSTCARD-SEC-005 |
| Source Findings | BW-POST-007 (MEDIUM) |
| Severity | MEDIUM |
| Surface | postcard/dal/postReactions.write.dal.js → insertReactionDAL; roseGifts.actor.dal.js |
| Description | actor_id is caller-supplied in INSERT DALs with no DAL-level ownership assertion. RLS on vc.post_reactions UNVERIFIED. Adversarially UNRESOLVED. |
| Status | OPEN |
| THOR | Not blocked |

### POSTCARD-SEC-006 — Edit on Soft-Deleted Post Not Guarded
| Field | Value |
|---|---|
| ID | POSTCARD-SEC-006 |
| Source Findings | BW-POST-009 (LOW) |
| Severity | LOW |
| Surface | postcard/controller/editPost.controller.js |
| Description | No deleted_at pre-check. Actor can edit their own soft-deleted post. Other controllers (reactions, comments, roses) correctly use checkPostExistsDAL. |
| Status | OPEN |
| THOR | Not blocked |

### POSTCARD-SEC-007 — Production Console Logs (Schema Recon)
| Field | Value |
|---|---|
| ID | POSTCARD-SEC-007 |
| Source Findings | VEN-POST-005 (MEDIUM) |
| Severity | MEDIUM |
| Surface | Multiple postcard hooks |
| Description | Multiple hooks emit console.error/warn without import.meta.env.DEV guards. Schema reconnaissance vector in production. |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
