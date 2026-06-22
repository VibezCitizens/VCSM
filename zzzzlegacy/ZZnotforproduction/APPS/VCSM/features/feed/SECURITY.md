# Security Posture — feed

Last Updated: 2026-06-06
Highest Open Severity: HIGH
THOR Release Blocker: YES — ELEK-2026-06-06-001 (IDOR: welcome card write, CARNAGE required), ELEK-2026-06-06-002 (auth: logout cache residue, IRONMAN required), BW-FEED-NEW-002 (profile posts visibility, CARNAGE required), VEN-FEED-005 (RLS unverified, CARNAGE required), VEN-FEED-009 (adapter boundary, IRONMAN required)

---

## VENOM STATUS
VENOM Last Run: 2026-06-06
VENOM Status: COMPLETE (re-verify — BLIND_REVERIFY_MODE)

Re-verify summary: 0 CRITICAL, 3 HIGH, 5 MEDIUM, 3 LOW — 4 findings CLOSED, 3 NEW findings added

**Closed this run (source-verified):**

| Finding ID | Severity | Description | Status |
|---|---|---|---|
| VEN-FEED-002 | MEDIUM | Unguarded console.log in pipeline:137 — prior finding was incorrect | CLOSED_SOURCE_VERIFIED |
| VEN-FEED-006 | LOW | null realmId "exposes all realms" — prior finding was incorrect; null returns empty | CLOSED_SOURCE_VERIFIED |
| BW-FEED-003 | MEDIUM | getDebugPrivacyRowsController no production gate — three-layer DEV protection confirmed | CLOSED_SOURCE_VERIFIED |
| BW-FEED-008 | HIGH | **THOR BLOCKER RESOLVED** — getDebugPrivacyRowsController exposes privacy in production | CLOSED_SOURCE_VERIFIED |

**Open findings:**

| Finding ID | Severity | Description | Status |
|---|---|---|---|
| VEN-FEED-001 | HIGH | BEHAVIOR.md is a PLACEHOLDER — no §5 Security Rules or §9 Must Never Happen defined | STILL_OPEN_SOURCE_VERIFIED |
| VEN-FEED-003 | LOW | actorId passed as userId to readOwnedActorIdsByUserIdDAL in debug controller — DEV-only | STILL_OPEN_SOURCE_VERIFIED |
| VEN-FEED-004 | MEDIUM | listActorPosts controller accepts viewerActorId but discards it — illusory auth, RLS-only | STILL_OPEN_SOURCE_VERIFIED |
| VEN-FEED-005 | HIGH | vport.profiles owner-only RLS — unverifiable from source; DB review required | NOT_VERIFIABLE_SOURCE_MISSING |
| BW-FEED-001 | HIGH | ctrlMarkWelcomeCardSeen has no ownership check — actorId unverified against session | STILL_OPEN_SOURCE_VERIFIED |
| BW-FEED-002 | MEDIUM | Feed hooks delegate actorId from caller — no session binding at hook layer | STILL_OPEN_SOURCE_VERIFIED |
| BW-FEED-004 | LOW | actorId as userId in debug controller (confirms VEN-FEED-003) — DEV-only | STILL_OPEN_SOURCE_VERIFIED |
| BW-FEED-005 | MEDIUM | vc.actor_onboarding_steps write RLS unverified — DB review required | NOT_VERIFIABLE_SOURCE_MISSING |
| BW-FEED-006 | LOW | 60s stale follow/block cache may serve incorrect visibility decisions | STILL_OPEN_SOURCE_VERIFIED |
| BW-FEED-007 | MEDIUM | Share URL constructed with raw UUID postId — platform invariant violation | STILL_OPEN_SOURCE_VERIFIED |

**New findings from 2026-06-06 re-verify:**

| Finding ID | Severity | Description | Status |
|---|---|---|---|
| VEN-FEED-007 | MEDIUM | filterDebugRows with private profile flags stored in production React Query cache | NEW |
| VEN-FEED-008 | MEDIUM | Unconditional @debuggers imports in production-facing modules — bundle risk | NEW |
| VEN-FEED-009 | HIGH | useFeed.adapter.js frozen on legacy hook — adapter boundary integrity failure | NEW |

Output: ZZnotforproduction/APPS/VCSM/features/feed/outputs/2026/06/06/VENOM/2026-06-06_venom_feed-security-reverify.md
Prior run: ZZnotforproduction/APPS/VCSM/features/feed/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_feed-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-06
ELEKTRA Status: COMPLETE (re-verify — BLIND_REVERIFY_MODE)
ELEKTRA Recommendation: CAUTION — BLOCKED

Re-verify summary: 2 HIGH, 3 MEDIUM, 0 LOW, 1 INFO — 3 false positives rejected, 6 patches proposed

**THOR Blockers confirmed by ELEKTRA:**

| Finding ID | Severity | Description | Status |
|---|---|---|---|
| ELEK-2026-06-06-001 | HIGH | IDOR — ctrlMarkWelcomeCardSeen no session binding; actorId accepted from caller; sole backstop is unverified RLS | Open — CARNAGE required |
| ELEK-2026-06-06-002 | HIGH | Auth/Session — logout() missing queryClient.clear(); private filterDebugRows persists in React Query cache for gcTime:10min | Open — IRONMAN patch required |

**Open findings (MEDIUM / INFO):**

| Finding ID | Severity | Description | Status |
|---|---|---|---|
| ELEK-2026-06-06-003 | MEDIUM | includeDebug: true unconditional in pipeline — private post metadata in production React Query cache | Open — IRONMAN (SIMPLE patch) |
| ELEK-2026-06-06-004 | MEDIUM | Raw UUID postId in share URL — platform invariant violation; enumeration risk | Open — IRONMAN + slug DAL |
| ELEK-2026-06-06-005 | MEDIUM | viewerActorId validated but discarded in listActorPosts — illusory auth guard; RLS sole defence (unverified) | Open — CARNAGE required |
| ELEK-2026-06-06-006 | INFO | Unconditional @debuggers imports in pipeline/hook/screen — bundle hygiene concern | Open — IRONMAN (verify sideEffects) |

**False Positives Rejected (3):**
- FP-001: console.log in pipeline:137 (prior VEN-FEED-002) — CLOSED_SOURCE_VERIFIED, triple DEV guard confirmed
- FP-002: debug privacy controller in production (prior BW-FEED-008 THOR blocker) — CLOSED_SOURCE_VERIFIED, three-layer DEV protection confirmed
- FP-003: @debuggers imports escalated to HIGH — downgraded to INFO; Vite tree-shaking confirmed via call-site analysis

Output: ZZnotforproduction/APPS/VCSM/features/feed/outputs/2026/06/06/ELEKTRA/2026-06-06_elektra_feed-security-reverify.md

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-06
BLACKWIDOW Status: COMPLETE (re-verify — BLIND_REVERIFY_MODE)
BLACKWIDOW Recommendation: CAUTION

Re-verify summary: 0 CRITICAL, 3 HIGH open (incl. 1 DB-pending), 3 MEDIUM open, 2 LOW open — 2 findings CLOSED, 3 NEW findings

**Closed this run (source-verified):**

| Finding ID | Severity | Description | Status |
|---|---|---|---|
| BW-FEED-003 | MEDIUM | getDebugPrivacyRowsController no production gate — three-layer DEV protection confirmed | CLOSED_SOURCE_VERIFIED |
| BW-FEED-008 | HIGH | **THOR BLOCKER RESOLVED** — getDebugPrivacyRowsController exposes privacy in production | CLOSED_SOURCE_VERIFIED |

**Open findings:**

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-FEED-001 | HIGH | ctrlMarkWelcomeCardSeen — ownership bypass: any actorId accepted, no session binding | BYPASSED (app) / ASSUMED BLOCKED (RLS) | STILL_OPEN_SOURCE_VERIFIED |
| BW-FEED-002 | MEDIUM | Feed hooks delegate actorId from caller — session binding by convention only | PARTIAL | STILL_OPEN_SOURCE_VERIFIED |
| BW-FEED-004 | LOW | actorId passed as userId in debug controller — DEV-only context | BYPASSED (DEV) | STILL_OPEN_SOURCE_VERIFIED |
| BW-FEED-005 | MEDIUM | vc.actor_onboarding_steps write RLS — cannot verify from source | UNRESOLVED | NOT_VERIFIABLE_SOURCE_MISSING |
| BW-FEED-006 | LOW | 60s stale block cache — self-block invalidates; incoming block = 60s stale window | PARTIAL | STILL_OPEN_SOURCE_VERIFIED |
| BW-FEED-007 | MEDIUM | Share URL raw UUID — destination properly re-verifies via checkPostVisibilityDAL; UUID + oracle inference remain | PARTIAL | STILL_OPEN_SOURCE_VERIFIED |

**New findings from 2026-06-06 re-verify:**

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-FEED-NEW-001 | MEDIUM | Logout does not clear React Query cache — session residue with private data persists gcTime:10min | BYPASSED | NEW |
| BW-FEED-NEW-002 | HIGH | Profile posts tab (listActorPosts) has no app-layer visibility model — private posts potentially exposed; RLS sole defense (UNVERIFIED) | PARTIAL | NEW |
| BW-FEED-NEW-003 | MEDIUM | filterDebugRows with private profile flags in production React Query cache — readable via DevTools | BYPASSED | NEW |

Output: ZZnotforproduction/APPS/VCSM/features/feed/outputs/2026/06/06/BLACKWIDOW/2026-06-06_blackwidow_feed-adversarial-reverify.md
Prior run: ZZnotforproduction/APPS/VCSM/features/feed/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_feed-adversarial-review.md
