# Codex Operating Contract

## Read First

Before command-style work in this repository, Codex must read:

1. `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/zcontract/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`
2. `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/CURRENT/CATEGORY_REGISTRY.md`
3. `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/CURRENT/OUTPUT_NAMING_CONTRACT.md`
4. `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/CURRENT/FEATURE_STATUS.md`
5. `codex-command-registry.md`
6. `codex-governance-v2-rulebook.md`

## Never Do

- Do not use git unless the ticket explicitly allows git.
- Do not touch protected roots unless the ticket scope allows that root.
- Do not edit apps, engines, or migrations during documentation tickets.
- Do not delete files.
- Do not move files without checksum verification.
- Do not overwrite different-checksum files.
- Do not silently expand scope across VCSM, Wentrex, Traffic, or engines.
- Do not create scattered documentation inside app, engine, shared, or source folders.

## Always Do

- Preserve ticket IDs exactly.
- Load the boundary contract before source or governance work.
- Preserve CURRENT as the source of truth.
- Use Category Key values from `CURRENT/CATEGORY_REGISTRY.md`.
- Write command outputs using `CURRENT/OUTPUT_NAMING_CONTRACT.md`.
- Include Category Key, Command, Ticket, Scope, Timestamp, and Output Path metadata.
- Update CURRENT domain files after command-style work when the command owns that update.
- Run or refresh DR. STRANGE after command work when status, routing, blockers, or THOR readiness changed.
- Produce a verification report that says what was read, what changed, what was skipped, and what remains.

## Protected Roots

Protected roots are:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM`
- `/Users/vcsm/Desktop/VCSM/apps/wentrex`
- `/Users/vcsm/Desktop/VCSM/apps/Traffic`
- `/Users/vcsm/Desktop/VCSM/engines`

Documentation-only tickets must not modify these roots unless the ticket explicitly says so.

## Main Coordination Pattern

1. DR. STRANGE checks feature status, frozen status, category key, and CURRENT entrypoints.
2. WOLVERINE classifies work, plans execution, and routes to specialists.
3. Specialist commands produce evidence and update their owned CURRENT truth surfaces.
4. LOGAN rebuilds documentation indexes, detects drift, and verifies CURRENT truth.
5. THOR evaluates freshness gates and release readiness only after required evidence is current.

## Context Pack Files

Read this pack in this order:

1. `CODEX.md`
2. `codex-command-registry.md`
3. `codex-governance-v2-rulebook.md`
4. `codex-ticket-workflow.md`
5. `codex-feature-routing.md`
6. `codex-command-decision-tree.md`
7. `codex-output-template.md`

