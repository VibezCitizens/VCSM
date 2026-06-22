# VENOM Security Audit — VPORT Tab Classification

**Date:** 2026-05-27
**Reviewer:** VENOM
**Module:** tab-classification
**Trigger:** First VENOM pass — module was NOT_STARTED in governance matrix
**Findings:** [0 CRITICAL | 2 HIGH | 4 MEDIUM | 3 LOW]

---

## VENOM TARGET

```
Feature / Route / Engine:  VPORT Tab Classification — /vport/[kind] and public profile view
Application Scope:         VCSM
Reason for review:         First security pass; module governs tab visibility including sensitive owner, booking, and team tabs
Primary trust boundary:    Authenticated VPORT Owner (owner tab injection) / Public Visitor (profile tab surface)
```

---

## SECURITY SURFACE

```
Entry point:
  - VportProfileViewScreen.jsx — effectiveTabs computation (useMemo)
  - URL ?tab= query parameter — direct tab selection
  - VportProfileTabContent.jsx — tab content router

Auth source:
  - viewerActorId from parent (useIdentity → identityContext → actorId)
  - isOwner derived by deriveVportIsOwner() — pure client-side actorId comparison

Authorization layer:
  - Owner tab injection: effectiveTabs useMemo — isOwner check injects "owner" tab
  - Owner tab render: VportProfileTabContent line 117 — isOwner guard on tab === "owner"
  - Sensitive tab content: isOwner prop threaded into child views (booking, team, gas, content)
  - Dashboard-level ownership: useVportOwnership → checkVportOwnershipController → actor_owners (DB-verified)

Identity surface:
  - actorId (correct — canonical identity)
  - profile?.category (legacy fallback field used in vportType resolution — not canonical)

Sensitive objects involved:
  - "owner" tab → VportOwnerView (dashboard + settings navigation)
  - "team" tab → VportBarberShopTeamView (team roster + management controls)
  - "book" tab → VportBookingView (owner booking management view)
  - "gas" tab → VportGasPricesView (pricing with isOwner write access)
  - "content" tab → VportContentView (page management)
  - "rates" tab → VportRatesView (FX rate data — public read)
```

---

## TRUST BOUNDARY TRACE

```
Client input:
  - URL slug (route param :actorId) — resolves to actorId server-side via DB query
  - URL ?tab= query param — read client-side, validated against effectiveTabs list
  - vportType — resolved from publicDetails (DB-sourced) with legacy fallbacks

Validated at:
  - Slug → actorId: resolveActorBySlugController (DB call — trusted)
  - vportType: fetched from profile_categories via readActorTypeDAL (DB call — trusted)
  - Tab key (?tab=): validated against effectiveTabs list before setTab() — but only for auto-select

Identity resolved at:
  - viewerActorId: parent component via useIdentity() — trusted session context
  - profileActorId: passed from parent — route-resolved, not client-injected

Authorization enforced at:
  - isOwner: client-side only — deriveVportIsOwner() (String comparison of two actorIds)
  - "owner" tab render: isOwner guard in VportProfileTabContent (line 117)
  - All other sensitive tab renders: isOwner prop threaded but NOT used as gate on whether the tab is rendered — it only changes the UI mode inside the component

Data returned to:
  - All tab content renders are client-side SPA components
  - No server-side rendering of tab-gated content
```

---

## VENOM SECURITY FINDING

### FINDING 1

```
VENOM SECURITY FINDING
- Finding ID: VENOM-TABS-001
- Location: apps/VCSM/src/features/profiles/kinds/vport/screens/components/VportProfileTabContent.jsx : line 75–77
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen | Public Visitor
- Boundary Violated: Authenticated Citizen → Authenticated VPORT Owner
- Contract Violated: Actor Ownership Contract
- Current behavior:
    The "team" tab renders VportBarberShopTeamView unconditionally when tab === "team" with
    no isOwner gate on the render decision itself. Any actor (or public visitor with a direct
    URL ?tab=team) who reaches a barbershop profile can trigger the team tab render.
    The isOwner prop is threaded into VportBarberShopTeamView, but VportBarberShopTeamView
    only uses isOwner to switch between "owner management controls" and "customer view" UI modes
    — it does NOT block the render. The team member list (member_actor_id, name, role, status)
    is fetched and displayed to all viewers. Owner-only team management actions (Schedule, Hours)
    are UI-hidden for non-owners, but the full member data load fires regardless.

    Additionally, the team tab appears in the tab bar only for barbershop VPORTs (VPORT_BARBERSHOP_TABS).
    However, any actor can navigate directly to ?tab=team on any VPORT. The effectiveTabs
    validation in VportProfileViewScreen (line 127) only blocks tab selection when the key is
    not in the effectiveTabs list — for non-barbershop VPORTs, "team" is not in effectiveTabs,
    so the URL redirect is blocked. But for a barbershop, any public visitor reaching the profile
    can use ?tab=team and see the full team roster.
- Risk:
    Team tab is intended as public-facing on barbershop profiles (customer selects who to book with).
    This is not a privilege escalation — the owner management controls are correctly hidden.
    However, the team member roster fetch (member_actor_id exposed client-side via useVportTeam)
    fires for all viewers including unauthenticated ones. The security risk is primarily that
    isOwner is not verified server-side before the team data loads — the isOwner prop received
    by VportBarberShopTeamView is trusted from the parent chain without re-verification at the
    data fetch layer.
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions:
    - Public access to any barbershop profile (no auth required)
    - Direct URL navigation to /profile/[barbershop-slug]?tab=team
    - No ownership verification required
- Blast Radius: Single VPORT (barbershop profiles only) — all public visitors can trigger team data load
- Identity Leak Type: Actor correlation (member_actor_id exposed via useVportTeam to all viewers)
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — team member reads rely on RLS on vport team tables; VENOM did not inspect those policies
- Why it matters:
    The team data load (member_actor_id, linked status, active status) fires for any visitor.
    If RLS on team member tables does not restrict the data, team member actor IDs are exposed
    to unauthenticated visitors through the client-side state.
    Owner-mode management controls are UI-hidden but the underlying data fetch is not gated.
- Recommended mitigation:
    Add an explicit RLS policy audit on vport team membership tables (DB command).
    The VportBarberShopTeamView should not receive member_actor_id or linked/active status
    for public viewers — a separate public-safe projection should be used for non-owners.
    Alternatively, add a server-side verified isOwner flag to the team data fetch.
- Rationale:
    The current pattern relies entirely on UI-level isOwner prop routing to hide management
    controls. Data fetched for non-owners should not include internal identity fields
    (member_actor_id) or operational status fields (linked/active) unless they are public
    per explicit policy.
- Follow-up command: DB
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Asset Security, Software Development Security
```

---

### FINDING 2

```
VENOM SECURITY FINDING
- Finding ID: VENOM-TABS-002
- Location: apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx : lines 98–99
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen | Authenticated VPORT Owner
- Boundary Violated: Weak trust — vportType resolved from multiple sources with priority fallback chain including profile?.category (legacy/untrusted field)
- Contract Violated: VPORT Lifecycle Contract
- Current behavior:
    The vportType used to compute effectiveTabs (line 98-99) and the owner-gated barbershop check
    (line 164) is resolved from a four-way fallback chain:
      publicDetails?.vportType ?? profile?.vport_type ?? profile?.vportType ?? profile?.category ?? null
    
    publicDetails is loaded from useVportProfileBySlug via DB (trusted).
    profile?.vport_type and profile?.vportType come from useProfileView (likely DB-sourced but through a
    separate query path with a different caching layer).
    profile?.category is a legacy field of unknown provenance — it is used as the final fallback.

    If publicDetails is null (loading race, network delay, or TTL cache miss), the system falls back
    to profile?.category which may not be validated against the DB constraint vc.vports.vport_type_check.
    
    During the loading race window, the wrong vportType can be resolved — causing the wrong tab set
    to render. More critically, the isBarbershopOwner check (line 164: isOwner && vportType === "barbershop")
    uses the same unverified fallback chain. If a non-barbershop VPORT briefly resolves as "barbershop"
    during the race window, VportBarberShopOwnerBand and VportBarberShopBookingView are injected.
- Risk:
    A VPORT owner who can influence profile?.category (if that field is writable without type validation)
    could cause their non-barbershop VPORT to temporarily render the barbershop owner booking management UI.
    Even without adversarial intent, the race condition means incorrect tab sets flash before publicDetails
    resolves — this is documented in Logan spec section 11 as a known race.
    
    The security concern is profile?.category — its write path and validation are not visible in the
    audited files. If it is not constrained by the same DB check as vport_type, it is an untrusted
    input in the tab classification chain.
- Severity: HIGH
- Exploitability: LOW (requires a loading race window or ability to write profile?.category with an incorrect value)
- Attack Preconditions:
    - VPORT owner with write access to profile.category field
    - OR network conditions that delay publicDetails resolution relative to profile load
    - The race window is typically sub-second but observable on slow networks
- Blast Radius: Single VPORT (the actor whose profile loads with incorrect vportType)
- Identity Leak Type: None
- Cache Trust Type: Public-profile-sensitive (vportType from TTL cache drives tab layout and owner mode rendering)
- RLS Dependency: ASSUMED — DB constraint vport_type_check assumed to cover profile.vport_type; profile.category unchecked
- Why it matters:
    The fallback chain means the system can silently degrade to an unvalidated type field.
    The barbershop owner mode path is particularly sensitive — it renders team management and booking
    calendar UI. Incorrect type resolution causes the wrong feature surface to activate.
- Recommended mitigation:
    Remove profile?.category from the effectiveTabs and vportType fallback chain entirely.
    Only publicDetails?.vportType (DB-sourced, DB-constraint-validated) and profile?.vport_type
    (same DB source) should be trusted. Document profile?.category as deprecated and remove
    all type-classification usage. Logan should track this deprecation.
- Rationale:
    Reducing the fallback chain to only DB-validated fields eliminates the untrusted input path.
    publicDetails loading race is a UX issue, not a security issue — failing open to VPORT_TABS
    (the fallback) is safe. The barbershop owner mode should not activate until publicDetails
    is confirmed.
- Follow-up command: LOGAN
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering, Identity and Access Management
```

---

### FINDING 3

```
VENOM SECURITY FINDING
- Finding ID: VENOM-TABS-003
- Location: apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx : lines 122–130
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Public Visitor | Authenticated Citizen
- Boundary Violated: UI-only gate — tab content router (VportProfileTabContent) renders any known tab key sent via URL ?tab= parameter, regardless of whether that tab is in the VPORT's effectiveTabs layout
- Contract Violated: None (no explicit contract violated — existing guard on line 127 partially mitigates)
- Current behavior:
    The ?tab= URL parameter processing (lines 122–130) validates the requested tab against
    the effectiveTabs list before calling setTab(). This is correct.
    
    However, VportProfileTabContent renders tab content based solely on the tab string value
    — it does NOT verify that the current tab key is in effectiveTabs before rendering.
    
    If effectiveTabs is recomputed after the URL param is applied (e.g., publicDetails loads
    and changes the tab set), the tab state can be left pointing to a key that no longer
    exists in effectiveTabs. The useEffect on line 107–120 resets tab to the first key only
    when the current tab is not in the new effectiveTabs list — this is a partial guard.
    
    Additionally, the "team" tab content renders for any VPORT with tab === "team" even for
    non-barbershop VPORTs, because VportProfileTabContent does not check vportType — it only
    checks the tab key string. The team tab should only be included in VPORT_BARBERSHOP_TABS
    but there is no runtime enforcement in the content router preventing render if tab is
    set to "team" on a non-barbershop profile.
    
    Practically: the ?tab= guard prevents direct URL injection for non-barbershop VPORTs
    (since "team" is not in their effectiveTabs). But during the publicDetails loading window
    (before vportType resolves), VPORT_TABS is the fallback — "team" is not in VPORT_TABS,
    so the guard holds. The risk is narrow but real on type-resolution race windows.
- Risk:
    A non-barbershop VPORT could briefly render the team tab content if tab state is set to
    "team" before effectiveTabs resolves correctly. On slow networks or heavy load, the
    race window is longer.
    The VportBarberShopTeamView renders team member data — if the profileActorId is not a
    barbershop, the team fetch returns empty but the component still runs and fires a DB query.
- Severity: MEDIUM
- Exploitability: LOW (requires race window timing; normal URL guards prevent direct injection)
- Attack Preconditions:
    - Access to any VPORT profile URL
    - Network conditions causing publicDetails to resolve slowly
    - Knowledge that "team" is a valid tab key
- Blast Radius: Single actor — transient race condition, no persistent data exposure
- Identity Leak Type: None
- Cache Trust Type: Public-profile-sensitive (effectiveTabs depends on vportType from cache)
- RLS Dependency: NONE (tab routing is purely client-side)
- Why it matters:
    The content router (VportProfileTabContent) should be the final defense-in-depth layer.
    Its current pattern trusts that tab state is always consistent with effectiveTabs.
    Adding vportType or effectiveTabs membership checks in the content router would
    eliminate the race-window exposure entirely.
- Recommended mitigation:
    Add an effectiveTabs.some(t => t.key === tab) guard inside VportProfileTabContent
    before rendering any tab content block. This makes the content router self-validating
    independent of how tab state was set. The "team" block specifically should also add
    a vportType === "barbershop" guard consistent with the existing "book" tab pattern.
- Rationale:
    Defense-in-depth requires each layer to independently validate its inputs.
    The effectiveTabs guard in the URL param handler is correct but is a single point of
    defense. Adding the guard at the content router layer eliminates the race-window gap.
- Follow-up command: Wolverine
- CISSP Domain:
  - Primary: Security Architecture and Engineering
  - Secondary: Software Development Security
```

---

### FINDING 4

```
VENOM SECURITY FINDING
- Finding ID: VENOM-TABS-004
- Location: apps/VCSM/src/features/profiles/kinds/vport/model/getVportTabsByType.model.js : lines 40–41
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated VPORT Owner | Public Visitor
- Boundary Violated: VPORT type confusion — locksmith is mapped to VPORT_BARBER_TABS instead of a locksmith-appropriate layout
- Contract Violated: None (intentional design choice, but undocumented security implication)
- Current behavior:
    The TYPE_TABS map assigns locksmith → VPORT_BARBER_TABS:
      locksmith: VPORT_BARBER_TABS
    
    VPORT_BARBER_TABS includes the "book" tab (Portfolio, Book, Services, Reviews, Content, About, Photos, Vibes, Subscribers).
    
    The locksmith type has TYPE_TABS override membership, so it bypasses GROUP_TABS resolution.
    However, locksmith is also a member of the "Home, Maintenance & Trades" group, which maps to
    VPORT_TRADES_TABS — which also includes "book".
    
    The Logan spec's TYPE_TABS table (section 6) does NOT list locksmith as a TYPE_TABS override.
    The live code DOES have locksmith → VPORT_BARBER_TABS. This is a specification drift.
    
    The VportProfileTabContent "book" dispatcher uses vportType to decide which booking view renders:
      - vportType === "barbershop" → VportBarberShopBookingView
      - all other types → VportBookingView
    
    A locksmith VPORT will display the book tab (from VPORT_BARBER_TABS) and will route to
    VportBookingView (not the barbershop-specific one). This is functionally correct.
    The spec drift creates a documentation gap — the locksmith override is not documented
    in the Logan spec — which can lead to future incorrect changes.
- Risk:
    The security risk is low — the booking view dispatch correctly uses vportType, not the tab layout,
    to decide which booking UI renders. However, the spec drift means:
    1. A future developer removing the locksmith TYPE_TABS override (believing it is wrong) would
       cause locksmith to fall through to VPORT_TRADES_TABS — which also has "book" but in a different order.
    2. The undocumented override creates audit gaps where the actual behavior diverges from the spec.
- Severity: MEDIUM
- Exploitability: LOW (no direct exploitability — documentation and maintenance risk)
- Attack Preconditions:
    - None (latent design drift; not directly exploitable)
- Blast Radius: Single VPORT kind (locksmith)
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters:
    Spec drift between logan/vcsm.vport.tab-classification.md and the live code creates
    a governance gap. The Logan spec (section 6, TYPE_TABS table) does not list locksmith
    as a type-level override. Future audits or refactors using the spec as ground truth
    will produce incorrect conclusions about locksmith tab behavior.
- Recommended mitigation:
    Update the Logan spec to explicitly document locksmith → VPORT_BARBER_TABS as an intentional
    override with the rationale (solo-operator booking flow matches barber layout better than trades layout).
    Add a comment in the code explaining why locksmith has a TYPE_TABS override despite being in
    the Trades group. This is a LOGAN follow-up, not a code change.
- Rationale:
    Code-spec alignment is a security governance requirement. Undocumented overrides create
    incorrect mental models for future reviewers and can lead to regressions.
- Follow-up command: LOGAN
- CISSP Domain:
  - Primary: Security Assessment and Testing
  - Secondary: Security and Risk Management
```

---

### FINDING 5

```
VENOM SECURITY FINDING
- Finding ID: VENOM-TABS-005
- Location: apps/VCSM/src/features/profiles/dal/readActorType.dal.js : line 8 + apps/VCSM/src/features/profiles/kinds/vport/controller/getVportPublicDetails.controller.js : line 6
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Cache stale window creates identity-sensitive tab classification delay
- Contract Violated: VPORT Lifecycle Contract
- Current behavior:
    The actorTypeCache in readActorType.dal.js has a 10-minute TTL (600_000 ms).
    The getVportPublicDetailsController has a 60-second TTL.
    React Query STALE_MS for vportPublicDetails is 5 minutes.
    
    These three independent caches operate without coordination:
    - A VPORT type change in the DB would take up to 10 minutes to propagate to the actor type cache.
    - The public details cache expires in 60 seconds but can be served stale by React Query for 5 minutes.
    - The effectiveTabs computation depends on the vportType field from publicDetails.
    
    If a VPORT owner changes their VPORT type (e.g., from "restaurant" to "barbershop"), the tab
    classification will show the old type's tabs for up to 10 minutes due to the actorTypeCache TTL.
    
    More critically: the isOwner barbershop check (isBarbershopOwner = isOwner && vportType === "barbershop")
    will fail to activate VportBarberShopOwnerBand for the new type until all caches expire.
    Going in the other direction (type changes from barbershop to another type), the barbershop owner
    band may continue to display for up to 10 minutes, exposing the barbershop-specific booking management
    UI to a VPORT that is no longer classified as barbershop.
- Risk:
    After a VPORT type change, the booking view dispatch (vportType check on lines 68-72 of
    VportProfileTabContent) could serve the wrong booking UI for up to 10 minutes. A former
    barbershop that changed type to "restaurant" would continue to get VportBarberShopBookingView
    for up to 10 minutes. A new barbershop would not get its specialized booking view.
    This is a data-staleness risk, not a privilege escalation, but it affects the integrity
    of the booking surface shown to real customers.
- Severity: MEDIUM
- Exploitability: LOW (requires a type change event; not controllable by third parties)
- Attack Preconditions:
    - VPORT owner changes their VPORT type in settings
    - Stale cache serves the old vportType
    - Customers visiting the profile in the stale window receive the wrong booking UI
- Blast Radius: Single VPORT — customers visiting in the stale window
- Identity Leak Type: None
- Cache Trust Type: Public-profile-sensitive (vportType drives tab layout and booking view dispatch)
- RLS Dependency: NONE (cache is app-layer; no RLS involvement)
- Why it matters:
    The three-layer cache (DAL TTL 10 min, controller TTL 60s, React Query 5 min) is not
    coordinated around the VPORT type change lifecycle event. A type change is a rare but
    significant event — the system should invalidate all caches atomically when a VPORT type
    changes. The invalidateActorTypeCache() and invalidateVportPublicDetails() functions exist
    but must be called from the settings/type-change write path.
- Recommended mitigation:
    Ensure the VPORT type-change write path calls both invalidateActorTypeCache(actorId) and
    invalidateVportPublicDetails(actorId) after a successful type update. Add a test for this
    invalidation. Review the settings controller to confirm these invalidations are wired.
- Rationale:
    Coordinated cache invalidation on type-change writes ensures the stale window is bounded
    to the maximum of the individual cache TTLs minus the invalidation call latency.
    Since invalidation functions already exist, this is a wiring/test gap, not an architecture gap.
- Follow-up command: DEADPOOL
- CISSP Domain:
  - Primary: Security Architecture and Engineering
  - Secondary: Security Operations
```

---

### FINDING 6

```
VENOM SECURITY FINDING
- Finding ID: VENOM-TABS-006
- Location: apps/VCSM/src/features/profiles/kinds/vport/model/getVportTabsByType.model.js : line 23–26 (normalizeType)
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: All callers of getVportTabsByType()
- Boundary Violated: None directly — hardening concern
- Contract Violated: None
- Current behavior:
    The normalizeType() function accepts any value and coerces it via String(v).trim().toLowerCase().replace(/_/g, " ").
    If a null, undefined, or empty value is passed, it returns "other" (early return guard on line 24).
    
    There is no validation that the resulting normalized string is a member of VPORT_TYPE_GROUPS
    before the TYPE_TABS lookup. If an unrecognized type string is passed (e.g., a garbage value
    from a corrupted cache or a legacy DB row), it falls through to resolveGroup() which also
    has no membership validation, and ultimately falls back to GROUP_TABS.Other → VPORT_TABS.
    
    This fail-open behavior is intentional and documented (Logan spec, section 6, step 5).
    The security concern is that this function accepts arbitrary string input without validation.
    Any caller that passes a client-influenced string could attempt to inject a type name that
    maps to a specific tab set. However, because getVportTabsByType() is only ever called with
    DB-sourced vportType values (from publicDetails.vportType or readVportTypeDAL), the actual
    attack surface is minimal — the DB constraint vport_type_check limits valid type strings.
- Risk:
    LOW — the function is not called with client-controlled input in the current architecture.
    If the DB constraint is ever relaxed, or if getVportTabsByType() is called from a new
    context with unvalidated input, the fail-open fallback to VPORT_TABS is safe (less tabs, not more).
    The risk would be if a future caller passes a type string that matches an unintended TYPE_TABS key.
- Severity: LOW
- Exploitability: LOW (no current client-controlled input path; DB constraint guards type values)
- Attack Preconditions:
    - DB vport_type_check constraint must be absent or bypassed
    - AND a new caller must pass client-controlled input to getVportTabsByType()
- Blast Radius: Single VPORT
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters:
    Hardening the model to validate input against isValidVportType() (which already exists in
    vportTypes.config.js) would make the function self-defending against future misuse.
    The isValidVportType() utility is already exported and ready to use.
- Recommended mitigation:
    Add an isValidVportType(t) guard in getVportTabsByType() after normalizeType(). If the
    result is not a valid type, log a warning and return VPORT_TABS (same as current fallback).
    This makes the fail-safe behavior explicit and auditable rather than implicit.
- Rationale:
    A model function that accepts arbitrary strings and silently falls back is harder to audit
    than one that explicitly validates and warns on unexpected inputs.
- Follow-up command: Wolverine
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Assessment and Testing
```

---

### FINDING 7

```
VENOM SECURITY FINDING
- Finding ID: VENOM-TABS-007
- Location: apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx : lines 96–105 (effectiveTabs useMemo)
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen
- Boundary Violated: UI-only owner tab gate — isOwner derived from client-side actorId comparison only (deriveVportIsOwner)
- Contract Violated: Actor Ownership Contract
- Current behavior:
    The "owner" tab is injected into effectiveTabs when isOwner is true (line 101–103).
    isOwner is computed by deriveVportIsOwner() — a pure client-side function that compares
    String(viewerActorId) === String(profileActorId).
    
    The VportOwnerView rendered by the owner tab provides navigation to the VPORT dashboard
    and settings. These are navigation links only — clicking them navigates to /actor/[actorId]/dashboard
    and /actor/[actorId]/settings. The dashboard route has a proper ownership gate
    (useVportOwnership → checkVportOwnershipController → actor_owners DB check).
    
    The owner tab view itself does not perform any privileged operations or expose sensitive data.
    It only shows navigation links that any actor could construct manually.
    
    The client-side isOwner gate is therefore cosmetically sufficient for the owner tab —
    the actual protected resources (dashboard, settings) have independent server-verified gates.
    However, the pattern of using a UI-only ownership signal to inject a privileged-labeled tab
    is worth documenting as a trust boundary concern.
- Risk:
    An actor with control over their own viewerActorId (i.e., all authenticated actors) cannot
    spoof profileActorId without intercepting the route resolution. The comparison is between
    two session-held values. If viewerActorId is correctly set from the session (which it is via
    useIdentity()), this comparison is safe.
    
    The residual risk: if viewerActorId is ever client-injectable (e.g., from URL params or
    local storage rather than from session context), the owner tab could be injected for any
    profile. Current code traces confirm viewerActorId comes from useIdentity() (session-bound).
- Severity: LOW
- Exploitability: LOW (viewerActorId is session-bound; no injection vector observed)
- Attack Preconditions:
    - viewerActorId must be injectable from a client-controlled source (not currently possible)
- Blast Radius: Single VPORT (profile being viewed)
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE (downstream dashboard and settings routes have independent DB-verified gates)
- Why it matters:
    The pattern of UI-only ownership gates for tabs that provide access to privileged navigation
    should be documented as a deliberate design choice — not a gap. The Logan spec does not
    currently document that the owner tab gate is UI-only while downstream routes enforce DB-verified
    ownership. This creates an implicit assumption that could be violated in future changes.
- Recommended mitigation:
    Add a comment in VportProfileViewScreen near the effectiveTabs computation explicitly documenting
    that the isOwner check for owner tab injection is UI-only, and that all downstream routes
    accessed via the owner tab perform independent DB-verified ownership checks.
    LOGAN should document this in vcsm.vport.tab-classification.md (section 10 invariants).
- Rationale:
    Explicit documentation of intentional UI-only gates prevents future developers from either
    removing the downstream gates (believing the UI gate is sufficient) or adding unnecessary
    server-side calls to the tab injection path.
- Follow-up command: LOGAN
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Identity and Access Management
```

---

### FINDING 8

```
VENOM SECURITY FINDING
- Finding ID: VENOM-TABS-008
- Location: apps/VCSM/src/features/profiles/config/profileTabs.config.js : line 38 (TAB_FLAGS comment block and flag definition)
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: All VPORT profiles (all types)
- Boundary Violated: None directly — governance concern
- Contract Violated: None
- Current behavior:
    TAB_FLAGS controls global enable/disable of individual tabs across ALL VPORT types and layouts.
    Setting TAB_FLAGS[KEY] = false globally hides the tab everywhere.
    
    The current TAB_FLAGS definition (lines 26–33) explicitly enables SERVICES, RATES, PORTFOLIO,
    and BOOK (all set to true). All other tabs have no flag entry (undefined), which is treated
    as enabled by the makeTabs() logic (undefined => enabled, per the comment at line 208).
    
    This means: any new tab added to the TAB catalog is enabled everywhere by default until
    a developer explicitly sets TAB_FLAGS[KEY] = false. There is no deny-by-default posture.
    
    For example, the TEAM tab has no entry in TAB_FLAGS (it is undefined = enabled). If TEAM
    is added to a layout that shouldn't include it (developer error), it will render immediately
    with no flag guard.
    
    The TAB_FLAGS system is the only global on/off switch short of removing a tab from all layouts.
    There is no per-kind or per-group flag granularity.
- Risk:
    LOW — the real gate for sensitive tabs (TEAM, BOOK, OWNER) is the layout membership.
    TAB_FLAGS are a global kill switch, not a per-VPORT-type gate.
    A sensitive tab being added to the wrong layout is the real risk, not the flag system itself.
    The deny-by-default gap means new tabs require a developer to proactively set a flag or
    ensure they are only in appropriate layouts — there is no automated safety net.
- Severity: LOW
- Exploitability: LOW (requires a developer error to add a sensitive tab to the wrong layout)
- Attack Preconditions:
    - Developer adds a new sensitive tab to a layout without proper review
- Blast Radius: Feed-wide if a sensitive tab is incorrectly included in VPORT_TABS (base fallback)
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters:
    As the tab catalog grows (CONTENT and TEAM were both marked NEW in the current config),
    the deny-by-default gap becomes a governance risk. Teams adding new tabs may not realize
    that undefined flags default to enabled everywhere.
- Recommended mitigation:
    Establish a convention: any new sensitive tab (one that provides write access or exposes
    operational data) should default to TAB_FLAGS[KEY] = false and must be explicitly enabled
    per-layout with a flag set to true. Document this convention in the profileTabs.config.js
    file header comment. Consider adding an SENSITIVE_TAB_KEYS constant that lists tabs requiring
    explicit flag entries.
- Rationale:
    Deny-by-default for sensitive features is a standard secure-by-default principle.
    The current allow-by-default for undefined flags inverts this for new tab additions.
- Follow-up command: LOGAN
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Software Development Security
```

---

### FINDING 9

```
VENOM SECURITY FINDING
- Finding ID: VENOM-TABS-009
- Location: apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx : lines 148–162
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Public Visitor
- Boundary Violated: None directly — observation on comment-asserted security
- Contract Violated: VPORT Lifecycle Contract
- Current behavior:
    Line 152 contains a comment:
    "Deleted and inactive VPORTs are filtered at the DAL query layer — they return null.
    Any non-null publicDetails is guaranteed to be active and non-deleted."
    
    This assertion is correct for publicDetails (fetchVportPublicDetailsByActorId enforces
    .eq("is_deleted", false) .eq("is_active", true)). If publicDetails returns null, the
    UnavailableProfileGate is shown.
    
    However, profile from useProfileView is a separate query path. If profile loads (non-null)
    but publicDetails is null (race: publicDetails loads slightly after profile), the screen
    will not show UnavailableProfileGate (because the check is only on publicDetails === null
    after publicDetails loading is complete — line 154: !publicDetailsLoading && publicDetails === null).
    
    During the window between profile loading and publicDetails loading:
    - displayProfile = profile ?? seedProfile — may show a deleted/inactive actor's display data
      if useProfileView does not apply the same is_deleted/is_active filters
    - effectiveTabs will use profile?.vport_type as fallback since publicDetails is null
    - Tab content will render (lines 211-229 gate on gate.canView && !!profile)
    
    If useProfileView does NOT filter deleted/inactive VPORTs, deleted VPORT data could be
    briefly visible in the profile header and content area before publicDetails resolves to null
    and the gate activates.
- Risk:
    The security guarantee in the comment ("any non-null publicDetails is guaranteed active")
    does not extend to the profile object from useProfileView. VENOM cannot verify whether
    useProfileView applies the same lifecycle filters without reading that hook — which was
    not in the originally provided file list.
    
    If useProfileView does not filter deleted/inactive VPORTs, deleted actor data (name, avatar,
    bio) could be briefly exposed during the loading race.
- Severity: MEDIUM
- Exploitability: LOW (depends on useProfileView behavior; not confirmed as exploitable)
- Attack Preconditions:
    - A deleted or inactive VPORT whose profile row still has data
    - Network timing that causes publicDetails to load after profile
- Blast Radius: Single VPORT — transient exposure of lifecycle-sensitive display data
- Identity Leak Type: None
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: UNVERIFIED — useProfileView RLS enforcement on is_deleted/is_active not audited
- Why it matters:
    The security assertion in the comment is correct for publicDetails but may not hold for
    the profile query path. If both paths don't enforce lifecycle filters consistently, the
    comment creates false confidence about the overall guarantee.
- Recommended mitigation:
    Audit useProfileView to confirm it applies the same is_deleted = false and is_active = true
    filters as fetchVportPublicDetailsByActorId. If it does not, add a secondary lifecycle check
    before rendering displayProfile. This is a DEADPOOL investigation.
- Rationale:
    Security guarantees stated in comments must be enforced by all query paths that contribute
    to the same rendered output, not just the primary path.
- Follow-up command: DEADPOOL
- CISSP Domain:
  - Primary: Asset Security
  - Secondary: Security Architecture and Engineering
```

---

## IDENTITY SURFACE WARNING

```
IDENTITY SURFACE WARNING
Location: VportProfileViewScreen.jsx lines 83-85 and 98-99
Current identity surface: publicDetails?.vportType ?? profile?.vport_type ?? profile?.vportType ?? profile?.category
Expected identity surface: publicDetails?.vportType (DB-sourced, constraint-validated) OR profile?.vport_type (same DB origin)
Risk: profile?.category is an unconstrained legacy field; if writable without vport_type_check enforcement, it can influence tab classification
Suggested correction: Remove profile?.category from the vportType fallback chain; treat as deprecated
```

---

## MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VENOM-TABS-001 | Team member actor IDs exposed to all visitors without RLS audit | RLS + UI | P1 | DB + App | DB |
| VENOM-TABS-002 | profile?.category in vportType fallback — unvalidated legacy field | UI + Documentation | P1 | App + Documentation | LOGAN |
| VENOM-TABS-003 | VportProfileTabContent lacks effectiveTabs membership guard | UI | P2 | App | Wolverine |
| VENOM-TABS-004 | Locksmith TYPE_TABS override undocumented in Logan spec | Documentation | P3 | Documentation | LOGAN |
| VENOM-TABS-005 | Cache invalidation not wired to VPORT type-change write path | Cache + Test Coverage | P2 | App | DEADPOOL |
| VENOM-TABS-006 | getVportTabsByType() accepts arbitrary string without isValidVportType() guard | UI | P3 | App | Wolverine |
| VENOM-TABS-007 | Owner tab UI-only gate not documented as intentional design decision | Documentation | P3 | Documentation | LOGAN |
| VENOM-TABS-008 | TAB_FLAGS deny-by-default gap for new sensitive tabs | Documentation + Controller | P3 | App + Documentation | LOGAN |
| VENOM-TABS-009 | useProfileView lifecycle filter enforcement unverified | Test Coverage + Controller | P2 | App | DEADPOOL |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 2 | VENOM-TABS-007 (owner tab gate documentation), VENOM-TABS-008 (deny-by-default gap) |
| Asset Security | 1 | VENOM-TABS-009 (deleted VPORT data exposure risk) |
| Security Architecture and Engineering | 3 | VENOM-TABS-003 (content router defense-in-depth), VENOM-TABS-005 (cache staleness), VENOM-TABS-009 (secondary) |
| Communication and Network Security | 0 | Not applicable — tab classification is a client-side SPA concern; no network protocol findings |
| Identity and Access Management | 3 | VENOM-TABS-001 (team data exposure), VENOM-TABS-002 (vportType fallback chain), VENOM-TABS-007 (secondary) |
| Security Assessment and Testing | 2 | VENOM-TABS-004 (spec drift), VENOM-TABS-006 (input validation gap) |
| Security Operations | 1 | VENOM-TABS-005 (cache invalidation on type change) |
| Software Development Security | 4 | VENOM-TABS-002 (legacy field in chain), VENOM-TABS-003 (secondary), VENOM-TABS-006 (model input validation), VENOM-TABS-008 (secondary) |

**Uncovered domains:**
- **Communication and Network Security** — Not applicable. Tab classification is entirely client-side SPA state management. There are no network protocol, API route, or Supabase RPC surfaces directly gated by this module's classification logic. Tab data loads are governed by child components audited in separate VENOM passes (booking, gas, team, etc.).

**VENOM Coverage Status:**
- All 9 findings assigned CISSP domains: YES
- CISSP summary table included: YES
- Uncovered domains identified and explained: YES
- Report persisted to approved audit path: YES
- Read-only throughout: YES — no code changes made

---

*VENOM audit complete — 2026-05-27*
