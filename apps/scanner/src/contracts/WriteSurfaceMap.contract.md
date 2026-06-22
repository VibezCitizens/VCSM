# WriteSurfaceMap Contract

File: `maps/write-surface-map.json`

Purpose: discover mutating database, RPC, and edge-function surfaces.

Required top-level fields:

- `version`: number
- `generatedAt`: ISO timestamp
- `writeSurfaces`: array

Write surface entry:

- `operation`: `insert`, `update`, `delete`, `upsert`, `rpc`, `edge_function`, or `edge_function_file`
- `schema`: schema name when observable
- `table`: table name when observable
- `rpc`: RPC function name when observable
- `functionName`: edge function name when observable
- `owner`: owning feature, engine, or app area
- `ownerKind`: owner classification
- `layer`: source layer inferred from path
- `file`: repository-relative source file
