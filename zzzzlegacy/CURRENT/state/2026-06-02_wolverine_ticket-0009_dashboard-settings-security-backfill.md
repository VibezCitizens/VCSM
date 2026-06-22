# HISTORY — WOLVERINE Run Artifact
# ticket: TICKET-0009
# command: WOLVERINE
# feature: dashboard / settings card
# date: 2026-06-02
# run-by: session
# updates-current: yes
# current-file: CURRENT/features/dashboard/SECURITY.md, CURRENT_STATUS.md
# supersedes: none
# status: COMPLETE

---

## TICKET-0009 — SETTINGS-ARCH-001 + SETTINGS-RISK-001 + Dashboard Security Backfill

**Scope:** VCSM / Dashboard / Settings card
**Type:** Architecture boundary fix + documentation security backfill
**Date:** 2026-06-02

---

## Pre-Flight Findings (Read-Only Discovery)

Before any code was written, two findings from the planning artifacts were verified as already resolved:

| Finding | Expected | Actual |
|---|---|---|
| SETTINGS-RISK-001: `ctrlSetVportBusinessCardPublishState` missing ownership gate | OPEN | RESOLVED — `assertActorOwnsVportActorController` present on line 7 |
| VENOM-SETTINGS-001 (partial): DAL exported from `index.js` | OPEN | RESOLVED — DAL not in current index.js |

Remaining work scoped down to: coordinator creation + controller export removal + SECURITY.md backfill.

---

## Phase 1 — settingsCoordinator.controller.js (CREATED)

**File:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/controller/settingsCoordinator.controller.js`

Owns validation orchestration for the settings save path. Accepts `{ actorId, callerActorId, draft, invalidateVportPublicDetails }`. Validates address/phone using model functions. Returns `{ ok: false, error }` on validation failure. On success: delegates to `saveVportPublicDetailsByActorIdController`. Returns `{ ok: true, result }`.

Adds no new business logic. Validation messages preserved exactly.

---

## Phase 2 — useSaveVportSettings.js (EDITED)

**File:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/hooks/useSaveVportSettings.js`

**Removed:**
- Import of `useSaveVportPublicDetailsByActorId`
- Import of all validation functions (normalizeAddress, hasAnyAddressValue, hasCompleteAddress, getAddressValidationError, normalizePhoneDigits, US_PHONE_DIGITS)
- Inline validation block (~15 lines from `onSave`)
- Inline payload construction (moved to coordinator)

**Added:**
- Import of `settingsSaveCoordinator`
- Import of `useProfilesOps` (for `invalidateVportPublicDetails`)
- Import of `useIdentity` (for `callerActorId`)
- `onSave` calls coordinator; handles `{ ok, error }` / `{ ok, result }` response

**Behavior preserved:**
- Toast messages identical (validation error messages unchanged in coordinator)
- saving/saved/error state lifecycle unchanged
- Draft cityId sync on save preserved
- isOwner / loadingData guards unchanged
- closeToast unchanged
- Return shape unchanged (draft, saving, saved, error, toastOpen, toastMessage, onChange, onSave, closeToast)

---

## Phase 3 — index.js (EDITED)

**File:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/index.js`

**Removed:**
```
// Controller
export * from "./controller/saveVportPublicDetailsByActorId.controller";
```

**Verification:** grep confirmed zero external callers imported this controller through the settings index. Only `useSaveVportPublicDetailsByActorId.js` (inside the card) imports the controller — by direct path, not through index.

---

## Phase 4 — Verification Results

| Check | Result |
|---|---|
| grep "dal" in settings/index.js | 0 matches — CLEAN |
| grep "controller" in settings/index.js | 0 matches — CLEAN |
| External callers importing controller through settings index | 0 found — CLEAN |
| Validation functions in useSaveVportSettings.js | 0 found — CLEAN |
| Validation functions in settingsCoordinator.controller.js | PRESENT — coordinator owns them |

No existing tests found for settings card. Static verification performed. Coordinator behavior is structurally equivalent to the prior inline validation path — same functions, same messages, same delegate.

---

## Phase 5 — SECURITY.md Backfill

**Created:** `CURRENT/features/dashboard/SECURITY.md`

Evidence sources:
- `SETTINGS_SECURITY_ARCHITECTURE.md` (TICKET-0004 artifact)
- Direct source read of `vportDirectoryVisibility.controller.js` (confirmed ownership gate)
- Direct source read of `vports.write.dal.js` (confirmed auth.getUser() + owner_user_id check)
- Direct source read of `vportBusinessCard.controller.js` (confirmed ELEK-001 resolved)

Security findings documented:
- VENOM-SETTINGS-001: RESOLVED
- VENOM-SETTINGS-002: RESOLVED (prior CARNAGE migration)
- VENOM-SETTINGS-003: NEEDS_REVIEW (legacy DAL pattern, non-blocking)
- VENOM-SETTINGS-004: DEFERRED (P2 CARNAGE migration)
- ELEK-001: RESOLVED
- ELEK-002: DEFERRED
- ELEK-004: DEFERRED

---

## CURRENT Files Updated

| File | Update |
|---|---|
| CURRENT/features/dashboard/SECURITY.md | CREATED — trust boundary, all findings, pending audit notice |
| CURRENT/features/dashboard/CURRENT_STATUS.md | TICKET-0009 summary section appended |

---

## Unrelated Cards Touched

**NONE.** Only settings card files modified. Schedule, booking, gas, portfolio, exchange, locksmith, calendar, leads, reviews, services, team cards were not touched.

---

## Remaining Debt After TICKET-0009

| Item | Priority | Owner |
|---|---|---|
| useVportOwnerSchedule.js hook split | P1 | DEFER-DASH-001 |
| VENOM-SETTINGS-003: DAL legacy pattern migration | P2 | CARNAGE |
| VENOM-SETTINGS-004: listMyVportsDAL | P2 | CARNAGE |
| ELEK-002: ctrlSetActorPrivacy | TBD | Separate sprint |
| ELEK-004: dalSetActorPrivacy | TBD | Separate sprint |
| Full VENOM/ELEKTRA post-implementation pass | RECOMMENDED | Next sprint |

---

## SENTRY Required

SENTRY post-execution review is required. Changed files:
- `settingsCoordinator.controller.js` (new controller)
- `useSaveVportSettings.js` (hook boundary change)
- `index.js` (public adapter export change)

---

*This file is immutable. Do not edit after 2026-06-30.*
