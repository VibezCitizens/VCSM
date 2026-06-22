# ARCHITECT — System Map
Generated: 2026-06-05
Branch: vport-booking-feed-security-updates
Mode: SECURITY_WARFARE_SIMULATION / BLUE_TEAM
Application Scope: VCSM

---

## Repository Roots

| Root | Status | Notes |
|---|---|---|
| apps/VCSM | IN SCOPE | Primary subject of this run |
| apps/wentrex | OUT OF SCOPE | Separate product — no cross-root reads |
| apps/Traffic | OUT OF SCOPE | Acquisition funnel — no cross-root reads |
| engines/ | IN SCOPE (consumption) | booking, notifications consumed by VCSM |
| shared/ | IN SCOPE (consumption) | UI primitives consumed by VCSM |

---

## VCSM Features in Scope (Modified in Branch)

| Feature Path | Layer | Security Relevance |
|---|---|---|
| dashboard/vport/bookings | DAL + Controller + Test | HIGH — booking insert/update authorization |
| dashboard/vport/gasprices | Controller + Test | HIGH — fuel price ownership enforcement |
| dashboard/vport/calendar | Screen | MEDIUM — uses ownership gate for render |
| dashboard/flyerBuilder/designStudio | Controller (shared) | MEDIUM — design document ownership |
| dev/diagnostics | Groups | LOW — dev-only, not production surface |

---

## Cross-Feature Dependency Graph (Security Path)

```
BOOKING INSERT
  vportPublicBookingController
    → getVportResourceByIdDAL (vportClient)
    → readActorVportLinkDAL (actor kind verification)
    → getVportServiceByIdDAL (service label resolution)
    → insertVportBookingDAL (vportClient — bookings table)
    → publishVcsmNotificationBatch (notifications.adapter)

BOOKING UPDATE
  updateBookingStatusController
    → getVportBookingByIdDAL (read booking)
    → getVportActorIdByProfileIdDAL (resolve VPORT actor)
    → assertActorOwnsVportActorController (booking.adapter → ownership check)
      → getActorByIdDAL (kind verification)
      → readActorOwnerLinkByActorAndUserProfileDAL (actor_owners)
    → updateVportBookingDAL (scoped by bookingId + profileId)
    → publishVcsmNotification (notification dispatch)

FUEL PRICE REVIEW
  reviewFuelPriceSuggestionController
    → fetchFuelPriceSubmissionByIdDAL
    → resolveActorIdFromProfileId
    → checkVportOwnershipController (ownership.adapter)
      → assertActorOwnsVportActorController OR vport-self-shortcut
    → updateFuelPriceSubmissionStatusDAL
    → upsertVportFuelPriceDAL
    → createVportFuelPriceHistoryDAL

OWNERSHIP ASSERTION CORE
  assertActorOwnsVportActorController
    → getActorByIdDAL (UNCONDITIONAL — kind must be "user")
    → readActorOwnerLinkByActorAndUserProfileDAL
    → getActorByIdDAL (target vport actor verification)
```

---

## Trust Boundary Map

| Boundary | Enforcer | Location |
|---|---|---|
| Actor kind gate (user-only write) | assertActorOwnsVportActorController | booking/controller/assertActorOwnsVportActor.controller.js |
| VPORT ownership gate (dashboard visibility) | checkVportOwnershipController | dashboard/vport/controller/checkVportOwnership.controller.js |
| Actor kind gate (booking creation) | vportPublicBooking.controller.js | readActorVportLinkDAL check (kind === "user") |
| Terminal state immutability | updateVportBooking.controller.js | TERMINAL_STATUSES check before auth |
| Customer/owner dispatch | updateVportBooking.controller.js | isCustomer = customer_actor_id match |
| DAL column allowlist | insertVportBookingDAL | WRITE_COLS frozen Object |
| Booking scope lock (profileId) | updateVportBookingDAL | .eq("profile_id", profileId) |
| Design document owner check | designStudio.shared.controller.js | requireDesignDocumentOwnerAccess |
| Fuel key allowlist | gasPrices.model.js + reviewFuelPriceSuggestion | ALLOWED_FUEL_KEYS set |

---

## Schema Clients Used

| Client | Files Using | Schema |
|---|---|---|
| vportSchema (default) | insertVportBookingDAL, updateVportBookingDAL, vportResource, listVportBookingsForProfileDay | vport schema |
| { vport as vportSchema } (named) | vportAvailabilityRules.read.dal.js | vport schema — NAMING DISCREPANCY flagged |

⚠️ DISCREPANCY: vportAvailabilityRules.read.dal.js uses named import `{ vport as vportSchema }` while all other vport DALs use default import `import vportSchema from "@/services/supabase/vportClient"`. Downstream VENOM/ELEKTRA must verify these resolve to the same schema client.
