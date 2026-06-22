# Codex Command Decision Tree

Use the smallest command that matches the work.

| If the work is... | Use |
|---|---|
| Security or trust boundary review | VENOM |
| Precision exploit or source-to-sink security trace | ELEKTRA |
| Adversarial runtime verification | BLACKWIDOW |
| Architecture, layers, imports, routes, DAL maps | ARCHITECT |
| Compliance after edits | SENTRY |
| Ownership and responsibility mapping | IRONMAN |
| Tests and regression coverage | SPIDER-MAN |
| Performance, bottlenecks, runtime cost | KRAVEN |
| Database read review, schema, RLS, migration need | DB, then CARNAGE if change planning is needed |
| Documentation drift, CURRENT/HISTORY/index sync | LOGAN |
| Release readiness | THOR |
| Status, routing, frozen/deferred checks | DR. STRANGE |
| Execution planning and work orchestration | WOLVERINE |
| Runtime trace or observed behavior | LOKI |
| Endpoint/API contract verification | HAWKEYE |
| Data-access architecture and duplicated DAL/RPC chains | DataEngineer |
| iOS/native parity | Falcon |
| Android/native parity | WinterSoldier |
| IP/license/copyright/patent risk | SHIELD |
| Full pre-release specialist alignment | AvengersAssemble |
| Session handoff | session-summary |

## Default Flow

1. DR. STRANGE for status and routing.
2. WOLVERINE for planning/execution orchestration.
3. Specialist command for domain evidence.
4. SENTRY if architecture changed.
5. LOGAN after implementation or documentation movement.
6. THOR only when release readiness is requested.

