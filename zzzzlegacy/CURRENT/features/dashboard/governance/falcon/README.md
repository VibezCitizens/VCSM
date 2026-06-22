# Governance: FALCON — iOS Parity Governance

**Command:** `/Falcon`  
**Authority:** iOS parity governance — PWA → Native transfer and mobile parity verification  
**Mode:** Read-only audit + findings output  
**Scope in VPORT governance:** All modules with Mobile: YES in the governance matrix

---

## Responsibility

FALCON ensures that VPORT dashboard modules are fully parity-compliant between the PWA (web) experience and the iOS native target. It does not build the native app — it governs the transfer contract.

It covers:
- Mobile render parity — does the PWA render correctly on iOS Safari and target screen sizes?
- iOS stacking context compliance — no `position: fixed` modals inside `backdrop-filter`, `transform`, `filter`, or `overflow: hidden` with `border-radius` parents
- Touch target sizing — minimum 44px tap targets on all interactive elements
- Safe area inset compliance — does the module respect iOS safe area insets (notch, home bar)?
- Avatar rule compliance — no `rounded-full` avatars (iOS renders them identically, but naming consistency is required)
- Gesture conflict detection — does any swipe or scroll gesture conflict with iOS system gestures?
- PWA → Native transfer readiness — is the module's structure clean enough to lift into a native screen?

## Finding Severity Levels

| Level | Definition | Release Impact |
|---|---|---|
| CRITICAL | Module is unusable on iOS (stacking context, broken touch) | Blocks mobile release |
| HIGH | Layout breaks on a specific iOS screen size or orientation | Blocks mobile release |
| MEDIUM | Touch target too small, minor render difference | Address before THOR |
| LOW | Cosmetic parity gap, future native optimization | Track, non-blocking |

## Output Location

`zNOTFORPRODUCTION/_ACTIVE/audits/mobile/YYYY-MM-DD_falcon_[module].md`

## When to Run

Before THOR on any module marked `Mobile: YES`. After any layout change to a screen that renders on mobile.

## Module Coverage

See `../vport-dashboard-governance-matrix.md` — FALCON is required for all modules where `Mobile = YES`.
