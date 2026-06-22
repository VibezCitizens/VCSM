# BLOCK-ADAPTER-NAMING-001 — Block Public Surface Boundary Review

```
[BLOCK-ADAPTER-NAMING-001] Block public-surface boundary classification
Status: Complete (READ ONLY — classification review; no code changes)
Priority: P2
Type: ARCHITECTURE / Lint classification
App: VCSM
Scope: features/block/** · eslint-plugin-vcsm-architecture/** · eslint.config.js · consumers of 2 symbols
Origin: PROFILES-SPLIT-007 (handed off the 4 non-profiles findings)
Date: 2026-06-08
```

> **Bottom line: Profiles is clean. The two findings have *different* root causes —**
> `ActorActionsMenu` is a **block naming inconsistency**; `ctrlGetBlockedActorSet` is an
> **ESLint rule-classification gap** (the rule doesn't recognize a feature's `index.js`
> barrel as an approved surface). Recommended path: **OPTION C (Both)** — fix the ESLint
> rule (mandatory, load-bearing) and rename the one mis-named block adapter file (hygiene).

---

## Evidence

**Block structure (relevant):**
```
block/index.js                              ← curated public barrel (controllers + hooks + ui)
block/controllers/getBlockedActorSet.controller.js   ← ctrlGetBlockedActorSet origin
block/adapters/hooks/useBlockStatus.adapter.js       ← .adapter suffix ✓
block/adapters/hooks/useBlockActorAction.adapter.js  ← .adapter suffix ✓
block/adapters/ui/BlockConfirmModal.adapter.js       ← .adapter suffix ✓
block/adapters/ui/ActorActionsMenu.jsx               ← NO .adapter suffix ✗  (the inconsistency)
```

**`ctrlGetBlockedActorSet` consumers (cross-feature, via barrel — NOT profiles-specific):**
```
features/upload/controllers/createPost.controller.js:18   import … from "@/features/block"   ← also flagged
features/profiles/kinds/citizen/controller/friends/getFriendLists.controller.js:3
features/profiles/kinds/citizen/controller/friends/getTopFriendActorIds.controller.js:2
features/profiles/kinds/citizen/controller/friends/getTopFriendCandidates.controller.js:3
dev/diagnostics/groups/block.group.js:7   (direct controller path — diagnostic, acceptable)
```
Exposed only at `block/index.js:21`. **Block adapters expose no controllers** (hooks/ui only).

**`ActorActionsMenu` consumers:** exactly **1** — `profiles/screens/views/ActorProfileHeader.jsx:10`.

---

## Deliverable A — ActorActionsMenu Classification

| Question | Finding |
|---|---|
| Is `adapters/ui` an approved Block public surface? | **Yes** — it's block's designated UI adapter folder. |
| Is `ActorActionsMenu` intended for external consumption? | **Yes** — header: *"Block-feature actor actions menu. Owned here — not in shared/."* It's a default-export React component in `adapters/ui/`. |
| Are sibling files using `.adapter` naming? | **Yes** — `BlockConfirmModal.adapter.js`, plus both `adapters/hooks/*.adapter.js`. |
| Is this file simply missing the suffix? | **Yes.** It is the lone `adapters/` file without the `.adapter` suffix. |

**Classification: NAMING-CONSISTENCY problem.** The import (`@/features/block/adapters/ui/ActorActionsMenu`)
already targets the correct public surface; it is flagged only because the filename lacks `.adapter`.
**Correct fix: rename** `ActorActionsMenu.jsx → ActorActionsMenu.adapter.jsx` (NOT an ESLint reclassification
of this file in isolation — though a folder-aware rule would also clear it; see Deliverable D).

---

## Deliverable B — ctrlGetBlockedActorSet Ownership Path

| Question | Finding |
|---|---|
| Where it originates | `block/controllers/getBlockedActorSet.controller.js` — thin controller wrapping `filterBlockedActors` DAL. |
| How Block intentionally exposes it | Via the **`index.js` barrel** (block's documented "single import surface… keeps other features decoupled from internal structure"). |
| Does Block already have a controller-export adapter pattern? | **No.** Block adapters expose only hooks + UI. Controllers are exposed **exclusively** through the barrel. |
| Does another public surface already exist? | **No** `.adapter` surface for this controller. The barrel is the only one. |

**Classification:** The current import is **architecturally correct** — it consumes block's intended
public controller surface, the same way `upload` does. Wrapping the controller in a `.adapter` file
would **violate adapter-purity** (CLAUDE.md: "Adapters never export … controllers") and the ticket's
"do not create adapter wrappers merely to satisfy lint." **This is a RULE-CLASSIFICATION problem**, not
a block-surface problem and not a profiles problem.

---

## Deliverable C — Root Cause of the ESLint Failures

The `adapter-boundary` rule (eslint-plugin-vcsm-architecture/index.js):
```js
if (!src.includes('/features/') && !src.startsWith('@/features/')) return;
const importedFeature = src.split('/features/')[1]?.split('/')[0];
const isSameFeature   = importedFeature === currentFeature;
const isAdapterImport = src.includes('.adapter');     // ← the ONLY "approved" signal
if (isSameFeature || isAdapterImport) return;
context.report(...);
```

| Heuristic | Behavior |
|---|---|
| **path heuristic** | Only inspects cross-feature `@/features/…` (or `/features/…`) imports. |
| **suffix heuristic** | "Approved" ⇔ import path contains the literal substring `.adapter`. |
| **barrel handling** | **NONE.** `@/features/block` (bare index barrel) → no `.adapter` → **flagged**, even though the barrel is a curated public surface. |
| **adapter-folder handling** | **NONE.** `@/features/block/adapters/ui/ActorActionsMenu` contains `/adapters/` but not `.adapter` → **flagged**. The rule keys on the filename **suffix**, not the `/adapters/` **folder**. |

**Is the rule wrong, or is Block inconsistent? → BOTH, in different ways:**
- **Block is inconsistent** on exactly one file (`ActorActionsMenu.jsx` missing the suffix).
- **The rule is too narrow** on barrels — penalizing block's intended controller surface (affecting *both* profiles and upload, and any future barrel consumer). Since controller-adapters are forbidden by purity, the rule MUST accept barrels for there to be any compliant way to consume `ctrlGetBlockedActorSet`.

**Profiles is genuinely clean** — every profiles import targets block's intended public surface.

---

## Deliverable D — Recommended Fix: **OPTION C (Both)**

Chosen because the two findings have distinct root causes; neither sub-fix alone is complete.

**D.1 — ESLint rule fix (MANDATORY, load-bearing).** Broaden `adapter-boundary`'s "approved surface"
test from `src.includes('.adapter')` to also accept:
- a feature's **`index.js` barrel** — i.e. import path is exactly `@/features/<X>` or `@/features/<X>/index`, and
- any path inside an **`/adapters/` folder** — i.e. `src.includes('/adapters/')`.

Rationale: these are the codebase's two real curated public-surface conventions. This is the *only*
compliant way to legitimize controller-via-barrel imports (`ctrlGetBlockedActorSet`) without a
purity-violating controller-adapter. It also incidentally clears `ActorActionsMenu` (folder-based).

**D.2 — Block naming fix (HYGIENE).** Rename `block/adapters/ui/ActorActionsMenu.jsx →
ActorActionsMenu.adapter.jsx` so block's adapter surface is uniformly suffixed (matches its 3 siblings).
Optional once D.1 accepts the folder, but recommended so the surface is self-describing.

**Explicitly NOT recommended:** creating a block controller-adapter for `ctrlGetBlockedActorSet`
(violates adapter-purity + ticket constraint). The barrel stays the controller surface.

> ⚠ **App-wide implication of D.1:** loosening the rule to accept barrels affects ALL features, not
> just block — any feature importing another's `index.js` barrel becomes compliant. This is consistent
> with how the codebase actually exposes curated public APIs, but a full-repo `eslint` run should be
> taken after D.1 to quantify which other currently-failing imports it clears (and confirm none should
> have stayed flagged). Deep non-adapter, non-barrel internals remain correctly forbidden.

---

## Deliverable E — Implementation Blast Radius

**D.1 (rule fix) — recommended primary:**
- Files touched: **1** — `eslint-plugin-vcsm-architecture/index.js` (~4–6 lines in the `adapter-boundary` rule).
- Import rewrites: **0**.
- Lint impact: clears the **4 profiles** + **1 upload** (`createPost.controller.js`) barrel/folder
  `adapter-boundary` errors; **app-wide** — likely clears other features' barrel imports too (quantify
  with a post-change full lint run). No runtime/behavior change.

**D.2 (rename) — hygiene complement:**
- Files touched: **2** — rename `block/adapters/ui/ActorActionsMenu.jsx` + update its 1 importer
  (`profiles/screens/views/ActorProfileHeader.jsx:10`). *(That importer edit is a future implementation
  ticket — this review modifies nothing, and PROFILES is not touched here.)*
- Import rewrites: **1**.
- Lint impact: clears the `ActorActionsMenu` finding independently of D.1.

**Combined:** ≤3 files, 1 import rewrite, 0 runtime change. D.1 is the load-bearing fix; D.2 is hygiene.

---

## Success Criteria — Met

- ✅ **Profiles is actually clean** — all 4 profiles imports use block's intended public surface.
- ✅ **Block's public surface is inconsistent** — one file (`ActorActionsMenu.jsx`) lacks the `.adapter` suffix.
- ✅ **The ESLint rule is misclassifying valid imports** — it rejects curated `index.js` barrels and `/adapters/` folder files that lack the `.adapter` suffix.
- ✅ **Single approved remediation path:** **OPTION C** — D.1 ESLint rule fix (mandatory) + D.2 block rename (hygiene). No adapter-purity violation, no profiles change in this review.

---

*Classification review only. No files modified. Implementation is a separate ticket (rule fix + optional block rename).*
