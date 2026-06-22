---
title: Join Module — Architecture
status: STUB
feature: join
module: join
source: architect-derived
created: 2026-06-05
---

# join / modules / join — ARCHITECTURE

## Layer Stack — QR New User Path

```
/join/barbershop/:token (public route)
  └── JoinBarbershopScreen.jsx
        └── useJoinBarbershop.js (state machine)
              ├── barberVport.read.dal (unauthenticated resource fetch — oracle risk)
              ├── [unauthenticated] → JoinSignupForm.jsx
              │     └── signUpForInviteDAL → supabase.auth.signUp({
              │                                  metadata: { pending_invite_token,
              │                                              vport_name, category_key }
              │                               })  ← client-controlled, no server validation
              └── joinBarbershopQr.controller.js
                    ├── assertActorOwnsVportActorController (booking engine)
                    ├── ELEK-001 state check (controller layer)
                    ├── features/vport → createVport
                    └── acceptJoinResourceDAL
                          └── UPDATE vport.resources
                                WHERE id = resourceId
                                  AND meta->>'status' = 'pending_onboarding'
                                  AND member_actor_id IS NULL   ← DAL double guard
```

## Layer Stack — Account Path (Existing User / Auto-Resume)

```
useJoinBarbershop.js (authenticated session detected)
  └── joinBarbershopAccount.controller.js
        ├── useExistingBarberVportAndAccept  ← NO controller-layer state pre-check (BW-JOIN-003)
        ├── createBarberVportAndAccept       ← NO controller-layer state pre-check (BW-JOIN-003)
        └── autoResumeInviteOnboarding
              ├── side-effects BEFORE state check (VEN-JOIN-002)
              └── acceptJoinResourceDAL (DAL guard applies; controller guard MISSING)
```

## ELEK-001 Defense Layers

| Layer | Guard | Path |
|---|---|---|
| Controller (QR only) | meta.status check + member_actor_id null check | QR path only |
| DAL (all paths) | UPDATE WHERE status=pending_onboarding AND member_actor_id IS NULL | Both paths |
| Ownership (all paths) | assertActorOwnsVportActorController | Both paths (UNVERIFIED for account path) |

## TODO

- [ ] Confirm ownership assertion is called in account path controllers
- [ ] Confirm autoResumeInviteOnboarding DAL injection — optional chaining on dependency (BW-JOIN-002)
- [ ] Confirm route registration in app/routes/public/join.routes.jsx
