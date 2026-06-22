---
name: vcsm.invite.index
description: VCSM invite feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / invite

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 2 | invite.controller.js (ctrlSendCitizenInvite, codeToInviteMessage) |
| DAL files | 1 | invite.dal.js — delegates to Edge Function via supabase.functions.invoke |
| Hooks | 1 | useInvite.js — full invite state machine (email, sending, success, error) |
| Models | 0 | No model files; Edge Function response used raw |
| Screens | 3 | InviteScreen.jsx, InviteView.jsx, InviteView.styles.js |
| Components | 0 | No standalone component files |
| Adapters | 0 | No public adapter file — gap noted in ARCHITECTURE.md |
| Barrels | 0 | No index/barrel files |
| Tests | 0 | No tests detected by scanner |
| Routes | 0 | No route-map registration detected; accessed via app navigation stack |
| Total source files | 6 | controller/invite.controller.js, dal/invite.dal.js, hooks/useInvite.js, screens/InviteScreen.jsx, screens/InviteView.jsx, screens/InviteView.styles.js |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| edge_function | — | — | sendCitizenInviteDAL → send-citizen-invite Edge Function |

Note: The Edge Function performs a server-side upsert on `actor_onboarding_steps` upon successful invite; this write is not visible to the client and not in the client write-surface map.

## Security-Sensitive Surfaces

- **sendCitizenInviteDAL** (edge_function): Sends email invitations on behalf of the authenticated actor. The Edge Function must validate the inviter's identity server-side. Self-invite prevention (`SELF_INVITE` error code) and duplicate detection (`USER_ALREADY_REGISTERED`) are expected to be enforced server-side. Client-side validation in `ctrlSendCitizenInvite` provides email format and inviterType checks but cannot substitute for server-side authorization. Risk: MEDIUM — email dispatch surface; confirm Edge Function enforces actor ownership of `inviterActorId` when `inviterType === 'vport'`.

## Engine Dependencies

- **identity** — consumed via `@/features/identity/adapters/identity.adapter` (useIdentity hook); provides `kind`, `actorId`, `displayName` to drive inviter context

## Routes

No routes registered in route-map for this feature. InviteScreen is reached via internal navigation from the onboarding flow. Confirm it is protected by the authenticated app shell.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (stub — contract not yet authored) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
| SCREENS.md | PRESENT |
