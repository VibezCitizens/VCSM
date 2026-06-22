## Read First (Required — in this order)

Architecture contract:
```
/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md
```

Modular transfer index:
```
/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/ROADTRIP_INDEX.md
```

Affected module file:
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

## Rules

- Only affected modules.
- P0 first.
- No unrelated edits.
- List files before editing.
- Fail closed on safety, RLS, and moderation checks.

---

## Steps

1. Identify affected modules.
2. Update `native-transfer/modules/<module>.md` — fill in PWA → Native Transfer Log before any native code work.
3. Generate task list.
4. Implement P0 only (unless instructed otherwise).
5. Update module Native Transfer Status, Native Gaps, Transfer History.
6. Update `ROADTRIP_INDEX.md` parity table only if module status changed.

**"Update ROADTRIP" means:**
- Primary target: `native-transfer/modules/<module>.md`.
- `ROADTRIP_INDEX.md` only if status/priority/parity changes.
- `ROADTRIP.md` only if monolithic baseline needs correction.
