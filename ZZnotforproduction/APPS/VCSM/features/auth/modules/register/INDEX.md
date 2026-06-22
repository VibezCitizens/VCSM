---
title: Register Module — Index
status: CURRENT
feature: auth
module: register
source: ARCHITECT-V2-source-verified
last-architect-run: 2026-06-06
scanner-version: V2
source-path: apps/VCSM/src/features/auth/
---

# auth / modules / register

New account registration flow. Creates Supabase auth user, upserts initial profile shell, records legal consent, then routes to onboarding. Supports anonymous user upgrade and Wanders-flow dual-client session mirroring.

## Module Summary

| Field | Value |
|---|---|
| Module | register |
| Feature | auth |
| Source Path | apps/VCSM/src/features/auth/ |
| Screens | 1 (RegisterScreen) |
| Routes | /register (wrapped in AuthPublicRoute) |
| Write Surfaces | supabase.auth.signUp, supabase.auth.updateUser (anon upgrade), profiles.upsert, platform.user_consents.insert, supabase.auth.setSession (Wanders mirror), monitoring-ingest-error Edge Function |
| Controllers | 1 primary (register.controller.js) + 1 cross-feature (legalConsent.controller.js) |
| DAL Files | 1 primary (register.dal.js) + 2 cross-feature (legalDocuments.read.dal.js, userConsents.write.dal.js) |
| Hooks | 1 (useRegister.js) + 1 cross-feature shim (useSignupConsent.js) |
| Components | 2 (ConsentCheckbox.jsx, RegisterFormCard.jsx) |
| Models | 2 (registerPasswordRules.model.js, authInputValidation.model.js) |

## Source File Inventory (ARCHITECT V2 — SOURCE_VERIFIED)

### Primary Register Module Files

| File | Layer | Role |
|---|---|---|
| screens/RegisterScreen.jsx | SCREEN | Thin wrapper — delegates all state to useRegister, renders RegisterFormCard |
| components/RegisterFormCard.jsx | COMPONENT | Full form UI — email, password, confirmPassword, consent, submit, password rules display |
| components/ConsentCheckbox.jsx | COMPONENT | Legal consent checkbox (rendered inside RegisterFormCard) |
| hooks/useRegister.js | HOOK | All form state, validation, mutation orchestration, navigation |
| controllers/register.controller.js | CONTROLLER | ctrlRegisterAccount — signUp, anonymous upgrade, Wanders mirror, profile upsert |
| dal/register.dal.js | DAL | 6 functions: getSession, signUp, updateUser, signOut, upsertProfile, mirrorWanders |
| model/registerPasswordRules.model.js | MODEL | 5 password rules — evaluateRegisterPasswordRules, evaluateConfirmPasswordState |
| model/authInputValidation.model.js | MODEL | validateEmail, isValidInviteCode, isSafeAuthReturnPath, normalizeEmail |
| styles/registerFormCard.css | STYLE | Form card CSS |

### Cross-Feature Dependencies (SOURCE_VERIFIED)

| File | Feature | Layer | Role |
|---|---|---|---|
| features/legal/adapters/legal.adapter.js | legal | ADAPTER | Exports useSignupConsent |
| features/legal/hooks/useSignupConsent.js | legal | HOOK | Shim → recordSignupConsent |
| features/legal/controllers/legalConsent.controller.js | legal | CONTROLLER | recordSignupConsent — fetches active docs, records acceptance |
| features/legal/dal/legalDocuments.read.dal.js | legal | DAL | dalGetActiveLegalDocuments → platform.legal_documents |
| features/legal/dal/userConsents.write.dal.js | legal | DAL | dalRecordLegalAcceptance → platform.user_consents INSERT |
| services/monitoring/monitoringClient.js | monitoring | SERVICE | captureFrontendError → monitoring-ingest-error Edge Function |
| features/wanders/adapters/services/wandersSupabaseClient.adapter.js | wanders | ADAPTER | getWandersSupabase (Wanders-scoped secondary client) |

### Route / Guard Files

| File | Layer | Role |
|---|---|---|
| app/routes/public/auth.routes.jsx | ROUTE | /register route definition |
| app/routes/public/AuthPublicRoute.jsx | GUARD | Redirect auth'd users to /feed; loading spinner |
| app/providers/AuthProvider.jsx | PROVIDER | useAuth() → { user, loading } |

## Write Surface Map (SOURCE_VERIFIED)

| Operation | Schema | Table/Function | Guard | Status |
|---|---|---|---|---|
| supabase.auth.signUp | auth | users | Supabase email uniqueness + rate limits | VERIFIED |
| supabase.auth.updateUser (anon upgrade) | auth | users | Requires existing session JWT | VERIFIED |
| profiles.upsert | public | profiles | RLS — UNVERIFIED (FINDING-MED-005) | OPEN |
| platform.user_consents.insert | platform | user_consents | RLS — UNVERIFIED (FINDING-MED-004) | OPEN |
| supabase.auth.setSession (Wanders mirror) | auth | — | userId match guard (controller) | MITIGATED |
| monitoring-ingest-error.invoke | — | Edge Function | Edge Function (unknown validation) | INFO |

## Security Findings Summary

| ID | Severity | Surface | Status |
|---|---|---|---|
| FINDING-HIGH-001 | HIGH | navState.from — no path whitelist | OPEN |
| FINDING-MED-003 | MEDIUM | console.error in production | OPEN |
| FINDING-MED-004 | MEDIUM | user_consents userId not session-verified | OPEN — DB audit |
| FINDING-MED-005 | MEDIUM | profiles RLS for upsert unverified | OPEN — DB audit |
| FINDING-LOW-006 | LOW | password rules client-only | OPEN |
| FINDING-LOW-007 | LOW (MITIGATED) | isWandersFlow client-controlled | MITIGATED |
| FINDING-LOW-008 | LOW | monitoring message not PII-stripped | OPEN |
| FINDING-INFO-009 | INFO | successMessage dead state | INFO |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | CURRENT (this file) |
| BEHAVIOR.md | CURRENT |
| ARCHITECTURE.md | CURRENT |
| SECURITY.md | CURRENT |

## ARCHITECT Run Log

| Date | Status | Findings | Source Files |
|---|---|---|---|
| 2026-06-05 | STUB | Seeded from prior sessions | N/A |
| 2026-06-06 | CURRENT | 1H / 4M / 3L / 4I | 19 files source-verified |
