# PostModules Extraction Plan

**Ticket:** ARCH-POSTMOD-001  
**Generated:** 2026-06-06  
**Status:** PLANNING ONLY — no source files modified

---

## Current State

`PostCard.view.jsx` renders specialized content cards for typed posts via a hard-coded
if-else chain. Every new vport type (barber, locksmith, gas station, exchange, restaurant)
requires three manual changes to the view file: a new import, a new boolean flag, and a new
branch in the render chain.

### Current injection pattern

```jsx
// PostCard.view.jsx — 8 named imports
import { FuelPricesPostModule }          from '...postModules/fuelPrices'
import { ExchangeRatesPostModule }        from '...postModules/exchangeRates'
import { MenuDropPostModule }             from '...postModules/menuDrop'
import { BarbershopPortfolioPostModule }  from '...postModules/barbershopPortfolio'
import { BarbershopHoursPostModule }      from '...postModules/barbershopHours'
import { LocksmithPortfolioPostModule }   from '...postModules/locksmithPortfolio'
import { LocksmithHoursPostModule }       from '...postModules/locksmithHours'
import { LocksmithServiceAreaPostModule } from '...postModules/locksmithServiceArea'

// 8 boolean flags
const isFuelPost = postType === 'fuel_price_update'
const isExchangePost = postType === 'exchange_rate_update'
// ...

// 8-branch if-else chain in JSX
if (isFuelPost) {
  <FuelPricesPostModule text={...} payload={...} stationRoute={...} />
} else if (isExchangePost) {
  <ExchangeRatesPostModule text={...} payload={...} exchangeRoute={...} />
} // ... 6 more
```

---

## Module Inventory — 8 modules

| Module | post_type | Props |
|---|---|---|
| `fuelPrices` / `FuelPricesPostModule` | `fuel_price_update` | `text`, `payload`, `stationRoute` |
| `exchangeRates` / `ExchangeRatesPostModule` | `exchange_rate_update` | `text`, `payload`, `exchangeRoute` |
| `menuDrop` / `MenuDropPostModule` | `menu_update` | `text`, `payload`, `media`, `menuUrl`, `prioritizeMedia` |
| `barbershopPortfolio` / `BarbershopPortfolioPostModule` | `barbershop_portfolio_update` | `text`, `payload`, `media`, `actorRoute`, `prioritizeMedia` |
| `barbershopHours` / `BarbershopHoursPostModule` | `barbershop_hours_update` | `text`, `payload`, `actorRoute` |
| `locksmithPortfolio` / `LocksmithPortfolioPostModule` | `locksmith_portfolio_update` | `text`, `payload`, `media`, `actorRoute`, `prioritizeMedia` |
| `locksmithHours` / `LocksmithHoursPostModule` | `locksmith_hours_update` | `text`, `payload`, `actorRoute` |
| `locksmithServiceArea` / `LocksmithServiceAreaPostModule` | `locksmith_service_area_update` | `text`, `payload`, `actorRoute` |

### Shared components (consumed by modules)
```
postModules/shared/
├── components/PostModuleCta.jsx
├── components/PostModuleFrame.jsx
├── components/PostModuleHeader.jsx
└── postModules.css
```

### Consistent module file structure
Each of the 8 modules follows:
```
postModules/[moduleName]/
├── [ModuleName]PostModule.jsx    — React component (the card body)
├── [moduleName]PostModule.model.js  — data transformation / display formatting
├── [moduleName]PostModule.css    — scoped styles
└── index.js                     — barrel: exports the component
```

---

## Problem Analysis

### Why the if-else chain is a problem

1. **Every new vport type adds 3 changes to a shared file.** PostCard.view.jsx is the highest-traffic
   render file in the codebase — every post render passes through it. Accidental edits here break
   every post on every screen.

2. **Import order coupling.** Adding a new module import creates a dependency from PostCard.view.jsx
   to the new module. If the module has a bug, it affects all post rendering.

3. **Props are not typed.** Each module has a different prop surface. The view file must know the
   exact props for every module. Adding a module with the wrong prop shape silently renders incorrectly.

4. **No discovery mechanism.** To add a new post type, a developer must know to edit PostCard.view.jsx.
   There is no self-registering mechanism.

---

## Proposed Architecture — Registry Pattern

### Option A: Simple component registry (recommended for current scale)

```js
// postModules/registry.js  ← new file
import { FuelPricesPostModule }          from './fuelPrices'
import { ExchangeRatesPostModule }        from './exchangeRates'
import { MenuDropPostModule }             from './menuDrop'
import { BarbershopPortfolioPostModule }  from './barbershopPortfolio'
import { BarbershopHoursPostModule }      from './barbershopHours'
import { LocksmithPortfolioPostModule }   from './locksmithPortfolio'
import { LocksmithHoursPostModule }       from './locksmithHours'
import { LocksmithServiceAreaPostModule } from './locksmithServiceArea'

export const POST_MODULE_REGISTRY = {
  fuel_price_update:             FuelPricesPostModule,
  exchange_rate_update:           ExchangeRatesPostModule,
  menu_update:                    MenuDropPostModule,
  barbershop_portfolio_update:    BarbershopPortfolioPostModule,
  barbershop_hours_update:        BarbershopHoursPostModule,
  locksmith_portfolio_update:     LocksmithPortfolioPostModule,
  locksmith_hours_update:         LocksmithHoursPostModule,
  locksmith_service_area_update:  LocksmithServiceAreaPostModule,
}
```

However, each module has different props. The registry alone doesn't solve prop dispatch.

### Option B: Registry with prop builders (full solution)

Each registry entry is an object with a Component and a `buildProps` function
that maps the PostCard context → the module's specific props:

```js
// postModules/registry.js
export const POST_MODULE_REGISTRY = {
  fuel_price_update: {
    Component: FuelPricesPostModule,
    buildProps: ({ text, payload, actorSummary }) => ({
      text,
      payload: payload ?? null,
      stationRoute: actorSummary?.route ?? null,
    }),
  },
  exchange_rate_update: {
    Component: ExchangeRatesPostModule,
    buildProps: ({ text, payload, actorSummary }) => ({
      text,
      payload: payload ?? null,
      exchangeRoute: actorSummary?.route ?? null,
    }),
  },
  menu_update: {
    Component: MenuDropPostModule,
    buildProps: ({ text, payload, media, menuUrl, prioritizeMedia }) => ({
      text,
      payload: payload ?? null,
      media,
      menuUrl,
      prioritizeMedia,
    }),
  },
  barbershop_portfolio_update: {
    Component: BarbershopPortfolioPostModule,
    buildProps: ({ text, payload, media, actorSummary, prioritizeMedia }) => ({
      text,
      payload: payload ?? null,
      media,
      actorRoute: actorSummary?.route ?? null,
      prioritizeMedia,
    }),
  },
  barbershop_hours_update: {
    Component: BarbershopHoursPostModule,
    buildProps: ({ text, payload, actorSummary }) => ({
      text,
      payload: payload ?? null,
      actorRoute: actorSummary?.route ?? null,
    }),
  },
  locksmith_portfolio_update: {
    Component: LocksmithPortfolioPostModule,
    buildProps: ({ text, payload, media, actorSummary, prioritizeMedia }) => ({
      text,
      payload: payload ?? null,
      media,
      actorRoute: actorSummary?.route ?? null,
      prioritizeMedia,
    }),
  },
  locksmith_hours_update: {
    Component: LocksmithHoursPostModule,
    buildProps: ({ text, payload, actorSummary }) => ({
      text,
      payload: payload ?? null,
      actorRoute: actorSummary?.route ?? null,
    }),
  },
  locksmith_service_area_update: {
    Component: LocksmithServiceAreaPostModule,
    buildProps: ({ text, payload, actorSummary }) => ({
      text,
      payload: payload ?? null,
      actorRoute: actorSummary?.route ?? null,
    }),
  },
}
```

Then PostCard.view.jsx becomes:

```jsx
import { POST_MODULE_REGISTRY } from './postModules/registry'

// ... in render:
const moduleEntry = POST_MODULE_REGISTRY[postType]
if (moduleEntry) {
  const { Component, buildProps } = moduleEntry
  const moduleProps = buildProps({
    text: safePost.text,
    payload: safePost.payload ?? null,
    media: safePost.media,
    actorSummary,
    menuUrl,
    prioritizeMedia,
  })
  return <Component {...moduleProps} />
}
// fall through to default text+media render
```

### Recommendation: Option B

**Why:** The `buildProps` pattern co-locates prop knowledge inside the registry entry — each module
owns its own prop contract. When a new module is added, the developer edits only `registry.js`,
not `PostCard.view.jsx`. PostCard.view.jsx becomes stable — it does not grow with new vport types.

---

## PostCard.view.jsx after migration

```jsx
import { POST_MODULE_REGISTRY } from './postModules/registry'
// No individual module imports here

// ... same hooks and setup ...

const moduleEntry = POST_MODULE_REGISTRY[postType]

// JSX:
{moduleEntry ? (
  (() => {
    const { Component, buildProps } = moduleEntry
    return (
      <Component
        {...buildProps({
          text: safePost.text,
          payload: safePost.payload ?? null,
          media: safePost.media,
          actorSummary,
          menuUrl,
          prioritizeMedia,
        })}
      />
    )
  })()
) : (
  <>
    {/* default text + media render */}
  </>
)}
```

Or with a helper function:

```jsx
function renderPostModule(postType, context) {
  const entry = POST_MODULE_REGISTRY[postType]
  if (!entry) return null
  const { Component, buildProps } = entry
  return <Component {...buildProps(context)} />
}

// In JSX:
{renderPostModule(postType, {
  text: safePost.text,
  payload: safePost.payload ?? null,
  media: safePost.media,
  actorSummary,
  menuUrl,
  prioritizeMedia,
}) ?? (
  <>{/* default render */}</>
)}
```

---

## File Changes Required

### New files

| File | Purpose |
|---|---|
| `post/postcard/postModules/registry.js` | Registry map: post_type → { Component, buildProps } |

### Modified files

| File | Change |
|---|---|
| `post/postcard/ui/PostCard.view.jsx` | Replace 8 imports + 8 flags + if-else chain with registry dispatch |

### Unchanged files

| Scope | Files | Action |
|---|---|---|
| 8 modules | All 8 module dirs with their .jsx, .model.js, .css, index.js | No change |
| shared | `postModules/shared/` | No change |
| adapter | `post/postcard/adapters/PostCard.jsx` | No change |

---

## Adding a New Post Type (post-migration)

With the registry, adding a new vport post type (e.g. `nail_salon_portfolio_update`) requires:

1. Create `postModules/nailSalonPortfolio/` with standard 4-file structure
2. Add one entry to `postModules/registry.js`

Zero changes to `PostCard.view.jsx`.

---

## Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| PostCard.view.jsx regression | HIGH | PostCard.view.jsx is the highest-traffic render path. Test all 8 module types after the change. Run visual regression across feed, post detail, and profile screens. |
| Wrong props silently passed | MEDIUM | `buildProps` isolates each module's prop contract — catching wrong shapes is easier. Add a `displayName` to each registry entry for debug identification. |
| Module component import errors | LOW | If any module has a bug at import time, it now affects ALL posts (not just its type). Validate all 8 module index.js imports resolve before merging. |
| `menuUrl` computation stays in view | INFO | The `menuUrl` derived from `isMenuPost && actorRoute` must move into the `menu_update` buildProps or be passed as a context field. Pass `actorSummary` and compute inside buildProps. |

---

## Implementation Order (for future implementation ticket)

```
Step 1 — Read all 8 module index.js files to confirm exports match registry import names
Step 2 — Create postModules/registry.js with 8 entries (no PostCard.view.jsx changes yet)
Step 3 — Verify registry.js can be imported cleanly (no circular deps)
Step 4 — Update PostCard.view.jsx to use registry dispatch
Step 5 — Remove 8 individual imports and 8 boolean flags from PostCard.view.jsx
Step 6 — Cold launch; test all 8 module types render correctly
Step 7 — Test default (non-typed) posts still render text + media correctly
Step 8 — Run existing Vitest coverage for PostCard
```

---

## Validation Checklist (for implementation ticket)

- [ ] All 8 typed post modules render identically before and after
- [ ] Default (non-typed) posts still render text + media
- [ ] `FuelPricesPostModule` still receives `stationRoute` (not `actorRoute`)
- [ ] `ExchangeRatesPostModule` still receives `exchangeRoute` (not `actorRoute`)
- [ ] `MenuDropPostModule` still receives `menuUrl` (computed from `actorRoute + isMenuPost`)
- [ ] `grep -r "isFuelPost\|isExchangePost\|isMenuPost\|isBarbershopPortfolioPost" apps/VCSM/src/` → zero results after migration
- [ ] `PostCard.view.jsx` imports zero individual module files after migration

---

## Owner Approval Required Before Implementation

- [ ] Approve Option B (registry with `buildProps`) vs Option A (component-only registry + manual prop dispatch)
- [ ] Approve `renderPostModule()` helper function in PostCard.view.jsx vs inline IIFE
- [ ] Confirm this does NOT change any visible behavior — purely structural
