# VENOM Security Review — VPORT Dashboard Cards (All 17)

**Date:** 2026-05-23
**Reviewer:** VENOM
**Application Scope:** VCSM
**Root Module:** `apps/VCSM/src/features/dashboard/vport/`
**Entry Route Family:** `/actor/:actorId/dashboard/*`
**Governance Status:** DRAFT

---

## VENOM TARGET

Feature / Route / Engine: VPORT Dashboard — all 17 cards as independent security modules
Application Scope: VCSM
Reason for review: Adversarial simulation from BLACKWIDOW identified HIGH findings; full trust-boundary audit of each card surface requested.
Primary trust boundary: Authenticated VPORT owner via `actor_owners` table — `assertActorOwnsVportActorController`

---

## Shared Context (applies to all cards)

**Route param `:actorId`:** Raw UUID from `vc.actors.id`. Every dashboard route exposes this UUID in the browser URL bar for any user who opens a dashboard card.

**Ownership gate architecture:**
- STRONG: `assertActorOwnsVportActorController` → verifies `actor_owners`, checks caller not void, checks caller is user-kind
- WEAK: local string comparison `callerActorId !== ownerActorId` (present in leads card only)
- ABSENT: controller accepts actorId with no ownership check (present in schedule/loadDaySchedule, directory visibility)
- DAL-layer: DAL uses `auth.getUser()` + `.eq("owner_user_id", userId)` (present in settings write DAL)

**RLS status across all cards:** UNVERIFIED — no Supabase policy source was reviewed. All database-level protection is marked UNVERIFIED unless a DAL was observed to re-authenticate via `auth.getUser()`.

**Supabase clients used:**
- `supabase` (anon client, `supabaseClient.js`) — used in `vportPublicDetails.write.dal.js`, `vports.write.dal.js`, `vports.read.dal.js`
- `vportSchema` (`vportClient.js`) — used in most vport DAL files. Purpose and privilege level of this client is UNVERIFIED — requires DB audit to confirm it is also the anon client and not a service-role variant.

---

# CARD 1 — QR (Menu QR)

## 1. Module Identity

| Field | Value |
|---|---|
| Card key | `qr` |
| Card title | Menu QR |
| Route target | `/profile/${slug}/menu/qr` or **`/actor/${actorId}/menu/qr`** (UUID fallback) |
| Screen entry | Navigates away from dashboard; opens public VportActorMenuQrScreen |
| Controllers used | None in dashboard — QR page is a public menu route |
| Hooks used | `useVportPublicDetails` (reads slug) |
| DAL files | None directly in this card |
| Tables/views | None mutated — reads public VPORT details only |
| External adapters | `profiles.adapter` (via `useVportPublicDetails`) |

## 2. Trust Boundary Map

- Who can open: Any authenticated VPORT owner (isOwner UI gate)
- Who can read data: The QR screen target is a **public route** — any visitor can view it
- Who can mutate: No mutations in QR card itself
- Caller-controlled IDs: `actorId` from route param (UUID)
- Revalidation: None needed (read-only navigation)
- Route actorId: **Raw UUID** in fallback path when no slug
- Notification links: N/A — this card generates no notifications

## 3. RLS Review

No DB mutations. QR target is a public route. No RLS concern on this card surface.

## 4. Supabase Client Boundary

No direct Supabase calls in this card's navigation handler.

## 5. Controller Authorization

No mutations. No authorization required for QR link generation.

## 6. State Integrity

N/A — read-only.

## 7. Data Exposure Check

`openQr` handler (VportDashboardScreen.jsx line 53-54):
```js
if (slug) navigate(`/profile/${slug}/menu/qr`);
else navigate(`/actor/${actorId}/menu/qr`);
```
When slug is unavailable, the raw actorId UUID is used in the navigation URL. This URL is then rendered in the QR code payload and visible in the browser address bar.

## 8. Abuse-Case Tests

| Test | Result |
|---|---|
| Non-owner opens QR from public menu | Allowed — QR menu is intentionally public |
| UUID in QR URL when no slug | RAW UUID EXPOSED in navigated route and potential QR payload |

---

**VENOM SECURITY FINDING VPD-V-001**
- Finding ID: VPD-V-001
- Location: `VportDashboardScreen.jsx` line 54 — `openQr` handler
- Application Scope: VCSM
- Platform Surface: PWA · Supabase Table/View
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Identity surface — raw UUID used in public-facing URL
- Contract Violated: Public Identity Surface Contract
- Current behavior: When a VPORT actor has no slug, the QR navigation URL falls back to `/actor/${actorId}/menu/qr` where `actorId` is a UUID. This URL is navigated-to and may be embedded in QR code generation.
- Risk: Raw UUID exposed in browser address bar and potentially in QR payload. Enables actor correlation.
- Severity: MEDIUM
- Exploitability: MEDIUM — requires that the VPORT has no slug configured; only affects VPORT onboarding edge case
- Attack Preconditions: VPORT actor without a configured slug
- Blast Radius: Single VPORT · Actor correlation risk
- Identity Leak Type: Internal UUID exposure · Actor correlation
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Raw UUIDs in public-facing URLs violate the platform's identity surface contract and enable enumeration/correlation of `vc.actors.id` values.
- Recommended mitigation: Require slug before allowing QR generation. If slug unavailable, show "Set a username first" prompt instead of navigating with UUID.
- Rationale: Slug should always be the canonical public identifier.
- Follow-up command: Wolverine
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Asset Security

---

# CARD 2 — Flyer (Printable Flyer)

## 1. Module Identity

| Field | Value |
|---|---|
| Card key | `flyer` |
| Card title | Printable Flyer |
| Route target | `/actor/${actorId}/menu/flyer` (UUID in URL) |
| Screen entry | VportActorMenuFlyerScreen (public flyer view) |
| Constraint | Desktop-only lock (client-side) |
| Controllers used | None in card — navigates to public flyer view |
| DAL files | None in card |
| Tables/views | Public menu / flyer data |

## 2. Trust Boundary Map

- Flyer URL uses raw `actorId` UUID — no slug fallback attempt
- `getLocked: ({ isDesktop }) => !isDesktop` — client-side lock only; mobile user who navigates to URL directly can still access the route
- Flyer route is a public display route

## 7. Data Exposure Check

`openFlyer` (line 57-60):
```js
navigate(`/actor/${actorId}/menu/flyer${query}`);
```
Raw UUID always used — no slug attempt.

---

**VENOM SECURITY FINDING VPD-V-002**
- Finding ID: VPD-V-002
- Location: `VportDashboardScreen.jsx` line 57-60 — `openFlyer` handler
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Public Identity Surface Contract
- Contract Violated: Public Identity Surface Contract
- Current behavior: Flyer URL always uses raw `actorId` UUID — `/actor/${actorId}/menu/flyer`
- Risk: Raw UUID in flyer URL. Flyer may be printed, shared, or indexed — UUID becomes persistent public identifier.
- Severity: MEDIUM
- Exploitability: LOW — requires owner to print/share the flyer
- Attack Preconditions: Owner navigates to flyer page and shares the URL
- Blast Radius: Single VPORT · Persistent UUID exposure via printed material
- Identity Leak Type: Internal UUID exposure
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: A printed flyer embedding `/actor/<UUID>/menu/flyer` creates a permanent offline-to-online UUID leak channel.
- Recommended mitigation: Use slug in flyer URL. Require slug before generating printable flyer.
- Rationale: Printed materials are permanent; UUID should never appear on them.
- Follow-up command: Wolverine
- CISSP Domain:
  - Primary: Asset Security
  - Secondary: Identity and Access Management

**VENOM SECURITY FINDING VPD-V-003**
- Finding ID: VPD-V-003
- Location: `buildDashboardCards.model.js` line 15 — `getLocked: ({ isDesktop }) => !isDesktop`
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: None (UI-only lock as intended)
- Contract Violated: None
- Current behavior: Flyer card is locked on mobile via `locked = true`. However, the underlying route `/actor/:actorId/menu/flyer` remains accessible via direct URL navigation on mobile.
- Risk: Low — the flyer display route is a public presentation route with no mutations; mobile access is a UX inconvenience, not a security issue.
- Severity: INFO
- Exploitability: LOW
- Attack Preconditions: Mobile user knows the URL
- Blast Radius: Single VPORT
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Client-side locks document "not recommended" UX paths but cannot enforce security constraints.
- Recommended mitigation: Document intent. If mobile flyer view is truly unsupported, handle gracefully at the route level rather than relying on card lock.
- Follow-up command: LOGAN (documentation)
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: None

---

# CARD 3 — Flyer Edit

## 1. Module Identity

| Field | Value |
|---|---|
| Card key | `flyer_edit` |
| Card title | Edit Flyer |
| Route target | `/actor/${actorId}/menu/flyer/edit` |
| Screen entry | `VportActorMenuFlyerEditorScreen` |
| Constraint | Desktop-only lock (client-side) |
| Controllers used | (flyer builder feature — not reviewed in this session) |

## 2. Trust Boundary Map

- UUID always in URL
- Flyer editor presumably requires ownership — not verified in this session
- Desktop lock is client-side only

## 7. Data Exposure

`openFlyerEditor` (line 62): `navigate(`/actor/${actorId}/menu/flyer/edit`)` — raw UUID.

---

**VENOM SECURITY FINDING VPD-V-004**
- Finding ID: VPD-V-004
- Location: `VportDashboardScreen.jsx` line 62 — `openFlyerEditor`
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Public Identity Surface Contract
- Contract Violated: Public Identity Surface Contract
- Current behavior: Flyer editor route uses raw UUID: `/actor/${actorId}/menu/flyer/edit`
- Risk: UUID exposed in URL of an owner-only editing tool.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions: Owner opens flyer editor
- Blast Radius: Single VPORT
- Identity Leak Type: Internal UUID exposure
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Even owner-only routes should use slugs to maintain identity surface consistency.
- Recommended mitigation: Use slug-based route for flyer editor.
- Follow-up command: Wolverine
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Asset Security

**VENOM SECURITY FINDING VPD-V-005**
- Finding ID: VPD-V-005
- Location: `VportActorMenuFlyerEditorScreen` — ownership not verified in this session
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Actor Ownership Contract — UNVERIFIED
- Contract Violated: Actor Ownership Contract
- Current behavior: Flyer editor screen source not reviewed. Ownership enforcement status is UNKNOWN.
- Risk: If flyer editor does not call `assertActorOwnsVportActorController`, any authenticated actor who navigates to `/actor/<victimActorId>/menu/flyer/edit` could edit another VPORT's flyer.
- Severity: HIGH (if ownership unverified — requires source review to confirm or clear)
- Exploitability: HIGH (if ownership absent — only requires knowing the target actorId UUID)
- Attack Preconditions: Authenticated actor, target actorId known
- Blast Radius: Any VPORT's flyer content
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: ASSUMED
- Why it matters: Flyer editor is a write operation on VPORT identity/branding content. Ownership must be enforced at controller layer.
- Recommended mitigation: Confirm `VportActorMenuFlyerEditorScreen` and its controller(s) gate on `assertActorOwnsVportActorController`. Flag for immediate source review.
- Follow-up command: Wolverine → source review of flyer editor controller
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering

---

# CARD 4 — Menu Preview

## 1. Module Identity

| Field | Value |
|---|---|
| Card key | `menu_preview` |
| Card title | Preview Online Menu |
| Route target | `/profile/${slug}/menu` or `/actor/${actorId}/menu` (UUID fallback) |
| Screen entry | VportActorMenuPublicScreen (public) |
| Controllers used | None — navigation only |

## 2. Trust Boundary Map

Same pattern as QR card. Slug used when available; UUID fallback when not.

---

**VENOM SECURITY FINDING VPD-V-006**
- Finding ID: VPD-V-006
- Location: `VportDashboardScreen.jsx` line 66-68 — `openOnlineMenuPreview`
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Public Identity Surface Contract
- Contract Violated: Public Identity Surface Contract
- Current behavior: UUID fallback when no slug: `/actor/${actorId}/menu`
- Risk: UUID in public menu URL — menu is a shareable public page.
- Severity: MEDIUM
- Exploitability: MEDIUM — affects VPORTs without slugs
- Blast Radius: Single VPORT · Public-facing URL
- Identity Leak Type: Internal UUID exposure · Actor correlation
- RLS Dependency: NONE
- Recommended mitigation: Block menu preview if slug unavailable; prompt to set username.
- Follow-up command: Wolverine
- CISSP Domain:
  - Primary: Asset Security
  - Secondary: Identity and Access Management

---

# CARD 5 — Exchange Rates

## 1. Module Identity

| Field | Value |
|---|---|
| Card key | `exchange` |
| Card title | Exchange Rates |
| Route target | `/actor/${actorId}/dashboard/exchange` |
| Screen entry | `VportDashboardExchangeScreen.jsx` |
| Controllers used | `upsertVportRateController` (via `useUpsertVportRate`) |
| Hooks used | `useUpsertVportRate`, `usePublishExchangeRatePost` |
| Tables | Rate tables (specific schema not confirmed) |

## 2. Trust Boundary Map

- `useUpsertVportRate` wraps `upsertVportRateController` — ownership enforcement NOT reviewed in this session
- Screen uses `isOwner` UI gate (`useVportOwnership`)
- `actorId` comes from route param (UUID)
- `usePublishExchangeRatePost` publishes to the VCSM feed — ownership of feed post attribution not confirmed

## 5. Controller Authorization

**UNVERIFIED** — `upsertVportRateController` and `usePublishExchangeRatePost` were not read in this session. Ownership enforcement status is unknown.

---

**VENOM SECURITY FINDING VPD-V-007**
- Finding ID: VPD-V-007
- Location: `VportDashboardExchangeScreen.jsx` — `useUpsertVportRate` / `upsertVportRateController`
- Application Scope: VCSM
- Platform Surface: PWA · Supabase Table/View
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Actor Ownership Contract — UNVERIFIED
- Contract Violated: Actor Ownership Contract
- Current behavior: Exchange rate upsert controller ownership enforcement not reviewed. Screen relies on `isOwner` UI gate only (VCSM architecture rule violation: UI gate is not the security boundary).
- Risk: If `upsertVportRateController` lacks `assertActorOwnsVportActorController`, any authenticated actor can upsert exchange rates for any VPORT.
- Severity: HIGH (unverified — pending source review)
- Exploitability: HIGH if ownership absent
- Attack Preconditions: Authenticated actor, target actorId known
- Blast Radius: Any VPORT exchange rate data · Feed contamination (via `usePublishExchangeRatePost`)
- Identity Leak Type: None
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: ASSUMED
- Why it matters: Exchange rates are VPORT business data. If upsert is unguarded, attacker can corrupt any VPORT's published rates and publish fraudulent rate posts to the feed.
- Recommended mitigation: Confirm `upsertVportRateController` calls `assertActorOwnsVportActorController`. Mark CLEAN or escalate based on findings.
- Follow-up command: Wolverine → source review; VENOM re-audit after review
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

---

# CARD 6 — Team

## 1. Module Identity

| Field | Value |
|---|---|
| Card key | `team` |
| Card title | Team |
| Route target | `/actor/:actorId/dashboard/team` |
| Screen entry | `VportDashboardTeamScreen.jsx` · `BarberTeamRequestsScreen.jsx` |
| Controllers | `vportTeamAccess.controller.js`, `vportTeamInvite.controller.js` |
| Hooks | `useVportTeam`, `useVportTeamAccess`, `useBarberTeamRequests` |
| DAL | `vportTeam.read/write.dal.js`, `vportTeamInvite.read/write.dal.js` |
| Tables | `resources` (team_members + invites) |

## 2. Trust Boundary Map

- All CRUD in `vportTeamAccess.controller.js` gates via `assertActorOwnsVportActorController` — STRONG
- `acceptTeamRequestController`: verifies `callerActorId === resource.member_actor_id` — STRONG
- `declineTeamRequestController`: verifies invited barber OR `assertActorOwnsVportActorController` — STRONG
- `acceptBarbershopInviteController`: accepts `barberVportActorId` from caller WITHOUT verifying it belongs to the authenticated session — **MEDIUM risk**
- DAL writes by `resourceId` with `.eq("id", resourceId)` — no ownership column in WHERE

## 5. Controller Authorization

All `vportTeamAccess.controller.js` functions: STRONG (assertActorOwnsVportActorController at entry)

`acceptBarbershopInviteController`:
```js
export async function acceptBarbershopInviteController(token, barberVportActorId) {
  // NO VERIFICATION that barberVportActorId belongs to authenticated caller
  const resource = await fetchResourceByIdDAL(token);
  return acceptTeamInviteByActorDAL(token, barberVportActorId, resource.meta);
}
```
`acceptTeamInviteByActorDAL` sets `member_actor_id: barberVportActorId` unconditionally.

## 6. State Integrity

`updateTeamMemberRoleController` and `setTeamMemberStatusController` correctly prevent removing the last owner. Team member cross-VPORT confusion: `member_actor_id` could be any actorId; no check that the member belongs to the target VPORT's organizational context.

---

**VENOM SECURITY FINDING VPD-V-008**
- Finding ID: VPD-V-008
- Location: `vportTeamInvite.controller.js` line 56-63 — `acceptBarbershopInviteController`
- Application Scope: VCSM
- Platform Surface: PWA · Supabase Table/View
- Trust Boundary: Authenticated Citizen (barber accepting invite)
- Boundary Violated: Actor Ownership Contract — `barberVportActorId` not verified to belong to caller
- Contract Violated: Actor Ownership Contract
- Current behavior: `acceptBarbershopInviteController(token, barberVportActorId)` accepts any `barberVportActorId` from the caller without verifying that this actorId belongs to the authenticated user's session. `acceptTeamInviteByActorDAL` then sets `member_actor_id = barberVportActorId` in the resources table.
- Risk: Actor A (authenticated) can call `acceptBarbershopInviteController(validToken, actorIdOfB)` to accept a team invite on behalf of Actor B, linking Actor B to a barbershop without Actor B's consent or knowledge.
- Severity: HIGH
- Exploitability: MEDIUM — attacker needs a valid invite token AND the target actor's actorId
- Attack Preconditions: Authenticated actor, valid team invite token, target barber's actorId
- Blast Radius: Any barber actor — can be force-added to a team without consent
- Identity Leak Type: Ownership inference
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — if RLS on `resources` table does not re-verify ownership, this write succeeds
- Why it matters: A barbershop operator could force-associate any barber actor to their shop, potentially impersonating that barber's affiliation.
- Recommended mitigation: In `acceptBarbershopInviteController`, verify that `barberVportActorId` is an actor owned by or equivalent to the authenticated session actor. Use `assertActorOwnsVportActorController` or resolve `barberVportActorId` from the session rather than accepting it from the caller.
- Rationale: Caller-supplied actorId must never be trusted as an ownership claim.
- Follow-up command: Wolverine (fix), CARNAGE (RLS on resources table)
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

**VENOM SECURITY FINDING VPD-V-009**
- Finding ID: VPD-V-009
- Location: `vportTeamInvite.write.dal.js` — all write operations use `.eq("id", resourceId)` only
- Application Scope: VCSM
- Platform Surface: Supabase Table/View
- Trust Boundary: Authenticated Citizen / VPORT Owner
- Boundary Violated: Actor Ownership Contract
- Contract Violated: Actor Ownership Contract
- Current behavior: All DAL write operations (`acceptTeamRequestDAL`, `declineTeamRequestDAL`, `acceptTeamInviteByActorDAL`) filter only by `resourceId` with no `profile_id` or `member_actor_id` column restriction in the update. Security relies entirely on controller-layer ownership checks + RLS.
- Risk: If RLS is absent or misconfigured on the `resources` table, any controller call with a guessable `resourceId` can mutate any team record.
- Severity: MEDIUM
- Exploitability: LOW (controller layer provides mitigation; only exposed if RLS is absent)
- Attack Preconditions: RLS absent on `resources` table; controller ownership bypassed
- Blast Radius: Any team membership record
- RLS Dependency: UNVERIFIED
- Why it matters: Defense-in-depth requires DB-level ownership filtering in addition to controller layer.
- Recommended mitigation: Verify RLS on `resources` table enforces `member_actor_id = auth.uid()` (for barber accept paths) or `owner_actor_id` ownership link. Add secondary ownership column in WHERE clause where feasible.
- Follow-up command: CARNAGE (RLS on resources)
- CISSP Domain:
  - Primary: Security Architecture and Engineering
  - Secondary: Identity and Access Management

---

# CARD 7 — Portfolio

## 1. Module Identity

| Field | Value |
|---|---|
| Card key | `portfolio` |
| Card title | Portfolio |
| Route target | `/actor/:actorId/dashboard/portfolio` |
| Screen entry | `VportDashboardPortfolioScreen.jsx` |
| Controllers | `addPortfolioMediaWithRecord.controller.js`, `probeVportPortfolioController`, portfolio engine `createItem`/`updateItem`/`deleteItem` |
| Hooks | `useVportPortfolio`, `useVportPortfolioProbe`, `usePortfolioItemSubmit`, `usePortfolioMediaUpload`, `usePublishBarbershopPortfolioPost` |
| DAL | `portfolioMediaRecord.write.dal.js` + portfolio engine DAL |
| Tables | `portfolio_items`, `portfolio_media`, `portfolio_locksmith_details` |
| External | `@portfolio` engine |

## 2. Trust Boundary Map

- UI gate: `if (!isOwner) return ...` — WEAK alone
- `deleteItem({ itemId, actorId: targetActorId })` — `actorId` from route param (caller-controlled)
- `createItem`, `updateItem` — ownership enforcement inside `@portfolio` engine — UNVERIFIED
- `addPortfolioMediaWithRecord.controller.js` — no ownership check visible in explored sources
- `PortfolioBugsBunnyPanel` — DEV-gated: `{import.meta.env.DEV && <PortfolioBugsBunnyPanel ... />}` — OK

## 5. Controller Authorization

`deleteItem({ itemId, actorId: targetActorId })`: `actorId` is the route param UUID — caller-controlled. Engine ownership check: UNVERIFIED.

`addPortfolioMediaWithRecord.controller.js`: not read in detail. Ownership: UNVERIFIED.

## 7. Data Exposure

`useVportPortfolioProbe` hook (line 23-29):
```js
const result = await probeVportPortfolioController({
  actorId,
  identity,
  userId: user?.id ?? null,
  email: user?.email ?? null,  // ← PII passed to probe
});
```
`user.email` (PII) is passed to the probe controller. The `runProbe` function lacks a DEV guard (only the trace subscription is DEV-gated). However, the `PortfolioBugsBunnyPanel` component that calls `useVportPortfolioProbe` IS DEV-gated. If the component is never mounted in production, the hook is never instantiated.

Risk is LOW as long as `PortfolioBugsBunnyPanel` remains correctly DEV-gated.

---

**VENOM SECURITY FINDING VPD-V-010**
- Finding ID: VPD-V-010
- Location: `VportDashboardPortfolioScreen.jsx` line 104 — `deleteItem({ itemId, actorId: targetActorId })`
- Application Scope: VCSM
- Platform Surface: PWA · Shared Engine
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Actor Ownership Contract — UNVERIFIED
- Contract Violated: Actor Ownership Contract
- Current behavior: `deleteItem` from `@portfolio` engine receives `actorId: targetActorId` where `targetActorId` is sourced from the route param (URL). If the portfolio engine uses this `actorId` for ownership verification, a non-owner could supply any `actorId` via URL manipulation and potentially delete items owned by that actor. The actual engine ownership enforcement is UNVERIFIED.
- Risk: Portfolio item deletion may be guarded only by a UI `isOwner` check and an unverified engine ownership check.
- Severity: HIGH (UNVERIFIED — must confirm portfolio engine gate)
- Exploitability: HIGH if engine lacks ownership check
- Attack Preconditions: Authenticated actor, target itemId, target actorId (from URL)
- Blast Radius: Any VPORT portfolio items
- RLS Dependency: UNVERIFIED
- Why it matters: UI-only ownership gate is insufficient. Portfolio item deletion must be verified server-side.
- Recommended mitigation: Confirm `deleteItem` in `@portfolio` engine independently verifies caller identity. Do not pass `actorId` from client URL as the ownership claim.
- Follow-up command: Wolverine → read `@portfolio` engine `deleteItem` source
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering

**VENOM SECURITY FINDING VPD-V-011**
- Finding ID: VPD-V-011
- Location: `useVportPortfolioProbe.js` line 23-26 — email passed to probe controller
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: None (currently DEV-gated by component wrapper)
- Contract Violated: Asset Security (PII handling)
- Current behavior: `probeVportPortfolioController` receives `email: user?.email` as a parameter. The `runProbe` function itself has no `import.meta.env.DEV` guard — only the trace subscription and the containing component `PortfolioBugsBunnyPanel` are DEV-gated.
- Risk: If `PortfolioBugsBunnyPanel` DEV guard is accidentally removed or bypassed, `runProbe` can be called in production, logging user email to the probe controller (which may persist or log it).
- Severity: LOW (currently mitigated by component DEV gate)
- Exploitability: LOW — requires accidental DEV gate removal
- Blast Radius: Individual user PII
- Identity Leak Type: Private contact exposure
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Defense-in-depth requires the probe function itself to be DEV-guarded, not just the component that calls it.
- Recommended mitigation: Add `if (!import.meta.env.DEV) return null` guard inside `runProbe` itself. Never pass `email` to probe controllers — use `userId` only if user identity is needed.
- Follow-up command: Wolverine
- CISSP Domain:
  - Primary: Asset Security
  - Secondary: Security Operations

---

# CARD 8 — Locksmith

## 1. Module Identity

| Field | Value |
|---|---|
| Card key | `locksmith` |
| Card title | Locksmith Manager |
| Route target | `/actor/:actorId/dashboard/locksmith` |
| Screen entry | `VportDashboardLocksmithScreen.jsx` |
| Controllers | `useLocksmithOwner` (profiles adapter), `usePublishLocksmithPost` |
| Hooks | `useLocksmithProfile`, `useLocksmithOwner`, `usePublishLocksmithPost` |
| Tables | `locksmith_areas`, `locksmith_service_details` (via profiles adapter) |

## 2. Trust Boundary Map

- UI gate: `if (!isOwner) return ...`
- `useLocksmithOwner` — ownership enforcement inside profiles adapter — UNVERIFIED
- `publishServiceAreaPost` — feed post attribution — UNVERIFIED
- Error messages exposed verbosely: `owner.error?.message || owner.error?.details || owner.error?.hint || JSON.stringify(owner.error)`

## 7. Data Exposure — Error Verbosity

Screen JSX (near bottom):
```jsx
{owner.error?.message || owner.error?.details || owner.error?.hint || JSON.stringify(owner.error)}
```
`error.details` and `error.hint` are Supabase error fields that may include internal SQL details, constraint names, and schema information.

---

**VENOM SECURITY FINDING VPD-V-012**
- Finding ID: VPD-V-012
- Location: `VportDashboardLocksmithScreen.jsx` — error display block
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Asset Security
- Contract Violated: None
- Current behavior: `owner.error?.details || owner.error?.hint || JSON.stringify(owner.error)` renders Supabase error metadata including `details` (SQL-level constraint info) and `hint` fields in the UI for the VPORT owner.
- Risk: Supabase error hints and details may reveal internal schema names, constraint names, column names, and table structure.
- Severity: LOW (owner-only view — not publicly exposed)
- Exploitability: LOW — only visible to the authenticated owner
- Blast Radius: Schema information disclosure to VPORT owner
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Schema information in error messages assists attackers in crafting targeted DB-layer exploits if the owner's account is compromised.
- Recommended mitigation: Sanitize to `owner.error?.message || "An error occurred."` in production. Reserve full error detail for `import.meta.env.DEV` paths.
- Follow-up command: Wolverine
- CISSP Domain:
  - Primary: Security Operations
  - Secondary: Software Development Security

**VENOM SECURITY FINDING VPD-V-013**
- Finding ID: VPD-V-013
- Location: `VportDashboardLocksmithScreen.jsx` — `useLocksmithOwner` ownership verification
- Application Scope: VCSM
- Platform Surface: PWA · Supabase Table/View
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Actor Ownership Contract — UNVERIFIED
- Contract Violated: Actor Ownership Contract
- Current behavior: Locksmith area CRUD (add, update, delete) flows through `useLocksmithOwner` from `profiles.adapter`. Ownership enforcement within this adapter is UNVERIFIED in this session.
- Risk: If `useLocksmithOwner` does not independently verify actor ownership, locksmith service areas can be mutated by non-owners who bypass the `isOwner` UI gate.
- Severity: HIGH (UNVERIFIED — pending source review)
- Exploitability: HIGH if ownership absent
- Attack Preconditions: Authenticated actor, target actorId from route
- Blast Radius: Any VPORT locksmith configuration
- RLS Dependency: ASSUMED
- Recommended mitigation: Confirm `useLocksmithOwner` and its underlying controller call `assertActorOwnsVportActorController`.
- Follow-up command: Wolverine → read `profiles.adapter` locksmith owner source
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering

---

# CARD 9 — Services

## 1. Module Identity

| Field | Value |
|---|---|
| Card key | `services` |
| Card title | Services |
| Route target | `/actor/:actorId/dashboard/services` |
| Screen entry | `VportDashboardServicesScreen.jsx` |
| Controllers | Via `VportServicesView` adapter |
| Hooks | Via profiles adapter |
| Tables | `vport_services` (via adapter) |

## 2. Trust Boundary Map

- Screen wraps `VportServicesView` adapter
- UI gate: `isOwner` check present
- Controller ownership enforcement: UNVERIFIED (inside adapter)

---

**VENOM SECURITY FINDING VPD-V-014**
- Finding ID: VPD-V-014
- Location: `VportDashboardServicesScreen.jsx` — `VportServicesView` adapter
- Application Scope: VCSM
- Platform Surface: PWA · Supabase Table/View
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Actor Ownership Contract — UNVERIFIED
- Contract Violated: Actor Ownership Contract
- Current behavior: Services CRUD is delegated to `VportServicesView` adapter. Controller ownership enforcement not reviewed.
- Risk: Service creation/update/delete without ownership verification allows any actor to modify another VPORT's service catalog.
- Severity: HIGH (UNVERIFIED — pending source review)
- Exploitability: HIGH if ownership absent
- Attack Preconditions: Authenticated actor, target actorId
- Blast Radius: Any VPORT service catalog
- RLS Dependency: ASSUMED
- Recommended mitigation: Confirm service CRUD controllers call `assertActorOwnsVportActorController`.
- Follow-up command: Wolverine → read `VportServicesView` adapter source
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

---

# CARD 10 — Reviews

## 1. Module Identity

| Field | Value |
|---|---|
| Card key | `reviews` |
| Card title | Reviews |
| Route target | `/actor/:actorId/dashboard/reviews` |
| Screen entry | `VportDashboardReviewScreen.jsx` |
| Controllers | Via `VportReviewsView` adapter — read-mostly |
| Tables | `reviews` (via reviews engine) |

## 2. Trust Boundary Map

- Primarily a read/display surface
- Owner sees their reviews with moderation controls
- No mutations surfaced in this card's source review
- Reviews engine ownership for any mutation: UNVERIFIED

---

**VENOM SECURITY FINDING VPD-V-015**
- Finding ID: VPD-V-015
- Location: `VportDashboardReviewScreen.jsx` — `VportReviewsView` mutation surface
- Application Scope: VCSM
- Platform Surface: PWA · Supabase Table/View
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Actor Ownership Contract — UNVERIFIED (for any mutation actions)
- Contract Violated: Actor Ownership Contract
- Current behavior: Reviews display adapter — if owner-response or moderation actions exist, ownership of those write paths is UNVERIFIED.
- Risk: LOW for read-only surface. Severity elevates to HIGH if write actions exist without ownership checks.
- Severity: INFO (read display); HIGH (if write actions present — UNVERIFIED)
- Exploitability: LOW (read-only)
- RLS Dependency: UNVERIFIED
- Recommended mitigation: Confirm any reviews mutation within the adapter verifies actor ownership.
- Follow-up command: Wolverine → confirm reviews write paths
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: None

---

# CARD 11 — Leads

## 1. Module Identity

| Field | Value |
|---|---|
| Card key | `leads` |
| Card title | Leads |
| Route target | `/actor/:actorId/dashboard/leads` |
| Screen entry | `VportDashboardLeadsScreen.jsx` |
| Controllers | `vportLeads.controller.js` |
| Hooks | `useVportLeads` |
| DAL | `vportLeads.read.dal.js`, `vportLeads.write.dal.js` |
| Tables | `vport_leads` or equivalent |

## 2. Trust Boundary Map

- Ownership gate: `assertCallerOwns(callerActorId, actorId)` — LOCAL STRING COMPARISON ONLY
- Does NOT use `assertActorOwnsVportActorController`
- Does NOT verify actor_owners table
- Does NOT check caller actor is not void/deactivated
- `callerActorId` = identity?.actorId (from session — OK)
- `actorId` (ownerActorId) = params?.actorId (from route — caller-controlled)

## 5. Controller Authorization (BLACKWIDOW BW-VPD-003 confirmed)

```js
function assertCallerOwns(callerActorId, ownerActorId, op) {
  if (String(callerActorId) !== String(ownerActorId)) {
    throw new Error(`${op}: caller does not own this vport`);
  }
}
```

Used in: `listVportLeadsController`, `markVportLeadContactedController`, `countNewVportLeadsController`, `deleteVportLeadController`.

## 6. State Integrity

Lead deletion: `deleteVportBusinessCardLeadDAL({ profileId, leadId })` — uses both `profileId` (resolved from actorId) and `leadId`. The `profileId` is server-resolved from actorId (not caller-supplied). The `leadId` is caller-supplied — if RLS on the leads table doesn't enforce `profile_id` match, any `leadId` could be deleted.

---

**VENOM SECURITY FINDING VPD-V-016** *(confirms and extends BW-VPD-003)*
- Finding ID: VPD-V-016
- Location: `vportLeads.controller.js` lines 11-16 — `assertCallerOwns`
- Application Scope: VCSM
- Platform Surface: PWA · Supabase Table/View
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Actor Ownership Contract
- Contract Violated: Actor Ownership Contract
- Current behavior: `assertCallerOwns` performs a raw string comparison `callerActorId !== ownerActorId` with no DB verification. Does not query `actor_owners`. Does not verify actor existence or void status. In the acting-as pattern, `callerActorId` = VPORT's actorId (passed from route param), so the check passes — but a deactivated VPORT actor's ID would also pass.
- Risk: A deactivated VPORT actor whose actorId is known can still access leads. The check is architecturally inconsistent with all other dashboard controllers.
- Severity: MEDIUM
- Exploitability: MEDIUM — limited to callerActorId === ownerActorId (acting-as pattern)
- Attack Preconditions: Caller's session actorId matches the target VPORT's actorId (acting-as mode); no DB verification that actor is active
- Blast Radius: VPORT leads data — list, count, mark-contacted, delete
- Identity Leak Type: None directly; leads contain customer PII (name, phone, email, message)
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — if RLS on leads table enforces ownership, this mitigates; if absent, the weak gate is the only protection
- Why it matters: Inconsistent ownership patterns create maintenance risk and may be exploited as the acting-as pattern evolves.
- Recommended mitigation: Replace `assertCallerOwns` with `assertActorOwnsVportActorController` from booking adapter.
- Rationale: All other dashboard controllers use the canonical gate — this one must too.
- Follow-up command: Wolverine (fix), CARNAGE (RLS on leads table)
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

**VENOM SECURITY FINDING VPD-V-017**
- Finding ID: VPD-V-017
- Location: `vportLeads.write.dal.js` — `deleteVportBusinessCardLeadDAL({ profileId, leadId })`
- Application Scope: VCSM
- Platform Surface: Supabase Table/View
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Actor Ownership Contract
- Contract Violated: Actor Ownership Contract
- Current behavior: Lead deletion DAL filters by `profileId` AND `leadId`. `profileId` is server-resolved (safe). `leadId` is caller-supplied. If RLS does not enforce `profile_id = <resolved profile>`, an actor could delete a lead from a different VPORT's profile by supplying a cross-VPORT `leadId`.
- Risk: MEDIUM — cross-VPORT lead deletion if RLS absent
- Severity: MEDIUM
- Exploitability: MEDIUM — requires valid `profileId` (server-resolved) combined with a `leadId` belonging to a different VPORT
- Attack Preconditions: Caller passes a `leadId` owned by a different VPORT; DAL filters by both but RLS unknown
- Blast Radius: Lead records across VPORTs
- RLS Dependency: UNVERIFIED
- Recommended mitigation: Verify RLS on leads table enforces `profile_id` match. DAL already filters by `profileId` — confirm RLS adds the same constraint at DB level.
- Follow-up command: CARNAGE
- CISSP Domain:
  - Primary: Security Architecture and Engineering
  - Secondary: Identity and Access Management

---

# CARD 12 — Reviews QR

## 1. Module Identity

| Field | Value |
|---|---|
| Card key | `reviews_qr` |
| Card title | Reviews QR |
| Route target | `/profile/${slug}/reviews/qr` or `/actor/${actorId}/reviews/qr` (UUID fallback) |
| Screen entry | VportReviewsQrBySlugScreen (public) |

## 2. Trust Boundary Map

Same pattern as QR card (Card 1). Slug preferred; UUID fallback.

---

**VENOM SECURITY FINDING VPD-V-018**
- Finding ID: VPD-V-018
- Location: `VportDashboardScreen.jsx` lines 75-77 — `openReviewsQr`
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Public Identity Surface Contract
- Contract Violated: Public Identity Surface Contract
- Current behavior: Reviews QR navigation falls back to `/actor/${actorId}/reviews/qr` UUID when no slug available. Reviews QR page is typically printed/shared.
- Risk: UUID in printed/distributed QR code for reviews.
- Severity: MEDIUM
- Exploitability: MEDIUM
- Blast Radius: Persistent UUID in printed QR
- Identity Leak Type: Internal UUID exposure · Actor correlation
- RLS Dependency: NONE
- Recommended mitigation: Require slug before generating reviews QR. Prompt to set username if unavailable.
- Follow-up command: Wolverine
- CISSP Domain:
  - Primary: Asset Security
  - Secondary: Identity and Access Management

---

# CARD 13 — Booking History

## 1. Module Identity

| Field | Value |
|---|---|
| Card key | `booking_history` |
| Card title | Bookings |
| Route target | `/actor/:actorId/dashboard/booking-history` |
| Screen entry | `VportDashboardBookingHistoryScreen.jsx` → `VportDashboardBookingHistoryView.jsx` |
| Controllers | `updateBookingStatusController`, `rescheduleBookingController`, `createVportPublicBookingController`, `cancelBookingController` |
| Hooks | `useVportBookingActions`, `useVportBookingOps`, `useQuickBookingModal` |
| DAL | `vportBookingById.read.dal.js`, `updateVportBooking.write.dal.js`, `insertVportBooking.write.dal.js`, `listVportBookingsForProfileDay.read.dal.js` |
| Tables | `bookings` (vport schema) |

## 2. Trust Boundary Map

- `updateBookingStatusController`: ownership via `assertActorOwnsVportActorController` — STRONG
- `rescheduleBookingController`: ownership via `assertActorOwnsVportActorController` — STRONG
- `cancelBookingController`: ownership via `assertActorOwnsVportActorController` — STRONG
- `createVportPublicBookingController`: `customerActorId` accepted from caller — **HIGH (BW-VPD-010)**
- Notification linkPaths: raw `owner_actor_id` UUID — **HIGH (BW-VPD-001)**
- **No terminal-state guard on status mutations** — **MEDIUM (BW-VPD-002)**

## 5. Controller Authorization

`updateBookingStatusController` and `rescheduleBookingController`: both call `assertActorOwnsVportActorController` after resolving vportActorId from booking.profile_id — STRONG.

`cancelBookingController`: checks `isCustomer` OR calls `assertActorOwnsVportActorController` — STRONG.

`createVportPublicBookingController` (BW-VPD-010):
```js
customer_actor_id: customerActorId ?? requestActorId,  // caller-controlled
```
No assertion `customerActorId === requestActorId` in public booking flow.

## 6. State Integrity (BW-VPD-002)

`updateBookingStatusController`:
```js
const booking = await getVportBookingByIdDAL({ bookingId });
// NO: if (["completed", "cancelled"].includes(booking.status)) throw ...
await assertActorOwnsVportActorController(...);
// mutation applied regardless of current state
```

`rescheduleBookingController`: same — no status guard before reschedule.

---

**VENOM SECURITY FINDING VPD-V-019** *(confirms BW-VPD-010)*
- Finding ID: VPD-V-019
- Location: `vportPublicBooking.controller.js` line 82 — `createVportPublicBookingController`
- Application Scope: VCSM
- Platform Surface: PWA · Supabase Table/View
- Trust Boundary: Authenticated Citizen (public booking) / Authenticated VPORT Owner
- Boundary Violated: Booking Trust Contract — customerActorId is caller-controlled
- Contract Violated: Booking Trust Contract · Actor Ownership Contract
- Current behavior: `customer_actor_id: customerActorId ?? requestActorId` — caller supplies `customerActorId` independently of `requestActorId` with no cross-validation.
- Risk: Actor A authenticates and submits `customerActorId = B`. Booking is stored as owned by Actor B without B's knowledge. Actor B's booking history is contaminated.
- Severity: HIGH
- Exploitability: HIGH — any authenticated actor with any target actorId
- Attack Preconditions: Authenticated account, any target actorId
- Blast Radius: Multi-actor — any actor's booking history can be polluted
- Identity Leak Type: Booking identity exposure
- Cache Trust Type: Booking-sensitive
- RLS Dependency: UNVERIFIED — if bookings table RLS enforces `customer_actor_id = auth.uid()`, the INSERT would fail; otherwise it succeeds
- Why it matters: Booking history is used for trust signals, dispute resolution, and service records. Polluting another actor's booking history has direct business and legal impact.
- Recommended mitigation: In the public booking flow, assert `customerActorId === requestActorId` or strip `customerActorId` entirely (derive it from `requestActorId`). If owner-on-behalf semantics are needed, implement them exclusively in `createOwnerBookingController`.
- Follow-up command: Wolverine (fix), CARNAGE (RLS on bookings INSERT)
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security · Security Architecture and Engineering

**VENOM SECURITY FINDING VPD-V-020** *(confirms BW-VPD-001 for booking notifications)*
- Finding ID: VPD-V-020
- Location: `cancelBooking.controller.js` lines 70-72 · `vportPublicBooking.controller.js` line 112
- Application Scope: VCSM
- Platform Surface: PWA · Shared Engine (notifications)
- Trust Boundary: Authenticated Citizen / VPORT Owner (notification recipients)
- Boundary Violated: Public Identity Surface Contract
- Contract Violated: Public Identity Surface Contract
- Current behavior: Notification `linkPath` embeds raw UUID: `/actor/${resource.owner_actor_id}/dashboard/booking-history`
- Risk: Every booking notification delivered to any actor exposes the VPORT owner's `vc.actors.id` UUID in a navigable link. UUID appears in browser address bar when recipient clicks the notification.
- Severity: HIGH
- Exploitability: HIGH — affects every booking notification, no special preconditions
- Blast Radius: All actors receiving booking notifications
- Identity Leak Type: Internal UUID exposure · Actor correlation
- Cache Trust Type: None
- RLS Dependency: NONE
- Recommended mitigation: Resolve VPORT slug server-side before publishing notification. Replace UUID with slug in all linkPath values. If slug unavailable, use a slug-independent deep link that avoids the UUID entirely.
- Follow-up command: Wolverine
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Asset Security

**VENOM SECURITY FINDING VPD-V-021** *(confirms BW-VPD-002)*
- Finding ID: VPD-V-021
- Location: `updateVportBooking.controller.js` — `updateBookingStatusController` and `rescheduleBookingController`
- Application Scope: VCSM
- Platform Surface: PWA · Supabase Table/View
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Booking Trust Contract
- Contract Violated: Booking Trust Contract
- Current behavior: Neither `updateBookingStatusController` nor `rescheduleBookingController` checks `booking.status` before applying mutations. Terminal states (`completed`, `cancelled`, `no_show`) can be overwritten.
- Risk: VPORT owner can reopen completed bookings, re-cancel already-cancelled bookings, or reschedule a completed appointment — corrupting booking history records.
- Severity: MEDIUM
- Exploitability: MEDIUM — requires VPORT owner access (legitimate account)
- Attack Preconditions: VPORT owner with access to the booking history screen
- Blast Radius: Booking history records for the VPORT · Downstream billing/reporting
- Identity Leak Type: None
- Cache Trust Type: Booking-sensitive
- RLS Dependency: NONE — controller-layer issue
- Recommended mitigation: Add terminal-state guard at top of each mutation: `const TERMINAL = ["completed","cancelled","no_show"]; if (TERMINAL.includes(booking.status)) throw new Error(...)`. For reschedule: require `booking.status` in `["pending","confirmed"]`.
- Follow-up command: Wolverine
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering

---

# CARD 14 — Calendar & Slots

## 1. Module Identity

| Field | Value |
|---|---|
| Card key | `calendar` |
| Card title | Calendar & Slots |
| Route target | `/actor/:actorId/dashboard/calendar` |
| Screen entry | `VportDashboardCalendarScreen.jsx` · `VportDashboardScheduleScreen.jsx` |
| Controllers | `setAvailabilityRuleController`, `setAvailabilityExceptionController`, `setResourceSlotDurationController`, `loadDayScheduleController` |
| Hooks | `useOwnerBookingResources`, `useBookingAvailability`, `useManageAvailability`, `useVportOwnerSchedule` |
| DAL | `vportAvailabilityRules.read.dal.js`, `listVportBookingsForProfileDay.read.dal.js`, `vportResource.read.dal.js` |
| Tables | `availability_rules`, `bookings`, `resources` |

## 2. Trust Boundary Map

**Write paths (STRONG):**
- `setAvailabilityRuleController`: resolves resource → `assertActorOwnsVportActorController(resource.owner_actor_id)` — STRONG
- `setAvailabilityExceptionController`: same pattern — STRONG
- `setResourceSlotDurationController`: same pattern — STRONG

**Read path (WEAK — no ownership check):**
- `loadDayScheduleController({ actorId, dateKey })`: resolves profileId from actorId, fetches ALL bookings for the day including `customer_name`, `customer_note`, `service_label_snapshot` — **NO OWNERSHIP VERIFICATION**

## 5. Controller Authorization

`loadDayScheduleController` (full source reviewed):
```js
export async function loadDayScheduleController({ actorId, dateKey }) {
  if (!actorId || !dateKey) throw new Error("actorId and dateKey are required");
  const profileId = await getVportProfileIdByActorDAL({ actorId });
  // NO assertActorOwnsVportActorController call
  // Returns lanes with all booking data including customer PII
  return { actorId, profileId, dateKey, lanes, services };
}
```

Any caller with any valid `actorId` (including a non-owner) can receive:
- All bookings for the day (pending/confirmed/completed)
- `customer_name` per booking
- `customer_note` per booking
- `service_label_snapshot`
- All team member resource records

---

**VENOM SECURITY FINDING VPD-V-022**
- Finding ID: VPD-V-022
- Location: `loadDaySchedule.controller.js` — missing ownership check
- Application Scope: VCSM
- Platform Surface: PWA · Supabase Table/View
- Trust Boundary: Authenticated VPORT Owner (expected) → any Authenticated Citizen (actual)
- Boundary Violated: Actor Ownership Contract · Booking Trust Contract
- Contract Violated: Actor Ownership Contract · Booking Trust Contract
- Current behavior: `loadDayScheduleController` returns full day schedule including booking `customer_name`, `customer_note`, `service_label_snapshot`, start/end times, and resource assignment for any `actorId` passed in. No ownership check. Any authenticated actor can call this controller with any target `actorId`.
- Risk: Any authenticated user can read the full day's booking PII for any VPORT — customer names, appointment notes, service types, and team member assignments.
- Severity: HIGH
- Exploitability: HIGH — any authenticated actor, any target actorId
- Attack Preconditions: Authenticated account, any VPORT actorId (obtainable from notifications, public profiles, or URL)
- Blast Radius: All VPORT booking data including customer PII — multi-VPORT
- Identity Leak Type: Booking identity exposure · Private contact exposure
- Cache Trust Type: Booking-sensitive
- RLS Dependency: UNVERIFIED — if Supabase RLS on `bookings` enforces ownership, this would be mitigated at DB layer; without RLS verification we cannot rely on this
- Why it matters: Customer names and notes in bookings are PII. Any breach of this data is a direct privacy violation and potential legal liability.
- Recommended mitigation: Add `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })` at the top of `loadDayScheduleController`. Pass `callerActorId` (from session) alongside `actorId` (target VPORT). Verify RLS on `bookings` table also enforces ownership.
- Rationale: Schedule reads expose the most sensitive data in the booking system. They must be as strictly guarded as writes.
- Follow-up command: Wolverine (fix), CARNAGE (RLS on bookings read)
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Asset Security · Security Architecture and Engineering

---

# CARD 15 — Gas Prices

## 1. Module Identity

| Field | Value |
|---|---|
| Card key | `gas` |
| Card title | Gas Prices |
| Route target | `/actor/:actorId/dashboard/gas` |
| Screen entry | `VportDashboardGasScreen.jsx` |
| Controllers | `useVportGasPrices`, `useSubmitFuelPriceSuggestion`, `useOwnerPendingSuggestions` |
| Hooks | `useVportGasPrices` (profiles adapter) |
| Tables | Gas price tables (via profiles/gas feature) |

## 2. Trust Boundary Map

- UI gate: `isOwner` check at screen level
- `useVportGasPrices` ownership: UNVERIFIED
- "Auto-approval of owner-submitted suggestions" — owner suggestion bypasses community approval flow
- Gas prices are published to a public feed and appear on public VPORT profiles

## 5. Controller Authorization

UNVERIFIED — `getVportGasPricesController`, `useSubmitFuelPriceSuggestion` ownership enforcement not read.

---

**VENOM SECURITY FINDING VPD-V-023**
- Finding ID: VPD-V-023
- Location: `VportDashboardGasScreen.jsx` — `useVportGasPrices` / `useSubmitFuelPriceSuggestion` / auto-approval
- Application Scope: VCSM
- Platform Surface: PWA · Supabase Table/View
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Actor Ownership Contract — UNVERIFIED
- Contract Violated: Actor Ownership Contract
- Current behavior: Gas price updates (official prices and suggestion auto-approval) flow through `useVportGasPrices` from profiles adapter. Ownership enforcement UNVERIFIED. Owner suggestions are auto-approved without external review.
- Risk: If ownership is absent: any authenticated actor can update any Gas VPORT's official fuel prices. Gas prices appear on public profiles and affect consumer decision-making.
- Severity: HIGH (if ownership absent — UNVERIFIED)
- Exploitability: HIGH if ownership absent
- Attack Preconditions: Authenticated actor, target gas VPORT actorId
- Blast Radius: Public gas price data — SEO/directory consumers, public profile
- Identity Leak Type: None
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: ASSUMED
- Why it matters: Fake gas prices on a public directory are a fraud vector and reputational damage vector.
- Recommended mitigation: Confirm gas price write controllers call `assertActorOwnsVportActorController`. Confirm auto-approval flow verifies caller owns the VPORT before applying.
- Follow-up command: Wolverine → read gas price controller source
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security and Risk Management

---

# CARD 16 — Ads Pipeline

## 1. Module Identity

| Field | Value |
|---|---|
| Card key | `ads` |
| Card title | Ads Pipeline |
| Route target | `/ads/vport/${actorId}` (raw UUID always) |
| Screen entry | `VportAdsSettingsScreen.jsx` |
| Controllers | Via `useVportAds` hook |
| Tables | Ads tables (via ads feature) |
| Feature flag | `isDashboardCardEnabled('ads')` |

## 2. Trust Boundary Map

- Route `/ads/vport/:actorId` always uses raw UUID — no slug
- Ownership inside `useVportAds` / ads controllers: UNVERIFIED
- Ads are published to public feed — write operations affect public content

---

**VENOM SECURITY FINDING VPD-V-024**
- Finding ID: VPD-V-024
- Location: `VportDashboardScreen.jsx` line 85 — `openAdsPipeline`
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Public Identity Surface Contract
- Contract Violated: Public Identity Surface Contract
- Current behavior: `/ads/vport/${actorId}` — raw UUID always used, no slug attempt.
- Risk: Owner-only URL always exposes actorId UUID.
- Severity: MEDIUM
- Exploitability: LOW — owner-only navigation
- Blast Radius: Single VPORT · UUID in browser address bar
- Identity Leak Type: Internal UUID exposure
- RLS Dependency: NONE
- Recommended mitigation: Use slug-based ads route.
- Follow-up command: Wolverine
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Asset Security

**VENOM SECURITY FINDING VPD-V-025**
- Finding ID: VPD-V-025
- Location: `VportAdsSettingsScreen.jsx` — `useVportAds` ownership
- Application Scope: VCSM
- Platform Surface: PWA · Supabase Table/View
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Actor Ownership Contract — UNVERIFIED
- Contract Violated: Actor Ownership Contract
- Current behavior: Ads CRUD (create, publish, pause, archive, delete) flows through `useVportAds`. Controller ownership enforcement UNVERIFIED.
- Risk: If ownership absent, any actor can create/publish/delete ads on behalf of another VPORT. Published ads appear in public feeds.
- Severity: HIGH (UNVERIFIED)
- Exploitability: HIGH if ownership absent
- Blast Radius: Public ad content · Any VPORT
- RLS Dependency: ASSUMED
- Recommended mitigation: Confirm ads controllers call `assertActorOwnsVportActorController`.
- Follow-up command: Wolverine → read ads controller source
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Feed Publishing Contract

---

# CARD 17 — Settings

## 1. Module Identity

| Field | Value |
|---|---|
| Card key | `settings` |
| Card title | Settings |
| Route target | `/actor/:actorId/settings` |
| Screen entry | `VportSettingsScreen.jsx` |
| Controllers | `saveVportPublicDetailsByActorIdController`, `ctrlSetVportDirectoryVisible`, `ctrlSetVportBusinessCardPublishState`, `setVportBusinessCardSettingsDAL` |
| Hooks | `useSaveVportPublicDetailsByActorId`, `useVportDirectoryVisibility`, `useVportAds`, various settings hooks |
| DAL | `vportPublicDetails.write.dal.js`, `vports.write.dal.js`, `vports.read.dal.js` |
| Tables | `vport.profile_public_details`, `vport.profiles` |

## 2. Trust Boundary Map

**`saveVportPublicDetailsByActorIdController`:** Ownership checked with `assertActorOwnsVportActorController` at controller entry — STRONG.

**`ctrlSetVportDirectoryVisible`:**
```js
export async function ctrlSetVportDirectoryVisible({ vportId, visible }) {
  if (!vportId) throw new Error("vportId required");
  return setVportDirectoryVisibleDAL(vportId, Boolean(visible));
}
```
- No `callerActorId` parameter
- No `assertActorOwnsVportActorController` call
- Uses `vportId` (internal profileId) not `actorId`
- Security enforcement deferred to DAL layer

**`setVportDirectoryVisibleDAL`:**
```js
const { data: auth, error: authError } = await supabase.auth.getUser();
const userId = auth?.user?.id;
// ...
.eq("id", vportId)
.eq("owner_user_id", userId)  // ← ownership enforced here
```
DAL re-authenticates via `supabase.auth.getUser()` and filters by `owner_user_id = auth.uid()`. This is a non-standard pattern (authorization in DAL, not controller) but functionally provides ownership enforcement.

**`setVportBusinessCardSettingsDAL`:** Same DAL-layer auth pattern — `auth.getUser()` + `.eq("owner_user_id", userId)` — FUNCTIONAL but wrong layer.

**`setVportBusinessCardPublishStateDAL`:** Calls RPC `set_business_card_publish_state` — comment says "SECURITY DEFINER, ownership enforced at DB." RPC source UNVERIFIED.

## 5. Controller Authorization (Architecture Issue)

`ctrlSetVportDirectoryVisible` violates the architecture contract: authorization must be in the Controller layer, not the DAL layer. The controller accepts `vportId` (internal profileId) from the caller with zero validation, relying entirely on the DAL + Supabase session to enforce ownership.

Functional risk is MEDIUM (DAL does enforce ownership via `auth.uid()`), but the pattern creates:
1. Wrong identity surface (`vportId` = profileId, not actorId)
2. Authorization in wrong layer (DAL, not controller)
3. If the DAL is bypassed (test, service-role client, direct Supabase call), no ownership is enforced

## 6. SECURITY DEFINER Concern

`set_business_card_publish_state` RPC is tagged as SECURITY DEFINER in the DAL comment. SECURITY DEFINER RPCs run with elevated DB privileges. If the RPC's internal ownership check (`auth.uid()`) is bypassed or the RPC is called with a spoofed session, it could modify rows outside the caller's ownership. RPC source not reviewed — marked UNVERIFIED.

---

**VENOM SECURITY FINDING VPD-V-026**
- Finding ID: VPD-V-026
- Location: `vportDirectoryVisibility.controller.js` — `ctrlSetVportDirectoryVisible`
- Application Scope: VCSM
- Platform Surface: PWA · Supabase Table/View
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Actor Ownership Contract — authorization in wrong layer
- Contract Violated: Actor Ownership Contract · Architecture Layer Contract
- Current behavior: `ctrlSetVportDirectoryVisible({ vportId, visible })` has no `callerActorId` parameter and no `assertActorOwnsVportActorController` call. Ownership is enforced only inside the DAL via `auth.getUser()` + `.eq("owner_user_id", userId)`. Uses `vportId` (profiles.id) as the identity field, not `actorId`.
- Risk: Authorization is in the DAL layer, violating the VCSM architecture contract. If the DAL is called directly (test context, engine bypass, service-role client), ownership is not enforced at the controller boundary. `vportId` (internal profileId) is exposed as the authority surface instead of `actorId`.
- Severity: MEDIUM
- Exploitability: MEDIUM — DAL does enforce via Supabase session; direct DAL bypass requires service-role or test context
- Attack Preconditions: Direct DAL access (service-role client, test framework, edge function bypass)
- Blast Radius: Any VPORT directory visibility state
- Identity Leak Type: Ownership inference (vportId exposed as identity claim)
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: ASSUMED (DAL uses auth.uid())
- Why it matters: Architecture contract requires authorization at Controller layer. DAL-layer authorization creates blind spots when controllers are called directly. Also introduces `vportId` (profileId) as an authority surface in violation of the actor-based identity contract.
- Recommended mitigation: Add `callerActorId` parameter to `ctrlSetVportDirectoryVisible`. Call `assertActorOwnsVportActorController` before passing to DAL. Resolve `vportId` server-side from `actorId` inside the controller.
- Follow-up command: Wolverine (refactor), SENTRY (architecture compliance)
- CISSP Domain:
  - Primary: Security Architecture and Engineering
  - Secondary: Identity and Access Management

**VENOM SECURITY FINDING VPD-V-027**
- Finding ID: VPD-V-027
- Location: `vports.write.dal.js` — `setVportBusinessCardPublishStateDAL` RPC call
- Application Scope: VCSM
- Platform Surface: PWA · Supabase RPC
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Actor Ownership Contract — UNVERIFIED (SECURITY DEFINER RPC)
- Contract Violated: Actor Ownership Contract
- Current behavior: `setVportBusinessCardPublishStateDAL` calls `vport.set_business_card_publish_state` RPC tagged as SECURITY DEFINER. Comment states "ownership enforced at DB." RPC source not reviewed.
- Risk: SECURITY DEFINER RPCs run with elevated privileges. If the ownership check inside the RPC is insufficient (e.g., checks `auth.uid()` but not the `owner_user_id` relationship, or if `auth.uid()` can be spoofed via forged JWT), the RPC could modify business card state for any VPORT.
- Severity: HIGH (UNVERIFIED — requires DB-level source review)
- Exploitability: MEDIUM — requires compromised JWT or RPC logic flaw
- Attack Preconditions: Forged JWT or RPC ownership bypass
- Blast Radius: Any VPORT business card publish state
- Identity Leak Type: None
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: ASSUMED (SECURITY DEFINER bypasses RLS — ownership must be explicitly checked inside function)
- Why it matters: SECURITY DEFINER functions bypass RLS by design. If the function's internal ownership check is flawed, there is NO RLS safety net.
- Recommended mitigation: Review RPC source (`vport.set_business_card_publish_state`) and confirm it checks `auth.uid() = owner_user_id` before any mutation. Document the ownership logic.
- Follow-up command: DB → review RPC source; CARNAGE
- CISSP Domain:
  - Primary: Security Architecture and Engineering
  - Secondary: Identity and Access Management

---

# ADDITIONAL SHARED-CONTROLLER FINDING

**VENOM SECURITY FINDING VPD-V-028** *(notification sender UUID fallback — confirms BW-VPD-005)*
- Finding ID: VPD-V-028
- Location: `notification.model.js` line 107 — `route: actorId ? /profile/${actorId} : '#'`
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen (notification recipient)
- Boundary Violated: Public Identity Surface Contract
- Contract Violated: Public Identity Surface Contract
- Current behavior: When a notification sender has no `username`, the route field falls back to `/profile/${actorId}` (UUID). This renders as a clickable link in notification cards.
- Risk: Any notification whose sender lacks a username exposes the sender's UUID in the rendered notification card link.
- Severity: MEDIUM
- Exploitability: LOW — passive exposure (not a write or read bypass)
- Blast Radius: All notification recipients where sender lacks username/slug
- Identity Leak Type: Internal UUID exposure
- Cache Trust Type: None
- RLS Dependency: NONE
- Recommended mitigation: Fall back to `'#'` or null instead of the actorId UUID.
- Follow-up command: Wolverine
- CISSP Domain:
  - Primary: Asset Security
  - Secondary: Identity and Access Management

---

# SUMMARY TABLES

## Per-Card Status Table

| # | Card | Gate Strength | UUID in URL | Write Ownership | RLS Verified | Findings | Status |
|---|---|---|---|---|---|---|---|
| 1 | QR | UI-only | ⚠️ UUID fallback | No mutations | N/A | VPD-V-001 | MEDIUM |
| 2 | Flyer | UI-only (desktop lock) | ⚠️ Always UUID | No mutations | N/A | VPD-V-002, V-003 | MEDIUM |
| 3 | Flyer Edit | UI-only | ⚠️ Always UUID | UNVERIFIED | UNVERIFIED | VPD-V-004, V-005 | HIGH |
| 4 | Menu Preview | UI-only | ⚠️ UUID fallback | No mutations | N/A | VPD-V-006 | MEDIUM |
| 5 | Exchange | UI-only | ⚠️ Always UUID | UNVERIFIED | UNVERIFIED | VPD-V-007 | HIGH |
| 6 | Team | STRONG (assertActorOwns) | ⚠️ Always UUID | STRONG + 1 gap | UNVERIFIED | VPD-V-008, V-009 | HIGH |
| 7 | Portfolio | UI-only | ⚠️ Always UUID | UNVERIFIED | UNVERIFIED | VPD-V-010, V-011 | HIGH |
| 8 | Locksmith | UI-only | ⚠️ Always UUID | UNVERIFIED | UNVERIFIED | VPD-V-012, V-013 | HIGH |
| 9 | Services | UI-only | ⚠️ Always UUID | UNVERIFIED | UNVERIFIED | VPD-V-014 | HIGH |
| 10 | Reviews | UI-only | ⚠️ Always UUID | N/A (read) | UNVERIFIED | VPD-V-015 | INFO-HIGH |
| 11 | Leads | WEAK (string compare) | ⚠️ Always UUID | WEAK | UNVERIFIED | VPD-V-016, V-017 | MEDIUM |
| 12 | Reviews QR | UI-only | ⚠️ UUID fallback | No mutations | N/A | VPD-V-018 | MEDIUM |
| 13 | Booking History | STRONG + 1 gap | ⚠️ Always UUID | STRONG + 2 gaps | UNVERIFIED | VPD-V-019, V-020, V-021 | HIGH |
| 14 | Calendar | STRONG (writes) / ABSENT (reads) | ⚠️ Always UUID | STRONG (writes) / ABSENT (schedule read) | UNVERIFIED | VPD-V-022 | HIGH |
| 15 | Gas | UI-only | ⚠️ Always UUID | UNVERIFIED | UNVERIFIED | VPD-V-023 | HIGH |
| 16 | Ads | UI-only | ⚠️ Always UUID | UNVERIFIED | UNVERIFIED | VPD-V-024, V-025 | HIGH |
| 17 | Settings | STRONG + 1 DAL-layer gap | ⚠️ Always UUID | STRONG + 1 DAL-layer | ASSUMED (DAL auth) | VPD-V-026, V-027 | MEDIUM-HIGH |

---

## Findings Table by Severity

### HIGH

| ID | Card | Issue | Requires Immediate Fix |
|---|---|---|---|
| VPD-V-005 | Flyer Edit | Flyer editor controller ownership UNVERIFIED | YES — source review required |
| VPD-V-007 | Exchange | Rate upsert ownership UNVERIFIED | YES — source review required |
| VPD-V-008 | Team | `acceptBarbershopInviteController` — `barberVportActorId` not verified | YES — fix controller |
| VPD-V-010 | Portfolio | `deleteItem` actorId from route — engine ownership UNVERIFIED | YES — source review |
| VPD-V-013 | Locksmith | `useLocksmithOwner` ownership UNVERIFIED | YES — source review |
| VPD-V-014 | Services | `VportServicesView` write ownership UNVERIFIED | YES — source review |
| VPD-V-019 | Booking History | `customerActorId` attribution injection | YES — fix controller |
| VPD-V-020 | Booking History | UUID in notification linkPaths | YES — fix controller |
| VPD-V-022 | Calendar/Schedule | `loadDayScheduleController` — no ownership check, customer PII exposed | YES — CRITICAL path |
| VPD-V-023 | Gas | Gas price write ownership UNVERIFIED | YES — source review |
| VPD-V-025 | Ads | Ads CRUD ownership UNVERIFIED | YES — source review |
| VPD-V-027 | Settings | SECURITY DEFINER RPC ownership UNVERIFIED | YES — DB review |

### MEDIUM

| ID | Card | Issue |
|---|---|---|
| VPD-V-001 | QR | UUID fallback in QR URL |
| VPD-V-002 | Flyer | UUID always in flyer URL |
| VPD-V-004 | Flyer Edit | UUID in flyer editor URL |
| VPD-V-006 | Menu Preview | UUID fallback in menu preview URL |
| VPD-V-015 | Reviews | Write paths UNVERIFIED |
| VPD-V-016 | Leads | Weak `assertCallerOwns` gate |
| VPD-V-017 | Leads | Lead `leadId` deletion cross-VPORT risk |
| VPD-V-018 | Reviews QR | UUID fallback in reviews QR URL |
| VPD-V-021 | Booking History | No terminal-state guard |
| VPD-V-024 | Ads | UUID always in ads route |
| VPD-V-026 | Settings | Authorization in wrong layer (DAL not controller) |
| VPD-V-028 | Shared | Notification sender UUID fallback |

### LOW / INFO

| ID | Card | Issue |
|---|---|---|
| VPD-V-003 | Flyer | Client-side desktop lock only |
| VPD-V-009 | Team | DAL write filters by resourceId only (RLS dependency) |
| VPD-V-011 | Portfolio | Email PII passed to probe — DEV-gated but fragile |
| VPD-V-012 | Locksmith | Supabase error details exposed to owner |

---

## RLS Policy Gap Table

| Table | Operations at Risk | Verification Status | Finding |
|---|---|---|---|
| `bookings` (read) | SELECT by actorId — no app-layer ownership check | UNVERIFIED | VPD-V-022 |
| `bookings` (INSERT) | `customer_actor_id` from caller | UNVERIFIED | VPD-V-019 |
| `bookings` (UPDATE) | Status update by bookingId — no column filter | UNVERIFIED | VPD-V-021 |
| `resources` (UPDATE) | Team accept/decline by resourceId only | UNVERIFIED | VPD-V-009 |
| `vport_leads` (DELETE) | Delete by `profileId + leadId` — cross-VPORT leadId risk | UNVERIFIED | VPD-V-017 |
| `vport.profiles` (UPDATE) | Directory visibility — owner_user_id filter in DAL | ASSUMED (DAL auth) | VPD-V-026 |
| `vport.set_business_card_publish_state` RPC | SECURITY DEFINER | UNVERIFIED | VPD-V-027 |
| Rate tables (exchange) | Upsert | UNVERIFIED | VPD-V-007 |
| Gas price tables | Write | UNVERIFIED | VPD-V-023 |
| Portfolio engine tables | Create/update/delete | UNVERIFIED | VPD-V-010 |
| Ads tables | CRUD | UNVERIFIED | VPD-V-025 |

---

## Service-Role / SECURITY DEFINER Bypass Table

| Location | Type | Risk | Status |
|---|---|---|---|
| `vport.set_business_card_publish_state` RPC | SECURITY DEFINER | Bypasses RLS — ownership must be checked inside function | UNVERIFIED |
| `vportClient.js` (vportSchema) | Client type unknown | If service-role: all RLS bypassed for vport schema operations | UNVERIFIED — DB audit required |

---

## Shared-Controller Risk Map

| Controller / DAL | Used By Cards | Shared Risk |
|---|---|---|
| `assertActorOwnsVportActorController` | 6, 7 (team), 13 (bookings), 14 (calendar), 17 (public details) | STRONG — single canonical gate; any weakening affects all cards |
| `loadDayScheduleController` | 14 (calendar/schedule), implicitly 13 | Missing ownership — HIGH risk shared across both schedule surfaces |
| `updateVportBookingDAL` | 13 (booking history), 14 (schedule) | No state guard — MEDIUM risk on both booking write surfaces |
| `publishVcsmNotification` | 13 (cancel), 13 (public booking create) | UUID in linkPath affects all notification recipients |
| `vportLeads.controller.js assertCallerOwns` | 11 (leads only) | Isolated MEDIUM risk |
| `vportDirectoryVisibility.controller.js` | 17 (settings) | DAL-layer auth pattern — isolated MEDIUM risk |

---

## P0/P1/P2 Remediation Plan

| Priority | Finding ID | Issue | Layer | Recommended Command |
|---|---|---|---|---|
| **P0** | VPD-V-022 | `loadDayScheduleController` — customer PII exposed without ownership | Controller | Wolverine |
| **P0** | VPD-V-019 | Booking attribution injection (`customerActorId`) | Controller | Wolverine |
| **P0** | VPD-V-020 | UUID in notification deep links | Controller | Wolverine |
| **P0** | VPD-V-008 | `acceptBarbershopInviteController` — barberVportActorId not verified | Controller | Wolverine |
| **P1** | VPD-V-005 | Flyer editor controller ownership — source review | Controller | Wolverine |
| **P1** | VPD-V-007 | Exchange rate write ownership — source review | Controller | Wolverine |
| **P1** | VPD-V-010 | Portfolio `deleteItem` engine ownership — source review | Engine | Wolverine |
| **P1** | VPD-V-013 | Locksmith owner write — source review | Controller | Wolverine |
| **P1** | VPD-V-014 | Services write ownership — source review | Controller | Wolverine |
| **P1** | VPD-V-023 | Gas price write ownership — source review | Controller | Wolverine |
| **P1** | VPD-V-025 | Ads CRUD ownership — source review | Controller | Wolverine |
| **P1** | VPD-V-021 | Booking terminal-state guard | Controller | Wolverine |
| **P1** | VPD-V-016 | Leads weak gate (`assertCallerOwns` → canonical) | Controller | Wolverine |
| **P1** | VPD-V-026 | Directory visibility — authorization in wrong layer | Controller | Wolverine + SENTRY |
| **P1** | VPD-V-027 | SECURITY DEFINER RPC — source review | DB | DB → CARNAGE |
| **P2** | VPD-V-001/002/004/006/018/024/028 | UUID exposure in URLs/notifications | Controller + Router | Wolverine |
| **P2** | VPD-V-009 | Team DAL secondary ownership filter | DAL + RLS | CARNAGE |
| **P2** | VPD-V-017 | Lead deletion cross-VPORT risk | RLS | CARNAGE |
| **P2** | VPD-V-012 | Locksmith error verbosity | Screen | Wolverine |
| **P2** | VPD-V-011 | Portfolio probe email PII | Hook | Wolverine |

---

## THOR Release Gate Verdict

**RELEASE BLOCK RECOMMENDED** on the following:

| Blocker | Reason |
|---|---|
| VPD-V-022 | Customer PII (names, notes) readable by any authenticated actor via `loadDayScheduleController` |
| VPD-V-019 | Any actor can create bookings attributed to any other actor |
| VPD-V-020 | Actor UUID exposed in every booking notification |
| VPD-V-008 | Any actor can accept a barbershop team invite on behalf of any other actor |

**CAUTION (P1 — fix before next booking/calendar release):**

| Caution | Reason |
|---|---|
| VPD-V-005, V-007, V-010, V-013, V-014, V-023, V-025 | Ownership UNVERIFIED on flyer edit, exchange, portfolio, locksmith, services, gas, ads — must confirm before next release cycle |
| VPD-V-021 | Terminal-state guard missing — data integrity risk |
| VPD-V-016 | Leads gate inconsistency |
| VPD-V-026/027 | Authorization in wrong layer + SECURITY DEFINER UNVERIFIED |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 2 | VPD-V-023 (gas fraud), VPD-V-027 (SECURITY DEFINER risk posture) |
| Asset Security | 8 | UUID exposure, PII in bookings, error verbosity, email in probe |
| Security Architecture and Engineering | 7 | Wrong auth layer, DAL-only gate, missing defense-in-depth, SECURITY DEFINER |
| Communication and Network Security | 2 | Notification UUID delivery, public menu UUID in printable flyer |
| Identity and Access Management | 17 | All ownership gaps, UUID surfaces, attribution injection, wrong identity surface |
| Security Assessment and Testing | 3 | UNVERIFIED ownership on 7+ cards — test coverage gap |
| Security Operations | 2 | Error verbosity (locksmith), email in probe |
| Software Development Security | 10 | Caller-controlled IDs, wrong auth layer, client-side locks, DAL patterns |

**CISSP domains with full coverage:** Identity and Access Management (primary across all findings), Software Development Security.

**CISSP domains with partial coverage:** Communication and Network Security (limited to notification/URL surface — network transport layer not reviewed), Security Operations (limited to debug/error output; full logging and audit trail not reviewed).

**CISSP domains not applicable in this review:** Security Assessment and Testing (testing infrastructure not in scope), Security Operations (SIEM/monitoring not in scope).

---

## Required Follow-up Commands

| Command | Reason | Priority |
|---|---|---|
| **Wolverine** | P0 fixes: `loadDayScheduleController`, `customerActorId` injection, notification UUID, team invite | P0 |
| **CARNAGE** | RLS on `bookings`, `resources`, `vport_leads`, `vport.profiles`; SECURITY DEFINER RPC source | P1 |
| **DB** | Confirm `vportClient.js` is anon client (not service-role); review `set_business_card_publish_state` RPC | P1 |
| **Wolverine** | P1 source reviews: exchange, portfolio engine, locksmith, services, gas, ads ownership | P1 |
| **SENTRY** | Architecture compliance: authorization in DAL (`vportDirectoryVisibility`), `assertCallerOwns` inconsistency | P1 |
| **THOR** | Release gate evaluation for P0 blockers | NOW |
| **BLACKWIDOW** | Re-test after P0 fixes are implemented | Post-fix |
| **LOGAN** | Document ownership gate standard for adapter-wrapped features (locksmith, services, exchange, gas, ads, portfolio) | P2 |
