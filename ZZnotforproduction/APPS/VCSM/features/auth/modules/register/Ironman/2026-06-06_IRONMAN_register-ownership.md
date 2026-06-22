---
name: ironman.vcsm.auth.register.ownership
description: IRONMAN Ownership Report — VCSM auth:register module — navState.from, inviteCode, profiles.upsert, platform.user_consents, monitoring PII
metadata:
  type: ironman
  owner: IRONMAN
  last-run: 2026-06-06
  architect-source: ZZnotforproduction/APPS/VCSM/features/auth/ARCHITECTURE.md (2026-06-05, FRESH)
  scope: VCSM:auth — register module only
---

# IRONMAN OWNERSHIP REPORT
## VCSM:auth — Register Module

**Run Date:** 2026-06-06
**ARCHITECT Source:** `ZZnotforproduction/APPS/VCSM/features/auth/ARCHITECTURE.md` (last-run: 2026-06-05, FRESH)
**Mission:** Resolve ownership questions from the Register ARCHITECT report
**Verdict:** OWNERSHIP_PARTIAL

---

## PREFLIGHT — ARCHITECT Artifact Completeness Check

| Artifact | Status | Result |
|---|---|---|
| `ARCHITECTURE.md` | COMPLETE — purpose, layer map, ownership section, boundary warnings, data contract, governance links present | PASS |
| `feature-map` (embedded in ARCHITECTURE.md) | COMPLETE — DAL (31), Controller (30), Hook (15), Screen (11), Model (12), Component (4), Adapter (1) | PASS |
| `dependency-map` (embedded in ARCHITECTURE.md) | COMPLETE — 7 dependency edges including engines/identity, engines/profile, features/wanders, DB tables | PASS |

**Gate: PASS** — ownership discovery may proceed.

---

## IRONMAN TARGET

```
IRONMAN TARGET
Feature / Engine:    auth — register module (sub-scope of auth feature)
Application Scope:   VCSM
Reason:              Resolve 5 ownership questions from ARCHITECT V2 register report
```

---

## CODE ROOTS

```
CODE ROOTS
Source: ARCHITECT ARCHITECTURE.md [ZZnotforproduction/APPS/VCSM/features/auth/ARCHITECTURE.md, 2026-06-05]
Primary path:     apps/VCSM/src/features/auth/
Register module:
  apps/VCSM/src/features/auth/hooks/useRegister.js
  apps/VCSM/src/features/auth/controllers/register.controller.js
  apps/VCSM/src/features/auth/dal/register.dal.js
  apps/VCSM/src/features/auth/screens/RegisterScreen.jsx
  apps/VCSM/src/features/auth/components/RegisterFormCard.jsx
Cross-feature dependencies (sourced via adapter boundary):
  apps/VCSM/src/features/legal/adapters/legal.adapter.js  (consent recording)
  apps/VCSM/src/features/wanders/adapters/services/wandersSupabaseClient.adapter.js  (Wanders dual-client)
Services:
  apps/VCSM/src/services/monitoring/monitoringClient.js
  apps/VCSM/src/services/supabase/supabaseClient.js
Downstream consumer (navState.from terminus):
  apps/VCSM/src/features/auth/hooks/useAuthOnboarding.js
  apps/VCSM/src/features/auth/screens/Onboarding.jsx
Model:
  apps/VCSM/src/features/auth/model/authInputValidation.model.js
```

---

## LAYER MAP

```
LAYER MAP
Source: ARCHITECT feature-map [ARCHITECTURE.md, 2026-06-05]
DAL:        register.dal.js  (5 functions: dalReadRegisterSession, dalUpdateRegisterUser,
                               dalSignUpRegisterUser, dalSignOutRegisterSession,
                               dalUpsertRegisterProfile, dalMirrorWandersSessionToPrimary)
Model:      authInputValidation.model.js  (validateEmail, isValidInviteCode, isSafeAuthReturnPath)
            registerPasswordRules.model.js  (evaluateRegisterPasswordRules, evaluateConfirmPasswordState)
Controller: register.controller.js  (ctrlRegisterAccount — main entry point)
Hook:       useRegister.js  (state, navState computation, consent orchestration, monitoring)
Component:  RegisterFormCard.jsx, ConsentCheckbox.jsx
Screen:     RegisterScreen.jsx
```

---

## DEPENDENCY OWNERSHIP

```
DEPENDENCY OWNERSHIP
Source: ARCHITECT dependency-map + ARCHITECTURE.md [2026-06-05]

Engines used:
  - engines/identity  (injected via ensureVcsmPlatformBootstrap — NOT direct import)
  - engines/profile   (profiles table writes via register.dal.js)

Shared modules:
  - services/supabase/supabaseClient  (primary Supabase client)
  - services/monitoring/monitoringClient  (error telemetry)

External services:
  - Supabase Auth API  (signUp, updateUser, signOut, getSession, setSession)
  - features/legal  (consent recording — accessed via legal.adapter.js)
  - features/wanders  (Wanders dual-client — accessed via wandersSupabaseClient.adapter.js)
  - features/onboarding  (downstream consumer of navState.from — no reverse dependency)
```

---

## DATA OWNERSHIP

```
DATA OWNERSHIP
Source: ARCHITECT ARCHITECTURE.md (ownership section) [2026-06-05]

Tables read:
  - auth session (Supabase Auth internal) — via dalReadRegisterSession

Tables written:
  - profiles (public schema) — UPSERT via dalUpsertRegisterProfile
      Fields: id (= userId), email, updated_at, created_at (new users only)
      Path: ctrlRegisterAccount → dalUpsertRegisterProfile
      Both new-user AND anonymous-upgrade paths write this table.
  - platform.user_consents — INSERT via legal feature chain
      Path: useRegister.js → recordSignupConsent (legal adapter)
               → legalConsent.controller.js → dalRecordLegalAcceptance
               → platform.user_consents
  - vc.vibe_invites — NOT written during register (inviteCode captured but attribution UNIMPLEMENTED)

Identity surfaces:
  - supabase.auth.users  (created via signUp / updated via updateUser)
  - Wanders Supabase client session (mirrored to primary if isWandersFlow)

Caches:
  - legalDocsCache (60s TTL) — in legalConsent.controller.js
  - consentCache (90s TTL) — in legalConsent.controller.js

IRONMAN_OWNERSHIP_CONFLICT:
  - vc.vibe_invites.accepted_actor_id / status — field exists in DB, never written at registration.
    inviteCode is captured and UUID-validated in useRegister.js but silently dropped.
    No owner currently writes the attribution link at registration time.
```

---

## GOVERNANCE OWNERSHIP

```
GOVERNANCE OWNERSHIP

Contracts touched:
  - Actor Ownership Contract (auth.users → vc.actors → vc.actor_owners creation chain)
  - Architecture Contract (DAL → Controller → Hook → Screen layer order)
  - Boundary Isolation Contract (legal accessed via adapter; wanders via adapter)
  - Public Identity Surface Contract (profiles.id = auth.users.id)

Logan docs:
  - ZZnotforproduction/APPS/VCSM/features/auth/BEHAVIOR.md  (STUB — no behavioral spec)
  - ZZnotforproduction/APPS/VCSM/features/auth/SECURITY.md  (inline findings only)

Engine audits:
  - MISSING — no engine audit doc for identity or profile engine involvement in register path

Architecture maps:
  - ZZnotforproduction/APPS/VCSM/features/auth/ARCHITECTURE.md  (FRESH, 2026-06-05)

Security audit:
  - MISSING as formal doc — VENOM-AUTH-003, VENOM-AUTH-006 referenced inline in source
```

---

## OWNERSHIP FINDINGS — FIVE QUESTIONS

---

### FINDING IM-REG-001 — navState.from Ownership

```
IRONMAN OWNERSHIP FINDING
- Finding ID:           IM-REG-001
- Feature / Engine:     auth:register
- Application Scope:    VCSM
- Responsibility Type:  Navigation / Post-Auth Redirect Safety
- Ownership Clarity:    PARTIAL
- Boundary Risk:        MEDIUM
- Severity:             HIGH
- Primary code roots:
    apps/VCSM/src/features/auth/hooks/useRegister.js (source — lines 46-57)
    apps/VCSM/src/features/auth/hooks/useAuthOnboarding.js (consumer — lines 29-36, 143)
- Core layers:          Hook (both sides), Screen (Onboarding.jsx)
- Engines used:         none for navState itself
- Tables / Objects:     none
- Rule ownership:
    isSafeAuthReturnPath is DEFINED in authInputValidation.model.js (FINDING-001 comment)
    isSafeAuthReturnPath is NOT CALLED on navState.from in the register → onboarding path
- Contracts touched:    Architecture Contract (redirect safety must be validated at use site)
- Docs touched:         BEHAVIOR.md (stub — this flow is not documented)
- Runtime ownership:    INFERRED — navState.from flows hook-to-hook via React Router state
- Current ambiguity:
    useRegister.js computes navState.from from location.state.from as a raw string with a type
    check (typeof === 'string') but NO whitelist validation.
    navState.from is then passed via goOnboarding() to navigate('/onboarding', { state: { from } }).
    useAuthOnboarding.js reads state.from with a fallback to '/' but again without calling
    isSafeAuthReturnPath. The final navigate(navState.redirectTo) at onboarding completion
    sends the user to whatever string was propagated — validated only by type, not by path safety.
    isSafeAuthReturnPath enforces an in-app prefix whitelist and rejects protocol-relative paths
    and absolute URLs — it is the correct guard — but it is orphaned in authInputValidation.model.js.
- Risk:
    React Router state is not settable via URL parameters alone, so external-origin open-redirect
    risk is low-to-medium. However:
    1. If any code path calls navigate('/register', { state: { from: '//external.com' } }) or
       navigate('/register', { state: { from: 'javascript:void(0)' } }), that path will survive
       unvalidated to the final navigate() call after onboarding completion.
    2. The LoginScreen also computes navState and passes it as Link state to the register link
       (RegisterFormCard line 256: to="/login" state={navState}) — creating a multi-hop chain
       where the initial from value must be trusted from the login screen's own computation.
    3. Defense-in-depth principle: validation should occur at the point of use (useAuthOnboarding)
       not assumed to have been done upstream.
- Recommended ownership clarification:
    auth:register module owns navState.from COMPUTATION (useRegister.js).
    auth:onboarding module (useAuthOnboarding.js) must own navState.from VALIDATION before navigate().
    isSafeAuthReturnPath is already written and exported — it must be called in useAuthOnboarding.js
    before navigate(navState.redirectTo).
- Recommended handoff:
    ELEKTRA — patch useAuthOnboarding.js to call isSafeAuthReturnPath(navState.redirectTo) and
    fall back to '/' if the path fails the whitelist.
- Rationale:
    The guard function exists and is correct. The gap is in the call site — useAuthOnboarding.js
    does not use it. This is a defense-in-depth gap on the auth redirect path.
```

**WHO OWNS navState.from:**
- Source computation: auth:register module (`useRegister.js`) — OWNED
- Downstream validation before navigate: UNOWNED — `useAuthOnboarding.js` does not call `isSafeAuthReturnPath`
- Classification: **PARTIAL**

**WHO VALIDATES it downstream:**
- Answer: **NOBODY**. `isSafeAuthReturnPath` is exported and ready but not invoked in the register→onboarding flow.

---

### FINDING IM-REG-002 — inviteCode Ownership

```
IRONMAN OWNERSHIP FINDING
- Finding ID:           IM-REG-002
- Feature / Engine:     auth:register
- Application Scope:    VCSM
- Responsibility Type:  Invite Attribution / Lifecycle
- Ownership Clarity:    CONFLICT
- Boundary Risk:        HIGH
- Severity:             HIGH
- Primary code roots:
    apps/VCSM/src/features/auth/hooks/useRegister.js  (capture — lines 36-44)
    apps/VCSM/src/features/auth/model/authInputValidation.model.js  (isValidInviteCode)
    apps/VCSM/src/features/onboarding/dal/vibeInvites.dal.js  (reads vc.vibe_invites — no write)
    supabase/migrations/ — vc.vibe_invites exists (fields: invite_code, status, accepted_actor_id)
- Core layers:          Hook (capture), Model (validation), DAL (reads only — write is MISSING)
- Engines used:         none
- Tables / Objects:     vc.vibe_invites (invite_code lookup, status update, accepted_actor_id set — NONE OF THESE HAPPEN AT REGISTRATION)
- Rule ownership:
    "Invite code captured at register must be attributed to the inviter" — UNOWNED
    No controller or DAL writes vc.vibe_invites.accepted_actor_id or updates status='accepted'
    during registration or onboarding. The rule exists only as a TODO comment.
- Contracts touched:    Actor Ownership Contract (invite attribution is an actor-link operation)
- Docs touched:         MISSING — no invite attribution doc in auth or onboarding feature
- Runtime ownership:    INFERRED — inviteCode is returned from useRegister() but never forwarded
                        to any write path; it is exported from the hook but unused by RegisterScreen
- Current ambiguity:
    useRegister.js (line 36-44): inviteCode is read from URL query param ?invite_code=...,
    validated as UUID format (isValidInviteCode), then exposed from the hook.
    Explicit TODO comment at line 37-40: "after signup, look up vc.vibe_invites by invite_code
    and mark it accepted to attribute the new user back to the inviter actor."
    RegisterScreen.jsx does NOT consume inviteCode from useRegister (not destructured).
    ctrlRegisterAccount does NOT accept or forward inviteCode.
    dalUpsertRegisterProfile does NOT record invite attribution.
    vibeInvites.dal.js has READ functions only — no write that accepts a new_user → inviter link.
    vc.vibe_invites table has the schema (invite_code, status, accepted_actor_id) but no code
    updates these during the registration lifecycle.
- Risk:
    Inviters are never credited for successful signups. Attribution loop is permanently broken.
    Invite-based growth mechanics are non-functional. If A invites B and B registers, nothing records
    the link — B's inviteCode is read, validated, then silently discarded.
- Recommended ownership clarification:
    auth:register module should own inviteCode CAPTURE and FORMAT VALIDATION (already done correctly).
    A new write path must be added — either:
      a) In ctrlRegisterAccount: after userId is obtained, call a new dalRecordInviteAcceptance
         that writes vc.vibe_invites (find by invite_code, set accepted_actor_id=userId, status=accepted)
      b) In auth:onboarding controller: after actor creation, look up and link the invite
    Owner for the write path must be assigned. Currently UNOWNED.
- Recommended handoff:
    CARNAGE — design the write path (which side of the registration/onboarding boundary owns it,
    which actor identity must be present before writing accepted_actor_id)
    ELEKTRA — patch the write path once designed (inviteCode must be forwarded through ctrlRegisterAccount)
- Rationale:
    inviteCode is correctly captured and validated but has no downstream write. This is a confirmed
    dead-end in the feature's lifecycle ownership. The TODO comment confirms this was always intended
    to be implemented but never was.
```

**WHO OWNS inviteCode attribution:**
- Capture: auth:register hook — OWNED (UUID format validated)
- Attribution write: **UNOWNED** — no file writes vc.vibe_invites at registration time
- Classification: **CONFLICT** (value captured by register module, attribution table owned by no feature)

---

### FINDING IM-REG-003 — profiles.upsert Ownership

```
IRONMAN OWNERSHIP FINDING
- Finding ID:           IM-REG-003
- Feature / Engine:     auth:register
- Application Scope:    VCSM
- Responsibility Type:  Identity Bootstrap / Profile Shell Creation
- Ownership Clarity:    OWNED
- Boundary Risk:        LOW
- Severity:             LOW
- Primary code roots:
    apps/VCSM/src/features/auth/dal/register.dal.js  (dalUpsertRegisterProfile — line 34-51)
    apps/VCSM/src/features/auth/controllers/register.controller.js  (ctrlRegisterAccount — lines 80-86, 115-122)
    supabase/migrations/ — profiles table (public schema, id = auth.users.id)
- Core layers:          DAL, Controller
- Engines used:         engines/profile  (profiles table is the shared identity record)
- Tables / Objects:     profiles (public schema)
    Fields written: id (userId), email, updated_at, created_at (new users only)
    Payload is minimal by design — display_name, username, birthdate written by onboarding
- Rule ownership:
    "Profile shell must exist before onboarding begins" — OWNED by auth:register module
    ctrlRegisterAccount writes the shell for both new-user signUp AND anonymous-upgrade paths.
    The onboarding controller adds display_name, username_base, birthdate, sex after actor creation.
- Contracts touched:    Public Identity Surface Contract, Architecture Contract
- Docs touched:         ARCHITECTURE.md (confirmed), BEHAVIOR.md (stub)
- Runtime ownership:    CONFIRMED — two call sites in ctrlRegisterAccount (lines 80-86, 115-122)
- Current ambiguity:    NONE
- Risk:                 LOW — profiles table is auth-owned during registration phase per ARCHITECTURE.md
- Recommended ownership clarification:
    No change needed. Ownership is clear and correctly scoped.
    auth:register owns the profile shell (id, email, timestamps).
    auth:onboarding owns the profile completion (display_name, username, birthdate, sex).
    engines/profile owns profile reads in other features.
- Recommended handoff:  NONE required
- Rationale:
    The DAL is clean (explicit field list, no select *), correctly scoped to the register module,
    called from the right layer (controller), and handles both registration paths.
    Ownership is unambiguous.
```

**WHO OWNS profile shell creation:**
- `auth:register` module exclusively — DAL (`dalUpsertRegisterProfile`) → Controller (`ctrlRegisterAccount`)
- Shell scope: `id`, `email`, `updated_at`, `created_at` only — correct minimal footprint
- Classification: **OWNED**

---

### FINDING IM-REG-004 — platform.user_consents Ownership and Session Verification Boundary

```
IRONMAN OWNERSHIP FINDING
- Finding ID:           IM-REG-004
- Feature / Engine:     auth:register (trigger) + features/legal (owner)
- Application Scope:    VCSM
- Responsibility Type:  Legal Compliance / Consent Record
- Ownership Clarity:    OWNED (legal feature) / PARTIAL (session boundary enforcement)
- Boundary Risk:        MEDIUM
- Severity:             MEDIUM
- Primary code roots:
    apps/VCSM/src/features/legal/controllers/legalConsent.controller.js  (recordSignupConsent)
    apps/VCSM/src/features/legal/dal/userConsents.write.dal.js  (dalRecordLegalAcceptance)
    apps/VCSM/src/features/legal/dal/userConsents.read.dal.js  (dalGetUserConsents)
    apps/VCSM/src/features/legal/adapters/legal.adapter.js  (boundary — useSignupConsent exported)
    apps/VCSM/src/features/legal/hooks/useSignupConsent.js  (hook wrapper)
    apps/VCSM/src/features/auth/hooks/useRegister.js  (caller — lines 14, 141-163)
    supabase/migrations/20260510030000_user_consents_immutability_and_grant.sql
    supabase/migrations/20260510050000_accepted_at_server_default.sql
- Core layers:          Hook (useRegister triggers), Controller (legal), DAL (legal)
- Engines used:         none (legal feature is self-contained)
- Tables / Objects:     platform.user_consents
    INSERT: GRANT to authenticated role (migration confirmed)
    UPDATE: DENIED by restrictive policy (user_consents_deny_update — migration confirmed)
    DELETE: DENIED by restrictive policy (user_consents_deny_delete — migration confirmed)
    Audit fields: immutable via trigger (prevent_consent_audit_mutation — migration confirmed)
    accepted_at: DB DEFAULT now() — server-authoritative, not client-injectable
    ip_address: intentionally omitted from client — must be captured server-side (documented)
    SELECT: policy not in reviewed migrations — must be confirmed separately
- Rule ownership:
    "Consent must be recorded only when a verified session exists" — PARTIAL
    useRegister.js records consent only when ctrlRegisterAccount returns { userId, requiresEmailConfirm: false }
    This means consent is NOT recorded on the email-confirm path — correct behavior.
    However, userId used for the consent INSERT comes from ctrlRegisterAccount's return value,
    which comes from authData.user.id — not re-read from the active session.
    Session is established by this point (signUp returned a session), so the risk is low.
    But there is no explicit supabase.auth.getSession() call immediately before consent recording
    to re-verify the active session matches the userId being written.
- Contracts touched:    Architecture Contract (cross-feature via adapter), Boundary Isolation Contract
- Docs touched:         MISSING — no legal feature ownership doc
- Runtime ownership:    INFERRED — legal feature owns the chain; register hook triggers it at signup
- Current ambiguity:
    Cross-feature boundary: useRegister imports useSignupConsent from legal.adapter — CORRECT
    (adapter barrel is the right boundary).
    Session verification: useRegister passes userId from ctrlRegisterAccount result to recordSignupConsent.
    The session is active at this point (no email-confirm required path). Risk is low.
    SELECT RLS policy: migration files show INSERT grant + UPDATE/DELETE deny. No SELECT policy
    reviewed — must exist via earlier migration or anon-role read restriction.
- Risk:
    MEDIUM: SELECT policy for platform.user_consents not confirmed in reviewed migrations.
    LOW: userId source is from Supabase Auth signUp result — not user-injectable.
    LOW: ip_address omission is documented and intentional.
- Recommended ownership clarification:
    features/legal owns platform.user_consents end-to-end (controller, DAL, RLS, migrations).
    auth:register module is a caller only — it triggers consent recording via adapter boundary.
    This is correct and well-scoped.
    Action needed: confirm SELECT RLS policy exists for platform.user_consents (DB review).
- Recommended handoff:
    DB / CARNAGE — confirm SELECT policy on platform.user_consents; document in legal feature OWNERSHIP.md
- Rationale:
    Ownership chain is clear and correct. Adapter boundary is respected. RLS is partially confirmed.
    The only gap is confirming the SELECT policy and writing the legal feature ownership doc.
```

**WHO OWNS consent records:**
- `features/legal` owns the full write chain (controller → DAL → table)
- `auth:register` is a trigger-caller only, correctly accessing via adapter
- RLS: INSERT ✓, UPDATE DENY ✓, DELETE DENY ✓, immutability trigger ✓ — SELECT policy unconfirmed
- Classification: **OWNED** (legal feature, full chain) / PARTIAL (SELECT RLS unconfirmed)

---

### FINDING IM-REG-005 — Monitoring Message Ownership and PII Responsibility

```
IRONMAN OWNERSHIP FINDING
- Finding ID:           IM-REG-005
- Feature / Engine:     services/monitoring (owner) + auth:register (caller)
- Application Scope:    VCSM
- Responsibility Type:  Observability / PII Safety
- Ownership Clarity:    OWNED
- Boundary Risk:        LOW
- Severity:             LOW
- Primary code roots:
    apps/VCSM/src/services/monitoring/monitoringClient.js  (captureFrontendError)
    apps/VCSM/src/features/auth/hooks/useRegister.js  (callers — lines 150-162, 169-180)
- Core layers:          Service (monitoring), Hook (register — caller)
- Engines used:         none
- Tables / Objects:     monitoring-ingest-error Edge Function (Supabase Functions.invoke)
- Rule ownership:
    "Monitoring payloads must never contain PII" — OWNED by monitoringClient.js
    PII_KEYS set: password, token, email, access_token, refresh_token, session_token,
                  secret, credential, api_key, auth_token — stripped by stripPii()
    Self-loop guard: isSelfReferential() prevents recursive monitoring capture
    Never-throw contract: try/catch wraps entire implementation; errors discarded silently
- Contracts touched:    Architecture Contract (service layer owns cross-cutting concern)
- Docs touched:         MISSING — no monitoring service ownership doc
- Runtime ownership:    CONFIRMED — captureFrontendError called at two points in useRegister.js:
    1. Register submit failure (line 169): payload has feature, module, controller, route,
       tags={flow:'register'}, context={stage:'registerSubmit'}, breadcrumbs — no PII
    2. Consent recording failure (line 150): payload has same structure,
       context={stage:'consentRecording'} — no PII
    userId is NOT included in any register monitoring payload — correct
    email is NOT included — correct (PII_KEYS would strip it if accidentally included)
- Current ambiguity:    NONE
- Risk:
    LOW — PII stripping is centralized and correct.
    Depth limit (3) and array cap (50) prevent object explosion.
    legalConsent.controller.js collects locale and userAgent for consent records — these
    are informational-only per DAL comment, not included in monitoring payloads.
- Recommended ownership clarification:
    services/monitoring is the PII ownership boundary. No feature should strip PII itself —
    monitoringClient.js owns that responsibility for all callers.
    auth:register correctly delegates all observability to monitoringClient.js.
- Recommended handoff:  NONE required
- Rationale:
    Monitoring ownership is clean. PII responsibility is centralized. Callers pass only
    structured metadata with no user-sensitive fields. The service-layer pattern is correct.
```

**WHO OWNS monitoring message ownership and PII:**
- `services/monitoring/monitoringClient.js` owns PII stripping and message formatting
- `auth:register` (useRegister.js) is a correct caller — passes no PII, uses structured metadata
- Classification: **OWNED**

---

## IRONMAN OWNERSHIP RECORD

```
IRONMAN OWNERSHIP RECORD
Feature:           auth:register (sub-scope of VCSM:auth)
Application Scope: VCSM
Primary files:
  apps/VCSM/src/features/auth/hooks/useRegister.js
  apps/VCSM/src/features/auth/controllers/register.controller.js
  apps/VCSM/src/features/auth/dal/register.dal.js
  apps/VCSM/src/features/auth/screens/RegisterScreen.jsx
  apps/VCSM/src/features/auth/components/RegisterFormCard.jsx
Engines used:
  - engines/identity  (injected via callback — not imported)
  - engines/profile   (profiles table via register.dal.js)
Tables touched:
  - profiles (public) — UPSERT — OWNED by auth:register
  - supabase.auth.users — signUp/updateUser — OWNED by auth:register
  - platform.user_consents — INSERT — OWNED by features/legal (caller: auth:register)
  - vc.vibe_invites — NO WRITE at registration — UNOWNED (attribution gap)
Contracts touched:
  - Actor Ownership Contract
  - Public Identity Surface Contract
  - Boundary Isolation Contract
  - Architecture Contract
Docs touched:
  - ZZnotforproduction/APPS/VCSM/features/auth/ARCHITECTURE.md (FRESH)
  - ZZnotforproduction/APPS/VCSM/features/auth/BEHAVIOR.md (stub)
  - ZZnotforproduction/APPS/VCSM/features/auth/SECURITY.md (partial)
Responsibilities:
  - Profile shell creation (id, email, timestamps) at registration
  - navState.from computation (source only — validation is downstream gap)
  - inviteCode capture and format validation (attribution write: UNOWNED)
  - Consent recording trigger (execution owned by features/legal)
  - Monitoring error emission (execution owned by services/monitoring)
  - Wanders session mirror (userId cross-check present — VENOM-AUTH-003 compliant)
Boundary rules:
  - Must not write to vc.vibe_invites without assigned ownership and CARNAGE design review
  - Must not call legal DAL directly — adapter boundary is required
  - Must not inject userId into monitoring payloads
  - inviteCode must not be forwarded to ctrlRegisterAccount until attribution write is designed
  - navState.from must not be used as a navigate destination without isSafeAuthReturnPath validation
```

---

## DATA OWNERSHIP REGISTRY

| Object | Primary Owner | Read Consumers | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|---|
| profiles (public) | auth module | settings, profiles feature, engines/profile | auth:register (shell), auth:onboarding (complete) | Supabase Auth (implicit: id = auth.uid()) | auth module | MISSING |
| platform.user_consents | features/legal | features/legal (consent check) | features/legal (INSERT only) | migrations (INSERT grant, DENY UPDATE/DELETE confirmed; SELECT TBC) | features/legal | MISSING |
| auth session (supabase.auth) | auth module | all authenticated features via AuthProvider | auth:register (signUp, updateUser, signOut, setSession) | Supabase Auth (internal) | N/A | MISSING |
| vc.vibe_invites | features/onboarding | features/onboarding (dashboard cards) | UNOWNED at registration | vc schema RLS | UNKNOWN | MISSING |

---

## RULE OWNERSHIP REGISTRY

| Rule | Owner | Enforcement Layer | Docs | Risk |
|---|---|---|---|---|
| Only UUID-format invite codes forwarded | auth:register | Model (isValidInviteCode in authInputValidation.model.js) | authInputValidation.model.js comment (FINDING-002) | LOW |
| navState.from must be a safe in-app path | auth:register (definition), auth:onboarding (enforcement gap) | Model (isSafeAuthReturnPath defined, NOT CALLED at consume site) | authInputValidation.model.js comment (FINDING-001) | HIGH — call site missing |
| Profile shell created before onboarding | auth:register | Controller (ctrlRegisterAccount) | ARCHITECTURE.md | LOW |
| Consent recorded only when session is active | auth:register (orchestration) | Hook (useRegister.js — checks userId from result) | BEHAVIOR.md (stub) | MEDIUM |
| PII stripped before monitoring emission | services/monitoring | Service (monitoringClient.js stripPii) | monitoringClient.js inline | LOW |
| inviteCode attributed to inviter actor | UNOWNED | MISSING — no write path exists | TODO comment in useRegister.js only | HIGH |
| Wanders session must match expected userId | auth:register | Controller (register.controller.js maybeMirrorWandersSession) | VENOM-AUTH-003 inline comment | LOW — guard present |

---

## RUNTIME OWNERSHIP MAP

| Runtime Flow | Entry Point | Owning Feature | Controllers | DALs | Hotspots |
|---|---|---|---|---|---|
| Email/password registration | RegisterScreen → useRegister.handleSubmit | auth:register | ctrlRegisterAccount | dalSignUpRegisterUser, dalUpsertRegisterProfile | Supabase signUp latency |
| Anonymous user upgrade | ctrlRegisterAccount (canUpgradeExistingSession branch) | auth:register | ctrlRegisterAccount | dalUpdateRegisterUser, dalUpsertRegisterProfile | race with existing session |
| Wanders flow session mirror | ctrlRegisterAccount → maybeMirrorWandersSession | auth:register | maybeMirrorWandersSession | dalReadRegisterSession, dalMirrorWandersSessionToPrimary | dual-client fetch |
| Consent recording | useRegister.handleRegister (post-signup) | features/legal (triggered by auth:register) | recordSignupConsent | dalRecordLegalAcceptance | parallel Promise.all per doc |
| Post-signup navigation | useRegister.goOnboarding | auth:register (hook) | none | none | navState.from unvalidated |
| Onboarding redirect | useAuthOnboarding.handleSave | auth:onboarding | completeOnboardingController | various | navState.redirectTo unvalidated before navigate |
| Monitoring emission | useRegister.handleRegister (catch paths) | services/monitoring | captureFrontendError | none | Edge Function latency (never-throw) |

---

## CROSS-ROOT OWNERSHIP REVIEW

| Area | Claimed Owner | Actual Root | Boundary Status | Notes |
|---|---|---|---|---|
| Consent recording (platform.user_consents) | features/legal | apps/VCSM/src/features/legal/ | CLEAN — adapter boundary used | useRegister imports via legal.adapter.js |
| Wanders dual-client | features/wanders (adapter) | apps/VCSM/src/features/wanders/adapters/ | NEEDS REVIEW — register.controller imports wandersSupabaseClient.adapter directly | ARCHITECT boundary warning confirmed; must verify adapter exposes this publicly |
| Monitoring | services/monitoring | apps/VCSM/src/services/monitoring/ | CLEAN — service boundary | register imports monitoringClient directly from services/ (correct for cross-cutting service) |
| vc.vibe_invites attribution | UNOWNED at registration | apps/VCSM/src/features/auth/ (capture), vc schema (table) | MISSING — no cross-feature attribution path exists | inviteCode silently discarded after capture |

---

## OWNERSHIP BOUNDARY WARNINGS

```
OWNERSHIP BOUNDARY WARNING — navState.from
Location:         useAuthOnboarding.js:143 — navigate(navState.redirectTo, { replace: true })
Current ambiguity: isSafeAuthReturnPath is defined in authInputValidation.model.js and is exported
                   but is never called in the register → onboarding redirect chain.
Why it is risky:  Any string that survives type-check in useRegister.js and useAuthOnboarding.js
                  as state.from is used as a navigate destination without whitelist validation.
                  Protocol-relative paths (//evil.com) would not be caught.
Suggested ownership clarification:
  useAuthOnboarding.js must call isSafeAuthReturnPath(state.from) and fall back to '/' if false.
  This is a one-line guard at a confirmed-dangerous call site.
```

```
OWNERSHIP BOUNDARY WARNING — inviteCode attribution
Location:         useRegister.js:36-44 — inviteCode captured, validated, then never forwarded
Current ambiguity: inviteCode is available in the hook but not passed to ctrlRegisterAccount.
                   vc.vibe_invites.accepted_actor_id is never written during registration lifecycle.
Why it is risky:  Invite-based attribution is permanently broken. Inviters are never credited.
                  Onboarding card for invite completion counts sent invites via vibeInvites.dal.js
                  (senderActorId) but NOT accepted invites from new registrations.
Suggested ownership clarification:
  Assign ownership of vc.vibe_invites writes at registration to auth:register or auth:onboarding.
  CARNAGE must design the write path. inviteCode must be threaded into ctrlRegisterAccount.
```

```
OWNERSHIP BOUNDARY WARNING — platform.user_consents SELECT policy
Location:         dalGetUserConsents in userConsents.read.dal.js — reads platform.user_consents
Current ambiguity: Reviewed migrations confirm INSERT grant and UPDATE/DELETE deny.
                   No SELECT policy confirmed in reviewed files.
Why it is risky:  If no SELECT RLS policy exists, the anon role could read consent rows
                  (depending on schema-level defaults). Consent records contain userId,
                  legal_document_id, consent_version — sensitive audit data.
Suggested ownership clarification:
  DB/CARNAGE must confirm SELECT policy: should restrict to user_id = auth.uid() for authenticated,
  deny all for anon.
```

---

## FILES THAT MUST CHANGE

| File | Change Needed | Reason | Owner |
|---|---|---|---|
| `apps/VCSM/src/features/auth/hooks/useAuthOnboarding.js` | Add `isSafeAuthReturnPath(state.from)` before `navigate(navState.redirectTo)` | navState.from unvalidated at consume site | ELEKTRA |
| `apps/VCSM/src/features/auth/hooks/useRegister.js` | Optionally validate `fromState` against `isSafeAuthReturnPath` at source too | Defense in depth — validate at both source and consumer | ELEKTRA |
| `apps/VCSM/src/features/auth/controllers/register.controller.js` | Add `inviteCode` param; after userId resolved, write vc.vibe_invites attribution | inviteCode silently dropped — attribution never recorded | After CARNAGE design |
| New DAL: `apps/VCSM/src/features/auth/dal/inviteAttribution.dal.js` | Write accepted_actor_id to vc.vibe_invites by invite_code | No write path exists for invite attribution | After CARNAGE design |

---

## FILES THAT MUST NOT CHANGE

| File | Reason |
|---|---|
| `apps/VCSM/src/features/auth/dal/register.dal.js` | Ownership is clean. DAL is correctly scoped. No changes needed. |
| `apps/VCSM/src/services/monitoring/monitoringClient.js` | PII scrubbing is correct and centralized. Callers are correct. No changes needed. |
| `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js` | Full ownership chain is clean. No changes needed. |
| `apps/VCSM/src/features/legal/dal/userConsents.write.dal.js` | Correct. ip_address omission is documented and intentional. |
| `apps/VCSM/src/features/legal/dal/userConsents.read.dal.js` | Correct. SELECT policy must be confirmed at DB level, not code level. |
| `apps/VCSM/src/features/auth/model/authInputValidation.model.js` | The model is correct. `isSafeAuthReturnPath` is already written — the gap is in callers. |
| `supabase/migrations/20260510030000_user_consents_immutability_and_grant.sql` | Confirmed correct. Do not modify applied migrations. |

---

## FIVE QUESTION ANSWERS — FINAL SUMMARY

| Question | Answer | Classification |
|---|---|---|
| Who owns navState.from? | auth:register hook COMPUTES it. auth:onboarding hook must VALIDATE it before navigate. Currently neither validates. | PARTIAL |
| Who validates navState.from downstream? | Nobody. `isSafeAuthReturnPath` is defined and exported but never called in this path. | UNOWNED (enforcement gap) |
| Who owns inviteCode attribution? | auth:register captures and validates it (UUID format). Attribution write to vc.vibe_invites is UNOWNED — no code records it. | CONFLICT |
| Who owns profile shell creation? | auth:register exclusively (register.controller.js → register.dal.js). Clean, correct ownership. | OWNED |
| Who owns consent records? | features/legal owns the full chain (controller, DAL, RLS, migrations). auth:register triggers via adapter boundary. | OWNED |
| Are RLS policies owned and documented? | platform.user_consents: INSERT grant, UPDATE/DELETE deny, immutability trigger — all confirmed. SELECT policy unconfirmed. profiles: standard Supabase Auth pattern (not formally documented). | PARTIAL |
| What files must change? | useAuthOnboarding.js (navState.from guard), useRegister.js (optional source guard), register.controller.js + new DAL (inviteCode attribution after CARNAGE design) | — |
| What files must NOT change? | register.dal.js, monitoringClient.js, legalConsent.controller.js, userConsents.write.dal.js, userConsents.read.dal.js, authInputValidation.model.js, migration files | — |

---

## FINAL VERDICT

**OWNERSHIP_PARTIAL**

Two clear ownership gaps block clean governance:

1. **IM-REG-001 (HIGH)** — navState.from has no validation at the consume site. `isSafeAuthReturnPath` is orphaned — defined but not called in `useAuthOnboarding.js` before `navigate()`. This is a defense-in-depth gap on the auth redirect path. Fix is one line.

2. **IM-REG-002 (HIGH)** — inviteCode attribution has no owner and no write path. The inviter is never credited for successful referrals. This requires CARNAGE design before any patch.

Three questions are clean:

3. **IM-REG-003 (LOW)** — profile shell creation is fully owned by auth:register. No gaps.
4. **IM-REG-004 (MEDIUM)** — consent records are fully owned by features/legal, correctly triggered via adapter. SELECT RLS policy requires DB confirmation.
5. **IM-REG-005 (LOW)** — monitoring PII is fully owned by services/monitoring. No gaps.

---

## RECOMMENDED HANDOFFS

| Command | Action |
|---|---|
| ELEKTRA | Patch `useAuthOnboarding.js` — add `isSafeAuthReturnPath` guard before `navigate(navState.redirectTo)` |
| ELEKTRA | Consider also patching `useRegister.js` — validate `fromState` at source (defense in depth) |
| CARNAGE | Design vc.vibe_invites attribution write path — determine boundary (register vs onboarding) and which actor identity is required |
| DB | Confirm SELECT RLS policy on `platform.user_consents` — should be user_id = auth.uid() |
| VENOM | Verify wanders adapter boundary — does `wandersSupabaseClient.adapter` publicly expose `getWandersSupabase`? |
| LOGAN | Author BEHAVIOR.md for auth:register — document happy path, email-confirm path, anonymous upgrade, Wanders flow, consent recording |
| SPIDER-MAN | Add register regression coverage — no test covers ctrlRegisterAccount, useRegister, or consent recording |

---

## IRONMAN OWNERSHIP RECORD COUNTS

| Severity | Count |
|---|---|
| HIGH | 2 (IM-REG-001, IM-REG-002) |
| MEDIUM | 1 (IM-REG-004) |
| LOW | 2 (IM-REG-003, IM-REG-005) |
| TOTAL | 5 |

OWNED: 3 of 5 questions
PARTIAL: 1 of 5 questions  
CONFLICT/UNOWNED: 1 of 5 questions

**Final verdict: OWNERSHIP_PARTIAL**
