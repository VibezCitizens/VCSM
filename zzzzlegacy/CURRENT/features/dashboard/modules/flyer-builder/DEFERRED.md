# Flyer Builder Deferred And Pending Items

**Category Key:** dashboard-flyer-builder
**Last Updated:** 2026-06-02
**Ticket:** TICKET-OUTPUTS-ROUTE-0001
**Status:** ACTIVE

---

## Active Release Blockers

These items are not accepted as deferred release debt. They must be resolved before THOR release clearance.

| Finding ID | Severity | Status | Required Action |
|---|---|---|---|
| ELEK-2026-06-02-001 | MEDIUM | Open | Derive profileId from ownerActorId in flyer save path |
| ELEK-2026-06-02-002 | MEDIUM | Open | Verify document.owner_actor_id matches ownerActorId before design page writes |

---

## Deferred / Verification Queue

| Finding ID | Severity | Status | Owner Command | Next Action |
|---|---|---|---|---|
| ELEK-2026-06-02-003 | LOW | Open pending DB schema verification | CARNAGE | Confirm `actor_owners.is_void` exists before adding DAL filter |
| ELEK-2026-06-02-004 | INFO | Open | WOLVERINE or owning maintainer | Remove or document ignored `kind` and `bucket` params |

---

## Evidence

| Date | Command | Artifact |
|---|---|---|
| 2026-06-02 | ELEKTRA | `CURRENT/outputs/2026/06/02/ELEKTRA/2026-06-02_elektra_flyerbuilder-write-surfaces.md` |
