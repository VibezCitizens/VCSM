---
title: Business Card Module — Security
status: STUB
feature: public
module: business-card
source: venom+bw-derived
created: 2026-06-05
---

# public / modules / business-card — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — BC-SEC-001, BC-SEC-002**

## Findings

### BC-SEC-001 — Edge Function Anon Key + No Rate Limit = SES Spam Relay [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | BC-SEC-001 |
| Source Findings | VEN-PUBLIC-001, BW-PUBLIC-005 (HIGH), BW-PUBLIC-007 (HIGH) |
| Severity | HIGH |
| Surface | dal/sendLeadConfirmationEmail.edge.dal.js; dal/vportBusinessCardLead.write.dal.js |
| Description | Edge function send-lead-confirmation accepts any "Bearer" token including the public anon key bundled in the frontend. No rate limiting. No idempotency token. p_ip hardcoded null. An attacker can trigger unlimited lead submissions, flooding the VPORT owner's notification inbox and abusing the SES email relay. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### BC-SEC-002 — Raw Actor UUID in Owner Notification linkPath [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | BC-SEC-002 |
| Source Findings | VEN-PUBLIC-003, BW-PUBLIC-010 (MEDIUM) |
| Severity | MEDIUM |
| Surface | lead notification record → linkPath |
| Description | Owner notification linkPath contains raw actorId UUID. Violates no-raw-IDs-in-URLs policy. Adversarially PARTIAL. |
| Status | OPEN |
| THOR | BLOCKS RELEASE (governance) |

### BC-SEC-003 — navigator.userAgent Collected Without Disclosure
| Field | Value |
|---|---|
| ID | BC-SEC-003 |
| Source Findings | VEN-PUBLIC-002 (MEDIUM) |
| Severity | MEDIUM |
| Surface | useVportBusinessCardLeadForm.js |
| Description | navigator.userAgent silently collected client-side and stored in DB with lead PII. No disclosure to visitor before submission. Privacy compliance gap. |
| Status | OPEN |
| THOR | Not blocked |

### BC-SEC-004 — Phone Validation Accepts Junk Input
| Field | Value |
|---|---|
| ID | BC-SEC-004 |
| Source Findings | BW-PUBLIC-015 (LOW) |
| Severity | LOW |
| Surface | vportBusinessCard.model.js or view → toSafePhone() |
| Description | toSafePhone() permits '+', ',', '.' as valid characters. Single-char phone passes contact validation. |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
