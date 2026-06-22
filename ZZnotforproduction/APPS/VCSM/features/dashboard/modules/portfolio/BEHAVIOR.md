# Dashboard Module Behavior Contract — portfolio

Status: APPROVED

Module: portfolio

Parent Feature: dashboard

Category Key: dashboard-portfolio

Created By Ticket: TICKET-BEHAV-DASHBOARD-portfolio-0001

Last Updated: 2026-06-04

Current Security Status:
- THOR: CAUTION
- Open Findings:
  - None (MEDIUM+ findings resolved)
- Patched Findings:
  - VEN-PORT-001 (HIGH) — FIXED 2026-06-04: ctrlSavePortfolioDetail call corrected to 4-arg signature with identityActorId
  - VEN-PORT-002 (MEDIUM) — FIXED 2026-06-04: viewerIsOwner context threaded through stack; public reads filtered to visibility=public + is_active=true
  - VEN-PORT-003 (MEDIUM) — FIXED 2026-06-04: assertActorOwnsVportActorController gate added; email removed from probe session output
- Security Review Status:
  - VENOM: COMPLETE
  - ELEKTRA: COMPLETE
  - BLACKWIDOW: COMPLETE

Reason:
`portfolio` has source-verified owner gates at the dashboard screen and portfolio engine write controllers. Core engine writes check actor ownership and profile scope before item/media/tag mutation. The prior public barrel Rule 9 issue is patched. Hook placement and trace adapter boundary findings are patched. Public portfolio reads are now filtered by visibility and is_active through a `viewerIsOwner` context parameter threaded from call site through hook, app controller, engine controller, and DAL. Locksmith portfolio detail call signature corrected to pass identityActorId. Focused portfolio SPIDER-MAN coverage passes.

---

## 1. User Goal

The `portfolio` dashboard module lets a VPORT owner manage public portfolio items that showcase work samples, before/after images, style cards, spaces, and kind-specific portfolio details. Owners can create, edit, delete, upload media, add tags, attach locksmith details, and optionally publish selected portfolio updates to feed surfaces for supported VPORT kinds.

---

## 2. Actors / Roles

| Actor | Allowed Actions | Restrictions |
|---|---|---|
| VPORT owner actor | View dashboard portfolio manager, create/update/delete portfolio items, upload portfolio media, add tags, save locksmith details, optionally publish feed updates. | Must pass `useVportOwnership` at screen level and portfolio engine `isActorOwner(actorId)`/profile-scope checks for engine writes. |
| Non-owner actor | No dashboard portfolio management access. | Screen renders owner-only message; engine write controllers reject if actor ownership/profile checks fail. |
| Public viewer | Can view public portfolio items through profile/public portfolio surfaces. | Cannot manage portfolio items through dashboard. |
| Media engine | Uploads selected image files under `portfolio_media` scope. | Receives owner actor id from dashboard portfolio upload wrapper. |
| Portfolio engine | Owns core item/media/tag read and write operations. | Configured in VCSM setup with actor-owner verification through `actor_owners`. |
| Locksmith VPORT owner | Can save locksmith-specific portfolio metadata and optionally publish a locksmith portfolio post. | Must pass actor-owner gate in locksmith controllers. |
| Barbershop/barber VPORT owner | Can optionally share newly created portfolio item to feed. | Feed publish controller enforces owner gate. |

---

## 3. Module Architecture

### Routes

- Dashboard manager route resolves to `VportDashboardPortfolioScreen`.
- Module docs also reference public/portfolio route `/vport/portfolio`.

### Screens

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/VportDashboardPortfolioScreen.jsx`

### Hooks

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/hooks/usePortfolioItemSubmit.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/hooks/usePortfolioMediaUpload.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/hooks/useVportPortfolioProbe.js`
- `apps/VCSM/src/features/profiles/kinds/vport/hooks/portfolio/useVportPortfolio.js`
- `apps/VCSM/src/features/profiles/kinds/vport/hooks/barbershop/usePublishBarbershopPortfolioPost.js`

### Controllers

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/controller/addPortfolioMediaWithRecord.controller.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/controller/probeVportPortfolio.controller.js`
- `engines/portfolio/src/controller/createItem.controller.js`
- `engines/portfolio/src/controller/updateItem.controller.js`
- `engines/portfolio/src/controller/deleteItem.controller.js`
- `engines/portfolio/src/controller/addMedia.controller.js`
- `engines/portfolio/src/controller/removeMedia.controller.js`
- `engines/portfolio/src/controller/manageTags.controller.js`
- `engines/portfolio/src/controller/listPortfolio.controller.js`
- `engines/portfolio/src/controller/getPortfolioItem.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller.js`

### DALs

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/dal/portfolioMediaRecord.write.dal.js`
- `engines/portfolio/src/dal/portfolioItems.read.dal.js`
- `engines/portfolio/src/dal/portfolioItems.write.dal.js`
- `engines/portfolio/src/dal/portfolioMedia.read.dal.js`
- `engines/portfolio/src/dal/portfolioMedia.write.dal.js`
- `engines/portfolio/src/dal/portfolioTags.read.dal.js`
- `engines/portfolio/src/dal/portfolioTags.write.dal.js`
- `engines/portfolio/src/dal/locksmithDetails.read.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithPortfolioDetails.write.dal.js`

### RPCs

- No dashboard portfolio RPC was found in the active dashboard card source.

### Edge Functions

- No dashboard portfolio edge function was found in the active dashboard card source.

### Engine Dependencies

- `@portfolio` engine for item/media/tag lifecycle.
- `@media` engine for file uploads.
- Media adapter for `platform.media_assets` record creation.
- Profile/VPORT adapter for public portfolio reads and feed publish hooks.
- Booking ownership adapter for locksmith/feed ownership checks.

### Ownership Gates

- `VportDashboardPortfolioScreen` uses `useVportOwnership(viewerActorId, targetActorId)`.
- Portfolio engine setup configures `isActorOwner(actorId)` using `vc.actor_owners` scoped by current authenticated user.
- `createItem`, `updateItem`, `deleteItem`, `addMedia`, `removeMedia`, and `manageTags` enforce ownership and/or profile id matching before writes.
- `updatePortfolioMediaAssetIdDAL` scopes by `portfolioMediaId` and `callerProfileId`.
- `ctrlSavePortfolioDetail` and portfolio feed publish controllers assert actor ownership.

---

## 4. Happy Paths

### HP-001

BEH-DASH-portfolio-001

Preconditions:

- Viewer is signed in.
- Viewer owns the target VPORT actor.
- Portfolio engine setup has run.

Flow:

Owner opens dashboard portfolio manager.
`VportDashboardPortfolioScreen` reads route `actorId` and identity.
Screen calls `useVportOwnership`.
Screen calls `useVportPortfolio(targetActorId, { viewerIsOwner: true })`.
Profile portfolio hook calls portfolio controller adapter to list items with owner context.
Engine lists all non-deleted portfolio items (no visibility filter) by actor -> profile id and enriches rows with media and tags.

Expected Result:

Owner sees portfolio item count, manager cards, add button, and loading/error/empty states.

Data Changes:

None.

---

### HP-002

BEH-DASH-portfolio-002

Preconditions:

- Owner is on portfolio manager.
- New item mode is open.
- At least one image file is selected.
- Title is 22 characters or less.

Flow:

Owner fills portfolio form and selected files.
`PortfolioItemForm` calls `usePortfolioItemSubmit.handleSubmit`.
Hook validates local title/file requirements.
Hook calls `createItem` from `@portfolio`.
Portfolio engine checks `isActorOwner(actorId)`, resolves profile id, inserts item, inserts tags when supplied, and emits item-created event.
For each selected file, hook uploads media through `usePortfolioMediaUpload`.
Hook calls `addPortfolioMediaWithRecord`.
Controller calls `addMedia` from `@portfolio`, then asynchronously creates a platform media asset record and updates `portfolio_media.media_asset_id`.
Screen optimistic-adds the item.

Expected Result:

New portfolio item appears in owner manager and public portfolio data after reload/cache invalidation.

Data Changes:

- Insert into `vport.portfolio_items`.
- Insert into `vport.portfolio_tags` when tags are provided.
- Insert into `vport.portfolio_media`.
- Create `platform.media_assets` record when media asset recording succeeds.
- Update `vport.portfolio_media.media_asset_id`.

---

### HP-003

BEH-DASH-portfolio-003

Preconditions:

- Owner selects an existing portfolio item.

Flow:

Owner clicks edit.
Screen calls `getItem(item.id, { includeLocksmithDetails: true })`.
Engine returns item detail, media, tags, and locksmith details when requested.
Screen builds initial values and renders `PortfolioItemForm` in edit mode.
Owner saves.
Hook calls `updateItem` from `@portfolio`.
Engine verifies existing item profile matches caller profile and actor ownership, updates item fields, replaces tags when supplied, and emits item-updated event.
New files, if supplied, are uploaded and attached.
Screen reloads after edit.

Expected Result:

Existing portfolio item updates.

Data Changes:

- Update `vport.portfolio_items`.
- Replace `vport.portfolio_tags` when tags are supplied.
- Optional new `vport.portfolio_media` rows.
- Optional `platform.media_assets` records and `portfolio_media.media_asset_id` updates.

---

### HP-004

BEH-DASH-portfolio-004

Preconditions:

- Owner selects delete for a portfolio item.

Flow:

Owner clicks delete on `PortfolioManagerCard`.
Screen optimistically removes item.
Screen calls `deleteItem({ itemId, actorId })`.
Engine fetches item and caller profile id, verifies profile match and actor ownership, soft-deletes the item, and emits item-deleted event.

Expected Result:

Portfolio item disappears from the manager.

Data Changes:

- Soft-delete update on `vport.portfolio_items`.

---

### HP-005

BEH-DASH-portfolio-005

Preconditions:

- Owner VPORT type is locksmith.
- Portfolio item is created or edited.

Flow:

Owner fills locksmith portfolio detail fields.
Submit hook calls `ctrlSavePortfolioDetail(identityActorId, actorId, itemId, detail)`.
Controller asserts actor ownership and calls locksmith portfolio detail DAL.

Expected Result:

Locksmith-specific details are saved for the portfolio item.

Data Changes:

- Upsert into `vport.locksmith_portfolio_details`.

---

### HP-006

BEH-DASH-portfolio-006

Preconditions:

- Owner VPORT type supports share-to-feed.
- Owner opts into share-to-feed.
- Portfolio create succeeds.

Flow:

Create flow completes and passes first media url.
For barbershop/barber, screen calls `publishBarbershopPortfolioPost`.
For locksmith, submit hook calls `publishLocksmithPortfolioUpdateAsPostController`.
Feed publish controller asserts ownership, sanitizes text inputs, checks throttling where implemented, and creates a system post.

Expected Result:

Optional feed post is created without blocking portfolio save on failure.

Data Changes:

- Create feed/system post through posts adapter when publish succeeds.

---

## 5. Failure Paths

### FP-001

BEH-DASH-portfolio-101

Trigger:

No target actor id exists in route params.

Expected System Behavior:

Screen returns null.

Expected UI Behavior:

No portfolio UI renders.

Expected Logging:

No required logging found in source.

---

### FP-002

BEH-DASH-portfolio-102

Trigger:

Viewer is not owner of target VPORT.

Expected System Behavior:

Screen blocks before manager UI.

Expected UI Behavior:

Displays `Owner access only.`

Expected Logging:

No required logging found in source.

---

### FP-003

BEH-DASH-portfolio-103

Trigger:

Create submit has no files.

Expected System Behavior:

Submit hook sets error before engine create.

Expected UI Behavior:

Form displays `Add at least one photo.`

Expected Logging:

No required logging found in source.

---

### FP-004

BEH-DASH-portfolio-104

Trigger:

Title exceeds 22 characters.

Expected System Behavior:

UI truncates input/paste to 22 characters; submit hook also guards max length.

Expected UI Behavior:

Counter shows title length and publish remains controlled.

Expected Logging:

No required logging found in source.

---

### FP-005

BEH-DASH-portfolio-105

Trigger:

Engine write is attempted by actor that is not current session owner or whose profile does not match target item/media.

Expected System Behavior:

Portfolio engine throws authorization error before write.

Expected UI Behavior:

Submit/delete flow shows or stores error and rolls back optimistic state when applicable.

Expected Logging:

No required logging found in source.

---

### FP-006

BEH-DASH-portfolio-106

Trigger:

Media asset record creation or media_asset_id update fails after portfolio media insert.

Expected System Behavior:

`addPortfolioMediaWithRecord` logs DEV warning and does not block portfolio save.

Expected UI Behavior:

Portfolio save can still complete.

Expected Logging:

DEV-only warning.

---

### FP-007

BEH-DASH-portfolio-107

Trigger:

Optional feed publish fails after portfolio create.

Expected System Behavior:

Failure is caught and does not roll back portfolio item.

Expected UI Behavior:

Portfolio item remains created; no required feed error UI found.

Expected Logging:

DEV-only console error in barbershop/locksmith publish catch paths.

---

### FP-008

BEH-DASH-portfolio-108

Trigger:

Portfolio list/load errors.

Expected System Behavior:

Profile portfolio hook stores error.

Expected UI Behavior:

Dashboard portfolio screen displays error message.

Expected Logging:

No required logging found in source.

---

## 6. Security Rules

### SEC-001

BEH-DASH-portfolio-201

Rule:

Only VPORT owners may access the dashboard portfolio manager.

Enforcement Layer:

Screen: `VportDashboardPortfolioScreen`.

Current Status:

SOURCE VERIFIED.

Finding Links:

None.

---

### SEC-002

BEH-DASH-portfolio-202

Rule:

Portfolio engine writes must verify actor ownership through VCSM `actor_owners`.

Enforcement Layer:

Portfolio engine setup and engine write controllers.

Current Status:

SOURCE VERIFIED.

Finding Links:

None in current source pass.

---

### SEC-003

BEH-DASH-portfolio-203

Rule:

Update/delete/media/tag writes must verify the target item/media profile matches the caller profile.

Enforcement Layer:

Portfolio engine controllers.

Current Status:

SOURCE VERIFIED.

Finding Links:

None in current source pass.

---

### SEC-004

BEH-DASH-portfolio-204

Rule:

Media asset id backfill must scope update by caller profile id.

Enforcement Layer:

DAL: `updatePortfolioMediaAssetIdDAL`.

Current Status:

SOURCE VERIFIED.

Finding Links:

Prior PORT-V-005 appears patched in current source.

---

### SEC-005

BEH-DASH-portfolio-205

Rule:

Locksmith portfolio details and optional feed publishing must assert actor ownership.

Enforcement Layer:

Locksmith owner/feed controllers.

Current Status:

SOURCE VERIFIED. Fixed 2026-06-04 — call site corrected to pass identityActorId as first argument (VEN-PORT-001).

Finding Links:

VEN-PORT-001 — FIXED 2026-06-04.

---

### SEC-006

BEH-DASH-portfolio-206

Rule:

Dashboard portfolio card public index must not export DALs/controllers as public API.

Enforcement Layer:

Architecture/SENTRY Rule 9.

Current Status:

RESOLVED / SOURCE-VERIFIED. `portfolio/index.js` no longer exports `./dal/*` or `./controller/*`.

Finding Links:

RULE9-DASH-PORTFOLIO-001.

---

### SEC-007

BEH-DASH-portfolio-207

Rule:

Portfolio submission orchestration should live in a controller/model/hook structure that preserves layer boundaries.

Enforcement Layer:

ARCHITECT refactor required.

Current Status:

RESOLVED / SOURCE-VERIFIED.

Finding Links:

PORTFOLIO-ARCH-001, PORTFOLIO-ARCH-002, DEFER-010, DEFER-011.

---

### SEC-008

BEH-DASH-portfolio-208

Rule:

Dashboard code should access portfolio trace/setup state through an adapter, not direct setup imports.

Enforcement Layer:

Adapter boundary.

Current Status:

RESOLVED / SOURCE-VERIFIED. `useVportPortfolioProbe.js` imports trace helpers through `features/portfolio/adapters/portfolioTrace.adapter.js`.

Finding Links:

PORTFOLIO-ADAPTER-001.

---

### SEC-009

BEH-DASH-portfolio-209

Rule:

Public portfolio reads must never return items with visibility != 'public' or is_active = false.

Enforcement Layer:

Engine DAL: `dalListPortfolioItemsByProfileId` — `publicOnly` param applies `.eq('visibility','public').eq('is_active',true)` when caller is not the owner. Context flows from call site via `viewerIsOwner` through hook, app controller, engine controller, and DAL.

Current Status:

SOURCE VERIFIED — FIXED 2026-06-04. `viewerIsOwner` context threaded through full stack. Dashboard passes `{ viewerIsOwner: true }`; public profile view defaults to false. Cache key differentiated: `actorId:owner` vs `actorId:public`.

Finding Links:

VEN-PORT-002 — FIXED 2026-06-04.

---

### SEC-010

BEH-DASH-portfolio-210

Rule:

The portfolio probe diagnostic controller must verify the caller owns the target VPORT actor before reading profile, actor access, or actor owners. Session email must never be returned in probe output.

Enforcement Layer:

Controller: `probeVportPortfolioController` — `assertActorOwnsVportActorController` gate before all reads.

Current Status:

SOURCE VERIFIED — FIXED 2026-06-04. Gate added; `email` removed from `result.session`; hook updated to stop passing email.

Finding Links:

VEN-PORT-003 — FIXED 2026-06-04.

---

## 7. Must Never Happen

### MNH-001

BEH-DASH-portfolio-301

Invariant:

A non-owner must never create, edit, delete, or attach media to another VPORT actor's portfolio.

Current Status:

SOURCE VERIFIED.

Related Findings:

None.

Required Tests:

TESTREQ-DASH-portfolio-001.

---

### MNH-002

BEH-DASH-portfolio-302

Invariant:

Portfolio item/media/tag writes must never rely only on caller-supplied item id without profile-match verification.

Current Status:

SOURCE VERIFIED.

Related Findings:

None in current source pass.

Required Tests:

TESTREQ-DASH-portfolio-002.

---

### MNH-003

BEH-DASH-portfolio-303

Invariant:

`portfolio_media.media_asset_id` must never update a row outside the caller profile.

Current Status:

SOURCE VERIFIED.

Related Findings:

Prior PORT-V-005 appears patched.

Required Tests:

TESTREQ-DASH-portfolio-003.

---

### MNH-004

BEH-DASH-portfolio-304

Invariant:

Public card boundary must never expose DAL/controller direct write surfaces.

Current Status:

PASS / SOURCE-VERIFIED.

Related Findings:

RULE9-DASH-PORTFOLIO-001.

Required Tests:

TESTREQ-DASH-portfolio-004.

---

### MNH-005

BEH-DASH-portfolio-305

Invariant:

Optional feed publishing must never bypass actor-owner verification or allow unsanitized portfolio text into posts.

Current Status:

SOURCE VERIFIED for locksmith path; barbershop path uses adapter/controller path not fully re-audited in this pass.

Related Findings:

None current.

Required Tests:

TESTREQ-DASH-portfolio-005.

---

### MNH-006

BEH-DASH-portfolio-306

Invariant:

Component and hook layers must not own full submission business orchestration long-term.

Current Status:

RESOLVED / SOURCE-VERIFIED.

Related Findings:

PORTFOLIO-ARCH-001, PORTFOLIO-ARCH-002, DEFER-010, DEFER-011 — resolved by moving submit/upload hooks to card-level `hooks/`.

Required Tests:

TESTREQ-DASH-portfolio-006.

---

## 8. Data Changes

| Surface | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `vport.portfolio_items` | Yes: list/detail/read existing. | Yes: create item. | Yes: update item fields and soft-delete state. | Soft delete via engine. |
| `vport.portfolio_media` | Yes: item media/detail. | Yes: add media. | Yes: update `media_asset_id`. | Yes: remove media through engine, though not exposed in active dashboard manager source read. |
| `vport.portfolio_tags` | Yes: list item tags. | Yes: insert/replace tags. | Replace set. | Delete/replace tags through engine. |
| `platform.media_assets` | No direct read in dashboard path. | Yes: created after media upload. | No direct update found in dashboard path. | No. |
| `vport.locksmith_portfolio_details` | Yes through portfolio detail read when requested. | Upsert for locksmith details. | Upsert for locksmith details. | No active dashboard delete found. |
| Feed/posts surface | No direct read in portfolio manager. | Optional post create. | No. | No. |
| `vc.actor_owners` | Yes: ownership checks. | No. | No. | No. |

---

## 9. Side Effects

Notifications:

- No notification side effect found in dashboard portfolio source.

Analytics:

- No analytics side effect found in source.

Media:

- Uploads selected files through `@media` with `portfolio_media` scope.
- Creates platform media asset records when possible.

Exports:

- No export/download side effect found in source.

Jobs:

- No background job enqueue found in source.

Cache:

- `useVportPortfolio` invalidates portfolio cache on optimistic add/update/remove.
- Portfolio engine emits item/media/tag events.

Other:

- Object URL previews are created for selected files and revoked after submit/remove.
- Optional feed publish does not block portfolio save.
- DEV diagnostic panel and trace store are used only in DEV.

---

## 10. UI Outputs

Loading States:

- Portfolio screen shows loading spinner for list load.
- Edit mode shows `Loading item...`.
- Submit button shows `Uploading...` or `Saving...`.
- Delete button state is driven by `deletingId`.

Success States:

- New item optimistically appears.
- Edited item reloads list.
- Deleted item is optimistically removed.

Error States:

- Owner-only message.
- List error card.
- Form error card.
- Delete rollback on failure.

Empty States:

- `No portfolio items yet`.

Owner States:

- Owner can add, edit, delete, upload, attach locksmith details, and optionally share to feed.

Public States:

- Public profile portfolio views consume portfolio engine list/detail data outside the dashboard manager.

---

## 11. Acceptance Criteria

### AC-DASH-portfolio-001

Requirement:

Dashboard manager is owner-only.

Evidence:

`VportDashboardPortfolioScreen.jsx`

Status:

SOURCE VERIFIED.

---

### AC-DASH-portfolio-002

Requirement:

Portfolio engine create/update/delete/media/tag writes enforce actor-owner and profile-scope checks.

Evidence:

`engines/portfolio/src/controller/*.controller.js`, `apps/VCSM/src/features/portfolio/setup.js`

Status:

SOURCE VERIFIED.

---

### AC-DASH-portfolio-003

Requirement:

Media asset id update is scoped by caller profile id.

Evidence:

`portfolioMediaRecord.write.dal.js`, `addPortfolioMediaWithRecord.controller.js`

Status:

SOURCE VERIFIED.

---

### AC-DASH-portfolio-004

Requirement:

Locksmith portfolio details save asserts owner access.

Evidence:

`locksmithOwner.controller.js`

Status:

SOURCE VERIFIED.

---

### AC-DASH-portfolio-005

Requirement:

Portfolio card public index does not export DALs/controllers.

Evidence:

`portfolio/index.js`; regression coverage in `portfolio.index.rule9.test.js`.

Status:

PASS / SOURCE-VERIFIED.

---

### AC-DASH-portfolio-006

Requirement:

Portfolio form and submit workflow are split into contract-compliant layers.

Evidence:

`PortfolioItemForm.jsx`, `hooks/usePortfolioItemSubmit.js`, `hooks/usePortfolioMediaUpload.js`, `portfolio.spiderman.test.js`

Status:

PASS / SOURCE-VERIFIED.

---

## 12. Test Requirements

### TESTREQ-DASH-portfolio-001

Validates:

Non-owner viewers cannot access dashboard portfolio manager.

Type:

Screen/hook integration.

Status:

PRESENT in `portfolio.spiderman.test.js`.

---

### TESTREQ-DASH-portfolio-002

Validates:

Engine create/update/delete/media/tag controllers reject unauthorized actors and cross-profile item/media ids.

Type:

Engine/controller unit tests.

Status:

SOURCE-VERIFIED in portfolio engine controllers; dashboard-focused static coverage present in `portfolio.spiderman.test.js`.

---

### TESTREQ-DASH-portfolio-003

Validates:

`updatePortfolioMediaAssetIdDAL` requires `callerProfileId` and scopes update by profile id.

Type:

DAL unit test.

Status:

PRESENT in `portfolio.spiderman.test.js`.

---

### TESTREQ-DASH-portfolio-004

Validates:

`portfolio/index.js` exports no DALs/controllers and no consumers import portfolio card DAL/controllers via the card boundary.

Type:

Architecture/import scanner assertion.

Status:

PRESENT in `portfolio.index.rule9.test.js`.

---

### TESTREQ-DASH-portfolio-005

Validates:

Optional feed publish paths assert ownership, sanitize text, and do not block portfolio save on failure.

Type:

Controller/hook unit test.

Status:

SOURCE-VERIFIED for ownership-gated publish controllers; remaining behavior is covered as a non-blocking side effect in source.

---

### TESTREQ-DASH-portfolio-006

Validates:

Portfolio submit refactor moves validation and orchestration into model/controller layers while hooks remain React bindings.

Type:

Architecture/refactor test.

Status:

PASS / SOURCE-VERIFIED in `portfolio.spiderman.test.js`; DEFER-010 and DEFER-011 resolved.

---

## 13. Security Findings Linked

| Finding ID | Severity | Status | Related Behavior IDs |
|---|---|---|---|
| RULE9-DASH-PORTFOLIO-001 | P1 architecture/security | RESOLVED / SOURCE-VERIFIED | BEH-DASH-portfolio-206, BEH-DASH-portfolio-304, AC-DASH-portfolio-005, TESTREQ-DASH-portfolio-004 |
| PORTFOLIO-ARCH-001 | HIGH architecture | RESOLVED / SOURCE-VERIFIED | BEH-DASH-portfolio-207, BEH-DASH-portfolio-306, AC-DASH-portfolio-006 |
| PORTFOLIO-ARCH-002 | MEDIUM architecture | RESOLVED / SOURCE-VERIFIED | BEH-DASH-portfolio-207, BEH-DASH-portfolio-306, TESTREQ-DASH-portfolio-006 |
| PORTFOLIO-ADAPTER-001 | MEDIUM architecture | RESOLVED / SOURCE-VERIFIED | BEH-DASH-portfolio-208 |
| DEFER-010 | P1 architecture | RESOLVED / SOURCE-VERIFIED | BEH-DASH-portfolio-306, TESTREQ-DASH-portfolio-006 |
| DEFER-011 | P1 architecture | RESOLVED / SOURCE-VERIFIED | BEH-DASH-portfolio-306, TESTREQ-DASH-portfolio-006 |
| PORT-V-005 | Security hardening | SOURCE APPEARS PATCHED | BEH-DASH-portfolio-204, BEH-DASH-portfolio-303 |

---

## 14. THOR Release Gates

| Gate | Status | Blocking? |
|---|---|---|
| Dashboard owner gate. | SOURCE VERIFIED | No |
| Engine write ownership/profile-scope gates. | SOURCE VERIFIED + SPIDER-MAN COVERED | No |
| Media asset id update profile scope. | SOURCE VERIFIED + SPIDER-MAN COVERED | No |
| Rule 9 public index exports remediated. | RESOLVED / SOURCE-VERIFIED | No |
| Portfolio form/hook architecture split completed or formally deferred. | RESOLVED / SOURCE-VERIFIED | No |
| Portfolio setup trace adapter boundary fixed or accepted. | RESOLVED / SOURCE-VERIFIED | No |
| Portfolio-specific SPIDER-MAN tests added. | COMPLETE — 8 focused tests passing | No |

---

## 15. Native / Alternate UI Parity

| Behavior | Native Equivalent | Status |
|---|---|---|
| Owner portfolio manager | Not source-verified in this pass. | OPEN QUESTION |
| Portfolio create/edit/delete | Not source-verified in this pass. | OPEN QUESTION |
| Media upload and preview | Not source-verified in this pass. | OPEN QUESTION |
| Public portfolio display | Existing web public/profile flow source-verified only indirectly. | OPEN QUESTION |

---

## 16. Engine Dependencies

| Engine | Purpose | Status |
|---|---|---|
| Portfolio engine | Core item/media/tag lifecycle and public portfolio reads. | ACTIVE |
| Media engine | Upload portfolio media files. | ACTIVE |
| Media adapter | Create platform media asset records. | ACTIVE |
| Profiles adapter | Public VPORT portfolio read hook and feed publish hook. | ACTIVE |
| Booking ownership adapter | Locksmith/feed ownership checks. | ACTIVE |

---

## 17. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-DASH-portfolio-001 | Should `portfolio/index.js` stop exporting DALs/controllers immediately as a SENTRY Rule 9 patch? | ANSWERED — yes; source patched. |
| OQ-DASH-portfolio-002 | Should `usePortfolioItemSubmit` become a thin binding to a new `submitPortfolioItem.controller.js`? | ANSWERED — not required for CLEAR; hook now lives at card-level and delegates writes through engine/controllers. |
| OQ-DASH-portfolio-003 | Should `usePortfolioMediaUpload` move from `components/portfolio/hooks/` to card-level `hooks/`? | ANSWERED — yes; source patched. |
| OQ-DASH-portfolio-004 | Should `PortfolioItemForm.jsx` be split into base fields, locksmith fields, file uploader, and share toggle components? | ANSWERED — not required for CLEAR; file is under 300 lines and behavior is covered. |
| OQ-DASH-portfolio-005 | Should `useVportPortfolioProbe` access trace store through an adapter instead of `features/portfolio/setup`? | ANSWERED — yes; source patched. |
| OQ-DASH-portfolio-006 | Which native or alternate UI must preserve portfolio create/edit/delete parity? | OPEN |

---

## 18. Confidence Review

| Section | Confidence | Source Verified |
|---|---|---|
| User Goal | HIGH | Yes |
| Actors / Roles | HIGH | Yes |
| Module Architecture | HIGH | Yes |
| Happy Paths | HIGH | Yes |
| Failure Paths | HIGH | Yes |
| Security Rules | HIGH | Yes |
| Must Never Happen | HIGH | Yes |
| Data Changes | HIGH | Yes |
| Side Effects | HIGH | Yes |
| UI Outputs | HIGH | Yes |
| Acceptance Criteria | HIGH | Yes |
| Test Requirements | HIGH | Yes |
| Security Findings Linked | MEDIUM | Source verified; some finding ids synthesized from governance wording |
| THOR Release Gates | HIGH | Yes |
| Native / Alternate UI Parity | LOW | Missing source |
| Engine Dependencies | HIGH | Yes |
| Open Questions | HIGH | Yes |
| Command Sign-Off | MEDIUM | Derived from dashboard matrix, source, scanner, and governance docs |

---

## 19. Command Sign-Off

ARCHITECT: APPROVED - source map complete; Rule 9 public barrel, card-level hook placement, and portfolio trace adapter boundary are patched.

VENOM: COMPLETE - engine write paths are ownership/profile scoped; public card boundary no longer exports DALs/controllers.

ELEKTRA: COMPLETE - source-to-sink paths traced; media backfill is profile scoped and covered.

BLACKWIDOW: COMPLETE - no current cross-owner write found in the active engine-gated paths; owner gate and scoped writes are covered.

SPIDER-MAN: COMPLETE - 8 focused portfolio tests pass.

PROFESSOR X: APPROVED.

THOR: CLEAR.

---

## 14. ARCHITECT Wave Reference (2026-06-05)

ARCHITECTURE.md created: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/portfolio/ARCHITECTURE.md

Key findings from ARCHITECT wave:
- portfolio_media write surface confirmed in write-surface-map
- VEN-CARD-002 (portfolio engine isActorOwner) confirmed safe per source verification
- 15 callgraph nodes (controller + DAL layer confirmed)
- No critical gaps identified in ARCHITECT pass

Ticket: TICKET-LOGAN-DASHBOARD-MODULE-BEHAVIOR-WAVE-0001

---

Final Verdict:

BEHAVIOR_DASHBOARD_PORTFOLIO_APPROVED
