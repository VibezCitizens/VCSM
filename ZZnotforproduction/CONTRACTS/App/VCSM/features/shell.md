# Feature Contract: shell

**Status:** CLEAN  
**Risk:** LOW  
**Files:** 6 (confirmed in features folder; not in scanner — 0 cross-feature imports detected by scanner)  
**Inbound imports:** 0 (scanner)  
**Outbound imports:** 1 (confirmed by FEATURES_TICKET_PLAN.md)  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`shell` owns the bottom navigation bar module:
- Bottom navigation bar component (`BottomNavBar.jsx`)
- Navigation tab configuration
- Active tab state

`shell` is the app chrome layer — it persists across all main app screens.

**Active ticket:** TICKET-BOTTOMNAV-MODULE-REVIEW-001 (open) — 3 adapter boundary violations in shell/bottom-bar; missing `shell.adapter.js`, `useVportLeadsCount` bypasses vport adapter, `VportLeadsChip` misclassified.

---

## 2. Non-Goals

`shell` must not own:
- Route management — that is `app/routes/`
- Auth state — that is `auth/` and `app/providers/`
- Actor identity — that is `identity/`
- Feature screens — those belong to each feature

---

## 3. Public API / Adapter Boundary

**None confirmed as needed.** 0 inbound imports from scanner — no feature imports from shell.

**Missing adapter (TICKET-BOTTOMNAV-MODULE-REVIEW-001):**
`shell.adapter.js` does not exist — the ticket flags this as a missing boundary. If any feature ever needs to reference shell navigation state, it must go through a shell adapter.

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| modules | `shell/modules/` | Bottom bar module |
| modules/bottom-bar | `shell/modules/bottom-bar/` | `BottomNavBar.jsx` confirmed |
| modules/bottom-bar/components | `shell/modules/bottom-bar/components/` | Navigation bar components |
| modules/bottom-bar/docs | REMOVED — moved to `ZZnotforproduction/APPS/VCSM/features/shell/` (ARCH-CLEAN-001) |

Total: 6 files.

**Note:** The `shell/modules/bottom-bar/docs/` folder contained `ARCHITECTURE.md`, `BEHAVIOR.md`, `SECURITY.md`. Per ARCH-CLEAN-001, these were moved to `ZZnotforproduction/APPS/VCSM/features/shell/`.

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `profiles` | Bottom nav uses actor canonical slug — CLEAN | YES — `BottomNavBar.jsx` → `profiles/adapters/profiles.adapter` (`useActorCanonicalSlug`) — CLEAN per ARCH-BIDIR-001 Case B |
| `identity` | Active actor for nav state | Confirmed |
| `auth` | Auth state for nav guards | Confirmed |

---

## 6. Prohibited Dependencies

`shell` must not import from:
- `profiles/` internals directly — must use `profiles/adapters/` (confirmed clean for slug)
- `vport/` directly without adapter — TICKET-BOTTOMNAV-MODULE-REVIEW-001 flags `useVportLeadsCount` bypassing vport adapter
- `dashboard/`, `settings/`, `feed/` — content/management features

---

## 7. DAL / Controller Rules

`shell` is a presentational navigation layer. It must not have DAL files or controller files.

If shell hooks need vport leads count: must call vport adapter → vport DAL, not bypass the adapter. This is the open violation in TICKET-BOTTOMNAV-MODULE-REVIEW-001.

---

## 8. Known Coupling

**TICKET-BOTTOMNAV-MODULE-REVIEW-001 (open):**
- Missing `shell.adapter.js`
- `useVportLeadsCount` bypasses vport adapter
- `VportLeadsChip` misclassified in `vport.adapter.js`

**ARCH-BIDIR-001 Case B (single-direction, not bidirectional):**
- `shell/modules/bottom-bar/components/BottomNavBar.jsx` → `profiles/adapters/profiles.adapter` (`useActorCanonicalSlug`)
- Classified as CLEAN — single-direction through adapter boundary. Not a violation.

---

## 9. Risk Notes

**LOW.** Six-file feature. Scanner shows 0 violations. The open ticket (TICKET-BOTTOMNAV-MODULE-REVIEW-001) flags 3 boundary issues that weren't captured by the scanner (scanner may not have resolved the vport leads import fully).

---

## 10. Migration Notes

**ARCH-CLEAN-001:** Shell docs already moved (or targeted for move) to `ZZnotforproduction/APPS/VCSM/features/shell/`.

**TICKET-BOTTOMNAV-MODULE-REVIEW-001:** 
- Create `shell.adapter.js`
- Fix `useVportLeadsCount` vport adapter bypass
- Reclassify `VportLeadsChip`

---

## 11. Unknowns

- TODO: Confirm current state of TICKET-BOTTOMNAV-MODULE-REVIEW-001 (open/in-progress)
- TODO: Confirm full 6-file list
- TODO: Confirm whether ARCH-CLEAN-001 docs move was completed
