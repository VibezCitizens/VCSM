---
title: Privacy Module — Behavior
status: STUB
feature: social
module: privacy
source: venom+bw-derived
created: 2026-06-05
---

# social / modules / privacy — BEHAVIOR

## Status

STUB.

## Expected Behaviors (UNVERIFIED)

- Actor sets social privacy mode (public/private) via ctrlUpdateActorSocialSettings
- VPORT social settings updated via ctrlUpdateVportSocialSettings (column allowlist at controller layer only)
- dalUpdateActorSocialSettings accepts arbitrary patch — no column allowlist at DAL

## Invariants (UNVERIFIED)

- Social settings write must be scoped to authenticated actor (UNVERIFIED — BW-SOCIAL-007)

## TODO

- [ ] Confirm vc.actor_social_settings RLS policy
