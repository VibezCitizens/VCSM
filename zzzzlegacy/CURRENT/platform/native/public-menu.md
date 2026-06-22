# Module: Public menu

## PWA Source of Truth

**Routes:** `/vport/:slug/menu`, `/profile/:slug/menu`

**Screens/components:**
- `apps/VCSM/src/features/public/vportMenu/*`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/*`

**Services/DAL:**
- `apps/VCSM/src/features/public/vportMenu/dal/readVportPublicMenu.rpc.dal.js`
- `apps/VCSM/src/features/public/vportMenu/dal/resolveMenuSlug.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/*`

**Supabase schema/tables/RPCs:**
- `vport.public_menu_read_model_v`
- `vport.menu_*`
- `vc.vport_actor_menu_*` (legacy/native model names — verify these are aliases)

**RLS expectations:** Public menu reads must use anon-safe public views/RPCs; owner menu edits must be authenticated owner-only.

**Current PWA status:** Source of truth for public menu view, category/item shapes, directions/address helpers, menu media.

---

## Native Transfer Status

**Status:** `Partial`

---

## Transferred Native Files

- `VCSMNativeApp/Features/PublicMenu/DAL/PublicMenuReads.dal.swift`
- `VCSMNativeApp/Features/PublicMenu/Screens/VPortPublicMenuScreen.swift`
- `VCSMNativeApp/Features/PublicMenu/Screens/VPortPublicMenuViewScreen.swift`
- `VCSMNativeApp/Features/PublicMenu/Components/*`
- `VCSMNativeApp/Features/Profile/Screens/VPortMenuEditorScreen.swift`

---

## Native Behavior Currently Present

- Native public menu screen, QR screen, public menu DAL, components, and owner menu editor exist.
- Native `PublicMenuReads` now uses `vport.public_menu_read_model_v` (migrated from `vc_public.vport_menu_public` / `vc_public.vports_public` on 2026-05-04).
- Column names aligned to PWA: `menu_category_*` and `menu_item_*` prefixes, `profile_*` profile columns.
- New fields available: `email_public`, `hours`, `booking_url`.
- Legacy URL fields (`directions_url`, `maps_url`, etc.) no longer fetched — mapper fallback logic generates from lat/lng/address/social_links.

---

## Native Gaps

- Slug-based public menu resolution and owner edit/publish state parity not verified.
- Runtime testing of empty menu, menu with media, address/directions, QR sharing still needed.

---

## Risk Notes

- `PublicMenuReads.dal.swift` now uses `vport.public_menu_read_model_v` — aligned with PWA.
- `primary_media_url` is not selected from the new view (column doesn't exist); mapper falls back to `image_url` only.
- Directions URL fields (`directions_url`, `maps_url`, etc.) no longer come from DB; mapper generates from lat/lng/address/social_links.

---

## Pending Transfer Checklist

- [x] Compare PWA public menu DTO to native `PublicMenuContent` model field by field — column names aligned 2026-05-04.
- [x] Switch from `vc_public` views to `vport.public_menu_read_model_v` — migrated 2026-05-04.
- [ ] Test empty menu, menu with media, address/directions, QR sharing.
- [ ] Verify slug-based menu resolution and owner edit/publish state parity.

---

## PWA → Native Transfer Log

- Date:
- Change type: Feature / Fix / Schema / UI / RLS
- PWA files changed:
- Routes affected:
- Screens/components changed:
- Services/DAL changed:
- Behavior change:
- Supabase schema/RPC change:
- RLS expectations changed:
- Affected native modules:
- Priority: P0 / P1 / P2
- Native status: Not started / Partial / Risky / Complete
- Testing notes:
- Notes:

---

## Transfer History

- Last synced date: 2026-05-04
- Native files updated: `PublicMenuReads.dal.swift` — migrated from `vc_public` to `vport.public_menu_read_model_v`
- Delta status: Partial — view contract aligned; slug resolution and runtime testing remain
- Notes: Menu items now use `menu_category_*`/`menu_item_*` column names. Profile details now use `profile_*` prefix. Added `email_public`, `hours`, `booking_url` fields. Legacy URL fields (`directions_url`, etc.) removed from DB query — mapper generates from lat/lng/address/social_links fallback.

### Previous entries

- Synced: 2026-05-03
- Delta: Partial — vc_public vs vport view contract unconfirmed
- Notes: Initial tracker from ROADTRIP.docx May 3 refresh

---

## Archived Notes

No archived notes yet.
