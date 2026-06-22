# TICKET-SCANNER-BARREL-REEXPORT-TRACE-0001 — Scanner Barrel Resolution Upgrade

**Date:** 2026-06-02
**Command:** SCANNER
**Ticket:** TICKET-SCANNER-BARREL-REEXPORT-TRACE-0001
**Type:** SEC — scanner precision upgrade
**App:** scanner (`apps/scanner/`)
**Scope:** Scanner only. No VCSM source, no engines, no CURRENT modified.

---

## Context

HAWKEYE validation (TICKET-HAWKEYE-LIKE-DISLIKE-TRACE-0001) confirmed that the
scanner produced a false dead-export signal for `usePostReactionOps` because it
could not follow the re-export chain through `post.adapter.js`.

The scanner resolved imports to the barrel file but found no declared symbol there
— the `resolveCallTarget` function dropped the edge. This created a false
`UNUSED_EXPORT` verdict for a live production write path to `vc.post_reactions`.

Root cause: the scanner had no mechanism to resolve `export { X } from '...'`
re-export chains through barrel and adapter files.

---

## Files Created

| File | Purpose |
|---|---|
| `src/parsers/ast/reexportExtractor.js` | AST visitor — extracts all 4 re-export forms per source file |
| `src/resolvers/barrelResolver.js` | Multi-hop resolver — `buildReexportIndex` + `resolveOriginSymbol` + `buildBarrelChain` |
| `src/scanners/barrelReexportScanner.js` | Generates `reexport-map.json` + `symbol-resolution-map.json` |
| `src/scanners/deadExportScanner.js` | Generates `dead-export-map.json` — exported symbols with 0 CALLS consumers |
| `docs/ScannerBarrelResolutionArchitecture.md` | Architecture spec — re-export forms, pipeline, limitations |
| `reports/scanner-barrel-validation-report.md` | Validation output with per-case results |

## Files Modified

| File | Change |
|---|---|
| `src/core/sourceRecords.js` | Added `reexports` field to every source record via `extractReexportsFromAst` |
| `src/scanners/callGraphScanner.js` | Barrel fallback in `resolveCallTarget`; `buildReexportEdges`; `buildBarrelNodes`; exports `reexportIndex` + `barrelResolutions` |
| `src/scanners/engineDiscoveryScanner.js` | Added `discoverEntrypointConsumers` — per-symbol consumer counts on `engine-entrypoint-map.json` |
| `src/core/runScan.js` | Wired `scanBarrelReexports` + `scanDeadExports`; 3 new map outputs added |

## New Map Outputs

| Map | Description |
|---|---|
| `maps/reexport-map.json` | Flat list of all barrel re-export edges in the codebase |
| `maps/symbol-resolution-map.json` | Per-consumer barrel chain resolutions (consumer → barrel → origin) |
| `maps/dead-export-map.json` | Exported symbols with zero CALLS consumers |

---

## Validation Results

**Scanner ran clean on 3028 files. Zero errors.**

### Known False Positive — CORRECTED

**`usePostReactionOps`:**

Previously: no CALLS edge → appeared dead.

Now:
```
usePhotoReactions → usePostReactionOps
  via: [post.adapter.js]
  type: CALLS
  confidence: HIGH
  evidence: imported symbol call resolved via barrel re-export chain
```

**`symbol-resolution-map.json` entry:**
```
consumer:       usePhotoReactions.js
importedFrom:   post.adapter.js  (barrel)
origin:         usePostReactionOps.js
confidence:     HIGH
```

### Known Dead Export — CONFIRMED

**`chat.addReaction`:**
```
symbol:         addReaction
file:           engines/chat/src/services/reactionService.js
consumerCount:  0
isBarrelTarget: false
status:         UNUSED_EXPORT
```

Confirmed in both `dead-export-map.json` and `engine-entrypoint-map.json`.

### Callgraph Impact

- Barrel-resolved CALLS edges added: **+339**
- REEXPORTED_FROM edges added: covered by reexport index
- Virtual barrel nodes added: one per named re-export
- Dead exports detected: **1452** total, **90** in `engine:chat`

---

## Architecture Notes

### Re-Export Forms Handled

| Form | Kind |
|---|---|
| `export { X } from '...'` | named |
| `export { X as Y } from '...'` | named alias |
| `export * from '...'` | wildcard |
| `export * as NS from '...'` | namespace |

### NOT Handled (Documented Limitation)

The two-statement adapter pattern:
```javascript
import { X } from './origin'
export { X }               // no `from` clause
```

This is not captured as a barrel re-export because `ExportNamedDeclaration`
without `node.source` is not a re-export statement — it's exporting a locally
bound name. Dead export detection remains accurate regardless (it counts CALLS
edges, not barrel chains). The only gap is the `isBarrelTarget` annotation.

`chat.adapter.js` uses this pattern for `addReaction`, which is why
`isBarrelTarget: false` — correctly so.

---

## Edge Types Added to callgraph.json

| Type | Direction | Purpose |
|---|---|---|
| `CALLS` (enriched) | consumer → origin | Barrel-resolved call with `via[]` and barrel-chain evidence |
| `REEXPORTED_FROM` | barrel node → origin | Relay structure made explicit in graph |

---

## Preceding Tickets That Drove This Work

| Ticket | Finding |
|---|---|
| TICKET-SCANNER-TRACE-LIKE-DISLIKE-0001 | Scanner output used to trace like/dislike paths |
| TICKET-HAWKEYE-LIKE-DISLIKE-TRACE-0001 | HAWKEYE confirmed `usePostReactionOps` false dead, `chat.addReaction` truly dead, barrel gap identified |

---

## Remaining Scanner Gaps (Documented)

1. **Two-statement re-export** — `import X; export { X }` not tracked as barrel. Low impact.
2. **Namespace import calls** — `import * as NS; NS.method()` not resolved by `resolveCallTarget`. Medium impact for engine consumer counts.
3. **Dynamic import + barrel** — `await import('@chat')` not barrel-resolved. Low in this codebase.

---

## Next Ticket

**TICKET-SCANNER-SIDEEFFECT-TRACE-0001**

Scanner does not trace side-effect calls (notification dispatch, domain event
publish, external service calls) that branch off the primary execution path.
Confirmed gap: `toggleCommentLike` dispatches `publishVcsmNotification` — the
callgraph edge from controller to notification adapter was not in the prior
scanner output. A side-effect surface map would complement the security path map
with explicit notification and event triggers.
