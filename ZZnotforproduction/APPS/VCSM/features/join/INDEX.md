---
name: vcsm.join.index
description: VCSM join feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / join

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 12 | 2 source files: `joinBarbershopQr.controller.js`, `joinBarbershopAccount.controller.js` |
| DAL files | 5 | `joinInvite.dal.js`, `barberVport.read.dal.js`, `joinAuth.dal.js` |
| Hooks | 1 | `useJoinBarbershop.js` |
| Models | 0 | No model/transformer layer present |
| Screens | 15 | `JoinBarbershopScreen.jsx` (multi-view state machine; single physical screen file) |
| Components | 4 | `JoinSignupForm.jsx`, `JoinLoginForm.jsx`, `JoinPrimitives.jsx`, `joinStyles.js` |
| Adapters | 0 | No adapter file — module exposes no public boundary |
| Barrels | 0 | No barrel/index exports |
| Tests | 1 | `controllers/__tests__/joinBarbershopQr.controller.test.js` — 10 regression cases (ELEK-001 guards) |
| Routes | 0 | Not in route-map scanner; `/join/barbershop/:token` registration must be verified in app router |
| Total source files | 12 | As reported by feature-map scanner |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| UPDATE | (vport schema — via vportClient) | resources | `acceptJoinResourceDAL` |

The write is conditionally guarded: update only fires when `meta->>status = 'pending_onboarding'` AND `member_actor_id IS NULL`. This is the ELEK-001 atomic state guard.

## Security-Sensitive Surfaces

- **`acceptJoinResourceDAL`** — writes to `vport.resources` to link a barber VPORT to a barbershop staff slot. Protected by:
  1. Controller-layer ownership assertion (`assertActorOwnsVportActorController` from booking engine) before any DAL call
  2. Controller-layer resource state check (`meta.status === 'pending_onboarding'` AND `member_actor_id === null`) after ownership assertion
  3. DAL-layer conditional update (double guard) — prevents replay and race conditions

- **`signUpForInviteDAL`** — calls `supabase.auth.signUp` directly with embedded metadata (`pending_invite_token`, `vport_name`, `category_key`). Auth metadata fields are used to drive auto-resume onboarding. No server-side validation of these metadata fields is confirmed in this module — VENOM review recommended.

## Engine Dependencies

- `booking` — `assertActorOwnsVportActorController` (ownership assertion gate)
- `identity` — `useIdentity`, `useIdentityOps`, `refreshVcActorDirectory`, `ensureVcsmPlatformBootstrap`
- `qr` — QR token generation/delivery (upstream of this module; token arrives as URL param)

Cross-feature adapter dependencies (not engine engines, but consumed via adapter boundaries):
- `features/auth` — `useAuthOps`, `bootstrapJoinOnboardingController`
- `features/vport` — `useVportCoreOps` → `createVport`
- `features/legal` — `recordSignupConsent`

## Routes

No routes registered in route-map scanner for this feature. The expected public route is:

`/join/barbershop/:token` — rendered by `JoinBarbershopScreen.jsx`

This route is publicly accessible (no auth gate at the route level); authorization is performed inside the hook and controllers via token validation and ownership assertion.

**Action required:** verify route registration in `apps/VCSM/src/app` router — HAWKEYE.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT — content is a placeholder stub; behavioral contract not yet written |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
