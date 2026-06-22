---
name: vcsm.bottom-nav.deadpool-investigation
description: DEADPOOL forensic investigation — bottom navigation bar, 2026-06-06
metadata:
  type: debug-investigation
  owner: DEADPOOL
  date: 2026-06-06
  scope: VCSM
  architect-gate: PASS (0 days — same session)
  architect-report: ZZnotforproduction/APPS/VCSM/features/shared/outputs/2026/06/06/ARCHITECT/vcsm.bottom-nav.architecture.md
---

# DEADPOOL INVESTIGATION — Bottom Navigation Bar
**Date:** 2026-06-06
**Application Scope:** VCSM
**Investigation Scope:** apps/VCSM/src/shared/components/BottomNavBar.jsx + related shell components

---

## ARCHITECT GATE

```
DEADPOOL ARCHITECT GATE PASS

Upstream Report:
  ZZnotforproduction/APPS/VCSM/features/shared/outputs/2026/06/06/ARCHITECT/vcsm.bottom-nav.architecture.md
  Scope: VCSM / shared / bottom-nav
  Date: 2026-06-06
  Status: SUCCESS
  Age: 0 days

Proceeding with DEADPOOL analysis.
```

---

## STEP 1 — UNDERSTAND THE SYMPTOM

No single user-reported bug was provided. DEADPOOL is operating in proactive audit mode — the ARCHITECT findings for the bottom navigation bar are treated as the symptom set. Each finding is investigated to classify it as: CONFIRMED BUG, BOUNDARY VIOLATION, STRUCTURAL RISK, or INFO.

---

## STEP 2 — TRACE THE FULL PIPELINE

Shell component dependency chain (from ARCHITECT report, confirmed in source):

```
RootLayout
├── BottomNavBar [always-mounted via CSS hide]
│   ├── useBootstrapHydration(actorId) → bootstrap.store → React Query badge polling
│   ├── useOneSignalPush() → OneSignal SDK init + external user link
│   ├── useNotificationUnread() → React Query 60s poll
│   ├── useChatUnread() → React Query 30s poll
│   ├── getCachedActorCanonicalSlug(actorId) → TTL in-memory cache [BOUNDARY VIOLATION]
│   └── useTranslation() → @i18n engine
│
└── VportLeadsChip [conditionally mounted — BUG ROOT]
    └── useVportNewLeadsCount(actorId)
        └── setInterval(pollRefresh, 60_000) ← cleared on unmount
```

---

## STEP 3 — DEBUG PROBES

Static inspection is sufficient for all findings below. No runtime probes required for
findings BUG-001 through BOUNDARY-003 — the break points are proven from source code alone.

---

## STEP 4 — BREAK POINTS FOUND

### BREAK POINT #1 (CONFIRMED BUG)

```
BREAK POINT FOUND
Location: apps/VCSM/src/app/layout/RootLayout.jsx — line 99
           apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount.js — line 42-46
Issue:     VportLeadsChip is conditionally mounted ({!hideBottomNav && <VportLeadsChip />}).
           useVportNewLeadsCount uses a raw setInterval (POLL_MS = 60s) that is
           registered in a useEffect and cleared in its cleanup.
           Every time a user navigates to a chat sub-screen and back, VportLeadsChip
           unmounts → clears the interval → remounts → resets state to count=0 → fires
           refresh() → count flashes 0 before the async fetch completes.
Proof:     useVportNewLeadsCount.js line 42-46:
             useEffect(() => {
               void refresh();                         // ← fires immediately on mount
               const id = setInterval(pollRefresh, POLL_MS);
               return () => clearInterval(id);         // ← cleared on unmount
             }, [refresh, pollRefresh]);
           RootLayout.jsx line 99:
             {!hideBottomNav && <VportLeadsChip />}    // ← conditional unmount
           hideBottomNav is true for: isChatSubScreen, isAuthRoute, isLearningRoute, isDevPerfRoute
Impact:    1. VportLeadsChip shows 0 leads for ~100-500ms every time a user exits a chat
              sub-screen back to a main route — visual flash of "count=0" then disappears,
              then re-appears with the real count.
           2. Poll interval resets every such navigation — leads count can become
              stale by up to an extra 60s after each chat sub-screen visit.
           3. BottomNavBar uses always-mount with CSS hide for this exact reason
              (comment in RootLayout: "Always mounted to preserve realtime subscriptions +
              polling. CSS-hidden when not needed (prevents remount churn)"). VportLeadsChip
              does not follow the same pattern.
```

### BREAK POINT #2 (BOUNDARY VIOLATIONS — 3 sites)

```
BREAK POINT FOUND
Location:  apps/VCSM/src/app/layout/RootLayout.jsx — line 10
           apps/VCSM/src/features/dashboard/vport/components/VportLeadsChip.jsx — line 3
           apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount.js — line 2
Issue:     All three files import useIdentity directly from @/state/identity/identityContext,
           bypassing the approved adapter boundary at @/features/identity/adapters/identity.adapter.
           The adapter re-exports the same hook — no runtime difference today.
Proof:     RootLayout.jsx:10 → import { useIdentity } from "@/state/identity/identityContext"
           VportLeadsChip.jsx:3 → import { useIdentity } from "@/state/identity/identityContext"
           useVportNewLeadsCount.js:2 → import { useIdentity } from "@/state/identity/identityContext"
           identity.adapter.js → export { useIdentity, IdentityProvider } from '@/state/identity/identityContext'
Impact:    Structural. If identityContext is relocated or refactored behind the adapter, all
           three files break without any adapter boundary to buffer the change. The boundary
           violation count grows silently — three confirmed sites, others likely in codebase.
```

### BREAK POINT #3 (BOUNDARY VIOLATION — profiles controller surface gap)

```
BREAK POINT FOUND
Location:  apps/VCSM/src/shared/components/BottomNavBar.jsx — line 9
           apps/VCSM/src/features/profiles/adapters/profiles.adapter.js
Issue:     BottomNavBar imports getCachedActorCanonicalSlug directly from the profiles
           feature controller. The profiles adapter does NOT export this function.
Proof:     BottomNavBar.jsx:9 →
             import { getCachedActorCanonicalSlug } from
               '@/features/profiles/controller/buildActorCanonicalSlug.controller'
           profiles.adapter.js (full content):
             export { useProfilesOps } from '@/features/profiles/hooks/useProfilesOps'
             export { useActorCanonicalSlug } from '@/features/profiles/hooks/useActorCanonicalSlug'
           getCachedActorCanonicalSlug is NOT in the adapter surface.
Impact:    Any rename, move, or refactor of buildActorCanonicalSlug.controller.js silently
           breaks the profile tab navigation without the adapter acting as a boundary buffer.
```

---

## STEP 5 — ROOT CAUSE ANALYSIS

### BUG-001: VportLeadsChip Count Flash

```
ROOT CAUSE
Cause:     VportLeadsChip was added to RootLayout using conditional mount
           ({!hideBottomNav && <VportLeadsChip />}) while BottomNavBar was upgraded
           to always-mount with CSS hide specifically to prevent this problem.
Why it happened:
           VportLeadsChip appears to have been added after the BottomNavBar always-mount
           pattern was established, but the same pattern was not applied. The RootLayout
           comment explains the always-mount rationale for BottomNavBar — "Always mounted
           to preserve realtime subscriptions + polling" — but this discipline was not
           extended to the chip.
Why the system allowed it:
           No enforcement mechanism exists that requires components with internal polling
           (setInterval, React Query) to be always-mounted when they are part of the
           persistent shell. The always-mount pattern is only documented in a source
           comment on the BottomNavBar div.
Whether similar bugs may exist elsewhere:
           YES — any shell-layer component with internal state or polling that is
           conditionally mounted in RootLayout is at risk. The pattern is established
           for BottomNavBar only. Audit RootLayout and any future shell additions.
```

### BUG-002: Identity Adapter Bypass Chain

```
ROOT CAUSE
Cause:     Three files in the shell layer import useIdentity from the internal state
           path rather than the published adapter path.
Why it happened:
           The adapter was likely added after these files were written, and the import
           paths were never updated. The adapter re-exports the same hook, so no runtime
           error ever surfaced.
Why the system allowed it:
           No lint rule or import restriction enforces adapter boundaries for
           cross-feature imports. The violation silently accumulates.
Whether similar bugs may exist elsewhere:
           YES — likely widespread across the codebase given no enforcement. ELEKTRA or
           VENOM can do a broader scan. Scope of this investigation is the shell layer only.
```

### BUG-003: Profiles Adapter Surface Gap

```
ROOT CAUSE
Cause:     getCachedActorCanonicalSlug was never added to the profiles adapter surface.
Why it happened:
           When the synchronous slug cache utility was added to the profiles controller,
           the adapter was not updated to expose it. BottomNavBar imported it directly
           from the controller as a shortcut.
Why the system allowed it:
           No enforcement mechanism requires shared components to use adapter surfaces.
           The ARCHITECT report flagged this (2026-06-04) but no fix was applied.
Whether similar bugs may exist elsewhere:
           Contained to this one import site — only BottomNavBar uses the cached slug
           synchronously. useActorCanonicalSlug hook is the async version already in
           the adapter.
```

---

## STEP 6 — FIX PROPOSALS

### FIX-001: VportLeadsChip — Always-Mount with CSS Hide

```
FIX PLAN
Files to change:  apps/VCSM/src/app/layout/RootLayout.jsx (line 99)
Change required:
  BEFORE:
    {!hideBottomNav && <VportLeadsChip />}

  AFTER:
    <div style={hideBottomNav ? { display: 'none' } : undefined}>
      <VportLeadsChip />
    </div>

Reasoning:
  Matches the existing BottomNavBar always-mount pattern already in RootLayout line 95-97.
  Preserves the setInterval lifecycle. Eliminates the count=0 flash and poll reset.
  VportLeadsChip's own render-guard (line 18: if (!isVport || !actorId || count === 0 ...))
  still controls visibility — no change to its display logic needed.

Risk level:    LOW — purely structural mount change, no logic change
Temporary debug code to remove: None needed
Any follow-up checks:
  - Verify VportLeadsChip does not appear on auth routes (it returns null when identity is
    null/non-vport, so its own guard is sufficient even when mounted)
  - Verify VportLeadsChip does not appear on learning or chat sub-screen routes
    (same — its null return handles this)
Logan update required:  Yes — BEHAVIOR.md for shared must document the always-mount contract
Engine audit update:   No
```

### FIX-002: Identity Adapter Bypass — 3-Site Fix

```
FIX PLAN
Files to change:
  apps/VCSM/src/app/layout/RootLayout.jsx (line 10)
  apps/VCSM/src/features/dashboard/vport/components/VportLeadsChip.jsx (line 3)
  apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount.js (line 2)

Change required (same for all 3 files):
  BEFORE:
    import { useIdentity } from "@/state/identity/identityContext"
  AFTER:
    import { useIdentity } from '@/features/identity/adapters/identity.adapter'

Reasoning:
  Restores adapter boundary. No runtime behavior change (adapter re-exports same hook).
  Prevents silent breakage if identityContext is relocated in a future refactor.

Risk level:    VERY LOW — no runtime behavior change, pure import path update
Temporary debug code to remove: None
Any follow-up checks:  None — verify import resolves (adapter already exports useIdentity)
Logan update required:  No (import path only)
Engine audit update:   No
```

### FIX-003: Expose getCachedActorCanonicalSlug Through Profiles Adapter

```
FIX PLAN
Files to change:
  apps/VCSM/src/features/profiles/adapters/profiles.adapter.js — add export
  apps/VCSM/src/shared/components/BottomNavBar.jsx (line 9) — update import path

Change required:
  profiles.adapter.js — ADD:
    export { getCachedActorCanonicalSlug, invalidateActorCanonicalSlugCache }
      from '@/features/profiles/controller/buildActorCanonicalSlug.controller'

  BottomNavBar.jsx — CHANGE:
    BEFORE:
      import { getCachedActorCanonicalSlug } from
        '@/features/profiles/controller/buildActorCanonicalSlug.controller'
    AFTER:
      import { getCachedActorCanonicalSlug } from
        '@/features/profiles/adapters/profiles.adapter'

Reasoning:
  Closes the direct controller import. Also exports invalidateActorCanonicalSlugCache
  (already used post-write in profiles feature) via the adapter surface.
  No runtime change — same function, new import path.

Risk level:    VERY LOW — no runtime behavior change, pure adapter surface addition
Temporary debug code to remove: None
Any follow-up checks:  Verify profiles.adapter.js does not create circular imports
                       (profiles controller imports from profiles DAL and model only — safe)
Logan update required:  Yes — profiles adapter surface change should update INDEX.md
Engine audit update:   No
```

---

## BUG FIX PROPOSALS (AWAITING APPROVAL)

```
BUG FIX PROPOSAL — BUG-001 (VportLeadsChip count flash)
Root cause:    Conditional mount causes setInterval destruction + state reset on chat
               sub-screen navigation, producing a count=0 flash and poll reset
Fix location:  apps/VCSM/src/app/layout/RootLayout.jsx — line 99
Files affected: 1 (RootLayout.jsx — 1 line change)
Estimated time: 2 minutes
Debug probe needed: No — confirmed from source
Documentation drift status: BEHAVIOR.md for shared is MISSING (stub) — LOGAN update
                             required after fix to document always-mount contract
Engine audit impact: No

---

BUG FIX PROPOSAL — BUG-002 (Identity adapter bypass — 3 sites)
Root cause:    Direct import from internal state path bypasses adapter boundary in 3 files
Fix location:  RootLayout.jsx, VportLeadsChip.jsx, useVportNewLeadsCount.js
Files affected: 3 (1 line each)
Estimated time: 5 minutes
Debug probe needed: No — confirmed from source
Documentation drift status: No doc update required (import path only)
Engine audit impact: No

---

BUG FIX PROPOSAL — BUG-003 (Profiles adapter surface gap)
Root cause:    getCachedActorCanonicalSlug never exposed through profiles adapter;
               BottomNavBar imports directly from controller
Fix location:  profiles.adapter.js (add export), BottomNavBar.jsx (update import)
Files affected: 2 (1 line each)
Estimated time: 3 minutes
Debug probe needed: No — confirmed from source
Documentation drift status: INDEX.md for profiles feature should be updated — LOGAN
Engine audit impact: No

---

Waiting for approval. (FIX / PATCH / PROCEED)
```

---

## STRUCTURAL NOTES (not bugs — no approval needed, routed to downstream commands)

### STRUCTURAL-001: BottomNavBar dual responsibility
Bootstrap host + nav UI in one component. Works correctly today via always-mount pattern.
Recommended future direction: extract `<PlatformBootstrapShell>` wrapper.
**Routing:** IRONMAN (ownership + architecture decision)

### STRUCTURAL-002: noti:refresh untyped event bus
`window.dispatchEvent(new Event('noti:refresh'))` — string-only contract.
Not a bug. Fragile on string drift.
**Routing:** LOKI (trace event chain in runtime), or minimal cleanup extracting the string
to a const in bootstrap module.

### STRUCTURAL-003: ProfileNavTab navigates to /feed on null identity
When `personaActorId === null` during identity loading, profile tab navigates to /feed.
Not a crash. The nav bar is visible during the identity loading window on non-auth routes.
Expected direction: no-op (do nothing) on null identity, or consider a loading spinner
on the profile tab icon.
**Routing:** IRONMAN or WOLVERINE (UX decision)

---

## DOCUMENTATION DRIFT STATUS

```
System: bottom-nav / shared shell
BEHAVIOR.md present: YES
Status: PLACEHOLDER (no content)
Drift classification: DOC MISSING

After fixes BUG-001/002/003 are applied:
  → LOGAN must document the always-mount contract for shell components in BEHAVIOR.md
  → LOGAN must update profiles INDEX.md to reflect adapter surface addition
  → No other Logan docs affected
```

---

## DEBUGGER REGISTRY

No debug probes were built during this investigation. All break points were confirmed
via static source inspection. All three bugs are proven without runtime instrumentation.

```
BUILDDED DEADPOOL ON FILE (no probes added — static investigation only)
```

---

## COMPLETION SAFETY CHECK

- [ ] Visible symptoms proven? YES — all 3 break points confirmed from source
- [ ] Root causes identified (not just symptoms)? YES — each traced to origin
- [ ] No temporary instrumentation left unguarded? YES (none added)
- [ ] Documentation drift reported? YES — BEHAVIOR.md MISSING flagged, LOGAN required
- [ ] Engine audit flagged if required? YES — no engine impact
- [ ] Fixes proposed before applying? YES — all in BUG FIX PROPOSAL blocks above
- [ ] Awaiting approval before any modification? YES

---

## SUMMARY

| ID | Type | Severity | Location | Status |
|---|---|---|---|---|
| BUG-001 | Confirmed Bug | MEDIUM | RootLayout.jsx:99 | RESOLVED — Batch 1 M-2 (2026-06-06) always-mount with CSS hide |
| BUG-002 | Boundary Violation | LOW-MEDIUM | 3 files (1 line each) | RESOLVED — Batch 1 C-1/C-2/C-3 (2026-06-06) identity adapter |
| BUG-003 | Boundary Violation | LOW-MEDIUM | BottomNavBar.jsx:9, profiles.adapter.js | RESOLVED — TICKET-C4 (2026-06-06) useActorCanonicalSlug via adapter |
| STRUCTURAL-001 | Structural Risk | LOW | BottomNavBar dual responsibility | OPEN — routed to IRONMAN |
| STRUCTURAL-002 | Structural Risk | LOW | noti:refresh event string | OPEN — routed to LOKI |
| STRUCTURAL-003 | UX Issue | LOW | ProfileNavTab null identity | OPEN — routed to IRONMAN |

**WHAT'S UP DOC**
