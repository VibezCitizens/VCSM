# VENOM SECURITY AUDIT
**Target:** VPORT Services Dashboard Card
**Date:** 2026-05-23
**Reviewer:** VENOM
**Application Scope:** VCSM
**Boundary Contract:** Loaded ✓

---

## VENOM TARGET

```
Feature:          VPORT Services Dashboard Card
Application Scope: VCSM
Reason for review: asOwner trust boundary on read path, RLS assumptions on vport schema tables,
                   cross-feature ownership assertion chain (profiles controller → booking adapter),
                   listVportServicesForProfile controller profileId exposure,
                   triple profileId resolution DAL pattern,
                   console.warn in production component
Primary trust boundary: Authenticated VPORT Owner vs. Authenticated Citizen
```

---

## SECURITY SURFACE

```
Entry Points:
  1. VportDashboardServicesScreen.jsx     — dashboard route, authenticated
  2. VportServicesView.jsx (via adapter)  — shared view, used in profile card stack

Auth Source:
  useIdentity() → identity.actorId → passed as viewerActorId prop

Authorization Layer:
  READ  — useVportOwnership (DB check) at dashboard screen level
          VportServicesView string comparison (viewerActorId === targetActorId)
          getVportServicesController: NONE — asOwner flag accepted without server verification

  WRITE — upsertVportServicesController → assertActorOwnsVportActorController
          (via booking/adapters/booking.adapter) → actor_owners DB check

Identity Surface:
  actorId (correct)
  profileId (internal DAL use only — resolveProfileId called 3×)

Sensitive Objects:
  vport.services (enabled/disabled status per actor)
  vport.service_addons (add-on catalog per actor)
  vport.service_catalog (type catalog — semi-public)
  vport.profiles (internal profile resolution)
  vc.actors / vc.actor_owners (ownership verification)
```

---

## TRUST BOUNDARY TRACE

```
CLIENT INPUT:    actorId from URL params (/actor/:actorId/dashboard/services)
VALIDATED AT:    Dashboard screen — presence check only (not vport kind check)
IDENTITY AT:     useIdentity() → identity.actorId (session-bound ✓)
AUTHORIZATION:
  READ  — Dashboard: useVportOwnership (DB) → renders view
          View: String(viewerActorId) === String(targetActorId) — CLIENT SIDE ONLY
          Controller: asOwner flag accepted as passed, no DB verification
  WRITE — Controller: assertActorOwnsVportActorController → vc.actor_owners (DB ✓)
DATA RETURNED TO: React state → component render
```

---

## SECURITY RISK FINDINGS

```
Missing authorization:  Read path asOwner flag is UI-trusted; no server-side ownership gate
Identity misuse:        viewerActorId === targetActorId comparison is client-side UI logic
Sensitive data exposure: Disabled/inactive services exposed to asOwner:true without server verify
Unsafe debug leakage:   console.warn in VportServicesOwnerToolbar.jsx (production-visible)
Policy assumption risks: RLS on vport.services, vport.service_addons unverified
Dependency boundary:    profiles write controller → booking adapter (cross-feature ownership chain)
```

---

## FINDINGS

---

### FINDING V-SVC-001

```
VENOM SECURITY FINDING
- Finding ID:         V-SVC-001
- Location:           apps/VCSM/src/features/profiles/kinds/vport/controller/services/getVportServices.controller.js
                      apps/VCSM/src/features/profiles/kinds/vport/hooks/services/useVportServices.js
                      apps/VCSM/src/features/profiles/kinds/vport/screens/services/view/VportServicesView.jsx
- Application Scope:  VCSM
- Platform Surface:   PWA / Supabase Table
- Trust Boundary:     Authenticated Citizen → Authenticated VPORT Owner
- Boundary Violated:  asOwner=true accepted from caller without server-side ownership check
- Contract Violated:  Actor Ownership Contract

- Current behavior:
  getVportServicesController receives `asOwner` as a boolean passed from the hook.
  The hook receives it from VportServicesView via `asOwner: ownerUiEnabled`.
  ownerUiEnabled = allowOwnerEditing && (String(viewerActorId) === String(targetActorId)).
  The string comparison is computed entirely in the view layer from React props.
  The controller NEVER verifies ownership against vc.actor_owners or any DB table.
  When asOwner=true, the controller:
    - returns ALL services including disabled ones (includeDisabled: true)
    - returns ALL catalog entries including inactive ones (includeInactive: true)
    - bypasses the 60s TTL viewer cache
    - returns the mode: 'owner' response shape

- Risk:
  Any caller who passes asOwner=true to the controller will receive the full
  owner-mode payload including disabled services and inactive catalog entries.
  Although in the current UI flow the dashboard screen gates with useVportOwnership
  (DB-backed), the controller itself has no enforcement.
  VportServicesView could be instantiated with allowOwnerEditing=true
  from any other screen without the dashboard ownership gate upstream.

- Severity:           HIGH

- Exploitability:     MEDIUM
- Attack Preconditions:
  - Authenticated account required
  - Target VPORT actorId must be known (public IDs)
  - Must call getVportServicesController directly or embed VportServicesView
    with allowOwnerEditing=true and a matching viewerActorId
  - Current UI path is protected by dashboard screen gate;
    risk surface is at controller layer and any future callers

- Blast Radius:
  - Single VPORT — disabled/inactive service configuration exposed per target

- Identity Leak Type:  None (no internal IDs exposed; service state is the leak)

- Cache Trust Type:   None (cache is bypassed for owner mode — correct behavior)

- RLS Dependency:
  ASSUMED — the services table presumably has RLS; but `asOwner` mode is
  an app-layer concept that RLS cannot enforce because it maps to a
  business-layer flag, not a DB identity. RLS protecting writes is
  independent of this read exposure risk.

- Why it matters:
  The disabled/inactive service list is owner-private configuration data.
  A VPORT owner should be the only one who can see which services they have
  intentionally turned off. Leaking this exposes business strategy and
  potentially unavailable/unlicensed service categories.
  Defense-in-depth requires the controller to enforce ownership, not only the
  calling screen.

- Recommended mitigation:
  Add server-side ownership verification inside getVportServicesController
  when asOwner=true is passed:

    if (asOwner) {
      await assertActorOwnsVportActorController(callerActorId, targetActorId)
      // throw if not owner → fails closed
    }

  This requires threading callerActorId (identityActorId) into the controller.
  Currently getVportServicesController does not accept a callerActorId param.
  Alternatively, document explicitly that asOwner=true is safe only because
  all call sites pass it through verified ownership gates — but this is
  fragile as the codebase grows.

- Rationale:
  Defense-in-depth: controller should not trust that its callers have already
  verified ownership. Each layer enforces its own boundary.

- Follow-up command:  Wolverine (to add callerActorId param and ownership gate)

- CISSP Domain:
  - Primary:   Identity and Access Management
  - Secondary: Security Architecture and Engineering, Software Development Security
```

---

### FINDING V-SVC-002

```
VENOM SECURITY FINDING
- Finding ID:         V-SVC-002
- Location:           apps/VCSM/src/features/profiles/kinds/vport/screens/services/view/VportServicesView.jsx:33-37
- Application Scope:  VCSM
- Platform Surface:   PWA
- Trust Boundary:     Authenticated VPORT Owner
- Boundary Violated:  Ownership decision made via client-side string comparison in view layer
- Contract Violated:  Actor Ownership Contract, Security Architecture and Engineering

- Current behavior:
  VportServicesView computes ownership with:
    const isOwner = Boolean(viewerActorId) && String(viewerActorId) === String(targetActorId);
  This is a string equality check on React props — no DB lookup, no session binding,
  no actor_owners verification.
  The isOwner result controls ownerUiEnabled, which controls asOwner passed to the
  read hook and whether the owner editor panel is displayed.

- Risk:
  Ownership logic lives in the view layer (view screens must not contain business rules
  per architecture contract). More critically, this is a purely client-side ownership
  gate that controls the visibility of privileged UI and the asOwner read mode.
  While the dashboard screen has an upstream DB ownership check, VportServicesView
  can be embedded elsewhere without that upstream gate. The only protection then is
  this string comparison.

- Severity:           MEDIUM

- Exploitability:     LOW
  (Current paths require upstream DB gate; risk is architectural and future-facing)

- Attack Preconditions:
  - VportServicesView embedded with allowOwnerEditing=true in non-dashboard context
  - viewerActorId === targetActorId is satisfied (caller passes matching ID)
  - No upstream ownership gate present

- Blast Radius:
  - Single VPORT (owner UI exposed to non-owner)

- Identity Leak Type:  None

- Cache Trust Type:   None

- RLS Dependency:     NONE (client-side UI logic)

- Why it matters:
  Business rule (ownership check) living in a view screen violates the architecture
  contract and creates fragile security. The same logic should be enforced at
  controller layer, not duplicated across view and dashboard layers with different
  mechanisms.

- Recommended mitigation:
  Remove the isOwner computation from VportServicesView.
  Ownership should be resolved once in the hook or controller and passed as a
  verified result. VportServicesView should receive `resolvedIsOwner` as a prop
  from a controller-backed hook, not compute it from raw actorId props.

- Rationale:
  Single responsibility + defense-in-depth: one layer owns the ownership decision.

- Follow-up command:  SENTRY (layer violation), Wolverine (refactor)

- CISSP Domain:
  - Primary:   Identity and Access Management
  - Secondary: Software Development Security
```

---

### FINDING V-SVC-003

```
VENOM SECURITY FINDING
- Finding ID:         V-SVC-003
- Location:           apps/VCSM/src/features/dashboard/vport/controller/listVportServicesForProfile.controller.js
- Application Scope:  VCSM
- Platform Surface:   PWA
- Trust Boundary:     Authenticated VPORT Owner
- Boundary Violated:  Controller accepts ownerActorId without verifying caller identity
- Contract Violated:  Actor Ownership Contract

- Current behavior:
  listVportServicesForProfile.controller.js:

    export async function listVportServicesForProfileController({ ownerActorId, includeDisabled = false }) {
      if (!ownerActorId) return [];
      const profileId = await getVportProfileIdByActorDAL({ actorId: ownerActorId });
      if (!profileId) return [];
      return listVportServicesByProfileIdDAL({ profileId, includeDisabled });
    }

  - No `identityActorId` / `callerActorId` parameter
  - No ownership verification against actor_owners or any auth table
  - Accepts any actorId and returns services for that actor
  - includeDisabled flag has no ownership gate

- Risk:
  Any caller who knows a VPORT actorId can pass it as ownerActorId and
  retrieve services including disabled ones (includeDisabled=true).
  While the dashboard screen does not call this controller directly
  (it uses the canonical adapter path), this controller is a live,
  ungated code path that could be reached from any new caller.

- Severity:           HIGH

- Exploitability:     MEDIUM
  (Requires direct controller call; not currently reachable from dashboard UI;
   risk is that the controller exists as an ungated write-capable artifact)

- Attack Preconditions:
  - Authenticated account
  - Target actorId known
  - Direct controller call — currently no UI path exercises this

- Blast Radius:       Single VPORT (disabled service list exposed)

- Identity Leak Type: None (service state leakage, not identity)

- Cache Trust Type:   None

- RLS Dependency:
  ASSUMED — relies on RLS on vport.services to filter by profileId;
  but includeDisabled=true would return rows that RLS may permit
  if the DB policy is permissive for the anon/service role.

- Why it matters:
  This controller is a dead duplicate of the canonical read path
  (getVportServicesController) but without the catalog merge,
  model transforms, or ownership verification.
  Its existence creates a permanently ungated read surface
  for owner-mode service data.

- Recommended mitigation:
  Delete listVportServicesForProfile.controller.js and its companion
  DAL (vportServices.read.dal.js). Route any legitimate dashboard
  reads through the canonical getVportServicesController.
  If the controller must be kept temporarily, add:
    - identityActorId parameter
    - assertActorOwnsVportActorController check before any read
    - Remove includeDisabled capability from this path

- Rationale:
  Dead/duplicate code paths are live attack surface.
  Ownership gates must be present at every privileged read boundary.

- Follow-up command:  Wolverine (delete + consolidate), DB (verify RLS on vport.services)

- CISSP Domain:
  - Primary:   Identity and Access Management
  - Secondary: Security and Risk Management, Software Development Security
```

---

### FINDING V-SVC-004

```
VENOM SECURITY FINDING
- Finding ID:         V-SVC-004
- Location:           apps/VCSM/src/features/profiles/kinds/vport/dal/services/readVportServicesByActor.dal.js
                      apps/VCSM/src/features/profiles/kinds/vport/dal/services/readVportServiceAddonsByActor.dal.js
                      apps/VCSM/src/features/profiles/kinds/vport/dal/services/upsertVportServicesByActor.dal.js
- Application Scope:  VCSM
- Platform Surface:   PWA / Supabase Table
- Trust Boundary:     System Service
- Boundary Violated:  DAL performs actor enumeration via independent profileId resolution
- Contract Violated:  None (internal DAL pattern) — but see risk

- Current behavior:
  All three DAL files contain an inline `resolveProfileId(actorId)` function:
    async function resolveProfileId(actorId) {
      const { data } = await vportSchema
        .from("profiles").select("id").eq("actor_id", actorId).maybeSingle();
      return data?.id ?? null;
    }
  This lookup fires on every read and write operation, independently, against
  the vport.profiles table with no auth binding.
  It does not verify that the actorId is a valid vport-kind actor.
  It returns profileId (internal DB identifier) from a public-facing actorId.

- Risk:
  1. Actor enumeration: passing any actorId allows discovering whether a
     vport.profiles record exists for that actor. The return is null/non-null —
     a timing or response oracle for actor kind guessing.
  2. Internal ID resolution without ownership: resolveProfileId returns a
     profileId mapped from actorId. While this stays inside the DAL, any
     code path reaching the DAL can probe actor-to-profileId mappings.
  3. The vportSchema client access to profiles is anon/service-key backed —
     whether RLS restricts this lookup is unverified.

- Severity:           LOW (pattern risk, not direct exploit path)

- Exploitability:     LOW
  (DAL is not directly callable from client; requires controller path)

- Attack Preconditions:
  - Must reach DAL via controller
  - Primarily an information leakage/enumeration concern

- Blast Radius:       Cross-actor (any VPORT actor can be enumerated)

- Identity Leak Type: Actor correlation (actorId → profileId resolution)

- Cache Trust Type:   None

- RLS Dependency:
  UNVERIFIED — vport.profiles select('id').eq('actor_id', actorId) is
  an unconstrained lookup via vportSchema client; RLS posture unknown.

- Why it matters:
  Each DAL independently resolves profileId from actorId without any
  ownership context. This creates a triple enumeration surface on every
  services load. Beyond the N+1 performance cost, it means any valid
  actorId probes the profiles table three times per load.

- Recommended mitigation:
  1. Centralize resolveProfileId to a single shared DAL utility
     (e.g. `resolveVportProfileIdByActor.dal.js`) called once from the
     controller before parallel DAL calls.
  2. Pass profileId explicitly into DAL methods that need it —
     DALs should not resolve identity; controllers should.
  3. Verify RLS on vport.profiles `select('id')` — should not be
     accessible by anon role without actor ownership context.

- Rationale:
  DAL methods should receive resolved identifiers, not perform
  identity resolution themselves. Controller is the correct
  layer for actor-to-profile resolution.

- Follow-up command:  Kraven (N+1 fix), DB (verify RLS on vport.profiles)

- CISSP Domain:
  - Primary:   Asset Security
  - Secondary: Identity and Access Management
```

---

### FINDING V-SVC-005

```
VENOM SECURITY FINDING
- Finding ID:         V-SVC-005
- Location:           apps/VCSM/src/features/profiles/kinds/vport/dal/services/readVportTypeByActorId.dal.js
- Application Scope:  VCSM
- Platform Surface:   PWA / Supabase Table
- Trust Boundary:     System Service
- Boundary Violated:  Single DAL crosses two schema clients (vc + vport)
- Contract Violated:  Security Architecture and Engineering

- Current behavior:
  readVportTypeByActorId imports and uses both:
    import { supabase } from "@/services/supabase/supabaseClient";   // vc schema
    import vportSchema from "@/services/supabase/vportClient";        // vport schema

  Step 1: Queries vc.actors (supabase) → gets actor.vport_id
  Step 2: Queries vport.profile_categories (vportSchema) → gets category_key

  The DAL manually joins across two separate Supabase clients with two
  separate round-trips, crossing the vc/vport schema boundary in a single
  method.

- Risk:
  1. Each schema client may have different auth/RLS contexts.
     The vc schema client has one RLS posture; vportSchema has another.
     A single DAL that straddles both creates an ambiguous trust context
     where the security of the combined read depends on both clients
     being correctly configured.
  2. If vportSchema uses a service role or anon key with weaker RLS,
     the profile_categories lookup could be exploitable.
  3. Schema boundary mixing in a single DAL file is an architectural
     violation and a security surface confusion point.

- Severity:           MEDIUM

- Exploitability:     LOW
  (Requires targeting the type resolution path; no direct bypass)

- Attack Preconditions:
  - Any actorId can trigger cross-schema lookup chain
  - vportSchema RLS posture determines exploitability

- Blast Radius:       Single actor per call; cross-actor if iterated

- Identity Leak Type: Actor correlation (actorId → vport_id → category_key)

- Cache Trust Type:   None (no cache on this DAL)

- RLS Dependency:
  UNVERIFIED — Both vc.actors and vport.profile_categories RLS postures
  are unverified in this cross-schema context.

- Why it matters:
  A single DAL crossing two distinct schema clients creates an ambiguous
  security trust context. If one client has permissive RLS, it undermines
  the defense of the combined read. The architecture contract calls for
  explicit column selection (✓ present) but does not address cross-schema
  DALs.

- Recommended mitigation:
  1. Separate the two lookups into two DAL files:
     - `readActorVportIdByActorId.dal.js` (vc schema)
     - `readVportPrimaryCategory.dal.js` (vport schema)
  2. Compose them in the controller where identity resolution belongs.
  3. Verify RLS on both vc.actors.select('id,vport_id') and
     vport.profile_categories.select('category_key') for anon/service role.

- Rationale:
  Each schema client should be used in isolation within a single DAL file.
  Cross-schema composition belongs in the controller layer.

- Follow-up command:  DB (verify RLS on both tables), SENTRY (layer violation)

- CISSP Domain:
  - Primary:   Security Architecture and Engineering
  - Secondary: Asset Security
```

---

### FINDING V-SVC-006

```
VENOM SECURITY FINDING
- Finding ID:         V-SVC-006
- Location:           apps/VCSM/src/features/profiles/kinds/vport/controller/services/upsertVportServices.controller.js:9
- Application Scope:  VCSM
- Platform Surface:   PWA
- Trust Boundary:     Authenticated VPORT Owner
- Boundary Violated:  Cross-feature direct ownership assertion (profiles → booking adapter)
- Contract Violated:  Boundary Isolation Contract (cross-feature import)

- Current behavior:
  upsertVportServices.controller.js imports:
    import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

  The services write controller (in profiles/kinds/vport feature) directly
  imports and calls the ownership assertion function from the booking feature's
  adapter boundary.

  The assertActorOwnsVportActorController function:
    1. Gets requester actor from vc.actors (getActorByIdDAL — booking DAL)
    2. Gets owner link from vc.actor_owners (booking DAL)
    3. Returns ok if ownership verified

- Risk:
  1. Security dependency chain fragility: if booking.adapter is refactored,
     renamed, or its assertActorOwnsVportActorController signature changes,
     the services write controller silently loses its ownership gate.
  2. Cross-feature coupling: the security-critical ownership check for
     services writes is owned by the booking feature, not the profiles/vport
     feature. This means the booking team (or future refactors) can
     inadvertently weaken the services auth boundary.
  3. The dependency direction violates the architecture contract:
     features must not directly import from other features' internals,
     only through adapters — and even this is a profiles controller
     importing from booking.adapter directly.

- Severity:           MEDIUM

- Exploitability:     LOW
  (The ownership check itself functions correctly;
   risk is dependency fragility and boundary confusion)

- Attack Preconditions:
  - Booking adapter refactor removes/weakens assertActorOwnsVportActorController
  - No test coverage catches the regression

- Blast Radius:       All VPORT service writes if ownership gate weakens

- Identity Leak Type: None

- Cache Trust Type:   None

- RLS Dependency:
  REQUIRED — RLS on vport.services provides defense-in-depth;
  the actor_owners check is app-layer; both must hold.

- Why it matters:
  A security-critical ownership assertion should be owned by a stable,
  dedicated utility — not implicitly borrowed from a separate feature's adapter.
  If booking feature is ever restructured, the ownership gate for
  services writes could be silently removed with no obvious failure mode.

- Recommended mitigation:
  Extract assertActorOwnsVportActorController to a shared utility:
    engines/identity/src/services/ownershipService.js
    OR
    apps/VCSM/src/shared/actors/assertActorOwnership.js
  All features requiring ownership assertion import from this single
  canonical source. Booking adapter becomes a consumer too.
  This removes the cross-feature hard dependency and makes the
  security primitive independently versionable and testable.

- Rationale:
  Ownership assertion is a platform primitive, not a booking-specific concern.
  Security primitives must have stable, explicitly governed locations.

- Follow-up command:  Ironman (ownership), Wolverine (refactor)

- CISSP Domain:
  - Primary:   Security Architecture and Engineering
  - Secondary: Software Development Security, Security and Risk Management
```

---

### FINDING V-SVC-007

```
VENOM SECURITY FINDING
- Finding ID:         V-SVC-007
- Location:           apps/VCSM/src/features/profiles/kinds/vport/screens/services/components/owner/VportServicesOwnerToolbar.jsx:24-28
- Application Scope:  VCSM
- Platform Surface:   PWA
- Trust Boundary:     Authenticated VPORT Owner
- Boundary Violated:  Debug leakage to production browser console
- Contract Violated:  Security Operations (debug logging rule)

- Current behavior:
  VportServicesOwnerToolbar.jsx line 24:
    console.warn("[VportServicesOwnerToolbar] Save blocked:", reasons, {
      dirty,
      isSaving,
      onSaveType: typeof onSave,
    });

  This fires unconditionally when the owner save button is clicked but
  cannot save. The log includes:
    - Internal component name
    - reasons string (e.g. "dirty=false (no changes) | isSaving=true")
    - Internal state values: dirty, isSaving, onSaveType

  No NODE_ENV or dev-mode guard is present.

- Risk:
  1. In production, any time a VPORT owner clicks Save without changes
     or while a save is in progress, the browser DevTools console
     receives internal component state details.
  2. Internal names ("VportServicesOwnerToolbar"), state labels
     ("dirty=false", "isSaving"), and prop types are observable
     by any user who opens DevTools on the dashboard.
  3. Violates project debug logging rule:
     "No console.log; debug output must render on screen and be dev-only."

- Severity:           LOW

- Exploitability:     LOW
  (No direct security bypass; information leakage only)

- Attack Preconditions:
  - VPORT owner account required
  - Browser DevTools open
  - Save button clicked while blocked

- Blast Radius:       Single actor (information leakage per session)

- Identity Leak Type: None (no actor IDs in the log)

- Cache Trust Type:   None

- RLS Dependency:     NONE

- Why it matters:
  Console output in production reveals internal component architecture
  and state machine details. Follows from the project's explicit rule:
  no console.log/warn/error — debug output must be dev-only or rendered
  on screen. Any console.warn in production code is a rule violation
  and a low-severity information disclosure.

- Recommended mitigation:
  Replace with a dev-only guard:
    if (process.env.NODE_ENV !== 'production') {
      console.warn("[VportServicesOwnerToolbar] Save blocked:", reasons, { ... });
    }
  Or remove entirely — the reasons are already encoded in the button's
  `title` attribute and aria-disabled state, which is sufficient for debugging.

- Rationale:
  Project rule: debug output must never reach production.

- Follow-up command:  None (P2 fix, no command needed)

- CISSP Domain:
  - Primary:   Security Operations
  - Secondary: Software Development Security
```

---

### FINDING V-SVC-008

```
VENOM SECURITY FINDING
- Finding ID:         V-SVC-008
- Location:           apps/VCSM/src/features/dashboard/vport/screens/VportDashboardServicesScreen.jsx:20
- Application Scope:  VCSM
- Platform Surface:   PWA
- Trust Boundary:     Authenticated Citizen
- Boundary Violated:  actorId from URL param not validated as vport-kind actor
- Contract Violated:  None (hardening gap)

- Current behavior:
  const actorId = useMemo(() => params?.actorId ?? null, [params]);

  The actorId is extracted from the URL and used directly for:
    1. useVportOwnership(viewerActorId, actorId) — ownership DB check
    2. Rendering VportServicesView with that actorId as target

  No validation that the actorId represents a vport-kind actor.
  A user-kind actorId passed in the URL will:
    - Trigger useVportOwnership DB check against it (leaks whether record exists)
    - Trigger getVportServicesController → readVportTypeByActorId which will
      check vc.actors and vport.profile_categories for a non-vport actor
    - Return empty services gracefully (no crash, but unnecessary DB probe)

- Risk:
  1. Any authenticated user can probe the dashboard services route with
     arbitrary actorIds to determine:
     - Whether an actor has a vport profile (actor kind inference)
     - Whether they own it (isOwner response timing)
  2. Unnecessary DB probes on non-vport actors waste resources and
     create an actor-kind enumeration oracle.

- Severity:           LOW

- Exploitability:     LOW
  (Authenticated required; graceful failure; no data leakage beyond probe)

- Attack Preconditions:
  - Authenticated account
  - Any actorId (user or vport kind) can be placed in URL

- Blast Radius:       Cross-actor (enumeration probe potential)

- Identity Leak Type: Actor correlation (kind inference via response pattern)

- Cache Trust Type:   None

- RLS Dependency:     NONE (app-layer input validation gap)

- Why it matters:
  The dashboard is a privileged route. Input validation at the route
  boundary prevents probing unrelated actors and reduces unnecessary
  DB load. Fail fast with kind validation before any DB operations.

- Recommended mitigation:
  After resolving actorId, verify actor kind before proceeding:
    const actor = await getActorByIdController(actorId);
    if (!actor || actor.kind !== 'vport') {
      return <ErrorState message="Invalid vport." />;
    }
  Or rely on the VportServicesView returning empty gracefully and
  document this as an accepted behavior. Either way, add a comment
  explaining the decision.

- Rationale:
  Route-level input validation prevents enumeration and unnecessary DB load.

- Follow-up command:  None (P3 hardening)

- CISSP Domain:
  - Primary:   Software Development Security
  - Secondary: Identity and Access Management
```

---

### FINDING V-SVC-009

```
VENOM SECURITY FINDING
- Finding ID:         V-SVC-009
- Location:           apps/VCSM/src/features/profiles/kinds/vport/controller/services/upsertVportServices.controller.js:99-123
- Application Scope:  VCSM
- Platform Surface:   PWA
- Trust Boundary:     Authenticated VPORT Owner
- Boundary Violated:  Locksmith detail provisioning silences errors in production
- Contract Violated:  Security Operations

- Current behavior:
  After saving locksmith services, the controller provisions default locksmith
  detail rows for newly-enabled services via Promise.allSettled().
  Error handling:
    if (process.env.NODE_ENV !== 'production') {
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.error('[locksmith] detail provision failed', { ... });
        }
      });
    }

  - In development: errors logged to console.
  - In PRODUCTION: locksmith detail provisioning failures are silently
    swallowed. No error is thrown. No UI feedback. The caller gets
    { ok: true, count, rows } even if locksmith details failed to provision.

- Risk:
  1. Silent failure: a VPORT owner enables locksmith services expecting
     detail provisioning to happen, but if it fails, they receive no
     indication. The service appears enabled but lacks operational detail
     rows that downstream features (booking, pricing, emergency dispatch)
     may depend on.
  2. Inconsistent state: services table updated ✓, locksmith_service_details
     NOT updated → hidden data inconsistency.
  3. No audit trail: failed provisioning is invisible in production.

- Severity:           MEDIUM

- Exploitability:     LOW
  (Not a direct attack vector; silent failure under error conditions)

- Attack Preconditions:
  - DB error or constraint violation on locksmith_service_details insert
  - Locksmith VPORT must be saving services

- Blast Radius:       Single VPORT (locksmith type only) per save event

- Identity Leak Type: None

- Cache Trust Type:
  Booking-sensitive — locksmith availability/pricing details are used in
  booking flows; stale/missing details affect booking trust.

- RLS Dependency:
  ASSUMED — vport.locksmith_service_details RLS posture unknown.

- Why it matters:
  Silent failure in a security/operational data path creates hidden
  inconsistency. Booking flows that depend on locksmith_service_details
  will behave incorrectly without surfacing a clear failure origin.
  The pattern violates operational security: privileged write operations
  must have observable success/failure paths in all environments.

- Recommended mitigation:
  1. In production, log failed provisioning to a server-side observability
     channel (error tracking, structured log) rather than silencing.
  2. Or: change Promise.allSettled to Promise.all and let the controller
     throw on any provisioning failure — callers can handle/retry.
  3. At minimum: return the provisioning results in the response payload
     so the caller is aware of partial success:
       return { ok: true, count: saved.length, rows: saved, locksmithProvisionResults: results }

- Rationale:
  Security operations require observable failure. Silent success is
  not success — it is deferred unknown state.

- Follow-up command:  Deadpool (if locksmith booking breaks), DB (schema state)

- CISSP Domain:
  - Primary:   Security Operations
  - Secondary: Software Development Security, Security and Risk Management
```

---

## MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| V-SVC-001 | asOwner flag not server-verified on read path | Controller | P0 | App | Wolverine |
| V-SVC-002 | isOwner string comparison in view layer | Controller / View | P1 | App | SENTRY |
| V-SVC-003 | listVportServicesForProfile has no ownership gate | Controller (delete) | P1 | App | Wolverine |
| V-SVC-004 | Triple independent profileId resolution — enumeration oracle | DAL | P2 | App | Kraven / DB |
| V-SVC-005 | Single DAL crossing two schema clients | DAL / Controller | P2 | App | DB / SENTRY |
| V-SVC-006 | Cross-feature ownership assertion (profiles → booking adapter) | Controller / Engine | P2 | App | Ironman / Wolverine |
| V-SVC-007 | console.warn in production owner toolbar | UI | P2 | App | — |
| V-SVC-008 | actorId URL param not validated as vport-kind | Router / Controller | P3 | App | — |
| V-SVC-009 | Silent locksmith provisioning failure in production | Controller | P2 | App | Deadpool / DB |

---

## IDENTITY SURFACE WARNINGS

### ISW-001
```
IDENTITY SURFACE WARNING
Location:    VportServicesView.jsx:33-37
Current:     String(viewerActorId) === String(targetActorId) — actorId comparison in view
Expected:    Ownership resolved by controller, passed as verified boolean prop
Risk:        Business rule in view layer; easily bypassed if props are unguarded
Correction:  Move ownership resolution to hook/controller; pass `resolvedIsOwner`
```

### ISW-002
```
IDENTITY SURFACE WARNING
Location:    readVportServicesByActor.dal.js, readVportServiceAddonsByActor.dal.js,
             upsertVportServicesByActor.dal.js — resolveProfileId() internal usage
Current:     actorId → profileId resolution in DAL (internal, not exposed to UI)
Expected:    Acceptable as DAL-internal only; DO NOT expose profileId at controller/hook surface
Risk:        profileId stays internal to DAL ✓; risk is triple enumeration oracle
Correction:  Centralize to single call in controller; do not expose profileId above DAL
```

---

## DEBUG LEAKAGE WARNINGS

### DLW-001
```
DEBUG LEAKAGE WARNING
Location:    VportServicesOwnerToolbar.jsx:24
Current:     console.warn with component name, state labels, prop type — no prod guard
Leak risk:   Internal component state visible in production DevTools
Severity:    LOW
Mitigation:  Wrap in NODE_ENV !== 'production' or remove entirely
```

---

## RLS ASSUMPTION SUMMARY

| Table | Schema | Access Type | App-Layer Check | RLS Dependency | Status |
|---|---|---|---|---|---|
| `vport.services` | vport | read/write | None on reads; ownership on write | ASSUMED | UNVERIFIED |
| `vport.service_catalog` | vport | read | None (public catalog) | ASSUMED | ACCEPTABLE |
| `vport.service_addons` | vport | read | None | ASSUMED | UNVERIFIED |
| `vport.profiles` | vport | read (id only) | None | ASSUMED | UNVERIFIED |
| `vport.profile_categories` | vport | read | None | ASSUMED | UNVERIFIED |
| `vc.actors` | vc | read | Session-bound client | REQUIRED | UNVERIFIED |
| `vc.actor_owners` | vc | read | Booking DAL | REQUIRED | UNVERIFIED |

**Recommendation:** DB review of RLS policies on `vport.services`, `vport.service_addons`, `vport.profiles` for the vportSchema client role (anon vs service role). If vportSchema uses a service role, RLS may not apply — making app-layer ownership gates the only defense. See V-SVC-001.

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 2 | V-SVC-003 (ungated controller risk), V-SVC-006 (dependency fragility risk) |
| Asset Security | 2 | V-SVC-004 (actor enumeration via profileId), V-SVC-005 (cross-schema identity correlation) |
| Security Architecture and Engineering | 4 | V-SVC-001 (asOwner trust), V-SVC-002 (view-layer auth), V-SVC-005 (cross-schema DAL), V-SVC-006 (fragile ownership chain) |
| Communication and Network Security | 0 | Not applicable — no external endpoints in scope |
| Identity and Access Management | 5 | V-SVC-001, V-SVC-002, V-SVC-003, V-SVC-004, V-SVC-008 |
| Security Assessment and Testing | 0 | No test coverage found for ownership gates or RLS assumptions — see RLS table above; flagged as gap |
| Security Operations | 2 | V-SVC-007 (console.warn), V-SVC-009 (silent failure) |
| Software Development Security | 6 | V-SVC-001, V-SVC-002, V-SVC-003, V-SVC-006, V-SVC-007, V-SVC-008 |

**Uncovered Domains:**
- **Communication and Network Security** — Not applicable for this feature (no public endpoints, no external API surfaces, no media/storage paths in scope for services card)
- **Security Assessment and Testing** — No test files found for this module. Not inspected in depth but flagged as a gap: there are no tests for ownership gate behavior, RLS assumptions, or asOwner trust boundary. This domain is partially applicable and represents a gap, not an intentional exclusion.

---

## OVERALL RISK SUMMARY

| Severity | Count |
|---|---:|
| CRITICAL | 0 |
| HIGH | 2 (V-SVC-001, V-SVC-003) |
| MEDIUM | 3 (V-SVC-002, V-SVC-005, V-SVC-006, V-SVC-009) |
| LOW | 3 (V-SVC-004, V-SVC-007, V-SVC-008) |

**Top Priority:** V-SVC-001 — read path `asOwner` flag has no server-side ownership gate.
All other findings are architectural hardening. The write path is properly defended at the controller level via `assertActorOwnsVportActorController`.

---

*VENOM is analysis-only. No code was modified. All findings are recommendations.*
