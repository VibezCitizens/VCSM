# Identity Stack Boundary Contract

Authored by IDENTITY-BOUNDARY-002 · 2026-06-08 · Status: ACTIVE
Source reviews: IDENTITY-BOUNDARY-001, IDENTITY-BOUNDARY-MASTER-001 (read-only)

This contract defines who owns what across the identity stack and which imports
are allowed. It is the reference for the IDENTITY-BOUNDARY extraction program.
It documents boundaries only — it changes no runtime behavior.

---

## 1. Domain Ownership (one sentence each)

| Domain | Owns | Folder |
|---|---|---|
| **Identity** | Who is acting now — active actor, switching, resolution, provisioning. | `features/identity` (intended) / `state/identity` (current runtime) |
| **Actors** | Canonical actor rows and the actor registry / directory. | `features/actors` |
| **Hydration** | Enriching `actorId`/`kind` into display data. | `features/hydration` (VCSM) + `engines/hydration` (orchestration) |
| **Authorization** | Whether an actor may perform an action (`vc.actor_owners`). | `features/authorization` |
| **Engines** | App-agnostic platform orchestration (identity resolution, hydration registry). | `engines/identity`, `engines/hydration` |
| **state/** | **Temporary** live identity runtime until migration completes. | `state/identity` (legacy) |

---

## 2. features/identity — Allowed vs Forbidden

**Allowed (final responsibilities):**
- active actorId / kind state
- IdentityProvider + useIdentity public surface
- switchActor (app wrapper around the engine decision)
- identity resolution effect + self-heal orchestration
- selected-actor storage
- identity-engine query bridge / cache invalidation calls
- platform provisioning (bootstrap RPC)

**Forbidden (belongs to another domain):**
- authorization decisions or `vc.actor_owners` checks → `features/authorization`
- profile/vport display hydration + mappers → `features/hydration`
- canonical actor-row reads (`readActorById`) → `features/actors`
- business-feature logic (booking, dashboard, etc.)

---

## 3. Migration Status (as of 2026-06-08)

- **Runtime physically lives in `state/identity`** (11 of 12 runtime responsibilities).
  `features/identity` is currently a **façade** that re-exports the live provider.
- **Provisioning** already lives in `features/identity` ✅.
- The `state/identity ⇄ features/identity` coupling is a **folder-level bidirectional
  dependency, NOT a true ESM import cycle** (the provisioning subtree has zero
  back-edges). It is architectural debt, not a runtime hazard. It dissolves during
  the runtime migration (IDENTITY-BOUNDARY-006).

### Known temporary imports (do not add more)
| Edge | File | Class |
|---|---|---|
| identity → state/identity | `features/identity/adapters/identity.adapter.js:6` (`IdentityProvider`, `useIdentity`) | TEMPORARY (façade) |
| identity → state/identity | `features/identity/hooks/useActiveActorState.js:1` (`useIdentityDetailsDeprecated`) | TEMPORARY |
| state/identity → identity | `state/identity/identitySelfHeal.controller.js:2` (`ensureVcsmPlatformBootstrap`) | VIOLATION (only state→features edge) |
| hydration → state/identity | `features/hydration/vcsmActorHydrator.js:1-12` (mappers + display DALs) | VIOLATION (mappers in wrong folder) |

---

## 4. Rules (enforced going forward)

1. **No new direct production imports from `state/identity`.** Use
   `features/identity/adapters/identity.adapter` instead.
2. All cross-feature identity access enters through
   `features/identity/adapters/identity.adapter.js`. No importing `controllers/`,
   `dal/`, or `model/` directly.
3. **Authorization must not move into identity.** Ownership decisions stay in
   `features/authorization`.
4. **Hydration mappers must not move into identity.** `mapProfileActor` /
   `mapVportActor` and display DALs belong in `features/hydration`.
5. No new `vc.actor_owners` readers outside `features/authorization`
   (plus the documented `features/auth/onboarding` exception).
6. Engines stay app-agnostic — no VCSM/React/feature/Supabase-client imports.

---

## 5. Extraction Program — Ticket Map

| Ticket | Phase | Scope |
|---|---|---|
| IDENTITY-BOUNDARY-002 | 0 + 1 | This contract + dead-code cleanup (done) |
| IDENTITY-BOUNDARY-003 | 2 | Authorization adopt-or-freeze decision |
| IDENTITY-BOUNDARY-004 | 3 | Actor-row read consolidation → `features/actors` |
| IDENTITY-BOUNDARY-005 | 4 | Hydration mapper/DAL extraction → `features/hydration` |
| IDENTITY-BOUNDARY-006 | 5 + 6 | Identity runtime migration (cycle dies here) + state cleanup |

Do not start a later phase before the earlier one lands.
