---
name: vcsm.legal.architecture
description: ARCHITECT V2 module architecture report for VCSM:legal
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-06
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** legal
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/legal
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The legal module manages platform consent compliance for VCSM. It fetches active legal documents from the `platform` schema, checks whether authenticated users have accepted all required document versions, and records new consent acceptances. It also serves public-facing how-to and marketing screens (HowToCreateVportScreen, VportCategoryLandingScreen, ContactScreen, AboutScreen) and embeds full legal document text (TermsOfService, PrivacyPolicy, AgeVerification) as renderable JSX content.

The consent gate (`ConsentGateScreen`) is rendered by the app-level `ProtectedRoute.jsx` guard — it is not a navigated route. Gate ordering: auth check → email verification → consent gate → `<Outlet />`.

## OWNERSHIP

Feature domain: Platform compliance and legal onboarding. This module owns the consent gate pattern that blocks app entry when a user has not accepted the current version of any required document. It is consumed at app boot by the auth layer (`useSignupConsent` during registration) and at session entry (`useLegalConsent` in the `ProtectedRoute` guard). Secondary ownership covers public marketing screens that direct unauthenticated visitors to create a VPORT or profile.

## ENTRY POINTS

- `ConsentGateScreen` — rendered by `apps/VCSM/src/app/guards/ProtectedRoute.jsx` whenever `useLegalConsent` returns `requiresConsent: true`. Not a route — rendered as a blocking overlay in the auth guard.
- `LegalDocumentScreen` — public route rendering a specific legal document by type (e.g., `/legal/privacy-policy`)
- `HowToCreateVportScreen` — public route at `/how-to/create-vport` (SEO landing page)
- `HowToCreateProfileScreen` — public route for profile creation how-to
- `VportCategoryLandingScreen` — public category landing pages (e.g., `/vport/barber`)
- `AboutScreen` / `ContactScreen` — public static screens
- `legal.adapter.js` — cross-feature boundary: exports `useSignupConsent`, `useLegalConsent`, `ConsentGateScreen`, and `recordSignupConsent` to other features

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 5 | `userConsents.write.dal.js`, `userConsents.read.dal.js`, `legalDocuments.read.dal.js`, `getPublicIp.dal.js` (DEAD — never imported), `legalDocument.controller.js` |
| Model | 0 | None — compliance logic lives in internal engine |
| Engine | 1 | `legalCompliance.engine.js` — pure compliance comparison (not a shared engines/ dependency) |
| Controller | 2 | `legalConsent.controller.js` (primary — 7 exported fns), `legalDocument.controller.js` |
| Service | N/A | Engine-layer pattern used instead |
| Adapter | 1 | `legal.adapter.js` |
| Hook | 3 | `useLegalConsent.js`, `useSignupConsent.js` (thin wrapper — no real hook APIs used), `useLegalDocument.js` |
| Component | 0 | No standalone component files (screen-embedded only; `ProfilePhonePreview.jsx` in `screens/components/`) |
| Screen | 9 | `ConsentGateScreen.jsx`, `LegalDocumentScreen.jsx`, `HowToCreateVportScreen.jsx`, `HowToCreateProfileScreen.jsx`, `VportCategoryLandingScreen.jsx`, `AboutScreen.jsx`, `AboutView.jsx`, `ContactScreen.jsx`, `ContactView.jsx` |

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | BEHAVIOR.md is PLACEHOLDER | Full contract missing — only status comment present |
| Owner defined | PARTIAL | Feature pattern and adapter exist | No explicit ownership record |
| Entry points mapped | PASS | Adapter exports, public screens, consent gate all confirmed in source | |
| Controllers present/delegated | PASS | legalConsent.controller.js covers gate, signup, re-consent, invalidation | |
| DAL/repository present/delegated | PASS | Read + write surfaces confirmed; 1 dead DAL file (`getPublicIp.dal.js`) flagged | Dead file should be removed |
| Models/transformers present | FAIL | 0 model files; compliance logic in engine, not a model layer | No normalization model for consent/document objects |
| Hooks/view models present | PASS | useLegalConsent.js is well-formed; useSignupConsent.js is architecturally thin | useSignupConsent doesn't use React hook APIs — it's a plain function wrapper |
| Screens/components present | PASS | ConsentGateScreen, LegalDocumentScreen, public pages all present | |
| Services/adapters present | PASS | legal.adapter.js exports stable boundary; recordSignupConsent export documented as intentional exception | |
| Database objects mapped | PASS | platform.user_consents (insert), platform.public_legal_documents_v (read) | ip_address column is null for all consents — deferred Carnage task |
| Authorization path mapped | PASS | useLegalConsent reads from AuthProvider; gate fails closed on any error | RLS on platform.user_consents not audited |
| Cache/runtime behavior mapped | PASS | TTL caches (60s docs, 90s consents) with per-user+appId keyed invalidation in legalConsent.controller.js | |
| Error/loading/empty states mapped | PASS | ConsentGateScreen renders gateError state with retry; useLegalConsent exposes loading, error, gateError, retryConsent | |
| Documentation linked | FAIL | BEHAVIOR.md is a PLACEHOLDER | Full behavior contract not written |
| Tests/validation noted | FAIL | 0 tests exist | legalCompliance.engine.js is pure and fully testable — zero coverage |
| Native parity noted | N/A | | |
| Engine dependencies mapped | PASS | Internal engine legalCompliance.engine.js confirmed; no shared engines/ dependency | |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `@/app/providers/AuthProvider` | app-layer | inbound | Yes — standard auth context access | useLegalConsent reads user.id |
| `@/features/auth/adapters/auth.adapter` | cross-feature (adapter) | inbound | Yes — via adapter | ConsentGateScreen consumes `authTheme` and `ConsentCheckbox` from auth adapter |
| `@/features/vport/adapters/vport.public.adapter` | cross-feature (adapter) | inbound | Yes — via adapter | HowToCreateVportScreen uses VportPreviewShowcase |
| `@/shared/lib/ttlCache` | shared | inbound | Yes — shared library | createTTLCache used in legalConsent.controller.js |
| `@/shared/components/PublicNavbar` | shared | inbound | Yes — shared component | Used in public how-to screens |
| `@/services/supabase/supabaseClient` | service | inbound | Yes — standard DAL pattern | Direct Supabase client in all DAL files |
| `platform.user_consents` | DB table | write | Yes | Single insert surface via dalRecordLegalAcceptance |
| `platform.public_legal_documents_v` | DB view | read | Yes | Pre-filters is_active; used by both DAL read functions |
| `ConsentCheckbox` (from auth adapter) | cross-feature component | inbound | Approved via adapter | Component is owned by auth feature; logically a legal concern — monitor for migration to legal/components/ |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| `platform.user_consents` | INSERT | legal feature | DB / compliance audit | HIGH — legal record; ip_address intentionally null pending server-side capture |
| `platform.public_legal_documents_v` | SELECT (view) | platform schema | legalDocuments.read.dal.js | LOW — read-only view, view pre-filters is_active |
| Consent compliance state | computed in-memory | legalCompliance.engine.js | useLegalConsent, ProtectedRoute | LOW — pure function, no persistence |
| TTL legalDocsCache | in-process memory | legalConsent.controller.js | hooks | LOW — only caches non-empty results |
| TTL consentCache | in-process memory | legalConsent.controller.js | hooks | LOW — per-user+appId key, invalidated after acceptance |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | READY | ConsentGateScreen rendered by ProtectedRoute.jsx guard (not a route); public screens have router registration | Gate is an overlay, not a navigable path |
| Loading state | READY | useLegalConsent exposes `loading: true` during gate check; ProtectedRoute.jsx returns null while consentLoading is true | |
| Empty state | READY | Empty activeDocs throws in resolveLegalGateForSession — gate fails closed | |
| Error state | READY | gateError propagated to ConsentGateScreen; recoverable retry UI implemented | |
| Auth/owner gates | READY | useLegalConsent exits early if !user?.id; fail-closed on any thrown error | |
| Cache behavior | READY | 60s TTL on docs, 90s on consents; per-user+appId key; invalidated after accept | Empty docs result is NOT cached (safety guard) |
| Runtime dependencies | READY | AuthProvider, supabase client — both platform-standard | Signup flow requires active legal documents in DB |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/legal/BEHAVIOR.md | PRESENT (PLACEHOLDER — not substantive) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a placeholder | HIGH | Consent gate behavior, re-consent flow, signup flow, fail-closed semantics, and public screen entry points are not documented | LOGAN |
| No tests for legalCompliance.engine.js | HIGH | Engine is pure and fully testable; it is the most critical compliance logic in the module; zero coverage | SPIDER-MAN |
| `getPublicIp.dal.js` is a dead file | MEDIUM | Never imported anywhere; file comment confirms it is "NOT CALLED"; dead code in a security-sensitive module creates confusion | WOLVERINE — remove |
| IP address capture deferred | MEDIUM | user_consents.ip_address is null for all records; requires server-side Edge Function; Carnage task is documented but no ticket exists | CARNAGE |
| RLS on platform.user_consents not audited | MEDIUM | INSERT goes directly from Supabase client; RLS policy scope is unknown from static scan | VENOM |
| `useSignupConsent.js` is not a real hook | LOW | The hook returns `{ recordSignupConsent }` without using any React hook APIs (no state, no effects, no callbacks); it's a plain function re-exporter masquerading as a hook | WOLVERINE — convert to non-hook export |
| No model layer | LOW | Consent and document objects are raw DB row shapes passed without normalization | IRONMAN |

---

## MODULE BOUNDARY WARNINGS

**WARN — Controller exported from adapter:**
- `legal.adapter.js` exports `recordSignupConsent` (a controller function, not a hook/component/screen).
- This breaks the standard adapter contract.
- Documented intent: callers that cannot use React hooks (e.g., join controller) need this at account creation time.
- LOW severity, limited scope, documented — acceptable for now.

**INFO — ConsentCheckbox ownership:**
- `ConsentCheckbox` is owned by `apps/VCSM/src/features/auth/components/` and exported via `auth.adapter.js`.
- Consumed by `ConsentGateScreen.jsx` in the legal module via the adapter boundary.
- The component is logically a legal/consent concern parked in auth (likely historical from the register form).
- No violation — adapter boundary is respected. Monitor for future migration to `legal/components/`.

---

## SPAGHETTI SCORE

**Module:** legal
**Score:** CLEAN
**Reasons:** Clear layer separation (DAL → Engine → Controller → Hook → Screen). Adapter boundary enforced. Cache logic isolated in controller. Public screens are self-contained. One boundary exception (controller export from adapter) is documented and limited in scope. One dead file flagged (`getPublicIp.dal.js`).
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no substantive contract written

**Check A (Source without behavior):** FAIL — Source is well-developed but BEHAVIOR.md is a placeholder. Consent gate, signup consent, re-consent, fail-closed semantics, and public screen flows are not documented.

**Check B (Behavior without source):** N/A — BEHAVIOR.md has no declared behaviors to verify against source.

**Check C (§13 engine consistency):** Internal engine `legalCompliance.engine.js` confirmed in source. No shared `engines/` imports detected. No violation.

**Check D (§6 data change consistency):** One write surface: `platform.user_consents` INSERT via `dalRecordLegalAcceptance`. Confirmed in source. No undeclared write surfaces found.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write substantive BEHAVIOR.md | Feature has zero contract documentation; consent gate is legally sensitive | LOGAN |
| P1 | Add tests for legalCompliance.engine.js | Pure engine, no coverage; compliance pass/fail decision has no regression safety | SPIDER-MAN |
| P2 | Remove `getPublicIp.dal.js` | Dead file confirmed — never imported; file itself says NOT CALLED | WOLVERINE |
| P2 | Audit RLS on platform.user_consents | INSERT goes directly from client; RLS scope unconfirmed | VENOM |
| P2 | Ticket server-side IP capture for consent records | ip_address is null on all consent rows; Carnage task needs a real ticket | CARNAGE |
| P3 | Convert useSignupConsent.js to a plain export | Not a real hook — no React APIs used; naming is misleading | WOLVERINE |

## RECOMMENDED HANDOFFS

- **LOGAN** — Write BEHAVIOR.md contract for consent gate, signup consent, re-consent, and public screen flows
- **SPIDER-MAN** — Add unit tests for `legalCompliance.engine.js` (pure function, all cases coverable)
- **VENOM** — Audit RLS policy on `platform.user_consents` and confirm insert scope
- **CARNAGE** — Ticket and spec server-side IP address capture for consent records
- **WOLVERINE** — Remove `getPublicIp.dal.js` and convert `useSignupConsent.js`
