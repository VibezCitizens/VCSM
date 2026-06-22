---
title: Consent Module — Security
status: STUB
feature: legal
module: consent
source: venom-bw-derived
created: 2026-06-05
---

# legal / modules / consent — SECURITY

## Status

STUB. Findings extracted from VENOM and BlackWidow reviews (2026-06-04). This is the highest-risk module in the legal feature — compliance-critical write surface with two THOR blockers.

## Active Security Reviews

| Review | Status | Report |
|---|---|---|
| VENOM | COMPLETE (2026-06-04) | `features/legal/outputs/2026/06/04/Venom/` |
| BlackWidow | COMPLETE (2026-06-04) | `features/legal/outputs/2026/06/04/BlackWidow/` |
| ELEKTRA | NEVER RUN | — |

## THOR BLOCKERS

### CONSENT-SEC-001 — VEN-LEGAL-001 / BW-LEGAL-001

| Field | Value |
|---|---|
| Finding IDs | VEN-LEGAL-001, BW-LEGAL-001 |
| Severity | HIGH — THOR BLOCKER |
| Status | OPEN (app layer BYPASSED, DB layer UNRESOLVED) |
| Surface | dal/userConsents.write.dal.js + controllers/legalConsent.controller.js + adapters/legal.adapter.js |
| Description | No `INSERT WITH CHECK` RLS policy on platform.user_consents. Any authenticated user can fabricate consent records for any user_id. Controller accepts arbitrary userId with no session cross-check. legal.adapter.js (engine module) exports recordSignupConsent directly to UI. |
| Risk | Consent fabrication — attacker can create consent records for other users without their knowledge or agreement |
| Backstop | None confirmed at DB layer |

### CONSENT-SEC-002 — BW-LEGAL-002 / BW-LEGAL-007

| Field | Value |
|---|---|
| Finding IDs | BW-LEGAL-002, BW-LEGAL-007 |
| Severity | HIGH — THOR BLOCKER |
| Status | BYPASSED (open) |
| Surface | screens/ConsentGateScreen.jsx |
| Description | DB-controlled content_url passed unvalidated to React Router `Link to=` with `target="_blank"`. No `rel="noopener noreferrer"`. Open redirect during consent gate flow — attacker who can modify DB document record can redirect users during consent. |
| Risk | Open redirect + tabnapping via database content injection |

## Other Open Findings

### CONSENT-SEC-003 — BW-LEGAL-003

| Field | Value |
|---|---|
| Finding ID | BW-LEGAL-003 |
| Severity | MEDIUM |
| Status | PARTIAL (open) |
| Surface | dal/userConsents.write.dal.js (dalRecordLegalAcceptance) |
| Description | No ON CONFLICT guard — concurrent calls produce duplicate audit rows in platform.user_consents |

### CONSENT-SEC-004 — BW-LEGAL-004

| Field | Value |
|---|---|
| Finding ID | BW-LEGAL-004 |
| Severity | MEDIUM |
| Status | PARTIAL (open) |
| Surface | controllers/legalConsent.controller.js entry points |
| Description | No input validation for userId — null userId propagates to DB error surface rather than clean rejection |

### CONSENT-SEC-005 — BW-LEGAL-005

| Field | Value |
|---|---|
| Finding ID | BW-LEGAL-005 |
| Severity | MEDIUM |
| Status | PARTIAL (open) |
| Surface | hooks/useLegalConsent.js (cache) |
| Description | Consent cache not invalidated on user logout — module-level TTL caches survive auth state changes |

### CONSENT-SEC-006 — VEN-LEGAL-004

| Field | Value |
|---|---|
| Finding ID | VEN-LEGAL-004 |
| Severity | LOW |
| Status | OPEN |
| Surface | controllers/legalConsent.controller.js (recordSignupConsent) |
| Description | recordSignupConsent accepts caller-supplied userId without cross-checking against session identity |

## TODO

- [ ] Run ELEKTRA on legal feature (never run)
- [ ] Verify platform.user_consents RLS policy — does INSERT WITH CHECK exist?
- [ ] Add userId === auth.uid() assertion to legalConsent.controller.js entry points
- [ ] Add ON CONFLICT clause to dalRecordLegalAcceptance
- [ ] Validate or sanitize content_url before passing to Link to=
- [ ] Add rel="noopener noreferrer" to target="_blank" links in ConsentGateScreen
