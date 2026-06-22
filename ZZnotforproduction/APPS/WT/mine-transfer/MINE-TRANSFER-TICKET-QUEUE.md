# MINE-TRANSFER MODULARIZATION TICKET QUEUE

Generated: 2026-06-07
Source audit: MINE-TRANSFER-MODULARIZATION-BASELINE.md

---

## EXECUTION ORDER

Run in this order. Do not start a later ticket before its predecessors are done.

---

### MINE-TRANSFER-MOD-STUB-CLEANUP-001
Status: OPEN
Priority: P2 — do first, no risk
Type: TASK
Scope: Delete dead files and root-level superadmin duplicates

Files to delete:
- src/learning/ (empty directory)
- src/features/auth/ui/index.js (empty auto-generated)
- src/features/auth/usecases/index.js (empty auto-generated)
- src/features/communication/z/ (dev notes only)
- src/superadmin/listAllCourseSummaries.dal.js (exact dup of dal/listAllCourseSummaries.dal.js)
- src/superadmin/listAllOrganizationSummaries.dal.js (exact dup)
- src/superadmin/listAllRealms.dal.js (exact dup)
- src/superadmin/createTenantBootstrap.js (exact dup of services/createTenantBootstrap.js)

No import changes needed. Pure deletes.

---

### MINE-TRANSFER-MOD-SUPERADMIN-DEDUP-001
Status: OPEN
Priority: P2
Type: TASK
Scope: Collapse superadmin/superadmin/ duplicate into canonical superadmin/

Steps:
1. Compare superadmin/screens/ (3 files) vs superadmin/superadmin/screens/ (1 file)
   → Keep superadmin/screens/ (more complete)
2. Compare superadmin/controllers/ (2 files) vs superadmin/superadmin/controller/ (2 files)
   → Keep superadmin/controllers/ (correct plural naming)
3. Compare all other dirs: components, hooks are identical
4. Delete superadmin/superadmin/ entirely
5. Verify no file imports from superadmin/superadmin/

---

### MINE-TRANSFER-MOD-FOLDER-NAMING-001
Status: OPEN
Priority: P2
Type: TASK
Scope: Standardize folder names across all modules

Renames required:
| From | To | Update imports |
|------|----|----------------|
| features/auth/adapter/ | features/auth/adapters/ | Yes — @/auth/adapter/* or @/features/auth/adapter/* |
| features/auth/model/ | features/auth/models/ | Yes |
| features/auth/ui/ | features/auth/components/ | N/A (was empty, now deleted) |
| communication/conversation/model/ | communication/conversation/models/ | Yes |
| communication/conversation/screen/ | communication/conversation/screens/ | Yes — ~10+ imports |
| communication/inbox/model/ | communication/inbox/models/ | Yes |

Note: Do NOT rename communication/ files until MINE-TRANSFER-MOD-GHOST-CHAT-001 is done.
Start with auth renames only in this ticket.

---

### MINE-TRANSFER-MOD-GHOST-CHAT-001
Status: OPEN — REQUIRES DECISION FIRST
Priority: P0
Type: BUG
Scope: Fix 86 broken @/features/chat/ imports

Context:
The communication module was copied/renamed from a chat module but internal imports
were never updated. Every import of @/features/chat/* is broken.

Decision required:
1. Is @/features/chat/ simply the old name for @/features/communication/?
   IF YES → bulk replace @/features/chat/ with @/features/communication/ across all files.
   
2. Or is there a separate chat module that should be present but wasn't copied?
   IF YES → copy the missing chat module from source, or add a vite alias.

Assuming YES to option 1:

Files to update (86 imports, ~25 unique files):
- communication/conversation/screen/ConversationView.jsx (20+ imports)
- communication/conversation/screen/ConversationScreen.jsx
- communication/conversation/hooks/conversation/*.js (8 files)
- communication/conversation/hooks/realtime/*.js
- communication/conversation/controllers/*.js (8 files)
- communication/conversation/lib/normalizeMessage.js
- communication/inbox/hooks/useInbox.js
- communication/inbox/hooks/useInboxActions.js
- communication/inbox/controllers/*.js (3 files)
- communication/start/controllers/openConversation.controller.js (via inbox)
- communication/adapters/conversation/chatConversation.adapter.js
- communication/adapters/inbox/chatInbox.adapter.js
- communication/adapters/start/chatStart.adapter.js
- communication/adapters/start/hooks/useStartConversation.adapter.js
- communication/adapters/styles/chatStyles.adapter.js
- communication/index.js

Validation: App compiles, all communication imports resolve.

---

### MINE-TRANSFER-MOD-GHOST-INFRA-001
Status: OPEN — REQUIRES DECISION
Priority: P1
Type: BUG
Scope: Resolve ghost @/state/, @/shared/, @/app/, @/features/moderation/, @/features/actors/

Affected files and ghost imports:
- @/state/identity/identityContext → 10 files in communication/inbox/screens/ + conversation/
- @/state/actors/useActorSummary → 1 file (communication/inbox/screens/BlockedUsersScreen.jsx)
- @/shared/components/Spinner → 3 files
- @/shared/components/ActorLink → 3 files
- @/shared/components/ConversationSignalIcon → 1 file
- @/shared/utils/resolveRealm → 2 files
- @/features/moderation/adapters/hooks/useReportFlow.adapter → 1 file
- @/features/moderation/adapters/hooks/useConversationCover.adapter → 1 file
- @/features/moderation/adapters/components/ReportModal.adapter → 1 file
- @/features/moderation/adapters/components/ChatSpamCover.adapter → 1 file
- @/features/actors/dal/getActorSummariesByIds.dal → 2 files
- @/app/platform → 1 file
- @/features/wanders/adapters/services/wandersSupabaseClient.adapter → 1 file (in auth)

Decision options:
A) Copy these modules from VCSM source
B) Stub them (noop implementations for WT use)
C) Remove the communication module entirely from this WT (if it's not needed here)

---

### MINE-TRANSFER-MOD-ADAPTER-SURFACE-001
Status: OPEN — blocked by MOD-FOLDER-NAMING-001
Priority: P2
Type: ENG
Scope: Create missing adapters for trest, auth (complete), superadmin

Sub-tasks:
1. CREATE features/trest/adapters/trest.adapter.js
   Export: TrestVaultScreen, useTrestItems, useTrestOwnerGate

2. COMPLETE features/auth/adapters/auth.adapter.js
   Currently exports only 3 controller functions.
   Add: LoginScreen, RegisterScreen, ResetPasswordScreen, UpdatePasswordScreen,
        CompleteProfileGate, Onboarding, useLogin, useRegister, useResetPassword,
        useAuthOnboarding, useCompleteProfileGate, useUpdatePassword

3. CREATE superadmin/adapters/superadmin.adapter.js
   Export: SuperAdminLayout, SuperAdminLoginScreen, SuperAdminDashboardScreen,
           TenantDetailScreen

---

### MINE-TRANSFER-MOD-DASHBOARD-ADAPTERS-001
Status: OPEN — blocked by MOD-ADAPTER-SURFACE-001
Priority: P2
Type: ENG
Scope: Create adapters for all dashboard sub-modules

Sub-tasks (one adapter per sub-module):
1. dashboard/moderation/adapters/moderation.adapter.js
2. dashboard/traze/adapters/traze.adapter.js
3. dashboard/governance/adapters/governance.adapter.js
4. dashboard/tripoint/adapters/tripoint.adapter.js
5. dashboard/vcsm/adapters/vcsm.adapter.js
6. dashboard/wentrex/adapters/wentrex.adapter.js
7. dashboard/adapters/dashboard.adapter.js (top-level re-export surface)

---

### MINE-TRANSFER-MOD-EXTERNAL-CONSUMER-001
Status: OPEN — blocked by MOD-ADAPTER-SURFACE-001 + MOD-DASHBOARD-ADAPTERS-001
Priority: P2
Type: ENG
Scope: Migrate App.jsx to import through adapters only

Current violations in App.jsx:
- @/features/dashboard/screens/OwnerDashboardGate → import from dashboard adapter
- @/features/trest/screens/TrestVaultScreen → import from trest adapter
- @/superadmin/SuperAdminLayout → import from superadmin adapter
- @/superadmin/screens/* → import from superadmin adapter
- @/auth/screens/* → import from auth adapter (after alias cleanup)

---

### MINE-TRANSFER-MOD-COMMUNICATION-ADAPTERS-001
Status: OPEN — blocked by MOD-GHOST-CHAT-001 + MOD-GHOST-INFRA-001
Priority: P2
Type: ENG
Scope: Rebuild communication adapters after ghost imports resolved

Steps:
1. Delete communication/adapters/ (all broken)
2. Create communication/adapters/communication.adapter.js
   Export: InboxScreen, ConversationScreen, useInbox, useStartConversation, etc.
3. Verify adapters/conversation/dal/ nesting is eliminated (dal does not belong in adapters/)
4. Verify adapters/start/hooks/ nesting is eliminated (hooks inside adapters is wrong)

---

### MINE-TRANSFER-MOD-SCANNER-GATE-001
Status: OPEN — blocked by all above
Priority: P3
Type: TASK
Scope: Write scanner output files as enforcement gate

Output:
- ZZnotforproduction/APPS/WT/mine-transfer/mine-transfer-module-map.json
- ZZnotforproduction/APPS/WT/mine-transfer/mine-transfer-boundary-violations.json
- ZZnotforproduction/APPS/WT/mine-transfer/mine-transfer-modularity-report.md
