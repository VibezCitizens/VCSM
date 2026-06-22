---
title: Upload Module — Security
status: STUB
feature: upload
module: upload
source: venom+bw-derived
created: 2026-06-05
---

# upload / modules / upload — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — UPLOAD-SEC-001, UPLOAD-SEC-002, UPLOAD-SEC-003, UPLOAD-SEC-004**

## Findings

### UPLOAD-SEC-001 — Actor Identity Not Verified via actor_owners [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | UPLOAD-SEC-001 |
| Source Findings | VEN-UPLOAD-001, BW-UPLOAD-001 (HIGH) |
| Severity | HIGH |
| Surface | controllers/createPost.controller.js → actorId |
| Description | createPostController uses session-derived actorId from identityContext but never verifies it against actor_owners DB table. User session → actor link is trust-assumed, not DB-confirmed. Adversarially PARTIAL. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### UPLOAD-SEC-002 — updatePostMediaAssetIdDAL No Ownership Filter [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | UPLOAD-SEC-002 |
| Source Findings | VEN-UPLOAD-004 (HIGH) |
| Severity | HIGH |
| Surface | dal/updatePostMediaAssetIdDAL → vc.post_media UPDATE |
| Description | Updates vc.post_media by row ID without actor ownership filter. Any caller with a post_media row ID can update media asset IDs for any post. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### UPLOAD-SEC-003 — deletePostByIdDAL Ownerless DELETE [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | UPLOAD-SEC-003 |
| Source Findings | VEN-UPLOAD-005 (HIGH) |
| Severity | HIGH |
| Surface | dal/deletePostByIdDAL (rollback path) |
| Description | deletePostByIdDAL is an exported DELETE with no ownership predicate. Used in rollback path but callable by any importer with a postId. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### UPLOAD-SEC-004 — createSystemPost actorId From Caller No actor_owners Verify [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | UPLOAD-SEC-004 |
| Source Findings | VEN-UPLOAD-007 (HIGH) |
| Severity | HIGH |
| Surface | api/createSystemPost |
| Description | createSystemPost adapter accepts actorId from caller without actor_owners DB verification. Any authenticated caller can create system posts attributed to any actor. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### UPLOAD-SEC-005 — post_type From Unvalidated input.mode
| Field | Value |
|---|---|
| ID | UPLOAD-SEC-005 |
| Source Findings | VEN-UPLOAD-009, BW-UPLOAD-003 (MEDIUM) |
| Severity | MEDIUM |
| Surface | controllers/createPost.controller.js → input.mode |
| Description | post_type stored directly from input.mode without allowlist validation. MAX_VIBES_PHOTOS cap skipped for non-"post" mode values. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | Not blocked |

### UPLOAD-SEC-006 — Client-Side MIME Validation Only
| Field | Value |
|---|---|
| ID | UPLOAD-SEC-006 |
| Source Findings | VEN-UPLOAD-008 (MEDIUM) |
| Severity | MEDIUM |
| Surface | upload lib — file.type check |
| Description | MIME type validation uses client-controlled file.type only. No server-side magic-byte inspection. |
| Status | OPEN |
| THOR | Not blocked |

### UPLOAD-SEC-007 — Raw postId UUID in Notification linkPath
| Field | Value |
|---|---|
| ID | UPLOAD-SEC-007 |
| Source Findings | VEN-UPLOAD-010 (LOW) |
| Severity | LOW |
| Surface | notification dispatch after createPost |
| Description | Notification linkPath contains raw postId UUID — /post/:postId. Violates platform no-raw-IDs-in-URLs policy. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | Not blocked |

### UPLOAD-SEC-008 — Blocked Actors Visible in Mention Autocomplete
| Field | Value |
|---|---|
| ID | UPLOAD-SEC-008 |
| Source Findings | VEN-UPLOAD-002, VEN-UPLOAD-006 (MEDIUM) |
| Severity | MEDIUM |
| Surface | controller/searchMentionSuggestions.controller.js |
| Description | searchMentionSuggestions passes viewerActorId as null — filterValidActorIdsDAL accepts inactive/blocked actors as mention targets. |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
