# PROFILES-OWN-001 — VPORT Ownership Authority Decision

```
[PROFILES-OWN-001] Canonical owner of VPORT server-side ownership authority
Status: Complete (READ ONLY — DECISION ONLY, no implementation)
Priority: P1
Type: ARCHITECTURE (authority contract)
App: VCSM
Becomes the authority contract for: PROFILES-BRIDGE-AUDIT-001, PROFILES-EXTRACT-VPORT-001
Date: 2026-06-08
```

> **DECISION: `features/authorization` is the canonical owner of VPORT ownership authority.**
> This reflects **actual runtime authority** — not historical ownership. The code has *already
> moved* there: booking's `assertActorOwnsVportActorController` is now an explicit
> backward-compatible delegate to `authorization.assertActorOwnsActorController`, and
> vportDashboard's `checkVportOwnershipController` calls that booking wrapper. Profiles holds
> only a **UI signal** and a **capability read** — never authority. **VPORT extraction is NOT
> blocked by ownership.**

---

## Deliverable A — Ownership Surface Inventory

| Surface | Purpose | Consumers | Enforcement? |
|---|---|---|---|
| `authorization/controllers/assertActorOwnsActor.controller.js` (`assertActorOwnsActorController`) | **Canonical permission decision** ("may actor X act on actor Z?") incl. kind-gate + self-shortcut | booking wrapper (+ future direct) | **YES — authority** |
| `authorization/controllers/assertSessionOwnsActor.controller.js` | Session-scoped ownership decision | authorization adapter | YES — authority |
| `authorization/dal/{actorOwners,actors}.read.dal` | Reads `vc.actor_owners` (DB source of truth) | authorization controllers | Data (capability) |
| `authorization/adapters/authorization.adapter.js` | Public surface for the two assert controllers | booking, (others) | Exposes authority |
| `booking/controllers/assertActorOwnsVportActor.controller.js` (`assertActorOwnsVportActorController`) | **Compat wrapper** — header: *"live VPORT ownership authority has moved to features/authorization"*; body = `return assertActorOwnsActorController(args)` | ~20 profiles vport controllers + vportDashboard | NO — delegates |
| `vportDashboard/controller/checkVportOwnership.controller.js` (`checkVportOwnershipController`) | Compat layer: vport-kind self-shortcut, else calls booking wrapper (→ authorization) | vportDashboard gas controllers (6) + profiles ownership.adapter | NO — delegates |
| `profiles/adapters/kinds/vport/ownership.adapter.js` | Re-export of vportDashboard's check | vportDashboard gas (6) | NO — bridge |
| `profiles/kinds/vport/model/vportOwnership.model.js` (`deriveVportIsOwner`) | `String(viewerActorId)===String(profileActorId)` — its own comment: *"verified independently via actor_owners + checkVportOwnershipController"* | VportProfileViewScreen → context | NO — **UI signal only** |
| `profiles/kinds/vport/dal/rates/actorOwners.read.dal.js` | Reads `actor_owners` (rates) | rates controller | Data (capability; parallel to authorization's DAL) |
| `vportDashboard/hooks/useVportOwnership.js` | Hook wrapper over the check | dashboard UI | NO — UI consumer |

---

## Deliverable B — Current Authority Trace (actual runtime)

```
consumer  (profiles vport controllers ×~20, vportDashboard gas controllers ×6, dashboard UI)
   │
   ├─ profiles vport controllers → booking.adapter.assertActorOwnsVportActorController
   │                                   │  (compat wrapper — pure delegation)
   ├─ vportDashboard gas controllers → vportDashboard.checkVportOwnershipController
   │       │  (self-shortcut for vport-kind self; else ↓)
   │       └─→ booking.adapter.assertActorOwnsVportActorController
   │                                   │
   └───────────────────────────────────┘
                                       ▼
                  features/authorization.assertActorOwnsActorController     ◄── ACTUAL AUTHORITY
                  (kind-gate, self-shortcut, ELEK-004 safety, error shape)
                                       ▼
                  authorization/dal/actorOwners.read.dal  →  vc.actor_owners  (DB truth)

UI-ONLY (never on the authority path):
  deriveVportIsOwner (profiles) = viewerActorId === profileActorId  →  presentation gate only
```

- **Actual authority:** `authorization.assertActorOwnsActorController` + the `actor_owners` DAL it owns.
- **Compatibility layers:** booking `assertActorOwnsVportActorController` (delegate), vportDashboard `checkVportOwnershipController` (delegate + self-shortcut), profiles `ownership.adapter` (re-export).
- **UI-only signals:** `deriveVportIsOwner` (string equality; not a permission decision).

---

## Deliverable C — Ownership Classification

| Classification | Surfaces |
|---|---|
| **AUTHORITY** (makes the decision) | `authorization.assertActorOwnsActorController`, `authorization.assertSessionOwnsActorController` |
| **CAPABILITY** (provides ownership data) | `authorization/dal/actorOwners.read.dal` (canonical), `profiles/kinds/vport/dal/rates/actorOwners.read.dal` (parallel/dedupe candidate) |
| **UI SIGNAL** (presentation only) | `profiles deriveVportIsOwner`, `vportDashboard useVportOwnership` |
| **BRIDGE** (compatibility layer) | `booking.assertActorOwnsVportActorController`, `vportDashboard.checkVportOwnershipController`, `profiles/adapters/kinds/vport/ownership.adapter.js` |

---

## Deliverable D — Candidate Owners

### Option A — `authorization` owns VPORT ownership ✅ (and already does)
- **Pros:** Already the runtime authority; owns `actor_owners` DAL; centralizes kind-gate/self-shortcut/ELEK-004 safety + error shape; domain-appropriate (authorization is the permission domain); booking + vportDashboard already self-documented as wrappers.
- **Cons:** Consumers still reach it indirectly through the booking/vportDashboard wrappers (indirection to retire later).
- **Migration cost:** **LOW** — the move is essentially done; remaining work is retiring/repointing the thin wrappers when convenient.
- **Future extraction impact:** **Unblocks** VPORT — ownership authority is independent of both profiles and vportDashboard.

### Option B — `vportDashboard` owns VPORT ownership ❌
- **Pros:** Where the `checkVportOwnershipController` surface historically lived.
- **Cons:** vportDashboard's check now **delegates to authorization** — it is a *consumer*, not an owner. Naming it owner reverses the established direction and **couples VPORT extraction to vportDashboard** (a feature, not an authority domain).
- **Migration cost:** High and backwards.
- **Future extraction impact:** **Blocks** VPORT (extraction would depend on vportDashboard). Reject.

### Option C — new shared ownership capability ❌
- **Pros:** Clean-slate neutrality.
- **Cons:** `authorization` already **is** the shared ownership capability; a new one duplicates it and fragments authority. Violates "no new abstractions."
- **Migration cost:** Wasted.
- **Future extraction impact:** Net negative. Reject.

---

## Deliverable E — Extraction Impact

**Can VPORT extract if ownership remains outside Profiles? → YES. It SHOULD remain outside.**
Profiles never holds authority — only a UI signal (`deriveVportIsOwner`) and a parallel capability read.

| Item | Status |
|---|---|
| VPORT extraction blocked by ownership? | **NOT BLOCKED** — authority lives in authorization, reached via stable adapter surfaces |
| Required bridge removals (future, not this ticket) | `profiles/adapters/kinds/vport/ownership.adapter.js` → repoint consumers to `authorization.adapter` (or drop; profiles vport controllers already use booking's delegate). Optionally collapse booking + vportDashboard wrappers once all consumers point at authorization. |
| Required ownership relocations | **NONE for authority** (already in authorization). Optional: dedupe `profiles rates actorOwners.read.dal` against authorization's canonical DAL (capability hygiene, non-blocking). |
| Required new surfaces | **None.** authorization.adapter already exposes the authority. |

> This **refines OWN-01** from MASTER-001: the consumer-facing *surface* historically appeared to
> live in vportDashboard+booking, but the **actual authority has since moved to authorization**.
> The extraction blocker is therefore far lighter than originally feared — the bridges are thin
> delegations, not real authority.

---

## Deliverable F — Final Decision

```
Canonical owner: features/authorization
                 (assertActorOwnsActorController / assertSessionOwnsActorController,
                  backed by authorization/dal/actorOwners.read.dal → vc.actor_owners)
```

**Why (based on actual runtime authority, not historical ownership):**
1. It is the only surface that **makes the decision** — kind-gate, self-shortcut, ELEK-004 safety, error/return shape all originate there.
2. It **owns the `actor_owners` DAL** (the DB source of truth).
3. **Booking and vportDashboard explicitly delegate to it** — booking's wrapper header literally states the authority "has moved to features/authorization"; vportDashboard's check calls that wrapper.
4. **Profiles holds no authority** — only `deriveVportIsOwner` (UI string-equality) and a parallel capability read.

**Authority contract for downstream tickets:**
- `PROFILES-BRIDGE-AUDIT-001`: treat `ownership.adapter`, booking-assert, and vportDashboard-check as **compatibility bridges over authorization**; plan to repoint consumers at `authorization.adapter` and retire the wrappers (no authority relocation needed).
- `PROFILES-EXTRACT-VPORT-001`: ownership is **not** a blocker — authorization is the stable external authority; VPORT keeps only its UI signal.

---

## Constraints honored
No code moved/renamed/deleted; no authority changed; no abstractions added. Decision + evidence only.

### DB AUDIT NOTE
```
- DB object: vc.actor_owners — owned (read) by authorization/dal/actorOwners.read.dal (canonical);
  parallel read at profiles/kinds/vport/dal/rates/actorOwners.read.dal (dedupe candidate, non-blocking).
- Risk: none introduced (decision only). Future bridge-retirement is app-layer call-site repointing;
  no schema/RLS/RPC change implied.
- Suggested later SQL review: confirm actor_owners RLS posture is consistent with authorization being
  the single canonical reader (when the profiles rates DAL is deduped).
```

---

*Decision artifact. No implementation, refactor, or migration performed.*
