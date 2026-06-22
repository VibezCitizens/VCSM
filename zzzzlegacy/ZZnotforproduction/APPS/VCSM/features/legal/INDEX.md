---
name: vcsm.legal.index
description: VCSM legal feature source inventory — rebuilt by ARCHITECT 2026-06-06
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-06
---

# INDEX — VCSM / features / legal

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-06

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 2 | legalConsent.controller.js (primary — 7 fns: getActiveLegalDocuments, invalidateLegalDocsCache, invalidateConsentCache, getUserConsentStatus, recordLegalAcceptance, recordSignupConsent, resolveLegalGateForSession, acceptRequiredConsents), legalDocument.controller.js |
| DAL files | 4 active, 1 dead | userConsents.write.dal.js, userConsents.read.dal.js, legalDocuments.read.dal.js — active; getPublicIp.dal.js — DEAD (never imported, file says NOT CALLED) |
| Engine | 1 | legalCompliance.engine.js — pure compliance comparison, no side effects |
| Hooks | 3 | useLegalConsent.js (real hook), useSignupConsent.js (thin wrapper — not a real hook), useLegalDocument.js |
| Models | 0 | None — compliance logic in internal engine |
| Screens | 9 | ConsentGateScreen.jsx, LegalDocumentScreen.jsx, HowToCreateVportScreen.jsx, HowToCreateProfileScreen.jsx, VportCategoryLandingScreen.jsx, AboutScreen.jsx, AboutView.jsx, ContactScreen.jsx, ContactView.jsx |
| Components | 0 | No standalone component files (screen-embedded only: ProfilePhonePreview.jsx in screens/components/) |
| Adapters | 1 | legal.adapter.js — exports: useLegalConsent, useSignupConsent, ConsentGateScreen, recordSignupConsent |
| Tests | 0 | No tests exist anywhere in this feature |
| Config | 1 | vportLandingContent.js |
| Styles | 1 | legalDocument.css |
| Docs | 3 | AgeVerificationContent.jsx, PrivacyPolicyContent.jsx, TermsOfServiceContent.jsx |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| INSERT | platform | user_consents | dalRecordLegalAcceptance |

## Read Surface Map

| Operation | Schema | Object | Function |
|---|---|---|---|
| SELECT | platform | public_legal_documents_v (view) | dalGetActiveLegalDocuments, dalGetLegalDocument |
| SELECT | platform | user_consents | dalGetUserConsents |

## Security-Sensitive Surfaces

**platform.user_consents (INSERT):** Compliance-critical write surface tied to `auth.users.id`.
- `accepted_at` intentionally omitted — DB uses `DEFAULT now()` (server-authoritative)
- `ip_address` intentionally null — server-side capture deferred (Carnage task, no ticket yet)
- `locale` and `user_agent` captured from `navigator` — informational only, not legal evidence
- RLS policy scope on `platform.user_consents` not audited from static scan — VENOM review required

## Dead Code

| File | Status | Reason |
|---|---|---|
| `dal/getPublicIp.dal.js` | DEAD | Never imported anywhere; file comment confirms NOT CALLED; retained for reference |

## Engine Dependencies

- Internal: `legalCompliance.engine.js` — pure compliance comparison engine (not a shared engines/ module)
- No shared `engines/` dependencies detected

## Gate Topology

ConsentGateScreen is NOT a route. It is rendered by `apps/VCSM/src/app/guards/ProtectedRoute.jsx`.

Gate ordering in ProtectedRoute.jsx:
1. Auth hydration loading → return null
2. No user → Navigate to /login
3. Email not verified → VerifyEmailRequiredScreen
4. Consent loading → return null
5. requiresConsent → ConsentGateScreen (blocks full app)
6. All passed → `<Outlet />`

## Consumers of legal.adapter.js

| File | What it consumes |
|---|---|
| apps/VCSM/src/app/guards/ProtectedRoute.jsx | useLegalConsent, ConsentGateScreen |
| apps/VCSM/src/features/auth/hooks/useRegister.js | recordSignupConsent (via useSignupConsent) |
| apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js | recordSignupConsent |

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (PLACEHOLDER — substantive contract not written) |
| ARCHITECTURE.md | PRESENT (updated 2026-06-06) |
| SECURITY.md | PRESENT |
