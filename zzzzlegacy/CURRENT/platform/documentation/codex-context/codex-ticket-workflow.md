# Codex Ticket Workflow

## Ticket Format

Preserve the incoming ticket ID exactly. A ticket should define:

- Ticket ID
- Boundary contract
- Scope and allowed roots
- Protected roots
- Allowed actions
- Forbidden actions
- Goal
- Phases
- Required outputs
- Final verdict

## Work Classification

Classify the ticket before acting:

- Read-only discovery
- Documentation organization
- Documentation creation
- Source execution
- Database review
- Runtime verification
- Release gate
- Recovery/verification

If scope is ambiguous, stop and ask before modifying files.

## Approval / Execution Flow

1. Load required contracts.
2. Confirm allowed roots and protected roots.
3. Inventory/read required inputs.
4. Produce a plan when requested or when execution risk is non-trivial.
5. Execute only actions allowed by the ticket.
6. Never use git unless explicitly allowed.
7. Never modify app, engine, or migration files during documentation-only tickets.

## Verification Rules

For file moves, verify:

- SHA-256 before move
- SHA-256 after move
- Destination exists
- Source removed
- No overwrite occurred

For documentation creation, verify:

- Required files exist
- Metadata is present
- Category keys are valid
- Output paths match the naming contract
- Protected roots were not modified

## Completion Rules

A ticket is complete only when all requested phases are handled or explicitly marked blocked. If a required source file is missing, report the missing file and use the nearest verified source only if the ticket allows inference.

## Final Report Template

```markdown
## Final Report

1. Inputs read:
2. Files created:
3. Files modified:
4. Files skipped:
5. Verification result:
6. Protected root confirmation:
7. Remaining gaps:

Final Verdict:
```

## CURRENT Updates After Command Work

After command-style work, update the owning CURRENT truth files only when allowed:

- `CURRENT_STATUS.md` for state changes
- `SECURITY.md` for security posture
- `ARCHITECTURE.md` for structural truth
- `OWNERSHIP.md` for responsibility
- `TESTS.md` for test coverage
- `PERFORMANCE.md` for performance posture
- `BLOCKERS.md` for blocking issues
- `DEFERRED.md` for deferred work
- `HISTORY_INDEX.md` for evidence links

