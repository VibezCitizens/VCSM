---
title: Types Module — Behavior
status: STUB
feature: notifications
module: types
source: venom+bw-derived
created: 2026-06-05
---

# notifications / modules / types — BEHAVIOR

## Status

STUB.

## Expected Behaviors (UNVERIFIED)

- NotificationItem.view renders correct type component based on notification.type discriminator
- Each type component renders sender name, action description, and deep-link navigation
- NotiViewPostScreen navigates to the linked post from a notification tap
- MyAppointmentsView renders upcoming booking notifications (useMyAppointments hook)
- Sender display name falls back to payload-embedded context fields when hydration fails

## TODO

- [ ] Confirm notification.type discriminator values used to select type component
- [ ] Confirm deep-link format for each notification type
- [ ] Confirm appointments view is driven by notification type or separate bookings query
