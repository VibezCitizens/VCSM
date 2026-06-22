# Module: TriPoint Integration

**VPORT Kinds:** LOCKSMITH (primary), ALL (API surface)  
**Public/Owner:** PUBLIC (external domain)  
**Route:** Edge Function API (external domain: tripointlockandkeys.com)  
**Source:** TBD — Edge Function layer  
**Governance status:** NOT_STARTED  
**Risk:** HIGH — external domain exposure, no security review  
**Last audit:** NEVER

---

## What This Module Does

Exposes VPORT business identity data (services, hours, reviews, contact info) to external business websites via Edge Function APIs. The external site (e.g. tripointlockandkeys.com) consumes VCSM data while maintaining its own domain and UI.

## Why This Is High Risk

- Public API surface with no VENOM review
- Actor ownership of API-exposed data not formally confirmed
- CORS exposure scope unknown
- API key / authentication model not reviewed
- External domain means data escapes VCSM trust boundary permanently

## Priority

**#3 highest priority next audit** (after Subscribers and Delete Lifecycle).

## Next Command

Run VENOM first. Then ARCHITECT.

## References

- `logan/vports/vcsm.vport.tripoint-integration.md` (12KB specification)
- `../../../pending-full-audits.md` (entry #3)
