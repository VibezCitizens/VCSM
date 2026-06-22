# Feature Contract: dashboard

**Status:** SPLIT_CANDIDATE + VIOLATIONS  
**Risk:** CRITICAL  
**Files:** 258 (scanner 2026-06-05)  
**Inbound imports:** 16  
**Outbound imports:** 85  
**Violations:** 23  
**Split candidate:** YES (exceeds 100-file threshold; 3 unrelated subsystems)

---

## 1. Purpose

`dashboard` currently contains three structurally distinct subsystems that share no domain logic:

1. **`flyerBuilder/` (31 files)** — Canvas design studio for poster/flyer creation. Has its own designStudio subfolder with 5 sub-subsystems (canvas, sidebar, color picker, templates, print QR).

2. **`qrcode/` (9 files)** — QR code generation and flyer card display. Has an `index.js` barrel. Most split-ready subsystem.

3. **`vport/` (217 files)** — Owner-facing VPORT management with 11 card subsystems:
   - `bookings/`, `calendar/`, `exchange/`, `gasprices/`, `leads/`, `locksmith/`, `portfolio/`, `reviews/`, `schedule/`, `services/`, `settings/`, `team/`

This feature is a **planned split target** (ARCH-DASH-001). Contracts for the resulting features (`flyerBuilder`, `qrcode`, `vportDashboard`) will be written when ARCH-DASH-001 plan is approved.

---

## 2. Non-Goals

`dashboard` as-currently-structured is too large for clean non-goals. Post-split non-goals:
- `flyerBuilder` must not own business card settings or QR generation
- `qrcode` must not own design or layout — pure QR output
- `vportDashboard` must not own actor profile rendering — that is `profiles/`

Until the split executes, this section tracks the cross-subsystem contamination:
- The `gasprices/` card owns gas price UI AND DAL that reaches into `profiles/` internals (violation)
- The `settings/` card owns vport settings rendering that belongs in settings feature (architectural question for ARCH-DASH-001)

---

## 3. Public API / Adapter Boundary

**Known adapters (confirmed by scanner data):**
- `dashboard/qrcode/adapters/qrcode.adapter` — consumed by `settings/vports/ui/VportsQrModal.jsx` and `public/vportMenu/view/VportPublicMenuQrView.jsx`, `VportPublicReviewsQrView.jsx`
- `dashboard/vport/adapters/vport.adapter` — consumed by `profiles/kinds/vport/hooks/useVportOwnerQuickStats.js` and 2 barbershop screen files

**NOT going through adapters (violations):**
- `profiles/adapters/kinds/vport/hooks/gas/` files wrap `dashboard/vport/dashboard/cards/gasprices/hooks/` internals directly
- `profiles/adapters/kinds/vport/ownership.adapter.js` wraps `dashboard/vport/controller/checkVportOwnership.controller` directly

These profiles adapter files point at dashboard internals — they should point at dashboard adapter exports. Fix requires ARCH-DASH-001 gas prices ownership decision.

---

## 4. Internal Layers

| Subsystem | Path | Files | Layer Stack |
|---|---|---|---|
| flyerBuilder | `dashboard/flyerBuilder/` | 31 | designStudio with canvas, sidebar, colorPicker, templates, printQR |
| qrcode | `dashboard/qrcode/` | 9 | Has `index.js` barrel; adapters/ confirmed |
| vport dashboard | `dashboard/vport/` | 217 | adapters, controller, dal, hooks, model, screens + 11 cards |
| bookings card | `vport/dashboard/cards/bookings/` | ~8 | hooks (useQuickBookingModal) |
| gasprices card | `vport/dashboard/cards/gasprices/` | 47 | controller, dal (×7), hooks, components, tests — source of 8 DAL violations |
| portfolio card | `vport/dashboard/cards/portfolio/` | ~12 | hooks (usePortfolioItemSubmit) — source of 2 controller violations |
| settings card | `vport/dashboard/cards/settings/` | ~15 | VportSettingsScreen + 3 settings hook violations + CSS leak |
| other cards | `vport/dashboard/cards/[8 others]/` | ~135 | Clean — confirmed through profiles adapters |

---

## 5. Allowed Dependencies

| Feature | Direction | Adapter? | Status |
|---|---|---|---|
| `profiles` | dashboard → profiles | MIXED (11 clean + 11 violations) | VIOLATIONS — see Section 8 |
| `settings` | dashboard → settings | MIXED (clean Card.adapter + 3 hook violations + CSS) | VIOLATIONS — ARCH-BIDIR-SETTINGS-001 |
| `public` | dashboard → public | NO (model import) | VIOLATION — ARCH-BIDIR-MODEL-001 |
| `media` | dashboard → media | YES | CLEAN |
| `identity` | dashboard → identity | YES | CLEAN |
| `upload` | dashboard → upload | YES (TODO: confirm) | ASSUMED CLEAN |
| `social` | dashboard → social | YES (TODO: confirm) | ASSUMED CLEAN |
| `notifications` | dashboard → notifications | YES (TODO: confirm) | ASSUMED CLEAN |

---

## 6. Prohibited Dependencies

Dashboard must not import from:
- `profiles/kinds/vport/dal/` directly — VIOLATION (currently happening, ARCH-BIDIR-PROFILES-001)
- `profiles/kinds/vport/controller/` directly — VIOLATION (currently happening)
- `settings/vports/hooks/` directly — VIOLATION (currently happening, ARCH-BIDIR-SETTINGS-001)
- `public/vportBusinessCard/model/` directly — VIOLATION (currently happening, ARCH-BIDIR-MODEL-001)
- `feed/`, `post/`, `chat/` — unrelated features
- `auth/` controller or DAL directly

---

## 7. DAL / Controller Rules

**DAL rules for `dashboard/vport/dashboard/cards/gasprices/dal/`:**
- These 7 DAL files currently import `resolveVportProfileId` from `profiles/kinds/vport/dal/` — this is the core DAL-VIOLATION
- After fix (ARCH-BIDIR-PROFILES-001): must import `resolveVportProfileId` from `profiles/adapters/` only
- DAL files must receive `actorId` from their controller, not resolve actor identity independently

**Controller rules for `dashboard/vport/controller/checkVportOwnership.controller`:**
- This controller is wrapped by `profiles/adapters/kinds/vport/ownership.adapter.js` — currently pointing at it directly
- After gas prices fix: profiles adapter should point at `dashboard/vport/adapters/vport.adapter` instead
- The controller itself may validate vport ownership — this is a correct controller responsibility

---

## 8. Known Coupling

**23 confirmed violations:**

| Violation | Count | Rule | From | To | Ticket |
|---|---|---|---|---|---|
| DAL-VIOLATION | 8 | `NO_CROSS_FEATURE_DAL` + `NO_INTERNAL_WITHOUT_ADAPTER` | gasprices/dal/*.dal.js | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal` | ARCH-BIDIR-PROFILES-001 |
| ADAPTER-MISSING | 1 | `NO_INTERNAL_WITHOUT_ADAPTER` | `cards/bookings/hooks/useQuickBookingModal.js` | `profiles/kinds/vport/controller/services/getVportServices.controller` | ARCH-BIDIR-PROFILES-001 |
| ADAPTER-MISSING | 2 | `NO_INTERNAL_WITHOUT_ADAPTER` | `cards/portfolio/hooks/usePortfolioItemSubmit.js` | profiles locksmith controllers (×2) | ARCH-BIDIR-PROFILES-001 |
| GAS-PRICES-SPLIT | 7 | `NO_INTERNAL_WITHOUT_ADAPTER` | `profiles/adapters/kinds/vport/hooks/gas/` + ownership | dashboard gas prices internals | ARCH-BIDIR-GASPRICES-001 (BLOCKED) |
| SHARED-MODEL-LEAK | 1 | `NO_INTERNAL_WITHOUT_ADAPTER` | `cards/settings/components/VportSettingsBusinessCard.jsx` | `public/vportBusinessCard/model/businessCardSettings.model` | ARCH-BIDIR-MODEL-001 |
| ADAPTER-MISSING | 3 | `NO_INTERNAL_WITHOUT_ADAPTER` | `cards/settings/VportSettingsScreen.jsx` | `settings/vports/hooks/` (×3) | ARCH-BIDIR-SETTINGS-001 |
| CSS-LEAK | 1 | CSS boundary | `cards/settings/VportSettingsScreen.jsx` | `settings/styles/settings-modern.css` | ARCH-BIDIR-CSS-001 |

**Bidirectional pairs:**
- `dashboard` ↔ `profiles` — RISK-002 (CRITICAL)
- `dashboard` ↔ `settings` — Pair 7 (MEDIUM)
- `dashboard` ↔ `public` — Pair 6 (LOW)

---

## 9. Risk Notes

**CRITICAL.** Dashboard is the highest-violation feature (23) and the most complex split candidate. The gas prices violation creates a lock — neither dashboard nor profiles can be cleanly split until ARCH-DASH-001 makes the ownership decision.

**Do not add new code to dashboard** that reaches into profiles, settings, or public internals. All new cross-feature imports must go through adapter boundaries.

---

## 10. Migration Notes

**ARCH-DASH-001 (SCOPE_EXPANDED_BY_SCANNER_AUDIT):**
- Plan split into: `flyerBuilder/`, `qrcode/`, `vportDashboard/`
- Must include remediation strategy for all 11 dashboard→profiles violations
- Gas prices ownership decision required (Option A: standalone feature, Option B: expose via adapter)
- All 11 card consumers from `dependency-map.json` must be mapped
- Route registration changes required
- No implementation ticket until owner approves violation strategy

**ARCH-BIDIR-PROFILES-001:** Fix 11 fixable dashboard→profiles violations (adapter additions in profiles). Can execute before ARCH-DASH-001.

**ARCH-BIDIR-SETTINGS-001:** Add 3 settings hook adapters; fix dashboard settings card. Can execute before ARCH-DASH-001.

**ARCH-BIDIR-CSS-001:** Move `settings-modern.css` to `shared/styles/`. Fix 1 dashboard import.

**ARCH-BIDIR-MODEL-001:** Move `businessCardSettings.model` to `shared/lib/`. Fix 1 dashboard import.

---

## 11. Unknowns

- TODO: Extract full dashboard consumer list from `dependency-map.json` (ARCH-DASH-001 Step 1)
- TODO: Confirm route tree for all dashboard screens (ARCH-DASH-001 Step 5)
- TODO: Gas prices ownership decision — Option A vs B (ARCH-DASH-001 gas prices design)
- TODO: Confirm which of the 11 card subsystems have consumers outside dashboard
- TODO: Confirm exact structure of `flyerBuilder/designStudio/` 5 subfolders
