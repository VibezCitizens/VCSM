---
title: Privacy Module — Architecture
status: STUB
feature: social
module: privacy
source: venom+bw-derived
created: 2026-06-05
---

# social / modules / privacy — ARCHITECTURE

## Social Settings Write Path

```
ctrlUpdateVportSocialSettings / ctrlUpdateActorSocialSettings
  └── [controller-layer column allowlist — NOT enforced at DAL]
        └── dalUpdateActorSocialSettings(actorId, patch)
              └── vc.actor_social_settings UPDATE
                    ├── patch = open object (no column allowlist at DAL) ← VEN-SOCIAL-003 / BW-SOCIAL-005 BYPASSED
                    └── RLS UNVERIFIED (DAL comment only) ← BW-SOCIAL-007
```

## TODO

- [ ] Confirm vc.actor_social_settings RLS ownership enforcement
