# Block Feature — Current Status

**As of:** 2026-05-14
**VENOM STATUS:** CAUTION (VF-01 open pending batch4)
**SENTRY STATUS:** PASS (post-fix, all findings resolved 2026-05-14)
**THOR DECISION:** CAUTION (PWA) / BLOCKED (iOS Native) / BLOCKED (Android — NOT STARTED)

---

## Command Coverage

| Command | Status | Date |
|---|---|---|
| VENOM | COMPLETE — 1 OPEN (VF-01), 4 RESOLVED | 2026-05-11 |
| SENTRY | COMPLETE — ALL RESOLVED | 2026-05-11 |
| LOKI | COMPLETE — 2 OPEN findings (LF-01, LF-02 inferred) | 2026-05-14 |
| THOR | COMPLETE — CAUTION/BLOCKED | 2026-05-14 |
| KRAVEN | COMPLETE — ran 2026-05-10 (see PERFORMANCE.md, HISTORY_INDEX.md) | 2026-05-10 |
| IRONMAN | NOT_STARTED | — |
| CARNAGE | COMPLETE — ran 2026-05-11 (see DEFERRED.md, HISTORY_INDEX.md) | 2026-05-11 |
| ARCHITECT | COMPLETE — TICKET-BLOCK-ARCHITECT-0001 propagated | 2026-06-02 |

---

## Open Security Findings (VENOM)

| ID | Severity | Description | Status |
|---|---|---|---|
| VF-01 | HIGH | `vc.friend_ranks` not cleaned up after block — blocked actors may surface in friend suggestions; social graph integrity gap | OPEN — batch4 migration required |

**Additional open DB concern:** `vc.friend_ranks` SELECT policy `USING(true)` leaks all social graph scores globally to authenticated users. step2 section 2D fix is pending application.

---

## Resolved Security Findings (VENOM)

| ID | Severity | Description | Resolved |
|---|---|---|---|
| VF-02 | MEDIUM | Feed cache invalidation fire-and-forget in controller | RESOLVED 2026-05-14 — moved to hook layer |
| VF-03 | MEDIUM | `blockedActorSet.read.dal.js` duplicate DAL in profiles | RESOLVED 2026-05-14 — file deleted |
| VF-04 | MEDIUM | Dead exports in block DAL (`isBlocked`, `toggleBlockActor`) | RESOLVED 2026-05-14 — both deleted |
| VF-05 | LOW | `console.error` in DAL error paths | NO ACTION REQUIRED |

---

## Resolved Architecture Findings (SENTRY)

| ID | Severity | Description | Resolved |
|---|---|---|---|
| SF-01 | MEDIUM | Block controller imports feed cache adapter — moderate drift | RESOLVED 2026-05-14 — moved to `useBlockActions.js` |
| SF-02 | LOW | Dev-only exports in production DAL | RESOLVED 2026-05-14 — moved to `dev/diagnostics/dal/block.diagnostics.dal.js` |
| SF-03 | LOW | Dead duplicate DAL file in profiles | RESOLVED 2026-05-14 — `blockedActorSet.read.dal.js` deleted |

---

## Open Runtime Findings (LOKI)

| ID | Severity | Description | Status |
|---|---|---|---|
| LF-01 | MODERATE | Duplicate uncached `checkBlockStatus` reads on profile screen load — `useBlockStatus` called twice in parallel (VportProfileViewScreen:54 and inside `useProfileGate:19`); both hit Supabase with no cache; Read Amplification Score: 2.0 | OPEN |
| LF-02 | MODERATE | `invalidateFeedBlockCache` missing from `useBlockActorAction` path (inferred from cache behavior summary) | OPEN |

**Cache state (as of LOKI audit):**
- `readFeedBlockRowsDAL`: CACHED (60s TTL) — PASS
- `checkBlockStatus` (direct): NO CACHE — every call hits Supabase
- `filterBlockedActors` (bulk): NO CACHE — every call hits Supabase
- `invalidateFeedBlockCache`: SYNC invalidation — correct behavior on known path

## ARCHITECT Propagation Sync — 2026-06-02

Completed audit: `TICKET-BLOCK-ARCHITECT-0001`
Final verdict: `ARCHITECT_BLOCK_COMPLETE`

Propagated findings:
- Source inventory: 3 controllers, 3 DALs, 5 hooks, 0 screens/routes, 0 tests.
- Architecture posture: mostly complete and self-contained; consumed by profiles/settings/chat/feed/notifications through adapter surfaces.
- Write path: RPC-backed block/unblock with app-layer assertion and RPC-side ownership enforcement.
- Open blocker trace: `VF-01` friend_ranks cleanup and native FALCON parity blockers remain.
- Test posture: no feature-owned tests found; SPIDER-MAN not run.

---

## THOR Release Gate

| Platform | Decision | Reason |
|---|---|---|
| PWA | CAUTION | All architecture violations resolved. batch4 pending deployment. No CRITICAL risks. |
| iOS Native | BLOCKED | 3 FALCON P0 gaps: chat compose disable unverified, fail-closed not runtime-tested, follow gate has no native owner |
| Android | BLOCKED | NOT STARTED |

**THOR Release Blockers:**
1. FALCON P0-1 — chat compose disable at controller level not verified (NTB-03)
2. FALCON P0-2 — fail-closed behavior not runtime-tested on all four surfaces (NTB-02)
3. FALCON P0-3 — native follow/friend gate has no owner and no transfer evidence (NDF-01)

---

## Pending Deployment Actions

- `batch4` migration (`20260510100000_fix_block_actor_bidirectional_follows.sql`) — staging to production
- Historical orphan backfill (`actor_follows` + `friend_ranks`) after batch4
- step2 section 2D — `vc.friend_ranks` SELECT policy fix
- Delete `applyBlockSideEffects.js` after batch4 deploys

---

## Trust Boundary Summary

Block write path trust boundary is SOLID. Dual enforcement: app-layer `assertingActorId` check + RPC `is_current_vc_actor` guard. No CRITICAL findings.
