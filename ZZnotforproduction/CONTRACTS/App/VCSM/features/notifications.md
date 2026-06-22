# Feature Contract: notifications

**Status:** CLEAN (adapter-side); CSS-LEAK (tracked in BIDIR)  
**Risk:** LOW  
**Files:** 43 (scanner 2026-06-05)  
**Inbound imports:** 32  
**Outbound imports:** 10  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`notifications` owns the notification system:
- Notification inbox (list of all notifications)
- Notification type rendering (follow request, booking, comment, reaction, rose, review)
- Realtime notification subscription (runtime)
- Notification dispatch (the `publishVcsmNotification` function consumed by all event-firing features)

`notifications` is a **highly-consumed infrastructure feature** (32 inbound imports). Its dispatch adapter is the primary publish surface for all VCSM notification events.

---

## 2. Non-Goals

`notifications` must not own:
- Push notification delivery configuration — that is infrastructure
- Email notification — that is external service integration
- The business logic of events that trigger notifications — that belongs to each triggering feature's controller
- Notification preferences — that is `settings/`

---

## 3. Public API / Adapter Boundary

**Known adapters (confirmed by scanner):**
- `notifications/adapters/notifications.adapter` — primary publish surface; confirmed consumed by:
  - `booking/` (3 controllers + setup.js)
  - `social/` (2 controllers)
  - `post/` (4 controllers)
  - `profiles/` (VportReviews.controller)
- `notifications/runtime/index.js` — TODO: confirm if this is the realtime subscription entry point or the `@media` alias artifact (ARCH-BIDIR-VERIFY-001)

**Notification type adapters (consumed by inbox):**
- `notifications/inbox/hooks/useNotificationInbox.js` — imports `social/adapters/social.adapter` (CLEAN)
- `notifications/types/follow/FollowRequestItem.view.jsx` — imports `social/adapters/friend/request/hooks/useFollowRequestActions.adapter` (CLEAN)

**Screen adapter:**
- `notifications/screen/hooks/useMyAppointments.js` — imports `booking/adapters/booking.adapter` (CLEAN)

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| adapters | `notifications/adapters/notifications.adapter` | Primary publish surface — consumed by 32 import sites |
| hooks | `notifications/hooks/` | Inbox hooks |
| inbox | `notifications/inbox/` | Inbox listing subsystem |
| screen | `notifications/screen/` | TODO: `screen/` vs `screens/` naming (ARCH-NAMING-001) |
| types | `notifications/types/` | Per-type notification items (follow, booking, comment, etc.) |
| runtime | `notifications/runtime/` | Realtime subscription |
| dal | `notifications/dal/` | Notification data access |
| model | `notifications/model/` | Notification shapes |
| setup | `notifications/setup.js` | Engine DI wiring — targeted for migration |

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `booking` | Notifications inbox shows appointments — BIDIR SAFE (Pair 4) | YES — `useMyAppointments.js` → `booking/adapters/booking.adapter` |
| `social` | Follow request items have action buttons — BIDIR SAFE (Pair 12) | YES — `useNotificationInbox.js` → `social/adapters/social.adapter`; `FollowRequestItem.view.jsx` → `social/adapters/friend/request/hooks/useFollowRequestActions.adapter` |
| `post` | Notification screen navigates to post detail — BIDIR SAFE (Pair 10) | YES — `NotiViewPostScreen.jsx` → `post/adapters/screens/PostDetail.view.adapter` |
| `identity` | Active actor for notification targeting | Confirmed by outbound count |
| `profiles` | TODO: confirm if notifications screen navigates to profiles | Possibly |

---

## 6. Prohibited Dependencies

`notifications` must not import from:
- `profiles/` CSS files — CSS-LEAK tracked in BIDIR Pair 11 (fix: ARCH-BIDIR-CSS-001)
- `dashboard/` — management surface
- `settings/` — configuration surface
- `feed/` — content surface
- Any feature's `dal/` or `controller/` directly (except through adapters as shown above)

---

## 7. DAL / Controller Rules

**DAL rules:**
- May query `vc.notifications` or equivalent table
- Must use explicit column projections
- Must not apply business rules in DAL — notification creation decisions belong to the dispatching feature's controller

**`publishVcsmNotification` (in `notifications/adapters/notifications.adapter`):**
- This is the cross-feature notification dispatch function
- It must accept a typed notification payload
- It must not decide what to notify — the calling controller decides, this function executes
- Design follows: Controller (feature) → `publishVcsmNotification` (notifications adapter) → notifications DAL/runtime

---

## 8. Known Coupling

**0 scanner violations for notifications itself.**

**CSS violation (tracked in BIDIR Pair 11):**
- `notifications/screen/views/NotificationsScreenView.jsx` → `profiles/styles/profiles-modern.css` (CSS-LEAK)
- Fix: ARCH-BIDIR-CSS-001 — `profiles-modern.css` moves to `shared/styles/`

**Scanner artifact (Pair 11):**
- `useMenuItemPhotoUpload.js` in profiles resolves via `@media` alias to `notifications/runtime/index.js` — suspected false positive
- ARCH-BIDIR-VERIFY-001: verify `@media` alias in vite config

**Bidirectional pairs — all LEGITIMATE:**
- `notifications` ↔ `booking` — Pair 4
- `notifications` ↔ `post` — Pair 10
- `notifications` ↔ `social` — Pair 12
- `notifications` ↔ `profiles` — Pair 11 (CSS-LEAK only; profiles→notifications is clean)

---

## 9. Risk Notes

**LOW.** Zero adapter-level violations. The notifications adapter is one of the most-consumed surfaces (32 inbound). It is critical infrastructure — any change to `publishVcsmNotification`'s signature or behavior cascades to all event-firing features.

The CSS leak is low risk (styling only) and resolves via ARCH-BIDIR-CSS-001.

---

## 10. Migration Notes

**ARCH-ENGINESETUP-001:** Migrate `notifications/setup.js` to `app/setup/notifications.setup.js`.

**ARCH-BIDIR-CSS-001:** Fix 1 CSS import in `NotificationsScreenView.jsx`.

**ARCH-BIDIR-VERIFY-001:** Verify `@media` alias to determine if `notifications/runtime/index.js` is genuinely imported or a scanner artifact.

---

## 11. Unknowns

- TODO: Confirm complete adapter surface (`notifications.adapter` — what functions beyond `publishVcsmNotification`?)
- TODO: Identify remaining outbound imports (10 total — 3 confirmed + 7 unknown)
- TODO: Confirm whether `notifications/runtime/` is a realtime subscription layer or the `@media` artifact target
- TODO: Confirm `notifications/screen/` naming (`screen/` vs `screens/` — ARCH-NAMING-001)
