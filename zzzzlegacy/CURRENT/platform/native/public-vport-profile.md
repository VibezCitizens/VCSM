# Module: Public VPORT profile

## Deep Audit Reference

Full VPort type classification, all 12 tab presets, resolution algorithm, data contracts per tab, Swift constants, and native implementation guide:
```
native-transfer/modules/vport-types-tabs-deep-audit.md
```

---

## PWA Source of Truth

**Routes:** `/profile/:slug`, `/u/:username`, `/m/:actorId`, `/vport/:slug/menu`, `/vport/:slug/reviews`, `/vport/:slug/card`

**Screens/components:**
- `apps/VCSM/src/features/profiles/kinds/vport/*`
- `apps/VCSM/src/features/public/vportMenu/*`
- `apps/VCSM/src/features/public/vportBusinessCard/*`

**Services/DAL:**
- `apps/VCSM/src/features/profiles/dal/resolveActorSlug.dal.js`
- `apps/VCSM/src/features/public/vportMenu/dal/*`
- `apps/VCSM/src/features/vport/dal/*`

**Supabase schema/tables/RPCs:**
- `vport.profiles`
- `vport.profile_public_details`
- `vport.public_menu_read_model_v`
- `reviews` public views
- `vc.actors`

**RLS expectations:** Public profile/menu reads must use public views or public-safe queries; owner-only tables must not be queried anonymously unless wrapped by public views/RPCs.

**Current PWA status:** Source of truth for slug resolution, profile sections, menu/reviews/business-card public surfaces.

---

## Native Transfer Status

**Status:** `Partial`

---

## Transferred Native Files

- `VCSMNativeApp/Features/Profile/*`
- `VCSMNativeApp/Features/PublicMenu/*`
- `VCSMNativeApp/Features/PublicMenu/VPortPublicCardScreen.swift`
- `VCSMNativeApp/Navigation/AppRouteParser.swift`
- `VCSMNativeApp/App/AppRootView.swift`
- `VCSMNativeCore/Sources/VCSMNativeCore/NativeAppRoute.swift`

---

## Native Behavior Currently Present

- Native profile, handle resolution, VPORT profile tabs, public menu, public reviews, public flyer, and booking tabs exist.
- Native `AppRouteParser` documents canonical `/profile/:slug` and `/profile/:slug/reviews` handling.
- `/vport/:slug/card` and `/vport/:actorId/card` now route to a dedicated `VPortPublicCardScreen` with `ActorGuardedRouteScreen` block checking.
- Business card reuses `PublicFlyerStore` / `LoadPublicFlyerController` for data (name, avatar, contact info, hours, logo, accent color).
- Card layout: banner header with avatar, contact action buttons (Call / Directions / Website / Book), contact info rows, hours section, menu link.

---

## Native Gaps

- Public anonymous access assumptions for each VPORT surface not verified.
- Content and Team tabs exist in PWA but are disabled via feature flags — not present in native (no action needed until PWA enables them).

---

## Risk Notes

- Slug resolution must use `vport.profiles`/public-safe sources, not legacy `vc.vports`.
- `VPortPublicCardScreen` uses `ActorGuardedRouteScreen` for block checking — same pattern as other public screens.

---

## Pending Transfer Checklist

- [x] Implement native public business-card route — `VPortPublicCardScreen.swift` created, route wired in `NativeAppRoute` and `AppNavigationView`.
- [ ] Verify slug resolution uses `vport.profiles`/public-safe sources (not legacy `vc.vports`).
- [x] Compared public VPORT profile tabs to PWA — at parity for launch. Only Content (disabled) and Team (disabled) tabs differ.
- [ ] Test anonymous/public menu and reviews reads if native exposes unauthenticated entry.
- [ ] Runtime test business card screen with real VPORT data.

---

## PWA → Native Transfer Log

### 2026-05-03 — Business card screen implemented

- Date: 2026-05-03
- Change type: Feature / UI
- PWA files changed: none
- Routes affected: `/vport/:slug/card`, `/vport/:actorId/card`
- Screens/components changed: `VPortPublicCardScreen.swift` (new), `AppNavigationView.swift` (destination + URL routing), `AppRouteParser.swift` (card case added)
- Services/DAL changed: none — reuses existing `PublicFlyerStore` / `LoadPublicFlyerController`
- Behavior change: `/vport/:slug/card` now renders a dedicated business card screen instead of redirecting to public menu
- Supabase schema/RPC change: none — reads through existing `PublicFlyerDetails` path
- RLS expectations changed: no — public-safe read path
- Affected native modules: Public VPORT profile
- Priority: P1
- Native status: Partial — business card implemented, tab parity and anonymous access still unverified
- Testing notes: Build-verified via Xcode diagnostics. Runtime test pending.
- Notes: Card uses `ActorGuardedRouteScreen` for block checking (same pattern as public menu/flyer/reviews). Data reuse from `PublicFlyerStore` avoids new DAL. `NativeAppRoute.publicCard(actorID:)` added.

---

## Transfer History

- Last synced date: 2026-05-03
- Native files updated: `VPortPublicCardScreen.swift` (new), `AppNavigationView.swift`, `AppRouteParser.swift`, `NativeAppRoute.swift`
- Delta status: Partial — business card implemented; tab parity and anonymous access still unverified
- Notes: Business card screen created and routed. Reuses existing public flyer data path. Placeholder redirect removed.

---

## Archived Notes

No archived notes yet.
