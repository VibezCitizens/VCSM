# VENOM SECURITY AUDIT
**Date:** 2026-05-27
**Time:** 01:03
**Reviewer:** VENOM
**Application Scope:** VCSM
**Topic:** VPORT Menu QR Module — Post-Wolverine P0 Fix Security Review

---

## VENOM TARGET

```
Feature / Route / Engine:
  VPORT Restaurant Dashboard Menu QR isolated module
  apps/VCSM/src/features/public/vportMenu/
  apps/VCSM/src/features/dashboard/qrcode/
  apps/VCSM/src/features/dashboard/flyerBuilder/
  apps/VCSM/src/lib/qrUrlBuilders.js
  engines/booking (QR link read/write surfaces)

Application Scope: VCSM + ENGINE (booking engine QR surfaces)

Reason for review:
  Immediately post-Wolverine P0 fix session. Three P0 violations were
  patched (UUID nav, hardcoded domain, empty adapter). VENOM is verifying
  the security posture of the full module, including surfaces the P0 fixes
  touched and adjacent paths.

Primary trust boundary:
  Public Visitor / Authenticated VPORT Owner
```

---

## SECURITY SURFACE

```
Entry points:
  GET /profile/:slug/menu           — public menu page
  GET /profile/:slug/menu/qr        — QR display (anon)
  GET /profile/:slug/reviews        — public reviews page
  GET /profile/:slug/reviews/qr     — reviews QR display (anon)
  GET /m/:actorId                   — legacy shortlink redirect (anon)
  GET /actor/:actorId/menu          — legacy actor menu (anon, redirects)
  GET /actor/:actorId/menu/qr       — legacy QR (anon, redirects)
  GET /actor/:actorId/menu/flyer    — printable flyer viewer (anon, public)
  Dashboard QR card → owner flow (authenticated)

Auth source:
  None for public routes — anon Supabase client
  Supabase session for dashboard flows

Authorization layer:
  Public routes: RLS on vport.* views + reviews.* views
  Write paths (createQrLink): assertActor* controllers in booking engine
  Read paths (listQrLinks): RLS assumed — no app-layer auth

Identity surface:
  actorId (primary — correct for public reads)
  profile_id (PRESENT — selected by DAL, leaks through model raw field)
  organizationId / profileId (present in useQrLinks hook — violation)

Sensitive objects involved:
  vport.public_menu_read_model_v  (profile_id, lat, lng, social_links, hours)
  reviews.public_vport_reviews_v  (author identity snapshots)
  qr_links table (booking engine)
```

---

## TRUST BOUNDARY TRACE

```
Client input:
  slug (URL param) → resolveMenuSlugDAL → actorId (canonical)
  actorId (URL param) → legacy redirect screens → slug resolution

Validated at:
  Slug resolution: DAL query against vport.public_menu_read_model_v
  actorId guard: null check only — no format validation

Identity resolved at:
  resolveMenuSlugDAL / resolveVportSlugDAL → actorId
  useActorCanonicalSlug → canonicalSlug (for QR safe rendering)

Authorization enforced at:
  Public reads: RLS on Supabase views only — no app-layer auth guard
  Write (createQrLink): assertActorCanManage* controllers (correct)
  Read (listQrLinks): NO app-layer auth — RLS assumed only

Data returned to:
  Client browser (public menu, QR display, review data)
  VPORT owner dashboard (flyer, QR card, flyer editor)
```

---

## SECURITY RISK FINDINGS — Summary

| ID | Severity | Location | Risk |
|---|---|---|---|
| V-001 | HIGH | `readVportPublicDetailsRpcDAL` + `vportPublicDetails.model.js` | `profile_id` + raw geolocation (`lat/lng`) leaked to view layer via `raw: row` |
| V-002 | MEDIUM | `engines/booking/src/controller/listQrLinks.controller.js` | `listQrLinksByProfile` and `listQrLinksByOrganization` have no app-layer caller auth — RLS-only assumption |
| V-003 | MEDIUM | `apps/VCSM/src/features/booking/hooks/useQrLinks.js` | Identity surface violation — `profileId` and `organizationId` used as authority parameters, not `actorId` |
| V-004 | MEDIUM | `VportActorMenuFlyerView.jsx` | QR code and display URL both encode UUID-based URL (`/m/:actorId`) before `canonicalSlug` resolves — UUID may be printed |
| V-005 | MEDIUM | `VportActorMenuFlyerView.jsx:69` | `onBack` fallback navigates to `/vport/${actorId}` — UUID in public-facing URL path (distinct from Wolverine P0 fix on MenuView) |
| V-006 | LOW | `VportPublicMenuQrView.jsx`, `VportPublicReviewsQrView.jsx` | UUID guard (UUID_RE) is view-layer only — no defense-in-depth at QrCode component or lib level |
| V-007 | LOW | `resolveMenuSlugDAL` vs `resolveVportSlugDAL` | Response differentiation reveals VPORT menu item existence to unauthenticated callers |
| V-008 | LOW | `vportMenu.routes.jsx`, `VportActorMenuFlyerScreen.jsx` | Flyer viewer is unauthenticated — any visitor can render and print any VPORT's branded flyer |

---

## DETAILED FINDINGS

---

### VENOM SECURITY FINDING V-001

```
Finding ID:       V-001
Location:
  apps/VCSM/src/features/public/vportMenu/dal/readVportPublicDetails.rpc.dal.js (select list)
  apps/VCSM/src/features/public/vportMenu/model/vportPublicDetails.model.js:206 (raw: row)
  apps/VCSM/src/features/public/vportMenu/view/VportPublicMenuView.jsx:52 (details.raw.address)

Application Scope: VCSM

Platform Surface:
  PWA / Supabase Table/View

Trust Boundary:
  Public Visitor → View Layer

Boundary Violated:
  Internal ID (profile_id) and precise geolocation (lat/lng) reachable
  by any public visitor via details.raw.*

Contract Violated:
  Public Identity Surface Contract
  Asset Security (data minimization)

Current behavior:
  readVportPublicDetailsRpcDAL selects profile_id, lat, lng, social_links,
  hours, booking_url and the full column set from public_menu_read_model_v.
  The model's mapVportPublicDetailsRpcResult returns the entire raw DB row
  as `details.raw`. VportPublicMenuView accesses details.raw.address.
  Any component with access to the `details` object (from useVportPublicDetails)
  can read details.raw.profile_id — an internal UUID not scoped to actorId.
  Similarly, details.raw.lat and details.raw.lng expose precise GPS coordinates.

Risk:
  1. profile_id is an internal identity reference that violates the actor-based
     identity contract. If any UI surface renders or logs details.raw.profile_id,
     it leaks a prohibited identity surface to public clients.
  2. lat/lng are precise GPS coordinates. Exposing them in a public API response
     without explicit owner consent enables geolocation tracking of business
     owners and could enable targeted physical attacks.
  3. details.raw is a raw DB row with no field sanitization. Future columns
     added to the view would automatically be exposed to the UI without
     any intentional export decision.

Severity: HIGH

Exploitability: MEDIUM
Attack Preconditions:
  - Target VPORT actorId or slug known (public information)
  - Navigate to /profile/:slug/menu
  - Inspect React devtools or network response
  - Access details.raw.profile_id or details.raw.lat / details.raw.lng

Blast Radius:
  - All VPORTs with menu items (any vport in public_menu_read_model_v)
  - Internal profile_id exposed for every vport in the menu read model

Identity Leak Type:
  - Internal UUID exposure (profile_id)
  - Resource enumeration (profile_id enumerable via slug)

Cache Trust Type:
  - Public-profile-sensitive

RLS Dependency:
  VERIFIED for read access — view is public. However, RLS does not prevent
  app-layer leakage of internal fields once fetched.

Why it matters:
  The identity contract explicitly bans profileId from public surfaces.
  The `raw: row` pattern is a lazy field-access workaround that bypasses
  intentional data modeling — any field in the view becomes accessible to
  any consumer of the details object without an explicit export decision.

CISSP Domain:
  Primary: Asset Security
  Secondary: Identity and Access Management, Software Development Security

Recommended mitigation:
  1. Remove `raw: row` from the model return value.
  2. Add `address` to the explicit field mapping in `mapVportPublicDetailsRpcResult`
     (it is the only field currently accessed via `.raw.address`).
  3. Remove `profile_id`, `lat`, `lng`, `social_links`, `hours` from the
     DAL column select OR add them to the model's explicit mapping with
     intentional sanitization — never pass them through via raw:
     - address: already mapped from row.address
     - lat/lng: map to a derived `directionsUrl` only (already done via buildDirectionsUrl)
     - social_links: map to social.instagram, social.facebook etc. (not raw JSON blob)
     - hours: map to structured hours object with explicit field list
     - profile_id: REMOVE from select entirely

Rationale:
  The model already does rich normalization for display fields. The `raw: row`
  shortcut undermines that work. Removing it forces intentional export of
  each field and prevents future column additions from silently leaking.

Follow-up command: Wolverine (remove raw: row, add address to explicit mapping)
```

---

### VENOM SECURITY FINDING V-002

```
Finding ID:       V-002
Location:
  engines/booking/src/controller/listQrLinks.controller.js
  engines/booking/src/dal/qrLink.read.dal.js

Application Scope: VCSM + ENGINE

Platform Surface:
  Shared Engine / Supabase Table (qr_links)

Trust Boundary:
  Authenticated Citizen / Authenticated VPORT Owner

Boundary Violated:
  No app-layer caller authentication on list operations.
  Reads protected only by assumed RLS policy on qr_links table.

Contract Violated:
  Actor Ownership Contract
  Booking Trust Contract

Current behavior:
  listQrLinksByOrganization({ organizationId }) and
  listQrLinksByProfile({ profileId }) accept their key parameter and
  query the qr_links table directly via getVportClient().
  No requestActorId is required for list operations.
  Contrast: createQrLink({ requestActorId, ... }) correctly validates
  ownership via assertActorCanManage* before writing.
  Read functions rely entirely on Supabase RLS policy on qr_links.

Risk:
  If the RLS policy on qr_links does not restrict SELECT by authenticated
  user identity, any authenticated user who knows an organizationId or
  profileId can enumerate all QR links for that entity.
  organizationId and profileId are internal IDs — but they may be inferrable
  from prior API calls or URL patterns.

Severity: MEDIUM

Exploitability: MEDIUM
Attack Preconditions:
  - Authenticated Citizen account required
  - Target organizationId or profileId known or enumerable
  - RLS policy on qr_links not verified to restrict by caller identity

Blast Radius:
  - All QR links for any organization or profile if RLS is insufficient
  - QR link slugs, destination paths, and scan counts exposed

Identity Leak Type:
  - Resource enumeration (qr_links for arbitrary organizationId/profileId)

Cache Trust Type:
  - None (no cache on QR link reads)

RLS Dependency:
  UNVERIFIED — read security depends entirely on Supabase policy on qr_links.
  This policy was not inspected in this review. DB command required.

Why it matters:
  Write path (createQrLink) correctly verifies caller ownership via
  assertActorCanManage*. Read path (listQrLinks) has no parallel check.
  This asymmetry means security of read operations is fully delegated
  to a database policy that has not been verified in this review.

CISSP Domain:
  Primary: Identity and Access Management
  Secondary: Security Architecture and Engineering

Recommended mitigation:
  1. Add requestActorId to listQrLinksByOrganization and listQrLinksByProfile.
  2. Call the matching assertActorCanManage* controller before the DAL read
     (same pattern as createQrLink).
  3. Alternatively, verify the RLS policy on qr_links enforces caller-identity
     scoping on SELECT and document it as the intentional enforcement layer.

Rationale:
  Defense-in-depth: if RLS is the sole enforcement layer and a policy is
  incorrectly written or a service client bypasses it, the read path has
  no fallback protection. App-layer checks cost one DB round-trip and
  provide a verifiable safety net independent of policy state.

Follow-up command: DB (inspect qr_links RLS policy), Carnage (add requestActorId if policy insufficient)
```

---

### VENOM SECURITY FINDING V-003

```
Finding ID:       V-003
Location:
  apps/VCSM/src/features/booking/hooks/useQrLinks.js:4

Application Scope: VCSM

Platform Surface:
  PWA

Trust Boundary:
  Authenticated VPORT Owner

Boundary Violated:
  Identity surface violation — profileId and organizationId used as authority
  parameters, not actorId + kind as required by the platform identity contract.

Contract Violated:
  Public Identity Surface Contract
  Actor Ownership Contract

Current behavior:
  useQrLinks({ organizationId, profileId }) accepts and passes these values
  as the authority surface for loading QR links. These are legacy entity IDs
  (vport.profiles.id and booking.organizations.id) — not actorId.
  The hook has no translation layer between actorId and these internal IDs.
  Callers must obtain organizationId / profileId externally and pass them in
  as identity parameters.

Risk:
  1. organizationId and profileId are internal IDs not exposed through the
     canonical identity system (useIdentity returns actorId + kind only).
     Any caller must obtain these IDs through a side channel — which may
     involve exposing them in state, URLs, or secondary API calls.
  2. The hook could be misused: if a caller passes a profileId or organizationId
     they do not own (or one obtained through enumeration), the list read proceeds
     with no app-layer rejection.
  3. Establishes an anti-pattern: other hooks may copy this style, spreading
     the non-actor identity surface across the codebase.

Severity: MEDIUM

Exploitability: LOW
Attack Preconditions:
  - Authenticated account required
  - Target profileId or organizationId must be known
  - Requires RLS to fail or be misconfigured

Blast Radius:
  - QR links for the targeted profile or organization

Identity Leak Type:
  - Internal UUID exposure (profileId, organizationId as explicit parameters)

Cache Trust Type:
  - None

RLS Dependency:
  ASSUMED — hook passes profileId/organizationId to the booking engine
  which queries qr_links; RLS on qr_links is the protection layer.

Why it matters:
  The identity contract (CLAUDE.md, ARCHITECTURE.md) explicitly bans profileId
  from public hook/controller surfaces. useQrLinks exposes both profileId and
  organizationId as first-class parameters, normalizing identity anti-patterns.

CISSP Domain:
  Primary: Identity and Access Management
  Secondary: Software Development Security

Recommended mitigation:
  1. Refactor useQrLinks to accept actorId as the primary identity parameter.
  2. Add a translation controller (inside the feature, not the engine) that
     resolves actorId → organizationId or profileId before calling the engine.
  3. The engine's listQrLinks* functions can retain organizationId/profileId
     for now as internal engine IDs, but the app-facing hook must not
     accept them as caller-provided authority.

Rationale:
  Keeping actorId as the canonical identity surface ensures all ownership
  resolution flows through the verified actor_owners relationship rather than
  relying on caller-provided internal IDs.

Follow-up command: Wolverine (refactor useQrLinks identity surface)
```

---

### VENOM SECURITY FINDING V-004

```
Finding ID:       V-004
Location:
  apps/VCSM/src/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerView.jsx:38-42

Application Scope: VCSM

Platform Surface:
  PWA / Print surface

Trust Boundary:
  Authenticated VPORT Owner

Boundary Violated:
  UUID may be encoded in a physically printed QR code before slug resolves.
  No raw UUIDs in public-facing surfaces rule violated at print time.

Contract Violated:
  Public Identity Surface Contract (no raw IDs in public URLs)

Current behavior:
  menuUrl is built from window.location.origin + route.
  While canonicalSlug is resolving (loading state):
    menuUrl = `${window.location.origin}/m/${actorId}`   ← UUID in QR
    shortUrl = hostname + `/m/${actorId}`                 ← UUID in display
  Once canonicalSlug resolves:
    menuUrl = `${window.location.origin}/profile/${canonicalSlug}/menu` ← safe
    shortUrl = hostname + `/profile/${canonicalSlug}/menu`              ← safe

  The flyer renders immediately without waiting for slug resolution.
  Both the QR code image and the short URL display text update reactively
  once the slug loads. However, if the owner prints the flyer before the
  slug resolves, the printed material encodes the actorId UUID.

Risk:
  An owner using a slow connection who clicks Print quickly after the
  page loads will print a QR code and display URL containing the actorId
  UUID. The shortlink (/m/:actorId) still works, but the UUID is encoded
  in permanent physical materials.

Severity: MEDIUM

Exploitability: LOW
Attack Preconditions:
  - Slow network or race condition on page load
  - Owner prints before slug resolves (within ~1-3 seconds typically)

Blast Radius:
  - Single VPORT (the owner of the flyer)
  - Printed materials may persist after slug updates

Identity Leak Type:
  - Internal UUID exposure on physical printed materials

Cache Trust Type:
  - None (slug loads fresh each page load)

RLS Dependency:
  NONE — URL construction is client-side only

Why it matters:
  Physical printed materials (menus, flyers, table cards, stickers) are
  permanent. A UUID encoded in a printed QR code cannot be recalled.
  The VportPublicMenuQrView already gates QR rendering behind isQrSafeSlug
  before rendering — the flyer builder does not apply the same gate.

CISSP Domain:
  Primary: Asset Security
  Secondary: Software Development Security

Recommended mitigation:
  1. Gate the QR render (and print button) behind slug resolution in
     VportActorMenuFlyerView — same pattern as VportPublicMenuQrView:
     - `const UUID_RE = /^[0-9a-f]{8}-...$/i`
     - `const isQrSafe = !!canonicalSlug && !UUID_RE.test(canonicalSlug)`
     - Render a loading skeleton when !isQrSafe (same skeleton used in QrView)
     - Disable Print button when !isQrSafe
  2. The shortUrl useMemo already guards on slug presence — consistent.

Rationale:
  VportPublicMenuQrView set the correct precedent for gated QR rendering.
  The flyer builder should use the same guard to prevent UUID-encoded prints.

Follow-up command: Wolverine
```

---

### VENOM SECURITY FINDING V-005

```
Finding ID:       V-005
Location:
  apps/VCSM/src/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerView.jsx:69

Application Scope: VCSM

Platform Surface:
  PWA

Trust Boundary:
  Authenticated VPORT Owner

Boundary Violated:
  UUID in public-facing /vport/ URL path — same class of violation as the
  Wolverine P0 fix applied to VportPublicMenuView, but in the flyer builder.

Contract Violated:
  Public Identity Surface Contract (no raw UUIDs in public URLs)

Current behavior:
  The onBack handler in VportActorMenuFlyerView has three branches:
  1. window.history.length > 1 → navigate(-1) [safe]
  2. actorId exists → navigate(`/vport/${actorId}`, { replace: true }) ← UUID in URL
  3. else → navigate(`/feed`) [safe]

  The second branch puts a raw actorId UUID into the /vport/ path segment.
  This exposes the UUID in the browser address bar.

Risk:
  A VPORT owner who arrives at the flyer page via direct URL (no history)
  and clicks Back will see their UUID in the browser address bar at
  /vport/<uuid>. The UUID appears in server logs, browser history, and
  potentially shared URLs.

Severity: MEDIUM

Exploitability: LOW
Attack Preconditions:
  - Authenticated VPORT Owner
  - Direct navigation to flyer URL (no history)
  - Click Back button

Blast Radius:
  - Single VPORT owner — UUID in their own browser URL

Identity Leak Type:
  - Internal UUID exposure in URL path

Cache Trust Type:
  - None

RLS Dependency:
  NONE — URL navigation only, no data access

Why it matters:
  The same class of fix was applied by Wolverine to VportPublicMenuView.
  The flyer builder onBack has the same violation at a different path.
  Inconsistency in the fix leaves one instance of the same rule broken.

CISSP Domain:
  Primary: Asset Security
  Secondary: Software Development Security

Recommended mitigation:
  Apply the same pattern as the Wolverine P0 fix:
  ```js
  if (canonicalSlug) {
    navigate(`/profile/${canonicalSlug}`, { replace: true });
  } else {
    navigate(`/actor/${actorId}/menu`, { replace: true });
  }
  ```
  canonicalSlug is already resolved in VportActorMenuFlyerView (used for menuUrl).

Rationale:
  Consistent application of the no-UUID-in-public-URL rule.
  canonicalSlug is already available — the fix is a one-liner.

Follow-up command: Wolverine (P1 fix — same class as P0)
```

---

### VENOM SECURITY FINDING V-006

```
Finding ID:       V-006
Location:
  apps/VCSM/src/features/public/vportMenu/view/VportPublicMenuQrView.jsx:19-20
  apps/VCSM/src/features/public/vportMenu/view/VportPublicReviewsQrView.jsx:28-29
  apps/VCSM/src/features/dashboard/qrcode/components/QrCode.jsx (no guard)
  apps/VCSM/src/lib/qrUrlBuilders.js (no UUID guard)

Application Scope: VCSM

Platform Surface:
  PWA

Trust Boundary:
  Public Visitor / Authenticated VPORT Owner

Boundary Violated:
  UUID guard exists only at the view layer — no defense-in-depth.
  QrCode component and qrUrlBuilders accept any string without validation.

Contract Violated:
  Public Identity Surface Contract

Current behavior:
  Both VportPublicMenuQrView and VportPublicReviewsQrView correctly
  implement:
    const UUID_RE = /^[0-9a-f]{8}-...$/i
    const isQrSafeSlug = !!canonicalSlug && !UUID_RE.test(canonicalSlug)
  QR is gated on isQrSafeSlug — correct.

  However:
  - QrCode.jsx renders any non-empty string value directly
  - buildMenuQrUrl() accepts any slug string without UUID validation
  - If a future consumer calls QrCode or buildMenuQrUrl with an actorId
    directly (without the view-layer guard), a UUID-encoded QR renders

Risk:
  The guard is a UI-layer convention, not enforced at the utility level.
  Any new consumer of QrCode or qrUrlBuilders that does not know to
  implement the UUID_RE guard will silently produce UUID-encoded QRs.
  The adapter (vportMenu.adapter.js) now exports views with the guard,
  but does not document the requirement.

Severity: LOW

Exploitability: LOW
Attack Preconditions:
  - Developer writes new consumer of QrCode or buildMenuQrUrl
  - Omits UUID guard
  - No code review catches the gap

Blast Radius:
  - Any new QR surface that omits the guard

Identity Leak Type:
  - Internal UUID exposure (if guard is omitted in new consumers)

Cache Trust Type:
  - None

RLS Dependency:
  NONE — URL construction only

Why it matters:
  Security conventions that exist only in one layer and are not enforced
  by the utility contract tend to drift as the codebase grows.

CISSP Domain:
  Primary: Security Architecture and Engineering
  Secondary: Software Development Security

Recommended mitigation:
  Option A (preferred): Add UUID validation to buildMenuQrUrl and buildReviewsQrUrl:
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-...$/ .test(slug)) return "";
    // Silently return empty string — callers must check !value before rendering QrCode

  Option B: Add JSDoc to qrUrlBuilders documenting the UUID guard requirement.

  Option C: Add a utility helper `isQrSafeSlug(slug)` to qrUrlBuilders
    and import it in all view consumers — shared guard, single source.

Rationale:
  Defense-in-depth: if the guard is in both the lib and the view layer,
  a developer who forgets the view-layer check still gets protection at
  the lib level.

Follow-up command: Wolverine (P2 — add UUID guard to qrUrlBuilders)
```

---

### VENOM SECURITY FINDING V-007

```
Finding ID:       V-007
Location:
  apps/VCSM/src/features/public/vportMenu/dal/resolveMenuSlug.dal.js
  apps/VCSM/src/features/public/vportMenu/dal/resolveVportSlug.dal.js

Application Scope: VCSM

Platform Surface:
  PWA / Supabase Table/View

Trust Boundary:
  Public Visitor

Boundary Violated:
  Oracle disclosure — response differentiation reveals internal VPORT state

Contract Violated:
  SEO Surface Contract (VPORT existence and menu-item state leaked)

Current behavior:
  resolveMenuSlugDAL queries public_menu_read_model_v — only resolves vports
  with at least one active menu category + item.
  resolveVportSlugDAL queries public_actor_seo_v — resolves any vport with
  a public profile, regardless of menu items.

  The slug resolution hooks useResolveMenuSlug and useResolveVportSlug
  both set notFound=true when actorId is null (null result from DAL).

  For the same slug:
  - /profile/:slug/menu → useResolveMenuSlug → notFound=true → "Menu not found"
  - /profile/:slug/reviews → useResolveVportSlug → notFound=false → shows reviews

  This response difference reveals:
  1. The VPORT exists (reviews page resolves)
  2. The VPORT has no active menu items (menu page does not resolve)

Risk:
  Low-grade oracle disclosure. An attacker probing slugs can determine:
  - Whether a slug is a valid VPORT (via reviews endpoint)
  - Whether that VPORT has menu items (via menu vs reviews resolution diff)
  This is a business intelligence leak — competitors can enumerate which
  businesses use the menu feature vs which do not.

Severity: LOW

Exploitability: LOW
Attack Preconditions:
  - Public access (no auth required)
  - Target slug known or guessable
  - Manual inspection of page behavior

Blast Radius:
  - SEO/indexing
  - Business intelligence for competitors

Identity Leak Type:
  - Resource enumeration (VPORT menu status inference)

Cache Trust Type:
  - Public-profile-sensitive

RLS Dependency:
  VERIFIED — public views, anon access correct

Why it matters:
  The menu endpoint silently distinguishes between "vport does not exist"
  and "vport exists but has no menu" — both return notFound=true from the hook.
  The reviews endpoint reveals the vport exists. Together they create an
  inadvertent oracle for menu item status.

CISSP Domain:
  Primary: Communication and Network Security
  Secondary: Asset Security

Recommended mitigation:
  Option A: Accept as by-design. The menu page is intentionally empty for
    vports without menu items — the business state is meant to be public.
  Option B: Add a generic "profile not found" response for all resolution
    failures (unify the UX) and avoid the "menu not found" vs "profile exists"
    distinction.
  No code change is required if the disclosure is accepted as by-design.

Rationale:
  This is informational — the data disclosed (whether a vport has menu items)
  is low-sensitivity business information available to direct observation.
  The risk is business intelligence leakage, not data privacy or auth bypass.

Follow-up command: LOGAN (document this as accepted oracle disclosure)

DECISION (2026-05-27 — 27-05 pass): ACCEPTED BY DESIGN
  resolveMenuSlugDAL queries public_menu_read_model_v (menu items required).
  resolveVportSlugDAL queries public_actor_seo_v (any public vport).
  The differentiation is intentional product behavior — the menu page is only
  meaningful when menu items exist. The disclosed information (whether a vport has
  active menu items) is observable by direct inspection. No code change required.
```

---

### VENOM SECURITY FINDING V-008

```
Finding ID:       V-008
Location:
  apps/VCSM/src/app/routes/public/vportMenu.routes.jsx:29-31
  apps/VCSM/src/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerScreen.jsx

Application Scope: VCSM

Platform Surface:
  PWA

Trust Boundary:
  Public Visitor

Boundary Violated:
  Authenticated owner tool (flyer builder viewer) accessible to unauthenticated visitors

Contract Violated:
  None explicit — data exposed is public

Current behavior:
  The route /actor/:actorId/menu/flyer is registered in vportMenu.routes.jsx
  (public routes, not protected). VportActorMenuFlyerScreen has no auth gate.
  Any unauthenticated visitor can navigate to this URL for any VPORT
  and view + print a fully rendered menu flyer.
  The flyer loads public data only (via useVportPublicDetails).

Risk:
  1. Any visitor can generate and print a branded menu flyer for any VPORT
     they do not own. This could be used to print fake or malicious flyers
     impersonating a business.
  2. The Print button is visible and functional for all visitors.
  3. The flyer exposes the VPORT's public name, logo, QR code, and menu URL —
     the same data available on the public menu page. No private data is added.

Severity: LOW

Exploitability: MEDIUM
Attack Preconditions:
  - No auth required
  - Target actorId known or guessable
  - Navigate to /actor/:actorId/menu/flyer

Blast Radius:
  - Any VPORT (all public VPORTs with menu items)
  - Physical impersonation attack vector

Identity Leak Type:
  - None beyond what is already public

Cache Trust Type:
  - Public-profile-sensitive

RLS Dependency:
  NONE — public view data only

Why it matters:
  While the data exposed is public, the Print functionality enabling
  production of branded materials for any business without ownership
  verification creates an impersonation vector. A malicious actor could
  print convincing Vibez Citizens-branded flyers for a competitor's
  restaurant with their own QR code overlaid (the attacker would need
  to modify the printed output, but the framework is provided).

CISSP Domain:
  Primary: Security and Risk Management
  Secondary: Software Development Security

Recommended mitigation:
  Option A: Add an auth gate to the flyer viewer route (move to protected routes).
    Enforce ownership check before rendering (useVportOwnership or equivalent).
    This is the strongest fix — only the owner can view and print their flyer.
  Option B: Accept as by-design (public shareable flyer link) — document the
    decision and the accepted risk.
  Option C: Add a visible ownership indicator on the flyer viewer page that
    makes impersonation harder (e.g., "This is [VPORT Name]'s official menu flyer").

Rationale:
  The flyer editor is correctly auth-gated. The flyer viewer being public may be
  intentional for the "share this flyer link" use case. The decision should be
  explicit rather than accidental.

Follow-up command: Wolverine (if auth gate desired), LOGAN (if accepted as by-design)
```

---

## MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| V-001 profile_id + raw: row leak | HIGH — internal ID + lat/lng in UI layer | Model / DAL | P0 | App | Wolverine |
| V-002 listQrLinks no app-layer auth | MEDIUM — RLS-only read assumption | Controller / Engine | P1 | Engine + DB | DB → Carnage |
| V-003 useQrLinks identity violation | MEDIUM — profileId/orgId as auth surface | Hook / Controller | P1 | App | Wolverine |
| V-004 UUID in printed QR | MEDIUM — UUID in physical printed material | UI / View | P1 | App | Wolverine |
| V-005 UUID in /vport/ onBack URL | MEDIUM — UUID in browser URL bar | View | P1 | App | Wolverine |
| V-006 UUID guard not in lib layer | LOW — defense-in-depth gap | Lib | P2 | App | Wolverine |
| V-007 menu item oracle disclosure | LOW — business intelligence leak | Documentation | P3 | Documentation | LOGAN |
| V-008 flyer viewer unauthenticated | LOW — impersonation vector | Router / UI | P2 | App | Wolverine or LOGAN |

---

## IDENTITY SURFACE WARNINGS

### IDENTITY SURFACE WARNING — W-001

```
Location:
  apps/VCSM/src/features/booking/hooks/useQrLinks.js:4

Current identity surface:
  profileId (vport.profiles.id)
  organizationId (booking.organizations.id)

Expected identity surface:
  actorId (vc.actors.id) + kind

Risk:
  Hook accepts and passes internal entity IDs as authority parameters.
  Callers cannot obtain these IDs through the canonical identity system.
  Encourages non-actor identity patterns in the app layer.

Suggested correction:
  Accept actorId as the primary parameter.
  Resolve to organizationId/profileId internally via a translation controller.
```

### IDENTITY SURFACE WARNING — W-002

```
Location:
  apps/VCSM/src/features/public/vportMenu/dal/readVportPublicDetails.rpc.dal.js
  (column select: "profile_id,...")

Current identity surface:
  profile_id selected from vport.public_menu_read_model_v

Expected identity surface:
  profile_id should not be selected for public consumption.
  actor_id is the canonical identity reference for all public surfaces.

Risk:
  profile_id fetched into client state and available in details.raw.profile_id.

Suggested correction:
  Remove profile_id from the DAL select list.
  actor_id is already selected and is the correct canonical reference.
```

---

## POST-FIX VERIFICATION (Wolverine P0 Fixes Applied This Session)

The following P0 violations identified by ARCHITECT were fixed by Wolverine and are now RESOLVED:

| Fixed Item | Status | Verification |
|---|---|---|
| `VportPublicMenuView.jsx` UUID nav → `/profile/${actorId}` | ✅ RESOLVED | Now uses `canonicalSlug` with `/actor/:id/menu` fallback |
| `VportActorMenuFlyerView.jsx` hardcoded `vibezcitizens.com` domain | ✅ RESOLVED | `buildMenuShortDisplayUrl` from qrUrlBuilders — origin-safe |
| `vportMenu.adapter.js` empty (no public surface) | ✅ RESOLVED | Populated with views + hooks + slug resolution exports |

Remaining: V-005 is the same class of UUID-in-URL violation as the Wolverine P0 fix, found in a different location (FlyerView `onBack` → `/vport/${actorId}`). Not yet fixed.

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | V-008 — unauth flyer viewer governance decision |
| Asset Security | 4 | V-001 (profile_id + lat/lng), V-004 (UUID print), V-005 (UUID URL), V-007 (oracle) |
| Security Architecture and Engineering | 1 | V-006 — UUID guard not in lib layer |
| Communication and Network Security | 1 | V-007 — oracle disclosure via route differentiation |
| Identity and Access Management | 2 | V-002 (listQrLinks no auth), V-003 (identity surface violation) |
| Security Assessment and Testing | 0 | Not covered in this audit scope — no test coverage exists for this module |
| Security Operations | 0 | No debug leakage detected. No production-visible diagnostics found in this module. |
| Software Development Security | 4 | V-001 (raw: row), V-004 (UUID print race), V-005 (UUID URL), V-006 (guard gap) |

**Uncovered domains:**
- **Security Assessment and Testing** — not covered because this review is static analysis only. The module has zero test coverage (confirmed by ARCHITECT). Testing coverage is a separate concern recommended for SPIDER-MAN.
- **Security Operations** — no moderation, logging, or admin tooling exists in this module. No debug panels, no sensitive log paths detected.

---

## VENOM COMPLETION STATEMENT

VENOM has:
- ✅ Loaded and enforced boundary isolation contract (VCSM scope)
- ✅ Remained fully read-only
- ✅ Identified trust boundaries (public anon, authenticated owner, booking engine)
- ✅ Traced auth and authorization paths for all public and write surfaces
- ✅ Inspected identity surfaces — two identity violations found (V-001, V-003)
- ✅ Classified exploitability for all 8 findings
- ✅ Classified blast radius for all 8 findings
- ✅ Classified platform surface for all findings
- ✅ Classified RLS dependency for all findings
- ✅ Mapped contract violations
- ✅ Mapped CISSP domains for all findings
- ✅ Included mitigation plan with priority and owner
- ✅ Included CISSP summary table
- ✅ Verified Wolverine P0 fixes are correctly applied
- ✅ Identified one missed P0-class violation (V-005 — same class, different location)
- ✅ Persisted report to approved audit path

**Overall module security posture: WATCH**
No CRITICAL findings. Two HIGH+MEDIUM findings require Wolverine fix passes.
One HIGH finding (V-001 — raw: row) is the most urgent — remove `profile_id` from DAL select and `raw: row` from model output.

**Blocking for release:** V-001 (HIGH — internal ID in public response)
**Non-blocking but required:** V-002, V-003, V-004, V-005 (MEDIUM)
**Hardening:** V-006, V-007, V-008 (LOW)
