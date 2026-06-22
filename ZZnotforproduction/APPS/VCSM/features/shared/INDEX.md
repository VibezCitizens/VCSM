---
name: vcsm.shared.index
description: VCSM shared feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / shared

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-06 (targeted: bottom-nav)
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 0 | None — shared layer has no controllers by design |
| DAL files | 0 | None — shared layer performs no database access |
| Hooks | 9 | useOneSignalPush, useDesktopBreakpoint, useUserLocation, useIOSKeyboardLock, plus hooks/index.js barrel |
| Models | 0 | None |
| Screens | 0 | None |
| Components | 35 | BottomNavBar, TopNav, ActorLink, PublicNavbar, PublicNavbarMobileMenu, PageContainer, PullToRefresh, Skeleton, Spinner, ConversationSignalIcon, publicNavbarComponents, ActorActionsMenu, BackHeader, Backbutton, NewBadge, Tabs, Toast |
| Adapters | 0 | None |
| Barrels | 1 | shared/index.js (auto-generated) |
| Tests | 0 | No tests — confirmed by scanner |
| Routes | 0 | No routes — shared layer has no route entries |
| Total source files | 42 | Confirmed by scanner feature-map |

## Write Surface Map

No write surfaces detected by scanner.

The shared layer contains no DAL files and makes no direct Supabase mutations. All database access is delegated to feature DAL layers or engine layers.

Note: `useUserLocation` calls a Supabase Edge Function (`reverse-geocode`) for geolocation resolution — this is a read operation via authenticated fetch, not a database write surface.

## Security-Sensitive Surfaces

No high-sensitivity write surfaces in static scan.

Security notes from source review:
- `useUserLocation` calls edge function with auth token from `readSupabaseAccessToken()` — token handling should be verified (VENOM concern).
- `useOneSignalPush` calls `loginOneSignalExternalUser(user.id)` — uses Supabase auth user ID (stable across actor switches), not actorId. This is intentional and documented in source comments.
- `shared/utils/resolveRealm.js` exports `PUBLIC_REALM_ID` and `resolveRealm()` — these are env-var backed with hardcoded fallbacks for dev. No mutation risk.
- `shared/lib/qrUrlBuilders.js` exports `isQrSafeSlug()` — enforces the no-raw-UUID-in-URL contract (VENOM V-006). This is a security guard, not a vulnerability.

## Engine Dependencies

- identity (confirmed — useOneSignalPush, BottomNavBar import identity adapter)
- profile (confirmed — BottomNavBar imports getCachedActorCanonicalSlug from profiles)
- menu (declared by scanner; not directly confirmed in files read)

## Routes

No routes in route-map for this feature.

The shared layer exports layout shell components (BottomNavBar, TopNav) that are mounted at the app root, but these are not route entries — they are persistent shell components rendered outside the router outlet.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (stub — Status: PLACEHOLDER, no content) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
