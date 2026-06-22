# CONTRACT REVIEW REPORT

Target: `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/`
Application Scope: VCSM
Contracts Reviewed: ARCHITECTURE.md (§1–§8), enginecontract.md, capabilitycontract.md
Date: 2026-06-04
Reviewer: review-contract

Files Reviewed:
- `dal/vportLeads.read.dal.js`
- `dal/vportLeads.write.dal.js`
- `controller/vportLeads.controller.js`
- `model/vportLead.model.js`
- `model/vportLead.display.model.js`
- `model/vportDashboardLeadsScreen.model.js`
- `hooks/useVportLeads.js`
- `hooks/useVportNewLeadsCount.js`
- `VportDashboardLeadsFinalScreen.jsx`
- `VportDashboardLeadsScreen.jsx`
- `VportDashboardLeadsView.jsx`
- `index.js`

---

## Summary

Critical Violations: 0
High Violations: 4
Medium Violations: 3
Warnings: 3

Overall Status: **PARTIALLY COMPLIANT**

---

## HIGH VIOLATIONS

---

### VIOLATION H-001

Rule: DAL Contract — §2.1
Rule Source: ARCHITECTURE.md §2.1 — "DAL files must not: normalize, rename, or map fields"
Severity: HIGH

File: `dal/vportLeads.write.dal.js`
Lines: 6–11

Issue:
`normalizeContactedSource()` is defined and executed inside the write DAL. It applies string normalization logic to transform a `source` value into a contacted variant before writing to the database.

```js
function normalizeContactedSource(source) {
  const normalized = toText(source).toLowerCase();
  if (!normalized) return "contacted";
  if (normalized.includes("contacted")) return normalized;
  return `${normalized}_contacted`;
}
```

The DAL also imports `toText` from `@/shared/lib/text` solely to support this function.

Why This Violates The Contract:
The DAL layer is responsible for raw database access only — it must answer *"What does the database say?"* DAL files must not apply business rules, normalize, rename, or map fields. Source-value transformation is a domain decision (meaning) and belongs in the Controller or Model layer, not in the write DAL.

Required Change:
Move `normalizeContactedSource()` to the model layer (`vportLead.model.js` or a new `vportLeadsWrite.model.js`) or into the controller that calls `markVportBusinessCardLeadContactedDAL`. The DAL should receive the already-normalized `source` value as a parameter and pass it directly to the Supabase `.update()` call. The `toText` import may then be removed from the write DAL.

---

### VIOLATION H-002

Rule: Cross-Feature Boundary Rule — §5.2 / Screen-to-Feature Access Rule — §5.5
Rule Source: ARCHITECTURE.md §5.2, §5.5 — "Final Screens and View Screens must never import another feature's internal files. They must only import other features through adapters."
Severity: HIGH

File: `VportDashboardLeadsFinalScreen.jsx`
Line: 5

Issue:
The Final Screen imports `useVportOwnership` directly from the parent vport feature's internal hooks folder:

```js
import { useVportOwnership } from "@/features/dashboard/vport/hooks/useVportOwnership";
```

`useVportOwnership` is NOT exported through `vport.adapter.js`. The vport adapter exists at `@/features/dashboard/vport/adapters/vport.adapter.js` and does not include `useVportOwnership` in its exports.

Why This Violates The Contract:
§5.2 forbids importing another feature's internal files (DAL, models, controllers, hooks, components, screens). §5.5 specifically extends this to Final Screens and View Screens. The correct access pattern requires that `useVportOwnership` first be added to `vport.adapter.js`, and then imported from there.

Required Change:
Either:
(a) Add `useVportOwnership` to `vport.adapter.js` and update the import in `VportDashboardLeadsFinalScreen.jsx` to:
```js
import { useVportOwnership } from "@/features/dashboard/vport/adapters/vport.adapter";
```
(b) If the vport adapter already owns the ownership gate pattern, consider whether the final screen should instead use the adapter-exposed ownership hook.

Note: VENOM + LOKI have separately flagged the dual ownership check pattern (screen gate + controller) as a performance concern (KRA-LEADS-001). Resolution of H-002 should be coordinated with that optimization to avoid introducing a new check without the performance guidance in place.

---

### VIOLATION H-003

Rule: Adapter Contract — §5.3
Rule Source: ARCHITECTURE.md §5.3 — "Adapters must never export: DAL, models, controllers"
Severity: HIGH

File: `index.js`
Lines: 2–4

Issue:
The feature barrel (`index.js`) functions as the public surface of the `leads` module (confirmed by `leads.index.rule9.test.js`). It exports domain model functions directly:

```js
export * from "./model/vportLead.model";
export * from "./model/vportLead.display.model";
```

This exposes `normalizeVportLead`, `formatLeadDate`, `formatSourceLabel`, and `previewMessage` as public API surface items.

Why This Violates The Contract:
§5.3 states adapters may export only hooks, components, and view screens. Models are internal implementation that must not be exposed through the public feature surface. Consumers outside the `leads` module can now import domain model internals directly via the barrel, which creates hidden coupling.

Required Change:
Remove model exports from `index.js`. Model functions are implementation details of the `controller` and `hooks` layers. Any consumer currently importing display models from the barrel should be updated to obtain the formatted values through a hook's return surface, or the display model should be moved to `shared/` if it is genuinely domain-neutral.

---

### VIOLATION H-004

Rule: Cross-Feature Boundary Rule — §5.2
Rule Source: ARCHITECTURE.md §5.2 — "A feature may not import another feature's internal files, including: DAL"
Severity: HIGH

File: `controller/vportLeads.controller.js`
Line: 1

Issue:
The leads controller imports a DAL function directly from the parent vport feature's internal DAL layer:

```js
import { readVportProfileByActorIdDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal";
```

No adapter in `vport.adapter.js` exposes this DAL function.

Why This Violates The Contract:
§5.2 forbids importing a feature's internal DAL files from outside that feature boundary. The controller should access the parent feature's data through an adapter, not by reaching directly into its `dal/` folder.

Prior context: ARCHITECT flagged this as ARC-LEADS-001 and noted it as an "accepted pattern, LOW." The contract review records the contract violation regardless of prior acceptance. The architectural risk is internal coupling that could silently break if `vportProfile.read.dal` is moved or renamed.

Required Change:
Either:
(a) Expose `readVportProfileByActorIdDAL` through `vport.adapter.js` (noting §5.3 restricts adapters to hooks/components/view screens — a DAL export would require an approved §5.3 exception annotation matching the pattern already used in `booking.adapter.js`).
(b) Or elevate `resolveProfileId()` into a shared controller inside the vport feature boundary and expose it through the adapter.
(c) Document a formal approved exception if the direct DAL import is intentional and its boundary risks are accepted — matching the documented exception pattern in `booking.adapter.js`.

---

## MEDIUM VIOLATIONS

---

### VIOLATION M-001

Rule: Import Path Rule — §1.1
Rule Source: ARCHITECTURE.md §1.1 — "All new imports must use `@/...`. Relative imports are forbidden."
Severity: MEDIUM

Files and lines:
- `VportDashboardLeadsFinalScreen.jsx` line 7: `import VportDashboardLeadsView from "./VportDashboardLeadsView"`
- `VportDashboardLeadsScreen.jsx` line 10: `export { default } from "./VportDashboardLeadsFinalScreen"`
- `index.js` lines 2–12: all `./model/...`, `./hooks/...`, `./screens/...` relative imports

Issue:
Three files use same-directory relative imports (`./`) instead of `@/` path aliases.

Why This Violates The Contract:
§1.1 requires all imports to use `@/`. Relative imports are forbidden. While same-directory relative imports are low-risk compared to upstream `../../` traversal, the contract states the rule without exception for `./`.

Required Change:
Replace all `./` imports with their `@/` equivalents. Example:
```js
// Before
import VportDashboardLeadsView from "./VportDashboardLeadsView";

// After
import VportDashboardLeadsView from "@/features/dashboard/vport/dashboard/cards/leads/VportDashboardLeadsView";
```

---

### VIOLATION M-002

Rule: File Naming Rule — §4.5
Rule Source: ARCHITECTURE.md §4.5 — "View screens end with `.view.jsx` or `ViewScreen.jsx`"
Severity: MEDIUM

File: `VportDashboardLeadsView.jsx`

Issue:
The file ends with `View.jsx`. The contract specifies two acceptable patterns for view screens: `.view.jsx` or `ViewScreen.jsx`. `View.jsx` matches neither.

Why This Violates The Contract:
§4.5 defines that the role of a file must be obvious from its name. `VportDashboardLeadsView.jsx` is ambiguous — it could be a component named "View" rather than a View Screen layer boundary. The naming contract enforces `ViewScreen.jsx` or `.view.jsx` to signal the layer clearly.

Required Change:
Rename to `VportDashboardLeadsViewScreen.jsx` (preferred for consistency with `VportDashboardLeadsFinalScreen.jsx`) or `VportDashboardLeads.view.jsx`. Update all imports accordingly.

---

### VIOLATION M-003

Rule: Single Responsibility File Rule — §4.2
Rule Source: ARCHITECTURE.md §4.2 — "Each file must represent one coherent responsibility. Each file should answer one focused question."
Severity: MEDIUM

File: `controller/vportLeads.controller.js`

Issue:
The controller file bundles 5 distinct use-case operations:
- `listVportLeadsController` — list all leads
- `countNewVportLeadsController` — full count with profile resolution
- `fastCountNewVportLeadsController` — optimized count using cached profileId
- `markVportLeadContactedController` — mark a lead as contacted
- `deleteVportLeadController` — delete a lead

Why This Violates The Contract:
§4.2 requires each file to answer one focused question. Five distinct operations are five distinct questions. The contract provides examples like `sendMessage.controller.js`, `editMessage.controller.js`, `deleteMessage.controller.js` as the correct decomposition pattern.

Required Change:
Decompose into per-operation controller files:
```
controller/
  listVportLeads.controller.js
  countNewVportLeads.controller.js
  markVportLeadContacted.controller.js
  deleteVportLead.controller.js
```
`fastCountNewVportLeadsController` is a performance variant of the count operation and can live in `countNewVportLeads.controller.js` alongside the standard count function, since they share the same domain question.

---

## WARNINGS

---

### WARNING W-001

Rule: File Size & Decomposition Rule — §4.1
File: `VportDashboardLeadsView.jsx`

Observation:
249 lines. The contract warns that files approaching 250 lines should be reviewed for decomposition, and requires decomposition at 300 lines.

Why it may become a problem:
The view currently renders the full list inline including the lead card article element with all its inline styles, action buttons, and status badges. Adding any new UI (sort controls, filters, pagination) will push this file over 300 lines.

Suggested Improvement:
Extract the lead card article to a `LeadCard.jsx` component (or `VportLeadCard.jsx`). This is a clear SRP decomposition — the view orchestrates, the card renders one lead item. This would bring the view to ~120 lines and the card to ~100 lines.

---

### WARNING W-002

Rule: Controller Fan-Out Rule — §4.3
File: `controller/vportLeads.controller.js`

Observation:
The controller imports from exactly 5 distinct external modules:
1. `vportProfile.read.dal` — parent feature DAL
2. `vportLeads.read.dal` — read DAL
3. `vportLeads.write.dal` — write DAL
4. `booking.adapter` — ownership gate
5. `vportLead.model` — domain model

This is at the exact limit of 5 collaborators defined by §4.3.

Why it may become a problem:
Any addition to this controller — a new collaborator (e.g. a notification hook, an audit DAL) — would immediately exceed the fan-out limit. The controller is at capacity.

Suggested Improvement:
The §4.3 pressure here is compounded by M-003 (SRP violation). Decomposing into per-operation controller files would distribute the collaborators naturally — most individual operations only need 3–4 collaborators.

---

### WARNING W-003

Rule: Single Responsibility File Rule — §4.2 (stale file)
File: `model/vportDashboardLeadsScreen.model.js`

Observation:
This file is a compatibility re-export shim marked for deletion:
```js
// This file is intentionally empty. It will be deleted once all imports are confirmed updated.
export { formatLeadDate, formatSourceLabel, previewMessage } from "...vportLead.display.model";
```

A grep across `apps/VCSM/src/` confirms no file currently imports from `vportDashboardLeadsScreen.model`. The shim has no active consumers.

Why it may become a problem:
Dead compatibility shims create confusion about which file is canonical. A developer searching for display model functions may find this file first and treat it as the source.

Suggested Improvement:
Delete `model/vportDashboardLeadsScreen.model.js`. No imports will break.

---

## COMPLIANT FINDINGS (Confirmed)

| Rule | Status | Evidence |
|---|---|---|
| §2.1 No `.select('*')` | PASS | Both DAL files use explicit `LEAD_SELECT` constant with named columns |
| §2.2 Models are pure | PASS | `vportLead.model.js` and `vportLead.display.model.js` — no Supabase, no side effects |
| §2.4 Hooks do not call DAL | PASS | Both hooks call controllers only — no direct DAL access |
| §2.6 View Screen reads only hooks | PASS | `VportDashboardLeadsView.jsx` uses `useVportLeads` only — no DAL, no Supabase, no controllers |
| §2.7 Final Screen delegates logic | PASS | `VportDashboardLeadsFinalScreen.jsx` reads route params and identity, renders view screen — no business logic |
| §1.3 Identity Surface Rule | PASS | `useIdentity()` surfaces `actorId` only — `profileId` is internal to models and never exposed via hooks |
| §6.1 Dependency Direction | PASS | app → feature → shared — no reversed dependencies detected |
| §6.3 No circular dependencies | PASS | No cycles detected in the module |
| §4.1 File size | PASS | All files under 300 lines (largest: `VportDashboardLeadsView.jsx` at 249) |
| §4.5 DAL naming | PASS | `.read.dal.js` / `.write.dal.js` — correct |
| §4.5 Model naming | PASS | `.model.js` suffix on all model files |
| §4.5 Hook naming | PASS | `use` prefix on all hook files |
| §4.5 Final Screen naming | PASS | `VportDashboardLeadsFinalScreen.jsx` — correct |
| booking.adapter §5.3 exception | NOTED | `assertActorOwnsVportActorController` export has documented §5.3 exception annotation — accepted |

---

## Cross-Cutting Observations

**vport.adapter.js — model export not in scope but flagged for awareness:**
`vport.adapter.js` currently exports `mapAvailabilityRule` (a model function) and `createVportDashboardShellStyles` (a utility). These are outside the leads module scope but represent the same §5.3 violation pattern found in H-003 above. The vport adapter review should be scheduled independently.

**Dual ownership gate (performance — not a contract violation):**
`VportDashboardLeadsFinalScreen.jsx` calls `useVportOwnership` (which internally calls a controller with DB reads) AND the controller layer calls `assertActorOwnsVportActorController` on every operation. This pattern is compliant with the security contract (all write operations must assert ownership cold) but the read-path duplication is a known performance concern tracked as KRA-LEADS-001 and LOKI-LEADS-001.

---

## Required Actions Before THOR Re-Evaluation

| Finding | Required Action | Owner |
|---|---|---|
| H-001 | Move `normalizeContactedSource` to model/controller layer | Wolverine |
| H-002 | Add `useVportOwnership` to `vport.adapter.js` + update import | Wolverine |
| H-003 | Remove model exports from `index.js` | Wolverine |
| H-004 | Document approved exception OR expose through adapter with annotation | Wolverine |
| M-001 | Replace `./` imports with `@/` equivalents | Wolverine |
| M-002 | Rename `VportDashboardLeadsView.jsx` → `VportDashboardLeadsViewScreen.jsx` | Wolverine |
| M-003 | Decompose `vportLeads.controller.js` into per-operation files | Deferred — THOR caution item |
| W-003 | Delete `vportDashboardLeadsScreen.model.js` | Safe immediate action |

**THOR Gate Impact:**
H-001, H-002, H-003, H-004 are architectural boundary violations. None introduce new runtime security risk, but H-002 (missing adapter for ownership hook) and H-003 (models in public surface) represent architectural integrity gaps that should be resolved before release.

M-003 (controller SRP) is a structural improvement deferred from THOR blocking — it is a medium concern without immediate runtime risk.
