# SPIDER-MAN Test Coverage Report

**Date:** 2026-05-27  
**Application Scope:** VCSM  
**Environment:** Node / Vitest  
**Reviewer:** SPIDER-MAN  
**Triggered by:** Wolverine (VPORT Subscribers full audit — VENOM BLOCKED)  
**Report path:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_11-31_spiderman_vport-subscribers-tests.md`

---

## Coverage Summary

| Metric | Value |
|---|---|
| **Test files created** | 4 |
| **Total tests written** | 98 |
| **Tests currently PASSING** | 81 |
| **Tests currently FAILING (intentional — regression stubs)** | 17 |
| **V-SUB-001 tests (CRITICAL)** | 6 — all failing until fix |
| **V-SUB-002 tests (CRITICAL)** | 6 — all failing until fix |
| **V-SUB-003 tests (HIGH)** | 4 — all failing until fix |
| **V-SUB-005 tests (MEDIUM)** | 1 — failing until fix |
| **Missing gate documentation test** | 1 — failing until design decision |
| **Existing correct behavior locked** | 81 — all passing |

---

## CI Test Gate Review

| Area | Current Status | Risk | Recommendation |
|---|---|---|---|
| Vitest runner | ACTIVE — `npm test` / `npx vitest run` | LOW | Already wired |
| Test include pattern | `src/**/__tests__/*.test.js` | LOW | New test files auto-included |
| Engine tests included | `../../engines/booking/src/**/__tests__/*.test.js` | LOW | Already wired |
| Failing regression tests in CI | **17 tests will FAIL** until security fixes land | CRITICAL | DO NOT merge without fixing V-SUB-001/002/003 |
| Coverage reporting | `vitest run --coverage` available | MEDIUM | No coverage gate set — add 80% controller gate |
| Test isolation | `vi.clearAllMocks()` in every `beforeEach` | LOW | Correct — no cross-test contamination |

---

## Missing Coverage Review

| File | Coverage Type Missing | Severity | Why It Matters |
|---|---|---|---|
| `social/friend/subscribe/controllers/follow.controller.js` | Controller/Security — ownership gate | CRITICAL | Anyone can follow as any actor |
| `social/friend/subscribe/controllers/unsubscribe.controller.js` | Controller/Security — ownership gate | CRITICAL | Force-unfollow + privacy cache bust |
| `social/friend/request/controllers/followRequests.controller.js` | Controller — ctrlListIncomingRequests gate | HIGH | Inbox read by any actor |
| `social/friend/subscribe/controllers/getFollowRelationshipState.controller.js` | Controller — integration | MEDIUM | Cross-actor state read; no auth |
| `profiles/kinds/vport/controller/subscribers/getSubscribers.controller.js` | Controller — access model | MEDIUM | Public vs owner access undefined |
| `social/friend/request/dal/actorFollows.dal.js` | DAL — console.error PII leak (V-SUB-007) | LOW | Actor IDs leak in error logs |
| `social/friend/request/dal/followRequests.dal.js` | DAL — status enum (V-SUB-006) | MEDIUM | Arbitrary strings written to DB |
| `social/friend/subscribe/dal/subscriberCount.dal.js` | DAL — missing schema prefix (V-SUB-008) | LOW | Wrong RPC vs VPORT-specific DAL |
| `profiles/kinds/vport/screens/views/tabs/VportSubscribersView.jsx` | Component — route building (V-SUB-004) | HIGH | Raw UUID in public URL |

---

## Regression Protection Review

| Issue | Protected By Test? | Risk | Recommendation |
|---|---|---|---|
| ctrlSubscribe: anyone can follow as any actor | ✅ YES — 6 tests (currently failing) | CRITICAL | Fix V-SUB-001, tests will go green |
| ctrlUnsubscribe: anyone can unfollow any actor | ✅ YES — 6 tests (currently failing) | CRITICAL | Fix V-SUB-002, tests will go green |
| ctrlUnsubscribe: privacy cache bust on spoofed call | ✅ YES — dedicated test | CRITICAL | Covered by V-SUB-002 gate test |
| ctrlListIncomingRequests: any actor reads any inbox | ✅ YES — 4 tests (currently failing) | HIGH | Fix V-SUB-003, tests will go green |
| ctrlAcceptFollowRequest: assertingActorId gate | ✅ YES — 4 tests passing ✓ | CRITICAL | Already correct — locked |
| ctrlDeclineFollowRequest: assertingActorId gate | ✅ YES — 4 tests passing ✓ | CRITICAL | Already correct — locked |
| ctrlCancelFollowRequest: assertingActorId gate | ✅ YES — 4 tests passing ✓ | CRITICAL | Already correct — locked |
| ctrlSendFollowRequest: self-follow, block, idempotency | ✅ YES — 7 tests passing ✓ | MEDIUM | Correct — locked |
| getSubscribersController: null actorId early return | ✅ YES — 4 tests passing ✓ | LOW | Correct — locked |
| getSubscribersController: null/undefined DAL response | ✅ YES — 4 tests passing ✓ | MEDIUM | Correct — locked |
| notification linkPath raw UUID (V-SUB-005) | ✅ YES — 1 test (currently failing) | MEDIUM | Fix V-SUB-005, test will go green |
| dalInsertFollow error propagation + followDecision | ✅ YES — 2 tests passing ✓ | MEDIUM | Correct — locked |
| Already-following short-circuit (no extra DB writes) | ✅ YES — 3 tests passing ✓ | LOW | Correct — locked |
| Private account → request path (no dalInsertFollow) | ✅ YES — 4 tests passing ✓ | MEDIUM | Correct — locked |
| Request idempotency (pending/accepted early return) | ✅ YES — 2 tests passing ✓ | MEDIUM | Correct — locked |

---

## Test Ownership Review

| Area | Test Owner | Status |
|---|---|---|
| ctrlSubscribe ownership gate | SPIDER-MAN (written 2026-05-27) | ASSIGNED |
| ctrlSubscribe behavioral paths | SPIDER-MAN (written 2026-05-27) | ASSIGNED |
| ctrlUnsubscribe ownership gate | SPIDER-MAN (written 2026-05-27) | ASSIGNED |
| ctrlUnsubscribe behavioral paths | SPIDER-MAN (written 2026-05-27) | ASSIGNED |
| ctrlAcceptFollowRequest gate | SPIDER-MAN (written 2026-05-27) | ASSIGNED |
| ctrlDeclineFollowRequest gate | SPIDER-MAN (written 2026-05-27) | ASSIGNED |
| ctrlCancelFollowRequest gate | SPIDER-MAN (written 2026-05-27) | ASSIGNED |
| ctrlListIncomingRequests gate | SPIDER-MAN (written 2026-05-27) | ASSIGNED |
| ctrlSendFollowRequest guards | SPIDER-MAN (written 2026-05-27) | ASSIGNED |
| getSubscribersController paths | SPIDER-MAN (written 2026-05-27) | ASSIGNED |
| VportSubscribersView route building (V-SUB-004) | UNASSIGNED | MISSING |
| DAL-level enum validation (V-SUB-006) | UNASSIGNED | MISSING |
| DAL schema prefix (V-SUB-008) | UNASSIGNED | MISSING |
| Hook layer (useSubscribeAction.js) | UNASSIGNED | MISSING |

---

## Critical Untested Flows

### 1. VportSubscribersView.buildSubscriberActor route builder
**Finding:** Raw actorId UUID used in VPORT and profile routes (V-SUB-004)  
**Test type needed:** Component / model unit test  
**File:** `screens/views/tabs/VportSubscribersView.jsx`  
**Current state:** 0 tests. No `__tests__` directory for screen files.

### 2. dalUpdateRequestStatus status enum validation
**Finding:** Arbitrary string values accepted for `status` column (V-SUB-006)  
**Test type needed:** Controller-level (test that only valid enum values are accepted)  
**Current state:** 0 tests. The status values 'accepted', 'declined', 'cancelled', 'revoked', 'pending' are implicit.

### 3. useSubscribeAction hook
**Finding:** Calls `ctrlSubscribe` with `actionActorId` from props (not from session) — ownership gap duplicated at hook layer  
**Test type needed:** Hook test (requires jsdom environment)  
**Current state:** 0 tests.

---

## SPIDER-MAN TEST FINDINGS

---

### SM-SUB-001

- **Finding ID:** SM-SUB-001
- **File / Flow:** `social/friend/subscribe/controllers/follow.controller.js` → ctrlSubscribe
- **Application Scope:** VCSM
- **Coverage Type:** CONTROLLER / REGRESSION
- **Coverage Status:** PARTIAL (behavioral paths covered; ownership gate not yet in code)
- **Severity:** CRITICAL
- **Evidence Type:** OBSERVED (test run confirmed 6 failures)
- **Confidence:** HIGH
- **Current Protection:** NONE — no ownership gate test existed before this session
- **Missing Protection:** Session ownership verification (`assertingActorId`)
- **Regression Risk:** Without these tests any future refactor could silently re-break the gate after it's added
- **Recommended Tests:** 6 tests written — `[V-SUB-001 REGRESSION]` block in `follow.controller.test.js`
- **Recommended Owner:** Wolverine (implement fix) → SPIDER-MAN (tests go green)
- **Release Impact:** BLOCKED — these 6 tests will fail in CI until V-SUB-001 is resolved
- **Recommended Handoff:** VENOM (track fix implementation)

---

### SM-SUB-002

- **Finding ID:** SM-SUB-002
- **File / Flow:** `social/friend/subscribe/controllers/unsubscribe.controller.js` → ctrlUnsubscribe
- **Application Scope:** VCSM
- **Coverage Type:** CONTROLLER / REGRESSION
- **Coverage Status:** PARTIAL (behavioral paths covered; ownership gate not yet in code)
- **Severity:** CRITICAL
- **Evidence Type:** OBSERVED (test run confirmed 6 failures)
- **Confidence:** HIGH
- **Current Protection:** NONE
- **Missing Protection:** Session ownership verification + privacy cache blast protection
- **Regression Risk:** Privacy-critical: feed follow cache bust on victim actor without any gate
- **Recommended Tests:** 6 tests written — `[V-SUB-002 REGRESSION]` block in `unsubscribe.controller.test.js`
- **Recommended Owner:** Wolverine (implement fix) → SPIDER-MAN (tests go green)
- **Release Impact:** BLOCKED — 6 tests fail in CI until V-SUB-002 is resolved
- **Recommended Handoff:** VENOM (track fix implementation)

---

### SM-SUB-003

- **Finding ID:** SM-SUB-003
- **File / Flow:** `social/friend/request/controllers/followRequests.controller.js` → ctrlListIncomingRequests
- **Application Scope:** VCSM
- **Coverage Type:** CONTROLLER / REGRESSION
- **Coverage Status:** PARTIAL (existing accept/decline/cancel gates covered; list gate missing)
- **Severity:** HIGH
- **Evidence Type:** OBSERVED (test run confirmed 4 failures)
- **Confidence:** HIGH
- **Current Protection:** NONE
- **Missing Protection:** Session ownership verification on inbox read
- **Regression Risk:** Any actor can enumerate any actor's pending follow request inbox
- **Recommended Tests:** 4 tests written — `[V-SUB-003 REGRESSION]` block in `followRequests.controller.test.js`
- **Recommended Owner:** Wolverine (implement fix) → SPIDER-MAN (tests go green)
- **Release Impact:** BLOCKED — 4 tests fail in CI until V-SUB-003 is resolved
- **Recommended Handoff:** VENOM (track fix implementation)

---

### SM-SUB-004

- **Finding ID:** SM-SUB-004
- **File / Flow:** `VportSubscribersView.jsx` → `buildSubscriberActor()` route builder
- **Application Scope:** VCSM
- **Coverage Type:** COMPONENT / MODEL
- **Coverage Status:** MISSING
- **Severity:** HIGH
- **Evidence Type:** OBSERVED (code read confirmed raw UUID usage)
- **Confidence:** HIGH
- **Current Protection:** NONE
- **Missing Protection:** Route building tests to verify handle-based URLs
- **Regression Risk:** Raw UUID in VPORT/profile routes is visible to any user clicking subscriber links
- **Recommended Tests:** Unit test for `buildSubscriberActor()` helper — assert output doesn't contain raw actorId
- **Recommended Owner:** Wolverine (write tests after V-SUB-004 fix)
- **Release Impact:** HIGH — not CI-blocked currently, but V-SUB-004 fix needs this test to prevent regression
- **Recommended Handoff:** VENOM (V-SUB-004 fix), then SPIDER-MAN (component test)

---

### SM-SUB-005

- **Finding ID:** SM-SUB-005
- **File / Flow:** `follow.controller.js` + `followRequests.controller.js` → `publishVcsmNotification` linkPath
- **Application Scope:** VCSM
- **Coverage Type:** REGRESSION
- **Coverage Status:** PARTIAL (1 test written, will fail until V-SUB-005 fixed)
- **Severity:** MEDIUM
- **Evidence Type:** OBSERVED
- **Confidence:** HIGH
- **Current Protection:** NONE
- **Missing Protection:** linkPath must use handle/slug — test asserts no raw UUID
- **Recommended Tests:** 1 test written — `[V-SUB-005 REGRESSION]` block; add parallel test for `followRequests.controller.js` notification linkPath
- **Recommended Owner:** Wolverine (fix) → SPIDER-MAN (additional test for followRequests.controller.js)
- **Release Impact:** MEDIUM — 1 test fails in CI until resolved
- **Recommended Handoff:** VENOM

---

### SM-SUB-006

- **Finding ID:** SM-SUB-006
- **File / Flow:** `getSubscribersController` → no ownership/access model
- **Application Scope:** VCSM
- **Coverage Type:** CONTROLLER
- **Coverage Status:** PARTIAL (defensive path covered, access model stub written)
- **Severity:** MEDIUM
- **Evidence Type:** OBSERVED
- **Confidence:** HIGH
- **Current Protection:** NONE
- **Missing Protection:** Access model decision: public read or owner-only? 1 test stub written to document the gap
- **Recommended Tests:** 1 test written (failing stub). Once access model is decided, replace with typed assertions.
- **Recommended Owner:** IRONMAN (ownership design) → Wolverine (implement) → SPIDER-MAN (finalize test)
- **Release Impact:** LOW-MEDIUM — stub test fails in CI but is low-urgency vs V-SUB-001/002/003
- **Recommended Handoff:** IRONMAN

---

## Recommended Test Priorities

| Priority | Test File | Status | Action |
|---|---|---|---|
| P0 | `follow.controller.test.js` — V-SUB-001 block (6 tests) | RED — implement ownership gate | Wolverine: add `assertingActorId` to ctrlSubscribe |
| P0 | `unsubscribe.controller.test.js` — V-SUB-002 block (6 tests) | RED — implement ownership gate | Wolverine: add `assertingActorId` to ctrlUnsubscribe |
| P1 | `followRequests.controller.test.js` — V-SUB-003 block (4 tests) | RED — implement ownership gate | Wolverine: add `assertingActorId` to ctrlListIncomingRequests |
| P1 | `follow.controller.test.js` — V-SUB-005 block (1 test) | RED — implement slug linkPath | Wolverine: fix notification linkPath in follow + followRequests controllers |
| P2 | `VportSubscribersView` route builder | MISSING — write component test | After V-SUB-004 fix |
| P2 | `getSubscribers.controller.test.js` — missing gate stub | TBD — access model needed | IRONMAN decision first |
| P3 | DAL-level enum validation (V-SUB-006) | MISSING — write DAL test | Wolverine: add enum guard + test |
| P3 | useSubscribeAction hook | MISSING | After controller fixes |

---

## Handoff Matrix

| Finding | Recommended Handoff | Reason |
|---|---|---|
| SM-SUB-001 (V-SUB-001 tests) | VENOM + Wolverine | Security fix required before tests go green |
| SM-SUB-002 (V-SUB-002 tests) | VENOM + Wolverine | Security fix required before tests go green |
| SM-SUB-003 (V-SUB-003 tests) | VENOM + Wolverine | Security fix required before tests go green |
| SM-SUB-004 (route builder) | Wolverine | Write component test after V-SUB-004 fix |
| SM-SUB-005 (linkPath) | Wolverine | Fix + write followRequests linkPath test |
| SM-SUB-006 (access model) | IRONMAN | Ownership/access model design decision needed |

---

## Test Files Created

| File | Tests | Passing | Failing |
|---|---|---|---|
| `social/friend/subscribe/controllers/__tests__/follow.controller.test.js` | 33 | 27 | 6 (V-SUB-001 × 5, V-SUB-005 × 1) |
| `social/friend/subscribe/controllers/__tests__/unsubscribe.controller.test.js` | 18 | 12 | 6 (V-SUB-002 × 6) |
| `social/friend/request/controllers/__tests__/followRequests.controller.test.js` | 32 | 28 | 4 (V-SUB-003 × 4) |
| `profiles/kinds/vport/controller/subscribers/__tests__/getSubscribers.controller.test.js` | 15 | 14 | 1 (missing gate stub) |
| **TOTAL** | **98** | **81** | **17** |

---

## Final SPIDER-MAN Status

**BLOCKED**

17 intentional regression tests are currently FAILING — each corresponds to a known VENOM security finding that has not yet been remediated. The failing tests are not test bugs: they are the regression net. They will turn GREEN when Wolverine implements the ownership gates (V-SUB-001, V-SUB-002, V-SUB-003) and the linkPath fix (V-SUB-005).

**The CI must not be considered clean until all 17 pass.**

81 tests passing — all existing correct behavior (accept/decline/cancel gates, block checks, self-follow prevention, idempotency, cache invalidation paths) is now locked. These tests ensure no future refactor silently removes working security behavior.
