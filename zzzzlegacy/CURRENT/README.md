# CURRENT — VCSM Governance Root
# Ticket: LOGAN-DOCS-001
# Created: 2026-06-02
# Owner: LOGAN

This folder is the active governance layer for VCSM feature status.

It does not contain audit artifacts, command outputs, or historical records.
It contains the current authoritative rules that all commands must check before acting.

---

## Contents

| File / Folder | Purpose |
|---|---|
| `FEATURE_STATUS.md` | Canonical registry of every feature and its current status |
| `FROZEN_FEATURE_CONTRACT.md` | Rules governing frozen features — what commands must skip |
| `frozen/` | Per-feature freeze records for paused/archived features |

---

## Before Generating Any Feature Inventory

Check `CURRENT/FEATURE_STATUS.md`.

If a feature's status is `FROZEN`:

**Skip immediately.**

Do not create findings, audit-status, security docs, architecture docs, release docs,
governance docs, triad reports, migration plans, roadmap entries, or technical debt
entries for that feature unless explicitly requested by the user in that session.

---

## Before Running Any Command

VENOM, ELEKTRA, BLACKWIDOW, ARCHITECT, KRAVEN, SENTRY, SPIDER-MAN, THOR,
CARNAGE, IRONMAN, SPIDER-MAN, HAWKEYE, DB, WATCHER, LOKI, DEADPOOL:

1. Pull the feature list you intend to process.
2. Cross-reference against `CURRENT/FEATURE_STATUS.md`.
3. Remove any feature with `status: FROZEN` from your working set.
4. Proceed with remaining features only.

If a user explicitly names a frozen feature in their request, you may process it
but must state clearly that the feature is frozen and confirm intent before proceeding.

---

## Status Lifecycle

```
ACTIVE → BLOCKED → DEFERRED → FROZEN
              ↓
           PLANNED
              ↓
           LEGACY
```

Only LOGAN or an explicit user instruction can change a feature's status.
