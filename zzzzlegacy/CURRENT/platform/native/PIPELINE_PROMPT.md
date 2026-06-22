You are working in my VCSM repositories.

## Repository Paths

Monorepo (Web/PWA):
```
/Users/vcsm/Desktop/VCSM
```

Native:
```
/Users/vcsm/Documents/New project/native/VCSMNativeApp
```

Core:
```
/Users/vcsm/Documents/New project/native/VCSMNativeCore
```

---

## Read First (Required — in this order)

1. Architecture contract:
```
/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md
```

2. Modular transfer index:
```
/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/ROADTRIP_INDEX.md
```

3. Affected module file(s):
```
/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/modules/<module>.md
```

4. ROADTRIP baseline (for historical reference only):
```
/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/ROADTRIP.md
```

---

## Architecture Enforcement Rules

Apply to all native code before starting any work:

- Actor-based identity only: use `actorId` and `kind`.
- Never scope behavior by `profileId`, `vportId`, or raw `userId`.
- Owner means Actor Owner through `actor_owners`.
- Build order: DAL → Model → Controller → Hooks → Components → View Screen → Final Screen.
- Screens must respect role boundaries — no business logic in screens, no DB access in hooks.
- DAL must use explicit column selects. Never use `.select('*')`.
- Cross-feature imports must go through adapters.
- Fail closed on all safety, RLS, and moderation checks.

---

## Rules

- Read architecture contract and ROADTRIP_INDEX.md before any work.
- Do not modify code until planning is complete.
- No file restructuring.
- No rewriting working code.
- P0 → P1 → P2 order.
- Fail closed on all safety issues.

---

## Pipeline

1. **READ** — architecture contract → ROADTRIP_INDEX.md → affected module file(s)
2. **IDENTIFY** — what changed in PWA
3. **MAP** — PWA changes to affected modules
4. **UPDATE MODULE** — fill in PWA → Native Transfer Log in `native-transfer/modules/<module>.md` before any native code work
5. **LIST FILES** — exact native files to modify, with Supabase tables/RPCs to be used
6. **IMPLEMENT P0 ONLY** — unless otherwise instructed
7. **VERIFY** — run build/test if possible
8. **UPDATE MODULE STATUS** — update Native Transfer Status, Native Gaps, Transfer History in the affected module file
9. **UPDATE INDEX** — update `ROADTRIP_INDEX.md` parity table only if module status changed

**"Update ROADTRIP" means:**
- Primary target: update `native-transfer/modules/<module>.md`.
- Update `ROADTRIP_INDEX.md` only if module status, priority, or parity summary changes.
- Update `ROADTRIP.md` only if the monolithic baseline is intentionally being corrected.

---

## Output

- Modules affected
- Module files updated
- Native files changed
- Supabase tables/RPCs used
- Remaining gaps
- Next steps
