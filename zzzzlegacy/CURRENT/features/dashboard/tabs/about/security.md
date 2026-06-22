# Tab: about — Security

**Last Updated:** 2026-05-27
**VENOM Status:** NOT_STARTED

## Risk Profile: LOW

The About tab is read-only and displays owner-provided public contact/location data. No write paths, no identity inference beyond what the owner has explicitly made public.

## Expected Exposure

| Field | Type | Risk |
|---|---|---|
| Business name | Public (owner-set) | None |
| Address | Public (owner-set) | None |
| Phone | Public (owner-set) | None |
| Email | Public (owner-set) | None |
| Hours | Public (owner-set) | None |
| actorId | Public (canonical VPORT identity) | None |

## Explicit Exclusions Expected

The About view should NOT expose:
- profileId
- vportId
- owner's userId
- internal system fields

VENOM should verify these are absent from the rendered view data and API response.
