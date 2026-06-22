# Runtime Feature Index: legal

## Metadata

| Field | Value |
|---|---|
| Feature | legal |
| CURRENT Folder | CURRENT/features/legal |
| Source Folder | apps/VCSM/src/features/legal |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |

## Source Inventory

| Layer | Count | Key Files |
|---|---:|---|
| Controllers | 2 | legalConsent.controller.js, legalDocument.controller.js |
| DALs | 4 | legalDocuments.read.dal.js, userConsents.read.dal.js, userConsents.write.dal.js, getPublicIp.dal.js (DEAD — not called) |
| Hooks | 3 | useLegalConsent.js, useLegalDocument.js, useSignupConsent.js |
| Models | 0 | NONE — compliance logic in local engine (legalCompliance.engine.js) |
| Screens | 9 | ConsentGateScreen.jsx, LegalDocumentScreen.jsx, AboutScreen.jsx, AboutView.jsx, ContactScreen.jsx, ContactView.jsx, HowToCreateProfileScreen.jsx, HowToCreateVportScreen.jsx, VportCategoryLandingScreen.jsx |
| Components | 2 | ProfilePhonePreview.jsx, howToProfileContent.js |
| Static Docs | 3 | AgeVerificationContent.jsx, PrivacyPolicyContent.jsx, TermsOfServiceContent.jsx |
| Config | 1 | vportLandingContent.js (VPORT landing SEO content map) |
| Adapters | 1 | legal.adapter.js |
| Engine (local) | 1 | legalCompliance.engine.js (pure, no side effects) |
| Routes | 7 | /legal/:documentType, /about, /contact, /how-to/create-profile, /how-to/create-vport, /vport-landing/:type, ConsentGateScreen (overlay — all auth sessions) |
| Tests | 0 | NONE FOUND |

## Route / Screen Map

| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| /legal/:documentType | screens/LegalDocumentScreen.jsx | PUBLIC | Serves age-verification, privacy-policy, terms-of-service; lazy-loads static content components |
| /about | screens/AboutScreen.jsx, AboutView.jsx | PUBLIC | About VCSM platform |
| /contact | screens/ContactScreen.jsx, ContactView.jsx | PUBLIC | Contact page |
| /how-to/create-profile | screens/HowToCreateProfileScreen.jsx | PUBLIC | Onboarding guide for profile creation |
| /how-to/create-vport | screens/HowToCreateVportScreen.jsx | PUBLIC | Onboarding guide for VPORT creation; imports VportPreviewShowcase from vport adapter |
| /vport-landing/:type (or similar) | screens/VportCategoryLandingScreen.jsx | PUBLIC | SEO landing pages per VPORT category (barber, barbershop, restaurant, locksmith, gas-station, money-exchange) |
| ConsentGateScreen | screens/ConsentGateScreen.jsx | AUTH (session-blocking gate) | Renders for every authenticated session until all required active legal docs are accepted; fails closed on gate check error |

## Mutation Surface Map

| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| legalConsent.controller.js — recordLegalAcceptance | controllers/legalConsent.controller.js | INSERT (platform.user_consents) | PARTIAL — userId passed from auth session; DB RLS migration 20260510030000 tracked; live confirmation UNCONFIRMED statically | MEDIUM |
| legalConsent.controller.js — recordSignupConsent | controllers/legalConsent.controller.js | INSERT (platform.user_consents via recordLegalAcceptance) | PARTIAL — same as above | MEDIUM |
| legalConsent.controller.js — acceptRequiredConsents | controllers/legalConsent.controller.js | INSERT (re-consent path) | PARTIAL — same as above | MEDIUM |
| userConsents.write.dal.js | dal/userConsents.write.dal.js | INSERT only — immutable; accepted_at is DB DEFAULT; ip_address intentionally omitted | PARTIAL — RLS migration tracked | MEDIUM |
| useSignupConsent.js (adapter export) | hooks/useSignupConsent.js | Passes through to recordSignupConsent | N/A — thin wrapper | MEDIUM — see NEW-LEGAL-JOIN-001 |

## Security-Sensitive Surface Map

| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| ConsentGateScreen — gate error path | screens/ConsentGateScreen.jsx | AUTH | F1 RESOLVED: gate now fails closed; gateError state blocks entry with retry; no silent pass-through |
| resolveLegalGateForSession | controllers/legalConsent.controller.js | AUTH | Throws on empty docs (platform config error); hook catches and sets requiresConsent: true |
| userConsents.write.dal.js — consent insert | dal/userConsents.write.dal.js | DB_RLS / PRIVACY | F3 RESOLVED: INSERT GRANT + immutability migration 20260510030000 tracked; live application UNCONFIRMED statically |
| recordLegalAcceptance — locale/userAgent | controllers/legalConsent.controller.js | PRIVACY | F4 PARTIAL OPEN: ip_address omitted from writes; locale/userAgent still read from navigator (client-supplied); server-side IP capture CARNAGE task OPEN |
| useSignupConsent.js — silent failure path | hooks/useSignupConsent.js | PRIVACY | NEW-LEGAL-JOIN-001 OPEN: callers may swallow consent write failures with .catch(() => {}); consent record may not be created at signup without error surfacing |
| getPublicIp.dal.js | dal/getPublicIp.dal.js | PRIVACY | NOT CALLED — annotated dead code; retained as reference; external API call (api.ipify.org) |
| VportCategoryLandingScreen — barbershop route | screens/VportCategoryLandingScreen.jsx | UNKNOWN | F6 DORMANT: route may be unregistered in app router; risk classified LOW |
| legalDocsCache / consentCache | controllers/legalConsent.controller.js | LOGIC | TTL cache: docs 60s, consents 90s; empty docs never cached (prevents false-compliance window); cache invalidation on consent write |

## Adapter Exports

| Export | Type | Notes |
|---|---|---|
| useSignupConsent | Hook | Re-exported from hooks layer |
| useLegalConsent | Hook | Re-exported from hooks layer |
| ConsentGateScreen | Screen component | Default export re-exported |
| recordSignupConsent | Controller function | Exported directly for cross-feature callers (e.g. join controller) that cannot use React hooks |

## Cross-Feature Dependencies

| Feature | Imported | Via Adapter | Notes |
|---|---|---|---|
| auth | authTheme, ConsentCheckbox | YES — @/features/auth/adapters/auth.adapter | Used in ConsentGateScreen and LegalDocumentScreen for visual theme |
| vport | VportPreviewShowcase | YES — @/features/vport/adapters/vport.public.adapter | Used in HowToCreateVportScreen and VportCategoryLandingScreen |

## Open Findings

| Finding | Status | Notes |
|---|---|---|
| F4 PARTIAL — locale/userAgent client-supplied | OPEN | ip_address omitted; locale/UA remain; Carnage task for Edge Function |
| NEW-LEGAL-JOIN-001 — silent signup consent failure | OPEN | .catch(() => {}) in join controller swallows write errors |
| F6 — barbershop route unregistered | DORMANT LOW | Pre-fixes complete; route may still be absent from router |
| ELEKTRA — never run | GAP | Source-to-sink trace for HIGH-tier consent feature |
| SPIDER-MAN — never run | GAP | Zero test files for session-blocking gate |
| migration 20260510030000 live deploy | UNCONFIRMED | Migration tracked; live application not statically confirmable |

## Runtime Risk Summary

Legal is a HIGH-tier session-blocking consent gate (26 files, 2 controllers, 4 DALs, 3 hooks, 9 screens). All original CRITICAL findings (F1 gate fails open, F2 syntheticAdultBirthdate) are resolved. Gate now fails closed. Core write path inserts immutable consent rows with DB-authoritative timestamps. Two open items remain: server-side IP capture (CARNAGE task) and silent consent write failure (NEW-LEGAL-JOIN-001). Public informational routes (/legal/*, /about, /contact, /how-to/*) are read-only. No upload/media routes. Architecture is STABLE. ELEKTRA and SPIDER-MAN are priority gaps for a HIGH-tier feature.

## Recommended Next Command

ELEKTRA

## Recommended Next Ticket

TICKET-LEGAL-RUNTIME-001 — CARNAGE: server-side IP capture Edge Function (closes F4 OPEN); confirm live deployment of migration `20260510030000` (INSERT GRANT + immutability); fix NEW-LEGAL-JOIN-001 (.catch(() => {}) in join controller).
