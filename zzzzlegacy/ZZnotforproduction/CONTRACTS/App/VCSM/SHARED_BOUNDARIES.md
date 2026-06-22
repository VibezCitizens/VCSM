# VCSM Shared Boundaries Contract

**Version:** 1.0  
**Generated:** 2026-06-06  
**Source:** Architecture contract §3, BIDIR_DEPENDENCY_DECISION.md, FEATURES_ARCHITECTURE_REVIEW.md  
**Purpose:** Define what belongs in `shared/` and `app/setup/`. Nothing in these locations may contain feature-level business logic.

---

## The Boundary Rule

The shared layer exists for **domain-neutral reuse**. A file belongs in `shared/` when:
- More than one feature imports it
- It has no feature-level business rules
- It could be copy-pasted to a different app without modification

A file does NOT belong in `shared/` when:
- It contains VCSM-specific domain language
- It calls a Supabase table by name
- It references actor IDs, vport types, or booking states
- It owns business meaning

---

## Current Shared Layer (`apps/VCSM/src/shared/`)

### `shared/types/`

**Purpose:** TypeScript or JSDoc type definitions shared across features.

**May contain:**
- Base entity shapes (raw rows or generic shapes)
- Generic enum-like constants shared by 2+ features
- Utility type aliases

**Must not contain:**
- Feature-owned types (booking states, vport type codes, actor role enums)
- Types that import feature-level logic

**Pending additions from remediation:**
- `TODO: bookingCalendarDate type` — if moved out of `booking/model/` as part of profiles→booking violation remediation
- `TODO: bookingCalendarAvailability type` — same

---

### `shared/components/`

**Purpose:** Domain-neutral, purely presentational UI primitives.

**Allowed examples:**
- `Button`, `Input`, `Modal`, `Card`, `Avatar`, `Tabs`, `Spinner`, `Badge`, `Chip`
- `BottomSheet`, `Skeleton`, `EmptyState`, `ErrorBoundary`

**Forbidden examples (must live in their owning feature):**
- `MessageComposer.jsx` — belongs in `chat/`
- `PostCard.jsx` — belongs in `post/`
- `ExploreFeed.jsx` — belongs in `explore/`
- `NotificationItem.jsx` — belongs in `notifications/`
- Any component with a domain noun in its name

**Validation rule:** If removing the component from `shared/components/` would require changing a feature's business logic, it does not belong in shared.

---

### `shared/hooks/`

**Purpose:** Generic React hooks with no domain knowledge.

**Allowed examples:**
- `useDebounce`, `usePrevious`, `useLocalStorage`, `useMediaQuery`, `useWindowSize`
- `useBreakpoint`, `useFocusTrap`, `useOnClickOutside`

**Forbidden examples:**
- `useAuthSession` — belongs in `auth/`
- `useActorIdentity` — belongs in `identity/`
- `useFeedPagination` — belongs in `feed/`
- Any hook that calls a controller, DAL, or Supabase

---

### `shared/lib/`

**Purpose:** Generic utility functions and infrastructure-agnostic helpers.

**Allowed examples:**
- `formatDate`, `parseDate`, `formatCurrency`, `truncateText`
- `deepMerge`, `slugify`, `debounce`, `throttle`
- `funnelSource.js` — pending move from `features/analytics/` via ARCH-ANALYTICS-001

**Pending additions from remediation:**

| File | Current Location | Move Reason | Ticket |
|---|---|---|---|
| `funnelSource.js` | `features/analytics/funnelSource.js` | 1-file feature not a feature; generic tracking utility | ARCH-ANALYTICS-001 |
| `businessCardSettings.model.js` | `features/public/vportBusinessCard/model/` | Pure config model consumed by 3 features | ARCH-BIDIR-MODEL-001 |

**Destination for businessCard model:**
`shared/lib/businessCard/businessCardSettings.model.js`

---

### `shared/styles/`

**Purpose:** Shared CSS custom property sheets and design token files consumed by 2+ features.

**Current state:** Underutilized. Feature-scoped stylesheets are bleeding into other features.

**Pending additions from remediation:**

| File | Current Location | Move Reason | Ticket |
|---|---|---|---|
| `settings-modern.css` | `features/settings/styles/settings-modern.css` | Imported by ads and dashboard — not settings-only | ARCH-BIDIR-CSS-001 |
| `profiles-modern.css` | `features/profiles/styles/profiles-modern.css` | Imported by notifications and post — not profiles-only | ARCH-BIDIR-CSS-001 |

**After move:**
- `shared/styles/settings-modern.css`
- `shared/styles/profiles-modern.css`

**Import sites to update (ARCH-BIDIR-CSS-001):**
- `ads/screens/VportAdsSettingsScreen.jsx` → `@/shared/styles/settings-modern.css`
- `dashboard/vport/dashboard/cards/settings/VportSettingsScreen.jsx` → `@/shared/styles/settings-modern.css`
- `notifications/screen/views/NotificationsScreenView.jsx` → `@/shared/styles/profiles-modern.css`
- `post/postcard/ui/EditPost.jsx` → `@/shared/styles/profiles-modern.css`
- `post/screens/PostDetail.view.jsx` → `@/shared/styles/profiles-modern.css`

---

### `shared/config/`

**Purpose:** App-wide configuration constants with no domain logic.

**Allowed examples:**
- Environment variable accessors
- API base URLs
- Feature flag constants (when feature-flag values are not domain-specific)

**Must not contain:**
- Supabase schema names
- Feature-owned configuration (vport type codes, booking state machine values)

---

## `app/` Layer Boundaries

The `app/` directory (`apps/VCSM/src/app/`) contains application-level concerns, not feature logic.

### `app/providers/`

**Purpose:** React context providers wrapping the entire app.

**Allowed:**
- `AuthProvider` — session state
- `IdentityProvider` — resolved actor identity
- Theme provider, navigation container

**Must not contain:**
- Feature-specific state (feed state, chat inbox state)
- Business logic (controller calls, DAL calls)

---

### `app/setup/`

**Purpose (planned — ARCH-ENGINESETUP-001):** Engine initialization functions called at app startup.

**Planned contents (pending migration):**
```
app/setup/
  identity.setup.js    ← from features/identity/setup.js
  hydration.setup.js   ← from features/hydration/setup.js
  chat.setup.js        ← from features/chat/setup.js
  reviews.setup.js     ← from features/reviews/setup.js
  portfolio.setup.js   ← from features/portfolio/setup.js
  notifications.setup.js ← from features/notifications/setup.js
  booking.setup.js     ← from features/booking/setup.js
  media.setup.js       ← from features/media/setup.js
  index.js             ← optional barrel calling all 8 in order
```

**Must not contain:**
- Feature-level business logic (only engine initialization and DI wiring)
- UI components
- Supabase queries (only DI injection of client + adapters)

---

### `app/routes/`

**Purpose:** Route tree — maps URL paths to Final Screen components.

**May contain:**
- Route definitions
- Lazy import wrappers
- Route guards (auth required, actor required)

**Must not contain:**
- Feature business logic
- DAL calls
- Controller calls

---

### `app/guards/`

**Purpose:** Cross-cutting route guards applied at the routing layer.

**Must not contain:**
- DAL calls
- Feature-specific controller calls (delegate to feature hook/controller)

---

## What Must Never Go in Shared

These categories are permanently forbidden from the shared layer:

| Category | Reason |
|---|---|
| Supabase client | Every DAL imports supabase — it would create a shared coupling to infrastructure |
| Actor ownership checks | Ownership is a controller concern; it cannot be shared |
| Feature route paths | Routes belong to each feature's screen layer or the app/routes/ tree |
| Engine resolvers | Resolvers are DI wiring — they belong in feature `setup.js` or `app/setup/` |
| Notification dispatch functions | Notifications are a feature; `publishVcsmNotification` stays in `notifications/adapters/` |
| Feed invalidation keys | Cache invalidation belongs in `feed/adapters/feedCache.adapter` |

---

## Shared Layer Health Check

To verify the shared layer is clean, run:

```bash
# Confirm no feature imports from shared
grep -r "@/features/" apps/VCSM/src/shared/

# Confirm no Supabase calls in shared
grep -r "supabase" apps/VCSM/src/shared/

# Confirm no domain nouns in shared/components
ls apps/VCSM/src/shared/components/
```

Expected: zero results for the first two commands. The third confirms component names are generic.
