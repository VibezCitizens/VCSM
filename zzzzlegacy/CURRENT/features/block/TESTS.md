# Block Feature — Tests and Coverage

Source: THOR governance audit 2026-05-14
SPIDER-MAN status: NOT RUN

---

## SPIDER-MAN Audit Status

SPIDER-MAN has **not run** for the block feature. No regression safety net audit has been completed. Test coverage state is derived solely from THOR release gate findings.

---

## Known Coverage

THOR did not surface any existing automated test coverage for the block feature. No unit tests, integration tests, or runtime behavior tests were cited as passing or present.

---

## Missing Coverage

### FALCON P0-2 — Highest-Urgency Gap

**ID:** FALCON P0-2
**Description:** fail-closed behavior not runtime-tested on all four surfaces (NTB-02)

This is a release blocker for iOS Native. The block system's fail-closed guarantee — that a blocked actor cannot access protected content, compose messages, or bypass gates — has not been verified at runtime across all four platform surfaces (PWA, iOS Native, Android, and any controller-layer entry point).

---

### Other FALCON Release Blockers (from THOR)

| ID | Gap |
|---|---|
| FALCON P0-1 | Chat compose disable at controller level not verified (NTB-03) |
| FALCON P0-3 | Native follow/friend gate has no owner and no transfer evidence (NDF-01) |

---

### Platform Coverage Gaps

| Platform | THOR Status | Test Gap |
|---|---|---|
| PWA | CAUTION — no CRITICAL risks | Runtime fail-closed behavior unverified |
| iOS Native | BLOCKED | P0-1, P0-2, P0-3 all unresolved |
| Android | BLOCKED | Platform not started; zero coverage |

---

## Recommended SPIDER-MAN Scope

When SPIDER-MAN runs for the block feature, the audit should cover:

1. **Fail-closed behavior** — assert that a blocked actor cannot reach any protected surface (feed, chat compose, profile, follow/friend gate) across all four surfaces.
2. **Chat compose gate** — verify that the controller-level disable is exercised and enforced (covers FALCON P0-1 / NTB-03).
3. **Follow and friend gate** — verify that the native follow/friend gate enforces block state (covers FALCON P0-3 / NDF-01).
4. **Feed block cache invalidation** — verify that `invalidateFeedBlockCache` at the hook layer correctly clears state on block/unblock.
5. **DAL contracts** — assert that dead exports (`isBlocked`, `toggleBlockActor`) are fully removed and no call sites remain.
6. **Bidirectional follow side effects** — verify that batch4 migration side effects (actor_follows, friend_ranks orphan backfill) are covered by regression tests post-deployment.
7. **Android surface** — baseline coverage must be established before Android can exit BLOCKED status.

---

## Recommended Next Command

**SPIDER-MAN** — run a regression safety net audit scoped to the block feature, prioritizing the four fail-closed surfaces and the three FALCON P0 gaps identified by THOR.
