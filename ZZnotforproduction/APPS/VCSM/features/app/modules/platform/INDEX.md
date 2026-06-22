---
title: Platform Module — Index
status: STUB
feature: app
module: platform
source: architect-derived
created: 2026-06-05
source-path: apps/VCSM/src/app/platform/
scanner-version: 1.1.0
---

# app / modules / platform

iOS-specific platform layer. Handles iOS environment detection, keyboard insets, install prompt, and iOS debug tooling. Self-contained — platform-specific code isolated here, not spread across features.

## Module Summary

| Field | Value |
|---|---|
| Module | platform |
| Feature | app |
| Source Path | apps/VCSM/src/app/platform/ios/ |
| Screens | 0 |
| Routes | 0 |
| Write Surfaces | None |
| Hooks | 2 (useIOSPlatform.js, useIOSKeyboard.js) |
| Components | 3+ (IOSDebugHUD.jsx, IOSProdRouteDebugger.jsx, IosInstallPrompt.jsx + sub-components) |
| Styles | 1 (ios.css) |
| Config | 1 (ios.env.js) |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| platform/ios/useIOSPlatform.js | Hook | iOS environment detection (UA, standalone mode, device class) |
| platform/ios/useIOSKeyboard.js | Hook | iOS keyboard inset management |
| platform/ios/IOSDebugHUD.jsx | Dev component | iOS debug overlay (dev-only) |
| platform/ios/IOSProdRouteDebugger.jsx | Dev component | Route debugger for iOS prod diagnostics |
| platform/ios/components/ | Components | IosInstallPrompt.jsx + IosInstallSteps + Modal |
| platform/ios/ios.css | Styles | iOS-specific CSS overrides |
| platform/ios/ios.env.js | Config | iOS environment constants |
| platform/index.js | Barrel | Platform barrel |
| platform/ios/index.js | Barrel | iOS barrel |

## Security Flags

- MEDIUM: IOSProdRouteDebugger.jsx — "Prod" in name suggests this may render in production builds; if enabled, exposes route internals to users
- LOW: IOSDebugHUD.jsx — confirm dev-only gate (NODE_ENV check or release flag); never render in production
- INFO: useIOSPlatform.js UA detection — user agent sniffing is unreliable; confirm fallback behavior for unexpected UA strings

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm IOSProdRouteDebugger.jsx — is it rendered in production? Under what conditions?
- [ ] Confirm IOSDebugHUD.jsx production gate (releaseFlags? NODE_ENV?)
- [ ] Confirm components/ contents — IosInstallPrompt + IosInstallSteps + Modal?
- [ ] Confirm ios.env.js constants (STANDALONE_MODE_KEY? or other flags?)
