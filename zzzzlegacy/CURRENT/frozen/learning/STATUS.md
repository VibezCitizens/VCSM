# learning — Freeze Status Record

Feature: learning
Source Path: apps/VCSM/src/learning/
Status: FROZEN
Owner: LOGAN
Frozen Since: 2026-06
Frozen By: LOGAN-DOCS-001

---

## Reason

Product work paused. The embedded VCSM LMS (at `apps/VCSM/src/learning/`) is not
part of active platform development. No sprint work, migrations, or governance
actions are planned for this feature at this time.

Note: This is the VCSM-embedded learning system only.
Wentrex is a separate standalone LMS product and is NOT governed by this freeze.

---

## Excluded From

- VENOM (security audit)
- ELEKTRA (precision security scan)
- BLACKWIDOW (red team)
- ARCHITECT (architecture mapping)
- KRAVEN (performance analysis)
- SENTRY (compliance gate)
- SPIDER-MAN (test coverage audit)
- THOR (release gate)
- CARNAGE (migration planning)
- IRONMAN (ownership mapping)
- HAWKEYE (API contract review)
- LOKI (runtime trace)
- DB (schema audit)
- Migration planning
- Architecture planning
- Feature inventories
- Dashboard planning
- Tab planning
- Native migration planning (FALCON)
- Technical debt reports
- Roadmap generation
- Triad reviews
- Governance matrices

---

## Allowed Actions

- Read-only inspection of source files for dependency resolution
- Dependency lookup (does another feature import from learning?)
- Listing this feature in the frozen features table

---

## Forbidden Actions

- Generating any audit finding
- Generating any architecture document
- Generating any security document
- Generating any migration plan
- Generating any release gate
- Generating any governance or ownership record
- Including in any feature count or coverage report

---

## Unfreeze Conditions

This feature may be unfrozen when:
- Product work on the embedded LMS resumes
- An explicit user instruction to unfreeze is issued

On unfreeze:
- Update `CURRENT/FEATURE_STATUS.md`
- Update this file (add unfreeze date and reason below)
- Update `CURRENT/FROZEN_FEATURE_CONTRACT.md`

---

## History

| Date | Event |
|---|---|
| 2026-06-02 | Frozen via LOGAN-DOCS-001 |
