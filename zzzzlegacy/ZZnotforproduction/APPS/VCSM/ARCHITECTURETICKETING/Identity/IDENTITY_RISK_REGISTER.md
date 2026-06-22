# Identity Risk Register

**Generated:** 2026-06-06
**Feature:** `apps/VCSM/src/features/identity/`
**Source:** actor-first-architecture-audit.md · ACTOR_MODEL_AUDIT_2026-06-06.md · FEATURES_ARCHITECTURE_REVIEW.md

---

## Risk Summary

| Risk ID | Name | Severity | Likelihood | Impact | Status | Owning Ticket |
|---|---|---|---|---|---|---|
| RISK-001 | Session/auth confusion | HIGH | MEDIUM | Ownership assertion fails silently | Open | IDENTITY-009 |
| RISK-002 | actors vs identity overlap | MEDIUM | LOW | Import confusion; wrong boundary used | Open | IDENTITY-002 |
| RISK-003 | Adapter bypass | LOW | LOW | Scanner confirmed 0 violations — currently clean | Monitored | IDENTITY-003 |
| RISK-004 | State layer bypass + store access governance gap | LOW | MEDIUM | useVexSettings.js bypasses feature adapter; store not in adapter surface | Open — REVISED | IDENTITY-010 |
| RISK-005 | Shared actor type duplication | MEDIUM | MEDIUM | Actor types spread across identity/profiles/auth/settings | Open | IDENTITY-011 |
| RISK-006 | shell/profile coupling | LOW | LOW | Shell imports profiles.adapter for canonical slug | Open | IDENTITY-008 |
| RISK-007 | Chat realtime identity lookup | MEDIUM | MEDIUM | Chat resolves actor identity during realtime events | Open | IDENTITY-005 |
| RISK-008 | Settings fan-out | LOW | LOW | 8 identity imports across 4 settings subsystems | Monitored | IDENTITY-006 |

---

## RISK-001 — Session/Auth Confusion

**Description:**
The identity system has two ownership gates: `assertActorOwnsVportActorController` (requires
user-kind callerActorId) and `assertSessionOwnsVportActorController` (derives owner from auth
session). When a hook passes `identity.actorId` as `callerActorId` while identity is vport-kind,
the actor-based gate throws. The session-based gate does not have this restriction.

11 hooks confirmed to use the wrong gate by passing `identity.actorId` directly as `callerActorId`
without checking `identity.kind`.

**Evidence:**
- actor-first-architecture-audit.md D-002: 11 hooks affected (vportDirectoryVisibility,
  vportBusinessCardSettings, vportTeam, joinBarbershop, contentPages, publishBarbershopPortfolio,
  publishBarbershopHours, booking actions, quick booking modal, useActorPrivacy)
- actor-first-architecture-audit.md FINDING-002: Severity HIGH

**Impact:** VPORT-acting users cannot perform operations that require ownership assertion.
Dashboard settings, privacy, team management, booking actions all silently fail when the
active actor is vport-kind.

**Mitigation:**
Each affected hook must check `identity.kind` before resolving `callerActorId`:
```js
const callerActorId = identity?.kind === "user"
  ? identity.actorId
  : availableActors?.find(a => a.actorKind === "user")?.actorId ?? null;
```
Reference implementations already exist: `usePublishMenuPost.js`, `usePortfolioItemSubmit.js`,
`useUpsertVportServices.js`.

**Status:** Open — source change required. Tracked in IDENTITY-009.

---

## RISK-002 — actors vs identity Overlap

**Description:**
`features/actors/` (4 files) and `features/identity/` (9 files) serve overlapping purposes.
Both provide actor data to consumers. The boundary is undocumented.

From source analysis:
- `actors`: exposes actor search and lookup — `searchActors.controller.js`,
  `searchActors.dal.js`, `searchActors.model.js`, `actors.adapter.js`
- `identity`: exposes session-resolved actor identity — resolves the active actor from the
  auth session; wraps the identity engine

Consumers of `actors`: dashboard team card, settings privacy controller (2 total).
Consumers of `identity`: 41 features.

**Impact:** A developer adding a new identity consumer could reach for `actors/adapters/` when
they need `identity/adapters/` or vice versa. Wrong feature = wrong data shape.

**Mitigation:** Document the boundary clearly (IDENTITY-002). Planning ticket for merge (IDENTITY-012).

**Status:** Open — documentation only until IDENTITY-012.

---

## RISK-003 — Adapter Bypass

**Description:**
Scanner confirms **0 violations** for the identity feature. All 41 inbound consumers go
through identity adapters. No consumer directly imports identity DAL, controller, or internal hooks.

This is a monitored risk, not an active risk. The clean state must be preserved.

**Evidence:** FEATURE_IMPORT_MAP.md: identity violations = 0.

**Regression trigger:** If any future PR adds an import like:
- `@/features/identity/dal/...`
- `@/features/identity/controller/...`
- `@/features/identity/resolvers/...`
without going through `identity/adapters/`

**Mitigation:** The scanner's `NO_INTERNAL_WITHOUT_ADAPTER` rule will catch this if the import
map is re-run after PRs. IDENTITY-003 defines the adapter surface contract to make the boundary
explicit.

**Status:** Monitored.

---

## RISK-004 — State Layer Bypass + Store Access Governance Gap

**REVISED 2026-06-06 based on IDENTITY-005 source audit.**

**Original claim (FEATURES_ARCHITECTURE_REVIEW.md):** Chat uses `@identity` engine alias (16x) and
`@/features/identity/adapters/` (8x) simultaneously. REFUTED — source grep confirmed 0 `@identity`
engine alias imports in `features/chat/`. The architecture review claim was based on outdated or
incorrect data.

**Actual findings (IDENTITY-005):**

**Sub-risk A — State layer bypass in `useVexSettings.js` (LOW)**

`chat/inbox/hooks/useVexSettings.js:2` imports `useIdentity` from `@/state/identity/identityContext`
directly instead of through `@/features/identity/adapters/identity.adapter`.

```js
// Current (bypass):
import { useIdentity } from "@/state/identity/identityContext";
// Correct:
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
```

**Impact:** NONE currently — the feature adapter re-exports `useIdentity` from the same source.
Functionally identical. Risk is governance: if the feature adapter ever adds middleware or changes
the re-export path, `useVexSettings.js` does not benefit.

**Sub-risk B — Store access governance gap in `chat/setup.js` (LOW-MEDIUM)**

`chat/setup.js:16` imports `useIdentitySelectionStore` from `@/state/identity/identitySelection.store`
directly. This store is NOT exported by the feature adapter. The import is justified by Zustand's
`.getState()` pattern for non-React async functions.

```js
const viewerActorId = useIdentitySelectionStore.getState().activeActorId ?? null
```

**Impact:** LOW-MEDIUM. If `identitySelection.store` shape changes (`activeActorId` renamed or
removed), `chat/setup.js`'s actor search function breaks silently. No enforcement contract exists.

**Third identity layer context:**
`features/identity/adapters/identity.adapter.js` is a thin re-export of `state/identity/identityContext`.
The real implementation is in `state/identity/`. `identityContext.jsx` itself uses `@identity`
(engine alias) internally for cache invalidation — but this is in the state layer, not in features.

**Mitigation:** IDENTITY-010 decides policy: enforce adapter-only, or document state-layer access
as allowed for setup files + non-React contexts.

**Fix for Sub-risk A (if adapter-only policy):** 1-line change in `useVexSettings.js` (zero behavior).
**Fix for Sub-risk B (if adapter-only policy):** Add `getActiveActorId()` to feature adapter surface,
wrapping `useIdentitySelectionStore.getState().activeActorId`.

**Status:** Open — REVISED. Tracked in IDENTITY-010.

---

## RISK-005 — Shared Actor Type Duplication

**Description:**
Actor type definitions (kind='user' | kind='vport', identity shapes, ownership types) are
referenced across multiple features with no canonical shared type location.

`shared/types/` does not exist in the codebase.

Impact areas:
- `identity/` defines `toPublicIdentity()` shape: `{ actorId, kind, ownerActorId, realmId }`
- `auth/` defines actor creation shapes in `actorCreate.dal.js`
- `profiles/` has its own actor model references
- `settings/` reads identity fields without a shared type contract
- `booking/` uses actor ownership types

No single source of truth for: what fields an actor has, what `kind` can be, what ownership
means in type form.

**Impact:** MEDIUM. Type drift: if one feature's actor shape assumption diverges from another's,
runtime errors appear only at the integration boundary. Hard to detect without end-to-end tests.

**Mitigation:** IDENTITY-011 plans `shared/types/actors.types.js` extraction.

**Status:** Open — planning only until IDENTITY-011.

---

## RISK-006 — Shell/Profile Coupling

**Description:**
The bottom nav bar (`features/shell/`) imports from `profiles/adapters/profiles.adapter`
to resolve `useActorCanonicalSlug`. Shell should not depend on a domain feature (profiles).
Shell should receive actor data via identity context.

**Evidence:**
- BIDIR_DEPENDENCY_DECISION.md Case B: `shell/modules/bottom-bar/components/BottomNavBar.jsx:9`
  imports `useActorCanonicalSlug` from `@/features/profiles/adapters/profiles.adapter`
- FEATURES_ARCHITECTURE_REVIEW.md: "shell → profiles: Bottom nav bar importing from profile
  feature internals. Shell should receive actor data via an identity provider/context."

**Impact:** LOW. The import goes through `profiles/adapters/` (correct boundary), but the
semantic dependency is wrong: shell should depend on identity, not profiles. If profiles is
ever split (ARCH-VPORTPROFILE-001), shell's import path must update.

**Mitigation:** When ARCH-VPORTPROFILE-001 is executed, `useActorCanonicalSlug` should be
either added to `identity/adapters/` or moved to `shared/`. IDENTITY-008 notes this dependency.

**Status:** Open — low priority until profiles split.

---

## RISK-007 — Chat Realtime Identity Lookup

**Description:**
Chat has realtime state management and resolves actor identities during realtime subscription
events (e.g. new message received → lookup sender actor). If the identity engine is unavailable
or returns stale data during a realtime event, chat may render wrong actor information.

The 16 direct `@identity` engine imports in chat suggest that chat uses the engine for
realtime paths — not the feature adapter. The engine's session handling differs from the
feature adapter's VCSM hydration pipeline.

**Evidence:**
- FEATURES_ARCHITECTURE_REVIEW.md: "ChatInput.jsx, MessageBubble.jsx, ConversationView.jsx
  are all >200 lines. Component complexity is high."
- Chat has store for realtime state. Mixed @identity + feature adapter consumption.

**Impact:** MEDIUM. A realtime identity resolution failure causes wrong avatars/names in chat
without a user-visible error. Silent degradation.

**Mitigation:** IDENTITY-005 audits the 16 engine-alias sites. IDENTITY-010 decides policy.

**Status:** Open.

---

## RISK-008 — Settings Fan-Out

**Description:**
Settings has 87 total cross-feature outbound imports — the highest fan-out in the codebase.
8 of those go to identity. The settings feature has 4 subsystems (account, privacy, profile,
vports) and at least one identity import per subsystem.

**Evidence:**
- FEATURES_ARCHITECTURE_REVIEW.md: settings imports identity 8x; 9 different features total.

**Impact:** LOW. All 8 imports are adapter-compliant. Risk is organizational: with 87 total
outbound imports, settings is a change-impact amplifier. A change to identity adapter surface
could require updates in multiple settings subsystems.

**Mitigation:** IDENTITY-006 traces all 8 import sites and documents which settings operations
depend on which identity fields. This creates a change-impact map for future identity changes.

**Status:** Monitored.

---

## Risk Matrix

```
                HIGH IMPACT
                    │
  RISK-001 ─────────┤  (session/auth confusion: HIGH severity, MEDIUM likelihood)
                    │
  RISK-007 ─────────┤  (chat realtime: MEDIUM impact, MEDIUM likelihood)
  RISK-005 ─────────┤  (type duplication: MEDIUM impact, MEDIUM likelihood)
  RISK-004 ─────────┤  (alias inconsistency: MEDIUM impact, HIGH likelihood)
                    │
  RISK-002 ─────────┤  (actors overlap: MEDIUM impact, LOW likelihood)
                    │
  RISK-006 ─────────┤  (shell coupling: LOW impact, LOW likelihood)
  RISK-003 ─────────┤  (adapter bypass: LOW impact — currently clean)
  RISK-008 ─────────┤  (settings fan-out: LOW impact, LOW likelihood)
                    │
                LOW IMPACT
LOW LIKELIHOOD ─────┼───── HIGH LIKELIHOOD
```
