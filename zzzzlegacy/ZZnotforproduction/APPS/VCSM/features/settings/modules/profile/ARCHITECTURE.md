---
title: Profile Module — Architecture
status: STUB
feature: settings
module: profile
source: venom+bw-derived
created: 2026-06-05
---

# settings / modules / profile — ARCHITECTURE

## Profile Write Path

```
[actor saves profile] → saveProfileCore(subjectId)
  └── profile/dal/profile.write.dal.js → user-mode UPDATE
        └── subjectId = caller-supplied ← VEN-SETTINGS-006 / BW-SETTINGS-003 PARTIAL
              └── RLS sole ownership backstop
                    └── [if update succeeds] → hydration store force-mutation ← BW-SETTINGS-010
```

## TODO

- [ ] Confirm vc.profiles RLS UPDATE policy scope
