# TRAZE — Provider Taxonomy Naming Contract

**Scope:** apps/Traffic (TRAZE) + vport schema (VCSM Supabase)
**Status:** DRAFT — Slice 2 (DB views) and Slice 3 (Traffic mapper) pending approval
**Last Updated:** 2026-05-04

---

## Purpose

Defines the one canonical taxonomy model shared between VCSM (VPort) and TRAZE (Traffic).

This contract resolves naming inconsistencies found across `vport.*` tables, TRAZE DALs,
mappers, repositories, and UI labels. It is the authoritative reference for any code that
touches provider classification, service grouping, or directory routing.

---

## 1. Canonical Taxonomy Levels

There are exactly four levels. Each has one canonical name. No synonyms are permitted.

### Level 1 — Category

**Canonical name:** `category` / `category_key`

The broadest marketplace group. Used for top-level directory navigation and homepage grids.
A category groups multiple services that belong to the same market domain.

| Example `category_key` | `category_label` |
|---|---|
| `beauty` | Beauty & Grooming |
| `automotive` | Automotive |
| `home_services` | Home Services |
| `food` | Food & Dining |
| `finance` | Finance & Exchange |
| `transportation` | Transportation |

**Source of truth:** `vport.categories.group_key` (column to be added — see Open Questions)

**Rules:**
- Always written as `category_key` in DB columns and DAL selects.
- Always written as `categoryKey` in JavaScript objects.
- Never used to mean a service type (barber, locksmith). That is Level 2.
- Never aliased as `type`, `business_type`, or `service_group`.

---

### Level 2 — Service

**Canonical name:** `service` / `service_key`

A searchable customer intent. Represents what a provider does and what a customer searches for.
One service belongs to exactly one category.

| Example `service_key` | `service_label` | `category_key` |
|---|---|---|
| `barber` | Barber | `beauty` |
| `nail_salon` | Nail Salon | `beauty` |
| `locksmith` | Locksmith | `home_services` |
| `gas_station` | Gas Station | `automotive` |
| `money_exchange` | Money Exchange | `finance` |
| `restaurant` | Restaurant | `food` |

**Source of truth:** `vport.categories.key` (existing column — current table is correctly named
`categories` but its values are at the service level; canonical name for these values is `service_key`)

**Rules:**
- Always written as `service_key` in DB views and DAL selects that face TRAZE.
- Always written as `serviceKey` in JavaScript objects.
- Internally in VCSM, `vport.categories.key` retains its column name; views expose it as `service_key`.
- Never aliased as `category_key` in TRAZE-facing code. This was the primary source of confusion.
- `profile_categories.category_key` is the internal FK column; in views it must be aliased as `service_key`.

---

### Level 3 — Business Type

**Canonical name:** `business_type`

What kind of entity or profile this is. Describes the operational structure of the provider,
not what they sell. Two providers can share the same service but have different business types.

| Example `business_type` | Meaning |
|---|---|
| `solo_provider` | One person, no location, mobile or by appointment |
| `shop` | Physical location with staff |
| `restaurant` | Food service establishment |
| `exchange_office` | Currency / financial services counter |
| `transit_agency` | Scheduled transport operator |
| `gas_station` | Fuel / energy station |

**Source of truth:** Currently partial. `vport.organizations.organization_type` stores
`'business' | 'solo' | 'brand'` — this is a structural type, not a domain-specific business type.
A derived `business_type` will be computed in views using a CASE expression on `service_key`
and `organization_type` until a dedicated column is added. (See Open Questions.)

**Rules:**
- Always written as `business_type` everywhere — in DB views, DAL selects, and JS objects.
- Never aliased as `type` alone.
- Never aliased as `category_key`, `service_key`, or `service_group`.
- In UI: label is "Business type". Never show "type" alone in any form.

---

### Level 4 — Specialty

**Canonical name:** `specialty` / `specialty_key`

A narrow variant of a service. Represents a specific offering within a service type.
Optional — not all services have specialties.

| Example `specialty_key` | `specialty_label` | `service_key` |
|---|---|---|
| `fade` | Fade | `barber` |
| `beard_trim` | Beard Trim | `barber` |
| `car_lockout` | Car Lockout | `locksmith` |
| `house_lockout` | House Lockout | `locksmith` |
| `usd_to_mxn` | USD → MXN | `money_exchange` |

**Source of truth:** `vport.service_catalog.key` (existing column)

**Rules:**
- Always written as `specialty_key` in TRAZE-facing DB views and DAL selects.
- Always written as `specialtyKey` in JavaScript objects.
- Internally in VCSM, `vport.service_catalog.key` retains its column name; views expose it as `specialty_key`.
- Specialty grouping display labels are stored in `vport.service_catalog.service_group`
  and `vport.services.service_group`. In TRAZE-facing views, this column is aliased as `specialty_group`.
- `specialtyId` (UUID) is used in Traffic routing — this is an object-level ID, not the same as `specialty_key`.

---

## 2. Banned Aliases

The following usages are explicitly forbidden in TRAZE-facing code, views, and UI labels.

| Banned usage | Reason | Correct replacement |
|---|---|---|
| `type` alone | Ambiguous — could mean any level | Use `business_type`, `service_key`, or `specialty_key` |
| `category` to mean service | Conflates Level 1 and Level 2 | Use `service_key` for barber/locksmith |
| `category_key` to mean service | VCSM internal naming leaking into TRAZE views | Views must alias as `service_key` |
| `service_group` in TRAZE | Duplicates category at wrong level | Alias as `specialty_group` in all TRAZE-facing code |
| `primary_service_id` | Ambiguous — ID vs key unclear | Use `primary_service_key` for key, `primary_service_id` only for UUID |
| `profile_categories` exposed directly | Internal junction table | Always consume via canonical views |
| `service_catalog` exposed directly | Internal master table | Always consume via canonical views |
| `vportType` as JS output field | VCSM-internal label | Use `serviceKey` in any TRAZE-facing mapper output |

---

## 3. Current Schema → Canonical Mapping

### vport.categories

| Column | Current meaning | Canonical meaning | Action required |
|---|---|---|---|
| `key` | Service identifier (barber, locksmith) | `service_key` | Alias in views — do not rename column |
| `label` | Service display name | `service_label` | Alias in views |
| `description` | Service description | `service_description` | Alias in views |
| `is_active` | Active flag | `is_active` | No change |
| `sort_order` | Display order | `sort_order` | No change |
| *(missing)* | Broad group key | `category_key` | **Add `group_key` column** (Slice 2) |
| *(missing)* | Broad group label | `category_label` | **Add `group_label` column** (Slice 2) |

### vport.profile_categories

| Column | Current meaning | Canonical meaning | Action required |
|---|---|---|---|
| `profile_id` | Profile FK | `profile_id` | No change |
| `category_key` | FK → categories.key = service key | `service_key` | Alias in views |
| `is_primary` | Is primary service type | `is_primary` | No change |

### vport.service_catalog

| Column | Current meaning | Canonical meaning | Action required |
|---|---|---|---|
| `category_key` | FK → categories.key = service key | `service_key` (parent) | Alias in views |
| `key` | Specific offering within service type | `specialty_key` | Alias in views |
| `label` | Specialty display name | `specialty_label` | Alias in views |
| `description` | Specialty description | `specialty_description` | Alias in views |
| `service_group` | Display grouping label | `specialty_group` | Alias in views; rename in TRAZE mapper |
| `is_active` | Active flag | `is_active` | No change |
| `sort_order` | Display order | `sort_order` | No change |

### vport.services (per-profile)

| Column | Current meaning | Canonical meaning | Action required |
|---|---|---|---|
| `key` | Service offering key | `specialty_key` | Alias in views |
| `label` | Display name | `specialty_label` | Alias in views |
| `service_group` | Display grouping | `specialty_group` | Alias in views; rename in TRAZE mapper |
| `profile_id` | Profile FK | `profile_id` | No change |

### vport.organizations

| Column | Current meaning | Canonical meaning | Action required |
|---|---|---|---|
| `organization_type` | 'business' \| 'solo' \| 'brand' | Partial `business_type` source | CASE-derive `business_type` in views |

### Traffic — TRAZE DAL / Mapper fields

| Current field | Location | Canonical replacement | Action required |
|---|---|---|---|
| `service_group` in `SERVICES_SELECT` | `trazeCategories.read.dal.js` | `specialty_group` | Rename in Slice 3 |
| `serviceGroup` in repo output | `category.repo.js` | `specialtyGroup` | Rename in Slice 3 |
| `vportType` in mapper output | `vportServiceCatalog.model.js` | Internal only — do not expose in TRAZE | No TRAZE change needed |
| `category` (content type) | `content_pages.category`, `publicContent.connector.js` | **Keep as-is** — this is a content type enum, not taxonomy | No change |
| `category` (display label derived from service_group) | `vportServiceCatalog.model.js` | `specialtyGroup` internally | Internal rename only |

---

## 4. Canonical Provider Taxonomy Object

This is the canonical shape of a provider's full taxonomy — the contract for any object
that represents a provider's classification in TRAZE.

```js
{
  providerId: string,          // vport profile UUID
  businessType: string,        // "solo_provider" | "shop" | "restaurant" | ...
  categoryKey: string,         // "beauty" | "automotive" | "home_services" | ...
  categoryLabel: string,       // "Beauty & Grooming" | "Automotive" | ...
  primaryServiceKey: string,   // "barber" | "locksmith" | "gas_station" | ...
  primaryServiceLabel: string, // "Barber" | "Locksmith" | ...
  services: [
    {
      serviceKey: string,        // "barber"
      serviceLabel: string,      // "Barber"
      categoryKey: string,       // "beauty"
      specialties: [
        {
          specialtyKey: string,    // "fade"
          specialtyLabel: string,  // "Fade"
          specialtyGroup: string,  // "Cuts"
        }
      ]
    }
  ]
}
```

**Notes:**
- `specialties` may be an empty array. It is never null or omitted.
- `businessType` is derived — not directly stored as a single column in any current table.
- `categoryKey` is the broad group (beauty/automotive), NOT the service key (barber/locksmith).
  This is the distinction that was previously inconsistent across the codebase.

---

## 5. UI Form Labels

These are the exact labels to use in any TRAZE-facing form or dashboard:

| Canonical concept | UI label | Never use |
|---|---|---|
| `category_key` | **Category** | "Type", "Group", "Sector" |
| `service_key` | **Service** | "Category", "Type", "business_type" |
| `business_type` | **Business type** | "Type" alone, "Profile type" |
| `specialty_key` | **Specialty** | "Sub-service", "Variant", "service_group" |

---

## 6. Source of Truth

- **VCSM is source of truth.** All taxonomy data originates in VCSM Supabase.
- **TRAZE consumes canonical views only.** Traffic must never read internal VCSM tables directly.
- **Canonical views are the translation layer.** They alias internal column names to the names
  defined in this contract. VCSM source code does not need to be changed.
- **`vport.public_traze_*` views** are the only public surface TRAZE reads from.

---

## 7. Open Questions — Required Before Slice 2

The following must be resolved before any DB schema change or view creation can be approved.

### Q1 — Where does the broad category level (beauty/automotive) live?

**Problem:** `vport.categories` stores service-level keys (barber, locksmith). No column or table
currently holds the broad category group (beauty, automotive, home_services).

**Options:**
- **Option A:** Add `group_key text` and `group_label text` columns to `vport.categories`.
  Backward-compatible. Existing rows get NULL until a seed migration runs.
- **Option B:** Create a new `vport.category_groups` table (key, label, sort_order) and
  add a `group_key FK` column to `vport.categories`.
  Cleaner long-term. Requires more migration work and FK enforcement.
- **Option C:** Hardcode the grouping in a view via a CASE expression on `categories.key`.
  No schema change. Fragile — breaks when new service types are added without updating the view.

**Decision needed from:** product/architecture owner.
**Recommendation:** Option A — minimal schema change, backward-compatible, seedable.

---

### Q2 — What is the full `business_type` value set?

**Problem:** `vport.organizations.organization_type` only offers `'business' | 'solo' | 'brand'`.
The canonical contract requires more specific values: solo_provider, shop, restaurant,
exchange_office, transit_agency, gas_station.

**Options:**
- **Option A:** Derive `business_type` in views via a CASE on `service_key` (e.g., if service_key
  = 'gas_station' then business_type = 'gas_station'). Simple but tightly couples taxonomy to entity type.
- **Option B:** Add a `business_type text` column to `vport.profiles` with a constrained value set.
  Decouples entity type from service type. Requires migration and VCSM form update.
- **Option C:** Add `business_type` to `vport.categories` (one per service type, e.g., barber → solo_provider or shop).
  Allows per-category defaults with per-profile overrides possible later.

**Decision needed from:** product/architecture owner.
**Recommendation:** Option A short-term (view-only, no schema change), Option B long-term.

---

### Q3 — Does `vport.public_traze_categories_v` currently expose service-level or category-level keys?

**Problem:** The view exists but its SQL definition was not included in the schema dump.
If it currently exposes `categories.key` = "barber" as the `category_key`, updating it
to expose the broad group key (beauty/automotive) is a breaking change for any live consumer.

**Required:** Read the current `CREATE VIEW` SQL for `vport.public_traze_categories_v`
before Slice 2 begins.

---

### Q4 — Is `public_traze_catalog_services_v` safe to create fresh?

**Problem:** The view does not exist. Traffic's `trazeCategories.read.dal.js` already points to it.
Before creating it, confirm no other code references a view by this name that would conflict.

**Required:** Grep all apps and engines for `public_traze_catalog_services_v` to confirm no conflicts.

---

## Change Log

| Date | Author | Change |
|---|---|---|
| 2026-05-04 | WOLVERINE / Slice 1 | Initial draft — canonical definitions, mapping table, open questions |
