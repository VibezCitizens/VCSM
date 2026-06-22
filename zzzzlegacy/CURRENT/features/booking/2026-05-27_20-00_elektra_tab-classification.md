---
# ELEKTRA Security Report

**Date:** 2026-05-27
**Scope:** VCSM
**Reviewer:** ELEKTRA
**Scan Trigger:** VENOM cross-reference — VENOM-TABS-002, VENOM-TABS-003, VENOM-TABS-006 assigned to ELEKTRA
**Findings Summary:** 1 HIGH | 1 MEDIUM | 1 LOW | 0 INFO
**False Positives Rejected:** 0
**Suggested Patches:** 3

---

## Executive Summary

ELEKTRA traced three VENOM-flagged source→sink chains in the VPORT tab classification system. One HIGH finding confirmed: `profile?.category` appears in both `vportType` useMemo chains in `VportProfileViewScreen.jsx` — a legacy unvalidated field that can influence the `isBarbershopOwner` check and cause the barbershop owner booking management UI to activate for non-barbershop VPORTs. One MEDIUM confirmed: `VportProfileTabContent` renders the `team` tab block unconditionally when `tab === "team"` with no `vportType` guard, enabling team member data to load on non-barbershop VPORTs during the publicDetails loading race. One LOW confirmed: `getVportTabsByType()` accepts arbitrary string input without an `isValidVportType()` guard — the function fails open safely, but `isValidVportType` already exists in the codebase and can make the fail-safe explicit. All patches are surgical and implementation-ready.

---

## High Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-010
- Title:              profile?.category in both vportType useMemo fallback chains — unvalidated legacy field influences isBarbershopOwner
- Category:           Privilege Escalation
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx : lines 83–85 and 97–99
- Source:             `profile?.category` — loaded from `useProfileView` hook; separate DB query path from `publicDetails`; no confirmed `vport_type_check` DB constraint on this field
- Sink:
    (1) `vportType` useMemo (line 83–85): `publicDetails?.vportType ?? profile?.vport_type ?? profile?.vportType ?? profile?.category ?? null`
    (2) `effectiveTabs` useMemo (line 97–99): same four-way fallback chain for `type`
    (3) `isBarbershopOwner` (line 164): `isOwner && vportType === "barbershop"` — activates `VportBarberShopOwnerBand` and `VportBarberShopBookingView`
- Trust Boundary:     vportType resolution — only DB-constraint-validated fields (publicDetails.vportType, profile.vport_type) should be trusted for type classification
- Impact:
    If `profile?.category` is writable without the `vport_type_check` DB constraint (or if the constraint is absent on the `category` column specifically), a VPORT owner could set `category` to "barbershop" on a non-barbershop VPORT. During the loading window when `publicDetails` is null (network delay, TTL cache miss, or loading race), the fallback chain reaches `profile?.category`, resolving vportType to "barbershop". This activates: (1) `VportBarberShopOwnerBand` — barbershop-specific owner UI band, (2) `VportBarberShopBookingView` — barbershop booking management UI, (3) the barbershop owner-mode CSS class (`bs-owner-mode`). All three activate for a VPORT not classified as barbershop, presenting the wrong management surface to the owner and potentially to customers during the race window.
- Evidence:
    // VportProfileViewScreen.jsx lines 83–85
    const vportType = useMemo(() => (
      publicDetails?.vportType ?? profile?.vport_type ?? profile?.vportType ?? profile?.category ?? null
    //                                                                          ^^^^^^^^^^^^^^^^
    //                                                                          legacy unvalidated field — last fallback
    ), [publicDetails, profile]);

    // lines 97–99 — same chain repeated for effectiveTabs:
    const type = publicDetails?.vportType ?? profile?.vport_type ?? profile?.vportType ?? profile?.category ?? null;

    // line 164 — isBarbershopOwner uses vportType from the chain above:
    const isBarbershopOwner = isOwner && vportType === "barbershop";
    // ← if profile?.category === "barbershop", this activates barbershop owner surfaces
- Reproduction Steps:
    1. In a test environment: create or modify a non-barbershop VPORT such that profile.category = "barbershop"
    2. Load the VPORT profile with a slow network profile (throttle to delay publicDetails response)
    3. Observe: during the loading window, vportType resolves to "barbershop" via profile?.category
    4. Observe: VportBarberShopOwnerBand and VportBarberShopBookingView render before publicDetails corrects the type
    (Do not modify production data)
- Existing Defense:
    publicDetails.vportType is the primary source — DB-sourced and validated against the vport_type_check constraint. The fallback chain only activates when publicDetails is null/undefined.
- Why Defense Is Insufficient:
    The fallback chain reaches profile?.category as a last resort. profile?.category is a legacy field whose write path and DB constraint enforcement are unconfirmed. Any loading race or cache miss activates the fallback. The barbershop owner surfaces are the most sensitive rendering targets in the tab classification system.
- Recommended Fix:
    Remove profile?.category from both useMemo fallback chains. Only `publicDetails?.vportType` and `profile?.vport_type` (same DB origin, same constraint) should be trusted. When publicDetails is null and profile.vport_type is also unavailable, fall back to null — which causes effectiveTabs to use the VPORT_TABS fallback (safe). Do NOT fall back to an unvalidated field.
- Suggested Patch:
    // VportProfileViewScreen.jsx — line 83–85 — remove profile?.category from chain
    const vportType = useMemo(() => (
      publicDetails?.vportType ?? profile?.vport_type ?? profile?.vportType ?? null
      // profile?.category removed — unvalidated legacy field must not influence type classification
    ), [publicDetails, profile]);

    // lines 97–99 — same fix in effectiveTabs useMemo:
    const type = publicDetails?.vportType ?? profile?.vport_type ?? profile?.vportType ?? null;

    NOTE: Requires DB change: No — app-layer only.
    NOTE: This change also applies to the effectiveTabs useMemo at line 97–99. Both must be updated in the same commit.
    NOTE: The Logan spec should be updated by LOGAN to document that profile?.category is deprecated as a type source and must not be used for type classification.
- Follow-up Command:  LOGAN (deprecate profile?.category in type classification spec) + BLACKWIDOW (verify barbershop owner surfaces do not activate via legacy field)
```

---

## Medium Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-011
- Title:              VportProfileTabContent renders team tab with no vportType guard — team data loads on non-barbershop VPORTs during race window
- Category:           Auth Bypass
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/profiles/kinds/vport/screens/components/VportProfileTabContent.jsx : lines 75–77
- Source:             `tab` state — set from URL `?tab=` query parameter (validated against effectiveTabs in parent) OR from effectiveTabs auto-select
- Sink:               `VportBarberShopTeamView` renders and fires its team data fetch (including `member_actor_id`) for any VPORT when `tab === "team"`, regardless of vportType
- Trust Boundary:     VportProfileTabContent — the content router should be the final defense-in-depth layer, independently validating that the tab being rendered is appropriate for the current VPORT type
- Impact:
    During the publicDetails loading race window (before vportType is resolved from DB), `tab` state may be set to "team" from a URL `?tab=team` parameter or from a prior effectiveTabs state. When VportProfileTabContent renders, it checks only `tab === "team"` — no vportType check, no effectiveTabs membership check. VportBarberShopTeamView fires its team data hook for the current `profile.actorId` regardless of VPORT kind. For non-barbershop VPORTs: the team fetch returns empty (no team members), but the query still fires and `member_actor_id` values would be populated in React state if any team records existed. The isOwner prop received by VportBarberShopTeamView is trusted from the parent prop chain without re-verification at the data-fetch layer.
- Evidence:
    // VportProfileTabContent.jsx lines 75–77
    {tab === "team" && (
      <VportBarberShopTeamView profile={profile} isOwner={isOwner} />
    )}
    // ← No vportType check. No effectiveTabs membership check.
    // Compare with the "book" tab at lines 68–72 which DOES check vportType:
    {tab === "book" && vportType === "barbershop" && (
      <VportBarberShopBookingView profile={profile} isOwner={isOwner} />
    )}
    {tab === "book" && vportType !== "barbershop" && (
      <VportBookingView profile={profile} isOwner={isOwner} />
    )}
    // ← "book" tab correctly gates on vportType; "team" tab does not
- Reproduction Steps:
    1. Navigate to a non-barbershop VPORT profile URL with ?tab=team appended
    2. With a slow network (throttle to extend publicDetails loading window), observe VportBarberShopTeamView rendering before vportType resolves
    3. Observe: team data fetch fires for the non-barbershop VPORT actorId
    (Requires network throttling to reproduce the race; on fast networks the guard in VportProfileViewScreen redirects the tab before render)
- Existing Defense:
    URL `?tab=` guard in VportProfileViewScreen (line 127) validates against effectiveTabs before calling setTab(). For non-barbershop VPORTs, "team" is not in effectiveTabs — so direct URL injection is blocked after effectiveTabs resolves. The race window exists only before effectiveTabs resolves.
- Why Defense Is Insufficient:
    The URL guard is a single point of defense that operates on the setting of tab state, not on the rendering of tab content. VportProfileTabContent does not independently validate tab membership in effectiveTabs. The race window between tab state being set and effectiveTabs resolving is the gap. Adding a vportType guard in the content router closes the gap at the rendering layer — matching the pattern already used by the "book" tab.
- Recommended Fix:
    Add `vportType === "barbershop"` guard to the team tab block in VportProfileTabContent. This makes the team tab defensive at the content router layer, consistent with how the book tab handles its vportType dispatch. vportType is already a prop on VportProfileTabContent (line 26 of the component).
- Suggested Patch:
    // VportProfileTabContent.jsx lines 75–77 — add vportType guard
    {tab === "team" && vportType === "barbershop" && (
      <VportBarberShopTeamView profile={profile} isOwner={isOwner} />
    )}
    // ← vportType is already a prop (line 26 of VportProfileTabContent)
    // ← This matches the existing pattern for the "book" tab dispatch at lines 68–72

    NOTE: Requires DB change: No — UI-layer change only.
    NOTE: If other VPORT types are added in the future that support team membership, this guard should be expanded to include those types: `(vportType === "barbershop" || vportType === "salon" || ...)`.
- Follow-up Command:  SPIDER-MAN (test: team tab does not render for non-barbershop VPORTs)
```

---

## Low Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-012
- Title:              getVportTabsByType() accepts arbitrary string input without isValidVportType() guard — fail-safe behavior is implicit
- Category:           Injection
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/profiles/kinds/vport/model/getVportTabsByType.model.js : lines 23–80
- Source:             `type` parameter to `getVportTabsByType()` — currently always DB-sourced but the function signature accepts any value
- Sink:               TYPE_TABS lookup (line 64) and resolveGroup() (line 77) — silently return VPORT_TABS fallback for any unrecognized type string
- Trust Boundary:     Model function input — should validate against known type values before processing
- Impact:
    LOW — the fail-open behavior is safe: unrecognized types fall back to VPORT_TABS (the base fallback with fewer tabs, not more). No sensitive tabs are injected on unrecognized input. However: (1) an unrecognized or corrupted type string fails silently with no warning — future audit tools, test coverage, or log analysis cannot detect the fallback trigger; (2) `isValidVportType()` is already exported from `vportTypes.config.js` (line 136) and ready to use — the guard is a one-liner addition; (3) if `getVportTabsByType()` is ever called from a new context with partially client-influenced input (e.g., a new feature that passes URL params to the tab resolver), the absence of an explicit guard makes the function harder to audit.
- Evidence:
    // getVportTabsByType.model.js lines 23–26
    function normalizeType(v) {
      if (!v) return "other";
      return String(v).trim().toLowerCase().replace(/_/g, " ");
      // ← accepts any value; coerces to string; no validation against known type list
    }

    // line 61–79: function body — no isValidVportType() call before TYPE_TABS lookup
    export function getVportTabsByType(type) {
      const t = normalizeType(type);
      if (TYPE_TABS[t]) { ... }                // unrecognized type: falls through
      const group = resolveGroup(t);           // resolveGroup also has no membership guard
      const resolved = GROUP_TABS[group] ?? GROUP_TABS.Other;
      return Object.freeze([...resolved]);     // silent fallback to VPORT_TABS
    }

    // vportTypes.config.js line 136 — isValidVportType already exists and is exported:
    export function isValidVportType(type) { ... }
- Reproduction Steps:
    1. Call getVportTabsByType("garbage_value") in a test
    2. Observe: returns VPORT_TABS with no error or warning — the fallback is silent
    3. No log entry, no observable signal that an invalid type was received
- Existing Defense:
    normalizeType() returns "other" for null/undefined (safe). resolveGroup() returns "Other" for unrecognized groups (safe). GROUP_TABS.Other returns VPORT_TABS (safe). The fail-safe chain is correct but implicit.
- Why Defense Is Insufficient:
    Safe behavior without explicit validation is fragile from an audit perspective. The function should declare its expectations and emit a warning when they are not met, making unintended inputs observable in logs rather than silently absorbed.
- Recommended Fix:
    Add an `isValidVportType(t)` guard after normalizeType() in `getVportTabsByType()`. If the normalized type is not "other" and not a valid type, log a warning and return VPORT_TABS explicitly. This makes the fail-safe observable and auditable without changing the behavior for any currently valid input.
- Suggested Patch:
    // getVportTabsByType.model.js — add import at top
    import { isValidVportType } from "@/features/profiles/kinds/vport/config/vportTypes.config";

    // Replace the function body:
    export function getVportTabsByType(type) {
      const t = normalizeType(type);

      // Explicit validation — fail-safe with a warning rather than silent fallback
      if (t !== "other" && !isValidVportType(t)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[getVportTabsByType] Unrecognized vportType: "${t}" — falling back to VPORT_TABS`);
        }
        return Object.freeze([...VPORT_TABS]);
      }

      if (TYPE_TABS[t]) {
        const list = TYPE_TABS[t];
        if (t === "gas station") {
          return Object.freeze([
            ...list.filter((x) => x.key === "gas"),
            ...list.filter((x) => x.key !== "gas"),
          ]);
        }
        return Object.freeze([...list]);
      }

      const group = resolveGroup(t);
      const resolved = GROUP_TABS[group] ?? GROUP_TABS.Other;
      return Object.freeze([...resolved]);
    }

    NOTE: Requires DB change: No — model-layer change only.
    NOTE: The dev-only warning guard (process.env.NODE_ENV !== "production") keeps logs clean in production while surfacing issues during development and testing.
- Follow-up Command:  SPIDER-MAN (test: unrecognized type returns VPORT_TABS; valid types resolve correctly)
```

---

## False Positives Rejected

None. All three VENOM cross-referenced findings were confirmed with direct code evidence.

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-05-27-010 | profile?.category in vportType fallback chains | HIGH | UI | SIMPLE — remove one field from two useMemo chains | NO |
| 2 | ELEK-2026-05-27-011 | team tab renders without vportType guard | MEDIUM | UI | SIMPLE — add vportType === "barbershop" condition to team tab block | NO |
| 3 | ELEK-2026-05-27-012 | getVportTabsByType() lacks isValidVportType() guard | LOW | Model | SIMPLE — add import + guard + dev warning | NO |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| BLACKWIDOW | Runtime validation: confirm barbershop owner surfaces do not activate via profile?.category (ELEK-010); confirm team tab does not render on non-barbershop VPORTs (ELEK-011) | PENDING |
| SPIDER-MAN | Test coverage: non-barbershop VPORTs do not render team tab (ELEK-011); getVportTabsByType returns VPORT_TABS for unrecognized types with warning (ELEK-012) | PENDING |
| LOGAN | Document profile?.category deprecation as a type classification source (ELEK-010); document owner tab UI-only gate as intentional (VENOM-TABS-007) | PENDING |
| DEADPOOL | Investigate useProfileView lifecycle filter enforcement (VENOM-TABS-009); investigate cache invalidation wiring for VPORT type-change writes (VENOM-TABS-005) | PENDING |
| Thor | Release gate: ELEK-010 (profile?.category in barbershop owner activation chain) is HIGH — must be patched before next tab classification or settings release | PENDING |

---

## THOR Release Gate Status

| Finding | Severity | THOR Gate | Condition |
|---|---|---|---|
| ELEK-2026-05-27-010 | HIGH | BLOCKED | profile?.category must be removed from both vportType fallback chains before next profile screen release |
| ELEK-2026-05-27-011 | MEDIUM | CAUTION | Simple guard — should be included in the same commit as ELEK-010 |
| ELEK-2026-05-27-012 | LOW | CAUTION | Hardening item — include in next model-layer maintenance pass |

---

*Audit persisted to: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_20-00_elektra_tab-classification.md`*
*ELEKTRA — Precision Security Scanner — READ-ONLY AUDIT COMPLETE*
