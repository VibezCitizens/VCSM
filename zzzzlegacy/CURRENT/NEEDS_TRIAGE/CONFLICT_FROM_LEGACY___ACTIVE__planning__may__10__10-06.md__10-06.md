# Planning — May / 10 / Sequence 06

## Task: VPORT System Post Hardening — resolvePublicRealmIdDAL + Logan Docs Sync (Slices 1–4)

**Source:** ARCHITECT audit `2026-05-10_architect_feed-engine-vport-menu-gas-posts.md` — Gap 1 (hardcoded PUBLIC_REALM_ID) + Gap 4 (Logan docs)
**Scope: VCSM**
**Task Class: IMPLEMENTATION + DOCUMENTATION**

---

## Execution Plan

PLAN PROPOSAL
Task: Remove hardcoded PUBLIC_REALM_ID UUID from VPORT system post controllers; introduce resolvePublicRealmIdDAL; void-realm-safe; sync Logan docs
Application Scope: VCSM
Task Class: IMPLEMENTATION + DOCUMENTATION
Estimated Time: ~20 minutes
Execution Type: Split (4 slices)
Slices:
  Slice 1 — Create resolvePublicRealmIdDAL, harden gas + menu controllers
  Slice 2 — Audit PostCard/normalizeFeedRows for post_type handling (read-only check)
  Slice 3 — Audit useCentralFeed force-hydration for VPORT actors (read-only check)
  Slice 4 — Logan docs sync (gas spec, restaurant spec, menu pipeline)
Files Expected To Change:
  - apps/VCSM/src/features/feed/dal/resolvePublicRealm.dal.js (NEW)
  - apps/VCSM/src/features/profiles/kinds/vport/controller/gas/publishFuelPriceUpdateAsPost.controller.js
  - apps/VCSM/src/features/profiles/kinds/vport/controller/menu/publishMenuUpdateAsPost.controller.js
  - zNOTFORPRODUCTION/_CANONICAL/logan/vports/vcsm.vport.gas-station-profile-spec.md
  - zNOTFORPRODUCTION/_CANONICAL/logan/vports/vcsm.vport.restaurant-profile-spec.md
  - zNOTFORPRODUCTION/_CANONICAL/logan/vports/vcsm.vport.menu-pipeline.md
Specialist Commands Required: SENTRY (post-execution), LOGAN
SENTRY Review: Required
SENTRY Scope:
  - feed/dal/resolvePublicRealm.dal.js
  - controller/gas/publishFuelPriceUpdateAsPost.controller.js
  - controller/menu/publishMenuUpdateAsPost.controller.js
SENTRY Timing: Post-Execution

---

## Execution Summary

### Slice 1 — resolvePublicRealmIdDAL + Controller Hardening

**NEW FILE:** `apps/VCSM/src/features/feed/dal/resolvePublicRealm.dal.js`
- Module-scoped cache (`_cachedPublicRealmId`)
- Queries `vc.realms WHERE slug = 'public'`
- Returns null on error; caller early-exits with `{ published: false, reason: "missing_public_realm" }`
- Void-realm-safe: completely independent of viewer session

**MODIFIED:** `publishFuelPriceUpdateAsPost.controller.js`
- Removed hardcoded `PUBLIC_REALM_ID` UUID constant
- Added `resolvePublicRealmIdDAL` import and call
- Early return on null realm

**MODIFIED:** `publishMenuUpdateAsPost.controller.js`
- Same hardening pattern
- `imageUrl` param already present from prior Menu Update Feed Share task

### Slice 2 — PostCard/normalizeFeedRows Audit

**NO-OP.** `PostCard`/`PostCardView` has zero `post_type` branching — renders any post as text + optional media array. `normalizeFeedRows` lines 60-63 correctly map `media_url` → `media` array via legacy path. No changes needed.

### Slice 3 — useCentralFeed Force-Hydration Audit

**NO-OP.** `useCentralFeed.js` lines 159-164 already call `hydrateActorsByIds(vportActorsWithNoName, { force: true })` for VPORT actors with null names. No changes needed.

### Slice 4 — Logan Docs Sync

**UPDATED:** `vcsm.vport.gas-station-profile-spec.md`
- Gas Price Manager → Feed share bullet added (fuel_price_update post_type, BulkUpdateFuelPricesModal, dedup, non-blocking, resolvePublicRealmIdDAL)

**UPDATED:** `vcsm.vport.restaurant-profile-spec.md`
- Menu Manager → Feed share bullet added (menu_update post_type, item/category saves, image threading, dedup, non-blocking, resolvePublicRealmIdDAL)

**UPDATED:** `vcsm.vport.menu-pipeline.md`
- Section 13 Files Map → 3 new rows added:
  - `dal/menu/vportMenuPost.read.dal.js` — dedup + restaurant name
  - `controller/menu/publishMenuUpdateAsPost.controller.js` — menu feed post controller
  - `hooks/menu/usePublishMenuPost.js` — hook wrapper

### Context: Void Realm

Void realm is a planned future feature — 18+ anonymous-but-DB-tracked citizens, separate `realm_id` from public. `resolvePublicRealmIdDAL` ensures VPORT system posts always target the public realm regardless of which realm the viewer's session is in. Memory saved: `project_void_realm_system_posts.md`.

---

### Logan Docs Reviewed
- `vcsm.vport.gas-station-profile-spec.md`
- `vcsm.vport.restaurant-profile-spec.md`
- `vcsm.vport.menu-pipeline.md`

### Logan Docs Updated
- All three above

### Documentation Drift Status
RESOLVED — all three docs now reflect feed-share system (post_types, dedup, non-blocking, resolvePublicRealmIdDAL)

---

SENTRY Status: ALIGNED
SENTRY Reviewed Files:
  - apps/VCSM/src/features/feed/dal/resolvePublicRealm.dal.js
  - apps/VCSM/src/features/profiles/kinds/vport/controller/gas/publishFuelPriceUpdateAsPost.controller.js
  - apps/VCSM/src/features/profiles/kinds/vport/controller/menu/publishMenuUpdateAsPost.controller.js
SENTRY Follow-Up:
  - Future: if more features need resolvePublicRealmIdDAL, promote to shared/lib/realm/ — current cross-feature import (vport/controller → feed/dal) is pragmatic but noted

---

NOTE OF COMPLETITION
