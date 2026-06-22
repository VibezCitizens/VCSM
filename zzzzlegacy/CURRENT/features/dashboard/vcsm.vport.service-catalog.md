# Vport Service Catalog — System Architecture

## 1 Purpose

`vport.service_catalog` is the master list of allowed services per vport category (e.g. `barber`, `locksmith`, `exchange`). It defines what services a vport actor *can* offer. Actor-level enablement is stored separately in `vport.services`.

---

## 2 Scope

**Included:**
- Service catalog schema and composite key rules
- DAL consumers and their select projections
- Controller merge logic (catalog + actor overrides)
- Fallback model for categories with no DB rows

**Excluded:**
- Actor-specific service enablement (`vport.services` — separate table)
- Service add-ons (`vport.service_addons`)
- Booking configuration (`vport.service_booking_profiles`)

---

## 3 Ownership

**Application Scope:** VCSM

**Code Roots:**
- `apps/VCSM/src/features/profiles/kinds/vport/dal/services/`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/services/`
- `apps/VCSM/src/features/profiles/kinds/vport/model/services/`
- `apps/VCSM/src/features/vport/dal/` (legacy parallel DAL)
- `apps/VCSM/src/features/vport/controller/`

---

## 4 Entry Points

| Layer | File | Purpose |
|-------|------|---------|
| DAL (primary) | `dal/services/readVportServiceCatalogByType.js` | Read catalog rows by vport type |
| DAL (legacy) | `features/vport/dal/readVportServiceCatalogByType.dal.js` | Older parallel DAL used by `features/vport/controller/` |
| Model | `model/services/vportService.model.js` → `mapVportServiceCatalogRow` | Row → domain object |
| Model (fallback) | `model/services/vportServiceCatalogFallback.model.js` | Static rows when catalog has no DB entries |
| Controller (read) | `controller/services/getVportServices.controller.js` | Merge catalog + actor services |
| Controller (write) | `controller/services/upsertVportServices.controller.js` | Validate keys against catalog, then upsert actor services |

---

## 5 Data Flow

### Read path
```
getVportServicesController({ targetActorId, vportType })
  → readVportServiceCatalogByType({ vportType })   [DAL → vport.service_catalog]
  → readVportServicesByActor({ actorId })           [DAL → vport.services]
  → readVportServiceAddonsByActor({ actorId })      [DAL → vport.service_addons]
  → getFallbackServiceCatalogRows(vportType)        [if catalog empty]
  → resolveVportServicesFromCatalog(catalogRows, actorServiceRows)
    → mapVportServiceCatalogRows (catalog → domain)
    → mapVportServiceRows (actor overrides → domain)
    → merges by key: catalog defines shape, actor overrides enable/meta/label
  → returns { vportType, mode, services, addons }
```

### Write path
```
upsertVportServicesController({ targetActorId, items, vportType })
  → readVportServiceCatalogByType({ vportType })   [catalog validation]
  → builds catalogByKey map
  → filters items to only valid catalog keys
  → upsertVportServicesByActorDal({ rows })         [DAL → vport.services UPSERT]
```

---

## 6 Source of Truth

| Data | Table | Schema | Key |
|------|-------|--------|-----|
| Allowed services per type | `service_catalog` | `vport` | **COMPOSITE: (category_key, key)** |
| Actor service enablement | `services` | `vport` | `id` (uuid) |
| Service add-ons | `service_addons` | `vport` | `id` (uuid) |

### CRITICAL: vport.service_catalog has NO id column

The table uses a **composite primary key**: `(category_key, key)`.

There is no `id` column. All queries, joins, and filters must use both `category_key` and `key`.

**Actual columns:**
```
category_key  text   NOT NULL   (FK → vport.categories.key)
key           text   NOT NULL
label         text   NOT NULL
description   text
service_group text
is_active     boolean NOT NULL DEFAULT true
sort_order    integer NOT NULL DEFAULT 0
meta          jsonb   NOT NULL DEFAULT '{}'
created_at    timestamptz NOT NULL
updated_at    timestamptz NOT NULL
```

**Columns that do NOT exist (do not select):**
- `id` — no single-column PK
- `category` — use `service_group` or `category_key` instead
- `vport_type` — use `category_key` instead

---

## 7 UI States

| State | Trigger |
|-------|---------|
| Services loaded | `getVportServicesController` resolves |
| Fallback active | Catalog has no rows for vportType — static fallback used |
| Empty | No catalog and no fallback for type |
| Owner mode | `asOwner: true` — includes inactive catalog items |
| Viewer mode | `asOwner: false` — only enabled services returned |
| Cached | 60s TTL in `getVportServicesController` (viewer mode only) |

---

## 8 Dependencies

| Module | Purpose |
|--------|---------|
| `vportSchema` (vportClient) | Supabase client scoped to `vport` schema |
| `shared/lib/ttlCache` | 60s cache on viewer reads |
| `vportServiceCatalogFallback.model.js` | Static fallback when DB has no rows |
| `resolveVportServicesFromCatalog` | Catalog + actor merge logic |

---

## 9 Rules / Invariants

1. **No `id` column on `vport.service_catalog`.** Never select, join, or filter on `service_catalog.id`.
2. **Composite key is `(category_key, key)`.** Both fields are required to uniquely identify a catalog entry.
3. **Catalog is read-only from the app.** Only admin/DB-level migrations add catalog entries.
4. **Actor services are keyed by `key` string**, not by catalog PK. The actor table `vport.services` has its own `id`.
5. **Fallback rows are returned when catalog is empty.** Never block the UI because a catalog type has no rows.
6. **`upsertVportServices` validates all keys against catalog** before saving. Items with keys not in catalog are silently dropped.
7. **Owner mode includes inactive catalog items.** Viewer mode returns only enabled actor services.

---

## 10 Failure Risks

| Risk | Condition | Impact |
|------|-----------|--------|
| `column service_catalog.id does not exist` | Selecting `id` in DAL | Postgres 400 error — services fail to load |
| Selecting `category` column | Column doesn't exist in schema | May return null silently or throw — stale column name |
| Fallback returns stale shape | Fallback model doesn't match new catalog columns | UI renders with wrong field mapping |
| Cache staleness | Owner saves then immediately views as viewer | 60s window with stale data — owner mode bypasses cache |
| `category` in legacy DAL | `features/vport/dal/readVportServiceCatalogByType.dal.js` selects `category` | Column does not exist — returns null or throws |

---

## 11 Debug Notes

- `readVportServiceCatalogByType.js` uses `vportSchema` (the vport-scoped Supabase client) — not the default client.
- If catalog returns empty, check `vport.service_catalog` rows for the given `category_key`.
- If merge produces wrong services, trace `resolveVportServicesFromCatalog` — verify `actorByKey` map keys match catalog `.key` values.
- Cache is on the controller level (not DAL) — force-clear with `invalidateVportServices()`.

---

## 12 Files Map

| File | Responsibility |
|------|---------------|
| `dal/services/readVportServiceCatalogByType.js` | Primary catalog DAL — correct columns, no id |
| `features/vport/dal/readVportServiceCatalogByType.dal.js` | Legacy catalog DAL — selects `category` (stale) |
| `model/services/vportService.model.js` | Row mappers for catalog rows, actor rows, add-ons, merge |
| `model/services/vportServiceCatalogFallback.model.js` | Static fallback rows for exchange type |
| `controller/services/getVportServices.controller.js` | Read path with cache |
| `controller/services/upsertVportServices.controller.js` | Write path with catalog key validation |
| `features/vport/controller/getVportServiceCatalog.controller.js` | Legacy read controller using legacy DAL |

---

## Audit References

Latest Engine Audit: None (app-level feature, no engine audit required)

---

## 13 Change Log

### 2026-04-16

Task: Fix `column service_catalog.id does not exist` runtime error

Code Status Before:
`readVportServiceCatalogByType.js` selected `id,category_key,key,...` — `id` does not exist on `vport.service_catalog` (composite PK table). Controllers receiving these rows did not use `.id` so no downstream breakage.

Summary:
- Removed `id,` from `.select()` in `readVportServiceCatalogByType.js`
- Updated stale comment in `vportServiceCatalogFallback.model.js` (`vc.vport_service_catalog` → `vport.service_catalog`)

Files Changed:
- apps/VCSM/src/features/profiles/kinds/vport/dal/services/readVportServiceCatalogByType.js
- apps/VCSM/src/features/profiles/kinds/vport/model/services/vportServiceCatalogFallback.model.js

Validation:
Downstream consumers (`getVportServicesController`, `upsertVportServicesController`) confirmed to not reference `.id` on catalog rows. Fix is safe.

Follow-up risk noted:
`features/vport/dal/readVportServiceCatalogByType.dal.js` selects `category` which also does not exist in `vport.service_catalog`. Not causing the reported error but is a latent risk. Recommend fixing in a follow-up.
