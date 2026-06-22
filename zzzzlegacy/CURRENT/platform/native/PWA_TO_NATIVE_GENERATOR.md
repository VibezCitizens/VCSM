## Read First (Required — in this order)

Architecture contract:
```
/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md
```

Modular transfer index:
```
/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/ROADTRIP_INDEX.md
```

Affected module file(s):
```
/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/modules/<module>.md
```

---

## Architecture Enforcement Rules

- Actor-based identity only: use `actorId` and `kind`.
- Never scope behavior by `profileId`, `vportId`, or raw `userId`.
- Owner means Actor Owner through `actor_owners`.
- Build order: DAL → Model → Controller → Hooks → Components → View Screen → Final Screen.
- Screens must respect role boundaries — no business logic in screens, no DB access in hooks.
- DAL must use explicit selects. Never use `.select('*')`.
- Cross-feature imports must go through adapters.
- Fail closed on safety, RLS, and moderation checks.

---

## PWA Changes

<PASTE PWA CHANGES HERE>

---

## DO NOT IMPLEMENT.

Return only:

- Affected modules
- P0 / P1 / P2 classification
- Native files likely to be modified
- Supabase tables/RPCs impacted
- Risks

---

## Update Docs Only

Update the affected `native-transfer/modules/<module>.md` transfer log only.

**"Update ROADTRIP" means:**
- Primary target: `native-transfer/modules/<module>.md`.
- Do not update `ROADTRIP_INDEX.md` yet — wait until native work is implemented and verified.
- Do not update `ROADTRIP.md` unless the monolithic baseline needs correction.
