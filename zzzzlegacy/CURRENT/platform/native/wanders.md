# Module: Wanders

## PWA Source of Truth

**Routes:** `/wanders`, `/wanders/*`, `/wanders/c/:publicId`, `/wanders/i/:publicId`

**Screens/components:**
- `apps/VCSM/src/features/wanders/*`
- `apps/VCSM/src/app/routes/public/wanders.routes.jsx`

**Services/DAL:**
- `apps/VCSM/src/features/wanders/core/*`

**Supabase schema/tables/RPCs:**
- Wanders core tables/RPCs from PWA module
- vc actor ownership helpers

**RLS expectations:** Public claim/card routes must expose only public-safe card data; create/mailbox/reply routes must be authenticated and actor-scoped.

**Current PWA status:** Source of truth has large Wanders module with templates, create flow, mailbox/replies/outbox/sent, and public cards.

---

## Native Transfer Status

**Status:** `Risky`

---

## Transferred Native Files

- `VCSMNativeApp/Features/Wanders/*`
- `VCSMNativeCore/Sources/VCSMNativeCore/NativeFeatureGate.swift`
- `VCSMNativeCore/Sources/VCSMNativeCore/NativeAppRoute.swift`
- `VCSMNativeApp/App/AppNavigationView.swift`
- `VCSMNativeApp/Navigation/AppRouteParser.swift`

---

## Native Behavior Currently Present

- Native Wanders files and routes exist: home, create, claim, outbox/sent/card/public card route cases.
- Runtime access is guarded by `NativeFeatureGate`.

---

## Native Gaps

- `NativeFeatureGate.wandersEnabled` is `false` — users cannot access Wanders at runtime.
- Full parity needed for templates, create flow, mailbox, replies, business card intersections, and public claim screens.

---

## Risk Notes

- `NativeFeatureGate.swift:5` sets `wandersEnabled = false`.
- Do **not** flip the gate without testing all public/authenticated routes and RLS.
- Public claim/card routes must expose only public-safe data — verify before enabling.

---

## Pending Transfer Checklist

- [ ] Audit native Wanders model/DAL against current PWA Wanders core.
- [ ] Complete create/mailbox/reply/template behavior before enabling gate.
- [ ] Test public card/claim routes and authenticated owner views.
- [ ] Only enable `NativeFeatureGate.wandersEnabled` after full product and RLS parity pass.

---

## PWA → Native Transfer Log

- Date:
- Change type: Feature / Fix / Schema / UI / RLS
- PWA files changed:
- Routes affected:
- Screens/components changed:
- Services/DAL changed:
- Behavior change:
- Supabase schema/RPC change:
- RLS expectations changed:
- Affected native modules:
- Priority: P0 / P1 / P2
- Native status: Not started / Partial / Risky / Complete
- Testing notes:
- Notes:

---

## Transfer History

- Last synced date: 2026-05-03
- Native files updated: (none — tracker refresh only)
- Delta status: Risky — gate disabled; parity not verified
- Notes: Initial tracker from ROADTRIP.docx May 3 refresh

---

## Archived Notes

No archived notes yet.
