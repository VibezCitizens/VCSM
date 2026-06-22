# VPORT Tabs — Deferred Open Items

**Last Updated:** 2026-05-27

Known issues and technical debt items intentionally deferred. Each item has a priority, risk level, and unblock condition.

---

## Format

Each entry: ID · Summary · Severity · Risk · Origin · Unblock Condition · Status

---

## Architecture / Structure

### DTAB-001 — Duplicate tab resolution: `vportTypeRegistry.js` vs `getVportTabsByType.model.js`

| Field | Value |
|---|---|
| ID | DTAB-001 |
| Severity | MEDIUM |
| Risk | Drift — two sources of truth for tab-to-type mapping |
| Origin | Detected in registry scan, 2026-05-27 |
| Affected Files | `features/profiles/kinds/vport/vportTypeRegistry.js` AND `features/profiles/kinds/vport/model/getVportTabsByType.model.js` |
| Status | **CONFIRMED** — ARCHITECT audit complete 2026-05-27 |
| ARCHITECT Report | `governance/architect/2026-05-27_architect_vport-dtab-001-duplicate-registry.md` |

**Confirmed Findings (ARCHITECT 2026-05-27):**
- `getVportTabsByType.model.js` is CANONICAL — imported by `VportProfileViewScreen.jsx` (line 22)
- `vportTypeRegistry.js` is LEGACY — only 1 importer: `apps/VCSM/src/dev/diagnostics/groups/profilesKindsFeature.group.js` (dev-only)
- Key divergence: "Beauty & Wellness" → wrong preset in registry (`VPORT_SERVICE_TABS` vs canonical `VPORT_SERVICE_BOOK_TABS` — missing `book` tab)
- Registry missing 9 group entries and 3 type overrides (barber, barbershop, locksmith)

**Recommended Actions:**
1. Add deprecation comment to `vportTypeRegistry.js`
2. Update `profilesKindsFeature.group.js` to import from canonical model
3. Delete `vportTypeRegistry.js` after approval

**Unblock Condition:** Explicit approval to delete `vportTypeRegistry.js`

---

### DTAB-002 — `model/gas/getVportTabsByType.model.js` redirect shim

| Field | Value |
|---|---|
| ID | DTAB-002 |
| Severity | LOW |
| Risk | Dead code / import confusion |
| Origin | Detected in registry scan, 2026-05-27 |
| Affected Files | `features/profiles/kinds/vport/model/gas/getVportTabsByType.model.js` |
| Status | DEFERRED — P4 |

**Problem:** This file appears to be a path-alias shim pointing to the main `getVportTabsByType.model.js`. It serves no independent logic but may be imported by gas-station specific code paths. Could create confusion when the main model is updated.

**Unblock Condition:** ARCHITECT confirms no unique callers. Then delete or redirect cleanly.

---

### DTAB-003 — `VportReviewsView` may exist in two locations

| Field | Value |
|---|---|
| ID | DTAB-003 |
| Severity | MEDIUM |
| Risk | Duplicate component — divergent behavior risk |
| Origin | Registry scan detected both `screens/views/tabs/VportReviewsView.jsx` and `screens/review/VportReviewsView.jsx` |
| Status | UNVERIFIED — needs ARCHITECT confirmation |

**Problem:** Two files with the same component name in different directories. If both are wired differently, the reviews tab may behave differently depending on which import path `VportProfileTabContent.jsx` uses.

**Unblock Condition:** ARCHITECT reads both files; confirms which is active; eliminates the orphan.

---

## Security / Trust Boundaries

### DTAB-004 — `TAB_FLAGS` has no per-type granularity

| Field | Value |
|---|---|
| ID | DTAB-004 |
| Severity | MEDIUM |
| Risk | Blast radius — disabling one flag kills the tab for ALL 77 types |
| Origin | Code review of `profileTabs.config.js`, 2026-05-27 |
| Status | DEFERRED — P3 |

**Problem:** `TAB_FLAGS.BOOK = false` would remove the booking tab from every VPORT type simultaneously with no per-type control. There is no mechanism to disable a tab for one type but not another via flags.

**Unblock Condition:** Product decision on whether per-type feature flags are needed. If yes, ARCHITECT designs the per-type flag system before implementation.

---

### DTAB-005 — `isOwner` race condition on owner tab injection (RESOLVED)

| Field | Value |
|---|---|
| ID | DTAB-005 |
| Severity | LOW (downgraded from MEDIUM after VENOM audit) |
| Risk | Non-owner briefly sees owner tab during async ownership resolution |
| Origin | Code pattern observation in `VportProfileViewScreen.jsx`, 2026-05-27 |
| Status | **RESOLVED** — VENOM audit complete 2026-05-27; no race condition |
| VENOM Report | `governance/venom/2026-05-27_venom_vport-owner-tab.md` |

**VENOM Findings:**
- For visitors: `isDirectMatch` = `false` synchronously; `isOwner` is `false` throughout. No window.
- For owner: `isDirectMatch` = `true` synchronously; owner tab appears immediately, correctly.
- For multi-account owner: `isDirectMatch` may be `false`, brief loading window where tab is absent. This is correct — tabs should not appear before ownership is confirmed.
- **Conclusion:** No race condition exists. Default state is always safe.

**Remaining Open:** VENOM-OWNER-001 (LOW) — no test for double-gate rendering with isOwner=false.

---

## Adapter Gaps

### DTAB-006 — Tab container imports all sub-feature views directly (CONFIRMED — MODERATE DRIFT)

| Field | Value |
|---|---|
| ID | DTAB-006 |
| Severity | MEDIUM — MODERATE DRIFT |
| Risk | Sub-feature boundary erosion; refactoring fragility |
| Origin | Adapter gap analysis, 2026-05-27 |
| Status | **CONFIRMED** — ARCHITECT audit complete 2026-05-27 |
| ARCHITECT Report | `governance/architect/2026-05-27_architect_vport-dtab-006-adapter-boundary.md` |

**Confirmed Findings (ARCHITECT 2026-05-27):**
- `VportProfileTabContent.jsx` imports ALL 15 tab view components via direct `@/features/profiles/kinds/vport/screens/...` paths
- No consistent adapter boundary layer — only booking has a thin `screens/views/tabs/` wrapper; barbershop/gas/menu/etc. do not
- This is WITHIN the same protected root (`apps/VCSM/`) — not a cross-root violation
- MODERATE DRIFT per SENTRY standards; security risk: NONE; refactoring risk: MEDIUM

**Recommended Actions:**
- Option A: Extend `screens/views/tabs/` wrapper pattern to all sub-feature tab views
- Option B: Create `screens/views/tabs/index.js` barrel file as single import surface

**Unblock Condition:** Explicit approval to refactor; P2 — defer until booking/menu tab work begins

---

### DTAB-007 — Portfolio, menu, team, content tabs adapter boundary unverified

| Field | Value |
|---|---|
| ID | DTAB-007 |
| Severity | MEDIUM |
| Risk | Cross-feature internal imports in profile feature |
| Origin | Adapter audit gap, 2026-05-27 |
| Status | DEFERRED — grouped with booking adapter audit |

**Affected tabs:** portfolio, menu, team, content, vibes

**Unblock Condition:** Single SENTRY pass over `VportProfileTabContent.jsx` import chain maps all boundary crossings.

---

## Performance

### DTAB-008 — `KPF-001` — vport.profiles read twice per exchange rate publish

| Field | Value |
|---|---|
| ID | DTAB-008 |
| Origin Command | KRAVEN 2026-05-27 |
| Tab | `rates` |
| Severity | LOW |
| Priority | P3 |
| Status | DEFERRED |

**Problem:** `resolveVportProfileId` (cached, 30s TTL) resolves `profile_id` for the DAL write. `resolveVportExchangeNameDAL` separately queries `vport.profiles.name` for the system post — no shared resolver. The `vport.profiles` table is hit twice on the same request.

**Unblock Condition:** Unify into a single `resolveVportProfileFull(actorId)` helper that caches both `id` and `name`. Requires KRAVEN + SENTRY sign-off.

---

### DTAB-009 — `KPF-002` — Name + auth reads are sequential in publish controller

| Field | Value |
|---|---|
| ID | DTAB-009 |
| Origin Command | KRAVEN 2026-05-27 |
| Tab | `rates` |
| Severity | LOW |
| Priority | P3 |
| Status | DEFERRED |

**Problem:** `resolveVportExchangeNameDAL` and `auth.getUser()` are awaited sequentially in `publishExchangeRateUpdateAsPostController`. They are independent and could be parallelized with `Promise.all`.

**Unblock Condition:** Low-risk refactor — `Promise.all` both reads. Requires regression test update.

---

## Documentation

### DTAB-010 — `SF-001` — `mapVportRateRow` imported directly in screen

| Field | Value |
|---|---|
| ID | DTAB-010 |
| Origin Command | SENTRY 2026-05-27 |
| Tab | `rates` |
| Drift Level | MINOR DRIFT |
| Priority | P3 |
| Status | DEFERRED |

**Problem:** `VportDashboardExchangeScreen` imports `mapVportRateRow` directly from the model layer rather than through a model adapter. The expected adapter path: `features/profiles/adapters/kinds/vport/model/rates/vportRates.model.adapter.js`.

**Unblock Condition:** Create adapter file and update screen import.

---

### DTAB-011 — `SF-002` — `usePublishExchangeRatePost` imported directly in screen

| Field | Value |
|---|---|
| ID | DTAB-011 |
| Origin Command | SENTRY 2026-05-27 |
| Tab | `rates` (dashboard context) |
| Drift Level | MINOR DRIFT |
| Priority | P3 |
| Status | DEFERRED — pre-existing |

**Problem:** `VportDashboardExchangeScreen` imports `usePublishExchangeRatePost` directly from the hook's source rather than through a hook adapter. Expected adapter path: `features/profiles/adapters/kinds/vport/hooks/exchange/usePublishExchangeRatePost.adapter.js`.

**Unblock Condition:** Create adapter file and update screen import.

---

## Deferred Item Summary

| ID | Tab | Category | Severity | Priority | Status |
|---|---|---|---|---|---|
| DTAB-001 | ALL | Architecture | MEDIUM | P3 | **CONFIRMED** — safe to delete registry; awaiting approval |
| DTAB-002 | gas | Architecture | LOW | P4 | DEFERRED |
| DTAB-003 | reviews | Architecture | MEDIUM | — | UNVERIFIED |
| DTAB-004 | ALL | Architecture | MEDIUM | P3 | DEFERRED |
| DTAB-005 | owner | Security | LOW | — | **RESOLVED** — no race condition; VENOM 2026-05-27 |
| DTAB-006 | book | Architecture | MEDIUM | P2 | **CONFIRMED** — MODERATE DRIFT; all imports direct in tab container |
| DTAB-007 | portfolio/menu/team/content/vibes | Architecture | MEDIUM | P3 | DEFERRED |
| DTAB-008 | rates | Performance | LOW | P3 | DEFERRED |
| DTAB-009 | rates | Performance | LOW | P3 | DEFERRED |
| DTAB-010 | rates | Architecture | LOW | P3 | DEFERRED |
| DTAB-011 | rates | Architecture | LOW | P3 | DEFERRED |
| VENOM-BOOK-001 | book | Security | MEDIUM | P1 | **RESOLVED** — Partial unique index applied (2026-05-27). Migration: `20260527010000_vport_bookings_slot_collision_index.sql`. DAL 23505 handler in app + engine DALs. 22 regression tests added. |
| VENOM-BOOK-002 | book | Test coverage | MEDIUM | P1 | **RESOLVED** — 20 regression tests passing (2026-05-27) |
| VENOM-BOOK-003 | book | Security | LOW | P3 | OPEN — unsanitized text fields |
| VENOM-GAS-002 | gas | Architecture | LOW | P4 | OPEN — hook advisory `isOwner` naming |
| VENOM-OWNER-001 | owner | Test coverage | LOW | P4 | OPEN — no double-gate render test |
