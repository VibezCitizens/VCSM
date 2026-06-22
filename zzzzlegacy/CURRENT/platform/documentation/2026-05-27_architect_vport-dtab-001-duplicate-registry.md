# ARCHITECT Report — DTAB-001: Duplicate Tab Registry
**Date:** 2026-05-27
**Reviewer:** ARCHITECT
**Application Scope:** VCSM
**Trigger:** DTAB-001 — Two files export `getVportTabsByType` with diverged implementations

---

## Summary

Two separate files both export a function named `getVportTabsByType`. They are not equivalent implementations. One is canonical; one is legacy and incomplete. Their divergence creates a silent wrong-tab-layout risk for any developer who imports from the wrong file.

---

## Files Inspected

| File | Status | Role |
|---|---|---|
| `apps/VCSM/src/features/profiles/kinds/vport/vportTypeRegistry.js` | LEGACY / DIVERGED | Old registry — incomplete, not used in production |
| `apps/VCSM/src/features/profiles/kinds/vport/model/getVportTabsByType.model.js` | CANONICAL | Correct model — used by VportProfileViewScreen |
| `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx` | PRODUCTION | Imports from canonical model (line 22) |
| `apps/VCSM/src/dev/diagnostics/groups/profilesKindsFeature.group.js` | DEV-ONLY | Only importer of legacy registry |

---

## Divergence Analysis

| Property | `vportTypeRegistry.js` (legacy) | `getVportTabsByType.model.js` (canonical) |
|---|---|---|
| Group entries | 3 | 12 |
| Type overrides | 2 (gas station, money exchange) | 5 (gas station, money exchange, barber, barbershop, locksmith) |
| "Beauty & Wellness" → | `VPORT_SERVICE_TABS` (no book tab) | `VPORT_SERVICE_BOOK_TABS` (has book tab) |
| "Education & Care" → | MISSING | `VPORT_SERVICE_BOOK_TABS` |
| "Health & Medical" → | MISSING | `VPORT_HEALTH_TABS` (book-first) |
| "Home, Maintenance & Trades" → | MISSING | `VPORT_TRADES_TABS` |
| barber type override | MISSING | `VPORT_BARBER_TABS` |
| barbershop type override | MISSING | `VPORT_BARBERSHOP_TABS` |
| locksmith type override | MISSING | `VPORT_LOCKSMITH_TABS` |
| Used by production code | NO | YES — VportProfileViewScreen.jsx line 22 |

---

## Active Importers

### `vportTypeRegistry.js` importers
```
apps/VCSM/src/dev/diagnostics/groups/profilesKindsFeature.group.js:4
  import { getVportTabsByType } from "@/features/profiles/kinds/vport/vportTypeRegistry";
```
**Count: 1 — dev diagnostics only**

### `getVportTabsByType.model.js` importers
```
apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx:22
  import { getVportTabsByType } from "@/features/profiles/kinds/vport/model/getVportTabsByType.model"
```
**Count: 1 — production screen**

---

## Risk Assessment

**Severity:** MEDIUM
**Drift Level:** MODERATE DRIFT
**Production Impact Today:** NONE — legacy registry not used in any production code path

**Latent Risk:**
- Both files export the same function name `getVportTabsByType`
- A developer who autocompletes the import path from `vportTypeRegistry` instead of `getVportTabsByType.model` gets:
  - No `book` tab for Beauty & Wellness VPORTs (wrong preset)
  - No `book` tab for Education & Care VPORTs (missing entirely)
  - Wrong preset for all 9 groups missing from the registry
  - No type overrides for barber/barbershop/locksmith
- The divergence is silent — no error is thrown, the component just renders the wrong tabs

---

## Recommendations

### Immediate (before next release)

1. **Add deprecation comment to `vportTypeRegistry.js`:**
   ```js
   // DEPRECATED: Use getVportTabsByType from model/getVportTabsByType.model.js
   // This file is diverged from canonical and will be removed.
   // DO NOT import this in any production feature code.
   ```

2. **Fix the diagnostics importer:**
   ```js
   // profilesKindsFeature.group.js — update line 4:
   import { getVportTabsByType } from "@/features/profiles/kinds/vport/model/getVportTabsByType.model";
   ```

### Scheduled (next cleanup sprint)

3. **Confirm zero production callers via grep** — already confirmed above, but verify in CI
4. **Delete `vportTypeRegistry.js`** after approval

---

## ARCHITECT Status

**FINDING — MEDIUM severity drift**
**Release Gate:** NOT BLOCKING — no production impact today
**Handoff:** DTAB-001 updated in governance matrix — recommend fix before barbershop/service type tab work begins
