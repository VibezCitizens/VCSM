# Feature Contract: moderation

**Status:** CLEAN  
**Risk:** LOW  
**Files:** 35 (scanner 2026-06-05)  
**Inbound imports:** 23  
**Outbound imports:** 0  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`moderation` owns the content reporting and spam control system:
- Report post, comment, chat message
- Mark content as spam
- Hide post, hide comment, hide chat message
- Moderation state and UI for all user-generated content surfaces

`moderation` is a **terminal infrastructure feature** — it is consumed by many features (23 inbound) but imports from none.

---

## 2. Non-Goals

`moderation` must not own:
- Moderation review or admin decisions — those are server-side/admin concerns
- Account suspension — that is auth or admin tooling
- Content removal (deletion) — that belongs to each feature's controller
- Block/unblock — that is `block/`

---

## 3. Public API / Adapter Boundary

**Known adapters:**
- `moderation/adapters/` — TODO: confirm exact adapter file name

Consumers (23 inbound imports):
- `chat/` (4x) — flag chat messages
- `post/` — flag posts/comments
- `profiles/` — flag profile content
- Others: TODO identify from FEATURE_IMPORT_MAP.json

The high inbound count indicates moderation is a foundational content safety layer consumed by every user-generated content surface.

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| adapters | `moderation/adapters/` | Primary public API |
| hooks | `moderation/hooks/` | Report action hooks |
| controllers | `moderation/controllers/` | Report submission controllers |
| dal | `moderation/dal/` | Moderation record data access |
| model | `moderation/model/` | Moderation report shapes |
| screens | `moderation/screens/` | TODO: confirm if moderation has screens or is pure action layer |

---

## 5. Allowed Dependencies

**None confirmed (outbound: 0).** `moderation` is a terminal feature. It accesses Supabase directly through its own DAL. No cross-feature imports.

---

## 6. Prohibited Dependencies

`moderation` must not import from:
- Any feature in the features layer (confirmed — 0 outbound imports)
- `profiles/`, `post/`, `chat/`, `feed/` — these consume moderation, not the reverse

---

## 7. DAL / Controller Rules

**DAL rules:**
- May query moderation-related tables (reports, spam flags, hidden content)
- Must use explicit column projections
- Must not determine actor authorization independently — the controller decides whether the actor can report
- Must receive `actorId` and `targetId` as parameters from controllers

**Controller rules:**
- Must validate actor context before submitting a report
- Must not import Supabase directly
- Idempotency: submitting a duplicate report must not throw — confirm or handle gracefully

---

## 8. Known Coupling

**No cross-feature coupling.** Zero outbound imports. Zero violations.

Consumed by 23 features — second-highest inbound count after booking. This is expected — moderation is required at every user-generated content surface.

---

## 9. Risk Notes

**LOW.** Terminal feature with zero outbound imports and zero violations. The only risk is that moderation is consumed broadly — any change to the moderation adapter surface cascades to 23 import sites.

---

## 10. Migration Notes

No pending migration. Structure is stable.

---

## 11. Unknowns

- TODO: Confirm exact adapter file name in `moderation/adapters/`
- TODO: Confirm full list of 23 inbound consumers
- TODO: Confirm whether moderation has screen components or is a pure action/logic layer
- TODO: Confirm whether `moderation/` uses `controllers/` or `controller/` naming
