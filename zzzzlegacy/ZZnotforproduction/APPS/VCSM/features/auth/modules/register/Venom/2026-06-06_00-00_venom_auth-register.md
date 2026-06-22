---
title: VENOM — auth / modules / register
date: 2026-06-06
reviewer: VENOM
scope: VCSM:auth:register
architect-run: 2026-06-06
full-rediscovery: NO
evidence-standard: SOURCE_VERIFIED (via ARCHITECT V2 evidence bundle)
recommendation: CAUTION
---

# VENOM SECURITY REVIEW — auth / modules / register

**Application Scope:** VCSM
**Module:** auth / modules / register
**Screen:** RegisterScreen.jsx
**Route:** /register
**Date:** 2026-06-06
**Reviewer:** VENOM
**ARCHITECT Gate:** SATISFIED — evidence-bundle.json consumed (run: 2026-06-06, status: COMPLETE)
**Full Rediscovery Performed:** NO — ARCHITECT evidence bundle consumed per V2 protocol

---

## SOURCE READ SUMMARY

ARCHITECT evidence bundle consumed. 19 source files were read in the ARCHITECT V2 run immediately preceding this review. All call chains, write surfaces, and security-sensitive surfaces are FRESH (same session). No independent re-read performed — bundle provenance: SOURCE_VERIFIED.

---

## VENOM TARGET

| Field | Value |
|---|---|
| Feature / Route / Engine | auth / modules / register — /register |
| Application Scope | VCSM |
| Reason for review | Post-ARCHITECT V2 security deep-dive of registration flow |
| Primary trust boundary | Unauthenticated user → Supabase auth.users; client → public.profiles + platform.user_consents |

---

## SECURITY SURFACE

| Field | Value |
|---|---|
| Entry point | /register (public, wrapped in AuthPublicRoute) |
| Auth source | No auth required on entry. Session created by Supabase auth.signUp (server-issued userId + tokens) |
| Authorization layer | canSubmit gate (client), termsAccepted guard (client), Wanders userId match guard (controller) |
| Identity surface | userId — server-issued by Supabase; email — user-submitted (controller-validated); isWandersFlow — client-controlled navigation state |
| Sensitive objects involved | auth.users (email + hashed password), public.profiles (email, timestamps), platform.user_consents (userId + legal doc refs), monitoring-ingest-error Edge Function payload |

---

## TRUST BOUNDARY TRACE

| Input | Source | Validated At | Trust Level |
|---|---|---|---|
| email | User input | validateEmail() in register.controller.js | Controller-validated (format + length + trim) |
| password | User input | evaluateRegisterPasswordRules() in useRegister | CLIENT-ONLY — no server enforcement confirmed |
| confirmPassword | User input | evaluateConfirmPasswordState() in useRegister | CLIENT-ONLY — never persisted |
| termsAccepted | Checkbox UI | handleRegister() if (!termsAccepted) block | CLIENT-ONLY — no server enforcement |
| intent | URL query ?intent= | useRegister: whitelist ('profile'/'vport') | Client — limited blast radius |
| citizen_invite_code | URL query ?invite_code= → user_metadata | isValidInviteCode() UUID-format regex → persisted via dalSignUpRegisterUser options.data | Persisted to auth.users.user_metadata; attributed at onboarding completion [TICKET-INVITE-ATTRIBUTION-001 IMPLEMENTED] |
| navState.from | location.state.from | typeof === 'string' ONLY — isSafeAuthReturnPath() NOT called | UNVALIDATED PATH — [VEN-REG-001] |
| wandersFlow | location.state.wandersFlow | Boolean() cast | UNVALIDATED CLIENT STATE — mitigated by controller guard |
| userId (post-signUp) | Supabase auth.signUp response | Server-issued — not client-controlled | SERVER-AUTHORITATIVE |

Identity resolved at: Supabase auth layer (server-side) — NOT from client.
Data returned to client: userId (hook return), requiresEmailConfirm flag, errorMessage.
Navigation state exfiltration: email → /verify-email state; navState (from, card, wandersFlow) → /onboarding state.

---

## FINDINGS

---

### VEN-REG-001 — navState.from Forwarded to Onboarding Without Path Whitelist

**VENOM SECURITY FINDING**

| Field | Value |
|---|---|
| Finding ID | VEN-REG-001 |
| Severity | HIGH |
| Location | useRegister.js:50-56 → goOnboarding() → navigate('/onboarding', { state: { from: navState.from } }) |
| Application Scope | VCSM |
| Platform Surface | PWA |
| Trust Boundary | Unauthenticated → Post-registration |
| Boundary Violated | Unauthenticated user injects redirect path that survives into authenticated onboarding flow |
| Contract Violated | Public Identity Surface Contract — return path must be validated before trust |
| Current behavior | navState.from is derived from location.state.from with only a typeof === 'string' check. The function isSafeAuthReturnPath() exists in authInputValidation.model.js (enforcing a whitelist of /feed, /explore, /profile, /vport, /dashboard, /settings, /booking, /learning) but is NOT called on navState.from in useRegister. The unvalidated string is forwarded via navigate('/onboarding', state) and persists as the post-onboarding redirect destination. |
| Risk | If any code path navigates to /register with a state.from containing an unwhitelisted or external-like path, and if the onboarding controller uses navState.from as a redirect target without its own whitelist, the user is redirected to an attacker-controlled path after completing registration. Within-app attack vector: if any component calls navigate('/register', { state: { from: userControlledValue } }) — a phishing link that launches the SPA and navigates to /register with crafted state also applies in deep-link scenarios. |
| Why it matters | Registration is the highest-value trust-establishment moment. A redirect after onboarding completion to an external or internal attacker-controlled path can be used for credential phishing, session fixation, or deceptive content delivery. The fix exists in the codebase — isSafeAuthReturnPath() just isn't called here. |
| Exploitability | MEDIUM |
| Attack Preconditions | Attacker must either: (a) craft a deep link that navigates the SPA to /register with state.from set to a malicious path, OR (b) find any in-app link to /register that passes user-controlled state.from. Full exploit requires the onboarding controller to use navState.from as a redirect without its own validation — ELEKTRA must trace this. |
| Blast Radius | Single actor (post-registration redirect affects only the registering user) |
| Identity Leak Type | None directly — but can be used for phishing post-registration |
| Cache Trust Type | None |
| RLS Dependency | NONE — app-layer defect |
| Recommended mitigation | Call isSafeAuthReturnPath() on navState.from before it is stored in navState. If the path fails the whitelist check, fall back to the intent-based destination or /welcome. Fix: `const fromState = typeof state.from === 'string' && isSafeAuthReturnPath(state.from) ? state.from : null` |
| Rationale | isSafeAuthReturnPath() is already defined, tested (implied by prior auth session), and has the correct whitelist. The fix is a one-line change. No new security logic required. |
| Follow-up command | ELEKTRA — trace navState.from from register → onboarding → redirect to confirm end-to-end exploitability; BLACKWIDOW — adversarial injection test |
| CISSP Domain — Primary | Identity and Access Management |
| CISSP Domain — Secondary | Software Development Security, Security Architecture and Engineering |

---

### VEN-REG-002 — public.profiles UPSERT RLS Unverified

**VENOM SECURITY FINDING**

| Field | Value |
|---|---|
| Finding ID | VEN-REG-002 |
| Severity | MEDIUM |
| Location | register.dal.js:48 → supabase.from('profiles').upsert({ id: userId, email, updated_at, created_at }) |
| Application Scope | VCSM |
| Platform Surface | PWA + Supabase Table/View |
| Trust Boundary | Authenticated Citizen (post-signUp) → public.profiles |
| Boundary Violated | DB write issued without confirmed DB-layer ownership enforcement |
| Contract Violated | Actor Ownership Contract — writes must be scoped to caller's verified identity |
| Current behavior | dalUpsertRegisterProfile writes a profile row using userId derived from Supabase's signUp response (server-issued). Application layer provides the userId correctly. However, RLS on public.profiles for INSERT/UPSERT has not been confirmed in any source read, prior governance finding, or DB audit. If RLS is absent or misconfigured (e.g., permitting any authenticated user to upsert any profile), an attacker who bypasses the application layer can overwrite another user's profile shell. |
| Risk | Without confirmed RLS: an authenticated user who calls the DAL directly (or crafts a Supabase client call) could upsert a profile for a foreign userId, overwriting their email or timestamps. This affects account integrity. |
| Why it matters | The profiles table is the identity bootstrap for all downstream actor operations. A corrupt profile row can disrupt onboarding, actor creation, and identity resolution. |
| Exploitability | LOW (requires bypassing the application layer — application correctly supplies server-issued userId; no client-controlled userId path exists here) |
| Attack Preconditions | Authenticated session required. Attacker must bypass the application layer and call Supabase client directly with a forged userId. No client-path exists to supply an arbitrary userId to this DAL. Risk materializes only if RLS is absent. |
| Blast Radius | Single actor (targeted overwrite of one profile row) |
| Identity Leak Type | None directly — write surface, not read |
| Cache Trust Type | None |
| RLS Dependency | UNVERIFIED — application assumes RLS is present; no DB audit performed |
| Recommended mitigation | DB audit: confirm RLS policy for public.profiles INSERT/UPSERT enforces (id = auth.uid()). If absent: add policy `CREATE POLICY profiles_owner_insert ON profiles FOR INSERT WITH CHECK (id = auth.uid())` and `profiles_owner_upsert ON profiles FOR UPDATE USING (id = auth.uid())`. |
| Rationale | Defense-in-depth: even if the application layer is correct, DB-layer enforcement prevents any bypass path (direct client calls, compromised app code). |
| Follow-up command | DB (confirm profiles RLS for INSERT/UPSERT) |
| CISSP Domain — Primary | Security Architecture and Engineering |
| CISSP Domain — Secondary | Identity and Access Management, Security Assessment and Testing |

---

### VEN-REG-003 — platform.user_consents INSERT RLS Unverified

**VENOM SECURITY FINDING**

| Field | Value |
|---|---|
| Finding ID | VEN-REG-003 |
| Severity | MEDIUM |
| Location | userConsents.write.dal.js:33 → schema('platform').from('user_consents').insert({ user_id: userId, ... }) |
| Application Scope | VCSM |
| Platform Surface | PWA + Supabase Table/View |
| Trust Boundary | Authenticated Citizen → platform.user_consents |
| Boundary Violated | Legal data write issued without confirmed DB-layer ownership enforcement |
| Contract Violated | Actor Ownership Contract — legal consent records must be scoped to the consenting user |
| Current behavior | dalRecordLegalAcceptance inserts consent records with user_id derived from the server-issued userId (from Supabase signUp response — not client-supplied). Application layer correctly sources userId. However, RLS on platform.user_consents for INSERT is unconfirmed. If absent, an authenticated user could theoretically insert consent records for another user's userId. |
| Risk | Forged consent records could falsely mark a user as having accepted legal documents they have not. This has legal compliance implications — consent attribution is legally significant. |
| Why it matters | Consent records are legal evidence. Forged records can: (a) allow access to gated features without genuine consent, (b) create compliance liability if disputes arise about what a user agreed to. |
| Exploitability | LOW-MEDIUM (user_id is application-sourced from server; no direct client path to supply arbitrary userId; attack requires bypassing application layer or a vulnerability in the consent recording flow) |
| Attack Preconditions | Authenticated session required. Attacker must bypass the application layer and call the consent DAL directly with a forged user_id. Or exploit a future code change that exposes userId as a parameter. |
| Blast Radius | Single actor (per-user consent records) — but compliance impact is broader |
| Identity Leak Type | None |
| Cache Trust Type | None |
| RLS Dependency | UNVERIFIED — no DB audit for platform.user_consents RLS |
| Recommended mitigation | DB audit: confirm RLS policy on platform.user_consents for INSERT enforces (user_id = auth.uid()). Also confirm accepted_at uses DB DEFAULT now() — confirmed correct from source read (accepted_at intentionally omitted from INSERT payload to use DB default). |
| Rationale | Legal compliance requires that consent records cannot be forged. DB-layer enforcement is the appropriate backstop. |
| Follow-up command | DB (confirm platform.user_consents RLS for INSERT) |
| CISSP Domain — Primary | Security and Risk Management |
| CISSP Domain — Secondary | Identity and Access Management, Asset Security |

---

### VEN-REG-004 — console.error Production Information Disclosure

**VENOM SECURITY FINDING**

| Field | Value |
|---|---|
| Finding ID | VEN-REG-004 |
| Severity | MEDIUM |
| Location | useRegister.js:146 → console.error('[Register] Failed to record legal consent:', consentErr) |
| Application Scope | VCSM |
| Platform Surface | PWA |
| Trust Boundary | Client runtime (browser console) |
| Boundary Violated | Internal error details leaked to client runtime without DEV guard |
| Contract Violated | None formal — violates project no-console rule |
| Current behavior | console.error is called unconditionally in production when consent recording fails. consentErr is the raw error from the Supabase consent write (or legalDocuments read), which may contain: Supabase error codes, table/column names, constraint names, policy names, or internal error messages. |
| Risk | Any user who opens DevTools during a consent recording failure sees internal error details. These details can be used for reconnaissance: knowing table/schema names, constraint names, and error codes reduces the work required to craft targeted attacks. |
| Why it matters | The project rule prohibits console.log/error in production. The right path is captureFrontendError() only (already called on the same line block). The console.error call adds no user-facing value and creates an information surface. |
| Exploitability | LOW (user must have DevTools open AND encounter a consent recording failure, which is uncommon) |
| Attack Preconditions | User must open DevTools during registration. Consent recording must fail (uncommon but possible if Supabase RPC errors or legal_documents table is empty). |
| Blast Radius | Single actor (affects only the registering user's console) |
| Identity Leak Type | None |
| Cache Trust Type | None |
| RLS Dependency | NONE |
| Recommended mitigation | Remove `console.error` at useRegister.js:146. captureFrontendError() already captures the error for server-side observability. No user-facing value is lost. |
| Rationale | captureFrontendError() fires immediately after and provides the correct observability path. console.error is redundant and violates the project rule. |
| Follow-up command | Wolverine (one-line fix) |
| CISSP Domain — Primary | Security Operations |
| CISSP Domain — Secondary | Software Development Security |

---

**DEBUG LEAKAGE WARNING**

| Field | Value |
|---|---|
| Location | useRegister.js:146 |
| Current behavior | console.error('[Register] Failed to record legal consent:', consentErr) — unconditional, production-visible |
| Leak risk | Internal Supabase error details (table names, constraint names, policy names, error codes) visible in browser DevTools |
| Severity | MEDIUM |
| Recommended mitigation | Remove console.error. captureFrontendError() already handles server-side monitoring. |

---

### VEN-REG-005 — isWandersFlow Client-Controlled Session Mirror (LOW — MITIGATED)

**VENOM SECURITY FINDING**

| Field | Value |
|---|---|
| Finding ID | VEN-REG-005 |
| Severity | LOW (MITIGATED) |
| Location | useRegister.js:59 → Boolean(navState.wandersFlow) → register.controller.js → getWandersSupabase() + maybeMirrorWandersSession() |
| Application Scope | VCSM |
| Platform Surface | PWA |
| Trust Boundary | Unauthenticated → dual-client session boundary |
| Boundary Violated | Client-controlled boolean triggers cross-client session token injection |
| Contract Violated | None — current guard mitigates the risk |
| Current behavior | isWandersFlow is derived from `Boolean(location.state.wandersFlow)` — pure client navigation state, settable by any in-app navigate() call. When true, the Wanders Supabase client is used for registration, and maybeMirrorWandersSession() copies Wanders JWT tokens into the primary Supabase client via auth.setSession(). The only backstop is the userId match guard: if Wanders session userId !== just-registered userId, the mirror throws and aborts. |
| Risk | An attacker who can inject wandersFlow: true into navigation state (e.g., via an in-app link or crafted deep link that navigates through /register with this state) forces Wanders client selection. If the Wanders client has a stale session for a different user, and if the guard is removed or weakened in future, the primary client could be overwritten with a foreign user's tokens. CURRENTLY MITIGATED — guard is source-verified present. |
| Why it matters | Session token injection is catastrophic if it succeeds. The guard protects against it, but the guard lives only in the controller — it can be removed without the triggering condition (client-controlled wandersFlow) being visible. Regression test coverage is the required safety net. |
| Exploitability | LOW — guard prevents actual exploitation; risk materializes only if guard is removed in a future refactor |
| Attack Preconditions | Guard present → currently unexploitable. Without guard: attacker needs an existing Wanders session for a userId matching a newly-registered user — near-impossible in practice since UUIDs are random. |
| Blast Radius | Single actor (session affects only the registering user) |
| Identity Leak Type | None — potential session identity replacement |
| Cache Trust Type | None |
| RLS Dependency | NONE |
| Recommended mitigation | (1) Maintain guard at all costs — mark maybeMirrorWandersSession() userId check as a security invariant. (2) Add regression test: Wanders session userId mismatch must throw and prevent mirror. (3) Consider promoting to a named security contract document. |
| Rationale | The fix is already in place. What's missing is a regression test that locks the guard in place. Without the test, a future refactor could silently remove it. |
| Follow-up command | SPIDER-MAN (regression test for Wanders userId mismatch) |
| CISSP Domain — Primary | Identity and Access Management |
| CISSP Domain — Secondary | Security Architecture and Engineering |

---

### VEN-REG-006 — Password Complexity Enforcement Client-Only

**VENOM SECURITY FINDING**

| Field | Value |
|---|---|
| Finding ID | VEN-REG-006 |
| Severity | LOW |
| Location | registerPasswordRules.model.js (5 rules — client evaluation) + register.controller.js (validateEmail called, no password check) |
| Application Scope | VCSM |
| Platform Surface | PWA |
| Trust Boundary | Client → Supabase auth |
| Boundary Violated | Security policy enforced only in UI — server layer has no confirmed password complexity enforcement |
| Contract Violated | None formal |
| Current behavior | All 5 password rules (min 8, max 72, uppercase, lowercase, number) are evaluated client-side by evaluateRegisterPasswordRules(). The register controller calls validateEmail() but has no password strength validation. The DAL passes password directly to supabase.auth.signUp. Supabase enforces its own minimum (typically 6 characters by default for Supabase projects, unless overridden in auth config) but VCSM's complexity rules are not enforced server-side. |
| Risk | A bypass client (curl, direct Supabase SDK call, or modified browser request) can register with a password of "aaaaaa" (6 chars, no complexity) bypassing the VCSM UI rules. This allows weak passwords for accounts that would otherwise be blocked by the UI. |
| Why it matters | Weak passwords increase account compromise risk. The UI protection is easily bypassed. |
| Exploitability | MEDIUM for bypass (technically easy via direct Supabase SDK call); LOW for impact (attacker would register their OWN account with a weak password — not a privilege escalation) |
| Attack Preconditions | None for the bypass itself — any user can bypass UI validation. |
| Blast Radius | Single actor (affects only the registering user's own account security) |
| Identity Leak Type | None |
| Cache Trust Type | None |
| RLS Dependency | NONE — auth layer |
| Recommended mitigation | (1) Configure Supabase auth to enforce minimum password length ≥ 8 characters (project auth settings). (2) Consider an Edge Function wrapper for signUp that validates password complexity server-side before calling auth. (3) At minimum, verify current Supabase project auth settings enforce the project minimum. |
| Rationale | All security-critical validations must have server-side enforcement as the authoritative layer. UI validation is for UX only. |
| Follow-up command | DB / Supabase config review |
| CISSP Domain — Primary | Software Development Security |
| CISSP Domain — Secondary | Security and Risk Management |

---

### VEN-REG-007 — Monitoring message Field Partial PII Strip

**VENOM SECURITY FINDING**

| Field | Value |
|---|---|
| Finding ID | VEN-REG-007 |
| Severity | LOW |
| Location | monitoringClient.js:43 → payload.message = message.trim().slice(0, 500); stripPii() NOT applied |
| Application Scope | VCSM |
| Platform Surface | Edge Function |
| Trust Boundary | Client → monitoring-ingest-error Edge Function |
| Boundary Violated | Partial PII protection — tags/context stripped but message field unstripped |
| Contract Violated | Asset Security — data minimization |
| Current behavior | monitoringClient.js applies stripPii() to `tags` and `context` objects (removing keys: password, token, email, access_token, refresh_token, session_token, secret, credential, api_key, auth_token). However, `message` is derived from error.message and is NOT passed through stripPii(). In the register flow, error.message could contain Supabase error text that includes email addresses in some failure conditions (e.g., "duplicate key value violates unique constraint" messages may include the email in some Supabase versions). |
| Risk | Email addresses from registration failures could be stored in the monitoring backend. This is a PII retention concern under privacy regulations. |
| Why it matters | Monitoring backends should not store PII. A partial strip that covers objects but not the message field creates an inconsistent privacy boundary. |
| Exploitability | LOW (passive data retention issue — not an active exploit) |
| Attack Preconditions | Supabase error format must include email in error.message (not guaranteed; depends on Supabase version and error type). Registration must fail in a way that triggers monitoring. |
| Blast Radius | Single actor per event — monitoring backend accumulation |
| Identity Leak Type | Private contact exposure (potential email in error text) |
| Cache Trust Type | None |
| RLS Dependency | NONE |
| Recommended mitigation | Apply a targeted scrub to the message field before including it in the payload. Either: (a) strip email-like patterns via regex, or (b) truncate the error message to a generic form when it comes from a Supabase auth error (map to safe known messages via mapLoginError or a similar allow-list approach). |
| Rationale | Consistent PII protection requires stripping all payload fields, not just structured objects. The fix is a small regex or allow-list check on the message field. |
| Follow-up command | ELEKTRA (patch advisory for monitoringClient.js) |
| CISSP Domain — Primary | Asset Security |
| CISSP Domain — Secondary | Security Operations |

---

### VEN-REG-009 — Wanders Token Injection Architecture Note (INFO)

**VENOM SECURITY FINDING**

| Field | Value |
|---|---|
| Finding ID | VEN-REG-009 |
| Severity | INFO |
| Location | register.dal.js:53-65 → dalMirrorWandersSessionToPrimary → supabase.auth.setSession |
| Application Scope | VCSM |
| Platform Surface | PWA — dual Supabase client boundary |
| Trust Boundary | Wanders Supabase client → Primary Supabase client |
| Boundary Violated | None — guard present; note for architectural awareness |
| Contract Violated | None |
| Current behavior | dalMirrorWandersSessionToPrimary copies access_token + refresh_token from the Wanders Supabase client session into the primary Supabase client via auth.setSession(). This replaces the primary client's session state. A subsequent getSession() call is made to warm the session. This pattern is intentional for the Wanders dual-client flow. |
| Risk | INFO — the pattern is a session injection by design. The userId match guard in register.controller.js ensures the injected session belongs to the same user who just registered. The risk is entirely mitigated by the guard. Documented here because: (1) auth.setSession() with external tokens is an unusual pattern, (2) if a future refactor removes the guard, this becomes a HIGH finding. |
| Why it matters | Any code path that calls auth.setSession() with tokens from an external source should be treated as a high-value target during code review. |
| Exploitability | NONE (guard present) |
| Blast Radius | Single actor (current session only) |
| Identity Leak Type | None |
| Cache Trust Type | None |
| RLS Dependency | NONE |
| Recommended mitigation | (1) Add a code comment near dalMirrorWandersSessionToPrimary noting it is a security-sensitive operation requiring the upstream userId match guard. (2) SPIDER-MAN regression test. |
| Rationale | Informational — no action required beyond documentation and regression test. |
| Follow-up command | SPIDER-MAN |
| CISSP Domain — Primary | Identity and Access Management |
| CISSP Domain — Secondary | Security Architecture and Engineering |

---

## MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-REG-001 | navState.from open redirect | Controller / Hook | P1 | App | ELEKTRA, BLACKWIDOW |
| VEN-REG-002 | profiles UPSERT RLS unverified | RLS | P1 | DB | DB |
| VEN-REG-003 | user_consents INSERT RLS unverified | RLS | P1 | DB | DB |
| VEN-REG-004 | console.error production disclosure | Controller / Hook | P2 | App | Wolverine |
| VEN-REG-005 | isWandersFlow client-controlled (mitigated) | Test Coverage | P2 | App | SPIDER-MAN |
| VEN-REG-006 | Password client-only enforcement | Edge Function / Supabase Config | P2 | DB / Security | DB |
| VEN-REG-007 | Monitoring message PII partial strip | Service | P3 | App | ELEKTRA |
| VEN-REG-009 | Wanders token injection note | Documentation / Test Coverage | P3 | App | SPIDER-MAN |

---

## IDENTITY SURFACE WARNING

**VEN-REG-001 — navState.from**

| Field | Value |
|---|---|
| Location | useRegister.js:50-56 → navState.from |
| Current identity surface | location.state.from (string) — unwhitelisted |
| Expected identity surface | isSafeAuthReturnPath()-validated path or null |
| Risk | Unvalidated return path forwarded through to onboarding redirect destination |
| Suggested correction | Apply isSafeAuthReturnPath() before accepting state.from into navState |

---

## ACTOR OWNERSHIP WARNINGS

**None found in this module.** Registration creates a new auth.users row (owned by Supabase) and upserts a profiles row (userId derived from server response). No actor_owners table interaction occurs in the register flow — actor creation happens post-onboarding in createUserActor.controller.js (not in scope of this review).

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VEN-REG-003 (consent record integrity) |
| Asset Security | 1 | VEN-REG-007 (PII in monitoring message) |
| Security Architecture and Engineering | 3 | VEN-REG-002 (profiles RLS), VEN-REG-005 (Wanders mirror), VEN-REG-009 (token injection arch note) |
| Communication and Network Security | 0 | No route/RPC exposure findings; route guard verified correct |
| Identity and Access Management | 3 | VEN-REG-001 (redirect path), VEN-REG-005 (session mirror), VEN-REG-009 (token injection) |
| Security Assessment and Testing | 1 | VEN-REG-005 (regression coverage for Wanders guard) |
| Security Operations | 1 | VEN-REG-004 (console.error production) |
| Software Development Security | 2 | VEN-REG-004 (console.error), VEN-REG-006 (password client-only) |

**Uncovered Domains:**
- Communication and Network Security — no route exposure or RPC concerns found in this flow; AuthPublicRoute guard confirmed correct; all routes are appropriate for their classification.

---

## FINDING SUMMARY

| ID | Severity | Surface | Status | THOR |
|---|---|---|---|---|
| VEN-REG-001 | HIGH | navState.from — no path whitelist | OPEN | CAUTION |
| VEN-REG-002 | MEDIUM | profiles UPSERT RLS unverified | OPEN — DB audit | Not blocked |
| VEN-REG-003 | MEDIUM | user_consents INSERT RLS unverified | OPEN — DB audit | Not blocked |
| VEN-REG-004 | MEDIUM | console.error production | OPEN | Not blocked |
| VEN-REG-005 | LOW (MITIGATED) | isWandersFlow client-controlled | MITIGATED | Not blocked |
| VEN-REG-006 | LOW | Password complexity client-only | OPEN | Not blocked |
| VEN-REG-007 | LOW | Monitoring message partial PII strip | OPEN | Not blocked |
| VEN-REG-009 | INFO | Wanders token injection architecture | INFO | N/A |

**Totals:** 0 CRITICAL | 1 HIGH | 3 MEDIUM | 3 LOW | 1 INFO

---

## VENOM RECOMMENDATION

**CAUTION**

The registration module has sound architecture — session ownership is correctly server-issued, email validation is controller-enforced, and the Wanders session mirror has a working userId guard. No authentication bypass or CRITICAL finding exists.

The primary concern is VEN-REG-001 (navState.from open redirect risk). The fix exists in the codebase (isSafeAuthReturnPath() just isn't called here), making this a high-confidence, low-effort resolution. ELEKTRA must trace whether onboarding also validates this path — if it does, the finding severity degrades to LOW.

The two RLS findings (VEN-REG-002, VEN-REG-003) require DB audit — they may already be resolved at the DB layer.

**THOR Release Blocker:** NO — CAUTION pending ELEKTRA downstream trace on VEN-REG-001 and DB confirmation on VEN-REG-002 + VEN-REG-003.

---

## RECOMMENDED NEXT COMMANDS

| Command | Priority | Scope |
|---|---|---|
| ELEKTRA | P1 | Trace navState.from → onboarding → redirect (VEN-REG-001 end-to-end) |
| DB | P1 | Confirm profiles RLS (VEN-REG-002) + user_consents RLS (VEN-REG-003) |
| BLACKWIDOW | P1 | Adversarial runtime test: navState.from injection (VEN-REG-001) |
| SPIDER-MAN | P2 | Regression test: Wanders userId mismatch must throw (VEN-REG-005) |
| Wolverine | P2 | Remove console.error at useRegister.js:146 (VEN-REG-004) |
