---
title: Consent Module — Architecture
status: STUB
feature: legal
module: consent
source: architect-derived
created: 2026-06-05
---

# legal / modules / consent — ARCHITECTURE

## Status

STUB. Architecture sourced from ARCHITECT 2026-06-04 report. Verification required.

## Layer Stack (unverified)

### Consent Gate Flow
```
[App shell / auth guard]
  └── useLegalConsent.js
        └── legalConsent.controller.js (gate check)
              ├── userConsents.read.dal.js → platform.user_consents (existing record)
              └── engine module → legalCompliance.engine.js (version comparison)
  → needsConsent=true → ConsentGateScreen.jsx
        └── [renders document links — content_url from DB → Link to= UNVALIDATED: BW-LEGAL-002]
        └── [user accepts]
              └── useLegalConsent → legalConsent.controller.js (record acceptance)
                    └── userConsents.write.dal.js
                          └── platform.user_consents INSERT (no ON CONFLICT — BW-LEGAL-003)
```

### Signup Consent Flow
```
[Registration handler]
  └── useSignupConsent.js
        └── legalConsent.controller.js (recordSignupConsent)
              └── userConsents.write.dal.js → platform.user_consents INSERT
              [userId from caller, no session cross-check: VEN-LEGAL-004]
```

## Source File Map

| File | Layer | Confirmed |
|---|---|---|
| screens/ConsentGateScreen.jsx | Screen | ARCHITECT-derived |
| controllers/legalConsent.controller.js | Controller (gate + write) | ARCHITECT-derived |
| hooks/useLegalConsent.js | Hook | ARCHITECT-derived |
| hooks/useSignupConsent.js | Hook (signup path) | ARCHITECT-derived |
| dal/userConsents.write.dal.js | DAL (write) | ARCHITECT-derived |
| dal/userConsents.read.dal.js | DAL (read) | ARCHITECT-derived |
| dal/getPublicIp.dal.js | DAL (DEAD CODE) | ARCHITECT-derived |

## Write Surface

| Operation | Schema | Table | Guard |
|---|---|---|---|
| INSERT | platform | user_consents | No INSERT WITH CHECK RLS — THOR BLOCKER |

## DB Schema Notes (ARCHITECT-verified)

- `accepted_at` — NOT in INSERT; DB `DEFAULT now()` is server-authoritative
- `ip_address` — null; server-side capture deferred (Carnage task)
- `locale` — from `navigator.language` at insert time
- `user_agent` — from `navigator.userAgent` at insert time

## Module Boundaries

- Consent gate logic is owned here; version comparison delegated to engine module
- Document content fetching (to display links in gate) comes from documents module
- legal.adapter.js (engine module) is the approved public surface for consuming features

## TODO

- [ ] Confirm whether ConsentGateScreen imports from documents module or has its own document fetch
- [ ] Confirm legalConsent.controller.js session assertion — does it check auth.uid() === userId?
- [ ] Confirm ON CONFLICT behavior — does dalRecordLegalAcceptance have any deduplication?
- [ ] Confirm consent cache invalidation on logout path
