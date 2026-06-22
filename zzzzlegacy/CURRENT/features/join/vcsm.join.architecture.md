# MODULE ARCHITECTURE REPORT

**Module:** join
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — QR-Based Team Join Flow (Barbershop)
**Primary Root:** `apps/VCSM/src/features/join/`
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Owns the QR-code team join flow: a barber scanning a barbershop VPORT's QR code to request to join the team. Handles both authenticated (existing account) and unauthenticated (signup inline) paths. Currently scoped to barbershop/barber use case.

---

## ENTRY POINTS

- `/join/barbershop/:qrCode` → `JoinBarbershopScreen.jsx`

---

## LAYER MAP

**DAL:** `barberVport.read.dal.js`, `joinAuth.dal.js`, `joinInvite.dal.js`
**Controllers:** `joinBarbershopAccount.controller.js`, `joinBarbershopQr.controller.js`
**Hook:** `useJoinBarbershop.js`
**Screen:** `JoinBarbershopScreen.jsx`
**Components:** `JoinLoginForm.jsx`, `JoinPrimitives.jsx`, `JoinSignupForm.jsx`, `joinStyles.js`

**Adapter:** NONE

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Join flow clear | — |
| Controllers present | PASS | 2 controllers | — |
| DAL present | PASS | 3 DAL files | — |
| Hooks present | PASS | useJoinBarbershop.js | — |
| Screens present | PASS | JoinBarbershopScreen | — |
| Adapter present | FAIL | No adapter | — |
| Documentation | FAIL | No Logan doc | — |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| Barbershop-specific naming | `joinBarbershopQr` — only one vport type | MEDIUM — not generalized | IRONMAN |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS:
- IRONMAN (ownership: generalize join for other VPORT types)
- LOGAN (documentation)
