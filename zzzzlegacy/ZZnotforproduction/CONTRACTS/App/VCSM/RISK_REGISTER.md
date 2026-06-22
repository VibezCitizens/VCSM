# VCSM Feature Risk Register

**Version:** 1.0  
**Generated:** 2026-06-06  
**Source:** FEATURES_ARCHITECTURE_REVIEW.md, FEATURE_IMPORT_MAP.md, BIDIR_DEPENDENCY_DECISION.md, FEATURES_TICKET_PLAN.md  
**Purpose:** Track architectural risks at the feature level. Updated when new tickets are opened or violations are resolved.

---

## Risk Classification

| Level | Meaning |
|---|---|
| CRITICAL | Blocks feature split, causes data integrity risk, or breaks multiple consumers on failure |
| HIGH | Significant coupling or structural problem; requires remediation before major work in the affected area |
| MEDIUM | Boundary violation present; fixable without deep structural changes |
| LOW | Minor naming, CSS, or single-file violation; no behavior risk |
| RESOLVED | Risk was present, ticket executed, validation passed |

---

## Active Risks

---

### RISK-001 — profiles Split Risk

**Feature:** `profiles`  
**Severity:** CRITICAL  
**Status:** OPEN  
**Related Ticket:** ARCH-VPORTPROFILE-001

**Description:**
`profiles/` is a 374-file god feature containing two structurally distinct domains:
1. Actor profile (screen, header, tabs, DAL, controller, friends, photos, tags)
2. Vport-type profile views (122 files in `kinds/vport/` — menu, services, portfolio, rates, barbershop, content, booking)

These two domains have different ownership, different consumers, and different evolution rates. They cannot be separated without resolving two violation clusters first:

**Violation Cluster A (profiles→booking, 10 violations):**
`profiles/kinds/vport/screens/booking/` hooks and views import directly from `booking/model/` (not through booking adapters). Violates `NO_INTERNAL_WITHOUT_ADAPTER`. The booking models at issue are:
- `bookingCalendarDate.model`
- `bookingCalendarAvailability.model`
- `buildBookingPayload.model`
- `bookingCalendar.model`

Fix: Add these models to `booking/adapters/` OR move shared calendar types to `shared/types/`.

**Violation Cluster B (dashboard→profiles, 11 violations):**
Dashboard imports directly into `profiles/kinds/vport/controller/` and `profiles/kinds/vport/dal/`. These imports must be resolved before the extraction — otherwise they become `vportDashboard→vportProfile` violations after the move.

Fix: Expose affected functions via `profiles/adapters/kinds/vport/` (ARCH-BIDIR-PROFILES-001).

**Blocking Condition:** ARCH-DASH-001 gas prices decision must be made before ARCH-VPORTPROFILE-001 plan is finalized.

**Impact if not resolved:** The profiles feature continues to grow unbounded. Every new vport type adds more files to an already 374-file feature. New features cannot import from profiles cleanly — the adapter surface is too large to navigate.

**Resolution path:** ARCH-VPORTPROFILE-001 plan → owner approval → implementation tickets.

---

### RISK-002 — dashboard Split Risk

**Feature:** `dashboard`  
**Severity:** CRITICAL  
**Status:** OPEN  
**Related Ticket:** ARCH-DASH-001

**Description:**
`dashboard/` contains 258 files across three unrelated subsystems:
1. `flyerBuilder/` (31 files) — canvas design studio for poster creation
2. `qrcode/` (9 files) — QR code generation
3. `vport/` (217 files) — owner-facing vport management with 11 card subsystems

The 11 dashboard cards each have their own controller/dal/hooks/model stack. The card for `gasprices/` alone has 47 files.

**Active violations (23 total):**
- 11 × dashboard→profiles internals (DAL + controller direct imports) — ARCH-BIDIR-PROFILES-001
- 7 × profiles adapters wrapping dashboard internals (gas prices) — ARCH-BIDIR-GASPRICES-001 (BLOCKED)
- 3 × dashboard→settings hooks without adapter — ARCH-BIDIR-SETTINGS-001
- 1 × dashboard→public model — ARCH-BIDIR-MODEL-001
- 1 × dashboard→public boundary — already partially tracked

**Gas prices decision (blocked):**
The gas prices subsystem (`dashboard/vport/dashboard/cards/gasprices/`) is simultaneously accessed by `profiles/adapters/kinds/vport/hooks/gas/` — creating a circular dependency that requires an ownership decision before either feature can be cleanly split.

Options:
- A: Gas prices becomes standalone `vportGasPrices/` feature
- B: Dashboard exposes gas prices via `dashboard/vport/adapters/` and profiles re-exports from dashboard adapters

**Impact if not resolved:** Dashboard cannot be split cleanly. New vport dashboard cards continue to pile into a monolithic feature directory. The 11-card structure makes it impossible to reason about what dashboard "owns."

**Resolution path:** ARCH-DASH-001 plan → violation strategy approval → ARCH-BIDIR-PROFILES-001 implementation → gas prices decision → ARCH-DASH-001 implementation.

---

### RISK-003 — postModules Extraction Risk

**Feature:** `post`  
**Severity:** HIGH  
**Status:** OPEN  
**Related Ticket:** ARCH-POSTMOD-001

**Description:**
`post/postcard/ui/PostCard.view.jsx` is a generic post renderer but statically imports 8 vport-type-specific modules:
- `barbershopHours`, `barbershopPortfolio`, `exchangeRates`, `fuelPrices`
- `locksmithHours`, `locksmithPortfolio`, `locksmithServiceArea`, `menuDrop`

Every new vport type that has a post format requires a new static import here — an open/closed violation. The modules live in `post/postcard/postModules/`.

**Impact:** PostCard.view.jsx grows with every new vport type. Any breakage in any module file breaks the entire central feed rendering path.

**Risk level:** HIGH — PostCard.view.jsx is in the central feed rendering path. Any change to it affects the primary user experience.

**Resolution path:** ARCH-POSTMOD-001 plan → owner approval → implementation tickets (one module at a time, starting with simplest).

---

### RISK-004 — social/feed/notifications Coupling

**Features:** `social`, `feed`, `notifications`  
**Severity:** LOW (currently managed by adapters)  
**Status:** MONITORED

**Description:**
These three features form a legitimate three-way coupling cluster:
- `social` → `feed` (cache invalidation on follow/unfollow)
- `feed` → `social` (follow buttons in feed actions)
- `social` → `notifications` (follow events fire notifications)
- `notifications` → `social` (follow request items have action buttons)

All currently through adapter boundaries — classified LEGITIMATE. The risk is that any future direct import (bypassing adapter) in this cluster would create a cycle that's hard to untangle.

**Monitoring rule:** Any new import between these three features must be reviewed against adapter boundaries before merging.

**Current status:** CLEAN — all adapter-compliant.

---

### RISK-005 — settings Fan-Out

**Feature:** `settings`  
**Severity:** MEDIUM  
**Status:** OPEN  
**Related Tickets:** ARCH-BIDIR-CSS-001, ARCH-BIDIR-SETTINGS-001, ARCH-BIDIR-SOCIAL-001

**Description:**
`settings/` has 30 outbound imports across many features (media, identity, auth, upload, vport, social, public, ads, notifications, dashboard, profiles). This fan-out means settings is a high-coupling surface — changes to settings adapters can affect many consumers.

**Active violations in settings (5 total):**
1. `settings/controller/vportSocialSettings.controller.js` → `social/privacy/dal/actorSocialSettings.dal` (DAL-VIOLATION)
2. `settings/controller/vportSocialSettings.controller.js` → `social/privacy/dal/actorSocialPublicPolicy.dal` (DAL-VIOLATION)
3. `settings/vports/hooks/useVportBusinessCardSettings.js` → `public/vportBusinessCard/model/businessCardSettings.model` (SHARED-MODEL-LEAK)

Note: 3 settings violations appear in dashboard→settings direction (dashboard importing settings hooks without adapter).

**Risk:** Settings is imported by 16 features (inbound count). Violations in settings propagate to all consumers.

**Resolution:** ARCH-BIDIR-SETTINGS-001 (expose 3 hooks via settings adapter) + ARCH-BIDIR-SOCIAL-001 (add social adapter for DAL) + ARCH-BIDIR-MODEL-001 (move model to shared).

---

### RISK-006 — chat Realtime Risk

**Feature:** `chat`  
**Severity:** MEDIUM  
**Status:** MONITORED

**Description:**
Chat has 28 outbound imports (highest single-feature count after profiles and dashboard) and uses realtime subscriptions. Key risks:
- Mixed engine consumption: both `@identity` alias (16x) and `@/features/identity/` (8x). Not standardized.
- `ChatInput.jsx`, `MessageBubble.jsx`, `ConversationView.jsx` are all >200 lines — large component complexity.
- `start/` folder exists at both `adapters/start/` and top-level `start/` — structural duplication.
- Empty `styles/` folder (structural noise — ARCH-CLEAN-001).

**Risk:** Realtime subscriptions in chat mean that any import cycle through chat can cause subscription loops or stale state.

**Current violations:** NONE — scanner shows 0 violations for chat.

**Resolution:** No immediate action required. Address naming and engine alias standardization in ARCH-NAMING-001.

---

### RISK-007 — booking State Machine Risk

**Feature:** `booking`  
**Severity:** MEDIUM  
**Status:** OPEN  
**Related Ticket:** TICKET-BOOKING-RPC-001

**Description:**
Booking is the most-consumed feature (68 inbound imports). The booking state machine (create/confirm/cancel) has a confirmed security issue:
- `customer_actor_id` injection vulnerability
- Status overpermission on live DB (broad INSERT/UPDATE not replaced with typed state-machine RPCs)

Booking UI does not live inside `features/booking/` — it lives in `profiles/kinds/vport/screens/booking/` and `wanderex/`. This split between state machine and UI is intentional but requires that the consuming features always use booking through adapters.

**Active violations:** 0 scanner violations for booking itself. Violations are in `profiles→booking` direction (10 violations in profiles importing booking models directly).

**Risk:** The booking engine is the highest-inbound-count feature. Any changes to its adapter surface cascade to 68 import sites.

**Resolution:** TICKET-BOOKING-RPC-001 (typed state-machine RPCs). Profiles→booking model violations: ARCH-BIDIR-MODEL-001.

---

### RISK-008 — DAL Ownership Mistakes

**Features:** Multiple  
**Severity:** HIGH  
**Status:** PARTIALLY OPEN

**Description:**
The layer contract prohibits DAL files from making ownership decisions. Three categories of DAL misuse were found:

**Category A — DAL-to-DAL cross-feature imports (dashboard→profiles):**
Dashboard gas price DAL files call `resolveVportProfileId.dal` from profiles directly. This means a DAL file (dashboard) calls another feature's DAL to resolve a profile ID before its own DB write.

Layer contract violation: DAL may execute, but it must not cross feature boundaries to call another DAL. Ownership/scoping decisions must come from the controller.

**Fix:** Expose `resolveVportProfileId` via profiles adapter. Dashboard DAL imports from adapter, not from profiles DAL.

**Ticket:** ARCH-BIDIR-PROFILES-001

**Category B — Controller-to-DAL cross-feature (profiles→social):**
`getSubscribers.controller.js` in profiles calls `actorSignalVisibility.dal` in social directly. A controller calling another feature's DAL — skipping the adapter boundary.

**Fix:** Add social adapter for `actorSignalVisibility`. Profiles controller imports from adapter.

**Ticket:** ARCH-BIDIR-SOCIAL-001

**Category C — Controller-to-DAL cross-feature (settings→social):**
`vportSocialSettings.controller.js` in settings calls `actorSocialSettings.dal` and `actorSocialPublicPolicy.dal` from social directly.

**Fix:** Social adapter additions (same ticket as above).

**Ticket:** ARCH-BIDIR-SOCIAL-001

---

### RISK-009 — wanders Violation Risk

**Feature:** `wanders`  
**Severity:** MEDIUM  
**Status:** OPEN

**Description:**
`wanders/` has 2 boundary violations (both `wanders→public` direction):
- `wanders/hooks/useWandersBusinessCardOps.js` → `public/vportBusinessCard/controller/vportBusinessCard.controller` (ADAPTER-MISSING)
- `wanders/hooks/useWandersBusinessCardOps.js` → `public/vportBusinessCard/model/businessCardSettings.model` (SHARED-MODEL-LEAK)

The model violation resolves automatically when ARCH-BIDIR-MODEL-001 moves `businessCardSettings.model` to shared.

The controller violation requires exposing `vportBusinessCard.controller` via `public/adapters/`.

**Risk:** Wanders is a 124-file feature (split candidate). Before any split, these violations must be resolved.

**Resolution:** Open a ticket for `public` to expose `vportBusinessCard.controller` via adapter. Model violation resolves via ARCH-BIDIR-MODEL-001.

---

## Resolved Risks

No risks are marked RESOLVED yet. This section will be updated as tickets close and scanner validates the fixes.

---

## Risk Summary Table

| Risk | Feature(s) | Severity | Status | Blocking |
|---|---|---|---|---|
| RISK-001 | profiles | CRITICAL | OPEN | ARCH-VPORTPROFILE-001 |
| RISK-002 | dashboard | CRITICAL | OPEN | ARCH-DASH-001 |
| RISK-003 | post | HIGH | OPEN | ARCH-POSTMOD-001 |
| RISK-004 | social/feed/notifications | LOW | MONITORED | — |
| RISK-005 | settings | MEDIUM | OPEN | ARCH-BIDIR-CSS-001, ARCH-BIDIR-SETTINGS-001, ARCH-BIDIR-SOCIAL-001 |
| RISK-006 | chat | MEDIUM | MONITORED | — |
| RISK-007 | booking | MEDIUM | OPEN | TICKET-BOOKING-RPC-001 |
| RISK-008 | dashboard, profiles, settings | HIGH | PARTIALLY OPEN | ARCH-BIDIR-PROFILES-001, ARCH-BIDIR-SOCIAL-001 |
| RISK-009 | wanders | MEDIUM | OPEN | Open ticket for public adapter |
