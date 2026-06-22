# Scanner V1

Scanner V1 is a read-only Source Reality Engine. It discovers repository structure, relationships, routes, write surfaces, tests, graph nodes, graph edges, and reusable engine candidates. It does not enforce governance, assign policy status, or make product decisions.

## Runtime Flow

1. CLI receives `scanner scan`.
2. Config resolves the scanner root, repository root, scan roots, ignored directories, and output root.
3. Source files are collected from app, engine, and shared roots.
4. Feature discovery builds `feature-map.json`.
5. Dependency discovery parses imports and builds `dependency-map.json`.
6. Route discovery parses React Router and Next app-router files and builds `route-map.json`.
7. Write-surface discovery parses Supabase mutations, RPC calls, and edge function files and builds `write-surface-map.json`.
8. Test discovery maps test files to owning features or engines and builds `test-map.json`.
9. Graph construction merges all scanner outputs into `graph.json`.
10. Engine candidate detection groups reusable business domains into `engine-candidates.json`.
11. Maps are written to `apps/scanner/maps`.

## Output Contracts

Scanner outputs are JSON maps. Each map includes `version` and `generatedAt`. Contracts are stored in `src/contracts` and define required top-level fields and object semantics.

## Map Contracts

Maps are discovery artifacts only. Consumers may interpret risk, governance, or release policy, but the scanner itself only reports observable source reality.

## Future Consumers

ARCHITECT consumes `dependency-map.json`, `route-map.json`, and `graph.json`.

VENOM consumes `write-surface-map.json` and `route-map.json`.

SPIDER-MAN consumes `test-map.json` and `write-surface-map.json`.

DR. STRANGE consumes `feature-map.json`, `engine-candidates.json`, and `dependency-map.json`.

THOR consumes all scanner outputs.
