# Scanner Callgraph Validation Report

Generated: 2026-06-24T06:36:32.071Z

## Validation Results

| Area | Count | Status |
|---|---:|---|
| Call graph nodes | 7688 | PASS |
| Call graph edges | 10129 | PASS |
| Route execution paths | 253 | PASS |
| Write execution paths | 559 | PASS |
| RPC execution paths | 82 | PASS |
| Edge execution paths | 118 | PASS |
| Test traceability paths | 126 | PASS |
| Security paths | 699 | PASS |
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
