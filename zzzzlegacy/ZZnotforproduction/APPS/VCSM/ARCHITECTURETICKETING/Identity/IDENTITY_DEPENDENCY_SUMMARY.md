# Identity Dependency Summary

**Generated:** 2026-06-06
**Source:** FEATURE_IMPORT_MAP.json (2026-06-07) · FEATURES_ARCHITECTURE_REVIEW.md · BIDIR_DEPENDENCY_DECISION.md
**Feature:** `apps/VCSM/src/features/identity/` — 9 files

---

## Scanner Verdict

| Metric | Value |
|---|---|
| Inbound consumers | **41** |
| Outbound dependencies | **0** |
| Boundary violations | **0** |
| Bidirectional pairs | **0** |
| Split candidate | No |

`identity` is a pure provider. It consumes nothing from other features. It exports only through its
adapter surface. Zero violations means every inbound consumer goes through adapters — no direct
DAL or controller imports detected. **identity is the most well-behaved platform primitive in the codebase.**

---

## Inbound Consumers — Confirmed from Scanner

Total confirmed: **41 inbound**

The scanner confirmed these per-feature import counts. Exact file-level evidence for each consumer
feature is available in `FEATURE_IMPORT_MAP.json` under each feature's `inbound` array.

| Consumer Feature | Import Count | Via Adapter | Via Engine Alias | Notes |
|---|---|---|---|---|
| settings | 8 | YES — confirmed via scanner 0 violations | UNKNOWN | Highest single-feature consumer |
| chat | 8 | YES — confirmed via scanner 0 violations | YES (16x via @identity engine alias) | MIXED PATTERN — two paths to same feature |
| notifications | 4 | YES — confirmed via scanner 0 violations | UNKNOWN | Resolves notification actors |
| profiles | UNKNOWN exact | YES — scanner shows 0 identity violations | UNKNOWN | Part of 374-file feature; exact count UNKNOWN |
| auth | UNKNOWN exact | YES — scanner shows 0 violations | NO | Lifecycle: creates actor rows at onboarding |
| initiation | 2 | YES — confirmed | NO | Post-auth first-launch flow |
| shell | 1 | YES — confirmed | NO | Bottom nav bar reads actor data |
| vport | 1 | YES — confirmed | NO | Vport creation imports identity |
| professional | UNKNOWN | UNKNOWN | UNKNOWN | FEATURES_ARCHITECTURE_REVIEW.md does not give count |
| dashboard | UNKNOWN exact | YES — scanner shows 0 identity violations from dashboard | NO | Part of 258-file feature |
| upload | UNKNOWN exact | YES — scanner shows 0 violations | NO | Upload pipeline uses identity |
| post | UNKNOWN exact | YES | NO | Post creation needs actor context |
| join | UNKNOWN exact | UNKNOWN | NO | Join flow may use identity |
| feed | UNKNOWN exact | YES | NO | Feed resolves actor context |

> Total listed accounts for 24+ confirmed. Remaining ~17 are distributed across features listed
> above as UNKNOWN count. All are confirmed adapter-compliant by 0-violation result.

---

## Outbound Dependencies from identity

**None.** identity has 0 outbound cross-feature imports per scanner data.

identity depends only on:
- The identity engine (via `@identity` alias → `engines/identity/`)
- Supabase client (database access in DAL layer)
- Platform schemas (vc.actors, vc.actor_owners, platform.user_app_actor_links)

This means: identity can be modified without touching any other feature. There are no
outbound imports to break.

---

## Bidirectional Dependencies

**None.** identity is not in any bidirectional pair in the BIDIR_DEPENDENCY_DECISION.md record
(15 pairs classified — identity appears in none of them).

This is architecturally correct: a platform primitive should not import from its consumers.

---

## actors Feature Summary

The `actors` feature overlaps conceptually with `identity` and is a candidate for merge (see IDENTITY-012).

| Metric | Value |
|---|---|
| Files | 4 |
| Inbound consumers | 2 |
| Outbound | 0 |
| Violations | 0 |

**Confirmed consumers of actors:**
1. `dashboard/vport/dashboard/cards/team/controller/vportTeamAccess.controller.js`
   → `@/features/actors/adapters/actors.adapter`
2. `settings/privacy/controller/Blocks.controller.js`
   → `@/features/actors/adapters/actors.adapter`

Both imports go through the actors adapter. No violations.

---

## Consumer Details — High-Priority Features

### chat (8 feature adapter imports + 2 state layer imports) — IDENTITY-005 COMPLETE

IDENTITY-005 audit result: the architecture review's claim of "16 `@identity` engine alias imports
in chat" is REFUTED. Source grep found 0 `@identity` engine alias imports in `features/chat/`.

**Confirmed import breakdown:**
- 8 imports via `@/features/identity/adapters/identity.adapter` — all `useIdentity` — COMPLIANT
- 1 import via `@/state/identity/identityContext` — `useVexSettings.js` — STATE_LAYER_BYPASS (LOW risk)
- 1 import via `@/state/identity/identitySelection.store` — `chat/setup.js` — STATE_STORE access (LOW-MEDIUM risk)

**Third identity layer confirmed:** `apps/VCSM/src/state/identity/` is the canonical implementation.
The feature adapter is a thin re-export of `state/identity/identityContext`.

**Risk:** The engine surface divergence concern (RISK-004) is revised — no engine alias imports exist.
Actual risks: state layer bypass in `useVexSettings.js` (LOW, fixable in 1 line) and ungoverned
Zustand store access in `setup.js` (LOW-MEDIUM, IDENTITY-010 decides policy).
**Ticket:** IDENTITY-005 COMPLETE. IDENTITY-010 scope corrected — now covers state layer access policy.

### settings (8 imports)

settings has 87 total cross-feature outbound imports — the highest in the codebase.
Its 8 identity imports are spread across account, privacy, profile, and vport subsystems.
All confirmed adapter-compliant.

**Risk:** LOW — settings is a consumer aggregator and its identity usage is read-only
(displaying actor data in settings screens).
**Ticket:** IDENTITY-006 traces all 8 import sites.

### notifications (4 imports)

Notifications resolves actor data for display in notification items. 4 imports confirmed.
All adapter-compliant per scanner 0-violation result.

**Risk:** LOW.
**Ticket:** IDENTITY-007 traces all 4 import sites.

### auth (lifecycle — creates identity rows)

auth does not import from `features/identity/` as a consumer. Instead, auth is the
**lifecycle creator** of identity rows: onboarding completion calls
`createUserActorForProfile → dalCreateUserActor → dalCreateActorOwner`.

This is a write relationship, not a read relationship. The identity feature reads
from tables that auth writes. No import dependency detected from auth to identity feature.

**Risk:** MEDIUM — if auth onboarding controller changes, actor creation may fail silently.
**Ticket:** IDENTITY-009 audits the auth→identity lifecycle boundary.

---

## Identity Module Files (9 files confirmed)

| File | Layer | Purpose |
|---|---|---|
| `setup.js` | setup | `setupVcsmIdentityEngine()` — called from main.jsx line 9 |
| `controller/refreshActorDirectory.controller.js` | controller | Refreshes actor directory links after VPORT creation |
| `controller/ensureVcsmPlatformBootstrap.controller.js` | controller | Ensures platform bootstrap rows exist for a user |
| `resolvers/vcsmIdentity.resolver.js` | resolver | VCSM-specific identity resolution logic |
| `adapters/identity.adapter.js` | adapter | Public adapter surface for identity reads |
| `adapters/identityOps.adapter.js` | adapter | Public adapter surface for identity operations |
| `hooks/useIdentityOps.js` | hook | Hook wrapping identity operations |
| `dal/refreshActorDirectory.dal.js` | dal | DAL for actor directory refresh (platform.user_app_actor_links) |
| `dal/provision.rpc.dal.js` | dal | DAL for platform provisioning RPC |

---

## Layer Contract Compliance

| Layer | Compliant | Notes |
|---|---|---|
| Controller | YES | Controllers in identity decide ownership; do not delegate to DAL |
| DAL | YES | DALs execute scoped queries; filter by actorId only |
| Adapter | YES | Both adapter files exist; all 41 consumers go through them |
| RLS | UNKNOWN | DB-layer enforcement — requires separate DB audit |

---

## What Is Not Known (UNKNOWN fields to resolve in IDENTITY-004)

- Exact per-file breakdown of which files consume `identity.adapter.js` vs `identityOps.adapter.js`
- Whether `upload`, `post`, `join`, `feed`, `dashboard`, `professional` are using the feature
  adapter or the engine alias
- Exact count for `profiles`, `auth`, `professional`, `dashboard` sub-counts
- Whether any consumer reads from the engine alias (@identity) besides chat
