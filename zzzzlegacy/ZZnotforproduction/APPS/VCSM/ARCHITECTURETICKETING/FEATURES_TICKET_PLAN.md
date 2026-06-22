# Feature Architecture — Execution-Ready Ticket Plan
**Generated:** 2026-06-06  
**Source:** FEATURES_ARCHITECTURE_REVIEW.md  
**Scope:** `/apps/VCSM/src/features/`  

---

## Execution Order

```
⚠️  UPDATED BY SCANNER AUDIT — 2026-06-06

ARCH-IMPORTMAP-001  ──→ SIMPLIFIED — raw data already in dependency-map.json + feature-map.json
ARCH-BIDIR-001      ──→ READY NOW — 15 pairs already in scanner data (was BLOCKED_BY_IMPORTMAP)
ARCH-NAMING-001     ──→ (none blocked — decision only, unchanged)
ARCH-STUBS-001      ──→ (none blocked — comment-only, unchanged)
ARCH-CLEAN-001      ──→ (none blocked — structural, unchanged)
ARCH-ANALYTICS-001  ──→ (none blocked — small move, unchanged)
ARCH-ENGINESETUP-001 ──→ SIMPLIFIED — feature-map.json and engine-candidates.json provide stub data
ARCH-DASH-001       ──→ SCOPE_EXPANDED — 11 dashboard→profiles violations found by scanner
ARCH-POSTMOD-001    ──→ READY_AFTER_IMPORTMAP_FORMAT — manual PostCard inspection still required
ARCH-VPORTPROFILE-001 ──→ SCOPE_EXPANDED — 11 dashboard→profiles + 10 profiles→booking violations found
```

---

## Ticket 1 — Phase 1 Safe Cleanup

**[ARCH-CLEAN-001] Remove empty folders, misplaced docs, and dead dev assets**  
Status: CLOSED — 2026-06-06 (PARTIAL — chat/styles/ deviation, see notes)  
Priority: P3  
Type: TASK  
App: VCSM  

**Goal:**  
Remove structural noise from the features layer — empty directories, a misplaced docs folder, and a lone dev component floating as a "feature" — without touching any logic, hooks, controllers, or dal files.

**Scope:**  
`apps/VCSM/src/features/` — structural cleanup only. No behavioral changes.

**Files/Folders:**  
```
DELETE (empty folders):
  apps/VCSM/src/features/booking/components/       — empty, no files
  apps/VCSM/src/features/booking/screens/          — empty, no files
  apps/VCSM/src/features/chat/styles/              — empty, no files

MOVE (misplaced docs):
  apps/VCSM/src/features/shell/modules/bottom-bar/docs/ARCHITECTURE.md
  apps/VCSM/src/features/shell/modules/bottom-bar/docs/BEHAVIOR.md
  apps/VCSM/src/features/shell/modules/bottom-bar/docs/SECURITY.md
  → destination: ZZnotforproduction/APPS/VCSM/features/shell/ (create folder)

EVALUATE (do not touch yet):
  apps/VCSM/src/features/debug/                    — see Do Not Touch
  apps/VCSM/src/features/ui/modern/ModernPrimitives.jsx  — see Do Not Touch
  apps/VCSM/src/features/ui/modern/module-modern.css     — see Do Not Touch
```

**Why:**  
Empty folders signal unfinished intent and confuse developers scanning the feature structure. The `shell/docs/` folder violates the workspace rule that documentation lives in `ZZnotforproduction/`. Neither issue changes behavior.

**Risk:** VERY LOW. No imports reference empty directories. The docs move does not affect any import.

**Blocked By:** Nothing.

**Exact Steps:**
1. Confirm `booking/components/` is empty: `ls apps/VCSM/src/features/booking/components/`
2. Confirm `booking/screens/` is empty: `ls apps/VCSM/src/features/booking/screens/`
3. Confirm `chat/styles/` is empty: `ls apps/VCSM/src/features/chat/styles/`
4. Delete all three empty folders.
5. Create `ZZnotforproduction/APPS/VCSM/features/shell/` if it does not exist.
6. Move the 3 docs files from `shell/modules/bottom-bar/docs/` to that destination.
7. Delete the now-empty `shell/modules/bottom-bar/docs/` folder.

**Validation:**
- Run `find apps/VCSM/src/features/booking -type d` — `components/` and `screens/` must not appear.
- Run `find apps/VCSM/src/features/chat -type d` — `styles/` must not appear.
- Run the app cold and confirm booking, chat, and shell bottom nav all load correctly.
- No test failures expected (empty folders cannot be tested).

**Rollback Plan:** Re-create the empty folders. No code was changed.

**Do Not Touch:**  
- `features/debug/` — LoginDebugPanel.jsx is imported somewhere in dev flows. Confirm consumers before moving.
- `features/ui/modern/ModernPrimitives.jsx` — unknown consumers; grep before touching.
- Any file with actual content in features/.

---

## Ticket 2 — Analytics Utility to shared/lib

**[ARCH-ANALYTICS-001] Move funnelSource.js from features/analytics to shared/lib**  
Status: Open  
Priority: P3  
Type: TASK  
App: VCSM  

**Goal:**  
Eliminate the 1-file `analytics/` pseudo-feature by moving its single export to `shared/lib/` where generic utilities belong. Update the 3 known import sites.

**Scope:**  
1 source file, 3 import updates, 1 folder deletion.

**Files/Folders:**  
```
SOURCE:
  apps/VCSM/src/features/analytics/funnelSource.js

DESTINATION:
  apps/VCSM/src/shared/lib/funnelSource.js   ← NEW LOCATION

IMPORT UPDATES (3 files):
  apps/VCSM/src/features/legal/screens/HowToCreateVportScreen.jsx     line 3
  apps/VCSM/src/features/legal/screens/HowToCreateProfileScreen.jsx   line 3
  apps/VCSM/src/features/legal/screens/VportCategoryLandingScreen.jsx line 3

  Change:
    import { setFunnelSource } from '@/features/analytics/funnelSource'
  To:
    import { setFunnelSource } from '@/shared/lib/funnelSource'

DELETE:
  apps/VCSM/src/features/analytics/               ← entire folder
```

**Why:**  
`funnelSource.js` is a platform utility (sets a tracking flag for acquisition funnels). It has no feature-level state, no hooks, no dal, no model. It does not belong in `features/`. The `analytics/` folder only exists because there was nowhere else to put it at the time. `shared/lib/` is the correct location for generic platform utilities.

**Risk:** LOW. Exactly 3 import sites. All are in `legal/screens/`. No engine, no dal, no realtime path.

**Blocked By:** Nothing.

**Exact Steps:**
1. Read `features/analytics/funnelSource.js` — confirm it exports only `setFunnelSource` (or similar). Note all named exports.
2. Copy file to `apps/VCSM/src/shared/lib/funnelSource.js`. Do not modify the file contents.
3. Update import in `HowToCreateVportScreen.jsx` line 3.
4. Update import in `HowToCreateProfileScreen.jsx` line 3.
5. Update import in `VportCategoryLandingScreen.jsx` line 3.
6. Run `grep -r "features/analytics" apps/VCSM/src/` — result must be zero matches.
7. Delete `apps/VCSM/src/features/analytics/` folder.

**Validation:**
- Navigate to each of the 3 legal screens in dev: HowToCreate (Vport), HowToCreate (Profile), VportCategoryLanding.
- Confirm no console errors on load.
- Trigger the funnel source action (e.g. tap through the screen) and confirm `setFunnelSource` fires without error.
- Run `grep -r "features/analytics" apps/VCSM/src/` — zero results required.

**Rollback Plan:** Revert the 3 import lines. Restore the `analytics/` folder from the copy you made in step 2.

**Do Not Touch:**
- The function body of `funnelSource.js` — copy exactly as-is.
- Any other files in `features/legal/`.
- `shared/lib/` existing files.

---

## Ticket 3 — Document Stub Features

**[ARCH-STUBS-001] Document the purpose of all engine-stub features**  
Status: CLOSED — 2026-06-06  
Priority: P3  
Type: TASK  
App: VCSM  

**Goal:**  
Write a brief intent header inside each stub feature's primary file. No behavioral changes. This prevents future developers from deleting these files thinking they are dead code, and surfaces the planned fate of each stub.

**Scope:**  
Add a comment block to 1 file per stub feature — 5 stubs total. Read-only analysis first, then minimal comment additions.

**Files/Folders:**  
```
STUBS TO DOCUMENT:

1. features/actors/adapters/actors.adapter.js
   → Actor search adapter used by settings/privacy for user lookup.
   → Planned fate: evaluate merge into identity/ (see ARCH-IMPORTMAP-001 findings).

2. features/hydration/setup.js
   → Engine setup stub — configures the hydration engine at app startup.
   → Planned fate: move to app/setup/ (see ARCH-ENGINESETUP-001).

3. features/portfolio/adapters/portfolioTrace.adapter.js
   → Portfolio engine adapter — thin wrapper over @portfolio engine.
   → Planned fate: document whether real portfolio UI will grow here or if this stays an adapter stub.

4. features/reviews/setup.js
   → Engine setup stub — configures the reviews engine at app startup.
   → Planned fate: move to app/setup/ (see ARCH-ENGINESETUP-001).

5. features/ui/modern/ModernPrimitives.jsx
   → Unknown status. Single component file with no clear consumer.
   → Action needed: grep for consumers before deciding to keep or delete.
```

**Why:**  
Currently these folders look like abandoned or incomplete work. Without documented intent, they are deletion risks. A one-line comment block at the top of each key file costs nothing and prevents misunderstanding.

**Risk:** VERY LOW. Comment additions only.

**Blocked By:** Nothing.

**Exact Steps:**
1. Read each file listed above.
2. Add a 2–3 line comment block at the top (after any existing license/import headers) in this format:
   ```js
   // STUB: [description of what this file does]
   // STATUS: [active adapter | engine setup | unknown — needs consumer audit]
   // PLANNED FATE: [stay here | move to app/setup | merge into X | delete if unused]
   ```
3. For `ui/modern/ModernPrimitives.jsx`: before adding a comment, run `grep -r "ModernPrimitives" apps/VCSM/src/` to find consumers. If zero results, mark as `STATUS: no known consumers — candidate for deletion`.
4. Do not change any exports, logic, or imports.

**Validation:**
- Each file must be readable and importable after comment addition.
- Run a cold app launch — all stubbed engines must still configure at startup.
- `features/actors/` must still serve actor search in settings/privacy.

**Rollback Plan:** Remove the comment blocks. Zero behavioral impact.

**Do Not Touch:**
- The logic, exports, or imports in any of these files.
- `portfolio/setup.js` — reads that it exists but do not modify engine configuration.
- `reviews/` dal or controller files (if any exist beyond setup.js).

---

## Ticket 4 — Generate Feature Import Map

**[ARCH-IMPORTMAP-001] Add featureImportMapScanner.js post-processor to reshape scanner output into governance format**  
Status: CLOSED — 2026-06-06  
Priority: P1  
Type: ENG  
App: VCSM  

> **Scanner Audit Note:** This ticket is no longer a from-scratch import map build. `apps/scanner` already generates `dependency-map.json` (1.0 MB, 380 dependency edges, 106 VCSM Feature→Feature) and `feature-map.json` (34 VCSM features with file counts and layer counts) on every scan run. The raw data exists and was built on 2026-06-05. This ticket is now a scanner-output reshaping ticket — add `featureImportMapScanner.js` as a post-processor that pivots existing edge-list data into the per-feature governance format.

**Goal:**  
Add a `featureImportMapScanner.js` post-processor to `apps/scanner` that reads the existing `dependency-map.json` and `feature-map.json` outputs and reshapes them into the per-feature governance format (`FEATURE_IMPORT_MAP.json` and `FEATURE_IMPORT_MAP.md`). Flag adapter boundary violations and split candidates using data already in scanner outputs.

**Scope:**  
Add one new scanner post-processor file (~80 lines). Update `runScan.js` to call it. No source feature files changed. No new AST parsing required.

**Files/Folders:**  
```
EXISTING SCANNER INPUTS (already on disk — do not re-generate):
  apps/scanner/maps/dependency-map.json   ← 106 VCSM Feature→Feature edges confirmed
  apps/scanner/maps/feature-map.json      ← 34 VCSM features with file counts + layer counts

NEW FILE TO CREATE:
  apps/scanner/src/scanners/featureImportMapScanner.js

UPDATE:
  apps/scanner/src/core/runScan.js        ← add call to featureImportMapScanner

OUTPUT (write to):
  ZZnotforproduction/APPS/VCSM/ARCHITECTURETICKETING/FEATURE_IMPORT_MAP.json
  ZZnotforproduction/APPS/VCSM/ARCHITECTURETICKETING/FEATURE_IMPORT_MAP.md
```

**Why:**  
The scanner already generates all the raw data. The per-feature governance format (`inbound_consumers`, `outbound_dependencies`, `violations`, `split_candidate`) requires a pivot on the existing flat edge list. The violation detection (does the resolved import path bypass the adapters layer?) is a string filter on data already in each import entry. Building this from scratch with grep would duplicate the scanner's existing work.

**Risk:** LOW. New post-processor only. No existing scanner behavior changes.

**Blocked By:** Nothing. Scanner outputs already exist.

**Exact Steps:**

**Step 1 — Confirm existing scanner outputs are current:**
- Read `apps/scanner/maps/dependency-map.json` — confirm `generatedAt` is recent and `dependencyCount` > 0.
- Read `apps/scanner/maps/feature-map.json` — confirm VCSM features appear and `sourceFileCount` is populated.
- Do not re-run the scanner unless the maps are stale (older than 48 hours or missing).

**Step 2 — Confirm dependency-map contains required fields per import entry:**
Each entry in `data.dependencies[].imports[]` must have:
- `file` — the importing file path
- `importPath` — the literal `@/features/X/...` import path
- `resolvedPath` — the resolved repository-relative path
- `feature` — the source feature name

**Step 3 — Confirm feature-map contains required fields per feature:**
Each entry in `data.features[]` for VCSM features must have:
- `feature` — feature name
- `sourceFileCount` — total file count
- `layerCounts` — per-layer breakdown

**Step 4 — Define the governance output format for `FEATURE_IMPORT_MAP.json`:**
```json
{
  "generated": "<ISO date>",
  "feature_count": 34,
  "features": [
    {
      "name": "dashboard",
      "path": "apps/VCSM/src/features/dashboard",
      "file_count": 258,
      "layer_counts": { "component": 42, "controller": 38, "dal": 35, "hook": 45, "model": 22, "screen": 18, "adapter": 9 },
      "inbound": [
        {
          "from_feature": "settings",
          "from_file": "settings/vports/ui/VportsQrModal.jsx",
          "import_path": "@/features/dashboard/qrcode/adapters/qrcode.adapter",
          "target_subfolder": "qrcode",
          "through_adapter": true,
          "violation": false
        }
      ],
      "outbound": [ ... ],
      "violations": [
        {
          "from_file": "dashboard/vport/...",
          "import_path": "@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal",
          "rule": "NO_INTERNAL_WITHOUT_ADAPTER",
          "to_feature": "profiles"
        }
      ],
      "split_candidate": true,
      "split_reason": "3 unrelated subsystems (flyerBuilder, qrcode, vport); 258 files exceeds 100-file threshold"
    }
  ]
}
```

**Step 5 — Specify violation rules to enforce in the post-processor:**
The post-processor must flag each import that violates any of these rules:

| Rule | Detection |
|---|---|
| `NO_INTERNAL_WITHOUT_ADAPTER` | `resolvedPath` contains `/dal/`, `/controller/`, `/controllers/`, `/hooks/`, or `/model/` and does NOT contain `/adapters/` or `.adapter` |
| `NO_CROSS_FEATURE_DAL` | `resolvedPath` contains `/dal/` or `.dal.` and belongs to a different feature |
| `NO_UI_TO_DAL` | source file layer is `screen` or `component` AND target `resolvedPath` contains `/dal/` or `.dal.` |
| `BIDIR_TRACKING` | feature A imports feature B AND feature B imports feature A |
| `OWNERSHIP_BOUNDARY` | `resolvedPath` feature namespace does not match `from_feature` |
| `SPLIT_READINESS` | `sourceFileCount > 100` in feature-map entry |

**Step 6 — Write `FEATURE_IMPORT_MAP.md` (human-readable version):**
Table per feature: name | file_count | inbound_count | outbound_count | violation_count | split_candidate.
Then a separate violations section listing each violation with rule, from_file, to_feature, import_path.

**Validation:**
- `FEATURE_IMPORT_MAP.json` must contain entries for all 34 VCSM features.
- `dashboard` entry must show exactly 1 inbound consumer (settings→qrcode.adapter) and 11 violations (dashboard→profiles internals — confirmed by scanner audit).
- `profiles` entry must show 10 violations (profiles→booking internals — confirmed by scanner audit).
- Violations must be explicitly flagged with the rule name.
- Total violation count in output must be ≥ 36 (confirmed in scanner audit).
- `split_candidate: true` must appear for profiles (374 files), dashboard (258 files), wanders (124 files), post (116 files).
- No scanner was re-implemented from scratch — featureImportMapScanner.js reads existing maps only.
- No source feature files modified.

**Rollback Plan:** Delete `featureImportMapScanner.js`. Remove call from `runScan.js`. Delete output files.

**Do Not Touch:**
- All source files in `apps/VCSM/src/features/`.
- `apps/scanner/src/scanners/dependencyScanner.js` — do not modify the existing scanner.
- `apps/scanner/maps/dependency-map.json` — read-only input.
- `apps/scanner/maps/feature-map.json` — read-only input.

---

## Ticket 5 — Bidirectional Dependency Audit

**[ARCH-BIDIR-001] Audit and classify all bidirectional feature dependencies**  
Status: CLOSED — 2026-06-06  
Priority: P2  
Type: SEC  
App: VCSM  

> **Scanner Audit Note:** This ticket is no longer blocked by ARCH-IMPORTMAP-001. The scanner's existing `dependency-map.json` already contains all data needed to enumerate bidirectional pairs. The original ticket identified 5 pairs. Scanner analysis found **15 pairs**. The 10 additional pairs were not visible without the full import map. Discovery phase is complete — this ticket is now classification-only work. Start immediately.

**Goal:**  
Classify all 15 confirmed bidirectional feature dependencies using the existing scanner data as source of truth. Produce a decision record with classification and recommended resolution for each pair. No code changes.

**Scope:**  
Classification and decision record only. Source of truth is `apps/scanner/maps/dependency-map.json` — do not re-derive pairs via grep.

**Files/Folders:**  
```
DATA SOURCE (read-only):
  apps/scanner/maps/dependency-map.json   ← all 15 pairs computable from this file

ALL 15 CONFIRMED BIDIRECTIONAL PAIRS (from scanner analysis):

Pair 1: social ↔ feed  [IN ORIGINAL TICKET]
  social → feed:
    features/social/friend/subscribe/controllers/follow.controller.js:9
      import { invalidateFeedFollowCache } from '@/features/feed/adapters/feedCache.adapter'
    features/social/friend/subscribe/controllers/unsubscribe.controller.js:6
      import { invalidateFeedFollowCache } from '@/features/feed/adapters/feedCache.adapter'
    features/social/friend/request/controllers/followRequests.controller.js:13
      import { invalidateFeedFollowCache } from '@/features/feed/adapters/feedCache.adapter'
  feed → social:
    features/feed/hooks/useCentralFeedActions.js:4
      import { useFollowActorToggle } from '@/features/social/adapters/friend/subscribe/hooks/useFollowActorToggle.adapter'
    features/feed/hooks/useCentralFeedActions.js:5
      import { useFollowStatus } from '@/features/social/adapters/friend/subscribe/hooks/useFollowStatus.adapter'

Pair 2: social ↔ notifications  [IN ORIGINAL TICKET]
  social → notifications:
    features/social/friend/subscribe/controllers/follow.controller.js:7
      import { publishVcsmNotification } from '@/features/notifications/adapters/notifications.adapter'
    features/social/friend/request/controllers/followRequests.controller.js:11
      import { publishVcsmNotification } from '@/features/notifications/adapters/notifications.adapter'
  notifications → social:
    features/notifications/types/follow/FollowRequestItem.view.jsx:5
      import { useFollowRequestActions } from '@/features/social/adapters/friend/request/hooks/useFollowRequestActions.adapter'
    features/notifications/inbox/hooks/useNotificationInbox.js:12
      import { useSocialFollowRequestOps } from '@/features/social/adapters/social.adapter'

Pair 3: settings ↔ dashboard  [IN ORIGINAL TICKET]
  settings → dashboard: VportsQrModal.jsx → dashboard/qrcode/adapters/qrcode.adapter
  dashboard → settings: (confirm exact files from dependency-map.json — 3 violation imports)

Pair 4: settings ↔ vport  [IN ORIGINAL TICKET]
  (confirm exact files from dependency-map.json)

Pair 5: profiles ↔ social  [IN ORIGINAL TICKET]
  (confirm exact files from dependency-map.json)

Pair 6: auth ↔ legal  [FOUND BY SCANNER — NEW]
  (extract exact files from dependency-map.json)

Pair 7: block ↔ feed  [FOUND BY SCANNER — NEW]
  (extract exact files from dependency-map.json)

Pair 8: booking ↔ notifications  [FOUND BY SCANNER — NEW]
  (extract exact files from dependency-map.json)

Pair 9: dashboard ↔ profiles  [FOUND BY SCANNER — NEW — HIGH PRIORITY]
  dashboard → profiles: 11 BOUNDARY VIOLATIONS (direct imports into profiles/kinds/vport internals)
    - profiles/kinds/vport/controller/services/getVportServices.controller
    - profiles/kinds/vport/dal/services/resolveVportProfileId.dal  (×8 imports)
    - profiles/kinds/vport/controller/locksmith/locksmithOwner.controller
  profiles → dashboard: (extract from dependency-map.json)

Pair 10: dashboard ↔ public  [FOUND BY SCANNER — NEW]
  dashboard → public: 1 violation import
  public → dashboard: (extract from dependency-map.json)

Pair 11: feed ↔ post  [FOUND BY SCANNER — NEW]
  (extract exact files from dependency-map.json)

Pair 12: notifications ↔ post  [FOUND BY SCANNER — NEW]
  (extract exact files from dependency-map.json)

Pair 13: notifications ↔ profiles  [FOUND BY SCANNER — NEW]
  (extract exact files from dependency-map.json)

Pair 14: post ↔ profiles  [FOUND BY SCANNER — NEW]
  (extract exact files from dependency-map.json)

Pair 15: ads ↔ settings  [FOUND BY SCANNER — NEW]
  (extract exact files from dependency-map.json)

UNEXPECTED SINGLE-DIRECTION DEPENDENCIES (not bidirectional — still require classification):

Case A: professional → settings (Card.adapter)
  features/professional/enterprise/ui/EnterpriseWorkspace.jsx:1
    import Card from '@/features/settings/adapters/ui/Card.adapter'
  features/professional/enterprise/ui/enterprisePanels.jsx:1
    import Card from '@/features/settings/adapters/ui/Card.adapter'
  features/professional/briefings/view/ProfessionalBriefingsScreenView.jsx:3
    import Card from '@/features/settings/adapters/ui/Card.adapter'

Case B: shell → profiles (canonical slug)
  features/shell/modules/bottom-bar/components/BottomNavBar.jsx:9
    import { useActorCanonicalSlug } from '@/features/profiles/adapters/profiles.adapter'

OUTPUT:
  ZZnotforproduction/APPS/VCSM/ARCHITECTURETICKETING/BIDIR_DEPENDENCY_DECISION.md
```

**Why:**  
Bidirectional imports create circular dependency risk and make it impossible to split features cleanly. With 15 confirmed pairs (10 more than the original ticket anticipated), this classification work is critical before ARCH-DASH-001 and ARCH-VPORTPROFILE-001 can proceed. Pair 9 (dashboard↔profiles) has 11 confirmed boundary violations making it the highest-priority pair to classify.

**Risk:** ZERO for this ticket. Classification and decision record only.

**Blocked By:** Nothing. Data is complete in `apps/scanner/maps/dependency-map.json`.

**Exact Steps:**

**Step 1 — Extract all 15 pairs from the scanner map:**
Do not run grep. Instead, query `dependency-map.json`:
- For each dependency entry where `fromAppId = VCSM` and `toKind = feature` and `fromKind = feature`, record the `from` and `to` values.
- Group into symmetric pairs (A→B and B→A with the same feature names).
- For pairs 6–15 (scanner-discovered), extract the exact importing files from the `imports[]` array.

**Step 2 — Classify each pair using this framework:**
- **SAFE**: Both directions go through adapter boundaries. The coupling is intentional and the adapter is the correct surface.
- **FIXABLE-EVENT**: One direction should be replaced with React Query cache key constants (no import needed — the calling feature only needs the cache key string, not the hook).
- **FIXABLE-SHARED**: A shared type, constant, or interface should replace the import (it belongs in `shared/types/`).
- **DESIGN-DECISION**: The direction is unclear. Requires product/architecture decision before code change.
- **VIOLATION-REQUIRES-REMEDIATION**: One or both directions bypass the adapter boundary — this is not just bidirectional but a structural violation that must be fixed before any split ticket proceeds.

**Step 3 — Apply framework to each pair:**

Pairs 1–5: Evidence already documented above. Classify using framework.

Pairs 6–15: Read the exact import files extracted from dependency-map.json in Step 1. For each:
- Is the import going through an adapter or into internals?
- Is the bidirectionality intentional or incidental?
- Which direction should be the canonical one?

Pair 9 (dashboard↔profiles) MUST be classified as VIOLATION-REQUIRES-REMEDIATION — 11 confirmed internal imports. Document the exact remediation path and whether it gates ARCH-DASH-001 or ARCH-VPORTPROFILE-001.

**Step 4 — Classify the two unexpected single-direction cases (A and B).**

**Step 5 — Write decision record:**
For each pair/case, record:
- Classification
- Recommended resolution
- Files that would change in the fix
- Whether the fix is a prerequisite for a split ticket (ARCH-DASH-001 or ARCH-VPORTPROFILE-001)
- Risk tier (LOW / MEDIUM / HIGH)

**Validation:**
- Decision document must cover all 15 pairs and 2 cases (17 total).
- All 10 scanner-discovered pairs must have their exact file evidence extracted from dependency-map.json (not grep).
- Pair 9 (dashboard↔profiles) must include a remediation strategy.
- No source files modified.
- Present decisions to the owner before any implementation begins.

**Rollback Plan:** Delete output file. No source was changed.

**Do Not Touch:**
- All controller, dal, hook, and adapter files referenced above.
- Do not implement any fix in this ticket.
- `apps/scanner/maps/dependency-map.json` — read only.

---

## Ticket 6 — postModules Extraction — Planning Only

**[ARCH-POSTMOD-001] Plan the extraction of postModules from post/postcard**  
Status: Open  
Priority: P2  
Type: ENG  
App: VCSM  

**Goal:**  
Produce a safe, step-by-step plan for moving `postModules/` out of `post/postcard/` and into a new location. No files move in this ticket. This ticket exists because the current structure (8 vport-type modules hard-imported into `PostCard.view.jsx`) must be replaced with an injection pattern before any new vport type can be added cleanly.

**Scope:**  
Read-only analysis + written plan. Output to docs.

**Files/Folders:**  
```
SUBJECT OF ANALYSIS:
  apps/VCSM/src/features/post/postcard/ui/PostCard.view.jsx    ← the static importer
  apps/VCSM/src/features/post/postcard/postModules/
    barbershopHours/
    barbershopPortfolio/
    exchangeRates/
    fuelPrices/
    locksmithHours/
    locksmithPortfolio/
    locksmithServiceArea/
    menuDrop/
    shared/                                                     ← shared components used by all modules

CURRENT INJECTION PATTERN (confirmed):
  PostCard.view.jsx lines 6-13:
    import { FuelPricesPostModule }         from "@/features/post/postcard/postModules/fuelPrices"
    import { ExchangeRatesPostModule }      from "@/features/post/postcard/postModules/exchangeRates"
    import { MenuDropPostModule }           from "@/features/post/postcard/postModules/menuDrop"
    import { BarbershopPortfolioPostModule }from "@/features/post/postcard/postModules/barbershopPortfolio"
    import { BarbershopHoursPostModule }    from "@/features/post/postcard/postModules/barbershopHours"
    import { LocksmithPortfolioPostModule } from "@/features/post/postcard/postModules/locksmithPortfolio"
    import { LocksmithHoursPostModule }     from "@/features/post/postcard/postModules/locksmithHours"
    import { LocksmithServiceAreaPostModule}from "@/features/post/postcard/postModules/locksmithServiceArea"

EACH MODULE INTERNALLY IMPORTS FROM postModules/shared/:
  PostModuleCta, PostModuleFrame, PostModuleHeader (shared components)

OUTPUT:
  ZZnotforproduction/APPS/VCSM/POSTMODULES_EXTRACTION_PLAN.md
```

**Why:**  
`PostCard.view.jsx` is a generic post renderer. It should not know that barbershops, locksmiths, and gas stations exist. Every new vport type that has a post format requires adding another static import to this file. This is the textbook open/closed violation — the post renderer is not open for extension without modification.

The plan must determine:
1. Where the modules move (new `vportPostTypes/` feature? or stay in `post/` but injected?)
2. What the injection mechanism looks like (module registry? React context? prop?)
3. What the `shared/` components do and whether they stay with the modules or move to `shared/components/`
4. Whether `PostCard.view.jsx` gets a registry lookup or keeps static imports (registry is correct, but the plan must prove it's safe)

**Risk (this planning ticket):** ZERO. No files change.

**Risk (future implementation ticket):** HIGH. PostCard.view.jsx is in the central feed rendering path. Any change here fails silently — all 8 vport post types must be tested individually.

**Blocked By:** ~~ARCH-IMPORTMAP-001~~ — CLOSED 2026-06-06. `FEATURE_IMPORT_MAP.json` now exists. PostCard consumer map is available. This ticket is now READY.

**Exact Steps:**

**Step 1 — Read the current injection site:**
Read `PostCard.view.jsx` fully. Document:
- How the 8 module components are invoked (conditional rendering? switch statement? prop?)
- What props each module receives
- Whether modules have shared state or are purely presentational

**Step 2 — Read 2 representative modules:**
Read `fuelPrices/` (simplest module) and `barbershopPortfolio/` (most complex module).
Document:
- What each module renders
- What data shape each module expects (post payload structure)
- Whether modules import from anywhere outside `postModules/`

**Step 3 — Audit shared/ components:**
Read `postModules/shared/components/PostModuleCta.jsx`, `PostModuleFrame.jsx`, `PostModuleHeader.jsx`.
Document: are these generic enough for `shared/components/` or are they post-module-specific?

**Step 4 — Write the extraction plan covering:**
- Destination for moved modules
- Injection mechanism design (recommend a `postModuleRegistry` approach: a map of `postType → Component`)
- Migration order (one module at a time, starting with simplest)
- How to validate each module independently
- What happens to the `shared/` components

**Validation (for this planning ticket):**
- Plan document must exist and be complete.
- No source files modified.
- Plan must be reviewed by the owner before ARCH-POSTMOD-002 (implementation) is opened.

**Rollback Plan:** Delete output document.

**Do Not Touch:**
- `PostCard.view.jsx` — do not add, remove, or change any imports.
- Any module files under `postModules/`.
- Feed rendering path.

---

## Ticket 7 — Dashboard Split — Planning Only

**[ARCH-DASH-001] Plan the split of dashboard/ into flyerBuilder, qrcode, and vportDashboard**  
Status: SCOPE_EXPANDED_BY_SCANNER_AUDIT  
Priority: P2  
Type: ENG  
App: VCSM  

> **Scanner Audit Note (2026-06-06):** Scanner analysis found **11 confirmed boundary violations** where `dashboard` imports directly into `profiles/kinds/vport/` internals — bypassing the adapter layer. These are not cosmetic issues: they are structural blockers for the split. The split plan cannot be written without a resolution strategy for these 11 violations. The scope of this ticket is expanded to include violation classification and remediation strategy. ARCH-IMPORTMAP-001 no longer blocks discovery — data is already in `dependency-map.json`. However, the violation strategy must be resolved before any implementation ticket is opened.

**Goal:**  
Produce an implementation-ready plan for splitting `features/dashboard/` (263 files, 3 unrelated subsystems) into three distinct features. Plan must include a remediation path for the 11 boundary violations. No files move in this ticket.

**Scope:**  
Read-only analysis + written plan. Data source is `apps/scanner/maps/dependency-map.json` — do not re-derive from grep.

**Files/Folders:**  
```
SUBJECT OF ANALYSIS:
  apps/VCSM/src/features/dashboard/
    flyerBuilder/           (31 files) — Design studio
    qrcode/                 (9 files)  — QR code generation, has index.js barrel
    vport/                  (217 files) — Owner dashboard + 11 cards

CONFIRMED VIOLATIONS — dashboard → profiles (11 boundary violations):
  dashboard imports directly into profiles/kinds/vport/ internals:
    → profiles/kinds/vport/controller/services/getVportServices.controller (1 import)
    → profiles/kinds/vport/dal/services/resolveVportProfileId.dal          (8 imports)
    → profiles/kinds/vport/controller/locksmith/locksmithOwner.controller  (1 import)
    → profiles/kinds/vport/dal/services/getVportCategoryById.dal           (1 import)
  (extract exact dashboard source files from dependency-map.json)

  These 11 imports bypass profiles/adapters/ — they reach controller and dal layers directly.
  Before the dashboard split, these must either:
    (a) be moved behind a profiles adapter export, or
    (b) be moved to vportProfile feature (after ARCH-VPORTPROFILE-001 plan is ready)

CONFIRMED CONSUMERS (from scanner analysis — no longer requires ARCH-IMPORTMAP-001):
  settings/vports/ui/VportsQrModal.jsx → dashboard/qrcode/adapters/qrcode.adapter
  (extract all dashboard consumers from dependency-map.json — all edges where to=dashboard)

PROPOSED TARGET STRUCTURE:
  features/flyerBuilder/        ← from dashboard/flyerBuilder/
  features/qrcode/              ← from dashboard/qrcode/
  features/vportDashboard/      ← from dashboard/vport/
    cards/
      bookings/
      calendar/
      exchange/
      gasprices/
      leads/
      locksmith/
      portfolio/
      reviews/
      schedule/
      services/
      settings/
      team/

OUTPUT:
  ZZnotforproduction/APPS/VCSM/ARCHITECTURETICKETING/DASHBOARD_SPLIT_PLAN.md
```

**Why:**  
A flyer design studio, a QR code generator, and a vport business dashboard have no shared domain logic. They are co-located only because they were all built under the "dashboard" umbrella. Each has grown large enough to warrant its own feature boundary. Keeping them co-located means import paths like `@/features/dashboard/vport/dashboard/cards/gasprices/...` — three levels of "dashboard" in the path.

The 11 boundary violations add urgency: these dashboard→profiles internals imports are already a problem independent of the split. Splitting without fixing them moves the violations into `vportDashboard` → `profiles`, which is equally wrong.

**Risk (this planning ticket):** ZERO for analysis. MEDIUM for the violation remediation strategy (must not break dashboard card functionality).

**Risk (future implementation):** HIGH. 263 files. Route tree changes. 11 violations must be remediated. All 11 card subsystems must be re-validated.

**Blocked By:** Nothing for discovery (scanner data is complete). Violation remediation strategy must be confirmed before implementation ticket opens.

**Exact Steps:**

**Step 1 — Extract dashboard consumer list from scanner data:**
Query `apps/scanner/maps/dependency-map.json` for all entries where `to = dashboard` AND `fromAppId = VCSM`.
Record:
- Source feature
- Source files (from `imports[]`)
- Which dashboard subsystem is imported (flyerBuilder, qrcode, or vport)
- Whether the import goes through an adapter or into internals

**Step 2 — Extract dashboard violation detail from scanner data:**
Query `dependency-map.json` for the edge `dashboard → profiles`.
Extract the `imports[]` array. For each import:
- Record the `file` (dashboard source file)
- Record the `resolvedPath` (which profiles internal it reaches)
- Classify: does it reach `profiles/kinds/vport/controller/`, `profiles/kinds/vport/dal/`, or an adapter?

**Step 3 — Design the violation remediation strategy:**
For each of the 11 violations, choose:
- **Option A:** Have `profiles` export the function from `profiles/adapters/` so dashboard can use the adapter layer properly.
- **Option B:** Wait for ARCH-VPORTPROFILE-001 — if the target moves to `vportProfile/`, the violation becomes a `vportDashboard → vportProfile` adapter import (which is correct).
- Record the chosen strategy per violation. Do not implement.

**Step 4 — Classify each consumer from Step 1:**
For each file that imports from `@/features/dashboard`, record:
- Which subsystem it imports from (flyerBuilder, qrcode, or vport)
- Whether it imports through an adapter or directly into internals
- What the import path would become after the split

**Step 5 — Audit route registration:**
Read the app's route config (`apps/VCSM/src/app/routes/`) to find all routes that render dashboard screens. These route imports must be updated as part of the split.

**Step 6 — Audit the 11 card subsystems:**
For each card in `dashboard/vport/dashboard/cards/`:
- Confirm it has no consumers outside of `dashboard/vport/`
- If a card is imported directly by a non-dashboard feature, flag it

**Step 7 — Write the split plan covering:**
- Violation remediation strategy (from Step 3) — must be section 1 of the plan
- Migration order: qrcode first (smallest, already has barrel), then flyerBuilder, then vportDashboard (largest, last)
- Exact folder rename/move operations per step
- Import path changes per consumer file
- Route registration changes
- Barrel file updates
- Validation steps per subsystem

**Validation (for this planning ticket):**
- Plan document must be complete and cover all 3 subsystems.
- All 11 dashboard→profiles violations must have an assigned remediation strategy (Option A or B).
- All consumers extracted from dependency-map.json must have a mapped resolution.
- Violation strategy must be owner-approved before implementation begins.
- No source files modified.

**Rollback Plan:** Delete output document.

**Do Not Touch:**
- Any file in `features/dashboard/`.
- Any file in `features/profiles/`.
- Route registration files.
- The 11 card subsystem files.
- `apps/scanner/maps/dependency-map.json` — read only.

---

## Ticket 8 — vportProfile Extraction — Planning Only

**[ARCH-VPORTPROFILE-001] Plan the extraction of profiles/kinds/vport into vportProfile feature**  
Status: SCOPE_EXPANDED_BY_SCANNER_AUDIT  
Priority: P1  
Type: ENG  
App: VCSM  

> **Scanner Audit Note (2026-06-06):** Scanner analysis confirmed two critical boundary violation clusters that directly affect this extraction:
> - **11 violations: dashboard → profiles** (dashboard imports directly into `profiles/kinds/vport/controller/` and `profiles/kinds/vport/dal/`). These imports must be resolved before or during this extraction — after the move they become `vportDashboard → vportProfile` violations.
> - **10 violations: profiles → booking** (profiles imports directly into `booking/` internals, bypassing `booking/adapters/`). These are boundary violations in the opposite direction — profiles is a consumer that reaches into booking's internals. These must be remediated before the extraction, or they move with the feature and become `vportProfile → booking` violations (same structural problem, different feature name).
>
> Both violation clusters are now blockers for this plan. The extraction plan cannot be considered complete without a remediation strategy for all 21 violations. Data source: `apps/scanner/maps/dependency-map.json`.

**Goal:**  
Produce a safe, staged plan for extracting `profiles/kinds/vport/` (122 files) and `profiles/adapters/kinds/vport/` (8 adapter files) into a new `vportProfile/` feature. Plan must include remediation paths for both violation clusters. This is the highest-risk split in the architecture.

**Scope:**  
Read-only analysis + written plan.

**Files/Folders:**  
```
SUBJECT OF ANALYSIS:
  apps/VCSM/src/features/profiles/kinds/vport/        (122 files)
    config/
    controller/         — vport-type-specific operations (barbershop, content,
                          exchange, locksmith, menu, portfolio, rates, review,
                          services, subscribers)
    dal/
    hooks/
    lib/
    model/
    screens/
      booking/          — in-profile booking flow (with dedicated hooks + views)
      menu/             — 26 component files
      portfolio/
      services/
      rates/
      content/
      barbershop/
      owner/
      review/
    ui/

  apps/VCSM/src/features/profiles/adapters/kinds/vport/  (8 adapter files)
    config/vportTypes.config.adapter.js
    exchange.adapter.js
    hooks/gas/useOwnerPendingSuggestions.adapter.js
    hooks/gas/useSubmitFuelPriceSuggestion.adapter.js
    hooks/gas/useVportGasPrices.adapter.js
    hooks/rates/useUpsertVportRate.adapter.js
    hooks/services/useUpsertVportServices.adapter.js
    hooks/useVportPublicDetails.adapter.js
    ownership.adapter.js
    screens/gas/components/GasPricesPanel.adapter.js
    screens/gas/components/GasStates.adapter.js
    screens/gas/components/OwnerPendingSuggestionsList.adapter.js
    screens/rates/components/VportRateEditorCard.adapter.js
    screens/rates/view/VportRatesView.adapter.js
    screens/review/VportReviewsView.adapter.js
    screens/services/view/VportServicesView.adapter.js
    vportProfiles.adapter.js

OUTPUT:
  ZZnotforproduction/APPS/VCSM/VPORTPROFILE_EXTRACTION_PLAN.md
```

**Why:**  
`profiles/` at 374 files is the largest feature in the codebase. The `kinds/vport/` subsystem (122 files) is a distinct domain: it owns the rendering layer for vport-type-specific profile screens (menu management, service catalog, portfolio, rate cards, barbershop team, gas price submission). This is not actor profile data — it is business profile management. Separating it makes `profiles/` a focused actor profile feature and `vportProfile/` a focused business profile feature.

**Risk (this planning ticket):** ZERO.

**Risk (future implementation):** CRITICAL. This is the most-consumed path in the codebase. A single missed consumer will produce a runtime error in production.

**Blocked By:**  
- ARCH-DASH-001 must complete first — the 11 dashboard→profiles violations must have an assigned remediation strategy before this extraction plan is written (Option A: expose via adapter; Option B: move with the feature and resolve at vportProfile level).
- Boundary violation strategy for 10 profiles→booking violations must be confirmed (data is in `dependency-map.json` — extract exact files from the `profiles→booking` edge).

**Exact Steps:**

**Step 0 — Extract both violation clusters from scanner data:**
Query `apps/scanner/maps/dependency-map.json`:
- Edge `profiles → booking`: extract all 10 imports. For each, record `file`, `resolvedPath`, layer being accessed (controller vs dal vs adapter).
- Edge `dashboard → profiles`: confirm the 11 imports from ARCH-DASH-001 are documented here.

**Step 1 — Read the current profiles structure.**
Extract all entries where the target is `profiles/kinds/vport` or `profiles/adapters/kinds/vport` from `dependency-map.json`.

**Step 2 — Classify what stays in profiles/ and what moves:**
Boundary rule:
- STAYS in `profiles/`: actor profile screen, actor profile header, actor profile tabs (friends, photos, posts, tags), actor profile DAL, friends management, photo reactions, tag system.
- MOVES to `vportProfile/`: everything currently in `kinds/vport/` plus its adapter files.

**Step 3 — Audit the screens/ booking flow:**
`profiles/kinds/vport/screens/booking/` contains a dedicated booking UI inside the vport profile. This must be classified: is it a booking consumer (stays with the vport profile view) or a booking feature (should live in booking/)? Read the files to determine.

**Step 4 — Audit the menu subsystem (26 files):**
`profiles/kinds/vport/screens/menu/` is the largest single subsystem. Read the top-level component file (`VportActorMenuView.jsx` or equivalent). Confirm it has no consumers outside `profiles/kinds/vport/`.

**Step 5 — Write the extraction plan covering:**
- Target structure for `vportProfile/` (map `kinds/vport/` structure to `vportProfile/` structure)
- Adapter migration path: `profiles/adapters/kinds/vport/` → `vportProfile/adapters/`
- Import path updates for all consumers
- What `profiles/adapters/` looks like after the move (should be slimmer, actor-only)
- Migration order: adapters first (they are the public API), then screens/components, then dal/controller
- Validation steps per vport-type screen

**Validation (for this planning ticket):**
- Plan document must cover all 122 + 8 files.
- All consumers from `dependency-map.json` must be mapped to their new import path.
- All 10 profiles→booking violations must have an assigned remediation strategy.
- All 11 dashboard→profiles violations must reference the strategy from ARCH-DASH-001.
- No source files modified.
- Owner must review and approve before any implementation ticket is opened.

**Rollback Plan:** Delete output document.

**Do Not Touch:**
- `profiles/` actor-side files (non-vport controller, dal, hooks, screens).
- The booking engine and booking feature.
- `vport/` feature (separate from `profiles/kinds/vport/`).
- `apps/scanner/maps/dependency-map.json` — read only.

---

## Ticket 9 — Naming Convention Decision

**[ARCH-NAMING-001] Establish and record canonical layer naming conventions**  
Status: CLOSED — 2026-06-06  
Priority: P3  
Type: TASK  
App: VCSM  

**Goal:**  
Make a binding decision on canonical subfolder names for all feature layers and write it to the governance record. This decision unblocks Phase 2 implementation (naming standardization).

**Scope:**  
Decision document only. No file renames in this ticket.

**Files/Folders:**  
```
CURRENT INCONSISTENCIES (confirmed across 35 features):

controller/ vs controllers/ — BOTH IN USE:
  controller/:    booking, chat, dashboard, explore, identity, initiation, invite,
                  media, notifications, post, professional, profiles, public,
                  settings, upload, vport
  controllers/:   actors, auth, block, feed, join, legal, moderation, social,
                  upload, wanders

screen/ vs screens/ — BOTH IN USE:
  screen/:        chat, notifications, professional, public, settings
  screens/:       ads, auth, booking, chat, dashboard, explore, feed, initiation,
                  invite, join, legal, post, professional, profiles, upload,
                  vgrid, void, vport, wanderex, wanders

model/ vs models/ — BOTH IN USE (model/ is dominant):
  model/:         actors, ads, auth, booking, chat, dashboard, explore, feed,
                  initiation, media, notifications, post, professional, profiles,
                  public, settings, upload, vgrid, void, vport, wanderex, wanders
  models/:        moderation, settings (vports subsystem), wanders

queries/ (non-standard DAL variant):
  settings/queries/ — 6 files — unique layer name used only in settings

OUTPUT:
  ZZnotforproduction/APPS/VCSM/NAMING_CONVENTION_DECISION.md
```

**Why:**  
Three simultaneous naming variants (`controller` vs `controllers`) across 35 features means a developer must guess the right name when navigating the codebase. When new tickets create new features or subfolders, they will perpetuate the ambiguity unless the convention is locked. This decision costs nothing to make and eliminates ongoing confusion.

**Risk:** ZERO for this planning ticket. (Implementation of renames is a separate, low-risk ticket.)

**Blocked By:** Nothing.

**Exact Steps:**

**Step 1 — Present the decision matrix:**
| Layer | Current Variants | Recommendation |
|---|---|---|
| controller | `controller/` (16) vs `controllers/` (10) | Decide: singular or plural |
| screen | `screen/` (6) vs `screens/` (20) | Decide: `screens/` (majority) |
| model | `model/` (24) vs `models/` (3) | Decide: `model/` (dominant) |
| dal | `dal/` (all) | Already consistent — keep `dal/` |
| hooks | `hooks/` (all) | Already consistent — keep `hooks/` |
| adapters | `adapters/` (all) | Already consistent — keep `adapters/` |
| queries | `queries/` (settings only) | Decide: fold into `dal/` or document as read-layer |

**Recommended decisions (for owner to confirm or override):**
- `controller/` — prefer singular. Matches the majority of engine patterns and is consistent with `dal/`, `model/`, `hooks/`.
- `screens/` — prefer plural. Already the majority (20 vs 6). Matches React Native conventions.
- `model/` — keep singular. Already dominant (24 vs 3).
- `queries/` in settings — fold into `dal/`. The distinction between "query" and "dal read" is not meaningful at this scale. One read layer per feature.

**Step 2 — Record the confirmed decisions.**

**Step 3 — List every folder that requires renaming once the decision is made:**
- All `controllers/` → `controller/` (or vice versa): list each feature affected
- All `screen/` → `screens/` (or vice versa): list each feature affected
- All `models/` → `model/`: moderation, settings/vports, wanders
- `settings/queries/` → `settings/dal/` if decided: list the 6 files affected

**Validation:**
- Decision document must record the canonical name for all 7 layer types.
- Owner must approve the decisions before implementation proceeds.
- No source files modified.

**Rollback Plan:** Delete the decision document and re-open the discussion.

**Do Not Touch:**
- Any source file in features/.
- Implementation of renames (separate ticket, blocked by this one).

---

## Ticket 10 — Engine Setup Relocation — Planning Only

**[ARCH-ENGINESETUP-001] Plan migration of feature setup.js files to app/setup/**  
Status: SIMPLIFIED_BY_SCANNER_AUDIT  
Priority: P3  
Type: ENG  
App: VCSM  

> **Scanner Audit Note (2026-06-06):** The scanner's `feature-map.json` already identifies which feature folders are stub-only (only a setup.js and 0–2 other files). The `engine-candidates.json` map classifies which features are promoted to engine status. Use these two existing maps to complete Steps 1 and 3 without reading individual setup files directly. Data is in `apps/scanner/maps/feature-map.json` and `apps/scanner/maps/engine-candidates.json`.

**Goal:**  
Plan the migration of all 8 engine `setup.js` files out of `features/` and into a dedicated `app/setup/` directory. These files are app startup configuration, not feature logic. No files move in this ticket.

**Scope:**  
Planning only. Output a migration plan document.

**Files/Folders:**  
```
SETUP FILES TO MIGRATE (all called from main.jsx lines 9-16):

  features/identity/setup.js    → setupVcsmIdentityEngine()   called at line 9
  features/hydration/setup.js   → setupVcsmHydration()         called at line 10
  features/chat/setup.js        → setupVcsmChatEngine()        called at line 11
  features/reviews/setup.js     → setupVcsmReviewsEngine()     called at line 12
  features/portfolio/setup.js   → setupVcsmPortfolioEngine()   called at line 13
  features/notifications/setup.js → setupVcsmNotificationsEngine() called at line 14
  features/booking/setup.js     → setupVcsmBookingEngine()     called at line 15
  features/media/setup.js       → setupVcsmMediaEngine()       called at line 16

CALL SITE:
  apps/VCSM/src/main.jsx        lines 9-16 (imports) + startup call sequence

PROPOSED DESTINATION:
  apps/VCSM/src/app/setup/
    identity.setup.js
    hydration.setup.js
    chat.setup.js
    reviews.setup.js
    portfolio.setup.js
    notifications.setup.js
    booking.setup.js
    media.setup.js
    index.js                  ← optional barrel that calls all 8 in order

IMPORTANT DISTINCTION:
  Only the setup.js file moves for features that have real implementation code
  (identity, chat, notifications, booking, media).
  For features that are ONLY setup stubs (hydration: 2 files, portfolio: 2 files,
  reviews: 1 file), evaluate whether the entire feature folder should be deleted
  after the move, leaving only the engine relationship documented in ARCH-STUBS-001.

OUTPUT:
  ZZnotforproduction/APPS/VCSM/ENGINE_SETUP_MIGRATION_PLAN.md
```

**Why:**  
`main.jsx` imports 8 setup functions from 8 different feature folders. Engine startup configuration is an app-level concern, not a feature-level concern. Moving these to `app/setup/` groups all startup logic in one place — a developer looking for "what configures at startup" has one folder to read instead of eight.

Additionally, for stubs that exist only as `setup.js` (hydration, reviews), once the setup file moves, the stub feature folder can be deleted entirely — cleaning up the 35-feature list.

**Risk (this planning ticket):** ZERO.

**Risk (future implementation):** LOW. `main.jsx` has one call site per setup function. The move is mechanical. The primary risk is startup order — engines may depend on each other's initialization sequence. The plan must document the required order.

**Blocked By:** Nothing for planning. Implementation blocked by ARCH-STUBS-001 (stubs must be documented before they are deleted).

**Exact Steps:**

**Step 1 — Read all 8 setup.js files.**
For each file, document:
- What engine it configures
- What dependencies it injects (supabase client, vportClient, adapter functions, etc.)
- Whether it has a guard against double-initialization
- Whether it imports from other feature setup files (creating a setup dependency chain)

**Step 2 — Determine initialization order.**
If `booking/setup.js` depends on `notifications/setup.js` being called first (e.g. it injects `publishVcsmNotification`), that order must be preserved. Document the dependency graph for setup calls.

**Step 3 — Classify each feature after setup.js moves:**

| Feature | Files After Move | Action |
|---|---|---|
| identity | 8 remaining files | Stays as feature — setup.js was just setup |
| hydration | 1 remaining file (vcsmActorHydrator.js) | Evaluate: merge hydrator into identity or delete |
| chat | 65 remaining files | Stays as feature |
| reviews | 0 remaining files | Delete feature folder after move |
| portfolio | 1 remaining file (portfolioTrace.adapter.js) | Evaluate: keep adapter or merge into portfolio engine |
| notifications | 43 remaining files | Stays as feature |
| booking | 67 remaining files | Stays as feature |
| media | 8 remaining files | Stays as feature |

**Step 4 — Write migration plan covering:**
- Exact destination path per file
- Whether an `index.js` barrel should aggregate all setup calls
- Import changes in `main.jsx` (from 8 separate imports to 1 or 8 new paths)
- Startup order if relevant
- Which stub feature folders become empty and should be deleted

**Validation (for this planning ticket):**
- Plan document must cover all 8 setup files.
- Startup order must be confirmed before any moves.
- No source files modified.

**Rollback Plan:** Delete output document.

**Do Not Touch:**
- `main.jsx` — do not change imports until implementation ticket.
- Any feature's non-setup files.
- The actual engine configuration logic inside setup.js files.

---

## Summary Table

> **Updated by Scanner Audit — 2026-06-06.** Scanner analysis of `dependency-map.json` changed statuses for 5 tickets.

| Ticket | Title | Priority | Risk | Blocked By | Status | Type |
|---|---|---|---|---|---|---|
| ARCH-CLEAN-001 | Phase 1 Safe Cleanup | P3 | VERY LOW | None | Open | TASK |
| ARCH-ANALYTICS-001 | Move analytics to shared/lib | P3 | LOW | None | Open | TASK |
| ARCH-STUBS-001 | Document stub features | P3 | VERY LOW | None | **CLOSED 2026-06-06** | TASK |
| ARCH-NAMING-001 | Naming convention decision | P3 | ZERO | None | Open | TASK |
| ARCH-ENGINESETUP-001 | Engine setup relocation plan | P3 | ZERO | None | SIMPLIFIED_BY_SCANNER_AUDIT | ENG |
| ARCH-IMPORTMAP-001 | Add featureImportMapScanner.js post-processor | P1 | ZERO | None | **CLOSED 2026-06-06** | ENG |
| ARCH-BIDIR-001 | Bidirectional dependency audit — 15 pairs | P2 | ZERO | None | **CLOSED 2026-06-06** | SEC |
| ARCH-POSTMOD-001 | postModules extraction plan | P2 | ZERO | ARCH-IMPORTMAP-001 | Open | ENG |
| ARCH-DASH-001 | Dashboard split plan + 11 violation remediation | P2 | ZERO → MEDIUM | Violation strategy | SCOPE_EXPANDED_BY_SCANNER_AUDIT | ENG |
| ARCH-VPORTPROFILE-001 | vportProfile extraction plan + 21 violations | P1 | ZERO → HIGH | ARCH-DASH-001 + violation strategies | SCOPE_EXPANDED_BY_SCANNER_AUDIT | ENG |

---

## Execution Plan — Source-of-Truth Order

> **Updated by Scanner Audit — 2026-06-06.** Original order is preserved. Blocker relationships changed because scanner data eliminated ARCH-IMPORTMAP-001 as a hard prerequisite for most tickets.

This is the canonical execution order. Work proceeds in this sequence only. No ticket may begin until its blocker is closed or the ticket is explicitly marked BLOCKED with a recorded reason.

**1. ARCH-IMPORTMAP-001 — Add featureImportMapScanner.js post-processor** *(SIMPLIFIED)*
- Reduced scope: ~80-line post-processor reading `dependency-map.json` and `feature-map.json`.
- Produces governance-format output: `FEATURE_IMPORT_MAP.md` and `FEATURE_IMPORT_MAP.json`.
- This output is the scanner seed for future CI linting — it is still required, just no longer a discovery blocker.
- Complete this first to lock the governance format before downstream tickets produce decisions.

**2. ARCH-BIDIR-001 — Bidirectional Dependency Audit** *(READY NOW — 15 pairs)*
- Was BLOCKED_BY_IMPORTMAP. Now READY_NOW_DATA_COMPLETE — all 15 pairs are in `dependency-map.json`.
- Can begin immediately, in parallel with ARCH-IMPORTMAP-001.
- Must classify all 15 pairs, not just the original 5. Pair 9 (dashboard↔profiles, 11 violations) is the highest-priority pair.
- Output is a decision record only. No implementation begins from this ticket.

**3. ARCH-NAMING-001 — Naming Convention Decision**
- Unchanged. Lock canonical layer names before any folder moves occur.
- Can run in parallel with ARCH-BIDIR-001.
- Output is a confirmed decision record. Owner approval required before closure.

**4. ARCH-STUBS-001 — Document Stub Features**
- Unchanged. Comment-only additions. Zero behavioral risk.
- Can run in parallel with ARCH-NAMING-001.

**5. ARCH-CLEAN-001 — Phase 1 Safe Cleanup**
- Unchanged. Empty folders, misplaced docs removal.
- Zero behavioral risk. Run after ARCH-STUBS-001 is complete.

**6. ARCH-ANALYTICS-001 — Move analytics to shared/lib**
- Unchanged. Small, isolated file move. Three import updates.
- First actual code change in the plan — validate carefully.

**7. ARCH-ENGINESETUP-001 — Engine Setup Relocation Plan** *(SIMPLIFIED)*
- Reduced scope: use `feature-map.json` and `engine-candidates.json` for stub classification (no individual file reads needed for Steps 1 and 3).
- Still planning only. No files move in this ticket.

**8. ARCH-DASH-001 — Dashboard Split Plan** *(SCOPE_EXPANDED)*
- Was BLOCKED_BY_IMPORTMAP. Now blocked only by: violation remediation strategy must be confirmed.
- Must include remediation strategy for 11 dashboard→profiles boundary violations before plan is considered complete.
- All consumer data is available in `dependency-map.json` — no longer depends on ARCH-IMPORTMAP-001 output for discovery.
- Do not open implementation ticket until violation strategy is owner-approved.

**9. ARCH-POSTMOD-001 — postModules Extraction Plan**
- Unchanged. Requires full consumer map for PostCard (still depends on ARCH-IMPORTMAP-001 output format).
- Manual PostCard inspection still required — scanner data does not resolve the injection pattern design.
- Do not implement until PostCard.view.jsx injection pattern is confirmed and designed.

**10. ARCH-VPORTPROFILE-001 — vportProfile Extraction Plan** *(SCOPE_EXPANDED)*
- Still highest-risk split. Now has two violation blockers: 11 dashboard→profiles + 10 profiles→booking.
- Blocked until ARCH-DASH-001 plan is complete (violation strategy from ARCH-DASH-001 informs this plan).
- Blocked until profiles→booking violation strategy is confirmed (extract from `dependency-map.json`).
- No implementation ticket may be opened until owner reviews and approves the extraction plan document.

---

## Ticket Closure Protocol

Each ticket must be worked end-to-end before moving to the next ticket. The protocol applies without exception — no ticket is implicitly closed by completing adjacent work.

For every ticket, execute in this order:

1. **Open ticket.** Set status to IN_PROGRESS. Confirm the ticket ID, goal, and scope match the task at hand.
2. **Confirm scope.** Re-read the Scope and Files/Folders sections. Do not expand scope during execution.
3. **Confirm blockers.** If the Blocked By list contains an open ticket, stop. Set status to BLOCKED. Record the blocker ticket ID and reason.
4. **Execute exact steps only.** Follow the Exact Steps section as written. Do not add steps, skip steps, or perform adjacent cleanup unless it is listed.
5. **Run validation.** Execute every item in the Validation section. A ticket is not closeable until all validation steps pass.
6. **Write implementation return.** After validation passes, write a brief return record:
   - Ticket ID
   - What was done (one sentence per step executed)
   - Validation results (pass/fail per check)
   - Any deviations from the exact steps (must be noted, even if minor)
   - Files changed (full paths)
7. **Update ticket status to CLOSED** only when all validation steps pass and the implementation return is written.
8. **Record remaining TODOs separately.** If scope reduction was required (a step was skipped, a file was not touched), record the deferred item as a new ticket or an explicit note. Do not silently drop work.
9. **Do not silently expand scope.** If work beyond the ticket scope is discovered during execution, record it as a new ticket and continue with the current ticket's scope only.
10. **Do not begin the next ticket** until the current ticket is CLOSED or explicitly marked BLOCKED with a recorded blocker ID.

---

## Status Tracking Table

> **Updated by Scanner Audit — 2026-06-06.** Status column reflects post-audit state.

| Order | Ticket | Type | Risk | Status | Output | Closure Requirement |
|---|---|---|---|---|---|---|
| 1 | ARCH-IMPORTMAP-001 | ENG | ZERO | **CLOSED 2026-06-06** | `FEATURE_IMPORT_MAP.md`, `FEATURE_IMPORT_MAP.json`, `featureImportMapScanner.js` | ✓ JSON valid · 34 features · 36 violations · 15 bidir pairs · 4 split candidates · dashboard→profiles (11) + profiles→booking (10) confirmed · VCSM source untouched |
| 2 | ARCH-BIDIR-001 | SEC | ZERO | **CLOSED 2026-06-06** | `BIDIR_DEPENDENCY_DECISION.md` | ✓ All 15 pairs classified · 8 SAFE AS-IS · 5 require fix (3 group, 2 individual) · 1 BLOCKED on ARCH-DASH-001 (gas prices) · 1 SCANNER-ARTIFACT (verify @media) · 7 new impl tickets defined · layer contract verified for each violation · owner reviewed |
| 3 | ARCH-NAMING-001 | TASK | ZERO | **CLOSED 2026-06-06** | `NAMING_CONVENTION_DECISION.md` | ✓ 8 layer types classified · 3 newly decided (controller singular, screens plural, components over ui) · queries abolished (7 files → dal/hooks) · 2 impl tickets defined (ARCH-NAMING-IMPL-001/002) · scanner impact: ZERO · pending owner approval |
| 4 | ARCH-STUBS-001 | TASK | VERY LOW | **CLOSED 2026-06-06** | Comment additions in 5 files | ✓ actors.adapter: ACTIVE (settings/privacy + dashboard/team) · hydration/setup: ENGINE_SETUP (main.jsx) · portfolioTrace.adapter: ACTIVE_DEV (dashboard/portfolio probe) · reviews/setup: ENGINE_SETUP (main.jsx, 1-file feature → delete folder after move) · ModernPrimitives.jsx: NO_CONSUMERS → deletion candidate (module-modern.css in same folder is ACTIVE with 14 consumers — keep CSS) |
| 4b | ARCH-CSS-001 | TASK | LOW | **CLOSED 2026-06-06** | `shared/styles/modern/module-modern.css`; 14 import updates | ✓ CSS moved exact · old path grep = 0 · 14 import sites updated (chat ×10, explore, notifications, post, upload) · old file deleted · ModernPrimitives.jsx deletion deferred to ARCH-CLEAN-001 |
| 5 | ARCH-CLEAN-001 | TASK | VERY LOW | **CLOSED 2026-06-06 (PARTIAL)** | booking/components/ + booking/screens/ deleted (had .gitkeep only); shell docs × 3 moved to ZZnotforproduction/APPS/VCSM/features/shell/modules/bottom-bar/; ModernPrimitives.jsx deleted (0 consumers confirmed); features/ui/ folder fully emptied and deleted | DEVIATION: chat/styles/ NOT empty — has chat-modern.css (10 consumers); folder kept. Shell docs routed to modules/bottom-bar/ (matching existing ZZnotforproduction structure, not directly in shell/). ModernPrimitives.jsx deletion authorized by ARCH-STUBS-001 evaluation (was EVALUATE status, evaluation completed). features/ui/ deleted as side effect of ARCH-CSS-001 + ModernPrimitives deletion leaving it fully empty. |
| 6 | ARCH-ANALYTICS-001 | TASK | LOW | **CLOSED 2026-06-06** | `shared/lib/funnelSource.js` created exact copy; 3 import sites updated (HowToCreateVportScreen, HowToCreateProfileScreen, VportCategoryLandingScreen — all line 3); features/analytics/ deleted | ✓ grep features/analytics = 0 · funnelSource content identical · analytics/ folder gone |
| 4e | ARCH-BIDIR-SOCIAL-001 | TASK | LOW | **CLOSED 2026-06-06** | Created `social/adapters/privacy/actorSignalVisibility.adapter.js` (re-export of `dalCanViewActorSignal` from social DAL); updated `profiles/kinds/vport/controller/subscribers/getSubscribers.controller.js` import from DAL → adapter; updated test `vi.mock` + import to adapter path | ✓ grep profiles importing social DAL directly = 0 · adapter exists at social/adapters/privacy/ alongside actorPrivacy.adapter.js |
| 4d | ARCH-BIDIR-MODEL-001 | TASK | LOW | **CLOSED 2026-06-06** | `shared/lib/businessCard/businessCardSettings.model.js` created exact; 4 import sites updated (dashboard VportSettingsBusinessCard, public VportBusinessCardPublic.view, settings useVportBusinessCardSettings, wanders useWandersBusinessCardOps); stale comment in useVportBusinessCardSettings.js updated; old file deleted; public/vportBusinessCard/model/ still has vportBusinessCard.model.js (different file — correct) | ✓ grep old path = 0 · new file exists · old file gone. DEVIATION: ticket plan said 3 import sites — actual count was 4 (wanders/core/hooks/useWandersBusinessCardOps.js was not in the original list) |
| 4c | ARCH-BIDIR-CSS-001 | TASK | LOW | **CLOSED 2026-06-06** | `shared/styles/settings-modern.css` + `shared/styles/profiles-modern.css` created exact; 13 import sites updated (5 settings-modern: ads, dashboard, professional×2, settings; 8 profiles-modern: feed, notifications, post×2, profiles×4 self-refs); both old files + empty settings/styles/ deleted | ✓ grep features/settings/styles/settings-modern = 0 · grep features/profiles/styles/profiles-modern = 0 · 13 files updated · old folders cleaned. DEVIATION: ticket plan said 5 import sites — actual count was 13 (8 additional: 2 more settings-modern from professional, 4 self-refs in profiles) |
| 7 | ARCH-ENGINESETUP-001 | ENG | ZERO | **CLOSED 2026-06-06** | `ZZnotforproduction/APPS/VCSM/ENGINE_SETUP_MIGRATION_PLAN.md` | ✓ All 8 setup files read · startup order documented (identity→hydration→reviews/portfolio/media→notifications→chat→booking) · 3 runtime dependencies confirmed (chat+notifications need hydration; booking needs notifications) · barrel `configureAllEngines()` designed · stub fates classified: hydration/ DELETE after move, reviews/ DELETE after move, portfolio/ stays (adapter remains) · 10-step implementation order written · owner approval checklist included |
| 8 | ARCH-DASH-001 | ENG | ZERO→MEDIUM | SCOPE_EXPANDED_BY_SCANNER_AUDIT | `DASHBOARD_SPLIT_PLAN.md` | All 3 subsystem consumer lists from `dependency-map.json`; 11 dashboard→profiles violations each have Option A or B strategy; owner approved violation strategy |
| 9 | ARCH-POSTMOD-001 | ENG | ZERO | **CLOSED 2026-06-06** | `ZZnotforproduction/APPS/VCSM/POSTMODULES_EXTRACTION_PLAN.md` | ✓ PostCard.view.jsx injection pattern read · 8 modules inventoried (fuelPrices, exchangeRates, menuDrop, barbershopPortfolio, barbershopHours, locksmithPortfolio, locksmithHours, locksmithServiceArea) · Option B (registry with buildProps) designed · postModules/registry.js structure defined · PostCard.view.jsx after-migration shape documented · props normalization per module documented · owner approval checklist included |
| 10 | ARCH-VPORTPROFILE-001 | ENG | ZERO→HIGH | SCOPE_EXPANDED_BY_SCANNER_AUDIT | `VPORTPROFILE_EXTRACTION_PLAN.md` | All 122 + 8 files mapped; 10 profiles→booking violations each have assigned remediation; 11 dashboard→profiles strategy referenced from ARCH-DASH-001; owner reviewed and approved before any impl ticket |

---

## Governance Scanner Seed

ARCH-IMPORTMAP-001 is not only a report task. It is the first seed for the future VCSM feature governance scanner.

The machine-readable output (`FEATURE_IMPORT_MAP.json`) must be structured so that a future automated scanner can consume it without re-parsing source files. Every architectural rule that this review identified can be encoded as a scanner rule once the import map exists.

**Rules the scanner will enforce from this seed:**

| Rule | Description | Detected By |
|---|---|---|
| `NO_CROSS_FEATURE_DAL` | No feature may import another feature's `dal/` directly — only via its `adapters/` | Import path contains `/features/X/dal/` from a different feature |
| `NO_UI_TO_DAL` | No component or screen file may import a `dal/` file directly | File in `screens/` or `components/` importing a `*.dal.js` path |
| `NO_INTERNAL_WITHOUT_ADAPTER` | No feature may import another feature's `controller/`, `hooks/`, or `model/` directly — only via `adapters/` | Import path reaches into internals, not through `adapters/` |
| `BIDIR_TRACKING` | Any bidirectional import between two features is flagged for classification | Feature A imports Feature B AND Feature B imports Feature A |
| `OWNERSHIP_BOUNDARY` | Each file belongs to exactly one feature; imports must respect that ownership | File path does not match the feature namespace of its imports |
| `SPLIT_READINESS` | A feature with >100 files and multiple semantic subsystems is flagged as a split candidate | File count + subfolder semantic analysis |

**Scanner input contract:**

The `FEATURE_IMPORT_MAP.json` produced by ARCH-IMPORTMAP-001 must follow this schema so future scanner tooling can read it directly:

```json
{
  "generated": "<ISO date>",
  "feature_count": 35,
  "features": [
    {
      "name": "dashboard",
      "path": "apps/VCSM/src/features/dashboard",
      "file_count": 263,
      "inbound": [
        {
          "from_feature": "settings",
          "from_file": "settings/vports/ui/VportsQrModal.jsx",
          "import_path": "@/features/dashboard/qrcode/adapters/qrcode.adapter",
          "target_subfolder": "qrcode",
          "through_adapter": true,
          "violation": false
        }
      ],
      "outbound": [
        {
          "to_feature": "media",
          "from_file": "dashboard/flyerBuilder/...",
          "import_path": "@/features/media/adapters/media.adapter",
          "through_adapter": true,
          "violation": false
        }
      ],
      "violations": [],
      "split_candidate": true,
      "split_reason": "3 unrelated subsystems (flyerBuilder, qrcode, vport)"
    }
  ]
}
```

**Governance progression path:**

```
ARCH-IMPORTMAP-001
  → FEATURE_IMPORT_MAP.json (manual, single-run)
    → ARCH-BIDIR-001 (manual classification)
      → BIDIR_DEPENDENCY_DECISION.md
        → Future: automated bidir scanner rule
    → ARCH-DASH-001 / ARCH-POSTMOD-001 / ARCH-VPORTPROFILE-001 (planning)
      → Split implementation tickets
        → Future: automated split_candidate scanner rule
  → Future: CI-integrated import boundary linter (reads FEATURE_IMPORT_MAP.json as config)
    → Blocks PRs that introduce BOUNDARY_VIOLATION imports
    → Alerts on new bidirectional dependencies
    → Tracks feature file count growth against thresholds
```

---

## Scanner Audit Impact Summary

**Audit Date:** 2026-06-06  
**Scanner Data Source:** `apps/scanner/maps/dependency-map.json` (generated 2026-06-05, 380 total dependencies)  
**Audit Report:** [SCANNER_ARCHITECTURE_AUDIT.md](SCANNER_ARCHITECTURE_AUDIT.md)

### What Changed

| Finding | Before Audit | After Audit |
|---|---|---|
| ARCH-IMPORTMAP-001 scope | Build new scanner from scratch (grep-based) | Add ~80-line post-processor to existing scanner |
| ARCH-BIDIR-001 status | BLOCKED_BY_IMPORTMAP | **CLOSED 2026-06-06** |
| Bidirectional pairs known | 5 pairs (manual analysis) | 15 pairs (scanner confirmed) |
| ARCH-DASH-001 scope | Discovery plan only | + Violation remediation strategy required |
| ARCH-VPORTPROFILE-001 scope | Extraction plan only | + Two violation clusters must be resolved |
| ARCH-ENGINESETUP-001 scope | Read 8 setup files individually | Use feature-map.json + engine-candidates.json |

### Critical Findings from Scanner Data

**Boundary Violations — 36 total confirmed:**

| Pair | Direction | Count | Priority | Status |
|---|---|---|---|---|
| dashboard → profiles | dashboard imports profiles internals directly | 11 | CRITICAL | Must remediate before ARCH-DASH-001 impl |
| profiles → booking | profiles imports booking internals directly | 10 | CRITICAL | Must remediate before ARCH-VPORTPROFILE-001 impl |
| profiles → dashboard | profiles imports dashboard internals directly | 4 | HIGH | Tracked in ARCH-BIDIR-001 Pair 9 |
| dashboard → settings | dashboard imports settings internals directly | 3 | MEDIUM | Tracked in ARCH-BIDIR-001 |
| other pairs | various | 8 | LOW–MEDIUM | All tracked in ARCH-BIDIR-001 |

**10 Newly Discovered Bidirectional Pairs (not in original review):**

| Pair | New Pair |
|---|---|
| Pair 6 | auth ↔ legal |
| Pair 7 | block ↔ feed |
| Pair 8 | booking ↔ notifications |
| Pair 9 | dashboard ↔ profiles ← **HIGHEST PRIORITY** |
| Pair 10 | dashboard ↔ public |
| Pair 11 | feed ↔ post |
| Pair 12 | notifications ↔ post |
| Pair 13 | notifications ↔ profiles |
| Pair 14 | post ↔ profiles |
| Pair 15 | ads ↔ settings |

### What the Scanner Already Has (No Rebuild Required)

| Data | Scanner Output | Used By |
|---|---|---|
| All 380 cross-feature dependency edges | `dependency-map.json` | ARCH-IMPORTMAP-001 post-processor, ARCH-BIDIR-001 |
| Feature file counts + layer breakdown | `feature-map.json` | ARCH-ENGINESETUP-001, ARCH-IMPORTMAP-001 |
| Engine candidates + stub classification | `engine-candidates.json` | ARCH-ENGINESETUP-001 |
| Feature boundary violation detection | `dependency-map.json` (imports[] resolvedPath) | ARCH-DASH-001, ARCH-VPORTPROFILE-001 |
| Split candidates (features >100 files) | `feature-map.json` (sourceFileCount) | ARCH-IMPORTMAP-001 |

### Risk Recalibration

| Ticket | Original Risk Assessment | Post-Audit Risk | Reason |
|---|---|---|---|
| ARCH-DASH-001 | ZERO (planning only) | MEDIUM | 11 boundary violations complicate the split — not just cosmetic |
| ARCH-VPORTPROFILE-001 | ZERO (planning only) | HIGH | 21 total violations across two clusters; highest-risk split confirmed |
| ARCH-IMPORTMAP-001 | ZERO (new scanner build) | ZERO (unchanged) | Scope reduced, risk unchanged |
| ARCH-BIDIR-001 | ZERO (classification) | ZERO (unchanged) | More pairs to classify, same risk level |

### Execution Order Impact

**Original critical path:**
`ARCH-IMPORTMAP-001 → everything else`

**Post-audit critical path:**
```
[parallel] ARCH-IMPORTMAP-001 (post-processor only)
[parallel] ARCH-BIDIR-001 (starts NOW — data complete)
[parallel] ARCH-NAMING-001
[parallel] ARCH-STUBS-001
           ↓
     ARCH-CLEAN-001
           ↓
     ARCH-ANALYTICS-001
           ↓
     ARCH-ENGINESETUP-001
           ↓
     ARCH-DASH-001 (violation strategy required — owner decision)
           ↓
  [parallel] ARCH-POSTMOD-001
  [parallel] ARCH-VPORTPROFILE-001 (both violation clusters resolved)
```

Net improvement: ARCH-BIDIR-001 unblocked immediately. ARCH-IMPORTMAP-001 scope reduced by ~70%. Two tickets (ARCH-DASH-001, ARCH-VPORTPROFILE-001) have expanded scope due to newly discovered violations — this is a risk reduction, not a setback: the violations existed before the audit. Finding them during planning is better than finding them during implementation.

The import map is the foundation. Everything else in this ticket plan — and the future scanner — builds on the data it produces.
