# Module: Subscribers (Cross-Kind)

**VPORT Kinds:** ALL  
**Public/Owner:** BOTH  
**Route:** `/vport/subscribers`  
**Source:** TBD — not yet mapped  
**Governance status:** NOT_STARTED  
**Risk:** HIGH — no security review, no architecture map, no tests  
**Last audit:** NEVER

---

## What This Module Does

Manages follower/subscriber relationships across all VPORT kinds. Citizens can subscribe to VPORTs; subscription counts and lists are accessible from the VPORT dashboard.

## Why This Is High Risk

- Cross-kind data access pattern not formally reviewed
- Actor ownership of subscriber records not confirmed in VENOM
- No trust boundary review has been run
- No test coverage exists

## Priority

**#1 highest priority next audit** — zero coverage on a cross-kind feature.

## Next Command

Run VENOM first. Then ARCHITECT.

## References

- `../../../pending-full-audits.md` (entry #1)
