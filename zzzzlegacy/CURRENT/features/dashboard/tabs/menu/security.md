# Tab: menu — Security

**Last Updated:** 2026-05-27
**VENOM Status:** NOT_STARTED

## Risk Profile: MEDIUM
QR-accessed public surface (no auth). vportPrintableFlyer flag (true). vportFlyerEditor flag (false — deployed but gated). Flyer content injection risk. Security hardening on related QR systems was done on vport-booking-feed-security-updates branch.

## Required
Run VENOM to verify trust boundaries, identity exposure, and write-path ownership enforcement.
