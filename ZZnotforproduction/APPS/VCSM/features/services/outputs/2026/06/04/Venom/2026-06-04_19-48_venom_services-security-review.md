# VENOM V2 Security Review — services

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Review Date | 2026-06-04 |
| Reviewer | VENOM V2 |
| App | Wentrex (scanner tagged as VCSM:services — see §3 Note) |
| Feature | services |
| Source Root | apps/wentrex/src/features/services/ |
| Doc Root | ZZnotforproduction/APPS/VCSM/features/services/ |
| Scanner Data | /tmp/venom_features/services.json |
| Report Path | ZZnotforproduction/APPS/VCSM/features/services/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_services-security-review.md |
| Total Findings | 6 |
| Severity Breakdown | 0 CRITICAL, 3 HIGH, 2 MEDIUM, 1 LOW |
| THOR Release Blocker | YES — VEN-SERVICES-001, VEN-SERVICES-002, VEN-SERVICES-003 |

---

## 2. Scanner Preflight

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                  | Generated At             | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map    | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs

**IMPORTANT APP IDENTITY NOTE:**

The scanner tagged this feature as `appId: "wentrex"` with `root: "apps/wentrex"`. The scanner data was pre-filtered and delivered to the VCSM services feature slot. Source inspection confirms all surfaces live at `apps/wentrex/src/features/services/` — this is Wentrex, not VCSM. No VCSM source directory exists at `apps/VCSM/src/features/services/` (confirmed `NO_SOURCE_DIR`). This review covers the Wentrex `services` feature layer with full source-verified inspection.

**Write Surfaces (5):**
- edge_function: `create-org-member` — `createOrgMember` (createOrgMember.js)
- edge_function: `create-parent` — `createParent` (createParent.js)
- edge_function: `create-student` — `createStudent` (createStudent.js)
- edge_function: `parent-reset-student-password` — `parentResetStudentPassword` (parentResetStudentPassword.js)
- edge_function: `reset-student-password` — `resetStudentPassword` (resetStudentPassword.js)

**RPCs (0):** None

**Edge Functions (6):**
- `create-org-member` (supabase-invoke)
- `create-parent` (supabase-invoke)
- `create-student` (supabase-invoke)
- `parent-reset-student-password` (supabase-invoke)
- `reset-student-password` (supabase-invoke)
- `fetch` → `doUpload` at `uploadToCloudflare.js` (fetch-mutation)

**Security Paths (11):** All LOW confidence — no route-confirmed execution paths in scanner data. Route confirmation was obtained via manual source inspection of App.jsx and caller screens.

---

## 4. Security Surface Inventory

| Surface | Type | File | Auth Layer | Scanner Confidence |
|---|---|---|---|---|
| create-org-member | Edge Function | createOrgMember.js | Controller-gated (canManageOrganization) | HIGH |
| create-parent | Edge Function | createParent.js | Partially controller-gated; also called direct from screen | HIGH |
| create-student | Edge Function | createStudent.js | Screen-level auth check only (no controller gate) | HIGH |
| parent-reset-student-password | Edge Function | parentResetStudentPassword.js | Route-guarded (RequireRole parent); UI link check absent | HIGH |
| reset-student-password | Edge Function | resetStudentPassword.js | Screen-direct call; ResetPasswordModal has no auth check | HIGH |
| fetch (upload) | Cloudflare Worker Fetch | uploadToCloudflare.js | Optional JWT; auth fallback with cross-app global | HIGH |

---

## 5. Scanner Signals

All 11 security paths carry `"confidence": "LOW"` with evidence: "write surface discovered without route-confirmed path; potential surface only". This is expected — the scanner found the invocations but could not resolve route execution paths. Manual inspection was required and performed for all 6 surfaces.

All 6 edge function surfaces carry `"confidence": "HIGH"` — the invocations are confirmed by AST extraction.

The Cloudflare upload surface is detected as `"source": "fetch-mutation"` — a direct fetch POST to `https://upload.vibezcitizens.com` — cross-product infrastructure shared with VCSM.

---

## 6. Behavior Contract Status

**BEHAVIOR.md Status: PLACEHOLDER — NO SECURITY RULES EXTRACTED**

The file at `ZZnotforproduction/APPS/VCSM/features/services/BEHAVIOR.md` contains only:

```
Status: PLACEHOLDER
Feature: services
Notes:
- Behavior contract pending source review.
```

- §5 Security Rules: 0 (MISSING)
- §9 Must Never Happen invariants: 0 (MISSING)

**Finding: MISSING_BEHAVIOR_CONTRACT** — The behavior contract for the services feature has not been written. All security rule verification was performed against source code only. This is itself a governance gap.

Cross-check result: N/A — no BEH IDs to verify. Source-derived security expectations are documented in the findings below.

---

## 7. Trust Boundary Findings

---

### VEN-SERVICES-001

```
VENOM SECURITY FINDING
- Finding ID: VEN-SERVICES-001
- Location: apps/wentrex/src/learning/administration/components/ResetPasswordModal.jsx:43
           apps/wentrex/src/features/services/supabase/resetStudentPassword.js:29
- Application Scope: Wentrex
- Platform Surface: Supabase Edge Function (reset-student-password)
- Trust Boundary: Authenticated admin/teacher UI — admin-only route guard via RequireRole allow="admin"
- Boundary Violated: resetStudentPassword is called directly from a UI component with no controller-layer authorization check. The modal receives actorId as a prop and fires the edge function with only client-side password length validation. Any caller with the modal mounted can reset any student password by passing an arbitrary actorId.
- Contract Violated: Wentrex CLAUDE.md: "Every database query must be scoped to a Realm." The edge function call carries no realmId or organization ownership verification at the services layer.
- Current behavior: ResetPasswordModal receives actorId as a prop and calls resetStudentPassword({actorId, newPassword, requirePasswordChange}) directly without verifying the caller is authorized to manage that specific student or that the student belongs to the caller's organization.
- Risk: A malicious admin from Organization A could reset the Supabase Auth password for a student belonging to Organization B by passing a cross-org actorId to the modal. Authorization is left entirely to the edge function server-side.
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions: Authenticated admin or teacher session. Ability to supply a target actorId (obtainable from URLs, network responses, or enumeration).
- Blast Radius: Any student account across any organization — password takeover of targeted student auth credential.
- Identity Leak Type: Cross-org actor targeting
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — edge function enforces server-side; client performs no org-membership check
- Why it matters: Password reset for a student's Supabase Auth account is a high-privilege operation that grants direct login access. Without ownership verification in the client layer, the edge function is the only guard. If the edge function has an org-scoping gap, this chain has no defense in depth.
- Recommended mitigation: Add a controller function wrapping resetStudentPassword that (1) resolves the student's organization_id from actorId, (2) verifies the caller's actorId has an active admin membership in the same organization, and (3) verifies both belong to the same realmId before invoking the edge function.
- Rationale: Defense in depth — the services layer should never accept arbitrary actorId without caller-org verification. Edge functions are the last line of defense, not the only line.
- Follow-up command: ELEKTRA (trace reset-student-password edge function for server-side org guard), DB (confirm RLS on learning.actors and actor_identities for cross-org isolation)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Identity and Access Management, Software Development Security
```

---

### VEN-SERVICES-002

```
VENOM SECURITY FINDING
- Finding ID: VEN-SERVICES-002
- Location: apps/wentrex/src/learning/parent/screens/ParentStudentScreen.jsx:309
           apps/wentrex/src/learning/components/SchoolAccountCard.jsx:44
           apps/wentrex/src/features/services/supabase/parentResetStudentPassword.js:18
- Application Scope: Wentrex
- Platform Surface: Supabase Edge Function (parent-reset-student-password)
- Trust Boundary: Authenticated parent — route guard RequireRole allow="parent"
- Boundary Violated: canParentReset={true} is hardcoded unconditionally in ParentStudentScreen (line 309). The screen fetches parentLink (the parent_student_links row) but NEVER conditions the reset button on parentLink being non-null. A parent who navigates to /parent/student/:studentActorId for a student they are NOT linked to can still trigger the password reset edge function.
- Contract Violated: Parent access must be scoped to linked students only. The parentLink check exists in the data fetch but is not used to gate the reset capability.
- Current behavior: ParentStudentScreen renders SchoolAccountCard with canParentReset={true} regardless of whether parentLink resolved to a real parent_student_links row. SchoolAccountCard then renders the reset button whenever canParentReset && actorId.
- Risk: A parent can reset the password of any student (generating a temporary password) if they can reach the /parent/student/:studentActorId route with any valid studentActorId — including unlinked students. The route is authenticated but not link-verified at the UI layer.
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions: Authenticated parent session. Knowledge of a target studentActorId (exposed in route path — raw UUID in URL, also noted by platform no-raw-IDs-in-URLs rule).
- Blast Radius: Any student whose actorId is known — unauthorized password reset generating a temporary credential visible in-browser.
- Identity Leak Type: Unlinked parent-to-student targeting; temporary password exposed in clear text in UI (SchoolAccountCard line 83: "Temporary Password: {resetResult.temporaryPassword}")
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — edge function is sole server-side guard
- Why it matters: A parent can gain unauthorized access to another student's account by triggering a password reset and capturing the temporary password displayed on screen. This is a student account takeover vector for parents with a valid session.
- Recommended mitigation: (1) Gate canParentReset on parentLink !== null — change line 309 to canParentReset={!!parentLink}. (2) Add server-side enforcement in the parent-reset-student-password edge function to verify parent_student_links row exists before resetting. (3) Avoid displaying temporary passwords in clear text; deliver via secure channel (email to parent on file) instead.
- Rationale: The parentLink data is already fetched — using it to gate the reset is a one-line fix that closes the UI gap. Server-side enforcement is required for defense in depth.
- Follow-up command: ELEKTRA (trace parent-reset-student-password edge function for link verification), SPIDER-MAN (regression test: unlinked parent cannot reset student password)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Identity and Access Management, Software Development Security
```

---

### VEN-SERVICES-003

```
VENOM SECURITY FINDING
- Finding ID: VEN-SERVICES-003
- Location: apps/wentrex/src/learning/components/SchoolAccountCard.jsx:50,83
           apps/wentrex/src/features/services/supabase/parentResetStudentPassword.js:18
- Application Scope: Wentrex
- Platform Surface: PWA UI — SchoolAccountCard component
- Trust Boundary: Parent-visible UI screen (ParentStudentScreen)
- Boundary Violated: The edge function response includes res.data.temporaryPassword which is rendered in clear text in the browser DOM (SchoolAccountCard line 83). A temporary auth credential is exposed in plain HTML with no masking, no one-time display enforcement beyond "dismiss" button, and no secure delivery alternative.
- Contract Violated: Credentials must never be persisted or exposed beyond the minimum necessary surface. Displaying a raw temporary password in the DOM is equivalent to logging it to screen.
- Current behavior: After a successful parent-triggered password reset, SchoolAccountCard displays: "Temporary Password: [value]" in a styled card that persists until the parent clicks "Dismiss". The value is in the React state and DOM.
- Risk: (1) Screen capture / shoulder surfing exposes student credential. (2) Browser history/inspect tools can recover the value. (3) If the edge function response is cached or logged, the temporary password is leaked outside the trust boundary. (4) Any browser extension with DOM access can extract it.
- Severity: HIGH
- Exploitability: LOW (requires physical or session-level access)
- Attack Preconditions: Physical access to parent device, malicious browser extension, or network-level response interception.
- Blast Radius: Student auth credential exposed — allows immediate login as the student.
- Identity Leak Type: Plaintext credential in UI response
- Cache Trust Type: Response content trusted as-received; no masking
- RLS Dependency: NONE
- Why it matters: Displaying temporary passwords in the browser UI is a well-known credential exposure anti-pattern. The student has no visibility into this reset — the parent receives the credential and the student's account is immediately compromised if the parent acts on it or the credential leaks.
- Recommended mitigation: Remove temporaryPassword from the edge function response entirely. Instead, email the temporary password to the parent email on file (server-side delivery only). If in-UI display is required, mask the value by default with a reveal-once toggle, and add a clear "this password will not be shown again after you close this window" warning with auto-clear on modal close.
- Rationale: Credentials must not persist in the DOM or React state beyond the minimum required moment. Server-side delivery via email is the standard pattern for temporary passwords.
- Follow-up command: ELEKTRA (confirm edge function does not log temporaryPassword in server-side logs), SPIDER-MAN (add test: no plaintext password in DOM after reset flow)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Cryptography (credential handling)
  - Secondary: Access Control, Software Development Security
```

---

### VEN-SERVICES-004

```
VENOM SECURITY FINDING
- Finding ID: VEN-SERVICES-004
- Location: apps/wentrex/src/features/services/cloudflare/uploadToCloudflare.js:22-24
- Application Scope: Wentrex
- Platform Surface: Cloudflare Worker (upload.vibezcitizens.com) — cross-product infrastructure
- Trust Boundary: Authenticated Wentrex user session
- Boundary Violated: getUploadAuthHeaders() attempts to read a session token from globalThis.__WANDERS_SB__ (line 22-24) — a VCSM-specific global Supabase client injected by VCSM's Wanders module. This is a cross-product trust contamination: Wentrex's upload service may authenticate to the Cloudflare Worker using a VCSM session token that belongs to a different product's auth context.
- Contract Violated: CLAUDE.md Isolation Rule: "Never import from one product app into another." The __WANDERS_SB__ global is a VCSM artifact; accessing it from Wentrex services creates an implicit cross-product dependency in the runtime trust chain.
- Current behavior: If globalThis.__WANDERS_SB__ is present (e.g., when Wentrex is embedded or co-loaded with VCSM), uploads from Wentrex will be authenticated with a VCSM Bearer token. The Worker at upload.vibezcitizens.com receives a token from the wrong product's auth context.
- Risk: (1) A VCSM token used in Wentrex upload context could be accepted by the Worker, creating unauthorized cross-product upload privileges. (2) If VCSM and Wentrex share the Worker but have different authorization models, a VCSM session could upload files to Wentrex storage paths (or vice versa). (3) The fallback silently proceeds unauthenticated if neither token resolves (line 28-31).
- Severity: MEDIUM
- Exploitability: LOW (requires co-loading or shared runtime context)
- Attack Preconditions: VCSM and Wentrex running in the same browser context (or shared Worker). A valid VCSM session present in globalThis.
- Blast Radius: Cross-product upload authorization contamination; potential unauthorized file writes to Wentrex R2 storage paths using a VCSM identity.
- Identity Leak Type: Cross-product session token reuse
- Cache Trust Type: globalThis global state trusted without product-context verification
- RLS Dependency: NONE (Cloudflare Worker — no Supabase RLS)
- Why it matters: The isolation contract prohibits cross-product dependencies. A VCSM auth token should never authenticate a Wentrex storage operation, and the Worker at upload.vibezcitizens.com cannot distinguish which product's session is presented.
- Recommended mitigation: Remove the __WANDERS_SB__ fallback from getUploadAuthHeaders() entirely. Wentrex uploads must authenticate exclusively using the Wentrex Supabase client session (@/services/supabase/supabaseClient). If the Wentrex session is absent, fail explicitly rather than falling back to a cross-product token.
- Rationale: Cross-product session reuse violates the product isolation contract and creates an unpredictable trust surface. Silent fallback to unauthenticated should also be removed — uploads should fail loudly if auth is absent.
- Follow-up command: ELEKTRA (audit Cloudflare Worker upload.vibezcitizens.com for cross-product token validation), ARCHITECT (confirm whether Wentrex and VCSM share this Worker and R2 bucket)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security, Identity and Access Management
```

---

### VEN-SERVICES-005

```
VENOM SECURITY FINDING
- Finding ID: VEN-SERVICES-005
- Location: apps/wentrex/src/features/services/supabase/createStudent.js:9-17
           apps/wentrex/src/learning/administration/screens/RegisterStudentScreen.jsx:100-120
           apps/wentrex/src/learning/administration/components/RegisterStudentModal.jsx:82,170
- Application Scope: Wentrex
- Platform Surface: Supabase Edge Function (create-student)
- Trust Boundary: Admin-gated routes (RequireRole allow="admin" in App.jsx line 159) and RegisterStudentModal (used in admin context)
- Boundary Violated: createStudent() in the services layer performs NO authorization check — it accepts organizationId as a plain string parameter with no verification that the caller's session is authorized for that organization or realm. RegisterStudentScreen does an inline auth check (auth.getUser + organization_memberships lookup) but RegisterStudentModal.jsx performs NO auth or org membership check before calling createStudent.
- Contract Violated: Wentrex CLAUDE.md: "Every database query must be scoped to a Realm." The createStudent service call carries organizationId with no realmId scope verification at the services layer.
- Current behavior: RegisterStudentModal receives organizationId as a prop and passes it directly to createStudent() with no verification that the current user's actor has admin membership in that organization. Any caller that mounts RegisterStudentModal with an arbitrary organizationId can create a student in that org.
- Risk: An admin in Organization A who is passed Organization B's id (via prop injection, URL manipulation, or mount-time attack) can register students into Organization B's roster without authorization. The router guards protect the screen routes but RegisterStudentModal is a component — not a route — and has no auth gate of its own.
- Severity: MEDIUM
- Exploitability: LOW (requires admin auth and ability to supply arbitrary organizationId prop)
- Attack Preconditions: Valid admin session. Ability to supply a target organizationId to RegisterStudentModal (e.g., via developer tools or if the modal is ever mounted outside the admin-guarded route).
- Blast Radius: Cross-org student creation; foreign organization roster pollution; potential access to courses and resources in the target organization.
- Identity Leak Type: Cross-org actor injection
- Cache Trust Type: None
- RLS Dependency: ASSUMED — edge function expected to verify org membership; client layer does not verify
- Why it matters: Without org membership verification in the modal or services layer, the edge function is the only gate. If the edge function trusts the organizationId parameter without verifying caller membership, cross-org student creation is possible.
- Recommended mitigation: RegisterStudentModal should accept and verify the caller's actorId against organization_memberships before invoking createStudent. Alternatively, route all student creation through createOrganizationMemberController pattern (which does check canManageOrganization). The services layer should not accept organizationId from an untrusted prop chain.
- Rationale: Consistency with the createOrgMember path, which uses a dedicated controller with ownership verification. createStudent bypasses this pattern.
- Follow-up command: ELEKTRA (trace create-student edge function for org membership enforcement), DB (confirm RLS on learning.actors for org-scoped creation)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

### VEN-SERVICES-006

```
VENOM SECURITY FINDING
- Finding ID: VEN-SERVICES-006
- Location: apps/wentrex/src/features/services/supabase/supabaseClient.js:26-36, 68-69
           apps/wentrex/src/features/services/supabase/supabaseClient.debug.js:42-126
- Application Scope: Wentrex
- Platform Surface: PWA — Supabase client initialization
- Trust Boundary: Browser runtime
- Boundary Violated: Two debug-mode trust gaps: (1) shouldUseDebugClient() activates the debug Supabase client when localStorage key 'learning:debug:supabase' === '1'. This flag is user-settable in any browser — any user (including students and parents) can activate the debug client by setting this localStorage key, causing all Supabase requests to be logged to the browser console in full detail including request bodies and response data. (2) The debug client (supabaseClient.debug.js line 123-125) sets window.__sbDebug on DEV builds, but the debug client itself can be activated in production via the localStorage flag.
- Contract Violated: Debug logging rules (MEMORY): "No console.log; debug output must render on screen and be dev-only (never production)." The localStorage-flag path allows production debug activation by any authenticated user.
- Current behavior: Any authenticated user in any role can open browser DevTools, run localStorage.setItem('learning:debug:supabase', '1'), and refresh. All subsequent Supabase calls (including queries containing student PII, passwords in bodies, and auth tokens before REDACT) will be logged to the browser console in collapsible groups.
- Risk: (1) Students, parents, or teachers can activate verbose logging of their own and (potentially) cross-user data if queries are not fully isolated. (2) The REDACT function (line 13) only redacts Authorization headers — request bodies containing newPassword (from resetStudentPassword) are not redacted. (3) A malicious user could use this to capture edge function request/response bodies containing student credentials.
- Severity: LOW
- Exploitability: LOW (self-targeted primarily; requires browser access)
- Attack Preconditions: Any authenticated session. Browser DevTools access.
- Blast Radius: Request body logging including edge function payloads; auth token exposure in console before REDACT processes headers; potential PII in response bodies logged to console.
- Identity Leak Type: PII and credential exposure via debug console
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The production-activatable debug client violates the debug logging rules and creates a self-service data exposure surface. While primarily self-targeted, it also reduces the security posture of the platform by making sensitive data visible in browser tooling for any user who knows the flag.
- Recommended mitigation: (1) Remove the localStorage flag path from shouldUseDebugClient(). Debug client must only activate when VITE_DEBUG_SUPABASE === '1' (build-time env var, never in production builds). (2) Add body redaction for sensitive fields (newPassword, password, actorId) in the debug fetch wrapper. (3) Gate window.__sbDebug on DEV build flag AND an explicit per-session consent mechanism.
- Rationale: Debug surfaces that can be activated in production by any user are a persistent low-level information disclosure risk that compounds other findings.
- Follow-up command: SPIDER-MAN (add test: localStorage flag does not activate debug client in production build), DEADPOOL (root cause: why was localStorage activation left in production code path)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Access Control, Security Operations
```

---

## 8. Source Verification Summary

| Surface | Files Read | Callers Traced | Auth Verified | Verdict |
|---|---|---|---|---|
| create-org-member | createOrgMember.js, createOrganizationMember.controller.js | createOrganizationMemberController | YES — canManageOrganization + realmId check | VERIFIED_SAFE (controller path only) |
| create-parent | createParent.js, createParentMember.controller.js, EnrollParentModal.jsx | createParentMemberController, EnrollParentModal | PARTIAL — controller path is safe; EnrollParentModal direct call has no controller gate | FINDING → VEN-SERVICES-005 (note: createParent missing courseId in signature vs controller usage) |
| create-student | createStudent.js, RegisterStudentScreen.jsx, RegisterStudentModal.jsx | RegisterStudentScreen (screen-level auth), RegisterStudentModal (no auth) | PARTIAL — screen has inline auth; modal has none | FINDING → VEN-SERVICES-005 |
| parent-reset-student-password | parentResetStudentPassword.js, SchoolAccountCard.jsx, ParentStudentScreen.jsx | SchoolAccountCard via ParentStudentScreen | PARTIAL — route guard present; parentLink not gating canParentReset | FINDING → VEN-SERVICES-002, VEN-SERVICES-003 |
| reset-student-password | resetStudentPassword.js, ResetPasswordModal.jsx | ResetPasswordModal | PARTIAL — route guard present; no org-membership check in modal | FINDING → VEN-SERVICES-001 |
| fetch (upload) | uploadToCloudflare.js, StudentAssignmentScreen.jsx, CreateAssignmentScreen.jsx | Multiple callers | PARTIAL — JWT optional; cross-product global fallback | FINDING → VEN-SERVICES-004 |
| supabaseClient.js | supabaseClient.js, supabaseClient.debug.js | All service calls | Production-activatable debug mode via localStorage | FINDING → VEN-SERVICES-006 |

**BEHAVIOR.md:** PLACEHOLDER — no §5 or §9 contract exists to cross-check.

**Additional observation — createParent signature gap:** `createParentMemberController` passes `courseId` to `createParent()` (controller line 64), but `createParent()` in services does not accept a `courseId` parameter (signature at createParent.js:17). The courseId is silently dropped at the services layer. This is a data integrity issue — not a security finding in isolation, but means course-scoped parent enrollment may not enforce the course ownership check the controller intends.

---

## 9. Confidence Summary

| Finding | Provenance | Confidence | Evidence |
|---|---|---|---|
| VEN-SERVICES-001 | SOURCE_VERIFIED | HIGH | ResetPasswordModal.jsx:43 — direct call without org check |
| VEN-SERVICES-002 | SOURCE_VERIFIED | HIGH | ParentStudentScreen.jsx:309 — hardcoded canParentReset={true} |
| VEN-SERVICES-003 | SOURCE_VERIFIED | HIGH | SchoolAccountCard.jsx:83 — temporaryPassword rendered in DOM |
| VEN-SERVICES-004 | SOURCE_VERIFIED | HIGH | uploadToCloudflare.js:22-24 — __WANDERS_SB__ cross-product global |
| VEN-SERVICES-005 | SOURCE_VERIFIED | MEDIUM | RegisterStudentModal.jsx:170 — no auth check before createStudent |
| VEN-SERVICES-006 | SOURCE_VERIFIED | MEDIUM | supabaseClient.js:27-30 — localStorage activates debug in production |

---

## 10. THOR Impact

| Finding | Severity | THOR Release Blocker | Reason |
|---|---|---|---|
| VEN-SERVICES-001 | HIGH | YES | Password reset of arbitrary student without org-ownership check — privilege escalation vector |
| VEN-SERVICES-002 | HIGH | YES | Unlinked parent can reset any student password — account takeover vector |
| VEN-SERVICES-003 | HIGH | YES | Temporary auth credential rendered in clear text in browser DOM — credential exposure |
| VEN-SERVICES-004 | MEDIUM | NO | Cross-product token fallback requires co-loading context — low immediate exploitability |
| VEN-SERVICES-005 | MEDIUM | NO | Cross-org student creation requires admin session and prop injection — limited exploitability with route guards |
| VEN-SERVICES-006 | LOW | NO | Production debug activation — information disclosure, not data mutation |

**THOR GATE: BLOCKED** — Three HIGH findings (VEN-SERVICES-001, VEN-SERVICES-002, VEN-SERVICES-003) must be resolved before release.

---

## 11. Required Follow-Up Commands

| Command | Scope | Reason |
|---|---|---|
| ELEKTRA | reset-student-password edge function | Verify server-side org-membership check; confirm actorId is validated against caller's organization |
| ELEKTRA | parent-reset-student-password edge function | Verify parent_student_links verification server-side; confirm temporaryPassword is not logged |
| ELEKTRA | create-student edge function | Verify org membership enforcement before student creation |
| ELEKTRA | upload.vibezcitizens.com Worker | Confirm cross-product token validation and R2 key scoping |
| DB | learning.actors, actor_identities, parent_student_links | Confirm RLS policies enforce org/realm scoping for password-sensitive operations |
| SPIDER-MAN | ParentStudentScreen, SchoolAccountCard | Regression: unlinked parent cannot trigger password reset; reset button gated on parentLink |
| SPIDER-MAN | RegisterStudentModal | Regression: modal cannot create students in unauthorized organizations |
| SPIDER-MAN | supabaseClient.js | Regression: localStorage flag does not activate debug client in production build |
| DEADPOOL | supabaseClient.js localStorage path | Root cause: why was production-activatable debug left in shipping code |
| ARCHITECT | Cloudflare Worker + R2 bucket | Confirm whether VCSM and Wentrex share upload.vibezcitizens.com and cdn.vibezcitizens.com |

---

## 12. Mitigation Plan

| Finding ID | Severity | Owner Layer | Fix | Effort | Priority |
|---|---|---|---|---|---|
| VEN-SERVICES-001 | HIGH | Controller + Edge Function | Add controller wrapper for ResetPasswordModal that verifies caller org membership against student's org before invoking edge function. Verify edge function has server-side guard. | M | P0 |
| VEN-SERVICES-002 | HIGH | Screen (ParentStudentScreen) + Edge Function | Change line 309 canParentReset={true} to canParentReset={!!parentLink}. Add server-side link verification in parent-reset-student-password edge function. | S | P0 |
| VEN-SERVICES-003 | HIGH | SchoolAccountCard + Edge Function | Remove temporaryPassword from edge function response; deliver via email to parent on file. If UI display required, mask value with reveal-once toggle and auto-clear on dismiss. | M | P0 |
| VEN-SERVICES-004 | MEDIUM | uploadToCloudflare.js | Remove __WANDERS_SB__ fallback from getUploadAuthHeaders(). Fail explicitly if Wentrex session absent. | S | P1 |
| VEN-SERVICES-005 | MEDIUM | RegisterStudentModal + createStudent service | Add caller org-membership check in RegisterStudentModal before invoking createStudent. Align with createOrganizationMemberController pattern. | M | P1 |
| VEN-SERVICES-006 | LOW | supabaseClient.js | Remove localStorage activation path from shouldUseDebugClient(). Debug client activates only via build-time VITE_DEBUG_SUPABASE env var. | S | P2 |

Effort key: S = Small (< 1 hour), M = Medium (half day)

---

## 13. CISSP Domain Coverage Summary

| CISSP Domain | Findings Covered | Notes |
|---|---|---|
| Access Control | VEN-SERVICES-001, VEN-SERVICES-002, VEN-SERVICES-004, VEN-SERVICES-005 | Missing ownership checks, unlinked parent reset, cross-product token, cross-org creation |
| Identity and Access Management | VEN-SERVICES-001, VEN-SERVICES-002, VEN-SERVICES-004 | Actor targeting, parent-student link enforcement, cross-product identity |
| Software Development Security | VEN-SERVICES-001, VEN-SERVICES-002, VEN-SERVICES-004, VEN-SERVICES-005, VEN-SERVICES-006 | Missing controller gates, debug in production, cross-product global |
| Cryptography | VEN-SERVICES-003 | Plaintext temporary credential in DOM |
| Security Operations | VEN-SERVICES-006 | Production-activatable debug logging |
| Security Architecture | VEN-SERVICES-004, VEN-SERVICES-005 | Cross-product isolation violation, bypass of controller pattern |

**Domains NOT covered by these findings:**
- Physical and Environmental Security
- Communications and Network Security (no network-layer findings)
- Asset Security
- Security and Risk Management
