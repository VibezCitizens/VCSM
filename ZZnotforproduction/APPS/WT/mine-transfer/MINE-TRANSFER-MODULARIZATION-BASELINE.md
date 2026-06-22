# MINE-TRANSFER-MODULARIZATION-BASELINE
# Phase 1 — Baseline Audit

Ticket: MINE-TRANSFER-MODULARIZATION-MASTER-PLAN-001
Date: 2026-06-07
Status: COMPLETE (read-only)
Source: apps/WT/mine-transfer/src/

---

## 1. FOLDER MAP (src/ root)

```
src/
├── App.jsx                          ← app entry / route shell
├── main.jsx                         ← Vite entry point
├── sw.js                            ← service worker (generated)
├── uno.css                          ← UnoCSS entry
├── features/                        ← 6 feature modules (342 files)
│   ├── auth/                        (46 files)
│   ├── communication/               (140 files)
│   ├── dashboard/                   (126 files)
│   ├── services/                    (11 files)
│   ├── traze/                       (8 files)
│   └── trest/                       (11 files)
├── superadmin/                      ← standalone admin module (30 files)
├── styles/                          ← global CSS only (19 files)
└── learning/                        ← EMPTY directory
```

**Total source files: 391**

---

## 2. FEATURE/MODULE LIST

| Module | Path | Files | Has Adapters | Grade |
|--------|------|-------|--------------|-------|
| auth | features/auth/ | 46 | PARTIAL (adapter/ singular) | DRIFT |
| communication | features/communication/ | 140 | BROKEN (point to ghost paths) | NEEDS_REORG |
| dashboard | features/dashboard/ | 126 | MISSING | NEEDS_REORG |
| services | features/services/ | 11 | MISSING | MOSTLY_CLEAN |
| traze | features/traze/ | 8 | MISSING | DRIFT |
| trest | features/trest/ | 11 | MISSING | MOSTLY_CLEAN |
| superadmin | superadmin/ | 30 | MISSING | NEEDS_REORG |
| styles | styles/ | 19 | N/A (CSS only) | CLEAN |
| learning | learning/ | 0 | N/A | DELETE_CANDIDATE |

---

## 3. FILE COUNT PER MODULE

### auth (46 files)
```
adapter/          1  ← auth.adapter.js (exports 3 controller functions only)
components/       3
controllers/      10
dal/              9
hooks/            8
model/            4
screens/          6
styles/           1
ui/               1  ← index.js (empty auto-generated stub)
usecases/         1  ← index.js (empty auto-generated stub)
index.js          1
```

### communication (140 files)
```
adapters/                              5  ← ALL BROKEN: re-export from @/features/chat/ (ghost)
  adapters/conversation/dal/read/      2  ← nested dal inside adapters (wrong pattern)
  adapters/start/hooks/                1  ← nested hook inside adapters (wrong pattern)
conversation/adapters/                 3  ← nested adapters inside sub-module
conversation/components/               9
conversation/constants/                2
conversation/controllers/              12
conversation/dal/read/                 8
conversation/dal/write/                6
conversation/dal/realtime/             1
conversation/features/messages/        2
conversation/hooks/conversation/       9
conversation/hooks/realtime/           1
conversation/layout/                   1
conversation/lib/                      4
conversation/model/                    2  ← model/ (should be models/)
conversation/permissions/              3
conversation/realtime/                 1
conversation/screen/                   2  ← screen/ (should be screens/)
conversation/screen/handlers/          1
conversation/screen/selectors/         1
inbox/components/                      6
inbox/constants/                       2
inbox/controllers/                     4
inbox/dal/                             6
inbox/hooks/                           7
inbox/lib/                             1
inbox/model/                           2  ← model/ (should be models/)
inbox/realtime/                        1
inbox/screens/                         6
inbox/screens/settings/                2
start/controllers/                     4
start/dal/read/                        3
start/dal/rpc/                         2
start/hooks/                           1
start/models/                          3  ← models/ ✓ (correct naming here)
start/screens/                         1
debug/                                 1
styles/                                1
z/                                     2  ← dev notes (README.md + chat.md)
index.js                               1  ← still references @/features/chat/ (ghost)
```

### dashboard (126 files)
```
auth/                    3  ← ownerDashboardAccess.js (auth utility, no sub-module)
components/              3
controllers/             1
dal/                     4
governance/components/   4
governance/data/         1
governance/model/        1
governance/screens/      2
hooks/                   2
hub/screens/             1
mine-transfer/           12 ← sub-module named same as the app (confusing)
moderation/controllers/  3
moderation/dal/          5
moderation/hooks/        4
moderation/model/        3
moderation/screens/      5
model/                   1
screens/                 4
shared/components/       2
traze/components/        6
traze/controllers/       1
traze/dal/               2
traze/hooks/             9
traze/model/             5
traze/screens/           14
tripoint/controllers/    1
tripoint/dal/            1
tripoint/data/           1
tripoint/hooks/          1
tripoint/model/          1
tripoint/screens/        3
vcsm/controllers/        1
vcsm/dal/                2
vcsm/hooks/              1
vcsm/model/              1
vcsm/screens/            3
wentrex/controllers/     1
wentrex/dal/             1
wentrex/hooks/           1
wentrex/model/           1
wentrex/screens/         3
```

### services (11 files)
```
cloudflare/    3  (buildR2Key, uploadToCloudflare, index)
supabase/      7  (authSession, createOrgMember, createParent, postgrestSafe, supabaseClient, supabaseClient.debug, index)
index.js       1
```

### traze (8 files)
```
data/    7  (seedIntake.read, seedIntake.write, trazeCategory.repo, trazeLocation.repo, trazeProvider.mapper, trazeProvider.repo, vportProviderIndex.read)
model/   1  (seedIntake.model)
```

### trest (11 files)
```
components/    3
controllers/   2
dal/           1
hooks/         2
model/         1
screens/       2
```

### superadmin (30 files)
```
ROOT LEVEL (scattered — wrong):
  SuperAdminLayout.jsx          ← should be in screens/
  createTenantBootstrap.js      ← DUPLICATE of services/createTenantBootstrap.js
  listAllCourseSummaries.dal.js ← DUPLICATE of dal/listAllCourseSummaries.dal.js
  listAllOrganizationSummaries.dal.js ← DUPLICATE of dal/listAllOrganizationSummaries.dal.js
  listAllRealms.dal.js          ← DUPLICATE of dal/listAllRealms.dal.js
  superadmin.css                ← orphan CSS

PROPER STRUCTURE (should be canonical):
  components/       2
  controllers/      2
  dal/              3
  hooks/            1
  screens/          3
  services/         1
  create-tenant-function/index.ts  ← edge function source (not a feature file)

NESTED DUPLICATE (should be deleted):
  superadmin/superadmin/
    SuperAdminLayout.jsx          ← DUPLICATE
    components/                   2 (DUPLICATE)
    controller/                   2 (DUPLICATE — uses controller/ singular)
    hooks/                        1 (DUPLICATE)
    screens/                      1 (DUPLICATE — only 1 of 3 screens)
```

---

## 4. EXISTING ADAPTERS / PUBLIC APIs

### auth/adapter/auth.adapter.js (PARTIAL — adapter/ singular)
```js
export { getAuthUser, signInWithPassword, signOut }
  from "@/features/auth/controllers/login.controller"
```
Status: Only exports 3 of 10 controllers. No screens, components, or hooks exported.
Blocker: Folder is `adapter/` (singular) — must be renamed to `adapters/`.

### communication/adapters/ (BROKEN — all point to ghost @/features/chat/)
```
adapters/conversation/chatConversation.adapter.js  → @/features/chat/conversation/components/MessageMedia
adapters/inbox/chatInbox.adapter.js                → @/features/chat/inbox/hooks/*, components/*, lib/, model/, constants/
adapters/start/chatStart.adapter.js                → @/features/chat/start/screens/*, hooks/*
adapters/start/hooks/useStartConversation.adapter.js → @/features/chat/start/hooks/*
adapters/styles/chatStyles.adapter.js              → @/features/chat/styles/ (ghost)
adapters/conversation/dal/read/ (2 files)          → WRONG LOCATION (dal inside adapters)
```
Status: ALL adapters are broken. `@/features/chat/` does not exist.
Root cause: `chat` → `communication` directory rename was never completed.

### communication/index.js (BROKEN)
```js
// "Chat Feature Entry (STABLE MODE)"
import '@/features/chat/styles/chat-modern.css'  // ghost import
export { InboxScreen } from './inbox/screens/InboxScreen'
export { ConversationScreen } from './conversation/screen/ConversationScreen'
```

### communication/conversation/adapters/ (PARTIAL — nested inside sub-module)
```
MessageGroup.adapter.jsx  → imports from @/features/chat/conversation/controllers/ (ghost)
MessageList.adapter.jsx
MessageRow.jsx            ← not an adapter file, misnamed/misplaced
```

### dashboard: NO ADAPTERS (zero public API boundary)

### trest: NO ADAPTERS

### traze: NO ADAPTERS

### services: NO ADAPTERS

### superadmin: NO ADAPTERS

---

## 5. CONTROLLERS / SERVICES / DAL / DATA LAYERS

| Module | Controllers | DAL | Services | Notes |
|--------|------------|-----|----------|-------|
| auth | 10 | 9 | — | Well-structured internally |
| communication/conversation | 12 | 19 | — | Imports from ghost @/features/chat/ |
| communication/inbox | 4 | 6 | — | Imports from ghost @/features/chat/ |
| communication/start | 4 | 5 | — | Imports from ghost @/features/chat/ |
| dashboard (root) | 1 | 4 | — | Imports directly from sub-modules |
| dashboard/moderation | 3 | 5 | — | |
| dashboard/traze | 1 | 2 | — | Overlaps with features/traze |
| dashboard/tripoint | 1 | 1 | 1 (data/) | |
| dashboard/vcsm | 1 | 2 | — | |
| dashboard/wentrex | 1 | 1 | — | |
| trest | 2 | 1 | — | |
| traze | — | 7 | — | data/ only (no controllers) |
| superadmin | 2 | 3 | 1 | Root-level DAL duplicates exist |
| services | — | — | 10 | Infrastructure utilities |

---

## 6. HOOKS / COMPONENTS / SCREENS / ROUTES

| Module | Hooks | Components | Screens | Routes |
|--------|-------|------------|---------|--------|
| auth | 8 | 3 | 6 | via App.jsx |
| communication/conversation | 10 | 9 | 2 (screen/) | via dashboard |
| communication/inbox | 7 | 6 | 8 | via dashboard |
| communication/start | 1 | — | 1 | via dashboard |
| dashboard | 2 | 5 | 4 | via App.jsx |
| dashboard/moderation | 4 | — | 5 | via DashboardRouter |
| dashboard/traze | 9 | 6 | 14 | via DashboardRouter |
| dashboard/governance | — | 4 | 1 | via DashboardRouter |
| dashboard/mine-transfer | — | 8 | 1 | via DashboardRouter |
| trest | 2 | 3 | 1 | via App.jsx |
| superadmin | 1 | 2 | 3 | via App.jsx |

---

## 7. CROSS-MODULE IMPORTS

### 7a. Ghost Module Imports (CRITICAL — broken at build/runtime)

All of the following resolve to paths that do not exist in `src/`:

| Ghost Path | Import Count | Source Module | Root Cause |
|-----------|-------------|---------------|------------|
| `@/features/chat/` | 86 | communication/* | Incomplete chat→communication rename |
| `@/state/identity/identityContext` | 10 | communication/* | state/ dir missing from this WT copy |
| `@/shared/components/*` | 8 | communication/* | shared/ dir missing from this WT copy |
| `@/features/moderation/adapters/*` | 4 | communication/conversation | moderation module not copied |
| `@/features/actors/dal/*` | 2 | communication/inbox+conversation | actors module not copied |
| `@/shared/utils/resolveRealm` | 2 | communication/start | shared/ missing |
| `@/state/actors/useActorSummary` | 1 | communication/inbox/screens | state/ missing |
| `@/app/platform` | 1 | communication/conversation | app/ dir missing |
| `@/features/wanders/adapters/services/*` | 1 | auth/dal/register.dal.js | wanders module not copied |
| `@/features/ui/modern/module-modern.css` | 1 | communication/conversation | ui/ feature missing |

**Total ghost imports: ~116**

### 7b. Cross-Module Internal Imports (bypass adapters)

These import into another module's internals without going through an adapter:

| Consumer File | Imported Path | Violation |
|--------------|---------------|-----------|
| communication/inbox/hooks/useInbox.js | @/features/chat/inbox/controllers/* | → ghost + internal |
| communication/inbox/hooks/useInboxActions.js | @/features/chat/inbox/controllers/* | → ghost + internal |
| communication/conversation/controllers/*.js | @/features/chat/conversation/dal/* | → ghost + internal |
| communication/conversation/hooks/*.js | @/features/chat/conversation/controllers/* | → ghost + internal |
| communication/conversation/hooks/*.js | @/features/chat/inbox/hooks/* | → cross-module + internal |
| communication/conversation/screen/ConversationView.jsx | @/features/chat/conversation/components/* | → ghost + internal |
| App.jsx | @/features/dashboard/screens/OwnerDashboardGate | → no adapter on dashboard |

### 7c. App-Layer Internal Imports (bypass adapters)

```
App.jsx → @/features/dashboard/screens/OwnerDashboardGate  (no adapter on dashboard)
App.jsx → @/auth/screens/LoginScreen                       (via @/auth alias — allowed but bypasses adapter)
App.jsx → @/features/trest/screens/TrestVaultScreen        (no adapter on trest)
App.jsx → @/superadmin/SuperAdminLayout                    (no adapter on superadmin)
App.jsx → @/superadmin/screens/*                           (no adapter on superadmin)
```

---

## 8. SHARED-LAYER IMPORTS

- `@/services/supabase/supabaseClient` — used throughout, reasonable infrastructure pattern
- `@/services/cloudflare/*` — used by upload flows
- No `shared/` layer exists in this WT copy — references to `@/shared/` are all ghost imports

---

## 9. DIRECT DATA-LAYER BYPASSES

Pattern: hooks or UI importing DAL/services directly without going through controllers.

| File | Import | Violation |
|------|--------|-----------|
| communication/inbox/hooks/useInbox.js | @/features/chat/inbox/realtime/subscribeToInbox | hook → realtime dal direct |
| communication/inbox/hooks/useInbox.js | @/features/chat/inbox/model/InboxEntry.model | hook → model direct (ok if model-only) |
| communication/conversation/hooks/useConversation.js | @/features/chat/conversation/realtime/subscribeToConversation | hook → realtime direct |
| dashboard/auth/ownerDashboardAccess.js | @/services/supabase/supabaseClient | auth utility → supabase direct (acceptable at this layer) |
| features/traze/data/ | supabaseClient direct | data layer owns supabase calls (correct pattern) |

---

## 10. DEAD FILES / STUBS

| File | Reason |
|------|--------|
| features/auth/ui/index.js | Empty auto-generated stub (0 bytes) |
| features/auth/usecases/index.js | Empty auto-generated stub (0 bytes) |
| features/communication/z/README.md | Dev notes, not source code |
| features/communication/z/chat.md | Dev notes, not source code |
| learning/ (directory) | Entirely empty |
| superadmin/listAllCourseSummaries.dal.js | Duplicate of superadmin/dal/listAllCourseSummaries.dal.js |
| superadmin/listAllOrganizationSummaries.dal.js | Duplicate of superadmin/dal/listAllOrganizationSummaries.dal.js |
| superadmin/listAllRealms.dal.js | Duplicate of superadmin/dal/listAllRealms.dal.js |
| superadmin/createTenantBootstrap.js | Duplicate of superadmin/services/createTenantBootstrap.js |
| superadmin/superadmin/ (entire dir) | Full duplicate of superadmin/ with controller/ naming drift |

---

## 11. DUPLICATE NAMING PATTERNS

| Pattern | Instances |
|---------|-----------|
| `adapter/` (singular) vs `adapters/` (plural) | auth uses adapter/, rest use adapters/ |
| `model/` vs `models/` | auth/model/, communication/conversation/model/, communication/inbox/model/ vs communication/start/models/ |
| `controller/` vs `controllers/` | superadmin/superadmin/controller/ vs superadmin/controllers/ |
| `screen/` vs `screens/` | communication/conversation/screen/ vs communication/inbox/screens/ |
| `dashboard/mine-transfer/` | Sub-module name = app name (confusing) |
| `@/features/chat/` vs `@/features/communication/` | Both used — pointing to same logical module |
| Root-level DAL files in superadmin/ | Same files exist at root AND in dal/ |

---

## 12. MISSING ADAPTER/PUBLIC BOUNDARY PER MODULE

| Module | Status | Missing |
|--------|--------|---------|
| auth | adapter/ (wrong name, incomplete) | adapters/auth.adapter.js with full public surface |
| communication | adapters/ (all broken) | Must fix ghost imports first, then rebuild adapters |
| dashboard | MISSING entirely | adapters/dashboard.adapter.js exposing all sub-module screens |
| dashboard/moderation | MISSING | moderation.adapter.js |
| dashboard/traze | MISSING | traze.adapter.js |
| dashboard/governance | MISSING | governance.adapter.js |
| dashboard/tripoint | MISSING | tripoint.adapter.js |
| dashboard/vcsm | MISSING | vcsm.adapter.js |
| dashboard/wentrex | MISSING | wentrex.adapter.js |
| trest | MISSING | trest.adapter.js |
| traze | MISSING | traze.adapter.js |
| services | MISSING | services.adapter.js (or keep as infrastructure) |
| superadmin | MISSING | superadmin.adapter.js |

---

## 13. MODULE GRADES

| Module | Grade | Primary Reason |
|--------|-------|----------------|
| auth | DRIFT | adapter/ (singular), model/ naming, empty stubs, incomplete adapter surface |
| communication | NEEDS_REORG | 86+ ghost @/features/chat/ imports, broken adapters, incomplete module copy |
| dashboard | NEEDS_REORG | 126 files, zero adapters, sub-modules have no boundaries |
| services | MOSTLY_CLEAN | Well-organized cloudflare+supabase utilities, no adapters needed (infrastructure) |
| traze | DRIFT | data/ only, overlaps with dashboard/traze, no adapter, no controllers |
| trest | MOSTLY_CLEAN | Small, clean internal structure; just needs adapters/ added |
| superadmin | NEEDS_REORG | Nested duplicate, root-level scattered files, controller/ naming |
| styles | CLEAN | CSS only, no boundary needed |
| learning | DELETE_CANDIDATE | Empty directory |

---

## 14. TOP BLOCKERS

### BLOCKER-1 (CRITICAL) — Ghost @/features/chat/ (86 imports)
The entire `communication` module was copied from a `chat` module but the directory rename
was never propagated to the internal imports. The module files live at:
  `src/features/communication/`
But ~86 files still import from:
  `@/features/chat/` → resolves to `src/features/chat/` (does not exist)
This means the communication module does NOT compile. Every file importing `@/features/chat/*`
is a broken import.

Resolution requires: bulk rename `@/features/chat/` → `@/features/communication/` in all
affected files, then verify the conversation/ inbox/ start/ structure aligns.

### BLOCKER-2 (CRITICAL) — Ghost infrastructure modules (state/, shared/, app/, moderation/, actors/)
The following modules are referenced but do not exist in this WT copy:
- `@/state/identity/identityContext` (10 files)
- `@/shared/components/*` (8 files)
- `@/shared/utils/*` (2 files)
- `@/features/moderation/*` (4 files)
- `@/features/actors/*` (2 files)
- `@/app/platform` (1 file)
- `@/features/wanders/*` (1 file)
These need to be either stubbed, copied from VCSM, or eliminated.

### BLOCKER-3 (HIGH) — communication/index.js is still the old chat entry
`communication/index.js` declares "Chat Feature Entry (STABLE MODE)" and imports:
  `@/features/chat/styles/chat-modern.css`
This is the public face of the communication module and it's completely broken.

### BLOCKER-4 (HIGH) — superadmin/superadmin/ nested duplicate
An entire second copy of the superadmin module exists at `superadmin/superadmin/`.
Files are inconsistent (controller/ singular, only 1 of 3 screens present).
Must determine canonical set and delete the duplicate.

### BLOCKER-5 (MEDIUM) — Zero adapters on dashboard (126 files)
The largest module has no public API boundary whatsoever.
App.jsx imports directly from `@/features/dashboard/screens/`.

### BLOCKER-6 (MEDIUM) — superadmin root-level DAL scatter
3 DAL files + 1 service file sit at the root of `superadmin/` duplicating files in `superadmin/dal/` and `superadmin/services/`.

---

## 15. SAFE EXECUTION ORDER

Phase ordering is bottom-up: clean smallest/independent modules first, tackle broken
large modules last. Communication and modularization work on `communication` is BLOCKED
until ghost imports are resolved.

### Tier 1 — Safe Now (no blocking deps)
```
1. DELETE: learning/ (empty directory)
2. DELETE: auth/ui/index.js (empty stub)
3. DELETE: auth/usecases/index.js (empty stub)
4. DELETE: communication/z/ (dev notes)
5. DELETE: superadmin/listAllCourseSummaries.dal.js (root duplicate)
6. DELETE: superadmin/listAllOrganizationSummaries.dal.js (root duplicate)
7. DELETE: superadmin/listAllRealms.dal.js (root duplicate)
8. DELETE: superadmin/createTenantBootstrap.js (root duplicate)
9. DETERMINE canonical: superadmin/ vs superadmin/superadmin/ → delete dead copy
10. ADD adapters/trest.adapter.js (smallest clean module)
11. ADD adapters/services.adapter.js (infrastructure — may not need)
12. RENAME auth/adapter/ → auth/adapters/ (mechanical)
13. RENAME auth/model/ → auth/models/ (update imports)
14. RENAME auth/ui/ → auth/components/ (was empty — just rename dir)
15. COMPLETE auth/adapters/auth.adapter.js surface (add screens + hooks)
```

### Tier 2 — After ghost import resolution in communication
```
16. BULK RENAME @/features/chat/ → @/features/communication/ across all communication files
17. VERIFY communication/conversation/*, communication/inbox/*, communication/start/* all resolve
18. FIX communication/index.js (rename CSS import, update entry exports)
19. DECIDE stub vs copy: state/identity, shared/components, app/platform, moderation, actors
20. REBUILD communication/adapters/ to point to correct paths
21. ADD traze adapter (after clarifying features/traze vs dashboard/traze relationship)
```

### Tier 3 — Adapters for dashboard sub-modules
```
22. ADD dashboard/moderation/adapters/moderation.adapter.js
23. ADD dashboard/traze/adapters/traze.adapter.js
24. ADD dashboard/governance/adapters/governance.adapter.js
25. ADD dashboard/tripoint/adapters/tripoint.adapter.js
26. ADD dashboard/vcsm/adapters/vcsm.adapter.js
27. ADD dashboard/wentrex/adapters/wentrex.adapter.js
28. ADD dashboard/adapters/dashboard.adapter.js (top-level, re-exports sub-adapters)
29. UPDATE App.jsx to import dashboard via adapter
```

### Tier 4 — Folder normalization
```
30. NORMALIZE communication/conversation/model/ → models/
31. NORMALIZE communication/conversation/screen/ → screens/
32. NORMALIZE communication/inbox/model/ → models/
33. NORMALIZE superadmin/superadmin/controller/ → controllers/ (if not deleted in Tier 1)
34. ADD superadmin/adapters/superadmin.adapter.js
35. UPDATE App.jsx to import superadmin via adapter
```

### Tier 5 — Scanner gate
```
36. WRITE mine-transfer-module-map.json
37. WRITE mine-transfer-boundary-violations.json
38. WRITE mine-transfer-modularity-report.md
```

---

## 16. DO-NOT-TOUCH LIST (until ghost imports resolved)

- `communication/conversation/screen/ConversationView.jsx` — 20+ ghost imports
- `communication/conversation/screen/ConversationScreen.jsx` — ghost imports
- `communication/inbox/screens/*` — @/state ghost imports
- `communication/inbox/hooks/useVexSettings.js` — @/state ghost import
- `communication/start/hooks/useStartConversation.js` — @/state + @/shared ghost imports
- `communication/adapters/*` — all broken
- `communication/index.js` — broken entry
- Any file importing `@/features/moderation/` (4 files)
- Any file importing `@/features/actors/` (2 files)
- `auth/dal/register.dal.js` — imports @/features/wanders/ (ghost)

---

## 17. MECHANICAL CLEANUP CANDIDATES

Files that can be fixed purely by path rename/delete with no logic changes:

| Action | File | Notes |
|--------|------|-------|
| DELETE | src/learning/ | Empty dir |
| DELETE | features/auth/ui/index.js | Empty stub |
| DELETE | features/auth/usecases/index.js | Empty stub |
| DELETE | features/communication/z/ | Non-code dev notes |
| DELETE | superadmin/listAllCourseSummaries.dal.js | Exact duplicate |
| DELETE | superadmin/listAllOrganizationSummaries.dal.js | Exact duplicate |
| DELETE | superadmin/listAllRealms.dal.js | Exact duplicate |
| DELETE | superadmin/createTenantBootstrap.js | Exact duplicate |
| RENAME DIR | features/auth/adapter/ → features/auth/adapters/ | Singular→plural |
| RENAME DIR | features/auth/model/ → features/auth/models/ | Singular→plural |
| RENAME DIR | features/auth/ui/ → features/auth/components/ | Non-standard→standard |
| RENAME DIR | communication/conversation/model/ → models/ | Singular→plural |
| RENAME DIR | communication/conversation/screen/ → screens/ | Singular→plural |
| RENAME DIR | communication/inbox/model/ → models/ | Singular→plural |
| BULK REPLACE | @/features/chat/ → @/features/communication/ | 86 occurrences |

---

## 18. RECOMMENDED TICKET QUEUE

```
MINE-TRANSFER-MOD-STUB-CLEANUP-001
  Delete empty stubs, dev notes, root-level superadmin duplicates.
  Safe now. No risk.

MINE-TRANSFER-MOD-GHOST-CHAT-001
  Bulk rename @/features/chat/ → @/features/communication/ across 86 imports.
  Must confirm the communication sub-module structure matches chat's expected layout.
  High impact. Required before any other communication work.

MINE-TRANSFER-MOD-GHOST-INFRA-001
  Resolve ghost @/state/, @/shared/, @/app/, @/features/moderation/, @/features/actors/.
  Decision required: stub, copy from VCSM, or eliminate (communication module may not be
  active in this WT). Blocked by product decision.

MINE-TRANSFER-MOD-SUPERADMIN-DEDUP-001
  Determine canonical superadmin/ vs superadmin/superadmin/.
  Delete duplicate. Normalize controller/ → controllers/.

MINE-TRANSFER-MOD-ADAPTER-SURFACE-001
  Create adapters for: trest, auth (complete), dashboard sub-modules, superadmin.
  Blocked by stub cleanup first.

MINE-TRANSFER-MOD-FOLDER-NAMING-001
  Rename adapter/ → adapters/, model/ → models/, screen/ → screens/, ui/ → components/.
  Mechanical. Low risk.

MINE-TRANSFER-MOD-EXTERNAL-CONSUMER-001
  Migrate App.jsx imports through adapters.
  Blocked by adapter surface completion.

MINE-TRANSFER-MOD-SCANNER-GATE-001
  Write module map, boundary violations JSON, modularity report.
  Final gate after all cleanup.
```

---

## 19. MODULARIZATION-READY STATUS

**mine-transfer is NOT modularization-ready.**

Blockers before modularization work can proceed:

| Blocker | Severity | Ticket |
|---------|----------|--------|
| 86 ghost @/features/chat/ imports in communication | CRITICAL | MOD-GHOST-CHAT-001 |
| Ghost @/state/, @/shared/, @/moderation/, @/actors/ | CRITICAL | MOD-GHOST-INFRA-001 |
| communication/index.js broken entry | HIGH | MOD-GHOST-CHAT-001 |
| superadmin/superadmin/ duplicate | HIGH | MOD-SUPERADMIN-DEDUP-001 |
| Zero adapters on dashboard (126 files) | HIGH | MOD-ADAPTER-SURFACE-001 |

Modules safe to start modularizing now:
- `trest` — clean, no ghost deps
- `auth` — clean internals, just needs rename + adapter completion
- `superadmin` — after dedup cleanup

Modules BLOCKED until ghost imports resolved:
- `communication` (entire module)
- `dashboard/traze` (mild overlap with ghost-dependent features/traze)

---

## 20. SUMMARY COUNTS

```
Total source files:           391
Feature modules:              6
Ghost import count:           ~116
Modules with adapters:        2 (auth: partial; communication: broken)
Modules with NO adapters:     5 (dashboard, trest, traze, services, superadmin)
Folder naming violations:     7
Root-level scattered files:   4 (superadmin)
Duplicate module copies:      1 (superadmin/superadmin/)
Empty/dead files/dirs:        10
```
