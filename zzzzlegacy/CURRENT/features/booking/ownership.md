# Booking — Ownership

**IRONMAN status:** Tracked  
**Feature owner:** VPORT engine team  
**Engine:** `engines/booking`

## DAL Ownership

- `engines/booking/src/` — booking engine owns all DAL
- No direct Supabase calls from app layer

## Actor Ownership Model

- Bookings scoped to `actorId` + `kind`
- Ownership verified through `actor_owners` table
- `assertActorCanManageResource` is the canonical ownership gate

## Cross-Feature Dependencies

- `engines/notifications` — notification dispatch
- `engines/hydration` — actor identity resolution
