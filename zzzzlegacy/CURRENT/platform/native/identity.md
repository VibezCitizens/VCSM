# Module: Identity engine / actor switching / VPORT switching

## PWA Source of Truth

**Routes:** Engine/module; no single route — `/settings`, `/vport/restore`

**Screens/components:**
- `apps/VCSM/src/features/settings/vports/*`
- `apps/VCSM/src/features/identity/*`
- `apps/VCSM/src/state/identity/*`

**Services/DAL:**
- `apps/VCSM/src/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js`
- `apps/VCSM/src/features/identity/controller/switchActor.controller.js`
- `apps/VCSM/src/features/identity/resolvers/vcsmIdentity.resolver.js`
- `apps/VCSM/src/features/vport/dal/vport.core.dal.js`

**Supabase schema/tables/RPCs:**
- `platform.provision_vcsm_identity`
- `platform.user_app_access`
- `platform.user_app_accounts`
- `platform.user_app_preferences`
- `platform.user_app_actor_links`
- `vc.actors.user_app_account_id`
- `vport.profiles`

**RLS expectations:** Actor switching must only expose actor links owned by the authenticated Supabase user and must persist active actor through `platform.user_app_preferences`.

**Current PWA status:** Canonical identity engine exists and owns actor bootstrap/switching semantics.

---

## Native Transfer Status

**Status:** `Partial`

---

## Transferred Native Files

- `VCSMNativeApp/Services/Supabase/SupabaseClient.swift`
- `VCSMNativeApp/Services/Settings/LiveSettingsService.swift`
- `VCSMNativeApp/Features/Settings/VPortManagementView.swift`
- `VCSMNativeApp/Features/Settings/VPortManagementCards.swift`
- `VCSMNativeCore/Sources/VCSMNativeCore/NativeAppRoute.swift`

---

## Native Behavior Currently Present

- Native resolves active identity, available actors, and fallback primary actor.
- Native persists active identity to `platform.user_app_preferences`.
- VPORT management screen can switch active VPORT identities.

---

## Native Gaps

- Needs parity verification against PWA actor-owner graph, realm, soft-delete, and vport actor linkage logic.
- Switcher appears settings-centric; audit whether every route refreshes actor context after switch.
- Current route enum recheck found 67 explicit NativeAppRoute cases; prior audit had recorded 71.

---

## Risk Notes

- `SupabaseClient.swift:291-417` includes identity resolve and preference persistence paths.
- Identity bugs have wide blast radius: feed, dashboard, notifications, chat, booking, settings all depend on active actor context.

---

## Pending Transfer Checklist

- [ ] Create parity tests/fixtures for user actor, owned VPORT actor, soft-deleted actor, and deleted VPORT.
- [ ] Confirm native uses the same `actor_source` and platform link assumptions as PWA.
- [ ] Confirm actor switch refreshes session identity, tab badge context, feed actor, dashboard owner actor, and composer actor.
- [ ] Recount NativeAppRoute cases after any route work and update ROADTRIP_INDEX.

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
- Native files updated: (none — tracker refresh only)
- Delta status: Partial — identity switch blast radius not fully regression-tested
- Notes: Initial tracker from ROADTRIP.docx May 3 refresh

---

## Archived Notes

No archived notes yet.
