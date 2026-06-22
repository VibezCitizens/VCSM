---
name: ticket-booking-rpc-001
description: TICKET-BOOKING-RPC-001 — Replace broad booking INSERT/UPDATE with typed state-machine RPCs or stricter WITH CHECK constraints
metadata:
  type: project
---

**TICKET-BOOKING-RPC-001** — Booking state-machine hardening

**Why:** bookings_insert_actor_owner (live DB confirmed) does not restrict customer_actor_id — owner can stamp any actor UUID into a booking row. bookings_update_* policies allow unrestricted column mutation (V-CODE-01, V-CODE-02 from VENOM 2026-05-27). The media_assets soft-delete policy is the established precedent for column-level WITH CHECK restrictions on this platform.

**Goal:** Replace broad INSERT/UPDATE surfaces with typed RPCs or tight WITH CHECK guards:
- owner_create_booking — validate customer identity, allowed source values
- customer_cancel_booking — only sets status='cancelled', cancelled_at
- owner_confirm_booking — only sets status='confirmed'
- owner_decline_booking
- owner_mark_noshow_booking
- owner_complete_booking
- owner_reschedule_booking — validates slot collision, notifies customer

**Precedent:** platform.media_assets `actor owner can soft delete media asset` — WITH CHECK restricts to `status = 'deleted' AND deleted_by_actor_id IS NOT NULL`.

**How to apply:** When working on booking write paths, refer to this ticket before adding any new booking UPDATE or INSERT DAL.

[[ticket-platform-rls-001]]
