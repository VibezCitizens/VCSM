# Tab: booking — Security

**Last Updated:** 2026-05-27
**VENOM Status:** PARTIAL — See `governance/venom/2026-05-27_venom_vport-book-tab.md`

## Security Findings Summary (VENOM 2026-05-27)

| ID | Finding | Severity | Status |
|---|---|---|---|
| VENOM-BOOK-001 | Slot collision race — no atomic slot lock before insert | MEDIUM | OPEN |
| VENOM-BOOK-002 | No regression test for kind-gate (non-user actor rejection) | MEDIUM | OPEN |
| VENOM-BOOK-003 | customerName / customerNote stored unsanitized | LOW | OPEN |

## Confirmed Trust Boundary Model

```
VportPublicBookingFlow → useVportPublicBooking → createVportPublicBookingController
  1. resourceId, startsAt, endsAt, timezone required (throws if missing)
  2. getVportResourceByIdDAL → resource.is_active must be true
  3. readActorVportLinkDAL → actor.kind must be "user" (rejects vport actors)
  4. new Date(startsAt) > Date.now() (rejects past slots)
  5. getVportServiceByIdDAL → service label from DB (client snapshot ignored)
  6. insertVportBookingDAL → profile_id from DB resource (not caller-supplied)
     customer_actor_id = requestActorId (server-forced, VPD-V-019)
  7. Notification: linkPath: null (no UUID in notification, VPD-V-020)
```

## Answered Questions

| Question | Answer |
|---|---|
| Can visitor book with an actorId they don't own? | NO — requestActorId derives from authenticated session via citizenActorId (useIdentity) |
| Can a VPORT actor book? | NO — kind check rejects non-"user" actors |
| Can client supply a fake profile_id? | NO — profile_id sourced from DB resource |
| Can client fake the customer_actor_id? | NO — forced from requestActorId, VPD-V-019 |
| Can client inject a fake service label? | NO — resolved from DB catalog, VPD-V-019 |
| Does notification include VPORT UUID? | NO — linkPath: null, VPD-V-020 |
| Is slot collision possible? | YES (VENOM-BOOK-001) — race condition under concurrent load |

## Open Questions
- Does DB have unique constraint on (resource_id, starts_at) for confirmed/pending bookings?
- Does booking management UI escape customerName/customerNote before rendering? (XSS check)
