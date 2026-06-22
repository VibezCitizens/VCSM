# Module: Locksmith Profile

**VPORT Kinds:** LOCKSMITH  
**Public/Owner:** BOTH  
**Route:** `/vport/locksmith`  
**Source:** `apps/VCSM/src/features/profiles/kinds/vport/`  
**Governance status:** PARTIAL — VENOM complete, rest pending  
**Last audit:** 2026-05-10

---

## What This Module Does

Locksmith-specific public profile with services, emergency call-out, reviews, and booking. Also the primary kind feeding the TriPoint external integration.

## Note

This module is linked to the TriPoint integration (`modules/tripoint/`). Any ARCHITECT audit of Locksmith must include the TriPoint data exposure surface.

## References

- `logan/vports/vcsm.vport.locksmith-profile-spec.md`
- `modules/tripoint/`
