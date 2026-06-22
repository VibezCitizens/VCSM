# EngineMap Contract

File: `maps/engine-candidates.json`

Purpose: discover reusable business-domain candidates and their observable consumers.

Required top-level fields:

- `version`: number
- `generatedAt`: ISO timestamp
- `engineCandidates`: array

Engine candidate entry:

- `domain`: reusable business domain name
- `consumers`: owners referencing the domain
- `controllers`: controller files touching the domain
- `dals`: DAL files touching the domain
- `writeSurfaces`: related write-surface observations
- `riskTier`: scanner heuristic of `low`, `medium`, or `high`

Risk tier is a discovery heuristic based on consumer and write-surface counts. It is not governance.
