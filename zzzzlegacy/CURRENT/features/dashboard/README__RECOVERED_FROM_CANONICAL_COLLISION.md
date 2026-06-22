# VPORT Dashboard — Canonical Governance Hub

**Scope:** VCSM only  
**Maintained by:** ARCHITECT + WOLVERINE  
**Last updated:** 2026-05-27  
**Status:** ACTIVE

---

## What This Directory Is

This is the single source of truth for the architecture, audit coverage, and governance lifecycle of every VPORT dashboard module and card in the VCSM platform.

Every VPORT feature that renders inside a dashboard view, public menu, booking flow, or owner management screen has a module folder here. Each folder tracks that module's audit status across all specialist commands.

---

## What a "Full Audit" Means

A module is considered **FULLY AUDITED** when ALL of the following commands have run and produced no BLOCKED findings:

| Command | What It Covers | Output |
|---|---|---|
| **VENOM** | Trust boundaries, actor ownership, exposed IDs, auth gates | Security report |
| **ARCHITECT** | Layer structure, DAL/controller/hook/screen compliance, import paths | Architecture module doc |
| **KRAVEN** | DB read cost, render cost, cache efficiency, query amplification | Performance report |
| **SENTRY** | Architecture contract boundary compliance post-execution | Compliance report |
| **SPIDER-MAN** | Test coverage for controllers, hooks, critical paths | Test audit |
| **LOGAN** | Canonical documentation written and current | Module doc in `/logan/` |
| **THOR** | Release gate cleared — no BLOCKED findings remain | Release approval |

A module with any command at `NOT_STARTED`, `PARTIAL`, or `BLOCKED` is **not release-ready**.

---

## Governance Lifecycle

```
NOT_STARTED
    │
    ▼
IN_PROGRESS  ◄──── command running
    │
    ▼
PARTIAL      ◄──── command ran, findings deferred
    │
    ▼
VERIFIED     ◄──── command complete, findings resolved
    │
    ▼
COMPLETE     ◄──── all 7 commands VERIFIED, THOR approved
    │
    ▼
DEFERRED     ◄──── explicitly deferred to named sprint
    │
    ▼
BLOCKED      ◄──── critical finding, release blocked
```

---

## How to Mark a Module COMPLETE

1. All 7 commands must be at `VERIFIED` or `COMPLETE` status.
2. No command may be at `BLOCKED`.
3. THOR must have run and produced no blocking findings.
4. `release-status.md` in the module folder must be updated.
5. The row in `vport-dashboard-governance-matrix.md` must be updated.

---

## How Pending Reviews Work

`pending-full-audits.md` — modules that have never had a full audit run.  
`deferred-open-items.md` — specific findings or tasks explicitly deferred to a named sprint.

When a deferred item is resolved, remove it from `deferred-open-items.md` and update the relevant module's `audit-status.md`.

---

## Directory Structure

```
DASHBOARD/
├── README.md                          ← this file
├── vport-dashboard-governance-matrix.md   ← master audit status table
├── vport-dashboard-card-registry.md       ← all known cards/modules
├── pending-full-audits.md                 ← 12 modules needing full audit
├── deferred-open-items.md                 ← 6 deferred open items
│
├── modules/
│   ├── availability/
│   ├── barber/
│   ├── barbershop/
│   ├── booking/
│   ├── content-pages/
│   ├── dashboard/
│   ├── dashboard-cards/
│   ├── delete-lifecycle/
│   ├── exchange/
│   ├── external-site/
│   ├── gas/
│   ├── leads/
│   ├── locksmith/
│   ├── menu/
│   ├── portfolio/
│   ├── restaurant/
│   ├── reviews/
│   ├── services/
│   ├── subscribers/
│   ├── tab-classification/
│   └── tripoint/
│
└── governance/
    ├── venom/        ← security audit output links
    ├── architect/    ← architecture audit output links
    ├── kraven/       ← performance audit output links
    ├── sentry/       ← compliance audit output links
    ├── spiderman/    ← test coverage audit output links
    ├── logan/        ← documentation links
    └── thor/         ← release gate records
```

---

## Command Responsibility Map

| Command | Responsibility | Blocking Severity |
|---|---|---|
| **VENOM** | Security / trust boundaries / exposed IDs / actor ownership | CRITICAL + HIGH block release |
| **ARCHITECT** | Module architecture / layer compliance / import paths | CRITICAL blocks release |
| **KRAVEN** | Performance / DB reads / cache / render cost | HIGH blocks release |
| **SENTRY** | Architecture contract boundary compliance | CRITICAL + HIGH block release |
| **SPIDER-MAN** | Test coverage / regression safety / controller tests | Coverage gaps block release |
| **LOGAN** | Canonical documentation / drift detection | Missing docs block release |
| **THOR** | Final release gate — only THOR can declare RELEASE APPROVED | Always blocking |

---

## Highest Priority Next Audits

1. **Subscribers** — zero coverage, cross-kind feature, no VENOM run
2. **Delete Lifecycle** — high blast radius, no security review
3. **TriPoint Integration** — external exposure surface, no VENOM run

---

## References

- Architecture contract: `zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md`
- VPORT kind map: `logan/vports/vcsm.vport.kinds-architecture-map.md`
- Booking pipeline: `logan/vports/vcsm.vport.business-pipeline.v2.md`
- Exchange rate module: `logan/vports/vcsm.vport.exchange-rate.md`
- Leads module: `logan/vports/vcsm.vport.leads-dashboard.md`
