# Module: RLS-compatible authenticated access

## PWA Source of Truth

**Routes:** Cross-cutting protected app routes

**Screens/components:**
- `apps/VCSM/src/app/guards/ProtectedRoute.jsx`
- `apps/VCSM/src/app/providers/AuthProvider.jsx`
- `apps/VCSM/src/app/routes/protected/app.routes.jsx`

**Services/DAL:**
- `apps/VCSM/src/services/supabase/*`
- `apps/VCSM/src/features/*/dal/*`

**Supabase schemas involved:**
- `vc`, `vport`, `reviews`, `platform`, `moderation`, `identity`, `notification` engine

**RLS expectations:**
- Protected screens must not make unauthenticated table calls.
- Actor-scoped writes must include active actor and access token.
- Public routes must use public views/RPCs.
- Safety-critical lookups must fail closed — never silently transform RLS errors into empty visibility state.

**Current PWA status:** Source of truth for which routes are public, protected, owner-only, or public-view based.

---

## Native Transfer Status

**Status:** `Risky`

---

## Transferred Native Files

- `VCSMNativeApp/App/AppRootView.swift`
- `VCSMNativeApp/App/AppNavigationView.swift`
- `VCSMNativeApp/Session/SessionStore.swift`
- `VCSMNativeApp/Services/Supabase/SupabaseClient.swift`
- `VCSMNativeApp/Services/Supabase/PostgRESTSafe.swift`

---

## Native Behavior Currently Present

- Native centralizes many PostgREST calls through `SupabaseClient` and has session-aware navigation.
- Some public surfaces use `publicRestSelect`/public views.
- P0 safety/legal paths now fail closed for feed block/follow lookup errors and legal gate resolution errors.
- P0 moderation writes now use canonical `moderation` RPC/schema paths, and VPORT delete uses `delete_my_vport` without raw table fallback.

---

## Native Gaps

- Route-by-route guard parity against PWA protected/public route maps not done.
- P0 fail-open safety/legal behavior is build-verified as fixed; route-level runtime regression is not yet tested.
- P0 raw delete fallback and moderation schema mismatch are build-verified as fixed in scoped service paths; broader route/DAL audit remains open.

---

## Risk Notes

- RLS failures must be treated as product/security signals, not silently transformed into empty visibility state on safety-critical paths.
- Legal gate and feed block/follow lookups now fail closed in the scoped P0 paths; owner-only dashboard route classification remains open.
- Every `NativeAppRoute` case should have a documented access classification.

---

## Pending Transfer Checklist

- [ ] Classify each `NativeAppRoute` case as: public, authenticated, owner-only, or feature-gated.
- [x] For P0 edits, list every Supabase table/RPC touched before implementation begins.
- [x] Add error handling rules: fail closed for safety/legal checks; soft empty only for non-security optional decorations.

---

## Route Access Classification Reference

| Classification | Description | Example |
|---|---|---|
| `public` | No auth required; use public views/RPCs only | `/vport/:slug/menu`, `/wanders/c/:id` |
| `authenticated` | Requires valid session; actor-scoped reads | `/feed`, `/notifications` |
| `owner-only` | Requires active actor to own the resource | `/actor/:actorId/dashboard/*` |
| `feature-gated` | Auth required + feature flag must be true | `/wanders` (currently false) |

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

- Last synced date: 2026-05-03
- Native files updated: `LiveFeedService.swift`, `SessionStore.swift`, `SupabaseClient.swift`, `LiveSettingsService.swift`
- Delta status: Risky — P0 fail-closed/RPC/delete paths are build-verified; route guard classification and runtime RLS regression remain open
- Notes: P0 native transfer batch started and build-verified on May 3.

---

## Archived Notes

No archived notes yet.
