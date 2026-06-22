# Graph Contract

File: `maps/graph.json`

Purpose: normalize scanner outputs into graph nodes and edges for downstream consumers.

Required top-level fields:

- `version`: number
- `generatedAt`: ISO timestamp
- `nodes`: array
- `edges`: array

Node types:

- `FeatureNode`
- `EngineNode`
- `RouteNode`
- `ControllerNode`
- `DALNode`
- `ModelNode`
- `HookNode`
- `AdapterNode`
- `ScreenNode`
- `ComponentNode`
- `TestNode`
- `WriteSurfaceNode`

Edge types:

- `USES`
- `IMPORTS`
- `OWNS`
- `WRITES`
- `CALLS`
- `DEPENDS_ON`
- `ROUTES_TO`
- `USES_HOOK`
- `USES_CONTROLLER`
- `USES_DAL`
- `USES_RPC`
- `USES_EDGE_FUNCTION`
- `TESTS`

Scanner V1 emits `IMPORTS`, `OWNS`, `WRITES`, and `DEPENDS_ON` where directly observable.
