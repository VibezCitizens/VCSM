# MODULE ARCHITECTURE REPORT

**Module:** engines/portfolio
**Application Scope:** VCSM + ENGINE
**Module Type:** Shared Domain Engine — Vport Portfolio
**Primary Root:** /Users/vcsm/Desktop/VCSM/engines/portfolio/
**ARCHITECT Run Date:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001

---

## PURPOSE

The portfolio engine owns the full lifecycle of vport portfolio items: create, list, update, delete, media management, tag management, and kind-specific detail fetch (barber, locksmith). It is purely vport-scoped — all tables are in the `vport` schema.

Write pipeline (createItem):
```
1. isActorOwner(actorId) — DI ownership check
2. dalGetProfileIdByActorId(actorId) — resolve actorId → profileId via vport.profiles
3. dalInsertPortfolioItem — insert row (createdByActorId = null intentionally)
4. dalInsertPortfolioTags — upsert tags with onConflict ignore
5. emit ITEM_CREATED event
```

Read pipeline (listPortfolio):
```
1. dalListPortfolioItemsByProfileId — paginated, sorted (pinned → featured → sort_order → created_at)
2. Caller fetches media/tags as needed via addMedia / manageTags controllers
```

---

## OWNERSHIP

**Engine Owner:** Platform team
**App Scope:** VCSM (confirmed: `apps/VCSM/src/features/portfolio/setup.js`)
**CLAUDE.md:** PRESENT — explicit scope rules documented
**Infrastructure:** vport schema (Supabase) — 7 tables, no RPC calls, no external transport

---

## ENTRY POINTS

**Primary:** `engines/portfolio/index.js` → `src/adapters/index.js`
**Alias:** `@portfolio` (used in VCSM setup.js and consumers)

**Exported surface (14 symbols):**
- `configurePortfolioEngine` (DI config)
- `EVENTS`, `onPortfolioEvent`, `emit` (domain event bus)
- `listPortfolio`, `getPortfolioItem` (read controllers)
- `createItem`, `updateItem`, `deleteItem` (write controllers)
- `addMedia`, `removeMedia` (media management)
- `manageTags` (tag management)
- `PortfolioItemModel`, `PortfolioMediaModel` (model transforms — exported for consumer use)
- `BarberDetailsModel`, `LocksmithDetailsModel` (kind-specific model transforms)

---

## LAYER MAP

```
engines/portfolio/
├── CLAUDE.md                          — scope rules (PRESENT)
├── index.js                           — entry point → src/adapters/index.js
└── src/
    ├── adapters/index.js              — 14 exported symbols (public API)
    ├── config.js                      — DI (supabaseClient, isActorOwner, debugReporter; no freeze guard)
    ├── events.js                      — 6 domain events
    ├── types/index.js                 — JSDoc typedefs
    ├── controller/                    — 8 orchestration controllers + 1 test
    │   ├── createItem.controller.js
    │   ├── updateItem.controller.js
    │   ├── deleteItem.controller.js
    │   ├── getPortfolioItem.controller.js
    │   ├── listPortfolio.controller.js
    │   ├── addMedia.controller.js
    │   ├── removeMedia.controller.js
    │   ├── manageTags.controller.js
    │   └── __tests__/updateItem.controller.test.js
    ├── dal/                           — 8 DAL files + 1 test
    │   ├── portfolioItems.read.dal.js
    │   ├── portfolioItems.write.dal.js
    │   ├── portfolioMedia.read.dal.js
    │   ├── portfolioMedia.write.dal.js
    │   ├── portfolioTags.read.dal.js
    │   ├── portfolioTags.write.dal.js
    │   ├── barberDetails.read.dal.js
    │   ├── locksmithDetails.read.dal.js
    │   └── __tests__/portfolioTags.write.dal.test.js
    ├── model/                         — 4 pure row→domain transforms
    │   ├── PortfolioItem.model.js
    │   ├── PortfolioMedia.model.js
    │   ├── BarberDetails.model.js
    │   └── LocksmithDetails.model.js
    └── services/
        └── portfolioService.js        — itemExists + resolveItem helpers
```

Total: 29 files (including 2 test files — only engine in TICKET-ARCHITECT-MISSING-0001 sprint with existing tests)

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|------|--------|----------|----------------|
| Purpose defined | PASS | CLAUDE.md present; scope rules documented | — |
| Owner defined | PASS | setup.js + consumer files | — |
| Entry points mapped | PASS | adapters/index.js, 14 exports | — |
| Controllers present | PASS | 8 controllers covering full CRUD + media + tags | — |
| DAL/repository present | PASS | 8 DAL files; explicit column selects; no select(*) | — |
| Models/transformers present | PASS | 4 pure model functions | — |
| Kind-specific DALs | PASS | barber + locksmith detail DALs | Extensibility risk as more kinds added (ANOM-PORT-003) |
| DB access | vport schema only | 7 tables declared; 5 active, 2 unimplemented (ANOM-PORT-005) | portfolio_item_metrics + portfolio_item_services: no DAL |
| Hooks/view models | NONE | No framework code — clean | — |
| Security controls | PARTIAL | isActorOwner DI before writes; profile_id guard on UPDATE/DELETE; media DELETE RLS-only (ANOM-PORT-001) | — |
| Documentation linked | PARTIAL | CLAUDE.md PRESENT; BEHAVIOR.md, SECURITY.md MISSING | — |
| Tests | PARTIAL | 2 test files present (only engine with any tests) | updateItem.controller.test.js + portfolioTags.write.dal.test.js |

---

## DEPENDENCY INJECTION

| Point | Required | VCSM Value | Fail Behavior |
|-------|----------|------------|--------------|
| supabaseClient | REQUIRED | VCSM supabase client | Throws on first DAL call |
| isActorOwner | REQUIRED | vc.actor_owners RLS-scoped query | Throws if not configured; returns false on auth failure |
| debugReporter | optional | portfolioTraceStore.push() (DEV only) | No-op if null |

**No engine-level freeze guard** — configurePortfolioEngine() merges config on every call.
**App-level guard:** `apps/VCSM/src/features/portfolio/setup.js` has `_configured` flag — prevents repeat calls from app, but engine itself does not guard.

**isActorOwner implementation (VCSM):**
```
1. Return false if actorId is falsy
2. Get auth session — return false if no active session
3. Query vc.actor_owners WHERE actor_id = actorId AND is_void = false (LIMIT 1)
4. RLS policy actor_owners_read_own (user_id = auth.uid()) auto-scopes query
5. Return true if row found, false if not found or error
```

Security note: RLS enforcement (no explicit user_id filter in query) — see ANOM-PORT-002.

---

## DB ACCESS MAP

| Table | Schema | Operations | Notes |
|-------|--------|-----------|-------|
| portfolio_items | vport | READ (list by profile_id, get by id) | Explicit column list; sort: pinned→featured→sort_order→created_at |
| portfolio_items | vport | WRITE (INSERT, UPDATE partial, soft-DELETE) | UPDATE/DELETE filter by profile_id + id (double guard) |
| portfolio_media | vport | READ (list by item_id, batch list, get by id) | Active filter: is_active=true on list queries |
| portfolio_media | vport | WRITE (INSERT, hard-DELETE) | DELETE: no app-level owner check (ANOM-PORT-001) |
| portfolio_tags | vport | READ (list by item_id, batch list) | — |
| portfolio_tags | vport | WRITE (insert upsert, delete specific, replace all) | dalReplacePortfolioTags: inline item ownership check before delete |
| barber_portfolio_details | vport | READ (get by item_id, batch list) | No write DAL — managed outside engine |
| locksmith_portfolio_details | vport | READ (get by item_id, batch list) | No write DAL — managed outside engine |
| profiles | vport | READ (actor_id → profile_id mapping) | Used in createItem to resolve profileId |
| portfolio_item_metrics | vport | NONE | In CLAUDE.md schema; no DAL (ANOM-PORT-005) |
| portfolio_item_services | vport | NONE | In CLAUDE.md schema; no DAL (ANOM-PORT-005) |

No RPCs — all queries are direct table operations.

---

## DOMAIN EVENTS

| Event | Trigger |
|-------|---------|
| ITEM_CREATED | createItem controller success |
| ITEM_UPDATED | updateItem controller success |
| ITEM_DELETED | deleteItem controller success |
| MEDIA_ADDED | addMedia controller success |
| MEDIA_REMOVED | removeMedia controller success |
| TAGS_UPDATED | manageTags controller success |

Event bus: Array-based listener pattern (same as notifications engine). No external publisher.

---

## SECURITY SURFACE

| Control | Mechanism | Risk |
|---------|-----------|------|
| Write authorization | isActorOwner DI (required) called before all writes | PASS |
| UPDATE/DELETE double guard | profileId + itemId filter in WHERE clause | PASS |
| Media DELETE | No app-level check — dalDeletePortfolioMedia relies entirely on RLS | ANOM-PORT-001 |
| Tag replace ownership | Inline item ownership check before replace | PASS |
| isActorOwner RLS reliance | No explicit user_id query filter; relies on actor_owners_read_own policy | ANOM-PORT-002 |
| No SECURITY.md | VENOM/ELEKTRA blocked | MISSING |

---

## ARCHITECTURE ANOMALIES

### ANOM-PORT-001: Media Hard Delete Relies Solely on RLS

**Location:** `engines/portfolio/src/dal/portfolioMedia.write.dal.js`
**Finding:** `dalDeletePortfolioMedia` hard-deletes by `mediaId` alone with no caller ownership check. The comment reads "RLS enforces ownership." If the RLS policy on `vport.portfolio_media` is misconfigured or absent, any caller with a valid mediaId can delete any media row.
**Compare:** `dalSoftDeletePortfolioItem` filters by `id + profile_id` (double guard). `dalUpdatePortfolioItem` filters by `id + profile_id`. Media delete has no such guard.
**Risk:** HIGH — media delete is a permanent destructive operation with no app-level ownership check.

### ANOM-PORT-002: isActorOwner Relies on RLS Without Explicit User Filter

**Location:** `apps/VCSM/src/features/portfolio/setup.js` — isActorOwner implementation
**Finding:** The ownership check queries `vc.actor_owners` filtering by `actor_id` and `is_void = false` only. It does NOT add `.eq('user_id', session.user.id)` to the query. Security correctness depends entirely on the `actor_owners_read_own` RLS policy being applied and correctly enforced.
**Risk:** MEDIUM — if RLS policy is dropped, misconfigured, or bypassed (service role key, etc.), the ownership check becomes a simple "does this actor exist?" check rather than "does this auth user own this actor?"

### ANOM-PORT-003: Kind-Specific DALs Baked Into Generic Engine

**Finding:** `barberDetails.read.dal.js` and `locksmithDetails.read.dal.js` are in the generic portfolio engine. Write DALs for barber/locksmith detail tables are absent — managed outside the engine. This means the engine has read DALs for 2 specific VPORT kinds (barber, locksmith) with no consistent pattern for adding new kinds.
**Risk:** LOW-MEDIUM — not a defect today; becomes an extensibility concern when new VPORT kinds (e.g., salon, mechanic) are added. Recommend documenting the extension point.

### ANOM-PORT-004: No DI Freeze Guard at Engine Config Level

**Finding:** `configurePortfolioEngine()` has no internal freeze guard. The app-level `_configured` flag in `setup.js` prevents repeat calls from VCSM, but the engine itself will accept repeated configuration without protection. Inconsistent with the ELEK-007 booking engine pattern.
**Risk:** LOW — mitigated by app-level guard, but engine cannot defend itself if used outside VCSM.

### ANOM-PORT-005: Two Schema Tables Have No DAL Coverage

**Finding:** `CLAUDE.md` declares 7 tables in scope:
- `vport.portfolio_item_metrics` — no DAL files exist
- `vport.portfolio_item_services` — no DAL files exist

These tables are mentioned in the schema contract but not implemented. Either planned-but-deferred or managed via a separate path not visible in the engine source.
**Risk:** LOW (no defect if tables exist but are unused) — creates false scope declaration in CLAUDE.md.

---

## APP CONSUMERS (VCSM)

| File | Symbols Used |
|------|--------------|
| features/portfolio/setup.js | configurePortfolioEngine |
| features/profiles/kinds/vport/controller/portfolio/VportPortfolio.controller.js | listPortfolio, createItem, updateItem, deleteItem, addMedia, removeMedia, manageTags |
| features/dashboard/vport/dashboard/cards/portfolio/controller/addPortfolioMediaWithRecord.controller.js | addMedia, PortfolioMediaModel |

---

## BEHAVIOR CONSISTENCY CHECK — engines/portfolio

```
Behavior Consistency Check — engines/portfolio
===============================================
BEHAVIOR.md present: NO
Status: MISSING

Check A (Source without behavior): FINDING
  → 29 files: 8 controllers, 8 DAL files, 4 models, 2 kind-specific DALs
  → CLAUDE.md present — scope rules documented (unlike hydration/media)
  → No BEHAVIOR.md — undocumented: ownership semantics, kind resolution path, soft-delete vs hard-delete rules
  → Severity: P2 (portfolio is CRUD-complete; BEHAVIOR.md absence is documentation gap, not operational gap)

Check B, C, D: SKIPPED — no BEHAVIOR.md
```

---

## MODULE INDEPENDENCE STATUS

```
MODULE INDEPENDENCE STATUS
Module: engines/portfolio
Classification: MOSTLY INDEPENDENT
Reason: Pure vport schema access. DI for supabaseClient and isActorOwner.
  CLAUDE.md present. No React or framework code.
  Partial test coverage (2 test files — only engine in sprint with tests).
Blocking anomalies:
  - Media hard delete RLS-only (ANOM-PORT-001) — security gap; needs VENOM
  - isActorOwner RLS reliance (ANOM-PORT-002) — trust boundary gap; needs ELEKTRA
  - Two tables unimplemented (ANOM-PORT-005) — false scope declaration
  - No DI freeze guard (ANOM-PORT-004) — parity gap vs booking engine
  - No BEHAVIOR.md → VENOM blocked
  - No SECURITY.md → VENOM/ELEKTRA blocked
```

---

## RECOMMENDED HANDOFFS

- **VENOM** — dalDeletePortfolioMedia RLS-only path (ANOM-PORT-001); isActorOwner RLS reliance (ANOM-PORT-002); write SECURITY.md
- **ELEKTRA** — DI freeze guard (ANOM-PORT-004); trace full deleteMedia → RLS → policy chain; propose patches
- **SPIDER-MAN** — Extend test coverage: createItem, deleteItem, media write DAL, listPortfolio sorting
- **WOLVERINE** — Kind-specific DAL extensibility decision (ANOM-PORT-003); portfolio_item_metrics + portfolio_item_services implementation status (ANOM-PORT-005)
- **LOGAN** — Write BEHAVIOR.md, SECURITY.md governance artifacts
