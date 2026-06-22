# VCSM Legal Consent System

**Last updated:** May 10, 2026

---

## Overview

The VCSM app requires all users to accept Terms of Service, Privacy Policy, and an Age Verification Attestation before accessing the platform. The system tracks every acceptance event as an immutable audit row, enforces version bumps via a re-consent gate, and fails closed — any error during compliance checking blocks entry rather than granting it silently.

---

## Database Schema

### platform.legal_documents

Stores legal document metadata and version history. Content body is NOT stored here — it lives as JSX files in the repo.

```
id              uuid PK
app_id          uuid FK → platform.apps
document_type   text CHECK ('privacy_policy' | 'terms_of_service' | 'marketing_email' | 'location_consent' | 'age_verification')
version         text NOT NULL (e.g. '1.0', '1.1')
title           text NOT NULL
content_url     text (public route, e.g. '/legal/terms-of-service')
content_checksum text (nullable)
is_active       boolean DEFAULT false
published_at    timestamptz
created_at      timestamptz
updated_at      timestamptz
```

**Invariants:**
- Exactly ONE row per `document_type` per `app_id` must have `is_active = true` at any time
- Deactivated rows are retained for history (`is_active = false`)
- `content_url` maps to the public route where that document renders

**Seeded state (as of 2026-05-10):**
| document_type     | version | is_active |
|---|---|---|
| terms_of_service  | 1.0 | true |
| privacy_policy    | 1.0 | true |
| age_verification  | 1.0 | true |

### platform.user_consents

Stores every acceptance event. Append-only. Never update or delete rows.

```
id                   uuid PK
user_id              uuid FK → auth.users
user_app_account_id  uuid FK → platform.user_app_accounts (nullable)
app_id               uuid FK → platform.apps (nullable)
legal_document_id    uuid FK → platform.legal_documents
consent_type         text CHECK ('privacy_policy' | 'terms_of_service' | 'marketing_email' | 'location_consent' | 'age_verification')
consent_version      text NOT NULL
accepted             boolean DEFAULT true
accepted_at          timestamptz DEFAULT now()  ← server-assigned; trigger enforces this
revoked_at           timestamptz (nullable)
accepted_via         text CHECK ('signup' | 'login_gate' | 'settings' | 'reconsent' | 'admin')
locale               text (e.g. 'en-US')
ip_address           inet (nullable — client no longer sends; reserved for future server-side capture)
user_agent           text (nullable)
meta                 jsonb DEFAULT '{}'
created_at           timestamptz
updated_at           timestamptz
```

**DB-enforced immutability (as of migration 20260510030000):**
- `GRANT INSERT ON platform.user_consents TO authenticated` — explicit, tracked
- RESTRICTIVE RLS policy: UPDATE → USING (false) — blocks all row updates for authenticated role
- RESTRICTIVE RLS policy: DELETE → USING (false) — blocks all row deletes for authenticated role
- Trigger `trg_prevent_consent_audit_mutation`: fires BEFORE UPDATE; raises exception if `user_id`, `legal_document_id`, `accepted_at`, or `accepted` change — catches service_role bypass
- Trigger `trg_enforce_server_accepted_at`: fires BEFORE INSERT; overwrites `accepted_at` with `now()` regardless of what the client supplies; rejects any client value more than 10 seconds from server time

**Client must NOT send `accepted_at`** — the DB trigger overwrites it. Sending it would have no effect but is explicitly not done to keep the intent clear.

**`ip_address` is currently null on all rows.** The client-side IP fetch from ipify.org has been removed. Server-side capture via an Edge Function is the planned path but not yet implemented.

### platform.public_legal_documents_v (View)

Filters `platform.legal_documents` to rows where both the app and the document are active. This is the only surface the app queries for legal documents.

Columns returned: `id`, `app_key`, `app_id`, `document_type`, `version`, `title`, `content_url`, `is_active`, `published_at`

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  platform.legal_documents (DB)                               │
│  └─ active docs per app — via public_legal_documents_v view  │
├──────────────────────────────────────────────────────────────┤
│  platform.user_consents (DB)                                 │
│  └─ accepted rows per user (append-only, immutable)          │
├──────────────────────────────────────────────────────────────┤
│  DAL Layer                                                   │
│  ├─ legalDocuments.read.dal.js                               │
│  ├─ userConsents.read.dal.js                                 │
│  └─ userConsents.write.dal.js                                │
├──────────────────────────────────────────────────────────────┤
│  Compliance Engine (pure, no DB, no side effects)            │
│  └─ legalCompliance.engine.js                                │
├──────────────────────────────────────────────────────────────┤
│  Controller                                                  │
│  └─ legalConsent.controller.js                               │
│     ├─ resolveLegalGateForSession()  ← throws on empty docs  │
│     ├─ recordLegalAcceptance()       ← parallel inserts      │
│     ├─ recordSignupConsent()                                 │
│     └─ acceptRequiredConsents()                              │
├──────────────────────────────────────────────────────────────┤
│  Hook                                                        │
│  └─ useLegalConsent.js ← fail closed: error → block + retry  │
├──────────────────────────────────────────────────────────────┤
│  UI                                                          │
│  ├─ ConsentGateScreen.jsx  (gate error UI + re-consent gate) │
│  ├─ LegalDocumentScreen.jsx (lazy content, DB-resolved meta) │
│  ├─ AgeVerificationContent.jsx (age attestation body)        │
│  ├─ TermsOfServiceContent.jsx (ToS body)                     │
│  └─ PrivacyPolicyContent.jsx (Privacy Policy body)           │
├──────────────────────────────────────────────────────────────┤
│  Integration Points                                          │
│  ├─ ProtectedRoute.jsx (consent gate before app entry)       │
│  ├─ joinBarbershopAccount.controller.js (consent on join)    │
│  └─ legal.adapter.js (cross-feature boundary)                │
└──────────────────────────────────────────────────────────────┘
```

---

## File Inventory

### DAL

| File | Purpose |
|---|---|
| `features/legal/dal/legalDocuments.read.dal.js` | `dalGetActiveLegalDocuments()` + `dalGetLegalDocument()` — reads from `public_legal_documents_v` |
| `features/legal/dal/userConsents.read.dal.js` | `dalGetUserConsents()` — fetches non-revoked consents; `.limit(20)` |
| `features/legal/dal/userConsents.write.dal.js` | `dalRecordLegalAcceptance()` — inserts one consent row; no `accepted_at`, no `ip_address`; `RETURNING id, accepted_at` |
| `features/legal/dal/getPublicIp.dal.js` | NOT CALLED — retained for reference. Marked with note; 800ms timeout. Future path: Edge Function captures IP server-side |

### Engine

| File | Purpose |
|---|---|
| `features/legal/engine/legalCompliance.engine.js` | `buildConsentComplianceStatus({ activeDocs, userConsents })` — pure function; indexes consents by type, keeps latest per type; checks missing / revoked / version-mismatch / document-id mismatch. Returns `{ isCompliant, missingTypes, outdatedTypes, requiredActions }`. **Note: returns `isCompliant: true` when `activeDocs` is empty — the controller throws before reaching the engine in that case.** |

### Controller

| File | Purpose |
|---|---|
| `features/legal/controllers/legalConsent.controller.js` | All consent orchestration |

**Controller details:**

| Function | Behaviour |
|---|---|
| `getActiveLegalDocuments()` | Fetches from DB; cached 60s at composite key `${userId}:${appId}`; only caches non-empty results |
| `resolveLegalGateForSession({ userId })` | Fetches docs + consents; **throws** if `activeDocs.length === 0` (fail closed); runs compliance engine; returns `{ isCompliant, requiredActions }` |
| `recordLegalAcceptance({ userId, documents })` | `Promise.all` map over documents — parallel inserts; no `accepted_at`; no `ip_address`; invalidates cache |
| `recordSignupConsent({ userId })` | Resolves active docs then calls `recordLegalAcceptance`; `accepted_via: 'signup'` |
| `acceptRequiredConsents({ userId, requiredActions })` | Calls `recordLegalAcceptance`; `accepted_via: 'reconsent'`; invalidates cache |

**Cache:**
- `legalDocsCache`: 60s TTL (down from 300s)
- `consentCache`: 90s TTL
- Both keyed by `${userId}:${appId}` — composite key prevents cross-app cache collisions
- `invalidateConsentCache(userId, appId)` — must be called with both params

### Hook

| File | Purpose |
|---|---|
| `features/legal/hooks/useLegalConsent.js` | Runs `resolveLegalGateForSession` on mount and on retry. On error: sets `gateError`, sets `requiresConsent: true` (blocks entry), clears `requiredActions`. Exposes `{ loading, requiresConsent, requiredActions, accepting, error, acceptAll, gateError, retryConsent }` |

**Fail-closed design:** A catch block that previously set `requiresConsent: false` (fail open) now sets `requiresConsent: true` + `gateError`. Users cannot enter the app on a network error.

### UI — Screens

| File | Purpose |
|---|---|
| `features/legal/screens/LegalDocumentScreen.jsx` | Renders legal doc; all three content components are lazy-loaded (`React.lazy` + `<Suspense>`); resolves title/version from DB via `useLegalDocument` hook + `?v=` query param; shows error banner on metadata fetch failure |
| `features/legal/screens/ConsentGateScreen.jsx` | Two modes: (1) **gate error** — shows "Verification Unavailable" with retry button (disabled while retrying); (2) **re-consent** — shows required document list + checkbox + Continue button |

### UI — Content

| File | Purpose |
|---|---|
| `features/legal/docs/TermsOfServiceContent.jsx` | ToS body — `<article>` only, no title/version |
| `features/legal/docs/PrivacyPolicyContent.jsx` | Privacy Policy body — `<article>` only, no title/version |
| `features/legal/docs/AgeVerificationContent.jsx` | Age Verification Attestation body — added 2026-05-10; same pattern |

Content files are pure body text. Title, version, and effective date are rendered by `LegalDocumentScreen`, not the content component.

### Adapter

| File | Purpose |
|---|---|
| `features/legal/adapters/legal.adapter.js` | Cross-feature boundary — re-exports `recordSignupConsent` for use by non-legal features (e.g. join flow) |

### Integration

| File | How it integrates |
|---|---|
| `app/guards/ProtectedRoute.jsx` | Destructs `gateError`, `retryConsent`, `consentLoading` from `useLegalConsent`; passes all three to `ConsentGateScreen` |
| `app/routes/RouteErrorBoundary.jsx` | Class component wrapping `<Suspense>`; catches chunk-load failures; shows "Page unavailable" + refresh affordance |
| `features/join/controllers/joinBarbershopAccount.controller.js` | Calls `recordSignupConsent({ userId })` after barbershop account creation; non-blocking catch — gate self-heals at next ProtectedRoute entry |

### Routes

| File | Route |
|---|---|
| `app/routes/public/legal.routes.jsx` | `/legal/:docType` — maps to `LegalDocumentScreen`; `:docType` resolves via `DOCUMENT_MAP` in screen |
| `app/routes/lazyPublic.jsx` | `LegalDocumentScreen` is lazy-loaded via `lazyWithLog()` |

**Valid `:docType` values and their document_type:**
| docType param | document_type |
|---|---|
| `terms-of-service` | `terms_of_service` |
| `privacy-policy` | `privacy_policy` |
| `age-verification` | `age_verification` |

### Automation Scripts

See `logan/legal/vcsm.legal.automation-scripts.md` for full reference.

| Script | npm command | Purpose |
|---|---|---|
| `scripts/legal/legal.registry.mjs` | — | Central registry: document_type → { file, route, titleBase } |
| `scripts/legal/check-legal-files.mjs` | `npm run legal:check-files` | Git diff check: if a legal JSX changed, require a matching migration |
| `scripts/legal/generate-legal-migration.mjs` | `npm run legal:release` | Generates timestamped SQL migration for a version bump |

### Tracked Migrations

All applied migrations are now tracked in `apps/VCSM/supabase/migrations/`:

| File | What it does |
|---|---|
| `20260510030000_user_consents_immutability_and_grant.sql` | INSERT GRANT + RESTRICTIVE RLS (no UPDATE/DELETE) + audit mutation trigger |
| `20260510040000_age_verification_consent_type.sql` | Extends CHECK constraints to include `age_verification`; seeds age_verification v1.0 doc |
| `20260510050000_accepted_at_server_default.sql` | Sets `DEFAULT now()` on `accepted_at`; trigger overwrites client value + rejects clock-manipulation |

---

## Consent Flows

### Signup Flow (standard registration)

```
1. User fills registration form
2. User checks consent checkbox (ToS + PP + 18+ attestation bundled)
3. Form submits → account created
4. recordSignupConsent({ userId })
   a. Fetch active docs (all 3 types)
   b. Promise.all: insert one row per doc
      - accepted_via: 'signup'
      - locale: navigator.language
      - user_agent: navigator.userAgent
      - accepted_at: set by DB trigger (server time)
      - ip_address: null (client no longer captures)
5. User proceeds to onboarding
```

### Barbershop Join Flow

```
1. Invite link → /join/barbershop/:token
2. User signs up via joinBarbershopAccount.controller.js
3. If session available immediately (no email confirm):
   a. recordSignupConsent({ userId }) via legal.adapter.js
   b. Non-blocking: catch logs warning; gate self-heals at next ProtectedRoute
4. If email confirm required:
   a. Consent not recorded at signup time
   b. ProtectedRoute gate detects missing consent on first entry
   c. Re-consent flow handles it
```

### Login / App Bootstrap Flow

```
1. User opens app with existing session
2. ProtectedRoute renders → useLegalConsent runs
3. resolveLegalGateForSession({ userId })
   a. Fetch active docs → throws if empty (fail closed)
   b. Fetch user consents (limit 20)
   c. buildConsentComplianceStatus() — compare per type
4. SUCCESS: isCompliant → render app
5. RECONSENT: not compliant → show ConsentGateScreen with requiredActions
6. ERROR (any throw): gateError set → show "Verification Unavailable" + retry button
```

### Re-consent Flow

```
1. ConsentGateScreen shows required document list
2. User reviews documents via links
3. User checks checkbox → Continue enabled
4. acceptRequiredConsents({ userId, requiredActions })
   a. Promise.all: insert one row per required action
      - accepted_via: 'reconsent'
5. Hook re-runs → isCompliant → app loads
```

### Gate Error Flow (fail closed)

```
1. resolveLegalGateForSession throws for any reason:
   - DB connection failure
   - Empty active docs (no legal documents seeded)
   - Any unexpected error
2. useLegalConsent catch:
   - requiresConsent = true  (blocks entry)
   - gateError = err.message
   - requiredActions = []
3. ProtectedRoute → ConsentGateScreen with gateError prop
4. User sees "Verification Unavailable" + retry button
5. User clicks retry → retryConsent() → increments retryCount → hook re-runs
6. Button disabled while loading = true (prevents double-tap)
```

---

## Compliance Engine Rules

`buildConsentComplianceStatus({ activeDocs, userConsents })` marks a document as requiring action if:

1. **Missing** — no accepted consent row exists for that `document_type`
2. **Outdated** — accepted `consent_version` ≠ active doc `version`
3. **Revoked** — accepted row has `revoked_at` set
4. **Wrong document** — `legal_document_id` ≠ active doc `id` (same version string, different DB row)

If ANY required document fails → `isCompliant = false`.

**Empty activeDocs:** the engine returns `isCompliant: true` when `activeDocs` is empty. This is intentional engine behavior — the controller layer throws before reaching the engine to prevent silent fail-open when documents are unseeded.

### requiredAction shape

```js
{
  consent_type: 'age_verification',
  legal_document_id: 'uuid',
  app_id: 'uuid',
  required_version: '1.1',
  current_version: '1.0',   // null if no prior consent exists
  content_url: '/legal/age-verification',
  title: 'Age Verification Attestation'
}
```

---

## Version Rendering

`LegalDocumentScreen` resolves title and version dynamically:

1. Reads `:docType` param → looks up `DOCUMENT_MAP` → gets `documentType` + fallback title
2. Reads `?v=` query param (optional — links from consent gate include it)
3. Calls `useLegalDocument({ appKey, documentType, version })`
4. Renders `<h1>{title} v{version}</h1>` + effective date from `published_at`
5. On metadata error: shows banner "Document metadata unavailable. Showing current version." — content still renders
6. Content component (`AgeVerificationContent`, etc.) is lazy-loaded; `<Suspense fallback={null}>` prevents flash

---

## Audit Evidence

Every consent row stores:

| Field | Source | Status |
|---|---|---|
| `user_id` | Auth session | Required |
| `legal_document_id` | Resolved from active docs | Required |
| `consent_type` | From document | Required |
| `consent_version` | From document | Required |
| `accepted_at` | DB trigger — `now()` | Server-assigned; client must not supply |
| `accepted_via` | `'signup'` / `'reconsent'` | Required |
| `locale` | `navigator.language` | Best effort |
| `user_agent` | `navigator.userAgent` | Best effort |
| `ip_address` | **null** — not captured | Planned: Edge Function |

---

## How to Publish a New Legal Version

Use the automation scripts — do not write migration SQL by hand.

```bash
# 1. Edit the JSX content file if content changed
#    e.g. src/features/legal/docs/TermsOfServiceContent.jsx

# 2. Generate the migration
npm run legal:release -- --type terms_of_service --version 1.1 --effective-date 2026-06-01

# 3. Review the generated SQL in supabase/migrations/
# 4. Apply in Supabase dashboard or: supabase db push
# 5. Verify: npm run legal:check-files
# 6. Commit migration + JSX changes together
```

The generated migration:
- Deactivates the old active row for that type
- Inserts a new active row with the new version
- Wrapped in `BEGIN`/`COMMIT` for atomicity
- Idempotent — `NOT EXISTS` guard prevents duplicate rows

No code deployment required for re-consent. Once the migration is applied, the compliance engine detects the version bump on next user session and triggers the gate.

---

## What NOT to Do

1. **Don't write migration SQL by hand** — use `npm run legal:release`
2. **Don't bump a version without updating the JSX** — content and version travel together
3. **Don't update or delete consent rows** — the table is append-only; DB triggers enforce this
4. **Don't set `accepted_at` in the client INSERT** — DB trigger owns this
5. **Don't send `ip_address` from the client** — reserved for server-side capture
6. **Don't let the gate fail open** — the hook explicitly sets `requiresConsent: true` on error
7. **Don't set multiple docs of the same type to `is_active = true`** — breaks the engine
8. **Don't skip the compliance engine** — it is the single arbiter of consent state
9. **Don't synthesize age or birthdate** — `syntheticAdultBirthdate()` has been permanently deleted; real age attestation comes only from user action
10. **Don't publish a new legal document without seeding the DB row** — `legal:check-files` will catch this in CI

---

## Open / Deferred Items

| Item | Status |
|---|---|
| Server-side IP capture via Edge Function | Not started — requires Supabase Edge Function for `accepted_via` endpoint |
| `accepted_via='email_confirm_gate'` | Low priority — email-confirm path doesn't currently set this value |
| Separate age verification row in consent gate UI | Currently bundled into ToS checkbox text; separate display per type is cleaner |
| `legal:check-files` in CI | Scripts exist; CI integration not wired yet |
