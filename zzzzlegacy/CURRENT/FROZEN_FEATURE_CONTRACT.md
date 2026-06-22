# Frozen Feature Contract
# Ticket: LOGAN-DOCS-001
# Last Updated: 2026-06-02 (learning added)
# Owner: LOGAN

---

## Currently Frozen Features

| Feature | Source Path | Frozen Since |
|---|---|---|
| `wanders` | `apps/VCSM/src/features/wanders/` | 2026-06 |
| `wanderex` | `apps/VCSM/src/features/wanderex/` | 2026-06 |
| `vgrid` | `apps/VCSM/src/features/vgrid/` | 2026-06 |
| `learning` | `apps/VCSM/src/learning/` | 2026-06 |

---

## Processing Rule

If a feature has `status: FROZEN` in `CURRENT/FEATURE_STATUS.md`:

**Immediate exclusion. No exceptions unless the user explicitly names the feature in their request.**

---

## Excluded Activities (Automatic Skip)

When processing a frozen feature encountered in any scan, inventory, or planning activity, do NOT create any of the following:

### Audit Documents
- Security findings (VENOM output)
- Precision scan reports (ELEKTRA output)
- Red team reports or harnesses (BLACKWIDOW output)
- Compliance gate reviews (SENTRY output)
- IP safety reviews (SHIELD output)

### Architecture Documents
- Architecture maps (ARCHITECT output)
- Source maps
- Dependency graphs
- System topology entries

### Governance Documents
- Triad reviews
- Feature ownership records (IRONMAN output)
- Audit status entries
- Coverage gap reports

### Migration Documents
- Schema migration plans (CARNAGE output)
- RLS coverage entries
- Data migration tasks

### Performance Documents
- Bottleneck analysis (KRAVEN output)
- Query performance reports

### Testing Documents
- Test coverage audits (SPIDER-MAN output)
- Regression gap reports

### Release Documents
- Release gates (THOR output)
- Feature readiness checklists
- Deployment dependencies

### Planning Documents
- Technical debt entries
- Roadmap entries
- Dashboard coverage reports
- Tab coverage reports
- Native migration parity entries (FALCON output)
- Feature inventory entries

---

## Allowed Actions on Frozen Features

The following are permitted without explicit user request:

| Action | Permitted By |
|---|---|
| Read-only inspection of source files | Any command (for dependency resolution only) |
| Dependency lookup (does another feature import from this one?) | ARCHITECT, LOKI |
| Listing the frozen feature by name in a frozen features table | Any command |
| Confirming the feature exists at its source path | Any command |

---

## When a User Explicitly Requests a Frozen Feature

If the user in the current session explicitly names a frozen feature (e.g., "audit wanders" or "review vgrid architecture"), you MAY process it with these rules:

1. State clearly at the top of your response: **"Note: [feature] is currently marked FROZEN in CURRENT/FEATURE_STATUS.md."**
2. Confirm with the user that they intend to process a frozen feature before generating any output.
3. If confirmed: proceed with the requested operation for that session only.
4. Do NOT unfreeeze the feature in the registry as a result of this — one-session override, not a status change.
5. Do NOT carry findings into standard audit registries, triad docs, or governance matrices unless instructed.

---

## Unfreezing a Feature

A feature may only be unfrozen by an explicit user instruction: "unfreeze [feature]" or equivalent.

When unfreezing:
1. Update `CURRENT/FEATURE_STATUS.md` — change status from `FROZEN` to `ACTIVE` (or appropriate status)
2. Update `frozen/[feature]/STATUS.md` — add unfreeze date and reason
3. Update this contract — remove from "Currently Frozen Features" table
4. No other changes required — audits will naturally pick up the feature on next run

---

## Adding a New Frozen Feature

When a feature needs to be frozen:
1. Add a row to the "Currently Frozen Features" table above
2. Add a row to `CURRENT/FEATURE_STATUS.md` FROZEN section
3. Create `CURRENT/frozen/[feature]/README.md` and `STATUS.md`
4. Add the feature to the exclusion list comments in `CURRENT/README.md`

---

## Contract Authority

This contract is enforced by:
- LOGAN on documentation reviews
- All commands on any multi-feature scan or inventory
- WOLVERINE when generating task lists or feature inventories
- ARCHITECT when generating system maps
- THOR when generating release checklists
- IRONMAN when generating ownership maps

The contract does not require any code change. It is a governance signal only.
Source code at `apps/VCSM/src/features/wanders/`, `apps/VCSM/src/features/wanderex/`, `apps/VCSM/src/features/vgrid/`, and `apps/VCSM/src/learning/` is untouched and remains as-is.
