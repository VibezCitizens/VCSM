# Scanner Call Graph Architecture

Call Graph V1 discovers source-level execution paths from AST evidence. It does not execute code and does not assert security or architecture findings.

## Node Types

- Route nodes from `route-map.json`
- Layer symbol nodes for screens, hooks, controllers, DALs, models, adapters, and components
- Write surface nodes
- RPC nodes
- Edge function nodes
- Test nodes
- Engine nodes

## Edge Types

- `CALLS`: function or JSX symbol calls another symbol
- `ROUTES_TO`: route links to a route element or screen symbol
- `USES_HOOK`: route path traverses a hook
- `USES_CONTROLLER`: route path traverses a controller
- `USES_DAL`: route path traverses a DAL
- `USES_RPC`: route path reaches an RPC
- `USES_EDGE_FUNCTION`: route path reaches an edge function
- `TESTS`: test symbol path reaches a production symbol

## Confidence Model

- `HIGH`: direct AST symbol or call evidence
- `MEDIUM`: AST evidence plus import/path traversal heuristic
- `LOW`: discovered source surface without a resolved caller path
- `BLOCKED`: reserved for map/source conflicts

## Traversal Model

Traversal starts from route elements, tests, or imported engine APIs. It follows resolved local and imported call edges up to a bounded depth, then joins discovered files to write surfaces, RPCs, and edge functions.
