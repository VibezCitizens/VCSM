# Feature Index: moderation

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/moderation`
Source Path: `apps/VCSM/src/features/moderation/` + `apps/VCSM/src/features/block/`

## DR. STRANGE Read Order

1. [README.md](../features/moderation/README.md)
2. [CURRENT_STATUS.md](../features/moderation/CURRENT_STATUS.md)
3. [SECURITY.md](../features/moderation/SECURITY.md)
4. ARCHITECTURE.md — MISSING
5. OWNERSHIP.md — MISSING
6. TESTS.md — MISSING
7. PERFORMANCE.md — MISSING
8. BLOCKERS.md — MISSING
9. DEFERRED.md — MISSING
10. [HISTORY_INDEX.md](../features/moderation/HISTORY_INDEX.md)

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

- **CRITICAL APP-LAYER BUG** — `assertModerationAccess.dal.js` queries `learning.platform_admins` using a vc actor UUID, but `learning.platform_admins.actor_id` is FK'd to `learning.actors` (learning UUIDs). vc UUID never matches. Result: `assertModerationAccessController` always throws FORBIDDEN — no moderator action can succeed through the app layer.
- **SEC-002 (CRITICAL)** — Report audit trail BROKEN. Reporter INSERT RLS policy missing; session-level flag disables all audit writes.
- **VENOM FINDING (HIGH, OPEN)** — `can_manage_domain` vc branch broken. Batch 1 migration `20260510070000` written but NOT APPLIED.
- **CARNAGE Batch 5 ORDER CONSTRAINT** — FORCE RLS (Batch 5) must NEVER apply before Batch 1 (fix can_manage_domain). Applying FORCE RLS to broken policies locks out service_role.
- **Group chat block enforcement (PARTIAL)** — Direct chats only; group chats NOT covered.
- **moderation.moderators table (MISSING)** — Planned, never created. No admin-facing report queue.
- **Content expiry (MISSING)** — `expires_at` field exists; no enforcement trigger.

## Open Blockers

BLOCKERS.md — MISSING. Blockers inferred from CURRENT_STATUS:
- CRITICAL app-layer bug AND DB Batch 1 must ship together.
- 6-batch CARNAGE migration plan written 2026-05-10 — NONE confirmed applied.
- CARNAGE deployment order constraint: Batch 5 MUST NOT deploy before Batch 1 is verified.

## Deferred Items

DEFERRED.md — MISSING. Pending from CURRENT_STATUS:
- Batch 3 — Create `moderation.moderators` table (PLANNED, NOT WRITTEN).
- Admin report queue / report priority triage UI / report assignment flow (all MISSING).
- Content expiry enforcement trigger.

## Latest Ticket

Not found in CURRENT docs (all work referenced by audit date/batch ID).

## Audit Coverage

| Command | Status |
|---------|--------|
| ARCHITECT | COMPLETE — 2026-05-10 |
| VENOM | COMPLETE — 2026-05-10 (10 findings: 1 CRITICAL, 2 HIGH, 4 MEDIUM, 2 LOW + 1 LOW-MEDIUM) |
| KRAVEN | COMPLETE — 2026-05-10 |
| DB | COMPLETE — 2026-05-10 |
| CARNAGE | PLAN WRITTEN — 2026-05-10 (6-batch plan; NOT YET APPLIED) |
| ELEKTRA | NOT RUN |
| SENTRY | NOT RUN |
| SPIDER-MAN | NOT RUN |
| FALCON | NOT RUN |
| BLACKWIDOW | NOT RUN |

## Related Output Files

- `features/moderation/SECURITY.md`
- `features/moderation/HISTORY_INDEX.md`
- `features/moderation/post-visibility-moderation.md`
- `_ACTIVE/audits/moderation/2026-05-10_00-00_moderation-system-review.md` (multi-agent)
- `_ACTIVE/planning/moderation-db-remediation/2026-05-10_moderation-db-remediation-plan.md`

## Recommended Next Command

CARNAGE — apply the 6-batch migration plan in correct order (Batch 1 first, verify before Batch 5). Fix `can_manage_domain` vc branch (Batch 1) and reporter INSERT policy (Batch 2) together with the app-layer bug fix for `assertModerationAccess.dal.js`.

## Recommended Next Ticket

Open ticket for: (1) app-layer bug fix in `assertModerationAccess.dal.js` + Batch 1 migration (must ship together), (2) CARNAGE execution of full 6-batch plan in order. These are P0 — moderator actions are completely broken in production.
