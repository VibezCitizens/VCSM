# VENOM + ROBIN — BARBERSHOP VPORT Profile Audit

**Date:** 2026-05-10
**Application Scope:** VCSM
**VPORT Type:** `barbershop`
**Tab Preset:** `VPORT_BARBERSHOP_TABS`
**Tab Order:** `portfolio → book → team → services → reviews → about → photos → vibes → content → subscribers`
**Supabase Schema:** `vport.*`, `reviews.*`, `platform.media_assets`, `vc.actors`, `vc.posts`
**Review Dimensions:** Service, Results, Cleanliness, Professionalism, Value

---

## VENOM TARGET

```
Feature / Route / Engine: VPORT Profile — Barbershop type
Application Scope: VCSM
Reason for review: Public profile security surface + write-path ownership verification + native parity gaps
Primary trust boundary: Actor owner via actor_owners; public read vs authenticated write
```

---

## SECURITY SURFACE

```
Entry point: /profile/:slug (public), /actor/:actorId/dashboard/* (owner)
Auth source: Supabase session → useIdentity() → actorId + kind
Authorization layer: Controller (app-level) + RLS (DB-level)
Identity surface: actorId (correct), kind = 'vport'
Sensitive objects: vport.profiles, vport.profile_public_details, vc.posts (system posts), vport.resources (team/staff), vport.bookings
```

---

## TRUST BOUNDARY TRACE

```
Client input: route slug → resolved to actorId via vport.profiles
Validated at: Controller (slug → actorId), hook (isOwner flag)
Identity resolved at: useVportProfileBySlug → getVportPublicDetailsController
Authorization enforced at: Individual write controllers (app-level); RLS (DB-level)
Data returned to: View Screen → Components (read-only for visitors, editable for owner)
```

---

## SECURITY RISK FINDINGS

---

### VENOM SECURITY FINDING — VB-01

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/publishBarbershopPortfolioUpdateAsPost.controller.js`
- **Application Scope:** VCSM
- **Current behavior:** `publishBarbershopPortfolioUpdateAsPostController({ actorId, portfolioTitle, mediaUrl })` only checks `!actorId` is truthy. It does not verify that the calling session's actor is an owner of the barbershop VPORT via `actor_owners`. Any authenticated actor who passes a valid `actorId` of a barbershop can trigger a system post (`barbershop_portfolio_update`) published to the public feed under that barbershop's identity.
- **Risk:** An authenticated user who knows a barbershop's `actorId` can post system content to the public feed on behalf of a barbershop they do not own.
- **Severity:** HIGH
- **Why it matters:** System posts appear in the feed attributed to the barbershop actor. Unauthorized system posts contaminate the trust relationship between a barbershop and its followers. The throttle check (`hasRecentBarbershopPortfolioPostDAL`) is per actorId — an attacker can still send one post per throttle window per target.
- **Recommended mitigation:** Add actor ownership check before `createSystemPost`. Verify that the calling session's `identity.actorId` is an owner of `actorId` via `actor_owners` (or use the same `isOwner` gate pattern used in the view screen).
- **Rationale:** The controller currently trusts that the caller is the owner by convention, not by verification. Write-path ownership must be enforced in the controller, not assumed.
- **Follow-up command:** DB (verify RLS on `vc.posts` for `post_type = 'barbershop_portfolio_update'`)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security, Security Architecture and Engineering

---

### VENOM SECURITY FINDING — VB-02

- **Location:** `apps/VCSM/src/features/profiles/dal/vportPublicDetails.read.dal.js:50`
- **Application Scope:** VCSM
- **Current behavior:** The DAL returns `vport_id: newData.id` — the internal UUID from `vport.profiles`. This ID is exposed in the response object passed up through the model and controller to the view screen.
- **Risk:** Violates the identity surface rule. `vportId` must never be exposed on the public surface. Any consuming component that logs, serializes, or passes this to a URL could leak the internal profile UUID.
- **Severity:** MEDIUM
- **Why it matters:** The architecture contract (§1.3) forbids exposing `profileId` or `vportId` through any public hook or controller surface. Leaking `vport.profiles.id` enables DB-level ID correlation and could be used to construct targeted queries against tables without slug-based routing protection.
- **Recommended mitigation:** Remove `vport_id` from the response shape. If the internal profile ID is needed for write operations, keep it internal to the DAL/controller and never return it to the view layer.
- **Rationale:** Identity surface compliance is mandatory per contract.
- **Follow-up command:** review-contract
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Identity and Access Management

---

### VENOM SECURITY FINDING — VB-03

- **Location:** `apps/VCSM/src/features/profiles/dal/vportPublicDetails.read.dal.js:9-12` (select list)
- **Application Scope:** VCSM
- **Current behavior:** `is_deleted` is included in the `vport.profiles` select and returned in the response. The response object includes `is_active` as well. Internal lifecycle flags are part of the public read surface.
- **Risk:** Internal deletion and activation state is exposed to the client. A visitor inspecting network responses can determine whether a VPORT is soft-deleted or inactive.
- **Severity:** LOW
- **Why it matters:** Deleted VPORTs should appear as not-found or gracefully gated, not return a profile with `is_deleted: true`. This also leaks moderation state.
- **Recommended mitigation:** Filter deleted VPORTs at the DAL level (`.eq('is_deleted', false)`). Do not return `is_deleted` in the response. Gate `is_active` to owner-only visibility.
- **Rationale:** Clients should never receive internal state flags for deleted content.
- **Follow-up command:** DB
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Security Operations

---

### VENOM SECURITY FINDING — VB-04

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/getVportPublicDetails.controller.js:6`
- **Application Scope:** VCSM
- **Current behavior:** Cache TTL is 60 seconds with no invalidation trigger on VPORT deactivation, deletion, or block state change. `invalidateVportPublicDetails(actorId)` is exported but only called from write paths.
- **Risk:** A deactivated or blocked barbershop VPORT continues serving cached profile data for up to 60 seconds after the state change.
- **Severity:** LOW
- **Why it matters:** For barbershop (a high-interaction type with booking and team), stale public details could show incorrect hours, availability, or contact information after an owner deactivates the VPORT.
- **Recommended mitigation:** Hook `invalidateVportPublicDetails` into the VPORT deactivation and deletion write paths. Consider reducing TTL to 30 seconds for active VPORTs with booking surfaces.
- **Rationale:** Cache staleness on moderation/deactivation events is a known operational risk.
- **Follow-up command:** BUGSBUNNY
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Security Operations

---

### VENOM SECURITY FINDING — VB-05

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/publishBarbershopHoursUpdateAsPost.controller.js` (by pattern, same risk as VB-01)
- **Application Scope:** VCSM
- **Current behavior:** Hours-update system post controller follows the same pattern as portfolio update — no actor_owners ownership verification.
- **Risk:** Same unauthorized system post risk as VB-01 for hours updates.
- **Severity:** HIGH
- **Why it matters:** Same as VB-01 — any actor can trigger a barbershop system post without being an owner.
- **Recommended mitigation:** Apply the same actor_owners ownership check recommendation as VB-01 to all barbershop "publish as post" controllers.
- **Rationale:** Consistent write-path ownership is required across all publish controllers.
- **Follow-up command:** DB
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

---

## MITIGATION PLAN

| Risk | Layer to Fix | Priority |
|---|---|---|
| VB-01/VB-05: Missing actor_owners check in publish controllers | Controller | HIGH — fix before next release |
| VB-02: `vport_id` exposed in public response | DAL / Model | MEDIUM — remove before any native serialization |
| VB-03: `is_deleted` in public read | DAL | LOW — add `.eq('is_deleted', false)` filter |
| VB-04: No cache invalidation on deactivation | Controller | LOW — wire invalidation to deactivation path |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 0 | No policy or governance gaps found |
| Asset Security | 2 | VB-02 (vport_id exposure), VB-03 (is_deleted exposure) |
| Security Architecture and Engineering | 1 | VB-04 (cache staleness) |
| Communication and Network Security | 0 | Public read surface appropriate for barbershop type |
| Identity and Access Management | 2 | VB-01, VB-05 (missing actor_owners check) |
| Security Assessment and Testing | 0 | No test coverage gaps identified in scope |
| Security Operations | 1 | VB-04 (operational staleness risk) |
| Software Development Security | 2 | VB-01, VB-05 (unsafe publish pattern) |

**CISSP uncovered domains:**
- Security Assessment and Testing: No test-coverage audit performed — this was out of scope for this VPORT type review.

---

## ROBIN — NATIVE TRANSFER ANALYSIS

### Module Reference
`native-transfer/modules/public-vport-profile.md` | Status: **Partial**

### PWA Source Files (Barbershop-specific)
- `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx` — main profile shell
- `apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/publishBarbershopPortfolioUpdateAsPost.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/publishBarbershopHoursUpdateAsPost.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportBarberShopBookingView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportBarberShopTeamView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportBarberShopOwnerBand.jsx`

### Native Files (Barbershop-relevant)
- `VCSMNativeApp/Features/Profile/Screens/VPortMenuEditorScreen.swift` ← services/menu editing (owner)
- `VCSMNativeApp/Features/Profile/Screens/VPortServicesEditorScreen.swift`
- `VCSMNativeApp/Features/Profile/Screens/VPortRatesEditorScreen.swift` (N/A for barbershop)
- `VCSMNativeApp/Features/Booking/Screens/VPortBookingScreen.swift`
- `VCSMNativeApp/Features/Booking/Screens/VPortBookingViewScreen.swift`
- `VCSMNativeApp/Features/Profile/Components/VPortBookingTabSection.swift`

### Tab Set — Barbershop Native Parity

| Tab | PWA | Native | Status |
|---|---|---|---|
| portfolio | ✓ | ✓ | Parity |
| book | ✓ (multi-lane barbershop calendar) | ✓ (VPortBookingViewScreen) | **Verify barbershop vs standard booking variant** |
| team | ✓ (PWA flag: true) | Not present | **GAP — P1** |
| services | ✓ | ✓ | Parity |
| reviews | ✓ | ✓ | Parity |
| about | ✓ | ✓ | Parity |
| photos | ✓ | ✓ | Parity |
| vibes | ✓ | ✓ | Parity |
| content | ✓ | Not confirmed | **Verify P2** |
| subscribers | ✓ | ✓ | Parity |

### Native Gaps — Barbershop

1. **P1 — Book tab: barbershop booking variant unverified.** The PWA renders `VportBarberShopBookingView` (multi-lane staff calendar with one lane per staff/resource) for barbershop type, which is different from the standard single-service `VportPublicBookingFlow`. Native `VPortBookingViewScreen.swift` must confirm it renders the barbershop-specific multi-lane calendar for this type, not the standard booking flow.

2. **P1 — Team tab missing.** `VportBarberShopTeamView` renders connected staff members (linked via `vport.resources`). No confirmed native equivalent. The team tab is present in `VPORT_BARBERSHOP_TABS` and the PWA tab flag is currently `true`. Native must implement or disable this tab with an explicit gate before launch.

3. **P1 — Owner band missing.** `VportBarberShopOwnerBand.jsx` renders an action band above the tab bar for barbershop owners (quick actions: add barber, view calendar, etc.). No confirmed native equivalent in `VPortOwnerSection.swift` or `ProfileTabDetailSections.swift`.

4. **P2 — Content tab unverified.** Custom content pages (`VportContentPublicView` / `VportContentManageView`) present in barbershop preset but native rendering of this tab is not confirmed in transfer logs.

5. **P2 — Publish system post (portfolio/hours) write path.** PWA owner can publish barbershop system posts (portfolio updates, hours changes). No confirmed native controller for this. May be out of scope for launch.

### RLS/Schema Watch — Barbershop

- `vport.resources` (staff type, meta.status=linked): team tab data source — verify RLS allows public read for team listings
- `vport.bookings` / `vport.availability_rules`: booking calendar data — confirmed migrated from `vc.booking_*`
- `vc.posts` with `post_type = 'barbershop_portfolio_update'` / `'barbershop_hours_update'`: system post write — RLS must enforce actor ownership

### Priority Classification

| Gap | Priority | Blocking? |
|---|---|---|
| Book tab barbershop variant verification | P1 | Yes — booking is primary barbershop revenue action |
| Team tab native implementation | P1 | No — tab present but not launch-critical if gated |
| Owner band | P1 | No — dashboard link available via owner tab |
| Content tab verification | P2 | No |
| Publish system post write path | P2 | No |

---

*VENOM is read-only. No code was modified. All findings are recommendations only.*
*Robin analysis is planning-only. No native code was changed.*
