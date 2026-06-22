[TICKET-DASHBOARD-ARCHITECT-0001] Dashboard Architecture Audit

Boundary Contract

Load and enforce:

/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/zcontract/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md

Read first:

CURRENT/platform/documentation/codex-context/CODEX.md

Feature:

dashboard

Category Key:

dashboard

Governance Root:

/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/CURRENT/features/dashboard

Source Root:

/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/dashboard

Command Role:

ARCHITECT

Scope:

READ ONLY

Do NOT modify source code.
Do NOT modify engines.
Do NOT modify migrations.
Do NOT use git.
Do NOT move files.
Do NOT delete files.
Do NOT rename files.

Goal

Perform a full ARCHITECT architecture audit of the Dashboard feature.

Determine:

- dashboard architecture maturity
- dashboard shell architecture
- card/module architecture
- tab architecture
- controller boundaries
- DAL boundaries
- adapter boundaries
- dashboard-to-feature dependencies
- write-surface architecture
- source/runtime drift
- module naming drift
- dead code
- architecture risks
- release risks

============================================================
PHASE 1 — GOVERNANCE READ
============================================================

Read:

CURRENT/features/dashboard/

Required:

README.md
CURRENT_STATUS.md
SECURITY.md
ARCHITECTURE.md
OWNERSHIP.md
TESTS.md
PERFORMANCE.md
BLOCKERS.md
DEFERRED.md
HISTORY_INDEX.md
DR_STRANGE.md

Also read:

CURRENT/FEATURE_INDEX/dashboard.md
CURRENT/FEATURE_INDEX_RUNTIME/dashboard.md

Read dashboard subareas:

CURRENT/features/dashboard/modules/**
CURRENT/features/dashboard/tabs/**
CURRENT/features/dashboard/governance/**

Output:

| Governance File | Exists | Quality | Notes |
|---|---|---|---|

============================================================
PHASE 2 — SOURCE INVENTORY
============================================================

Scan:

apps/VCSM/src/features/dashboard

Inventory:

- routes
- screens
- final screens
- views
- components
- cards
- modules
- tabs
- hooks
- controllers
- models
- DALs
- RPCs
- adapters
- tests

Also inventory dashboard card folders:

- bookings / booking
- schedule
- calendar
- settings
- team
- gasprices / gas
- leads
- portfolio
- flyerBuilder / flyer-builder
- reviews
- services
- locksmith
- exchange
- qrcode
- menu
- subscribers

Output:

| Layer | Count | Notes |
|---|---|---|

============================================================
PHASE 3 — DASHBOARD FLOW MAP
============================================================

Map:

Dashboard route
 ↓
Final screen
 ↓
ownership gate
 ↓
dashboard shell
 ↓
card registry
 ↓
card/module screen
 ↓
controller / DAL / feature adapter

Also map:

Settings card
Booking card
Schedule card
Flyer builder
Gas card
Team card
Portfolio card
Public/menu/review related cards

Output:

Architecture diagram.

============================================================
PHASE 4 — BOUNDARY REVIEW
============================================================

Verify:

Rule 1
Rule 2
Rule 3
Rule 4
Rule 5
Rule 6
Rule 7
Rule 8
Rule 9
Rule 10
Rule 11
Rule 13
Rule 14

Determine:

- DAL exports
- controller exports
- public adapter violations
- dashboard card index violations
- direct DAL imports
- cross-feature imports
- ownership gate placement
- hook business logic
- component directory hook violations
- screen split violations
- cache invalidation violations

Special focus:

- bookings/index.js Rule 9 violation
- flyerBuilder write path / BW-SETTINGS-002
- settings coordinator compliance
- schedule coordinator compliance
- gas cache invalidation
- portfolio hook location / adapter violations

Output:

| Rule | PASS | FAIL | Notes |
|---|---|---|---|

============================================================
PHASE 5 — MODULE / CARD REVIEW
============================================================

For each dashboard module/card determine:

- source exists
- CURRENT module docs exist
- DR_STRANGE.md exists
- architecture status
- security status
- write surfaces
- test coverage
- next command

Output:

| Module | Source Exists | CURRENT Exists | Status | Risk |
|---|---|---|---|---|

============================================================
PHASE 6 — DEPENDENCY REVIEW
============================================================

Trace dependencies between dashboard and:

booking
public
profiles
vport
settings
upload
media
notifications
actors
identity
team
social

Determine:

- dependency direction
- cyclic dependencies
- forbidden dependency direction
- adapter use vs direct imports
- dashboard module naming drift
- duplicated logic

Output:

| Dependency | Status | Notes |
|---|---|---|

============================================================
PHASE 7 — SECURITY-SENSITIVE SURFACES
============================================================

Inventory dashboard write surfaces:

- booking create/update/cancel
- schedule coordination
- settings save
- directory visibility
- business card publish/settings
- flyer builder save
- portfolio upload
- gas price submission/review
- team invite/remove
- leads read/write
- menu/content/delete lifecycle if present
- reviews moderation if present

Determine:

- auth enforcement
- ownership enforcement
- controller gate
- DAL exposure
- RLS/RPC dependency
- bypass channels

Output:

| Surface | Risk | Notes |
|---|---|---|

============================================================
PHASE 8 — OPEN FINDING TRACE
============================================================

Trace source/governance evidence for:

- TICKET-DASH-BOOKINGS-RULE9
- TICKET-FLYER-VENOM-001 / BW-SETTINGS-002
- TICKET-BOOKING-RPC-001
- DEFER-DASH-001
- DEFER-DASH-004
- DEFER-DASH-005
- DEFER-DASH-006
- DEFER-DASH-007
- DEFER-DASH-008
- DEFER-DASH-009

Output:

| Finding | Source Evidence | Architecture Impact |
|---|---|---|

============================================================
PHASE 9 — SOURCE HEALTH
============================================================

Find:

- dead code
- orphan DALs
- orphan controllers
- unused hooks
- duplicate dashboard logic
- stale compatibility adapters
- module naming drift
- architecture drift
- oversized screens/views
- untested write paths

Output:

| File | Issue | Severity |
|---|---|---|

============================================================
PHASE 10 — TEST COVERAGE REVIEW
============================================================

Determine:

- source files
- test files
- missing dashboard shell tests
- missing card tests
- missing settings coordinator tests
- missing booking Rule 9 regression tests
- missing flyer builder ownership tests
- missing schedule tests
- missing public/menu/review card tests

Output:

| Area | Coverage |
|---|---|

============================================================
PHASE 11 — PERFORMANCE REVIEW
============================================================

Since KRAVEN is not run, identify architecture-visible performance risks:

- repeated DB reads
- unbounded list rendering
- cache invalidation issues
- duplicated hooks
- expensive dashboard mounts
- realtime/subscription overhead if present

Output:

| Area | Performance Risk |
|---|---|

============================================================
PHASE 12 — ARCHITECT VERDICT
============================================================

Score:

Architecture
Dependencies
Boundaries
Module Coverage
Security Surfaces
Source Health
Tests
Performance Risk

Output:

| Category | Score |
|---|---|

Determine:

READY
CAUTION
BLOCKED

============================================================
PHASE 13 — CURRENT UPDATE PLAN
============================================================

Do NOT edit files.

Identify what would need updating:

ARCHITECTURE.md
CURRENT_STATUS.md
SECURITY.md if architecture findings affect trust boundary
BLOCKERS.md
DEFERRED.md
FEATURE_INDEX_RUNTIME/dashboard.md
DR_STRANGE.md
affected module DR_STRANGE.md files

Output:

| File | Recommended Update |
|---|---|

============================================================
PHASE 14 — RECOMMENDED NEXT COMMAND
============================================================

Determine:

Should next be:

SENTRY
VENOM
ELEKTRA
BLACKWIDOW
SPIDER-MAN
IRONMAN
KRAVEN
CARNAGE
DB
THOR

Provide reasoning.

============================================================
FINAL REPORT
============================================================

Return:

1. Governance status
2. Source inventory
3. Dashboard architecture map
4. Boundary violations
5. Module/card status
6. Dependency risks
7. Security-sensitive surfaces
8. Open finding trace
9. Dead/orphan code
10. Test coverage
11. Performance risks
12. Architecture score
13. Recommended next ticket
14. Recommended next command

Final Verdict:

ARCHITECT_DASHBOARD_COMPLETE

Success Criteria

✓ Governance reviewed
✓ Source inventory built
✓ Dashboard flow mapped
✓ Boundaries verified
✓ Modules/cards reviewed
✓ Dependencies verified
✓ Security surfaces reviewed
✓ Open findings traced
✓ Test coverage reviewed
✓ Performance risks reviewed
✓ Architecture score produced
✓ No files modified
✓ Ready for SENTRY / VENOM / SPIDER-MAN / KRAVEN decision