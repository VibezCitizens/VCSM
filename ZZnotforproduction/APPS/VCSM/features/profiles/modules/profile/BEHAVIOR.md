---
title: Profile Module — Behavior
status: STUB
feature: profiles
module: profile
source: venom+bw-derived
created: 2026-06-05
---

# profiles / modules / profile — BEHAVIOR

## Status

STUB. Parent BEHAVIOR.md is a stub (VEN-PROFILES-001 THOR BLOCKER).

## Expected Behaviors (UNVERIFIED)

- Actor navigates to /profile/:slug — resolveActorBySlug resolves to actor
- Slug fallback: if slug resolution fails, buildActorCanonicalSlug falls back to bare actorId UUID (THOR BLOCKER)
- Profile screen shows posts, photos, follow state, header
- PrivateProfileGate / UnavailableProfileGate protect non-public profiles
- profileCache.controller — caches profile data (cache key format UNVERIFIED)
- Post share URL: /post/{postId} raw UUID (THOR BLOCKER)

## TODO

- [ ] Define §9 Must Never Happen invariants
- [ ] Confirm slug fallback logic in buildActorCanonicalSlug.controller.js:89
