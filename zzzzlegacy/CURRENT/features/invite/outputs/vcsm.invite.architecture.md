# Module Architecture Report — vcsm.invite
# Generated: 2026-06-02
# Ticket: ARCHITECT-INVITE-0001
# ARCHITECT §26.11 — Dated Immutable Module Report
# Status: IMMUTABLE — do not edit; supersede with a new dated report

---

# invite — Full Module Architecture Report

## Report Header

| Field | Value |
|---|---|
| Feature | invite |
| App | VCSM |
| Security Tier | MEDIUM (DR_STRANGE entry: upgraded to HIGH pending VENOM audit) |
| Feature Status | ACTIVE |
| Base Source Path | `apps/VCSM/src/features/invite/` |
| Architecture State | EVOLVING |
| Module Status | MOSTLY COMPLETE |
| Run Date | 2026-06-02 |
| Ticket | ARCHITECT-INVITE-0001 |
| Prior ARCHITECT Evidence | Intake-evidence-only entry in prior ARCHITECTURE.md (NOT_AUDITED status) |
| Prior ARCHITECTURE.md | Replaced by this report + canonical ARCHITECTURE.md |

---

## Feature Overview

The invite feature provides the standalone citizen-invite issuance surface for the VCSM
platform. A logged-in citizen or VPORT actor navigates to `/invite`, enters a target email
address, and dispatches a platform invite via the `send-citizen-invite` Supabase Edge
Function. The controller enforces email format validation and inviter-type discrimination
(`citizen` | `vport`) before delegating to the DAL. On success the screen auto-navigates
back and the onboarding step card refreshes to a completed state.

**Scope boundary:** This module covers only `apps/VCSM/src/features/invite/`. The related
surfaces — join/acceptance path (`features/join/`), dashboard team-invite
(`features/dashboard/vport/`), and the `send-citizen-invite` Edge Function — are separate
modules. They share the trust boundary domain but are governed independently.

**Source Path:** `apps/VCSM/src/features/invite/`
**Engine Path:** None — feature-only. No engine imports detected.

---

## Layer Presence

| Layer | Present | Path |
|---|---|---|
| Controllers | YES | `apps/VCSM/src/features/invite/controller/invite.controller.js` |
| DALs | YES | `apps/VCSM/src/features/invite/dal/invite.dal.js` |
| Models | NO | None — no model/transformer layer |
| Hooks | YES | `apps/VCSM/src/features/invite/hooks/useInvite.js` |
| Screens | YES | `apps/VCSM/src/features/invite/screens/` (3 files) |
| Components | NO | None — all UI is inline in screens |
| Adapters | NO | No public adapter boundary exists (gap — ARCH-INVITE-001) |
| Engine controllers | NO | None |
| Engine DALs | NO | None |

---

## Active Controllers

| Controller | Purpose | Auth Gate |
|---|---|---|
| `ctrlSendCitizenInvite` | Validates email (regex) + inviterType enum (`citizen`|`vport`), delegates to `sendCitizenInviteDAL`. Returns `{ ok, code? }`. | Input validation only. No `requireUser()` or session assertion. ProtectedRoute at router level is sole auth enforcement. |
| `codeToInviteMessage` | Pure utility — maps error code strings to UI-safe messages. | None — stateless pure function. |

**Auth gate assessment:** The controller does not call `requireUser()`, `assertActorOwnsVportActorController()`, or any session check internally. Authentication is delegated to the ProtectedRoute wrapper at the router. The `inviterActorId` value (sourced from `useIdentity()`) is passed to the Edge Function without a controller-layer ownership assertion.

---

## Active DALs

| DAL | Tables / RPCs | Notes |
|---|---|---|
| `sendCitizenInviteDAL` | `supabase.functions.invoke('send-citizen-invite')` (POST) | No direct table queries. All DB state managed by Edge Function. Edge Function writes to `vc.vibe_invites` server-side. No `select('*')` usage. |

**Edge Function dependency:** The `send-citizen-invite` Edge Function carries two open
critical findings: BLOCK-INVITE-003 (O(n) `listUsers()` call — email enumeration oracle,
DB-BLOCKED) and BLOCK-INVITE-004 (wildcard CORS — any origin can trigger this write surface).

---

## Active Hooks

| Hook | What It Calls | Purpose |
|---|---|---|
| `useInvite` | `ctrlSendCitizenInvite`, `codeToInviteMessage`, `useIdentity()` | Full form view-model. Manages `email`, `sending`, `success`, `error`, `rawDebugError` state. Derives `inviterType` and `inviterActorId` from identity. Exposes `send()` and `reset()` callbacks. |

**DEV probe:** `rawDebugError` state and `import.meta.env.DEV`-gated debug branches exist
in both `useInvite.js` and `InviteView.jsx`. Correctly guarded — not present in production
builds. Inline comments mark these for removal once CORS and invite tracking are confirmed.

---

## Engine Dependencies

None. No imports from `engines/` detected anywhere in the feature tree.

---

## Cross-Feature Dependencies

| Feature | Import | Direction | Compliant |
|---|---|---|---|
| `identity` | `useIdentity()` via `@/features/identity/adapters/identity.adapter` | invite → identity | YES — public adapter |
| `auth` | `authTheme` via `@/features/auth/adapters/auth.adapter` | invite → auth (styles only) | YES — public adapter |

Both imports consume the foreign feature's public adapter. No internal file imports detected. Compliant with the adapter boundary rule.

---

## Authorization Pattern

**Pattern: ProtectedRoute delegation with no controller-layer defense-in-depth.**

- `/invite` is registered inside a ProtectedRoute in `app.routes.jsx` (confirmed).
- The controller performs only input validation — no session assertion, no ownership check.
- `inviterActorId` is sourced from `useIdentity()` (client-side) and passed to the Edge Function unverified.
- The Edge Function is the only server-side enforcement point and carries open security findings.

**Risk level:** MEDIUM for the standalone module. No route bypasses were found. The actor identity surface is correct (read via adapter). The principal risk is that Edge Function trust enforcement is incomplete (wildcard CORS + open email enumeration finding).

---

## Module Independence Classification

**MOSTLY INDEPENDENT**

The standalone module has a clean internal stack with no engine dependencies and only two compliant cross-feature adapter imports. It does not share DAL files with other features. Coupling concern: unguarded `inviterActorId` passthrough to Edge Function without controller-layer ownership assertion.

---

## Architecture State

**EVOLVING**

The feature was recently refactored from auth-based to product-based invites. The current implementation (Edge Function delegation, no direct DB table writes) is clean and consistent with the refactored model. Open items driving EVOLVING state: no public adapter boundary, DEV probe cleanup pending, `inviterActorId` passthrough unasserted, Edge Function security findings open.

---

## Known Structural Risks

| Risk | ID | Severity | Status |
|---|---|---|---|
| No public adapter on features/invite/ | ARCH-INVITE-001 | LOW | OPEN |
| DEV probe code not cleaned up (rawDebugError) | ARCH-INVITE-004 | LOW | OPEN |
| inviterActorId unverified at controller layer | — | MEDIUM | OPEN |
| O(n) listUsers() email enumeration oracle (Edge Function) | BLOCK-INVITE-003 | HIGH | DB-BLOCKED |
| Wildcard CORS on send-citizen-invite Edge Function | BLOCK-INVITE-004 | HIGH | OPEN |
| No model/transformer layer (flat response passthrough) | — | LOW | ACCEPTED |
| Zero test coverage | — | MEDIUM | OPEN |

---

## Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Controller JSDoc, InviteView copy, DR_STRANGE.md | Clear — citizen/vport invite issuance |
| Owner defined | PARTIAL | DR_STRANGE: "VPORT onboarding team" | IRONMAN not run on standalone module |
| Entry points mapped | PASS | `/invite` → ProtectedRoute confirmed in app.routes.jsx | — |
| Controllers present | PASS | `invite.controller.js` — 1 controller, 2 exports, clean | — |
| DAL/repository present | PASS | `invite.dal.js` — 1 DAL, Edge Function delegation | No direct DB queries — all via Edge Function |
| Models/transformers | FAIL | None found | No normalization of Edge Function response shape |
| Hooks/view models | PASS | `useInvite.js` — complete form view-model | DEV probe pending cleanup |
| Screens/components | PASS | 3 screen files — InviteScreen, InviteView, styles | Functional; no reusable component extraction |
| Authorization path mapped | PARTIAL | ProtectedRoute confirmed; no controller-layer assertion | inviterActorId unverified; Edge Function is sole server gate |
| Engine dependencies mapped | N/A | No engine imports detected | Not applicable |
| Tests/validation noted | FAIL | SPIDER-MAN: NEVER RUN | Zero test coverage |

---

## Recommended Handoffs

| Command | Priority | Reason |
|---|---|---|
| VENOM | P0 — MANDATORY | Standalone module has never been security-audited. Required before THOR gate. |
| ELEKTRA | P0 — MANDATORY | Precision source-to-sink trace on `inviterActorId` passthrough; Edge Function CORS + ownership enforcement. |
| SPIDER-MAN | P1 | Zero test coverage. Baseline regression coverage for email validation, inviterType gate, success/error state. |
| IRONMAN | P2 | Define canonical ownership for standalone module; confirm integration with join/dashboard invite surfaces. |
| CARNAGE | P2 | DB migration sprint for SECURITY DEFINER RPC to replace O(n) `listUsers()` in Edge Function (BLOCK-INVITE-003). |

---

## Final Module Status

**MOSTLY COMPLETE**

The standalone `features/invite/` module has a fully functional layered implementation
(controller → DAL → hook → screen) consistent with the product-based invite refactor. What
is missing: a model layer, a public adapter boundary, zero test coverage, and unresolved
Edge Function security findings. The module is production-functional but governance-
incomplete with open THOR blockers inherited from the broader invite domain.

---

## ARCHITECT Run Record

| Field | Value |
|---|---|
| Date | 2026-06-02 |
| Ticket | ARCHITECT-INVITE-0001 |
| Architecture State | EVOLVING |
| Prior Status | NOT_AUDITED (standalone module — first full source scan) |
| Source Files Scanned | 6 files |
| Engine Deps | 0 |
| Cross-Feature Imports | 2 (both via public adapters — compliant) |
| Test Coverage | 0% |
| THOR Status | BLOCKED |
| Recommended Next | VENOM + ELEKTRA on standalone module |
