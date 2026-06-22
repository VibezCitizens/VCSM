# VPORT Services — Architecture & Security

**Application Scope:** VCSM  
**Feature Area:** VPORT Profile — Services Tab  
**Last Updated:** 2026-05-23  
**Security Audit:** VENOM `2026-05-23_venom_vport-services-dashboard-card.md`  
**DB Audit:** `2026-05-23_db_vport-services-rls-security-verification.md`

---

## 1. Purpose

The VPORT Services feature manages the service catalog visible on a VPORT profile page and in the booking flow. It covers:

- **Viewer path** — public display of enabled services and add-ons for any active VPORT
- **Owner path** — dashboard editor where the VPORT owner toggles, edits, and reorders services
- **Booking path** — service list fed to the quick-booking modal (`useQuickBookingModal`)

Services come from two sources merged at the controller layer:
1. `vport.service_catalog` — platform-wide reference rows for a given VPORT type (e.g. all possible barber services)
2. `vport.services` — actor-specific rows that override the catalog (enabled flag, custom label, meta)

---

## 2. Layer Map

```
DAL  →  Model  →  Controller  →  Hook  →  View Screen  →  Final Screen
```

### DAL — `dal/services/`

| File | Table(s) | Notes |
|---|---|---|
| `readVportTypeByActorId.dal.js` | `vc.actors`, `vport.profiles`, `vport.profile_categories` | Resolves vport type key from actorId |
| `readVportServiceCatalogByType.dal.js` | `vport.service_catalog` | Platform-wide reference; SELECT only |
| `readVportServicesByActor.dal.js` | `vport.profiles`, `vport.services` | resolveProfileId then services query |
| `readVportServiceAddonsByActor.dal.js` | `vport.profiles`, `vport.service_addons` | resolveProfileId then addons query |
| `upsertVportServicesByActor.dal.js` | `vport.profiles`, `vport.services` | Owner upsert; explicit column list |

### Model — `model/services/`

| File | Purpose |
|---|---|
| `vportService.model.js` | Maps DB rows → domain shape; groups addons by parent; merges catalog + actor rows |
| `vportServiceCatalogFallback.model.js` | Returns hardcoded fallback catalog if DB returns empty (handles offline / cold-start) |

### Controllers — `controller/services/`

| File | Purpose | Auth Gate |
|---|---|---|
| `getVportServices.controller.js` | Read — merges catalog + actor services | `asOwner=true` requires `callerActorId` + ownership assertion |
| `upsertVportServices.controller.js` | Write — bulk upsert + locksmith provisioning | Always asserts ownership before write |
| `createOrUpdateVportServiceAddon.controller.js` | Write — single addon upsert | Asserts ownership |
| `deleteVportServiceAddon.controller.js` | Write — single addon delete | Asserts ownership |
| `reorderVportServiceAddon.controller.js` | Write — addon sort order update | Asserts ownership |

### Hooks — `hooks/services/`

| File | Controller used | Mode |
|---|---|---|
| `useVportServices.js` | `getVportServicesController` | Read; passes `callerActorId` from identity |
| `useUpsertVportServices.js` | `upsertVportServicesController` | Write |
| `useCreateOrUpdateVportServiceAddon.js` | `createOrUpdateVportServiceAddonController` | Write |
| `useDeleteVportServiceAddon.js` | `deleteVportServiceAddonController` | Write |
| `useReorderVportServiceAddon.js` | `reorderVportServiceAddonController` | Write |

### Screens / Components — `screens/services/`

| File | Role |
|---|---|
| `view/VportServicesView.jsx` | View Screen — hooks + component composition only; no ownership logic |
| `components/VportServicesPanel.jsx` | Viewer panel |
| `components/VportServicesCategorySection.jsx` | Category group for viewer |
| `components/owner/VportServicesOwnerPanel.jsx` | Owner editor panel |
| `components/owner/VportServicesOwnerCategorySection.jsx` | Category group for owner |
| `components/owner/VportServicesOwnerToolbar.jsx` | Save/revert toolbar |
| `components/VportServiceBadge.jsx` | Single service badge (shared viewer + owner) |
| `screens/services/model/vportServicesEnabledMap.model.js` | UI-layer enabled-state map (local toggle state) |

---

## 3. Read Flow — `getVportServicesController`

```
useVportServices
  → getVportServicesController({ targetActorId, vportType, asOwner, callerActorId })
      │
      ├── asOwner=true → assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId })
      │     throws if caller does not own targetActor (fails closed)
      │
      ├── readVportTypeByActorId(targetActorId)       → resolves vportType if not passed
      ├── readVportServiceCatalogByType(vportType)    → platform catalog rows
      ├── readVportServicesByActor({ actorId, includeDisabled: asOwner })
      │     asOwner=false: RLS filters to enabled=true at DB layer
      │     asOwner=true:  RLS allows owner to see all rows (inc. disabled)
      ├── readVportServiceAddonsByActor({ actorId, includeDisabled: asOwner })
      │
      └── resolveVportServicesFromCatalog(catalog, actorRows, addons)
            merges catalog + actor overrides → final service list
```

**Cache:** viewer mode (asOwner=false) caches result for 60 seconds keyed on `targetActorId:vportType`. Owner mode is never cached (null key).

---

## 4. Write Flow — `upsertVportServicesController`

```
useUpsertVportServices
  → upsertVportServicesController({ identityActorId, targetActorId, services })
      │
      ├── assertActorOwnsVportActorController({ requestActorId: identityActorId, targetActorId })
      │     always — no write proceeds without ownership confirmation
      │
      ├── map services → DB payload (enabled rows + disabled rows)
      ├── upsertVportServicesByActorDal({ actorId: targetActorId, rows: payload })
      │
      └── locksmith provisioning (Promise.allSettled — non-blocking)
            returns { ok, count, rows, provisioningWarnings? }
            provisioningWarnings present only if one or more provisions failed
```

---

## 5. Ownership Gate — Critical Rule

**`asOwner=true` MUST NOT be trusted from the UI layer alone.**

The controller enforces server-side ownership for both read and write paths:
- Read: `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId })` before returning disabled services
- Write: same assertion before any upsert

`assertActorOwnsVportActorController` resolves via `actor_owners` in the DB — it is not a simple equality check. A caller who sends `asOwner=true` with a `callerActorId` they don't own will throw before any data is returned.

**`VportServicesView` does NOT compute ownership.** The `allowOwnerEditing` prop flows from the dashboard screen (`VportDashboardServicesScreen`) which gates it behind `useVportOwnership` — a DB-backed check. The view is presentational only.

---

## 6. RLS Architecture

### Tables and Policies (post-migration `20260523220000`)

#### `vport.services`

| Policy | Role | Condition |
|---|---|---|
| `services_select_viewer` | authenticated | `enabled = true AND EXISTS (active, non-deleted profile)` |
| `services_select_owner` | authenticated | `actor_can_manage_profile(current_actor_id(), profile_id)` |
| `services_insert_managed` | authenticated | WITH CHECK `actor_can_manage_profile(...)` |
| `services_update_managed` | authenticated | USING + WITH CHECK `actor_can_manage_profile(...)` |
| `services_delete_managed` | authenticated | USING `actor_can_manage_profile(...)` |

#### `vport.service_catalog`

| Policy | Role | Condition |
|---|---|---|
| `service_catalog_select_active` | PUBLIC (anon + authenticated) | `is_active = true` |

Write access: REVOKED from authenticated. Catalog is migration-only.

#### `vport.service_addons`

| Policy | Role | Condition |
|---|---|---|
| `service_addons_select_viewer` | authenticated | `enabled = true AND EXISTS (active, non-deleted profile)` |
| `service_addons_select_owner` | authenticated | `actor_can_manage_profile(...)` |
| `service_addons_insert_managed` | authenticated | WITH CHECK `actor_can_manage_profile(...)` |
| `service_addons_update_managed` | authenticated | USING + WITH CHECK `actor_can_manage_profile(...)` |
| `service_addons_delete_managed` | authenticated | USING `actor_can_manage_profile(...)` |

### PERMISSIVE Dual-SELECT Pattern

Both `vport.services` and `vport.service_addons` use PostgreSQL PERMISSIVE OR logic across two SELECT policies:

```
viewer policy:  USING (enabled=true AND EXISTS(active profile))
owner policy:   USING (actor_can_manage_profile(...))

Non-owner + enabled row:    viewer=PASS, owner=FAIL → visible ✓
Non-owner + disabled row:   viewer=FAIL, owner=FAIL → hidden ✓  ← DB-SVC-001 fix
Owner + disabled row:       viewer=FAIL, owner=PASS → visible ✓
Owner + enabled row:        viewer=PASS, owner=PASS → visible ✓
Anon caller:                no SELECT grant on services → blocked ✓
```

### Why the Viewer Policies Use EXISTS, Not `actor_can_view_profile()`

`actor_can_view_profile()` is documented (20260503040334) to return false for non-team-member visitors in certain contexts. The inline EXISTS subquery is the canonical viewer pattern established in that migration. It avoids any function-call overhead per row and is immune to the function being changed.

`profiles_select_viewer` also uses a direct predicate (`is_active = true AND is_deleted = false`) rather than calling any function on the profiles table itself — to eliminate any risk of circular evaluation.

### Ownership Check Functions

Both `actor_can_manage_profile` overloads are `SECURITY DEFINER`. This is required: the function reads from `profile_actor_access` and `actor_owners` internally. SECURITY DEFINER lets it do that without being blocked by those tables' own RLS. The actual authorization check uses `auth.uid()` from the caller's JWT — the DEFINER context only affects the internal ownership-table reads, not the identity used for the check.

`actor_can_manage_profile(p_actor_id, p_profile_id)` — the two-arg form called by all RLS policies — ignores `p_actor_id` entirely. It delegates to the single-arg form which uses `auth.uid()` directly.

---

## 7. Known Gaps / Pending

| Item | Status | Migration |
|---|---|---|
| `actor_can_manage_profile` legacy `owner_user_id` branch | Pre-flight confirmed SAFE (0 stranded owners). Migration pending. | `20260523230000_remove_actor_can_manage_profile_legacy_branch.sql` |
| Triple inline `resolveProfileId` in three DAL files | ✅ Fixed — extracted to `resolveVportProfileId.dal.js` with 30s TTL cache; all three DALs import from it | `dal/services/resolveVportProfileId.dal.js` |

---

## 8. Cross-Feature Consumers

| Consumer | File | Mode | Notes |
|---|---|---|---|
| Quick booking modal | `features/dashboard/vport/hooks/useQuickBookingModal.js` | Viewer (`asOwner=false`) | Filters to `s.id` present (bookable only) |
| Services dashboard screen | `features/dashboard/vport/screens/VportDashboardServicesScreen.jsx` | Owner | Passes `allowOwnerEditing` from `useVportOwnership` |
| Profile services tab | VPORT profile route | Viewer | Standard viewer path |

---

## 9. Files Index

```
features/profiles/kinds/vport/
  dal/services/
    readVportTypeByActorId.dal.js
    readVportServiceCatalogByType.dal.js
    readVportServicesByActor.dal.js
    readVportServiceAddonsByActor.dal.js
    upsertVportServicesByActor.dal.js
  model/services/
    vportService.model.js
    vportServiceCatalogFallback.model.js
  controller/services/
    getVportServices.controller.js
    upsertVportServices.controller.js
    createOrUpdateVportServiceAddon.controller.js
    deleteVportServiceAddon.controller.js
    reorderVportServiceAddon.controller.js
  hooks/services/
    useVportServices.js
    useUpsertVportServices.js
    useCreateOrUpdateVportServiceAddon.js
    useDeleteVportServiceAddon.js
    useReorderVportServiceAddon.js
  screens/services/
    view/VportServicesView.jsx
    model/vportServicesEnabledMap.model.js
    components/
      VportServiceBadge.jsx
      VportServicesCategorySection.jsx
      VportServicesPanel.jsx
      VportServicesEmptyState.jsx
      VportServicesHeader.jsx
      VportServicesSkeleton.jsx
      owner/
        VportServicesOwnerPanel.jsx
        VportServicesOwnerCategorySection.jsx
        VportServicesOwnerToolbar.jsx

features/dashboard/vport/
  hooks/useQuickBookingModal.js     ← cross-feature consumer (viewer mode)
```

---

## 10. Related Documents

- `vcsm.vport.service-catalog.md` — service_catalog table architecture  
- `vcsm.vport.kinds-architecture-map.md` — VPORT type system  
- VENOM audit: `CURRENT/features/dashboard/evidence/2026-05-23_venom_vport-services-dashboard-card.md`  
- DB audit: `_HISTORY/db/snapshots/2026-05-23_db_vport-services-rls-security-verification.md`  
- Migration: `apps/VCSM/supabase/migrations/20260523220000_vport_services_rls_security_fixes.sql`
