# Ownership — actors
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Ownership Status: PARTIAL — IRONMAN ran module-level review only (2026-05-18)
# Status: CURRENT SOURCE OF TRUTH

---

## IRONMAN Coverage

IRONMAN reviewed the actors module as part of the 2026-05-18 identity and dashboard-team-booking ownership passes. The module was classified as MOSTLY COMPLETE in the completeness matrix. No dedicated IRONMAN ownership audit has been run scoped exclusively to `apps/VCSM/src/features/actors/`.

**Finding: IRON-ACTORS-MODULE**
- Status: MOSTLY COMPLETE
- The `actors/` feature module is architecturally complete: DAL, controllers, models, and adapter are all present.
- Only gap recorded: no Logan documentation (now addressed by this governance bootstrap).
- Recommended action at time of audit: handoff to LOGAN.
- Source: `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/modules/vcsm.actors.architecture.md`

**Finding: IRON-IDENTITY-001 (adjacent — identity feature)**
- Status: PARTIAL
- Identity feature's runtime architecture is clean and boundary-compliant.
- Open sub-items that touch actor surfaces:
  - RISK-5: Dead export `resolveVcsmActorForProvisioning` queries `vc.actors` with no RLS guarantee — decision: REMOVE (no owner assigned)
  - RISK-9: `resolvers/` layer has no architecture contract taxonomy
  - Security audit missing for `provision_vcsm_identity` SECURITY DEFINER
  - Migration ownership for identity RPCs not assigned (CARNAGE task)
- Source: `2026-05-18_ironman_identity-feature-ownership.md`

---

## Classification History

| Date | From | To | Ticket |
|---|---|---|---|
| 2026-06-02 | FEATURE | PLATFORM | TICKET-0006A (WOLVERINE normalization pass) |

Source: `2026-06-02_wolverine_ticket-0006a_normalize-classification-drift.md`

---

## Write Ownership Register

| Surface | Write Type | Ownership Gate | Risk |
|---|---|---|---|
| `actors/controllers/` | PROFILE_MUTATION | YES — `assertActorOwnsVportActorController` | CRITICAL |
| `vc.actors` (read) | READ | RLS via `vc.actor_owners` | HIGH |
| `vc.actor_owners` (read) | READ (authority table) | SECURITY DEFINER RPC | CRITICAL |

---

## Adapter Ownership

`actors.adapter.js` is the public cross-feature boundary for the actors module.

| Consumer | What It Consumes | Confirmed |
|---|---|---|
| Dashboard `vportTeamAccess` | Actor summaries via adapter | YES — IRONMAN 2026-05-18 |
| Other features | UNKNOWN — IRONMAN full pass not run | NOT_AUDITED |

---

## Ownership Gaps

| Gap | Status | Owner |
|---|---|---|
| Dead export `resolveVcsmActorForProvisioning` (RISK-5) | OPEN — no removal ticket | Unassigned |
| `provision_vcsm_identity` RPC security audit | MISSING | VENOM (deferred) |
| Migration ownership for `provision_vcsm_identity` + `refresh_actor_directory_row` | MISSING | CARNAGE (not yet run) |
| Dual `assertActorOwnsVportActor` implementations (IRON-BOOK-WARN3) | OPEN | Unassigned — consolidation required |

---

## Pending

A full IRONMAN ownership audit scoped to `apps/VCSM/src/features/actors/` has not been run.

When IRONMAN runs, this file must be updated with:
- Full consumer map of `actors.adapter.js`
- Verification that all controllers enforce ownership gating
- Dead code confirmation (any exports with zero callers)
- Final ownership assignment for all open gaps above

Recommended: run IRONMAN after ARCHITECT contract is produced.
