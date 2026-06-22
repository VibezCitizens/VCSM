# Tab: team — Security

**Last Updated:** 2026-05-27
**VENOM Status:** NOT_STARTED

## Risk Profile: HIGH
Barber team members are identity objects (actorId). Team membership affects booking routing — removed barber must not remain bookable. Team join/leave writes need ownership gate. Team join requests managed via BarberTeamRequestsScreen dashboard.

## Required
Run VENOM to verify trust boundaries, identity exposure, and write-path ownership enforcement.
