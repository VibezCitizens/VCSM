# Adapter Contract
## VCSM Architecture Contract — §5.3–5.5 Adapter Rules (Locked)

> **Source:** [ARCHITECTURE.md](ARCHITECTURE.md) — Lines 840–919
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [05-feature-boundaries.md](05-feature-boundaries.md)
> **Cross-Links:** [09-ui-ownership.md](09-ui-ownership.md), [08-dependency-rules.md](08-dependency-rules.md)

---

### 5.3 Adapter Contract

> **Purpose:** Adapters are the public boundary of a feature. They answer one question only: *What is the safe public surface this feature exposes?*

**Adapters may:**

- re-export selected hooks
- re-export selected components
- re-export selected view screens

**Adapters must:**

- be the only cross-feature import surface
- expose only intentionally public APIs
- hide internal folder structure from consumers
- remain thin and declarative
- act as re-export boundaries only

**Adapters must not:**

- import Supabase
- contain DAL logic
- contain business rules
- replace controllers
- replace hooks
- become orchestration layers
- compose domain behavior

**Adapters may export only:**

- hooks
- components
- view screens

**Adapters must never export:**

- DAL
- models
- controllers

---

### 5.4 Adapter Import Rule

Any code outside a feature must import the feature through its adapter.

Allowed:

```js
import { OnboardingCardsView } from '@/features/onboarding/adapters/onboarding.adapter';
```

Forbidden:

```js
import { useOnboardingCards } from '@/features/onboarding/hooks/useOnboardingCards';
import { onboardingController } from '@/features/onboarding/controller/onboardingController';
```

---

### 5.5 Screen-to-Feature Access Rule

Final Screens and View Screens must never import another feature's internal files.

They must only import other features through adapters.

Allowed:

```js
import { ExploreViewScreen } from '@/features/explore/adapters/explore.adapter';
import { OnboardingCardsView } from '@/features/onboarding/adapters/onboarding.adapter';
```

Forbidden:

```js
import { ExploreView } from '@/features/explore/ui/ExploreView';
import { useOnboardingCards } from '@/features/onboarding/hooks/useOnboardingCards';
```
