---
title: Consent Module — Behavior
status: STUB
feature: legal
module: consent
source: architect-derived
created: 2026-06-05
---

# legal / modules / consent — BEHAVIOR

## Status

STUB. Feature-level BEHAVIOR.md is a PLACEHOLDER (THOR BLOCKER: BW-LEGAL-006). No behavior contract exists at any level. All entries below are seeded from ARCHITECT and VENOM/BW evidence. Verification required.

## Expected Behaviors (unverified — ARCHITECT-derived)

| ID | Name | Description | Confidence |
|---|---|---|---|
| BEH-LEGAL-CONSENT-001 | Consent Gate Check | On app load / auth, useLegalConsent checks if user has accepted current document version; blocks access if not | UNVERIFIED |
| BEH-LEGAL-CONSENT-002 | Record Signup Consent | recordSignupConsent called during user registration; inserts row to platform.user_consents with userId, documentId, version | UNVERIFIED |
| BEH-LEGAL-CONSENT-003 | Re-Consent Flow | When document version changes, gate re-activates for users with old consent version; requires new acceptance | UNVERIFIED |
| BEH-LEGAL-CONSENT-004 | Accept Consent | User taps accept in ConsentGateScreen; dalRecordLegalAcceptance fires; gate dismissed on success | UNVERIFIED |
| BEH-LEGAL-CONSENT-005 | Consent Cache | useLegalConsent caches gate status; cache persists through session but not invalidated on logout (BW-LEGAL-005) | UNVERIFIED — SECURITY FINDING |
| BEH-LEGAL-CONSENT-006 | Server Timestamp | accepted_at NOT sent from client — DB DEFAULT now() provides server-authoritative timestamp | UNVERIFIED (ARCHITECT note) |

## Behavior Flow (unverified)

### Consent Gate Flow
```
[App shell / auth route guard]
  └── useLegalConsent.js → legalConsent.controller.js (gate check)
        └── userConsents.read.dal.js → platform.user_consents (existing record)
        └── legalCompliance.engine.js (version comparison)
  → needsConsent=true → ConsentGateScreen.jsx mounted
        └── [user accepts] → useLegalConsent → legalConsent.controller.js (record)
              └── userConsents.write.dal.js → platform.user_consents INSERT
```

### Signup Consent Flow
```
[Registration flow]
  └── useSignupConsent.js → legalConsent.controller.js (recordSignupConsent)
        └── userConsents.write.dal.js → platform.user_consents INSERT
        [userId from caller — no session cross-check: VEN-LEGAL-004]
```

## TODO

- [ ] Confirm legalConsent.controller.js exports (how many entry points?)
- [ ] Confirm version comparison responsibility — is it in controller or delegated to engine module?
- [ ] Confirm consent cache key and invalidation trigger
- [ ] Document re-consent trigger — what detects a new document version?
- [ ] Confirm whether ConsentGateScreen blocks navigation or renders over existing content
