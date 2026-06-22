---
title: Invite Module — Index
status: STUB
feature: invite
module: invite
source: architect+venom+bw-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/invite/
scanner-version: 1.1.0
---

# invite / modules / invite

Citizen invite flow via email. Delegates send to Edge Function. **THOR BLOCKERS: O(n) auth.admin.listUsers scan on every invite (DoS), invite_code returned to sender client, no rate limiting (SES spam relay), invite redemption entirely unimplemented.**

## Module Summary

| Field | Value |
|---|---|
| Module | invite |
| Feature | invite |
| Source Path | apps/VCSM/src/features/invite/ |
| Screens | 2 (InviteScreen, InviteView) |
| Routes | 0 confirmed (accessed via navigation stack) |
| Write Surfaces | send-citizen-invite Edge Function (email dispatch + actor_onboarding_steps server-side upsert) |
| Controllers | 1 (invite.controller.js) |
| DAL Files | 1 (invite.dal.js) |
| Hooks | 1 (useInvite.js) |
| No Adapter | Missing — gap noted |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| controller/invite.controller.js | Controller | ctrlSendCitizenInvite, codeToInviteMessage — email format + inviterType validation |
| dal/invite.dal.js | DAL | sendCitizenInviteDAL → supabase.functions.invoke('send-citizen-invite') |
| hooks/useInvite.js | Hook | Full invite state machine (email, sending, success, error); exports rawDebugError unconditionally |
| screens/InviteScreen.jsx | Screen | Invite entry screen |
| screens/InviteView.jsx | Screen | Invite form view |
| screens/InviteView.styles.js | Styles | View styles |

## Write Surface Map

| Operation | Surface | Guard |
|---|---|---|
| supabase.functions.invoke | send-citizen-invite Edge Function | Client-side email format + inviterType checks only; server-side auth enforced inside Edge Function |
| actor_onboarding_steps upsert | Server-side (Edge Function internal) | Not visible to client |

## Security Flags

- **THOR BLOCKER** HIGH: VEN-INVITE-001 / BW-INVITE-006 — Edge Function calls auth.admin.listUsers() (full O(n) scan) on every invite to check if email is already registered; DoS amplification vector — adversarially confirmed BYPASSED
- **THOR BLOCKER** HIGH: VEN-INVITE-002 / BW-INVITE-004 — invite_code (one-time redemption token) returned to sender's client in Edge Function response; sender can forward to unintended recipients; readable via readVibeInvitesDAL
- **THOR BLOCKER** HIGH: VEN-INVITE-004 / BW-INVITE-002 — no per-user rate limiting or invite deduplication; authenticated user can replay N invite emails to same target (SES spam relay); adversarially confirmed BYPASSED
- **THOR BLOCKER** HIGH: BW-INVITE-005 — invite redemption entirely unimplemented; invite_code parsed from URL in useRegister.js:35 (TODO comment) but never validated server-side; any URL can be crafted; adversarially confirmed BYPASSED
- MEDIUM: VEN-INVITE-003 — rawDebugError exported unconditionally from useInvite() public API; internal error state exposed to all consumers
- MEDIUM: BW-INVITE-001 — vc.vibe_invites RLS unverified; cross-actor invite_code token read may be possible via readVibeInvitesDAL
- LOW: BW-INVITE-003 — raw UUID in public-facing invite URL (policy ambiguity for token URLs)

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Replace auth.admin.listUsers() with direct email lookup in Edge Function (resolves DoS vector)
- [ ] Remove invite_code from Edge Function response; never return tokens to client
- [ ] Add per-user rate limit + deduplication in Edge Function
- [ ] Implement server-side invite_code redemption validation in register flow
- [ ] Remove rawDebugError from useInvite() public export
- [ ] Confirm vc.vibe_invites RLS restricts reads to token owner only
