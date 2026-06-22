# ARCHITECTURE — engines/i18n

**Last ARCHITECT Run:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001
**Status:** COMPLETE — anomalies found
**Independence:** FULLY INDEPENDENT

---

## Engine Purpose

Platform-level internationalization runtime. Translation lookup (dot-path keys + `{{param}}` interpolation), React context provider, and EN/ES platform locale data. Pure utility — no DB, no DI, no global state.

## Source Root

`/Users/vcsm/Desktop/VCSM/engines/i18n/`

## CLAUDE.md

PRESENT — explicit scope rules. React components listed as intentionally in engine. No app-specific copy.

## Aliases

`@i18n` (engine code: createTranslator, I18nProvider, useTranslation)
`@i18n/*` (locale data: `@i18n/en/common.json`, `@i18n/es/auth.json`)

## Layer Structure

```
index.js                        — entry point → src/index.js
src/
  index.js                      — 5 exports
  createTranslator.js           — dot-path resolver; missing key → key string
  interpolate.js                — {{param}} template substitution
  react/
    I18nProvider.jsx            — React context provider (INTENTIONAL)
    useTranslation.js           — useContext hook with empty-dict fallback
en/                             — 8 platform locale files (English)
es/                             — 8 platform locale files (ANOM-I18N-001: English placeholders)
```

Total: 23 files (16 are locale JSON data)

## Infrastructure

None — no DB, no network, no DI config. Fully stateless.

## Architecture Anomalies

| ID | Anomaly | Severity |
|----|---------|----------|
| ANOM-I18N-001 | Spanish locale files are English placeholder values | MEDIUM |
| ANOM-I18N-002 | createTranslator + interpolate have zero tests | LOW-MEDIUM |

**Note:** React in engine is NOT an anomaly here — explicitly declared in CLAUDE.md ("What Lives Here"). This differs from chat/hydration/media where React presence is undeclared.

## Known Gaps

- BEHAVIOR.md: MISSING (P3 — utility engine)
- SECURITY.md: NOT APPLICABLE (no trust boundary)
- Zero tests for runtime functions

## Full Report

`ZZnotforproduction/ENGINES/i18n/outputs/2026/06/05/ARCHITECT/engine.i18n.architecture.md`
