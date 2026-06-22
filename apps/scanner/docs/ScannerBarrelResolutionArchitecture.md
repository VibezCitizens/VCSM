# Scanner Barrel Resolution Architecture

This document defines how the scanner resolves symbol ownership through barrel
files, adapter re-export files, and multi-hop re-export chains.

---

## Problem Statement

JavaScript codebases commonly use barrel files and adapter files to re-export
symbols from their origin modules. Before this layer was added, the scanner
could not follow these chains — symbols appeared unreachable from any consumer,
producing false dead-export signals.

**Confirmed miss (HAWKEYE-LIKE-DISLIKE-TRACE-0001):**

```
usePhotoReactions.js
  import { usePostReactionOps } from "@/features/post/adapters/post.adapter"
                                        ↑ barrel file
post.adapter.js
  export { usePostReactionOps } from "@/features/post/postcard/hooks/usePostReactionOps"
                                        ↑ origin declaration
```

The scanner resolved the import to `post.adapter.js` but found no declared
symbol `usePostReactionOps` there, so the edge was dropped. The origin
`usePostReactionOps.js` was never linked — producing a false UNUSED_EXPORT
signal for a live production path.

---

## Re-Export Forms Handled

| Syntax | Kind | Handled |
|---|---|---|
| `export { X } from '...'` | `named` | Yes |
| `export { X as Y } from '...'` | `named` (alias) | Yes |
| `export * from '...'` | `wildcard` | Yes |
| `export * as NS from '...'` | `namespace` | Yes |

---

## Architecture Overview

```
Source file (AST)
  ↓  reexportExtractor.js
Re-export records
  [{ exportedName, sourceName, fromPath, kind }]

  ↓  barrelResolver.buildReexportIndex()  (async — resolves paths)
Reexport Index
  Map<relativeFile, Map<exportedSymbol, { fromFile, fromSymbol, kind }>>

  ↓  callGraphScanner.resolveCallTarget()  (inline during edge build)
Barrel-resolved CALLS edges
  + REEXPORTED_FROM edges
  + virtual barrel nodes

  ↓  barrelReexportScanner.scanBarrelReexports()
reexport-map.json          — flat list of all re-export edges
symbol-resolution-map.json — per-consumer barrel chains

  ↓  deadExportScanner.scanDeadExports()
dead-export-map.json       — exported symbols with zero CALLS consumers

  ↓  engineDiscoveryScanner (enhanced)
engine-entrypoint-map.json — per-symbol consumer counts added
```

---

## Component Definitions

### `reexportExtractor.js`

Location: `src/parsers/ast/reexportExtractor.js`

AST visitor that walks a parsed source file and returns all re-export
statements as structured records. Called once per source file during
`createSourceRecords`, adding a `reexports` field to every source record.

---

### `barrelResolver.js`

Location: `src/resolvers/barrelResolver.js`

**`buildReexportIndex(config, sourceRecords)`**

Async. Iterates all source records with non-empty `reexports` arrays.
For each re-export, resolves the `fromPath` to an absolute path using
`resolveImport` + `findExistingPath`, then stores the relative path.

Returns `Map<file, Map<exportedName | wildcardSentinel, {fromFile, fromSymbol, kind}>>`.

Wildcard re-exports (`export * from '...'`) are keyed as `*:<fromFile>` to allow
multiple wildcard sources in the same barrel without key collision.

**`resolveOriginSymbol(reexportIndex, file, symbolName, depth)`**

Synchronous. Recursively follows the re-export chain from `file` through any
number of barrel hops until it reaches a file that is NOT in the index (i.e.,
the origin declaration site).

Max depth: 6. Returns `{ file, symbolName, depth }` or `null`.

**`buildBarrelChain(reexportIndex, startFile, symbolName)`**

Returns the ordered list of barrel hops plus the final origin.
Used by `barrelReexportScanner` to build the `symbol-resolution-map`.

---

### `callGraphScanner.js` — extensions

**`buildReexportEdges(reexportIndex, index)`**

For every named re-export in the reexport index, creates a
`REEXPORTED_FROM` edge from a virtual barrel node to the origin
declaration node. Provides explicit graph visibility into relay structure.

Edge schema:
```json
{
  "from": "barrel:<barrelFile>#<exportedName>",
  "to":   "<layer>:<originFile>#<originSymbol>",
  "type": "REEXPORTED_FROM",
  "callKind": "barrel",
  "confidence": "HIGH"
}
```

**`buildBarrelNodes(reexportIndex)`**

Creates one virtual node per named re-export in barrel files:
```json
{
  "id":    "barrel:<barrelFile>#<exportedName>",
  "layer": "barrel",
  "exported": true
}
```

Barrel nodes are included in the `callgraph.json` node list so the graph
remains consistent (every edge endpoint has a node).

**`resolveCallTarget` — barrel fallback**

When the direct symbol lookup fails (target not declared in the imported
file), the scanner invokes `resolveOriginSymbol` on the reexport index.
If an origin is found and declared in the symbol index, the edge is
emitted as a normal `CALLS` edge with:
- `confidence: "HIGH"`
- `evidence: ["imported symbol call resolved via barrel re-export chain"]`
- `via: [barrelFile]` — the intermediate barrel file(s) traversed

---

### `barrelReexportScanner.js`

Location: `src/scanners/barrelReexportScanner.js`

Consumes `reexportIndex` (internal Map from `callGraphScanner`) and
`barrelResolutions` (array collected during callgraph edge building) to
produce two output maps.

**`reexport-map.json`** — flat list of every re-export edge. One entry per
`(sourceFile, exportedName)` pair.

Fields: `sourceFile`, `exportFile`, `symbol`, `alias`, `kind`, `confidence`

**`symbol-resolution-map.json`** — per-consumer chains. For each place in the
codebase where a symbol was imported through a barrel and a call edge was
successfully resolved, records the full chain: consumer → barrel(s) → origin.

Fields: `consumer`, `importedSymbol`, `importedFrom`, `chain`, `origin`, `confidence`

---

### `deadExportScanner.js`

Location: `src/scanners/deadExportScanner.js`

Uses the barrel-resolved callgraph to count incoming `CALLS` edges per symbol.
Exported symbols with zero incoming CALLS edges are flagged as `UNUSED_EXPORT`.

**Exclusions:**
- Barrel virtual nodes (`layer === "barrel"`) — relays are never consumers
- Test files
- Default exports from entry files (some are side-effect only)

**Output — `dead-export-map.json`:**
```json
{
  "symbol": "addReaction",
  "id": "module:engines/chat/src/services/reactionService.js#addReaction",
  "file": "engines/chat/src/services/reactionService.js",
  "layer": "module",
  "owner": "engine:chat",
  "consumerCount": 0,
  "isBarrelTarget": true,
  "status": "UNUSED_EXPORT"
}
```

`isBarrelTarget: true` means the symbol IS re-exported by a barrel (so the
barrel chain is live) but still has no active caller from any consumer file.

---

### `engineDiscoveryScanner.js` — extensions

**`discoverEntrypointConsumers(engine, entrypoints, callGraph)`**

For each exported symbol in an engine's entrypoint list, counts the number
of non-engine source files that have an incoming `CALLS` edge targeting that
symbol inside the engine path.

Added fields to `engine-entrypoint-map.json` entries:
- `symbolConsumers: { [symbolName]: { consumerCount, consumers[], status } }`
- `unusedExports: string[]` — names with `consumerCount === 0`

Uses the barrel-resolved callgraph so multi-hop consumer chains are counted.

---

## Re-Export Chain Examples

### Single-hop named re-export

```
post.adapter.js
  export { usePostReactionOps } from './hooks/usePostReactionOps'

usePhotoReactions.js
  import { usePostReactionOps } from '@/features/post/adapters/post.adapter'
  usePostReactionOps()
```

Resolution:
```
usePhotoReactions.js → usePostReactionOps
  imported from: post.adapter.js         (barrel)
  origin:        usePostReactionOps.js   (declaration)
  edge type:     CALLS (barrel chain)
```

### Multi-hop chain

```
A.js  export function foo() {}
B.js  export { foo } from './A'
C.js  export { foo } from './B'
D.js  import { foo } from './C'
      foo()
```

Resolution:
```
D.js → foo
  imported from: C.js (barrel hop 1)
  re-exports from: B.js (barrel hop 2)
  origin: A.js
  depth: 2
```

### Wildcard re-export

```
A.js  export function bar() {}
B.js  export * from './A'
C.js  import { bar } from './B'
      bar()
```

Resolution:
```
C.js → bar
  imported from: B.js (wildcard barrel)
  scanned wildcard sources → found bar in A.js
  origin: A.js#bar
```

---

## Dead Export vs Barrel-Target

A symbol can be:

| `consumerCount` | `isBarrelTarget` | Status | Meaning |
|---|---|---|---|
| 0 | false | `UNUSED_EXPORT` | Truly dead — not re-exported, not called |
| 0 | true | `UNUSED_EXPORT` | Re-exported but no consumer calls it |
| >0 | any | live | At least one consumer calls it |

`chat.addReaction` is the canonical case: `isBarrelTarget: true` (exported
from `chat.adapter.js`) + `consumerCount: 0` (no VCSM app calls it).

---

## Output Files Added

| File | Scanner | Description |
|---|---|---|
| `reexport-map.json` | `barrelReexportScanner` | All re-export edges in the codebase |
| `symbol-resolution-map.json` | `barrelReexportScanner` | Per-consumer barrel chain resolutions |
| `dead-export-map.json` | `deadExportScanner` | Exported symbols with zero CALLS consumers |
| `engine-entrypoint-map.json` | `engineDiscoveryScanner` (enhanced) | Per-symbol consumer counts added |

---

## Known Limitations

1. **Wildcard barrel depth**: Wildcard re-exports (`export * from '...'`) are
   traversed recursively, but only for named symbol lookups (when the consumer
   imports a specific name). Namespace imports (`import * as NS`) are not traced.

2. **Dynamic imports**: `import('./barrel')` forms are not resolved through the
   barrel layer (they are flagged as `dynamic-import` in the import extractor
   and skipped by the barrel resolver).

3. **Computed re-exports**: `export { [name]: value }` with computed keys cannot
   be resolved statically. Only literal string names are handled.

4. **Cross-app barrel chains**: The `reexportIndex` is built globally across all
   scan roots. A barrel in `apps/VCSM` re-exporting from `engines/` is tracked,
   but isolation rules (VCSM never imports from wentrex) are not enforced by
   the barrel layer — those are a governance concern.
