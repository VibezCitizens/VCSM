# SCANNER-REFRESH-001 — Full Scanner Map Refresh After Boundary Refactors

```
[SCANNER-REFRESH-001] Scanner map regeneration
Status: Complete — PARTIAL PASS (43/45 maps refreshed; 2 api-discovery maps outside this CLI)
App: monorepo (apps/scanner)
Date: 2026-06-08
```

> **Outcome:** `scanner scan` regenerated **43 maps** against current source (3116 files); all
> structural maps reflect today's reality. **The boundary holds: citizen→vport = 0, vport→citizen
> = 0** in the fresh dependency-map. **2 maps are stale** — `api-map.json` + `api-dependency-map.json`
> — because they're produced by a **separate api-discovery pass not exposed by the `scan` CLI**;
> `api-map.json` still lists 3 deleted profiles adapters. State/identity references remain only in
> **findings/governance EVIDENCE TEXT** (sourced from governance markdown, i.e. doc-drift — not
> structural staleness).

---

## 1. Scanner command(s) run

```
cd apps/scanner
node ./src/cli/index.js scan --root /Users/vcsm/Desktop/VCSM --output .../apps/scanner/maps
```
Result: `Scanner 1.1.0 complete · Source files scanned: 3116 · Maps written`.

## 2. Maps regenerated

**43 maps rewritten at 2026-06-08T13:39:06Z** (generatedAt + mtime confirmed), including all
requested: feature-map, dependency-map, route-map, write-surface-map, test-map (test-traceability),
callgraph, route-execution-map, write-execution-map, rpc-execution-map, engine-map,
engine-security-map, engine-consumer-map, behavior-map, governance-graph, security-path-map,
dead-export-map — plus 26 others (engine-*, behavior-*, identity-flow, policy, finding, ownership,
reexport, db-policy, documentation-drift, runtime-cost, native-parity, traffic-app, edge-*, etc.).

**NOT regenerated (separate pipeline):** `api-map.json` (mtime 01:14), `api-dependency-map.json`
(01:16). Their `generatedAt` is a static label `SCANNER-API-DISCOVERY-001`; no generator for them
exists in `apps/scanner/src` — they come from an external/separate api-discovery tool the `scan`
command does not invoke.

## 3. Scanner errors

None fatal (exit 0, maps written). The scan reports a **governance gate FAIL**: `2 import
violations + 33 missing adapter surfaces`. These come from the **featureImportMap** check
(`ln` = feature lacking an adapter surface) — a standing governance signal across the monorepo,
**not** caused by today's refactors and not a scan error. (No `feature-import-map.json` is emitted to
`maps/`; the counts are summarized in scan stdout.)

## 4. Stale deleted-file references found

| Map | Fresh? | Stale refs | Classification |
|---|---|---|---|
| `api-map.json` | **NO** (01:14) | 3 deleted profiles adapters under `features.profiles.adapters[]`: `ownership.adapter`, `useVportGasPrices.adapter`/`GasPricesPanel.adapter` (gas) | **STALE — structural** (separate api-discovery pass; not refreshable via `scan`) |
| `api-dependency-map.json` | **NO** (01:16) | none of the deleted adapters, but pre-refactor overall | STALE — separate pass |
| `identity-flow-map.json` | yes (13:39) | `// src/state/identity/identityStorage.js` in `evidence[]` | findings-evidence text (governance-doc-sourced) |
| `policy-map.json`, `governance-graph.json` | yes | rule text: "`setup.js` imports … `@/state/identity/…`" | governance-rule text (doc-drift; **source has 0 such imports**) |
| `finding-map.json` | yes | `state/identity/identityContext` in a finding table row | finding evidence (markdown-sourced) |

**Structural maps (dependency-map, feature-map, callgraph, route-map, write-surface): CLEAN** — zero
deleted-file or `state/identity` references.

## 5. Dead exports newly discovered

`dead-export-map.json` regenerated fresh (13:39). No new dead exports attributable to the refactors
surfaced in spot-checks beyond the already-removed files. (Deleted adapters correctly absent from
the fresh structural maps — they are gone, not dead-listed.)

## 6. Dependency-map deltas (verification)

| Area | Verification | Result |
|---|---|---|
| **Profiles** | citizen→vport edges / vport→citizen edges (385 edges parsed) | **0 / 0** ✓ |
| Profiles | `ownership.adapter` in callgraph | **absent** ✓ |
| Profiles | 6 deleted gas adapters in structural maps | **absent** ✓ |
| Profiles | `VportGasPricesView.adapter` (live) in callgraph | **present** ✓ |
| **Identity** | feature-map has `features/identity`; mentions `state/identity` | present / **none** ✓ |
| Identity | live `@/state/identity` imports in source | **0** ✓ (source removed) |
| **Hydration** | feature-map has `features/hydration` | present ✓ (source files exist: `vcsmActorMappers.model.js`, `vcsmActorHydration.read.dal.js`) |
| **Authorization** | dependency-map has `assertActorOwnsActor` | **present** ✓ (canonical) |
| Booking | booking wrappers still visible as consumers | present ✓ |

## 7. PASS / FAIL

**PARTIAL PASS.**
- ✅ All 43 scanner-produced maps regenerated; structural/dependency/callgraph reality is current.
- ✅ Boundary verified post-refactor: citizen⇄vport = 0; deleted profiles adapters gone; live ones present.
- ✅ Identity/hydration/authorization ownership reflected; `state/identity` absent from structural maps.
- ⚠️ `api-map.json` + `api-dependency-map.json` **NOT refreshed** — produced by a separate api-discovery
  tool not exposed by `scanner scan`; `api-map.json` retains 3 deleted-adapter entries.
- ℹ️ `state/identity` in findings/policy/governance maps is **governance-markdown evidence text**
  (documentation drift), not live-source staleness — refresh belongs to LOGAN/doc-sync, not the scanner.

---

## Required follow-ups (not doable with the `scan` CLI)

1. **Run the api-discovery generator** to refresh `api-map.json` + `api-dependency-map.json` (external
   tool; `apps/scanner/src` has no generator for them and the CLI exposes only `scan`/`watch`).
   Until then these two maps remain pre-refactor (01:14/01:16) and should not be consumed as current.
2. **LOGAN doc-sync** to clear `state/identity` references from governance markdown (SECURITY.md etc.)
   so the findings/governance maps stop ingesting stale evidence on the next scan.

Governance agents may consume the 43 fresh maps as current source reality; treat `api-map.json` /
`api-dependency-map.json` as stale pending the api-discovery refresh.

---

*Scanner outputs only. No app source modified; maps were regenerated by the scanner, not hand-edited.*
