---
title: Profile Module — Behavior
status: STUB
feature: settings
module: profile
source: venom+bw-derived
created: 2026-06-05
---

# settings / modules / profile — BEHAVIOR

## Status

STUB.

## Expected Behaviors (UNVERIFIED)

- Actor edits profile fields (username, bio, avatar, links)
- saveProfileCore → profile.write.dal.js → subjectId caller-supplied (no session bind)
- Hydration store force-mutated downstream of profile write (BW-SETTINGS-010)

## Invariants (UNVERIFIED)

- Profile write must be scoped to authenticated actor's own profile (NOT enforced at DAL — BW-SETTINGS-003 PARTIAL)

## TODO

- [ ] Confirm subjectId source in saveProfileCore
- [ ] Confirm hydration store mutation is safe if RLS enforces ownership
