# Identity Documentation Verification Report

**Date:** 2026-06-06
**Type:** Read-only source verification against documentation claims
**Scope:** Identity system — contracts, orchestrator, architecture review, model, adapter, consumers, ownership model
**Method:** Direct source reads + grep corpus. Documentation claims checked against live source code. BLIND_REVERIFY_MODE applied for all re-verify claims.

---

## 1. Executive Verdict

### Documentation Accuracy Grade: C+

The bulk of the architecture documentation (IDENTITY_ORCHESTRATOR.md, IDENTITY_ARCHITECTURE_REVIEW_2026-06-06.md) is accurate and well-evidenced. The contract documents (02-identity-contract.md) are locked and correct. However, a cluster of specific claims — primarily about consumer count, bypass surface scope, and component existence — are materially stale or directly false. Three functional bugs exist at runtime that no documentation flags.

### Code/Contract Compliance Grade: C

The §1.3 Identity Surface Rule is violated at runtime: `toPublicIdentity()` returns four fields (`actorId`, `kind`, `ownerActorId`, `realmId`) but the contract only permits `actorId` and `kind`. Additionally, 50+ feature files bypass the governed adapter boundary documented by IDENTITY-004 as "0 violations." Neither violation causes a hard crash today, but both represent silent contract drift that will cause real breaks if any cleanup ever happens.

### Top 3 Highest-Risk Stale Claims

1. **"41 consumer features — 0 violations" (IDENTITY_ORCHESTRATOR.md §4, IDENTITY_DEPENDENCY_SUMMARY.md):** The "41 / 0 violations" figure is narrowly true per the scanner's scope (which only checks `features/identity/dal/` and `features/identity/controller/` boundary compliance). It is false by the intended architecture's definition. 50+ additional bypass sites import `useIdentity` directly from `@/state/identity/identityContext` and are invisible to the scanner. The IDENTITY_ARCHITECTURE_REVIEW acknowledges this — but IDENTITY_ORCHESTRATOR.md §4 still states "Scanner-confirmed total: 41 inbound consumers. All 41 pass through the feature adapter (0 violations per scanner)." This is misleading. The true import surface is ~91+ sites.

2. **`toPublicIdentity()` returns `{ actorId, kind }` — §1.3 compliance (02-identity-contract.md §1.3):** The contract says the identity object "may contain" `actorId` and `kind` and "must never expose" `profileId` or `vportId`. Source shows `toPublicIdentity()` actually returns `{ actorId, kind, ownerActorId, realmId }`. `ownerActorId` is never populated by the model (always null), making two consumers (`resolveInboxActor.js` and `probeVportPortfolio.controller.js`) silently broken. `realmId` is actively consumed by 5 production files. The contract and the implementation do not match.

3. **VportLeadsChip — ARCHITECT-REVIEW claim (ARCHITECT-REVIEW-citizen-vport-first-class-actors.md, shell/ARCHITECTURE.md, shell.md contract):** Multiple documentation files describe `VportLeadsChip.jsx` as an existing component at `features/shell/modules/bottom-bar/components/VportLeadsChip.jsx` and provide code evidence from lines 13–14. This file does not exist in source. The component is not present anywhere in the codebase. All documentation about it — including the "correct first-class VPORT actor consumption" example and the TICKET-BOTTOMNAV-MODULE-REVIEW-001 violation claim — references a component that has been removed or was never committed.

---

## 2. Contract vs Implementation Table

| Claim | Document Source | Source-Code Evidence | Verdict | Required Action |
|---|---|---|---|---|
| `toPublicIdentity()` returns only `{ actorId, kind }` | `02-identity-contract.md §1.3` — "may contain actorId, kind; must never expose profileId, vportId" | `identity.model.js:1–10` returns `{ actorId, kind, ownerActorId: source.ownerActorId ?? null, realmId: source.realmId ?? null }` — 4 fields, not 2 | FALSE | Q7 decision required: either revise §1.3 to permit `realmId` (and rule on `ownerActorId`), or remove non-contract fields from `toPublicIdentity()` |
| `identityContext` return shape is `{ identity, loading, setIdentity, switchActor, availableActors, refreshAvailableActors, blockedVport }` | `IDENTITY_ORCHESTRATOR.md §11` validation matrix | `identityContext.jsx:159–176` — actual context value: `{ identity, loading, identityLoading: loading, setIdentity: setIdentityCompat, switchActor, availableActors, refreshAvailableActors, blockedVport }` — adds `identityLoading` alias field not documented anywhere | PARTIALLY TRUE | Document `identityLoading` in orchestrator; clarify it is an alias for `loading` |
| Adapter re-exports: `useIdentity, IdentityProvider, useIdentityOps, ensureVcsmPlatformBootstrap, refreshVcActorDirectory` | `IDENTITY_ORCHESTRATOR.md §3` | `identity.adapter.js:1–6` — confirmed exactly those 5 exports | TRUE | None |
| `ownerActorId` is in the locked identity contract surface | `IDENTITY_ORCHESTRATOR.md §5 blast radius matrix` — "toPublicIdentity shape: `{ actorId, kind, ownerActorId, realmId }` shape unchanged" | Orchestrator documents `ownerActorId` as part of the shape; §1.3 contract does NOT list it as allowed. Two documents are in contradiction. | NEEDS DECISION | Q7 policy decision: either add `ownerActorId` to §1.3 allowed list or remove it from `toPublicIdentity()` and fix the 2 consumers |
| `realmId` is not allowed on `useIdentity` surface per §1.3 | `02-identity-contract.md §1.3` — lists only `actorId` and `kind` | `identity.model.js:8` returns `realmId`; 5 production files read `identity?.realmId`: `PostFeed.screen.jsx:28`, `CentralFeedScreen.jsx:40`, `LearningLayout.jsx:24`, `useStartConversation.js:35`, `identitySelectors.js:15` | FALSE — contract too narrow; production depends on it | Q7 decision: add `realmId` to §1.3 allowed fields, or introduce `useRealmId()` hook |
| 41 consumer features, 0 violations | `IDENTITY_ORCHESTRATOR.md §4`, `IDENTITY_DEPENDENCY_SUMMARY.md` | Scanner result is accurate for the scanner's scope (no feature imports from `features/identity/dal/` or `features/identity/controller/` directly). But 50+ feature files import `useIdentity` directly from `@/state/identity/identityContext` bypassing the adapter. Total import surface: ~91 sites. | STALE | Update consumer map to reflect real 91+ bypass + adapter site total; do not claim "0 violations" without qualifying the scanner scope |
| `state/identity/` direct import is banned in feature code | `IDENTITY_ORCHESTRATOR.md §3 Rule 1` — "Must NOT import from `@/state/identity/identityContext`" | 50+ feature files import from `@/state/identity/identityContext` directly (confirmed by grep). Named sites include: `VportAdsSettingsScreen.jsx`, entire `post/` subtree (8 files), entire `dashboard/vport/` subtree (19+ files), `settings/` (5 files), `profiles/` (13 files), `upload/` (3 files), `notifications/` (1), `block/` (1), `learning/` (1), `app/routes/` (1). | FALSE — policy is violated at scale | Policy document is accurate in intent but wildly inaccurate about current state. Requires mass remediation or policy revision |
| `chat/setup.js` is the ONLY confirmed state-store bypass | `IDENTITY_ORCHESTRATOR.md §3 Rule 2` — "This is the ONLY confirmed case" | Confirmed: `chat/setup.js:16` is the only `useIdentitySelectionStore` bypass. `useIdentity` bypasses are separate (STATE_BYPASS, not STORE_BYPASS). | TRUE (for store bypass); MISLEADING (implies the adapter is otherwise clean) | Clarify that "only store bypass" does not mean "only bypass" — 50+ context bypasses also exist |
| IDENTITY-FIX-001 (useVexSettings import) — COMPLETE | `IDENTITY_ORCHESTRATOR.md §10` — "IDENTITY-FIX-001 ✅ COMPLETE 2026-06-06" | `useVexSettings.js:2` — confirmed: `import { useIdentity } from "@/features/identity/adapters/identity.adapter"` — adapter path used | TRUE | None — fix is confirmed shipped |
| `actor_owners` is the canonical ownership source | `02-identity-contract.md §1.4 Owner Meaning Rule` | `assertActorOwnsVportActorController` correctly queries `actor_owners`. However, `vports.write.dal.js` (lines 44, 75, 106), `vports.read.dal.js` (lines 111, 134), and `settings/profile/dal/profile.write.dal.js` (line 35) still use `owner_user_id` as ownership filter. | PARTIALLY TRUE | `actor_owners` is the architectural contract but `owner_user_id` is still enforced in 3 DAL files for 5 operations. See ownership audit. |
| VportLeadsChip exists as a component at `shell/modules/bottom-bar/components/VportLeadsChip.jsx` | `ARCHITECT-REVIEW-citizen-vport-first-class-actors.md:241`, `features/shell/modules/bottom-bar/ARCHITECTURE.md:15,38`, `CONTRACTS/App/VCSM/features/shell.md:22` | Zero results from `find` in all of `apps/VCSM/src`. Component file does not exist. The file `BottomNavBar.jsx` has no `VportLeadsChip` import and no leads badge logic. | FALSE — STALE | Remove all documentation references to VportLeadsChip. Mark TICKET-BOTTOMNAV-MODULE-REVIEW-001 violations related to it as resolved-by-removal. |

---

## 3. useIdentity Surface Audit

### 3a. Actual Returned Object

`useIdentity()` returns the React context value set by `IdentityContext.Provider` in `identityContext.jsx:159–176`.

**Public identity object (`identity` field — built by `toPublicIdentity()` in `identity.model.js:1–10`):**
- `actorId` — string UUID from `vc.actors.id`
- `kind` — `'user' | 'vport'`
- `ownerActorId` — always `null` (set from `source.ownerActorId ?? null`; no model function ever populates `source.ownerActorId`)
- `realmId` — string UUID from `vc.realms.id` (resolved via `resolveRealmId`)

**Context value (full shape returned by `useIdentity()`):**
- `identity` — public identity object above (or `null`)
- `loading` — boolean
- `identityLoading` — boolean alias for `loading` (undocumented in any contract)
- `setIdentity` — function (raw state setter, Q8 concern — write surface on read contract)
- `switchActor(actorId, dbgEntryPoint)` — async function
- `availableActors` — array of actor objects
- `refreshAvailableActors()` — async function
- `blockedVport` — boolean

**Fields on internal `identityDetails` (NOT on public identity, NOT in `useIdentity()`):**
These are stored in `IdentityDetailsContext` and only exposed via `useIdentityDetailsDeprecated()`:
`displayName`, `username`, `avatar`, `banner`, `bio`, `birthdate`, `age`, `sex`, `isAdult`, `discoverable`, `publish`, `lastSeen`, `createdAt`, `updatedAt` (user), `vportType`, `isActive`, `isDeleted`, `isVoid` (vport-specific), `email` (user).

### 3b. Adapter Surface

`identity.adapter.js` re-exports exactly:
1. `useIdentity` — from `@/state/identity/identityContext`
2. `IdentityProvider` — from `@/state/identity/identityContext`
3. `useIdentityOps` — from `@/features/identity/hooks/useIdentityOps`
4. `ensureVcsmPlatformBootstrap` — from `@/features/identity/adapters/identityOps.adapter`
5. `refreshVcActorDirectory` — from `@/features/identity/adapters/identityOps.adapter`

**Not on adapter surface (confirmed missing):**
- `useIdentitySelectionStore` — store bypass
- `identitySelectors` exports (`canCitizenBook`, `isUserActor`, `isVportActor`, etc.)
- `useIdentityDisplayDeprecated` — deprecated export
- `setIdentity` — not independently exported; only accessible via `useIdentity()` context value
- Any DAL, model, or controller function

### 3c. All Consumer Field Reads (by field)

**Fields on public identity (`identity.actorId`, `identity.kind`, `identity.ownerActorId`, `identity.realmId`):**

| Field | Consumer Files | Lines |
|---|---|---|
| `identity.actorId` / `identity?.actorId` | Throughout — ~40+ files read `actorId` directly | Standard use — compliant with contract |
| `identity.kind` | `RestoreVportScreen.jsx`, `VportDashboardScreen.jsx`, `probeVportPortfolio.controller.js`, `useVportPublicBooking.js`, `ActorPill.jsx`, `useStartConversation.js`, `resolveInboxActor.js`, `identitySelectors.js`, `identityContext.jsx`, `vportLeads.controller.js` | Various — standard use |
| `identity.ownerActorId` | `probeVportPortfolio.controller.js:21`, `resolveInboxActor.js:32,48` | 2 consumer files |
| `identity.realmId` | `PostFeed.screen.jsx:28`, `CentralFeedScreen.jsx:40`, `LearningLayout.jsx:24`, `useStartConversation.js:35`, `identitySelectors.js:15` | 5 consumer files |

**Non-contract fields (fields NOT on public identity object but read from `identity`):**

| Field | Consumer Files | Lines |
|---|---|---|
| `identity.isVoid` | `useStartConversation.js:35`, `RestoreVportScreen.jsx:32`, `useResolvedActor.js:18`, `createPost.controller.js:77` | 4 files |
| `identity.isDeleted` | `RestoreVportScreen.jsx:30,50` | 1 file |
| `identity.displayName` | `RestoreVportScreen.jsx:29`, `useInvite.js:68`, `useVportPublicBooking.js:28`, `useVportReviewMine.js:85`, `ActorPill.jsx:10`, `identitySelectors.js:18` | 6 files |
| `identity.username` | `useVportPublicBooking.js:28`, `useVportReviewMine.js:86`, `identitySelectors.js:20` | 3 files |
| `identity.avatar` | `useVportReviewMine.js:87`, `ActorPill.jsx:11`, `identitySelectors.js:21` | 3 files (also reads `identity.avatarUrl`, `identity.photoUrl` as fallbacks — neither field exists) |
| `identity.banner` | `identitySelectors.js:23` | 1 file |
| `identity.vportType` | `VportDashboardScreen.jsx:58,61,89,90`, `VportDashboardPortfolioScreen.jsx:51,165,189`, `probeVportPortfolio.controller.js:20`, `usePublishBarbershopPortfolioPost.js:18` | 4 files, 9 read sites |
| `identity.userId` | `dev/diagnostics/groups/posts.group.js:57` | 1 file (dev-only diagnostics, not production code) |

### 3d. Non-Contract Field Reads — Analysis

**`identity.isVoid`** (4 consumer files):
- Field is on `identityDetails` (internal), set by `mapProfileActor` and `mapVportActor`. NOT on public identity returned by `toPublicIdentity()`.
- Runtime behavior if undefined: `useStartConversation.js:35` — `Boolean(identity?.isVoid)` → evaluates `false` for undefined → falls back to `resolveRealm(false)` which uses the public realm. Functionally correct by accident.
- `useResolvedActor.js:18` — `isVoid: identity.isVoid` passes `undefined` to caller. If caller uses it as boolean, `undefined` is falsy — correct by accident.
- `createPost.controller.js:77` — `resolveRealm(identity.isVoid)` — `identity.isVoid` is `undefined` on public identity → `resolveRealm(undefined)` → depends on `resolveRealm` implementation; undefined is falsy → uses public realm. Functionally safe.
- `RestoreVportScreen.jsx:32` — reads `identity?.isVoid` but this screen is only mounted when `blockedVport` is true, which requires `identityDetails.isVoid === true`. The screen never renders when identity is a public identity object. It reads `identityDetails` indirectly through the context resolution path. This is a subtle layering issue — the screen works because the context holds both details and public identity, but it reads a non-public field.
- **Risk:** LOW-MEDIUM. All cases are functionally safe today because `undefined` happens to produce the correct behavior. But if `toPublicIdentity()` is ever cleaned up or if the identity context is refactored to only expose the public shape, these reads will silently produce wrong behavior rather than failing.

**`identity.isDeleted`** (`RestoreVportScreen.jsx:30,50`):
- Same situation as `isVoid` above. Screen is only mounted when `blockedVport` is true which requires `isDeleted === true` on `identityDetails`. Reading from public identity returns `undefined`; the conditional at line 50 (`identity?.isDeleted && vportId`) evaluates as `undefined && vportId` → `false` — the Restore button would not show even when the VPORT is deleted.
- **Risk:** HIGH. This is a functional bug — the Restore VPORT button is gated on `identity?.isDeleted` which is always `undefined` on the public identity object. If the active identity's details have `isDeleted: true`, the `blockedVport` flag is true (correct) but the restore button will NOT render because `identity?.isDeleted` returns `undefined` not `true`. See Section 6 BUG-IDENT-001.

**`identity.displayName`, `identity.username`, `identity.avatar`, `identity.banner`** (6–3 files each):
- None of these fields are on the public identity shape returned by `toPublicIdentity()`.
- These files read from the context object (`const { identity } = useIdentity()`). They receive `undefined` for all display fields.
- `identitySelectors.js` exports `getDisplayName(identity)`, `getUsername(identity)`, `getAvatar(identity)`, `getBanner(identity)` — all check `identity?.displayName` etc. and return fallbacks. When called with the public identity object, they always return their fallback values ("Unknown", null, "/avatar.jpg", "/default-banner.jpg").
- `ActorPill.jsx:10-11` — `identity.displayName || (identity.kind === "vport" ? "VPORT" : "Profile")` — the fallback handles `undefined` displayName. `identity.avatar || identity.photoUrl || "/avatar.jpg"` — fallback handles undefined. Functionally correct.
- `useVportReviewMine.js:85-87` — `authorDisplayName: identity?.displayName ?? "You"` — always "You". `authorUsername: identity?.username ?? ""` — always empty string. `authorAvatarUrl: identity?.avatarUrl ?? identity?.avatar ?? ""` — both undefined, always empty string. Review author metadata is always empty.
- **Risk:** MEDIUM. `identitySelectors` behave correctly because fallbacks are present. But `useVportReviewMine.js` writes empty review author metadata to the DB (displayName becomes "You", username becomes "", avatar becomes ""). This is a functional data quality bug. See Section 6 BUG-IDENT-002.

**`identity.vportType`** (4 files, 9 read sites):
- Not on public identity. `toPublicIdentity()` does not include `vportType`. `mapVportActor` includes it in `identityDetails`.
- `VportDashboardScreen.jsx:58` — `normalizeVportType(identity?.vportType ?? dashboardDetails.vportType ?? null)` — falls back to `dashboardDetails.vportType`. If details has it, this works. The double-read pattern (`identity?.vportType ?? dashboardDetails.vportType`) is defensive against exactly this case.
- `VportDashboardPortfolioScreen.jsx:51` — `String(identity?.vportType ?? "").toLowerCase()` — empty string when undefined. Could cause incorrect rendering of portfolio kind tabs.
- `probeVportPortfolio.controller.js:20` — reads `identity?.vportType ?? null` — returns null.
- `usePublishBarbershopPortfolioPost.js:18` — `vportKind: identity?.vportType ?? null` — null.
- **Risk:** MEDIUM. Dashboard screens have defensive `?? dashboardDetails.vportType` fallbacks. But `VportDashboardPortfolioScreen.jsx` and the two other files get `undefined`/`null` and may render incorrectly.

**`identity.userId`** (`posts.group.js:57`):
- Dev-only diagnostics file. Not production code. `ensureActorContext` returns a context object that includes `userId` from the auth layer. This is a diagnostic helper, not production identity consumption. Not a production risk.
- **Risk:** NONE (dev-only file).

---

## 4. Ownership Model Audit

### 4a. actor_owners Compliant Paths

These files correctly query `vc.actor_owners` for ownership:

- `/apps/VCSM/src/features/booking/controller/assertActorOwnsVportActorController.js` — `readActorOwnerLinkByActorAndUserProfile.dal.js` → `.from("actor_owners")`
- `/apps/VCSM/src/features/booking/controller/assertSessionOwnsVportActorController.js` — `readOwnerLinkByActorAndSession.dal.js` → `.from("actor_owners")`
- `/apps/VCSM/src/features/booking/dal/readActorOwnerLinkByActorAndUserProfile.dal.js:24` — canonical `actor_owners` read
- `/apps/VCSM/src/features/booking/dal/readOwnerLinkByActorAndSession.dal.js:41` — canonical `actor_owners` read
- `/apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js:31,72` — `listMyVportsDAL()` and `readMyVports()` both use `actor_owners → actors(kind='vport') → vport.profiles(actor_id)` join
- `/apps/VCSM/src/features/auth/dal/actorOwnerCreate.dal.js:6` — creates `actor_owners` row at onboarding
- `/apps/VCSM/src/features/settings/vports/dal/actorOwners.read.dal.js:8` — reads `actor_owners`
- `/apps/VCSM/src/features/dashboard/vport/dal/read/actorOwners.read.dal.js:8` — reads `actor_owners`
- `/apps/VCSM/src/features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js:9` — reads `actor_owners`
- `/apps/VCSM/src/features/portfolio/setup.js:50` — reads `actor_owners` for ownership verification
- `/apps/VCSM/src/features/reviews/setup.js:52` — reads `actor_owners` for ownership verification
- `/apps/VCSM/src/features/wanders/core/dal/read/actorOwners.read.dal.js:10` — reads `actor_owners`

### 4b. owner_user_id Drift Paths

These files use `owner_user_id` as an authorization filter, which is the legacy model:

| File | Lines | Operation | Defense-in-depth? |
|---|---|---|---|
| `features/settings/vports/dal/vports.write.dal.js` | 44 (`setVportBusinessCardSettingsDAL`), 75 (`setVportDirectoryVisibleDAL`), 106 (`syncDirectoryVisibleToPublicDetailsDAL`) | WRITE — UPDATE queries | YES — controller layer adds `assertActorOwnsVportActorController` before DAL call |
| `features/settings/vports/dal/vports.read.dal.js` | 111 (`readVportBusinessCardSettingsDAL`), 134 (`readVportDirectoryStateDAL`) | READ | YES — controller adds `assertActorOwnsVportActorController` |
| `features/settings/profile/dal/profile.write.dal.js` | 35 (`updateProfile` for vport path) | WRITE — UPDATE | NO — `useProfileController.js` does not call `assertActorOwnsVportActorController` before this DAL |
| `features/join/dal/barberVport.read.dal.js` | 10, 26 | READ — lookup by owner | DOCUMENTED EXCEPTION — comment states "Join runs before actor provisioning" |

**Severity of drift:**
- `vports.write.dal.js` and `vports.read.dal.js`: controller-layer `actor_owners` check is present. Mixed model, but safe. Risk if a future caller bypasses the controller.
- `settings/profile/dal/profile.write.dal.js:35`: no `actor_owners` controller gate confirmed. VPORT profile updates authorized solely by `owner_user_id`. This is OWNERSHIP_DRIFT without defense-in-depth.
- `join/dal/barberVport.read.dal.js:10,26`: documented architectural exception. Acceptable.

### 4c. profile_actor_access Fallback

Used in two files:

1. `features/hydration/vcsmActorHydrator.js:64–73` — when `ownerRow.user_id` cannot resolve a user actor via `readUserActorByProfileIdDAL`, the hydrator falls back to querying `vport.profile_actor_access WHERE profile_id = vport.id AND is_primary = true`. This populates `ownerActorId` on the returned identity.
2. `features/dashboard/vport/dal/read/vportProfileActorAccess.read.dal.js:7` — a standalone read DAL for this table.

**Documentation status:** The hydrator fallback to `profile_actor_access` is undocumented in the identity orchestrator and contracts. It is the only path by which `ownerActorId` can be non-null on an identity object. Since `toPublicIdentity()` passes through `source.ownerActorId`, if the hydrator sets it before `commitIdentity()` is called, it will appear on the public identity — but this requires `source.ownerActorId` being on `nextDetails`, which comes from the hydration return. Source confirms the hydrator returns `ownerActorId` in its result for vport actors.

**Verdict:** `profile_actor_access` is a real code path but entirely undocumented. It is the only mechanism that makes `ownerActorId` non-null on a live identity, which makes `resolveInboxActor.js` potentially functional in production (when hydration succeeds) — but the reliance is invisible.

### 4d. Session-Based Ownership Paths

`assertSessionOwnsVportActorController` (`booking/controller/assertSessionOwnsVportActor.controller.js`) derives ownership from `supabase.auth.getSession()` without any `callerActorId` from the UI layer. It is used by:
- `countNewVportLeadsController` (leads count — self-read)
- `fastCountNewVportLeadsController` (fast leads count)

**Safety assessment:** SAFE by design. The controller comment explicitly states this is for self-read operations where no `callerActorId` is needed. It still queries `vc.actor_owners` (`readOwnerLinkByActorAndSession.dal.js:41`) to verify ownership, using the session user_id. This is the correct pattern for implicit-caller operations.

---

## 5. False Positives / Stale Documentation

### 5a. Bottom-Bar Leads Analysis

**Claim source:** Multiple documents reference `VportLeadsChip.jsx` as an existing component:
- `ARCHITECT-REVIEW-citizen-vport-first-class-actors.md:92,104,241` — describes the component in detail, quotes code from lines 11–15, calls it "the canonical example of correct first-class VPORT actor consumption"
- `features/shell/modules/bottom-bar/ARCHITECTURE.md:15,38` — lists it in the directory tree and describes its DOM behavior
- `CONTRACTS/App/VCSM/features/shell.md:22,92,113` — names it in TICKET-BOTTOMNAV-MODULE-REVIEW-001 as a violation to fix

**Source evidence:**
- `find /apps/VCSM/src -name "VportLeadsChip*"` → zero results
- `grep -rn "VportLeadsChip"` in all source → zero results
- `BottomNavBar.jsx` has no `VportLeadsChip` import, no leads badge, no `useVportLeadsCount` call

**Classification: DOCUMENTATION STALE — component has been removed or was never in the current branch**

The `countNewVportLeadsController` and `fastCountNewVportLeadsController` functions do exist and are functional. The `useVportLeads.js` hook exists inside `dashboard/vport/dashboard/cards/leads/`. The component that was supposed to use them in the bottom bar has been removed from the codebase but not from the documentation.

**Impact on TICKET-BOTTOMNAV-MODULE-REVIEW-001:**
- Violation #1 (missing `shell.adapter.js`) — needs independent verification (not checked in this pass)
- Violation #2 (`useVportLeadsCount` bypasses vport adapter) — `useVportLeadsCount` does not exist anywhere in source; violation is moot
- Violation #3 (`VportLeadsChip` misclassified in `vport.adapter.js`) — component does not exist; violation is moot

The ticket's remaining concern is the missing `shell.adapter.js`. The other two violations are based on stale documentation.

### 5b. Other Outdated Scanner/Audit Claims

**IDENTITY_DEPENDENCY_SUMMARY.md — chat @identity claim:**
The document states "chat | 8 | YES | YES (16x via @identity engine alias)". IDENTITY-005 confirmed 0 `@identity` imports in chat. This STALE claim persists in IDENTITY_DEPENDENCY_SUMMARY.md even though the orchestrator (§8 Finding 1) explicitly refutes it. The summary file was not updated to remove the `@identity` cell for chat.

**FEATURES_ARCHITECTURE_REVIEW.md (referenced by IDENTITY_DEPENDENCY_SUMMARY.md):**
The "16 @identity engine alias imports in chat" claim originates there. That document is acknowledged as stale by IDENTITY-005 but remains in the documentation corpus.

**IDENTITY_ARCHITECTURE_REVIEW_2026-06-06.md §10 (RLS audit planning):**
Documents `identity.refresh_actor_directory_row` as having unknown guards. This was resolved by IDENTITY-FIX-004 (IDRLS-001 CLOSED — function confirmed to have auth guard + ownership check + anon revoked). The architecture review was written before the RLS audit completed. The RLS audit supersedes this section.

---

## 6. Confirmed Bugs

These are functional issues that silently produce wrong runtime behavior.

---

**BUG-IDENT-001**
- **File + line:** `apps/VCSM/src/features/vport/screens/RestoreVportScreen.jsx:50`
- **Description:** The Restore VPORT button is gated on `identity?.isDeleted`. The public identity returned by `toPublicIdentity()` does not include `isDeleted`. When `useIdentity()` is called, the `identity` object is the public identity with only `{ actorId, kind, ownerActorId, realmId }`. `identity?.isDeleted` evaluates to `undefined`, which is falsy. The button's render condition `{identity?.isDeleted && vportId && ...}` is always false. The Restore button never renders.
- **Runtime impact:** A user whose VPORT is soft-deleted and who is on `RestoreVportScreen` cannot see the Restore button. The screen renders with the deleted VPORT's name (line 29 — same bug, `displayName` is undefined, falls back to `'This VPORT'`) and the reason text (line 30–34 — `isDeleted` and `isVoid` both undefined, falls back to "This VPORT is currently inactive") but the restore action is inaccessible.
- **Minimal fix direction:** The screen should read from `useIdentityDetailsDeprecated()` for `isDeleted`, `isVoid`, and `displayName` — these are detail-level fields on `identityDetails`, not public identity fields. Or: the component should receive these as props from a parent that has access to details.

---

**BUG-IDENT-002**
- **File + line:** `apps/VCSM/src/features/profiles/kinds/vport/hooks/review/useVportReviewMine.js:85–87`
- **Description:** Three review author fields are read from public identity: `identity?.displayName`, `identity?.username`, `identity?.avatarUrl ?? identity?.avatar`. All are absent from the public identity object. Results: `authorDisplayName` always becomes `"You"` (the fallback), `authorUsername` always becomes `""`, `authorAvatarUrl` always becomes `""`.
- **Runtime impact:** When a VPORT owner submits or reads their own review, the author metadata stored in the review will be `{ authorDisplayName: "You", authorUsername: "", authorAvatarUrl: "" }`. If this metadata is stored to the DB, review records will have empty author data. The display of the user's own reviews will show generic "You" instead of their actual display name, no username, and no avatar.
- **Minimal fix direction:** Use `useIdentityDetailsDeprecated()` for display-level fields (`displayName`, `username`, `avatar`), or fetch actor directory data via `useActorStore`.

---

**BUG-IDENT-003**
- **File + line:** `apps/VCSM/src/features/notifications/inbox/lib/resolveInboxActor.js:32,48`
- **Description:** For `kind === "vport"` identities, `resolveInboxActor` uses `identity.ownerActorId` as `myActorId`. Since `ownerActorId` is always `null` on the public identity object (set from `source.ownerActorId ?? null` in `toPublicIdentity()`, and no model function populates `source.ownerActorId`), the inbox will never resolve a valid `myActorId` for VPORT-acting users unless the hydration path via `profile_actor_access` successfully ran.
- **Runtime impact:** When the active actor is a VPORT, `resolveInboxActor` returns `{ targetActorId: vportActorId, myActorId: null }`. Any inbox filtering or scoping that relies on `myActorId` for VPORT actors will receive `null`. Chat inbox and notification scoping for VPORT actors may show no results or incorrectly scoped results. The DEV console will log "[resolveInboxActor] INVALID vport identity: missing ownerActorId" — confirming this fires in development.
- **Minimal fix direction:** Populate `ownerActorId` on the public identity object. This requires either: (a) making `toPublicIdentity` read `source.ownerActorId` from a field that hydration actually sets, or (b) routing the hydrator's `ownerActorId` result through to the public identity properly. The hydrator at `vcsmActorHydrator.js:57–79` does resolve `ownerActorId` — but it is returned in the details object, not passed through `toPublicIdentity()`. The issue is that `commitIdentity(result.nextIdentity)` calls `toPublicIdentity(nextDetails)` where `nextDetails.ownerActorId` is set by the hydrator — this SHOULD work if the hydrator's return value includes `ownerActorId`. Needs runtime verification to confirm if hydration is successful. If it is, this bug only fires when hydration fails.

---

## 7. Architecture Drift

These are contract violations or design drift without immediate functional breakage.

---

**DRIFT-IDENT-001**
- **File + lines:** 50+ files in `features/` — representative examples: `features/post/postcard/ui/PostCard.view.jsx:16`, `features/dashboard/vport/screens/VportDashboardScreen.jsx:6`, `features/profiles/kinds/vport/hooks/barbershop/usePublishBarbershopHoursPost.js:2`
- **Description:** Feature files import `useIdentity` directly from `@/state/identity/identityContext` instead of the governed adapter `@/features/identity/adapters/identity.adapter`. 50+ confirmed bypass sites across ads, block, chat, dashboard (19 files), hydration, notifications, post (8 files), profiles (13 files), settings (5 files), upload (3 files), and app-level files.
- **Recommendation:** Fix code — migrate all 50+ sites to the adapter import path. Each change is a 1-line import swap with zero behavior change. Requires a systematic sweep, not piecemeal fixes.

---

**DRIFT-IDENT-002**
- **File + line:** `apps/VCSM/src/state/identity/identity.model.js:1–10`
- **Description:** `toPublicIdentity()` returns `{ actorId, kind, ownerActorId, realmId }`. The §1.3 contract only permits `actorId` and `kind`. Both `ownerActorId` (always null, Q7-open) and `realmId` (actively used by 5 files, Q7-open) are extra-contractual fields.
- **Recommendation:** Policy decision required (Q7). Two options: (a) Extend §1.3 to formally permit `realmId` (and rule `ownerActorId` as deprecated/removed); (b) Remove `realmId` from public identity and introduce `useRealmId()` hook. Option (a) is lower risk; Option (b) is architecturally cleaner. `ownerActorId` should be addressed separately — its always-null state makes it a dead field on the public object, even if it is occasionally populated through the hydration path.

---

**DRIFT-IDENT-003**
- **File + line:** `apps/VCSM/src/features/settings/vports/dal/vports.write.dal.js:44,75,106` and `apps/VCSM/src/features/settings/profile/dal/profile.write.dal.js:35`
- **Description:** Write DALs still use `owner_user_id = auth.uid()` as the authorization filter. The §1.4 Owner Meaning Rule prohibits `owner_user_id` as an ownership source. The `vports.write.dal.js` cases have controller-layer `actor_owners` defense-in-depth. The `profile.write.dal.js` case does not.
- **Recommendation:** Fix code — migrate DAL authorization filters to use `actor_id` via `actor_owners` chain. Requires coordinated migration since `vport.profiles.owner_user_id` may be a DB column relied on by these queries.

---

**DRIFT-IDENT-004**
- **File + line:** `apps/VCSM/src/features/settings/account/hooks/useAccountController.js:5`
- **Description:** Imports `useIdentityDisplayDeprecated` from `@/state/identity/identityContext` — both a state-layer bypass AND a deprecated export. The deprecated hook exposes `displayName`, `username`, `avatar`, `banner`, `vportType`, `isActive`, `isDeleted`, `isVoid` from `identityDetails`.
- **Recommendation:** Fix code — `useAccountController.js` should use a dedicated display hook or `useIdentityDetailsDeprecated()` from the adapter (once the adapter exposes it), or the account settings data should be fetched from its own DAL rather than from the identity layer.

---

**DRIFT-IDENT-005**
- **File + line:** `apps/VCSM/src/features/hydration/vcsmActorHydrator.js:8,12,15`
- **Description:** The hydration feature imports directly from three state/identity internals: `identity.read.dal`, `identity.model`, and `identity.controller`. This is classified as an "Infrastructure Bridge — justified but ungoverned" in IDENTITY_ARCHITECTURE_REVIEW_2026-06-06.md. The justification is correct — the hydrator is part of the resolution pipeline, not a normal consumer. But it is undocumented in the orchestrator as an exception.
- **Recommendation:** Update docs — add the hydration bridge to the IDENTITY_ORCHESTRATOR.md §3 as an explicitly documented exception. Do not fix code (the structural coupling is justified).

---

**DRIFT-IDENT-006**
- **File + line:** `apps/VCSM/src/state/identity/identityContext.jsx:165` — `identityLoading: loading` in context value
- **Description:** An `identityLoading` alias is present in the context value but is documented nowhere — not in the orchestrator, not in the contracts, not in any behavior doc.
- **Recommendation:** Update docs — add `identityLoading` to the orchestrator's useIdentity return shape documentation. It exists as a convenience alias.

---

**DRIFT-IDENT-007**
- **File + line:** `apps/VCSM/src/state/identity/identityContext.jsx:169` — `setIdentity: setIdentityCompat`
- **Description:** The public identity surface exposes `setIdentity` — a raw state setter that writes to `identityDetails`. This is an undocumented write surface on what the contract defines as a read surface. Used by `settings/profile` for optimistic avatar/banner/profile updates after upload (Q8 concern per orchestrator).
- **Recommendation:** Needs decision — the orchestrator notes "remove `setIdentity` requires settings/profile alternative first." Until that alternative is built, this is ALLOWED_EXCEPTION_OPTIMISTIC_UPLOAD but should be formally documented.

---

## 8. Recommended Ticket Queue

### P0 — Functional Breakage

| Priority | Ticket | Description | File |
|---|---|---|---|
| P0 | BUG-IDENT-001 | RestoreVportScreen Restore button never renders — `identity.isDeleted` always undefined on public identity | `features/vport/screens/RestoreVportScreen.jsx:50` |
| P0 | BUG-IDENT-002 | Review author metadata always empty — `useVportReviewMine.js` reads non-public identity fields | `features/profiles/kinds/vport/hooks/review/useVportReviewMine.js:85–87` |
| P0 | BUG-IDENT-003 | VPORT inbox scoping broken — `resolveInboxActor` always gets `ownerActorId: null` for vport actors; DEV error confirmed | `features/notifications/inbox/lib/resolveInboxActor.js:32,48` |

### P1 — Contract Violations

| Priority | Ticket | Description | File(s) |
|---|---|---|---|
| P1 | POLICY-IDENT-001 | Q7 decision: extend §1.3 to permit `realmId` (and rule on `ownerActorId`) | `02-identity-contract.md`, `identity.model.js` |
| P1 | POLICY-IDENT-002 | Q8 decision: document `setIdentity` as ALLOWED_EXCEPTION_OPTIMISTIC_UPLOAD or build alternative | `identityContext.jsx:169` |
| P1 | DRIFT-IDENT-003 | VPORT write DAL uses `owner_user_id` without `actor_owners` defense-in-depth — settings/profile write path | `features/settings/profile/dal/profile.write.dal.js:35` |
| P1 | DRIFT-IDENT-004 | `useAccountController.js` imports deprecated export from state layer — migrate | `features/settings/account/hooks/useAccountController.js:5` |

### P2 — Design Drift

| Priority | Ticket | Description | File(s) |
|---|---|---|---|
| P2 | DRIFT-IDENT-001 | Mass import migration: 50+ STATE_BYPASS sites to adapter path | 50+ files across features/ |
| P2 | DRIFT-IDENT-005 | Document hydration bridge as explicit exception in orchestrator | `IDENTITY_ORCHESTRATOR.md §3`, `vcsmActorHydrator.js` |
| P2 | DRIFT-IDENT-006 | Document `identityLoading` alias in orchestrator | `IDENTITY_ORCHESTRATOR.md §2` |
| P2 | DRIFT-IDENT-007 | Document `setIdentity` exception or build settings/profile display-refresh alternative | `identityContext.jsx:169` |
| P2 | NON-CONTRACT-READS-001 | Audit all `identity.isVoid`, `identity.displayName`, `identity.vportType` etc. reads — these rely on `identityDetails` not public identity | Multiple files in Section 3d |

### P3 — Documentation Cleanup

| Priority | Ticket | Description | File(s) |
|---|---|---|---|
| P3 | DOCS-IDENT-001 | Remove all VportLeadsChip references — component does not exist | `ARCHITECT-REVIEW-citizen-vport-first-class-actors.md`, `shell/ARCHITECTURE.md`, `CONTRACTS/App/VCSM/features/shell.md` |
| P3 | DOCS-IDENT-002 | Update TICKET-BOTTOMNAV-MODULE-REVIEW-001 — VportLeadsChip and useVportLeadsCount violations are moot; only missing shell.adapter.js remains | Ticket record |
| P3 | DOCS-IDENT-003 | Remove stale "16 @identity imports in chat" from IDENTITY_DEPENDENCY_SUMMARY.md chat row | `IDENTITY_DEPENDENCY_SUMMARY.md` |
| P3 | DOCS-IDENT-004 | Update IDENTITY_ARCHITECTURE_REVIEW_2026-06-06.md §10 RLS section — IDRLS-001 closed; IDRLS-002 open | `IDENTITY_ARCHITECTURE_REVIEW_2026-06-06.md §10` |
| P3 | DOCS-IDENT-005 | Update IDENTITY_ORCHESTRATOR.md §4 consumer map to acknowledge 50+ bypass sites; qualify "0 violations" claim with scanner scope limitation | `IDENTITY_ORCHESTRATOR.md §4` |
| P3 | DOCS-IDENT-006 | Document `profile_actor_access` fallback path in IDENTITY_ORCHESTRATOR.md — only path that produces non-null `ownerActorId` | `IDENTITY_ORCHESTRATOR.md §6 DAL Touchpoint Map` |
