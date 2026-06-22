# ARCH-NAMING-001 — Naming Convention Decision Record

**Date:** 2026-06-06  
**Ticket:** ARCH-NAMING-001  
**Status:** DRAFT — pending owner approval  
**Source of truth:** Filesystem audit of `/apps/VCSM/src/features/` (2026-06-06)  
**No files renamed in this document.**

---

## Method

All counts are from live filesystem queries, not from scanner outputs. The scanner normalizes `controller/` and `controllers/` to the same layer string — it deliberately absorbs inconsistency. The decisions below are based on raw directory counts and file weights, not scanner classification.

---

## Decision Matrix

### Layer 1 — controller/

**Current variants in use:**

| Variant | Features | Files |
|---|---|---|
| `controller/` (singular) | booking, chat, dashboard, explore, identity, initiation, invite, media, notifications, post, professional, profiles, public, settings, upload, vport | 162 |
| `controllers/` (plural) | actors, auth, block, feed, join, legal, moderation, social, upload, wanders | 57 |

**Overlap — features using BOTH:**
- `upload` — has `controller/` (2 files: recordPostMedia.controller.js, searchMentionSuggestions.controller.js) and `controllers/` (1 file: createPost.controller.js)

**Recommended canonical name:** `controller/` (singular)

**Reason:**
1. File weight: 162 vs 57 — singular holds 3× more files.
2. Feature weight: 16 vs 10 — singular is used by 60% of features.
3. The dominant, highest-activity features (dashboard, profiles, booking, notifications, post) all use singular.
4. Consistency with all other established layer names: `dal/`, `model/`, `hooks/` are all singular.
5. Layer semantics: a folder name describes what the layer IS, not how many files it has. "controller" is the layer type. The plural reads as "a folder of controllers" which is redundant — every layer folder is a folder of its type.

**Risk of future rename (controllers/ → controller/):**
- MEDIUM — 57 files across 9 features (excluding upload).
- Each file rename requires finding and updating every `@/features/{feature}/controllers/` import that references the renamed path. There are 57 source files but potentially more import sites.
- The scanner's `layerFromPath()` already normalizes both to the same layer — the rename has zero scanner impact.
- Renames within a feature are low blast radius; they do not affect cross-feature adapter boundaries.
- `auth/controllers/` is imported by multiple hooks inside `auth/` itself — the import update scope is self-contained per feature.

**Implementation ticket needed:** YES — `ARCH-NAMING-IMPL-001` (after owner approval of this document)

---

### Layer 2 — screen/

**Current variants in use:**

| Variant | Features / Locations | Files |
|---|---|---|
| `screens/` (plural) | ads, auth, booking, chat (×2 subsystems), dashboard (×4 subsystems), explore, feed, initiation, invite, join, legal, post (×2), professional (×2), profiles (×3), public (top), upload, vgrid, void, vport, wanderex, wanders | 262 |
| `screen/` (singular) | notifications (top-level), settings (top-level), chat/conversation, professional/briefings, public/vportBusinessCard, public/vportMenu | 17 |

**Note — settings/screen/:** Contains exactly 1 file: `SettingsScreen.jsx`.  
**Note — notifications/screen/:** Contains subdirs `hooks/` and `views/` (not screen files directly). It is a subsystem module, not a screen file holder.

**Recommended canonical name:** `screens/` (plural)

**Reason:**
1. File weight: 262 vs 17 — plural holds 15× more files.
2. Usage breadth: plural appears in 21 features; singular appears in 6 locations.
3. React Native community convention is `screens/` (plural). This codebase targets iOS via React Native — matching platform convention reduces friction.
4. All new features created after the initial architecture settled on `screens/` — the singular occurrences are concentrated in older or smaller features.
5. The singular usages are all either: a single-file module (settings/screen: 1 file), or a nested subsystem where the parent module didn't inherit the top-level convention.

**Exception — notifications/screen/:**  
`notifications/screen/` functions as a module boundary, not a screens folder. Its contents are `hooks/` and `views/` subdirs. Renaming to `notifications/screens/` is still correct for path consistency; the internal structure stays unchanged.

**Risk of future rename (screen/ → screens/):**
- LOW — 17 files across 6 locations.
- All 6 locations are self-contained (no cross-feature imports reference them directly — they are internal paths).
- Import updates are confined to within-feature import statements.

**Implementation ticket needed:** YES — included in `ARCH-NAMING-IMPL-001`

---

### Layer 3 — model/

**Current variants in use:**

| Variant | Features / Locations | Files |
|---|---|---|
| `model/` (singular) | actors, ads, auth, booking, chat, dashboard, explore, feed, initiation, media, notifications, post, professional, profiles, public, settings/profile, settings/vports, social/friend/subscribe, upload, vgrid, void, vport, wanderex, wanders | 106 |
| `models/` (plural) | moderation, settings/privacy, social/friend/request, wanders | 6 |

**Overlap — features using BOTH:**
- `wanders` — has `wanders/model/` (1 file: wandersSharePreview.model.js) and `wanders/models/` (3 files: wandersCardKey.model.js, wandersMailboxItem.model.js, wandersReply.model.js). The content split is arbitrary — all 4 are wanders domain models.
- `social` — has `social/friend/subscribe/model/` and `social/friend/request/models/` within different subsystems.

**Recommended canonical name:** `model/` (singular)

**Reason:**
1. File weight: 106 vs 6 — singular holds 18× more files.
2. Feature weight: singular appears in 24 locations, plural in only 4.
3. Consistent with `dal/`, `hooks/`, `controller/` — all singular.
4. The plural occurrences are all in sub-feature paths (settings/privacy, social/friend/request) or in wanders where two sibling folders should have been one.
5. The wanders split is a clear oversight — `wandersSharePreview.model.js` ended up in `model/` while three other wanders domain models ended up in `models/`. They belong together in `model/`.

**Risk of future rename (models/ → model/):**
- VERY LOW — 6 files across 4 locations.
- moderation/models → moderation/model: small, isolated feature.
- settings/privacy/models → settings/privacy/model: 1–2 files, internal to settings.
- social/friend/request/models → social/friend/request/model: internal to social's request subsystem.
- wanders/models → wanders/model (merge): 3 files merge into existing wanders/model.

**Implementation ticket needed:** YES — included in `ARCH-NAMING-IMPL-001`

---

### Layer 4 — queries/

**Current variants in use:**

| Variant | Features | Files | File types |
|---|---|---|---|
| `dal/` | All features (consistent) | 26+ directories | DAL functions (plain JS) |
| `queries/` (non-standard) | feed, settings | 7 files | Mixed: hooks + plain JS |

**File inventory:**
- `feed/queries/fetchCentralFeedPage.js` — 1 file. A plain function (no `use` prefix, no React state). Semantically: a DAL read function.
- `settings/queries/useAccountSettings.js` — 1 file. A React hook.
- `settings/queries/useBlockedCitizens.js` — 1 file. A React hook.
- `settings/queries/usePrivacySettings.js` — 1 file. A React hook.
- `settings/queries/useProfileSettings.js` — 1 file. A React hook.
- `settings/queries/useUpdateVportVisibility.js` — 1 file. A React hook (name suggests mutation but filename puts it in queries).
- `settings/queries/useUserVports.js` — 1 file. A React hook.

**Recommended canonical name:** Abolish `queries/`. Reclassify content.

- `feed/queries/fetchCentralFeedPage.js` → `feed/dal/` (it is a DAL read function, not a hook)
- `settings/queries/*.js` (6 hook files) → `settings/hooks/` or appropriate subsystem hooks folder

**Reason:**
1. `queries/` appears in only 2 features out of 34 — it is not a platform convention, it is an outlier.
2. The content does not represent a new architectural layer. It is either a DAL function (feed) or React hooks (settings).
3. The naming implies a "read-only" distinction that is not enforced architecturally. `useUpdateVportVisibility.js` is a mutation hook in a folder called `queries/` — the distinction has already broken down.
4. Having a third name for the data-access layer (`dal/`, `queries/`) with no semantic difference creates navigation overhead.
5. `dal/` is the established name for data access functions. React hooks wrapping DAL calls belong in `hooks/`.

**Risk of future move:**
- VERY LOW — 7 files across 2 features.
- The feed file move adds 1 file to `dal/`.
- The settings move adds 6 files to hooks. Import sites for these 6 settings hooks need updating — these are already violation sites in the import map (dashboard imports them directly), so the import updates overlap with ARCH-BIDIR-001's settings remediation work.

**Implementation ticket needed:** YES — included in `ARCH-NAMING-IMPL-001`, but the settings hooks move is coordinated with `ARCH-BIDIR-SETTINGS-001` to avoid double-patching import sites.

---

### Layer 5 — adapters/

**Current variants in use:**

| Variant | Features | Count |
|---|---|---|
| `adapters/` | All features using adapters | 75+ directories at all nesting levels |

No variant exists. `adapters/` is universally used at all levels: top-level (`feature/adapters/`), subsystem-level (`feature/domain/adapters/`), and adapter sub-paths (`feature/adapters/ui/`, `feature/adapters/hooks/`).

**Recommended canonical name:** `adapters/` — already consistent.

**Decision:** NO CHANGE. `adapters/` is locked.

**Special sub-path — `adapters/ui/`:**  
`upload/adapters/ui/` contains adapter-exposed UI components. This is the correct pattern for adapter surface declaration: `adapters/` holds the boundary, and `adapters/ui/` sub-paths expose UI components at the boundary. This pattern is **not** the same as the top-level `ui/` layer covered in Layer 7. Do not rename `adapters/ui/` — it is a sub-path within adapters, not a competing layer name.

**Implementation ticket needed:** NO.

---

### Layer 6 — hooks/

**Current variants in use:**

| Variant | Features | Count |
|---|---|---|
| `hooks/` | All features using hooks | 21+ directories at second level alone |

No variant exists. `hooks/` is universally used.

**Recommended canonical name:** `hooks/` — already consistent.

**Decision:** NO CHANGE. `hooks/` is locked.

**Implementation ticket needed:** NO.

---

### Layer 7 — components/ vs ui/

**Current variants in use:**

| Variant | At top feature level | At any depth | Files |
|---|---|---|---|
| `components/` | auth, booking, debug, feed, initiation, moderation, social, vport, wanderex, wanders (10) | 21 features | 291 |
| `ui/` (standalone layer) | ads, auth, block, explore, profiles, settings, upload, vgrid, void (9) | 13 features | 85 |

**At-top-level overlap:** `auth` has both `auth/ui/` and `auth/components/`.

**Content analysis:**

| Path | Content | What it actually is |
|---|---|---|
| `settings/ui/` | Card.jsx, Row.jsx | Reusable UI primitives for settings layout |
| `profiles/ui/` | PrivateProfileGate.jsx, UnavailableProfileGate.jsx | Gate/guard components |
| `notifications/inbox/ui/` | NotificationItem.view.jsx, Notifications.view.jsx, NotificationsHeader.view.jsx | View-level notification row components |
| `ads/ui/` | VportAdsBackButton.jsx, adsPipeline.ui.js, components.jsx | Mixed — button, pipeline util, sub-barrel |
| `auth/ui/` | index.js | Barrel re-export only |
| `auth/components/` | ConsentCheckbox.jsx, RegisterFormCard.jsx | Form components |

**Third variant found — `views/`:**  
`views/` sub-directories appear under `screens/` in 4 features:
- `notifications/screen/views/` — NotificationsScreenView.jsx, MyAppointmentsView.jsx
- `professional/professional-nurse/screens/views/`
- `profiles/kinds/vport/screens/views/`
- `profiles/screens/views/`

These are NOT a top-level layer — they are sub-folders within `screens/` used to separate composed page sections from raw screen entry points.

**Recommended canonical names:**

| Sub-decision | Canonical | Rationale |
|---|---|---|
| Atomic/reusable UI elements | `components/` | 3.4× more files; dominant in larger features; React/RN community standard |
| Composed screen sections within a screen module | `screens/views/` | Already used in 4 features for this purpose; leave as-is |
| Adapter-exported UI | `adapters/ui/` | Leave as-is — it is under adapters, not a competing layer |

**`ui/` is non-canonical.** Features currently using top-level `ui/` should migrate to `components/`.

**Exception:** `adapters/ui/` paths under any feature are **not** subject to this rename. They are part of the adapter surface pattern, not the feature layer pattern.

**Exception:** `notifications/inbox/ui/` — this is within a subsystem module, not a top-level layer. Rename to `notifications/inbox/components/` is recommended but lower priority than top-level renames.

**Reason:**
1. File weight: 291 vs 85 — `components/` holds 3.4× more files.
2. Top-level feature count is essentially tied (10 vs 9) — no majority argument from feature count alone. The file weight tips the decision.
3. React Native community convention: `components/` is the canonical name for React UI building blocks.
4. `ui/` has no distinct semantic role. Looking at content: `settings/ui/` (Card, Row) and `auth/components/` (ConsentCheckbox, RegisterFormCard) are the same kind of content. `ui/` is not used consistently to mean something different from `components/`.
5. `views/` as a sub-path within `screens/` does describe a distinct role (composed sections, not full-screen entries) and is already used consistently in the 4 locations where it appears. It does not need to change.

**Risk of future rename (ui/ → components/):**
- MEDIUM — 85 files.
- Features with existing `components/` AND `ui/` (auth at top level) require content merge, not just rename. The merge is trivial (move files from one folder to the other) but must be done carefully to avoid duplicate barrel exports.
- The `notifications/inbox/ui/` rename is lower priority — it is internal to a subsystem and has no cross-feature import sites.
- `adapters/ui/` paths are exempt and must not be renamed.

**Implementation ticket needed:** YES — `ARCH-NAMING-IMPL-002` (separate from controller/screen/model renames due to higher content-merge risk)

---

## Final Naming Standard

The canonical layer names for all VCSM features are:

| Layer | Canonical Name | Status | Notes |
|---|---|---|---|
| Business logic | `controller/` | **NEWLY DECIDED** | Singular. Rename `controllers/` → `controller/` |
| Data access | `dal/` | CONFIRMED | Already consistent |
| React hooks | `hooks/` | CONFIRMED | Already consistent |
| Domain model | `model/` | CONFIRMED | Already dominant; rename `models/` → `model/` |
| Adapter boundary | `adapters/` | CONFIRMED | Already consistent |
| Screen entry points | `screens/` | **NEWLY DECIDED** | Plural. Rename `screen/` → `screens/` |
| Reusable UI | `components/` | **NEWLY DECIDED** | Rename `ui/` → `components/` |
| Composed page sections | `screens/views/` | CONFIRMED | Sub-path within screens/, not a top-level layer |
| Adapter UI surface | `adapters/ui/` | CONFIRMED | Sub-path within adapters/, exempt from ui/ rename |
| Read queries | (abolished) | **NEWLY DECIDED** | `queries/` → fold into `dal/` (plain functions) or `hooks/` (React hooks) |

**Rule summary:**

> Layer folders are singular except `screens/` (which follows React Native platform convention) and `adapters/` (which is a proper noun).

---

## Rename Backlog

These are the folders to rename when `ARCH-NAMING-IMPL-001` and `ARCH-NAMING-IMPL-002` are executed. No renames happen in ARCH-NAMING-001.

### Group A — controller/ renames (9 features + 1 merge)

| Feature | Current | Rename to | Files inside |
|---|---|---|---|
| actors | `actors/controllers/` | `actors/controller/` | unknown count |
| auth | `auth/controllers/` | `auth/controller/` | ~10 files |
| block | `block/controllers/` | `block/controller/` | ~8 files |
| feed | `feed/controllers/` | `feed/controller/` | ~6 files |
| join | `join/controllers/` | `join/controller/` | ~3 files |
| legal | `legal/controllers/` | `legal/controller/` | ~3 files |
| moderation | `moderation/controllers/` | `moderation/controller/` | ~8 files |
| social (×3 subsystems) | `social/friend/request/controllers/`, `social/friend/subscribe/controllers/`, `social/privacy/controllers/` | → `controller/` in each | ~10 files total |
| upload | `upload/controllers/` | merge into `upload/controller/` | 1 file (createPost.controller.js) |
| wanders | `wanders/...controllers/` (verify exact paths) | `wanders/...controller/` | ~3 files |

**Total: ~57 files + their import sites**

### Group B — screen/ renames (6 locations)

| Feature / Path | Current | Rename to | Files inside |
|---|---|---|---|
| notifications | `notifications/screen/` | `notifications/screens/` | 0 direct files (has hooks/ and views/ subdirs) |
| settings | `settings/screen/` | `settings/screens/` | 1 file (SettingsScreen.jsx) |
| chat | `chat/conversation/screen/` | `chat/conversation/screens/` | ~2 files |
| professional | `professional/briefings/screen/` | `professional/briefings/screens/` | ~2 files |
| public | `public/vportBusinessCard/screen/` | `public/vportBusinessCard/screens/` | ~1 file |
| public | `public/vportMenu/screen/` | `public/vportMenu/screens/` | ~1 file |

**Total: ~17 files + their import sites**  
**Note:** The notifications rename also requires updating any imports that reference `notifications/screen/hooks/` or `notifications/screen/views/` internally.

### Group C — model/ renames (4 locations)

| Feature / Path | Current | Rename to | Files inside |
|---|---|---|---|
| moderation | `moderation/models/` | `moderation/model/` | ~3 files |
| settings | `settings/privacy/models/` | `settings/privacy/model/` | ~1 file |
| social | `social/friend/request/models/` | `social/friend/request/model/` | ~2 files |
| wanders | `wanders/models/` | merge into `wanders/model/` | 3 files (wandersCardKey, wandersMailboxItem, wandersReply) |

**Total: ~9 files + their import sites**

### Group D — queries/ abolish (2 features)

| Feature | Current | Destination | Action | Files |
|---|---|---|---|---|
| feed | `feed/queries/fetchCentralFeedPage.js` | `feed/dal/fetchCentralFeedPage.js` | Move file, update imports | 1 |
| settings | `settings/queries/useAccountSettings.js` | `settings/hooks/useAccountSettings.js` | Move file, update imports | 1 |
| settings | `settings/queries/useBlockedCitizens.js` | `settings/hooks/useBlockedCitizens.js` | Move file, update imports | 1 |
| settings | `settings/queries/usePrivacySettings.js` | `settings/hooks/usePrivacySettings.js` | Move file, update imports | 1 |
| settings | `settings/queries/useProfileSettings.js` | `settings/hooks/useProfileSettings.js` | Move file, update imports | 1 |
| settings | `settings/queries/useUpdateVportVisibility.js` | `settings/hooks/useUpdateVportVisibility.js` | Move file, update imports | 1 |
| settings | `settings/queries/useUserVports.js` | `settings/hooks/useUserVports.js` | Move file, update imports | 1 |

**Total: 7 files**  
**Coordination note:** Settings hooks moves overlap with ARCH-BIDIR-SETTINGS-001. If ARCH-BIDIR-SETTINGS-001 runs first and adds these hooks to the settings adapter, the import paths from dashboard may already point to `settings/hooks/`. Confirm which ticket runs first before executing Group D for settings.

### Group E — ui/ → components/ renames (ARCH-NAMING-IMPL-002, separate ticket)

| Feature / Path | Current | Rename to | Files inside | Special handling |
|---|---|---|---|---|
| ads | `ads/ui/` | `ads/components/` | ~3 files | None |
| auth | `auth/ui/` | (merge into `auth/components/`) | 1 file (index.js) | Merge — auth/components/ already exists |
| block | `block/ui/` | `block/components/` | ~5 files | None |
| explore | `explore/ui/` | `explore/components/` | ~3 files | None |
| profiles | `profiles/ui/` | `profiles/components/` | 2 files | None |
| settings | `settings/ui/` | `settings/components/` | 2 files (Card.jsx, Row.jsx) | None |
| upload | `upload/ui/` | `upload/components/` | ~5 files | None; `upload/adapters/ui/` is EXEMPT |
| vgrid | `vgrid/ui/` | `vgrid/components/` | ~3 files | None |
| void | `void/ui/` | `void/components/` | ~2 files | None |
| notifications | `notifications/inbox/ui/` | `notifications/inbox/components/` | 3 files | Lower priority — internal subsystem |

**Total: ~29 files**  
**Exempt (do not rename):** `upload/adapters/ui/` — adapter surface, correct path.

---

## Blockers

**None.** This is a decision document. All decisions are computable from the current codebase state.

**Coordination note:** Group D (queries/ → hooks/) for `settings/queries/` should coordinate with ARCH-BIDIR-SETTINGS-001 to avoid patching the same import sites twice.

---

## Implementation Tickets

Two implementation tickets are required after owner approves this document:

**ARCH-NAMING-IMPL-001** — Execute Groups A, B, C, D (controller, screen, model, queries)  
- 9 feature controller renames + 1 merge  
- 6 screen renames  
- 4 model renames + 1 merge  
- 7 file moves (queries abolish)  
- Total: ~90 files moved + import updates  
- Estimated risk: LOW-MEDIUM  
- Prerequisite: owner approval of this document

**ARCH-NAMING-IMPL-002** — Execute Group E (ui/ → components/)  
- 10 locations renamed, 1 requiring content merge  
- Total: ~29 files moved  
- Estimated risk: LOW  
- Prerequisite: ARCH-NAMING-IMPL-001 complete (to confirm no `ui/` references survive in updated import paths)

---

## Scanner Impact

The scanner's `layerFromPath()` function currently normalizes both `controller/` and `controllers/` to the same layer string. After ARCH-NAMING-IMPL-001:
- The normalization is still correct (singular matches the canonical name — no scanner change needed).
- The layer counts per feature will remain accurate.
- `feature-map.json` will show cleaner layer distributions.

After ARCH-NAMING-IMPL-002:
- `components/` will be the only top-level UI layer. The scanner's component classification becomes unambiguous.

No scanner changes are required as a result of any naming rename.

---

## Owner Approval

- [ ] **controller/** — canonical is `controller/` (singular). Agreed: ___
- [ ] **screens/** — canonical is `screens/` (plural). Agreed: ___
- [ ] **model/** — canonical is `model/` (singular). Agreed: ___
- [ ] **queries/** — abolished. fold into `dal/` or `hooks/` by content type. Agreed: ___
- [ ] **adapters/** — confirmed, no change. Agreed: ___
- [ ] **hooks/** — confirmed, no change. Agreed: ___
- [ ] **components/** — canonical UI layer name, replacing `ui/`. Agreed: ___
- [ ] **screens/views/** — permissible sub-path within screens/. Agreed: ___
- [ ] **adapters/ui/** — exempt from ui/ rename (adapter surface). Agreed: ___
- [ ] Rename backlog Groups A–E reviewed and accepted. Agreed: ___
- [ ] Implementation tickets ARCH-NAMING-IMPL-001 and ARCH-NAMING-IMPL-002 authorized to open. Agreed: ___

**Owner signature:** _____________________________ **Date:** _______________

---

*Document is a decision record only. No source files were modified.*  
*Ticket: ARCH-NAMING-001 | App: VCSM | Type: TASK | Risk: ZERO*
