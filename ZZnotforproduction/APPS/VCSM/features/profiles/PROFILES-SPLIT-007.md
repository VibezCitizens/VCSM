# PROFILES-SPLIT-007 — Remaining Block Adapter Boundary Cleanup

```
[PROFILES-SPLIT-007] Remaining Block adapter-boundary cleanup
Status: Complete — DOCUMENTED (no profiles code changes; root cause is block-side / rule-side)
Priority: P2
Type: ARCHITECTURE / Lint
App: VCSM
Scope: 4 profiles files (read) + block adapter surfaces (read)
Builds on: PROFILES-SPLIT-006, PROFILES-CONSOLIDATION-MASTER-001
Date: 2026-06-08
```

> **Outcome: documented, 0 profiles code changes.** All 4 remaining Block `adapter-boundary`
> errors have root causes **outside profiles** — either the block feature's surface naming or
> the ESLint rule's `.adapter`-substring heuristic. Every one of these profiles imports already
> consumes block's *intended* public surface (the `index.js` barrel for the controller, the
> `adapters/ui/` folder for the component). Fixing them inside profiles would require inventing a
> new adapter or violating adapter-purity — both explicitly forbidden by this ticket.

---

## Evidence

### Block public surfaces (read)
```
features/block/index.js              → exports ctrlGetBlockedActorSet (CONTROLLER), ctrlGetBlockStatus,
                                       blockActorController, useBlockStatus, useBlockActions, BlockButton, …
features/block/adapters/hooks/useBlockStatus.adapter.js
features/block/adapters/hooks/useBlockActorAction.adapter.js
features/block/adapters/ui/ActorActionsMenu.jsx          ← in adapters/, but NO ".adapter" suffix
features/block/adapters/ui/BlockConfirmModal.adapter.js  ← has ".adapter" suffix (naming inconsistency)
```
**There is no `adapters/.../*.adapter.*` surface that exposes `ctrlGetBlockedActorSet`.** Block's
approved surface for that controller is the `index.js` barrel ("single import surface… keeps other
features decoupled from internal structure").

### The 4 flagged profiles imports

| # | File | Import | Why flagged | Already block's public surface? |
|---|---|---|---|---|
| 1 | `kinds/citizen/controller/friends/getFriendLists.controller.js:3` | `ctrlGetBlockedActorSet` from `@/features/block` | barrel path lacks `.adapter` | **Yes** — index.js barrel (intended controller surface) |
| 2 | `kinds/citizen/controller/friends/getTopFriendActorIds.controller.js:2` | same | same | Yes |
| 3 | `kinds/citizen/controller/friends/getTopFriendCandidates.controller.js:3` | same | same | Yes |
| 4 | `screens/views/ActorProfileHeader.jsx:10` | `ActorActionsMenu` from `@/features/block/adapters/ui/ActorActionsMenu` | adapter-folder file lacks `.adapter` suffix | **Yes** — already in `adapters/ui/` |

---

## Task 1 — Friend Controllers · DOCUMENTED (no change)

`ctrlGetBlockedActorSet` is a **controller** consumed inside profiles controllers (server-side batch
"is this candidate blocked?" filter — no React hook equivalent exists, and controllers can't use hooks).

- **No compliant `.adapter` surface exists** for it. The only block surface is the `index.js` barrel.
- Creating `features/block/adapters/.../getBlockedActorSet.adapter.js` would (a) modify the **block**
  feature (outside this ticket's scope), and (b) wrap a controller in an adapter — which CLAUDE.md
  forbids ("Adapters never export … controllers"). The ticket also forbids inventing a new adapter
  unless block already defines that pattern (it does not — block exposes controllers via the barrel).
- **Behavior is correct and decoupled today** — profiles uses block's public API. The only defect is
  that the ESLint `adapter-boundary` heuristic (`src.includes('.adapter')`) does not recognize a
  feature `index.js` barrel as an approved surface.

→ **No profiles change.** Resolution belongs to a block-side / rule-side ticket (see below).

## Task 2 — ActorProfileHeader · DOCUMENTED (no change)

`ActorActionsMenu` is imported from `@/features/block/adapters/ui/ActorActionsMenu` — **already the
block UI adapter folder** and an allowed adapter surface type (UI component). The file is simply named
`ActorActionsMenu.jsx` rather than `ActorActionsMenu.adapter.jsx`, so the rule's `.adapter`-substring
check misses it (note its sibling `BlockConfirmModal.adapter.js` *does* carry the suffix — an internal
block naming inconsistency).

- The correct fix is to **rename the block file** `ActorActionsMenu.jsx → ActorActionsMenu.adapter.jsx`
  (and update its importers) — a **block-feature** change, outside profiles scope.
- Do NOT invent a new architecture; the adapter surface already exists.

→ **No profiles change.**

---

## Verification

```
rg "@/features/block" apps/VCSM/src/features/profiles
  → 5 hits: useProfileGate.js (adapter path, SPLIT-006 ✓) + the 4 documented above.
eslint src/features/profiles | adapter-boundary
  → 4 errors remain (the 4 above). All have block-side / rule-side root cause.
```

Profiles adapter-boundary compliance is **architecturally 100%** (every import uses block's intended
public surface); it is **not lint-clean** only because of the `.adapter`-naming heuristic gap.

---

## Recommendation — new ticket (block-owned, not profiles)

**BLOCK-ADAPTER-NAMING-001** (owner: block feature):
1. Rename `features/block/adapters/ui/ActorActionsMenu.jsx → ActorActionsMenu.adapter.jsx`; update its importers (incl. ActorProfileHeader). Clears finding #4.
2. Decide the approved cross-feature surface for `ctrlGetBlockedActorSet`: either expose it through an explicit block adapter (consistent with the repo's existing controller-adapter precedent, e.g. profiles' own `ownership.adapter`/`services.adapter`), OR formally bless the `index.js` barrel and teach the `adapter-boundary` ESLint rule to treat a feature's `index.js` barrel + `/adapters/` folder as approved surfaces. Clears findings #1–3.
3. Then profiles swaps its 4 imports to the blessed surface (trivial, zero behavior change).

This keeps the fix where the root cause lives and avoids a profiles-side adapter-purity violation.

---

## Implementation Return

- **Files changed:** none (profiles). The fix lives in the block feature / ESLint rule.
- **Old imports / New imports:** unchanged — all 4 already consume block's intended public surface.
- **Adapter surfaces used:** existing — `@/features/block` barrel (controller) and `@/features/block/adapters/ui/` (component). No new surface created.
- **Grep result:** `rg "@/features/block" …/profiles` → useProfileGate (fixed SPLIT-006) + 4 documented.
- **Lint result:** 4 `adapter-boundary` errors remain (block-side/rule-side root cause); profiles introduced 0 new violations.
- **Behavior changed?** No.
- **PASS / FAIL:** **PASS** — per the ticket's accepted criterion "all remaining violations explained and documented." No compliant in-scope fix exists without modifying block or inventing architecture (both forbidden). Follow-up: **BLOCK-ADAPTER-NAMING-001**.

---

*Analysis + documentation only. No files moved, renamed, created, or modified in app code.*
