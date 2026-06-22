# VENOM Security Report — 2026-06-08

## VENOM TARGET

| Field | Value |
|---|---|
| Scope | apps/VCSM/src — all features, state, shared, learning |
| Primary Trust Boundary | Authenticated Citizen → VPORT Owner |
| Files Scanned | 2138 |
| DAL Files | 300 |
| Source Files (non-test) | 2089 |
| Report Date | 2026-06-08 |

## SECURITY SURFACE

| Surface | Findings | CRITICAL | HIGH | MEDIUM | LOW |
|---|---|---|---|---|---|
| Authentication | 14 | 0 | 14 | 0 | 0 |
| Identity Surface Compliance | 37 | 0 | 37 | 0 | 0 |
| API and Route Exposure | 10 | 0 | 0 | 10 | 0 |
| Sensitive Data Exposure | 1 | 0 | 1 | 0 | 0 |
| Debug and Dev Leakage | 44 | 0 | 0 | 23 | 21 |
| Database Policy Assumptions | 33 | 0 | 0 | 33 | 0 |

## TRUST BOUNDARY TRACE

`Client Input → Validated at Controller → Identity resolved via useIdentity()/session → Authorization enforced via actor_owners → Data returned via DAL explicit columns`

**Violations detected in this pass:** authentication resolved in DAL (bypasses controller gate), identity sourced from local state (bypasses session binding), client-submitted actorId trusted (bypasses ownership check), PII columns returned beyond minimum necessary.

## Summary

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 52 |
| MEDIUM | 66 |
| LOW | 21 |
| **Total** | **139** |

## CISSP Domain Coverage

| Domain | Findings |
|---|---|
| Security and Risk Management | 34 |
| Asset Security | 24 |
| Security Architecture and Engineering | 46 |
| Communication and Network Security | 1 |
| Identity and Access Management | 51 |
| Security Assessment and Testing | 21 |
| Security Operations | 56 |
| Software Development Security | 45 |

## Findings

### Area: Authentication

#### DAL-AUTH-LEAK-1 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/auth/login/dal/login.dal.js` |
| Risk | supabase.auth.getUser() in DAL layer — identity resolved at wrong layer, bypasses controller trust gate |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Software Development Security |
| Exploitability | MEDIUM — authenticated session required; exploits wrong-layer identity resolution |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Move getUser() to Controller/Hook; pass resolved actorId down to DAL as a parameter |

#### DAL-AUTH-LEAK-2 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/auth/shared/dal/authSession.read.dal.js` |
| Risk | supabase.auth.getUser() in DAL layer — identity resolved at wrong layer, bypasses controller trust gate |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Software Development Security |
| Exploitability | MEDIUM — authenticated session required; exploits wrong-layer identity resolution |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Move getUser() to Controller/Hook; pass resolved actorId down to DAL as a parameter |

#### DAL-AUTH-LEAK-3 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/booking/dal/readOwnerLinkByActorAndSession.dal.js` |
| Risk | supabase.auth.getUser() in DAL layer — identity resolved at wrong layer, bypasses controller trust gate |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Software Development Security |
| Exploitability | MEDIUM — authenticated session required; exploits wrong-layer identity resolution |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Move getUser() to Controller/Hook; pass resolved actorId down to DAL as a parameter |

#### DAL-AUTH-LEAK-4 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/flyerBuilder/designStudio/dal/designStudio.auth.dal.js` |
| Risk | supabase.auth.getUser() in DAL layer — identity resolved at wrong layer, bypasses controller trust gate |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Software Development Security |
| Exploitability | MEDIUM — authenticated session required; exploits wrong-layer identity resolution |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Move getUser() to Controller/Hook; pass resolved actorId down to DAL as a parameter |

#### DAL-AUTH-LEAK-5 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/dal/auth.read.dal.js` |
| Risk | supabase.auth.getUser() in DAL layer — identity resolved at wrong layer, bypasses controller trust gate |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Software Development Security |
| Exploitability | MEDIUM — authenticated session required; exploits wrong-layer identity resolution |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Move getUser() to Controller/Hook; pass resolved actorId down to DAL as a parameter |

#### DAL-AUTH-LEAK-6 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/dal/profile.write.dal.js` |
| Risk | supabase.auth.getUser() in DAL layer — identity resolved at wrong layer, bypasses controller trust gate |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Software Development Security |
| Exploitability | MEDIUM — authenticated session required; exploits wrong-layer identity resolution |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Move getUser() to Controller/Hook; pass resolved actorId down to DAL as a parameter |

#### DAL-AUTH-LEAK-7 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/dal/profileMediaAsset.write.dal.js` |
| Risk | supabase.auth.getUser() in DAL layer — identity resolved at wrong layer, bypasses controller trust gate |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Software Development Security |
| Exploitability | MEDIUM — authenticated session required; exploits wrong-layer identity resolution |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Move getUser() to Controller/Hook; pass resolved actorId down to DAL as a parameter |

#### DAL-AUTH-LEAK-8 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/vports/dal/auth.read.dal.js` |
| Risk | supabase.auth.getUser() in DAL layer — identity resolved at wrong layer, bypasses controller trust gate |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Software Development Security |
| Exploitability | MEDIUM — authenticated session required; exploits wrong-layer identity resolution |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Move getUser() to Controller/Hook; pass resolved actorId down to DAL as a parameter |

#### DAL-AUTH-LEAK-9 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/vports/dal/vports.read.dal.js` |
| Risk | supabase.auth.getUser() in DAL layer — identity resolved at wrong layer, bypasses controller trust gate |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Software Development Security |
| Exploitability | MEDIUM — authenticated session required; exploits wrong-layer identity resolution |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Move getUser() to Controller/Hook; pass resolved actorId down to DAL as a parameter |

#### DAL-AUTH-LEAK-10 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/vports/dal/vports.write.dal.js` |
| Risk | supabase.auth.getUser() in DAL layer — identity resolved at wrong layer, bypasses controller trust gate |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Software Development Security |
| Exploitability | MEDIUM — authenticated session required; exploits wrong-layer identity resolution |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Move getUser() to Controller/Hook; pass resolved actorId down to DAL as a parameter |

#### DAL-AUTH-LEAK-11 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/dal/postAuthRollback.dal.js` |
| Risk | supabase.auth.getUser() in DAL layer — identity resolved at wrong layer, bypasses controller trust gate |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Software Development Security |
| Exploitability | MEDIUM — authenticated session required; exploits wrong-layer identity resolution |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Move getUser() to Controller/Hook; pass resolved actorId down to DAL as a parameter |

#### DAL-AUTH-LEAK-12 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vport/dal/vport.core.dal.js` |
| Risk | supabase.auth.getUser() in DAL layer — identity resolved at wrong layer, bypasses controller trust gate |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Software Development Security |
| Exploitability | MEDIUM — authenticated session required; exploits wrong-layer identity resolution |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Move getUser() to Controller/Hook; pass resolved actorId down to DAL as a parameter |

#### DAL-AUTH-LEAK-13 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vport/dal/vport.read.vportRecords.dal.js` |
| Risk | supabase.auth.getUser() in DAL layer — identity resolved at wrong layer, bypasses controller trust gate |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Software Development Security |
| Exploitability | MEDIUM — authenticated session required; exploits wrong-layer identity resolution |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Move getUser() to Controller/Hook; pass resolved actorId down to DAL as a parameter |

#### DAL-AUTH-LEAK-14 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/settings/dal/vportPublicDetails.write.dal.js` |
| Risk | supabase.auth.getUser() in DAL layer — identity resolved at wrong layer, bypasses controller trust gate |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Software Development Security |
| Exploitability | MEDIUM — authenticated session required; exploits wrong-layer identity resolution |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Move getUser() to Controller/Hook; pass resolved actorId down to DAL as a parameter |

### Area: Identity Surface Compliance

#### IDENTITY-SURFACE-1 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/auth/onboarding/dal/actorGetByProfile.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-2 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/booking/dal/readVportServicesByActor.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-3 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/dal/readActorSeoData.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-4 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/dal/readActorType.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-5 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/dal/resolveActorSlug.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-6 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/dal/menu/listVportActorMenuCategories.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-7 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/dal/menu/listVportActorMenuItems.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-8 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/dal/menu/updateVportActorMenuCategory.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-9 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/dal/menu/updateVportActorMenuItem.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-10 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/dal/rates/readVportRatesByActor.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-11 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/dal/readVportActorIdByVportId.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-12 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/dal/services/deleteVportServiceAddon.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-13 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/dal/services/readVportServiceAddonsByActor.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-14 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/dal/services/readVportServicesByActor.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-15 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/dal/services/readVportTypeByActorId.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-16 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/account/dal/account.read.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-17 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/dal/actorIdBySubject.read.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-18 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/dal/vportPublicDetails.read.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-19 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/vports/dal/vports.write.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-20 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dal/read/vportProfileActorAccess.read.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-21 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dal/read/vportResource.read.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-22 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dal/read/vportServices.read.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-23 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dal/write/updateVportBooking.write.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-24 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.read.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-25 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPrices.read.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-26 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPrices.write.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-27 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/gasprices/dal/vportStationPriceSettings.read.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-28 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/portfolio/dal/portfolioMediaRecord.write.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-29 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/team/dal/vportTeam.read.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-30 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/team/dal/vportTeam.write.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-31 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/team/dal/vportTeamInvite.write.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-32 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanderex/dal/wanderexPublicHelpers.read.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-33 — HIGH

| Field | Value |
|---|---|
| Location | `src/state/identity/identity.read.dal.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### IDENTITY-SURFACE-34 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/notifications/inbox/controller/resolveVportOwnerActor.controller.js` |
| Risk | profileId or vportId used as DB filter authority — not canonical VCSM identity surface; not verified against actor_owners |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — profileId/vportId not bound to actor_owners; ownership unverifiable |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Replace with actorId verified against actor_owners; never use profileId/vportId as write authority |

#### ACTOR-STATE-1 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/hooks/menu/useVportActorMenu.js` |
| Risk | Independent actorId state — single source of truth violation; stale identity risk on actor switch |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — stale actorId in local state mismatches current session actor on switch |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Public Identity Surface |
| Layer to Fix | Hook |
| Follow-Up | /ELEKTRA |
| Recommended | Remove local actorId state; derive from useIdentity() exclusively |

#### ACTOR-STATE-2 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/vports/hooks/useResolvedVportId.js` |
| Risk | Independent actorId state — single source of truth violation; stale identity risk on actor switch |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — stale actorId in local state mismatches current session actor on switch |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Public Identity Surface |
| Layer to Fix | Hook |
| Follow-Up | /ELEKTRA |
| Recommended | Remove local actorId state; derive from useIdentity() exclusively |

#### ACTOR-STATE-3 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/social/privacy/hooks/useActorPrivacy.js` |
| Risk | Independent actorId state — single source of truth violation; stale identity risk on actor switch |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — stale actorId in local state mismatches current session actor on switch |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Public Identity Surface |
| Layer to Fix | Hook |
| Follow-Up | /ELEKTRA |
| Recommended | Remove local actorId state; derive from useIdentity() exclusively |

### Area: API and Route Exposure

#### ADAPTER-BOUNDARY-1 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/profiles/hooks/useProfileGate.js` |
| Risk | Cross-feature import bypasses adapter boundary: @/features/block |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Software Development Security |
| Exploitability | LOW — design-time coupling; enables unintended data paths across feature boundaries |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller |
| Follow-Up | /ARCHITECT |
| Recommended | Import only through the feature's *.adapter.js public surface |

#### ADAPTER-BOUNDARY-2 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/citizen/controller/friends/getFriendLists.controller.js` |
| Risk | Cross-feature import bypasses adapter boundary: @/features/block |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Software Development Security |
| Exploitability | LOW — design-time coupling; enables unintended data paths across feature boundaries |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller |
| Follow-Up | /ARCHITECT |
| Recommended | Import only through the feature's *.adapter.js public surface |

#### ADAPTER-BOUNDARY-3 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/citizen/controller/friends/getTopFriendActorIds.controller.js` |
| Risk | Cross-feature import bypasses adapter boundary: @/features/block |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Software Development Security |
| Exploitability | LOW — design-time coupling; enables unintended data paths across feature boundaries |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller |
| Follow-Up | /ARCHITECT |
| Recommended | Import only through the feature's *.adapter.js public surface |

#### ADAPTER-BOUNDARY-4 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/citizen/controller/friends/getTopFriendCandidates.controller.js` |
| Risk | Cross-feature import bypasses adapter boundary: @/features/block |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Software Development Security |
| Exploitability | LOW — design-time coupling; enables unintended data paths across feature boundaries |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller |
| Follow-Up | /ARCHITECT |
| Recommended | Import only through the feature's *.adapter.js public surface |

#### ADAPTER-BOUNDARY-5 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/profiles/screens/views/ActorProfileHeader.jsx` |
| Risk | Cross-feature import bypasses adapter boundary: @/features/block/adapters/ui/ActorActionsMenu |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Software Development Security |
| Exploitability | LOW — design-time coupling; enables unintended data paths across feature boundaries |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller |
| Follow-Up | /ARCHITECT |
| Recommended | Import only through the feature's *.adapter.js public surface |

#### ADAPTER-BOUNDARY-6 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/social/friend/request/controllers/__tests__/followRequests.controller.test.js` |
| Risk | Cross-feature import bypasses adapter boundary: @/features/block |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Software Development Security |
| Exploitability | LOW — design-time coupling; enables unintended data paths across feature boundaries |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller |
| Follow-Up | /ARCHITECT |
| Recommended | Import only through the feature's *.adapter.js public surface |

#### ADAPTER-BOUNDARY-7 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/social/friend/request/controllers/followRequests.controller.js` |
| Risk | Cross-feature import bypasses adapter boundary: @/features/block |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Software Development Security |
| Exploitability | LOW — design-time coupling; enables unintended data paths across feature boundaries |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller |
| Follow-Up | /ARCHITECT |
| Recommended | Import only through the feature's *.adapter.js public surface |

#### ADAPTER-BOUNDARY-8 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/social/friend/subscribe/controllers/__tests__/follow.controller.test.js` |
| Risk | Cross-feature import bypasses adapter boundary: @/features/block |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Software Development Security |
| Exploitability | LOW — design-time coupling; enables unintended data paths across feature boundaries |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller |
| Follow-Up | /ARCHITECT |
| Recommended | Import only through the feature's *.adapter.js public surface |

#### ADAPTER-BOUNDARY-9 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/social/friend/subscribe/controllers/follow.controller.js` |
| Risk | Cross-feature import bypasses adapter boundary: @/features/block |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Software Development Security |
| Exploitability | LOW — design-time coupling; enables unintended data paths across feature boundaries |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller |
| Follow-Up | /ARCHITECT |
| Recommended | Import only through the feature's *.adapter.js public surface |

#### ADAPTER-BOUNDARY-10 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/upload/controllers/createPost.controller.js` |
| Risk | Cross-feature import bypasses adapter boundary: @/features/block |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Software Development Security |
| Exploitability | LOW — design-time coupling; enables unintended data paths across feature boundaries |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller |
| Follow-Up | /ARCHITECT |
| Recommended | Import only through the feature's *.adapter.js public surface |

### Area: Sensitive Data Exposure

#### SENSITIVE-SELECT-1 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/dal/profile.read.dal.js` |
| Risk | PII column (email / phone / password) selected in DAL — may propagate to client state or error logs |
| CISSP Primary | Asset Security |
| CISSP Secondary | Communication and Network Security |
| Exploitability | HIGH — PII columns selected beyond minimum necessary; may reach client state or logs |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Edge Function |
| Identity Leak Type | Private contact |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Public Identity Surface |
| Layer to Fix | DAL |
| Follow-Up | /ELEKTRA |
| Recommended | Restrict column selection to minimum required; keep PII handling in server-only paths |

### Area: Debug and Dev Leakage

#### DEBUG-LEAK-1 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/chat/conversation/hooks/conversation/useConversationMessages.js` |
| Risk | 2 console.log() calls in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-2 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/chat/debug/chatBadgeDebugger.js` |
| Risk | 2 console.log() calls in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-3 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/chat/debug/chatNavDebugger.js` |
| Risk | 6 console.log() calls in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-4 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/chat/inbox/hooks/useChatMessagePrefetch.js` |
| Risk | 3 console.log() calls in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-5 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/initiation/dal/vibeInvites.dal.js` |
| Risk | 1 console.log() call in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-6 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/initiation/hooks/useOnboardingCards.js` |
| Risk | 1 console.log() call in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-7 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/media/controllers/createMediaAsset.controller.js` |
| Risk | 2 console.log() calls in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-8 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/media/dal/mediaAssets.softDelete.dal.js` |
| Risk | 2 console.log() calls in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-9 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/media/dal/mediaAssets.write.dal.js` |
| Risk | 2 console.log() calls in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-10 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/media/dal/resolveAppId.read.dal.js` |
| Risk | 2 console.log() calls in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-11 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuConfirmDeleteModal.jsx` |
| Risk | 1 console.log() call in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-12 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/settings/account/hooks/useAccountController.js` |
| Risk | 3 console.log() calls in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-13 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/controller/recordProfileMediaAsset.controller.js` |
| Risk | 5 console.log() calls in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-14 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/hooks/useProfileUploads.js` |
| Risk | 12 console.log() calls in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-15 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/settings/vports/hooks/useVportsController.js` |
| Risk | 3 console.log() calls in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-16 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/components/calendar/WeeklyAvailabilityGrid.jsx` |
| Risk | 1 console.log() call in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-17 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/wanders/components/WandersCardPreview.jsx` |
| Risk | 7 console.log() calls in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-18 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/wanders/core/controllers/mailbox.controller.js` |
| Risk | 16 console.log() calls in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-19 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/wanders/services/wandersSupabaseClient.js` |
| Risk | 1 console.log() call in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-20 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/services/supabase/supabaseClient.debug.js` |
| Risk | 13 console.log() calls in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-21 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/state/identity/identity.controller.inflight.js` |
| Risk | 1 console.log() call in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-22 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/state/identity/identity.controller.js` |
| Risk | 2 console.log() calls in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### DEBUG-LEAK-23 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/state/identity/queries/identityEngineQuery.js` |
| Risk | 1 console.log() call in production source — leaks internal state to client DevTools |
| CISSP Primary | Security Operations |
| CISSP Secondary | Asset Security |
| Exploitability | MEDIUM — exposes internal state, IDs, or error detail to client DevTools in production |
| Blast Radius | Single actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | UI / Controller |
| Follow-Up | /VENOM |
| Recommended | Remove or gate behind dev-only flag; use captureVcsmError() for error paths |

#### SIZE-1 — LOW

| Field | Value |
|---|---|
| Location | `src/features/chat/conversation/screen/ConversationView.jsx` |
| Risk | File exceeds 300 lines (403) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-2 — LOW

| Field | Value |
|---|---|
| Location | `src/features/legal/docs/PrivacyPolicyContent.jsx` |
| Risk | File exceeds 300 lines (380) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-3 — LOW

| Field | Value |
|---|---|
| Location | `src/features/legal/docs/TermsOfServiceContent.jsx` |
| Risk | File exceeds 300 lines (511) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-4 — LOW

| Field | Value |
|---|---|
| Location | `src/features/legal/screens/AboutView.jsx` |
| Risk | File exceeds 300 lines (477) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-5 — LOW

| Field | Value |
|---|---|
| Location | `src/features/legal/screens/ContactView.jsx` |
| Risk | File exceeds 300 lines (352) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-6 — LOW

| Field | Value |
|---|---|
| Location | `src/features/notifications/runtime/index.js` |
| Risk | File exceeds 300 lines (319) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-7 — LOW

| Field | Value |
|---|---|
| Location | `src/features/notifications/runtime/notificationRuntime.dal.js` |
| Risk | File exceeds 300 lines (350) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-8 — LOW

| Field | Value |
|---|---|
| Location | `src/features/post/postcard/screens/PostDetail.view.jsx` |
| Risk | File exceeds 300 lines (318) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-9 — LOW

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/controller/rates/__tests__/upsertVportRate.controller.test.js` |
| Risk | File exceeds 300 lines (407) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-10 — LOW

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/controller/subscribers/__tests__/getSubscribers.controller.test.js` |
| Risk | File exceeds 300 lines (450) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-11 — LOW

| Field | Value |
|---|---|
| Location | `src/features/public/vportMenu/view/VportPublicMenuView.jsx` |
| Risk | File exceeds 300 lines (302) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-12 — LOW

| Field | Value |
|---|---|
| Location | `src/features/settings/account/ui/AccountTab.view.jsx` |
| Risk | File exceeds 300 lines (334) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-13 — LOW

| Field | Value |
|---|---|
| Location | `src/features/social/friend/request/controllers/__tests__/followRequests.controller.test.js` |
| Risk | File exceeds 300 lines (464) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-14 — LOW

| Field | Value |
|---|---|
| Location | `src/features/social/friend/subscribe/controllers/__tests__/follow.controller.test.js` |
| Risk | File exceeds 300 lines (478) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-15 — LOW

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/bookings/__tests__/vportPublicBooking.controller.test.js` |
| Risk | File exceeds 300 lines (478) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-16 — LOW

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/gasprices/__tests__/submitFuelPriceSuggestion.controller.test.js` |
| Risk | File exceeds 300 lines (528) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-17 — LOW

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/team/__tests__/vportTeamInvite.controller.test.js` |
| Risk | File exceeds 300 lines (363) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-18 — LOW

| Field | Value |
|---|---|
| Location | `src/features/wanders/core/controllers/cards.controller.js` |
| Risk | File exceeds 300 lines (301) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-19 — LOW

| Field | Value |
|---|---|
| Location | `src/learning/screens/administration/LearningOrganizationScreen.jsx` |
| Risk | File exceeds 300 lines (303) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-20 — LOW

| Field | Value |
|---|---|
| Location | `src/state/identity/identity.controller.js` |
| Risk | File exceeds 300 lines (340) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

#### SIZE-21 — LOW

| Field | Value |
|---|---|
| Location | `src/state/identity/useIdentityResolutionEffect.hook.js` |
| Risk | File exceeds 300 lines (306) — decomposition required before adding code; security logic obscured |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Assessment and Testing |
| Exploitability | LOW — indirect: large files obscure security-relevant logic during review |
| Blast Radius | Single actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA |
| Identity Leak Type | None |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Decompose file along layer boundaries |
| Follow-Up | /ARCHITECT |
| Recommended | Split along layer boundaries before any further changes |

### Area: Database Policy Assumptions

#### TTL-CACHE-1 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/booking/controllers/getResourceAvailability.controller.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-2 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/feed/dal/feed.read.actorsBundle.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-3 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/feed/dal/feed.read.blockRows.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-4 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/feed/dal/feed.read.followRows.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-5 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/feed/dal/feed.read.media.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-6 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/legal/controllers/legalConsent.controller.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-7 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/profiles/controller/buildActorCanonicalSlug.controller.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-8 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/profiles/dal/readActorProfile.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-9 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/profiles/dal/readActorSeoData.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-10 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/profiles/dal/readActorType.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-11 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/profiles/dal/resolveActorSlug.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-12 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/profiles/dal/tags/readActorVibeTags.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-13 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/controller/getVportPublicDetails.controller.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-14 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/controller/portfolio/VportPortfolio.controller.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-15 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/controller/services/getVportServices.controller.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-16 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/dal/content/listVportPublicContentPages.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-17 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/dal/rates/readVportRatesByActor.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-18 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/dal/subscribersCount.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-19 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/lib/menuCache.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-20 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/public/vportMenu/dal/readPublicVportReviewDimensions.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-21 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/public/vportMenu/dal/readPublicVportReviewSummary.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-22 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/public/vportMenu/dal/resolveMenuSlug.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-23 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/public/vportMenu/dal/resolveVportSlug.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-24 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/social/friend/request/dal/actorFollows.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-25 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/social/friend/subscribe/dal/subscriberCount.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-26 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/social/privacy/dal/actorSocialPublicPolicy.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-27 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/social/privacy/dal/actorSocialSettings.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-28 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/gasprices/__tests__/vportFuelPriceSubmissions.read.dal.test.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-29 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.read.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-30 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPrices.read.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-31 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/gasprices/dal/vportStationPriceSettings.read.dal.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-32 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/shared/lib/ttlCache.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

#### TTL-CACHE-33 — MEDIUM

| Field | Value |
|---|---|
| Location | `src/shared/lib/vport/resolveVportProfileId.js` |
| Risk | createTTLCache deprecated — bypasses React Query invalidation; stale data persists after block/moderation changes |
| CISSP Primary | Security Architecture and Engineering |
| CISSP Secondary | Security Operations |
| Exploitability | MEDIUM — stale cache may serve blocked/moderated content after state change |
| Blast Radius | Feed-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | UNVERIFIED |
| Platform Surface | PWA / Feed Engine |
| Identity Leak Type | Moderation-state leakage |
| Cache Trust Type | Moderation-sensitive |
| Contract Violated | Feed Publishing |
| Layer to Fix | DAL |
| Follow-Up | /ARCHITECT |
| Recommended | Migrate to React Query (useQuery / useMutation) with appropriate staleTime and invalidation keys |

## Mitigation Plan

| ID | Severity | Layer to Fix | Follow-Up | Contract Violated |
|---|---|---|---|---|
| DAL-AUTH-LEAK-1 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| DAL-AUTH-LEAK-2 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| DAL-AUTH-LEAK-3 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| DAL-AUTH-LEAK-4 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| DAL-AUTH-LEAK-5 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| DAL-AUTH-LEAK-6 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| DAL-AUTH-LEAK-7 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| DAL-AUTH-LEAK-8 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| DAL-AUTH-LEAK-9 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| DAL-AUTH-LEAK-10 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| DAL-AUTH-LEAK-11 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| DAL-AUTH-LEAK-12 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| DAL-AUTH-LEAK-13 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| DAL-AUTH-LEAK-14 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| SENSITIVE-SELECT-1 | HIGH | DAL | /ELEKTRA | Public Identity Surface |
| IDENTITY-SURFACE-1 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-2 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-3 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-4 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-5 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-6 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-7 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-8 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-9 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-10 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-11 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-12 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-13 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-14 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-15 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-16 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-17 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-18 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-19 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-20 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-21 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-22 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-23 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-24 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-25 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-26 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-27 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-28 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-29 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-30 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-31 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-32 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-33 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| IDENTITY-SURFACE-34 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| ACTOR-STATE-1 | HIGH | Hook | /ELEKTRA | Public Identity Surface |
| ACTOR-STATE-2 | HIGH | Hook | /ELEKTRA | Public Identity Surface |
| ACTOR-STATE-3 | HIGH | Hook | /ELEKTRA | Public Identity Surface |

