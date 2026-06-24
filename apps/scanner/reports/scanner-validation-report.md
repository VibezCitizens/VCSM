# Scanner Validation Report

Generated: 2026-06-24T06:36:32.067Z

## Schema Validation Results

| Scope | Status | Errors |
|---|---|---|
| feature-map.json | PASS | None |
| dependency-map.json | PASS | None |
| route-map.json | PASS | None |
| screen-map.json | PASS | None |
| write-surface-map.json | PASS | None |
| rpc-map.json | PASS | None |
| edge-function-map.json | PASS | None |
| callgraph.json | PASS | None |
| route-execution-map.json | PASS | None |
| write-execution-map.json | PASS | None |
| rpc-execution-map.json | PASS | None |
| edge-execution-map.json | PASS | None |
| test-traceability-map.json | PASS | None |
| security-path-map.json | PASS | None |
| engine-map.json | PASS | None |
| engine-graph.json | PASS | None |
| engine-consumer-map.json | PASS | None |
| engine-entrypoint-map.json | PASS | None |
| engine-ownership-map.json | PASS | None |
| engine-security-map.json | PASS | None |
| engine-execution-map.json | PASS | None |
| traffic-app-map.json | PASS | None |
| behavior-map.json | PASS | None |
| behavior-surface-map.json | PASS | None |
| behavior-document-map.json | PASS | None |
| ownership-map.json | PASS | None |
| policy-map.json | PASS | None |
| identity-flow-map.json | PASS | None |
| documentation-drift-map.json | PASS | None |
| db-policy-map.json | PASS | None |
| finding-map.json | PASS | None |
| behavior-test-coverage-map.json | PASS | None |
| runtime-cost-map.json | PASS | None |
| native-parity-map.json | PASS | None |
| business-impact-map.json | PASS | None |
| behavior-coverage-map.json | PASS | None |
| governance-graph.json | PASS | None |
| reexport-map.json | PASS | None |
| symbol-resolution-map.json | PASS | None |
| dead-export-map.json | PASS | None |
| test-map.json | PASS | None |
| graph.json | PASS | None |
| engine-candidates.json | PASS | None |
| graph semantics | PASS | None |
| dependency-map.json confidence | PASS | None |
| route-map.json confidence | PASS | None |
| write-surface-map.json confidence | PASS | None |
| rpc-map.json confidence | PASS | None |
| edge-function-map.json confidence | PASS | None |
| engine-candidates.json confidence | PASS | None |
| screen-map.json confidence | PASS | None |

## Route Validation Results

- Routes indexed: 253
- Route nodes retain `RouteNode`: 253
- Confidence: HIGH: 253

## Dependency Validation Results

- Dependencies indexed: 404
- Confidence: HIGH: 397, MEDIUM: 7

## Engine Validation Results

- Engine candidates indexed: 17
- Engine folders included: booking, chat, hydration, i18n, identity, media, notifications, portfolio, reviews
- Confidence: MEDIUM: 8, HIGH: 9

## Confidence Distribution

| Map | Distribution |
|---|---|
| route-map.json | HIGH: 253 |
| dependency-map.json | HIGH: 397, MEDIUM: 7 |
| write-surface-map.json | HIGH: 500 |
| rpc-map.json | HIGH: 82 |
| edge-function-map.json | HIGH: 59 |
| engine-candidates.json | MEDIUM: 8, HIGH: 9 |

## ARCHITECT Readiness

| Map | Ready For ARCHITECT | Confidence |
|---|---|---|
| feature-map.json | Yes | HIGH |
| dependency-map.json | Yes | HIGH |
| route-map.json | Yes | HIGH |
| write-surface-map.json | Yes | HIGH |
| rpc-map.json | Yes | HIGH |
| edge-function-map.json | Yes | HIGH |
| test-map.json | Yes | HIGH |
| graph.json | Yes | HIGH |
| engine-candidates.json | Advisory | MEDIUM |

## Known Limitations

- Scanner confidence is source-discovery confidence, not architecture approval.
- Route protection is inferred from guard/source naming and should be verified by ARCHITECT before risk claims.
- Import resolution supports project aliases and common engine aliases, but does not fully execute bundler config.
- Engine candidates are advisory domain groupings and require ARCHITECT or DR. STRANGE review before extraction decisions.
