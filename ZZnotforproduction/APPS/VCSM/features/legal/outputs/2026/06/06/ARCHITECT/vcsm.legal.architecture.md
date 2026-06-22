---
name: vcsm.legal.architecture.2026-06-06
description: ARCHITECT run output — VCSM:legal targeted scan — ConsentGateScreen focus
metadata:
  type: architect-output
  run-date: 2026-06-06
  scope: targeted — legal module / consent gate
  trigger: user screenshot — Review Our Policies screen at localhost:5173/feed
---

# ARCHITECT OUTPUT — VCSM:legal — 2026-06-06

**Trigger:** User screenshot showing ConsentGateScreen rendered at `/feed` for NULL_IDENTITY user.
**Scope:** Targeted scan — legal feature, consent gate, and auth guard integration.

---

## Source Files Read

| File | Status |
|---|---|
| apps/VCSM/src/features/legal/screens/ConsentGateScreen.jsx | READ |
| apps/VCSM/src/features/legal/controllers/legalConsent.controller.js | READ |
| apps/VCSM/src/features/legal/engine/legalCompliance.engine.js | READ |
| apps/VCSM/src/features/legal/hooks/useLegalConsent.js | READ |
| apps/VCSM/src/features/legal/hooks/useSignupConsent.js | READ |
| apps/VCSM/src/features/legal/dal/legalDocuments.read.dal.js | READ |
| apps/VCSM/src/features/legal/dal/userConsents.read.dal.js | READ |
| apps/VCSM/src/features/legal/dal/userConsents.write.dal.js | READ |
| apps/VCSM/src/features/legal/dal/getPublicIp.dal.js | READ — DEAD |
| apps/VCSM/src/features/legal/adapters/legal.adapter.js | READ |
| apps/VCSM/src/features/legal/controllers/legalDocument.controller.js | READ |
| apps/VCSM/src/app/guards/ProtectedRoute.jsx | READ |
| apps/VCSM/src/app/providers/AuthProvider.jsx | READ |
| apps/VCSM/src/features/auth/adapters/auth.adapter.js | READ |
| apps/VCSM/src/features/auth/components/ConsentCheckbox.jsx | READ |

---

## Call Chain — ConsentGateScreen

```
ProtectedRoute.jsx
  ├── useAuth()                          → AuthProvider.jsx — session hydration
  ├── useEmailVerified(user)             → auth.adapter.js
  └── useLegalConsent()                  → hooks/useLegalConsent.js
        └── resolveLegalGateForSession() → controllers/legalConsent.controller.js
              ├── getActiveLegalDocuments()
              │     └── dalGetActiveLegalDocuments()
              │           └── platform.public_legal_documents_v (SELECT)
              └── getCachedUserConsents()
                    └── dalGetUserConsents()
                          └── platform.user_consents (SELECT)
              └── buildConsentComplianceStatus()
                    └── engine/legalCompliance.engine.js (pure)

ConsentGateScreen.jsx
  ├── props: requiredActions, accepting, error, onAccept, gateError, onRetry, loading
  ├── local state: termsAccepted (useState)
  ├── onAccept → acceptAll() → acceptRequiredConsents()
  │     └── recordLegalAcceptance()
  │           └── dalRecordLegalAcceptance()
  │                 └── platform.user_consents (INSERT)
  └── ConsentCheckbox ← auth.adapter.js ← auth/components/ConsentCheckbox.jsx
```

---

## New Findings vs 2026-06-04 Run

| Finding | Type | Severity | Detail |
|---|---|---|---|
| `getPublicIp.dal.js` is dead | Dead code | MEDIUM | Zero importers confirmed by grep. File comment says "NOT CALLED". Retained for reference only — should be deleted. |
| `useSignupConsent.js` is not a real hook | Architecture | LOW | Returns `{ recordSignupConsent }` with no React hook APIs (no useState, useEffect, useCallback). It's a plain function re-exporter with misleading "use" prefix. |
| ConsentCheckbox ownership gap | Architecture note | INFO | Component owned by auth feature; logically a legal concern. Consumed via approved adapter boundary. No violation — monitor for future move to legal/components/. |
| BEHAVIOR.md still PLACEHOLDER | Contract gap | HIGH | No change since 2026-06-04. Feature is legally sensitive — contract is overdue. |
| Zero tests still | Coverage gap | HIGH | No change since 2026-06-04. legalCompliance.engine.js is pure and testable. |

---

## Architecture Observations

### Gate topology confirmed
ConsentGateScreen is not a route. It is a blocking overlay rendered by ProtectedRoute.jsx. The gate is evaluated on every protected route load via the hook + controller + TTL cache chain. The TTL window (60s docs, 90s consents) is the maximum non-enforcement window after a policy version bump.

### Fail-closed confirmed
- If `resolveLegalGateForSession` throws → hook sets `gateError=true`, `requiresConsent=true`, blocks gate entry
- If active docs are empty → controller throws → same fail-closed path
- Empty doc result is NOT cached (intentional safety guard in controller)

### Cache invalidation confirmed
After a successful `recordLegalAcceptance`, `invalidateConsentCache(userId, appId)` is called. The next gate check will re-fetch from DB, confirming the new consent state.

### IP address gap
`platform.user_consents.ip_address` is null for all consent rows. The deferred Carnage task has no associated ticket. This gap means consent records lack a forensically-useful server-authoritative IP — all other timing fields (accepted_at via DB DEFAULT) are server-authoritative.

---

## Behavior Consistency Check — legal

```
BEHAVIOR.md present: YES
Status: PLACEHOLDER

Check A (Source without behavior): FAIL — source well-developed, contract not written
Check B (Behavior without source): N/A — no behaviors declared
Check C (§13 engine consistency): PASS — internal engine only, no shared engines/ imports
Check D (§6 data change consistency): PASS — one INSERT on platform.user_consents, confirmed
```

---

## Recommendations

| Priority | Action | Owner |
|---|---|---|
| P1 | Write substantive BEHAVIOR.md | LOGAN |
| P1 | Add tests for legalCompliance.engine.js | SPIDER-MAN |
| P2 | Delete getPublicIp.dal.js | WOLVERINE |
| P2 | Audit RLS on platform.user_consents | VENOM |
| P2 | Create Carnage ticket for server-side IP capture | CARNAGE |
| P3 | Convert useSignupConsent.js to plain export | WOLVERINE |
