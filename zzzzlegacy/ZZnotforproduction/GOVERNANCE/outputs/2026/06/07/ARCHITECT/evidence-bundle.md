# ARCHITECT V2 — Evidence Bundle (Human-Readable)

**Run date:** 2026-06-07
**Scope:** VCSM — vportDashboard + vports + team + ownership + access control + dashboard cards
**Output:** vport-dashboard-ownership-map.md

---

## Source Files Read (Verified)

| File | Purpose |
|------|---------|
| apps/VCSM/src/features/vportDashboard/controller/checkVportOwnership.controller.js | Navigation/visibility ownership gate |
| apps/VCSM/src/features/vportDashboard/model/vportAccess.model.js | Pure identity/ownership model helper |
| apps/VCSM/src/features/vportDashboard/model/buildDashboardCards.model.js | Dashboard card catalog + builder |
| apps/VCSM/src/features/vportDashboard/model/dashboardViewByVportType.model.js | Per-vportType card key presets |
| apps/VCSM/src/features/vportDashboard/hooks/useVportOwnership.js | Ownership hook (UI convenience) |
| apps/VCSM/src/features/vportDashboard/adapters/vportDashboard.adapter.js | Feature public exports |
| apps/VCSM/src/features/vportDashboard/screens/VportDashboardScreen.jsx | Main dashboard shell + isOwner gate |
| apps/VCSM/src/features/vportDashboard/controller/vportOwnerStats.controller.js | Quick stats loader (ownership-gated) |
| apps/VCSM/src/features/vportDashboard/dal/read/actorOwners.read.dal.js | Actor_owners read (missing is_void) |
| apps/VCSM/src/features/vportDashboard/dal/read/actorVport.read.dal.js | Actor→vport_id lookup |
| apps/VCSM/src/features/vportDashboard/dal/read/vportProfileActorAccess.read.dal.js | Profile actor access read |
| apps/VCSM/src/features/vportDashboard/dashboard/cards/team/controller/vportTeamAccess.controller.js | Team access CRUD (ownership-gated) |
| apps/VCSM/src/features/vportDashboard/dashboard/cards/team/controller/vportTeam.controller.js | Team member CRUD + invite |
| apps/VCSM/src/features/vportDashboard/dashboard/cards/team/controller/vportTeamInvite.controller.js | Team invite accept/decline |
| apps/VCSM/src/features/vportDashboard/dashboard/cards/team/dal/vportTeam.read.dal.js | Team reads (vport.resources staff) |
| apps/VCSM/src/features/vportDashboard/dashboard/cards/team/dal/vportTeam.write.dal.js | Team writes (vport.resources) |
| apps/VCSM/src/features/vportDashboard/dashboard/cards/team/dal/vportTeamInvite.write.dal.js | Invite write DAL (atomic guards) |
| apps/VCSM/src/features/vportDashboard/dashboard/cards/leads/controller/vportLeads.controller.js | Leads CRUD (owner + session gates) |
| apps/VCSM/src/features/booking/controllers/assertActorOwnsVportActor.controller.js | Canonical ownership assertion |
| supabase/migrations/20260515020000_vport_resources_actor_rls_rebuild.sql | vport.resources RLS (6 policies) |
| supabase/migrations/20260527020000_vport_resources_update_member_policy.sql | Member update RLS (barber acceptance) |
| supabase/migrations/20260503040334_fix_public_profile_rls_policies.sql | profile_actor_access, content_pages, menu_categories RLS |
| supabase/migrations/20260606000001_vc_actor_owners_insert_policy_and_rpc_grant_hygiene.sql | actor_owners INSERT fix (NOT DEPLOYED) |

---

## Key Security Findings Summary

| ID | Severity | Finding | Source File |
|----|---------|---------|-------------|
| P0-OWNER-001 | P0 CRITICAL | actor_owners INSERT policy NOT DEPLOYED — loose policy may allow ownership fabrication | migrations/20260606000001 |
| P1-ACCESS-001 | P1 HIGH | findEligibleBarbersController — no ownership assertion, reveals follower-barber linkage | vportTeam.controller.js:59 |
| P1-ACCESS-002 | P1 HIGH | fetchBarbershopInviteController — no ownership gate, any caller can fetch any resource by id | vportTeamInvite.controller.js:110 |
| P1-ACCESS-003 | P1 HIGH | profile_actor_access uses legacy SECURITY DEFINER actor_can_manage_profile — potential trust drift | migrations/20260503040334 |
| P1-ACCESS-004 | P1 MEDIUM | actorOwners.read.dal.js missing is_void filter on vc.actor_owners query | actorOwners.read.dal.js:8 |
| P2-GOV-001 | P2 | Dashboard shell ownership is client-state only; 6 card controllers unverified for independent re-check | VportDashboardScreen.jsx:147 |
| P2-GOV-002 | P2 | Dual team controller sets — overlapping function names, maintenance risk | vportTeamAccess.controller.js, vportTeam.controller.js |
| P2-GOV-003 | P2 | Team membership is public information for all active VPORTs — intentional but worth periodic review | migrations/20260503040334 |

---

## Architecture State

**Ownership model:** Actor-based (vc.actor_owners). Correct and canonical.
**Ownership gate:** assertActorOwnsVportActorController. Well-implemented with kind check, void check, is_void check on link.
**Dashboard shell:** Correctly blocks rendering but relies on client state. Correct only if downstream controllers independently re-verify.
**Team management:** Ownership-gated at all write paths. Three unguarded read/search paths exist.
**Leads:** Correctly owner-only for PII-containing data. Session-bound countNew is appropriate.
**RLS:** vport.resources is clean (6 actor-based policies, no SECURITY DEFINER). profile_actor_access uses legacy function. actor_owners INSERT policy needs deployment.

---

## BRANCH PASS: vport-booking-feed-security-updates (2026-06-07T08:45:00Z)

### Additional Source Files Read (Branch Pass)

| File | Layer | Purpose |
|------|-------|---------|
| apps/VCSM/src/features/booking/controllers/createBooking.controller.js | controller | Full read — session binding, duration ceiling, ownership gate |
| apps/Traffic/src/app/api/answers/questions/route.js | screen/route | POST handler — no auth check |
| apps/Traffic/src/app/api/answers/moderation/questions/route.js | screen/route | POST handler — static token auth |
| apps/Traffic/src/app/api/answers/moderation/answers/route.js | screen/route | POST handler — static token auth |
| apps/Traffic/src/features/answers/adapters/answers.adapter.js | adapter | Public API surface of answers feature |
| apps/Traffic/src/features/answers/hooks/useAnswerPage.js | hook | Read-only hook — no auth |
| apps/Traffic/src/features/answers/controllers/submitQuestion.controller.js | controller | No auth enforcement |
| apps/Traffic/src/features/answers/dal/questions.write.dal.js | dal | Live DB write — env-gated |
| apps/Traffic/src/features/answers/models/moderationAuth.model.js | model | Static bearer token validation |

### Key Security Calls Verified (Branch Pass)

| Call Chain | Auth | DB Table | Status |
|---|---|---|---|
| POST /api/answers/questions → submitQuestion → createQuestionRow | NONE | answers.questions | HIGH risk when schema-ready=true |
| POST /api/answers/moderation/questions → validateModerationRequest → moderateQuestion | Static token | answers.questions | MEDIUM — shared secret |
| POST /api/answers/moderation/answers → validateModerationRequest → moderateAnswer | Static token | answers.answers | MEDIUM — shared secret |
| createBookingController (public) → customerActorId = requestActorId | Session-bound | bookings | PASS [SOURCE_VERIFIED] |
| createBookingController → publishVcsmNotification | linkPath: null | notification.events | PASS — no actor UUID in notification |

### Summary

**Booking feature:** Security controls for the branch (session-binding, notification linkPath) are SOURCE_VERIFIED as CLOSED.
**Traffic answers:** Two HIGH-severity surfaces found. Unauthenticated question submission is the primary concern. Env-flag gates protect DB, but the code path is production-deployed.
**Traffic moderation:** Shared-secret auth is weak but functional. Risk is manageable if token rotation is enforced.
**Traffic conversion (vport RPC):** Ungated live RPC — needs VENOM review for auth model.
