# Governance: THOR — Release Gate

**Authority:** THOR is the final release commander. Only THOR can declare RELEASE APPROVED.
**Last Updated:** 2026-05-27

## Responsibility

THOR evaluates VPORT tab release readiness by reviewing all specialist command outputs:

1. All VENOM findings resolved (no CRITICAL or HIGH)
2. All ARCHITECT findings resolved (no CONTRACT VIOLATION, no MAJOR DRIFT)
3. All KRAVEN findings resolved (no CRITICAL; HIGH mitigated)
4. All SENTRY findings resolved (ALIGNED or MINOR DRIFT with deferred plan)
5. All SPIDER-MAN findings resolved (CLEAN — critical paths protected)
6. LOGAN canonical doc exists and is current

## THOR Release Classifications

| Classification | Meaning |
|---|---|
| RELEASE APPROVED | All requirements met — tab cleared for production |
| CAUTION | Minor gaps exist but risk is understood and accepted |
| UNDERTESTED | Important regressions possible — testing required before release |
| BLOCKED | Release-critical unresolved finding — must not ship |

## Per-Tab THOR Status

| Tab | Status | Notes |
|---|---|---|
| rates | NOT_STARTED | Pending VENOM standalone pass + hook tests |
| book | BLOCKED | No audits completed — highest-risk tab |
| owner | BLOCKED | Injection gate not audited |
| team | BLOCKED | Identity exposure not audited |
| gas | BLOCKED | Price write ownership not audited |
| menu | BLOCKED | QR/flyer security not formally audited |
| all others | NOT_STARTED | — |

## THOR Release Reports Location

`governance/thor/` — filename format: `YYYY-MM-DD_thor_vport-tab-<tab-key>.md`

## Auto-Escalation Rules

THOR must treat these as **automatic release blockers** for any VPORT tab:
- CRITICAL VENOM finding unresolved
- Booking/payment write path without ownership test coverage
- Owner tab injection bypass scenario untested
- CONTRACT VIOLATION in SENTRY report
- No LOGAN canonical doc exists for a changed tab
