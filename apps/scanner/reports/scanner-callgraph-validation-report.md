# Scanner Callgraph Validation Report

Generated: 2026-06-08T13:39:06.995Z

## Validation Results

| Area | Count | Status |
|---|---:|---|
| Call graph nodes | 7552 | PASS |
| Call graph edges | 9850 | PASS |
| Route execution paths | 243 | PASS |
| Write execution paths | 491 | PASS |
| RPC execution paths | 73 | PASS |
| Edge execution paths | 52 | PASS |
| Test traceability paths | 110 | PASS |
| Security paths | 616 | PASS |
| Engine execution paths | 29 | PASS |

## Scope Fixtures

The regression suite includes a route-to-screen-to-hook-to-controller-to-DAL-to-RPC fixture chain.

## Command Readiness

| Map | Consumer | Ready |
|---|---|---|
| callgraph.json | ARCHITECT | Yes |
| route-execution-map.json | ARCHITECT | Yes |
| write-execution-map.json | VENOM | Yes |
| rpc-execution-map.json | VENOM | Yes |
| edge-execution-map.json | VENOM | Yes |
| test-traceability-map.json | SPIDER-MAN | Yes |
| security-path-map.json | VENOM | Advisory |
| engine-execution-map.json | DR. STRANGE | Yes |
| graph.json | THOR | Yes |

## Known Limits

- Execution paths are static source paths, not runtime traces.
- Dynamic dispatch, callback wiring, and generated routes remain conservative.
- Security path output is potential attack surface inventory only.
