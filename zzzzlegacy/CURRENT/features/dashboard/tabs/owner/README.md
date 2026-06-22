# Tab: owner

**Key:** `owner`
**Label:** Owner
**VPORT Types:** ALL (dynamically injected for isOwner)
**Landing Tab:** NO (always last)
**Last Updated:** 2026-05-27

## Purpose
Owner-only tab injected at runtime by VportProfileViewScreen. Provides owner-specific management shortcuts and stats from within the public profile context. NOT present in any static preset array.

## View Component
- Path: `features/profiles/kinds/vport/screens/owner/VportOwnerView.jsx`

## Presets
None — runtime injection only

## Risk Level: HIGH
Dynamically injected — if isOwner resolves incorrectly (race condition, acting-as confusion, stale cache), a non-owner could briefly see this tab. VportOwnerView content needs VENOM review. No test covering injection gate bypass.
