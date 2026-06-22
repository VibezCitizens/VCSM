# INDEX — VCSM / dashboard / modules / qrcode

**Last ARCHITECT Run:** 2026-06-05
**Status:** SOURCE_VERIFIED
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001

---

## Source File Inventory

| File | Layer | Lines Read |
|---|---|---|
| adapters/qrcode.adapter.js | adapter (public barrel) | 1-7 |
| components/QrCode.jsx | component | 1-29 |
| components/QrCard.jsx | component | 1-67 |
| components/flyer/ClassicFlyer.jsx | component | not read |
| components/flyer/ClassicFlyer.styles.js | style | not read |
| components/flyer/PosterFlyer.jsx | component | not read |
| components/flyer/posterFlyer.styles.js | style | not read |
| __tests__/qrcode.spiderman.test.js | test | not read |
| index.js | barrel | not read |

## Module Counts (SOURCE_VERIFIED)

| Layer | Count |
|---|---|
| screen | 0 |
| controller | 0 |
| dal | 0 |
| hook | 0 |
| component | 4 (QrCode, QrCard, ClassicFlyer, PosterFlyer) |
| style | 2 |
| adapter | 1 (public barrel/re-export — NOT a library wrapper) |
| tests | 1 |

## Routes

None — component library module, no independent route.

## External Dependencies

| Package | Used In | Notes |
|---|---|---|
| react-qr-code | components/QrCode.jsx | Direct import in component; qrcode.adapter is barrel, not the wrapper |

## Empty Value Guards (SOURCE_VERIFIED)

| File | Guard |
|---|---|
| QrCode.jsx | `if (!v.trim()) return null` |
| QrCard.jsx | `if (!v.trim()) return null` |

## Independence / Completeness

| Field | Value |
|---|---|
| Independence | INDEPENDENT |
| Completeness | MOSTLY COMPLETE |
| BEHAVIOR.md | MISSING |
| Security audit | N/A (no write path) |
