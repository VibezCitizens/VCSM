# INDEX — ENGINES / i18n

Status: ARCHITECT COMPLETE (2026-06-05)
Ticket: TICKET-ARCHITECT-MISSING-0001

## Source Root

`/Users/vcsm/Desktop/VCSM/engines/i18n/`

## Governance Files

| File | Status |
|------|--------|
| ARCHITECTURE.md | PRESENT |
| CURRENT_STATUS.md | PRESENT |
| CLAUDE.md (engine root) | PRESENT |
| BEHAVIOR.md | MISSING (P3 — low risk for utility engine) |
| SECURITY.md | NOT APPLICABLE |

## Source Inventory (as of 2026-06-05)

```
engines/i18n/
├── CLAUDE.md                              — scope rules; bilingual EN/ES; no app-specific copy
├── index.js                               — entry point → src/index.js
├── en/                                    — 8 platform-level English locale files
│   ├── common.json
│   ├── actions.json
│   ├── errors.json
│   ├── auth.json
│   ├── notifications.json
│   ├── state.json
│   ├── status.json
│   └── time.json
├── es/                                    — 8 Spanish locale files (ANOM-I18N-001: English placeholders)
│   └── [same 8 files]
└── src/
    ├── index.js                           — 5 exports
    ├── createTranslator.js                — dot-path resolver; missing key → key string
    ├── interpolate.js                     — {{param}} substitution
    └── react/
        ├── I18nProvider.jsx               — React context provider (INTENTIONAL per CLAUDE.md)
        └── useTranslation.js              — useContext hook with empty-dict fallback
```

Total: 23 files (16 are locale JSON data; zero tests)

## ARCHITECT Output

`outputs/2026/06/05/ARCHITECT/engine.i18n.architecture.md`
