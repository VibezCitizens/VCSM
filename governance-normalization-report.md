# Governance Normalization Report

## Duplicated Sections Found

| Duplicated Section | Source Commands | Extracted Destination File |
|---|---|---|
| Boundary contract loading and protected roots | Most `.claude/commands/*.md` command files | `.claude/contracts/boundary.md` |
| Explicit approval before source writes or cross-root changes | Wolverine, NickFury, Deadpool, WATCHER, Thor, SHIELD, DataEngineer, and other command files | `.claude/contracts/approval-gate.md` |
| Database read-only posture and migration escalation | DB, Carnage, DataEngineer, Deadpool, NickFury, Logan, ELEKTRA | `.claude/contracts/db-readonly.md` |
| Persistent output and completion/report requirements | DB, Carnage, Kraven, Thor, Sentry, SHIELD, session-summary, command-specific reports | `.claude/contracts/completion.md` |
| BEHAVIOR.md governance and behavior release gate language | ProfessorX, Dr.Strange, Thor, ARCHITECT, BlackWidow, ELEKTRA | `.claude/contracts/behavior-gate.md` |
| Command authority definitions | Cerebro, listofcomand.v2, SHIELD, command-local authority blocks | `.claude/registry/authorities.yaml` |
| Command routing relationships | Cerebro, Wolverine, Dr.Strange, AvengersAssemble, SHIELD | `.claude/registry/routes.yaml` |
| Plan, execution, security finding, and approval tracker blocks | Wolverine, SHIELD, ELEKTRA, BlackWidow, WATCHER, listofcomand.v2 | `.claude/templates/*.md` |

## Source Commands

- `.claude/commands/ARCHITECT.md`
- `.claude/commands/architect/ARCHITECT.md`
- `.claude/commands/AvengersAssemble.md`
- `.claude/commands/BlackWidow.md`
- `.claude/commands/CAPTAIN.md`
- `.claude/commands/Carnage.md`
- `.claude/commands/Cerebro.md`
- `.claude/commands/DB.md`
- `.claude/commands/DataEngineer.md`
- `.claude/commands/Deadpool.md`
- `.claude/commands/Dr.Strange.md`
- `.claude/commands/ELEKTRA.md`
- `.claude/commands/Falcon.md`
- `.claude/commands/HAWKEYE.md`
- `.claude/commands/Ironman.md`
- `.claude/commands/Kraven.md`
- `.claude/commands/Logan.md`
- `.claude/commands/Loki.md`
- `.claude/commands/NickFury.md`
- `.claude/commands/ProfessorX.md`
- `.claude/commands/review-contract.md`
- `.claude/commands/SHIELD.md`
- `.claude/commands/shield-execution-principles.md`
- `.claude/commands/shield-failure-prevention.md`
- `.claude/commands/Sentry.md`
- `.claude/commands/session-summary.md`
- `.claude/commands/SPIDER-MAN.md`
- `.claude/commands/Thor.md`
- `.claude/commands/ticket.md`
- `.claude/commands/Venom.md`
- `.claude/commands/Vision.md`
- `.claude/commands/WATCHER.md`
- `.claude/commands/WinterSoldier.md`
- `.claude/commands/Wolverine.md`
- `.claude/commands/listofcomand.v2.md`

## Estimated Token Reduction

- Boundary contract loading duplication: TBD, estimated high.
- Authority definitions and route tables: TBD, estimated medium.
- Approval gate language: TBD, estimated medium.
- Database read-only language: TBD, estimated medium.
- Completion and output templates: TBD, estimated low-to-medium.

## Commands Affected

No command files were modified.

Commands that contain duplicated sections and could later consume the normalized files:

- ARCHITECT
- AvengersAssemble
- BlackWidow
- Carnage
- DB
- DataEngineer
- Deadpool
- Dr.Strange
- ELEKTRA
- HAWKEYE
- Kraven
- Logan
- Loki
- NickFury
- ProfessorX
- SHIELD
- Sentry
- SPIDER-MAN
- Thor
- Venom
- WATCHER
- Wolverine
- Additional commands with repeated boundary boilerplate: TBD

## Migration Risk

- Risk level: LOW for this phase because only new files were generated.
- Semantic risk: TBD if commands are later rewritten to import or reference these files.
- Authority risk: preserve existing authority levels exactly; unresolved command-local conflicts must remain `TBD`.
- Routing risk: command relationships copied from existing registry where clear; unclear routes use placeholders.

## Unresolved Items

- Whether `.claude/commands/ARCHITECT.md` and `.claude/commands/architect/ARCHITECT.md` are intended to remain duplicated.
- Exact canonical output path variants where command-local files conflict with Cerebro registry.
- Whether supporting reference files such as `shield-execution-principles.md`, `shield-failure-prevention.md`, `ticket.md`, and `listofcomand.v2.md` should be treated as commands or references.
- Exact allowed approval phrase list beyond `APPROVE`, `EXECUTE`, and `PROCEED`.
- Exact behavior contract dimensions to centralize in `.claude/contracts/behavior-gate.md`.
- Exact token reduction count after future command rewrites.
