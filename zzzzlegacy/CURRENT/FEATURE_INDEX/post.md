# Feature Index: post

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/post`
Source Path: `apps/VCSM/src/features/post/` + `apps/VCSM/src/features/upload/`

## DR. STRANGE Read Order

1. [README.md](../features/post/README.md)
2. [CURRENT_STATUS.md](../features/post/CURRENT_STATUS.md)
3. [SECURITY.md](../features/post/SECURITY.md)
4. ARCHITECTURE.md — MISSING
5. OWNERSHIP.md — MISSING
6. TESTS.md — MISSING
7. PERFORMANCE.md — MISSING
8. BLOCKERS.md — MISSING
9. DEFERRED.md — MISSING
10. [HISTORY_INDEX.md](../features/post/HISTORY_INDEX.md)

## Documentation Coverage

| File | Status |
|--------|--------|
| README | YES |
| CURRENT_STATUS | YES |
| SECURITY | YES |
| ARCHITECTURE | MISSING |
| OWNERSHIP | MISSING |
| TESTS | MISSING |
| PERFORMANCE | MISSING |
| BLOCKERS | MISSING |
| DEFERRED | MISSING |
| HISTORY_INDEX | YES |

Coverage Score: 4 / 10

## Active Risks

- **V-1 (HIGH, CONFIRMED)** — `createSystemPost` — no actor ownership verification. `actorId` accepted from caller with only authenticated-user check. INSERT policy on `vc.posts` has no actor ownership check (confirmed by DB audit).
- **DR-001 (CRITICAL, pre-existing)** — `vc.posts` INSERT RLS gap: any authenticated user can POST as any actor via direct Supabase API call. Application guards in place but DB-level enforcement absent until migration `20260522010000` is staged.
- **V-2 (MEDIUM)** — `searchMentionSuggestions` — `viewerActorId` always null; blocked/blocking actors may appear in mention autocomplete.
- **S-1 (MEDIUM)** — `post.write.dal.js` DAL→DAL boundary violation: `replacePostMentions` coordinates delete + insert in DAL layer; belongs in controller.
- **RC-2 (LOW)** — Dual controller folders: `upload/controller/` and `upload/controllers/` coexist.

## Open Blockers

BLOCKERS.md — MISSING. Blockers inferred from CURRENT_STATUS:
- DR-001 — `vc.posts` INSERT RLS gap; migration `20260522010000` written, endorsed by CARNAGE, deployment PENDING staging.
- V-1 — `createSystemPost` ownership verification missing. DB/CARNAGE must confirm RLS INSERT policy.
- IRONMAN required for ownership decisions on V-1 and S-1 before fixes can be assigned.

## Deferred Items

DEFERRED.md — MISSING. Pending from CURRENT_STATUS:
- S-1 — `replacePostMentions` move to controller layer (pending IRONMAN ownership decision).
- RC-2 — dual controller folder cleanup (pending IRONMAN).
- CARNAGE/DB verification for V-2 (block filter on mention autocomplete).

## Latest Ticket

VEN-EXCH-004, VEN-EXCH-005, VEN-EXCH-006

## Audit Coverage

| Command | Status |
|---------|--------|
| VENOM | COMPLETE — 2026-05-19 (2 OPEN findings) |
| SENTRY | COMPLETE — 2026-05-19 (1 OPEN finding) |
| review-contract | COMPLETE — 2026-05-19 (1 OPEN finding) |
| CARNAGE | PARTIAL — migration `20260522010000` endorsed; staging PENDING |
| DB | PARTIAL — DR-001 confirmed 2026-05-22 |
| KRAVEN | NOT RUN |
| LOKI | NOT RUN |
| THOR | NOT RUN |
| IRONMAN | NOT RUN |
| BLACKWIDOW | NOT RUN |

## Related Output Files

- `features/post/SECURITY.md`
- `features/post/HISTORY_INDEX.md`
- `features/post/post-system-map.md`
- `features/post/post-data-model.md`
- `features/post/vcsm.post.architecture.md`
- `features/post/2026-05-19_venom_post-dal-trust-surfaces.md`

## Recommended Next Command

IRONMAN — assign refactor ownership for V-1 (vport publish controllers), S-1 (`replacePostMentions` move), and RC-2 (dual folder cleanup). Then WOLVERINE to schedule fixes. DB/CARNAGE for RLS verification (V-1 resolution dependency).

## Recommended Next Ticket

Open ticket to stage and apply migration `20260522010000` (`vc.posts` INSERT ownership RLS) — closes DR-001 CRITICAL pre-existing gap. This is the highest-priority action for the post feature.
