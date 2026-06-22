# CURRENT_STATUS — social

**As of:** 2026-06-02
**Source sprint:** 2026-05-27 TICKET-SUB-001

---

## Command Coverage

| Command | Status | Date | Notes |
|---|---|---|---|
| ELEKTRA | COMPLETED | 2026-05-27 | 2 HIGH, 2 MEDIUM, 2 LOW findings — see SECURITY.md |
| SENTRY | COMPLETED | 2026-05-27 | MAJOR DRIFT — privacy DAL split + naming collision |
| FALCON | COMPLETED | 2026-05-27 | BLOCKED — no native app exists; PWA blueprint documented |
| ARCHITECT | NOT_STARTED | — | No separate architect report found in source files |
| KRAVEN | NOT_STARTED | — | No performance audit found in source files |
| SPIDER-MAN | NOT_STARTED | — | Test coverage not audited in source files |
| BLACKWIDOW | NOT_STARTED | — | Referenced as required follow-up; not yet run |
| DB | PARTIAL | 2026-05-27 | `vc.count_subscribers` and `vc.list_subscribers` confirmed SECURITY DEFINER; `vc.get_follower_count` security context UNKNOWN; `vc.actor_privacy_settings` RLS UNKNOWN |

---

## Architecture Status (from SENTRY 2026-05-27)

| Area | Status | Drift Level |
|---|---|---|
| DAL / persistence layer | ALIGNED | NONE |
| Controller / orchestration layer | PARTIAL | MODERATE DRIFT |
| Hook / view model layer | ALIGNED | NONE |
| Adapter boundary | ALIGNED | NONE |
| Model / normalization layer | ALIGNED | NONE |
| Cache ownership and invalidation | ALIGNED | NONE |
| Engine isolation | ALIGNED | NONE |
| Privacy DAL split | MAJOR DRIFT | HIGH |
| Identity surface — UI | MINOR DRIFT | MEDIUM |
| DAL naming | MINOR DRIFT | MEDIUM |

---

## Actor Ownership Gates (from SENTRY 2026-05-27)

| Flow | Status |
|---|---|
| ctrlSubscribe V-SUB-001 gate | PASS |
| ctrlUnsubscribe V-SUB-002 gate | PASS |
| ctrlAcceptFollowRequest V-SUB-003 gate | PASS |
| ctrlDeclineFollowRequest gate | PASS |
| ctrlCancelFollowRequest gate | PASS |
| ctrlSetActorPrivacy gate | FAIL — no assertingActorId; ELEK-2026-05-27-002 OPEN |
| getSubscribersController | Intentional public read — IRONMAN decision |

---

## Open Migration Work (TICKET-SUB-001)

| Phase | Description | Status |
|---|---|---|
| Phase 0 | Apply TICKET-0006 migration `20260527060000` — add vport.profiles guard to existing RPCs | WRITTEN, READY TO APPLY |
| Phase 1 | Create `count_vport_subscribers` + `list_vport_subscribers` RPCs | PENDING — after Phase 0 |
| Phase 2 | Update DAL call sites + rename exports | PENDING — after Phase 1 |
| Phase 3 | Drop `count_subscribers` + `list_subscribers` | PENDING — after Phase 2 |

---

## Pending DB Verification Required Before Phase 1

- `vc.get_follower_count` security context (prosecdef, proconfig) — UNKNOWN
- `vc.actor_privacy_settings` RLS policies — UNKNOWN
- `vc.social_follow_requests` RLS policies — UNKNOWN
