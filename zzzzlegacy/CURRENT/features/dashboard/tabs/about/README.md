# Tab: about

**Key:** `about`
**Label:** About
**VPORT Types:** ALL — present in every preset
**Landing Tab:** YES in `VPORT_TABS` (global fallback)
**Last Updated:** 2026-05-27

## Purpose

Displays the VPORT business's location, hours, contact information, and contextual metadata. This is the universal identity anchor tab — every VPORT type has it.

## View Component

- `VportAboutView`
- Path: `features/profiles/kinds/vport/screens/views/tabs/VportAboutView.jsx`
- Content: hours schedule (per-day), address with map link, phone, email, website, languages, accepted currencies (exchange), branch locations (future), license/regulatory info (exchange)

## Management Surface

Managed via VPORT Settings screen: `/actor/:actorId/settings`
Part of the general profile editing flow — not a dedicated dashboard screen.

## Key Notes

- PII-adjacent: displays phone, email, address — all owner-provided and intentionally public
- About content is set during VPORT profile setup and edited via settings
- No owner-writes on the About tab itself (read-only display; writes go through settings)
