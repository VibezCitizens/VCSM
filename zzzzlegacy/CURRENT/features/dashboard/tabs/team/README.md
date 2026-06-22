# Tab: team

**Key:** `team`
**Label:** Team
**VPORT Types:** barbershop (only)
**Landing Tab:** NO (pos 3 in VPORT_BARBERSHOP_TABS)
**Last Updated:** 2026-05-27

## Purpose
Displays the barbershop team member list. Each team member is a barber actor with their own profile. Team membership gates barbershop booking routing — visitors pick a barber before selecting a time slot.

## View Component
- Path: `features/profiles/kinds/vport/screens/barbershop/VportBarberShopTeamView.jsx`

## Presets
VPORT_BARBERSHOP_TABS (pos 3)

## Risk Level: HIGH
Barber team members are identity objects (actorId). Team membership affects booking routing — removed barber must not remain bookable. Team join/leave writes need ownership gate. Team join requests managed via BarberTeamRequestsScreen dashboard.
