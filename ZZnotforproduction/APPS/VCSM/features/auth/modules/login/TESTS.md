---
title: Login Module — Tests
owner: SPIDER-MAN
feature: auth
module: login
updated: 2026-06-06
---

# auth / modules / login — TESTS

SPIDER-MAN is the sole owner of this file. Do not edit outside of SPIDER-MAN execution.

---

## Test Files

| File | Runner | Environment | Status |
|---|---|---|---|
| `apps/VCSM/src/features/auth/hooks/__tests__/useLogin.security.test.js` | Vitest 4.1.7 | node | ACTIVE |

---

## Run Command

```sh
cd apps/VCSM && npx vitest run src/features/auth/hooks/__tests__/useLogin.security.test.js
```

---

## Coverage Summary

### TICKET-AUTH-LOGIN-SECURITY-001 Batch 1 (2026-06-06)

30 tests across 5 suites.

| Suite | Coverage Target | Tests | Result |
|---|---|---|---|
| Suite 1: `resolveCooldown` tier boundaries | TESTREQ-LOGIN-001 | 8 | PASS |
| Suite 2: `LOGIN_SAFE_ERROR` message safety | TESTREQ-LOGIN-002 | 6 | PASS |
| Suite 3: `canSubmit` formula gate | TESTREQ-LOGIN-004 | 9 | PASS |
| Suite 4: `submittingRef` double-submit guard | TESTREQ-LOGIN-005 | 3 | PASS |
| Suite 5: Cumulative cooldown accumulation | TESTREQ-LOGIN-006 | 4 | PASS |

Report: `outputs/2026/06/06/SPIDER-MAN/2026-06-06_spiderman_login-security-001.md`

---

## Coverage Gaps (DOM_REQUIRED)

Require `jsdom` + `@testing-library/react` — not installed (vitest runs in `node` environment).

| Gap ID | Description | Ticket |
|---|---|---|
| DOM-GAP-001 | cooldownSeconds countdown via useEffect (setTimeout) | — |
| DOM-GAP-002 | setError(LOGIN_SAFE_ERROR) rendered in LoginScreen | — |
| DOM-GAP-003 | failedAttemptsRef + cooldownSeconds reset on success via hook state | — |
| DOM-GAP-004 | navigate() called with correct destination | — |
| DOM-GAP-005 | setLoading(false) releasing button in finally | — |

Adding DOM test infrastructure is a separate infrastructure ticket.

---

## Testability Notes

`resolveCooldown` and `LOGIN_SAFE_ERROR` are exported from `useLogin.js` solely to enable node-environment testing. These exports have no production consumers other than the hook itself.

`@debuggers/identity` is not in vitest.config.js aliases — must be mocked with `vi.mock('@debuggers/identity', ...)` in every test file that imports from `useLogin.js`.
