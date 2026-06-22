---
title: Invite Module — Architecture
status: STUB
feature: invite
module: invite
source: architect-derived
created: 2026-06-05
---

# invite / modules / invite — ARCHITECTURE

## Layer Stack

```
InviteScreen.jsx
  └── InviteView.jsx
        └── useInvite.js (state machine — idle/sending/success/error)
              └── ctrlSendCitizenInvite (invite.controller.js)
                    ├── email format validation (client-side)
                    ├── inviterType check (client-side)
                    └── sendCitizenInviteDAL (invite.dal.js)
                          └── supabase.functions.invoke('send-citizen-invite', {
                                  inviterActorId, email, inviterType
                                })
                                └── Edge Function: send-citizen-invite
                                      ├── auth.admin.listUsers()  ← THOR BLOCKER: O(n) scan
                                      ├── email dispatch (SES/Resend)
                                      ├── actor_onboarding_steps upsert (server-side)
                                      └── returns { invite_code, ... }  ← THOR BLOCKER: token to client
```

## Redemption Path (UNIMPLEMENTED)

```
Invitee clicks email link → /register?invite_code=XXX
  └── useRegister.js:35  ← TODO: parse invite_code from URL
        └── [NO server-side validation — THOR BLOCKER]
```

## Identity Dependency

```
InviteScreen.jsx
  └── useIdentity() (via @/features/identity/adapters/identity.adapter)
        → provides kind, actorId, displayName for inviter context
```

## Missing Adapter Gap

No formal feature-level adapter (no invite.adapter.js). useInvite.js is consumed directly by screens. This means rawDebugError is exposed without an adapter boundary to strip it.

## TODO

- [ ] Add invite.adapter.js — strip rawDebugError before external consumption
- [ ] Replace auth.admin.listUsers() with SELECT WHERE email = $1 in Edge Function
- [ ] Implement invite redemption in register flow (useRegister.js:35)
- [ ] Remove invite_code from Edge Function response
