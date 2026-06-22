---
name: vcsm.bottom-nav.architecture
description: ARCHITECT targeted module scan — BottomNavBar (bottom navigation bar), 2026-06-06
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-06
  scope: targeted
  trigger: user-requested full architect + deadpool
---

# MODULE ARCHITECTURE REPORT

**Module:** bottom-nav (BottomNavBar)
**Application Scope:** VCSM
**Module Type:** Shared platform component — persistent navigation shell
**Primary Root:** apps/VCSM/src/shared/components/BottomNavBar.jsx
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

BottomNavBar is the primary navigation shell for the VCSM app. It renders the
floating bottom tab bar with 7 navigation targets (Home, Explore, Vox, Upload,
Notifications, Profile, Settings), manages badge counts for notifications and
chat, and doubles as the platform lifecycle mount point for `useBootstrapHydration`
and `useOneSignalPush`. It is mounted once in RootLayout, always-mounted but
CSS-hidden when inactive, and is the authoritative session-level activation trigger
for React Query polling.

---

## OWNERSHIP

Platform engineering. No single feature team. The component has two
distinct responsibilities — navigation UI and platform bootstrap host — that
share a mount point by design.

---

## ENTRY POINTS

- `BottomNavBar` — default export from `apps/VCSM/src/shared/components/BottomNavBar.jsx`
- Mounted in `apps/VCSM/src/app/layout/RootLayout.jsx` (line 96)
- Always mounted; hidden via `display:none` on `hideBottomNav` routes (line 95 RootLayout)

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 0 | None — no database access |
| Model | 0 | None |
| Controller | 0 | None owned; getCachedActorCanonicalSlug imported from profiles controller |
| Service | 0 | None owned; onesignalClient consumed via useOneSignalPush |
| Adapter | 0 | None owned |
| Hook | 0 (consumed) | useBootstrapHydration, useNotificationUnread, useChatUnread, useOneSignalPush, useIdentity, useTranslation |
| Sub-component | 2 | ProfileNavTab (function), Tab (React.memo) |
| Main component | 1 | BottomNavBar (default export) |
| Total source lines | 173 | Single file |

---

## FULL DEPENDENCY CHAIN

```
BottomNavBar (shared/components/BottomNavBar.jsx)
├── identity.adapter (@/features/identity/adapters/identity.adapter)
│   └── re-exports useIdentity from @/state/identity/identityContext
├── bootstrap.hydrate.controller (@/bootstrap/bootstrap.hydrate.controller)
│   └── bootstrap.store (Zustand — sets hydratedForActorId)
│       └── queryClient.invalidateQueries on noti:refresh event
├── bootstrap.selectors (@/bootstrap/bootstrap.selectors)
│   ├── useNotificationUnread → notifications.adapter → getUnreadNotificationCount()
│   │   └── React Query poll every 60s
│   └── useChatUnread → chat.adapter → useChatUnreadOps()
│       └── React Query poll every 30s
├── useOneSignalPush (@/shared/hooks/useOneSignalPush)
│   ├── AuthProvider → useAuth() (for user.id)
│   ├── identity.adapter → useIdentity() (for identity.actorId)
│   └── @/services/onesignal/onesignalClient (SDK wrapper)
├── profiles controller [BOUNDARY WARNING]
│   └── getCachedActorCanonicalSlug from
│       @/features/profiles/controller/buildActorCanonicalSlug.controller
│       (10-min TTL synchronous cache read — no async fetch)
└── @i18n (engines/i18n/index.js) → useTranslation()
```

---

## NAVIGATION STRUCTURE

| Tab | Route | Icon | Badge | Notes |
|---|---|---|---|---|
| Home | /feed | Home | none | end=true (exact match) |
| Explore | /explore | Compass | none | |
| Vox | /chat | MessageCircle | chatUnread (30s poll) | Label changes with count |
| Upload | /upload | Plus | none | Custom button (gradient), not NavLink |
| Notifications | /notifications | Bell | notiCount (60s poll) | Label changes with count |
| Profile | dynamic slug | User | none | ProfileNavTab — slug-cached navigation |
| Settings | /settings | Settings | none | |

---

## BEHAVIOR

### Primary behaviors
- `BEH-BOTNAV-001` — Render 7 tabs in floating bottom bar, always visible on app routes
- `BEH-BOTNAV-002` — Badge: notification count polled every 60s via React Query; displays count on Bell tab
- `BEH-BOTNAV-003` — Badge: chat unread polled every 30s via React Query; displays count on Vox tab
- `BEH-BOTNAV-004` — Profile tab navigates to `/profile/{canonicalSlug}` if slug cached, else `/profile/self`
- `BEH-BOTNAV-005` — On route change to /notifications or /chat: dispatch `noti:refresh` event to trigger badge invalidation
- `BEH-BOTNAV-006` — Platform bootstrap: activate React Query badge polling when actorId becomes valid
- `BEH-BOTNAV-007` — OneSignal: initialize push SDK once on mount; link external user ID when auth + identity ready
- `BEH-BOTNAV-008` — iOS safe area: compute `browserToolbarLift` (2px for non-standalone iOS Safari) on mount

### Nav bar visibility rules (owned by RootLayout, not BottomNavBar)
- Hidden (display:none) on: chat sub-screens, auth routes, learning routes, dev/performance routes
- Always-mounted (CSS hide, not unmount) to preserve React Query subscriptions

---

## FINDINGS

### FINDING-BOTNAV-001 — Dual responsibility: nav UI + platform bootstrap host
**Severity:** MEDIUM
**Pattern:** Mixed concerns — UI component owns session-level lifecycle
**Evidence:** Lines 30–45 of BottomNavBar.jsx — `useBootstrapHydration` and `useOneSignalPush` mounted inside the nav bar
**Risk:** If BottomNavBar is refactored or conditionally unmounted by mistake, the entire badge polling and OneSignal session link breaks silently. The comment-only constraint ("mount once") is unenforced.
**Mitigation present:** RootLayout uses `display:none` instead of conditional mount — correct
**Suggested direction:** Extract to a `<PlatformBootstrapShell>` wrapper component mounted in RootLayout independently of nav visibility. This removes the hidden coupling between nav display and session lifecycle.
**Recommended handoff:** IRONMAN (ownership), SENTRY (boundary enforcement)

### FINDING-BOTNAV-002 — BottomNavBar imports profiles controller directly (adapter bypass)
**Severity:** MEDIUM
**Pattern:** Cross-feature controller import
**Evidence:** Line 9 — `import { getCachedActorCanonicalSlug } from '@/features/profiles/controller/buildActorCanonicalSlug.controller'`
**Correct boundary:** Expose `getCachedActorCanonicalSlug` through `@/features/profiles/adapters/profiles.adapter` (or equivalent)
**Risk:** Direct controller imports create hidden coupling; profile controller refactors silently break the nav bar
**Recommended handoff:** IRONMAN (route to profiles team for adapter surface exposure)
**Status:** KNOWN — documented in 2026-06-04 ARCHITECT run, no fix yet

### FINDING-BOTNAV-003 — RootLayout bypasses identity adapter (direct state import)
**Severity:** LOW-MEDIUM
**Pattern:** Adapter boundary violation
**Evidence:** RootLayout.jsx line 10 — `import { useIdentity } from "@/state/identity/identityContext"` (bypasses `@/features/identity/adapters/identity.adapter`)
**Impact:** Both paths resolve to the same hook, so no runtime difference today. But if identityContext is ever relocated or refactored behind the adapter, RootLayout breaks.
**Correct path:** `import { useIdentity } from '@/features/identity/adapters/identity.adapter'`
**Recommended handoff:** IRONMAN or SENTRY (quick fix)

### FINDING-BOTNAV-004 — noti:refresh is an untyped global event bus
**Severity:** LOW
**Pattern:** Untyped window event — no payload contract, no typed emitter/receiver
**Evidence:** BottomNavBar.jsx line 45 — `window.dispatchEvent(new Event('noti:refresh'))`; bootstrap.hydrate.controller.js line 44 — `onGlobalRefresh` listener
**Risk:** String 'noti:refresh' is the only contract; misspelling silently breaks badge refresh on route change
**Recommended direction:** Centralize event name as a const in bootstrap module; no payload needed
**Recommended handoff:** LOKI (runtime trace), DEADPOOL (if badges stop updating)

### FINDING-BOTNAV-005 — ProfileNavTab routes to /feed on null identity (silent redirect)
**Severity:** LOW
**Pattern:** Silent fallback to non-auth state
**Evidence:** ProfileNavTab lines 104–107 — `if (!personaActorId) { navigate('/feed'); return }`
**Risk:** If a logged-out user somehow sees the nav (edge case — hideBottomNav should prevent this), tapping the Profile tab silently redirects to /feed instead of /login. Unexpected but low-risk given nav is hidden on auth routes.
**Recommended direction:** Consider `navigate('/login')` or no-op on null identity

### FINDING-BOTNAV-006 — useBootstrapStore used as both React hook and vanilla store in same file
**Severity:** INFO
**Pattern:** Zustand dual-use (hook + vanilla)
**Evidence:** bootstrap.hydrate.controller.js line 26 — `const store = useBootstrapStore` (no call, vanilla assignment); then `store.getState().reset()` in effect
**Status:** This is valid Zustand API — Zustand stores are both callable as hooks and addressable via `.getState()` as vanilla stores. No bug. Documented for auditor awareness.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Clear from source and prior scan | |
| Owner defined | FAIL | No ownership record | No DRI assigned |
| Entry points mapped | PASS | Single file, single export | |
| Controllers present/delegated | N/A | No controller layer by design | |
| DAL/repository present/delegated | N/A | No DAL layer by design | |
| Models/transformers present | N/A | N/A | |
| Hooks/view models present | PASS | 6 hooks consumed, all verified in source | |
| Screens/components present | PASS | BottomNavBar + Tab + ProfileNavTab confirmed | |
| Services/adapters present | N/A | Service consumed (OneSignal) via dedicated hook | |
| Database objects mapped | PASS | No write surfaces | |
| Authorization path mapped | PASS | useOneSignalPush gates on user+identity; bootstrap gates on UUID validation | |
| Cache/runtime behavior mapped | PASS | React Query poll intervals documented (60s/30s); slug TTL cache 10min | |
| Error/loading/empty states mapped | PARTIAL | Badges use placeholderData:0 (silent empty); no explicit error state on slug cache miss | |
| Documentation linked | FAIL | BEHAVIOR.md is a PLACEHOLDER stub | |
| Tests/validation noted | FAIL | 0 tests | |
| Native parity noted | PARTIAL | iOS safe area handled in source; no formal iOS parity doc | |
| Engine dependencies mapped | PASS | i18n (engine), identity (adapter), profiles (controller — BOUNDARY WARNING) | |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/i18n | engine | inbound | YES | @i18n alias → engines/i18n/index.js |
| features/identity (adapter) | feature-adapter | inbound | YES | Via identity.adapter re-export |
| state/identity (context) | internal-state | inbound | WATCH | Only in RootLayout — should use adapter |
| @/bootstrap | platform-area | inbound | YES | hydrate controller + selectors |
| features/notifications (adapter) | feature-adapter | inbound | YES | Via bootstrap.selectors |
| features/chat (adapter) | feature-adapter | inbound | YES | Via bootstrap.selectors |
| features/profiles (controller) | feature-controller | inbound | VIOLATION | Direct controller import — should use adapter |
| shared/hooks/useOneSignalPush | shared | inbound | YES | Self-contained shared hook |
| @/services/onesignal | service | inbound | YES | Via useOneSignalPush |
| @/app/providers/AuthProvider | platform-area | inbound | YES | Via useOneSignalPush |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| identity.actorId | read | identityContext | BottomNavBar (personaActorId) | LOW |
| notificationUnread count | read (React Query) | notifications adapter | bootstrap.selectors | LOW |
| chatUnread count | read (React Query) | chat adapter | bootstrap.selectors | LOW |
| canonicalSlug (TTL cache) | read (sync) | buildActorCanonicalSlug controller | ProfileNavTab | MEDIUM — cross-feature boundary violation |
| bootstrap.store.hydratedForActorId | read/write | bootstrap.store | hydrate controller → selectors | LOW |
| noti:refresh DOM event | write (dispatch) | BottomNavBar | bootstrap.hydrate.controller | LOW — untyped string contract |
| OneSignal external user | write (SDK) | useOneSignalPush | OneSignal service | LOW |
| user.id (auth) | read | AuthProvider | useOneSignalPush | LOW |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | N/A | Not a routed screen | |
| Loading state | PASS | Badge placeholderData:0 prevents null flash | |
| Empty state | PASS | Badges hidden when count = 0 | |
| Error state | PARTIAL | No visible error if badge fetch fails (silent 0) | |
| Auth/owner gates | PASS | UUID validation in useBootstrapHydration; user+identity gate in useOneSignalPush | |
| Cache behavior | PASS | React Query staleTime = refetchInterval; slug TTL 10min | |
| Mount constraint | WATCH | Must be mounted exactly once — enforced only by convention, not code | |
| iOS safe area | PASS | browserToolbarLift computed on mount; CSS vars for nav height | |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/shared/BEHAVIOR.md | PRESENT (STUB — PLACEHOLDER) |
| Architecture | ZZnotforproduction/APPS/VCSM/features/shared/ARCHITECTURE.md | PRESENT (2026-06-06) |
| Ownership record | — | MISSING |
| Security audit | ZZnotforproduction/APPS/VCSM/features/shared/outputs/2026/06/04/Venom/ | PRESENT (2026-06-04) |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | N/A | No database objects |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## SPAGHETTI SCORE

**Module:** bottom-nav (BottomNavBar)
**Score:** WATCH
**Reasons:**
1. Dual responsibility (nav UI + bootstrap host) in single component
2. Direct cross-feature controller import (profiles controller bypass)
3. Untyped global event bus (noti:refresh)
4. RootLayout bypasses identity adapter (related boundary issue)
**Release risk:** LOW-MEDIUM — component works correctly today; risks are structural/governance

---

## BEHAVIOR CONSISTENCY CHECK — bottom-nav

```
BEHAVIOR.md present: YES
Status: PLACEHOLDER (no content)

Check A (Source without behavior): FAIL
  → Controller + hooks + lifecycle exist in source; BEHAVIOR.md has no declared behaviors
  → Finding: BEHAVIOR_CONTRACT_ABSENT [bottom-nav]
  → Severity: P1 (persistent shell component used by all authenticated sessions)
  → Recommendation: WOLVERINE behavior intake before next implementation ticket

Check B (Behavior without source): N/A
  → BEHAVIOR.md has no §3 happy paths to cross-check

Check C (§13 engine consistency): PARTIAL
  → Declared engines (prior scan): identity, menu, profile
  → Confirmed in source: identity (adapter), profile (controller)
  → menu engine: not confirmed in bottom-nav source directly
  → Undeclared actual: i18n engine (engines/i18n via @i18n alias) — not in prior declarations

Check D (§6 data change consistency): PASS
  → No write surfaces in shared/bottom-nav layer
```

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md content | HIGH | Persistent shell handling session lifecycle has zero documented behavior contract | LOGAN |
| getCachedActorCanonicalSlug via adapter | MEDIUM | Direct controller import is an adapter boundary violation | IRONMAN |
| PlatformBootstrapShell extraction | MEDIUM | Nav display and session lifecycle are coupled by mount point — structural risk | IRONMAN |
| Ownership record | MEDIUM | No DRI — shared primitives drift without ownership | IRONMAN |
| Zero test coverage | HIGH | 0 tests; badge polling, slug navigation, iOS safe area untested | SPIDER-MAN |
| i18n engine declared in governance | LOW | @i18n import undeclared in prior scanner engine-candidates | LOGAN |
| noti:refresh constant extraction | LOW | Untyped string event name; minor refactor risk | DEADPOOL |

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write BEHAVIOR.md content for bottom-nav | Most active persistent session component has no behavior doc | LOGAN |
| P2 | Expose getCachedActorCanonicalSlug through profiles adapter | Direct controller import — adapter boundary violation | IRONMAN |
| P2 | Extract platform bootstrap concern to PlatformBootstrapShell | Decouple session lifecycle from nav visibility | IRONMAN |
| P2 | Add unit/integration tests for badge polling and slug navigation | Zero test coverage on session-critical component | SPIDER-MAN |
| P3 | Fix RootLayout useIdentity import path | Minor adapter boundary violation in RootLayout | IRONMAN |
| P3 | Extract noti:refresh to named constant | Untyped event bus string | DEADPOOL |

---

## RECOMMENDED HANDOFFS

- **LOGAN** — write BEHAVIOR.md for bottom-nav from this report
- **IRONMAN** — assign ownership, resolve adapter violations (profiles controller + identity context)
- **SPIDER-MAN** — add tests for badge polling, slug navigation, iOS safe area
- **LOKI** — trace noti:refresh event in runtime to confirm badge invalidation chain
- **DEADPOOL** — badge count bugs should trace through this report's dependency chain

---

## Scan Provenance

| Area | Status |
|---|---|
| Source scan | COMPLETE — BottomNavBar.jsx (173 lines), RootLayout.jsx (105 lines), bootstrap files (4), profiles controller (130 lines), useOneSignalPush (93 lines), identity adapter (6 lines), bootstrap store/selectors confirmed |
| Prior governance read | COMPLETE — ARCHITECTURE.md 2026-06-04 read |
| CURRENT_STATUS.md | BLOCKED — read-protected (THOR artifact) — not updated this run |
| Dead code scan | PASS — no dead code detected in BottomNavBar or its direct dependencies |
| Boundary violations | 2 confirmed (profiles controller direct import; RootLayout identity context bypass) |
| New findings vs 2026-06-04 | FINDING-BOTNAV-003 (RootLayout identity bypass) and FINDING-BOTNAV-004 (noti:refresh untyped) are new; BOTNAV-001/002/005/006 are new classifications of known conditions |
