# Runtime Feature Index: join

## Metadata

| Field | Value |
|---|---|
| Feature | join |
| CURRENT Folder | CURRENT/features/join |
| Source Folder | apps/VCSM/src/features/join |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |
| ARCHITECT Run | ARCHITECT-JOIN-0001 |
| Security Tier | MEDIUM (operational); prior tier CRITICAL partially resolved |

## Source Inventory

| Layer | Count | Key Files |
|---|---:|---|
| Controllers | 2 | joinBarbershopQr.controller.js, joinBarbershopAccount.controller.js |
| DALs | 3 | joinInvite.dal.js, joinAuth.dal.js, barberVport.read.dal.js |
| Hooks | 1 | useJoinBarbershop.js |
| Models | 0 | NONE FOUND |
| Screens | 1 | JoinBarbershopScreen.jsx |
| Components | 4 | JoinLoginForm.jsx, JoinSignupForm.jsx, JoinPrimitives.jsx, joinStyles.js |
| Routes | 1 | /join/barbershop/:token — PUBLIC |
| Tests | 1 | controllers/__tests__/joinBarbershopQr.controller.test.js |

## Route / Screen Map

| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| /join/barbershop/:token | apps/VCSM/src/features/join/screens/JoinBarbershopScreen.jsx | PUBLIC_ZERO_AUTH | Outside ProtectedRoute. Token is opaque UUID from vport.resources. Handles new-user signup, existing-user login, VPORT creation, and resource acceptance. QR and invite sub-flows handled within same screen via VIEWS state machine. |

## Mutation Surface Map

| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| acceptQrJoin | join/controllers/joinBarbershopQr.controller.js | UPDATE (resource slot link) | YES — assertActorOwnsVportActorController + DAL conditional guard + controller-layer state recheck | MEDIUM |
| createBarberVportAndAcceptQr | join/controllers/joinBarbershopQr.controller.js | INSERT (VPORT) + UPDATE (resource slot link) | YES — assertActorOwnsVportActorController added; callerActorId null-guarded. ELEK-024 RESOLVED in current branch | MEDIUM |
| createBarberVportAndAccept | join/controllers/joinBarbershopAccount.controller.js | INSERT (VPORT) + UPDATE (resource slot link) | YES — assertActorOwnsVportActorController added; callerActorId null-guarded. ELEK-025 RESOLVED in current branch | MEDIUM |
| autoResumeInviteOnboarding | join/controllers/joinBarbershopAccount.controller.js | INSERT (identity bootstrap + VPORT + resource slot link) | YES — callerActorId derived from bootstrapJoinOnboardingController; assertActorOwnsVportActorController called; null guard enforced. ELEK-026 RESOLVED in current branch | MEDIUM |
| useExistingBarberVportAndAccept | join/controllers/joinBarbershopAccount.controller.js | UPDATE (resource slot link) | YES — assertActorOwnsVportActorController; callerActorId null-guarded | LOW |
| acceptJoinResourceDAL | join/dal/joinInvite.dal.js | UPDATE (vport.resources) | PARTIAL — atomic state guard at DAL (.eq meta.status + .is member_actor_id null); no DAL-level actor ownership check (VENOM-FINDING-8) | HIGH — RLS is sole DB backstop |
| signUpForInviteDAL | join/dal/joinAuth.dal.js | AUTH WRITE (supabase.auth.signUp) | N/A — delegated to Supabase auth | LOW |

## Security-Sensitive Surface Map

| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| /join/barbershop/:token (entire route) | join/screens/JoinBarbershopScreen.jsx | PUBLIC_ZERO_AUTH | PUBLIC route; all ownership enforcement is at controller layer only. VPORT membership decisions made here with no initial auth gate. |
| acceptJoinResourceDAL | join/dal/joinInvite.dal.js | DB_WRITE | VENOM-FINDING-8 OPEN: no DAL-layer ownership check. DB RLS is sole backstop at DAL. Controller layer enforces ownership before calling DAL. |
| findBarberVportForUserDAL / readBarberVportByOwnerUserIdDAL | join/dal/barberVport.read.dal.js | IDENTITY | Uses profiles.owner_user_id identity surface. VENOM-TEAM-005 OPEN. |
| createBarberVportAndAcceptQr | join/controllers/joinBarbershopQr.controller.js | OWNERSHIP | ELEK-024 RESOLVED — assertActorOwnsVportActorController present in current branch source |
| createBarberVportAndAccept | join/controllers/joinBarbershopAccount.controller.js | OWNERSHIP | ELEK-025 RESOLVED — assertActorOwnsVportActorController present in current branch source |
| autoResumeInviteOnboarding | join/controllers/joinBarbershopAccount.controller.js | OWNERSHIP | ELEK-026 RESOLVED — callerActorId derived and asserted in current branch source |
| fetchJoinResourceByIdDAL | join/dal/joinInvite.dal.js | DB_READ | ELEK-027 RESOLVED — .eq("resource_type", "staff") filter present in current branch source |
| acceptQrJoin — expiry check | join/controllers/joinBarbershopQr.controller.js | EXPIRY | ELEK-028 OPEN (LOW) — expiry checked in acceptQrJoin but not in createBarberVportAndAcceptQr before VPORT insert |
| legal_documents constraint | DB | DB_SCHEMA | age_verification excluded from legal_documents_document_type_check constraint — pre-production deployment blocker. CARNAGE required. |

## CURRENT Governance Files

| File | Status | Notes |
|---|---|---|
| DR_STRANGE.md | EXISTS | 2026-06-02; THOR_BLOCKED; coverage 0% (pre-ARCHITECT) |
| ARCHITECTURE.md | EXISTS | Updated 2026-06-02 by this ARCHITECT run |
| CURRENT_STATUS.md | EXISTS | Status as of 2026-06-02 |
| SECURITY.md | EXISTS | Stub — full VENOM pass not run |
| findings.md | EXISTS | ELEKTRA findings history |
| ownership.md | EXISTS | Stub — IRONMAN not run |
| performance.md | EXISTS | Stub — KRAVEN not run |
| triad.md | EXISTS | Triad reference |
| README.md | EXISTS | |

## Open Security Findings Summary

| Finding | Severity | Status | Notes |
|---|---|---|---|
| ELEK-2026-05-28-024 | HIGH | RESOLVED in current branch | createBarberVportAndAcceptQr now has assertActorOwnsVportActorController |
| ELEK-2026-05-28-025 | HIGH | RESOLVED in current branch | createBarberVportAndAccept now has assertActorOwnsVportActorController |
| ELEK-2026-05-28-026 | MEDIUM | RESOLVED in current branch | autoResumeInviteOnboarding callerActorId derived and asserted |
| ELEK-2026-05-28-027 | MEDIUM | RESOLVED in current branch | fetchJoinResourceByIdDAL now filters resource_type = 'staff' |
| ELEK-2026-05-28-028 | LOW | OPEN | createBarberVportAndAcceptQr missing expiry recheck before VPORT insert |
| VENOM-FINDING-8 | HIGH | OPEN | acceptJoinResourceDAL no DAL-layer ownership gate; controller-only enforcement |
| VENOM-TEAM-005 | MEDIUM | OPEN | barberVport.read.dal.js uses banned owner_user_id identity surface |
| Legal constraint blocker | BLOCKER | OPEN | age_verification excluded from DB constraint; CARNAGE required |

## Runtime Risk Summary

Join is a PUBLIC route feature where VPORT membership decisions are made without an initial auth gate. The highest-severity controller-level ownership gaps (ELEK-024/025/026) and the IDOR finding (ELEK-027) are resolved in the current branch (`vport-booking-feed-security-updates`). The remaining open HIGH finding is VENOM-FINDING-8 — the DAL-layer has no ownership check; controller enforcement is the sole application-level gate above DB RLS. DB RLS has not been audited. THOR remains blocked until a full VENOM/ELEKTRA module-level pass confirms all findings, the DB RLS is audited, and the age verification constraint migration is resolved by CARNAGE.

## Recommended Next Command

VENOM — full module-level pass to confirm ELEK-024/025/026/027 resolution, audit VENOM-FINDING-8, and verify VENOM-TEAM-005. Required before THOR gate clearance.

## Recommended Next Ticket

TICKET-JOIN-SECURITY-001 — confirm all ELEK resolutions via full module VENOM pass; audit DB RLS on vport.resources; assign CARNAGE for age verification constraint migration; run SPIDER-MAN for joinBarbershopAccount.controller.js coverage.
