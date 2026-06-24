# Engine Validation Report

Generated: 2026-06-24T06:36:32.072Z

## Schema Results

| Scope | Status | Errors |
|---|---|---|
| engine-map.json | PASS | None |
| engine-consumer-map.json | PASS | None |
| engine-entrypoint-map.json | PASS | None |
| engine-ownership-map.json | PASS | None |
| engine-security-map.json | PASS | None |
| engine-graph.json | PASS | None |
| engine-execution-map.json | PASS | None |

## Ownership Results

| Engine | Score | Status | Warnings |
|---|---:|---|---|
| booking | 67 | WARNING | responsibility missing |
| chat | 100 | PASS | None |
| hydration | 0 | WARNING | CLAUDE.md missing; ownership missing; responsibility missing |
| i18n | 67 | WARNING | responsibility missing |
| identity | 67 | WARNING | responsibility missing |
| media | 0 | WARNING | CLAUDE.md missing; ownership missing; responsibility missing |
| notifications | 67 | WARNING | responsibility missing |
| portfolio | 67 | WARNING | responsibility missing |
| reviews | 67 | WARNING | responsibility missing |

## Security Results

| Engine | Risk | Writes | RPCs | Edge Functions | External APIs | Status |
|---|---|---:|---:|---:|---:|---|
| booking | HIGH | 30 | 0 | 0 | 0 | PASS |
| chat | HIGH | 49 | 2 | 0 | 0 | PASS |
| hydration | LOW | 0 | 1 | 0 | 0 | PASS |
| i18n | LOW | 0 | 0 | 0 | 0 | PASS |
| identity | MEDIUM | 5 | 0 | 0 | 0 | PASS |
| media | LOW | 0 | 0 | 0 | 0 | PASS |
| notifications | MEDIUM | 4 | 7 | 0 | 0 | PASS |
| portfolio | MEDIUM | 8 | 0 | 0 | 0 | PASS |
| reviews | MEDIUM | 5 | 2 | 0 | 0 | PASS |

## Readiness Results

| Engine | Score | Ownership | Consumers | Tests | Security | Entrypoints |
|---|---:|---:|---:|---:|---:|---:|
| booking | 80 | 67 | 90 | 100 | 50 | 100 |
| chat | 76 | 100 | 30 | 100 | 50 | 100 |
| portfolio | 67 | 67 | 0 | 100 | 75 | 100 |
| reviews | 64 | 67 | 60 | 0 | 75 | 100 |
| i18n | 63 | 67 | 30 | 0 | 100 | 100 |
| hydration | 60 | 0 | 100 | 0 | 100 | 100 |
| notifications | 58 | 67 | 30 | 0 | 75 | 100 |
| identity | 52 | 67 | 0 | 0 | 75 | 100 |
| media | 40 | 0 | 0 | 0 | 100 | 100 |

## Command Readiness

| Command | Engine Maps Ready |
|---|---|
| ARCHITECT | Yes |
| VENOM | Yes |
| BLACKWIDOW | Yes |
| ELEKTRA | Yes |
| DR. STRANGE | Yes |
| THOR | Yes |
