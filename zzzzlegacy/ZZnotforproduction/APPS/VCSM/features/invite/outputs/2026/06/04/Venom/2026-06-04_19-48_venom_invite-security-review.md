---
name: vcsm.invite.venom-security-review
description: VENOM V2 full security review for VCSM:invite
metadata:
  type: security
  owner: VENOM
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# VENOM V2 SECURITY REVIEW — invite

**Feature:** invite
**Application Scope:** VCSM
**Date:** 2026-06-04
**Reviewer:** VENOM (automated + source-verified)
**Report Version:** V2

---

## 1. OUTPUT METADATA

| Field | Value |
|---|---|
| Feature | invite |
| App | VCSM |
| Review Date | 2026-06-04 |
| Scanner Version | 1.1.0 |
| VENOM Version | V2 |
| Findings Count | 5 |
| CRITICAL | 0 |
| HIGH | 2 |
| MEDIUM | 2 |
| LOW | 1 |
| THOR Release Blocker | YES — VEN-INVITE-001 |
| Behavior Contract | MISSING (PLACEHOLDER stub) |
| Source Verified | YES — all key files read |

---

## 2. SCANNER PREFLIGHT

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

## 3. SCANNER INPUTS

| Surface | Count | Details |
|---|---|---|
| Write Surfaces | 1 | `sendCitizenInviteDAL` → Edge Function `send-citizen-invite` |
| RPCs | 0 | None |
| Edge Functions | 1 | `send-citizen-invite` (HIGH confidence, AST-verified) |
| Security Paths | 2 | Both LOW confidence — route not confirmed by scanner |
| Write Execution Paths | 1 | DAL confirmed, route execution path unresolved by scanner |
| RPC Execution Paths | 0 | None |

Scanner notes: The scanner reported route=null for both security paths, confidence LOW, with evidence "write surface discovered without route-confirmed path." Source inspection confirmed the route IS protected (`/invite` inside `ProtectedRoute` → `ProfileGatedOutlet` shell). This is a scanner gap, not a live vulnerability.

---

## 4. SECURITY SURFACE INVENTORY

| Surface | Type | File | Auth Required | Server-Side Enforcement | Notes |
|---|---|---|---|---|---|
| `send-citizen-invite` Edge Function | Supabase Edge Function (POST) | `apps/VCSM/supabase/functions/send-citizen-invite/index.ts` | YES — JWT Bearer verified server-side via `userClient.auth.getUser()` | YES — user resolved from token, inviterActorId ownership verified via `actor_owners` | Only surface; no direct DB writes from client |
| `/invite` route | PWA Route | `apps/VCSM/src/app/routes/protected/app.routes.jsx:152` | YES — inside `ProtectedRoute` guard | N/A (UI layer) | Also behind `ProfileGatedOutlet`; email-verification check in `ProtectedRoute` |
| `rawDebugError` hook state | PWA runtime state | `apps/VCSM/src/features/invite/hooks/useInvite.js:65` | N/A | N/A | Exported from hook unconditionally; gated in view by `import.meta.env.DEV` |
| `invite_code` in API response | Edge Function response | `apps/VCSM/supabase/functions/send-citizen-invite/index.ts:493` | Authenticated callers only | N/A | Returns `invite_id` + `invite_code` to authenticated client; code already delivered to recipient email |
| `adminClient.auth.admin.listUsers()` | Supabase Admin API | `apps/VCSM/supabase/functions/send-citizen-invite/index.ts:269` | Service-role only (server-side) | YES — runs server-side in Edge Function | Fetches ALL platform users with no pagination; O(n) scan |

---

## 5. SCANNER SIGNALS

| Signal | Scanner Confidence | VENOM Resolution |
|---|---|---|
| Write surface: `send-citizen-invite` edge function | HIGH | CONFIRMED via source — `supabase.functions.invoke()` in `invite.dal.js:13` |
| Route execution path for `/invite` | LOW (route=null) | SOURCE-RESOLVED — `app.routes.jsx:152` confirms route inside `ProtectedRoute` → `ProfileGatedOutlet` |
| No RPCs | N/A | CONFIRMED — zero RPC calls in this feature |
| No direct table writes | N/A | CONFIRMED — all DB writes performed server-side in Edge Function |

---

## 6. BEHAVIOR CONTRACT STATUS

| Field | Status |
|---|---|
| BEHAVIOR.md present | YES |
| BEHAVIOR.md status | PLACEHOLDER — stub only, no security rules authored |
| §5 Security Rules | NONE — contract not written |
| §9 Must Never Happen | NONE — contract not written |
| BEH IDs found | 0 |
| Contract cross-check | CANNOT PERFORM — placeholder contract |

**MISSING_BEHAVIOR_CONTRACT** — The BEHAVIOR.md for the invite feature is a placeholder stub. No formal security rules or invariants have been authored. This is a governance gap that prevents formal contract cross-check.

Finding: MISSING_BEHAVIOR_CONTRACT is recorded as a HIGH severity governance finding (VEN-INVITE-005).

---

## 7. TRUST BOUNDARY FINDINGS

---

### VEN-INVITE-001

```
VENOM SECURITY FINDING
- Finding ID: VEN-INVITE-001
- Location: apps/VCSM/supabase/functions/send-citizen-invite/index.ts:269
- Application Scope: VCSM
- Platform Surface: Supabase Edge Function (admin API call)
- Trust Boundary: Authenticated VCSM user → Edge Function → Supabase Admin API
- Boundary Violated: Admin API performs full-user-list O(n) scan on every invite attempt
- Contract Violated: Performance + security isolation — admin key operations must not be unbounded
- Current behavior: On every POST to send-citizen-invite, the function calls
  `adminClient.auth.admin.listUsers()` with no filter, no page size, and no
  cursor. This fetches the entire platform user table server-side to check
  whether the target email already exists. As the user base grows, this call
  returns an increasingly large dataset per request.
- Risk: (1) DoS amplification — an authenticated attacker making rapid invite
  requests forces repeated full-table admin API scans, degrading response time
  for all users. (2) Memory exhaustion in the Edge Function runtime if the
  user list grows very large. (3) The `existingUsers.users` array is iterated
  with `.some()` in memory — this can OOM or time out with tens of thousands
  of users.
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions: Valid authenticated session (any registered user); ability
  to POST rapidly to the endpoint. No per-user rate limit is enforced by the
  Edge Function or any observed Supabase config.
- Blast Radius: Edge Function timeout/OOM affects ALL concurrent invite senders;
  service degradation of the entire invite surface.
- Identity Leak Type: None — user list is only compared server-side, not returned
- Cache Trust Type: None
- RLS Dependency: NONE — admin client bypasses RLS; call is intentional but unbounded
- Why it matters: At platform scale (10k+ users), this creates a predictable DoS
  vector against an authenticated endpoint with no rate limiting. It also forces
  a privileged admin API call for every single invite, unnecessarily widening
  the blast radius of the service-role key usage.
- Recommended mitigation: Replace `auth.admin.listUsers()` with a targeted lookup:
  use `adminClient.auth.admin.getUserByEmail(normalizedEmail)` which accepts a
  single email and returns only that user (or null). This collapses the O(n)
  scan to O(1) per request. If that method is not available in the Supabase
  SDK version in use, alternatively query the `auth.users` table via the
  admin client with `.eq("email", normalizedEmail).maybeSingle()`.
- Rationale: Eliminating the full-list scan removes both the DoS amplification
  vector and the performance cliff at scale.
- Follow-up command: DB (verify auth.admin.getUserByEmail availability in this
  SDK version and confirm no existing unique index on auth.users.email that
  could be queried directly), SPIDER-MAN (add regression test for duplicate
  invite detection)
- Provenance: SOURCE_VERIFIED — apps/VCSM/supabase/functions/send-citizen-invite/index.ts line 269
- CISSP Domain:
  - Primary: Software Development Security (unbounded admin API usage)
  - Secondary: Information Security Governance (denial-of-service hardening)
```

---

### VEN-INVITE-002

```
VENOM SECURITY FINDING
- Finding ID: VEN-INVITE-002
- Location: apps/VCSM/supabase/functions/send-citizen-invite/index.ts:401-493
- Application Scope: VCSM
- Platform Surface: Supabase Edge Function — response payload
- Trust Boundary: Edge Function → authenticated PWA client
- Boundary Violated: Invite code returned to the sender's client after dispatch
- Contract Violated: Principle of least privilege — the invite code has no use case
  for the sender; it is a one-time activation token intended for the recipient
- Current behavior: On successful invite, the Edge Function returns:
  `{ ok: true, invite_id: <uuid>, invite_code: <uuid> }` to the calling client
  (line 490-494). The `invite_code` is the same UUID embedded in the invite
  link sent to the recipient email. It is a one-time activation credential.
- Risk: The sender's client receives the invite code. If the session is XSS-
  compromised, or if the response is logged or cached by a proxy, the invite
  code is accessible to attackers. A stolen invite code could allow an
  attacker to claim the invite and register as if they were the intended
  recipient, or to probe whether an email address was invited.
- Severity: HIGH
- Exploitability: LOW (requires XSS or active interception of an authenticated
  session; the code is not usable to access existing accounts)
- Attack Preconditions: XSS compromise of the sender's session, OR a man-in-the-
  middle on the HTTPS connection (unlikely but principle applies). The invite code
  has a 30-day expiry (line 403).
- Blast Radius: Single invite per exploitation; attacker can register using the
  stolen code before the intended recipient, preempting their join.
- Identity Leak Type: One-time credential token exposure
- Cache Trust Type: None — response is not cached by the app but may be logged
- RLS Dependency: NONE
- Why it matters: Invite codes are one-time credentials. Returning them to the
  sender's JavaScript runtime creates unnecessary exposure. The client only needs
  `{ ok: true }` or `{ ok: false, code: ... }` to update the UI.
- Recommended mitigation: Remove `invite_code` from the Edge Function success
  response. Return only `{ ok: true, invite_id: <uuid> }` (or `{ ok: true }`
  if `invite_id` is also not needed by the client). The invite code should
  travel only in the recipient email, never to the sender's client.
- Rationale: The sender has no legitimate use for the raw invite code. Omitting
  it closes the accidental credential exposure window without any functional
  regression.
- Follow-up command: ELEKTRA (verify the invite_code is not consumed, stored, or
  displayed anywhere in the PWA client after this change)
- Provenance: SOURCE_VERIFIED — index.ts lines 490-494 and useInvite.js line 36
  (result JSON.stringify'd into rawDebugError in DEV)
- CISSP Domain:
  - Primary: Information Security (credential minimization in API responses)
  - Secondary: Software Development Security (data exposure)
```

---

### VEN-INVITE-003

```
VENOM SECURITY FINDING
- Finding ID: VEN-INVITE-003
- Location: apps/VCSM/src/features/invite/hooks/useInvite.js:12, 36, 39, 46, 65
- Application Scope: VCSM
- Platform Surface: PWA runtime — hook state and component export
- Trust Boundary: Internal hook state → view layer → bundle
- Boundary Violated: Debug probe state exported unconditionally from public hook API
- Contract Violated: VCSM debug logging rules — debug output must be dev-only and
  never surface in production; no raw API responses in persistent state
- Current behavior: `useInvite()` declares and exports `rawDebugError` as a named
  return field (line 65: `rawDebugError, // DEV PROBE — remove after CORS confirmed`).
  The state is populated with `JSON.stringify(result, null, 2)` on both success
  and failure paths (lines 36, 39, 46), capturing the full Edge Function response
  body. The hook comment acknowledges this is temporary ("remove after CORS confirmed")
  but it has not been removed. The view gates rendering via `import.meta.env.DEV &&
  rawDebugError` (InviteView.jsx lines 51, 113), but the state itself is always
  allocated and the hook always returns it.
- Risk: (1) The `rawDebugError` field is part of the public hook interface. Any
  future consumer of `useInvite()` who destructures it could inadvertently expose
  the raw API response (including `invite_code`, `invite_id`, and error details)
  in production UI. (2) Even in DEV, the `rawDebugError` state captures full
  success responses including the invite code (the VEN-INVITE-002 token), creating
  a secondary exposure path during development that could leak into log captures,
  debugging sessions, or React DevTools. (3) This is an acknowledged technical debt
  with no removal trigger.
- Severity: MEDIUM
- Exploitability: LOW (requires either a future consumer mistake or DEV tooling
  interception)
- Attack Preconditions: Accidental future use of the exported field in a production
  path, or access to a development environment where DEV=true.
- Blast Radius: Moderate — if exposed, leaks full Edge Function response bodies
  including one-time invite tokens.
- Identity Leak Type: Raw API response capture (includes invite_code in success path)
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Technical debt with a documented removal note that has not shipped.
  The hook's public API contract is polluted with a debug artifact. Combined with
  VEN-INVITE-002, the invite_code is captured twice in DEV (once in the response,
  once stringified in this state).
- Recommended mitigation: Remove all `rawDebugError` state, setters, and export from
  `useInvite.js`. Remove corresponding destructuring and `<pre>` probe blocks from
  `InviteView.jsx`. CORS has presumably been confirmed operational since the feature
  is functional — this probe has served its purpose.
- Rationale: The feature is functional. The CORS concern that prompted the probe is
  resolved by the feature working. The debt cleanup is overdue and low-risk.
- Follow-up command: IRONMAN (owns the cleanup; no functional change required)
- Provenance: SOURCE_VERIFIED — useInvite.js lines 12, 36, 39, 46, 65;
  InviteView.jsx lines 12, 51, 64, 112-125
- CISSP Domain:
  - Primary: Software Development Security (debug artifact in production interface)
  - Secondary: Information Security (inadvertent credential capture)
```

---

### VEN-INVITE-004

```
VENOM SECURITY FINDING
- Finding ID: VEN-INVITE-004
- Location: apps/VCSM/supabase/functions/send-citizen-invite/index.ts (entire handler)
- Application Scope: VCSM
- Platform Surface: Supabase Edge Function
- Trust Boundary: Any authenticated VCSM user → Edge Function → SES email dispatch
- Boundary Violated: No per-user invite rate limiting enforced at the Edge Function
  or application layer
- Contract Violated: Abuse prevention — no mechanism prevents a single authenticated
  user from sending invites to thousands of email addresses
- Current behavior: The Edge Function enforces authentication (JWT check) and
  ownership (actor_owners check), and checks if the target is already registered.
  It does NOT check: (1) how many invites the calling user has sent, (2) how many
  invites have been sent to the same target email, (3) whether a pending invite to
  the same email already exists. There is no per-user rate limit, no daily cap, and
  no invite deduplication guard. Every call results in a new DB row in `vibe_invites`
  and a new SES email dispatch.
- Risk: An authenticated user (including a compromised account) can use the invite
  endpoint as a spam relay: send unlimited emails to arbitrary addresses via the
  platform's SES account. This risks: (1) SES account suspension or sending
  reputation damage, (2) spam complaints against the vibezcitizens.com domain,
  (3) DMARC/DKIM reputation harm, (4) AWS SES cost amplification.
- Severity: MEDIUM
- Exploitability: MEDIUM (requires valid authenticated session; no additional
  privileges needed)
- Attack Preconditions: Valid registered account + ability to POST to the edge
  function repeatedly with different target emails.
- Blast Radius: AWS SES sending reputation for the entire platform; potential domain
  block by spam filters; financial cost from SES usage.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE (rate limiting is an application concern, not RLS)
- Why it matters: Email abuse via platform invite flows is a common attack vector
  against growth-phase platforms. SES suspension would disable all transactional
  email platform-wide (not just invites).
- Recommended mitigation: (1) Short-term: add a per-user daily invite cap (e.g. 20
  invites/day) tracked in `vibe_invites` via a COUNT query before insert:
  `SELECT COUNT(*) FROM vc.vibe_invites WHERE inviter_actor_id = $resolvedActorId
  AND created_at > NOW() - INTERVAL '24 hours'`.
  (2) Add a deduplication guard: check if an active/pending invite to the same
  `invite_target` from the same `inviter_actor_id` already exists within its
  expiry window (30 days). Return `{ ok: false, code: 'INVITE_ALREADY_SENT' }`
  if found. (3) Long-term: consider SES sending quota alarm and per-domain
  suppression via SES suppression list.
- Rationale: Rate limiting and deduplication are standard abuse controls for
  any email-dispatch endpoint accessible to authenticated users.
- Follow-up command: DB (confirm vibe_invites schema for index on inviter_actor_id +
  created_at to make the rate-check query fast), Carnage (migration to add
  composite index if absent)
- Provenance: SOURCE_VERIFIED — index.ts line 269-427; no rate check code found
  anywhere in the handler
- CISSP Domain:
  - Primary: Information Security Governance (abuse prevention controls)
  - Secondary: Software Development Security (missing application-level throttle)
```

---

### VEN-INVITE-005

```
VENOM SECURITY FINDING
- Finding ID: VEN-INVITE-005
- Location: ZZnotforproduction/APPS/VCSM/features/invite/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Governance (documentation)
- Trust Boundary: Engineering team → VENOM/ELEKTRA/BLACKWIDOW review chain
- Boundary Violated: Behavior contract is a placeholder — no security rules or
  invariants authored
- Contract Violated: VCSM governance contract — every feature with an active edge
  function surface must have a BEHAVIOR.md with §5 Security Rules and §9 Must
  Never Happen sections before a security review can be formally verified
- Current behavior: BEHAVIOR.md status is "PLACEHOLDER". The file contains:
  "Status: PLACEHOLDER / Feature: invite / Notes: Behavior contract pending source review."
  No §5 Security Rules, no §9 Must Never Happen, no BEH IDs.
- Risk: Future VENOM/ELEKTRA/BLACKWIDOW runs cannot cross-check source against
  a formal contract. Regressions to security invariants cannot be detected
  automatically. Critical rules (e.g. "actor ownership must always be server-
  verified", "no invite to self", "no invite to existing user") exist in source
  but have no contractual backing — a future developer could remove these guards
  without a governance violation being detectable.
- Severity: HIGH
- Exploitability: N/A (governance gap, not a runtime vulnerability)
- Attack Preconditions: N/A
- Blast Radius: Future security regressions go undetected across review cycles
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The invite feature invokes an AWS SES-backed email dispatch with
  a service-role Supabase client. It is one of the highest-privilege operations
  a regular user can trigger. The absence of a formal behavior contract means
  every future change to this feature is reviewed with no baseline to regress
  against.
- Recommended mitigation: Author a complete BEHAVIOR.md for the invite feature
  including at minimum: §5 Security Rules covering (a) JWT must be valid before
  any action; (b) actor ownership must be server-verified via actor_owners; (c)
  self-invite must be rejected; (d) already-registered target must be rejected;
  (e) inviterActorId must belong to the calling user when inviterType=vport.
  §9 Must Never Happen covering (a) service-role key must never reach the client;
  (b) invite code must not be used for authentication; (c) no invite dispatch
  without verified actor ownership.
- Rationale: A feature of this privilege level (SES dispatch + service-role key
  usage + actor identity resolution) requires a formal, reviewed behavior contract.
- Follow-up command: LOGAN (author BEHAVIOR.md from source)
- Provenance: SOURCE_VERIFIED — BEHAVIOR.md line 3 ("Status: PLACEHOLDER")
- CISSP Domain:
  - Primary: Information Security Governance (security policy documentation)
  - Secondary: Software Development Security (contract-driven review)
```

---

## 8. SOURCE VERIFICATION SUMMARY

| File | Read | Key Findings |
|---|---|---|
| `apps/VCSM/src/features/invite/dal/invite.dal.js` | YES | Correct: uses `supabase.functions.invoke()` with Bearer token auto-attached; no direct table writes; no auth bypass |
| `apps/VCSM/src/features/invite/controller/invite.controller.js` | YES | Client-side email format validation present (EMAIL_RE); inviterType enum validation present; does NOT validate actorId ownership — correctly deferred to server |
| `apps/VCSM/src/features/invite/hooks/useInvite.js` | YES | Identity correctly derived from useIdentity() via adapter; rawDebugError exported (VEN-INVITE-003); DEV gating present in view |
| `apps/VCSM/src/features/invite/screens/InviteView.jsx` | YES | rawDebugError rendered only behind import.meta.env.DEV guard; functional correctness confirmed |
| `apps/VCSM/src/features/invite/screens/InviteScreen.jsx` | YES | Simple wrapper; no security concerns |
| `apps/VCSM/supabase/functions/send-citizen-invite/index.ts` | YES | Primary finding surface; JWT auth VERIFIED; CORS origin-locked to vibezcitizens.com; self-invite check VERIFIED; ownership check via actor_owners VERIFIED; listUsers() O(n) scan (VEN-INVITE-001); invite_code returned to client (VEN-INVITE-002); no rate limiting (VEN-INVITE-004) |
| `apps/VCSM/src/app/guards/ProtectedRoute.jsx` | YES | Confirmed: checks `user`, email verification via `isEmailVerifiedModel`, legal consent gate. /invite is correctly inside this guard. |
| `apps/VCSM/src/app/routes/protected/app.routes.jsx` | YES | Confirmed: `{ path: "/invite", element: <InviteScreen /> }` at line 152 inside protectedAppRoutes, which is nested inside ProtectedRoute → ProfileGatedOutlet |

### Verified Safe Behaviors

| Behavior | Evidence |
|---|---|
| JWT enforced server-side | index.ts:207-243 — Bearer check + `userClient.auth.getUser()` before any action |
| VPORT ownership verified | index.ts:347-363 — `actor_owners` join check with `user.id` + `actor_id` match |
| Citizen actor resolved from session | index.ts:287-337 — actor_owners + actors chain resolved from `user.id`, not from client param |
| Self-invite rejected | index.ts:265-267 — `user.email.toLowerCase() === normalizedEmail` check |
| CORS origin locked | index.ts:6 — `ALLOWED_ORIGIN = "https://vibezcitizens.com"` |
| HTML injection in email escaped | index.ts:32-39 — `escapeHtml()` applied to inviterName before HTML embedding |
| Service-role key never client-side | index.ts:215, 233 — `serviceKey` loaded from `Deno.env`, used only in `adminClient` |
| Invite code is UUID (unguessable) | index.ts:401 — `crypto.randomUUID()` |
| Route behind authenticated guard | app.routes.jsx:152, routes/index.jsx:171 — ProtectedRoute + ProfileGatedOutlet |
| inviterActorId from client ignored for citizen path | index.ts:286-338 — citizen path never uses `body.inviterActorId`; actor resolved from token |

---

## 9. CONFIDENCE SUMMARY

| Finding | Confidence | Basis |
|---|---|---|
| VEN-INVITE-001 (listUsers O(n) scan) | HIGH | Line 269 read; no alternative lookup or pagination found |
| VEN-INVITE-002 (invite_code in response) | HIGH | Lines 490-494 read; return value confirmed |
| VEN-INVITE-003 (rawDebugError probe) | HIGH | Lines 12, 36, 39, 46, 65 read; view gate confirmed |
| VEN-INVITE-004 (no rate limiting) | HIGH | Full handler read; no rate check, COUNT query, or deduplication found |
| VEN-INVITE-005 (missing behavior contract) | HIGH | BEHAVIOR.md read; confirmed placeholder |

Overall VENOM Review Confidence: HIGH — all findings are SOURCE_VERIFIED from files read in this session.

---

## 10. THOR IMPACT

| Finding | THOR Blocker | Reason |
|---|---|---|
| VEN-INVITE-001 | YES — P1 | An authenticated user can force repeated full-user-list admin API scans, causing DoS amplification on the invite endpoint. Must be fixed before any growth push that increases invite volume. |
| VEN-INVITE-002 | NO | Low exploitability; requires active XSS compromise of sender session. Hardening recommended but not a release gate. |
| VEN-INVITE-003 | NO | DEV-only render exposure; public hook API pollution is a cleanup debt, not a production runtime risk. |
| VEN-INVITE-004 | NO | Medium risk; SES abuse is a real concern but requires a legitimate account. Recommend fixing before major user growth events (campaigns, launches). |
| VEN-INVITE-005 | NO | Governance gap; does not affect runtime security directly. |

**THOR Release Blocker: YES — VEN-INVITE-001 must be patched before any invite-volume growth event.**

---

## 11. REQUIRED FOLLOW-UP COMMANDS

| Command | Finding | Task |
|---|---|---|
| DB | VEN-INVITE-001 | Verify `auth.admin.getUserByEmail()` is available in the SDK version used; confirm `auth.users` unique index on email |
| SPIDER-MAN | VEN-INVITE-001 | Add regression test for duplicate email detection path |
| ELEKTRA | VEN-INVITE-002 | Trace `invite_code` response usage in PWA client; verify no storage or display in production |
| IRONMAN | VEN-INVITE-003 | Remove rawDebugError state, setter, export from useInvite.js; remove DEV PROBE blocks from InviteView.jsx |
| DB | VEN-INVITE-004 | Confirm composite index exists on `vc.vibe_invites(inviter_actor_id, created_at)` and `vc.vibe_invites(invite_target, status, expires_at)` |
| Carnage | VEN-INVITE-004 | Migration to add composite indexes if absent; migration for per-user daily rate cap logic |
| LOGAN | VEN-INVITE-005 | Author complete BEHAVIOR.md with §5 Security Rules and §9 Must Never Happen |

---

## 12. MITIGATION PLAN

| Finding ID | Severity | Mitigation | Owner | Effort | Priority |
|---|---|---|---|---|---|
| VEN-INVITE-001 | HIGH | Replace `auth.admin.listUsers()` with targeted single-email lookup (`getUserByEmail` or filtered admin query) | IRONMAN + DB | Small (1 function call replacement in index.ts) | P1 — THOR BLOCKER |
| VEN-INVITE-005 | HIGH | Author complete BEHAVIOR.md with §5 and §9 sections | LOGAN | Medium (doc authoring from source) | P1 — Governance |
| VEN-INVITE-002 | HIGH | Remove `invite_code` from Edge Function success response; return `{ ok: true, invite_id }` only | IRONMAN | Trivial (remove one field from return object) | P2 |
| VEN-INVITE-004 | MEDIUM | Add per-user daily invite cap (COUNT check) + deduplication guard (pending invite check) in Edge Function | IRONMAN + Carnage + DB | Medium (2 DB queries + migration for indexes) | P2 — pre-launch |
| VEN-INVITE-003 | MEDIUM | Remove rawDebugError state, all DEV PROBE blocks, and export from hook and view | IRONMAN | Trivial (cleanup) | P3 — technical debt |

---

## 13. CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings Covering | Summary |
|---|---|---|
| Software Development Security | VEN-INVITE-001, VEN-INVITE-002, VEN-INVITE-003, VEN-INVITE-004 | Unbounded admin API, credential in response, debug artifact in API, missing rate limit |
| Information Security Governance | VEN-INVITE-004, VEN-INVITE-005 | Abuse prevention controls absent; behavior contract missing for high-privilege feature |
| Information Security (Confidentiality) | VEN-INVITE-002, VEN-INVITE-003 | Invite code (one-time token) unnecessarily exposed to sender; raw response captured in debug state |
| Access Control | VEN-INVITE-001 | Admin API scope over-privileged relative to the lookup need |
| Security Operations | VEN-INVITE-004 | No monitoring or alerting on invite volume anomalies |

**Domains not covered by findings (verified clean):**
- Cryptography: Invite code generation uses `crypto.randomUUID()` — UUID v4, cryptographically random. VERIFIED SAFE.
- Communications & Network Security: CORS locked to `https://vibezcitizens.com`, HTTPS enforced by Supabase/Deno runtime. VERIFIED SAFE.
- Identity & Access Management: JWT verification + actor_owners ownership chain + email verification gate all confirmed. VERIFIED SAFE.
- Security Architecture: Service-role key server-side only; client uses anon key + JWT. VERIFIED SAFE.

---

*VENOM V2 review complete. 5 findings. Source files read: 8. Edge function verified: 1. All CRITICAL/HIGH findings are SOURCE_VERIFIED.*
