# VENOM Security Report — Owner Tab Injection Gate
**Date:** 2026-05-27
**Reviewer:** VENOM
**Application Scope:** VCSM
**Trigger:** Owner tab injection gate — can non-owners reach owner tab content?

---

## Scope

The `owner` tab is NOT in any static tab preset. It is dynamically injected at runtime only when the viewer is the owner of the VPORT. This audit verifies: (1) the injection gate is sound, (2) the `isOwner` derivation is authoritative enough, and (3) the owner tab content does not expose sensitive data.

---

## Trace Chain

```
VportProfileViewScreen.jsx
  → viewerActorId from useIdentity()
  → profileActorId from route params / profile object
  → isDirectMatch = viewerActorId === profileActorId          [synchronous]
  → ownsViaAccount = useIsActorOwner(profileActorId)          [async, DB-backed via actor_owners]
  → isOwner = isDirectMatch || ownsViaAccount
  → useMemo: if (isOwner) inject { key:"owner", label:"Owner" } into tab list
             else filter out any key === "owner"
  ↓
VportProfileTabContent.jsx (line 117)
  → {tab === "owner" && isOwner ? <VportOwnerView actorId={...} /> : null}
  ↓
VportOwnerView.jsx
  → Renders only:
    - "Dashboard" link → /actor/${actorId}/dashboard
    - "Settings" link → /actor/${actorId}/settings
    - "Private" label on the tab
    - NO data fetch, NO identity field exposure, NO ownership metadata
```

---

## Security Checklist

| Check | Result | Evidence |
|---|---|---|
| Owner tab NOT in any static preset | ✅ PASS | Confirmed — `getVportTabsByType.model.js` has no "owner" key in any preset |
| Tab injection gated by isOwner | ✅ PASS | `VportProfileViewScreen.jsx` lines 105-109 — only added when isOwner === true |
| Tab content double-gated | ✅ PASS | `VportProfileTabContent.jsx` line 117: `tab === "owner" && isOwner` — content cannot render without the flag |
| `isDirectMatch` is synchronous string comparison | ✅ CORRECT | Resolves immediately — no loading window vulnerability |
| `ownsViaAccount` is DB-backed | ✅ PASS | `useIsActorOwner` performs DB lookup via `actor_owners` |
| `VportOwnerView` content: nav links only | ✅ PASS | Inspected — only two `<Link>` elements to /dashboard and /settings |
| No sensitive data fetched in VportOwnerView | ✅ PASS | No DAL calls, no hooks, no identity field exposure |
| actorId in VportOwnerView is public identifier | ✅ SAFE | actorId is the canonical public actor reference — not a risk |
| Non-owner cannot inject tab key via URL | ✅ PASS | Even if URL contains `?tab=owner`, the double-gate in TabContent prevents rendering |

---

## Loading State Analysis

**Concern:** Could there be a window where `isOwner` is incorrectly `true` before async resolution?

**Analysis:**
- For a visitor (not the owner): `isDirectMatch` = `false` (synchronous). `ownsViaAccount` starts `false`, resolves to `false`. `isOwner` is `false` throughout. No window.
- For the owner viewing their own profile: `isDirectMatch` = `true` (synchronous, immediate). Owner tab appears immediately. `ownsViaAccount` resolves to `true` (redundant but consistent). No issues.
- For a multi-account owner where direct actorId doesn't match but `ownsViaAccount` will resolve true: `isDirectMatch` = `false`. During async resolution window, `isOwner` is `false`. Owner tab is NOT shown until `ownsViaAccount` resolves. This is correct — brief delay before owner tab appears, but no security window.

**Conclusion:** The `isOwner` loading state is safe in all scenarios.

---

## VENOM Findings

### VENOM-OWNER-001 — No Test for Double-Gate
**Severity:** LOW
**Evidence Type:** OBSERVED
**Confidence:** HIGH

**Current behavior:** No test verifying that `VportProfileTabContent.jsx` renders nothing for the owner tab when `isOwner` is `false`, even if `tab === "owner"` is set.

**Recommendation:** Add component test: tab==="owner" with isOwner=false → renders null.

---

### VENOM-OWNER-002 — URL Tab Injection Behavior (INFO)
**Severity:** INFO

A visitor could manually set `?tab=owner` in the URL. In this case:
- `tab === "owner"` evaluates to `true` in the switch
- `isOwner` is `false`
- The double-gate short-circuits → renders `null`
- The tab does not appear in the tab bar (not in baseTabs for non-owners)

**Conclusion:** URL injection of `?tab=owner` is harmless. The render gate is tight.

---

## VENOM Status

**COMPLETE — Owner tab injection gate is sound. LOW risk. No critical or high findings.**

| Finding | Severity | Status |
|---|---|---|
| VENOM-OWNER-001 — No double-gate test | LOW | OPEN — minor regression risk |
| VENOM-OWNER-002 — URL tab injection (INFO) | INFO | RESOLVED by analysis — double-gate prevents exploit |

**THOR Release Gate Assessment:** RELEASE APPROVED (conditional on audit of dashboard routes behind the owner tab links)
