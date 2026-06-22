---
title: Invite Module — Security
status: STUB
feature: invite
module: invite
source: venom+bw-derived
created: 2026-06-05
---

# invite / modules / invite — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — INVITE-SEC-001, INVITE-SEC-002, INVITE-SEC-003, INVITE-SEC-004**

## Findings

### INVITE-SEC-001 — O(n) auth.admin.listUsers() DoS Vector [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | INVITE-SEC-001 |
| Source Findings | VEN-INVITE-001, BW-INVITE-006 |
| Severity | HIGH — THOR BLOCKER |
| Surface | send-citizen-invite Edge Function → auth.admin.listUsers() |
| Description | Edge Function performs a full O(n) scan of all auth users to check if the target email is already registered. An authenticated actor can send N invites to trigger N full user-table scans. DoS amplification confirmed adversarially BYPASSED (BW-INVITE-006). Fix: replace with a targeted SELECT WHERE email = $1 query or auth.admin.getUserByEmail(). |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### INVITE-SEC-002 — invite_code Returned to Sender Client [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | INVITE-SEC-002 |
| Source Findings | VEN-INVITE-002, BW-INVITE-004 |
| Severity | HIGH — THOR BLOCKER |
| Surface | send-citizen-invite Edge Function response → client |
| Description | The one-time invite redemption token (invite_code) is returned in the Edge Function response and available to the sender's client. Sender can forward the token to unintended recipients, bypassing per-recipient control. Also readable via readVibeInvitesDAL from vc.vibe_invites (RLS unverified — INVITE-SEC-005). Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### INVITE-SEC-003 — No Rate Limiting or Deduplication (SES Spam Relay) [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | INVITE-SEC-003 |
| Source Findings | VEN-INVITE-004, BW-INVITE-002 |
| Severity | HIGH — THOR BLOCKER |
| Surface | send-citizen-invite Edge Function |
| Description | No per-user rate limiting. No invite deduplication. An authenticated user can send unlimited invite emails to the same target in rapid succession. This is a direct SES/email relay abuse vector. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### INVITE-SEC-004 — Invite Redemption Entirely Unimplemented [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | INVITE-SEC-004 |
| Source Findings | BW-INVITE-005 |
| Severity | HIGH — THOR BLOCKER |
| Surface | useRegister.js:35 (auth feature) |
| Description | Invite redemption is completely unimplemented. The invite_code is parsed from the URL at useRegister.js:35 with a TODO comment but never validated server-side. Any crafted URL passes. Invite links are non-functional for their intended purpose. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### INVITE-SEC-005 — rawDebugError in Public Hook API
| Field | Value |
|---|---|
| ID | INVITE-SEC-005 |
| Source Findings | VEN-INVITE-003 |
| Severity | MEDIUM |
| Surface | hooks/useInvite.js → rawDebugError export |
| Description | rawDebugError is exported unconditionally from useInvite(). Internal error state (possibly including network errors, stack traces, or server error messages) is exposed to all consumers of the hook. |
| Status | OPEN |
| THOR | Not blocked |

### INVITE-SEC-006 — vibe_invites RLS Unverified
| Field | Value |
|---|---|
| ID | INVITE-SEC-006 |
| Source Findings | BW-INVITE-001 |
| Severity | MEDIUM |
| Surface | dal (UNLOCATED) → readVibeInvitesDAL → vc.vibe_invites SELECT |
| Description | vc.vibe_invites RLS policy unverified. If reads are not restricted to the token owner, cross-actor invite_code token reads are possible. Combined with INVITE-SEC-002, this creates a full token exfiltration path. |
| Status | OPEN — UNVERIFIED |
| THOR | Not blocked independently |

### INVITE-SEC-007 — Raw UUID in Invite URL
| Field | Value |
|---|---|
| ID | INVITE-SEC-007 |
| Source Findings | BW-INVITE-003 |
| Severity | LOW |
| Surface | Invite URL construction |
| Description | Raw UUID in the public-facing invite URL. Platform policy for token-based URLs is ambiguous — token URLs may be an accepted exception. Needs policy clarification. |
| Status | OPEN — policy ambiguity |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature. Run before next release.

## Remediation Priority

1. INVITE-SEC-001: replace auth.admin.listUsers() with auth.admin.getUserByEmail()
2. INVITE-SEC-002: remove invite_code from Edge Function response
3. INVITE-SEC-003: add per-user rate limit (e.g. 10 invites/hour) + deduplication by (inviter, target_email)
4. INVITE-SEC-004: implement server-side invite_code validation in registration flow
5. INVITE-SEC-005: remove rawDebugError from useInvite() exports; add invite.adapter.js
