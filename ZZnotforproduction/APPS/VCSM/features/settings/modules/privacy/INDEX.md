---
title: Privacy Module — Index
status: STUB
feature: settings
module: privacy
source: venom+bw-derived
created: 2026-06-05
---

# settings / modules / privacy

Privacy settings — block/unblock actors, set actor privacy level. Calls moderation RPC functions.

## Source Directories

| Directory | Content |
|---|---|
| privacy/controller/ | blockActor, unblockActor, setActorPrivacy controllers |
| privacy/dal/ | blocks.dal.js, privacy.dal.js (dalSetActorPrivacy) |
| privacy/hooks/ | usePrivacySettings, useBlockSettings |
| privacy/models/ | privacy model |
| privacy/ui/ | Privacy settings UI |
| adapters/privacy/ | privacy adapters |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

PRIVACY-SEC-001 (HIGH) — p_blocker_actor_id client-supplied; RPC auth unverifiable from source.
