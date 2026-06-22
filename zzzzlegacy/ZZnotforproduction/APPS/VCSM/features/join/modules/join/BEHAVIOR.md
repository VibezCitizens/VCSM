---
title: Join Module — Behavior
status: STUB
feature: join
module: join
source: architect-derived
created: 2026-06-05
---

# join / modules / join — BEHAVIOR

## Confirmed Behaviors

### QR Join Path (new user)
- Barber scans QR code → arrives at /join/barbershop/:token (public route)
- JoinBarbershopScreen resolves token → reads resource via barberVport.read.dal (UNAUTH — oracle risk VEN-JOIN-001)
- useJoinBarbershop detects unauthenticated → shows JoinSignupForm
- User submits → signUpForInviteDAL → supabase.auth.signUp with embedded metadata (pending_invite_token, vport_name, category_key — no server-side validation)
- joinBarbershopQr.controller.js: assertActorOwnsVportActorController → ELEK-001 state check (meta.status='pending_onboarding' AND member_actor_id IS NULL) → createVport → acceptJoinResourceDAL UPDATE

### QR Join Path (existing user)
- Barber scans QR code → arrives at /join/barbershop/:token
- useJoinBarbershop detects authenticated → shows JoinLoginForm or auto-resumes
- joinBarbershopAccount.controller.js → useExistingBarberVportAndAccept OR autoResumeInviteOnboarding
- MEDIUM GAP: no controller-layer resource state pre-check before acceptJoinResourceDAL on this path (BW-JOIN-003); only DAL-layer double guard (ELEK-001) applies

### Auto-Resume Onboarding
- If user returns mid-flow with valid session, autoResumeInviteOnboarding resumes
- MEDIUM GAP: creates side-effects (VPORT creation) before verifying invite resource state (VEN-JOIN-002)

### ELEK-001 Atomic Write Guard (QR path only)
- DAL-layer: UPDATE vport.resources WHERE id = resourceId AND meta->>'status' = 'pending_onboarding' AND member_actor_id IS NULL
- Prevents replay and race conditions on the QR path

## Must Never Happen

- acceptJoinResourceDAL must not fire without prior ownership assertion
- Resource state must be verified before any VPORT creation side-effect

## TODO

- [ ] Confirm autoResumeInviteOnboarding side-effect sequence — what is created before state check?
- [ ] Confirm useExistingBarberVportAndAccept — does it have a resource state pre-check?
- [ ] Confirm JoinBarbershopScreen multi-view state list (token_check → signup/login → creating → success)
