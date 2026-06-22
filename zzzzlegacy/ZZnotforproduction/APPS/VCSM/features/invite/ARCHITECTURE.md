---
name: vcsm.invite.architecture
description: ARCHITECT V2 module architecture report for VCSM:invite
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** invite
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/invite
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The invite module allows authenticated VCSM Citizens (and VPORT actors) to send email-based invitations to non-members. It collects a target email address, validates it client-side, derives the inviter identity from the active actor session, and delegates delivery to the `send-citizen-invite` Supabase Edge Function — keeping the service-role key server-side. The module integrates with the onboarding step tracking system (server-side upsert) and provides immediate UI feedback (success, error, loading) with a 2-second auto-navigate-back on success.

## OWNERSHIP

Platform growth / onboarding domain. The module is self-contained with a single outbound trust boundary (the Edge Function). It is consumed by the app navigation stack (onboarding card → invite screen) and does not own any in-app domain entity beyond the transient invite request.

## ENTRY POINTS

- `apps/VCSM/src/features/invite/screens/InviteScreen.jsx` — primary route screen, sets `document.title`, renders `InviteView`
- `apps/VCSM/src/features/invite/screens/InviteView.jsx` — functional view: email input, sender badge, success/error/loading states
- No route-map registration detected (no `public` route annotation in scanner); accessed via internal navigation from onboarding flow

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 1 | invite.dal.js |
| Model | 0 | N/A |
| Controller | 2 | invite.controller.js (ctrlSendCitizenInvite, codeToInviteMessage) |
| Service | N/A | — |
| Adapter | 0 | None — feature accessed directly via screen from nav |
| Hook | 1 | useInvite.js |
| Component | 0 | No standalone component files (view is embedded in screen files) |
| Screen | 3 | InviteScreen.jsx, InviteView.jsx, InviteView.styles.js |
| Barrel | 0 | No index barrel files |

Callgraph counts (cg): Controller: 2, DAL: 1, Hook: 1, Screen: 3.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Source + BEHAVIOR.md (placeholder) | BEHAVIOR.md is a stub — no formal contract |
| Owner defined | PARTIAL | Inferable from source; no ownership record | OWNERSHIP.md or IRONMAN record absent |
| Entry points mapped | PASS | InviteScreen.jsx is the clear entry point | Route not registered in route-map scanner |
| Controllers present/delegated | PASS | 2 controller symbols in invite.controller.js | — |
| DAL/repository present/delegated | PASS | invite.dal.js; delegates to Edge Function | No direct DB table writes — Edge Function boundary |
| Models/transformers present | FAIL | 0 model files | No response shape modeled; result used raw |
| Hooks/view models present | PASS | useInvite.js — complete state machine | DEV PROBE console artifacts remain in hook |
| Screens/components present | PASS | InviteScreen + InviteView + styles | No dedicated component files |
| Services/adapters present | FAIL | 0 adapter files | No public adapter boundary — consumers import screens directly |
| Database objects mapped | PARTIAL | Edge Function handles actor_onboarding_steps upsert server-side | No client-side write surface to DB tables |
| Authorization path mapped | PARTIAL | Identity derived from useIdentity() → kind/actorId | No explicit auth guard on InviteScreen — unprotected if routing misconfigured |
| Cache/runtime behavior mapped | PARTIAL | Stateless per-request; no cache layer | No error retry logic; single-shot send |
| Error/loading/empty states mapped | PASS | sending, error, success all handled in useInvite + InviteView | — |
| Documentation linked | FAIL | BEHAVIOR.md is a stub (Status: PLACEHOLDER) | Full behavior contract never authored |
| Tests/validation noted | FAIL | 0 tests | No unit tests for controller validation or DAL error paths |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS | identity engine via useIdentity adapter | Single engine dependency, correctly accessed through adapter |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/identity | Engine | Inbound (consumed) | YES — via @/features/identity/adapters/identity.adapter | useInvite reads identity.kind and identity.actorId |
| Supabase Edge Function: send-citizen-invite | External service | Outbound | YES — server-side execution | Service-role key stays server-side; client passes body params only |
| supabase client | Service | Outbound | YES — via @/services/supabase/supabaseClient | Standard client used for functions.invoke |
| react-router-dom | UI routing | Inbound | YES | useNavigate used in InviteView for back-navigation after success |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| send-citizen-invite Edge Function | edge_function (write) | Supabase Edge / server | invite.dal.js → invite.controller.js → useInvite | Medium — email dispatch; self-invite and duplicate checks handled server-side |
| identity (kind, actorId, displayName) | read | identity engine | useInvite.js | Low — read-only, consumed via approved adapter |
| actor_onboarding_steps (upsert) | edge_function write (server-side) | Edge Function | Not visible to client | Low — side-effect of successful invite; no client exposure |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | READY | InviteScreen renders InviteView directly | No route guard confirmed in scanner — relying on nav-stack protection |
| Loading state | READY | `sending` boolean drives button disabled + label "Sending…" | — |
| Empty state | READY | Button disabled when email is empty | — |
| Error state | READY | `error` string rendered in InviteView; CODE_MESSAGES map covers 6 error codes | DEV PROBE rawDebugError leaks internal JSON in dev |
| Auth/owner gates | PARTIAL | inviterType/actorId derived from identity; no explicit screen-level auth guard | If screen rendered unauthenticated, identity will be null; inviterType defaults to 'citizen' |
| Cache behavior | N/A | No caching — stateless per invocation | — |
| Runtime dependencies | READY | Supabase client + Edge Function; identity adapter | DEV PROBE comments in hook and view signal transient state — should be cleaned up |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/invite/BEHAVIOR.md | PRESENT (stub only) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | N/A | No DB migrations owned by this module |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a placeholder | HIGH | The feature has no formal behavior contract; success/failure paths, error codes, and Edge Function response shape are undocumented | LOGAN |
| No public adapter file | MEDIUM | No `invite.adapter.js` means any consumer that wants to link to the invite screen must reach into internals or rely on routing alone; violates adapter boundary contract | IRONMAN |
| No model for Edge Function response | MEDIUM | `sendCitizenInviteDAL` returns raw `data` from the Edge Function with no shape validation or normalization | IRONMAN |
| 0 tests | MEDIUM | Controller has validation logic (EMAIL_RE, inviterType checks) and CODE_MESSAGES mapping — none of it is tested | SPIDER-MAN |
| DEV PROBE artifacts in production bundle | LOW | `rawDebugError` state and all `import.meta.env.DEV` probe blocks are guarded but add noise; hook exports `rawDebugError` — should be removed once CORS is confirmed | IRONMAN |
| No route-map registration | LOW | Scanner found 0 routes for this feature; confirm the invite screen is protected by the authenticated app shell and not accessible unauthenticated | HAWKEYE |
| CURRENT_STATUS.md absent | LOW | No current status snapshot existed prior to this run | ARCHITECT (this run) |
| ARCHITECTURE.md absent | LOW | No architecture report existed prior to this run | ARCHITECT (this run) |

---

## MODULE BOUNDARY WARNINGS

- `useInvite.js` imports directly from `@/features/identity/adapters/identity.adapter` — this is the correct approved path via the adapter boundary. No violation.
- `InviteView.jsx` imports `useInvite` from a sibling `../hooks/useInvite` — internal only, not a cross-feature leak. No violation.
- No cross-feature DAL imports detected. No layer violations found.
- No barrel/index files expose this module's internals to the outside — the lack of an adapter is a gap, not a violation, but creates consumer risk.

---

## SPAGHETTI SCORE

**Module:** invite
**Score:** CLEAN
**Reasons:** 6 files, single responsibility, correct layer ordering (DAL → Controller → Hook → Screen), single engine dependency accessed through the approved adapter boundary, no cross-feature internal imports.
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no behavior contract authored; the file contains only a stub notice.

**Check A (Source without behavior):** FAIL — Source exists and is functional; BEHAVIOR.md is a placeholder. The contract has not been written.
**Check B (Behavior without source):** PASS — Source exists for every layer the scanner maps.
**Check C (§13 engine consistency):** PASS — Scanner declares `identity` engine; source confirms `useIdentity` imported from `@/features/identity/adapters/identity.adapter`. No undeclared engine imports found.
**Check D (§6 data change consistency):** PARTIAL — Scanner declares one write surface (`sendCitizenInviteDAL` → edge_function). Source confirms this. The Edge Function side-effect on `actor_onboarding_steps` is server-side and not visible to the client; this is correct but not documented anywhere.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Author BEHAVIOR.md | Stub has been present since initial docs wave; feature is functional but formally undocumented | LOGAN |
| P2 | Create invite.adapter.js | Expose InviteScreen to the app nav via an approved adapter boundary | IRONMAN |
| P3 | Add model for Edge Function response shape | Prevent silent breakage if Edge Function response schema changes | IRONMAN |
| P4 | Add controller unit tests | EMAIL_RE validation and CODE_MESSAGES lookup are testable in isolation | SPIDER-MAN |

## RECOMMENDED HANDOFFS

- **LOGAN** — Author the BEHAVIOR.md behavior contract (P1 gap)
- **IRONMAN** — Create adapter file; clean DEV PROBE artifacts from hook and view; add response model
- **SPIDER-MAN** — Add unit tests for controller validation and code message mapping
- **HAWKEYE** — Verify route registration and confirm auth-shell protection for InviteScreen

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
