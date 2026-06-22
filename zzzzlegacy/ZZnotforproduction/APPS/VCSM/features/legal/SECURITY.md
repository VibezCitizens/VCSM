# Security Posture — legal

Last Updated: 2026-06-06
Highest Open Severity: HIGH
THOR Release Blocker: YES — ELEK-2026-06-06-001, ELEK-2026-06-06-002, ELEK-2026-06-06-003

---

## TRIAL STATUS — 2026-06-06

Chain: ARCHITECT → VENOM → BLACKWIDOW → ELEKTRA → CONTRACT REVIEWER
Status: COMPLETE — DO NOT RE-RUN
Next Step: PATCHING PENDING

All five commands ran to completion on 2026-06-06. The full security and
architecture compliance picture for this feature is current. No re-run is
needed until patches are applied and a reverification pass is requested.

| Command | Date | Status | Output |
|---|---|---|---|
| ARCHITECT | 2026-06-06 | COMPLETE | outputs/2026/06/06/ARCHITECT/vcsm.legal.architecture.md |
| VENOM | 2026-06-06 | COMPLETE | outputs/2026/06/06/Venom/2026-06-06_venom_legal-security-review.md |
| BLACKWIDOW | 2026-06-06 | COMPLETE | outputs/2026/06/06/BlackWidow/2026-06-06_blackwidow_legal-adversarial-review.md |
| ELEKTRA | 2026-06-06 | COMPLETE | outputs/2026/06/06/ELEKTRA/2026-06-06_elektra_legal-consent-gate.md |
| CONTRACT REVIEWER | 2026-06-06 | COMPLETE | outputs/2026/06/06/review-contract/2026-06-06_review-contract_legal-feature-audit.md |

Patch advisory available in ELEKTRA report. Apply patches, then run ELEKTRA
reverification only (BLIND_REVERIFY_MODE). Full chain re-run is not required.

---

## VENOM STATUS

VENOM Last Run: 2026-06-06
VENOM Status: COMPLETE

6 findings: 0 CRITICAL, 2 HIGH, 2 MEDIUM, 2 LOW

| Finding ID | Severity | Status | Description |
|---|---|---|---|
| VEN-LEGAL-001 | HIGH | OPEN — SOURCE_VERIFIED 2026-06-07 | RLS on platform.user_consents CONFIRMED OFF — migration 20260510030000 creates policies without ALTER TABLE...ENABLE ROW LEVEL SECURITY; cross-user consent fabrication unprotected at DB layer |
| VEN-LEGAL-002 | HIGH | OPEN | DB-controlled content_url passed unvalidated to Link to= with target="_blank" — open redirect + tabnapping |
| VEN-LEGAL-003 | MEDIUM | OPEN | Dead file getPublicIp.dal.js — external API call in security module; risk of accidental reintroduction |
| VEN-LEGAL-004 | LOW | OPEN | recordSignupConsent exported from adapter — controller write path without session identity cross-check |
| VEN-LEGAL-005 | MEDIUM | OPEN (NEW) | Consent + docs cache not invalidated on logout; legalDocsCache never explicitly cleared — 60–90s non-enforcement window |
| VEN-LEGAL-006 | LOW | OPEN (NEW) | userAppAccountId hardcoded null in all consent writes — compliance records orphaned from user_app_accounts |

Output: ZZnotforproduction/APPS/VCSM/features/legal/outputs/2026/06/06/Venom/2026-06-06_venom_legal-security-review.md

---

## ELEKTRA STATUS

ELEKTRA Last Run: 2026-06-06
ELEKTRA Status: COMPLETE

7 findings: 0 CRITICAL, 3 HIGH, 2 MEDIUM, 2 LOW | False Positives Rejected: 3

| Finding ID | Severity | Status | Description |
|---|---|---|---|
| ELEK-2026-06-06-001 | HIGH | OPEN | Cross-user consent fabrication — no session identity assertion in controller + missing RLS INSERT WITH CHECK on platform.user_consents |
| ELEK-2026-06-06-002 | HIGH | OPEN | Open redirect + tabnapping — DB-controlled content_url unvalidated in getDocRoute(); all 3 Link target="_blank" missing rel="noopener noreferrer" |
| ELEK-2026-06-06-003 | HIGH | OPEN | Consent record flooding DoS — uncapped INSERT (no RLS) + .limit(20) read with no type-scope filter pushes real consent types off evaluation window |
| ELEK-2026-06-06-004 | MEDIUM | OPEN | Consent + legal docs cache not invalidated on logout — 60–90s stale enforcement window; invalidateLegalDocsCache() never called anywhere |
| ELEK-2026-06-06-005 | MEDIUM | OPEN | Duplicate consent rows — no .onConflict() guard + no UNIQUE constraint on (user_id, legal_document_id, consent_version) |
| ELEK-2026-06-06-006 | LOW | OPEN | recordSignupConsent adapter-exported without session cross-check; adapter contract violation |
| ELEK-2026-06-06-007 | LOW | OPEN | userAppAccountId hardcoded null at all consent write sites — compliance records orphaned from user_app_accounts |

Upstream Reconciliation:
- VEN-LEGAL-003 DOWNGRADED → False Positive (dead file — no import path)
- BW-LEGAL-006 DOWNGRADED → False Positive (docs gap — not a code vulnerability)
- BW-LEGAL-007 MERGED → ELEK-002 (tabnapping is Patch B of ELEK-002)
- BW-LEGAL-008 CONFIRMED HARDENED → False Positive (fail-closed verified source)
- BW-LEGAL-009 CONFIRMED → ELEK-003 (full flooding chain traced)

Output: ZZnotforproduction/APPS/VCSM/features/legal/outputs/2026/06/06/ELEKTRA/2026-06-06_elektra_legal-consent-gate.md

---

## BLACKWIDOW STATUS

BLACKWIDOW Last Run: 2026-06-06
BLACKWIDOW Status: COMPLETE

0 CRITICAL, 3 HIGH, 3 MEDIUM, 2 LOW, 1 INFO

| Finding ID | Severity | Result | Status | Description |
|---|---|---|---|---|
| BW-LEGAL-001 | HIGH | BYPASSED | OPEN — DRAFT | Cross-user consent fabrication — no INSERT WITH CHECK RLS; controller accepts arbitrary userId; adapter exports recordSignupConsent without session check |
| BW-LEGAL-002 | HIGH | BYPASSED | OPEN — DRAFT | Open redirect + tabnapping via DB-controlled content_url passed unvalidated to Link to= with target="_blank" and no rel="noopener noreferrer" |
| BW-LEGAL-003 | MEDIUM | PARTIAL | OPEN — DRAFT | Duplicate consent row — no ON CONFLICT guard; UI protection partial (setAccepting window); concurrent API calls produce duplicate audit rows |
| BW-LEGAL-004 | MEDIUM | PARTIAL | OPEN — DRAFT | No userId validation in adapter-exported write path — null/forged userId reaches DB with only NOT NULL constraint as backstop |
| BW-LEGAL-005 | MEDIUM | BYPASSED | OPEN — DRAFT | Cache not cleared on logout; legalDocsCache never force-cleared; 60–90s non-enforcement window on revocation and version bumps |
| BW-LEGAL-006 | LOW | UNRESOLVED | OPEN — DRAFT | BEHAVIOR.md is PLACEHOLDER — all §9 invariants unanchored; all attack scenarios run without contract anchor |
| BW-LEGAL-007 | LOW | BYPASSED | OPEN — DRAFT | All target="_blank" Link elements in ConsentGateScreen lack rel="noopener noreferrer" — tabnapping precondition |
| BW-LEGAL-008 | INFO | BLOCKED | HARDENED | Empty-docs fail-closed gate confirmed — throws on empty activeDocs; hook sets gateError=true; access blocked |
| BW-LEGAL-009 | HIGH | BYPASSED | OPEN — DRAFT (NEW) | Consent record flooding DoS — attacker inserts 20+ fake consent_type rows with future timestamps; real required types pushed off limit(20); victim permanently blocked at gate |

Output: ZZnotforproduction/APPS/VCSM/features/legal/outputs/2026/06/06/BlackWidow/2026-06-06_blackwidow_legal-adversarial-review.md
