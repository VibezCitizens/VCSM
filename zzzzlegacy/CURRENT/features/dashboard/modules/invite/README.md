# Module: Invite

**VPORT Kinds:** BARBERSHOP (primary) / ALL (general invite infrastructure)
**Public/Owner:** OWNER (invite issuance) + PUBLIC (invite link consumption)
**Route/Surface:** Invite issuance and acceptance flows
**Source:** `apps/VCSM/src/features/invite/`
**Governance status:** NOT_STARTED
**Last audit:** —

---

## What This Module Does

Handles invite token issuance and acceptance. The invite feature creates the invite record (token) that the join feature then accepts. Shares `joinInvite.dal.js` with `DASHBOARD/modules/join/`.

Subdirectories: `controller/`, `dal/`, `hooks/`, `screens/`

## Relationship to join/

`joinInvite.dal.js` is shared with `DASHBOARD/modules/join/`. Invite issues the trust artifact; join consumes it. Both modules must be audited together to fully close the trust chain.

## Why This Folder Exists

Invite tokens are trust artifacts — they establish ownership and membership. Acceptance of an invite writes ownership or membership records. No security audit has ever run. Shares DAL with the join module. The invite acceptance path is a cross-feature trust boundary.

## Next Command

VENOM
