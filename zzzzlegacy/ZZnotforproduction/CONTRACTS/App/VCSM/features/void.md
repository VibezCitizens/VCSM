# Feature Contract: void

**Status:** FROZEN  
**Risk:** LOW  
**Files:** 11 (scanner 2026-06-05)  
**Inbound imports:** 0  
**Outbound imports:** 3  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`void` is the planned **Void Realm** — an 18+ anonymous-but-DB-tracked content realm. Content in the Void is separate from the public realm.

**FROZEN — DOCS-ORG-001.** No new development. No refactoring. Excluded from all governance cycles.

**Void Realm constraints (from memory/project contract):**
- Users are anonymous but tracked in DB
- System posts (fuel price, menu) must stay in public realm — `void:false` by construction
- VPORT system posts always use `resolvePublicRealmIdDAL()`, never viewer session `realmId`
- The Void Realm is a future feature — not yet production-active

---

## 2. Non-Goals

`void` must not:
- Receive system posts (fuel price, menu) — those are always `void:false`
- Be confused with app error states or null/undefined handling

---

## 3. Public API / Adapter Boundary

**None confirmed.** 0 inbound imports — no adapter needed currently.

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| adapters | `void/adapters/` | TODO: confirm |
| hooks | `void/hooks/` | Realm hooks |
| controllers | `void/controller/` or `controllers/` | Realm context |

Total: 11 files.

---

## 5. Allowed Dependencies

TODO: Confirm 3 outbound import targets.

---

## 6. Prohibited Dependencies

No new dependencies may be added while FROZEN.

---

## 7. DAL / Controller Rules

- Void realm resolution must use void-specific realm ID resolver
- Must not use public realm ID for void content
- System posts must always use `resolvePublicRealmIdDAL()` — never resolve to void realm for system-generated content

---

## 8. Known Coupling

**No violations.** Zero scanner violations.

---

## 9. Risk Notes

**LOW.** FROZEN — no active development. The Void Realm system post constraint is the primary invariant to preserve.

---

## 10. Migration Notes

No migrations until FROZEN status is lifted.

---

## 11. Unknowns

- TODO: Confirm 3 outbound import targets
- TODO: Confirm full file list (11 files)
- TODO: Confirm whether void has DB tables or reuses platform realm infrastructure
