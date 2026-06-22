# OWNER-REFERENCE-DISCOVERY-001
## Full-Scale Owner Reference Audit — apps/VCSM/src

**Date:** 2026-06-07
**Scope:** apps/VCSM/src — all features, learning, state, dev/diagnostics, scripts
**Type:** Read-only audit
**Status:** COMPLETE

---

## SUMMARY COUNTS

| Category | Count |
|---|---|
| Total unique files with owner references | 386 |
| CRITICAL violations | 0 |
| HIGH findings | 1 |
| MEDIUM findings | 2 |
| LOW findings | 2 |
| INFO / Clean patterns | 18 |

---

## COUNT BY FEATURE FOLDER

| Feature | Files |
|---|---|
| features/profiles | 104 |
| features/vportDashboard | 88 |
| dev/diagnostics | 38 |
| features/booking | 28 |
| features/wanders | 18 |
| features/flyerBuilder | 17 |
| features/settings | 14 |
| features/post | 7 |
| features/feed | 7 |
| learning/controller | 5 |
| features/notifications | 5 |
| features/media | 5 |
| features/chat | 5 |
| features/social | 4 |
| features/professional | 4 |
| features/vport | 3 |
| features/join | 3 |
| state/identity | 2 |
| learning/model | 2 |
| learning/dal | 2 |
| features/auth | 2 |
| app/routes | 2 |
| other | 10 |

---

## COUNT BY OWNERSHIP TYPE

| Type | Count (approx.) |
|---|---|
| ACTOR_OWNER (actor_owners table) | ~140 |
| RESOURCE_OWNER (owner_actor_id on resource row) | ~80 |
| USER_OWNER (owner_user_id, session-bound) | ~45 |
| VPORT_OWNER (vport-context ownership) | ~40 |
| UI_LABEL_ONLY (isOwner display state) | ~60 |
| LEGACY_OR_AMBIGUOUS | 2 |

---

## TABLE A — ALL OWNER REFERENCES (KEY SYMBOLS)

| Symbol | Files (count) | Layer | Type | Risk |
|---|---|---|---|---|
| `actor_owners` table | ~65 | dal, controller, dev | ACTOR_OWNER | INFO |
| `ownerActorId` (param) | ~40 | dal, controller, hook | RESOURCE_OWNER | MEDIUM (see B) |
| `owner_actor_id` (column) | ~50 | dal, model | RESOURCE_OWNER | INFO |
| `ownerUserId` (param) | ~15 | dal, controller | USER_OWNER | LOW |
| `owner_user_id` (column) | ~25 | dal, model | USER_OWNER | LOW |
| `isOwner` (state) | ~45 | hook, screen, component | UI_LABEL_ONLY | INFO |
| `checkVportOwnershipController` | 12 callers | controller, hook | VPORT_OWNER | INFO |
| `assertActorOwnsVportActorController` | 30+ callers | controller | ACTOR_OWNER | INFO |
| `assertSessionOwnsVportActorController` | 2 callers | controller | ACTOR_OWNER | INFO |
| `deriveVportIsOwner` | 1 caller | model, screen | UI_LABEL_ONLY | LOW |
| `createdByActorId` | ~25 | dal, controller, model | RESOURCE_OWNER | INFO |
| `created_by_actor_id` | ~30 | dal, model | RESOURCE_OWNER | INFO |

---

## TABLE B — ACTOR OWNERSHIP REFERENCES (actor_owners table reads)

| File | Symbol | Purpose | Session-derived? | Risk |
|---|---|---|---|---|
| `features/settings/vports/dal/actorOwners.read.dal.js` | `readActorOwnersByUserDAL` | Read all actor_owners for a user | Yes (userId param) | INFO |
| `features/settings/vports/dal/vports.read.dal.js:31` | `.from("actor_owners")` | Resolve VPORT actor IDs for session user | Yes | INFO |
| `features/booking/dal/readActorOwnerLinkByActorAndUserProfile.dal.js` | `readActorOwnerLinkByActorAndUserProfileDAL` | Verify actor_owners link for VPORT ownership gate | Yes (profileId from actor) | INFO |
| `features/booking/dal/readOwnerLinkByActorAndSession.dal.js` | `readOwnerLinkByActorAndSessionDAL` | Session-scoped ownership read | Yes (auth.uid() implicit) | INFO |
| `features/vportDashboard/dal/read/actorOwners.read.dal.js` | `readActorOwnersByActorIdDAL` | Dev probe — read actor_owners rows | No (actorId param) | INFO |
| `features/auth/dal/actorOwnerCreate.dal.js` | `dalCreateActorOwner` | Create actor_owners row on user actor creation | Yes (userId from auth) | INFO |
| `state/identity/identity.read.dal.js:144` | `readActorOwnerUserDAL` | Resolve owner user from actor_owners for identity hydration | No (actorId param) | INFO |
| `features/wanders/core/dal/read/actorOwners.read.dal.js` | `readPrimaryUserActorOwnerByUserIdDAL` | Resolve primary user actor for wanders | Yes (userId param) | INFO |
| `features/portfolio/setup.js:39` | `isActorOwner` callback | engine-level ownership gate, queries actor_owners | Yes (via RLS auth.uid()) | INFO |
| `features/reviews/setup.js:44` | `isActorOwner` callback | engine-level ownership gate, queries actor_owners | Yes (via RLS auth.uid()) | INFO |
| `features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js` | `dalReadActorOwnerRow` | Rate ownership verification | No (actorId+userId params) | INFO |
| `features/flyerBuilder/designStudio/dal/designStudio.read.dal.js:5` | `dalReadActorOwnerRow` | Design studio ownership gate | No (actorId+userId params) | INFO |
| `features/notifications/inbox/controller/resolveVportOwnerActor.controller.js` | `readActorOwnerUserDAL` | Resolve VPORT owner for notification routing | No (vportActorId param) | INFO |

All actor_owners reads are scoped by session auth or validated against session actor. No unauthenticated actor_owners reads detected. RLS policy `actor_owners_read_own` enforces `user_id = auth.uid()` at DB level.

---

## TABLE C — RESOURCE OWNERSHIP REFERENCES (owner_actor_id on data rows)

| File | Column Written | Who Supplies It | Gated Before Write? | Risk |
|---|---|---|---|---|
| `features/booking/dal/insertBookingResource.dal.js` | `owner_actor_id` | Passed from `ensureOwnerBookingResourceController` | YES — `assertActorOwnsVportActorController` | INFO |
| `features/booking/dal/listBookingResourcesByOwnerActorId.dal.js` | `.eq("owner_actor_id", ownerActorId)` | Caller param | YES — all callers gated | INFO |
| `features/booking/dal/getBookingResourceById.dal.js` | `.eq("owner_actor_id", ownerActorId)` | Optional filter param | Conditional gate | INFO |
| `features/vportDashboard/dal/write/vportResource.write.dal.js` | `owner_actor_id` | Passed from controller | YES — controllers gate | INFO |
| `features/vportDashboard/dashboard/cards/team/dal/vportTeam.write.dal.js` | `owner_actor_id: ownerActorId` | Parameter from controller | YES — `assertActorOwnsVportActorController` called before | MEDIUM (DAL has no self-protection) |
| `features/vportDashboard/dashboard/cards/team/dal/vportTeamInvite.write.dal.js` | `owner_actor_id: ownerActorId` | Parameter from controller | YES — gate in controller | MEDIUM (DAL has no self-protection) |
| `features/flyerBuilder/designStudio/dal/designStudio.write.dal.js:9` | `owner_actor_id: ownerActorId` | Parameter | YES — shared controller verifies via `dalReadActorOwnerRow` | INFO |
| `features/wanders/core/dal/write/mailbox.write.dal.js:80` | `owner_user_id: input.ownerUserId` | Parameter | YES — controllers derive from `user.id` session | INFO |
| `features/media/dal/mediaAssets.write.dal.js` | `owner_actor_id` | Row from controller | YES — `createMediaAssetController` validates | INFO |
| `learning/dal/organizations/getOrganizationById.dal.js` | `owner_actor_id` (SELECT) | DB column | N/A — read | INFO |
| `features/profiles/dal/friends/friendRanks.write.dal.js` | `p_owner_actor_id` | RPC param, from controller | YES — session-bound | INFO |

---

## TABLE D — CALLER-SUPPLIED OWNER PARAMETERS

These are functions that accept `ownerActorId` / `owner_actor_id` as a parameter rather than deriving it from the session.

| File | Function | Parameter | Upstream Gate? | Risk |
|---|---|---|---|---|
| `features/booking/dal/insertBookingResource.dal.js` | `insertBookingResourceDAL` | `row.owner_actor_id` | YES — `ensureOwnerBookingResourceController` always calls `assertActorOwnsVportActorController` first | INFO |
| `features/booking/dal/listBookingResourcesByOwnerActorId.dal.js` | `listBookingResourcesByOwnerActorIdDAL` | `ownerActorId` | YES — callers are controllers that already hold resource reference | INFO |
| `features/vportDashboard/dashboard/cards/team/dal/vportTeam.write.dal.js` | `insertTeamMemberDAL`, `insertLinkedTeamMemberDAL` | `ownerActorId` | YES — caller `vportTeam.controller.js` calls `assertActorOwnsVportActorController` before invoking | MEDIUM — DAL boundary is permeable; direct DAL call would skip gate |
| `features/vportDashboard/dashboard/cards/team/dal/vportTeamInvite.write.dal.js` | `insertTeamRequestDAL` | `ownerActorId` | YES — caller `vportTeam.controller.js` calls gate first | MEDIUM — same as above |
| `features/flyerBuilder/designStudio/dal/designStudio.write.dal.js` | `dalInsertDesignDocument`, `dalUploadDesignAsset` | `ownerActorId` | YES — `designStudio.shared.controller.js` verifies via `dalReadActorOwnerRow` | INFO |
| `features/vportDashboard/dashboard/cards/bookings/dal/insertVportBooking.write.dal.js` | `insertVportBookingWriteDAL` | `created_by_actor_id`, `customer_actor_id` | YES — `createOwnerBooking.controller.js` calls `assertActorOwnsVportActorController` first; these are session-derived by the time they reach the DAL | INFO |
| `features/media/controllers/createMediaAsset.controller.js` | `createMediaAssetController` | `ownerActorId`, `createdByActorId` | YES — callers must pass session actorId; controller validates non-null | LOW — no DB verify, trusts caller actorId |
| `features/settings/profile/hooks/useProfileUploads.js:36` | `uploadMediaController` call | `ownerActorId: actorId` | Session-derived via `useIdentity()` | INFO |

---

## TABLE E — OWNERSHIP AUTHORIZATION GATES

All confirmed server-side ownership verification functions.

| Gate Function | File | Mechanism | Used By | Risk |
|---|---|---|---|---|
| `assertActorOwnsVportActorController` | `features/booking/controllers/assertActorOwnsVportActor.controller.js` | DB: `actor_owners` via `readActorOwnerLinkByActorAndUserProfileDAL`; kind check first | 30+ controllers | INFO |
| `assertSessionOwnsVportActorController` | `features/booking/controllers/assertSessionOwnsVportActor.controller.js` | DB: `actor_owners` via `readOwnerLinkByActorAndSessionDAL`; session-implicit | Leads count | INFO |
| `checkVportOwnershipController` | `features/vportDashboard/controller/checkVportOwnership.controller.js` | Wraps `assertActorOwnsVportActorController`; returns bool | `useVportOwnership` hook, gas price controllers | INFO |
| `isActorOwner` (portfolio engine) | `features/portfolio/setup.js:39` | DB: `actor_owners` with RLS | Portfolio engine | INFO |
| `isActorOwner` (reviews engine) | `features/reviews/setup.js:44` | DB: `actor_owners` with RLS | Reviews engine | INFO |
| `dalReadActorOwnerRow` | `features/flyerBuilder/designStudio/dal/designStudio.read.dal.js` | DB: `actor_owners` — actorId + userId | Design studio shared controller | INFO |
| `dalReadActorOwnerRow` | `features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js` | DB: `actor_owners` — actorId + userId | Rates controllers | INFO |
| `readActorOwnerLinkByActorAndUserProfileDAL` | `features/booking/dal/readActorOwnerLinkByActorAndUserProfile.dal.js` | DB: `actor_owners` — targetActorId + userProfileId | `assertActorOwnsVportActorController` | INFO |
| `readOwnerLinkByActorAndSessionDAL` | `features/booking/dal/readOwnerLinkByActorAndSession.dal.js` | DB: `actor_owners` — session implicit | `assertSessionOwnsVportActorController` | INFO |
| Learning org: `owner_actor_id === actorId` | `learning/controller/administration/adminAccess.controller.js:249,280` | DB value comparison server-side | LMS admin paths | INFO |

---

## TABLE F — OWNERSHIP DISPLAY-ONLY REFERENCES

| Symbol | File | Usage | Security Boundary? |
|---|---|---|---|
| `isOwner` state | `features/vportDashboard/hooks/useVportOwnership.js` | Controls UI rendering (show/hide dashboard cards) | NO — documented as UI convenience only |
| `isOwner` prop | 15+ screen/component files | Controls visibility of edit controls, tabs, buttons | NO |
| `deriveVportIsOwner` | `features/profiles/kinds/vport/model/vportOwnership.model.js` | Pure actorId comparison for VPORT profile tab display | NO — server enforces independently |
| `isOwner` on post cards | `features/post/postcard/components/PostCard.view.jsx:47` | `viewerActorId === safePost.actorId` — controls menu options shown | NO — mutations gated server-side |
| `isOwner` in feed | `features/feed/model/feedRowVisibility.model.js` | Feed row visibility logic | NO — server enforces privacy |
| `isOwner` in comments | `features/post/commentcard/models/Comment.model.js:43` | `is_owner` from DB row | From DB — INFO |
| `isOwner` in learning | `learning/controller/administration/getAdminDashboard.controller.js:241` | `owner_actor_id === actorId` — display flag | Server-side comparison — INFO |
| `isStationOwner` / `isOwner` gas | gas price components | Display edit controls | NO — mutations call `checkVportOwnershipController` |
| `canEdit = isOwner && ...` | `features/vportDashboard/dashboard/cards/team/components/team/TeamMemberCards.jsx:74` | Show edit controls | NO — mutations gated server-side |

**IMPORTANT NOTE on `useVportOwnership` hook:**
The hook documentation is explicit: *"isOwner is a UI convenience state only. All privileged mutations MUST independently verify ownership through controller-layer actor_owners checks. This hook improves UX synchronization only. It is NOT the security boundary."* The hook fails closed on any error (`setIsOwner(false)`). ✓

---

## TABLE G — OWNERSHIP DAL/TABLE REFERENCES

| Table | DAL File | Operation | Auth Mechanism |
|---|---|---|---|
| `actor_owners` | `features/settings/vports/dal/actorOwners.read.dal.js` | SELECT | userId param + RLS |
| `actor_owners` | `features/settings/vports/dal/vports.read.dal.js` | SELECT (join) | userId from session |
| `actor_owners` | `features/auth/dal/actorOwnerCreate.dal.js` | INSERT | actorId + userId from auth |
| `actor_owners` | `features/booking/dal/readActorOwnerLinkByActorAndUserProfile.dal.js` | SELECT | profileId from DB actor |
| `actor_owners` | `features/booking/dal/readOwnerLinkByActorAndSession.dal.js` | SELECT | session-implicit |
| `actor_owners` | `features/vportDashboard/dal/read/actorOwners.read.dal.js` | SELECT | actorId param (probe/dev) |
| `actor_owners` | `features/wanders/core/dal/read/actorOwners.read.dal.js` | SELECT | userId param |
| `actor_owners` | `features/flyerBuilder/designStudio/dal/designStudio.read.dal.js` | SELECT | actorId + userId |
| `actor_owners` | `features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js` | SELECT | actorId + userId |
| `actor_owners` | `state/identity/identity.read.dal.js:144` | SELECT | actorId param |
| `resources` (booking) | `features/booking/dal/insertBookingResource.dal.js` | INSERT — `owner_actor_id` | Gate before insert |
| `resources` (vport) | `features/vportDashboard/dal/write/vportResource.write.dal.js` | INSERT/UPDATE | Gate before write |
| `resources` (team) | `features/vportDashboard/dashboard/cards/team/dal/vportTeam.write.dal.js` | INSERT — `owner_actor_id` | Gate in controller (not DAL) |
| `vport.profiles` | `features/settings/vports/dal/vports.write.dal.js` | UPDATE `.eq("owner_user_id", userId)` | userId from session |
| `design_documents` | `features/flyerBuilder/designStudio/dal/designStudio.write.dal.js` | INSERT — `owner_actor_id` | Gate in shared controller |
| `platform.media_assets` | `features/media/dal/mediaAssets.write.dal.js` | INSERT — `owner_actor_id` | Controller validates; RLS enforces |
| `friend_ranks` | `features/profiles/dal/friends/friendRanks.write.dal.js` | RPC — `p_owner_actor_id` | Session-bound via controller |

---

## TABLE H — OWNERSHIP HOOKS AND COMPONENTS

| Symbol | File | Layer | Back-end gate? |
|---|---|---|---|
| `useVportOwnership` | `features/vportDashboard/hooks/useVportOwnership.js` | hook | YES — calls `checkVportOwnershipController` |
| `useVportOwnerSchedule` | `features/vportDashboard/dashboard/cards/schedule/hooks/useVportOwnerSchedule.js` | hook | YES — schedule controller verifies |
| `useVportOwnerQuickStats` | `features/profiles/kinds/vport/hooks/useVportOwnerQuickStats.js` | hook | YES — `loadOwnerQuickStatsController` calls `assertActorOwnsVportActorController` |
| `useSubmitFuelPriceSuggestion` | `features/vportDashboard/dashboard/cards/gasprices/hooks/useSubmitFuelPriceSuggestion.js` | hook | YES — passes `ownerUpdate: isOwner` to controller; controller calls `checkVportOwnershipController` |
| `useSaveVportSettings` | `features/vportDashboard/dashboard/cards/settings/hooks/useSaveVportSettings.js` | hook | YES — `isOwner` is a guard but save calls controller with `assertActorOwnsVportActorController` |
| `useVportTeamAccess` | `features/vportDashboard/dashboard/cards/team/hooks/useVportTeamAccess.js` | hook | YES — team controller gates all mutations |
| `useCalendarDashboard` | `features/vportDashboard/dashboard/cards/calendar/hooks/useCalendarDashboard.js` | hook | YES — `ensureOwnerBookingResourceController` gates |

---

## TABLE I — TESTS AND DEV DIAGNOSTICS

| File | Ownership References | Purpose |
|---|---|---|
| `features/booking/controllers/__tests__/assertActorOwnsVportActor.controller.test.js` | `readActorOwnerLinkByActorAndUserProfileDAL` mock | Tests actor_owners gate — correctly mocked |
| `features/vportDashboard/controller/__tests__/vportOwnerStats.controller.test.js` | `assertActorOwnsVportActorController` | Tests ownership verification in stats controller |
| `features/vportDashboard/dashboard/cards/gasprices/__tests__/submitFuelPriceSuggestion.controller.test.js` | `checkVportOwnershipController` | Tests gas price ownership gate |
| `features/flyerBuilder/designStudio/controllers/__tests__/designStudio.shared.controller.test.js` | `dalReadActorOwnerRow` | Tests design studio ownership gate |
| `features/vportDashboard/dashboard/cards/portfolio/__tests__/portfolio.spiderman.test.js` | `useVportOwnership` | Regression: verifies hook is present |
| `features/vportDashboard/dashboard/cards/gasprices/__tests__/gasprices.spiderman.test.js` | `useVportOwnership` | Regression: verifies hook is present |
| `features/vportDashboard/dashboard/cards/settings/__tests__/settingsSavingGuard.regression.test.js` | `isOwner` guard | Regression: isOwner guard in save hook |
| `features/profiles/kinds/vport/model/__tests__/vportOwnership.model.test.js` | `deriveVportIsOwner` | Unit tests pure derivation model |
| `features/profiles/kinds/vport/controller/subscribers/__tests__/getSubscribers.controller.test.js` | `isOwner` guard reference | Verifies gate context |
| `shared/ui/dashboard/__tests__/backButton.spiderman.test.js` | Regex for `actor_owners` | Spiderman regression |
| **dev/diagnostics** (38 files) | `actor_owners`, `owner_actor_id`, `ownerActorId` | Dev-only diagnostic probes — all guarded by DEV-only environment checks |

---

## TABLE J — VIOLATIONS AND AMBIGUOUS REFERENCES

### FINDING-OWN-001 [HIGH]
**`OWNER_FROM_USER_ID` — explore/search.model.js:48**

```
Feature: explore
File: features/explore/models/search.model.js:48
Layer: model
Symbol: ownerUserId: row.owner_user_id ?? null
Ownership type: USER_OWNER
Is it caller-supplied? No — from DB row
Is it used for authorization? No
Is it used only for display? Not yet consumed
Is it derived from vc.actor_owners? No — from vport.profiles.owner_user_id
Is it trusted? No — owner_user_id should not surface in public search results
```

**Violation:** `OWNER_FROM_USER_ID`

`mapVportSearchResult()` maps raw search rows to domain objects and includes `ownerUserId: row.owner_user_id`. Even though no current downstream consumer reads this field, the field exists on the normalized output object returned from all VPORT search queries. If this object is ever serialized to the client (e.g., transmitted over API, logged), it exposes an internal `owner_user_id` field in the public search result surface.

The file's own comment says: *"user_id is legacy / auxiliary metadata only"* — yet it appears in the normalized public output.

**Contract breach:** Identity Contract Rule 1 — "Public identity must not expose owner fields."
Identity Contract Rule 3 — Ownership must not be inferred from `owner_user_id`.

**Recommended fix:** Remove `ownerUserId` from `mapVportSearchResult`. VPORT ownership is not navigable via search results and should not appear in the public search model.

---

### FINDING-OWN-002 [MEDIUM]
**`OWNER_DAL_BYPASS` — Team write DALs accept ownerActorId without self-protection**

```
Feature: vportDashboard/team
Files:
  features/vportDashboard/dashboard/cards/team/dal/vportTeam.write.dal.js:5,24
  features/vportDashboard/dashboard/cards/team/dal/vportTeamInvite.write.dal.js:14
Layer: DAL
Symbols: insertTeamMemberDAL, insertLinkedTeamMemberDAL, insertTeamRequestDAL
Ownership type: RESOURCE_OWNER
Is it caller-supplied? YES
Is ownership verified server-side? Only by upstream controller — not the DAL itself
```

**Pattern:** `OWNER_CALLER_SUPPLIED` + `OWNER_DAL_BYPASS` risk

The three DAL functions accept `ownerActorId` as a parameter and write it directly to `owner_actor_id` in the DB. The DALs themselves have no protection. All current callers (`vportTeam.controller.js`, `vportTeamAccess.controller.js`) correctly call `assertActorOwnsVportActorController` before these DAL calls.

However, the DAL boundary is permeable — any future direct caller or test that hits these DALs without going through the controller layer would write an arbitrary `owner_actor_id`.

**Risk:** Medium — current paths are safe, future paths may not be.

**Recommended action:** Add a DB-level RLS policy or DB trigger on the `resources` table enforcing `owner_actor_id` is always a valid actor the current session user owns, so the DAL cannot be the last line of defense.

---

### FINDING-OWN-003 [MEDIUM]
**`checkVportOwnershipController` — VPORT self-view shortcut bypasses actor_owners for dashboard gate**

```
Feature: vportDashboard
File: features/vportDashboard/controller/checkVportOwnership.controller.js:7-10
Layer: controller
Symbol: checkVportOwnershipController
Ownership type: VPORT_OWNER (navigation gate)
```

**Pattern:** `OWNER_CLIENT_ONLY` (partial)

When `callerActorId === targetActorId` and the actor is `kind=vport`, `checkVportOwnershipController` returns `true` without querying `actor_owners`. This means a VPORT-kind actor can pass the `isOwner=true` gate for its own dashboard purely by actor ID equality, skipping the DB check.

This is intentional and documented: *"Dashboard access: a VPORT actor viewing its own dashboard is granted access. This is a navigation/visibility gate only — mutations require a user-kind actor."*

The risk is limited because:
1. `isOwner` from `useVportOwnership` only controls what renders, not what mutates
2. All mutation paths require a user-kind actor via `assertActorOwnsVportActorController`

**Risk:** Medium for the visibility gate. A compromised VPORT-kind actor token could render dashboard UI but cannot perform mutations.

**Recommended action:** Document this exception explicitly in a BEHAVIOR.md. Consider whether the VPORT self-view shortcut needs a void check (already has `!actor.is_void`). No code change required if the segregation between visibility and mutation gates is maintained.

---

### FINDING-OWN-004 [LOW]
**CARNAGE deferred — `actor_can_manage_profile` DB function has legacy `owner_user_id` branch**

```
File: features/booking/controllers/assertActorOwnsVportActor.controller.js:5
Layer: controller (comment)
```

Comment: `// CARNAGE: inspect and remove the legacy owner_user_id branch from actor_can_manage_profile and actor_can_view_profile DB functions — migration 20260523020000 comment confirms it exists.`

The DB functions `actor_can_manage_profile` and `actor_can_view_profile` still have legacy `owner_user_id` branches. These are not called by the current app-layer ownership gate (which uses `actor_owners` directly), but they persist in the DB schema. If called directly, they could grant access via `owner_user_id` comparison.

**Risk:** Low — the app layer does not call these RPCs for authorization. Database migration cleanup is pending.

---

### FINDING-OWN-005 [LOW]
**`createMediaAssetController` — trusts caller-supplied ownerActorId without DB ownership verification**

```
Feature: media
File: features/media/controllers/createMediaAsset.controller.js:28,48
Layer: controller
Symbol: ownerActorId (parameter)
```

`createMediaAssetController` accepts `ownerActorId` and `createdByActorId` as parameters and validates they are non-null but does not verify that the calling session actually owns or is the supplied `ownerActorId`. The protection relies entirely on:
1. All callers supplying the session actor from `useIdentity()`
2. The `platform.media_assets` RLS policy enforcing ownership at the DB level (TICKET-PLATFORM-RLS-001 notes this has a `{public}` policy issue)

**Risk:** Low for the controller path itself. Higher if TICKET-PLATFORM-RLS-001 is not resolved.

---

## TABLE K — RECOMMENDED TICKETS

| Ticket | Priority | Type | Title |
|---|---|---|---|
| OWNER-001 | HIGH | SEC | Remove ownerUserId from explore/search.model mapVportSearchResult output |
| OWNER-002 | MEDIUM | SEC | Add RLS/trigger to resources table — enforce owner_actor_id via actor_owners, not caller trust |
| OWNER-003 | LOW | ENG | Close CARNAGE deferred: remove legacy owner_user_id branch from actor_can_manage_profile DB function |
| OWNER-004 | LOW | ENG | Document VPORT self-view shortcut in checkVportOwnershipController BEHAVIOR.md |

---

## AUTHORIZATION GATES — CLEAN PATTERNS SUMMARY

These are all ownership paths confirmed to be secure server-side:

| Path | Gate | Mechanism |
|---|---|---|
| VPORT settings mutations | `assertActorOwnsVportActorController` | actor_owners DB + kind check |
| Booking resource CRUD | `assertActorOwnsVportActorController` | actor_owners DB + kind check |
| Booking create/confirm/cancel | `assertActorOwnsVportActorController` | actor_owners DB + kind check |
| Team member add/remove | `assertActorOwnsVportActorController` | actor_owners DB + kind check |
| Team invite/decline | `assertActorOwnsVportActorController` | actor_owners DB + kind check |
| Dashboard stats | `assertActorOwnsVportActorController` | actor_owners DB + kind check |
| Schedule operations | `assertActorOwnsVportActorController` | actor_owners DB + kind check |
| Vport public detail save | `assertActorOwnsVportActorController` | actor_owners DB + kind check |
| Flyer editor | `dalReadActorOwnerRow` (actor_owners) | actor_owners DB |
| Gas price updates (owner) | `checkVportOwnershipController` | wraps assertActorOwnsVportActor |
| Portfolio engine | `isActorOwner` (actor_owners + RLS) | actor_owners DB with RLS |
| Reviews engine | `isActorOwner` (actor_owners + RLS) | actor_owners DB with RLS |
| VPORT settings (privacy, social) | `assertActorOwnsVportActorController` | actor_owners DB + kind check |
| Leads (list/count/delete) | `assertActorOwnsVportActorController` | actor_owners DB + kind check |
| Session leads count | `assertSessionOwnsVportActorController` | actor_owners + session |
| Profile upload (media) | Session-derived actorId via `useIdentity()` | identity hook + RLS |
| Account settings | `assertActorOwnsVportActorController` | actor_owners DB + kind check |
| Join barbershop | `assertActorOwnsVportActorController` | actor_owners DB + kind check |
| QR code links | `assertActorOwnsVportActorController` | actor_owners DB + kind check |
| VPORT write DALs (owner_user_id) | `.eq("owner_user_id", userId)` with userId from session | Supabase session auth |
| Wanders mailbox | `user.id` from session | Supabase session auth |
| Actor creation (owner row) | `dalCreateActorOwner` with `userId` from auth | auth-bound |
| LMS org ownership | `owner_actor_id === actorId` (server DB comparison) | Server-side DB check |

---

## IDENTITY CONTRACT COMPLIANCE VERDICT

| Rule | Status |
|---|---|
| 1. Public identity must not expose owner fields | PARTIAL VIOLATION — `explore/search.model.js:48` exposes `ownerUserId` in VPORT search results (OWNER-001) |
| 2. Ownership must come from `vc.actor_owners` | COMPLIANT — all authorization gates use actor_owners |
| 3. Ownership must not be inferred from profileId/vportId/userId/owner_user_id | PARTIAL VIOLATION — `vportOwnership.model.js` uses actorId equality (display-only, documented); `explore` exposes owner_user_id (see rule 1) |
| 4. Mutations requiring ownership must verify through controller/RPC/DAL gate | COMPLIANT — 30+ controller callers verified; DAL boundary has medium risk (OWNER-002) |
| 5. UI labels may say owner, but must not authorize | COMPLIANT — `useVportOwnership` documented as UI-only; all mutations re-verify server-side |

**Overall:** MOSTLY COMPLIANT with 1 HIGH finding (OWNER-001) and 2 MEDIUM findings (OWNER-002, OWNER-003) that require follow-up tickets.

---

## SEARCH COMMANDS EXECUTED

```
grep -Rn "ownerActorId" apps/VCSM/src                    → 400+ hits
grep -Rn "owner_actor_id" apps/VCSM/src                  → 150+ hits
grep -Rn "ownerUserId|owner_user_id" apps/VCSM/src        → 80+ hits
grep -Rn "actor_owners|actorOwners" apps/VCSM/src         → 150+ hits
grep -Rn "isOwner|IsOwner" apps/VCSM/src                  → 200+ hits
grep -Rn "vportOwner|VportOwner" apps/VCSM/src            → 100+ hits
grep -Rn "createdBy|createdByActorId" apps/VCSM/src       → 80+ hits
grep -Rn "ownerId|owner_id" apps/VCSM/src                 → 5 hits (all listMyBookings, local only)
grep -Rn "ownership" apps/VCSM/src                        → 100+ hits
grep -Rn "identity.ownerActorId" apps/VCSM/src            → 0 hits ✓
grep -Rn "toPublicIdentity.*owner" apps/VCSM/src          → 0 hits ✓
```

---

*OWNER-REFERENCE-DISCOVERY-001 — Generated 2026-06-07 — Read-only, no files modified*
