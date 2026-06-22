# PROFILES-SUBDOMAIN-DECOUPLE-001 — Services ↔ Locksmith Decoupling

```
[PROFILES-SUBDOMAIN-DECOUPLE-001] Services↔Locksmith coupling — decoupling plan
Status: Complete (READ ONLY — DECISION/PLAN ONLY, no code changes)
Priority: P2
Type: ARCHITECTURE
App: VCSM
Authority doc for: the future implementation ticket that breaks the coupling
Date: 2026-06-08
```

> **Key finding: there is NO module-level import cycle** — all coupling targets are leaf
> files (DAL/model) that never import back. This is a **domain-level bidirectional coupling**,
> and the direction is the whole story: **locksmith→services is correct** (a specialization
> reading the generic services primitive); **services→locksmith is backwards** (locksmith
> domain logic hardcoded inside the generic services-upsert controller). The smallest safe cut
> removes the backwards edge. **This does NOT block whole-VPORT extraction** (both subdomains
> extract together) — it is **cleanup**, a hard blocker only for splitting services/locksmith
> into *separate* features.

---

## Deliverable A — Exact Cycle Trace

| # | Source File | Imports (symbol) | Target File | Layer | Direction |
|---|---|---|---|---|---|
| 1 | `controller/services/upsertVportServices.controller.js:6` | `dalInsertLocksmithServiceDetailDefaults` | `dal/locksmith/locksmithServiceDetails.write.dal` | controller→DAL | **services→locksmith** ⚠ |
| 2 | `controller/services/upsertVportServices.controller.js:7` | `getLocksmithServiceDefaults` | `model/locksmith/locksmithServiceDefaults.model` | controller→model | **services→locksmith** ⚠ |
| 3 | `screens/services/view/VportServicesView.jsx:10` | `useLocksmithProfile` | `hooks/locksmith/useLocksmithProfile` | screen→hook | **services→locksmith** ⚠ |
| 4 | `controller/locksmith/getLocksmithProfile.controller.js:3` | `readVportServicesByActor` | `dal/services/readVportServicesByActor.dal` | controller→DAL | **locksmith→services** ✅ |

```
        ┌──────────────── edges 1,2,3 (services → locksmith)  ⚠ backwards ────────────────┐
        ▼                                                                                  │
   LOCKSMITH domain                                                                  SERVICES domain
        │                                                                                  ▲
        └──────────────── edge 4 (locksmith → services)  ✅ correct ───────────────────────┘
```

**No runtime import cycle:** leaf targets verified — `locksmithServiceDetails.write.dal`,
`locksmithServiceDefaults.model`, and `readVportServicesByActor.dal` import only
`@/services/supabase/*` + `@/shared/*`. They never import back. The "circular" is purely a
**domain ownership** bidirectionality, not a module-load cycle.

**The backwards edges (1,2) in context** — `upsertVportServices.controller.js:98-109`:
```js
// For locksmith vports, provision default detail rows for newly-enabled services.
if (String(vportType).toLowerCase() === 'locksmith') {
  … dalInsertLocksmithServiceDetailDefaults({ …, ...getLocksmithServiceDefaults(row.key) }) …
}
```
→ a **locksmith-gated branch hardcoded inside the generic services upsert controller**.

---

## Deliverable B — Ownership Classification

| File | Zone | True owner of the behavior |
|---|---|---|
| `controller/services/upsertVportServices.controller.js` | SERVICES | services (but contains **MISPLACED** locksmith seeding) |
| `dal/services/readVportServicesByActor.dal.js` | SERVICES | services (the actor's service list — a primitive) |
| `dal/locksmith/locksmithServiceDetails.write.dal.js` | LOCKSMITH | locksmith |
| `model/locksmith/locksmithServiceDefaults.model.js` | LOCKSMITH | locksmith ("default locksmith_service_details fields") |
| `hooks/locksmith/useLocksmithProfile.js` | LOCKSMITH | locksmith |
| `controller/locksmith/getLocksmithProfile.controller.js` | LOCKSMITH | locksmith (composes services data — correct) |
| `screens/services/view/VportServicesView.jsx` | SERVICES | services (but composes a locksmith hook — UI leak) |

**Which side truly owns the behavior?**
- "**Default locksmith service details**" (edges 1,2) → **LOCKSMITH**. It is locksmith-specific seeding, currently executed from the generic services controller. **Misplaced.**
- "**Actor's services list**" (edge 4) → **SERVICES** (the generic primitive). Locksmith reading it is correct composition.
- Services is the **lower-level primitive**; locksmith is the **specialization**. Correct dependency direction is **locksmith → services only**.

---

## Deliverable C — Runtime Dependency Analysis

| Edge | Kind | Required? | Notes |
|---|---|---|---|
| 1,2 services→locksmith (defaults seeding) | **CONVENIENCE / HISTORICAL** | **No** — services does not need locksmith to upsert services | Locksmith-gated branch bolted onto the generic controller for convenience |
| 3 services→locksmith (UI hook) | **CONVENIENCE** | No | Services view renders locksmith data inline |
| 4 locksmith→services (services list) | **REQUIRED** | Yes | Locksmith profile genuinely composes the services list |

**Can either side operate independently?**
- **Services: YES** — remove the locksmith branch and it is a clean, locksmith-agnostic primitive.
- **Locksmith: depends on services by design** — but that is the *correct one-way* dependency (specialization → primitive). Once the backwards edges are cut, the relationship is acyclic.

---

## Deliverable D — Minimal Safe Cut

```
File   : controller/services/upsertVportServices.controller.js
Imports: dalInsertLocksmithServiceDetailDefaults (line 6), getLocksmithServiceDefaults (line 7)
Block  : the `if (vportType === 'locksmith') { … }` seeding (lines 98-109)
Symbol : the locksmith default-seeding behavior
Reason : it is the single place where one subdomain embeds the OTHER's domain logic, and it is
         the WRONG direction. Removing it (and relocating to locksmith) makes services
         locksmith-agnostic and leaves only the correct locksmith→services edge.
```

**Why this is the preferred cut:**
- Edge 4 (locksmith→services) is legitimate and must stay (cutting it would strip the services list from the locksmith profile — a behavior change).
- Edges 1,2 are the only **backwards** edges with real data/control flow; edge 3 is UI-only (separate, lower-priority cleanup).
- Cutting here corrects the architecture (services = primitive) rather than papering over it.

---

## Deliverable E — Decoupling Options

| Option | Approach | Blast radius | Behavior-change risk | Rollback |
|---|---|---|---|---|
| **A — move logic into Services** | Keep/expand locksmith defaults inside services | low | — | easy |
| | ❌ **Reject** — entrenches services owning locksmith knowledge (wrong direction). | | | |
| **B — move logic into Locksmith** | Relocate the seeding block to a locksmith-owned controller invoked after the generic upsert | ~3–5 files | low if seeding still runs for locksmith vports | medium |
| | ✅ Correct direction (locksmith→services). Services becomes pure. | | | |
| **C — extract shared primitive** | New "service-defaults provider" both consume | ~6+ files | medium | medium |
| | ❌ Over-engineered for one gated branch; adds an abstraction (discouraged). | | | |
| **D — dependency inversion** | Services upsert returns newly-enabled keys; a locksmith orchestrator seeds defaults as a post-step | ~3–5 files | low | medium |
| | ✅ Cleanest; effectively the orchestration form of B. | | | |

**Recommended: B, implemented via D** (locksmith orchestrates: call the now-pure services upsert, then seed locksmith defaults using the returned newly-enabled keys).

---

## Deliverable F — Extraction Impact

**Does this cycle block VPORT extraction? → NO.**
Services and locksmith are **both** `kinds/vport/**` subdomains; `PROFILES-EXTRACT-VPORT-001`
extracts VPORT **as one unit**, so an *internal* cross-subdomain coupling moves with it intact.
A domain-level (non-module) bidirectional reference inside the extracted unit does not block the
extraction.

| For PROFILES-EXTRACT-VPORT-001 | Classification |
|---|---|
| Whole-VPORT extraction | **CLEANUP / soft** — not required first; recommended for internal hygiene |
| Splitting services & locksmith into *separate* features (not currently planned) | **HARD blocker** — would require this cut first |

→ **Soft blocker / cleanup.** Do it for modularity, but it is **not** a prerequisite for VPORT extraction.

---

## Deliverable G — Final Recommendation

**Recommended approach:** **Option B via D** — relocate the locksmith default-seeding out of the
generic `upsertVportServices.controller` into locksmith ownership, leaving services a pure,
locksmith-agnostic primitive. Keep edge 4 (locksmith→services) untouched. Address edge 3 (UI) as a
small follow-on.

**Implementation sequence (for the future implementation ticket):**
1. **Make services pure:** in `upsertVportServices.controller.js`, remove imports (lines 6,7) and the locksmith branch (98-109). Have it return the set of newly-enabled service keys.
2. **Relocate seeding to locksmith:** add a locksmith-owned controller (e.g. `seedLocksmithServiceDefaults.controller.js` or extend `locksmithOwner.controller.js`) that takes newly-enabled keys and calls `dalInsertLocksmithServiceDetailDefaults` + `getLocksmithServiceDefaults` (both already locksmith-owned).
3. **Invert orchestration:** the upsert caller (hook `useUpsertVportServices` or a higher controller) routes locksmith vports through: generic services upsert → locksmith seeding post-step. Now all data/control edges are locksmith→services.
4. **UI cleanup (edge 3, lower priority):** move locksmith-specific rendering in `VportServicesView.jsx` into a locksmith component, or inject locksmith data via props, so the services screen stops importing `useLocksmithProfile`.
5. **Verify:** `rg "/locksmith" controller/services dal/services model/services screens/services` → 0; behavior preserved (locksmith vports still get default detail rows on service enable). Run the existing `upsertVportServices.controller.test` + locksmith tests.

**Blast radius (future impl):** ~3–5 files (services controller, locksmith controller, upsert hook/caller; +2 if edge 3 UI cleanup included). Behavior preserved. No DB/ownership/authority change.

---

## Constraints honored
No code moved/renamed/deleted; no extraction; no ownership/bridge changes. Decision + evidence only.

---

*Authority document for the future Services↔Locksmith decoupling implementation ticket.*
