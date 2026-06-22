---
title: Platform Module — Behavior
status: STUB
feature: app
module: platform
source: architect-derived
created: 2026-06-05
---

# app / modules / platform — BEHAVIOR

## Status

STUB. Behaviors seeded from ARCHITECT review.

## Confirmed Behaviors

### iOS Environment Detection (useIOSPlatform)
- Detects iOS device via user agent and/or navigator.platform
- Detects standalone (PWA installed) mode via window.navigator.standalone
- Exposes isIOS, isStandalone flags to consumers

### iOS Keyboard Inset Management (useIOSKeyboard)
- Listens for iOS keyboard show/hide events (visualViewport resize)
- Adjusts bottom padding / scroll position to prevent keyboard overlap
- Applied in RootLayout or consuming screens (UNVERIFIED)

### iOS Install Prompt (IosInstallPrompt)
- Renders install-to-home-screen prompt for iOS users not in standalone mode
- IosInstallSteps — step-by-step guide (tap Share > Add to Home Screen)
- Dismissable modal pattern

### iOS Debug HUD (IOSDebugHUD — dev only)
- Renders environment/device info overlay in development
- Must be gated behind dev-only flag — never renders in production

### iOS Prod Route Debugger (IOSProdRouteDebugger — SECURITY FLAG)
- Name suggests it may render in production builds
- UNVERIFIED: actual production gate status
- See SECURITY.md — PLATFORM-SEC-002

## TODO

- [ ] Confirm useIOSPlatform UA detection fallback for non-iOS devices
- [ ] Confirm IOSDebugHUD production gate (NODE_ENV === 'development' or release flag)
- [ ] Confirm IOSProdRouteDebugger production gate — critical security concern
- [ ] Confirm IosInstallPrompt dismissal persistence (sessionStorage? localStorage? per-session?)
