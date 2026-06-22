# PROFILES-MEGAFOLDER-SPLIT-001 — Citizen vs VPORT Extraction Review

```
[PROFILES-MEGAFOLDER-SPLIT-001] Citizen vs VPORT Profile Domain Extraction
Status: Complete (Analysis Only)
Priority: P2
Type: ENG
App: VCSM
Mode: READ ONLY — no code changes, no refactors, no file create/delete
Target: apps/VCSM/src/features/profiles/  (404 files)
Date: 2026-06-08
```

> **Verdict up front:** **GO — but the "split" is mostly already done.** The folder is
> not a flat mega-folder; it is already segmented into `kinds/citizen/` (19 files,
> 100% pure) and `kinds/vport/` (273 files, isolated). Citizen and VPORT have **zero
> cross-imports of each other**. The real work is (1) hardening the top-level
> **shared/dispatcher surface** (~112 files) into an explicit `shared/` boundary, and
> (2) relocating the **21 VPORT adapters that leaked into top-level `adapters/`** back
> under the vport domain. This is a **MEDIUM** effort, not a Major rewrite.

---

## Evidence Base

All findings below are grounded in direct reads + ripgrep of
`apps/VCSM/src/features/profiles/` and external-importer sweeps across
`apps/VCSM/src/`. Central dispatch verified by reading
[profileKindRegistry.js](apps/VCSM/src/features/profiles/kinds/profileKindRegistry.js),
[VportProfileKindScreen.jsx](apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileKindScreen.jsx),
and [ActorProfileViewScreen.jsx](apps/VCSM/src/features/profiles/screens/views/ActorProfileViewScreen.jsx).

Top-level shape (404 files):

| Top dir | Files | Domain |
|---|---|---|
| `kinds/citizen/` | 19 | **Citizen Only** — 100% pure |
| `kinds/vport/` | 273 | **VPORT Only** — isolated from citizen |
| `adapters/` | 27 | 21 = VPORT-leaked, 6 = shared UI/ops adapters |
| `screens/` | 33 | Shared dispatcher + actor-generic views + citizen tab views |
| `dal/` | 16 | Actor-generic (polymorphic reads) |
| `controller/` | 8 | Actor-generic (polymorphic) |
| `hooks/` | 10 | Actor-generic |
| `model/` | 5 | Actor-generic |
| `components/` | 4 | Actor-generic UI |
| `styles/` | 7 | Mixed (citizen + vport CSS) |
| `debug/` | 1 | Dev-only |
| `config/` | 0 | empty |

---

## Deliverable A — Folder Inventory

### A.1 CITIZEN ONLY (19 files — `kinds/citizen/`)

All 19 are **PURE**: zero imports from `kinds/vport/`, zero `kind === 'vport'` branches.
Cross-feature deps are domain-neutral (`@/features/block`, `@hydration`,
`@/services/supabase/supabaseClient`).

| Path | Purpose | Consumers | Domain |
|---|---|---|---|
| `kinds/citizen/tabs/CitizenTabRouter.jsx` | Mounts citizen tabs | ActorProfileViewScreen | Citizen |
| `kinds/citizen/tabs/{posts,photos,tags}/Citizen*Tab.jsx` | Thin wrappers → Actor*View | CitizenTabRouter | Citizen |
| `kinds/citizen/tabs/friends/CitizenFriendsTab.jsx` | → ActorProfileFriendsView | CitizenTabRouter | Citizen |
| `kinds/citizen/tabs/videos/CitizenVideosTab.jsx` | "Coming soon" placeholder | CitizenTabRouter | Citizen |
| `kinds/citizen/controller/resolveUsernameToActor.controller.js` | username → actorId | useUsernameProfileRedirect | Citizen `[CITIZEN_ONLY]` |
| `kinds/citizen/controller/friends/*.controller.js` (5) | Top-friends + friend-lists logic | friends hooks | Citizen |
| `kinds/citizen/model/profile.model.js` | Citizen profile row mapper | — | Citizen `[CITIZEN_ONLY]` |
| `kinds/citizen/model/friends/friendGraph.model.js` | Derive friend buckets | getFriendLists ctrl | Citizen |
| `kinds/citizen/dal/readActorIdByUsername.dal.js` | actor_directory lookup | resolveUsernameToActor | Citizen `[CITIZEN_ONLY]` |
| `kinds/citizen/dal/friends/*.dal.js` (3) | Follow graph + ranks read/write | friends controllers | Citizen |
| `kinds/citizen/hooks/useUsernameProfileRedirect.js` | Redirect hook | UsernameProfileRedirect | Citizen |

> **Note — Friends is structurally Citizen-only.** VPORT has no friends system.
> The 6 friend hooks under `screens/views/tabs/friends/hooks/` import exclusively from
> `kinds/citizen/controller/friends/*`. They physically sit in the "shared" screens
> tree but are **Citizen-domain by dependency**. (See Risk: CITIZEN-LEAK-01.)

### A.2 VPORT ONLY (273 files — `kinds/vport/` + 21 leaked adapters)

`kinds/vport/` is organized into **13 self-contained subdomains**, each carrying its own
controller/dal/hooks/model/screens stack:

| Subdomain | Files | Self-Contained? |
|---|---|---|
| menu | 62 | Yes |
| content | 30 | Yes |
| services | 30 | Yes |
| booking | 20 | Yes (hooks+screens) |
| locksmith | 17 | Yes |
| portfolio | 17 | Mostly (no own DAL; shared models) |
| review | 16 | Yes |
| rates | 13 | Mostly (DAL shared w/ exchange) |
| barbershop | 11 | Yes (uses shared ActorProfilePostsView) |
| exchange | 5 | Yes |
| subscribers | 4 | Yes |
| gas | 1 | **No** — tab only; logic in `vportDashboard` |
| team | 1 | **No** — placeholder |

Plus VPORT screen/registry roots: `VportProfileKindScreen.jsx`,
`VportProfileViewScreen.jsx`, `VportProfileContext`, tab routers, `vportOwnership.model.js`.

**21 leaked VPORT adapters** physically at `adapters/kinds/vport/` (should live under the
vport domain — see Deliverable F / Risk CRIT-ADAPTER-01).

### A.3 SHARED — Actor-Generic (truly polymorphic, serve both kinds)

Tagged `[SHARED_ACTOR_PRIMITIVE]` in source; achieve polymorphism by **branching on
`actor.kind` at the DATA layer**, not by duplicating logic:

| Path | Purpose |
|---|---|
| `controller/getProfileView.controller.js` | Polymorphic profile RPC (branches kind, unified shape) |
| `controller/resolveActorBySlug.controller.js` | slug/username → actorId (vport→user→legacy) |
| `controller/buildActorCanonicalSlug.controller.js` | Canonical SEO slug for any kind |
| `controller/getActorKind.controller.js` | kind lookup |
| `controller/getActorPosts.controller.js`, `getActorVibeTags.controller.js` | Posts/tags for any actor |
| `controller/{profileCache,photos/photoReactions}.controller.js` | Cache ops / reactions |
| `dal/readActorProfile.dal.js` | Polymorphic profile row (profiles vs vport.profiles) |
| `dal/resolveActorSlug.dal.js` | Triple-fallback slug resolution |
| `dal/{readActorKind,readActorType,readActorSeoData,readFollowState}.dal.js` | Generic reads |
| `dal/{post,photos,tags}/*.dal.js` | Posts/photos/tags reads |
| `model/{actorSeo,post,postCanonical,isDeletedProfileActor}.model.js` | Generic mappers |
| `hooks/{useProfileView,useProfileGate,useActorKind,useActorCanonicalSlug,useResolveActorBySlug,useActorSeoMeta,useActorSlugRedirect,useActorProfileActions,useProfilesOps}.js` | Generic profile hooks |
| `components/{PrivateProfileGate,UnavailableProfileGate}.jsx` + `header/{Messagebutton,Subscribebutton}.jsx` | Generic UI |
| `screens/views/ActorProfileHeader.jsx`, `ActorProfileTabs.jsx` | Generic header + tab bar |
| `screens/views/Actor{Posts,Photos,Tags,Friends}View.jsx` | Generic tab views (consumed by citizen tabs) |
| `screens/views/tabs/{post,tags}/...`, `profileheader/*`, `UsernameProfileRedirect.jsx` | Generic |
| `adapters/{profiles,ui/*,photos/*,tags/*}.adapter.js` (6) | Shared adapter boundary |

### A.4 DISPATCHER (kind-aware routing — the seam itself)

| Path | Role | Evidence |
|---|---|---|
| `kinds/profileKindRegistry.js` | `{user: ActorProfileViewScreen, vport: VportProfileKindScreen}` | Frozen map |
| `screens/ActorProfileScreen.jsx` | Route entry; resolves kind; `PROFILE_KIND_REGISTRY[kind]` | line 205 |
| `screens/views/ActorProfileViewScreen.jsx` | The **`user`** screen; renders CitizenTabRouter | lines 146/185 |

### A.5 UNKNOWN / REQUIRES INVESTIGATION

| Path | Question |
|---|---|
| `screens/views/ActorProfileViewScreen.jsx` lines 45–56 | Carries **vport-normalization** branch (`isVport`, `vportName/vportSlug/vportAvatarUrl`) even though registry routes vport to a different screen. Vestigial/dead leak — confirm before deleting. |
| `screens/views/tabs/friends/**` (13 files) | Citizen-by-dependency but physically in shared tree. Move with citizen or keep in shared? (Recommend: citizen.) |
| `styles/*` (7 CSS) | `barbershop-owner-mode.css`, `*-portfolio/team/booking-modern.css` are VPORT; `*-friends/photos-modern.css` are citizen/shared. Split with domains. |
| `screens/views/ActorProfileFriendsView.jsx` | Generic view but **friends only render for citizen**; only file in shared tree calling `useIdentity()` directly. |

---

## Deliverable B — Dependency Graph

```
                         ROUTE: /profile/:actorId   /u/:username
                                      │
                        screens/ActorProfileScreen.jsx   ◄── DISPATCHER
                          │  resolves slug→actorId→kind (shared hooks)
                          │  PROFILE_KIND_REGISTRY[kind]
              ┌───────────┴────────────┐
        kind="user"                kind="vport"
              │                         │
   ActorProfileViewScreen      VportProfileKindScreen
   (the citizen screen)        → VportProfileViewScreen
        │                              │
   CitizenTabRouter            VportTabRouter + 13 subdomains
   → kinds/citizen/*           → kinds/vport/*
        │                              │
        └──────────┬───────────────────┘
                   ▼
        SHARED ACTOR PRIMITIVES (top-level)
   controller/* · dal/* · hooks/* · model/* · components/*
   (polymorphic; branch on actor.kind at data layer)
                   ▼
        engines/ (hydration, post, booking, reviews) · shared/
```

**Directional edges:**

| Edge | Exists? | Evidence |
|---|---|---|
| Citizen → VPORT | **NO** | grep `kinds/citizen` for vport = 0 hits |
| VPORT → Citizen | **NO** | grep `kinds/vport` for citizen = 0 hits |
| Shared → Citizen | **YES (controlled)** | `ActorProfileViewScreen` imports `CitizenTabRouter` (the dispatcher edge) |
| Shared → VPORT | **YES (controlled + 1 leak)** | registry imports `VportProfileKindScreen`; `ActorProfileViewScreen` lines 45-56 vport-normalize (vestigial) |
| Citizen → Shared | **YES** | citizen tabs render `ActorProfile{Posts,Photos,Tags}View`; friends hooks use shared tree |
| VPORT → Shared | **YES** | vport imports `useProfileView`, `useProfileGate`, `useActorSeoMeta`, `resolveActorBySlug`, `ActorProfile{Posts,Photos}View`, `ActorProfileHeader`, `UnavailableProfileGate` |

**Circular dependencies:** **NONE FOUND.** Both kinds depend on Shared; Shared depends
on neither kind except at the two explicit dispatch edges (registry + view screen). The
dependency graph is a DAG. This is the single most important finding for safety.

---

## Deliverable C — Route Audit

| Route | Entry Screen | Kind | Shared? | Public? | Owner-only? |
|---|---|---|---|---|---|
| `/u/:username` | UsernameProfileRedirect | Both | Yes (redirect) | Protected | No |
| `/profile/:actorId` | ActorProfileScreen | Both (dispatches) | Yes (entry) | Protected | No |
| `/profile/:id/friends/top/edit` | TopFriendsRankEditor | Citizen | No | Protected | Yes |
| `/me` → `/profile/self` | (redirect) | Both | Yes | Protected | Self |

Defined in `app/routes/lazyApp.jsx`, `app/routes/protected/app.routes.jsx`,
`app/routes/index.jsx`. **No public/unauthenticated profile route exists** — all guarded
by `<ProtectedRoute>`.

**Routes that break if split today:** All three lazy imports in `lazyApp.jsx` point at
`@/features/profiles/screens/...`. Moving those screens requires updating
**3 import lines + 1 dashboard redirect guard** (`appRoutes.redirects.jsx` uses
`useResolveActorBySlug`). Low route-coupling.

---

## Deliverable D — Ownership Boundary Audit

| Rule | Location | Domain |
|---|---|---|
| `deriveVportIsOwner({viewerActorId, profileActorId})` → string equality | `kinds/vport/model/vportOwnership.model.js` | VPORT (UI gate) |
| `checkVportOwnershipController` (server, `actor_owners` RPC) | `adapters/kinds/vport/ownership.adapter.js` → re-exports `vportDashboard.adapter` | VPORT (write gate) |
| `viewerActorId === profileActorId` (self/owner) | `hooks/useProfileGate.js`, `ActorProfileFriendsView.jsx` | Shared/Citizen |
| `availableActors` / `identity.actorId` | `useIdentity()` from `@/features/identity/adapters/identity.adapter` | Shared identity source |

**Findings:**
- Ownership is **actor-equality based** in both domains (no kind-specific divergence in
  the *rule*, only in *where the gate lives*).
- VPORT write-ownership routes through `vportDashboard.adapter` — meaning the canonical
  VPORT ownership authority physically lives in **another feature** (`vportDashboard`),
  re-exported via a profiles adapter. **This is ownership logic in the wrong place** and
  the main reason 3 of the 21 leaked adapters are "boundary bridges" that cannot simply
  move (Risk HIGH-OWN-01).
- Shared files never call `useIdentity()` directly except `ActorProfileFriendsView.jsx`;
  identity is otherwise threaded as `viewerActorId` props from `ActorProfileScreen`. Clean.

---

## Deliverable E — Context Audit

| Context | Consumers | Domain | Can stay shared? | Should move? |
|---|---|---|---|---|
| `VportProfileContext` (+ provider) | VportTabRouter, VportMenuView, vport tabs (canManage) | VPORT | No | Move with vport |
| (no `ProfileContext` / `CitizenProfileContext` exists) | — | — | — | Citizen passes props, no context |
| Review/Menu/Content state | Local to each vport subdomain (hooks/models) | VPORT | No | Move with vport |

**Finding:** There is **no shared cross-kind React context**. Citizen renders entirely via
props threaded from `ActorProfileScreen`. VPORT uses one domain-local `VportProfileContext`
carrying `authorization.canManage`. **No context coupling blocks the split.**

---

## Deliverable F — Shared Component Audit

| Classification | Items |
|---|---|
| **TRUE SHARED** | `ActorProfileHeader`, `ActorProfileTabs`, `ActorProfile{Posts,Photos,Tags}View`, `PrivateProfileGate`, `UnavailableProfileGate`, `header/{Message,Subscribe}button`, `useProfileView`, `useProfileGate`, slug/kind/SEO primitives |
| **SHARED BUT SHOULD SPLIT** | `styles/*` (7 CSS — mix citizen + vport); `ActorProfileViewScreen` (the `user` screen wrongly carries vport-normalization lines 45-56) |
| **VPORT LEAKING INTO CITIZEN** | `ActorProfileViewScreen.jsx:45-56` vport-normalization branch (vestigial — registry already routes vport elsewhere); **21 vport adapters at `adapters/kinds/vport/`** sitting in the top-level adapters tree |
| **CITIZEN LEAKING INTO SHARED** | `screens/views/tabs/friends/**` (13 files) + `ActorProfileFriendsView.jsx` — friends is citizen-only but lives in the shared screens tree |

Special-attention domains:
- **reviews / services / menu / content / booking / portfolio / exchange / gas / rates / team / subscribers** → all **VPORT-exclusive**, already self-contained under `kinds/vport/<sub>/`. No citizen entanglement.
- **photos / posts / tags / friends** → citizen-facing tab content; posts/photos/tags use **shared actor-generic** views, friends is **citizen-only**.

---

## Deliverable G — State & Identity Audit

| State | Domain | Blocks extraction? |
|---|---|---|
| `useIdentity` / `identity.actorId` / `availableActors` | Shared (identity feature) | No — external adapter, consumed uniformly |
| `viewerActorId` prop threading | Shared (from ActorProfileScreen) | No |
| Friend ranks / follow graph | Citizen (`kinds/citizen/dal/friends`) | No — citizen-local |
| `VportProfileContext.authorization.canManage` | VPORT-local | No |
| React Query cache keys (`useProfilesOps` invalidation) | Shared; consumed by `settings/profile` + `vportDashboard` | **Watch** — cache-key contract is cross-feature (Risk MED-STATE-01) |

**No global Zustand profile store** found. State that would block extraction: **none**.
Only watch item is the shared React-Query cache-invalidation contract (`useProfilesOps`),
relied on by external features.

---

## Deliverable H — Extraction Strategy (Recommended Target)

Because the kind split already exists, **do NOT create three sibling top-level features.**
Promote the existing internal structure to an explicit boundary instead:

```
features/profiles/
  shared/            ← promote top-level controller/dal/hooks/model/components/screens(dispatcher+generic views)
    dispatch/        ← ActorProfileScreen, profileKindRegistry, ActorProfileViewScreen(cleaned)
    actor-generic/   ← slug/kind/SEO/posts/photos/tags primitives + Actor*View
    ui/              ← gates, header buttons, generic header/tabs
  citizen/           ← kinds/citizen/* + screens/views/tabs/friends/** + ActorProfileFriendsView + citizen CSS
  vport/             ← kinds/vport/* + adapters/kinds/vport/* (relocated) + vport CSS
  adapters/          ← public boundary (profiles.adapter + ui/* stay; vport adapters re-pathed)
```

Rejected alternative: `features/citizenProfiles/` + `features/vportProfiles/` +
`features/profileShared/` as three peers. **Rejected** because the dispatcher + slug
resolution must remain a single entry point for routing (`/profile/:actorId` resolves
kind *before* it knows which domain) — three peers would force a circular route→shared→kind
dependency. Keep one `profiles` feature, three internal zones.

**Minimum viable boundary:** an enforced rule that `citizen/` and `vport/` may import
`shared/` but never each other, and `shared/` may import neither except at the two
dispatch edges (registry, view screen). This is already true in practice — formalize it
with an ESLint boundary rule (consistent with the workspace's existing adapter-enforcement
script pattern).

---

## Deliverable I — Extraction Phases

| Phase | Action | Risk | Blast Radius | Depends on | Rollback |
|---|---|---|---|---|---|
| **0. Baseline** | Add ESLint import-boundary rule (citizen⇎vport forbidden, both→shared OK). Snapshot passes today. | LOW | none (lint only) | — | Trivial (delete rule) |
| **1. Relocate leaked VPORT adapters** | Move the ~13 passthrough adapters from `adapters/kinds/vport/` → `kinds/vport/adapters/`; update ~15 external importers (mostly `vportDashboard`). Leave 3 boundary-bridge adapters (`ownership`, gas screens, `vportProfile` umbrella) until Phase 4. | MED | ~15 external files across vportDashboard/vport/flyerBuilder | Phase 0 | Medium (path revert) |
| **2. Carve `shared/` zone** | Move top-level `controller/dal/hooks/model/components` + generic `screens/views/Actor*View` into `profiles/shared/`. Update internal import paths only (external adapters unchanged). | MED | internal-only if adapters preserved | Phase 0 | Medium |
| **3. Extract citizen** | Move `screens/views/tabs/friends/**` + `ActorProfileFriendsView` into `profiles/citizen/`. Split `styles/*-friends/photos-modern.css`. | LOW | citizen-internal; friends route import | Phase 2 | Easy |
| **4. Extract vport + fix ownership leak** | Consolidate `kinds/vport/*` + relocated adapters under `profiles/vport/`. Address `checkVportOwnership` living in `vportDashboard` (LOG as ownership-relocation ticket — do not fix inline). Split vport CSS. | HIGH | vportDashboard ↔ profiles bidirectional surface | Phases 1,2 | Hard |
| **5. Clean dispatcher** | Remove vestigial vport-normalization in `ActorProfileViewScreen.jsx:45-56` after confirming dead. Confirm registry is sole kind branch. | MED | dispatch path (all profile routes) | Phases 3,4 | Medium |
| **6. Delete legacy structure** | Remove now-empty `kinds/` shell, old adapter paths. | LOW | none if Phases 1-5 green | all | Easy (git) |

---

## Deliverable J — Risk Matrix

| ID | Severity | Class | Finding |
|---|---|---|---|
| CRIT-ADAPTER-01 | **CRITICAL** | controller/DAL coupling | 21 VPORT adapters live at `adapters/kinds/vport/` (outside `kinds/vport/`), consumed by ~15 external `vportDashboard`/`vport`/`flyerBuilder` files. Largest single coupling surface. Relocating them rewrites the most import paths. |
| HIGH-OWN-01 | **HIGH** | ownership coupling | Canonical VPORT write-ownership (`checkVportOwnershipController`) physically lives in `vportDashboard`, re-exported through `profiles/adapters/kinds/vport/ownership.adapter.js`. Bidirectional profiles↔vportDashboard ownership dependency. **DB AUDIT NOTE candidate** (actor_owners RPC). |
| HIGH-DISPATCH-01 | **HIGH** | route coupling | All profile routes funnel through `ActorProfileScreen` → registry. Single entry point is good for safety but means any dispatcher regression breaks **both** domains at once. |
| MED-LEAK-01 | MEDIUM | context/state coupling | `ActorProfileViewScreen` (the citizen `user` screen) still vport-normalizes (lines 45-56). Vestigial leak; confirm dead before removal (Phase 5). |
| MED-CITIZEN-01 | MEDIUM | state coupling | `screens/views/tabs/friends/**` (13 files) are citizen-by-dependency but sit in the shared tree; `ActorProfileFriendsView` is the only shared file calling `useIdentity()` directly. |
| MED-STATE-01 | MEDIUM | state coupling | `useProfilesOps` cache-invalidation contract consumed externally by `settings/profile` + `vportDashboard`. Cache keys are a cross-feature API — preserve through Phase 2. |
| MED-CSS-01 | MEDIUM | (asset) coupling | `styles/*` mixes citizen + vport CSS in one folder; split per-domain. |
| LOW-ROUTE-01 | LOW | route coupling | 3 lazy imports in `lazyApp.jsx` + 1 redirect guard reference profiles screen paths. Mechanical update. |
| INFO-ISOLATION-01 | INFO | — | **No circular deps. No citizen⇎vport cross-imports. No shared cross-kind context.** The domain boundary is already clean — this is the dominant positive signal. |

---

## Deliverable K — Final Verdict

1. **Can Citizen and VPORT profiles be safely extracted?**
   **YES.** They are already isolated (zero cross-imports, no shared context, DAG
   dependency graph). The task is formalizing an existing boundary, not untangling a knot.

2. **Minimum viable boundary:**
   One `profiles` feature with three enforced internal zones — `shared/` (dispatch +
   actor-generic primitives), `citizen/`, `vport/` — plus an ESLint rule forbidding
   citizen⇎vport imports. The dispatcher (`ActorProfileScreen` + `profileKindRegistry`)
   must remain the single shared route entry.

3. **First file to move:**
   The **leaked VPORT adapters** at `adapters/kinds/vport/` (Phase 1) — highest coupling,
   most external importers, and moving them shrinks blast radius for every later phase.
   Concretely, start with the pure passthroughs (`vportProfiles.adapter.js`,
   `services.adapter.js`, `locksmith.adapter.js`, `exchange.adapter.js`,
   `config/vportTypes.config.adapter.js`).

4. **Last file to move:**
   `screens/views/ActorProfileViewScreen.jsx` + `profileKindRegistry.js` — the dispatch
   seam. Cleaned and re-pointed only after both domains are fully relocated (Phase 5).

5. **Single highest-risk dependency:**
   **`adapters/kinds/vport/ownership.adapter.js` → `vportDashboard.adapter` →
   `checkVportOwnershipController` (actor_owners RPC).** VPORT ownership authority lives
   in another feature and crosses the profiles boundary in both directions. It is the one
   edge that cannot be cleanly cut by moving files — it needs an ownership-relocation
   decision (logged, not patched here).

6. **Estimated effort: MEDIUM.**
   Not Small (404 files, ~30 external importers, ownership cross-feature edge). Not Large/
   Major (no rewrite, no logic changes, no circular deps, kind split already exists). The
   work is relocation + path updates + one ESLint guard + one ownership-ticket spin-off.

```
Recommended Architecture : Single profiles/ feature → {shared, citizen, vport} internal zones + ESLint boundary
Recommended Order        : Phase 0 (lint) → 1 (vport adapters) → 2 (shared) → 3 (citizen) → 4 (vport) → 5 (dispatcher) → 6 (delete legacy)
Go / No-Go               : GO — boundary is already clean; formalize, don't untangle.
```

### DB AUDIT NOTES (deferred — not patched in this READ-ONLY pass)

```
DB AUDIT NOTE:
- DB object: actor_owners (RPC backing checkVportOwnershipController)
- Risk: VPORT write-ownership authority is reached from profiles via a vportDashboard
        re-export; relocation of ownership logic may change which feature "owns" the RPC call site.
- Why deferred: READ ONLY review; no code/DB changes permitted; ownership relocation is a
        separate decision (HIGH-OWN-01) for Phase 4.
- Suggested later SQL review: confirm actor_owners RLS + RPC SECURITY DEFINER posture is
        unaffected by app-layer relocation (call sites only; no schema change implied).
```

---

*Analysis only. No code modified, no files created/deleted in the target. This document is
the sole artifact.*
