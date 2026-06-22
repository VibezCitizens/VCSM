# [IDENTITY-008] Profiles → Identity Dependency Audit

Status: Open
Priority: P2
Type: TASK
Weight: Medium
Risk: MEDIUM

---

## Goal

Trace identity imports within `features/profiles/` and the indirect shell → profiles → identity
chain. Document the `useActorCanonicalSlug` dependency that causes `shell` to import from
`profiles/adapters/` instead of `identity/adapters/`. Assess whether `useActorCanonicalSlug`
belongs in profiles or identity.

---

## Context

Two identity relationships exist here:
1. **profiles → identity** (direct): profiles is a 374-file feature with confirmed identity
   imports. Exact count is UNKNOWN from scanner (listed as part of the overall 41 inbound).
2. **shell → profiles → identity** (indirect): `shell/modules/bottom-bar/components/BottomNavBar.jsx`
   imports `useActorCanonicalSlug` from `@/features/profiles/adapters/profiles.adapter`. Shell
   should depend on identity for actor data, not profiles.

The shell→profiles import goes through the correct boundary (profiles adapter), but the
semantic ownership is wrong: the canonical actor slug is an identity concept surfaced through
the profiles feature.

If profiles is ever split (ARCH-VPORTPROFILE-001 ticket), this import path breaks. The fix
would be to move `useActorCanonicalSlug` to `identity/adapters/` or `shared/`.

---

## Source Evidence

- `BIDIR_DEPENDENCY_DECISION.md` Case B: `shell/modules/bottom-bar/components/BottomNavBar.jsx:9`
  imports `useActorCanonicalSlug` from `@/features/profiles/adapters/profiles.adapter`
- `FEATURES_ARCHITECTURE_REVIEW.md`: "shell → profiles: Bottom nav bar importing from profile
  feature internals. Shell should receive actor data via an identity provider/context."
- `FEATURES_ARCHITECTURE_REVIEW.md`: profiles = 374 files
- `IDENTITY-004` output: profiles identity import records

---

## Scope

1. Trace shell → profiles → identity chain:
   - Read `shell/modules/bottom-bar/components/BottomNavBar.jsx`
   - Find `useActorCanonicalSlug` import
   - Read `profiles/adapters/profiles.adapter` — find `useActorCanonicalSlug` export
   - Read `useActorCanonicalSlug` implementation file — find if it imports from identity
2. Trace profiles → identity direct imports:
   - Load IDENTITY-004 output for profiles identity import sites
   - Read each profiles file that imports from identity
   - Record what is imported and what it is used for

---

## Out of Scope

- Full profiles feature audit (374 files — not in scope)
- Fixing the shell→profiles→identity chain (that is a separate implementation ticket)
- The ARCH-VPORTPROFILE-001 split ticket

---

## Dependencies

IDENTITY-004 must be Complete (profiles identity import sites needed).

---

## Blocked By

IDENTITY-004

---

## Exact Steps

1. Load IDENTITY-004 output — get the list of profiles files with identity imports.
2. Read `apps/VCSM/src/features/shell/modules/bottom-bar/components/BottomNavBar.jsx`.
   Record: the exact import line for `useActorCanonicalSlug`.
3. Read `apps/VCSM/src/features/profiles/adapters/profiles.adapter.js` (or `.jsx`).
   Record: does `useActorCanonicalSlug` appear? What file does it re-export from?
4. Follow `useActorCanonicalSlug` to its implementation file. Record:
   - Does it read from identity engine or identity feature adapter?
   - What identity field does it use (actorId? kind? slug field from db?)?
5. For each direct profiles → identity import from IDENTITY-004:
   a. Read the file.
   b. Record: imported symbol, use case, identity field read.
6. Assess `useActorCanonicalSlug` ownership:
   - Is it purely a display helper on top of identity data? → belongs in identity/adapters/
   - Does it do profiles-domain work (db query, profile fields)? → belongs in profiles
   - Does it use both? → note the split required

---

## Validation

- [ ] shell → profiles → identity chain fully traced (3 file reads minimum)
- [ ] `useActorCanonicalSlug` ownership assessed: identity or profiles
- [ ] All profiles → identity direct imports traced
- [ ] ARCH-VPORTPROFILE-001 split impact assessed for this import
- [ ] No source file modified

---

## Rollback Plan

Read-only. No rollback needed.

---

## Do Not Touch

All source files. Any CONTRACTS/ file.

---

## Expected Output

Profiles identity map appended to this ticket:
```
## Profiles Identity Import Map — [DATE]

### Shell → Profiles → Identity Chain
BottomNavBar.jsx → profiles.adapter (useActorCanonicalSlug) → [impl file] → identity
Identity field consumed: [field name]
useActorCanonicalSlug ownership verdict: IDENTITY | PROFILES | SPLIT_REQUIRED

### Direct Profiles → Identity Imports
[table: profiles file | imported symbol | identity field | use case]

### ARCH-VPORTPROFILE-001 Split Impact
If profiles splits:
- useActorCanonicalSlug must move to: [identity/adapters/ | shared/]
- [count] other profiles→identity imports must be re-evaluated

### Compliance
COMPLIANT: [count]
ENGINE_ALIAS: [count]
BYPASS: [count]
```

---

## Next Ticket

IDENTITY-009 — Auth/Session Identity Boundary
