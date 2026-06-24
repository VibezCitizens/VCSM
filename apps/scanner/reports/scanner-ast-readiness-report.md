# Scanner AST Readiness Report

Generated: 2026-06-24T06:36:32.070Z

## Accuracy Upgrade

| Area | Old Scanner | AST Scanner |
|---|---|---|
| Imports | regex/string extraction | Babel AST import/export extraction |
| Routes | regex route literals | JSX Route and route object AST extraction plus Next file routes |
| Writes | chained-call regex | AST call-expression extraction |
| RPCs | embedded in write map | dedicated rpc-map.json |
| Edge functions | embedded in write map | dedicated edge-function-map.json |
| Tests | filename ownership | test declaration extraction plus ownership |

## Discovery Counts

| Output | Count |
|---|---:|
| Dependencies | 404 |
| Routes | 253 |
| Writes | 500 |
| RPCs | 82 |
| Edge functions | 59 |
| Engine candidates | 17 |

## Consumer Readiness

| Consumer | Readiness | Inputs |
|---|---|---|
| ARCHITECT | READY | feature, dependency, route, write, rpc, edge, graph, test maps |
| VENOM | READY | write, rpc, edge, route maps |
| DR. STRANGE | READY | feature, dependency, graph, engine candidates |
| THOR | READY | all maps with freshness and confidence metadata |

## Remaining Precision Limits

- Scanner does not execute application code or bundler plugins.
- Protected route detection from wrapper structure is still conservative.
- AST extraction confidence is not governance approval.
