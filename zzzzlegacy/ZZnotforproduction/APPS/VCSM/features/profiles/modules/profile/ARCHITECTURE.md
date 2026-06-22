---
title: Profile Module — Architecture
status: STUB
feature: profiles
module: profile
source: venom+bw-derived
created: 2026-06-05
---

# profiles / modules / profile — ARCHITECTURE

## Profile Route Resolution

```
/profile/:slug → resolveActorBySlug.controller
  └── resolveActorSlug.dal → vc.actors SELECT slug
        └── [fallback] buildActorCanonicalSlug:89 → actorId (raw UUID) ← BW-PROF-010 BYPASSED
```

## Profile View Load

```
getProfileView.controller → readActorProfile.dal + readActorKind.dal
  └── profile data hydrated → ProfileScreen
        ├── PrivateProfileGate.adapter — checks privacy
        └── UnavailableProfileGate.adapter — checks availability
```

## Post Share URL

```
useActorProfileActions.js:31 → '/post/' + postId
                                              ↑ raw UUID ← BW-PROF-011 BYPASSED
```

## Debug

```
debug/ProfileRouteDebug.dev.jsx — DEV-gated route debugger
```

## TODO

- [ ] Confirm profileCache key format
- [ ] Confirm privacy gate implementation in PrivateProfileGate
