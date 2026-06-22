---
title: Platform Module — Architecture
status: STUB
feature: app
module: platform
source: architect-derived
created: 2026-06-05
---

# app / modules / platform — ARCHITECTURE

## Status

STUB. Layer stack seeded from ARCHITECT review.

## Layer Stack

```
RootLayout.jsx (shell module)
  ├── useIOSPlatform() → platform/ios/useIOSPlatform.js
  │     └── navigator.userAgent + navigator.standalone detection
  ├── useIOSKeyboard() → platform/ios/useIOSKeyboard.js
  │     └── visualViewport resize listener
  └── <IosInstallPrompt /> → platform/ios/components/IosInstallPrompt.jsx
        ├── <IosInstallSteps />
        └── <Modal />
```

## Debug Components (dev-only)

```
[dev] IOSDebugHUD.jsx → renders device/env overlay (confirm production gate)
[???] IOSProdRouteDebugger.jsx → renders route debug info (production gate UNCONFIRMED)
```

## Module Boundaries

| Boundary | Status |
|---|---|
| All iOS-specific logic isolated in platform/ios/ | CORRECT |
| No business logic | CORRECT |
| No DAL or write surfaces | CORRECT |
| ios.css scoped to iOS platform | CORRECT |
| ios.env.js iOS environment constants | CORRECT |

## TODO

- [ ] Confirm IOSProdRouteDebugger.jsx render condition — production gate or always rendered?
- [ ] Confirm IosInstallPrompt mount location — RootLayout or App.jsx?
- [ ] Confirm components/ full contents (IosInstallPrompt.jsx + IosInstallSteps.jsx + Modal.jsx?)
