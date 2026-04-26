# Booking Engine Contract

## Public API
All public exports live in `src/adapters/index.js` and are re-exported from `index.js`.

## Dependency Direction
Apps → engines/booking → (injected supabaseClient, notifyFn)
engines/booking never imports from apps.

## Allowed DAL Operations
- vc schema: bookings, booking_resources, booking_availability_rules, booking_availability_exceptions, booking_resource_services, booking_service_profiles, actors, actor_owners
- vport schema: profiles, services (read-only via getVportClient())

## Status Transitions
pending → confirmed (owner confirms)
pending|confirmed → cancelled (owner or customer cancels)
confirmed → completed (owner marks done)
confirmed → no_show (owner marks no-show)
All transitions fire a notification via notifyFn.
