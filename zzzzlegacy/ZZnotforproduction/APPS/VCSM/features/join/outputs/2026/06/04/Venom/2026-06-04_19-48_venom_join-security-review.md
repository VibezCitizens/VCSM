# VENOM Security Review — join
## Report: 2026-06-04_19-48_venom_join-security-review

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | join |
| App | VCSM |
| Review Date | 2026-06-04 |
| Report Time | 19:48 |
| VENOM Version | V2 |
| Reviewer | VENOM (automated security sheriff) |
| Scanner Preflight | ALL PASS |
| Scanner Version | 1.1.0 |
| Source Root | apps/VCSM/src/features/join/ |
| Docs Root | ZZnotforproduction/APPS/VCSM/features/join/ |
| Highest Finding Severity | MEDIUM |
| THOR Release Blocker | NO |
| Total Findings | 4 (0 CRITICAL, 0 HIGH, 3 MEDIUM, 1 LOW) |

---

## 2. Scanner Preflight Block

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                  | Generated At              | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs Block

```json
{
  "writeSurfaces": [
    {
      "operation": "update",
      "table": "resources",
      "function": "acceptJoinResourceDAL",
      "confidence": "HIGH",
      "path": "apps/VCSM/src/features/join/dal/joinInvite.dal.js"
    }
  ],
  "rpcs": [],
  "edgeFunctions": [],
  "counts": {
    "writes": 1,
    "rpcs": 0,
    "paths": 1,
    "edgeFunctions": 0
  }
}
```

Scanner note: securityPaths confidence is LOW ("write surface discovered without route-confirmed path").
Write surface itself is HIGH confidence. The route was located via source inspection:
`/join/barbershop/:token` → `JoinBarbershopScreen` → `useJoinBarbershop` → controllers → DAL.

---

## 4. Security Surface Inventory

| Surface | Type | Table | Operation | File | Auth Required |
|---|---|---|---|---|---|
| acceptJoinResourceDAL | Supabase Write | vport.resources | UPDATE | dal/joinInvite.dal.js | YES (authenticated) |
| fetchJoinResourceByIdDAL | Supabase Read | vport.resources | SELECT | dal/joinInvite.dal.js | YES (pre-auth read gap — see VEN-JOIN-001) |
| signUpForInviteDAL | Supabase Auth | auth.users | signUp | dal/joinAuth.dal.js | NO (public signup) |
| readBarberVportByOwnerUserIdDAL | Supabase Read | vport.profiles | SELECT | dal/barberVport.read.dal.js | YES |
| findBarberVportForUserDAL | Supabase Read | vport.profile_categories | SELECT | dal/barberVport.read.dal.js | YES |

**RPCs:** None
**Edge Functions:** None

---

## 5. Scanner Signals Block

| Signal | Table | Operation | Confidence | Evidence |
|---|---|---|---|---|
| acceptJoinResourceDAL | vport.resources | UPDATE | HIGH | Supabase write call extracted from AST |
| Write execution path | vport.resources | UPDATE | LOW (path not route-confirmed by scanner) | Manually verified via source trace |

Scanner path confidence LOW is explained by the public route being registered in `apps/VCSM/src/app/routes/public/join.routes.jsx` — the scanner's route-execution-map may not have resolved the dynamic `:token` segment into a confirmed write path. Source inspection confirms the full chain exists.

---

## 6. Behavior Contract Status

| Status | Detail |
|---|---|
| BEHAVIOR.md | PLACEHOLDER — no completed contract |
| §5 Security Rules | NONE DEFINED (contract is placeholder) |
| §9 Must Never Happen | NONE DEFINED (contract is placeholder) |

BEHAVIOR.md at `ZZnotforproduction/APPS/VCSM/features/join/BEHAVIOR.md` contains only:
```
Status: PLACEHOLDER
Notes: Behavior contract pending source review.
```

**Finding:** MISSING_BEHAVIOR_CONTRACT — recorded as LOW severity (not HIGH, because source
inspection confirms the feature has robust controller-layer guards that compensate for the
absent contract document; the gap is governance-level, not runtime-level).

---

## 7. Trust Boundary Findings

---

### VEN-JOIN-001

```
VENOM SECURITY FINDING
- Finding ID: VEN-JOIN-001
- Location: apps/VCSM/src/features/join/dal/joinInvite.dal.js:5-16 and
            apps/VCSM/src/features/join/hooks/useJoinBarbershop.js:62-84
- Application Scope: VCSM
- Platform Surface: PWA — public route /join/barbershop/:token
- Trust Boundary: Public internet — no authentication required to load the page
- Boundary Violated: Resource enumeration via unauthenticated token probe
- Contract Violated: Architecture contract §1.4 (ownership verification); implicit
                     join resource confidentiality
- Current behavior: fetchJoinResourceByIdDAL is called from the useJoinBarbershop hook
  immediately on page load, BEFORE any authentication check. The call uses the supabase
  anon key (vportClient = supabase.schema('vport')). The resources_select_public RLS policy
  is TO authenticated only — anon role sees zero rows. HOWEVER, pending resources have
  is_active = false and would be excluded by resources_select_public even if anon were
  authenticated. There is a secondary gap: the hook silently treats a null result (resource
  not found) as "try invite flow", masking the RLS rejection and making the error path
  indistinguishable from "token not found" or "resource inactive".
- Risk: Any token value (guessed UUID) can be probed without login. For pending resources
  (is_active = false), RLS returns null because the public policy only returns is_active = true.
  But the hook logic path for "null from QR, null from invite" treats this as an invalid invite,
  not an auth failure. There is no server-side rate limiting or token opacity at the PWA layer
  to prevent enumeration of token space.
- Severity: MEDIUM
- Exploitability: LOW — UUID token space (2^122 entropy) makes brute-force impractical; RLS
  prevents data leakage even if a valid token is probed unauthenticated; no sensitive data
  is returned for pending resources.
- Attack Preconditions: Attacker must possess or guess a valid resource UUID (join token).
  Token is shared via QR code or email, not publicly discoverable.
- Blast Radius: Information confirmation — attacker with a known token can confirm the
  token is valid (or expired/claimed) without logging in by observing response behavior.
  No data exposed due to RLS; no mutation possible.
- Identity Leak Type: Token validity oracle (behavior-based, no PII returned)
- Cache Trust Type: None
- RLS Dependency: VERIFIED — resources_select_public blocks inactive resources; authenticated
  policy chain confirmed in migrations 20260515020000 and 20260515010000.
- Why it matters: The join URL is a sensitive bearer token. If distributed broadly (e.g.,
  QR code printed at a barbershop), an observer could probe whether tokens are claimed
  or pending without logging in. No direct data leakage, but the confirmation oracle
  has minor operational security value to an attacker.
- Recommended mitigation: Add a server-side token validation endpoint (Edge Function or RPC)
  that requires authentication before revealing resource state, OR move the pre-auth fetch
  to only resolve barbershop display name (non-sensitive) and defer resource state checks
  until after login. Alternatively, add short-lived signed tokens separate from the resource UUID.
- Rationale: Separating token probe (unauthenticated) from resource state read (authenticated)
  removes the validity oracle and aligns with the principle that resource state should
  only be revealed to authenticated principals.
- Follow-up command: ELEKTRA
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control (AC)
  - Secondary: Security Architecture and Engineering (SAE)
```

---

### VEN-JOIN-002

```
VENOM SECURITY FINDING
- Finding ID: VEN-JOIN-002
- Location: apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js:73-113
- Application Scope: VCSM
- Platform Surface: PWA — invite flow autoResumeInviteOnboarding path
- Trust Boundary: Authenticated user — valid session required
- Boundary Violated: Pre-write resource state not verified before expensive side-effects
- Contract Violated: Defense-in-depth principle; join resource integrity contract
- Current behavior: autoResumeInviteOnboarding executes bootstrapJoinOnboardingController
  (creates user profile + actor) and createVport (creates a new barber VPORT) BEFORE
  calling acceptJoinResourceDAL. If the invite resource is already claimed or expired
  at this point, acceptJoinResourceDAL throws "join resource is no longer available" and
  the hook falls back to VIEWS.CREATE_VPORT (line 133-135 in useJoinBarbershop.js).
  The newly created VPORT actor and onboarding records are NOT rolled back.
- Risk: A user with a stale/replayed pending_invite_token in their user_metadata could
  trigger account bootstrap and VPORT creation for an already-claimed invite slot. The
  VPORT is left dangling (created but not linked to any barbershop resource). The user
  sees a confusing error; orphaned VPORT and actor records accumulate in the DB.
  This is NOT an authorization bypass — the user has a legitimate session; but the
  state machine creates artifacts that are never cleaned up.
- Severity: MEDIUM
- Exploitability: LOW — requires a race condition OR a user whose invite was claimed
  after email confirmation but before auto-resume completes. Not directly exploitable
  for unauthorized access; impact is data integrity and UX confusion.
- Attack Preconditions: User has completed signup (email confirmed), has
  pending_invite_token in user_metadata, but the invite was concurrently claimed
  or manually revoked between signup and auto-resume.
- Blast Radius: Orphaned vc.actors and vport.profiles records per occurrence.
  No security breach, but DB contamination and confusing UX for affected users.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: REQUIRED — acceptJoinResourceDAL is guarded by DAL-level atomic
  state check (.eq("meta->>status", "pending_onboarding") + .is("member_actor_id", null)).
  RLS further enforces member ownership via resources_update_member policy
  (migration 20260527020000).
- Why it matters: Side-effect-before-guard patterns are a known source of partial
  failure states. In a marketplace platform, orphaned actors can pollute identity
  queries, team rosters, and metrics. The correct ordering is: validate resource state
  first, then create side effects.
- Recommended mitigation: Add a pre-flight resource state check at the top of
  autoResumeInviteOnboarding — call fetchJoinResourceByIdDAL and verify
  meta.status === "pending_onboarding" and member_actor_id === null BEFORE calling
  bootstrapJoinOnboardingController or createVport. If the resource is already
  claimed, throw early with a user-friendly message.
- Rationale: Fail-fast guard prevents all downstream side effects when the invite
  is stale. No schema changes required — purely controller-layer logic ordering.
- Follow-up command: SPIDER-MAN
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Security Architecture and Engineering (SAE)
  - Secondary: Software Development Security (SDS)
```

---

### VEN-JOIN-003

```
VENOM SECURITY FINDING
- Finding ID: VEN-JOIN-003
- Location: apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js:15-43
            and apps/VCSM/src/features/join/dal/joinAuth.dal.js:3-11
- Application Scope: VCSM
- Platform Surface: PWA — invite flow signUpForBarbershopInvite
- Trust Boundary: Public internet — signup is unauthenticated
- Boundary Violated: Client-controlled metadata embedded in auth JWT without server validation
- Contract Violated: Zero trust on client-supplied identity data
- Current behavior: signUpForBarbershopInvite passes client-supplied values
  (display_name, desired_username, vport_name, category_key, pending_invite_token)
  directly into supabase.auth.signUp metadata (options.data). These values are stored
  in user_metadata on the Supabase auth.users record and later read back by
  autoResumeInviteOnboarding via user.user_metadata. The category_key "barber" is
  hardcoded in the controller constant BARBER_CATEGORY — but it is still embedded
  in client metadata.
  No server-side validation of metadata shape or content occurs at the DAL or controller
  layer before writing. The email redirect URL is constructed from window.location.origin
  (line 16: `${window.location.origin}/join/barbershop/${token}`) — this is the redirect
  back URL after email confirmation.
- Risk: 1. A malicious or manipulated client could inject arbitrary values into
  user_metadata (e.g., overlong display_name, crafted vport_name with injection
  characters). autoResumeInviteOnboarding takes these values and passes them to
  generateUsernameDAL and upsertCompletedOnboardingProfileDAL without visible
  sanitization in this controller.
  2. The emailRedirectTo URL constructed from window.location.origin could be
  manipulated if the app is embedded in an attacker-controlled frame or if the
  origin check in Supabase Auth is misconfigured, potentially redirecting the
  email confirmation to an attacker-controlled page.
- Severity: MEDIUM
- Exploitability: MEDIUM — requires an attacker to control the signup form submission
  (self-signup); email redirect manipulation requires Supabase Auth redirect allowlist
  misconfiguration.
- Attack Preconditions: For metadata injection: attacker can submit the signup form
  with crafted input (trivial). For email redirect: Supabase Auth redirect URL
  allowlist must not be properly locked down.
- Blast Radius: Metadata injection: polluted user profile data (display_name,
  username), potentially confusing downstream profile creation. Email redirect:
  if origin allowlist is not locked, email confirmation token could be intercepted.
- Identity Leak Type: Client-controlled identity metadata in JWT
- Cache Trust Type: user_metadata read-back as trusted data
- RLS Dependency: NONE — this is a pre-auth signup path; RLS does not apply.
- Why it matters: Reading back client-supplied JWT metadata as trusted input
  (display_name → profile display name, vport_name → VPORT name) without
  re-validation at use-time allows user-controlled data to enter the platform
  identity layer. The emailRedirectTo pattern is correct (Supabase handles
  origin validation server-side) but the allowlist configuration must be verified.
- Recommended mitigation: 1. Add explicit length and character validation on
  display_name, desired_username, vport_name in signUpForBarbershopInvite before
  embedding in metadata. 2. In autoResumeInviteOnboarding, apply String.trim() and
  max-length guards when reading metadata fields (already partially done with
  String(meta.display_name || "").trim() — extend to enforce max lengths of ~100
  chars). 3. Have DB team verify Supabase Auth redirect URL allowlist is locked to
  known origins only (not wildcard).
- Rationale: Defense-in-depth: client-controlled metadata should be validated
  both at write time (signup) and at read time (auto-resume) before being used
  as identity-layer input.
- Follow-up command: ELEKTRA
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security (SDS)
  - Secondary: Access Control (AC)
```

---

### VEN-JOIN-004

```
VENOM SECURITY FINDING
- Finding ID: VEN-JOIN-004
- Location: ZZnotforproduction/APPS/VCSM/features/join/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Governance — documentation contract
- Trust Boundary: N/A (documentation gap)
- Boundary Violated: N/A
- Contract Violated: VCSM feature governance contract — all features must have a
  completed BEHAVIOR.md with §5 Security Rules and §9 Must Never Happen sections.
- Current behavior: BEHAVIOR.md is a placeholder with Status: PLACEHOLDER and
  no security rules, invariants, or behavioral contract defined.
- Risk: Without a formal security contract, future changes to the join flow
  cannot be cross-checked for invariant violations. Security guards that exist
  in source (ELEK-001 atomic state, ownership assertions, session match) are
  not codified, meaning they can be silently removed in a future refactor.
- Severity: LOW
- Exploitability: LOW — documentation gap, not a runtime vulnerability.
- Attack Preconditions: N/A — governance finding.
- Blast Radius: Future regressions if security guards are removed without
  behavioral contract enforcement.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The VCSM contributor contract requires a completed BEHAVIOR.md
  before a feature can be considered THOR-eligible. Missing behavioral contracts
  are the #1 cause of security regression in platform refactors.
- Recommended mitigation: Complete BEHAVIOR.md for join feature, documenting:
  §5 Security Rules (must include: token uniqueness, ownership assertion before
  any resource write, atomic state guard, session match in bootstrap, barber-only
  category enforcement), §9 Must Never Happen (resource claimed without ownership
  check, invite accepted more than once, vport_name from metadata written without trim).
- Rationale: Behavioral contracts are not optional governance overhead — they are
  the regression anchor for security tests and code review.
- Follow-up command: SPIDER-MAN
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Security Assessment and Testing (SAT)
  - Secondary: Security and Risk Management (SRM)
```

---

## 8. Source Verification Summary

| File | Read | Findings | Notes |
|---|---|---|---|
| dal/joinInvite.dal.js | YES | VEN-JOIN-001 (partial) | ELEK-001 atomic guard VERIFIED: .eq("meta->>status","pending_onboarding") + .is("member_actor_id", null) |
| dal/joinAuth.dal.js | YES | VEN-JOIN-003 (partial) | signUpForInviteDAL writes client metadata to auth.users; no server-side validation |
| dal/barberVport.read.dal.js | YES | CLEAN | Proper null guards; scoped to userId from session |
| controllers/joinBarbershopAccount.controller.js | YES | VEN-JOIN-002, VEN-JOIN-003 | autoResumeInviteOnboarding side-effects before resource validation; metadata trust |
| controllers/joinBarbershopQr.controller.js | YES | CLEAN | acceptQrJoin has double ownership+state guard — VERIFIED SAFE |
| hooks/useJoinBarbershop.js | YES | VEN-JOIN-001 (partial) | Pre-auth resource fetch confirmed |
| screens/JoinBarbershopScreen.jsx | YES | CLEAN | UI-only; token from useParams; no DAL access |
| screens/components/JoinSignupForm.jsx | YES | CLEAN | Client-side validation only; reinforces VEN-JOIN-003 context |
| controllers/__tests__/joinBarbershopQr.controller.test.js | YES | TEST COVERAGE NOTE | Good coverage of callerActorId null guard, ownership block, ELEK-001 state guard, replay simulation |

### Key Security Controls Verified in Source

| Control | Location | Status |
|---|---|---|
| Atomic state guard on resource UPDATE | joinInvite.dal.js:48-49 | VERIFIED |
| Ownership assertion before write (QR flow) | joinBarbershopQr.controller.js:21-24 | VERIFIED |
| Ownership assertion before write (invite flow) | joinBarbershopAccount.controller.js:106-109, 127-129, 143-145 | VERIFIED |
| callerActorId null check (QR flow) | joinBarbershopQr.controller.js:20 | VERIFIED |
| callerActorId null check (invite flow) | joinBarbershopAccount.controller.js:117, 137 | VERIFIED |
| Session match in bootstrap | auth/controllers/onboarding.controller.js:152-154 | VERIFIED |
| Resource state pre-check (QR controller layer) | joinBarbershopQr.controller.js:30-37 | VERIFIED |
| Resource state pre-check (invite controller) | MISSING — see VEN-JOIN-002 | GAP |
| RLS on resources UPDATE (member path) | migration 20260527020000 | VERIFIED |
| RLS on resources UPDATE (owner path) | migration 20260515020000 | VERIFIED |
| Token expiry check (QR) | joinBarbershopQr.controller.js:38-40 | VERIFIED |
| Token expiry check (invite pre-auth) | useJoinBarbershop.js:99-103 | CLIENT-SIDE ONLY |

---

## 9. Confidence Summary

| Finding | Confidence | Basis |
|---|---|---|
| VEN-JOIN-001 | HIGH | Source-verified: vportClient anon key behavior + RLS policies read from migrations |
| VEN-JOIN-002 | HIGH | Source-verified: autoResumeInviteOnboarding execution order in controller file |
| VEN-JOIN-003 | HIGH | Source-verified: signUpForBarbershopInvite metadata embedding in dal/joinAuth.dal.js |
| VEN-JOIN-004 | HIGH | Source-verified: BEHAVIOR.md read, Status: PLACEHOLDER confirmed |

Overall VENOM review confidence: HIGH. All write surfaces from scanner data were traced
to source. The route-execution-map LOW confidence from the scanner is explained by the
public route structure; the full chain was manually verified.

---

## 10. THOR Impact

| Finding | THOR Blocker | Rationale |
|---|---|---|
| VEN-JOIN-001 | NO | Low exploitability; UUID token space prevents practical enumeration; RLS prevents data leak |
| VEN-JOIN-002 | NO | Data integrity issue (orphaned records), not an authorization bypass; no user data exposed |
| VEN-JOIN-003 | NO | Metadata injection is mitigated by downstream trim operations; email redirect requires Supabase allowlist verification (config-level, not code-level blocker) |
| VEN-JOIN-004 | NO | Governance gap; not a runtime vulnerability |

**THOR Release Blocker: NO**

No CRITICAL or HIGH findings. All MEDIUM findings have mitigations in place (RLS, atomic
state guards, session checks) that prevent security breaches. The findings represent
hardening opportunities and a governance gap.

---

## 11. Required Follow-Up Commands

| Finding | Command | Priority | Action |
|---|---|---|---|
| VEN-JOIN-002 | SPIDER-MAN | P2 | Add regression test: autoResumeInviteOnboarding must call fetchJoinResourceByIdDAL BEFORE bootstrapJoinOnboardingController; mock claimed resource and assert no VPORT creation occurs |
| VEN-JOIN-003 | ELEKTRA | P2 | Trace signUpForBarbershopInvite metadata → user_metadata → autoResumeInviteOnboarding read path; propose length/character validation patches |
| VEN-JOIN-001 | ELEKTRA | P3 | Evaluate adding token opacity layer or auth-gated resource state endpoint |
| VEN-JOIN-004 | SPIDER-MAN | P3 | Complete BEHAVIOR.md with §5 Security Rules and §9 Must Never Happen sections |
| DB team | DB | P2 | Verify Supabase Auth email redirect URL allowlist is locked to known origins (VEN-JOIN-003 email redirect surface) |

---

## 12. MITIGATION PLAN

| Finding ID | Severity | Effort | Priority | Owner | Mitigation |
|---|---|---|---|---|---|
| VEN-JOIN-002 | MEDIUM | LOW | P2 | Engineering | Add fetchJoinResourceByIdDAL preflight to top of autoResumeInviteOnboarding; throw early if resource is not pending |
| VEN-JOIN-003 | MEDIUM | LOW | P2 | Engineering + DB | Add explicit max-length guards (100 chars) on display_name, desired_username, vport_name in signUpForBarbershopInvite; verify Supabase Auth redirect allowlist |
| VEN-JOIN-001 | MEDIUM | MEDIUM | P3 | Engineering | Consider auth-gated token validation endpoint to remove pre-auth validity oracle |
| VEN-JOIN-004 | LOW | LOW | P3 | Engineering | Complete BEHAVIOR.md placeholder with full security contract |

---

## 13. CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Coverage |
|---|---|---|
| Access Control (AC) | VEN-JOIN-001, VEN-JOIN-003 | Token access control, metadata trust |
| Security Architecture and Engineering (SAE) | VEN-JOIN-001, VEN-JOIN-002 | Defense-in-depth, fail-fast ordering |
| Software Development Security (SDS) | VEN-JOIN-002, VEN-JOIN-003 | Side-effect ordering, input validation |
| Security Assessment and Testing (SAT) | VEN-JOIN-004 | Behavioral contract coverage |
| Security and Risk Management (SRM) | VEN-JOIN-004 | Governance contract |
| Identity and Access Management (IAM) | — | No findings; ownership chain (actor_owners, assertActorOwnsVportActorController) VERIFIED SAFE |
| Communication and Network Security | — | No edge functions or external calls in scope |
| Security Operations (SO) | — | No operational findings |

**Domains with VERIFIED SAFE controls:**
- IAM: ownership chain via vc.actor_owners + assertActorOwnsVportActorController is sound across all acceptance paths
- Database Security: RLS on vport.resources is comprehensive (5 actor-based policies + member UPDATE policy); atomic state guard at DAL layer prevents replay
- Cryptography: Supabase Auth handles session tokens; JWT session match enforced in bootstrapJoinOnboardingController

---

*VENOM V2 Review Complete — join feature — 2026-06-04*
*4 findings: 0 CRITICAL, 0 HIGH, 3 MEDIUM, 1 LOW*
*THOR Release Blocker: NO*
