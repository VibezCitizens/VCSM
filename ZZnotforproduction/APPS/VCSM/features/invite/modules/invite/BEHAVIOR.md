---
title: Invite Module — Behavior
status: STUB
feature: invite
module: invite
source: architect-derived
created: 2026-06-05
---

# invite / modules / invite — BEHAVIOR

## Confirmed Behaviors

### Send Invite Flow
- Authenticated Citizen navigates to InviteScreen (via onboarding or nav)
- InviteView renders email input form
- useInvite manages state machine: idle → sending → success | error
- On submit: ctrlSendCitizenInvite validates email format + inviterType client-side
- invite.dal.js → supabase.functions.invoke('send-citizen-invite', { inviterActorId, email, inviterType })
- Edge Function: calls auth.admin.listUsers() O(n) scan to check registration — THOR BLOCKER
- Edge Function: dispatches email; upserts actor_onboarding_steps server-side
- Edge Function: returns invite_code token to client — THOR BLOCKER
- On success: useInvite transitions to success state; displays success UI

### Invite Code Handling (BROKEN)
- Edge Function returns invite_code in response — token accessible to sender
- readVibeInvitesDAL can read invite tokens from vc.vibe_invites (RLS unverified)
- useRegister.js:35 has a TODO to parse invite_code from URL — never implemented
- Invite redemption: COMPLETELY UNIMPLEMENTED — invite links are non-functional

### Error Handling
- useInvite exports rawDebugError unconditionally — internal error detail exposed to all consumers
- SELF_INVITE and USER_ALREADY_REGISTERED error codes expected from Edge Function (server-side)

## Must Never Happen

- invite_code must never be returned to the sender's client
- auth.admin.listUsers() must never be called per-invite (DoS risk)
- Invite redemption must be validated server-side before granting any registration benefit

## TODO

- [ ] Confirm ctrlSendCitizenInvite inviterType values — what types are supported?
- [ ] Confirm Edge Function VPORT inviterType — does it verify inviterActorId ownership?
- [ ] Confirm useInvite state machine transitions — all error codes handled?
