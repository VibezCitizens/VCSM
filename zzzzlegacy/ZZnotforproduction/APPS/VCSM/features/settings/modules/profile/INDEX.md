---
title: Profile Module — Index
status: STUB
feature: settings
module: profile
source: venom+bw-derived
created: 2026-06-05
---

# settings / modules / profile

Profile editing — update username, bio, avatar, cover photo, links. profile.write.dal.js is the primary write surface.

## Source Directories

| Directory | Content |
|---|---|
| profile/controller/ | saveProfileCore, updateUsername, updateBio, etc. |
| profile/dal/ | profile.write.dal.js (user-mode subjectId write) |
| profile/hooks/ | useProfileSettings |
| profile/model/ | profile settings model |
| profile/ui/ | Profile settings UI |
| profile/adapter/ | profile settings adapter |
| adapters/profile/ | profile adapters |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

PROFILE-SEC-001 (HIGH) — profile write no session bind.
