---
name: vcsm.auth.verify-email.index
description: Source inventory for VCSM auth/verify-email module — built by ARCHITECT 2026-06-06
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-06
---

# INDEX — VCSM / features / auth / verify-email

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-06
**Scan type:** targeted source read

---

## Source Inventory

| Layer | File | Path | Notes |
|---|---|---|---|
| Screen | VerifyEmailRequiredScreen.jsx | apps/VCSM/src/features/auth/screens/ | Shared across public route + ProtectedRoute gate contexts |
| Hook | useResendVerification.js | apps/VCSM/src/features/auth/hooks/ | loading / sent / error state for resend flow |
| Hook | useEmailVerified.js | apps/VCSM/src/features/auth/hooks/ | Thin model wrapper; consumed externally by ProtectedRoute |
| Controller | resendVerification.controller.js | apps/VCSM/src/features/auth/controllers/ | Email presence guard + DAL delegation |
| DAL | emailVerification.dal.js | apps/VCSM/src/features/auth/dal/ | supabase.auth.resend — no session required |
| Model | emailVerification.model.js | apps/VCSM/src/features/auth/model/ | isEmailVerifiedModel(user) → Boolean(user.email_confirmed_at) |
| Adapter | auth.adapter.js | apps/VCSM/src/features/auth/adapters/ | Exports VerifyEmailRequiredScreen + useEmailVerified |

**Total module files:** 7 (shared with auth module root — no dedicated folder for verify-email source)

---

## Routes

| Path | Guard | Access | Screen |
|---|---|---|---|
| /verify-email | AuthPublicRoute | public (redirects authenticated users to /feed) | VerifyEmailRequiredScreen |
| (ProtectedRoute gate — no path) | ProtectedRoute | authenticated-unverified | VerifyEmailRequiredScreen (inline — no route) |

---

## Write Surface Map

No direct DB writes. Sole external mutation:

| Operation | Target | Auth Required | Notes |
|---|---|---|---|
| supabase.auth.resend | Supabase Auth service | NO | type: 'signup', email — rate-limited by Supabase |

---

## Security-Sensitive Surfaces

- **supabase.auth.resend:** Unauthenticated endpoint. Email enumeration is a theoretical risk — Supabase rate-limits server-side. Error messages from Supabase are not exposed in UI (useResendVerification uses a fixed error string).
- **isEmailVerifiedModel:** Reads `email_confirmed_at` from the Supabase user object managed by AuthProvider. Read-only; no forgery risk in this context.

---

## Rendering Contexts

| Context | Session | Email Source | Resend Available |
|---|---|---|---|
| Public route /verify-email | null (no session) | location.state?.email | YES (if email in state) |
| ProtectedRoute inline gate | exists (unverified) | user.email prop | YES |
| Public route — direct navigation (no state) | null | null | NO — button hidden |

---

## Tests

| Status | Files |
|---|---|
| 0 test files | useResendVerification, resendVerification.controller, emailVerification.dal, emailVerification.model — all untested |

---

## Documentation Links

| Doc | Path | Status |
|---|---|---|
| ARCHITECTURE.md | modules/verify-email/ARCHITECTURE.md | PRESENT (this run — 2026-06-06) |
| BEHAVIOR.md | modules/verify-email/BEHAVIOR.md | PRESENT (stub — this run) |
| SECURITY.md | modules/verify-email/SECURITY.md | PRESENT (this run) |
| INDEX.md | modules/verify-email/INDEX.md | PRESENT (this run) |
| OWNERSHIP.md | — | MISSING |
