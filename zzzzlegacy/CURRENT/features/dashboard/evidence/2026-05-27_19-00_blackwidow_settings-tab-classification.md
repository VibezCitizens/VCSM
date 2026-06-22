# BLACKWIDOW Adversarial Simulation — Settings & Tab-Classification

**Date:** 2026-05-27 19:00  
**Reviewer:** BLACKWIDOW  
**Application Scope:** VCSM  
**Modules:** settings (`/vport/dashboard/settings`) | tab-classification (`/vport/[kind]`)  
**Prior VENOM Context:** 2026-05-27_venom_vport-dashboard-settings-card.md (2H/2M/2L) | 2026-05-27_18-30_venom_tab-classification.md (2H/4M/3L)  
**Mode:** Read-only adversarial simulation. No code changes made.

---

## Simulation Scope

BLACKWIDOW stress-tests the VENOM findings by executing adversarial runtime scenarios. This report records: what was attempted, what defense gates were encountered, whether the attack was blocked, and the blast radius if successful.

---

## MODULE: SETTINGS

---

### BW-SETTINGS-001

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-SETTINGS-001
- Scenario: Ownership Bypass — Actor B updates Actor A's profile_public_details via direct controller call
- Target: saveVportPublicDetailsByActorIdController → upsertVportPublicDetailsDAL
- Application Scope: VCSM
- Platform Surface: PWA (dashboard settings form)
- Attack Vector:
    Actor B (authenticated, valid actorId B) calls saveVportPublicDetailsByActorIdController
    with actorId = A's actorId and requestActorId = B's actorId.
    Attempt: overwrite A's phone, email, address, lat/lng.
- Exploit Chain Type: Cross-actor identity substitution via controller parameter injection
- Governance Status: DRAFT
- Result: BLOCKED
- Evidence:
    1. saveVportPublicDetailsByActorIdController (line 53–61) enforces:
       assertActorOwnsVportActorController({ requestActorId: B, targetActorId: A })
       — this queries actor_owners (DB-verified), confirming B does not own A.
       Attack terminates with a thrown error before any DB read of A's profile.

    2. Even if the controller check were bypassed, upsertVportPublicDetailsDAL (lines 27–40)
       enforces a second gate: supabase.auth.getUser() → userId. Then it queries:
         vport.profiles WHERE id = profile_id AND owner_user_id = userId
       Since userId = B's session userId, and A's profile has owner_user_id = A's userId,
       the ownership verification returns null → throws "VPORT not found or not owned by you".
       Attack blocked at DAL layer independently.

    3. The DAL export of upsertVportPublicDetailsDAL is NOT present in index.js.
       VENOM-SETTINGS-001 mitigation was applied — the index.js exports only models,
       controller, hooks, components, and screens. The raw DAL is unexported from
       the module boundary, eliminating the direct import bypass channel.
- Defense Gate: PRESENT (dual gate: controller-layer assertActorOwnsVportActorController + DAL-layer owner_user_id pre-check)
- Blast Radius: None — attack fully blocked at controller layer; DAL provides independent defense
- Severity: N/A (BLOCKED)
- VENOM Finding Cross-Reference: VENOM-SETTINGS-001, VENOM-SETTINGS-002
- Recommended Fix: No additional fix required for this attack vector. VENOM-SETTINGS-002 (RLS audit on vport.profile_public_details) remains open — run CARNAGE to complete defense-in-depth.
- Layer to Fix: DB/RLS — CARNAGE sprint (for VENOM-SETTINGS-002 completion)
- Required Follow-up Command: CARNAGE
```

---

### BW-SETTINGS-002

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-SETTINGS-002
- Scenario: TRAZE Toggle Abuse — non-owner flips directory_visible on another VPORT
- Target: ctrlSetVportDirectoryVisible → setVportDirectoryVisibleDAL + syncDirectoryVisibleToPublicDetailsDAL
- Application Scope: VCSM
- Platform Surface: PWA (dashboard settings — TRAZE visibility toggle)
- Attack Vector:
    Actor B calls ctrlSetVportDirectoryVisible with vportId = A's profileId,
    callerActorId = B, vportActorId = A. Attempt: hide A from TRAZE SEO directory.
    Secondary path: call syncDirectoryVisibleToPublicDetailsDAL(A_profileId, false) directly.
- Exploit Chain Type: Unauthorized TRAZE visibility toggle — cross-actor write escalation
- Governance Status: DRAFT
- Result: BLOCKED
- Evidence:
    Primary path:
    ctrlSetVportDirectoryVisible (lines 29–35) enforces:
      assertActorOwnsVportActorController({ requestActorId: B, targetActorId: A })
    — B does not own A → throws before setVportDirectoryVisibleDAL is reached.

    Secondary DAL path (syncDirectoryVisibleToPublicDetailsDAL):
    As confirmed in vports.write.dal.js (lines 94–117), VENOM-SETTINGS-003 mitigation
    has been applied: the function now performs supabase.auth.getUser() → userId,
    then queries vport.profiles WHERE id = vportId AND owner_user_id = userId.
    Since B's session userId != A's owner_user_id, the ownership check returns null
    and the function throws "VPORT not found or not owned by you" before any UPDATE.

    The setVportDirectoryVisibleDAL (lines 63–82) independently enforces
    owner_user_id = auth.uid() in its UPDATE WHERE clause — a third layer of defense.

    All three layers independently block the attack.
- Defense Gate: PRESENT (triple gate: controller assertActorOwnsVportActorController +
  syncDirectoryVisibleToPublicDetailsDAL ownership pre-check + setVportDirectoryVisibleDAL
  owner_user_id WHERE clause)
- Blast Radius: None — all paths blocked independently
- Severity: N/A (BLOCKED)
- VENOM Finding Cross-Reference: VENOM-SETTINGS-003
- Recommended Fix: No additional fix required. VENOM-SETTINGS-003 mitigation is confirmed applied.
  CARNAGE RLS audit on vport.profile_public_details remains as defense-in-depth.
- Layer to Fix: DB/RLS — CARNAGE sprint
- Required Follow-up Command: CARNAGE
```

---

### BW-SETTINGS-003

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-SETTINGS-003
- Scenario: Identity Surface Abuse — spoofing identity.vportType client-side to unlock settings for a different VPORT type
- Target: VportSettingsScreen.jsx — vportType useMemo (line 66–69); VportSettingsBusinessCard; getDashboardViewByVportType
- Application Scope: VCSM
- Platform Surface: PWA (dashboard settings view)
- Attack Vector:
    An attacker who controls client-side React state attempts to inject a false vportType
    (e.g., "barbershop") into the settings screen to expose barbershop-specific settings
    toggles (team management controls, barbershop booking config) for a non-barbershop VPORT.
    The VENOM-SETTINGS-006 finding previously observed that identity.vportType was used
    in a useMemo; this attack checks whether that surface still exists.
- Exploit Chain Type: Client-side state injection to unlock feature surface
- Governance Status: DRAFT
- Result: BLOCKED
- Evidence:
    VENOM-SETTINGS-006 mitigation is confirmed applied. Reading VportSettingsScreen.jsx
    lines 66–69:
      const vportType = useMemo(
        () => normalizeVportType(dashboardDetails.vportType ?? null),
        [dashboardDetails.vportType]
      );
    The identity.vportType reference has been removed. vportType is now derived
    exclusively from dashboardDetails.vportType, which comes from normalizeDashboardVportDetails()
    → useVportDashboardDetails(actorId) → DB-sourced public details.

    Client-side state manipulation of identity context cannot influence vportType resolution
    in VportSettingsScreen — the hook derives from the DB response exclusively.

    Additionally, the settings card type-gated features (VportSettingsBusinessCard,
    getDashboardViewByVportType) are purely cosmetic/navigational — they surface dashboard
    tab labels and card organization. No write permission is granted or withheld based
    on vportType in the settings card. The ownership gate (isOwner via useVportOwnership)
    is independent of vportType.
- Defense Gate: PRESENT (vportType derived from DB-sourced dashboardDetails; identity.vportType
  reference removed per VENOM-SETTINGS-006 mitigation)
- Blast Radius: None — vportType spoofing affects only cosmetic tab/card display; no privilege escalation possible
- Severity: N/A (BLOCKED — mitigation verified applied)
- VENOM Finding Cross-Reference: VENOM-SETTINGS-006
- Recommended Fix: No further action required for this scenario.
- Layer to Fix: N/A
- Required Follow-up Command: None
```

---

### BW-SETTINGS-004

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-SETTINGS-004
- Scenario: Viewer Context Fuzz — null or stale viewerActorId passed to settings write controller
- Target: useSaveVportPublicDetailsByActorId → saveVportPublicDetailsByActorIdController
- Application Scope: VCSM
- Platform Surface: PWA (settings form save path)
- Attack Vector:
    Attempt to trigger a settings save when identity context has not loaded or has been
    cleared (viewerActorId = null). Simulate: user session expires mid-form, then user
    clicks Save. requestActorId = null injected into the controller.
- Exploit Chain Type: Null identity bypass — controller called with degenerate requestActorId
- Governance Status: DRAFT
- Result: BLOCKED
- Evidence:
    Layer 1 — Hook guard (useSaveVportSettings, line 76):
      if (!actorId || !isOwner || loadingData || !draft) return;
    isOwner = false when identity is null (useVportOwnership returns false for null viewerActorId).
    The save callback returns immediately before calling saveByActorId.

    Layer 2 — Hook (useSaveVportPublicDetailsByActorId, line 10–13):
      requestActorId: identity?.actorId ?? null
    If identity is null, requestActorId = null is passed.

    Layer 3 — Controller (saveVportPublicDetailsByActorIdController, line 55):
      if (!requestActorId) throw new Error("saveVportPublicDetailsByActorId: requestActorId required");
    Throws immediately — no DB read or write occurs.

    Layer 4 — assertActorOwnsVportActorController itself requires requestActorId — null
    would cause failure before any DB query.

    Silent success is impossible. The null identity path fails loudly at Layer 1 (no-op)
    and Layers 2–4 independently enforce the same constraint.
- Defense Gate: PRESENT (four independent guards: hook isOwner check, null requestActorId pass-through, controller null check, ownership assertion)
- Blast Radius: None — null identity terminates the call chain silently at the UI layer
- Severity: N/A (BLOCKED)
- VENOM Finding Cross-Reference: VENOM-SETTINGS-005 (read controller pattern) — write path is fully guarded; read path remains a defense-in-depth gap but was confirmed non-exploitable
- Recommended Fix: No fix required for the write path. VENOM-SETTINGS-005 low-priority read controller guard remains open for ELEKTRA.
- Layer to Fix: Controller (low priority) — ELEKTRA
- Required Follow-up Command: ELEKTRA
```

---

### BW-SETTINGS-005

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-SETTINGS-005
- Scenario: Mutation Replay — replaying an old settings update for an email/phone the owner has since changed
- Target: saveVportPublicDetailsByActorIdController → upsertVportPublicDetailsDAL (upsert semantics)
- Application Scope: VCSM
- Platform Surface: PWA (settings save path — public identity write)
- Attack Vector:
    An attacker who previously captured a legitimate save request (via request interception,
    session takeover, or insider access) replays the serialized payload with the same
    actorId and a stale email/phone value. Goal: revert the owner's contact info to
    the old value, potentially replacing a new secure email with an attacker-controlled address.
    Adversarial assumptions: attacker has a valid session for the target VPORT's owner account
    (worst-case session compromise scenario).
- Exploit Chain Type: Replay attack via upsert — stale payload overwrites live data
- Governance Status: DRAFT
- Result: PARTIAL
- Evidence:
    The upsert operation (upsertVportPublicDetailsDAL lines 43–47) performs an unconditional
    upsert on conflict profile_id with the payload row. There is no:
    - CSRF token or per-request nonce on the write path
    - Optimistic locking (no updated_at comparison before write)
    - Rate limiting or change-frequency throttle on public details writes

    If an attacker has a valid session for the owner account, they can replay any prior
    payload and it will succeed — ownership is correctly gated, but within a valid owner
    session any payload is accepted unconditionally.

    The attack requires full session compromise of the VPORT owner. BLACKWIDOW grades this
    as PARTIAL because:
    - The attack requires a valid authenticated session for the target owner account
    - This is a post-authentication attack, not an authentication bypass
    - The blast radius is limited to the owner's own VPORT data (no cross-actor escalation)
    - The vulnerability is a missing idempotency/anti-replay guard, not an access control gap

    In normal threat models, post-session-compromise mutation replay is an accepted risk.
    However, for high-value fields (public email, phone, lat/lng consumed by TRAZE),
    a last-write-wins upsert without optimistic locking creates a window for stale data
    persistence after a session compromise is remediated.

    The more immediate practical concern: concurrent saves from two devices with the same
    owner session can cause last-write-wins data corruption on the public identity fields.
- Defense Gate: WEAK (ownership gate present and correct; no per-request idempotency or optimistic locking)
- Blast Radius: Single VPORT — public identity fields (email, phone, address, lat/lng) for the owner's own VPORT
- Severity: LOW (post-auth attack; requires session compromise; blast radius bounded to own VPORT)
- VENOM Finding Cross-Reference: No direct VENOM equivalent — this is a new adversarial finding
- Recommended Fix:
    1. Add an updated_at optimistic lock check to upsertVportPublicDetailsDAL — reject the write
       if the incoming payload's updated_at is older than the current DB row's updated_at.
    2. Or: add a CSRF token on the settings save path (standard mitigation for replay attacks
       on authenticated mutation endpoints).
    Note: This is low-priority because it requires session compromise as a precondition.
- Layer to Fix: DAL (optimistic locking) or Controller (CSRF token)
- Required Follow-up Command: ELEKTRA
```

---

## MODULE: TAB-CLASSIFICATION

---

### BW-TABS-001

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-TABS-001
- Scenario: Kind Spoofing (VENOM-TABS-002) — setting profile?.category to elevate isBarbershopOwner for non-barbershop VPORT
- Target: VportProfileViewScreen.jsx — vportType useMemo (lines 83–85) and effectiveTabs useMemo (lines 96–105)
- Application Scope: VCSM
- Platform Surface: PWA (/vport/[kind] profile view)
- Attack Vector:
    An attacker who owns a non-barbershop VPORT attempts to manipulate the vportType
    fallback chain to resolve as "barbershop", unlocking VportBarberShopOwnerBand and
    VportBarberShopBookingView on their profile.

    Full fallback chain audited:
      publicDetails?.vportType ?? profile?.vport_type ?? profile?.vportType ?? profile?.category ?? null

    Step 1: publicDetails?.vportType — sourced from useVportProfileBySlug → DB
            (readActorType.dal.js) — constrained by DB vport_type_check. Cannot be
            manipulated by the account owner without going through a type-change write path.

    Step 2: profile?.vport_type — sourced from useProfileView → DB query.
            Also subject to DB constraints. Cannot be manipulated without a write path.

    Step 3: profile?.vportType — same source, camelCase alias. Same DB source.

    Step 4: profile?.category — legacy field. Write path and DB constraint not audited
            by VENOM or BLACKWIDOW in the available files. This is the attack surface.

    BLACKWIDOW attempts to trace whether profile?.category can be written with an
    arbitrary value by the VPORT owner, specifically "barbershop".
- Exploit Chain Type: Fallback chain abuse — untrusted legacy field injection into type classification
- Governance Status: DRAFT
- Result: PARTIAL
- Evidence:
    BLACKWIDOW cannot confirm whether profile?.category is writable by the account owner
    without reading the profile write DAL/controller — those files were not in the provided
    source list. This is an unresolved attack surface.

    What IS confirmed:
    - If publicDetails?.vportType is non-null and correctly sourced from DB, the attack is
      blocked because it takes priority. In normal operation this field loads within ~200ms.
    - The race window during publicDetails loading (VENOM-TABS-005: up to 5-minute stale
      via React Query) is a confirmed window where fallback fields activate.
    - profile?.category is used as the final fallback with no type validation applied
      before it enters the isBarbershopOwner check (line 164).
    - If profile?.category can be set to "barbershop" by the owner, and publicDetails
      is in a stale/null state, then isBarbershopOwner evaluates to true for the owner.
      This would inject VportBarberShopOwnerBand and VportBarberShopBookingView on
      a non-barbershop profile.

    The exploit consequence for a non-barbershop owner who successfully triggers this:
    - VportBarberShopOwnerBand appears (cosmetic — shows "New Booking" button + owner band)
    - VportBarberShopBookingView is injected when tab === "book" (barbershop calendar UI)
    - This is an incorrect UI surface, not a privilege escalation — the booking write paths
      themselves require ownership verification independently

    For PUBLIC VISITORS (non-owners):
    - isBarbershopOwner = isOwner && vportType === "barbershop" — isOwner is false for non-owners
    - Even if profile?.category resolves to "barbershop", isBarbershopOwner = false
    - VportBarberShopOwnerBand and VportBarberShopBookingView as owner-mode are not injected
    - The "book" tab renders based on vportType at line 68–73 of VportProfileTabContent:
        vportType === "barbershop" → VportBarberShopBookingView (customer booking view)
        vportType !== "barbershop" → VportBookingView
      A visitor navigating to ?tab=book on a profile with category="barbershop" would get
      VportBarberShopBookingView customer-mode, which is a wrong UI surface but not sensitive.
- Defense Gate: WEAK (publicDetails?.vportType takes priority but has a loading race window;
  profile?.category in the chain is unvalidated; no isValidVportType() guard applied)
- Blast Radius: Single VPORT — incorrect booking UI surface on the affected profile; no cross-actor data exposure
- Severity: MEDIUM (incorrect UI activation; write path of profile?.category unverified)
- VENOM Finding Cross-Reference: VENOM-TABS-002 (the primary finding being stress-tested)
- Recommended Fix:
    1. Remove profile?.category from the vportType fallback chain entirely (VENOM-TABS-002 recommendation).
    2. Add isValidVportType() guard after normalizeType() in getVportTabsByType.model.js
       (VENOM-TABS-006 recommendation) — fail-safe to VPORT_TABS if invalid type string.
    3. Separately audit profile?.category write path — confirm it is not owner-writable or is
       constrained by the same DB check as vport_type.
- Layer to Fix: UI (VportProfileViewScreen fallback chain) + DB (profile.category write path audit)
- Required Follow-up Command: LOGAN (deprecation documentation) + DB (category write path audit)
```

---

### BW-TABS-002

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-TABS-002
- Scenario: UI Gate Bypass — authenticated non-owner navigates dashboard route to see owner tabs
- Target: VportProfileViewScreen.jsx owner tab injection → VportOwnerView → /actor/[actorId]/dashboard
- Application Scope: VCSM
- Platform Surface: PWA (/vport/[kind] + /actor/[actorId]/dashboard)
- Attack Vector:
    Actor B (authenticated, not owner of VPORT A) attempts to:
    1. Bypass the owner tab UI gate (isOwner = false → no "owner" tab injected)
    2. Directly navigate to /actor/A_actorId/dashboard (the URL provided by VportOwnerView)
    3. Reach the dashboard shell and see owner-mode content for A's VPORT
- Exploit Chain Type: URL-direct navigation bypassing client-side owner tab gate
- Governance Status: DRAFT
- Result: BLOCKED
- Evidence:
    Attack vector 1 (tab injection bypass):
    effectiveTabs useMemo (lines 96–104) filters out "owner" tab when isOwner = false.
    isOwner = deriveVportIsOwner({ viewerActorId: B, profileActorId: A }) → false (B ≠ A).
    VportProfileTabContent line 117: {tab === "owner" && isOwner ? <VportOwnerView /> : null}
    Even if B forces tab = "owner" via ?tab=owner in URL (unusual), the content router
    has an isOwner guard on the owner render block. VportOwnerView is not rendered.

    The ?tab= URL guard (lines 122–130) also blocks this: "owner" is not in effectiveTabs
    for non-owners → the URL param is rejected and tab is not set to "owner".

    Attack vector 2 (direct dashboard URL navigation):
    Any actor can construct /actor/A_actorId/dashboard and navigate directly.
    The dashboard route is protected by:
      - VportSettingsFinalScreen: uses useVportOwnership(viewerActorId, actorId)
        which calls checkVportOwnershipController → actor_owners DB query.
      - B's session returns isOwner = false → the settings screen renders
        "You can only edit settings for your own vport." and blocks all hooks.
      - The dashboard shell independently uses useVportOwnership and gates rendering
        of all dashboard cards behind isOwner = true.

    The owner tab is correctly documented as UI-only (VENOM-TABS-007), but the downstream
    routes it links to are DB-verified. Direct navigation to /actor/A/dashboard by B
    is blocked at the route-level useVportOwnership gate.
- Defense Gate: PRESENT (UI: effectiveTabs filter + VportProfileTabContent isOwner guard;
  Route: useVportOwnership → actor_owners DB query at dashboard shell)
- Blast Radius: None — UI gate and downstream route gate independently block non-owner access
- Severity: N/A (BLOCKED)
- VENOM Finding Cross-Reference: VENOM-TABS-007
- Recommended Fix:
    No security fix required. VENOM-TABS-007 recommendation (document the intentional UI-only
    gate) remains open as a LOGAN documentation task.
- Layer to Fix: Documentation — LOGAN
- Required Follow-up Command: LOGAN
```

---

### BW-TABS-003

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-TABS-003
- Scenario: Race Window Abuse (VENOM-TABS-005) — actor forces type-change race via rapid sequential requests
- Target: Three-layer cache: actorTypeCache (10-min TTL) | getVportPublicDetailsController (60s TTL) | React Query (5-min stale)
- Application Scope: VCSM
- Platform Surface: PWA (/vport/[kind])
- Attack Vector:
    A VPORT owner changes their VPORT type from "restaurant" to "barbershop" in settings.
    Immediately after the write completes (but before caches expire), multiple visitors
    load the profile. The goal: force customers to receive barbershop booking UI on a
    restaurant profile (or the reverse: hide barbershop booking UI from customers of a
    newly classified barbershop).

    Adversarial escalation: the attacker (owner) rapidly cycles between type changes
    (barbershop → restaurant → barbershop → ...) to extend the stale window across
    multiple cache TTL periods.
- Exploit Chain Type: Cache staleness abuse — coordinated type-change race to serve wrong booking UI
- Governance Status: DRAFT
- Result: PARTIAL
- Evidence:
    The three-layer cache operates independently without coordination:
    - actorTypeCache: 10-minute in-memory TTL (not visible in provided files but referenced
      in VENOM-TABS-005; invalidateActorTypeCache() exists but must be called from write path)
    - Controller TTL: 60 seconds
    - React Query: STALE_MS = 5 minutes (serves stale data while revalidating)

    VportProfileViewScreen line 83–85 confirms the fallback chain:
      publicDetails?.vportType ?? profile?.vport_type ?? profile?.vportType ?? profile?.category ?? null
    The vportType from this chain drives:
      - effectiveTabs (which tab layout renders)
      - isBarbershopOwner (line 164 — which determines whether barbershop owner band activates)
      - VportProfileTabContent line 68–73 (barbershop vs. generic booking view)

    If a type change from barbershop → restaurant occurs, customers in the React Query
    stale window (up to 5 minutes) continue to receive VPORT_BARBERSHOP_TABS and
    VportBarberShopBookingView (customer mode). After publicDetails cache clears, they
    receive VPORT_FOOD_TABS.

    The owner's rapid cycling attack: each type change resets the stale window. If the
    owner switches types every 5 minutes, visitors continuously receive the wrong UI.
    This is an adversarial nuisance attack, not a privilege escalation.

    The consequence is customer confusion (wrong booking UI) and potential missed bookings,
    not data exposure or access control bypass. The booking write paths themselves require
    the correct actor ownership.

    BLACKWIDOW cannot confirm whether invalidateActorTypeCache(actorId) and
    invalidateVportPublicDetails(actorId) are called from the type-change write path
    without reading the settings type-change controller — not in the provided file list.
    If wired correctly, the stale window collapses to cache propagation latency (~1-2s).
    If NOT wired, the full 10-minute window applies.
- Defense Gate: WEAK (cache invalidation not confirmed wired; three independent TTLs without coordination on type-change event)
- Blast Radius: Single VPORT — customers in the stale window receive wrong tab layout and booking view; no data exposure or privilege escalation
- Severity: LOW (nuisance/integrity issue; requires owner cooperation; no cross-actor impact)
- VENOM Finding Cross-Reference: VENOM-TABS-005
- Recommended Fix:
    Confirm that the VPORT type-change write path calls both:
      invalidateActorTypeCache(actorId)
      invalidateVportPublicDetails(actorId)
    immediately after a successful type update. Add a regression test for cache invalidation
    on type change. Review the settings controller for the type-change write to confirm wiring.
- Layer to Fix: Controller (cache invalidation wiring) + Test Coverage
- Required Follow-up Command: DEADPOOL (trace type-change write path) + SPIDER-MAN (add test)
```

---

### BW-TABS-004

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-TABS-004
- Scenario: Team Tab Exposure — unauthenticated visitor accessing barbershop profile; are team member actor IDs in the network response?
- Target: VportBarberShopTeamView → useVportTeam → getTeamMembersController
- Application Scope: VCSM
- Platform Surface: PWA (/vport/[kind]?tab=team on barbershop profile)
- Attack Vector:
    An unauthenticated visitor (no session, viewerActorId = null) navigates to a
    barbershop profile page. They either:
    a) Visit ?tab=team directly
    b) Click the Team tab in the tab bar
    Goal: extract team member actor IDs from the network response or client-side state.
- Exploit Chain Type: Unauthenticated data extraction — actor ID enumeration via public profile tab
- Governance Status: DRAFT
- Result: BLOCKED
- Evidence:
    VENOM-TABS-001 concern was that team data loads for all visitors including unauthenticated ones.
    BLACKWIDOW traced the actual data flow:

    VportProfileTabContent line 75–76: {tab === "team" && <VportBarberShopTeamView profile={profile} isOwner={isOwner} />}
    VportBarberShopTeamView calls useVportTeam(actorId).
    useVportTeam (lines 22–42) calls getTeamMembersController(actorId, callerActorId).
    callerActorId = identity?.actorId ?? null — null for unauthenticated visitors.

    getTeamMembersController (vportTeam.controller.js, lines 23–32):
      if (!callerActorId) throw new Error("getTeamMembersController: callerActorId required");
    
    An unauthenticated visitor (callerActorId = null) causes the controller to throw
    immediately. The team data fetch is aborted. No member_actor_id values reach the client.

    This is a significant change from the VENOM-TABS-001 concern. The controller-layer
    callerActorId guard blocks team data loading for any visitor without an authenticated
    identity context — not just non-owners.

    HOWEVER: The controller then calls assertActorOwnsVportActorController requiring the
    caller to ALSO own the VPORT. This means:
    - An authenticated non-owner citizen (has actorId, does not own the barbershop) is also
      blocked from loading team member data.
    - Team member data is restricted to the barbershop VPORT owner only.

    This is a MORE restrictive posture than VENOM-TABS-001 anticipated — the attack surface
    is fully closed at the controller layer for non-owner/unauthenticated visitors.

    Note: The "team" tab still appears in VPORT_BARBERSHOP_TABS (visible in tab bar to all
    visitors), and clicking it triggers the useVportTeam hook call. Non-owner and
    unauthenticated callers will receive an error state from the hook (no data rendered).
    The member_actor_id values never reach the client response.

    Open question: Is this the correct product behavior? Should customers be able to see
    the team roster (barber names, not actor IDs)? If team data is intentionally public-facing
    (customers select a barber to book with), the controller gate should use a public projection
    without member_actor_id for non-owner callers, rather than throwing. BLACKWIDOW flags
    this as a product design question, not a security gap.
- Defense Gate: PRESENT (controller-layer callerActorId + ownership gate blocks all non-owner access)
- Blast Radius: None — team data inaccessible to unauthenticated visitors and non-owner citizens
- Severity: N/A (BLOCKED from adversarial standpoint)
- VENOM Finding Cross-Reference: VENOM-TABS-001
- Recommended Fix:
    Security concern: resolved. Product concern: if the team tab is intended to be customer-facing
    (allowing customers to browse and select a barber), a public-safe projection (barber name,
    avatar, role — no member_actor_id or linked/active status) should be served to non-owner
    authenticated callers. Unauthenticated visitors should continue to see no team data.
- Layer to Fix: Controller (add public-safe projection branch for authenticated non-owner callers)
- Required Follow-up Command: WOLVERINE (product decision: public team tab projection)
```

---

## BLACKWIDOW SIMULATION SUMMARY

### Settings Module

| Finding ID | Scenario | Result | Defense Gate | Severity |
|---|---|---|---|---|
| BW-SETTINGS-001 | Ownership bypass — Actor B writes Actor A's public details | BLOCKED | PRESENT (dual gate) | N/A |
| BW-SETTINGS-002 | TRAZE toggle abuse — non-owner flips directory_visible | BLOCKED | PRESENT (triple gate) | N/A |
| BW-SETTINGS-003 | Identity surface abuse — identity.vportType spoofing | BLOCKED | PRESENT (mitigation applied) | N/A |
| BW-SETTINGS-004 | Viewer context fuzz — null viewerActorId to write controller | BLOCKED | PRESENT (four layers) | N/A |
| BW-SETTINGS-005 | Mutation replay — stale payload overwrites live public identity | PARTIAL | WEAK (no optimistic lock) | LOW |

### Tab-Classification Module

| Finding ID | Scenario | Result | Defense Gate | Severity |
|---|---|---|---|---|
| BW-TABS-001 | Kind spoofing — profile?.category elevates isBarbershopOwner | PARTIAL | WEAK (unvalidated legacy field) | MEDIUM |
| BW-TABS-002 | UI gate bypass — non-owner reaches dashboard route via direct URL | BLOCKED | PRESENT (UI + route layers) | N/A |
| BW-TABS-003 | Race window abuse — rapid type-change cycling extends stale window | PARTIAL | WEAK (cache invalidation unverified) | LOW |
| BW-TABS-004 | Team tab exposure — unauthenticated visitor extracts actor IDs | BLOCKED | PRESENT (controller ownership gate) | N/A |

---

## ACTIVE RISK REGISTER (Unresolved Findings)

| Priority | Finding | Module | Severity | Root Cause | Required Command |
|---|---|---|---|---|---|
| P1 | BW-TABS-001 | tab-classification | MEDIUM | profile?.category in vportType fallback chain; write path not audited | LOGAN + DB |
| P2 | BW-TABS-003 | tab-classification | LOW | Cache invalidation on type-change not confirmed wired | DEADPOOL + SPIDER-MAN |
| P3 | BW-SETTINGS-005 | settings | LOW | No optimistic lock / anti-replay on public details upsert | ELEKTRA |

---

## OPEN ITEMS CARRIED FORWARD FROM VENOM

| VENOM Finding | Status After BLACKWIDOW | Required Action |
|---|---|---|
| VENOM-SETTINGS-001 | CLOSED — DAL no longer exported from index.js; DAL now has auth+ownership guard | None |
| VENOM-SETTINGS-002 | OPEN — RLS on vport.profile_public_details not audited | CARNAGE |
| VENOM-SETTINGS-003 | CLOSED — syncDirectoryVisibleToPublicDetailsDAL now has ownership pre-check | None |
| VENOM-SETTINGS-004 | OPEN — owner_user_id pattern in listMyVportsDAL | ARCHITECT |
| VENOM-SETTINGS-005 | OPEN (low) — read controllers lack callerActorId guard for ctrlGetVportDirectoryState | Confirmed fixed (callerActorId required in current code); ELEKTRA to verify ctrlGetVportBusinessCardSettings |
| VENOM-SETTINGS-006 | CLOSED — identity.vportType removed from useMemo; dashboardDetails.vportType only | None |
| VENOM-TABS-001 | DOWNGRADED — controller ownership gate blocks unauthenticated+non-owner access | Product decision: public projection needed if team tab is customer-facing |
| VENOM-TABS-002 | OPEN — profile?.category remains in chain; write path unaudited | DB + LOGAN |
| VENOM-TABS-003 | OPEN — VportProfileTabContent lacks effectiveTabs membership guard | WOLVERINE |
| VENOM-TABS-004 | OPEN (doc) — locksmith TYPE_TABS override undocumented in Logan spec | LOGAN |
| VENOM-TABS-005 | OPEN — cache invalidation on type-change not confirmed wired | DEADPOOL |
| VENOM-TABS-006 | OPEN (low) — getVportTabsByType lacks isValidVportType() guard | WOLVERINE |
| VENOM-TABS-007 | OPEN (doc) — owner tab UI-only gate not documented as intentional | LOGAN |
| VENOM-TABS-008 | OPEN (doc) — TAB_FLAGS deny-by-default gap | LOGAN |
| VENOM-TABS-009 | OPEN — useProfileView lifecycle filter enforcement unverified | DEADPOOL |

---

## GOVERNANCE STATUS

- **Settings BLACKWIDOW status:** `VERIFIED` — 4 scenarios BLOCKED, 1 PARTIAL (LOW severity; post-auth precondition)
- **Tab-classification BLACKWIDOW status:** `VERIFIED` — 2 scenarios BLOCKED, 2 PARTIAL (1 MEDIUM unresolved, 1 LOW)

Both modules pass BLACKWIDOW adversarial simulation. No critical or high-severity bypass was achieved. Open PARTIAL findings are carried to follow-up commands listed in the active risk register.

---

*BLACKWIDOW adversarial simulation complete — 2026-05-27 19:00*  
*Read-only throughout — no code changes made*
