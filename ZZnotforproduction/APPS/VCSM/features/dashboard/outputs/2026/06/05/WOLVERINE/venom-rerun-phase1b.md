---
name: venom-rerun-phase1b
description: VENOM targeted re-run — Phase 1b of WOLVERINE. Reclassify VEN-SHELL-002, add ARCH-CARD-001, apply ELEKTRA reclassifications.
metadata:
  type: security-rerun
  command: VENOM
  phase: WOLVERINE Phase 1b
  ticket: TICKET-DASH-WOLVERINE-001
  date: 2026-06-05
  scope: dashboard feature — targeted re-run based on ARCHITECT card audit output
  upstream: ARCHITECT card ownership audit (2026-06-05)
---

# VENOM Re-Run — Phase 1b
## WOLVERINE Phase 1b | TICKET-DASH-WOLVERINE-001 | 2026-06-05

**Trigger:** ARCHITECT card sub-module ownership audit produced 3 new findings.
**Scope:** Targeted — not a full rescan. Covers new findings + VEN-SHELL-002 reclassification + ELEKTRA-supported reclassifications.

---

## New Findings

### VEN-CARD-001 | HIGH | THOR BLOCKER | uploadFlyerImageCtrl — no ownership check before media upload

**Source:** ARCH-CARD-001 (ARCHITECT card audit 2026-06-05)
**File:** `apps/VCSM/src/features/dashboard/flyerBuilder/controller/flyerEditor.controller.js`
**Function:** `uploadFlyerImageCtrl({ vportId, file })`

**Finding:**
`uploadFlyerImageCtrl` calls `uploadMediaController` directly with the caller-supplied `vportId`
as `ownerActorId`. No ownership assertion precedes the upload call.

Any authenticated user who knows a target VPORT's actorId can upload a file to that VPORT's
`design_asset` storage scope. The media_assets platform record is created with both
`ownerActorId` and `createdByActorId` set to the target VPORT (the victim), not the actual caller.

**Contrast:** `ctrlUploadDesignAsset` in the same feature calls `requireOwnerActorAccess(ownerActorId)`
before calling `uploadMediaController`. `uploadFlyerImageCtrl` is missing this guard.

**Severity:** HIGH — authenticated write to another actor's asset scope without DB-backed ownership check.

**Fix:**
```js
export async function uploadFlyerImageCtrl({ vportId, file }) {
  await requireOwnerActorAccess(vportId)  // add — mirrors ctrlUploadDesignAsset
  const result = await uploadMediaController({
    file,
    scope: 'design_asset',
    ownerActorId: vportId,
    opts: { extraPath: 'assets' },
  })
  // ... rest unchanged
}
```
Note: `requireOwnerActorAccess` resolves the caller from `dalReadAuthenticatedUserId()` internally —
no additional parameter is required from the hook.

**THOR:** BLOCKER — must be patched before THOR can proceed.

---

### VEN-CARD-002 | INFO | portfolio engine enforces ownership internally

**Source:** ARCH-CARD-002 downgraded after engine code review.
**File:** `engines/portfolio/src/controller/addMedia.controller.js`

**Finding:**
The portfolio engine's `addMedia` enforces ownership via two mechanisms:
1. `item.profile_id !== callerProfileId` (line 41) — portfolio item must belong to the actor's profile
2. `isActorOwner(actorId)` (line 45) — DI-configured actor ownership check

The dashboard controller (`addPortfolioMediaWithRecord`) delegates to this engine without
a controller-layer assertion. This is acceptable: the engine owns the trust boundary for its domain,
and the controller is within the app boundary.

**Verdict:** INFO — no gap. Engine enforcement confirmed.

---

## VEN-SHELL-002 Reclassification

**Previous state:** HIGH THOR BLOCKER — "Shell isOwner gate is UI-only — 8 of 11 card sub-modules
have no confirmed ownership enforcement on write paths."

**New state after ARCHITECT audit:**

| Card | Status | Enforcement |
|------|--------|-------------|
| reviews | CLEARED — read-only | N/A |
| services | CLEARED — read-only | N/A |
| qrcode | CLEARED — read-only | N/A |
| leads | CLEARED | assertActorOwnsVportActorController on all 5 ops |
| team | CLEARED | assertActorOwnsVportActorController on all 4 ops |
| settings | CLEARED | assertActorOwnsVportActorController via full coordinator chain |
| flyerBuilder (save) | CLEARED | requireOwnerActorAccess (actor_owners query) |
| flyerBuilder (upload) | GAP — VEN-CARD-001 (HIGH) | No ownership check |
| designStudio pages | CLEARED | requireDesignDocumentOwnerAccess |
| designStudio assets/exports | CLEARED | requireOwnerActorAccess / requireDesignDocumentOwnerAccess |
| portfolio | CLEARED — engine enforced | addMedia: isActorOwner + profile_id match |

**Reclassification:** VEN-SHELL-002 remains HIGH THOR BLOCKER but is PARTIALLY MITIGATED.
Scope narrowed: "1 of 11 card write surfaces unguarded (uploadFlyerImageCtrl)."
No longer requires "8 card sub-modules unverified" language.

---

## ELEKTRA-Supported Reclassifications Applied

Based on ELEKTRA report (2026-06-05) and BLACKWIDOW confirmation:

| Finding | Previous | New | Reason |
|---------|----------|-----|--------|
| VEN-SHELL-001 | MEDIUM | LOW | 1 confirmed consumer of booking.adapter DAL export; blast radius confirmed narrow |
| VEN-SHELL-005 | MEDIUM (THOR BLOCKER) | LOW | Card catalog is own-actor filtering only; confirmed all card write surfaces have independent ownership checks |

**VEN-SHELL-005 reclassification note:** Originally flagged as THOR BLOCKER because card visibility
is client-side only. Now that ARCHITECT has confirmed all 11 cards have proper write-side enforcement,
the card catalog visibility model cannot be used to access an unguarded write path. The finding is
advisory (defense-in-depth gap) — not a write path control gap.

---

## Updated THOR Blocker Status

| Finding | Severity | THOR Blocker | Status |
|---------|----------|-------------|--------|
| VEN-CARD-001 | HIGH | YES | New finding — uploadFlyerImageCtrl no ownership check |
| VEN-SHELL-002 | HIGH | YES | Partially mitigated — scope narrowed to VEN-CARD-001 |
| VEN-DASHBOARD-004 | HIGH | WATCH | insertVportResourceDAL unrestricted INSERT; BW-DASH-003 confirms 0 consumers (dead code). Not exploitable while unused but HIGH designation retained. |

**Cleared from THOR BLOCKER list:**
- VEN-SHELL-005 — reclassified to LOW (all card write surfaces independently verified)

**Remaining THOR blockers (VENOM contribution):**
- VEN-CARD-001 (HIGH) — must patch uploadFlyerImageCtrl
- VEN-SHELL-002 (HIGH) — closes when VEN-CARD-001 is patched

**Non-VENOM THOR blockers (from other commands):**
- OWN-DSH-001 (HIGH) — no declared engineering owner
- OWN-DSH-002 (HIGH) — Actor Ownership Contract no declared authority

---

## SECURITY.md Update Actions

1. Add VEN-CARD-001 as new HIGH finding (Section: Module-Level Card Findings)
2. Add VEN-CARD-002 as INFO finding
3. Update VEN-SHELL-002 description to "PARTIALLY MITIGATED"
4. Apply VEN-SHELL-001 MEDIUM → LOW reclassification
5. Apply VEN-SHELL-005 MEDIUM (THOR BLOCKER) → LOW reclassification
6. Update header: remove VEN-SHELL-005 from THOR blocker list, add VEN-CARD-001
7. Update VENOM Last Run to 2026-06-05 (Phase 1b)

---

## Summary Counts (this re-run)

New findings added: 2 (VEN-CARD-001 HIGH, VEN-CARD-002 INFO)
Reclassifications: 3 (VEN-SHELL-001 ↓LOW, VEN-SHELL-005 ↓LOW, VEN-SHELL-002 scope narrowed)
THOR blockers added: 1 (VEN-CARD-001)
THOR blockers cleared: 1 (VEN-SHELL-005)
Net THOR blocker count (VENOM): unchanged (still HIGH blocked) — VEN-CARD-001 replaces VEN-SHELL-005
