# MODULE ARCHITECTURE REPORT

**Module:** invite
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — User Invite System
**Primary Root:** `apps/VCSM/src/features/invite/`
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Owns the user invite flow: generating invite links, displaying the invite screen, and handling invite tracking. Minimal module — invite system was refactored away from auth-based invites to product-based invites per recent commits.

---

## ENTRY POINTS

- `/invite` → `InviteScreen.jsx`

---

## LAYER MAP

**DAL:** `invite.dal.js`
**Controller:** `invite.controller.js`
**Hook:** `useInvite.js`
**Screens:** `InviteScreen.jsx`, `InviteView.jsx`
**Styles:** `InviteView.styles.js`

**Adapter:** NONE

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Invite flow clear | — |
| Controllers present | PASS | invite.controller.js | — |
| DAL present | PASS | invite.dal.js | — |
| Hooks present | PASS | useInvite.js | — |
| Screens present | PASS | InviteScreen + InviteView | — |
| Adapter present | FAIL | No adapter | — |
| Documentation | FAIL | No Logan doc | — |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| Invite system recently refactored | Per git log — auth invites removed | MEDIUM — dal/controller may be stale | IRONMAN |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS:
- IRONMAN (ownership: confirm invite dal/controller still active post-refactor)
- LOGAN (documentation)
