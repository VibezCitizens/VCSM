---
title: Vport Module — Architecture
status: STUB
feature: profiles
module: vport
source: venom+bw-derived
created: 2026-06-05
---

# profiles / modules / vport — ARCHITECTURE

## Menu Write Path (Ownership Gap)

```
[vport owner] → menu_categories CREATE
  └── NO assertActorOwnsVportActorController ← BW-PROF-002 BYPASSED
        └── actorId from argument (no session bind)
              └── vc.menu_categories INSERT
                    └── DELETE: no ownership filter at DAL layer ← VEN-PROFILES-003

[vport owner] → menu_items CREATE
  └── NO assertActorOwnsVportActorController ← BW-PROF-003 BYPASSED
        └── menu_item_media INSERT: itemId ownership unverified ← VEN-PROFILES-006
              └── vc.menu_items DELETE: no ownership filter ← VEN-PROFILES-004
```

## Locksmith Write Path (Ownership Gap)

```
[locksmith vport owner] → locksmith_portfolio_details UPSERT
  └── DB filter: portfolio_item_id ONLY (no actor_id scope) ← VEN-PROFILES-005

[locksmith vport owner] → locksmith_service_details UPSERT
  └── onConflict: 'service_id' only (actor_id not in conflict key) ← VEN-PROFILES-008
```

## TODO

- [ ] Trace assertActorOwnsVportActorController usage in rates/services
- [ ] Confirm subscriber list privacy gate is controller-level only (VEN-PROFILES-007)
