---
name: vcsm.bottom-nav.venom-security-review
description: VENOM targeted security review — bottom navigation bar shell, 2026-06-06
metadata:
  type: security-review
  owner: VENOM
  date: 2026-06-06
  scope: VCSM
  mode: TARGETED — bottom navigation bar
  architect-gate: PASS (0 days — same session)
  prior-run: 2026-06-04 (broad shared module scan)
---

# VENOM SECURITY REVIEW — Bottom Navigation Bar
**Date:** 2026-06-06
**Application Scope:** VCSM
**Review Mode:** Targeted — BottomNavBar shell component + direct dependencies
**Reviewer:** VENOM
**Trigger:** User-requested full security audit of bottom navigation bar

---

## ARCHITECT GATE

```
VENOM ARCHITECT GATE PASS

Upstream Report:
  ZZnotforproduction/APPS/VCSM/features/shared/modules/bottomBarNav/vcsm.bottom-nav.architecture.md
  Scope: VCSM / shared / bottom-nav
  Date: 2026-06-06
  Status: SUCCESS
  Age: 0 days

Proceeding with VENOM analysis.
```

---

## Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: ZZnotforproduction/APPS/VCSM/features/shared/BEHAVIOR.md
BEHAVIOR.md exists: YES
BEHAVIOR.md status: PLACEHOLDER (stub — no content)
§5 Security Rules declared: 0
§5 Rules verified in source: N/A
§5 Rules unenforced: N/A — no rules declared
§9 Must Never Happen declared: 0
§9 Invariants protected in source: N/A
§9 Invariants unprotected: N/A — no invariants declared
```

Security posture for bottom-nav is UNANCHORED — no §5 or §9 contract exists.
All findings below are derived from source evidence only.

---

## Prior Run Delta

Previous VENOM run: 2026-06-04 (broad shared module)
- VEN-SHARED-002 (adapter boundary — BottomNavBar → profiles controller): **STILL OPEN** — source unchanged, confirmed by DEADPOOL 2026-06-06
- VEN-SHARED-003 (BEHAVIOR.md missing): **STILL OPEN**
- VEN-SHARED-001, 004, 005: Not bottom-nav specific — retained in SECURITY.md, not re-examined here

This run adds targeted findings for: OneSignal identity linkage, identity adapter bypass chain expansion, noti:refresh event surface, and slug cache trust.

---

## VENOM TARGET

```
VENOM TARGET
Feature / Route / Engine: bottom navigation bar (persistent shell component)
Application Scope: VCSM
Reason for review: User-requested full ARCHITECT + DEADPOOL + VENOM audit
Primary trust boundary: Authenticated Citizen / Authenticated VPORT Owner (session must be valid for all badge and navigation behavior)
```

---

## SECURITY SURFACE

```
SECURITY SURFACE
Entry point: BottomNavBar — always-mounted in RootLayout; visible on all non-auth, non-learning, non-chat-subscreen routes
Auth source: useAuth (AuthProvider) → user.id; useIdentity (identityContext via adapter) → identity.actorId
Authorization layer: Client-side only — no server calls made directly by BottomNavBar; downstream badge fetches use actor-keyed React Query (notifications adapter, chat adapter)
Identity surface: actorId (from identity), user.id (from auth — used for OneSignal external user binding)
Sensitive objects involved:
  - user.id (Supabase auth UUID) — transmitted to OneSignal third-party service
  - actorId — used as React Query key for badge polling; stored in bootstrap.store
  - canonicalSlug cache — TTL in-memory map of actorId → slug
  - unread notification count (React Query, 60s)
  - unread chat count (React Query, 30s)
  - new leads count (setInterval, 60s) — VportLeadsChip
```

---

## TRUST BOUNDARY TRACE

```
TRUST BOUNDARY TRACE
Client input:    None — BottomNavBar consumes no client-submitted input
Validated at:    actorId validated as UUID in useBootstrapHydration (UUID_RX regex) before polling activates
Identity resolved at: identityContext (IdentityProvider) → BottomNavBar receives actorId as read-only via useIdentity
Authorization enforced at: Downstream — badge counts are fetched via adapters that perform authenticated Supabase queries; badge numbers themselves carry no privileged data
Data returned to:  UI only — badge counts displayed as numbers; canonical slug used for client-side navigation
External data sent: user.id → OneSignal SDK (third-party push notification service)
```

---

## FINDINGS

---

### V-BN-001 — MISSING_BEHAVIOR_CONTRACT [bottom-nav]

```
VENOM SECURITY FINDING
- Finding ID: V-BN-001
- Location: ZZnotforproduction/APPS/VCSM/features/shared/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen, Authenticated VPORT Owner
- Boundary Violated: N/A — contract gap, not an active violation
- Contract Violated: None defined — that is the problem
- Current behavior: BEHAVIOR.md is a PLACEHOLDER stub. No §5 Security Rules and no §9 Must Never Happen invariants are declared. VENOM cannot verify ownership rules, session binding requirements, or prohibited behaviors against source.
- Risk: Security review is unanchored. Without §9 invariants, there is no formal statement of what MUST NEVER happen in this component. If a future change introduces a bypass or data leak, there is no declared invariant for SPIDER-MAN or THOR to test against. The most security-sensitive persistent component in the app — the one that initializes OneSignal, bootstrap polling, and slug navigation — has no declared security contract.
- Severity: HIGH
- Exploitability: N/A — governance gap, not a runtime exploit
- Attack Preconditions: N/A
- Blast Radius: All sessions — any security regression in the persistent shell is session-wide
- Identity Leak Type: None (current behavior) — risk is future regression
- Cache Trust Type: None (current behavior)
- RLS Dependency: NONE — shell component has no DB writes
- Why it matters: BottomNavBar is mounted in every authenticated session. It owns session-level polling (badge counts, leads count) and third-party push identity binding (OneSignal). Without a behavior contract, changes to this component lack a security regression anchor.
- Recommended mitigation: WOLVERINE intake to produce BEHAVIOR.md with at minimum: §5 Security Rules (OneSignal only links on authenticated user+identity; badge polling only activates on valid UUID actorId; slug cache never exposes raw UUIDs in public routes) and §9 Must Never Happen (badge data from Actor A must never display on Actor B session; OneSignal must logout on sign-out before session teardown; bootstrap polling must not activate for unauthenticated sessions).
- Rationale: Area 8 contract — BEHAVIOR.md absent = HIGH severity; security posture is UNANCHORED.
- Follow-up command: LOGAN (behavior intake), SPIDER-MAN (test against §9 invariants once defined)
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Security Assessment and Testing
```

---

### V-BN-002 — Supabase auth UUID transmitted to OneSignal third-party service

```
VENOM SECURITY FINDING
- Finding ID: V-BN-002
- Location: apps/VCSM/src/shared/hooks/useOneSignalPush.js — line 67
            apps/VCSM/src/services/onesignal/onesignalClient.js — lines 53–61
- Application Scope: VCSM
- Platform Surface: PWA, Shared Engine
- Trust Boundary: Authenticated Citizen, Authenticated VPORT Owner
- Boundary Violated: Authenticated Citizen → External Service (OneSignal)
- Contract Violated: Asset Security — internal auth identifier shared with third-party
- Current behavior: When both user and identity are hydrated, useOneSignalPush calls loginOneSignalExternalUser(user.id). This passes the Supabase auth UUID to the OneSignal SDK via sdk.login(externalId). OneSignal stores a persistent mapping: device push subscription → Supabase auth UUID. This association persists across page reloads, sessions, and actor switches until logoutOneSignalExternalUser() is called on sign-out.
- Risk: The Supabase auth user.id UUID becomes a data point held by OneSignal infrastructure. This creates:
  (1) Third-party identity record: OneSignal knows the Supabase UUID for each push-subscribed device. If OneSignal is breached or their API is queried, the UUID is exposed.
  (2) Cross-actor correlation: The UUID is stable across vport↔citizen actor switches, meaning OneSignal can correlate a single user across all their actor identities.
  (3) Stale association: If a user's session expires server-side without an explicit sign-out (e.g. token refresh failure, browser tab abandoned for days), logoutOneSignalExternalUser() is never called. The UUID association persists in OneSignal until the user next signs in and signs out properly.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions:
  - Requires compromise of OneSignal infrastructure or API key, OR
  - Requires prior XSS on the page (see V-BN-003 for amplification vector)
- Blast Radius: All push-subscribed users — every user who granted push permission has their auth UUID recorded at OneSignal
- Identity Leak Type: Internal UUID exposure, Actor correlation
- Cache Trust Type: Identity-sensitive (persists across actor switches)
- RLS Dependency: NONE — this is app-layer and external service layer
- Why it matters: The Supabase auth UUID is VCSM's primary stable user identifier at the auth layer. Exposing it to a third party creates a persistent linkage that is outside VCSM's data control. Privacy regulations (GDPR Art. 28, CCPA) may require a data processing agreement with OneSignal covering this linkage. The stale-association risk means removed/deactivated users may retain an active OneSignal identity binding.
- Recommended mitigation:
  (1) Verify a valid DPA (Data Processing Agreement) exists with OneSignal.
  (2) Add session-expiry awareness: hook into auth session refresh failure to call logoutOneSignalExternalUser() proactively, not only on explicit sign-out.
  (3) Consider hashing or rotating the external ID (HMAC of user.id + app secret) so OneSignal holds a derived identifier, not the raw Supabase UUID.
  (4) Document this data sharing in privacy policy / data flow inventory.
- Rationale: Third-party identity binding with a stable internal UUID is a privacy boundary crossing. The design is intentional and documented, but the stale-session risk and privacy documentation gap are not addressed.
- Follow-up command: LOGAN (document data sharing in privacy notes), IRONMAN (ownership of OneSignal data contract)
- CISSP Domain:
  - Primary: Asset Security
  - Secondary: Identity and Access Management
```

---

### V-BN-003 — window.OneSignal global writability — auth UUID exfiltration amplifier under XSS

```
VENOM SECURITY FINDING
- Finding ID: V-BN-003
- Location: apps/VCSM/src/services/onesignal/onesignalClient.js — lines 13–14
            apps/VCSM/src/shared/hooks/useOneSignalPush.js — line 67
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen
- Boundary Violated: None (requires XSS precondition)
- Contract Violated: Software Development Security
- Current behavior: onesignalClient reads the OneSignal SDK from window.OneSignal via:
    function os() { return typeof window !== 'undefined' ? (window.OneSignal ?? null) : null }
  window.OneSignal is a globally writable JavaScript property. If an XSS attack can inject a script that replaces window.OneSignal before the SDK initializes, the call sdk.login(String(externalId)) in loginOneSignalExternalUser() will invoke the attacker's fake login() method with the user's Supabase auth UUID as the argument.
- Risk: Under an existing XSS condition, an attacker can intercept the user's Supabase auth UUID at the moment useOneSignalPush calls loginOneSignalExternalUser(user.id). This converts a general XSS vulnerability into a targeted auth UUID exfiltration. The attack is passive (no user interaction needed after XSS is established) and fires automatically on every authenticated page load.
- Severity: LOW (standalone — requires prior XSS as precondition)
- Exploitability: MEDIUM (if XSS exists elsewhere in the app — the exfiltration is automatic)
- Attack Preconditions:
  - Prior XSS vulnerability must exist on the same origin
  - Attacker script must run before OneSignal SDK script loads OR override window.OneSignal after SDK loads
- Blast Radius: Single actor (per XSS session), potentially all users if XSS is stored
- Identity Leak Type: Internal UUID exposure
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The combination of a globally writable SDK reference + a sensitive identifier (auth UUID) being passed through it creates an XSS amplification surface. Even if no XSS exists today, this is a defense-in-depth gap that increases the blast radius of any future XSS finding.
- Recommended mitigation:
  (1) Add a window.OneSignal integrity check before calling login — verify it is the expected SDK type (e.g. check for expected SDK version property or use an Object.freeze/seal guard on init).
  (2) Alternatively, consider only calling loginOneSignalExternalUser after verifying window.OneSignal was set by the expected script origin (CSP + Subresource Integrity on the OneSignal script tag).
  (3) Confirm a strict Content-Security-Policy is in place that limits injectable script origins.
- Rationale: Global SDK references + sensitive identifiers = XSS amplification. Defense in depth at the SDK call site reduces blast radius.
- Follow-up command: ELEKTRA (CSP and SRI audit), BLACKWIDOW (XSS amplification chain verification)
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering
```

---

### V-BN-004 — VEN-SHARED-002 RE-VERIFY: BottomNavBar profiles controller direct import — STILL OPEN

```
VENOM SECURITY FINDING (RE-VERIFY)
- Finding ID: V-BN-004 (re-verify of VEN-SHARED-002 from 2026-06-04)
- Location: apps/VCSM/src/shared/components/BottomNavBar.jsx — line 9
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen, Authenticated VPORT Owner
- Boundary Violated: Boundary Isolation Contract — shared component imports feature controller directly
- Contract Violated: Boundary Isolation Contract
- Current behavior: BottomNavBar imports getCachedActorCanonicalSlug directly from @/features/profiles/controller/buildActorCanonicalSlug.controller — bypassing the profiles adapter. profiles.adapter.js does not export this function.
- Risk: Direct controller import means: (1) any security hardening or auth guard added to the profiles adapter surface is bypassed for this call path; (2) the profiles controller becomes a de-facto public interface consumed outside its feature boundary; (3) future access control changes to the adapter won't propagate to BottomNavBar.
- Severity: MEDIUM
- Re-verify status: STILL_OPEN_SOURCE_VERIFIED
- Exploitability: LOW — getCachedActorCanonicalSlug is a synchronous in-memory cache read with no auth decisions; no direct exploit today
- Attack Preconditions: None for current code — risk is structural (future regression path if controller gains auth logic)
- Blast Radius: Single actor (profile navigation path only)
- Identity Leak Type: None (slug data is public)
- Cache Trust Type: Public-profile-sensitive (slug cache maps actorId → public slug — not sensitive)
- RLS Dependency: NONE
- Why it matters: If the profiles controller is ever hardened with auth guards (e.g., gating slug resolution based on privacy settings or blocking state), BottomNavBar's direct import bypasses that guard silently. The component would continue to resolve slugs for blocked or private actors.
- Recommended mitigation: Add getCachedActorCanonicalSlug to profiles.adapter.js; update BottomNavBar import to use the adapter. (DEADPOOL fix proposal BUG-003 — awaiting approval.)
- Rationale: Adapter boundaries exist to ensure hardening propagates to all consumers. Direct controller imports create silent bypass paths.
- Follow-up command: IRONMAN (ownership assignment), DEADPOOL (fix proposal BUG-003 ready for approval)
- CISSP Domain:
  - Primary: Security Architecture and Engineering
  - Secondary: Software Development Security
```

---

### V-BN-005 — Identity adapter bypass — three confirmed sites in shell layer

```
VENOM SECURITY FINDING
- Finding ID: V-BN-005
- Location: apps/VCSM/src/app/layout/RootLayout.jsx — line 10
            apps/VCSM/src/features/dashboard/vport/components/VportLeadsChip.jsx — line 3
            apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount.js — line 2
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen, Authenticated VPORT Owner
- Boundary Violated: Boundary Isolation Contract — direct import bypasses @/features/identity/adapters/identity.adapter
- Contract Violated: Boundary Isolation Contract
- Current behavior: All three files import useIdentity from @/state/identity/identityContext directly. The approved import path is @/features/identity/adapters/identity.adapter, which re-exports useIdentity from the same context. Both paths currently resolve to identical behavior.
- Risk: (1) If identity resolution logic is ever hardened at the adapter (e.g., additional session validation, actor-type gating, deactivation guards), RootLayout, VportLeadsChip, and useVportNewLeadsCount bypass that hardening silently — all three are in the persistent shell layer that loads on every session. (2) The bypass surface is expanding quietly — each new file that imports directly makes the adapter boundary weaker.
- Severity: LOW (no exploit today — structural risk)
- Exploitability: LOW
- Attack Preconditions: Requires a future adapter hardening that the direct-import consumers would bypass; not exploitable in current source
- Blast Radius: All sessions (RootLayout is session-wide)
- Identity Leak Type: None (current behavior)
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The three affected files include RootLayout (root of every authenticated session) and useVportNewLeadsCount (polling hook that runs every 60s for VPORT owners). These are high-frequency shell-layer consumers. If identity hardening is needed in a security incident response, the direct imports are silent bypass points.
- Recommended mitigation: Update all three import paths to @/features/identity/adapters/identity.adapter. One-line change per file; no runtime behavior change. (DEADPOOL fix proposal BUG-002 — awaiting approval.)
- Rationale: Adapter boundaries in the persistent shell layer are most critical — these components are loaded in every session and cannot be easily patched under a security incident without also patching all bypass sites.
- Follow-up command: IRONMAN, DEADPOOL (BUG-002 fix proposal)
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering
```

---

### V-BN-006 — OneSignal stale external-user binding on session expiry

```
VENOM SECURITY FINDING
- Finding ID: V-BN-006
- Location: apps/VCSM/src/shared/hooks/useOneSignalPush.js — lines 73–77
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen
- Boundary Violated: None — lifecycle gap
- Contract Violated: None declared (BEHAVIOR.md missing)
- Current behavior: logoutOneSignalExternalUser() is called in a useEffect that fires when user becomes null (explicit sign-out). If the Supabase auth session expires server-side (token refresh fails, session revoked), the React auth state may not immediately set user=null on a backgrounded or frozen tab. The OneSignal external-user association persists until the next explicit sign-out cycle.
- Risk: A device with an expired or revoked Supabase session retains its OneSignal external-user link. Push notifications targeted to that user.id will still deliver to the device until the user explicitly signs out and the logoutOneSignalExternalUser() effect fires. For deactivated or suspended accounts, this means push notifications could continue to arrive after an account action.
- Severity: LOW
- Exploitability: LOW — requires account deactivation or session revocation scenario; not directly attacker-controlled
- Attack Preconditions:
  - Account must be deactivated or session revoked server-side
  - User must not explicitly sign out (app must remain in a backgrounded/stale state)
- Blast Radius: Single actor
- Identity Leak Type: None
- Cache Trust Type: Identity-sensitive
- RLS Dependency: NONE
- Why it matters: Account lifecycle events (deactivation, moderation suspension, force sign-out) should cleanly sever push notification delivery. Current implementation depends on the user explicitly triggering a React sign-out to fire the cleanup effect.
- Recommended mitigation: On auth session refresh failure (caught in AuthProvider), proactively call logoutOneSignalExternalUser() before clearing user state. Alternatively, the backend send-push-notification edge function should verify account status before sending to prevent delivery to deactivated users regardless of client-side state.
- Rationale: Defense-in-depth — client-side cleanup alone is insufficient for lifecycle security; backend verification is the stronger guarantee.
- Follow-up command: IRONMAN (ownership of account lifecycle contract), LOGAN (document lifecycle cleanup requirement in BEHAVIOR.md when written)
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security Operations
```

---

### V-BN-007 — noti:refresh DOM event — unauthenticated force-invalidation surface

```
VENOM SECURITY FINDING
- Finding ID: V-BN-007
- Location: apps/VCSM/src/shared/components/BottomNavBar.jsx — line 45
            apps/VCSM/src/bootstrap/bootstrap.hydrate.controller.js — lines 44–47
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen
- Boundary Violated: None (requires XSS precondition)
- Contract Violated: None
- Current behavior: BottomNavBar dispatches window.dispatchEvent(new Event('noti:refresh')) when the user navigates to /notifications or /chat routes. Any script running on the same origin can dispatch the same event. The bootstrap hydration controller listens for this event and calls queryClient.invalidateQueries() for both notificationUnread and chatUnread query keys.
- Risk: Any injected script (XSS) can spam window.dispatchEvent(new Event('noti:refresh')) to repeatedly invalidate and force badge count re-fetches. This does not expose sensitive data (badge counts are small integers) but does create a minor amplification path: (1) elevated Supabase query traffic from the victim's session; (2) could be used to detect network connectivity and session liveness by observing re-fetch behavior (timing side-channel). The event string 'noti:refresh' is also a global contract — any future consumer added that performs more sensitive work on this event would inherit this exposure.
- Severity: LOW
- Exploitability: LOW (requires prior XSS)
- Attack Preconditions: Prior XSS on same origin required
- Blast Radius: Single actor (one session)
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Global untyped DOM events are an expansion surface. Today the handler does only cache invalidation; if a future handler on this event performs a write or exposes more sensitive data, the attack surface silently grows. Keeping the event string as a private constant and documenting that only read-invalidation is allowed on this event limits future misuse.
- Recommended mitigation: Extract 'noti:refresh' to a named constant in the bootstrap module (e.g. BOOTSTRAP_EVENTS.notiRefresh). Add a comment that this event MUST ONLY trigger read invalidation — never writes or sensitive queries. This enforces intent at the code level and limits future misuse. Full fix to CustomEvent with a typed payload and an allowlist of consumers would be a stronger mitigation.
- Rationale: Information minimization — unnamed global events are harder to audit and easier to misuse as the codebase grows.
- Follow-up command: LOKI (trace event in runtime)
- CISSP Domain:
  - Primary: Communication and Network Security
  - Secondary: Software Development Security
```

---

## MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| V-BN-001 (BEHAVIOR.md missing) | No security contract for session-critical component | Documentation | P1 | App | LOGAN |
| V-BN-002 (user.id → OneSignal) | Auth UUID at third party; stale binding; privacy gap | Documentation, Controller | P2 | App / Security | IRONMAN, LOGAN |
| V-BN-003 (window.OneSignal writable) | XSS amplification — auth UUID exfiltration | UI | P3 | App / Security | ELEKTRA |
| V-BN-004 (adapter bypass — profiles controller) | Silent bypass if controller gains auth guards | UI, Documentation | P2 | App | DEADPOOL (BUG-003) |
| V-BN-005 (identity adapter bypass ×3) | Silent bypass if adapter gains hardening | UI | P3 | App | DEADPOOL (BUG-002) |
| V-BN-006 (OneSignal stale on session expiry) | Push delivery after account lifecycle event | Controller, Documentation | P2 | App | IRONMAN, LOGAN |
| V-BN-007 (noti:refresh global event) | XSS amplification — query spam | UI, Documentation | P3 | App | LOKI |

---

## SECURITY RISK SUMMARY

```
SECURITY RISK FINDINGS
Missing authorization:    NONE — BottomNavBar has no write paths and no auth decisions
Identity misuse:          V-BN-005 (identity adapter bypass ×3 sites — structural)
                          V-BN-002 (user.id external linkage — design concern)
Sensitive data exposure:  V-BN-002 (auth UUID to OneSignal third-party)
                          V-BN-003 (XSS amplification of auth UUID)
Unsafe debug leakage:     NONE — performance.mark() calls are DEV-gated (import.meta.env.DEV)
Policy assumption risks:  NONE — no DB writes in this component; RLS not in scope
Dependency boundary risks: V-BN-004 (profiles controller direct import)
                            V-BN-005 (identity context direct import ×3)
```

---

## VENOM RECOMMENDATION

**VENOM: CAUTION**

BottomNavBar has no critical or high-severity exploitable vulnerabilities in its current source. The shell is well-structured: UUID validation before polling activates, DEV-gated debug instrumentation, clean actor-switch isolation via React Query key scoping, and OneSignal error handling with dev-only warnings.

The risk profile is primarily **structural and privacy-layer**:
- The missing BEHAVIOR.md leaves the most session-critical component in VCSM without a security contract (V-BN-001 HIGH)
- The Supabase auth UUID is shared with OneSignal without documented DPA coverage (V-BN-002 MEDIUM)
- Three adapter boundary violations in the persistent shell layer create silent bypass paths for future hardening (V-BN-004 MEDIUM, V-BN-005 LOW)

DEADPOOL's three fix proposals (BUG-001/002/003) directly resolve V-BN-004 and V-BN-005. The security blocker is the missing BEHAVIOR.md contract — that is the only HIGH finding.

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | V-BN-001 — no behavior contract |
| Asset Security | 1 | V-BN-002 — auth UUID third-party sharing |
| Security Architecture and Engineering | 4 | V-BN-003, V-BN-004, V-BN-005, V-BN-006 (secondary) |
| Communication and Network Security | 1 | V-BN-007 — global DOM event surface |
| Identity and Access Management | 3 | V-BN-002 (primary), V-BN-005 (secondary), V-BN-006 (primary) |
| Security Assessment and Testing | 1 | V-BN-001 (secondary) — no test contract possible without BEHAVIOR.md |
| Security Operations | 1 | V-BN-006 (secondary) — stale push on lifecycle event |
| Software Development Security | 5 | V-BN-003 (primary), V-BN-004 (secondary), V-BN-005 (primary), V-BN-007 (secondary) |

Uncovered CISSP Domains:
- None were excluded by scope; all 8 domains reviewed against source evidence.
- Upload / Media Risks: N/A — BottomNavBar has no upload or media surfaces.
- Database Policy Assumptions: N/A — no DB writes in this component.

---

## Source Read Summary

| File | Read Status | Notes |
|---|---|---|
| apps/VCSM/src/shared/components/BottomNavBar.jsx | FULL READ (173 lines) | Primary subject |
| apps/VCSM/src/app/layout/RootLayout.jsx | FULL READ (105 lines) | Shell mount owner |
| apps/VCSM/src/shared/hooks/useOneSignalPush.js | FULL READ (93 lines) | Push identity binding |
| apps/VCSM/src/services/onesignal/onesignalClient.js | FULL READ | External SDK wrapper |
| apps/VCSM/src/bootstrap/bootstrap.hydrate.controller.js | FULL READ (52 lines) | Badge polling lifecycle |
| apps/VCSM/src/bootstrap/bootstrap.selectors.js | FULL READ (44 lines) | React Query badge hooks |
| apps/VCSM/src/bootstrap/bootstrap.store.js | FULL READ (26 lines) | Zustand hydration state |
| apps/VCSM/src/features/profiles/controller/buildActorCanonicalSlug.controller.js | FULL READ (130 lines) | getCachedActorCanonicalSlug |
| apps/VCSM/src/features/profiles/adapters/profiles.adapter.js | FULL READ (3 lines) | Confirmed surface gap |
| apps/VCSM/src/features/identity/adapters/identity.adapter.js | FULL READ (6 lines) | Confirmed adapter boundary |
| apps/VCSM/src/features/dashboard/vport/components/VportLeadsChip.jsx | FULL READ (89 lines) | Shell chip — identity bypass |
| apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount.js | FULL READ (51 lines) | Leads polling — identity bypass |
| ZZnotforproduction/APPS/VCSM/features/shared/BEHAVIOR.md | READ | PLACEHOLDER stub |
| ZZnotforproduction/APPS/VCSM/features/shared/SECURITY.md | READ | Prior VENOM + BW findings ingested |

Full Rediscovery Performed: YES (no scanner evidence-bundle; all findings sourced from direct file reads)
