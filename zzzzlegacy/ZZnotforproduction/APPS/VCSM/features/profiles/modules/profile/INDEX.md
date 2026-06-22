---
title: Profile Module — Index
status: STUB
feature: profiles
module: profile
source: venom+bw-derived
created: 2026-06-05
---

# profiles / modules / profile

Core profile view — slug resolution, actor kind detection, profile screen, header, caching, config.

## Source Directories

| Directory |
|---|
| controller/buildActorCanonicalSlug.controller.js |
| controller/getActorKind.controller.js |
| controller/getProfileView.controller.js |
| controller/profileCache.controller.js |
| controller/resolveActorBySlug.controller.js |
| controller/resolveUsernameToActor.controller.js |
| dal/readActorIdByUsername.dal.js |
| dal/readActorKind.dal.js |
| dal/readActorProfile.dal.js |
| dal/readActorSeoData.dal.js |
| dal/readActorType.dal.js |
| dal/readVportType.dal.js |
| dal/resolveActorSlug.dal.js |
| config/profileTabs.config.js |
| hooks/ (header/, screen hooks) |
| model/ |
| screens/ (components, hooks, views) |
| ui/ (header/) |
| debug/ProfileRouteDebug.dev.jsx |
| adapters/profiles.adapter.js |
| adapters/ui/*.adapter.js |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

**THOR RELEASE BLOCKER** — PROF-SEC-001 (HIGH), PROF-SEC-002 (HIGH): raw UUID fallback + post share URLs.
