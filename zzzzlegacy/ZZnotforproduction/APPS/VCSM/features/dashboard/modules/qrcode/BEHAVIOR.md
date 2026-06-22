# Dashboard Module Behavior Contract — qrcode

Status: APPROVED

Module: qrcode

Parent Feature: dashboard

Category Key: dashboard-qrcode

Created By Ticket: TICKET-BEHAV-DASHBOARD-qrcode-WRITE-0002

Last Updated: 2026-06-04

Current Security Status:
- THOR: CLEAR
- Open Findings:
  - None
- Security Review Status:
  - VENOM: COMPLETE for no-write review and QR URL trust-boundary review.
  - ELEKTRA: COMPLETE for current public QR, flyer QR, settings QR, and profile-header QR source paths.
  - BLACKWIDOW: COMPLETE for QR UUID bypass attempts; profile-header actorId fallback patched.

---

## 1. User Goal

The `qrcode` module provides reusable QR rendering primitives for dashboard and public VPORT surfaces. It renders QR SVGs, QR cards, and flyer QR blocks from caller-provided URL values.

The module itself does not fetch data, mutate data, decide ownership, or build canonical actor URLs. Its main behavior contract is that QR consumers must only pass safe, public, slug-based URLs into the renderer.

---

## 2. Actors / Roles

| Actor | Allowed Actions | Restrictions |
|---|---|---|
| VPORT owner actor | Generate or view QR outputs through owner tools such as flyerBuilder/settings when upstream owner screens allow it. | Must not receive QR payloads containing raw actor UUIDs. |
| Public visitor | Scan QR codes and open public profile/menu/reviews/card routes. | Must only receive slug-based public URLs. |
| QR consumer component | Pass a safe URL string into `QrCode`, `QrCard`, `ClassicFlyer`, or `PosterFlyer`. | Must validate or build payloads through shared QR URL builders before rendering. |

---

## 3. Module Architecture

### Routes

No route is owned directly by `apps/VCSM/src/features/dashboard/qrcode/`.

Observed consumers include:

- Public menu QR view: `VportPublicMenuQrView`
- Public reviews QR view: `VportPublicReviewsQrView`
- Flyer builder menu flyer view: `VportActorMenuFlyerView`
- Settings business-card QR modal: `VportsQrModal`
- Profile header visible QR wrapper: `VisibleQRCode`

### Screens

No dashboard screen is owned directly by the `qrcode` module.

### Hooks

No qrcode-local hook exists.

### Controllers

No qrcode-local controller exists.

### DALs

No qrcode-local DAL exists.

### RPCs

No qrcode-local RPC exists.

### Edge Functions

No qrcode-local edge function exists.

### Engine Dependencies

- `react-qr-code` renders the SVG QR.
- Shared URL builder dependency: `apps/VCSM/src/shared/lib/qrUrlBuilders.js`.

### Ownership Gates

No ownership gate exists inside the low-level QR renderer. Ownership and public/private route authorization are caller responsibilities.

---

## 4. Happy Paths

### HP-001

BEH-DASH-qrcode-001

Preconditions:

- Caller passes a non-empty string URL to `QrCode`.

Flow:

Consumer builds or receives a safe URL.
↓
Consumer renders `QrCode`.
↓
`QrCode` stringifies the value and trims it.
↓
`react-qr-code` renders an SVG QR at the requested size/color/error-correction level.

Expected Result:

A QR SVG renders for the provided non-empty value.

Data Changes:

None.

---

### HP-002

BEH-DASH-qrcode-002

Preconditions:

- Caller passes a safe non-empty URL to `QrCard`.

Flow:

Consumer renders `QrCard`.
↓
`QrCard` computes wrapper styles and optional label/footer.
↓
`QrCard` renders nested `QrCode`.

Expected Result:

A styled QR card renders with optional label and footer.

Data Changes:

None.

---

### HP-003

BEH-DASH-qrcode-003

Preconditions:

- Flyer builder has resolved a QR-safe canonical slug.
- `VportActorMenuFlyerView` has `isQrSafeSlug(canonicalSlug) === true`.

Flow:

Flyer view builds a menu URL from the safe canonical slug.
↓
Flyer body gate opens.
↓
`ClassicFlyer`, `PosterFlyer`, or `PrintableQrSheet` renders.
↓
QR component encodes the menu URL.

Expected Result:

Printable QR output encodes a safe `/profile/:slug/menu` URL.

Data Changes:

None.

---

### HP-004

BEH-DASH-qrcode-004

Preconditions:

- Public menu/reviews QR view has a safe canonical slug.

Flow:

Public QR view resolves canonical slug.
↓
View checks `isQrSafeSlug`.
↓
View builds menu/reviews QR URL through `buildMenuQrUrl` or `buildReviewsQrUrl`.
↓
View renders `QrCode`, URL display, open action, and copy action.

Expected Result:

Public QR view renders a QR code and actions only for a safe slug-based URL.

Data Changes:

None.

---

### HP-005

BEH-DASH-qrcode-005

Preconditions:

- Settings business-card modal receives a safe slug.

Flow:

Modal calls `buildBusinessCardQrUrl(target.slug)`.
↓
Builder returns a safe `/vport/:slug/card` URL.
↓
Modal renders `QrCode` and copy/open actions.

Expected Result:

Business-card QR encodes a safe slug-based card URL.

Data Changes:

None.

---

## 5. Failure Paths

### FP-001

BEH-DASH-qrcode-101

Trigger:

`QrCode` or `QrCard` receives null, empty, or whitespace-only value.

Expected System Behavior:

Component returns `null`.

Expected UI Behavior:

No QR is rendered.

Expected Logging:

No logging found in source.

---

### FP-002

BEH-DASH-qrcode-102

Trigger:

Shared builder receives null, empty, or raw UUID slug.

Expected System Behavior:

`isQrSafeSlug` returns false for null/empty/UUID input and URL builders return an empty string.

Expected UI Behavior:

Consumers that pass the empty string into `QrCode` render no QR.

Expected Logging:

No logging found in source.

---

### FP-003

BEH-DASH-qrcode-103

Trigger:

Public menu/reviews QR view is loading or has an unsafe canonical slug.

Expected System Behavior:

View does not build or render the QR URL.

Expected UI Behavior:

Loading skeleton remains visible; URL display/actions are hidden.

Expected Logging:

No logging found in source.

---

### FP-004

BEH-DASH-qrcode-104

Trigger:

Flyer builder canonical slug is missing or unsafe.

Expected System Behavior:

Print is disabled and flyer QR body is gated.

Expected UI Behavior:

`Preparing flyer...` state renders.

Expected Logging:

No logging found in source.

---

### FP-005

BEH-DASH-qrcode-105

Trigger:

Clipboard copy fails in public QR or flyer surfaces.

Expected System Behavior:

Copy handler catches the error.

Expected UI Behavior:

Copied state is not shown or is reset.

Expected Logging:

No logging found in source.

---

## 6. Security Rules

### SEC-001

BEH-DASH-qrcode-201

Rule:

Raw actor UUIDs must never be encoded into public QR URLs.

Enforcement Layer:

`isQrSafeSlug`, public QR views, flyer print gate, and shared URL builders.

Current Status:

SOURCE VERIFIED in current consumers reviewed.

Finding Links:

- Historical ELEK-2026-05-26-001 — patched in current source.
- QRCODE-CONSUMER-GUARD-001

---

### SEC-002

BEH-DASH-qrcode-202

Rule:

QR URL builders must return empty strings for unsafe slugs.

Enforcement Layer:

`buildReviewsQrUrl`, `buildBusinessCardQrUrl`, `buildMenuQrUrl`, `buildMenuShortDisplayUrl`.

Current Status:

SOURCE VERIFIED.

Finding Links:

- Historical VENOM V-006 / BLACKWIDOW QR UUID injection scenario — blocked.

---

### SEC-003

BEH-DASH-qrcode-203

Rule:

Low-level `QrCode` must not render an empty value.

Enforcement Layer:

`QrCode.jsx`.

Current Status:

SOURCE VERIFIED.

Finding Links:

- QRCODE-CONSUMER-GUARD-001

---

### SEC-004

BEH-DASH-qrcode-204

Rule:

Cross-feature consumers should import QR primitives through `qrcode.adapter.js`.

Enforcement Layer:

Adapter export surface.

Current Status:

SOURCE VERIFIED for external consumers found in this pass. Internal flyer components still import internal `QrCode` directly, which is acceptable inside the qrcode feature boundary.

Finding Links:

- Historical S1 adapter export drift — patched in current source.

---

### SEC-005

BEH-DASH-qrcode-205

Rule:

The qrcode module must remain read-only; any future QR link persistence, scan counting, or management actions promote it to a write/security module requiring VENOM/ELEKTRA/BLACKWIDOW rerun.

Enforcement Layer:

Governance.

Current Status:

SOURCE VERIFIED read-only in current module source.

Finding Links:

- QRCODE-CONSUMER-GUARD-001

---

## 7. Must Never Happen

### MNH-001

BEH-DASH-qrcode-301

Invariant:

A QR code must never encode a public URL containing a raw actor UUID.

Current Status:

SOURCE VERIFIED for current public/flyer consumers.

Related Findings:

- Historical ELEK-2026-05-26-001
- QRCODE-CONSUMER-GUARD-001

Required Tests:

- TESTREQ-DASH-qrcode-001
- TESTREQ-DASH-qrcode-002

---

### MNH-002

BEH-DASH-qrcode-302

Invariant:

Print must never be enabled for flyer output before a QR-safe canonical slug is available.

Current Status:

SOURCE VERIFIED in `VportActorMenuFlyerView`.

Related Findings:

- QRCODE-CONSUMER-GUARD-001

Required Tests:

- TESTREQ-DASH-qrcode-003

---

### MNH-003

BEH-DASH-qrcode-303

Invariant:

Public QR views must never treat a UUID fallback canonical slug as safe.

Current Status:

SOURCE VERIFIED in public menu/reviews QR views.

Related Findings:

- Historical ELEK-2026-05-26-001

Required Tests:

- TESTREQ-DASH-qrcode-002

---

### MNH-004

BEH-DASH-qrcode-304

Invariant:

The qrcode module must never introduce DAL/RPC/write behavior without reclassification out of Tier 4 read-only.

Current Status:

SOURCE VERIFIED; no local write surfaces found.

Related Findings:

- None.

Required Tests:

- TESTREQ-DASH-qrcode-004

---

## 8. Data Changes

| Surface | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `dashboard/qrcode` local module | No DB read. | No. | No. | No. |
| Shared QR builders | No DB read. | No. | No. | No. |
| Public QR consumers | Slug resolution occurs upstream through profile adapters. | No qrcode-local write. | No qrcode-local write. | No qrcode-local write. |
| Flyer QR consumers | Public details and canonical slug resolution occur upstream. | No qrcode-local write. | No qrcode-local write. | No qrcode-local write. |

---

## 9. Side Effects

Notifications:

- None.

Analytics:

- None found.

Media:

- None.

Exports:

- No export file generation found.

Jobs:

- None.

Cache:

- No qrcode-local cache.

Other:

- QR consumers can copy links to clipboard.
- Flyer consumers can call `window.print()`, but print is gated upstream by safe slug availability.

---

## 10. UI Outputs

Loading States:

- Public QR consumers render skeleton/loading QR placeholders while slug is resolving.
- Flyer view renders `Preparing flyer...` while slug is unsafe or missing.

Success States:

- QR SVG renders for a non-empty safe URL.
- QR card/flyer wrappers render labels, footer text, URL display, copy/open actions, and print-ready QR.

Error States:

- Low-level qrcode components render nothing for empty values.
- Public QR views do not show a specific unsafe-slug error; they keep loading skeleton behavior.

Empty States:

- `QrCode` and `QrCard` return `null` for empty values.

Owner States:

- Owner QR generation is provided by upstream flyer/settings/dashboard tools, not qrcode-local state.

Public States:

- Public menu/reviews QR views render only after safe slug resolution.

---

## 11. Acceptance Criteria

### AC-DASH-qrcode-001

Requirement:

`QrCode` renders only for non-empty values and otherwise returns null.

Evidence:

`QrCode.jsx` trims stringified value and returns null when empty.

Status:

APPROVED

---

### AC-DASH-qrcode-002

Requirement:

Shared QR builders reject raw UUID slugs.

Evidence:

`qrUrlBuilders.js` uses `UUID_RE` in `isQrSafeSlug`; all builders call it before returning URLs.

Status:

APPROVED

---

### AC-DASH-qrcode-003

Requirement:

Public menu/reviews QR views must not render QR, URL display, open, or copy actions until `isQrSafeSlug` passes.

Evidence:

`VportPublicMenuQrView.jsx` and `VportPublicReviewsQrView.jsx` gate rendering on `loading || !isQrSafeSlug`.

Status:

APPROVED

---

### AC-DASH-qrcode-004

Requirement:

Flyer/print QR output must be unavailable until a safe slug exists.

Evidence:

`VportActorMenuFlyerView.jsx` disables Print and gates flyer body on `isQrSafeSlug(canonicalSlug)`.

Status:

APPROVED

---

### AC-DASH-qrcode-005

Requirement:

Cross-feature consumers should use the qrcode adapter export surface.

Evidence:

External consumers found in this pass import `QrCode`, `ClassicFlyer`, or `PosterFlyer` through `qrcode.adapter.js`.

Status:

APPROVED

---

## 12. Test Requirements

### TESTREQ-DASH-qrcode-001

Validates:

`isQrSafeSlug` and all QR URL builders reject null, empty, and raw UUID inputs.

Type:

Unit test.

Status:

COMPLETE

---

### TESTREQ-DASH-qrcode-002

Validates:

Public menu/reviews QR views render skeleton and no QR when `canonicalSlug` is a UUID fallback.

Type:

SPIDER-MAN component/security regression test.

Status:

COMPLETE

---

### TESTREQ-DASH-qrcode-003

Validates:

Flyer print and printable QR body stay disabled/gated until slug is QR-safe.

Type:

SPIDER-MAN component/security regression test.

Status:

COMPLETE

---

### TESTREQ-DASH-qrcode-004

Validates:

`dashboard/qrcode` remains free of DAL/controller/RPC/write imports.

Type:

Architecture guard test.

Status:

COMPLETE

---

### TESTREQ-DASH-qrcode-005

Validates:

External consumers import QR primitives from `qrcode.adapter.js`.

Type:

Architecture/import-boundary test.

Status:

COMPLETE

---

## 13. Security Findings Linked

| Finding ID | Severity | Status | Related Behavior IDs |
|---|---|---|---|
| QRCODE-SPIDER-001 | LOW | CLOSED — SPIDER-MAN PASS | BEH-DASH-qrcode-301, BEH-DASH-qrcode-302, BEH-DASH-qrcode-303 |
| QRCODE-CONSUMER-GUARD-001 | MEDIUM | PATCHED IN CURRENT SOURCE | BEH-DASH-qrcode-201, BEH-DASH-qrcode-301 |
| QRCODE-CONSUMER-GUARD-002 | HIGH | PATCHED IN CURRENT SOURCE | BEH-DASH-qrcode-201, BEH-DASH-qrcode-301 |
| ELEK-2026-05-26-001 | HIGH | PATCHED IN CURRENT SOURCE | BEH-DASH-qrcode-201, BEH-DASH-qrcode-303 |
| S1 adapter export drift | LOW | PATCHED IN CURRENT SOURCE | BEH-DASH-qrcode-204 |
| BLACKWIDOW QR UUID injection scenario | MEDIUM | BLOCKED | BEH-DASH-qrcode-202, BEH-DASH-qrcode-301 |

---

## 14. THOR Release Gates

| Gate | Status | Blocking? |
|---|---|---|
| Dashboard module inventory classification | COMPLETE | No |
| Read-only module verification | COMPLETE | No |
| Local write surface scan | COMPLETE — none found | No |
| QR UUID safety source check | COMPLETE | No |
| Adapter export surface | COMPLETE | No |
| Regression tests | COMPLETE — 8 qrcode SPIDER-MAN tests passing | No |
| Future QR persistence/scan-count feature | NOT_APPLICABLE | Would require reclassification |

---

## 15. Native / Alternate UI Parity

| Behavior | Native Equivalent | Status |
|---|---|---|
| Render QR SVG | No native equivalent found in source. | NOT_APPLICABLE |
| Public menu/reviews QR view | No native equivalent found in source. | NOT_APPLICABLE |
| Flyer print QR | No native equivalent found in source. | NOT_APPLICABLE |

---

## 16. Engine Dependencies

| Engine | Purpose | Status |
|---|---|---|
| `react-qr-code` | SVG QR rendering. | SOURCE VERIFIED |
| Shared QR URL builders | Slug-safe URL construction. | SOURCE VERIFIED |
| Profile canonical slug adapter | Upstream slug resolution by consumers. | SOURCE VERIFIED AS CONSUMER DEPENDENCY |

---

## 17. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-DASH-qrcode-001 | Should public QR views show an explicit incomplete-profile error instead of an indefinite skeleton when slug resolves to an unsafe UUID fallback? | CLOSED — current skeleton/no-QR behavior accepted for Tier 4 release. |
| OQ-DASH-qrcode-002 | Should `isQrSafeSlug` trim whitespace before checking truthiness to block whitespace-only slugs? | CLOSED — implemented and tested. |
| OQ-DASH-qrcode-003 | Should `VportsQrModal` disable Open/Copy actions when `buildBusinessCardQrUrl` returns an empty string? | CLOSED — implemented and tested by static guard. |
| OQ-DASH-qrcode-004 | Should QR regression tests become mandatory even for Tier 4 read-only modules because public URL safety is security-sensitive? | CLOSED — focused SPIDER-MAN tests added. |

---

## 18. Confidence Review

| Section | Confidence | Source Verified |
|---|---|---|
| User Goal | HIGH | Yes: qrcode source and consumers. |
| Actors / Roles | MEDIUM | Yes for consumers; qrcode itself has no actor state. |
| Module Architecture | HIGH | Yes: module files and import search. |
| Happy Paths | HIGH | Yes: QR components, builders, public/flyer consumers. |
| Failure Paths | HIGH | Yes: empty values and unsafe slug gates. |
| Security Rules | HIGH | Yes: current source and historical security notes. |
| Data Changes | HIGH | Yes: no local DB/write code found. |
| Side Effects | HIGH | Yes: clipboard and print are consumer side effects. |
| UI Outputs | HIGH | Yes: component source. |
| Acceptance Criteria | HIGH | Yes: source mapped. |
| Test Requirements | HIGH | Yes: qrcode SPIDER-MAN tests now present and passing. |
| Native / Alternate UI Parity | LOW | No native source found. |
| Engine Dependencies | HIGH | Yes: imports verified. |
| Open Questions | HIGH | Yes: derived from source edge cases. |

---

## 19. Command Sign-Off

ARCHITECT: COMPLETE — qrcode file map, adapter boundary, and profile-header consumer path source-verified.

VENOM: COMPLETE — no write surface; QR URL safety evidence source-verified.

ELEKTRA: COMPLETE for current source — public QR and profile-header QR UUID leak paths are patched by safe slug guards.

BLACKWIDOW: COMPLETE for QR builder and profile-header bypass — UUID scenarios blocked in current source.

SPIDER-MAN: COMPLETE — `qrcode.spiderman.test.js` passes 8 focused tests for safe slug builders, QR empty rendering, consumer gates, read-only architecture, and adapter boundary.

PROFESSOR X: APPROVED — behavior contract source-verified and test-backed for Tier 4 release.

THOR: CLEAR — read-only module with no local mutation surface and focused SPIDER-MAN coverage passing.

---

## 14. ARCHITECT Wave Reference (2026-06-05)

ARCHITECTURE.md created: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/qrcode/ARCHITECTURE.md

Key findings from ARCHITECT wave:
- Top-level module (not a dashboard card) — route at /actor/:actorId/dashboard/qr
- Read-only: no write surfaces (QR is generated from actorId/slug, no DB writes)
- No-raw-IDs rule confirmed applicable: QR target URLs must use slugs not UUIDs
- 6 callgraph nodes (utility-heavy, no DAL)

Ticket: TICKET-LOGAN-DASHBOARD-MODULE-BEHAVIOR-WAVE-0001

---

Final Verdict:

BEHAVIOR_DASHBOARD_QRCODE_APPROVED
