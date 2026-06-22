# Codex Governance V2 Rulebook

## Two-Write Rule

Command-style work produces two kinds of documentation when the command changes governance truth:

1. Immutable evidence output under `CURRENT/outputs/YYYY/MM/DD/[command]/`.
2. Latest-truth update in the owning CURRENT domain folder, such as `CURRENT/features/[feature]/CURRENT_STATUS.md`, `SECURITY.md`, `ARCHITECTURE.md`, `BLOCKERS.md`, or `HISTORY_INDEX.md`.

If a ticket is read-only, do not perform either write unless the ticket explicitly asks for a report file.

## CURRENT Outputs as Immutable Audit Trail

`CURRENT/outputs` stores command evidence. Do not rewrite findings to make them look current. If a correction is needed, create a new output with a new timestamp and link it from the relevant CURRENT truth file.

## CURRENT Feature Folders as Latest Truth

`CURRENT/features/[feature]` is the latest operational truth for active features. Specialist output is evidence; feature files are the operational summary DR. STRANGE and THOR should read first.

## SECURITY.md Section Ownership

Security findings belong in `SECURITY.md` only when the command owns the security update or the ticket explicitly asks for a CURRENT backfill. VENOM owns broad security posture. ELEKTRA owns precision source-to-sink findings. BLACKWIDOW owns adversarial runtime verification. HAWKEYE owns endpoint/API verification.

## WOLVERINE Lifecycle

WOLVERINE receives tickets, classifies work, loads the boundary contract, checks scope, creates a plan, waits for approval when required, executes only approved moves/edits, verifies, and routes follow-up commands.

## DR. STRANGE Pre/Post Work Lifecycle

Before work, DR. STRANGE checks feature status, frozen/deferred/planned state, category key, CURRENT folder, and required command route. After work, DR. STRANGE should refresh status/routing evidence when command coverage, blockers, or THOR readiness changed.

## LOGAN Index Responsibility

LOGAN owns documentation drift detection, index rebuilds, provenance checks, HISTORY linkage, CURRENT backfill verification, and documentation-output routing verification.

## ARCHITECT Runtime Index Responsibility

ARCHITECT owns source architecture maps, route/screen/component chain maps, DAL-to-table maps, dependency maps, dead-spaghetti maps, and graph JSON outputs used by later commands.

## THOR V2 Freshness Gates

THOR should only evaluate release readiness after required evidence is fresh: ARCHITECT for structure, VENOM for trust boundaries, BLACKWIDOW/ELEKTRA for security depth, SPIDER-MAN for regression coverage, KRAVEN for performance, CARNAGE/DB for database risk, LOGAN for documentation drift, and SENTRY for architecture compliance.

## Category Key Requirement

Every command output must include a valid Category Key from `CURRENT/CATEGORY_REGISTRY.md`. Unknown areas must use an approved triage key such as `needs-triage` or `needs-triage-alt`.

## Output Naming Contract

Use:

```text
CURRENT/outputs/YYYY/MM/DD/[command-name]/NNN_[category-key]_[command-name]_[ticket-or-run-label].md
```

The command name is lowercase. `NNN` is a 3-digit sequence per command per day. The category key must be canonical. The output file must begin with the metadata required by `CURRENT/OUTPUT_NAMING_CONTRACT.md`.

