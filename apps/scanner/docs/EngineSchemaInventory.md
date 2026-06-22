# Engine Schema Inventory

Engine maps use the scanner freshness envelope: `version`, `scannerVersion`, `generatedAt`, `root`, `scanDurationMs`, `confidence`, count fields, and `data`.

## engine-map.json

Required engine fields: `engine`, `path`, `hasClaude`, `exports`, `entrypoints`, `controllers`, `dals`, `rpcs`, `edgeFunctions`, `tests`, `confidence`.

## engine-graph.json

Required fields: `nodes`, `edges`. Nodes require `id` and `type`. Edges require `from`, `to`, and `type`.

## engine-consumer-map.json

Required fields: `engine`, `consumers`, `confidence`.

## engine-entrypoint-map.json

Required fields: `engine`, `path`, `entrypoints`, `confidence`.

## engine-ownership-map.json

Required fields: `engine`, `path`, `hasClaude`, `ownership`, `responsibility`, `allowedConsumers`, `boundaryRules`, `confidence`.

## engine-security-map.json

Required fields: `engine`, `writes`, `rpcs`, `edgeFunctions`, `externalApis`, `riskTier`, `surfaces`, `confidence`.

## engine-execution-map.json

Required fields: `engine`, `confidence`, `evidence`. Optional fields include `feature`, `imports`, and `calls`.
