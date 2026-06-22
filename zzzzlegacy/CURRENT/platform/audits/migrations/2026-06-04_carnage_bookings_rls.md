# CARNAGE Audit — Booking RLS Policy Hardening

Date: 2026-06-04
Ticket: TICKET-BOOKING-RPC-001
Module: dashboard/bookings + dashboard/schedule
Migration: apps/VCSM/supabase/migrations/20260604030000_booking_rls_policy_hardening.sql

## Verdict

CARNAGE migration applied and live-verified using RLS policies and column-level privileges only.

No `SECURITY DEFINER` function or booking mutation RPC was introduced.

## User Constraint

The migration must not use `SECURITY DEFINER` functions or RPCs. The design is therefore direct table mutation guarded by RLS policies and grants.

## Live Evidence Reviewed

- `vport.bookings` RLS is enabled.
- `vport.resources` RLS is enabled.
- `authenticated` now has table-level `INSERT` and `SELECT` on `vport.bookings`; broad table-level `UPDATE` is no longer granted.
- `authenticated` has column-level `UPDATE` only for `status`, `cancelled_at`, `completed_at`, `customer_note`, `internal_note`, and `updated_at`.
- Booking policies now include narrowed direct mutation paths:
  - `bookings_insert_public_pending`
  - `bookings_insert_actor_owner`
  - `bookings_update_customer_cancel`
  - `bookings_update_actor_owner_status`
- Existing booking rows are structurally clean:
  - missing `profile_id`: 0
  - missing `resource_id`: 0
  - booking/resource profile mismatches: 0
  - bookings without resource: 0
  - resources without actor owner: 0

## Migration Design

The migration:

- drops broad booking mutation policies
- recreates narrow direct `INSERT` policies:
  - `bookings_insert_public_pending`
  - `bookings_insert_actor_owner`
- creates narrow direct `UPDATE` policies:
  - `bookings_update_customer_cancel`
  - `bookings_update_actor_owner_status`
- revokes broad table-level `UPDATE`
- grants column-level `UPDATE` only for:
  - `status`
  - `cancelled_at`
  - `completed_at`
  - `customer_note`
  - `internal_note`
  - `updated_at`
- keeps direct `INSERT` because insert policies are narrowed
- revokes `DELETE`
- updates the active exact-start unique index to include `hold`

## Important Limitation

PostgreSQL RLS can validate row visibility and proposed new row values. It does not natively express a full old-row to new-row state machine for all workflows.

Because all authenticated users share the same database role, column-level privileges cannot differ between customer-owned rows and owner-managed rows. For that reason this draft intentionally does **not** grant direct reschedule column updates (`resource_id`, `starts_at`, `ends_at`, `duration_minutes`). Direct reschedule remains blocked until a separate non-definer design is approved.

## Security Rules Enforced

- Public booking creates `pending/public` rows only.
- Public booking binds `customer_actor_id` and `created_by_actor_id` to `vc.current_actor_id()`.
- Public booking requires active resource/profile integrity.
- Owner booking creates only `confirmed/owner` or `hold/owner` rows.
- Owner booking requires `vc.actor_owners` ownership through `vport.resources.owner_actor_id`.
- Customer updates can only move future `pending/confirmed` bookings to `cancelled`.
- Owner updates can only move non-terminal bookings to `confirmed`, `completed`, `cancelled`, or `no_show`.
- Direct authenticated mutation cannot update resource/time/profile/customer/source columns.

## Live Verification Notes

The user-provided live SQL output verified:

- old broad update policies are absent
- direct authenticated table-level `UPDATE` is absent
- public inserts bind `customer_actor_id` and `created_by_actor_id` to `vc.current_actor_id()`
- owner inserts are limited to owner-created `confirmed` or `hold` rows
- customer updates are limited to future cancellation
- owner updates are limited to status lifecycle columns

Remaining DB/product questions:

- whether direct owner-created `hold` should remain allowed
- whether `owner_complete` and `owner_no_show` should require `starts_at <= now()`
- whether direct reschedule should be excluded, or redesigned with non-definer views/triggers
- whether active overlap protection requires a no-overlap exclusion constraint instead of exact-start unique index
- whether public booking must support unauthenticated guest booking; current policies preserve authenticated-only behavior

## Rollback

Rollback SQL is documented at the bottom of the migration file. Rollback requires recreating the previous direct mutation policies from the latest live policy output.

## Final Verdict

CARNAGE_BOOKING_RLS_POLICY_HARDENING_LIVE_VERIFIED
