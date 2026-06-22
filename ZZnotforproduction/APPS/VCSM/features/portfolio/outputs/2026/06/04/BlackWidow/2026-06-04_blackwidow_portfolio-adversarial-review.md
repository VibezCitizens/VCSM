# BlackWidow V2 — Adversarial Runtime Verification Report
# Feature: portfolio | App: VCSM | Date: 2026-06-04

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report Version | BW2.5 V2 / BW2.9 output format |
| Feature | portfolio |
| Application | VCSM |
| Run Date | 2026-06-04 |
| Run By | BlackWidow V2 subagent |
| Behavior Contract | PLACEHOLDER — all §9 invariants UNANCHORED |
| Security Posture Prior | VENOM COMPLETE (7 findings), ELEKTRA NOT RUN |
| Scanner Freshness | FRESH — 2026-06-04T19:48:25.152Z (~7h old) |

---

## 2. Scanner Preflight

| Field | Value |
|---|---|
| Scanner Version | 1.1.0 |
| Maps Generated | 2026-06-04T19:48:25.152Z |
| Freshness Status | FRESH |
| Security Paths Attributed (portfolio) | 0 |
| Total Platform Security Paths | 598 |
| Callgraph Nodes (portfolio) | 143 |
| Callgraph Edges (portfolio) | 213 |
| Write Execution Map Attribution | 0 (no feature-attributed write paths) |
| RPC Execution Map Attribution | 0 |

Scanner signal: 0 security paths attributed to portfolio in security-path-map.json. All paths carry LOW confidence (unresolved/null sourceRoute). Per Rule BW-002, LOW confidence attribution makes all engine surfaces PRIMARY ATTACK TARGETS.

---

## 3. Scanner Inputs

| Input | Value |
|---|---|
| security-path-map.json | /apps/scanner/maps/security-path-map.json |
| callgraph.json | /apps/scanner/maps/callgraph.json |
| write-execution-map.json | /apps/scanner/maps/write-execution-map.json |
| rpc-execution-map.json | /apps/scanner/maps/rpc-execution-map.json |
| BEHAVIOR.md | ZZnotforproduction/APPS/VCSM/features/portfolio/BEHAVIOR.md |
| SECURITY.md | ZZnotforproduction/APPS/VCSM/features/portfolio/SECURITY.md |

---

## 4. Attack Surface Inventory

### 4.1 Hook Entry Points (UI-accessible)

| Hook | File | Writes |
|---|---|---|
| usePortfolioItemSubmit | apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/hooks/usePortfolioItemSubmit.js | createItem, updateItem, addMedia, ctrlSavePortfolioDetail, publishLocksmithPortfolioUpdateAsPostController |
| usePortfolioMediaUpload | apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/hooks/usePortfolioMediaUpload.js | upload (media engine) |
| useVportPortfolioProbe | apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/hooks/useVportPortfolioProbe.js | read-only probe (no writes) |
| useVportPortfolio | apps/VCSM/src/features/profiles/kinds/vport/hooks/portfolio/useVportPortfolio.js | invalidatePortfolioCache (optimistic cache ops) |

### 4.2 Controller Entry Points

| Controller | File | Operation |
|---|---|---|
| addPortfolioMediaWithRecord | dashboard/cards/portfolio/controller/addPortfolioMediaWithRecord.controller.js | Composite: addMedia + media_assets record + update media_asset_id |
| probeVportPortfolioController | dashboard/cards/portfolio/controller/probeVportPortfolio.controller.js | Read-only diagnostics with ownership gate |
| ctrlListPortfolio | profiles/kinds/vport/controller/portfolio/VportPortfolio.controller.js | Read + TTL cache |
| ctrlGetPortfolioItem | profiles/kinds/vport/controller/portfolio/VportPortfolio.controller.js | Read |
| invalidatePortfolioCache | profiles/kinds/vport/controller/portfolio/VportPortfolio.controller.js | Cache key delete |
| createItem (engine) | engines/portfolio/src/controller/createItem.controller.js | INSERT portfolio_items + tags |
| updateItem (engine) | engines/portfolio/src/controller/updateItem.controller.js | UPDATE portfolio_items + tags |
| deleteItem (engine) | engines/portfolio/src/controller/deleteItem.controller.js | Soft DELETE portfolio_items |
| addMedia (engine) | engines/portfolio/src/controller/addMedia.controller.js | INSERT portfolio_media |
| removeMedia (engine) | engines/portfolio/src/controller/removeMedia.controller.js | DELETE portfolio_media |
| manageTags (engine) | engines/portfolio/src/controller/manageTags.controller.js | REPLACE portfolio_tags |

### 4.3 DAL Write Surfaces

| DAL Function | Table | App-Layer Ownership Scope |
|---|---|---|
| dalInsertPortfolioItem | vport.portfolio_items | profileId from actor lookup — INDIRECT |
| dalUpdatePortfolioItem | vport.portfolio_items | .eq('profile_id', callerProfileId) — EXPLICIT |
| dalSoftDeletePortfolioItem | vport.portfolio_items | .eq('profile_id', callerProfileId) — EXPLICIT |
| dalInsertPortfolioMedia | vport.portfolio_media | profileId from item's callerProfileId — INDIRECT |
| dalDeletePortfolioMedia | vport.portfolio_media | .eq('id', mediaId) ONLY — RLS-ONLY |
| dalInsertPortfolioTags | vport.portfolio_tags | itemId only — NO profile_id scope |
| dalDeletePortfolioTags | vport.portfolio_tags | itemId only — NO profile_id scope |
| dalReplacePortfolioTags | vport.portfolio_tags | item ownership re-verified via profile_id |
| updatePortfolioMediaAssetIdDAL | vport.portfolio_media | .eq('profile_id', callerProfileId) — EXPLICIT |

### 4.4 Confidence Classification

- HIGH confidence: 0 paths (no scanner attribution)
- LOW confidence (PRIMARY ATTACK TARGETS): ALL paths — no security-path-map attribution for portfolio
- Callgraph layer coverage: controller (13), dal (25), model (36), hook (4), screen (25), adapter (3), barrel (19), component (3), module (15)

---

## 5. Scanner Signals

- Security paths attributed to portfolio: **0** — this feature has ZERO coverage in the security-path-map. All surfaces are SCANNER_LOW_CONF per Rule BW-002.
- Write execution map attribution: **0** — no write paths attributed to portfolio feature.
- RPC execution map attribution: **0** — no RPC paths.
- Callgraph coverage present (143 nodes, 213 edges) — confirms the portfolio engine is fully mapped in the call graph but no security path attribution exists.
- This combination (rich callgraph, zero security path attribution) is a governance red flag: the security scanner has not evaluated this feature's trust boundary surfaces.

---

## 6. Adversarial Path Analysis

### 6A. OWNERSHIP BYPASS (§5.1)

**Attack:** Can an actor pass another actor's `actorId` to `createItem`, `updateItem`, `deleteItem`, `addMedia`, or `removeMedia` and successfully mutate data belonging to a different actor?

**createItem — BLOCKED**
Source: `engines/portfolio/src/controller/createItem.controller.js` lines 34–38:
```js
const ownerCheck = await isActorOwner(actorId)
if (!ownerCheck) throw new Error('[createItem] not authorized as this actor')
```
`isActorOwner` is implemented in `setup.js` lines 39–58 and queries `vc.actor_owners` with `.eq('actor_id', actorId).eq('is_void', false)`. The `actor_owners_read_own` RLS policy auto-scopes this to `user_id = auth.uid()`. An attacker passing a foreign `actorId` will get no rows back — `isActorOwner` returns `false` — and the controller throws before any DB write. BLOCKED.

**updateItem — BLOCKED**
Source: `engines/portfolio/src/controller/updateItem.controller.js` lines 27–43:
1. Fetches `callerProfileId` from `dalGetProfileIdByActorId({ actorId })` — resolves the CALLER's profile.
2. Cross-checks `existing.profile_id !== callerProfileId` — throws if item belongs to a different profile.
3. `isActorOwner(actorId)` — RLS-scoped actor ownership check.
DAL at line 71: `.eq('profile_id', callerProfileId)` provides defense-in-depth at DB layer.

**deleteItem — BLOCKED** (same triple-gate pattern as updateItem — lines 24–46)

**addMedia — BLOCKED**
Source: `engines/portfolio/src/controller/addMedia.controller.js` lines 32–47:
- Resolves item's `profile_id` and caller's `callerProfileId` in parallel.
- Cross-checks `item.profile_id !== callerProfileId`.
- `isActorOwner` check.

**removeMedia — BLOCKED**
Source: `engines/portfolio/src/controller/removeMedia.controller.js` lines 30–46:
- Fetches media row and `callerProfileId` in parallel.
- Cross-checks `media.profile_id !== callerProfileId`.
- `isActorOwner` check.

**manageTags — PARTIAL (callerProfileId not forwarded to dalReplacePortfolioTags)**
Source: `engines/portfolio/src/controller/manageTags.controller.js` line 47:
```js
await dalReplacePortfolioTags({ itemId, tags: tags ?? [] })
```
`callerProfileId` is resolved at line 29 and cross-checked at line 38, but is NOT passed to `dalReplacePortfolioTags`. The DAL at `portfolioTags.write.dal.js` line 60 declares `callerProfileId` required and re-verifies item ownership independently. HOWEVER, the DAL's internal ownership verification uses a raw DB query that enforces the contract even without the controller passing `callerProfileId`. The DAL throws if `callerProfileId` is missing. Since `manageTags` does NOT pass `callerProfileId`, the DAL call will throw with `'[dalReplacePortfolioTags] callerProfileId required'`.

This is a **functional breakage** (manageTags always throws at the `dalReplacePortfolioTags` call) not an ownership bypass. Tag management is effectively broken for all callers. This confirms VEN-PORTFOLIO-001 from a different angle — the root cause is that `manageTags` resolves `callerProfileId` but does not forward it.

### 6B. SESSION MUTATION (§5.2)

**Attack:** Is `viewerActorId`/`actorId` taken from session (trusted) or client payload (untrusted)?

**usePortfolioItemSubmit — actorId is a prop**
Source: `hooks/usePortfolioItemSubmit.js` line 13: `actorId` is a parameter passed from the parent component. The hook does NOT independently validate that `actorId` matches the authenticated session.

**Identity resolution for actorId:**
The hook receives `actorId` from the parent, which in the dashboard context is always the active vport actor from `useIdentity()`. The engine's `isActorOwner(actorId)` call in each controller provides the session binding — it queries `actor_owners` with RLS filtering on `auth.uid()`, which means even if a stale or spoofed `actorId` is passed, the DB-layer RLS ensures only actors owned by the current auth session are accessible.

**Null/undefined actorId:**
- `createItem`: line 29 — `if (!actorId) throw` — BLOCKED.
- `updateItem`: line 23 — `if (!itemId || !actorId) throw` — BLOCKED.
- `addMedia`: line 28 — `if (!itemId || !actorId || !url) throw` — BLOCKED.
- `removeMedia`: line 25 — `if (!mediaId || !actorId) throw` — BLOCKED.
- `manageTags`: line 21 — `if (!itemId || !actorId) throw` — BLOCKED.

**isActorOwner null session:**
`setup.js` lines 45–47: `const { data: { session } } = await supabase.auth.getSession(); if (!session?.user?.id) return false` — null session returns false, controller throws. BLOCKED.

**Result:** Session mutation via null/stale actorId — BLOCKED at multiple layers.

### 6C. RUNTIME ABUSE (§5.3)

**Attack:** Can a non-owner actor type (e.g., a user-kind actor, a different vport actor) reach owner-only portfolio write paths?

The `isActorOwner` resolver does NOT check actor kind — it only verifies the actor exists in `actor_owners` with `is_void=false` AND is owned by the current auth session. A `user`-kind actor that owns a vport would pass `isActorOwner` for their own user actor but NOT for the vport actor (they are different rows in `actor_owners`). The cross-check `existing.profile_id !== callerProfileId` is the binding constraint: a user-kind actor resolves a different `profileId` (or null, since `dalGetProfileIdByActorId` queries `vport.profiles` which only contains vport-kind actors).

**Attack harness — user actor attempts updateItem on a vport-owned item:**
1. Call `updateItem({ itemId: <vport-item-id>, actorId: <user-actor-id> })`
2. `dalGetProfileIdByActorId({ actorId: <user-actor-id> })` queries `vport.profiles` for a user actor — returns null.
3. `existing.profile_id !== null` is always true (vport items always have a profile_id).
4. Controller throws `'[updateItem] not authorized to update this item'`. BLOCKED.

**probeVportPortfolioController — owner gate confirmed**
Source: `probeVportPortfolio.controller.js` lines 7–13: requires both `actorId` (non-null) and `identity.actorId` (non-null), then calls `assertActorOwnsVportActorController`. BLOCKED for non-owners.

### 6D. RLS VERIFICATION (§5.4)

**dalDeletePortfolioMedia — RLS-ONLY, no app-layer profile_id scope**
Source: `portfolioMedia.write.dal.js` lines 51–63:
```js
await supabase.schema('vport').from('portfolio_media').delete().eq('id', mediaId)
```
The DELETE is scoped to `id` only. App-layer ownership verification happens in `removeMedia.controller.js` before the call (cross-check on `media.profile_id === callerProfileId`). However, the DAL itself has no `profile_id` guard — if called directly or if the controller chain is bypassed, RLS is the only barrier. This confirms VEN-PORTFOLIO-006 — the DAL-level guard is absent.

**Note:** `removeMedia` controller does perform the cross-check correctly (lines 39–42), so the attack path requires bypassing the controller layer. Since there is no direct route from any hook to the DAL (hooks call controllers), the practical risk is LOW in current architecture. However, the DAL is exported in the engine's public adapters/index.js (line 17 re-exports `removeMedia` which eventually calls the unscoped DAL).

**dalInsertPortfolioTags / dalDeletePortfolioTags — no profile_id scope**
Both `dalInsertPortfolioTags` and `dalDeletePortfolioTags` scope only by `portfolio_item_id`. They rely on the controller to have verified ownership before calling. `dalReplacePortfolioTags` is the exception — it re-verifies internally. The tag DALs without `callerProfileId` are dependent on the caller having already established ownership.

**Tables assumed to have RLS:**
- `vport.portfolio_items` — app-layer profile_id scoping on UPDATE/DELETE, assumed RLS present.
- `vport.portfolio_media` — app-layer scoping on INSERT (indirect), ABSENT on DELETE.
- `vport.portfolio_tags` — no app-layer profile_id scope; relies on `portfolio_item_id` FK constraint and assumed RLS.

RLS has not been independently verified for any of these tables in the VENOM/ELEKTRA reports. VEN-PORTFOLIO-006 identifies this gap for `portfolio_media`. UNRESOLVED.

### 6E. VIEWER CONTEXT FUZZING (§5.5)

**Attack:** What happens when null/undefined actorId is passed to each controller?

All engine controllers have explicit guards at the top of each function (see §6B analysis). Results:
- `createItem(null)` → throws `'[createItem] actorId is required'` at line 29. BLOCKED.
- `updateItem({ itemId, actorId: null })` → throws `'[updateItem] itemId and actorId are required'` at line 23. BLOCKED.
- `deleteItem({ itemId, actorId: null })` → throws `'[deleteItem] itemId and actorId are required'` at line 22. BLOCKED.
- `addMedia({ itemId, actorId: null, url })` → throws `'[addMedia] itemId, actorId, and url are required'` at line 28. BLOCKED.
- `removeMedia({ mediaId, actorId: null })` → throws `'[removeMedia] mediaId and actorId are required'` at line 25. BLOCKED.
- `manageTags({ itemId, actorId: null })` → throws `'[manageTags] itemId and actorId are required'` at line 21. BLOCKED.

**ctrlListPortfolio / ctrlGetPortfolioItem (VportPortfolio.controller.js):**
- `ctrlListPortfolio(null)` → throws `'[VportPortfolio] actorId is required'` (line 10). BLOCKED.
- `ctrlGetPortfolioItem(null)` → throws `'[VportPortfolio] itemId is required'` (line 25). BLOCKED.

**addPortfolioMediaWithRecord:** No null check on `actorId` at the composite controller level (lines 27–51). The call chains to `addMedia` which does the check, so a null `actorId` will propagate to `addMedia` and throw there. BLOCKED (indirectly).

### 6F. MUTATION REPLAY (§5.6)

**Attack:** Can a soft-deleted portfolio item be re-triggered (re-created, re-activated) by replaying a prior create call?

**deleteItem soft-delete idempotency check:**
Source: `deleteItem.controller.js` lines 42–44:
```js
if (existing.is_deleted) {
  return PortfolioItemModel(existing)
}
```
A soft-deleted item returns early without error. This is SAFE — no state explosion. BLOCKED.

**updateItem on deleted item:**
`dalUpdatePortfolioItem` does not filter by `is_deleted`. An actor could call `updateItem` on a soft-deleted item and the query would succeed (no `is_deleted=false` guard in the UPDATE DAL). The UPDATE won't fail — it will silently update a deleted item's fields. This is a MEDIUM concern: deleted items should not be mutable.

**createItem replay:**
No protection against creating duplicate items. Multiple calls create multiple rows. This is expected behavior (no unique constraint on title/profile). Not an exploit — expected behavior.

**addMedia to deleted item:**
`addMedia` calls `dalGetPortfolioItemById` which fetches the item without `is_deleted` filter (line 17 of portfolioItems.read.dal.js). If the item is soft-deleted, the cross-check `item.profile_id !== callerProfileId` still passes for the real owner. Media can be added to a deleted item. This is a MEDIUM finding — the `addMedia` controller does not guard against adding media to soft-deleted items.

### 6G. HYDRATION POISONING (§5.7)

**Attack:** Does portfolio interact with the hydration store? Can actor summaries be poisoned?

No hydration engine imports found in portfolio source files. The portfolio uses a local TTL cache (`createTTLCache`) scoped to `listCache` in `VportPortfolio.controller.js`. This cache is module-level, not shared across actors in the same session.

**Cache invalidation gap (VEN-002 confirmed):**
Source: `VportPortfolio.controller.js` line 13:
```js
const cacheKey = offset === 0 ? `${actorId}:${viewerIsOwner ? 'owner' : 'public'}` : null
```
Cache keys are compound: `<actorId>:owner` and `<actorId>:public`.

Source: `VportPortfolio.controller.js` line 30:
```js
export function invalidatePortfolioCache(actorId) {
  listCache.invalidate(actorId)
}
```
Source: `ttlCache.js` line 31: `invalidate(key) { store.delete(key) }` — deletes the exact key.

`invalidatePortfolioCache(actorId)` calls `listCache.invalidate(actorId)` with the bare `actorId` as the key. The cache stores entries under `<actorId>:owner` and `<actorId>:public` — NOT the bare `actorId`. The `store.delete(actorId)` call deletes a key that was never set — the compound keys remain in cache. This means after a mutation (create, update, delete), the list view will continue serving stale data for up to 60 seconds.

**Result:** Cache invalidation is broken. This is not a security exploit but a data freshness failure that could cause: (a) a deleted item appearing in the list after deletion, (b) a newly created item not appearing, (c) an updated item showing stale data. Severity: MEDIUM. Confirms VEN-PORTFOLIO-002.

**Hydration poisoning risk:** LOW — portfolio does not interact with the shared hydration store.

### 6H. URL SURFACE (§5.9)

**Attack:** Do any portfolio notification links, share links, or deep links expose raw UUIDs?

No notification construction found in any portfolio controller or hook (grep found zero results for `notification`, `linkPath`, `deepLink`, `shareLink`). Portfolio controllers emit domain events (`EVENTS.ITEM_CREATED`, `EVENTS.ITEM_UPDATED`, etc.) but do not construct URLs or notification payloads directly.

The `publishLocksmithPortfolioUpdateAsPostController` is called from `usePortfolioItemSubmit` (line 137) but URL construction is delegated to that controller (outside this feature scope).

**Result:** No URL surface exposure found within the portfolio feature boundary. INFO.

### 6I. §9 INVARIANT ATTACK (HIGHEST PRIORITY)

**BEHAVIOR.md Status:** PLACEHOLDER — No §9 Must Never Happen invariants are declared.

Since the contract is PLACEHOLDER, all §9 invariants are UNANCHORED. This was previously recorded as VEN-PORTFOLIO-007 (HIGH). The BW V2 role is to attempt to infer source-observable invariants and test them adversarially.

**Inferred Invariant 1 — A non-owner should never successfully mutate a portfolio item.**
Attack: Pass a foreign actor's ID to `updateItem` with a valid `itemId`.
Result: BLOCKED (see §6A analysis). Triple-gate pattern (profile_id cross-check + isActorOwner + DAL eq) prevents this.

**Inferred Invariant 2 — A soft-deleted item should not be resurrected without explicit admin action.**
Attack: Call `updateItem` on a soft-deleted item.
Result: PARTIAL BYPASS — `dalUpdatePortfolioItem` has no `is_deleted=false` guard. The UPDATE query (.eq('id', itemId).eq('profile_id', callerProfileId)) does not exclude deleted items. A real owner can update fields on their soft-deleted items. This violates the expected invariant that deletion is terminal for user-facing operations.

**Inferred Invariant 3 — A real owner should always be able to manage tags for their portfolio items.**
Attack: Call `manageTags` as the legitimate owner.
Result: BYPASSED (broken functionality, not a security bypass) — `manageTags` always throws because it does not pass `callerProfileId` to `dalReplacePortfolioTags`. The DAL requires `callerProfileId` and throws immediately. This means NO actor can manage tags via this controller path. Confirmed VEN-PORTFOLIO-001 from adversarial angle.

**Inferred Invariant 4 — Deleted portfolio items should not appear in public listings.**
Attack: Observe `ctrlListPortfolio` (non-owner path, `viewerIsOwner=false`) after soft-deleting an item.
Analysis: `dalListPortfolioItemsByProfileId` (line 52): `.eq('is_deleted', false)` is always applied. Public listing filters deleted items. BLOCKED.

**Inferred Invariant 5 — Private portfolio items should not appear in public listings.**
Attack: Set item `visibility='private'` then observe `ctrlListPortfolio` from a non-owner viewer.
Analysis: `dalListPortfolioItemsByProfileId` line 54–56: `if (publicOnly) { query = query.eq('visibility', 'public').eq('is_active', true) }`. `publicOnly = !viewerIsOwner` (listPortfolio.controller.js line 31). Non-owner reads get `publicOnly=true` and the filter is applied. BLOCKED.

**Inferred Invariant 6 — `getPortfolioItem` should not return deleted/private items to non-owners.**
Attack: Fetch a soft-deleted item via `ctrlGetPortfolioItem`.
Analysis: `dalGetPortfolioItemById` (portfolioItems.read.dal.js lines 17–33) fetches by `id` with NO `is_deleted` or `visibility` filter. A raw item fetch returns the row regardless of deletion status or visibility. The controller `getPortfolioItem` returns `null` if no row found, but returns ANY row (deleted or private) if found.

This is the VEN-PORTFOLIO-003 finding confirmed adversarially: `getPortfolioItem` returns deleted and private items to any caller who knows the `itemId`. There is no viewerIsOwner gate in the read path. A non-owner who knows a private item's UUID can retrieve it.

**Severity assessment:** This is a PRIVACY BYPASS — a non-owner can read private or deleted portfolio content if they know the item UUID. Since item UUIDs may be embedded in notifications or other data surfaces, this is a real exposure risk.

---

## 7. Exploitability Assessment

| Finding | Exploitability | Preconditions |
|---|---|---|
| BW-PORT-001 (BEHAVIOR.md PLACEHOLDER) | LOW exploitability — governance gap | None |
| BW-PORT-002 (manageTags broken) | LOW security risk — functional breakage | Caller must have valid ownership |
| BW-PORT-003 (cache invalidation broken — compound keys) | LOW-MEDIUM — stale data for 60s max | Requires prior caching of list |
| BW-PORT-004 (dalDeletePortfolioMedia RLS-only) | LOW — controller gate exists | Must bypass controller layer |
| BW-PORT-005 (getPortfolioItem returns deleted/private items) | HIGH — direct UUID access returns any item | Attacker needs item UUID |
| BW-PORT-006 (updateItem on soft-deleted items allowed) | MEDIUM — owner can mutate deleted content | Must be legitimate owner of the item |
| BW-PORT-007 (model exposes profileId/createdByActorId) | MEDIUM — identity surface leak | Any API consumer |

---

## 8. Source Verification Summary

All findings with BYPASSED or PARTIAL results carry [SOURCE_VERIFIED] citations:

| Finding | Verification Status | Citation |
|---|---|---|
| BW-PORT-001 | SOURCE_VERIFIED | BEHAVIOR.md line 3: `Status: PLACEHOLDER` |
| BW-PORT-002 | SOURCE_VERIFIED | manageTags.controller.js line 47: `dalReplacePortfolioTags({ itemId, tags: tags ?? [] })` — callerProfileId absent |
| BW-PORT-003 | SOURCE_VERIFIED | VportPortfolio.controller.js line 30: `listCache.invalidate(actorId)` vs line 13: key is `${actorId}:${viewerIsOwner ? 'owner' : 'public'}` |
| BW-PORT-004 | SOURCE_VERIFIED | portfolioMedia.write.dal.js lines 51–63: DELETE scoped to `.eq('id', mediaId)` only |
| BW-PORT-005 | SOURCE_VERIFIED | portfolioItems.read.dal.js lines 17–33: no `is_deleted` or `visibility` filter on single-item fetch |
| BW-PORT-006 | SOURCE_VERIFIED | portfolioItems.write.dal.js lines 50–81: UPDATE has no `.eq('is_deleted', false)` guard |
| BW-PORT-007 | SOURCE_VERIFIED | PortfolioItem.model.js lines 13–14: `profileId: raw.profile_id, createdByActorId: raw.created_by_actor_id` in public model |

---

## 9. Confidence Summary

| Attack Category | Result | Confidence |
|---|---|---|
| 6A Ownership Bypass | BLOCKED (all write paths) + PARTIAL (manageTags broken) | HIGH — SOURCE_VERIFIED |
| 6B Session Mutation | BLOCKED | HIGH — SOURCE_VERIFIED |
| 6C Runtime Abuse | BLOCKED | HIGH — SOURCE_VERIFIED |
| 6D RLS Verification | PARTIAL — dalDeletePortfolioMedia RLS-only | MEDIUM — SCANNER_LOW_CONF (RLS unverified) |
| 6E Viewer Context Fuzzing | BLOCKED | HIGH — SOURCE_VERIFIED |
| 6F Mutation Replay | PARTIAL — updateItem on deleted items allowed | MEDIUM — SOURCE_VERIFIED |
| 6G Hydration Poisoning | NOT APPLICABLE + cache invalidation broken | HIGH — SOURCE_VERIFIED |
| 6H URL Surface | CLEAN (no URL construction) | HIGH — SOURCE_VERIFIED |
| 6I §9 Invariant Attack | UNANCHORED (PLACEHOLDER) + getPortfolioItem bypass confirmed | HIGH — SOURCE_VERIFIED |

---

## 10. §9 Invariant Attack Map

| Invariant # | Source | Invariant (Inferred) | Attack Scenario | Result |
|---|---|---|---|---|
| INV-1 | Source-inferred | Non-owner cannot mutate portfolio items | Pass foreign actorId to updateItem | BLOCKED |
| INV-2 | Source-inferred | Soft-deleted items cannot be mutated by owner | Call updateItem on is_deleted=true item | PARTIAL BYPASS |
| INV-3 | Source-inferred | Real owner can always manage tags | Call manageTags as legitimate owner | BYPASSED (broken) |
| INV-4 | Source-inferred | Deleted items absent from public listings | List portfolio after soft-delete | BLOCKED |
| INV-5 | Source-inferred | Private items absent from public listings | List portfolio as non-owner | BLOCKED |
| INV-6 | Source-inferred | Non-owner cannot read private/deleted items | Fetch deleted item by UUID via getPortfolioItem | BYPASSED — HIGH |

Note: All invariants are UNANCHORED because BEHAVIOR.md is PLACEHOLDER. These are adversarially inferred from source observation.

---

## 11. Behavior Contract Attack Summary

BEHAVIOR.md Status: **PLACEHOLDER**

This is the single most significant governance finding. With no declared §5 Security Rules and no §9 Must Never Happen invariants:
- All ownership and visibility invariants are implicit and unverified by governance tooling
- Cross-feature changes (e.g., to VportPortfolio.controller.js or setup.js) have no contract to test against
- SPIDER-MAN tests cannot reference §9 invariants for regression coverage
- THOR release gates cannot evaluate security compliance

Prior VEN-PORTFOLIO-007 (HIGH) covers this. BW confirms and amplifies: the PLACEHOLDER status means all 6 adversarial invariant tests above were run against inferred behavior only. Two produced BYPASSED or PARTIAL BYPASS results.

---

## 12. THOR Impact (Release Blockers)

| Finding | Severity | THOR Impact |
|---|---|---|
| BW-PORT-005 (getPortfolioItem returns deleted/private items) | HIGH | THOR BLOCKER — privacy bypass for non-owners with item UUIDs |
| BW-PORT-001 (BEHAVIOR.md PLACEHOLDER) | HIGH | THOR BLOCKER — all invariants unanchored, governance cannot evaluate |
| BW-PORT-002 (manageTags always broken) | MEDIUM | NOT a blocker — functional breakage, not security |
| BW-PORT-003 (cache invalidation broken) | MEDIUM | NOT a blocker — data freshness issue, not security |
| BW-PORT-006 (updateItem on deleted items) | MEDIUM | NOT a blocker — owner-scoped |
| BW-PORT-004 (dalDeletePortfolioMedia RLS-only) | MEDIUM | NOT a blocker — controller-layer gate present |
| BW-PORT-007 (model identity surface leak) | MEDIUM | NOT a blocker — inherited from VEN-PORT-005 |

**THOR Release Blocker: YES (BW-PORT-005 + BW-PORT-001)**

---

## 13. SPIDER-MAN Test Requirements

The following regression tests are required to close BW findings:

| Test ID | Finding | Test Description |
|---|---|---|
| SPM-PORT-BW-001 | BW-PORT-005 | getPortfolioItem called with a soft-deleted item ID returns null or throws — not the deleted row |
| SPM-PORT-BW-002 | BW-PORT-005 | getPortfolioItem called with a private-visibility item ID by a non-owner caller returns null — not the private row |
| SPM-PORT-BW-003 | BW-PORT-002 | manageTags called with a valid itemId and actorId resolves successfully — no throw from missing callerProfileId |
| SPM-PORT-BW-004 | BW-PORT-003 | invalidatePortfolioCache(actorId) causes subsequent ctrlListPortfolio(actorId) to re-fetch from DB — both 'owner' and 'public' cache entries cleared |
| SPM-PORT-BW-005 | BW-PORT-006 | updateItem called on a soft-deleted item throws or returns null — does not silently update deleted content |
| SPM-PORT-BW-006 | BW-PORT-004 | dalDeletePortfolioMedia called directly with a foreign mediaId fails at RLS (or has a callerProfileId guard added) |
| SPM-PORT-BW-007 | INV-1 (§9) | updateItem/deleteItem called with a foreign actorId throws with an authorization error |
| SPM-PORT-BW-008 | INV-3 (§9) | manageTags called as a legitimate owner succeeds (end-to-end, not just controller-level) |

---

*BlackWidow V2 adversarial review complete. 2026-06-04.*
*All BYPASSED findings carry [SOURCE_VERIFIED] citations. No production code was modified.*
