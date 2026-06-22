# Feature Index: profiles

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/profiles`
Source Path: `apps/VCSM/src/features/profiles/` (416 files: 72 DAL, 61 controller, 132 component)

## DR. STRANGE Read Order

1. [README.md](../features/profiles/README.md)
2. [CURRENT_STATUS.md](../features/profiles/CURRENT_STATUS.md)
3. [SECURITY.md](../features/profiles/SECURITY.md)
4. [ARCHITECTURE.md](../features/profiles/ARCHITECTURE.md)
5. [OWNERSHIP.md](../features/profiles/OWNERSHIP.md)
6. TESTS.md — MISSING
7. [PERFORMANCE.md](../features/profiles/PERFORMANCE.md) — note: listed as `performance.md` (lowercase)
8. BLOCKERS.md — MISSING
9. DEFERRED.md — MISSING
10. [HISTORY_INDEX.md](../features/profiles/HISTORY_INDEX.md)

## Documentation Coverage

| File | Status |
|--------|--------|
| README | YES |
| CURRENT_STATUS | YES |
| SECURITY | YES |
| ARCHITECTURE | YES |
| OWNERSHIP | YES |
| TESTS | MISSING |
| PERFORMANCE | YES |
| BLOCKERS | MISSING |
| DEFERRED | MISSING |
| HISTORY_INDEX | YES |

Coverage Score: 7 / 10

## Active Risks

- **DR-001 (CRITICAL, pre-existing, DB-BLOCKED)** — `vc.posts` INSERT RLS gap: any authenticated user can POST as any actor via direct Supabase API call. Migration `20260522010000` endorsed by CARNAGE; staging PENDING.
- **VF-003 (HIGH)** — `checkActorOwnership.controller.js` is a hollow pass-through to DAL. Ownership check logic lives in DAL layer — architectural security debt.
- **VF-004 (HIGH)** — `useProfileGate.js` enforces profile privacy entirely client-side. Client gate bypassable via devtools.
- **VF-005 (HIGH)** — `ActorProfileScreen.jsx` imports `ActorProfileProdDebugPanel` debug component — bundled in production build regardless of render guard.
- **SF-002 (HIGH)** — `checkActorOwnership` ownership logic in DAL (architectural debt).
- **SF-003 (HIGH)** — `fetchPostsForActor.dal.js` god method — 262-line multi-schema DAL.
- **SF-004 (HIGH)** — Post data DALs owned by profiles — cross-feature boundary.
- **SF-005 (MEDIUM)** — Re-export controller in screens layer.
- **SF-006 (MEDIUM)** — Adapter naming violations x3.
- **LOKI** — Serial waterfall (slug→kind→gate→posts) and no post cache — non-blocking but noted.
- **LOGAN MAJOR DRIFT** — No `vcsm.profiles.owner.md` exists.

## Open Blockers

BLOCKERS.md — MISSING. Blockers inferred from CURRENT_STATUS:
- DR-001 — `vc.posts` INSERT RLS migration staging PENDING.
- VF-005 — Debug component bundled in production (move to `zNOTFORPRODUCTION/debuggers/`).
- No BLACKWIDOW run this audit cycle.

## Deferred Items

DEFERRED.md — MISSING. Pending from CURRENT_STATUS:
- DR-001 migration staging.
- SF-003 god method refactor (major refactor scope).
- SF-004 cross-feature boundary resolution.
- IRONMAN open questions: post data reads conflicted; photo reactions ownership unresolved.
- LOGAN: create `vcsm.profiles.owner.md`.

## Latest Ticket

S-BLK-004, S-BLK-005, TICKET-0005 (CLOSED)

## Audit Coverage

| Command | Status |
|---------|--------|
| VENOM | COMPLETE — 2026-05-22 (VF-001/002 CLOSED, VF-003/004/005/006 OPEN) |
| SENTRY | COMPLETE — 2026-05-22/23 (SF-001 CLOSED, SF-002–006 OPEN) |
| CARNAGE | PARTIAL — migration endorsed; staging PENDING |
| DB | PARTIAL — DR-001 CRITICAL confirmed 2026-05-22 |
| LOKI | COMPLETE — 2026-05-22 (non-blocking) |
| KRAVEN | COMPLETE — 2026-05-22 (non-blocking) |
| IRONMAN | COMPLETE — 2026-05-22 (ownership PARTIAL) |
| THOR | PARTIAL — code release CONDITIONAL PASS; DB migration BLOCKED |
| LOGAN | PARTIAL — MAJOR DRIFT identified 2026-05-22 |
| ARCHITECT | PARTIAL — 2026-05-22 (stale counts, naming violations, non-blocking) |
| FALCON | OUT OF SCOPE |
| BLACKWIDOW | NOT RUN |

## Related Output Files

- `features/profiles/SECURITY.md`
- `features/profiles/ARCHITECTURE.md`
- `features/profiles/OWNERSHIP.md`
- `features/profiles/HISTORY_INDEX.md`
- `features/profiles/vport-tab-governance-matrix.md`
- `features/profiles/vport-tab-registry.md`
- `features/profiles/2026-05-22_venom_profiles-trust-boundaries.md`
- `features/profiles/2026-06-01_sentry_barber-locksmith-barbershop-architect-gate.md`

## Recommended Next Command

BLACKWIDOW — adversarial runtime verification on profile privacy gating (VF-004 client-side gate is a natural adversarial target). Then stage and apply migration `20260522010000` (DR-001).

## Recommended Next Ticket

Stage and apply migration `20260522010000` (`vc.posts` INSERT ownership RLS). Also open ticket to move `ActorProfileProdDebugPanel` to `zNOTFORPRODUCTION/debuggers/` (VF-005) — production debug component is P1 cleanup.

## DR. STRANGE Entry
- File: CURRENT/features/profiles/DR_STRANGE.md
- Created: 2026-06-02
- Ticket: TICKET-DRSTRANGE-BACKFILL-P1-0001
