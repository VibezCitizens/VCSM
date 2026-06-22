# VENOM + ROBIN — BARBER VPORT Profile Audit

**Date:** 2026-05-10
**Application Scope:** VCSM
**VPORT Type:** `barber`
**Tab Preset:** `VPORT_BARBER_TABS`
**Tab Order:** `portfolio → book → services → reviews → content → about → photos → vibes → subscribers`
**Supabase Schema:** `vport.*`, `reviews.*`, `platform.media_assets`, `vc.actors`, `vc.posts`
**Review Dimensions:** Service, Results, Cleanliness, Professionalism, Value
**Service Catalog Key:** `barber` (canonical — `barbershop` aliases to `barber`)

---

## VENOM TARGET

```
Feature / Route / Engine: VPORT Profile — Barber (individual) type
Application Scope: VCSM
Reason for review: Public profile security, booking access surface, owner identity resolution, native parity
Primary trust boundary: Authenticated session → actorId → actor_owners; public booking flow vs owner view
```

---

## SECURITY SURFACE

```
Entry point: /profile/:slug (public), /vport/:slug/card (public card)
Auth source: Supabase session → useIdentity() → actorId + kind
Authorization layer: Controller (app-level) + RLS (DB-level)
Identity surface: actorId (correct), kind = 'vport'
Sensitive objects: vport.profiles, vport.profile_public_details, vport.bookings, vport.resources, vport.availability_rules, platform.media_assets
```

---

## TRUST BOUNDARY TRACE

```
Client input: route slug → actorId via vport.profiles slug resolution
Validated at: useVportProfileBySlug → controller
Identity resolved at: getVportPublicDetailsController (60s cache)
Authorization enforced at: Booking write controllers, services write controllers; RLS at DB
Data returned to: VportProfileViewScreen → tab components (read-only for visitors)
```

---

## SECURITY RISK FINDINGS

---

### VENOM SECURITY FINDING — VBR-01

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/gas/updateStationFuelUnit.controller.js:8`
- **Application Scope:** VCSM
- **Current behavior:** `String(actorId) !== String(targetActorId)` is used as the owner check for fuel unit update. This pattern — comparing the caller's `actorId` to the target's `actorId` — assumes the caller is acting as the VPORT actor. It does not check `actor_owners`. A user-actor who owns a barber VPORT would have `actorId = userActorId` at the session level, while `targetActorId = barberVportActorId`. These would not match, causing valid owner operations to fail while potentially allowing a VPORT actor's identity to be spoofed.
- **Note:** This controller is for gas stations, not barbers. However, the string-comparison ownership pattern is also used in `updateStationFuelUnitController` and represents a systemic pattern risk if replicated elsewhere.
- **Risk:** Ownership check is incorrect for multi-actor ownership model. User actors who own VPORT actors cannot satisfy `actorId === targetActorId` without switching to the VPORT identity.
- **Severity:** MEDIUM
- **Why it matters:** If this pattern is replicated in barber-specific write paths (services, portfolio, booking), user-actor owners of barber VPORTs may be incorrectly denied or incorrectly allowed writes.
- **Recommended mitigation:** All ownership checks must use `actor_owners` lookup, not simple ID string equality. The correct gate is: fetch `actor_owners` where `actor_id = targetActorId` and verify `identity.actorId` appears in the owners list.
- **Rationale:** The actor identity system explicitly documents that "Owner always means Actor Owner — verified through `actor_owners`."
- **Follow-up command:** ARCHITECT (audit all write-path controllers for `actorId === targetActorId` pattern)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

---

### VENOM SECURITY FINDING — VBR-02

- **Location:** `apps/VCSM/src/features/profiles/dal/vportPublicDetails.read.dal.js:50`
- **Application Scope:** VCSM
- **Current behavior:** `vport_id: newData.id` returned in public profile response — internal `vport.profiles.id` UUID exposed to client.
- **Risk:** Identity surface rule violation. `vportId` must not be exposed through public controller surfaces.
- **Severity:** MEDIUM
- **Why it matters:** Same as barbershop finding VB-02 — applies to all VPORT types using this shared DAL.
- **Recommended mitigation:** Remove `vport_id` from the DAL response. Keep internal IDs confined to the DAL layer.
- **Rationale:** Architecture contract §1.3.
- **Follow-up command:** review-contract
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Identity and Access Management

---

### VENOM SECURITY FINDING — VBR-03

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportPublicBookingFlow.jsx` (inferred from tab system)
- **Application Scope:** VCSM
- **Current behavior:** The `book` tab renders `VportPublicBookingFlow` for all non-owner visitors, including unauthenticated users. The flow allows service selection, date selection, and confirmation. Service catalog and availability data are loaded before any auth check.
- **Risk:** Service pricing and availability data (including barber rates, service durations, and calendar slots) are accessible to unauthenticated or non-booking users. A visitor can enumerate a barber's entire service catalog and availability calendar without creating a booking or identifying themselves.
- **Severity:** MEDIUM
- **Why it matters:** For individual barber VPORTs, service pricing is competitive business intelligence. Allowing anonymous enumeration of services and live availability is a business exposure risk, not a platform security exploit, but it could be used for competitive scraping. It also means deleted/inactive service slots are potentially visible if not filtered at the DAL level.
- **Recommended mitigation:** Gate calendar slot reads behind authentication for the confirmation step. Service catalog reads can remain public. Ensure `vport.availability_rules` and `vport.bookings` RLS prevents past or cancelled slot exposure.
- **Rationale:** The booking calendar is a live operational surface — public calendar reads should be limited to available future slots only.
- **Follow-up command:** DB (verify `vport.availability_rules` RLS for public reads)
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Communication and Network Security

---

### VENOM SECURITY FINDING — VBR-04

- **Location:** `apps/VCSM/src/features/profiles/dal/vportPublicDetails.read.dal.js:9` (select list)
- **Application Scope:** VCSM
- **Current behavior:** `is_deleted` returned in public profile fetch. No filter on `is_deleted = false` in the DAL query.
- **Risk:** Deleted barber profiles return data instead of appearing as not-found.
- **Severity:** LOW
- **Why it matters:** Same as barbershop VB-03 — applies to all VPORT types.
- **Recommended mitigation:** Add `.eq('is_deleted', false)` to `vport.profiles` query.
- **Rationale:** Deleted content must not serve data.
- **Follow-up command:** DB
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Security Operations

---

### VENOM SECURITY FINDING — VBR-05

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/config/vportTypes.config.js:122-124`
- **Application Scope:** VCSM
- **Current behavior:** `VPORT_SERVICE_CATALOG_ALIASES = { barbershop: 'barber' }`. This means barbershop VPORTs read and write using the `barber` service catalog key. A barber VPORT and a barbershop VPORT share the same `vport.service_catalog` entries.
- **Risk:** If service catalog RLS scopes writes to `profile_id` (not `category_key`), then a barber and a barbershop with different `profile_id` values correctly have isolated write access. However, if catalog reads are unscoped and share a catalog by `category_key`, then one barber's catalog additions could affect another barber's visible services.
- **Severity:** MEDIUM
- **Why it matters:** Service catalog aliasing is an acceptable pattern for read-only template lookups, but must not result in shared write scope between distinct barber VPORT actors.
- **Recommended mitigation:** Confirm in DB that `vport.service_catalog` writes are scoped by `profile_id` (per-VPORT) and that the `barber` catalog key is used only as a template reference, not a shared live catalog.
- **Rationale:** Two separate barber VPORTs must never share or contaminate each other's service catalog.
- **Follow-up command:** DB
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Asset Security

---

## MITIGATION PLAN

| Risk | Layer to Fix | Priority |
|---|---|---|
| VBR-01: String equality ownership check pattern | Controller (systemic audit) | MEDIUM — audit all write controllers |
| VBR-02: `vport_id` in public response | DAL / Model | MEDIUM |
| VBR-03: Unauthenticated booking calendar reads | DAL + RLS | MEDIUM |
| VBR-04: `is_deleted` not filtered | DAL | LOW |
| VBR-05: Service catalog alias scope | DB (verify RLS) | MEDIUM |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 0 | No governance gaps in scope |
| Asset Security | 3 | VBR-02, VBR-03, VBR-04 |
| Security Architecture and Engineering | 1 | VBR-05 (catalog alias scope) |
| Communication and Network Security | 1 | VBR-03 (public calendar reads) |
| Identity and Access Management | 1 | VBR-01 (string equality ownership pattern) |
| Security Assessment and Testing | 0 | Out of scope for this type review |
| Security Operations | 1 | VBR-04 (is_deleted not filtered) |
| Software Development Security | 1 | VBR-01 (unsafe ownership pattern) |

---

## ROBIN — NATIVE TRANSFER ANALYSIS

### Module Reference
`native-transfer/modules/public-vport-profile.md` | Status: **Partial**

### PWA Source Files (Barber-specific)
- `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx` — main shell
- Tab set resolved via `getVportTabsByType('barber')` → `VPORT_BARBER_TABS`
- `VportPublicBookingFlow.jsx` (visitor booking — 3-step wizard)
- `VportOwnerBookingView.jsx` (owner booking — month/day/agenda)
- `VportPortfolioView.jsx` (portfolio tab)
- `VportServicesView.jsx` (services tab)
- `VportReviewsView.jsx` (reviews tab)

### Native Files (Barber-relevant)
- `VCSMNativeApp/Features/Profile/Screens/ProfileScreen.swift`
- `VCSMNativeApp/Features/Profile/Screens/ProfileViewScreen.swift`
- `VCSMNativeApp/Features/Profile/Components/ProfileTabBar.swift`
- `VCSMNativeApp/Features/Profile/Components/VPortBookingTabSection.swift`
- `VCSMNativeApp/Features/Booking/Screens/VPortBookingScreen.swift`
- `VCSMNativeApp/Features/Booking/Screens/VPortBookingViewScreen.swift`
- `VCSMNativeApp/Features/Profile/Screens/VPortServicesEditorScreen.swift` (owner)
- `VCSMNativeApp/Features/Profile/DAL/ProfileReads.dal.swift`

### Tab Set — Barber Native Parity

| Tab | PWA | Native | Status |
|---|---|---|---|
| portfolio | ✓ | ✓ | Parity |
| book | ✓ (VportPublicBookingFlow / VportOwnerBookingView) | ✓ (VPortBookingViewScreen) | **Verify visitor vs owner variant** |
| services | ✓ | ✓ | Parity |
| reviews | ✓ | ✓ | Parity |
| content | ✓ | Not confirmed | **Verify P2** |
| about | ✓ | ✓ | Parity |
| photos | ✓ | ✓ | Parity |
| vibes | ✓ | ✓ | Parity |
| subscribers | ✓ | ✓ | Parity |

### Native Gaps — Barber

1. **P1 — Book tab: visitor vs owner variant.** For barber type, non-owner visitors see `VportPublicBookingFlow` (3-step wizard: service → date → confirm). Owner sees `VportOwnerBookingView` (calendar management). Native `VPortBookingViewScreen.swift` must correctly branch on `isOwner` to render the appropriate variant. Confirm this branch exists and is tested.

2. **P1 — Book tab: does NOT use barbershop multi-lane calendar.** Barber type uses standard single-service booking, not the barbershop multi-lane calendar. Native must NOT render the barbershop booking variant for the individual barber type. This is a correctness risk if the booking screen branches only on `vport_type == "barbershop"`.

3. **P2 — Content tab unverified.** Content tab is in `VPORT_BARBER_TABS` and the PWA flag is `true`. Native content page rendering not confirmed in transfer logs.

4. **P2 — Service catalog alias awareness.** `barbershop` aliases to `barber` for service catalog reads. Native must not hardcode the `barber` catalog key for barbershop reads separately — it must use the resolved alias. Confirm `ProfileServicesWrites.dal.swift` resolves the correct catalog key.

### RLS/Schema Watch — Barber

- `vport.bookings`: booking writes must be scoped to the authenticated user + target VPORT actor
- `vport.resources` (barber's bookable slots): read as booking surface — verify public read RLS
- `vport.availability_rules`: calendar read for visitor — verify public future-slot-only RLS
- `vport.service_catalog`: read uses `barber` key as template — verify not shared write scope with barbershop VPORTs

### Priority Classification

| Gap | Priority | Blocking? |
|---|---|---|
| Book tab visitor/owner variant verification | P1 | Yes — incorrect variant is a UX and data exposure risk |
| No barbershop multi-lane for barber type | P1 | Yes — correctness |
| Content tab verification | P2 | No |
| Service catalog alias in native | P2 | No |

---

*VENOM is read-only. No code was modified. All findings are recommendations only.*
*Robin analysis is planning-only. No native code was changed.*
