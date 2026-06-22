---
title: Account Module — Architecture
status: STUB
feature: settings
module: account
source: venom+bw-derived
created: 2026-06-05
---

# settings / modules / account — ARCHITECTURE

## Account Delete Path

```
[actor confirms delete] → ctrlDeleteAccount
  └── dalDeleteCitizenAccountFull → Edge Function
        └── No app-layer session pre-check ← VEN-SETTINGS-002 / BW-SETTINGS-004 PARTIAL
```

## VPORT Hard Delete Path (Broken)

```
useAccountController → ctrlHardDeleteVport
  └── callerActorId MISSING — hard delete broken in Account tab ← VEN-SETTINGS-003
```

## TODO

- [ ] Confirm Edge Function auth (service_role key vs anon key)
- [ ] Confirm callerActorId source in account controller
