---
title: Consent Module — Index
status: STUB
feature: legal
module: consent
source: architect-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/legal/
scanner-version: 1.1.0
---

# legal / modules / consent

Compliance-critical write path. Owns the consent gate flow (block access until legal accepted), signup consent recording, and re-consent flows. The only write surface in the legal feature. Highest-severity module in the codebase by compliance risk.

## Module Summary

| Field | Value |
|---|---|
| Module | consent |
| Feature | legal |
| Source Path | apps/VCSM/src/features/legal/ |
| Screens | 1 (ConsentGateScreen.jsx) |
| Routes | 0 (gate screen mounted by app shell / auth flow) |
| Write Surfaces | 1 (platform.user_consents INSERT) |
| Controllers | 1 (legalConsent.controller.js — gate, signup, re-consent) |
| Hooks | 2 |
| DAL Files | 3 (1 dead code) |
| THOR Blockers | 2 (VEN-LEGAL-001/BW-LEGAL-001, BW-LEGAL-002) |

## Known Source Files (ARCHITECT-verified)

### Screens
| File | Role | Notes |
|---|---|---|
| screens/ConsentGateScreen.jsx | Blocks app access until consent accepted; renders document links | THOR BLOCKER: content_url from DB passed to Link to= unvalidated |

### Controllers
| File | Role |
|---|---|
| controllers/legalConsent.controller.js | Primary — consent gate check, recordSignupConsent, re-consent flow |

### Hooks
| File | Role |
|---|---|
| hooks/useLegalConsent.js | Consent state management — gate status, pending consent check |
| hooks/useSignupConsent.js | Signup-specific consent recording hook |

### DAL
| File | Role | Notes |
|---|---|---|
| dal/userConsents.write.dal.js | dalRecordLegalAcceptance → platform.user_consents INSERT | No ON CONFLICT guard |
| dal/userConsents.read.dal.js | Reads existing consent records for gate check | |
| dal/getPublicIp.dal.js | IP capture for consent audit — DEAD CODE (never called) | VEN-LEGAL-003 |

## Write Surfaces

| Operation | Schema | Table | Notes |
|---|---|---|---|
| INSERT | platform | user_consents | No INSERT WITH CHECK RLS — THOR BLOCKER |

## Compliance Notes (ARCHITECT-derived)

- `accepted_at` is intentionally omitted from INSERT — DB `DEFAULT now()` provides server-authoritative timestamp
- `ip_address` is intentionally null — server-side capture deferred (Carnage task documented in controller)
- `locale` and `user_agent` captured from `navigator` at insert time — informational only

## Security Flags

- THOR BLOCKER: VEN-LEGAL-001 / BW-LEGAL-001 — no `INSERT WITH CHECK` RLS on platform.user_consents; controller accepts arbitrary userId with no session cross-check; adapter exports recordSignupConsent directly to UI
- THOR BLOCKER: BW-LEGAL-002 / BW-LEGAL-007 — DB-controlled content_url passed to React Router `Link to=` unvalidated; no rel="noopener noreferrer"; open redirect + tabnapping
- MEDIUM: BW-LEGAL-003 — no ON CONFLICT guard in dalRecordLegalAcceptance; concurrent calls produce duplicate audit rows
- MEDIUM: BW-LEGAL-004 — null userId propagates to DB error rather than clean rejection
- MEDIUM: BW-LEGAL-005 — consent cache not invalidated on logout (stale memory hygiene)
- LOW: VEN-LEGAL-004 — recordSignupConsent accepts caller-supplied userId without session cross-check

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm legalConsent.controller.js entry points — how many exported functions? (gate, signup, re-consent?)
- [ ] Confirm RLS policy on platform.user_consents — does INSERT WITH CHECK exist or is it absent?
- [ ] Document consent gate trigger — what mounts ConsentGateScreen? (app shell, router guard, useEffect?)
- [ ] Confirm useLegalDocument dependency — does consent gate import document content from documents module?
- [ ] Confirm dead code status of getPublicIp.dal.js — verify zero call sites
