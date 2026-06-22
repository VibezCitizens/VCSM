# ToS Acceptance & Enforcement Architecture Audit
**Date:** 2026-05-10
**Scope:** `apps/VCSM/src/` only
**Auditor:** ARCHITECT (analysis-only — no code modified)

---

## 1. File Inventory with Layer Classification

| File | Layer | Purpose |
|---|---|---|
| `features/legal/dal/legalDocuments.read.dal.js` | DAL | Reads `platform.public_legal_documents_v` — fetches active legal docs by `app_key` or `document_type` |
| `features/legal/dal/userConsents.read.dal.js` | DAL | Reads `platform.user_consents` — fetches accepted, non-revoked rows per `user_id` + `app_id` |
| `features/legal/dal/userConsents.write.dal.js` | DAL | Writes to `platform.user_consents` — inserts a single consent acceptance row |
| `features/legal/dal/getPublicIp.dal.js` | DAL (external fetch) | Fetches public IP from `api.ipify.org` for consent metadata; returns `null` on failure |
| `features/legal/engine/legalCompliance.engine.js` | Engine (pure) | Compares `activeDocs` vs `userConsents`; determines `isCompliant`, `missingTypes`, `outdatedTypes`, `requiredActions` |
| `features/legal/controllers/legalConsent.controller.js` | Controller | Orchestrates docs cache, consent cache, compliance check, acceptance write, signup consent, re-consent, and session gate resolution |
| `features/legal/controllers/legalDocument.controller.js` | Controller | Thin pass-through to `dalGetLegalDocument` — fetches a single document by `appKey` + `documentType` |
| `features/legal/hooks/useLegalConsent.js` | Hook | Runs `resolveLegalGateForSession` on mount; exposes `requiresConsent`, `requiredActions`, `acceptAll` |
| `features/legal/hooks/useSignupConsent.js` | Hook | Re-exports `recordSignupConsent` from the controller; used at registration time |
| `features/legal/hooks/useLegalDocument.js` | Hook | Fetches a single legal doc for display; used by `LegalDocumentScreen` |
| `features/legal/adapters/legal.adapter.js` | Adapter | Cross-feature boundary; re-exports `useSignupConsent`, `useLegalConsent`, `ConsentGateScreen` |
| `features/legal/screens/ConsentGateScreen.jsx` | Screen (Component) | Blocking re-consent gate UI; renders required doc list + single checkbox + "Continue" CTA |
| `features/legal/screens/LegalDocumentScreen.jsx` | Screen | Public-facing document viewer (`/legal/:docType`); pulls doc metadata from DB, renders static JSX content |
| `features/legal/docs/TermsOfServiceContent.jsx` | Component (static) | Full static JSX body of the ToS document — no data fetching |
| `features/legal/docs/PrivacyPolicyContent.jsx` | Component (static) | Full static JSX body of the Privacy Policy — no data fetching |
| `app/guards/ProtectedRoute.jsx` | Route Guard | Session entry gate; checks auth + email verification + consent before rendering any protected route |
| `app/routes/public/legal.routes.jsx` | Route Config | Registers `/legal/:docType` as a public (unauthenticated) route |
| `app/routes/index.jsx` | Route Root | Wires `ProtectedRoute` as parent of all authenticated routes |
| `features/auth/hooks/useRegister.js` | Hook | Calls `recordSignupConsent` after successful account creation (when session is immediately active) |
| `features/auth/components/RegisterFormCard.jsx` | Component | Renders the consent checkbox within the registration form |
| `features/auth/components/ConsentCheckbox.jsx` | Component | Reusable accessible checkbox component used at registration and re-consent gate |
| `features/auth/adapters/auth.adapter.js` | Adapter | Exports `ConsentCheckbox` and `authTheme` — consumed by legal screens |
| `features/join/screens/components/JoinSignupForm.jsx` | Component | Barbershop invite signup form; has a local `termsAccepted` checkbox (client-only validation) |

---

## 2. Acceptance Flow Trace

### 2A. Standard Registration Flow

```
RegisterScreen (view)
 → RegisterFormCard (component) — renders ConsentCheckbox
 → useRegister (hook) — holds termsAccepted state; blocks submit if false
    ├── ctrlRegisterAccount (controller) — creates Supabase auth user
    └── recordSignupConsent (controller — legalConsent.controller.js)
           ├── getActiveLegalDocuments() → [cache] → dalGetActiveLegalDocuments()
           │     reads: platform.public_legal_documents_v WHERE app_key = 'vcsm'
           └── recordLegalAcceptance()
                  ├── getPublicIp() — external fetch to api.ipify.org
                  └── dalRecordLegalAcceptance() (per document, sequential loop)
                        writes: platform.user_consents
                        fields: user_id, user_app_account_id, app_id,
                                legal_document_id, consent_type, consent_version,
                                accepted=true, accepted_at, accepted_via='signup',
                                locale, user_agent, ip_address
```

**Critical edge case:** If email confirmation is required (Supabase `requiresEmailConfirm: true`), the user is redirected to `/verify-email` and `recordSignupConsent` is **never called** during the signup handler. Consent recording for email-confirm flows is deferred to the `ProtectedRoute` gate (the `useLegalConsent` hook will detect `requiresConsent: true` and surface the `ConsentGateScreen` after the user verifies and logs in).

### 2B. Session Re-Consent / Outdated Version Flow

```
ProtectedRoute (route guard)
 → useLegalConsent (hook)
    → resolveLegalGateForSession() (controller)
       ├── getActiveLegalDocuments() → [5min TTL cache] → DB
       ├── getCachedUserConsents() → [90s TTL cache] → DB
       └── buildConsentComplianceStatus() (engine — pure)
            → if not compliant: decision = 'REQUIRE_RECONSENT'

 → ConsentGateScreen (screen — blocks Outlet)
    → user checks box and clicks "Continue"
    → acceptAll() (from useLegalConsent hook)
       → acceptRequiredConsents() (controller)
          → recordLegalAcceptance()
             acceptedVia = 'reconsent'
             → dalRecordLegalAcceptance() (per required action)
             → invalidateConsentCache(userId)
 → Outlet renders (app unlocked)
```

---

## 3. Database Schema

### Table: `platform.user_consents`

Columns written:
- `user_id` — `auth.users.id`
- `user_app_account_id` — nullable; `platform.user_app_accounts.id`
- `app_id` — `platform.apps.id`
- `legal_document_id` — `platform.legal_documents.id`
- `consent_type` — `'terms_of_service'` | `'privacy_policy'`
- `consent_version` — e.g. `'1.0'`
- `accepted` — `boolean`
- `accepted_at` — ISO timestamp (client-side `new Date().toISOString()`)
- `accepted_via` — `'signup'` | `'login_gate'` | `'settings'` | `'reconsent'`
- `locale` — `navigator.language` or null
- `user_agent` — `navigator.userAgent` or null
- `ip_address` — from `api.ipify.org` or null

Columns read (via read DAL):
- `id`, `user_id`, `legal_document_id`, `consent_type`, `consent_version`, `accepted`, `accepted_at`, `revoked_at`

### View: `platform.public_legal_documents_v`

Columns read:
- `id`, `app_key`, `app_id`, `document_type`, `version`, `title`, `content_url`, `is_active`, `published_at`

The view pre-filters `is_active = true` for both the `apps` and `legal_documents` tables.

---

## 4. Enforcement Gate Map

### Gate Location: `ProtectedRoute.jsx`

**Triggers:** Every protected route access. `ProtectedRoute` is the parent element wrapping all authenticated routes in the router tree.

**Gate logic sequence:**
1. `loading` (auth session loading) → render `null` (hold)
2. No `user` → redirect to `/login`
3. `!isEmailVerifiedModel(user)` → render `VerifyEmailRequiredScreen`
4. `consentLoading` → render `null` (hold)
5. `requiresConsent` → render `ConsentGateScreen` (full-screen block)
6. All checks pass → render `<Outlet />` (app entry)

**Scope of enforcement:**
All routes nested under `ProtectedRoute`, including:
- `/onboarding`, `/welcome`
- All social routes (feed, explore, upload, chat, notifications)
- All profile/Vport dashboard routes
- All learning routes
- Settings, invite, professional access

**Not enforced by ProtectedRoute:**
- All public routes: `/login`, `/register`, `/legal/:docType`, `/wanders/*`, `/menu/*`, `/about`, `/contact`, `/how-to/*`
- Join flow routes (`/join/barbershop/:token`)

### Gate Frequency

The gate runs **once per app session load** when `user?.id` changes (i.e., on session restore or login). It is not re-checked on individual route changes after passing. The `useLegalConsent` hook fires its `useEffect` once per user session (keyed on `user?.id`).

---

## 5. Version Tracking Assessment

**Version is stored in the DB**, not hardcoded in the app. The `platform.legal_documents` table has a `version` column (e.g., `'1.0'`).

**Version comparison logic** (in `legalCompliance.engine.js`):
- If `userConsent.consent_version !== doc.version` → `outdatedTypes` (triggers re-consent)
- If `userConsent.legal_document_id !== doc.id` (same version string, different document ID) → also treated as `outdatedTypes`
- If no consent exists for a `document_type` → `missingTypes`

**Effect of a version bump:** When the active document version is bumped in the DB, the next session restore for every existing user will detect a mismatch and surface `ConsentGateScreen`. This is the correct re-consent mechanism.

**Static content is decoupled from DB version:** `TermsOfServiceContent.jsx` and `PrivacyPolicyContent.jsx` are static JSX files. The DB record's `version` and `published_at` are displayed as a dynamic header by `LegalDocumentScreen`, but the actual text body is always served from the hardcoded JSX — not from a DB-stored `content_url`. The `content_url` field exists in the schema but is used only for deep-link routing in `ConsentGateScreen.getDocRoute()`, falling back to `/legal/terms-of-service` if not present.

---

## 6. State Management Map

| State | Location | Scope | Persistence |
|---|---|---|---|
| `requiresConsent` | `useLegalConsent` hook (local React state) | Per-mount lifetime of `ProtectedRoute` | Memory only — cleared on unmount/reload |
| `requiredActions` | `useLegalConsent` hook (local React state) | Per-mount lifetime of `ProtectedRoute` | Memory only |
| Active legal docs | `legalDocsCache` (TTL Map in controller module) | Module singleton | 5-minute TTL; in-memory only |
| User consent rows | `consentCache` (TTL Map in controller module) | Module singleton | 90-second TTL; keyed by `userId`; in-memory only |
| `termsAccepted` (signup) | `useRegister` hook (local React state) | Registration form lifetime | Memory only |
| `termsAccepted` (re-consent) | `ConsentGateScreen` (local React state) | Gate screen lifetime | Memory only |

**On every session restore:** `useLegalConsent` fires → calls `resolveLegalGateForSession` → hits both caches (likely cold on first load) → reads DB → decision is made fresh each session.

**Cache invalidation:** `invalidateConsentCache(userId)` is called immediately after `recordLegalAcceptance` completes, ensuring the next read reflects the newly written consent rows.

---

## 7. Cross-Feature Dependency Diagram

```
legal.adapter.js (boundary)
  ← features/auth/hooks/useRegister.js (imports useSignupConsent)
  ← app/guards/ProtectedRoute.jsx (imports useLegalConsent, ConsentGateScreen)

features/legal/controllers/legalConsent.controller.js
  ← features/legal/hooks/useLegalConsent.js
  ← features/legal/hooks/useSignupConsent.js

features/legal/controllers/legalConsent.controller.js
  → features/legal/dal/legalDocuments.read.dal.js
  → features/legal/dal/userConsents.read.dal.js
  → features/legal/dal/userConsents.write.dal.js
  → features/legal/dal/getPublicIp.dal.js (external)
  → features/legal/engine/legalCompliance.engine.js (pure)
  → shared/lib/ttlCache.js (cache utility)

app/routes/index.jsx
  → app/guards/ProtectedRoute.jsx
  → app/guards/ProfileGatedOutlet.jsx
  → app/routes/public/legal.routes.jsx (/legal/:docType — public)

features/legal/screens/ConsentGateScreen.jsx
  → features/auth/adapters/auth.adapter.js (authTheme, ConsentCheckbox)

features/legal/screens/LegalDocumentScreen.jsx
  → features/auth/adapters/auth.adapter.js (authTheme)
  → features/legal/hooks/useLegalDocument.js
  → features/legal/docs/TermsOfServiceContent.jsx
  → features/legal/docs/PrivacyPolicyContent.jsx
```

---

## 8. Gaps and Dead Code

### GAP — HIGH: Join Barbershop Flow Never Records Legal Consent

**Files:** `features/join/screens/components/JoinSignupForm.jsx`, `features/join/controllers/joinBarbershopAccount.controller.js`, `features/join/hooks/useJoinBarbershop.js`

The `/join/barbershop/:token` flow has its own signup form (`JoinSignupForm.jsx`) with a local `termsAccepted` checkbox. It validates the checkbox client-side before submitting. However, `signUpForBarbershopInvite` in the controller calls `signUpForInviteDAL` and returns — **it never calls `recordSignupConsent` or any consent-recording function**.

The join flow does not go through `ProtectedRoute` (it is a public route). A user who creates their account via the barbershop join path will have **zero rows in `platform.user_consents`** after account creation.

**Effect:** The next time that user hits `ProtectedRoute`, `useLegalConsent` will detect `missingTypes` and surface `ConsentGateScreen`, eventually recording consent at gate time. The system will self-heal, but:
- Consent `accepted_via` will be `'reconsent'` (which is misleading — it was effectively their first consent)
- The timing of consent recording is delayed to first protected-route entry, not account creation
- If the join flow is ever extended to skip `ProtectedRoute`, these users would never have recorded consent

**Linked structural issue:** The checkbox links to `/terms` and `/privacy` (bare paths) rather than `/legal/terms-of-service` and `/legal/privacy-policy`. These are dead links — they do not match any registered route in the router.

---

### GAP — HIGH: No Age Verification in DB

**File:** `features/legal/screens/ConsentGateScreen.jsx` (line 105), `features/auth/components/RegisterFormCard.jsx`

The registration consent checkbox includes the phrase "confirm that I am at least 18 years old." The re-consent gate also includes this phrase. However:
- There is **no DB field or consent_type entry for `age_verification`** — age attestation is bundled into the ToS checkbox with no separate record
- `platform.user_consents.consent_type` only tracks `'terms_of_service'` and `'privacy_policy'`
- If a minor bypasses the UI (API call), there is no enforcement layer below the checkbox

The join flow (`JoinSignupForm.jsx`) has a **separate** `ageConfirmed` checkbox (distinct from `termsAccepted`), but neither checkbox drives any DB write.

---

### GAP — MEDIUM: Signup Consent Not Recorded on Email-Confirmation Flows

**File:** `features/auth/hooks/useRegister.js` (lines 131–148)

When Supabase requires email confirmation before creating a session (`requiresEmailConfirm: true`), the flow navigates to `/verify-email` immediately. `recordSignupConsent` is never called. The user must complete `ProtectedRoute` gate flow to get their consent recorded, but this is an implicit recovery rather than a deliberate design.

There is no `accepted_via: 'email_confirm_gate'` value — when the user finally hits the gate, it will write `'reconsent'` despite the user having agreed during signup. The audit trail is inaccurate for this path.

---

### GAP — MEDIUM: `accepted_at` Set Client-Side

**File:** `features/legal/dal/userConsents.write.dal.js` (line 42)

```js
accepted_at: new Date().toISOString(),
```

`accepted_at` is generated on the client before the DB insert. This means the timestamp reflects the client's local clock, not the DB server time. In a legal/audit context, DB-side `now()` (via a `DEFAULT` or `RETURNING`) would be more trustworthy. If the column has a `DEFAULT now()` on the Postgres side, this is partially mitigated, but the insert explicitly sets the value rather than relying on the DB default.

---

### GAP — LOW: `useLegalDocument` Hook Silently Swallows Errors

**File:** `features/legal/hooks/useLegalDocument.js` (line 19)

```js
.catch(() => {})
```

Errors from `getLegalDocumentController` are silently discarded. If the DB query fails, the screen renders with `docMeta = null` and falls back to `entry.fallbackTitle`. This means version/date metadata silently disappears without any user-visible error or developer log.

---

### GAP — LOW: `content_url` in DB Never Used for Actual Content

**File:** `features/legal/dal/legalDocuments.read.dal.js` (column `content_url`), `features/legal/screens/ConsentGateScreen.jsx` (`getDocRoute`)

`content_url` is fetched from the DB and used by `ConsentGateScreen` to route the user to the document (`Link to={getDocRoute(action)}`). However, `LegalDocumentScreen` does not use `content_url` for content rendering — it hardcodes static JSX components (`TermsOfServiceContent`, `PrivacyPolicyContent`). If `content_url` is intended to support externally hosted documents, that path is not implemented. The field currently only serves as an optional routing override in the re-consent gate.

---

### DEAD CODE — LOW: `'login_gate'` and `'settings'` acceptedVia Values Never Used

**File:** `features/legal/dal/userConsents.write.dal.js` (JSDoc on line 7)

The `acceptedVia` parameter documents `'login_gate'` and `'settings'` as valid values. Neither is actually passed from any call site in the codebase. The only values currently used are:
- `'signup'` — from `recordSignupConsent` → `useRegister`
- `'reconsent'` — from `acceptRequiredConsents` → `ProtectedRoute` gate

`'login_gate'` and `'settings'` are documented intent that is not yet implemented. No settings screen provides a consent management or re-read flow.

---

## 9. Summary of Findings

| # | Finding | Severity | Location |
|---|---|---|---|
| 1 | Join barbershop signup never records consent to DB | HIGH | `features/join/controllers/joinBarbershopAccount.controller.js`, `join/screens/components/JoinSignupForm.jsx` |
| 2 | Join form links to `/terms` and `/privacy` — dead routes (should be `/legal/terms-of-service`, `/legal/privacy-policy`) | HIGH | `features/join/screens/components/JoinSignupForm.jsx` |
| 3 | No separate age verification consent type in DB — age attestation is bundled into ToS checkbox with no independent audit record | HIGH | `ConsentGateScreen.jsx`, `RegisterFormCard.jsx`, DB schema |
| 4 | Signup consent not recorded on email-confirm flow; deferred to gate with wrong `accepted_via` value (`'reconsent'` instead of `'signup'`) | MEDIUM | `features/auth/hooks/useRegister.js` |
| 5 | `accepted_at` is set from client clock, not DB server time | MEDIUM | `features/legal/dal/userConsents.write.dal.js` |
| 6 | `useLegalDocument` silently swallows fetch errors — metadata disappears without any log or user signal | LOW | `features/legal/hooks/useLegalDocument.js` |
| 7 | `content_url` in DB is fetched but never used for rendering document content | LOW | `LegalDocumentScreen.jsx`, `legalDocuments.read.dal.js` |
| 8 | `'login_gate'` and `'settings'` `accepted_via` values documented but never implemented | LOW | `userConsents.write.dal.js` JSDoc |

---

## 10. Architecture Compliance Assessment

| Check | Status | Notes |
|---|---|---|
| DAL uses explicit column lists | PASS | No `select('*')` found |
| Business logic in controller | PASS | `legalConsent.controller.js` owns all compliance logic |
| Hooks do not call DB directly | PASS | Hooks call controllers only |
| Screens do not compute | PARTIAL FAIL | `ConsentGateScreen` contains inline `getDocRoute` logic — minor leak |
| Cross-feature access via adapters | PASS | `legal.adapter.js` is the only cross-feature surface |
| No TypeScript files | PASS | All `.js` / `.jsx` |
| Files under 300 lines | PASS | All legal feature files are within limit |
| Pure engine with no side effects | PASS | `legalCompliance.engine.js` is fully pure |
