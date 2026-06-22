# Platform Section Map
## Phase 1 — Read and Classify

> **Source:** platformcontract.md (PlatformArchitectureContract.md, 294 lines)
> **Generated for:** Contract library decomposition planning
> **Rule:** Do not modify platformcontract.md until PLATFORM_SPLIT_PLAN.md is approved

---

| Section | Current Location | Category | Suggested File |
|---|---|---|---|
| Document header (title, lock status) | Lines 1–2 | platform-structure | 01-platform-structure.md |
| Contract purpose (defines structural rules) | Lines 4–5 | platform-structure | 01-platform-structure.md |
| Three primary layers (Apps, Engines, Shared) | Lines 6–11 | platform-structure | 01-platform-structure.md |
| Platform guarantees (modular arch, reuse, multi-product, DAG, compatibility) | Lines 13–21 | platform-structure | 01-platform-structure.md |
| Platform Structure — root directory layout | Lines 22–31 | platform-structure | 01-platform-structure.md |
| Apps Layer — location, definition, examples | Lines 34–48 | layer-responsibilities | 02-layer-responsibilities.md |
| Apps Layer — responsibilities list | Lines 48–56 | layer-responsibilities | 02-layer-responsibilities.md |
| Apps Layer — dependency rule (consume engines; must not depend on other apps) | Lines 58–61 | layer-responsibilities | 02-layer-responsibilities.md |
| Engines Layer — location, definition, examples | Lines 62–75 | layer-responsibilities | 02-layer-responsibilities.md |
| Engines Layer — responsibilities list | Lines 77–86 | layer-responsibilities | 02-layer-responsibilities.md |
| Engines Layer — constraint (no product-specific logic; consumed by apps) | Lines 87–89 | layer-responsibilities | 02-layer-responsibilities.md |
| Shared Layer — location, definition, examples | Lines 91–103 | layer-responsibilities | 02-layer-responsibilities.md |
| Shared Layer — contents list | Lines 105–111 | layer-responsibilities | 02-layer-responsibilities.md |
| Shared Layer — constraint (must never depend on apps or engines) | Lines 112–113 | layer-responsibilities | 02-layer-responsibilities.md |
| Dependency Direction Rule | Lines 114–128 | dependency-rules | 03-dependency-rules.md |
| App Isolation Rule | Lines 132–141 | dependency-rules | 03-dependency-rules.md |
| Engine Isolation Rule | Lines 143–149 | dependency-rules | 03-dependency-rules.md |
| Shared Isolation Rule | Lines 151–162 | dependency-rules | 03-dependency-rules.md |
| Engine Internal Architecture — layered structure, example, layer order | Lines 163–185 | engine-architecture | 04-engine-architecture.md |
| App Architecture — internal structure, assembly rule | Lines 186–200 | app-architecture | 05-app-architecture.md |
| Platform Routing Rule | Lines 202–220 | app-architecture | 05-app-architecture.md |
| Platform Deployment Rule | Lines 221–232 | app-architecture | 05-app-architecture.md |
| Platform Event Model | Lines 235–248 | platform-events | 06-platform-principles.md |
| Platform Ownership Model | Lines 250–258 | platform-principles | 06-platform-principles.md |
| Platform Scaling Model | Lines 260–278 | platform-principles | 06-platform-principles.md |
| Enforcement Rule | Lines 280–286 | platform-principles | 06-platform-principles.md |
| Platform Principle | Lines 288–292 | platform-principles | 06-platform-principles.md |
| Next Recommended Files | Lines 293–294 | meta | platformcontract.md (stub preserved) |

---

## Category Summary

| Category | Section Count | Target File |
|---|---|---|
| platform-structure | 5 | 01-platform-structure.md |
| layer-responsibilities | 9 | 02-layer-responsibilities.md |
| dependency-rules | 4 | 03-dependency-rules.md |
| engine-architecture | 1 | 04-engine-architecture.md |
| app-architecture | 3 | 05-app-architecture.md |
| platform-events | 1 | 06-platform-principles.md |
| platform-principles | 5 | 06-platform-principles.md |
| meta | 1 | platformcontract.md (preserved) |

---

## Extraction Notes

- The Platform Event Model is grouped with platform principles (06-platform-principles.md) rather than given its own file because it is short and its rules relate directly to the ownership separation principle.
- App Architecture, Platform Routing Rule, and Platform Deployment Rule are co-located in 05-app-architecture.md because all three govern how apps are structured and deployed.
- The "Next Recommended Files" stub (lines 293–294) is preserved in platformcontract.md only; it is not extracted to any library file as it contains no rule content.
- Source file `PlatformArchitectureContract.md` is superseded by `platformcontract.md`. The old file should be deleted after verification (see PLATFORM_SPLIT_PLAN.md).
