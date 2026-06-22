# VENOM V2 SECURITY REVIEW
# portfolio — VCSM
# 2026-06-04T19:48:00

---

## Output Metadata

| Field | Value |
|---|---|
| Category Key | vcsm.portfolio.security |
| Feature | portfolio |
| Command | VENOM V2 |
| Ticket | TICKET-VENOM-PORTFOLIO-0001 |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/portfolio/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_portfolio-security-review.md |
| Timestamp | 2026-06-04T19:48:00 |
| Reviewer | VENOM |
| Review Scope | VCSM + ENGINE (apps/VCSM/src/features/portfolio/ + engines/portfolio/) |

---

## 1. VENOM Scanner Preflight

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                 | Generated At              | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map   | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map             | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map   | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map   | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map   | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map  | 2026-06-04T19:48:25.152Z  | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

Pre-filter note: The scanner pre-filtered portfolio.json reports 0 write surfaces, 0 RPCs, 0 security paths, and 0 edge functions at the feature directory level. This is CORRECT by design — portfolio domain logic lives entirely in engines/portfolio/, not in apps/VCSM/src/features/portfolio/. VENOM has extended scope to engines/portfolio/ per ARCHITECTURE.md evidence.

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Surfaces In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 (feature dir) / ~8 (engine) | Confirmed 0 in feature dir; engine writes verified by source inspection |
| rpc-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | RPC surface inventory |
| edge-function-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Edge function surface inventory |
| security-path-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 (feature) | Security path inventory |
| route-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Route→write chain resolution |
| write-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 (feature) | Write surface caller chain resolution |
| rpc-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | RPC caller chain resolution |
| edge-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Edge caller chain resolution |

Scanner Version: 1.1.0
Overall Preflight: FRESH / PASS
Pre-filter surfaces in scope: 0 write + 0 rpc + 0 edge (feature dir)
Extended scope (engine): 8 write surfaces inspected via source (INSERT/UPDATE/DELETE in portfolioItems, portfolioMedia, portfolioTags)
Total security paths in scope: 0 (scanner) + engine inspection
HIGH confidence paths (resolved): N/A — all engine-level; resolved by source inspection
LOW confidence paths (unresolved): 0

Note: The scanner pre-filter captures only app-level surfaces. Engine-level write surfaces (engines/portfolio/src/dal/) are out of scanner feature-scope by design. VENOM extended review to the full engine DAL and all 8 controllers.

---

## 3. Security Surface Inventory

```
VENOM SECURITY SURFACE INVENTORY
==================================
Feature: portfolio
Scan Date: 2026-06-04T19:48:25.152Z

Pre-filter Write Surfaces: 0 (feature dir only)
Extended Engine Write Surfaces (source-inspected): 8
  INSERT: 3 (dalInsertPortfolioItem, dalInsertPortfolioMedia, dalInsertPortfolioTags)
  UPDATE: 3 (dalUpdatePortfolioItem, dalSoftDeletePortfolioItem, updatePortfolioMediaAssetIdDAL)
  DELETE: 2 (dalDeletePortfolioMedia, dalDeletePortfolioTags)
  UPSERT: 1 (dalInsertPortfolioTags — uses upsert with ignoreDuplicates)
  Tables affected: vport.portfolio_items, vport.portfolio_media, vport.portfolio_tags

RPC Calls: 0
Edge Functions: 0
Security Paths: 0 (scanner) / 8 controllers (source-inspected)

Source Files Inspected: 20
  engines/portfolio/src/config.js
  engines/portfolio/src/events.js
  engines/portfolio/src/services/portfolioService.js
  engines/portfolio/src/adapters/index.js
  engines/portfolio/index.js
  engines/portfolio/src/controller/createItem.controller.js
  engines/portfolio/src/controller/updateItem.controller.js
  engines/portfolio/src/controller/deleteItem.controller.js
  engines/portfolio/src/controller/addMedia.controller.js
  engines/portfolio/src/controller/removeMedia.controller.js
  engines/portfolio/src/controller/manageTags.controller.js
  engines/portfolio/src/controller/listPortfolio.controller.js
  engines/portfolio/src/controller/getPortfolioItem.controller.js
  engines/portfolio/src/dal/portfolioItems.read.dal.js
  engines/portfolio/src/dal/portfolioItems.write.dal.js
  engines/portfolio/src/dal/portfolioMedia.read.dal.js
  engines/portfolio/src/dal/portfolioMedia.write.dal.js
  engines/portfolio/src/dal/portfolioTags.read.dal.js
  engines/portfolio/src/dal/portfolioTags.write.dal.js
  engines/portfolio/src/model/PortfolioItem.model.js
  apps/VCSM/src/features/portfolio/setup.js
  apps/VCSM/src/features/portfolio/adapters/portfolioTrace.adapter.js
  apps/VCSM/src/features/profiles/kinds/vport/controller/portfolio/VportPortfolio.controller.js
  apps/VCSM/src/features/profiles/kinds/vport/hooks/portfolio/useVportPortfolio.js
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/VportDashboardPortfolioScreen.jsx
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/hooks/usePortfolioItemSubmit.js
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/controller/addPortfolioMediaWithRecord.controller.js
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/dal/portfolioMediaRecord.write.dal.js
  apps/VCSM/src/features/dashboard/vport/hooks/useVportOwnership.js
  apps/VCSM/src/shared/lib/ttlCache.js
  engines/portfolio/src/controller/__tests__/updateItem.controller.test.js
  engines/portfolio/src/dal/__tests__/portfolioTags.write.dal.test.js
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/components/PortfolioDevDiagnosticPanel.jsx
```

---

## 4. Scanner Signals

| Signal | Source Map | Map Entry | Scanner Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|---|
| Feature portfolio.json shows 0 write surfaces | write-surface-map | portfolio.json (pre-filter) | HIGH | YES — correct by architecture; all writes in engines/portfolio/dal/ | [SOURCE_VERIFIED] | Note: confirms engine-owned surfaces |
| manageTags controller calls dalReplacePortfolioTags without callerProfileId | Source inspection | engines/portfolio/src/controller/manageTags.controller.js:47 | N/A (manual) | YES — line 47: `dalReplacePortfolioTags({ itemId, tags: tags ?? [] })` — callerProfileId omitted | [SOURCE_VERIFIED] | VEN-PORTFOLIO-001 |
| dalReplacePortfolioTags requires callerProfileId | Source inspection | engines/portfolio/src/dal/portfolioTags.write.dal.js:61 | N/A (manual) | YES — line 61: `if (!callerProfileId) throw new Error(...)` | [SOURCE_VERIFIED] | VEN-PORTFOLIO-001 |
| invalidatePortfolioCache(actorId) uses exact-key delete but cache keys use compound format | Source inspection | VportPortfolio.controller.js:13,29 + ttlCache.js:31 | N/A (manual) | YES — cacheKey is `${actorId}:owner` or `${actorId}:public`; invalidate(actorId) deletes only `actorId` key | [SOURCE_VERIFIED] | VEN-PORTFOLIO-002 |
| getPortfolioItem has no visibility/is_deleted/is_active filter | Source inspection | engines/portfolio/src/controller/getPortfolioItem.controller.js:29 | N/A (manual) | YES — line 29: raw dalGetPortfolioItemById with no filter | [SOURCE_VERIFIED] | VEN-PORTFOLIO-003 |
| portfolioTrace.adapter.js exports always present in all builds | Source inspection | apps/VCSM/src/features/portfolio/adapters/portfolioTrace.adapter.js | N/A (manual) | YES — no import.meta.env.DEV guard at module level; guard only in setup.js for debugReporter | [SOURCE_VERIFIED] | VEN-PORTFOLIO-004 |
| PortfolioItemModel exposes profileId and createdByActorId to UI | Source inspection | engines/portfolio/src/model/PortfolioItem.model.js:13,27 | N/A (manual) | YES — profileId and createdByActorId returned in domain model consumed by PWA | [SOURCE_VERIFIED] | VEN-PORTFOLIO-005 |
| dalDeletePortfolioMedia relies solely on RLS for ownership enforcement | Source inspection | engines/portfolio/src/dal/portfolioMedia.write.dal.js:50-63 | N/A (manual) | YES — only .eq('id', mediaId); comment says "RLS enforces ownership" | [SOURCE_VERIFIED] | VEN-PORTFOLIO-006 |
| BEHAVIOR.md is PLACEHOLDER — no §5 or §9 contract | Behavior contract check | ZZnotforproduction/APPS/VCSM/features/portfolio/BEHAVIOR.md | N/A | YES — file exists but Status: PLACEHOLDER; no §5 or §9 sections | [SOURCE_VERIFIED] | VEN-PORTFOLIO-007 |

---

## 5. Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: ZZnotforproduction/APPS/VCSM/features/portfolio/BEHAVIOR.md
BEHAVIOR.md exists: YES
BEHAVIOR.md status: PLACEHOLDER
§5 Security Rules declared: 0 (PLACEHOLDER — section not written)
§5 Rules verified in source: 0 / 0
§5 Rules unenforced: NONE DECLARED
§9 Must Never Happen declared: 0 (PLACEHOLDER — section not written)
§9 Invariants protected in source: 0 / 0
§9 Invariants unprotected: NONE DECLARED
```

VENOM note: BEHAVIOR.md exists but is a PLACEHOLDER with no contract content. Security rules (§5) and Must Never Happen invariants (§9) are absent. This means VENOM cannot perform §5 cross-checks or §9 invariant verification. All findings below are UNANCHORED — sourced from direct code inspection only, not from a declared behavior contract.

Finding emitted: VEN-PORTFOLIO-007 (MISSING_BEHAVIOR_CONTRACT).

---

## 6. Trust Boundary Findings

---

### VEN-PORTFOLIO-001 — manageTags Controller Passes No callerProfileId to dalReplacePortfolioTags

```
VENOM SECURITY FINDING
- Finding ID: VEN-PORTFOLIO-001
- Location: engines/portfolio/src/controller/manageTags.controller.js:47
             engines/portfolio/src/dal/portfolioTags.write.dal.js:61
- Application Scope: VCSM + ENGINE
- Platform Surface: PWA / Shared Engine
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Authenticated VPORT Owner → Shared Engine DAL (callerProfileId ownership gate bypassed by omission)
- Contract Violated: Actor Ownership Contract
- Current behavior: manageTags.controller.js line 47 calls `dalReplacePortfolioTags({ itemId, tags: tags ?? [] })` without passing `callerProfileId`. dalReplacePortfolioTags at line 61 throws `[dalReplacePortfolioTags] callerProfileId required` immediately when callerProfileId is absent. The variable `callerProfileId` IS correctly resolved at line 29 via `dalGetProfileIdByActorId` and the profile_id cross-check at line 38 passes, but callerProfileId is never forwarded to the DAL call at line 47. This means the manageTags controller ALWAYS throws at the DAL level for any caller, making tag management completely non-functional.
- Risk: All calls to manageTags() fail with an internal error, denying service to legitimate VPORT owners. If the DAL requirement were removed (e.g., if a future change removes the callerProfileId guard from the DAL), the call would proceed without the DAL-level ownership verification — meaning tags could be replaced on any item if the controller's app-layer profile_id check were also weakened. As written, this is a functional breakage, not an active exploit, but it represents a broken ownership chain and a denial-of-service for the manageTags operation.
- Severity: HIGH
- Exploitability: LOW (currently causes a thrown error so the operation cannot complete at all — no active exploitability)
- Attack Preconditions: None required — the operation fails for all callers including legitimate owners.
- Blast Radius: All VPORT actors attempting to manage portfolio item tags via manageTags(). Tag management is entirely non-functional via this controller path.
- Identity Leak Type: None (operation fails before any data mutation)
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — dalReplacePortfolioTags enforces ownership via a portfolio_items pre-check at the DAL layer, but this never executes because the call throws first.
- Why it matters: Tag management is a core portfolio feature for VPORT owners. The broken callerProfileId forwarding silently denies all tag operations while appearing structurally correct at the controller level. The accompanying test (updateItem.controller.test.js) covers dalReplacePortfolioTags callerProfileId forwarding for updateItem, but manageTags has no equivalent test and the omission was not caught.
- Recommended mitigation: Forward callerProfileId to dalReplacePortfolioTags in manageTags.controller.js line 47:
    `await dalReplacePortfolioTags({ itemId, callerProfileId, tags: tags ?? [] })`
  The variable `callerProfileId` is already resolved at line 29. This is a one-word surgical fix.
- Rationale: dalReplacePortfolioTags requires callerProfileId to enforce ownership at the DAL layer before touching tags (per PORT-V-005 comment). This is defense-in-depth. The controller must forward it.
- Follow-up command: SPIDER-MAN (add test for manageTags callerProfileId forwarding, mirroring updateItem.controller.test.js); ELEKTRA (verify fix)
- Provenance: [SOURCE_VERIFIED] — confirmed at engines/portfolio/src/controller/manageTags.controller.js line 47 and engines/portfolio/src/dal/portfolioTags.write.dal.js line 61
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Identity and Access Management, Security Architecture and Engineering
```

---

### VEN-PORTFOLIO-002 — Portfolio Cache Invalidation Key Mismatch

```
VENOM SECURITY FINDING
- Finding ID: VEN-PORTFOLIO-002
- Location: apps/VCSM/src/features/profiles/kinds/vport/controller/portfolio/VportPortfolio.controller.js:13,29
             apps/VCSM/src/shared/lib/ttlCache.js:31
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen / Authenticated VPORT Owner / Public Visitor
- Boundary Violated: Public Visitor → Authenticated VPORT Owner (stale owner-view data can be served to public reads due to incorrect invalidation)
- Contract Violated: Actor Ownership Contract
- Current behavior: Cache keys are set as `${actorId}:owner` and `${actorId}:public` (line 13). When `invalidatePortfolioCache(actorId)` is called (line 29-31), it calls `listCache.invalidate(actorId)` which deletes only the exact key `actorId` from the cache store (ttlCache.js:31 — `store.delete(key)`). The compound keys `actorId:owner` and `actorId:public` are NOT deleted because `store.delete("actorId")` does not match `store.delete("actorId:owner")`. This means portfolio mutations (create, update, delete, media add/remove) do not actually invalidate the cache entries they are supposed to invalidate.
- Risk: After a portfolio item is created, updated, or deleted, the next read from the same actorId (public or owner view) returns the stale pre-mutation result from cache for up to 60 seconds. A deleted portfolio item remains visible. A newly created item does not appear. Private items that were toggled to visibility=public are not refreshed. This is a correctness and data exposure issue — deleted content can remain visible to public visitors for the duration of the TTL window.
- Severity: MEDIUM
- Exploitability: LOW (requires a race condition within the 60-second TTL window; no attacker action required — stale data self-presents)
- Attack Preconditions: No attacker action required. Stale data is served automatically when a mutation occurs within the 60-second cache TTL window.
- Blast Radius: All public and owner viewers of any VPORT portfolio within 60 seconds of any mutation. Deleted items remain visible in public feeds.
- Identity Leak Type: None directly, but deleted/private content briefly remains accessible via stale cache.
- Cache Trust Type: Public-profile-sensitive (portfolio items can be visibility=public and must reflect mutations promptly)
- RLS Dependency: NONE — this is a pure app-layer cache issue; DB reflects the correct state immediately.
- Why it matters: A deleted portfolio item (possibly removed due to policy violation, inaccuracy, or the owner's decision) can continue to appear in their public profile for up to 60 seconds. Owner dashboard may also show stale state after mutations.
- Recommended mitigation: Fix invalidatePortfolioCache to delete both compound cache keys:
    ```js
    export function invalidatePortfolioCache(actorId) {
      listCache.invalidate(`${actorId}:owner`)
      listCache.invalidate(`${actorId}:public`)
    }
    ```
  Or, use `listCache.invalidateAll()` for the portfolio cache scope, but the targeted two-key approach is more surgical.
- Rationale: The current `invalidate(actorId)` call deletes a key that was never set. Cache invalidation must match the exact key format used during `set()`.
- Follow-up command: SPIDER-MAN (add regression test for cache key invalidation); DEADPOOL (trace whether this is causing visible stale-content bugs in staging)
- Provenance: [SOURCE_VERIFIED] — confirmed at VportPortfolio.controller.js:13 (key format), line 29 (invalidate call), and ttlCache.js:31 (exact-key delete behavior)
- CISSP Domain:
  - Primary: Security Architecture and Engineering
  - Secondary: Asset Security, Software Development Security
```

---

### VEN-PORTFOLIO-003 — getPortfolioItem Returns Deleted and Private Items Without Filtering

```
VENOM SECURITY FINDING
- Finding ID: VEN-PORTFOLIO-003
- Location: engines/portfolio/src/controller/getPortfolioItem.controller.js:29
             engines/portfolio/src/dal/portfolioItems.read.dal.js:17-33
- Application Scope: VCSM + ENGINE
- Platform Surface: PWA / Shared Engine
- Trust Boundary: Public Visitor / Authenticated Citizen
- Boundary Violated: Public Visitor → Private/Deleted Content (deleted or private items accessible by direct item ID)
- Contract Violated: Actor Ownership Contract / VPORT Lifecycle Contract
- Current behavior: `getPortfolioItem()` controller (line 29) calls `dalGetPortfolioItemById({ itemId })` which fetches the item with no filter on `is_deleted`, `is_active`, or `visibility`. Any caller who knows an itemId can retrieve a portfolio item regardless of whether it is deleted (is_deleted=true), inactive (is_active=false), or private (visibility='private'). The `listPortfolio()` controller correctly applies `publicOnly` filtering for non-owner reads, but `getPortfolioItem()` has no equivalent gating. The response includes `isDeleted`, `deletedAt`, and `visibility` fields in the domain model, which are then returned to the caller.
- Risk: An authenticated user (or unauthenticated via a misconfigured read path) who knows or enumerates a portfolio item UUID can retrieve: (1) deleted portfolio items the owner removed, (2) private/draft portfolio items the owner has not published, (3) inactive items. For the detail view surface (used when a user taps into a portfolio item), there is no guarantee the item is public or active before data is returned.
- Severity: HIGH
- Exploitability: MEDIUM (requires knowing a valid itemId UUID; UUIDs are non-guessable but may be leaked via error messages, URLs, optimistic UI state, or event payloads from the engine event bus)
- Attack Preconditions:
    - Caller must know a valid portfolio_item UUID
    - The item must exist with is_deleted=true, is_active=false, or visibility='private'
    - The calling path must reach getPortfolioItem() — currently via ctrlGetPortfolioItem() in VportPortfolio.controller.js or direct engine import
- Blast Radius: Individual portfolio items across any VPORT. Private/deleted content across the full portfolio items table subject to RLS coverage.
- Identity Leak Type: Ownership inference (deleted items reveal the VPORT had content they chose to remove)
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: UNVERIFIED — if RLS on vport.portfolio_items restricts deleted/private reads for anon/public callers, this may be mitigated at DB layer. Not confirmed. DB inspection required.
- Why it matters: A VPORT owner who deletes a portfolio item expects it to disappear. A VPORT owner who marks an item private/draft expects only they can see it. If getPortfolioItem() can be called client-side for any itemId, deleted and private items are exposed to anyone who can guess or enumerate item IDs. This undermines the visibility model enforced in listPortfolio().
- Recommended mitigation:
    1. For public callers: add visibility and is_deleted/is_active filtering to getPortfolioItem() or to dalGetPortfolioItemById() based on caller context (viewerIsOwner flag, similar to listPortfolio pattern).
    2. Engine-level: add a `publicOnly` parameter to getPortfolioItem() and pass it through to dalGetPortfolioItemById():
       ```js
       export async function getPortfolioItem({ itemId, includeBarberDetails, includeLocksmithDetails, viewerIsOwner = false })
       // In DAL: if (!viewerIsOwner) add .eq('is_deleted', false).eq('is_active', true).eq('visibility', 'public')
       ```
    3. Route DB review to confirm RLS coverage for deleted/private items on vport.portfolio_items.
- Rationale: listPortfolio() already implements publicOnly filtering. getPortfolioItem() must be consistent.
- Follow-up command: DB (verify RLS policy on vport.portfolio_items for deleted/private reads); SPIDER-MAN (add test for deleted-item non-disclosure via getPortfolioItem); ELEKTRA (trace from UI to DB for this path)
- Provenance: [SOURCE_VERIFIED] — confirmed at getPortfolioItem.controller.js:29 and portfolioItems.read.dal.js:17-33
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Asset Security, Security Architecture and Engineering
```

---

### VEN-PORTFOLIO-004 — portfolioTrace.adapter.js Always Bundled — Trace Store Exposed in Production Bundles

```
VENOM SECURITY FINDING
- Finding ID: VEN-PORTFOLIO-004
- Location: apps/VCSM/src/features/portfolio/adapters/portfolioTrace.adapter.js:1-13
             apps/VCSM/src/features/portfolio/setup.js:61-66
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Public Visitor (production bundle exposure)
- Boundary Violated: Dev-only tooling → Production bundle (trace surface included in all builds)
- Contract Violated: None explicitly declared (BEHAVIOR.md PLACEHOLDER); violates DEV-only intent documented in setup.js comment
- Current behavior: portfolioTrace.adapter.js exports `subscribeToPortfolioTrace`, `getPortfolioTraceEvents`, and `clearPortfolioTraceEvents` — all of which import from and bind to `portfolioTraceStore` in setup.js. The `portfolioTraceStore` is a module-level singleton (not class-gated) that exists in all environments. The `debugReporter` (which populates the trace store with engine events) IS conditionally registered: `import.meta.env.DEV ? (event) => portfolioTraceStore.push(...) : null`. However: (1) the adapter is always importable and callable in production, (2) the store's `push` and `subscribe` methods are always active, (3) any code path that calls portfolioTraceStore.push() directly (not via the engine debugReporter) would write to the store in production, (4) the adapter exports `getPortfolioTraceEvents()` which returns the in-memory event log to any caller in any environment.
- Risk: While the engine debugReporter is correctly DEV-gated, the trace surface itself (adapter + store) exists in production bundles. Any future code that imports from portfolioTrace.adapter.js in a production context can read engine trace events if any were stored. The store is initialized as a module-level singleton — it cannot be tree-shaken unless the adapter is never imported. More critically, `portfolioTrace.adapter.js` is exported from the feature adapter layer which is accessible to the broader dashboard. If any component inadvertently imports it outside a DEV guard, trace data would be accessible in production.
- Severity: LOW
- Exploitability: LOW (no trace data is written in production because the debugReporter is null; current risk is theoretical/future-hardening)
- Attack Preconditions:
    - Production build must import portfolioTrace.adapter.js
    - A code path must call portfolioTraceStore.push() outside the debugReporter guard
    - Currently neither condition is met in practice — risk is latent
- Blast Radius: Engine trace events (step names, actorIds, profileIds, row counts) — not auth tokens or PII, but internal operation metadata
- Identity Leak Type: Ownership inference (actorId and profileId appear in trace event payloads at debug steps)
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Defense-in-depth principle. The trace store holds actorId, profileId, and operation names which are internal platform metadata. The store should be non-existent in production builds, not merely unfilled. ARCHITECT flagged this as a LOW concern in the ARCHITECTURE.md module build priority (P4: VENOM audit portfolioTrace.adapter.js).
- Recommended mitigation:
    1. Add a DEV guard at the module level in portfolioTrace.adapter.js:
       ```js
       if (!import.meta.env.DEV) {
         export const subscribeToPortfolioTrace = () => () => {}
         export const getPortfolioTraceEvents = () => []
         export const clearPortfolioTraceEvents = () => {}
       }
       ```
    2. Alternatively, move portfolioTraceStore into a DEV-only module and use dynamic import or conditional stub exports.
    3. Ensure PortfolioDevDiagnosticPanel (already correctly DEV-gated at line 16: `if (!import.meta.env.DEV) return null`) is the only consumer of the adapter.
- Rationale: The DEV guard in setup.js ensures no data flows into the store in production. The hardening at the adapter level ensures the API surface is also a no-op, enabling tree-shaking and eliminating latent risk.
- Follow-up command: ELEKTRA (verify bundle analysis shows adapter excluded from production); SPIDER-MAN (add test asserting trace functions return no-ops in production environment)
- Provenance: [SOURCE_VERIFIED] — confirmed at portfolioTrace.adapter.js:1-13 and setup.js:61-66
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Operations, Asset Security
```

---

### VEN-PORTFOLIO-005 — PortfolioItemModel Exposes profileId and createdByActorId to UI Layer

```
VENOM SECURITY FINDING
- Finding ID: VEN-PORTFOLIO-005
- Location: engines/portfolio/src/model/PortfolioItem.model.js:13,27
- Application Scope: VCSM + ENGINE
- Platform Surface: PWA / Shared Engine
- Trust Boundary: Authenticated Citizen / Public Visitor
- Boundary Violated: Internal identity data → Client-visible domain model (internal IDs surfaced in UI-consumed model)
- Contract Violated: Public Identity Surface Contract / Asset Security
- Current behavior: PortfolioItemModel() (line 13) maps `raw.profile_id` to `profileId` and (line 27) maps `raw.created_by_actor_id` to `createdByActorId`. Both fields are included in the returned domain object that is passed to UI hooks and components via listPortfolio() and getPortfolioItem(). `profileId` is an internal UUID from vport.profiles. `createdByActorId` is an internal actor UUID (typically null by design per createItem.controller.js comment, but included in ITEM_RETURN_COLUMNS and propagated through the model).
- Risk: profileId (vport.profiles UUID) is an internal identifier that should not be exposed in client-side state or API responses. Any React component, hook, or consumer that receives a portfolio item domain object also receives the profileId, which can be logged, rendered, or leaked via network inspection. createdByActorId, while typically null, is also surfaced — if ever set, it reveals which actor created an item, enabling actor correlation across items. Per VCSM identity rules, profileId and vportId must never be surfaced through public hooks or controller surfaces.
- Risk Qualifier: Currently `createdByActorId` is always null by design (createItem.controller.js line 60: `createdByActorId: null`). The profileId risk is the primary concern for data minimization.
- Severity: MEDIUM
- Exploitability: LOW (profileId is a UUID not immediately actionable, but violates data minimization principles and VCSM identity surface contract)
- Attack Preconditions:
    - Attacker must be able to inspect client-side state (React DevTools, network response, console log)
    - profileId must be used somewhere meaningful (e.g., constructable into a URL, correlatable to another entity)
- Blast Radius: All portfolio item reads — every listPortfolio() and getPortfolioItem() consumer exposes profileId in client state.
- Identity Leak Type: Internal UUID exposure (profileId) / Actor correlation (createdByActorId if non-null)
- Cache Trust Type: None
- RLS Dependency: NONE — this is a model-layer field inclusion issue.
- Why it matters: VCSM's identity contract explicitly prohibits surfacing profileId and vportId through public hook or controller surfaces. PortfolioItemModel is consumed directly by the dashboard and profiles feature — both of which render in the PWA and are inspectable.
- Recommended mitigation:
    1. Remove `profileId` from the PortfolioItemModel return object. It is an internal join key used only within the engine for ownership cross-checks, not needed by any UI consumer.
    2. Remove `createdByActorId` from PortfolioItemModel return. It is always null by current design (PORT-V-001 pattern). If it becomes non-null in future, it must be gated behind owner-only access.
    3. If profileId is needed for internal ownership cross-checks within the engine, pass it as an internal variable, not as part of the public domain model.
- Rationale: Data minimization — expose only what UI consumers need. profileId and createdByActorId are internal engine identifiers with no UI purpose.
- Follow-up command: ELEKTRA (trace profileId through all UI consumers to confirm it is not currently rendered or leaked); SPIDER-MAN (add test asserting profileId absent from domain model returned to consumers)
- Provenance: [SOURCE_VERIFIED] — confirmed at PortfolioItem.model.js:13 and :27
- CISSP Domain:
  - Primary: Asset Security
  - Secondary: Identity and Access Management, Software Development Security
```

---

### VEN-PORTFOLIO-006 — dalDeletePortfolioMedia Relies Solely on RLS for Ownership Enforcement (ASSUMED Policy)

```
VENOM SECURITY FINDING
- Finding ID: VEN-PORTFOLIO-006
- Location: engines/portfolio/src/dal/portfolioMedia.write.dal.js:50-63
- Application Scope: VCSM + ENGINE
- Platform Surface: Supabase Table/View (vport.portfolio_media)
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: App-layer ownership verification → RLS-only (no app-layer profile_id filter on DELETE)
- Contract Violated: Actor Ownership Contract / Security Architecture and Engineering
- Current behavior: `dalDeletePortfolioMedia({ mediaId })` deletes the row using only `.eq('id', mediaId)` with no profile_id or actor_id filter. The comment on line 49 states "RLS enforces ownership." The calling controller (removeMedia.controller.js) correctly performs a pre-check (parallel fetch of media row + callerProfileId, profile_id cross-check at line 39, isActorOwner check at line 43) before calling dalDeletePortfolioMedia. However, the DAL function itself is exported as a public engine surface and could be called by any other consumer without the controller's pre-checks. Other write DAL functions (dalUpdatePortfolioItem, dalSoftDeletePortfolioItem, dalReplacePortfolioTags) all require callerProfileId as a parameter for defense-in-depth. dalDeletePortfolioMedia is inconsistent — it relies solely on RLS.
- Risk: If the RLS policy on vport.portfolio_media does not correctly enforce DELETE ownership (e.g., policy uses a different column, has a gap, or is misconfigured), any authenticated user who obtains a valid mediaId could delete media belonging to other VPORT actors. Additionally, dalDeletePortfolioMedia is a publicly exported DAL function; if consumed from a context other than removeMedia.controller.js without the pre-checks, ownership is not enforced at the app layer.
- Risk Qualifier: The calling controller (removeMedia.controller.js) provides good app-layer pre-checks. The risk is inconsistency (other DALs enforce at both layers) and RLS assumption without verification.
- Severity: MEDIUM
- Exploitability: LOW (removeMedia controller has correct pre-checks; risk requires either RLS gap or direct DAL call from non-controller context)
- Attack Preconditions:
    - Attacker must obtain a valid portfolio_media UUID (not guessable; could be leaked via URL, error, or event)
    - Either: RLS policy gap on vport.portfolio_media DELETE must exist, OR the DAL must be called directly without controller pre-checks
- Blast Radius: Individual portfolio media rows across all VPORT actors if RLS gap exists.
- Identity Leak Type: None directly — risk is unauthorized deletion
- Cache Trust Type: None
- RLS Dependency: ASSUMED — comment states "RLS enforces ownership" but policy has not been verified by DB inspection.
- Why it matters: Defense-in-depth is inconsistent. All other write DAL functions for portfolio require callerProfileId. dalDeletePortfolioMedia is the outlier and relies on an unverified RLS assumption.
- Recommended mitigation:
    1. Add callerProfileId parameter to dalDeletePortfolioMedia and scope the DELETE: `.eq('id', mediaId).eq('profile_id', callerProfileId)`. Update removeMedia.controller.js to pass callerProfileId (already resolved as a local variable at line 31).
    2. Route to DB to verify the RLS DELETE policy on vport.portfolio_media includes profile_id or user_id ownership enforcement.
- Rationale: Defense-in-depth consistency. All other write DALs scope operations to callerProfileId; dalDeletePortfolioMedia should follow the same pattern rather than deferring entirely to RLS.
- Follow-up command: DB (verify RLS DELETE policy on vport.portfolio_media); ELEKTRA (confirm callerProfileId scoping fix after patch); SPIDER-MAN (add regression test)
- Provenance: [SOURCE_VERIFIED] — confirmed at portfolioMedia.write.dal.js:50-63 and removeMedia.controller.js:24-51
- CISSP Domain:
  - Primary: Security Architecture and Engineering
  - Secondary: Identity and Access Management, Security Assessment and Testing
```

---

### VEN-PORTFOLIO-007 — MISSING BEHAVIOR CONTRACT (PLACEHOLDER)

```
VENOM SECURITY FINDING
- Finding ID: VEN-PORTFOLIO-007
- Location: ZZnotforproduction/APPS/VCSM/features/portfolio/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Documentation / Governance
- Trust Boundary: All trust boundaries (no declared contract to enforce)
- Boundary Violated: Governance Contract (security posture cannot be fully evaluated without §5 and §9)
- Contract Violated: Behavior Contract (mandatory per VENOM BEHAVIOR CONTRACT INTEGRATION protocol)
- Current behavior: BEHAVIOR.md exists at the expected path but has Status: PLACEHOLDER. No §5 Security Rules, no §9 Must Never Happen invariants, no §3 happy paths, and no §6 data change declarations have been written. Source code is functional and was reviewed by VENOM directly, but there is no authoritative declared contract against which to verify enforcement.
- Risk: Security posture cannot be fully anchored to declared invariants. Future changes to the codebase may violate security rules that were never formally declared. Consuming features (profiles, dashboard) have no authoritative reference for ownership rules, visibility rules, or prohibited behaviors.
- Severity: HIGH
- Exploitability: N/A (governance gap, not a runtime exploit)
- Attack Preconditions: N/A
- Blast Radius: All VPORT portfolio operations — no declared security contract means no SPIDER-MAN regression target and no THOR gate anchor.
- Identity Leak Type: None directly
- Cache Trust Type: None directly
- RLS Dependency: NONE (documentation gap)
- Why it matters: Without §5 Security Rules, VENOM cannot confirm all security invariants are enforced. Without §9 Must Never Happen, there are no hard invariants for SPIDER-MAN to test or THOR to gate on. The portfolio engine is consumed by two major features (profiles, dashboard) with no authoritative behavior reference.
- Recommended mitigation: WOLVERINE intake to write BEHAVIOR.md — document §5 Security Rules (at minimum: ownership verification required before all mutations, visibility enforcement for public reads, actorId must be verified against actor_owners before any write) and §9 Must Never Happen (at minimum: non-owner must never mutate another actor's portfolio items or media, deleted items must never appear in public reads, private items must never appear to non-owners).
- Rationale: BEHAVIOR.md is the security anchor for VENOM, ELEKTRA, and BLACKWIDOW. Without it, findings are UNANCHORED and coverage is incomplete.
- Follow-up command: Wolverine (BEHAVIOR.md intake); LOGAN (write BEHAVIOR.md §5 and §9 at minimum)
- Provenance: [SOURCE_VERIFIED] — confirmed by reading ZZnotforproduction/APPS/VCSM/features/portfolio/BEHAVIOR.md
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Security Assessment and Testing
```

---

## 7. Source Verification Summary

| Surface | Source File Read | Finding | Provenance |
|---|---|---|---|
| manageTags → dalReplacePortfolioTags | YES — manageTags.controller.js:47, portfolioTags.write.dal.js:61 | VEN-PORTFOLIO-001 | [SOURCE_VERIFIED] |
| invalidatePortfolioCache key mismatch | YES — VportPortfolio.controller.js:13,29; ttlCache.js:31 | VEN-PORTFOLIO-002 | [SOURCE_VERIFIED] |
| getPortfolioItem no visibility filter | YES — getPortfolioItem.controller.js:29; portfolioItems.read.dal.js:17-33 | VEN-PORTFOLIO-003 | [SOURCE_VERIFIED] |
| portfolioTrace.adapter.js bundle exposure | YES — portfolioTrace.adapter.js:1-13; setup.js:61-66 | VEN-PORTFOLIO-004 | [SOURCE_VERIFIED] |
| PortfolioItemModel profileId exposure | YES — PortfolioItem.model.js:13,27 | VEN-PORTFOLIO-005 | [SOURCE_VERIFIED] |
| dalDeletePortfolioMedia RLS-only | YES — portfolioMedia.write.dal.js:50-63; removeMedia.controller.js:24-51 | VEN-PORTFOLIO-006 | [SOURCE_VERIFIED] |
| BEHAVIOR.md PLACEHOLDER | YES — BEHAVIOR.md read | VEN-PORTFOLIO-007 | [SOURCE_VERIFIED] |
| createItem ownership check | YES — createItem.controller.js:34-38 | VERIFIED_SAFE | [SOURCE_VERIFIED] |
| updateItem ownership check | YES — updateItem.controller.js:36-44 | VERIFIED_SAFE | [SOURCE_VERIFIED] |
| deleteItem ownership check | YES — deleteItem.controller.js:31-40 | VERIFIED_SAFE | [SOURCE_VERIFIED] |
| addMedia ownership check | YES — addMedia.controller.js:41-48 | VERIFIED_SAFE | [SOURCE_VERIFIED] |
| removeMedia ownership check | YES — removeMedia.controller.js:31-46 | VERIFIED_SAFE | [SOURCE_VERIFIED] |
| isActorOwner resolver (setup.js) | YES — setup.js:39-58 | VERIFIED_SAFE | [SOURCE_VERIFIED] |
| PortfolioDevDiagnosticPanel DEV guard | YES — PortfolioDevDiagnosticPanel.jsx:16 | VERIFIED_SAFE | [SOURCE_VERIFIED] |
| dalUpdatePortfolioItem profile_id scope | YES — portfolioItems.write.dal.js:66-72 | VERIFIED_SAFE | [SOURCE_VERIFIED] |
| dalSoftDeletePortfolioItem profile_id scope | YES — portfolioItems.write.dal.js:86-99 | VERIFIED_SAFE | [SOURCE_VERIFIED] |
| dalReplacePortfolioTags ownership pre-check | YES — portfolioTags.write.dal.js:66-82 | VERIFIED_SAFE (when called with callerProfileId) | [SOURCE_VERIFIED] |
| updatePortfolioMediaAssetIdDAL profile_id scope | YES — portfolioMediaRecord.write.dal.js | VERIFIED_SAFE | [SOURCE_VERIFIED] |
| listPortfolio publicOnly filter | YES — listPortfolio.controller.js:31; portfolioItems.read.dal.js:54-55 | VERIFIED_SAFE | [SOURCE_VERIFIED] |
| useVportOwnership comment (UI-only, not security gate) | YES — useVportOwnership.js header comment | VERIFIED_SAFE (comment correctly documents intent) | [SOURCE_VERIFIED] |

Total surfaces inspected: 20
Surfaces source-verified: 20 / 20
CRITICAL findings: 0
HIGH findings: 3 — all [SOURCE_VERIFIED]: YES
MEDIUM findings: 3 — all [SOURCE_VERIFIED]: YES
LOW findings: 1 — all [SOURCE_VERIFIED]: YES

---

## 8. Confidence Summary

```
HIGH confidence surfaces: 20 (all manually source-verified)
LOW confidence surfaces: 0
[SOURCE_VERIFIED] findings: 7
[SCANNER_LEAD] findings: 0
[SCANNER_LOW_CONF] findings: 0
[SCANNER_STALE] findings: 0
```

Note: Scanner pre-filter correctly reported 0 surfaces for the feature directory. VENOM extended scope to engines/portfolio/ per architecture contract. All 7 findings are [SOURCE_VERIFIED].

---

## 9. THOR Impact

```
THOR Release Blockers: NONE
Highest Open Severity: HIGH

Open Findings Summary:
  CRITICAL: 0
  HIGH: 3 (VEN-PORTFOLIO-001, VEN-PORTFOLIO-003, VEN-PORTFOLIO-007)
  MEDIUM: 3 (VEN-PORTFOLIO-002, VEN-PORTFOLIO-005, VEN-PORTFOLIO-006)
  LOW: 1 (VEN-PORTFOLIO-004)

THOR Assessment:
  VEN-PORTFOLIO-001 (HIGH — manageTags broken): Portfolio tag management is non-functional via
    manageTags controller. This is a functional breakage, not a security exploit. Recommend patch
    before next release affecting portfolio feature. Not a THOR blocker at current scope, but
    should be escalated if tag management is in any current release scope.
  VEN-PORTFOLIO-003 (HIGH — getPortfolioItem no visibility filter): Potential private/deleted
    content exposure via direct itemId access. Requires DB (RLS verification) before THOR can
    confirm this is mitigated at DB layer. Mark as THOR WATCH pending DB review.
  VEN-PORTFOLIO-007 (HIGH — BEHAVIOR.md PLACEHOLDER): No declared behavior contract.
    Not a runtime THOR blocker but required before portfolio enters active release scope.
```

---

## 10. Required Follow-Up Commands

| Priority | Command | Action | Finding |
|---|---|---|---|
| P1 | SPIDER-MAN | Add regression test for manageTags callerProfileId forwarding (mirroring updateItem.controller.test.js) | VEN-PORTFOLIO-001 |
| P1 | ELEKTRA | Verify manageTags callerProfileId fix and trace full updateItem → dalReplacePortfolioTags call chain | VEN-PORTFOLIO-001 |
| P1 | DB | Verify RLS DELETE policy on vport.portfolio_media includes ownership enforcement | VEN-PORTFOLIO-006 |
| P1 | DB | Verify RLS SELECT policy on vport.portfolio_items restricts deleted/private rows from non-owner reads | VEN-PORTFOLIO-003 |
| P2 | Wolverine | BEHAVIOR.md intake — write §5 Security Rules and §9 Must Never Happen for portfolio | VEN-PORTFOLIO-007 |
| P2 | DEADPOOL | Trace whether cache invalidation mismatch is causing visible stale-content bugs in staging | VEN-PORTFOLIO-002 |
| P2 | SPIDER-MAN | Add regression test for cache key invalidation (invalidatePortfolioCache must clear both compound keys) | VEN-PORTFOLIO-002 |
| P3 | ELEKTRA | Trace profileId through all UI consumers — confirm not rendered or leaked in any PWA view | VEN-PORTFOLIO-005 |
| P3 | SPIDER-MAN | Add test for deleted-item non-disclosure via getPortfolioItem | VEN-PORTFOLIO-003 |
| P4 | ELEKTRA | Verify production bundle excludes portfolioTrace.adapter.js API surface or confirms it is no-op | VEN-PORTFOLIO-004 |

---

## 11. MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-PORTFOLIO-001 | manageTags always throws — callerProfileId not forwarded to dalReplacePortfolioTags | Controller | P1 | App | SPIDER-MAN, ELEKTRA |
| VEN-PORTFOLIO-002 | Cache invalidation uses wrong key format — stale portfolio data served after mutations | Controller | P2 | App | DEADPOOL, SPIDER-MAN |
| VEN-PORTFOLIO-003 | getPortfolioItem returns deleted/private items without filter — potential non-owner exposure | Controller / DAL / RLS | P1 | App + DB | DB, SPIDER-MAN, ELEKTRA |
| VEN-PORTFOLIO-004 | portfolioTrace.adapter.js always bundled — dev trace surface in production builds | Adapter | P4 | App | ELEKTRA, SPIDER-MAN |
| VEN-PORTFOLIO-005 | PortfolioItemModel exposes profileId and createdByActorId to client layer | Engine (Model) | P3 | Engine | ELEKTRA, SPIDER-MAN |
| VEN-PORTFOLIO-006 | dalDeletePortfolioMedia relies solely on ASSUMED RLS — no app-layer profile_id scope | DAL / RLS | P1 (DB verify first) | DB + App | DB, ELEKTRA, SPIDER-MAN |
| VEN-PORTFOLIO-007 | BEHAVIOR.md is PLACEHOLDER — no declared §5 or §9 security contract | Documentation | P2 | Documentation | Wolverine, LOGAN |

---

## 12. CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VEN-PORTFOLIO-007 (missing behavior contract = governance gap) |
| Asset Security | 2 | VEN-PORTFOLIO-005 (profileId/createdByActorId exposed), VEN-PORTFOLIO-003 (deleted/private content) |
| Security Architecture and Engineering | 3 | VEN-PORTFOLIO-002 (cache invalidation), VEN-PORTFOLIO-003 (defense-in-depth gap), VEN-PORTFOLIO-006 (RLS-only enforcement inconsistency) |
| Communication and Network Security | 0 | No edge functions, no RPC, no public API surfaces inspected — out of scope for this feature at current surface level |
| Identity and Access Management | 3 | VEN-PORTFOLIO-001 (broken ownership chain), VEN-PORTFOLIO-003 (non-owner access to private/deleted), VEN-PORTFOLIO-005 (identity surface violation) |
| Security Assessment and Testing | 2 | VEN-PORTFOLIO-001 (no test for manageTags callerProfileId), VEN-PORTFOLIO-007 (no §9 invariants for regression) |
| Security Operations | 1 | VEN-PORTFOLIO-004 (dev trace surface in production bundle) |
| Software Development Security | 3 | VEN-PORTFOLIO-001 (broken callerProfileId forwarding), VEN-PORTFOLIO-004 (adapter bundled in production), VEN-PORTFOLIO-005 (model exposes internal IDs) |

**Uncovered domains:**
- Communication and Network Security: Portfolio has no edge functions, no Supabase RPCs, and no external API surfaces at this time. Domain is NOT APPLICABLE at current feature scope. VERIFIED by scanner (0 edge functions, 0 RPCs) and source inspection.

CISSP coverage is COMPLETE for all applicable domains given the current portfolio feature surface.

---

## Appendix — Verified Safe Surfaces

The following surfaces were inspected and confirmed VERIFIED_SAFE:

1. **isActorOwner resolver** (setup.js:39-58) — Correctly queries vc.actor_owners with RLS-scoped session, checks is_void=false, requires session. No client ID trust. PORT-V-001 pattern correctly implemented.

2. **createItem ownership check** (createItem.controller.js:34-38) — isActorOwner checked BEFORE profileId lookup. Correct order. actorId validated before any DB write.

3. **updateItem ownership check** (updateItem.controller.js:36-44) — profile_id cross-check AND isActorOwner check. Defense-in-depth. callerProfileId correctly forwarded to dalUpdatePortfolioItem and dalReplacePortfolioTags.

4. **deleteItem ownership check** (deleteItem.controller.js:31-40) — Same pattern as updateItem. profile_id cross-check then isActorOwner. Idempotent guard for already-deleted items.

5. **addMedia ownership check** (addMedia.controller.js:41-48) — Parallel fetch of item + callerProfileId. profile_id cross-check before isActorOwner. Correct pattern.

6. **removeMedia ownership check** (removeMedia.controller.js:31-46) — PORT-V-003 pattern. Parallel fetch + profile_id cross-check + isActorOwner. Good defense-in-depth at controller layer.

7. **listPortfolio publicOnly filter** (listPortfolio.controller.js:31 + portfolioItems.read.dal.js:54-55) — Correctly applies visibility=public + is_active=true filter for non-owner reads.

8. **dalUpdatePortfolioItem profile_id scope** (portfolioItems.write.dal.js:66-72) — UPDATE scoped to both itemId AND callerProfileId.

9. **dalSoftDeletePortfolioItem profile_id scope** (portfolioItems.write.dal.js:86-99) — Same as UPDATE — scoped to both itemId AND callerProfileId.

10. **dalReplacePortfolioTags ownership pre-check** (portfolioTags.write.dal.js:66-82) — Correct. Verifies portfolio_items ownership before touching tags. Requires callerProfileId. FAILS SAFELY when callerProfileId missing.

11. **updatePortfolioMediaAssetIdDAL profile_id scope** (portfolioMediaRecord.write.dal.js) — PORT-V-005 pattern. UPDATE scoped to both portfolioMediaId AND callerProfileId.

12. **PortfolioDevDiagnosticPanel DEV guard** (PortfolioDevDiagnosticPanel.jsx:16) — `if (!import.meta.env.DEV) return null` — correctly renders nothing in production. Probe data (actorId, identity, session details) not exposed in production UI.

13. **useVportOwnership UI-only gate** (useVportOwnership.js) — Header comment explicitly states this is a UI convenience state, not the security boundary. Dashboard screen correctly uses `if (!isOwner)` as a UX gate while controller/engine layer enforces ownership independently.

---

*VENOM V2 review complete. Report generated 2026-06-04.*
