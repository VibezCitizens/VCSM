# PROFILES-CONSOLIDATION-MASTER-001 — Final End-to-End Profiles Evidence Base

```
[PROFILES-CONSOLIDATION-MASTER-001] Canonical Profiles Domain Evidence Base
Status: Complete (READ ONLY — final full-domain read)
Priority: P1
Type: ARCHITECTURE
App: VCSM
Supersedes (as reference): the need for any future full-domain reread
Builds on: SPLIT-001…005 (boundary work — treated as COMPLETE, not re-audited)
Date: 2026-06-08
Domain size: 404 files (citizen 30 · vport 318 · shared/core ~56)
```

> **This document is the permanent reference.** All future Profiles tickets derive from it.
> No future ticket may perform another full-domain reread unless new functionality is added.
> Boundary enforcement (citizen⇄vport=0, dispatcher whitelist, ESLint ERROR) is **complete and
> not re-audited here.** Focus: remaining ownership, coupling, debt, and extraction work.

---

## 0. Current Physical Layout (post-SPLIT-005)

```
profiles/
  controller/ (8)  dal/ (15)  hooks/ (10)  model/ (6)  components/ (4)  screens/ (21)  styles/ (7)  debug/ (1)
  adapters/ (14)   → profiles.adapter, ui/*, photos/*, tags/*  +  adapters/kinds/vport/ (8 bridges)
  kinds/
    profileKindRegistry.js                         (dispatch)
    citizen/ (30)  → friends (relocated), resolveUsername, tabs (posts/photos/tags/videos/friends)
    vport/ (318)   → 13 subdomains + adapters(12) + context + screens(117) + dal(45) + controller(44) + hooks(34) + model(14)
```

Zones are **logical (path-glob)** — no physical `shared/`/`dispatch/` folders. Enforced by the
`profiles-domain-boundary` ESLint rule + 3-file dispatcher whitelist.

---

## Deliverable 1 — Domain Ownership Map

| Area | True Owner | Internal Cons. | External Cons. | Future Owner (if changing) | Extraction Readiness |
|---|---|---|---|---|---|
| **Profile routing** | `screens/ActorProfileScreen.jsx`, `UsernameProfileRedirect.jsx`, slug hooks/controllers, `profileKindRegistry.js` | 5 | 8 (routes, BottomNav, public menu ×5, flyer) | profiles (keep) | **READY** |
| **Slug / canonical URL** | `controller/{resolveActorBySlug,buildActorCanonicalSlug}`, `hooks/use{ResolveActorBySlug,ActorCanonicalSlug,ActorSlugRedirect}` | — | `useActorCanonicalSlug`: 6 public + shell + flyer | profiles (keep) | **READY** |
| **Profile hydration** | `controller/getProfileView.controller.js` (+ citizen `hydrateActorsIntoStore`) | 2 screens | 0 | profiles (keep) | **READY** (writes confined to controller) |
| **Profile cache** | `dal/readActorProfile.dal.js` (TTL), `controller/profileCache.controller.js`, `hooks/useProfileOps.js` | 2 | 2 (settings/profile) | profiles (keep); migrate TTL→RQ | **READY** (contract via `useProfileOps`) |
| **Profile actions** | `hooks/useActorProfileActions.js`, `adapters/ui/actorProfileScreenDependencies.adapter.js` | 1 (citizen) | 0 | profiles (keep) | **READY** (bridges post+moderation adapters) |
| **Profile display** | `screens/views/ActorProfile{Header,Tabs,Posts/Photos/TagsView}`, `components/header/{Message,Subscribe}button` | 2 | 0 | profiles (keep) | **READY** (presentational) |
| **Gate / privacy** | `hooks/use{ProfileGate,ProfileView}`, `components/{Private,Unavailable}ProfileGate` | 2 | 2 (social notice) | profiles (keep) | **READY** ⚠ 1 adapter-boundary violation (TD-01) |
| **SEO** | `model/actorSeo.model.js`, `dal/readActorSeoData.dal.js`, `hooks/useActorSeoMeta.js` | 2 | 0 | profiles (keep) | **READY** (pure model + read DAL) |
| **Dispatcher** | `kinds/profileKindRegistry.js` + 3-file whitelist | 1 | 1 (diagnostics) | profiles (keep) | **READY** (frozen, minimal) |
| **Citizen friends** | `kinds/citizen/{controller,dal,model}/friends/*` + `kinds/citizen/tabs/friends/**` | route + CitizenFriendsTab | route edit page | citizen (settled) | **READY** |
| **VPORT ownership (UI)** | `kinds/vport/model/vportOwnership.model.js` (`deriveVportIsOwner`) | VportProfileViewScreen + context | 0 | profiles vport (keep UI) | **READY** (pure) |
| **VPORT ownership (server)** | ❗ `vportDashboard/controller/checkVportOwnership.controller.js` + booking `assertActorOwnsVportActorController` | via `adapters/kinds/vport/ownership.adapter.js` re-export | rates/locksmith/etc. (20 uses of booking assert) | **DECISION NEEDED (OWN-01)** | **BLOCKED** |
| **VPORT content** | `kinds/vport/{controller,dal,hooks,model,screens}/content` (30) | self | 0 | profiles vport | **READY** (self-contained) |
| **VPORT menu** | `kinds/vport/.../menu` (62) | self | public menu (via adapters) | profiles vport | **READY** (self-contained, largest) |
| **VPORT services** | `kinds/vport/.../services` (30) | ↔ locksmith | vport create/dashboard | profiles vport | **PARTIAL** (TD-03 circular) |
| **VPORT locksmith** | `kinds/vport/.../locksmith` (17) | ↔ services | dashboard | profiles vport | **PARTIAL** (TD-03) |
| **VPORT rates / exchange** | `kinds/vport/.../{rates,exchange}` | self (+booking assert) | dashboard exchange | profiles vport | **READY** |
| **VPORT review** | `kinds/vport/.../review` (16) | → services (reads catalog) | dashboard reviews | profiles vport | **PARTIAL** (review→services) |
| **VPORT portfolio** | `kinds/vport/.../portfolio` (17, no DAL) | → locksmith component | dashboard portfolio | profiles vport | **INCOMPLETE** (no own DAL) |
| **VPORT booking** | screen-only; logic in booking engine + vportDashboard | bridge | — | **booking engine + vportDashboard** | **BLOCKED** (no internal stack) |
| **VPORT gas** | tab-only; logic in vportDashboard (7 bridges) | VportGasTab | — | **vportDashboard** | **BLOCKED** (bridge) |
| **VPORT team** | tab-only → barbershop → `useVportTeam` (vportDashboard) | barbershop | — | **vportDashboard** | **BLOCKED** (bridge) |
| **VPORT subscribers** | `kinds/vport/.../subscribers` (controllers only) | booking/review | — | profiles vport | **INCOMPLETE** (thin) |

---

## Deliverable 2 — Remaining Technical Debt (post-SPLIT-005 only)

| ID | Severity | File(s) | Dependency Impact | Future Ticket |
|---|---|---|---|---|
| **TD-01** | **HIGH** | **5 Block `adapter-boundary` ERRORs** (corrected 2026-06-08; earlier "1" undercounted — grep missed several): `hooks/useProfileGate.js:6` ✅FIXED in SPLIT-006; **still open:** `kinds/citizen/controller/friends/getFriendLists.controller.js:3`, `getTopFriendActorIds.controller.js:2`, `getTopFriendCandidates.controller.js:3` (all `@/features/block`), and `screens/views/ActorProfileHeader.jsx:10` (`@/features/block/adapters/ui/ActorActionsMenu` — flagged because the path lacks a `.adapter` suffix; verify whether a `.adapter`-named surface exists) | **Live `adapter-boundary` ESLint ERRORs.** SPLIT-007 determined the remaining 4 have **block-side / rule-side** root cause (controller has no `.adapter` surface — only the `index.js` barrel; `ActorActionsMenu.jsx` lacks the `.adapter` suffix). Profiles already consumes block's intended surfaces; no compliant in-profiles fix without violating adapter-purity or editing block. | SPLIT-006 (useProfileGate ✅); remaining 4 → **BLOCK-ADAPTER-NAMING-001** (block-owned) |
| **TD-02** | **MEDIUM** (was HIGH) | OWN-01 **RESOLVED by PROFILES-OWN-001 (2026-06-08)**: canonical authority = **`features/authorization`** (`assertActorOwnsActorController` + `actor_owners` DAL). booking-assert & vportDashboard-check are **thin delegating wrappers**; profiles holds only the UI signal `deriveVportIsOwner`. **Ownership does NOT block VPORT extraction.** Remaining: retire/repoint the compat bridges (`ownership.adapter`, booking/vportDashboard wrappers) to `authorization.adapter`. | **PROFILES-BRIDGE-AUDIT-001** (repoint bridges; no authority relocation) |
| **TD-03** | **LOW** (was MEDIUM) | services ↔ locksmith bidirectional. **Analyzed by PROFILES-SUBDOMAIN-DECOUPLE-001 (2026-06-08):** NO module cycle (leaf targets never import back); domain-level only. Backwards edge = locksmith default-seeding hardcoded in `upsertVportServices.controller.js:98-109`. **Does NOT block whole-VPORT extraction** (both extract together) — cleanup only; hard blocker only for splitting services/locksmith into separate features. | **PROFILES-SUBDOMAIN-DECOUPLE-IMPL** (cut: relocate seeding to locksmith; keep locksmith→services) |
| **TD-04** | **MEDIUM** | Cross-subdomain reaches: `review→services` (catalog), `portfolio→locksmith` (component), `team→barbershop`, `barbershop→portfolio` | Reduces subdomain modularity; must be mapped before per-subdomain extraction. | **PROFILES-SUBDOMAIN-DECOUPLE-001** |
| **TD-05** | **LOW — partially CLEARED** | **PROFILES-BRIDGE-CLEANUP-001 (2026-06-08) DONE:** deleted 6 dead gas adapters + retired the `ownership.adapter` round-trip (repointed 6 vportDashboard consumers → `vportDashboard/controller/checkVportOwnership.controller`). Remaining = facades (keep) + booking-assert ×13 (repoint to authorization, future). **Audited by PROFILES-BRIDGE-AUDIT-001 (2026-06-08):** no hard extraction blockers. **6 of 7 gas bridges DEAD** (0 consumers → delete). **`ownership.adapter` = pointless round-trip** (consumed only by vportDashboard to reach its own symbol → RETIRE). Live facades (gas-view, team, owner-stats, booking) = legit one-way vportDashboard-capability consumption (KEEP). booking-assert ×13 → REPOINT to authorization. Bidirectional vport↔vportDashboard (12 fwd/23 rev) is adapter-mediated soft concern, not a blocker. | **PROFILES-EXTRACT-VPORT-001** (cleanup steps F.1–F.4 first) |
| **TD-06** | **MEDIUM** | ~45 pre-existing ESLint **errors** across profiles (mostly `single-source-actor`, `no-direct-layer-skip`, `no-ttl-cache`) | Pre-existing lint debt unrelated to boundary work; if CI blocks on errors this is already red. | **PROFILES-LINT-DEBT-001** |
| **TD-07** | **LOW** | `kinds/citizen/tabs/friends/components/TopFriendsRankEditor.jsx:23` — `single-source-actor` | Pre-existing (filename-agnostic rule; `localActorIds` matches `/actorId/i`). Subset of TD-06. | folded into PROFILES-LINT-DEBT-001 |
| **TD-08** | **LOW** | TTL cache: 13 `@/shared/lib/ttlCache` imports in DAL; `no-ttl-cache` governance prefers React Query | Cache modernization; contract change risk for `useProfileOps` consumers (settings). | **PROFILES-CACHE-MODERNIZE-001** |
| **TD-09** | **LOW** | Incomplete subdomain stacks: `booking`/`gas`/`team` (no internal stack), `portfolio` (no DAL), `subscribers` (controllers only) | Not broken; structurally thin. Informational for extraction planning. | (tracked, no standalone ticket) |
| **TD-10** | **INFO** | Zones logical, not physical (`shared/`/`dispatch/` folders absent) | Optional hygiene; enforcement already works on globs. | **PROFILES-PHYSICAL-FOLDERS-001** (optional) |

---

## Deliverable 3 — Ownership Review

**What Profiles legitimately OWNS (keep):**
- Actor routing, slug→actor→kind→screen dispatch, canonical-slug + SEO, profile hydration writes, profile TTL cache + invalidation contract, gate/privacy orchestration, profile display chrome.
- Citizen: friends system (ranks/follow-graph), username resolution, citizen tabs.
- VPORT data domains: content, menu, services, rates, exchange, review, locksmith, subscribers (their own controller/dal/model/screens), and the **UI** ownership signal `deriveVportIsOwner`.

**What Profiles SHOULD NOT own (borrowed via bridges — belongs elsewhere):**
| Surface | Currently | Belongs to |
|---|---|---|
| VPORT **server ownership authority** (`checkVportOwnershipController`) | re-exported through `adapters/kinds/vport/ownership.adapter.js` | **vportDashboard** (or a shared identity/ownership engine) |
| VPORT **booking** runtime (`useVportBookingOps`, `mapAvailabilityRule`) | bridged in `kinds/vport/screens/booking/**` | **booking engine + vportDashboard** |
| **Gas** pricing (all logic) | 7 thin adapters → vportDashboard | **vportDashboard** |
| **Team** roster (`useVportTeam`) | bridged via barbershop screens | **vportDashboard** |
| **Owner quick stats** (`useOwnerQuickStats`) | `kinds/vport/hooks/useVportOwnerQuickStats.js` | **vportDashboard** |

**actor_owners / authorization (special attention):**
- Profiles READS `vc.actor_owners` at `kinds/vport/dal/rates/actorOwners.read.dal.js` (rates ownership read).
- The **enforcement** path is `@/features/booking` → `assertActorOwnsVportActorController` (**20 call sites** in profiles vport controllers: rates, locksmith, barbershop, menu, services) — this is the real server-side gate, NOT the `ownership.adapter` re-export.
- **Two-layer model:** UI `deriveVportIsOwner` (profiles, synchronous) + server `assertActorOwnsVportActorController`/`checkVportOwnershipController` (booking + vportDashboard, `actor_owners`-backed).
- **No authorization/booking/actor_owners logic should be modified** — these are owned outside profiles. Profiles only consumes them through adapters.

---

## Deliverable 4 — Extraction Readiness

| Candidate | Status | Blocking Dependency | Risk |
|---|---|---|---|
| **Citizen** | **READY** | none (0 vport imports; friends settled) | LOW |
| **Shared/core** | **READY** | none (polymorphic primitives; adapter-bounded) | LOW |
| **VPORT content** | **READY** | self-contained | LOW |
| **VPORT menu** | **READY** | self-contained | LOW |
| **VPORT rates/exchange** | **READY** | booking assert (adapter) | LOW |
| **VPORT services** | **BLOCKED** | TD-03 services↔locksmith circular | MEDIUM |
| **VPORT locksmith** | **BLOCKED** | TD-03 circular | MEDIUM |
| **VPORT review** | **PARTIAL** | review→services read (TD-04) | LOW |
| **VPORT portfolio** | **PARTIAL** | no own DAL; →locksmith component (TD-04/09) | LOW |
| **VPORT ownership** | **NOT BLOCKED** (OWN-001 resolved) | authority in `authorization`; bridges are thin delegates | MEDIUM |
| **VPORT booking** | **NOT BLOCKED** (BRIDGE-AUDIT/CLEANUP) | facade over booking engine + vportDashboard; adapter-mediated, one-way | LOW |
| **VPORT gas / team** | **NOT BLOCKED** (BRIDGE-AUDIT/CLEANUP) | dead gas adapters deleted; live gas/team are facades to vportDashboard | LOW |
| **Physical folder split (shared/citizen/vport)** | **READY** (optional) | none (logical zones already enforced) | LOW |

---

## Deliverable 5 — Dependency Inventory

**Profiles → OUTSIDE (167 cross-feature edges; 99.3% adapter-compliant):**

| Bucket | Count | Notes |
|---|---|---|
| **Engines** | 5 | `@hydration` (`useActorStore`, `hydrateActorsByIds`, `hydrateActorsFromRows`), `useActorSummary` |
| **Shared/services/state** | 135 | supabase clients 96 (`vportClient` 39, `supabaseClient` 25), `@/shared/lib` 30 (`ttlCache` 13, `resolveVportProfileId` 12, `iosProdDebugger` 6), `@/state` 9, `@/queries` 6 |
| **Other features (via adapter)** | 103 | booking 29 (`assertActorOwnsVportActorController` 20), identity 17 (`useIdentity`), vportDashboard 12, upload 12 (`createSystemPost`), social 11, post 7, block 6, moderation 4, media 2, qrcode/notifications/chat 1 each |
| **Other features (DIRECT — violation)** | 5 (corrected) | `useProfileGate.js` (✅fixed SPLIT-006) + 3 citizen friends controllers + `ActorProfileHeader.jsx` → block (TD-01) |

**OUTSIDE → Profiles (production 40 imports, 100% via adapters; + 23 diagnostics):**

| Consumer feature | Imports | Entry adapter |
|---|---|---|
| vportDashboard | 23 | `kinds/vport/adapters/*` (vportProfiles, config, hooks, screens) |
| public (vportMenu) | 6 | `profiles.adapter` (`useActorCanonicalSlug`) |
| vport | 5 | `kinds/vport/adapters/{config,vportProfiles,...}` |
| flyerBuilder | 2 | `useVportPublicDetails.adapter`, `profiles.adapter` |
| social / shell / settings | 1 each | `ui/PrivateProfileGate.adapter` / `profiles.adapter` (`useActorCanonicalSlug`, `useProfileOps`) |
| dev/diagnostics | 23 | direct (acceptable — diagnostic tooling) |

**Ownership dependencies:** booking `assertActorOwnsVportActorController` (20), vportDashboard `checkVportOwnershipController` (via ownership.adapter), `actor_owners` read DAL (1, in rates). **Zero circular cross-feature deps.** One vport-internal circular (TD-03).

---

## Deliverable 6 — Future Ticket Map (execution order)

| # | Ticket | Objective | Scope | Risk | Depends On | Blast Radius |
|---|---|---|---|---|---|---|
| 1 | **PROFILES-SPLIT-006** | Fix the live adapter-boundary violation | Repoint `useProfileGate.js` block import to the block adapter; sweep for any other direct cross-feature imports in profiles | LOW | — | 1 file (+ any found) |
| 2 | **PROFILES-LINT-DEBT-001** | Clear the ~45 pre-existing ESLint errors | `single-source-actor`, `no-direct-layer-skip`, `no-ttl-cache` across profiles (incl. TD-07 TopFriendsRankEditor) | MEDIUM | — | ~30–45 files (surgical, per-rule) |
| 3 | **PROFILES-SUBDOMAIN-DECOUPLE-001** | Break services↔locksmith circular + map review/portfolio/team cross-reaches | Introduce a shared seam (model/DAL) so neither subdomain imports the other's internals | MEDIUM | — | services + locksmith + review + portfolio |
| 4 | **PROFILES-OWN-001** | Decide + relocate VPORT server-ownership authority | Where `checkVportOwnershipController` lives; whether profiles keeps the `ownership.adapter` re-export or vportDashboard owns it outright; DB AUDIT for `actor_owners` posture | HIGH | — (decision) | ownership.adapter + ~20 booking-assert call sites |
| 5 | **PROFILES-BRIDGE-AUDIT-001** | Resolve gas/team/booking/stats bridges | Decide owner for each vportDashboard bridge; collapse or formalize | MEDIUM | OWN-001 | 8 bridges + VportGasTab + barbershop/booking screens |
| 6 | **PROFILES-CACHE-MODERNIZE-001** | Migrate profile TTL caches → React Query | Replace `ttlCache` in DAL; preserve `useProfileOps` invalidation contract for settings | MEDIUM | LINT-DEBT-001 (no-ttl-cache overlap) | ~13 DAL files + settings consumers |
| 7 | **PROFILES-PHYSICAL-FOLDERS-001** *(optional)* | Materialize physical `shared/`+`dispatch/` folders | Move logical zones into real folders; update boundary rule globs | LOW | all above | broad (path-only) |
| 8 | **PROFILES-EXTRACT-VPORT-001** *(future)* | Physical VPORT domain extraction | Only after OWN-001 + BRIDGE-AUDIT-001 + DECOUPLE-001 | HIGH | 3,4,5 | very large |

**Recommended sequence:** 1 → 2 → 3 → 4 → 5 → (6) → (7) → 8. Tickets 1–3 are independent and can run in parallel; 4 gates 5; 8 gates on 4+5.

---

## Success Criteria — Met

- ✅ All remaining Profiles work is enumerated (TD-01…10, tickets 1–8).
- ✅ Future tickets derive from this report (no rereads required).
- ✅ Profiles enters **ticket-driven execution mode**.
- ✅ Highest-value next move identified: **PROFILES-SPLIT-006** (fix the one live adapter-boundary ERROR — smallest, unblocks 100% adapter compliance).

### DB AUDIT NOTE (deferred — for PROFILES-OWN-001)
```
- DB object: vc.actor_owners (read at kinds/vport/dal/rates/actorOwners.read.dal.js; enforcement via
  booking.assertActorOwnsVportActorController + vportDashboard.checkVportOwnershipController).
- Risk: relocating ownership authority (OWN-001) may shift which feature owns the actor_owners read/RPC call sites.
- Why deferred: READ ONLY evidence pass; ownership relocation is its own ticket.
- Suggested later SQL review: confirm actor_owners RLS + any ownership RPC posture under OWN-001 (call-site move only; no schema change implied).
```

---

*Analysis only. No files moved, renamed, created, or modified in the target. This document is the canonical Profiles evidence base.*
