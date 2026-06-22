# Module: Join

**VPORT Kinds:** BARBERSHOP (primary) / BARBER (joining actor)
**Public/Owner:** OWNER (accept paths) + PUBLIC (QR preview — intentionally public)
**Route/Surface:** `/join/barbershop` + QR join flow (DASHBOARD onboarding entry)
**Source:** `apps/VCSM/src/features/join/`
**Governance status:** NOT_STARTED
**Last audit:** —

---

## What This Module Does

Handles the flow by which a barber (BARBER kind) links themselves to an existing barbershop VPORT. Entry via QR scan or account invite link. Accepting a resource slot in `vport.resources` establishes team membership.

Key controllers: `joinBarbershopQr.controller.js`, `joinBarbershopAccount.controller.js`
Key DAL: `joinInvite.dal.js` (shared with invite module)
Key hook: `useJoinBarbershop.js`

## Relationship to invite/

`joinInvite.dal.js` is shared with `DASHBOARD/modules/invite/`. Invite handles issuance; join handles acceptance.

## Why This Folder Exists

Active on current branch (`vport-booking-feed-security-updates`). Ownership-establishment path. No security audit has ever run. The QR preview path is intentionally public but the accept path requires verified ownership. The full trust chain is unaudited.

## Next Command

VENOM
