# §32 — Internal Feature Self-Import

## Rule

The adapter boundary governs **external consumers** only. A feature may import its own internal layers directly, provided the import follows the layer contract direction.

## Allowed Layer Import Direction

```
screens → hooks → controllers → models → DAL
```

Upper layers may import from lower layers. Lower layers must never import from upper layers.

## What Remains Forbidden

- Cross-feature imports that bypass the target feature's adapter — still ERROR regardless of which layer initiates the call
- Inverted layer imports within the same feature (lower importing upper) — ERROR

## What Is Explicitly Allowed

Same-feature imports that travel in the correct layer direction do not require going through the adapter and are not a violation.

**Example:**

```js
// features/auth/login/hooks/useLogin.js
import { ctrlLogin } from '@/features/auth/login/controllers/login.controller'
// ✓ allowed — hook (upper) → controller (lower), same feature
```

## Enforcement

| Violation | Severity |
|---|---|
| Lower layer importing upper layer, same feature | ERROR |
| Cross-feature import bypassing adapter | ERROR |
| Correct-direction same-feature import | Not a violation |

Source: `INTERNAL_FEATURE_SELF_IMPORT_CONTRACT.md`
